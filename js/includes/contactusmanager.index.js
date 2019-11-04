CMS.initPageUnbind = function() {
	CMS.commonUnbind();
	CMS.showHideFieldsU();
	$('.showDeleteBtn').unbind();
	$('.hideDeleteBtn').unbind();
	$('.btnReply').unbind();
}
CMS.initPage = function() {
	$('a.setFormValues').on('click', function() {
		itemID = $(this).closest("td").attr('id');
		itemID = itemID.replace("jdata", "")
		var json = $('div#jd' + itemID).html();
		var data = $.parseJSON(json);
		var dateString = data.date_add;
		var reggie = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/;
		var dateArray = reggie.exec(dateString);
		var dateObject = new Date(
			(+dateArray[1]), (+dateArray[2]) - 1, // Careful, month starts at 0!
			(+dateArray[3]), (+dateArray[4]), (+dateArray[5]), (+dateArray[6]));
		dateString = dateObject.toLocaleDateString() + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + dateObject.toLocaleTimeString();
		$('div#contactDate').html(dateString);
		$('div#contactName').html(data.name);
		$('div#contactMessage').html(data.message);
		$('div#contactEmail').html(data.email);
		$('div#contactPhone').html(data.phone);
		$('input#inputName').val(data.name);
		$('input#inputEmail').val(data.email);
		if ($('input#inputSubject').val() != '') {
			$('input#inputSubject').val('');
		}
		if ($('textarea#inputMessage').val() != '') {
			$('textarea#inputMessage').val('');
		}
		if (!$(this).hasClass('editItem')) {
			$('div#formActions').addClass('hid');
		}
		CMS.showWidge();
	});
	$('.showDeleteBtn').on('click', function() {
		if (!$('button#btnDelete').is(":visible")) {
			$('button#btnDelete').removeClass('hid');
		}
	});
	$('.hideDeleteBtn').on('click', function() {
		if ($('button#btnDelete').is(":visible")) {
			$('button#btnDelete').addClass('hid');
		}
	});
	$('.btnReply').on('click', function() {
		$('div.divNotEdit').hide();
		$('div.divEdit').show();
	});
	var details = new Array();
	details[0] = "genericForm"; //active form id
	details[1] = thisURL + thisModule + "/process/add-module/"; //this won't be used
	details[2] = 'Module was successfully created.'; //this won't be used
	details[3] = thisURL + thisModule + "/process/reply/"; //post url for replying to contact message
	details[4] = 'Reply was successfully sent.'; //success message for edit
	details[5] = thisURL + thisModule + "/process/delete-message/"; //post url for delete
	details[6] = 'Message was successfully deleted.'; //success message for delete
	details[7] = 'id_contact_us'; //name of id for delete
	details[8] = 'DT_Generic'; //active dataTable id
	CMS.common(details); //include the active data table (for delete function)
	CMS.showHideFields();
}