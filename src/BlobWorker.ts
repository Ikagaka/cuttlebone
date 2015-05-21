
module cuttlebone {

  function getArrayBuffer(url: string):Promise<ArrayBuffer> {
    return new Promise<ArrayBuffer>((resolve, reject)=>{
      var xhr = new XMLHttpRequest();
      xhr.addEventListener("load", ()=> {
        if (200 <= xhr.status && xhr.status < 300) {
          if(typeof xhr.response.error === "undefined"){
            resolve(Promise.resolve(xhr.response));
          }else{
            reject(new Error(xhr["response"]["error"]["message"]));
          }
        } else {
          reject(new Error("xhr status: "+xhr.status));
        }
      });
      xhr.open("GET", url);
      xhr.responseType = "arraybuffer";
      xhr.send();
    });
  }

  function createTransferable(dic:{[key: string]: ArrayBuffer}): ArrayBuffer[]{
    var buffers:ArrayBuffer[] = [];
    Object.keys(dic).forEach((key)=> buffers.push(dic[key]));
    return buffers;
  }

  export type blobWorkerGlobalScopeOn = (event: string, callback:(data:any, reply:(arg:any, trf?:ArrayBuffer[])=>void)=>void)=>void;

  export class BlobWorker {

    url: string;
    mainScript: (...CONSTS:any[])=> void;
    CONSTS: any[];
    worker: Worker;
    requestId: number;
    importURLs: string[];
    callbacks: {[key: number]: (data:any)=>void }
    blobURLs: string[];

    constructor(mainScript: (...CONSTS:any[])=>void, CONSTS?: any[], importURLs?: string[]){
      if(!Array.isArray(CONSTS)) CONSTS = [];
      if(!Array.isArray(importURLs)) importURLs = [];
      this.importURLs = importURLs;
      this.mainScript = mainScript;
      this.CONSTS = CONSTS;
      this.url = null;
      this.worker = null;
      this.requestId = 0
      this.callbacks = {}
      this.blobURLs = [];
    }

    load(): Promise<BlobWorker> {
      var prms = this.importURLs.map((url)=>
        getArrayBuffer(url)
        .then((buffer)=>
          URL.createObjectURL(
            new Blob([buffer], {"type": "test/javascript"}))));
      return Promise.all(prms).then((_importURLs)=>{
        var inlineScript = [
          _importURLs.map((src)=> "importScripts('" + src + "');\n").join("") + "\n",
          "(" + serverScript + ")();\n",
          "(" + this.mainScript + ")([" + this.CONSTS.map(JSON.stringify).join(",") + "]);\n"
        ];
        this.url = URL.createObjectURL(new Blob(inlineScript, {type:"text/javascript"}));
        this.blobURLs = _importURLs.concat(this.url);
        this.worker = new Worker(this.url);
        this.worker.addEventListener("error", (ev)=>{
          console.error((!!ev&&!!ev.error&&ev.error.stack) || ev.error || ev)
        });
        this.worker.addEventListener("message", (ev)=>{
          var id: number = ev.data[0];
          var data: any = ev.data[1];
          this.callbacks[id](data);
          delete this.callbacks[id];
        });
        return this;
      });
      function serverScript(){
        var _self = <any>self; // type hack
        var handlers: {[key:string]: (datas:any[], reply:(data:any, trf?:ArrayBuffer[])=>void)=>void} = {};
        self.addEventListener("message", (ev)=>{
          var id: number = ev.data[0];
          var event: string = ev.data[1];
          var data: any = ev.data[2];
          function reply(data: any, transferable?: ArrayBuffer[]): void {
            if(!Array.isArray(transferable)) transferable = [];
            _self.postMessage([id, data], transferable);
          }
          handlers[event](data, reply);
        });
        _self.on = (event:string, callback:(data:any, reply:(args:any[], trf?:ArrayBuffer[])=>void)=>void)=>{
          handlers[event] = callback;
        };
      }
    }

    request<T>(event:string, data:any, transferable?:ArrayBuffer[]): Promise<T>{
      if(!Array.isArray(transferable)) transferable = [];
      return new Promise<T>((resolve, reject)=>{
        var id = this.requestId++;
        this.worker.postMessage([id, event, data], transferable);
        this.callbacks[id] = (_data:T)=> resolve(Promise.resolve(_data));
      });
    }

    terminate(){
      this.worker.terminate();
      this.blobURLs.forEach(URL.revokeObjectURL);
    }


  }
}
