/// <reference path="SurfaceRender.ts"/>
/// <reference path="SurfaceUtil.ts"/>
/// <reference path="Shell.ts"/>

module cuttlebone {

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
      this.bufRender.init(this.surfaceTreeNode.base);
      this.bufRender.composeElements(this.surfaceTreeNode.elements);
      this.elmRender.init(this.bufRender.cnv);
    }

    play(animationId: number, callback?: () => void): void {

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

  }
}
