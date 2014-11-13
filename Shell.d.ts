
declare class Shell {
  constructor(tree: NarDirectoryNode);
  tree: any;
  current: string
  shells: { [shellDirName: string]: { descript: { [key: string]: string; }; tree: any; };
  surfaces: any;
  load(shellDirName: string, (error: any) => void): void;
  getSurface(scopeId: number, surfaceId: number): Surface;
}


declare module Shell {

  function transImage(img: HTMLImageElement): HTMLCanvasElement;
  function loadImage(url: string, callback: (error: any, img: HTMLImageElement) => void ): void;
  function bufferToURL(buffer: ArrayBuffer, mimeType: string): string;
  function getShells(tree: any): { [shellDirName: string]: { descript: { [key: string]: string; }; tree: any; };
  function createBases(srfsObj: any): any;
  function loadSurfaces(srfsObj: any, srfsDir: any, callback: (error: any, srfsObj: any) => void ): void;
  function loadElements(srfsObj: any, srfsDir: any, callback: (error: any, srfsObj: any) => void ): void;
  function mergeSurfacesAndSurfacesFiles(srfsObj: any, srfsDir: any): any;
  function parseSurfaces(text: string): any;
}

declare module "Shell" {
  export = Shell;
}
