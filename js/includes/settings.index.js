CMS.removeUserImage = function(numBanner, imageType) { /*/this function is called when admin chooses to cancel image upload for the user*/
	$('a#removeImage' + numBanner).addClass('hid');
	$('div#imageHolder' + numBanner).html('');
	$('input#site_' + imageType + numBanner).val('');
	$('div#imageDiv' + numBanner).html('<div class="btn btn-info btn-small" ><i class="icon-cloud-upload"></i> Upload Image</div>');
	$('#globalModal').modal('hide');
}
CMS.initPageUnbind = function() {
	CMS.updateConfigU();
	delete CMS.removeUserImage;
}
CMS.initPage = function() {
	var details = new Array();
	details[0] = 'genSettingsForm'; //active form id
	details[1] = thisURL + thisModule + "/process/upd-general/"; //post url 
	details[2] = 'General settings was successfully updated.'; //success message 
	CMS.updateConfig(details);
	$('input.imgupload').each(function() {
		$(this).imgupload();
	});
	$('#site_logo').val($('#site_logo').data("value"));
	$('#site_favicon').val($('#site_favicon').data("value"));
	for (var i = 0; i != 10; i++) {
		$('#site_backgrounds_' + i).val($('#site_backgrounds_' + i).data("value"));
	}
	$(document).ready(function() {
		$('#site_logo').imgupload('refresh');
		$('#site_favicon').imgupload('refresh');
		for (var i = 0; i != 10; i++) {
			$('#site_backgrounds_' + i).imgupload('refresh');
		}
		$("input.userfile").attr('disabled', true);
		$("a.uploadRemove").attr('disabled', true);
		$('button#btnEditForm').on('click', function() {
			$("input.userfile").attr('disabled', false).trigger("chosen:updated");
			$("a.uploadRemove").attr('disabled', false);
		});
	});
};