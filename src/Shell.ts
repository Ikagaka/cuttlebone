/// <!--reference path="Surface.ts"/-->
/// <reference path="SurfaceUtil.ts"/>
/// <reference path="SurfaceRender.ts"/>
/// <reference path="../tsd/SurfacesTxt2Yaml/SurfacesTxt2Yaml.d.ts"/>
/// <reference path="../tsd/encoding-japanese/encoding.d.ts"/>
/// <reference path="../typings/zepto/zepto.d.ts"/>

module cuttlebone {

  function parseDescript(text: string): {[key:string]:string}{
    text = text.replace(/(?:\r\n|\r|\n)/g, "\n"); // CRLF->LF
    while(true){// remove commentout
      var match = (/(?:(?:^|\s)\/\/.*)|^\s+?$/g.exec(text) || ["",""])[0];
      if(match.length === 0) break;
      text = text.replace(match, "");
    }
    var lines = text.split("\n");
    lines = lines.filter(function(line){ return line.length !== 0; }); // remove no content line
    var dic = lines.reduce<{[key:string]:string}>(function(dic, line){
      var tmp = line.split(",");
      var key = tmp[0];
      var vals = tmp.slice(1);
      key = key.trim();
      var val = vals.join(",").trim();
      dic[key] = val;
      return dic;
    }, {});
    return dic;
  }

  function convert(buffer: ArrayBuffer):string{
    return Encoding.codeToString(Encoding.convert(new Uint8Array(buffer), 'UNICODE', 'AUTO'));
  }

  interface SurfaceTreeNode {
    base:  HTMLCanvasElement,
    elements: SurfaceLayerObject[],
    collisions: SurfaceRegion[],
    animations: SurfaceAnimation[]
  }


  export class Shell {

    directory: { [path: string]: ArrayBuffer; };
    descript: { [key: string]: string; };
    surfaces: SurfacesTxt;
    surfaceTree: { [key: string]: SurfaceTreeNode};
    canvasCache: { [key: string]: HTMLCanvasElement; };

    constructor(directory: { [filepath: string]: ArrayBuffer; }) {
      this.directory = directory;
      this.descript = {};
      this.surfaceTree = {};
      this.surfaces = <SurfacesTxt>{};
    }

    load(): Promise<Shell> {
      var descript_name = Object.keys(this.directory).filter((name)=> /^descript\.txt$/i.test(name))[0] || "";
      if (descript_name) {
        this.descript = parseDescript(convert(this.directory[descript_name]));
      } else {
        console.warn("descript.txt is not found");
      }

      var surfaces_text_names = Object.keys(this.directory).filter((name)=> /surfaces.*\.txt$/.test(name));
      if(surfaces_text_names.length === 0) {
        console.warn("surfaces.txt is not found");
      } else {
        surfaces_text_names.forEach(((filename)=> {
          var _srfs = SurfacesTxt2Yaml.txt_to_data(convert(this.directory[filename]), {compatible: 'ssp-lazy'});
          $.extend(true, this.surfaces, _srfs);
        }), {});
      }

      var surface_names = Object.keys(this.directory).filter((filename)=> /^surface(\d+)\.png$/i.test(filename));
      var prms = surface_names.map((filename)=>{
        var n = Number(/^surface(\d+)\.png$/i.exec(filename)[1]);
        return new Promise<Shell>((resolve, reject)=>{
          SurfaceUtil.fetchImageFromArrayBuffer(this.directory[filename]).then((img)=>{
            var render = new SurfaceRender(SurfaceUtil.copy(img));
            this.surfaceTree[n] = {
              base: render.cnv,
              elements: [],
              collisions: [],
              animations: []
            };
            var pnafilename = filename.replace(/\.png$/i, ".pna");
            if(!this.directory[pnafilename]){
              render.chromakey();
              resolve(Promise.resolve(this));
            }else{
              SurfaceUtil.fetchImageFromArrayBuffer(this.directory[filename]).then((pnaimg)=>{
                render.pna(SurfaceUtil.copy(pnaimg));
                resolve(Promise.resolve(this));
              });
            }
          });
        });
      });

      return Promise.all(prms).then(()=> {
        // surfacesTxt reading
        return this;
      });
    }

    /*load(): Promise<Shell> {
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
    }*/
    //attachSurface(canvas: HTMLCanvasElement, scopeId: number, surfaceId: number): Surface {}
    //mergeSurfacesAndSurfacesFiles(): Promise<SurfaceTxt> {}
    //loadSurfaces(): Promise<SurfaceTxt> {}
    //loadElements(): Promise<SurfaceTxt> {}
    //createBases(): Promise<SurfaceTxt> {}
  }
}
