/// <reference path="./PNGReader"/>
/// <reference path="../typings/tsd.d.ts"/>


module cuttlebone {

  export module SurfaceUtil {

    export var enablePNGjs = true;

    export function choice<T>(arr: T[]): T {
      return arr[Math.round(Math.random()*(arr.length-1))];
    }

    export function copy(cnv: HTMLCanvasElement|HTMLImageElement): HTMLCanvasElement {
      var copy = document.createElement("canvas");
      var ctx = <CanvasRenderingContext2D>copy.getContext("2d");
      copy.width = cnv.width;
      copy.height = cnv.height;
      ctx.drawImage(<HTMLCanvasElement>cnv, 0, 0); // type hack
      return copy;
    }

    export function fetchImageFromArrayBuffer(buffer: ArrayBuffer, mimetype?:string): Promise<HTMLCanvasElement|HTMLImageElement> {
      if(enablePNGjs){
        var reader = new cuttlebone.PNGReader(buffer);
        var png = reader.parse();
        var decoded = png.getUint8ClampedArray();
        var cnv = createCanvas();
        cnv.width = png.width;
        cnv.height = png.height;
        var ctx = <CanvasRenderingContext2D>cnv.getContext("2d");
        var imgdata = ctx.getImageData(0, 0, cnv.width, cnv.height);
        var data = <any>imgdata.data;
        data.set(decoded);
        ctx.putImageData(imgdata, 0, 0);
        return Promise.resolve(cnv);
      }
      var url = URL.createObjectURL(new Blob([buffer], {type: mimetype || "image/png"}));
      return fetchImageFromURL(url).then((img)=>{
        URL.revokeObjectURL(url);
        return Promise.resolve(img);
      }).catch((err)=>{
        return Promise.reject("fetchImageFromArrayBuffer > "+err);
      });
    }

    export function fetchImageFromURL(url: string): Promise<HTMLImageElement> {
      var img = new Image;
      img.src = url;
      return new Promise<HTMLImageElement>((resolve, reject)=>{
        img.addEventListener("load", function() {
          resolve(Promise.resolve(img)); // type hack
        });
        img.addEventListener("error", function(ev) {
          reject("fetchImageFromURL");
        });
      });
    }

    export function random(callback: (callback: () => void) => void, probability: number): void {
      var ms = 1;
      while (Math.round(Math.random() * 1000) > 1000 / probability) {
        ms++;
      }
      setTimeout((() =>
        callback(() => random(callback, probability))
      ), ms * 1000);
    }

    export function periodic(callback: (callback: () => void) => void, sec: number): void {
      setTimeout((() =>
        callback(()=>
          periodic(callback, sec)
        )
      ), sec * 1000);
    }

    export function always(  callback: (callback: () => void) => void): void {
      callback(() => always(callback) );
    }

    export function isHit(cnv: HTMLCanvasElement, x: number, y: number ): boolean {
      var ctx = <CanvasRenderingContext2D>cnv.getContext("2d");
      var imgdata = ctx.getImageData(0, 0, x + 1, y + 1);
      var data = imgdata.data;
      return data[data.length - 1] !== 0;
    }

    export function offset(element: Element): {left: number, top: number, width: number, height: number} {
      var obj = element.getBoundingClientRect();
      return {
        left: obj.left + window.pageXOffset,
        top: obj.top + window.pageYOffset,
        width: Math.round(obj.width),
        height: Math.round(obj.height)
      };
    }

    export function createCanvas(): HTMLCanvasElement {
      var cnv = document.createElement("canvas");
      cnv.width = 1;
      cnv.height = 1;
      return cnv;
    }

    export function scope(scopeId: number): string {
      return scopeId === 0 ? "sakura"
           : scopeId === 1 ? "kero"
           : "char"+scopeId;
    }

    /*
    var _charId = charId === "sakura" ? 0
                : charId === "kero"   ? 1
                : Number(/^char(\d+)/.exec(charId)[1]);
    */

    /*
    @isHitBubble = (element, pageX, pageY)->
      $(element).hide()
      elm = document.elementFromPoint(pageX, pageY)
      if !elm
        $(element).show(); return elm
      unless elm instanceof HTMLCanvasElement
        $(element).show(); return elm
      {top, left} = $(elm).offset()
      if Surface.isHit(elm, pageX-left, pageY-top)
        $(element).show(); return elm
      _elm = Surface.isHitBubble(elm, pageX, pageY)
      $(element).show(); return _elm
    */
    export function elementFromPointWithout (element: HTMLElement, pageX: number, pageY: number): Element {
      var tmp = element.style.display;
      element.style.display = "none";
      // elementを非表示にして直下の要素を調べる
      var elm = document.elementFromPoint(pageX, pageY);
      // 直下の要素がcanvasなら透明かどうか調べる
      // todo: cuttlebone管理下の要素かどうかの判定必要
      if (!elm){
        element.style.display = tmp;
        return elm;
      }
      if (!(elm instanceof HTMLCanvasElement)) {
        element.style.display = tmp;
        return elm;
      }
      var {top, left} = offset(elm);
      // 不透明canvasならヒット
      if (elm instanceof HTMLCanvasElement && isHit(elm, pageX - left, pageY - top)) {
        element.style.display = tmp;
        return elm;
      }
      if(elm instanceof HTMLElement){
        // elementの非表示のままさらに下の要素を調べにいく
        var _elm = elementFromPointWithout(elm, pageX, pageY)
        element.style.display = tmp;
        return _elm;
      }
      // 解決できなかった！ザンネン!
      console.warn(elm);
      element.style.display = tmp;
      return null;
    }
  }
}
