/// <reference path="../typings/bluebird/bluebird.d.ts" />

module cuttlebone {
  export module SurfaceUtil {
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
    export function fetchImageFromArrayBuffer(buffer: ArrayBuffer, mimetype?:string): Promise<HTMLImageElement> {
      var url = URL.createObjectURL(new Blob([buffer], {type: mimetype || "image/png"}));
      fetchImageFromURL(url).then((img)=>{
        URL.revokeObjectURL(url);
        return Promise.resolve(img);
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
          reject(ev.error);
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
    export function offset(element: HTMLElement): {left: number, top: number, width: number, height: number} {
      var obj = element.getBoundingClientRect();
      return {
        left: obj.left + window.pageXOffset,
        top: obj.top + window.pageYOffset,
        width: Math.round(obj.width),
        height: Math.round(obj.height)
      };
    }	
    export function elementFromPointWithout (element: HTMLElement, pageX: number, pageY: number): HTMLElement {
      var tmp = element.style.display;
      element.style.display = "none";
      // elementを非表示にして直下の要素を調べる
      var elm = document.elementFromPoint(pageX, pageY);
      // 直下の要素がcanvasなら透明かどうか調べる
      // todo: cuttlebone管理下の要素かどうかの判定必要
      if (elm instanceof HTMLCanvasElement) {
        var {top, left} = offset(elm);
        // 不透明ならヒット
        if (isHit(elm, pageX - left, pageY - top)) {
          element.style.display = tmp;
          return elm;
        }
      }
      // elementの非表示のままさらに下の要素を調べにいく
      if (elm instanceof HTMLElement) {
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