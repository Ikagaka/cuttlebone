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

  function find(paths: string[], filename: string): string[] {
    filename = filename.split("\\").join("/");
    if(filename.slice(0,2) === "./") filename = filename.slice(2);
    var reg =new RegExp("^"+filename.replace(".", "\.")+"$", "i");
    var hits = paths.filter((key)=> reg.test(key));
    return hits;
  }

  interface SurfaceLayerObject {
    canvas: HTMLCanvasElement;
    type: string;
    x: number;
    y: number;
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
      this.surfaces = <SurfacesTxt>{};
      this.surfaceTree = {};
      this.canvasCache = {};
    }

    load(): Promise<Shell> {
      var prm = Promise.resolve(this)
      .then(()=> this.loadDescript())
      .then(()=> this.loadSurfacesTxt())
      .then(()=> this.loadSurfacePNG())
      .then(()=> this.loadElements());

      return prm;
      // surfacesTxt reading
      // with using canvasCache
    }

    // load descript
    loadDescript(): Promise<Shell> {
      var descript_name = Object.keys(this.directory).filter((name)=> /^descript\.txt$/i.test(name))[0] || "";
      if (descript_name) {
        this.descript = parseDescript(convert(this.directory[descript_name]));
      } else {
        console.warn("descript.txt is not found");
      }
      return Promise.resolve(this);
    }

    // load surfaces.txt
    loadSurfacesTxt(): Promise<Shell> {
      var surfaces_text_names = Object.keys(this.directory).filter((name)=> /surfaces.*\.txt$/.test(name));
      if(surfaces_text_names.length === 0) {
        console.warn("surfaces.txt is not found");
      } else {
        surfaces_text_names.forEach(((filename)=> {
          var _srfs = SurfacesTxt2Yaml.txt_to_data(convert(this.directory[filename]), {compatible: 'ssp-lazy'});
          $.extend(true, this.surfaces, _srfs);
        }), {});
      }
      return Promise.resolve(this);
    }

    // load surface*.png surface*.pna
    loadSurfacePNG(): Promise<Shell> {
      var surface_names = Object.keys(this.directory).filter((filename)=> /^surface(\d+)\.png$/i.test(filename));
      var prms = surface_names.map((filename)=>{
        var n = Number(/^surface(\d+)\.png$/i.exec(filename)[1]);
        this.getPNGFromDirectory(filename).then((cnv)=>{
          this.canvasCache[filename] = cnv;
          this.surfaceTree[n] = {
            base: this.canvasCache[filename],
            elements: [],
            collisions: [],
            animations: []
          };
        }).catch((err)=>{
          console.warn("Shell#loadSurfacePNG > " + err);
          return Promise.resolve();
        });
      });
      return Promise.all(prms).then(()=> Promise.resolve(this));
    }

    // load elements
    loadElements(): Promise<Shell>{
      return new Promise<Shell>((resolve, reject)=>{
        var srfs = this.surfaces.surfaces;
        Object.keys(srfs).filter((name)=> !!srfs[name].elements).forEach((defname)=>{
          var n = srfs[defname].is;
          var elms = srfs[defname].elements;
          Object.keys(elms).forEach((elmname)=>{
            var {is, type, file, x, y} = elms[elmname];
            this.getPNGFromDirectory(file).then((canvas)=>{
              this.surfaceTree[n] = this.surfaceTree[n] || {
                base: document.createElement("canvas"),
                elements: [],
                collisions: [],
                animations: []
              };
              this.surfaceTree[n].elements[is] = {type, canvas, x, y};
              resolve(Promise.resolve(this));
            }).catch((err)=>{
              console.warn("Shell#loadElements > " + err);
              resolve(Promise.resolve(this));
            });
          });
        });
      });
    }

    hasFile(filename: string): boolean {
      return find(Object.keys(this.directory), filename).length > 0;
    }

    getPNGFromDirectory(filename: string): Promise<HTMLCanvasElement> {
      var hits = find(Object.keys(this.canvasCache), filename);
      if(hits.length > 0){
        return Promise.resolve(this.canvasCache[hits[0]]);
      }
      var render = new SurfaceRender(document.createElement("canvas"));
      return SurfaceUtil.fetchImageFromArrayBuffer(this.directory[find(Object.keys(this.directory), filename)[0]]).then((img)=>{
        render.init(img);
        var pnafilename = filename.replace(/\.png$/i, ".pna");
        var hits = find(Object.keys(this.directory), pnafilename);
        if(hits.length === 0){
          render.chromakey();
          return Promise.resolve(render.cnv);
        }
        return SurfaceUtil.fetchImageFromArrayBuffer(this.directory[hits[0]]).then((pnaimg)=>{
          render.pna(SurfaceUtil.copy(pnaimg));
          return Promise.resolve(render.cnv);
        });
      }).catch((err)=>{
        return Promise.reject("getPNGFromDirectory("+filename+") > "+err);
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
