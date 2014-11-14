interface JSZipDirectory { [filepath: string]: JSZipObject; };
interface Descript { [key: string]: string; };

declare class Surface {
  constructor(scopeId: number, surfaceName: string, surfaces: Surfaces); // stable
  destructor(): void; // stable
  element: HTMLCanvasElement; // stable
  render(): void; // stable
  playAnimation(animationId, callback: () => void): void; // stable
  stopAnimation(): void; // stable
}


declare module Surface {
  function random(callback: (callback: () => void) => void, probability: Number): void; // stable
  function periodic(callback: (callback: () => void) => void, sec: Number): void; // stable
  function always(callback: (callback: () => void) => void): void; // stable
  function isHit(cnv: HTMLCanvasElement, x: number, y: number ): boolean; // stable
}

declare module 'surface' {
  var foo: typeof Surface;
  module rsvp {
    export var Surface: typeof foo;
  }
  export = rsvp;
}
