
declare class Shell {
  constructor(tree: any);
  load(shellDirName: string, callback:(error: any) => void): void;
  getSurface(scopeId: number, surfaceId: number): Surface;
  tree: any;
  current: string
  shells: { [shellDirName: string]: { descript: { [key: string]: string; }; tree: any; }; };
  surfaces: any;
}


declare module Shell {
  function transImage(img: HTMLImageElement): HTMLCanvasElement;
  function loadImage(url: string, callback: (error: any, img: HTMLImageElement) => void ): void;
  function bufferToURL(buffer: ArrayBuffer, mimeType: string): string;
  function getShells(tree: any): { [shellDirName: string]: { descript: { [key: string]: string; }; tree: any; }; };
  function createBases(srfsObj: any): any;
  function loadSurfaces(srfsObj: any, srfsDir: any, callback: (error: any, srfsObj: any) => void ): void;
  function loadElements(srfsObj: any, srfsDir: any, callback: (error: any, srfsObj: any) => void ): void;
  function mergeSurfacesAndSurfacesFiles(srfsObj: any, srfsDir: any): any;
  function parseSurfaces(text: string): any;
}

declare module 'shell' {
  var foo: typeof Shell; // Temp variable to reference Promise in local context
  module rsvp {
    export var Shell: typeof foo;
  }
  export = rsvp;
}
