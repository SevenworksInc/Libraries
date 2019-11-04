CMS.initPageUnbind = function() {
	CMS.commonUnbind();
	$('button.sendNewsletter').unbind();
	$('button.addReset').unbind();
	CMS.showHideFieldsU();
}
CMS.initPage = function() {
	var textedit = ['newsletterContent']; /* place the fields that needs to have text editor */
	$('a.setFormValues').on('click', function() {
		itemID = $(this).closest("td").attr('id');
		itemID = itemID.replace("jdata", "")
		var json = $('div#jd' + itemID).html();
		var data = $.parseJSON(json);
		$('input#id_newsletter').val(data.id_newsletter);
		$('#newsletterTitle').val(data.title);
		if (!$('button#dtAddRow').is(":visible")) {
			$('button#dtAddRow').removeClass('hid');
		}
		if (data.content) {
			$.get('includes/newsletters/' + data.content, function(response) {
				$('#newsletterContent').val(response);
				$('.content_display').destroy();
				CMS.runSummernote(textedit);
			}, 'text');
		}
		if (!$(this).hasClass('editItem')) {
			$('div.note-editable').attr('contenteditable', 'false');
		} else {
			$('div.note-editable').attr('contenteditable', 'true');
		}
		CMS.showWidge();
	});
	$('button#dtAddRow').on('click', function() {
		$('.content_display').val('');
		$('.content_display').code('');
		$('.content_display').destroy();
		CMS.runSummernote(textedit);
		$('div.note-editable').attr('contenteditable', 'true');
		CKEDITOR.instances.inputContent.setData('');
	});
	$('button#btnEditForm').on('click', function() {
		$('.content_display').destroy();
		CMS.runSummernote(textedit);
		$('div.note-editable').attr('contenteditable', 'true');
	});
	$('#submit').on('click', function() { /* event if submit button is clicked */
		$.each(textedit, function(index, value) {
			$('#' + value).val($('#' + value).code());
		});
	});
	var details = new Array();
	details[0] = "genericForm"; //active form id
	details[1] = thisURL + thisModule + "/process/add-newsletter/"; //post url for add
	details[2] = 'Newsletter was successfully created.'; //success message for add
	details[3] = thisURL + thisModule + "/process/edit-newsletter/"; //post url for edit
	details[4] = 'Newsletter was successfully updated.'; //success message for edit
	details[5] = thisURL + thisModule + "/process/delete-newsletter/"; //post url for delete
	details[6] = 'Newsletter was successfully deleted.'; //success message for delete
	details[7] = 'id_newsletter'; //name of id for delete
	details[8] = 'DT_Generic'; //active dataTable id
	CMS.common(details);
	CMS.showHideFields();
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

function sendNewsletter() {
	var keyAndVal = "data%5Bid_newsletter%5D=" + itemID;
	$.post(thisURL + thisModule + "/process/send-newsletter", keyAndVal, function(data) {
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
					CMS.showNotification('success', 'Newsletter is successfully sent to subscribers');
				}
			} else {
				CMS.showNotification('error', 'Network Problem. Please try again.');
			}
		}, 1200);
	});
}

function sendNL() {
	enableModule = true;
	sendNewsletter();
}