CMS.initPageUnbind = function() {
	CMS.commonUnbind();
	$('button.addReset').unbind();
}
CMS.initPage = function() {
	$('a.setFormValues').on('click', function() {
		$('.toClone').show();
		$('#id-input-file-3').hide();
		$('.remove-btn').hide();
		$('.ace-file-input').hide();
		itemID = $(this).closest("td").attr('id');
		itemID = itemID.replace("jdata", "")
		var json = $('div#jd' + itemID).html();
		var data = $.parseJSON(json);
		$('[name="where[id_gallery_item]"]').val(data.id_gallery_item);
		$('#id_gallery_category').val(data.id_gallery_category);
		$('#image_title').val(data.image_title);
		$('#image_sub_title').val(data.image_sub_title);
		$('#image_desc').val(data.image_desc);
		$('#image_meta_title').val(data.image_meta_title);
		$('#image_meta_description').val(data.image_meta_description);
		$('#image_meta_keywords').val(data.image_meta_keywords);
		$('#image_src').val(data.image_src);
		$('.separator').attr('style', 'display:none');
		if (data.status == 1) {
			$('input#status').prop('checked', true);
		}
		else {
			$('input#status').prop('checked', false);
		}
		if (!$(this).hasClass('editItem')) {
			$('div#formActions').addClass('hid');
		}
		$('#image_src').imgupload('refresh');
		$('.imgupload').attr('style', 'float: right;visibility: hidden;position:absolute;');
		CMS.showWidge();
		$('#id-input-file-3').prop('disabled', 'disabled');
		$('#filename').prop('disabled', 'disabled');
	});
	$('#btnEditForm').click(function() {
		$('.separator').attr('style', 'display:none');
	});
	$('input.imgupload').each(function() {
		$(this).imgupload();
	});
	$(".chosen-single").addClass('ignore');
	$('button#dtAddRow').on('click', function() {
		$('.separator').removeAttr('style');
		$('#id-input-file-3').prop('disabled', false);
		$('.filename-1').prop('disabled', false);
		$('.toClone').hide();
		$('#id-input-file-3').show();
		$('#id-input-file-3').ace_file_input({
			style: 'well',
			btn_choose: 'Click to choose Images',
			btn_change: null,
			no_icon: 'icon-cloud-upload',
			droppable: false,
			thumbnail: 'small',
			preview_error: function(filename, error_code) {}
		}).on('change', function() {
			/* upload images */
			$('#loadingGif').removeAttr('style');
			var form_data = new FormData(); /* Creating object of FormData class */
			var len = $("#id-input-file-3").prop("files").length;
			for (var c = 0; c < len; c++) {
				var file_data = $("#id-input-file-3").prop("files")[c];
				form_data.append("file-" + c, file_data);
			}
			$.ajax({
				url: $('#id-input-file-3').attr('data-upload-url'),
				type: 'POST',
				data: form_data,
				async: false,
				success: function(data) {
					if (data) {
						$('#loadingGif').attr('style', 'display:none');
						$('.remove').hide();
						$(".hide-placeholder").hide();
						var files = $('#id-input-file-3').data('ace_input_files');
						var obj = $.parseJSON(data);
						var counter = 1;
						$.each(files, function(i, item) {
							$("<div>").attr({
								'id': "form-container-" + counter,
								'class': "form-dynamic-container"
							}).appendTo("#dynamic-container");
							/* create canvas */
							var canvas = document.createElement('canvas');
							canvas.id = "canvas_" + counter;
							canvas.className = "canvas_class controls";
							var context = canvas.getContext("2d");
							/* append to div */
							$('#form-container-' + counter).append(canvas);
							/* create form */
							$('div.div_sections_inner:last').clone().appendTo($('#form-container-' + counter));
							$('#form-container-' + counter + " .file_input").val();
							$('#form-container-' + counter + " .remove-btn").attr('data-id', counter);
							/* add data to data[image_src][] */
							$('#form-container-' + counter).find('#filename').val(obj[counter - 1]);
							var FR = new FileReader();
							FR.onload = function(e) {
								var img = new Image();
								img.onload = function() {
									canvas.width = parseFloat(this.width);
									canvas.height = parseFloat(this.height);
									canvas.setAttribute('style', 'max-width:150px;max-height:150px;');
									var wdt = parseFloat(this.width);
									var hgt = parseFloat(this.height);
									context.drawImage(img, 0, 0, wdt, hgt);
								};
								img.src = e.target.result;
							};
							FR.readAsDataURL(item);
							counter++;
						});
					}
					$('#id-input-file-3').prop('disabled', true);
					$("#id-input-file-3").val('');
				},
				error: function(data) {},
				cache: false,
				contentType: false,
				processData: false
			});
			/* upload images */
			$('.toClone .fieldEditable').prop('disabled', 'disabled');
			$('#filename').prop('disabled', 'disabled');
		});
		var flag = true;
		$('#image_src').val('');
		/* $('#image_src').imgupload('refresh'); */
	});
	$('.remove-btn').unbind('click');
	$(document).on('click', '.remove-btn', function() {
		var counter = $(this).attr('data-id');
		$('#form-container-' + counter).remove();
		if (!$('.form-dynamic-container').length) {
			$(".hide-placeholder").show();
			$('.ace-file-input').show();
			$('.remove').click();
			$('.toClone .fieldEditable').prop('disabled', false);
		}
	});
	$('.closeWidge').click(function() {
		$('.form-dynamic-container').remove();
		$('#genericForm')[0].reset();
		$(".hide-placeholder").show();
		$('.ace-file-input').show();
		$('.remove').click();
	});
	var details = new Array();
	details[0] = "genericForm"; /* active form id */
	details[1] = thisURL + thisModule + "/process/add-item/"; /* post url for add */
	details[2] = 'Gallery item was successfully created.'; /* success message for add */
	details[3] = thisURL + thisModule + "/process/edit-item/"; /* post url for edit */
	details[4] = 'Gallery item was successfully updated.'; /* success message for edit */
	details[5] = thisURL + thisModule + "/process/delete-item/"; /* post url for delete */
	details[6] = 'Gallery item was successfully deleted.'; /* success message for delete */
	details[7] = 'id_gallery_item'; /* name of id for delete */
	details[8] = 'DT_Generic'; /* active dataTable id */
	CMS.common(details); /* include the active data table (for delete function) */
}

function changeStatus() {
	if (enableModule) enableModule = 1;
	else enableModule = 0;
	var keyAndVal = "data%5Bwhr_id_gallery_item%5D=" + itemID + "&data%5Bclmn_status%5D=" + enableModule;
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
				if (dataJ.error != null) CMS.showNotification('error', dataJ.error);
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
$("#ckbCheckAll").click(function () {
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
						CMS.showNotification('success', 'Gallery item/s was successfully updated.');
						CMS.forcedRefresh();
					}
				} else {
					CMS.showNotification('error', 'Network Problem. Please try again.');
				}
			});
		}
	});
});