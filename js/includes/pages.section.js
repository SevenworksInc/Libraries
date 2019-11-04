CMS.initPageUnbind = function() {
	CMS.commonUnbind();
}
CMS.initPage = function() {
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
				}
			} else {
				CMS.showNotification('error', 'Network Problem. Please try again.');
			}
			CMS.showWidge();
		});
	});
	var details = new Array();
	details[0] = "genericForm"; //active form id
	details[7] = 'id_page'; //name of id for delete
	details[8] = 'DT_Generic'; //active dataTable id
	CMS.common(details);
}