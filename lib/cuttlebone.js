/// <reference path="../typings/tsd.d.ts"/>
var cuttlebone;
(function (cuttlebone) {
    var PNG = (function () {
        function PNG(data) {
        }
        return PNG;
    })();
    cuttlebone.PNG = PNG;
})(cuttlebone || (cuttlebone = {}));
/// <reference path="../tsd/pako/pako.d.ts"/>
// oriinal: https://github.com/arian/pngjs
var cuttlebone;
(function (cuttlebone) {
    function equalBytes(a, b) {
        if (a.length != b.length)
            return false;
        for (var l = a.length; l--;)
            if (a[l] != b[l])
                return false;
        return true;
    }
    function readUInt32(buffer, offset) {
        return (buffer[offset] << 24) +
            (buffer[offset + 1] << 16) +
            (buffer[offset + 2] << 8) +
            (buffer[offset + 3] << 0);
    }
    function readUInt16(buffer, offset) {
        return (buffer[offset + 1] << 8) + (buffer[offset] << 0);
    }
    function readUInt8(buffer, offset) {
        return buffer[offset] << 0;
    }
    function bufferToString(buffer) {
        var str = '';
        for (var i = 0; i < buffer.length; i++) {
            str += String.fromCharCode(buffer[i]);
        }
        return str;
    }
    var PNGReader = (function () {
        function PNGReader(data) {
            // bytes buffer
            this.bytes = new Uint8Array(data);
            // current pointer
            this.i = 0;
            this.dataChunks = [];
            // Output object
            this.png = new PNG();
        }
        PNGReader.prototype.readBytes = function (length) {
            var end = this.i + length;
            if (end > this.bytes.length) {
                throw new Error('Unexpectedly reached end of file');
            }
            var bytes = this.bytes.subarray(this.i, end);
            this.i = end;
            return bytes;
        };
        /**
         * http://www.w3.org/TR/2003/REC-PNG-20031110/#5PNG-file-signature
         */
        PNGReader.prototype.decodeHeader = function () {
            if (this.i !== 0) {
                throw new Error('file pointer should be at 0 to read the header');
            }
            var header = this.readBytes(8);
            if (!equalBytes(header, new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) {
                throw new Error('invalid PNGReader file (bad signature)');
            }
            this.header = header;
        };
        /**
         * http://www.w3.org/TR/2003/REC-PNG-20031110/#5Chunk-layout
         *
         * length =  4      bytes
         * type   =  4      bytes (IHDR, PLTE, IDAT, IEND or others)
         * chunk  =  length bytes
         * crc    =  4      bytes
         */
        PNGReader.prototype.decodeChunk = function () {
            var length = readUInt32(this.readBytes(4), 0);
            if (length < 0) {
                throw new Error('Bad chunk length ' + (0xFFFFFFFF & length));
            }
            var type = bufferToString(this.readBytes(4));
            var chunk = this.readBytes(length);
            var crc = this.readBytes(4);
            switch (type) {
                case 'IHDR':
                    this.decodeIHDR(chunk);
                    break;
                case 'PLTE':
                    this.decodePLTE(chunk);
                    break;
                case 'IDAT':
                    this.decodeIDAT(chunk);
                    break;
                case 'IEND':
                    this.decodeIEND(chunk);
                    break;
            }
            return type;
        };
        /**
         * http://www.w3.org/TR/2003/REC-PNG-20031110/#11IHDR
         * http://www.libpng.org/pub/png/spec/1.2/png-1.2-pdg.html#C.IHDR
         *
         * Width               4 bytes
         * Height              4 bytes
         * Bit depth           1 byte
         * Colour type         1 byte
         * Compression method  1 byte
         * Filter method       1 byte
         * Interlace method    1 byte
         */
        PNGReader.prototype.decodeIHDR = function (chunk) {
            var png = this.png;
            png.setWidth(readUInt32(chunk, 0));
            png.setHeight(readUInt32(chunk, 4));
            png.setBitDepth(readUInt8(chunk, 8));
            png.setColorType(readUInt8(chunk, 9));
            png.setCompressionMethod(readUInt8(chunk, 10));
            png.setFilterMethod(readUInt8(chunk, 11));
            png.setInterlaceMethod(readUInt8(chunk, 12));
        };
        /**
         *
         * http://www.w3.org/TR/PNG/#11PLTE
         */
        PNGReader.prototype.decodePLTE = function (chunk) {
            this.png.setPalette(chunk);
        };
        /**
         * http://www.w3.org/TR/2003/REC-PNG-20031110/#11IDAT
         */
        PNGReader.prototype.decodeIDAT = function (chunk) {
            // multiple IDAT chunks will concatenated
            this.dataChunks.push(chunk);
        };
        /**
         * http://www.w3.org/TR/2003/REC-PNG-20031110/#11IEND
         */
        PNGReader.prototype.decodeIEND = function (chunk) {
        };
        /**
         * Uncompress IDAT chunks
         */
        PNGReader.prototype.decodePixels = function () {
            var png = this.png;
            var length = 0;
            var i = 0;
            var j = 0;
            var k = 0;
            var l = 0;
            for (l = this.dataChunks.length; l--;)
                length += this.dataChunks[l].length;
            var data = new Uint8Array(new ArrayBuffer(length));
            console.log(data, length);
            for (i = 0, k = 0, l = this.dataChunks.length; i < l; i++) {
                var chunk = this.dataChunks[i];
                for (j = 0; j < chunk.length; j++)
                    data[k++] = chunk[j];
            }
            try {
                var _data = pako.inflate(data);
            }
            catch (err) {
                throw new Error(err || "pako: uncompress error");
            }
            if (png.getInterlaceMethod() === 0) {
                this.interlaceNone(_data);
            }
            else {
                this.interlaceAdam7(_data);
            }
        };
        // Different interlace methods
        PNGReader.prototype.interlaceNone = function (data) {
            var png = this.png;
            // bytes per pixel
            var bpp = Math.max(1, png.colors * png.bitDepth / 8);
            // color bytes per row
            var cpr = bpp * png.width;
            var pixels = new Uint8Array(new ArrayBuffer(bpp * png.width * png.height));
            var scanline;
            var offset = 0;
            for (var i = 0; i < data.length; i += cpr + 1) {
                scanline = data.subarray(i + 1, i + cpr + 1);
                switch (readUInt8(data, i)) {
                    case 0:
                        this.unFilterNone(scanline, pixels, bpp, offset, cpr);
                        break;
                    case 1:
                        this.unFilterSub(scanline, pixels, bpp, offset, cpr);
                        break;
                    case 2:
                        this.unFilterUp(scanline, pixels, bpp, offset, cpr);
                        break;
                    case 3:
                        this.unFilterAverage(scanline, pixels, bpp, offset, cpr);
                        break;
                    case 4:
                        this.unFilterPaeth(scanline, pixels, bpp, offset, cpr);
                        break;
                    default: throw new Error("unkown filtered scanline");
                }
                offset += cpr;
            }
            png.pixels = pixels;
        };
        PNGReader.prototype.interlaceAdam7 = function (data) {
            throw new Error("Adam7 interlacing is not implemented yet");
        };
        ;
        // Unfiltering
        /**
         * No filtering, direct copy
         */
        PNGReader.prototype.unFilterNone = function (scanline, pixels, bpp, offset, length) {
            for (var i = 0, to = length; i < to; i++) {
                pixels[offset + i] = scanline[i];
            }
        };
        /**
         * The Sub() filter transmits the difference between each byte and the value
         * of the corresponding byte of the prior pixel.
         * Sub(x) = Raw(x) + Raw(x - bpp)
         */
        PNGReader.prototype.unFilterSub = function (scanline, pixels, bpp, offset, length) {
            var i = 0;
            for (; i < bpp; i++)
                pixels[offset + i] = scanline[i];
            for (; i < length; i++) {
                // Raw(x) + Raw(x - bpp)
                pixels[offset + i] = (scanline[i] + pixels[offset + i - bpp]) & 0xFF;
            }
        };
        /**
         * The Up() filter is just like the Sub() filter except that the pixel
         * immediately above the current pixel, rather than just to its left, is used
         * as the predictor.
         * Up(x) = Raw(x) + Prior(x)
         */
        PNGReader.prototype.unFilterUp = function (scanline, pixels, bpp, offset, length) {
            var i = 0;
            var byte;
            var prev;
            // Prior(x) is 0 for all x on the first scanline
            if ((offset - length) < 0)
                for (; i < length; i++) {
                    pixels[offset + i] = scanline[i];
                }
            else
                for (; i < length; i++) {
                    // Raw(x)
                    byte = scanline[i];
                    // Prior(x)
                    prev = pixels[offset + i - length];
                    pixels[offset + i] = (byte + prev) & 0xFF;
                }
        };
        /**
         * The Average() filter uses the average of the two neighboring pixels (left
         * and above) to predict the value of a pixel.
         * Average(x) = Raw(x) + floor((Raw(x-bpp)+Prior(x))/2)
         */
        PNGReader.prototype.unFilterAverage = function (scanline, pixels, bpp, offset, length) {
            var i = 0;
            var byte;
            var prev;
            var prior;
            if ((offset - length) < 0) {
                // Prior(x) == 0 && Raw(x - bpp) == 0
                for (; i < bpp; i++) {
                    pixels[offset + i] = scanline[i];
                }
                // Prior(x) == 0 && Raw(x - bpp) != 0 (right shift, prevent doubles)
                for (; i < length; i++) {
                    pixels[offset + i] = (scanline[i] + (pixels[offset + i - bpp] >> 1)) & 0xFF;
                }
            }
            else {
                // Prior(x) != 0 && Raw(x - bpp) == 0
                for (; i < bpp; i++) {
                    pixels[offset + i] = (scanline[i] + (pixels[offset - length + i] >> 1)) & 0xFF;
                }
                // Prior(x) != 0 && Raw(x - bpp) != 0
                for (; i < length; i++) {
                    byte = scanline[i];
                    prev = pixels[offset + i - bpp];
                    prior = pixels[offset + i - length];
                    pixels[offset + i] = (byte + (prev + prior >> 1)) & 0xFF;
                }
            }
        };
        /**
         * The Paeth() filter computes a simple linear function of the three
         * neighboring pixels (left, above, upper left), then chooses as predictor
         * the neighboring pixel closest to the computed value. This technique is due
         * to Alan W. Paeth.
         * Paeth(x) = Raw(x) +
         *            PaethPredictor(Raw(x-bpp), Prior(x), Prior(x-bpp))
         *  function PaethPredictor (a, b, c)
         *  begin
         *       ; a = left, b = above, c = upper left
         *       p := a + b - c        ; initial estimate
         *       pa := abs(p - a)      ; distances to a, b, c
         *       pb := abs(p - b)
         *       pc := abs(p - c)
         *       ; return nearest of a,b,c,
         *       ; breaking ties in order a,b,c.
         *       if pa <= pb AND pa <= pc then return a
         *       else if pb <= pc then return b
         *       else return c
         *  end
         */
        PNGReader.prototype.unFilterPaeth = function (scanline, pixels, bpp, offset, length) {
            var i = 0;
            var raw;
            var a;
            var b;
            var c;
            var p;
            var pa;
            var pb;
            var pc;
            var pr;
            if ((offset - length) < 0) {
                // Prior(x) == 0 && Raw(x - bpp) == 0
                for (; i < bpp; i++) {
                    pixels[offset + i] = scanline[i];
                }
                // Prior(x) == 0 && Raw(x - bpp) != 0
                // paethPredictor(x, 0, 0) is always x
                for (; i < length; i++) {
                    pixels[offset + i] = (scanline[i] + pixels[offset + i - bpp]) & 0xFF;
                }
            }
            else {
                // Prior(x) != 0 && Raw(x - bpp) == 0
                // paethPredictor(x, 0, 0) is always x
                for (; i < bpp; i++) {
                    pixels[offset + i] = (scanline[i] + pixels[offset + i - length]) & 0xFF;
                }
                // Prior(x) != 0 && Raw(x - bpp) != 0
                for (; i < length; i++) {
                    raw = scanline[i];
                    a = pixels[offset + i - bpp];
                    b = pixels[offset + i - length];
                    c = pixels[offset + i - length - bpp];
                    p = a + b - c;
                    pa = Math.abs(p - a);
                    pb = Math.abs(p - b);
                    pc = Math.abs(p - c);
                    if (pa <= pb && pa <= pc)
                        pr = a;
                    else if (pb <= pc)
                        pr = b;
                    else
                        pr = c;
                    pixels[offset + i] = (raw + pr) & 0xFF;
                }
            }
        };
        PNGReader.prototype.parse = function (options) {
            options = options || { data: false };
            this.decodeHeader();
            while (this.i < this.bytes.length) {
                var type = this.decodeChunk();
                // stop after IHDR chunk, or after IEND
                if (type == 'IHDR' && options.data === false || type == 'IEND')
                    break;
            }
            var png = this.png;
            this.decodePixels();
            return this.png;
        };
        return PNGReader;
    })();
    cuttlebone.PNGReader = PNGReader;
    var PNG = (function () {
        function PNG() {
            this.width = 0;
            this.height = 0;
            this.bitDepth = 0;
            this.colorType = 0;
            this.compressionMethod = 0;
            this.filterMethod = 0;
            this.interlaceMethod = 0;
            this.colors = 0;
            this.alpha = false;
            this.pixelBits = 0;
            this.palette = null;
            this.pixels = null;
        }
        PNG.prototype.getWidth = function () {
            return this.width;
        };
        PNG.prototype.setWidth = function (width) {
            this.width = width;
        };
        PNG.prototype.getHeight = function () {
            return this.height;
        };
        PNG.prototype.setHeight = function (height) {
            this.height = height;
        };
        PNG.prototype.getBitDepth = function () {
            return this.bitDepth;
        };
        PNG.prototype.setBitDepth = function (bitDepth) {
            if ([2, 4, 8, 16].indexOf(bitDepth) === -1) {
                throw new Error("invalid bith depth " + bitDepth);
            }
            this.bitDepth = bitDepth;
        };
        PNG.prototype.getColorType = function () {
            return this.colorType;
        };
        PNG.prototype.setColorType = function (colorType) {
            //   Color    Allowed    Interpretation
            //   Type    Bit Depths
            //
            //   0       1,2,4,8,16  Each pixel is a grayscale sample.
            //
            //   2       8,16        Each pixel is an R,G,B triple.
            //
            //   3       1,2,4,8     Each pixel is a palette index;
            //                       a PLTE chunk must appear.
            //
            //   4       8,16        Each pixel is a grayscale sample,
            //                       followed by an alpha sample.
            //
            //   6       8,16        Each pixel is an R,G,B triple,
            //                       followed by an alpha sample.
            var colors = 0, alpha = false;
            switch (colorType) {
                case 0:
                    colors = 1;
                    break;
                case 2:
                    colors = 3;
                    break;
                case 3:
                    colors = 1;
                    break;
                case 4:
                    colors = 2;
                    alpha = true;
                    break;
                case 6:
                    colors = 4;
                    alpha = true;
                    break;
                default: throw new Error("invalid color type");
            }
            this.colors = colors;
            this.alpha = alpha;
            this.colorType = colorType;
        };
        PNG.prototype.getCompressionMethod = function () {
            return this.compressionMethod;
        };
        ;
        PNG.prototype.setCompressionMethod = function (compressionMethod) {
            if (compressionMethod !== 0) {
                throw new Error("invalid compression method " + compressionMethod);
            }
            this.compressionMethod = compressionMethod;
        };
        ;
        PNG.prototype.getFilterMethod = function () {
            return this.filterMethod;
        };
        ;
        PNG.prototype.setFilterMethod = function (filterMethod) {
            if (filterMethod !== 0) {
                throw new Error("invalid filter method " + filterMethod);
            }
            this.filterMethod = filterMethod;
        };
        ;
        PNG.prototype.getInterlaceMethod = function () {
            return this.interlaceMethod;
        };
        ;
        PNG.prototype.setInterlaceMethod = function (interlaceMethod) {
            if (interlaceMethod !== 0 && interlaceMethod !== 1) {
                throw new Error("invalid interlace method " + interlaceMethod);
            }
            this.interlaceMethod = interlaceMethod;
        };
        ;
        PNG.prototype.setPalette = function (palette) {
            if (palette.length % 3 !== 0) {
                throw new Error("incorrect PLTE chunk length");
            }
            if (palette.length > (Math.pow(2, this.bitDepth) * 3)) {
                throw new Error("palette has more colors than 2^bitdepth");
            }
            this.palette = palette;
        };
        ;
        PNG.prototype.getPalette = function () {
            return this.palette;
        };
        ;
        /**
         * get the pixel color on a certain location in a normalized way
         * result is an array: [red, green, blue, alpha]
         */
        PNG.prototype.getPixel = function (x, y) {
            if (!this.pixels)
                throw new Error("pixel data is empty");
            if (x >= this.width || y >= this.height) {
                throw new Error("x,y position out of bound");
            }
            var i = this.colors * this.bitDepth / 8 * (y * this.width + x);
            var pixels = this.pixels;
            switch (this.colorType) {
                case 0: return [pixels[i], pixels[i], pixels[i], 255];
                case 2: return [pixels[i], pixels[i + 1], pixels[i + 2], 255];
                case 3: return [
                    this.palette[pixels[i] * 3 + 0],
                    this.palette[pixels[i] * 3 + 1],
                    this.palette[pixels[i] * 3 + 2],
                    255];
                case 4: return [pixels[i], pixels[i], pixels[i], pixels[i + 1]];
                case 6: return [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]];
            }
        };
        ;
        return PNG;
    })();
    cuttlebone.PNG = PNG;
})(cuttlebone || (cuttlebone = {}));
/// <reference path="SurfaceRender.ts"/>
/// <reference path="SurfaceUtil.ts"/>
var cuttlebone;
(function (cuttlebone) {
    var Surface = (function () {
        function Surface(canvas, scopeId, surfaceId, surfaceName, surfaces) {
            var _this = this;
            this.element = canvas;
            this.scopeId = scopeId;
            this.surfaceId = surfaceId;
            this.surfaceName = surfaceName;
            this.surfaces = surfaces;
            var srf = this.surfaces[surfaceName];
            if (!srf)
                throw new Error(surfaceName + " is not found in surfaces");
            if (!srf.baseSurface)
                console.warn("baseSurface is not found", this);
            this.baseSurface = srf.baseSurface;
            this.regions = srf.regions || {};
            this.animations = srf.animations || {};
            this.bufferCanvas = cuttlebone.SurfaceUtil.copy(this.baseSurface);
            this.stopFlags = {};
            this.layers = {};
            this.destructed = false;
            this.talkCount = 0;
            this.talkCounts = {};
            this.isPointerEventsShimed = false;
            this.isRegionVisible = false;
            this.lastEventType = "";
            this.element.addEventListener("contextmenu", function (ev) { return _this.processMouseEvent(ev, "mouseclick", function (ev) { return _this.element.dispatchEvent(ev); }); });
            this.element.addEventListener("click", function (ev) { return _this.processMouseEvent(ev, "mouseclick", function (ev) { return _this.element.dispatchEvent(ev); }); });
            this.element.addEventListener("dblclick", function (ev) { return _this.processMouseEvent(ev, "mousedblclick", function (ev) { return _this.element.dispatchEvent(ev); }); });
            this.element.addEventListener("mousedown", function (ev) { return _this.processMouseEvent(ev, "mousedown", function (ev) { return _this.element.dispatchEvent(ev); }); });
            this.element.addEventListener("mousemove", function (ev) { return _this.processMouseEvent(ev, "mousemove", function (ev) { return _this.element.dispatchEvent(ev); }); });
            this.element.addEventListener("mouseup", function (ev) { return _this.processMouseEvent(ev, "mouseup", function (ev) { return _this.element.dispatchEvent(ev); }); });
            var tid = 0;
            var touchCount = 0;
            var touchStartTime = 0;
            this.element.addEventListener("touchmove", function (ev) { return _this.processMouseEvent(ev, "mousemove", function (ev) { return _this.element.dispatchEvent(ev); }); });
            this.element.addEventListener("touchend", function (ev) {
                _this.processMouseEvent(ev, "mouseup", function (ev) { return _this.element.dispatchEvent(ev); });
                _this.processMouseEvent(ev, "mouseclick", function (ev) { return _this.element.dispatchEvent(ev); });
                if (Date.now() - touchStartTime < 500 && touchCount % 2 === 0) {
                    _this.processMouseEvent(ev, "mousedblclick", function (ev) { return _this.element.dispatchEvent(ev); });
                }
            });
            this.element.addEventListener("touchstart", function (ev) {
                touchCount++;
                touchStartTime = Date.now();
                _this.processMouseEvent(ev, "mousedown", function (ev) { return _this.element.dispatchEvent(ev); });
                clearTimeout(tid);
                tid = setTimeout((function () { return touchCount = 0; }), 500);
            });
            Object.keys(this.animations).forEach(function (name) {
                var _a = _this.animations[name], animationId = _a.is, interval = _a.interval, patterns = _a.patterns;
                interval = interval || "";
                var tmp = interval.split(",");
                interval = tmp[0];
                var n = Number(tmp.slice(1).join(","));
                switch (interval) {
                    case "sometimes":
                        cuttlebone.SurfaceUtil.random((function (callback) { if (!_this.destructed && !_this.stopFlags[animationId]) {
                            _this.play(animationId, callback);
                        } }), 2);
                        break;
                    case "rarely":
                        cuttlebone.SurfaceUtil.random((function (callback) { if (!_this.destructed && !_this.stopFlags[animationId]) {
                            _this.play(animationId, callback);
                        } }), 4);
                        break;
                    case "random":
                        cuttlebone.SurfaceUtil.random((function (callback) { if (!_this.destructed && !_this.stopFlags[animationId]) {
                            _this.play(animationId, callback);
                        } }), n);
                        break;
                    case "periodic":
                        cuttlebone.SurfaceUtil.periodic((function (callback) { if (!_this.destructed && !_this.stopFlags[animationId]) {
                            _this.play(animationId, callback);
                        } }), n);
                        break;
                    case "always":
                        cuttlebone.SurfaceUtil.always((function (callback) { if (!_this.destructed && !_this.stopFlags[animationId]) {
                            _this.play(animationId, callback);
                        } }));
                        break;
                    case "runonce":
                        _this.play(animationId);
                        break;
                    case "never": break;
                    case "bind": break;
                    case "yen-e": break;
                    case "talk":
                        _this.talkCounts[name] = n;
                        break;
                    default:
                        if (/^bind(?:\+(\d+))/.test(interval)) {
                        }
                        else {
                            console.warn(_this.animations[name]);
                        }
                }
            });
            this.render();
        }
        Surface.prototype.destructor = function () {
            var srfRdr = new cuttlebone.SurfaceRender(this.element);
            srfRdr.clear();
            //$(@element).off() # g.c.
            this.destructed = true;
            this.layers = {};
        };
        Surface.prototype.render = function () { };
        Surface.prototype.talk = function () { };
        Surface.prototype.yenE = function () { };
        Surface.prototype.play = function (animationId, callback) { };
        Surface.prototype.stop = function (animationId) {
            this.stopFlags[animationId] = true;
        };
        Surface.prototype.bind = function (animationId) {
            var _this = this;
            var hit = Object.keys(this.animations).filter(function (name) { return _this.animations[name].is === animationId; })[0];
            if (!hit)
                return;
            var anim = this.animations[hit];
            if (anim.patterns.length === 0)
                return;
            var interval = anim.interval;
            var pattern = anim.patterns[anim.patterns.length - 1];
            this.layers[anim.is] = pattern;
            this.render();
            if (/^bind(?:\+(\d+))/.test(interval)) {
                var animIds = interval.split("+").slice(1);
                animIds.forEach(function (animId) { return _this.play(Number(animId)); });
            }
        };
        Surface.prototype.unbind = function (animationId) {
            delete this.layers[animationId];
        };
        Surface.prototype.processMouseEvent = function (ev, eventName, callback) {
        };
        return Surface;
    })();
    cuttlebone.Surface = Surface;
})(cuttlebone || (cuttlebone = {}));
/// <reference path="../typings/tsd.d.ts"/>
/// <reference path="SurfaceUtil.ts"/>
/// <reference path="SurfaceRender.ts"/>
/// <reference path="../tsd/SurfacesTxt2Yaml/SurfacesTxt2Yaml.d.ts"/>
var cuttlebone;
(function (cuttlebone) {
    var SurfaceCacheManager = (function () {
        function SurfaceCacheManager(surfaces, directory) {
            this.surfaces = surfaces;
            this.directory = directory;
            this.baseSurfaceCaches = [];
        }
        SurfaceCacheManager.prototype.load = function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                resolve(Promise.resolve(_this));
            });
        };
        SurfaceCacheManager.prototype.isCached = function (surfaceId) {
            return !!this.baseSurfaceCaches[surfaceId];
        };
        SurfaceCacheManager.prototype.getSurfaceFilename = function (surfaceId) {
            var reg = /^surface(\d+)\.png$/i;
            return Object.keys(this.directory)
                .filter(function (filename) { return reg.test(filename); })
                .filter(function (filename) { return surfaceId === Number(reg.exec(filename)[1]); })[0] || "";
        };
        SurfaceCacheManager.prototype.getPNAFilename = function (filename) {
            var pnafilename = filename.replace(/\.png$/i, ".pna");
            var reg = new RegExp(pnafilename, "i");
            return Object.keys(this.directory)
                .filter(function (filename) { return reg.test(filename); })[0] || "";
        };
        SurfaceCacheManager.prototype.getSurfaceDefinition = function (surfaceId) {
            var _this = this;
            var hits = Object.keys(this.surfaces.surfaces).filter(function (key) { return _this.surfaces.surfaces[key].is === surfaceId; });
            return this.surfaces.surfaces[hits[0]];
        };
        SurfaceCacheManager.prototype.fetchSurfaceImage = function (filename) {
            var _this = this;
            var pnafilename = this.getPNAFilename(filename);
            var cnv = document.createElement("canvas");
            cnv.width = 0;
            cnv.height = 0;
            var render = new cuttlebone.SurfaceRender(cnv);
            return new Promise(function (resolve, reject) {
                cuttlebone.SurfaceUtil.fetchImageFromArrayBuffer(_this.directory[filename]).then(function (img) {
                    render.init(img);
                    if (pnafilename.length === 0) {
                        render.chromakey();
                        return resolve(Promise.resolve(render)); // type hack
                    }
                    cuttlebone.SurfaceUtil.fetchImageFromArrayBuffer(_this.directory[pnafilename]).then(function (pna) {
                        render.pna(cuttlebone.SurfaceUtil.copy(pna));
                        resolve(Promise.resolve(render)); // type hack
                    });
                });
            });
        };
        SurfaceCacheManager.prototype.fetchBaseSurface = function (surfaceId) {
            var _this = this;
            if (this.isCached(surfaceId)) {
                return Promise.resolve(this.baseSurfaceCaches[surfaceId]);
            }
            var surfaceDef = this.getSurfaceDefinition(surfaceId);
            var baseSurfaceFilename = this.getSurfaceFilename(surfaceId);
            return this.fetchSurfaceImage(baseSurfaceFilename).then(function (render) {
                //render.composeElements();
                _this.baseSurfaceCaches[surfaceId] = render.cnv;
                return Promise.resolve(_this.baseSurfaceCaches[surfaceId]);
            });
        };
        return SurfaceCacheManager;
    })();
    cuttlebone.SurfaceCacheManager = SurfaceCacheManager;
})(cuttlebone || (cuttlebone = {}));
/// <reference path="../typings/tsd.d.ts"/>
var cuttlebone;
(function (cuttlebone) {
    var SurfaceRender = (function () {
        function SurfaceRender(cnv) {
            this.cnv = cnv;
            this.ctx = cnv.getContext("2d");
        }
        SurfaceRender.prototype.composeElements = function (elements) {
            if (elements.length === 0) {
                return;
            }
            var _a = elements[0], canvas = _a.canvas, type = _a.type, x = _a.x, y = _a.y;
            var offsetX = 0;
            var offsetY = 0;
            switch (type) {
                case "base":
                    this.base(canvas, offsetX, offsetY);
                    break;
                case "overlay":
                    this.overlay(canvas, offsetX + x, offsetY + y);
                    break;
                case "overlayfast":
                    this.overlayfast(canvas, offsetX + x, offsetY + y);
                    break;
                case "replace":
                    this.replace(canvas, offsetX + x, offsetY + y);
                    break;
                case "add":
                    this.overlayfast(canvas, offsetX + x, offsetY + y);
                    break;
                case "bind":
                    this.overlayfast(canvas, offsetX + x, offsetY + y);
                    break;
                case "interpolate":
                    this.interpolate(canvas, offsetX + x, offsetY + y);
                    break;
                case "move":
                    offsetX = x;
                    offsetY = y;
                    var copyed = cuttlebone.SurfaceUtil.copy(this.cnv);
                    this.base(copyed, offsetX, offsetY);
                    break;
                default:
                    console.error(elements[0]);
            }
            this.composeElements(elements.slice(1));
        };
        SurfaceRender.prototype.clear = function () {
            this.cnv.width = this.cnv.width;
        };
        SurfaceRender.prototype.chromakey = function () {
            var ctx = this.cnv.getContext("2d");
            var imgdata = ctx.getImageData(0, 0, this.cnv.width, this.cnv.height);
            var data = imgdata.data;
            var r = data[0], g = data[1], b = data[2], a = data[3];
            var i = 0;
            if (a !== 0) {
                while (i < data.length) {
                    if (r === data[i] && g === data[i + 1] && b === data[i + 2]) {
                        data[i + 3] = 0;
                    }
                    i += 4;
                }
            }
            ctx.putImageData(imgdata, 0, 0);
        };
        SurfaceRender.prototype.pna = function (pna) {
            var ctxB = pna.getContext("2d");
            var imgdataA = this.ctx.getImageData(0, 0, this.cnv.width, this.cnv.height);
            var imgdataB = ctxB.getImageData(0, 0, pna.width, pna.height);
            var dataA = imgdataA.data;
            var dataB = imgdataB.data;
            var i = 0;
            while (i < dataA.length) {
                dataA[i + 3] = dataB[i];
                i += 4;
            }
            this.ctx.putImageData(imgdataA, 0, 0);
        };
        SurfaceRender.prototype.base = function (part, x, y) {
            this.clear();
            this.init(part);
        };
        SurfaceRender.prototype.overlay = function (part, x, y) {
            if (this.cnv.width < part.width || this.cnv.height < part.height) {
                this.base(part, x, y); // 下のレイヤ消えてpartから描画されるんじゃね？
            }
            else {
                this.overlayfast(part, x, y);
            }
        };
        SurfaceRender.prototype.overlayfast = function (part, x, y) {
            this.ctx.globalCompositeOperation = "source-over";
            this.ctx.drawImage(part, x, y);
        };
        SurfaceRender.prototype.interpolate = function (part, x, y) {
            this.ctx.globalCompositeOperation = "destination-over";
            this.ctx.drawImage(part, x, y);
        };
        SurfaceRender.prototype.replace = function (part, x, y) {
            this.ctx.clearRect(x, y, part.width, part.height);
            this.overlayfast(part, x, y);
        };
        SurfaceRender.prototype.init = function (cnv) {
            this.cnv.width = cnv.width;
            this.cnv.height = cnv.height;
            this.overlayfast(cnv, 0, 0); // type hack
        };
        SurfaceRender.prototype.drawRegion = function (region) {
            var type = region.type, name = region.name, left = region.left, top = region.top, right = region.right, bottom = region.bottom, coordinates = region.coordinates, radius = region.radius, center_x = region.center_x, center_y = region.center_y;
            this.ctx.strokeStyle = "#00FF00";
            switch (type) {
                case "rect":
                    this.ctx.rect(left, top, right - left, bottom - top);
                    break;
                case "ellipse":
                    this.ctx.rect(left, top, right - left, bottom - top);
                    break;
                case "circle":
                    this.ctx.rect(left, top, right - left, bottom - top);
                    break;
                case "polygon":
                    this.ctx.rect(left, top, right - left, bottom - top);
            }
            this.ctx.stroke();
            this.ctx.font = "35px";
            this.ctx.strokeStyle = "white";
            this.ctx.strokeText(type + ":" + name, left + 5, top + 10);
            this.ctx.fillStyle = "black";
            this.ctx.fillText(type + ":" + name, left + 5, top + 10);
        };
        return SurfaceRender;
    })();
    cuttlebone.SurfaceRender = SurfaceRender;
})(cuttlebone || (cuttlebone = {}));
/// <reference path="../typings/tsd.d.ts"/>
var cuttlebone;
(function (cuttlebone) {
    var SurfaceUtil;
    (function (SurfaceUtil) {
        function choice(arr) {
            return arr[Math.round(Math.random() * (arr.length - 1))];
        }
        SurfaceUtil.choice = choice;
        function copy(cnv) {
            var copy = document.createElement("canvas");
            var ctx = copy.getContext("2d");
            copy.width = cnv.width;
            copy.height = cnv.height;
            ctx.drawImage(cnv, 0, 0); // type hack
            return copy;
        }
        SurfaceUtil.copy = copy;
        function fetchImageFromArrayBuffer(buffer, mimetype) {
            var url = URL.createObjectURL(new Blob([buffer], { type: mimetype || "image/png" }));
            return fetchImageFromURL(url).then(function (img) {
                URL.revokeObjectURL(url);
                return Promise.resolve(img);
            });
        }
        SurfaceUtil.fetchImageFromArrayBuffer = fetchImageFromArrayBuffer;
        function fetchImageFromURL(url) {
            var img = new Image;
            img.src = url;
            return new Promise(function (resolve, reject) {
                img.addEventListener("load", function () {
                    resolve(Promise.resolve(img)); // type hack
                });
                img.addEventListener("error", function (ev) {
                    reject(ev.error);
                });
            });
        }
        SurfaceUtil.fetchImageFromURL = fetchImageFromURL;
        function random(callback, probability) {
            var ms = 1;
            while (Math.round(Math.random() * 1000) > 1000 / probability) {
                ms++;
            }
            setTimeout((function () {
                return callback(function () { return random(callback, probability); });
            }), ms * 1000);
        }
        SurfaceUtil.random = random;
        function periodic(callback, sec) {
            setTimeout((function () {
                return callback(function () {
                    return periodic(callback, sec);
                });
            }), sec * 1000);
        }
        SurfaceUtil.periodic = periodic;
        function always(callback) {
            callback(function () { return always(callback); });
        }
        SurfaceUtil.always = always;
        function isHit(cnv, x, y) {
            var ctx = cnv.getContext("2d");
            var imgdata = ctx.getImageData(0, 0, x + 1, y + 1);
            var data = imgdata.data;
            return data[data.length - 1] !== 0;
        }
        SurfaceUtil.isHit = isHit;
        function offset(element) {
            var obj = element.getBoundingClientRect();
            return {
                left: obj.left + window.pageXOffset,
                top: obj.top + window.pageYOffset,
                width: Math.round(obj.width),
                height: Math.round(obj.height)
            };
        }
        SurfaceUtil.offset = offset;
        function elementFromPointWithout(element, pageX, pageY) {
            var tmp = element.style.display;
            element.style.display = "none";
            // elementを非表示にして直下の要素を調べる
            var elm = document.elementFromPoint(pageX, pageY);
            // 直下の要素がcanvasなら透明かどうか調べる
            // todo: cuttlebone管理下の要素かどうかの判定必要
            if (elm instanceof HTMLCanvasElement) {
                var _a = offset(elm), top = _a.top, left = _a.left;
                // 不透明ならヒット
                if (isHit(elm, pageX - left, pageY - top)) {
                    element.style.display = tmp;
                    return elm;
                }
            }
            // elementの非表示のままさらに下の要素を調べにいく
            if (elm instanceof HTMLElement) {
                var _elm = elementFromPointWithout(elm, pageX, pageY);
                element.style.display = tmp;
                return _elm;
            }
            // 解決できなかった！ザンネン!
            console.warn(elm);
            element.style.display = tmp;
            return null;
        }
        SurfaceUtil.elementFromPointWithout = elementFromPointWithout;
    })(SurfaceUtil = cuttlebone.SurfaceUtil || (cuttlebone.SurfaceUtil = {}));
})(cuttlebone || (cuttlebone = {}));
