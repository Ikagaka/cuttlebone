/// <reference path="Util.ts"/>
/// <reference path="Surface.ts"/>
/// <referenec path="../tsd/SurfacesTxt2Yaml/SurfacesTxt2Yaml.d.ts">

module cuttlebone {
  export class Shell {
    directory: { [path: string]: ArrayBuffer; };
	   descript: { [key: string]: string; };
    surfaces: SurfacesTxt;
    constructor(directory: { [filepath: string]: ArrayBuffer; }) {
    	this.directory = directory;
	    this.descript = {};
	    this.surfaces = { surfaces: {}};
     }
  load(): Promise<Shell> {
		if (!!this.directory["descript.txt"]) {
      this.descript = Util.parseDescript(Util.convert(this.directory["descript.txt"]));
    } else {
      console.warn("descript.txt is not found");
    }
    var hits = Object.keys(this.directory).filter((name)=> /surfaces\d*\.txt$/.test(name));
    if(hits.length === 0) {
      console.warn("surfaces.txt is not found");
    } else {
      var surfaces = hits.reduce(((obj, name)=> {
        var _srfs = Util.parseSurfaces(Util.convert(this.directory[name]))
        return $.extend(true, obj, _srfs);
      }), {})
    }
    var prm = Promise.resolve(surfaces)
    prm
    .then(this.mergeSurfacesAndSurfacesFiles())
    .then(this.loadSurfaces())
    .then(this.loadElements())
    .then(this.createBases())
    .then((surfaces)=> {
      this.surfaces = surfaces
      this.directory = null
      return this;
    })
    .catch((err)=>{
      console.error(err);
      err.message && console.error(err.message);
      err.stack && console.error(err.stack);
      throw err;
    });
    return prm;
	}
  attachSurface(canvas: HTMLCanvasElement, scopeId: number, surfaceId: number): Surface {

  }
  mergeSurfacesAndSurfacesFiles(): Promise<SurfaceTxt> {}
  loadSurfaces(): Promise<SurfaceTxt> {}
  loadElements(): Promise<SurfaceTxt> {}
  createBases(): Promise<SurfaceTxt> {}
}
