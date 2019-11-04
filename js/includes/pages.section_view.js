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