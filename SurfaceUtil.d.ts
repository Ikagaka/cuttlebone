
declare class ShellUtil {
  constructor(cnv: HTMLCanvasElement);
  ctx: CanvasRenderingContext2D;
  composeElements(layers:{canvas: HTMLCanvasElement; type: string; x: number; y: number}[]): void;
  overlayfast(part: HTMLCanvasElement, x: number, y: number): void;
  init(cnv: HTMLCanvasElement): void;
}


declare module ShellUtil {
  function clear(cnv: HTMLCanvasElement): void;
  function copy(cnv: HTMLCanvasElement): HTMLCanvasElement;
}

declare module 'surfaceutil' {
  var foo: typeof ShellUtil; // Temp variable to reference Promise in local context
  module rsvp {
    export var ShellUtil: typeof foo;
  }
  export = rsvp;
}
