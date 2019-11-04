CMS.initPageUnbind = function() {
	CMS.commonUnbind();
}
CMS.initPage = function() {
	var textedit = ['inputPageContent', 'inputPageCaption']; /* place the fields that needs to have text editor */
	$('a.setFormValues').on('click', function() {
		itemID = $(this).closest("td").attr('id');
		itemID = itemID.replace("jdata", "");
		var keyAndVal = "id_page=" + itemID;
		$.post(thisURL + thisModule + "/process/get-specific-page/", keyAndVal, function(data) {
			if (data != 'false') {
				var dataJ = $.parseJSON(data);
				if (dataJ.error != null) {
					CMS.showNotification('error', dataJ.error);
				} else {
					$('input#id_page').val(dataJ.page.id_page);
					$('input#inputTitle').val(dataJ.page.title);
					$('input#inputLinkRewrite').val(dataJ.page.link_rewrite);
					if (dataJ.page.redirect == 1) {
						$('input#inputRedirect').prop('checked', true);
					} else {
						$('input#inputRedirect').prop('checked', false);
					}
					if (dataJ.page.title_active == 1) {
						$('input#title_active').prop('checked', true);
					} else {
						$('input#title_active').prop('checked', false);
					}
					if (dataJ.page.caption_active == 1) {
						$('input#caption_active').prop('checked', true);
					} else {
						$('input#caption_active').prop('checked', false);
					}
					if (dataJ.page.content_active == 1) {
						$('input#content_active').prop('checked', true);
					} else {
						$('input#content_active').prop('checked', false);
					}
					if (dataJ.page.image_src_active == 1) {
						$('input#image_src_active').prop('checked', true);
					} else {
						$('input#image_src_active').prop('checked', false);
					}
					if (dataJ.page.meta_title_active == 1) {
						$('input#meta_title_active').prop('checked', true);
					} else {
						$('input#meta_title_active').prop('checked', false);
					}
					if (dataJ.page.meta_keywords_active == 1) {
						$('input#meta_keywords_active').prop('checked', true);
					} else {
						$('input#meta_keywords_active').prop('checked', false);
					}
					if (dataJ.page.meta_description_active == 1) {
						$('input#meta_description_active').prop('checked', true);
					} else {
						$('input#meta_description_active').prop('checked', false);
					}
					if (dataJ.page.meta_image_active == 1) {
						$('input#meta_image_active').prop('checked', true);
					} else {
						$('input#meta_image_active').prop('checked', false);
					}
					$('input#inputFunction').val(dataJ.page.function_name);
					$('#inputPageContent').code(dataJ.page.content);
					$('#inputPageCaption').code(dataJ.page.caption);
					$('#inputParent option').each(function() {
						if ($(this).val() == dataJ.page.id_parent) {
							$(this).attr('selected', 'selected');
						}
					});
					$('option#mod_' + dataJ.page.module_name).attr('selected', 'selected');
					$('#inputParent option').each(function() {
						if ($(this).val() == dataJ.page.id_parent) {
							$(this).attr('selected', 'selected');
						}
					});
					$('#inputCustomLayout option').each(function() {
						if ($(this).val() == dataJ.page.custom_theme + '/' + dataJ.page.custom_layout) {
							$(this).attr('selected', 'selected');
						}
					});
					$('input#inputMetaTitle').val(dataJ.page.meta_title);
					$('input#inputMetaKeywords').val(dataJ.page.meta_keywords);
					$('input#inputMetaDesc').val(dataJ.page.meta_description);
					$('#image_src').val(dataJ.page.image_src);
					$('#meta_image').val(dataJ.page.meta_image);
					$('.imgupload').each(function() {
						$(this).imgupload('refresh');
					});
				}
			} else {
				CMS.showNotification('error', 'Network Problem. Please try again.');
			}
			CMS.showWidge();
		});
		if (!$(this).hasClass('editItem')) { /* event if edit pencil button is clicked */
			$('div#formActions').addClass('hid');
			$('.content_display').destroy();
			$('.content_display').summernote();
			$('div.note-editable').attr('contenteditable', 'false');
		} else {
			$('.content_display').destroy();
			CMS.runSummernote(textedit);
			$('div.note-editable').attr('contenteditable', 'true');
		}
	});
	$('button#dtAddRow').on('click', function() { /* event if top add button is clicked */
		$('#image_src').val('');
		$('#meta_image').val('');
		$('.imgupload').each(function() {
			$(this).imgupload('refresh');
		});
		$('.content_display').code('');
		$('.content_display').destroy();
		CMS.runSummernote(textedit);
		$('div.note-editable').attr('contenteditable', 'true');
	});
	$('button#btnEditForm').on('click', function() { /* event if top edit button is clicked */
		$('.content_display').destroy();
		CMS.runSummernote(textedit);
		$('div.note-editable').attr('contenteditable', 'true');
	});
	$('#submit').on('click', function() { /* event if submit button is clicked */
		$.each(textedit, function(index, value) {
			$('#' + value).val($('#' + value).code());
		});
	});
	$('input.imgupload').each(function() {
		$(this).imgupload();
	});
	$("#inputTitle").keyup(function() {
		var str = $(this).val();
		var link_rewrite = str.replace(/[_\W]+/g, "").toLowerCase();
		$('#inputLinkRewrite').val(link_rewrite);
	});
	$("#inputLinkRewrite").bind("keypress", function(event) {
		var str = $(this).val();
		$(this).val(str.toLowerCase());
		var charCode = event.which;
		if (charCode <= 13) {
			return true;
		}
		var keyChar = String.fromCharCode(charCode);
		return /[a-zA-Z0-9_-]/.test(keyChar); // alphanumeric and underscore only
	});
	var details = new Array();
	details[0] = "genericForm"; //active form id
	details[1] = thisURL + thisModule + "/process/add-page/"; //post url for add
	details[2] = 'Page was successfully created.'; //success message for add
	details[3] = thisURL + thisModule + "/process/edit-page/"; //post url for edit
	details[4] = 'Page was successfully updated.'; //success message for edit
	details[5] = thisURL + thisModule + "/process/delete-page/"; //post url for delete
	details[6] = 'Page was successfully deleted.'; //success message for delete
	details[7] = 'id_page'; //name of id for delete
	details[8] = 'DT_Generic'; //active dataTable id
	CMS.common(details);
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