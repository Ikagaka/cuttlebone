
declare class ShellUtil {
  constructor(cnv: HTMLCanvasElement); // stable
  ctx: CanvasRenderingContext2D; // stable
  composeElements(layers:{canvas: HTMLCanvasElement; type: string; x: number; y: number}[]): void; // stable
  overlayfast(part: HTMLCanvasElement, x: number, y: number): void; // stable
  init(cnv: HTMLCanvasElement): void; // unstable
}


declare module ShellUtil {
  function clear(cnv: HTMLCanvasElement): void; // stable
  function copy(cnv: HTMLCanvasElement): HTMLCanvasElement; // stable
  function transImage(img: HTMLImageElement): HTMLCanvasElement; // stable
  function loadImage(url: string, callback: (error: any, img: HTMLImageElement) => void ): void; // stable
}

declare module 'surfaceutil' {
  var foo: typeof ShellUtil;
  module rsvp {
    export var ShellUtil: typeof foo;
  }
  export = rsvp;
}
