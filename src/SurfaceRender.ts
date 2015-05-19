/// <reference path="../typings/tsd.d.ts"/>

module cuttlebone {

  export interface SurfaceLayerObject {
    canvas: HTMLCanvasElement;
    type: string;
    x: number;
    y: number;
  }

  export class SurfaceRender {

    cnv: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    constructor(cnv: HTMLCanvasElement) {
      this.cnv = cnv;
      this.ctx = <CanvasRenderingContext2D>cnv.getContext("2d");
    }

    composeElements(elements: SurfaceLayerObject[]): void {
      if (elements.length === 0) { return; }
      if(!Array.isArray(elements)) throw new Error("TypeError: elements is not array.")
      var {canvas, type, x, y} = elements[0];
      var offsetX = 0;
      var offsetY = 0;
      switch (type) {
        case "base":
          this.base(canvas);
          break;
        case "overlay":
        case "add":
        case "bind":
          this.overlay(canvas, offsetX + x, offsetY + y);
          break;
        case "overlayfast":
          this.overlayfast(canvas, offsetX + x, offsetY + y);
          break;
        case "replace":
          this.replace(canvas, offsetX + x, offsetY + y);
          break;
        case "interpolate":
          this.interpolate(canvas, offsetX + x, offsetY + y);
          break;
        case "move":
          offsetX = x;
          offsetY = y;
          var copyed = SurfaceUtil.copy(this.cnv);
          this.base(copyed);
          break;
        case "asis":
        case "reduce":
        case "insert,ID": break;
        default:
          console.error(elements[0]);
      }
      this.composeElements(elements.slice(1));
    }

    clear(): void {
      this.cnv.width = this.cnv.width;
    }

    chromakey(): void {
      var ctx = <CanvasRenderingContext2D>this.cnv.getContext("2d");
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
    }

    pna(pna: HTMLCanvasElement): void {
      var ctxB = <CanvasRenderingContext2D>pna.getContext("2d");
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
    }

    base(part: HTMLCanvasElement): void {
      this.init(part);
    }

    overlay(part: HTMLCanvasElement, x: number, y: number): void {
      if(this.cnv.width < part.width || this.cnv.height < part.height){
        this.init(part);
      }else{
        this.ctx.globalCompositeOperation = "source-over";
        this.ctx.drawImage(part, x, y);
      }
    }

    overlayfast(part: HTMLCanvasElement, x: number, y: number): void {
      this.ctx.globalCompositeOperation = "source-atop";
      this.ctx.drawImage(part, x, y);
    }

    interpolate(part: HTMLCanvasElement, x: number, y: number): void {
      this.ctx.globalCompositeOperation = "destination-over";
      this.ctx.drawImage(part, x, y);
    }

    replace(part: HTMLCanvasElement, x: number, y: number): void {
      this.ctx.clearRect(x, y, part.width, part.height);
      this.overlay(part, x, y);
    }

    init(cnv: HTMLImageElement|HTMLCanvasElement): void {
      this.cnv.width = cnv.width;
      this.cnv.height = cnv.height;
      this.overlay(<HTMLCanvasElement>cnv, 0, 0); // type hack
    }
    drawRegions(regions: SurfaceRegion[]): void {
      regions.forEach((col)=>{
        this.drawRegion(col);
      });
    }

    drawRegion(region: SurfaceRegion): void {
      var {type, name, left, top, right, bottom, coordinates, radius, center_x, center_y} = region;
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
    }
  }
}
