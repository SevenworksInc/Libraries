CMS.initPageUnbind = function() {
	$('a#btnGoBack').unbind();
};
CMS.initPage = function() {
	var details = new Array();
	details[8] = 'DT_Generic'; //active dataTable id
	CMS.common(details); //include the active data table (for delete function)
	CMS.showHideFields();
	$('a#btnGoBack').on('click', function() {
		CMS.initPageUnbind();
		window.history.back();
	});
};