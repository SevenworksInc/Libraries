CMS.initPageUnbind = function() {
	$('#id_admin_group').unbind();
	$('button#globalYes').unbind();
}
CMS.initPage = function() {
	var enableModule = true;
	$('#id_admin_group option').each(function() {
		if ($(this).val() == '1') {
			$(this).attr('selected', 'selected');
		}
	});
	var details = new Array();
	var dtElement = $('#DT_Generic').dataTable({
		"iDisplayLength": 50,
		"aLengthMenu": [
			[50, 100, -1],
			[50, 100, "All"]
		],
		"aaSorting": []
	});
	$('#DT_Generic').wrap('<div class="table-responsive"></div>');
	$('#DT_Generic').show();
	$('#DT_Generic tfoot th').each(function() {
		var title = $('#DT_Generic thead th').eq($(this).index()).text();
		if (title != '') $(this).html('<input type="text" placeholder="Search ' + title + '" />');
		else $(this).html('');
	});
	var table = $('#DT_Generic').DataTable();
	CMS.common(details); //include the active data table (for delete function)
	$("#id_admin_group").chosen();
	$("#id_admin_group_chosen").removeAttr('style'); //Script somewhere sets div width to zero. This will fix the issue.
	$('button#globalYes').on('click', function() {
		var fxnName = $(this).attr('data-yesFxn');
		eval(fxnName);
	});
	$('.chosen-single').addClass('ignore');
	$('#id_admin_group').on('change', function() {
		var id_admin_group = 'id_admin_group=' + $(this).val();
		$.post(thisURL + thisModule + "/permissions/", id_admin_group, function(data) {
			if (data != 'false') {
				var return_data = $.parseJSON(data);
				$.each(return_data, function(key, value) {
					if (value.isActive == '1') {
						$('.statActive' + value.id_module).removeAttr('style');
						$('.statInactive' + value.id_module).attr('style', 'display:none;');
					} else {
						$('.statActive' + value.id_module).attr('style', 'display:none;');
						$('.statInactive' + value.id_module).removeAttr('style');
					}
					$('.anchActive' + value.id_module).attr('id', 'stat' + value.id_admin_permission);
					$('.anchInctive' + value.id_module).attr('id', 'stat' + value.id_admin_permission);
					$('.anchActive' + value.id_module).attr('data-modID', 'jdata' + value.id_admin_permission);
					$('.anchInctive' + value.id_module).attr('data-modID', 'jdata' + value.id_admin_permission);
					$('.statActive' + value.id_module).attr('id', 'permActive' + value.id_admin_permission);
					$('.statInactive' + value.id_module).attr('id', 'permInactive' + value.id_admin_permission);
				});
			} else {
				CMS.showNotification('error', 'Network Problem. Please refresh the page and try again.');
			}
		});
	});
}

function changeStatus() {
	if (enableModule) enableModule = 1;
	else enableModule = 0;
	var keyAndVal = "data%5Bwhr_id_admin_permission%5D=" + itemID + "&data%5Bclmn_isActive%5D=" + enableModule;
	$('#globalModal .hideWhile').each(function() {
		$(this).hide();
	});
	$('img#sgLoader').removeClass('hid');
	$.post(thisURL + thisModule + "/process/change-permission", keyAndVal, function(data) {
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
				if (dataJ.error != null) {
					CMS.showNotification('error', dataJ.error);
				} else {
					var $dataA = $('a#stat' + itemID);
					if (enableModule == 1) {
						CMS.showNotification('success', 'Module was successfully activated for this user');
						$('#permActive' + itemID).removeAttr('style');
						$('#permInactive' + itemID).attr('style', 'display:none;');
						$dataA.data('data-getDetails', 'disableFxn');
						$dataA.attr('data-getDetails', 'disableFxn');
					} else {
						CMS.showNotification('success', 'Module was successfully deactivated for this user');
						$('#permActive' + itemID).attr('style', 'display:none;');
						$('#permInactive' + itemID).removeAttr('style');
						$dataA.data('data-getDetails', 'enableFxn');
						$dataA.attr('data-getDetails', 'enableFxn');
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