CMS.initPageUnbind = function() {
	$('#id_bc').unbind();
	$('#dl-menu ul li').unbind();
	CMS.commonUnbind();
}
CMS.initPage = function() {
	var bc_name = $('input#bc_name').val();
	var id_bc_name = 'id_bc_' + bc_name;
	$('a.setFormValues').on('click', function() {
		itemID = $(this).closest("td").attr('id');
		itemID = itemID.replace("jdata", "")
		var json = $('div#jd' + itemID).html();
		var data = $.parseJSON(json);
		$('input#id_bc_' + bc_name).val(data[id_bc_name]);
		$('input#inputBcName').val(data.name);
		$('input#inputBcHtmlId').val(data.html_id);
		$('input#inputBcParent').val(data.parent_id);
		$('input#inputBcModule').val(data.module);
		$('input#inputBcMethod').val(data.method);
		if (!$('button#dtAddRow').is(":visible")) {
			$('button#dtAddRow').removeClass('hid');
		}
		if (!$(this).hasClass('editItem')) {
			$('div#formActions').addClass('hid');
		}
		CMS.showWidge();
	});
	$('#dl-menu').dlmenu({
		animationClasses: {
			classin: 'dl-animate-in-3',
			classout: 'dl-animate-out-3'
		}
	});
	$('#dl-menu ul li').on('click', function() {
		if (!$(this).hasClass('dl-back')) {
			$('#inputBcParent').val($(this).attr('data-parentID'));
			$('#bcParentName').val($(this).attr('data-bcName'));
		}
	});
	var details = new Array();
	details[0] = "genericForm"; //active form id
	details[1] = thisURL + thisModule + "/process/add-breadcrumb/"; //post url for add
	details[2] = 'Breadcrumb was successfully created.'; //success message for add
	details[3] = thisURL + thisModule + "/process/edit-breadcrumb/"; //post url for edit
	details[4] = 'Breadcrumb was successfully updated.'; //success message for edit
	details[5] = thisURL + thisModule + "/process/delete-breadcrumb/"; //post url for delete
	details[6] = 'Breadcrumb was successfully deleted.'; //success message for delete
	details[7] = 'data[id_bc_' + $('input#bc_name').val() + ']'; //name of id for delete
	details[8] = 'DT_Generic'; //active dataTable id
	details[9] = true; //active dataTable id
	CMS.common(details); //include the active data table (for delete function)
}