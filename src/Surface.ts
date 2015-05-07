/// <reference path="SurfaceRender.ts"/>
/// <reference path="SurfaceUtil.ts"/>

module cuttlebone {
  export class Surface {
    element: HTMLCanvasElement;
    scopeId: number;
    surfaceId: number;
    surfaceName: string;
    surfaces: { [key: string]: SurfaceDefinition; };
    isRegionVisible: boolean;
    baseSurface: HTMLCanvasElement;
    regions: { [key: string]: SurfaceRegion };
    animations: { [key: string]: SurfaceAnimation; };
    bufferCanvas: HTMLCanvasElement;
    stopFlags: { [key: string]: boolean; };
    layers: { [is: number]: SurfaceAnimationPattern; };
    destructed: boolean;
    talkCount: number;
    talkCounts: { [key: string]: number };
    isPointerEventsShimed: boolean;
    lastEventType: string;
    constructor(
      canvas: HTMLCanvasElement,
      scopeId: number,
      surfaceId: number,
      surfaceName: string,
      surfaces: { [key: string]: SurfaceDefinition; }
      ) {
      this.element = canvas;
      this.scopeId = scopeId;
      this.surfaceId = surfaceId;
      this.surfaceName = surfaceName;
      this.surfaces = surfaces;
      var srf = this.surfaces[surfaceName];
      if (!srf) throw new Error(surfaceName + " is not found in surfaces");
      if (!srf.baseSurface) console.warn("baseSurface is not found", this);
      this.baseSurface = srf.baseSurface;
      this.regions = srf.regions || {};
      this.animations = srf.animations || {};
      this.bufferCanvas = SurfaceUtil.copy(this.baseSurface);
      this.stopFlags = {};
      this.layers = {};
      this.destructed = false;
      this.talkCount = 0;
      this.talkCounts = {};
      this.isPointerEventsShimed = false;
      this.isRegionVisible = false;
      this.lastEventType = "";
      this.element.addEventListener("contextmenu", (ev) => this.processMouseEvent(ev, "mouseclick", (ev) => this.element.dispatchEvent(ev)));
      this.element.addEventListener("click", (ev) => this.processMouseEvent(ev, "mouseclick", (ev) => this.element.dispatchEvent(ev)));
      this.element.addEventListener("dblclick", (ev) => this.processMouseEvent(ev, "mousedblclick", (ev) => this.element.dispatchEvent(ev)));
      this.element.addEventListener("mousedown", (ev) => this.processMouseEvent(ev, "mousedown", (ev) => this.element.dispatchEvent(ev)));
      this.element.addEventListener("mousemove", (ev) => this.processMouseEvent(ev, "mousemove", (ev) => this.element.dispatchEvent(ev)));
      this.element.addEventListener("mouseup", (ev) => this.processMouseEvent(ev, "mouseup", (ev) => this.element.dispatchEvent(ev)));
      var tid = 0;
      var touchCount = 0;
      var touchStartTime = 0;
      this.element.addEventListener("touchmove", (ev) => this.processMouseEvent(ev, "mousemove", (ev) => this.element.dispatchEvent(ev)));
      this.element.addEventListener("touchend", (ev) => {
        this.processMouseEvent(ev, "mouseup", (ev) => this.element.dispatchEvent(ev));
        this.processMouseEvent(ev, "mouseclick", (ev) => this.element.dispatchEvent(ev));
        if (Date.now() - touchStartTime < 500 && touchCount % 2 === 0) {
          this.processMouseEvent(ev, "mousedblclick", (ev) => this.element.dispatchEvent(ev));
        }
      });
      this.element.addEventListener("touchstart", (ev) => {
        touchCount++;
        touchStartTime = Date.now();
        this.processMouseEvent(ev, "mousedown", (ev) => this.element.dispatchEvent(ev));
        clearTimeout(tid);
        tid = setTimeout((() => touchCount = 0), 500);
      });
      Object.keys(this.animations).forEach((name) => {
        var {is: animationId, interval, patterns} = this.animations[name];
        interval = interval || "";
        var tmp = interval.split(",");
        interval = tmp[0];
        var n = Number(tmp.slice(1).join(","));
        switch (interval) {
          case "sometimes": SurfaceUtil.random(((callback) => { if (!this.destructed && !this.stopFlags[animationId]) { this.play(animationId, callback); } }), 2); break;
          case "rarely": SurfaceUtil.random(((callback) => { if (!this.destructed && !this.stopFlags[animationId]) { this.play(animationId, callback); } }), 4); break;
          case "random": SurfaceUtil.random(((callback) => { if (!this.destructed && !this.stopFlags[animationId]) { this.play(animationId, callback); } }), n); break;
          case "periodic": SurfaceUtil.periodic(((callback) => { if (!this.destructed && !this.stopFlags[animationId]) { this.play(animationId, callback); } }), n); break;
          case "always": SurfaceUtil.always(((callback) => { if (!this.destructed && !this.stopFlags[animationId]) { this.play(animationId, callback); } })); break;
          case "runonce": this.play(animationId); break;
          case "never": break;
          case "bind": break;
          case "yen-e": break;
          case "talk": this.talkCounts[name] = n; break;
          default:
            if (/^bind(?:\+(\d+))/.test(interval)) {
              // 着せ替えなので何もしない
            } else {
              console.warn(this.animations[name]);
            }
        }
      });
      this.render();
    }
    destructor(): void {
      var srfRdr = new SurfaceRender(this.element);
      srfRdr.clear();
      //$(@element).off() # g.c.
      this.destructed = true;
      this.layers = {};
    }
    render(): void { }
    talk(): void { }
    yenE(): void { }
    play(animationId: number, callback?: () => void): void { }
    stop(animationId: number): void {
      this.stopFlags[animationId] = true;
    }
    bind(animationId: number): void {
      var hit = Object.keys(this.animations).filter((name)=> this.animations[name].is === animationId)[0];
      if (!hit) return;
      var anim = this.animations[hit];
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
    processMouseEvent(ev: any, eventName: string, callback: (ev: any) => void): void {

    }
  }
}
