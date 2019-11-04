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