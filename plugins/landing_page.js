/*****************************************************
 *
 *		@Author			Jesther Bas
 *		@Company		ViiWorks Inc.
 *		@Website		www.viiworks.com
 *		@DateCreated	May 3,2016
 *		@Description	All Landing Page Funcion
 *	
 ****************************************************/

jQuery(window).ready(function () {
	Init();

	/** Default Submit Form	 **/
	jQuery('#landingForm').submit(function(){ _formSubmitLead(jQuery(this)); });
	
	/** Application submit form **/
	// jQuery("#applicationForm").validate();
	jQuery(document).on('click', '.btn-application', function(){
		var myBtn = $(this),
			text = _btnDisabler(myBtn, true),
			notify = jQuery.notify({ icon: 'fa fa-exclamation', message: 'Verifying Application' },{ type: 'warning' });
			
		if($('#formAgree').is(":checked")){

			if(myBtn.data('pageskip')) {
				jQuery('#applicationForm').addClass('pageskip');
				$('#skip_hid').val(1);
			}
			else {
				jQuery('#applicationForm').removeClass('pageskip');
				$('#skip_hid').val(0);
			}
			$.notifyClose();
			jQuery('#applicationForm').submit();
			_btnDisabler(myBtn, false, text);
		} else {
			notify.update({'type': 'warning', 'message': '<strong>Warning!</strong> Please check I agree!', 'progress': 0, 'icon': 'fa fa-close'});
			$('#formAgree')
				.focus();
			_btnDisabler(myBtn, false, text);
		}
	});
	
	jQuery('#applicationForm').submit(function(e){ _formSubmit(jQuery(this)); })
	jQuery('#attachmentForm').submit(function(e){ _applicationAttachment(jQuery(this)); })
	jQuery('#total_price').keyup(function(){ computeLoan(jQuery(this)); })
	jQuery('#downpayment, #loan_monthly, #loan_downpayment').change(function(){ computeLoan(jQuery(this)); })
	
	/** Duplication **/
	jQuery(document).on('click', '.btnDuplicate', function(){ _duplicateForm(jQuery(this)); });
	jQuery(document).on('click', 'input[name="data[gender]"]', function(){
		var gender_data = $(this).val();
		gender_data = gender_data.split('-');
		
		if(gender_data[0] == 'single' || gender_data[0] == 'separated' || gender_data[0] == 'widow') $('.spouse').hide();
		else $('.spouse').show();
	});
});

function Init() {

	/* Default configuration for the Notification*/
	$.notifyDefaults({
		element: 'body',
		position: null,
		type: 'success',
		allow_dismiss: false,
		newest_on_top: false,
		showProgressbar: true,
		placement: {
			from: "top",
			align: "center"
		},
		z_index: 1031,
		delay: 5000,
		timer: 1000,
		animate: {
			enter: 'animated fadeInDown',
			exit: 'animated fadeOutUp'
		},
		icon_type: 'class',
		template: '<div data-notify="container" class="vh-notification col-xs-11 col-sm-3 alert alert-{0}" role="alert">' +
			'<button type="button" aria-hidden="true" class="close" data-notify="dismiss">×</button>' +
			'<span data-notify="icon"></span> ' +
			'<span data-notify="title">{1}</span> ' +
			'<span data-notify="message">{2}</span>' +
			'<div class="progress" data-notify="progressbar">' +
				'<div class="progress-bar progress-bar-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>' +
			'</div>' +
			'<a href="{3}" target="{4}" data-notify="url"></a>' +
		'</div>'
	});

	// Created for Application for skipping	
	jQuery('<input/>', { type: 'hidden', id: 'skip_hid', name: 'skip' })
		.appendTo('#applicationForm');

	// This fades all the element with .notif-fade by default
	setTimeout(function() { jQuery('.notif-fade').slideUp('slow'); }, 10000);

	jQuery('input.imgupload').each(function() {
		$(this).imgupload();
	});
	$('.sp-wrap').length ? $('.sp-wrap').smoothproducts() : false;
	
	if($('.multi-field-wrapper').length){
		$('.multi-field-wrapper').each(function() {
			var $wrapper = $('.multi-fields', this);
			$(".add-field", $(this)).click(function(e) {
				$('.multi-field:first-child', $wrapper).clone(true).appendTo($wrapper).find('input').val('').focus();
			});
			$('.multi-field .remove-field', $wrapper).click(function() {
				if ($('.multi-field', $wrapper).length > 1)
					$(this).parent('.multi-field').remove();
			});
		});
	}
}

