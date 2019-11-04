CMS.initPageUnbind = function() {
	CMS.commonUnbind();
	$('button.addReset').unbind();
	$('a#changePass').unbind();
}
CMS.initPage = function() {
	$('a.setFormValues').on('click', function() {
		$('input#password').attr('disabled', 'disabled');
		if (!$('button#dtAddRow').is(":visible")) {
			$('button#dtAddRow').removeClass('hid');
		}
		if (!$('a#changePass').is(":visible")) {
			$('a#changePass').removeClass('hid');
		}
		itemID = $(this).closest("td").attr('id');
		itemID = itemID.replace("jdata", "")
		var json = $('div#jd' + itemID).html();
		var data = $.parseJSON(json);
		$('div#widgetItemActions button.showGlobal').attr('data-modID', "jdata" + data.id_admin);
		$('input#id_admin').val(data.id_admin);
		$('input#firstname').val(data.firstname);
		$('input#lastname').val(data.lastname);
		$('input#username').val(data.username);
		console.log(data.id_admin_group);
		$('select#id_admin_group').val(data.id_admin_group);
		if (data.isActive == 1) {
			$('input#isActive').prop('checked', true);
		} else {
			$('input#isActive').prop('checked', false);
		}
		$('input#date_add').val(data.date_add);
		$('input#date_upd').val(data.date_upd);
		if (!$(this).hasClass('editItem')) {
			$('div#formActions').addClass('hid');
		}
		CMS.showWidge();
	});
	$("#id_admin_group").chosen();
	$("#id_admin_group_chosen").removeAttr('style');
	$('.chosen-single').addClass('ignore');
	$('a#changePass').on('click', function() { //additional functions for form reset
		$('input#password').removeAttr('disabled');
		$(this).hide();
	});
	$('button#dtAddRow').on('click', function() { //additional functions for form reset
		$('a#changePass').addClass('hid');
		$('input#password').removeAttr('disabled');
	});
	var details = new Array();
	details[0] = "genericForm"; //active form id
	details[1] = thisURL + thisModule + "/process/add-user/"; //post url for add
	details[2] = 'User was successfully created.'; //success message for add
	details[3] = thisURL + thisModule + "/process/edit-user/"; //post url for edit
	details[4] = 'User was successfully updated.'; //success message for edit
	details[5] = thisURL + thisModule + "/process/delete-user/"; //post url for delete
	details[6] = 'User was successfully deleted.'; //success message for delete
	details[7] = 'id_admin'; //name of id for delete
	details[8] = 'DT_Generic'; //active dataTable id
	CMS.common(details); //include the active data table (for delete function)
}

function changeStatus() {
	if (enableModule) enableModule = 1;
	else enableModule = 0;
	var keyAndVal = "data%5Bwhr_id_admin%5D=" + itemID + "&data%5Bclmn_isActive%5D=" + enableModule;
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
						CMS.showNotification('success', 'Admin is successfully Enabled');
						$('a#stat' + itemID).html('<span class="label label-success"> Active </span>');
						$('a#stat' + itemID).attr('title', 'Disable item status');
						$dataA.data('data-getDetails', 'disableFxn');
						$dataA.attr('data-getDetails', 'disableFxn');
						text = text.replace('"isActive":"0"', '"isActive":"1"');
						$('div#jd' + itemID).text(text);
					} else {
						CMS.showNotification('success', 'Admin is successfully Disabled');
						$('a#stat' + itemID).html('<span class="label label-danger">InActive</span>');
						$('a#stat' + itemID).attr('title', 'Enable item status');
						$dataA.data('data-getDetails', 'enableFxn');
						$dataA.attr('data-getDetails', 'enableFxn');
						text = text.replace('"isActive":"1"', '"isActive":"0"');
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