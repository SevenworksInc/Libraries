CMS.setActiveMenu = function() {
	var bcActive = $('span#bcActive').html();
	if (bcActive != '') {
		$('ul.nav-list li').each(function() {
			if ($(this).hasClass('active')) {
				$(this).removeClass('active');
			}
			if ($(this).hasClass('open')) {
				$(this).removeClass('open');
			}
		});
		$('li#' + bcActive).addClass('active');
		$('li#' + bcActive).parents("li").addClass('active open');
		$('ul#breadcrumbs a').each(function() {
			var smID = $(this).attr('data-smID');
			var aEl = $('li#' + smID + ' a');
			var aElHref = aEl.attr('href')
			if (smID != null && !aEl.hasClass('dropdown-toggle') && aElHref != document.URL) {
				$(this).attr('href', aElHref);
			}
		});
		$('ul.nav-show').each(function() {
			var snID = $(this).parent().attr('id');
			if (!$(this).parent().hasClass("active")) {
				console.log(snID);
				$("#" + snID + " > ul.submenu").removeClass('nav-show');
				$("#" + snID + " > ul.submenu").addClass('nav-hide');
				$("#" + snID + " > ul.submenu").attr('style', 'display:none;');
			};
		});
	}
}
CMS.initPS = function() {
	$.getScript('js/includes/' + thisModule + '.' + thisMethod + '.js').done(function(script, textStatus) {
		if (typeof(CMS.initPage) === "function") {
			CMS.initPage();
			$('#sidebar').attr('class', 'sidebar responsive');
		}
	}).fail(function(jqxhr, settings, exception) {});
	CMS.initShowGlobal();
	CMS.setActiveMenu();
};
$('body').pushState({
	debug: false,
	load: ['.page-content', '#breadcrumbs'],
	onBeforePageLoad: function(plugin, href) {
		$('.page-content').hide();
		if (typeof(CMS.initPageUnbind) === "function") {
			CMS.initPageUnbind();
			delete CMS.initPageUnbind;
		}
		if (typeof(CMS.initPage) === "function") {
			delete CMS.initPage;
		}
		if (!$('div#notification').is(":visible")) {
			NProgress.set(0.4);
			NProgress.inc();
		}
	},
	onAfterPageLoad: function(plugin, href) {
		setTimeout(function() {
			$('.page-content').show();
		}, 500);
		if (!$('div#notification').is(":visible")) {
			NProgress.done();
		}
		thisModule = $('span#thisModule').html();
		thisMethod = $('span#thisMethod').html();
		CMS.initPS();
	},
	ignore: function(link, elem) {
		return (link && (link.charAt(0) == "#" || (link.charAt(0) == "j")) || elem.hasClass('f_right') || elem.hasClass('ignore'));
	}
});
CMS.initPS();
$(window).load(function() {
	$("#pageLoader").fadeOut("fast");
});