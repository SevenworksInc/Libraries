var CMS = {};
CMS.showNotification = function(type, message) {
	var html = '';
	$('div#loginNotification').removeClass();
	$('div#loginNotification').addClass('alert');
	html += '<button type="button" class="close" data-dismiss="alert"><i class="icon-remove"></i></button>';
	if (type == 'success') {
		$('div#loginNotification').addClass('alert-success');
		html += '<strong><i class="icon-ok"></i>&nbsp;&nbsp;Well done! </strong>';
	} else if (type == 'error') {
		$('div#loginNotification').addClass('alert-danger');
		html += '<strong><i class="icon-remove"></i>&nbsp;&nbsp;Oh snap! </strong>';
	} else if (type == 'warning') {
		$('div#loginNotification').addClass('alert-warning');
		html += '<strong><i class="icon-warning-sign"></i>&nbsp;&nbsp;Warning! </strong>';
	} else {
		$('div#loginNotification').addClass('alert-info');
		html += '<strong><i class="icon-info"></i>&nbsp;&nbsp;Heads Up! </strong>';
	}
	html += "&nbsp;&nbsp;";
	if (message instanceof Array) {
		message.forEach(function(entry) {
			html += "<br/><i class='icon-hand-right'></i>&nbsp;&nbsp;";
			html += entry;
		});
	} else {
		html += "<br/><i class='icon-hand-right'></i>&nbsp;&nbsp;";
		html += message;
	}
	$('div#loginNotification').attr('style','display:none;');
	$('div#loginNotification').html(html);
	$('div#loginNotification').removeAttr('style');
	setTimeout(function() {
		$('div#loginNotification').fadeOut(5000);
	}, 4000);
}
$('#loginForm').on('submit', function(event) {
	$('#btnLogin').hide();
	$('#spinnerGif').show();
	var admin_base = $('span#thisURL').html();
	$.post(admin_base + 'login', $(this).serialize(), function(data) {
		if (data) {
			var dataJ = $.parseJSON(data);
			if (dataJ.error != null) {
				$('#spinnerGif').hide();
				$('#btnLogin').show();
				CMS.showNotification('error', dataJ.error);
			} else {
				if (dataJ.redirect) {
					window.location.href = dataJ.redirect;
				} else {
					window.location.href = admin_base;
				}
				return false;
			}
		} else {
			CMS.showNotification('error', 'Network Problem. Please try again.');
		}
	});
	event.preventDefault();
});