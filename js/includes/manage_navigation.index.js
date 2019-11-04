CMS.initPageUnbind = function() {
	CMS.commonUnbind();
}
CMS.initPage = function() {
	var updateOutput = function(e) {
		var list = e.length ? e : $(e.target),
			output = list.data('output');
		if (window.JSON) {
			var a = window.JSON.stringify(list.nestable('serialize'));
			$.post(thisURL + thisModule + "/process/save-update", {
				'navData': a
			}, function(data) {
				if (data != 'false') {
					CMS.showNotification('success', 'Navigation is now saved');
				}
			});
		} else {
			CMS.showNotification('error', 'Navigation is not synced');
		}
	};
	var updateOutputInactive = function(e) {
		var list = e.length ? e : $(e.target),
			output = list.data('output');
		if (window.JSON) {
			var a = window.JSON.stringify(list.nestable('serialize'));
			$.post(thisURL + thisModule + "/process/save-update-inactive", {
				'navData': a
			}, function(data) {
				if (data != 'false') {
					CMS.showNotification('success', 'Navigation is now saved');
				}
			});
		} else {
			CMS.showNotification('error', 'Navigation is not synced');
		}
	};
	$('#nestable2').nestable({
		group: 1,
		maxDepth: 5
	}).on('change', updateOutput);
	$('#nestable3').nestable({
		group: 1,
		maxDepth: 5
	}).on('change', updateOutputInactive);
	$('span.btn').click(function() {
		var a = $(this).attr('data').split("||");
		b = a;
		a = (a[0] == '1') ? 0 : 1;
		$.post(thisURL + thisModule + "/process/status", {
			'status': a,
			'id': b[1]
		}, function(data) {
			CMS.showNotification('success', 'Navigation is now modified');
		});
		$(this).toggleClass('tooltip-error btn-danger tooltip-success btn-success');
		$('i', this).toggleClass('icon-remove-sign icon-ok-sign');
	});
	$('[data-rel=tooltip]').tooltip();
	$('[data-rel=tooltip]').hover(function() {
		$(this).toggleClass('tooltip-error btn-danger').toggleClass('tooltip-success btn-success');
		$('i', this).toggleClass('icon-remove-sign').toggleClass('icon-ok-sign');
	}, function() {
		$(this).toggleClass('tooltip-error btn-danger').toggleClass('tooltip-success btn-success');
		$('i', this).toggleClass('icon-remove-sign').toggleClass('icon-ok-sign');
	});
}