function _duplicateForm(btn){
	var formName = btn.data('formduplicate'),
		formnumber = parseInt(btn.attr('data-formnumber')),
		formHtml = $('.' + formName + '_form').html();
	
	formnumber = formnumber + 1;
	btn.attr('data-formnumber', formnumber);
	formHtml = formHtml.replace(/\[0\]/g, '[' + formnumber + ']');
	formHtml = formHtml.replace(/value\=\"^(.*)\"/g, ' ');
	
	$('.' + formName + '_form-dynamic').append(formHtml);
}

function computeLoan(btn){
	var total_price = $('#total_price').val(),
		downpayment = $('#downpayment').val(),
		loan_downpayment = $('#loan_downpayment').val(),
		loan_monthly = $('#loan_monthly').val();
		if(downpayment)
			var loan_downpayment = total_price * downpayment;
		var loan_amount = total_price - loan_downpayment;
		
	$('#loan_downpayment').val(loan_downpayment);
	$('#loan_amount').val(loan_amount);
	$('span#loan_amount').html(loan_amount);
	
	if(loan_monthly > 0) {
		var temp_lp = loan_amount / loan_monthly;
		$('#loan_payment').val(temp_lp)
		$('span#loan_payment').html(temp_lp);
	}
	else $('#loan_payment').val(0);
}

function _btnDisabler(myBtn = false, flag = false, text = false){
	if(flag){
		var text = myBtn.html();
		myBtn
			.prop('disabled', flag)
			.html(' ');
		jQuery('<i/>', {
			class: "fa fa-spinner fa-spin fa-fw",
			style: "padding: 0;"
		}).appendTo(myBtn);
		myBtn.append('SENDING');
		return text;
	} else {
		myBtn
			.prop('disabled', flag)
			.html(text);
	}
}

// Default callout function for sbmitting form details
function _formSubmitLead(form){
	var myBtn = form.find('.btn.btns'),
		text = _btnDisabler(myBtn, true),
		notify = jQuery.notify({ icon: 'fa fa-exclamation', message: 'Checking Application' },{ type: 'warning' });
		
	setTimeout(function() { notify.update({'type': 'success', 'message': 'Submiting your application!', 'progress': 0, 'icon': 'fa fa-send'}); }, 400);
	jQuery.post(base_path + "landing/process/submit-landing-form", form.serialize(), function(data) {
		var json = jQuery.parseJSON(data);
		
		if(json.error.code == 000){
			if(next_page.indexOf('application') > -1){
				next_page += "?token=" + json.error.token + "&application=new";
			}
			notify.update({'type': 'success', 'message': '<strong>Success:</strong> Application sent, please check email for more information' , 'progress': 50, 'icon': 'fa fa-check'});

			setTimeout(function() { 
				window.location.href = window.location.href  + next_page;
			}, 5000);
			return false;
		}
		setTimeout(function() { notify.update({'type': 'danger', 'message': '<strong>Error:</strong> ' + json.error.message, 'progress': 25, 'icon': 'fa fa-close'}); }, 500);
		
		_btnDisabler(myBtn, false, text);
		//jQuery('#error-message', document).html(json.error.message);
	});
}

// Application Form
function _formSubmit(form){
	var token = getParameterByName('token'),
		hasSkipClass = form.hasClass('pageskip'),
		notify = "";

	setTimeout(function() {
		notify = jQuery.notify({ icon: 'fa fa-exclamation', message: 'Checking Application' },{ type: 'warning' });
	}, 200);
	
	if(hasSkipClass || validateForm()){
		setTimeout(function() { notify.update({'type': 'success', 'message': 'Submiting your application!', 'progress': 0, 'icon': 'fa fa-send'}); }, 300);
	
		$('#alertNotification').hide();
		jQuery.post(base_path + "landing/process/submit-application", form.serialize(), function(data) {
			var json = jQuery.parseJSON(data),
				not_message = hasSkipClass ? ", please check email for continuation. Thank you!" : ", now redirecting to atatchment page.";

			next_page = hasSkipClass ? ('/thankyou?token=' + token) : (next_page + '?token=' + token) ;
			if(json.error.code == 000){
				setTimeout(function() { notify.update({'type': 'success', 'message': '<strong>Success:</strong> Application sent' + not_message , 'progress': 75, 'icon': 'fa fa-check'}); }, 400);
				var url = 'http://' + window.location.hostname + window.location.pathname;

				setTimeout(function() {
					window.location.href =  url.replace('/application', '') + next_page;
				}, 3000);
				return false;
			} else {
				setTimeout(function() { notify.update({'type': 'danger', 'message': '<strong>Error:</strong> ' + json.error.message, 'progress': 25, 'icon': 'fa fa-close'}); }, 500);
			}
		});
	} else {
		setTimeout(function() { notify.update({'type': 'danger', 'message': '<strong>Error:</strong> Please fill all the required fields.', 'progress': 25, 'icon': 'fa fa-close'}); }, 300);
	}
}

// Attachments
function _applicationAttachment(form){
	var token = getParameterByName('token'),
		myBtn = form.find('.btn.btns'),
		text = _btnDisabler(myBtn, true),
		notify = jQuery.notify({ icon: 'fa fa-exclamation', message: 'Checking Attachments' },{ type: 'warning' });

	if($('#formAgree').is(":checked")){
		jQuery.post(base_path + "landing/process/check-application-attachment", jQuery('#attachmentForm').serialize(), function(data) {
			var json = jQuery.parseJSON(data);
			next_page = next_page + "?token=" + token;
			if(json.error.code == 000){
				var url = 'http://' + window.location.hostname + window.location.pathname;
				console.log(url);
				window.location.href =  url.replace('/attachment', '') + next_page;
			}
			setTimeout(function() { notify.update({'type': 'danger', 'message': '<strong>Error:</strong> ' + json.error.message, 'progress': 25, 'icon': 'fa fa-close'}); }, 500);
			_btnDisabler(myBtn, false, text);
			// jQuery('#error-message', document).html(json.error.message).show();
		});
	} else {
		notify.update({'type': 'warning', 'message': '<strong>Warning!</strong> Please check I agree!', 'progress': 0, 'icon': 'fa fa-close'});
		$('#formAgree')
			.focus();
		_btnDisabler(myBtn, false, text);
	}
	
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

/** To validate the form **/
function validateForm() {
	var isValid = true;
	$('.form-control[required]').each(function() {
		$(this).closest('.form-group').removeClass('has-error');
		if ( $(this).val() === '' ){
			$(this).closest('.form-group').addClass('has-error');
			isValid = false;
		} else $(this).closest('.form-group').removeClass('has-error');
	});
	return isValid;
}

function _lp_notifiction(){
	
}


