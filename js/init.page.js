var itemID;
var thisURL = $('span#thisURL').html();
var thisModule = $('span#thisModule').html();
var thisMethod = $('span#thisMethod').html();
CMS.initShowGlobal = function() {
	$('.showGlobal').on('click', function() {
		if ($(this).attr('data-modID')) {
			itemID = $(this).attr('data-modID');
			itemID = itemID.replace("jdata", "");
		}
		var spanEl = $('span#' + $(this).attr('data-getDetails'));
		$('#globalModal div.modal-header h4').html(spanEl.attr('data-mtitle'));
		$('#globalModal div.modal-body div.row-fluid').html(spanEl.attr('data-mbody'));
		$('#globalModal div.modal-footer button.btn-primary').attr('data-yesFxn', spanEl.attr('data-myes'));
		if (spanEl.attr('data-optNo') != null) {
			$('#globalModal div.modal-footer span#optNo').text(spanEl.attr('data-optNo'));
		} else {
			$('#globalModal div.modal-footer span#optNo').text('No');
		}
		if (spanEl.attr('data-optYes') != null) {
			$('#globalModal div.modal-footer span#optYes').text(spanEl.attr('data-optYes'));
		} else {
			$('#globalModal div.modal-footer span#optYes').text('Yes');
		}
		$('#globalModal').fadeIn();
		$('#globalModal').modal();
	});
};
CMS.showNotification = function(type, message) {
	var html = '';
	$('div#notification').removeClass();
	$('div#notification').addClass('alert');
	html += '<button type="button" class="close" data-dismiss="alert"><i class="icon-remove"></i></button>';
	if (type == 'success') {
		$('div#notification').addClass('alert-success');
		html += '<strong><i class="icon-ok"></i>&nbsp;&nbsp;Well done! </strong>';
	} else if (type == 'error') {
		$('div#notification').addClass('alert-danger');
		html += '<strong><i class="icon-remove"></i>&nbsp;&nbsp;Oh snap! </strong>';
	} else if (type == 'warning') {
		$('div#notification').addClass('alert-warning');
		html += '<strong><i class="icon-warning-sign"></i>&nbsp;&nbsp;Warning! </strong>';
	} else {
		$('div#notification').addClass('alert-info');
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
	$('div#notification').html(html);
	$('div#notification').fadeIn(900);
	$('html, body').animate({
		scrollTop: 0
	}, 500);
	setTimeout(function() {
		$('div#notification').fadeOut(1000);
	}, 7000);
}
CMS.forcedRefresh = function() {
		$('a#forcedRefresh').attr('href', window.location.href);
		$('a#forcedRefresh').trigger('click');
	}
	//initialize data tables check all checkbox 
CMS.checkAll = function() {
	$('table th input:checkbox').on('click', function() {
		var that = this;
		$(this).closest('table').find('tr > td:first-child input:checkbox').each(function() {
			this.checked = that.checked;
			$(this).closest('tr').toggleClass('selected');
		});
	});
}
CMS.initDatePicker = function() {
	$('.date-picker').datepicker({
		format: "MM dd, yyyy",
		autoclose: true
	});
}
CMS.enableFields = function(formID) {
	$('#btnEditForm').hide();
	$("#" + formID + " .fieldEditable").removeAttr('disabled');
}
CMS.disableFields = function(formID) {
	$('#btnEditForm').show();
	$("#" + formID + " .fieldEditable").attr('disabled', 'disabled');
}
CMS.clearFields = function(formID) {
	$("#" + formID + " #resetForm").trigger('click');
}
CMS.showWidge = function() {
	if ($('#widge').hasClass("hid")) {
		$('#widge').hide();
		$('#widge').removeClass("hid")
		$('#widge').slideDown(300);
	}
	$('html, body').animate({
		scrollTop: $(".page-content").offset().top
	}, 500);
	$('[data-rel=popover]').popover({
		container: 'body'
	});
	$('.amountOnly').on("change blur", function(e) {
		var val = $(this).val();
		var uncommafied = val.replace(/\,/g, '') * 1;
		var rgx = /(\d+)(\d{3})/;
		var split_text = uncommafied.toString().split('.');
		var x1 = split_text[0].toString();
		var x2 = split_text.length > 1 ? '.' + (split_text[1].toString() + '00').substring(0, 2) : '.00';
		while (rgx.test(x1)) {
			x1 = x1.replace(rgx, '$1' + ',' + '$2');
		}
		$(this).val(x1 + x2);
		$(this).data('oldVal', val);
	});
	$('.numbersOnly').keyup(function() {
		if (this.value != this.value.replace(/[^0-9\.]/g, '')) {
			this.value = this.value.replace(/[^0-9\.]/g, '');
		}
	});
	$('.textOnly').keyup(function() {
		if (this.value != this.value.replace(/[^a-z\s\.]/g, '')) {
			this.value = this.value.replace(/[^a-z\s\.]/g, '');
		}
	});
}
CMS.closeWidge = function() {
	$('#widge').slideUp(500);
	setTimeout(function() {
		$('#widge').addClass("hid");
	}, 600);
}
CMS.showHideFieldsU = function() {
	$('.showFields').unbind();
	$('.hideFields').unbind();
}
CMS.showHideFields = function() {
	$('.showFields').on('click', function() {
		$('div.divNotEdit').hide();
		$('div.divEdit').show();
	});
	$('.hideFields').on('click', function() {
		$('div.divNotEdit').show();
		$('div.divEdit').hide();
	});
}
CMS.updateConfigU = function() {
	$('button#btnEditForm').unbind();
	$('.closeWidge').unbind();
	$('#genSettingsForm').unbind();
}
CMS.updateConfig = function(details) {
	$('button#btnEditForm').on('click', function() {
		CMS.enableFields('genSettingsForm');
		$("div#formActions").removeClass('hid');
	});
	$('.closeWidge').on('click', function() {
		CMS.disableFields('genSettingsForm');
		$("div#formActions").addClass('hid');
	});
	$('#genSettingsForm').initFormSubmit([details[1], details[0], details[2]]);
	$('button#globalYes').on('click', function() {
		var fxnName = $(this).attr('data-yesFxn');
		eval(fxnName);
	});
}
CMS.commonUnbind = function() {
	$('.closeWidge').unbind();
	$('.showWidge').unbind();
	$("#dtAddRow").unbind();
	$('.editItem').unbind();
	$('button#btnEditForm').unbind();
	$('button#globalYes').unbind();
	$('#DT_Modules tbody td').unbind();
	$('a.setFormValues').unbind();
	var tables = $.fn.dataTable.fnTables(true);
	$(tables).each(function() {
		$(this).hide();
		$(this).dataTable().fnDestroy();
	});
}
CMS.common = function(details) {
	var rowNum;
	$('.closeWidge').on('click', function() {
		CMS.closeWidge();
		if ($('#dtAddRow').hasClass("hid")) {
			$('#dtAddRow').removeClass('hid');
		}
		CMS.disableFields(details[0]);
		$("div#formActions").addClass('hid');
	});
	$('.showWidge').on('click', function() {
		if (!$('#widgetItemActions').is(":visible")) {
			$('#widgetItemActions').show();
		}
		$('#widgetListBack').hide();
		CMS.disableFields(details[0]);
		CMS.showWidge();
		if (!$('#btnEditForm').is(":visible")) {
			$('#btnEditForm').show();
		}
	});
	$('.addReset').on('click', function() {
		$('#widgetItemActions').hide();
		$('#widgetListBack').show();
		$(this).addClass('hid');
		CMS.clearFields(details[0]);
		CMS.enableFields(details[0]);
		$("div#formActions").removeClass('hid');
		$('#' + details[0]).initFormSubmit([details[1], details[0], details[2]]);
	});
	$('#dtAddRow').on('click', function() {
		$('#widgetItemActions').hide();
		$('#widgetListBack').show();
		$(this).addClass('hid');
		CMS.clearFields(details[0]);
		CMS.enableFields(details[0]);
		$("div#formActions").removeClass('hid');
		$('#' + details[0]).initFormSubmit([details[1], details[0], details[2]]);
	});
	$('.editItem').on('click', function() {
		$('#btnEditForm').hide();
		CMS.enableFields(details[0]);
		$("div#formActions").removeClass('hid');
		$('#' + details[0]).initFormSubmit([details[3], details[0], details[4]]);
	});
	$('button#btnEditForm').on('click', function() {
		$('#btnEditForm').hide();
		CMS.enableFields(details[0]);
		$("div#formActions").removeClass('hid');
		$('#' + details[0]).initFormSubmit([details[3], details[0], details[4]]);
	});
	var dtElement = $('#' + details[8]).dataTable({
		"aaSorting": []
	});
	$('#' + details[8]).wrap('<div class="table-responsive"></div>');
	$('#' + details[8]).show();
	$('#DT_Generic tfoot th').each(function() {
		var title = $('#DT_Generic thead th').eq($(this).index()).text();
		if (title != '') $(this).html('<input type="text" placeholder="Search ' + title + '" />');
		else $(this).html('');
	});
	var table = $('#DT_Generic').DataTable();
	if ($('#DT_Generic').is(":visible")) {
		table.columns().eq(0).each(function(colIdx) {
			$('input', table.column(colIdx).footer()).on('keyup change', function() {
				table.column(colIdx).search(this.value).draw();
			});
		});
	}

	function clickTD() {
		$('#' + details[8] + ' tbody td').click(function() {
			var aPos = dtElement.fnGetPosition(this); // Get the position of the current data from the node
			rowNum = aPos[0];
			$(this).closest('tr').fadeOut(800);
		});
	}

	function deleteRow() {
		$('.closeWidge').trigger('click');
		var keyAndVal = details[7] + "=" + itemID;
		$('#globalModal .hideWhile').each(function() {
			$(this).hide();
		});
		$('img#sgLoader').removeClass('hid');
		$.post(details[5], keyAndVal, function(data) {
			setTimeout(function() {
				$('img#sgLoader').addClass('hid');
				$('#globalModal .hideWhile').each(function() {
					$(this).show();
				});
				$('#globalModal').fadeOut(1000);
				$('#globalModal').modal('hide');
			}, 3000);
			setTimeout(function() {
				if (data != 'false') {
					flag = true;
					try {
						dataJ = $.parseJSON(data);
					} catch (e) {
						flag = false;
					}
					if (flag && dataJ.error != null) {
						CMS.showNotification('error', dataJ.error);
					} else if (flag && dataJ.warning != null) {
						CMS.showNotification('warning', dataJ.warning);
					} else if (flag && dataJ.info != null) {
						CMS.showNotification('info', dataJ.info);
					} else {
						CMS.showNotification('success', details[6]);
						clickTD();
						$('td#jdata' + itemID).trigger('click');
						$('#' + details[8] + ' tbody td').unbind("click");
						setTimeout(function() {
							dtElement.fnDeleteRow(rowNum);
						}, 1200);
						if (details[9]) {
							CMS.forcedRefresh();
						}
					}
				} else {
					CMS.showNotification('error', 'Network Problem. Please try again.');
				}
			}, 3200);
		});
	}
	$('button#globalYes').on('click', function() {
		var fxnName = $(this).attr('data-yesFxn');
		eval(fxnName);
	});
	CMS.initDatePicker();
}
CMS.runSummernote = function(textedit) {
	$.each(textedit, function(index, value) {
		$('#' + value).summernote({
			onblur: function(e) {
				$("#" + value).val($('#' + value).code());
			},
			onImageUpload: function(files, editor, $editable) {
				sendFile(files[0], editor, $editable);
			}
		});
	});
}
$.fn.initFormSubmit = function(details) {
	$(this).unbind();
	$(this).on('submit', function(event) {
		$('#formActions .btn').each(function() {
			$(this).hide();
		});
		$('img#sgLoader_whitebg').removeClass('hid');
		$.post(details[0], $('#' + details[1]).serialize({
			checkboxesAsBools: true
		}), function(data) {
			setTimeout(function() {
				if (data != 'false') {
					flag = true;
					try {
						dataJ = $.parseJSON(data);
					} catch (e) {
						flag = false;
					}
					if (flag && dataJ.error != null) {
						CMS.showNotification('error', dataJ.error);
					} else if (flag && dataJ.warning != null) {
						CMS.showNotification('warning', dataJ.warning);
					} else if (flag && dataJ.info != null) {
						CMS.showNotification('info', dataJ.info);
					} else {
						CMS.showNotification('success', details[2]);
						CMS.forcedRefresh();
					}
				} else {
					CMS.showNotification('error', 'Network Problem. Please try again.');
				}
				$('#formActions .btn').each(function() {
					$(this).show();
				});
				$('img#sgLoader_whitebg').addClass('hid');
			}, 3000);
		});
		event.preventDefault();
	});
};

function sendFile(file, editor, welEditable) {
	data = new FormData();
	data.append("file", file);
	$.ajax({
		data: data,
		type: "POST",
		url: thisURL + thisModule + "/process/upload-cms-image",
		cache: false,
		contentType: false,
		processData: false,
		success: function(url) {
			try {
				var jsondata = $.parseJSON(url);
				if (typeof(jsondata.error) != 'undefined') {
					var jsondata = $.parseJSON(url);
					CMS.showNotification('danger', jsondata.error);
				} else {
					editor.insertImage(welEditable, url);
				}
			} catch (e) {
				editor.insertImage(welEditable, url);
			}
		}
	});
}