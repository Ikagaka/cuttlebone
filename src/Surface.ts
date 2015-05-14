/// <reference path="SurfaceRender.ts"/>
/// <reference path="SurfaceUtil.ts"/>
/// <reference path="Shell.ts"/>

module cuttlebone {

  function randomRange(min: number, max: number): number {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  export class Surface {

    element: HTMLCanvasElement;
    scopeId: number;
    surfaceId: number;
    shell: Shell;

    surfaceTreeNode: SurfaceTreeNode;
    bufferCanvas: HTMLCanvasElement;
    bufRender: SurfaceRender;
    elmRender: SurfaceRender;

    destructed: boolean;
    layers: { [is: number]: SurfaceAnimationPattern; };
    stopFlags: { [key: string]: boolean; };
    talkCount: number;
    talkCounts: { [key: string]: number };
    isRegionVisible: boolean;

    constructor(canvas: HTMLCanvasElement, scopeId: number, surfaceId: number, shell: Shell) {
      this.element = canvas;
      this.scopeId = scopeId;
      this.surfaceId = surfaceId;
      this.shell = shell;

      this.surfaceTreeNode = shell.surfaceTree[surfaceId];
      this.bufferCanvas = SurfaceUtil.createCanvas();
      this.bufRender = new SurfaceRender(this.bufferCanvas);
      this.elmRender = new SurfaceRender(this.element);

      this.destructed = false;
      this.layers = {};
      this.stopFlags = {};
      this.talkCount = 0;
      this.talkCounts = {};
      this.isRegionVisible = false;

      this.initAnimation();
      this.render();
    }

    initAnimation(): void {
      this.surfaceTreeNode.animations.forEach((arg)=>{
        var {is, interval, patterns} = arg;
        interval = interval || "";
        var tmp = interval.split(",");
        interval = tmp[0];
        var n = Number(tmp.slice(1).join(","));
        switch (interval) {
          case "sometimes":SurfaceUtil.random(  ((callback) => { if (!this.destructed && !this.stopFlags[is]) { this.play(is, callback); } }), 2); break;
          case "rarely":   SurfaceUtil.random(  ((callback) => { if (!this.destructed && !this.stopFlags[is]) { this.play(is, callback); } }), 4); break;
          case "random":   SurfaceUtil.random(  ((callback) => { if (!this.destructed && !this.stopFlags[is]) { this.play(is, callback); } }), n); break;
          case "periodic": SurfaceUtil.periodic(((callback) => { if (!this.destructed && !this.stopFlags[is]) { this.play(is, callback); } }), n); break;
          case "always":   SurfaceUtil.always(  ((callback) => { if (!this.destructed && !this.stopFlags[is]) { this.play(is, callback); } })   ); break;
          case "runonce": this.play(is); break;
          case "never": break;
          case "bind": break;
          case "yen-e": break;
          case "talk": this.talkCounts[is] = n; break;
          default:
            if (/^bind(?:\+(\d+))/.test(interval)) {
              // 着せ替えなので何もしない
            } else {
              console.warn(this.surfaceTreeNode.animations[is]);
            }
        }
      });
    }

    destructor(): void {
      this.elmRender.clear();
      this.destructed = true;
      this.layers = {};
    }

    render(): void {
      var sorted = Object.keys(this.layers).sort((layerNumA, layerNumB)=> Number(layerNumA) > Number(layerNumB) ? 1 : -1 );
      var mapped = sorted.map((key)=> this.layers[Number(key)]);
      var patterns = mapped.reduce<SurfaceLayerObject[]>(((arr, pat)=>{
        var {surface, type, x, y} = pat;
        if(surface === -1) return arr;
        var srf = this.shell.surfaceTree[surface];
        if(!srf) return arr;
        var rndr = new SurfaceRender(this.shell.surfaceTree[surface].base);
        rndr.composeElements(this.shell.surfaceTree[surface].elements);
        // TODO: 呼び出し先の着せ替え有効
        return arr.concat({
          type: type,
          x: x,
          y: y,
          canvas: rndr.cnv
        });
      }), [])
      this.bufRender.init(this.surfaceTreeNode.base);
      this.bufRender.composeElements(this.surfaceTreeNode.elements);
      this.bufRender.composeElements(patterns);
      this.elmRender.init(this.bufRender.cnv);
      if (this.isRegionVisible) {
        this.elmRender.ctx.fillText(""+this.surfaceId, 5, 10);
        this.surfaceTreeNode.collisions.forEach((col)=>{
          var {name} = col;
          this.elmRender.drawRegion(col);
        });
      }
    }

    play(animationId: number, callback?: () => void): void {
      var anim = this.surfaceTreeNode.animations[animationId];
      if(!anim) return void setTimeout(callback);
      var lazyPromises = anim.patterns.map((pattern)=> ()=> new Promise<void>((resolve, reject)=> {
        var {surface, wait, type, x, y, animation_ids} = pattern;
        if(/^start/.test(type)){
          var _animId = SurfaceUtil.choice(animation_ids);
          if(!!this.surfaceTreeNode.animations[_animId]){
            this.play(_animId, ()=>resolve(Promise.resolve()));
            return;
          }
        }
        if(/^stop/.test(type)){
          var _animId = SurfaceUtil.choice(animation_ids);
          if(!!this.surfaceTreeNode.animations[_animId]){
            this.stop(_animId);
            setTimeout(()=> resolve(Promise.resolve()));
            return;
          }
        }
        if(/^alternativestart/.test(type)){
          var _animId = SurfaceUtil.choice(animation_ids);
          if(!!this.surfaceTreeNode.animations[_animId]){
            this.play(_animId, ()=>resolve(Promise.resolve()));
            return;
          }
        }
        if(/^alternativestop/.test(type)){
          var _animId = SurfaceUtil.choice(animation_ids);
          if(!!this.surfaceTreeNode.animations[_animId]){
            this.play(_animId, ()=>resolve(Promise.resolve()));
            return;
          }
        }
        this.layers[animationId] = pattern;
        this.render();
        // ex. 100-200 ms wait
        var [__, a, b] = (/(\d+)(?:\-(\d+))?/.exec(wait) || ["", "0"]);
        if(!!b){
          var _wait = randomRange(Number(a), Number(b));
        }else{
          var _wait = Number(wait);
        }
        setTimeout((()=>{
          if(this.destructed){// stop pattern animation.
            reject(null);
          }else{
            resolve(Promise.resolve());
          }
        }), _wait)
      }));
      var promise = lazyPromises.reduce(((proA, proB)=> proA.then(proB)), Promise.resolve()) // Promise.resolve().then(prom).then(prom)...
      promise
      .then(()=> setTimeout(callback))
      .catch((err)=>{if(!!err) console.error(err.stack); });
    }

    stop(animationId: number): void {
      this.stopFlags[animationId] = true;
    }

    talk(): void {
      var animations = this.surfaceTreeNode.animations;
      this.talkCount++;
      var hits = animations.filter((anim)=>
          /^talk/.test(anim.interval) && this.talkCount % this.talkCounts[anim.is] === 0);
      hits.forEach((anim)=>{
        this.play(anim.is);
      });
    }

    yenE(): void {
      var animations = this.surfaceTreeNode.animations;
      var hits = animations.filter((anim)=>
      anim.interval === "yen-e" && this.talkCount % this.talkCounts[anim.is] === 0);
      hits.forEach((anim)=>{
        this.play(anim.is);
      });
    }

    bind(animationId: number): void {
      var animations = this.surfaceTreeNode.animations;
      var anim = animations.filter((_anim)=> _anim.is === animationId)[0];
      if (!anim) return;
      if (anim.patterns.length === 0 ) return;
      var interval = anim.interval;
      var pattern = anim.patterns[anim.patterns.length-1];
      this.layers[anim.is] = pattern;
      this.render();
      if(/^bind(?:\+(\d+))/.test(interval)){
        var animIds = interval.split("+").slice(1);
        animIds.forEach((animId)=> this.play(Number(animId)));
      }
    }

    unbind(animationId: number): void {
      delete this.layers[animationId];
    }

    getRegion(offsetX: number, offsetY: number): SurfaceRegion {
      if(SurfaceUtil.isHit(this.element, offsetX, offsetY)){
        var hitCol = this.surfaceTreeNode.collisions.filter((collision, colId)=>{
          var {type, name, left, top, right, bottom, coordinates, radius, center_x, center_y} = collision;
          switch(type){
            case "rect":
              return (left < offsetX && offsetX < right && top < offsetY && offsetY < bottom) ||
                     (right < offsetX && offsetX < left && bottom < offsetX && offsetX < top);
            case "ellipse":
              var width = Math.abs(right - left);
              var height = Math.abs(bottom - top);
              return Math.pow((offsetX-(left+width/2))/(width/2), 2) +
                     Math.pow((offsetY-(top+height/2))/(height/2), 2) < 1;
            case "circle":
              return Math.pow((offsetX-center_x)/radius, 2)+Math.pow((offsetY-center_y)/radius, 2) < 1;
            case "polygon":
              var ptC = {x:offsetX, y:offsetY};
              var tuples = coordinates.reduce(((arr, {x, y}, i)=>{
                arr.push([
                  coordinates[i],
                  (!!coordinates[i+1] ? coordinates[i+1] : coordinates[0])
                ]);
                return arr;
              }), []);
              var deg = tuples.reduce(((sum, [ptA, ptB])=>{
                var vctA = [ptA.x-ptC.x, ptA.y-ptC.y];
                var vctB = [ptB.x-ptC.x, ptB.y-ptC.y];
                var dotP = vctA[0]*vctB[0] + vctA[1]*vctB[1];
                var absA = Math.sqrt(vctA.map((a)=> Math.pow(a, 2)).reduce((a, b)=> a+b));
                var absB = Math.sqrt(vctB.map((a)=> Math.pow(a, 2)).reduce((a, b)=> a+b));
                var rad = Math.acos(dotP/(absA*absB))
                return sum + rad;
              }), 0)
              return deg/(2*Math.PI) >= 1;
            default:
              console.warn("unkown collision type:", this.surfaceId, colId, name, collision);
              return null;
          }
        })[0];
        return hitCol;
      }else{
        return null;
      }
    }

  }
}
