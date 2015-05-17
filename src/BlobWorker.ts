
module cuttlebone {

  function serverScript(): ()=>void{
    return (()=>{
      var _self = <any>self; // type hack
      var handlers = {};
      self.addEventListener("message", ({data: [id, event, data]})=>{
        function reply(args:any[], transferable:ArrayBuffer[]): void {
          _self.postMessage([id, args], transferable);
        }
        handlers[event](data, reply);
      });
      _self.on = (event: string, callback:()=>void)=>{
        handlers[event] = callback
      };
    });
  }

  function createTransferable(dic:{[key: string]: ArrayBuffer}): ArrayBuffer[]{
    var buffers = <ArrayBuffer[]>[];
    Object.keys(dic).forEach((key)=> buffers.push(dic[key]));
    return buffers;
  }

  export class BlobWorker {

    url: string;
    worker: Worker;
    requestId: number;
    callbacks: {[key: string]: (args:any[])=>void }

    constructor(fn:()=>void, args:any[], imports:any[]){
      if(!Array.isArray(imports)) imports = [];
      this.url = URL.createObjectURL(
        new Blob([
          imports.map((src)=> "importScripts('#{src}');\n").join("") + "\n",
          "("+serverScript+")();\n",
          "var createTransferable = "+createTransferable+";\n",
          "("+fn+")("+args.map(JSON.stringify).join(",")+");"
        ], {type:"text/javascript"}));
      this.worker = new Worker(this.url);
      this.worker.addEventListener("error", (ev)=> console.error((!!ev&&!!ev.error&&ev.error.stack) || ev.error || ev));
      this.worker.addEventListener("message", (ev)=>{
        var {data: [id, args]} = <{data: [number, any[]]}>ev.data;
        this.callbacks[id](args);
        delete this.callbacks[id];
      });
      this.requestId = 0
      this.callbacks = {}
    }
    request(event:string, callback:()=>void): void;
    request(event:string, tuple:[any, ArrayBuffer[]], callback:()=>void): void;
    request(event:string, tuple:any, callback?:()=>void): void{
      if(tuple instanceof Function){
        callback = <()=>void>tuple;
        var data = <any>null;
        var transferable = <ArrayBuffer[]>[];
      }else if(tuple instanceof Array && tuple[1] instanceof Array){
        var data = <any>tuple[0];
        var transferable = <ArrayBuffer[]>tuple[1];
      }else throw new Error("BlobWorker#request > TypeError");
      var id = this.requestId++;
      this.callbacks[id] = callback;
      this.worker.postMessage([id, event, data], transferable);
    }
    terminate(){
      this.worker.terminate();
      URL.revokeObjectURL(this.url);
    }
  }
}
