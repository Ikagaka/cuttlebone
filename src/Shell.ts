/// <reference path="Surface.ts"/>
/// <reference path="SurfaceUtil.ts"/>
/// <reference path="SurfaceRender.ts"/>
/// <reference path="../tsd/SurfacesTxt2Yaml/SurfacesTxt2Yaml.d.ts"/>
/// <reference path="../tsd/encoding-japanese/encoding.d.ts"/>

module cuttlebone {

  function extend(target: any, source: any): void {
    for(var key in source){
      if (typeof source[key] === "object" && Object.getPrototypeOf(source[key]) === Object.prototype) {
        target[key] = target[key] || {};
        extend(target[key], source[key]);
      } else if (Array.isArray(source[key])) {
        target[key] = target[key] || [];
        extend(target[key], source[key]);
      } else if (source[key] !== undefined) {
        target[key] = source[key];
      }
    }
  }

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

  export interface SurfaceTreeNode {
    base:  HTMLCanvasElement,
    elements: SurfaceLayerObject[],
    collisions: SurfaceRegion[],
    animations: SurfaceAnimation[]
  }

  export class Shell {

    directory: { [path: string]: ArrayBuffer; };
    descript: { [key: string]: string; };
    surfaces: [HTMLCanvasElement, Surface][];
    surfacesTxt: SurfacesTxt;
    surfaceTree: SurfaceTreeNode[];
    canvasCache: { [key: string]: HTMLCanvasElement; };
    bindgroup: boolean[];
    isRegionVisible: boolean;

    constructor(directory: { [filepath: string]: ArrayBuffer; }) {
      this.directory = directory;
      this.descript = {};
      this.surfaces = [];
      this.surfacesTxt = <SurfacesTxt>{};
      this.surfaceTree = [];
      this.canvasCache = {};
      this.bindgroup = [];
      this.isRegionVisible = false;
    }

    load(): Promise<Shell> {
      return Promise.resolve(this)
      .then(()=> this.loadDescript()) // 1st
      .then(()=> this.loadBindGroup()) // 2nd
      .then(()=> this.loadSurfacesTxt()) // 1st
      .then(()=> this.loadSurfaceTable()) // 1st
      .then(()=> this.loadSurfacePNG())   // 2nd
      .then(()=> this.loadCollisions()) // 3rd
      .then(()=> this.loadAnimations()) // 3rd
      .then(()=> this.loadElements()) // 3rd
      .catch((err)=>{
        console.error("Shell#load > ", err);
        return Promise.reject(err);
      });
    }

    // load descript
    loadDescript(): Promise<Shell> {
      var descript_name = Object.keys(this.directory).filter((name)=> /^descript\.txt$/i.test(name))[0] || "";
      if (descript_name === "") {
        console.warn("descript.txt is not found");
      } else {
        this.descript = parseDescript(convert(this.directory[descript_name]));
      }
      return Promise.resolve(this);
    }

    loadBindGroup(): Promise<Shell> {
      // load bindgroup
      var reg = /^(sakura|kero|char\d+)\.bindgroup(\d+)\.default/;
      Object.keys(this.descript).filter((key)=> reg.test(key)).forEach((key)=>{
        var [_, charId, bindgroupId, type] = reg.exec(key);
        this.bindgroup[Number(bindgroupId)] = this.descript[key] === "1";
      });
      return Promise.resolve(this);
    }

    // load surfaces.txt
    loadSurfacesTxt(): Promise<Shell> {
      var surfaces_text_names = Object.keys(this.directory).filter((name)=> /^surfaces.*\.txt$|^alias\.txt$/i.test(name));
      if(surfaces_text_names.length === 0) {
        console.info("surfaces.txt is not found");
      } else {
        surfaces_text_names.forEach((filename)=> {
          var srfs = SurfacesTxt2Yaml.txt_to_data(convert(this.directory[filename]), {compatible: 'ssp-lazy'});
          extend(this.surfacesTxt, srfs);
        });
        //{ expand inherit and remove
        Object.keys(this.surfacesTxt.surfaces).forEach((name)=>{
          if(typeof this.surfacesTxt.surfaces[name].is === "number"
             && Array.isArray(this.surfacesTxt.surfaces[name].base)){
            this.surfacesTxt.surfaces[name].base.forEach((key)=>{
              extend(this.surfacesTxt.surfaces[name], this.surfacesTxt.surfaces[key]);
            });
            delete this.surfacesTxt.surfaces[name].base;
          }
        });
        Object.keys(this.surfacesTxt.surfaces).forEach((name)=>{
          if(typeof this.surfacesTxt.surfaces[name].is === "undefined"){
            delete this.surfacesTxt.surfaces[name]
          }
        });
        //}
      }
      return Promise.resolve(this);
    }

    // load surfacetable.txt
    loadSurfaceTable(): Promise<Shell> {
      var surfacetable_name = Object.keys(this.directory).filter((name)=> /^surfacetable.*\.txt$/i.test(name))[0] || "";
      if(surfacetable_name === ""){
        console.info("surfacetable.txt is not found.")
      }else{
        var txt = convert(this.directory[surfacetable_name]);
        // TODO
      }
      return Promise.resolve(this);
    }

