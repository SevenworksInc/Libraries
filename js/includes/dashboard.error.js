CMS.initPageUnbind = function() {
	$('a#btnGoBack').unbind();
};
CMS.initPage = function() {
	$('a#btnGoBack').on('click', function() {
		CMS.initPageUnbind();
		window.history.back();
	});
};