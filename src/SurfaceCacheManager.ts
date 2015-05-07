/// <reference path="../typings/tsd.d.ts"/>
/// <reference path="SurfaceUtil.ts"/>
/// <reference path="SurfaceRender.ts"/>
/// <reference path="../tsd/SurfacesTxt2Yaml/SurfacesTxt2Yaml.d.ts"/>

module cuttlebone {
  export class SurfaceCacheManager {
    surfaces: SurfacesTxt;
    directory: { [filepath: string]: ArrayBuffer; };
    baseSurfaceImages: {[key: number]: HTMLImageElement; };
    baseSurfaceCaches: {[key: number]: HTMLCanvasElement; };
    constructor(surfaces: SurfacesTxt, directory: { [filepath: string]: ArrayBuffer; }) {
      this.surfaces = surfaces;
      this.directory = directory;
      this.baseSurfaceCaches = [];
    }
    load(): Promise<SurfaceCacheManager> {
      return new Promise<SurfaceCacheManager>((resolve, reject)=>{
        resolve(Promise.resolve(this));
      });
    }
    isCached(surfaceId: number): boolean {
      return !!this.baseSurfaceCaches[surfaceId];
    }
    getSurfaceFilename(surfaceId: number): string {
      var reg = /^surface(\d+)\.png$/i;
      return Object.keys(this.directory)
        .filter((filename)=> reg.test(filename))
        .filter((filename)=> surfaceId === Number(reg.exec(filename)[1]))[0] || "";
    }
    getPNAFilename(filename: string): string {
      var pnafilename = filename.replace(/\.png$/i, ".pna");
      var reg = new RegExp(pnafilename, "i");
      return Object.keys(this.directory)
        .filter((filename)=> reg.test(filename))[0] || "";
    }
    getSurfaceDefinition(surfaceId: number): SurfaceDefinition {
      var hits = Object.keys(this.surfaces).filter((key)=> this.surfaces.surfaces[key].is === surfaceId);
      return this.surfaces.surfaces[hits[0]];
    }
    fetchSurfaceImage(filename: string): Promise<SurfaceRender> {
      var pnafilename = this.getPNAFilename(filename);
      var cnv = document.createElement("canvas");
      cnv.width = 0;
      cnv.height = 0;
      var render = new SurfaceRender(cnv);
      return new Promise<SurfaceRender>((resolve, reject)=>{
        SurfaceUtil.fetchImageFromArrayBuffer(this.directory[filename]).then((img)=>{
          render.init(img);
          if(pnafilename.length === 0){
            render.chromakey();
            return resolve(Promise.resolve(render)); // type hack
          }
          SurfaceUtil.fetchImageFromArrayBuffer(this.directory[pnafilename]).then((pna)=>{
            render.pna(SurfaceUtil.copy(pna));
            resolve(Promise.resolve(render)); // type hack
          });
        });
      });
    }
    fetchBaseSurface(surfaceId: number): Promise<HTMLCanvasElement> {
      if(this.isCached(surfaceId)) {
        return Promise.resolve(this.baseSurfaceCaches[surfaceId]);
      }
      var surfaceDef = this.getSurfaceDefinition(surfaceId);
      var baseSurfaceFilename = this.getSurfaceFilename(surfaceId);
      return this.fetchSurfaceImage(baseSurfaceFilename).then((render)=>{
        //render.composeElements();
        this.baseSurfaceCaches[surfaceId] = render.cnv;
        return Promise.resolve(this.baseSurfaceCaches[surfaceId]);
      });
    }
  }
}