    // load surface*.png and surface*.pna
    loadSurfacePNG(): Promise<Shell> {
      var surface_names = Object.keys(this.directory).filter((filename)=> /^surface(\d+)\.png$/i.test(filename));
      var prms = surface_names.map((filename)=>{
        var n = Number(/^surface(\d+)\.png$/i.exec(filename)[1]);
        this.getPNGFromDirectory(filename).then((cnv)=>{
          if(!this.surfaceTree[n]){
            this.surfaceTree[n] = {
              base: cnv,
              elements: [],
              collisions: [],
              animations: []
            };
          }else{
            this.surfaceTree[n].base = cnv;
          }
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
        var srfs = this.surfacesTxt.surfaces;
        Object.keys(srfs).filter((name)=> !!srfs[name].elements).forEach((defname)=>{
          var n = srfs[defname].is;
          var elms = srfs[defname].elements;
          Object.keys(elms).forEach((elmname)=>{
            var {is, type, file, x, y} = elms[elmname];
            this.getPNGFromDirectory(file).then((canvas)=>{
              if(!this.surfaceTree[n]){
                this.surfaceTree[n] = {
                  base: SurfaceUtil.createCanvas(),
                  elements: [],
                  collisions: [],
                  animations: []
                };
              }
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

    // load collisions
    loadCollisions(): Promise<Shell>{
      var srfs = this.surfacesTxt.surfaces;
      Object.keys(srfs).filter((name)=> !!srfs[name].regions).forEach((defname)=>{
        var n = srfs[defname].is;
        var regions = srfs[defname].regions;
        Object.keys(regions).forEach((regname)=>{
          if(!this.surfaceTree[n]){
            this.surfaceTree[n] = {
              base: SurfaceUtil.createCanvas(),
              elements: [],
              collisions: [],
              animations: []
            };
          }
          var {is} = regions[regname];
          this.surfaceTree[n].collisions[is] = regions[regname];
        });
      });
      return Promise.resolve(this);
    }

    // load animations
    loadAnimations(): Promise<Shell>{
      var srfs = this.surfacesTxt.surfaces;
      Object.keys(srfs).filter((name)=> !!srfs[name].animations).forEach((defname)=>{
        var n = srfs[defname].is;
        var animations = srfs[defname].animations;
        Object.keys(animations).forEach((animname)=>{
          if(!this.surfaceTree[n]){
            this.surfaceTree[n] = {
              base: SurfaceUtil.createCanvas(),
              elements: [],
              collisions: [],
              animations: []
            };
          }
          var {is, interval} = animations[animname];
          this.surfaceTree[n].animations[is] = animations[animname];
        });
      });
      return Promise.resolve(this);
    }

    hasFile(filename: string): boolean {
      return find(Object.keys(this.directory), filename).length > 0;
    }

    getPNGFromDirectory(filename: string): Promise<HTMLCanvasElement> {
      var cached_filename = find(Object.keys(this.canvasCache), filename)[0] || "";
      if(cached_filename !== ""){
        return Promise.resolve(this.canvasCache[cached_filename]);
      }
      if(!this.hasFile(filename)){
        filename += ".png";
        if(!this.hasFile(filename)){
          throw new Error("no such file in directory: " + filename.replace(/\.png$/i, ""));
        }
        console.warn("element file " + filename + " need '.png' extension")
      }
      var render = new SurfaceRender(document.createElement("canvas"));
      var _filename = find(Object.keys(this.directory), filename)[0];
      return SurfaceUtil.fetchImageFromArrayBuffer(this.directory[_filename]).then((img)=>{
        render.init(img);
        var pnafilename = _filename.replace(/\.png$/i, ".pna");
        var _pnafilename = find(Object.keys(this.directory), pnafilename)[0] || "";
        if(_pnafilename === ""){
          render.chromakey();
          this.canvasCache[_filename] = render.cnv;
          return Promise.resolve(render.cnv);
        }
        return SurfaceUtil.fetchImageFromArrayBuffer(this.directory[_pnafilename]).then((pnaimg)=>{
          render.pna(SurfaceUtil.copy(pnaimg));
          this.canvasCache[_filename] = render.cnv;
          return Promise.resolve(render.cnv);
        });
      }).catch((err)=>{
        return Promise.reject("getPNGFromDirectory("+filename+") > "+err);
      });
    }

    attachSurface(canvas: HTMLCanvasElement, scopeId: number, surfaceId: number|string): Surface {
      var type = SurfaceUtil.scope(scopeId);
      if(typeof surfaceId === "string"){
        if(!!this.surfacesTxt.aliases && !!this.surfacesTxt.aliases[type] && !!this.surfacesTxt.aliases[type][surfaceId]){
          var _surfaceId = SurfaceUtil.choice<number>(this.surfacesTxt.aliases[type][surfaceId]);
        }else{
          throw new Error("RuntimeError: surface alias scope:" + type+ ", id:" + surfaceId + " is not defined.");
        }
      }else if(typeof surfaceId === "number"){
        var _surfaceId = surfaceId;
      }else throw new Error("TypeError: surfaceId: number|string is not match " + typeof surfaceId);
      var srf = new Surface(canvas, scopeId, _surfaceId, this);
      this.surfaces.push([canvas, srf]);
      return srf;
    }

    detachSurface(canvas: HTMLCanvasElement): void {
      var tuple = this.surfaces.filter((tuple)=> tuple[0] === canvas)[0];
      if(!tuple) return;
      tuple[1].destructor();
    }

    bind(animationId: number): void {
      this.bindgroup[animationId] = true;
      this.surfaces.forEach((tuple)=>{
        var [_, srf] = tuple;
        srf.updateBind();
      });
    }

    unbind(animationId: number): void {
      this.bindgroup[animationId] = false;
      this.surfaces.forEach((tuple)=>{
        var [_, srf] = tuple;
        srf.updateBind();
      });
    }

    render(): void {
      this.surfaces.forEach((tuple)=>{
        var [_, srf] = tuple;
        srf.render();
      });
    }

  }
}
