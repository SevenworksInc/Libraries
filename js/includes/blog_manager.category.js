CMS.initPageUnbind = function() {
	CMS.commonUnbind();
	$('button.addReset').unbind();
}
CMS.initPage = function() {
	var textedit = ['category_desc']; /* place the fields that needs to have text editor */
	$('a.setFormValues').on('click', function() {
		itemID = $(this).closest("td").attr('id');
		itemID = itemID.replace("jdata", "")
		var json = $('div#jd' + itemID).text();
		var data = $.parseJSON(json);
		$('[name="where[id_blog_category]"]').val(data.id_blog_category);
		$('#id_parent').val(data.id_parent);
		$('#category_image_src').val(data.category_image_src);
		$('#category_title').val(data.category_title);
		$('#category_caption').val(data.category_caption);
		$('#category_desc').val(data.category_desc);
		$('#category_meta_title').val(data.category_meta_title);
		$('#category_meta_description').val(data.category_meta_description);
		$('#category_meta_keywords').val(data.category_meta_keywords);
		$('#category_meta_author').val(data.category_meta_author);
		if (data.status == 1) {
			$('input#status').prop('checked', true);
		} else {
			$('input#status').prop('checked', false);
		}
		if (!$(this).hasClass('editItem')) {
			$('div#formActions').addClass('hid');
			$('.content_display').destroy();
			$.each(textedit, function(index, value) {
				$('#' + value).summernote();
			});
			$('div.note-editable').attr('contenteditable', 'false');
		} else {
			$('.content_display').destroy();
			CMS.runSummernote(textedit);
			$('div.note-editable').attr('contenteditable', 'true');
		}
		$('#category_image_src').imgupload('refresh');
		CMS.showWidge();
	});
	CMS.runSummernote(textedit);
	$('button#dtAddRow').on('click', function() {
		$('.content_display').val('');
		$('.content_display').code('');
		$('.content_display').destroy();
		CMS.runSummernote(textedit);
		$('div.note-editable').attr('contenteditable', 'true');
		$('#category_image_src').val('');
		$('#category_image_src').imgupload('refresh');
	});
	$('#btnEditForm').click(function() {
		$('.content_display').destroy();
		CMS.runSummernote(textedit);
		$('div.note-editable').attr('contenteditable', 'true');
	});
	$('#submit').on('click', function() {
		$.each(textedit, function(index, value) { /* check if submit button is clicked */
			$('#' + value).val($('#' + value).code());
		});
	});
	$('input.imgupload').each(function() {
		$(this).imgupload();
	});
	var details = new Array();
	details[0] = "genericForm"; //active form id
	details[1] = thisURL + thisModule + "/process/add-category/"; //post url for add
	details[2] = 'Blog category was successfully created.'; //success message for add
	details[3] = thisURL + thisModule + "/process/edit-category/"; //post url for edit
	details[4] = 'Blog category was successfully updated.'; //success message for edit
	details[5] = thisURL + thisModule + "/process/delete-category/"; //post url for delete
	details[6] = 'Blog category was successfully deleted.'; //success message for delete
	details[7] = 'id_blog_category'; //name of id for delete
	details[8] = 'DT_Generic'; //active dataTable id
	CMS.common(details); //include the active data table (for delete function)
}

function runSummernote(textedit) {
	$.each(textedit, function(index, value) {
		$('#' + value).summernote({
			onblur: function(e) {
				$("#" + value).val($('#' + value).code());
			},
			onImageUpload: function(files, editor, $editable) {
				sendFile(files[0], editor, $editable);
			}
		});
	});
}

function changeStatus() {
	if (enableModule) enableModule = 1;
	else enableModule = 0;
	var keyAndVal = "data%5Bwhr_id_blog_category%5D=" + itemID + "&data%5Bclmn_status%5D=" + enableModule;
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
				} else {
					var $dataA = $('a#stat' + itemID);
					if (enableModule == 1) {
						CMS.showNotification('success', 'Category is successfully Enabled');
						$('a#stat' + itemID).html('<span class="label label-success"> Active </span>');
						$('a#stat' + itemID).attr('title', 'Disable item status');
						$dataA.data('data-getDetails', 'disableFxn');
						$dataA.attr('data-getDetails', 'disableFxn');
						text = text.replace('"status":"0"', '"status":"1"');
						$('div#jd' + itemID).text(text);
					} else {
						CMS.showNotification('success', 'Category is successfully Disabled');
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