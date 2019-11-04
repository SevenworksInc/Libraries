CMS.initPageUnbind = function() {
	CMS.commonUnbind();
}
CMS.initPage = function() {
	$('a.setFormValues').on('click', function() {
		itemID = $(this).closest("td").attr('id');
		itemID = itemID.replace("jdata", "")
		var json = $('div#jd' + itemID).html();
		var data = $.parseJSON(json);
		$('input#id_subscriber').val(data.id_subscriber);
		$('input#email').val(data.email);
		$('input#date_add').val(data.date_add);
		if (data.status == 1) {
			$('input#isActive').prop('checked', true);
		} else {
			$('input#isActive').prop('checked', false);
		}
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
	details[1] = thisURL + "administrator/noprocess"; //post url for add
	details[2] = 'This was supposed to be false.'; //success message for add
	details[3] = thisURL + "administrator/noprocess"; //post url for edit
	details[4] = 'This was supposed to be false.'; //success message for edit
	details[5] = thisURL + thisModule + "/process/delete-subscriber/"; //post url for delete
	details[6] = 'Subscriber was successfully deleted.'; //success message for delete
	details[7] = 'id_subscriber'; //name of id for delete
	details[8] = 'DT_Generic'; //active dataTable id
	CMS.common(details); //include the active data table (for delete function)
}