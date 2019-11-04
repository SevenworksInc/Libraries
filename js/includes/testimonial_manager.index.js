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
		$('div#testimonialDate').html(dateString);
		$('div#testimonialName').html(data.name);
		$('div#testimonialMessage').html(data.message);
		$('div#testimonialEmail').html(data.email);
		$('div#testimonialPhone').html(data.phone);
		$('input#inputName').val(data.name);
		$('input#inputEmail').val(data.email);
		if ($('input#inputSubject').val() != '') $('input#inputSubject').val('');
		if ($('textarea#inputMessage').val() != '') $('textarea#inputMessage').val('');
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
	var details = new Array();
	details[0] = "genericForm"; //active form id
	details[1] = thisURL + thisModule + "/process/add-module/"; //this won't be used
	details[2] = 'Module was successfully created.'; //this won't be used
	details[3] = thisURL + thisModule + "/process/reply/"; //post url for replying to testimonial item
	details[4] = 'Reply was successfully sent.'; //success message for edit
	details[5] = thisURL + thisModule + "/process/delete-item/"; //post url for delete
	details[6] = 'Item was successfully deleted.'; //success message for delete
	details[7] = 'id_testimonial'; //name of id for delete
	details[8] = 'DT_Generic'; //active dataTable id
	CMS.common(details); //include the active data table (for delete function)
	CMS.showHideFields();
}

function changeStatus() {
	if (enableModule) enableModule = 1;
	else enableModule = 0;
	var keyAndVal = "data%5Bwhr_id_testimonial%5D=" + itemID + "&data%5Bclmn_status%5D=" + enableModule;
	$.post(thisURL + thisModule + "/process/change-status", keyAndVal, function(data) {
		setTimeout(function() {
			$('img#sgLoader').addClass('hid');
			$('#globalModal .hideWhile').each(function() {
				$(this).show();
			});
			$('#globalModal').fadeOut(1000);
			$('#globalModal').modal('hide');
		}, 1000);
		setTimeout(function() {
			if (data != 'false') {
				var dataJ = $.parseJSON(data);
				var text = $('div#jd' + itemID).text();
				if (dataJ.error != null) {
					CMS.showNotification('error', dataJ.error);
				} else {
					var $dataA = $('a#stat' + itemID);
					if (enableModule == 1) {
						CMS.showNotification('success', 'Testimonial is successfully Enabled');
						$('a#stat' + itemID).html('<span class="label label-success"> Active </span>');
						$('a#stat' + itemID).attr('title', 'Disable item status');
						$dataA.data('data-getDetails', 'disableFxn');
						$dataA.attr('data-getDetails', 'disableFxn');
						text = text.replace('"status":"0"', '"status":"1"');
						$('div#jd' + itemID).text(text);
					} else {
						CMS.showNotification('success', 'Testimonial is successfully Disabled');
						$('a#stat' + itemID).html('<span class="label label-danger">InActive</span>');
						$('a#stat' + itemID).attr('title', 'Enable item status');
						$dataA.data('data-getDetails', 'enableFxn');
						$dataA.attr('data-getDetails', 'enableFxn');
						text = text.replace('"status":"1"', '"status":"0"');
						$('div#jd' + itemID).text(text);
					}
				}
			} else {
				CMS.showNotification('error', 'Network Problem. Please try again.');
			}
		}, 1200);
	});
}

function disableMod() {
	enableModule = false;
	changeStatus();
}

function enableMod() {
	enableModule = true;
	changeStatus();
}

function showActions() {
	var vals = $('.selected-items:checkbox:checked').map(function() {
		return this.value;
	}).get();
	if (vals != '') {
		$('#multiActions').removeAttr("style");
	} else {
		$('#multiActions').attr('style', 'display:none');
	}
}
$("#ckbCheckAll").click(function() {
	$(".selected-items").prop('checked', $(this).prop('checked'));
	showActions();
});
$('.selected-items').change(function() {
	showActions();
});
$("#dtDeleteRows").on(ace.click_event, function() {
	bootbox.confirm("Are you sure to update this item/s?", function(result) {
		if (result) {
			var vals = $('.selected-items:checkbox:checked').map(function() {
				return this.value;
			}).get();
			var multiple_id = vals.join(",");
			var action_type = $('#selectedAction').val();
			$.post(thisURL + thisModule + "/process/multiple-item-action", {
				multiple_id: multiple_id,
				action_type: action_type
			}, function(data) {
				if (data != 'false') {
					var dataJ = $.parseJSON(data);
					var text = $('div#jd' + itemID).text();
					if (dataJ.error != null) {
						CMS.showNotification('error', dataJ.error);
					} else {
						CMS.showNotification('success', 'Testimonial item/s was successfully updated.');
						CMS.forcedRefresh();
					}
				} else {
					CMS.showNotification('error', 'Network Problem. Please try again.');
				}
			});
		}
	});
});