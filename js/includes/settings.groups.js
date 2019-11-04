CMS.initPageUnbind = function() {
	CMS.commonUnbind();
}
CMS.initPage = function() {
	$('a.setFormValues').on('click', function() {
		itemID = $(this).closest("td").attr('id');
		itemID = itemID.replace("jdata", "")
		var json = $('div#jd' + itemID).html();
		var data = $.parseJSON(json);
		$('input#id_admin_group').val(data.id_admin_group);
		$('div#widgetItemActions button.showGlobal').attr('data-modID', "jdata" + data.id_admin_group);
		$('input#group_name').val(data.group_name);
		$('textarea#group_description').val(data.group_description);
		$('input#date_add').val(data.date_add);
		$('input#date_upd').val(data.date_upd);
		if (!$('button#dtAddRow').is(":visible")) {
			$('button#dtAddRow').removeClass('hid');
		}
		if (!$(this).hasClass('editItem')) {
			$('div#formActions').addClass('hid');
		}
		CMS.showWidge();
	});
	var details = new Array();
	details[0] = "genericForm"; //active form id
	details[1] = thisURL + thisModule + "/process/add-group/"; //post url for add
	details[2] = 'Module was successfully created.'; //success message for add
	details[3] = thisURL + thisModule + "/process/edit-group/"; //post url for edit
	details[4] = 'Module was successfully updated.'; //success message for edit
	details[5] = thisURL + thisModule + "/process/delete-group/"; //post url for delete
	details[6] = 'Module was successfully deleted.'; //success message for delete
	details[7] = 'id_admin_group'; //name of id for delete
	details[8] = 'DT_Generic'; //active dataTable id
	CMS.common(details); //include the active data table (for delete function)
}