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
            if (!Array.isArray(elements))
                throw new Error("TypeError: elements is not array.");
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
                    this.overlay(canvas, offsetX + x, offsetY + y);
                    break;
                case "bind":
                    this.overlay(canvas, offsetX + x, offsetY + y);
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
                case "asis":
                case "reduce":
                case "insert,ID":
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
            this.init(part);
        };
        SurfaceRender.prototype.overlay = function (part, x, y) {
            if (this.cnv.width < part.width || this.cnv.height < part.height) {
                this.init(part);
            }
            else {
                this.ctx.globalCompositeOperation = "source-over";
                this.ctx.drawImage(part, x, y);
            }
        };
        SurfaceRender.prototype.overlayfast = function (part, x, y) {
            this.ctx.globalCompositeOperation = "source-atop";
            this.ctx.drawImage(part, x, y);
        };
        SurfaceRender.prototype.interpolate = function (part, x, y) {
            this.ctx.globalCompositeOperation = "destination-over";
            this.ctx.drawImage(part, x, y);
        };
        SurfaceRender.prototype.replace = function (part, x, y) {
            this.ctx.clearRect(x, y, part.width, part.height);
            this.overlay(part, x, y);
        };
        SurfaceRender.prototype.init = function (cnv) {
            this.cnv.width = cnv.width;
            this.cnv.height = cnv.height;
            this.overlay(cnv, 0, 0); // type hack
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
