
declare class Shell {
  constructor(tree: any); // unstable
  load(callback:(error: any) => void): void; // stable
  getSurface(scopeId: number, surfaceId: number): Surface; // stable
  descript: { [key: string]: string; }; // stable
  tree: any; // unstable
  surfaces: any; // unstable
}


declare module Shell {
  function transImage(img: HTMLImageElement): HTMLCanvasElement; // stable
  function loadImage(url: string, callback: (error: any, img: HTMLImageElement) => void ): void; // stable
  function bufferToURL(buffer: ArrayBuffer, mimeType: string): string; // stable
  function createBases(srfsObj: any): any; // unstable
  function loadSurfaces(srfsObj: any, srfsDir: any, callback: (error: any, srfsObj: any) => void ): void; // unstable
  function loadElements(srfsObj: any, srfsDir: any, callback: (error: any, srfsObj: any) => void ): void; // unstable
  function mergeSurfacesAndSurfacesFiles(srfsObj: any, srfsDir: any): any; // unstable
  function parseSurfaces(text: string): any; // unstable
}

declare module 'shell' {
  var foo: typeof Shell;
  module rsvp {
    export var Shell: typeof foo;
  }
  export = rsvp;
}
