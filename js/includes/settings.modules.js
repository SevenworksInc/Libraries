CMS.removeUploadModule = function() { //this function is called when admin chooses to cancel image upload for the user
	$('input#moduleFolderName').val('');
	$('div#moduleUploadDiv').html('<div class="btn btn-info btn-sm" ><i class="fa fa-cloud-upload"></i> Upload Module</div>');
	$('span#moduleNameHolder').text('');
	$('span#removeModule').addClass('hid');
	$('#globalModal').modal('hide');
}
CMS.initPageUnbind = function() {
	CMS.commonUnbind();
	uploadModule.destroy();
	delete CMS.removeUploadModule;
}
CMS.initPage = function() {
	$('.showWidge').on('click', function() {
		CMS.removeUploadModule();
	});
	$('a.setFormValues').on('click', function() {
		itemID = $(this).closest("td").attr('id');
		itemID = itemID.replace("jdata", "")
		var json = $('div#jd' + itemID).html();
		var data = $.parseJSON(json);
		$('input#id_module').val(data.id_module);
		$('div#widgetItemActions button.showGlobal').attr('data-modID', "jdata" + data.id_module);
		$('input#module_name').val(data.module_name);
		$('textarea#module_description').val(data.module_description);
		$('input#module_class').val(data.module_class);
		$('input#link_rewrite').val(data.link_rewrite);
		if (data.isAdmin == 1) {
			$('input#isAdmin').prop('checked', true);
		} else {
			$('input#isAdmin').prop('checked', false);
		}
		if (data.isActive == 1) {
			$('input#isActive').prop('checked', true);
		} else {
			$('input#isActive').prop('checked', false);
		}
		$('input#date_add').val(data.date_add);
		$('input#date_upd').val(data.date_upd);
		if (!$('button#dtAddRow').is(":visible")) {
			$('button#dtAddRow').removeClass('hid');
		}
		if (!$(this).hasClass('editItem')) {
			$('div#formActions').addClass('hid');
		}
		CMS.showWidge();
	});
	uploadModule = new AjaxUpload('#moduleUploadDiv', {
		action: thisURL + thisModule + '/tempUpload/module',
		name: 'userfile',
		params: ['jpg', 'gif', 'png'],
		onSubmit: function(file, ext) {
			if (!(ext && /^(zip)$/.test(ext))) {
				CMS.showNotification('error', 'Invalid file extension');
				return false;
			}
			$('div#moduleUploadDiv').html('<img src="img/loading_whitebg.gif" style = "margin-top:9px !Important;"/>');
		},
		onComplete: function(file, response) {
			var obj = JSON.parse(response);
			if (obj.error) {
				CMS.showNotification('error', obj.error);
				CMS.removeUploadModule();
			} else {
				$('input#module_class').val(obj.moduleClass);
				$('input#moduleFolderName').val(obj.file_name);
				$('div#moduleUploadDiv').html('<div class="btn btn-info btn-sm" ><i class="fa fa-cloud-upload"></i> Change Module</div>');
				$('span#moduleNameHolder').text(file);
				$('span#removeModule').removeClass('hid');
			}
		}
	});
	$("#module_name").keyup(function() {
		var str = $(this).val();
		var link_rewrite = str.replace(/[_\W]+/g, "").toLowerCase();
		$('#module_class').val(link_rewrite);
		$('#link_rewrite').val(link_rewrite);
	});
	$("#module_class").bind("keypress", function(event) {
		var str = $(this).val();
		$(this).val(str.toLowerCase());
		var charCode = event.which;
		if (charCode <= 13) {
			return true;
		}
		var keyChar = String.fromCharCode(charCode);
		return /[a-zA-Z0-9_]/.test(keyChar); // alphanumeric and underscore only
	});
	$("#link_rewrite").bind("keypress", function(event) {
		var str = $(this).val();
		$(this).val(str.toLowerCase());
		var charCode = event.which;
		if (charCode <= 13) {
			return true;
		}
		var keyChar = String.fromCharCode(charCode);
		return /[a-zA-Z0-9_]/.test(keyChar); // alphanumeric and underscore only
	});
	var details = new Array();
	details[0] = "genericForm"; //active form id
	details[1] = thisURL + thisModule + "/process/add-module/"; //post url for add
	details[2] = 'Module was successfully created.'; //success message for add
	details[3] = thisURL + thisModule + "/process/edit-module/"; //post url for edit
	details[4] = 'Module was successfully updated.'; //success message for edit
	details[5] = thisURL + thisModule + "/process/delete-module/"; //post url for delete
	details[6] = 'Module was successfully deleted.'; //success message for delete
	details[7] = 'id_module'; //name of id for delete
	details[8] = 'DT_Generic'; //active dataTable id
	CMS.common(details); //include the active data table (for delete function)
};