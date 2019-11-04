CMS.initPageUnbind = function() {
	CMS.commonUnbind();
	$('button.addReset').unbind();
}
CMS.initPage = function() {
	$('a.setFormValues').on('click', function() {
		itemID = $(this).closest("td").attr('id');
		itemID = itemID.replace("jdata", "")
		var json = $('div#jd' + itemID).html();
		var data = $.parseJSON(json);
		$('[name="data[whr_id_gallery_category]"]').val(data.id_gallery_category);
		$('#id_parent').val(data.id_parent);
		$('#category_title').val(data.category_title);
		$('#category_sub_title').val(data.category_sub_title);
		$('#category_meta_title').val(data.category_meta_title);
		$('#category_meta_description').val(data.category_meta_description);
		$('#category_meta_keywords').val(data.category_meta_keywords);
		$('#image_src').val(data.image_src);
		$('textarea#category_desc').val(data.category_desc);
		if (data.status == 1) {
			$('#status').prop('checked', true);
		} else {
			$('#status').prop('checked', false);
		}
		if (!$(this).hasClass('editItem')) {
			$("#id_gallery_category").prop('disabled', true);
			$('div#formActions').addClass('hid');
		} else {
			$("#id_gallery_category").prop('disabled', false);
		}
		$("#id_gallery_category").trigger("liszt:updated");
		$('#image_src').imgupload('refresh');
		CMS.showWidge();
	});
	$('#btnEditForm').click(function() {
		$("#id_gallery_category").prop('disabled', false);
		$("#id_gallery_category").trigger("liszt:updated");
	});
	$("#id_gallery_category").chosen();
	$("#id_gallery_category_chosen").css('width', '300px'); /* Script somewhere sets div width to zero. This will fix the issue. */
	$(".chosen-single").addClass('ignore');
	$('input.imgupload').each(function() {
		$(this).imgupload();
	});
	$("#id_gallery_category_chzn").css('width', '300px');
	$('button#dtAddRow').on('click', function() {
		var flag = true;
		$('#image_src').val('');
		$('#image_src').imgupload('refresh');
		$('select#id_gallery_category option').each(function() {
			if (flag) {
				$("#id_gallery_category").val(0);
				$("#id_gallery_category").trigger("liszt:updated");
				flag = false;
			}
		});
	});
	var details = new Array();
	details[0] = "genericForm"; //active form id
	details[1] = thisURL + thisModule + "/process/add-category/"; //post url for add
	details[2] = 'Gallery category was successfully created.'; //success message for add
	details[3] = thisURL + thisModule + "/process/edit-category/"; //post url for edit
	details[4] = 'Gallery category was successfully updated.'; //success message for edit
	details[5] = thisURL + thisModule + "/process/delete-category/"; //post url for delete
	details[6] = 'Gallery category was successfully deleted.'; //success message for delete
	details[7] = 'id_gallery_category'; //name of id for delete
	details[8] = 'DT_Generic'; //active dataTable id
	CMS.common(details); //include the active data table (for delete function)
};

function changeStatus() {
	if (enableModule) enableModule = 1;
	else enableModule = 0;
	var keyAndVal = "data%5Bwhr_id_gallery_category%5D=" + itemID + "&data%5Bclmn_status%5D=" + enableModule;
	$.post(thisURL + thisModule + "/process/change-category-status", keyAndVal, function(data) {
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
				}
				else {
					var $dataA = $('a#stat' + itemID);
					if (enableModule == 1) {
						CMS.showNotification('success', 'Gallery is successfully Enabled');
						$('a#stat' + itemID).html('<span class="label label-success"> Active </span>');
						$('a#stat' + itemID).attr('title', 'Disable item status');
						$dataA.data('data-getDetails', 'disableFxn');
						$dataA.attr('data-getDetails', 'disableFxn');
						text = text.replace('"status":"0"', '"status":"1"');
						$('div#jd' + itemID).text(text);
					} else {
						CMS.showNotification('success', 'Gallery is successfully Disabled');
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