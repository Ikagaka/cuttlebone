


module cuttlebone {
  export module Descript {
    export function parse(txt: string): any {
      var lines = txt.split("\r").join("\n").split(/\n+/);
      var json = {};
      lines.forEach((line)=>{
        var [key, ...vals] = line.split(",");
        var ptr = json;
        key.split(".").forEach((prop, i, arr)=>{
          if(prop === "sakura") prop = "char0";
          if(prop === "kero") prop = "char1";
          if(/^(.*[^\d])(\d+)$/.test(prop)){
            var [_, prop, n] = /^(.*[^\d])(\d+)$/.exec(prop);
            if(!Array.isArray(ptr[prop])) ptr[prop] = [];
            if(i === arr.length - 1){
              ptr[prop][n] = vals.map((val)=> val.trim())
            }else if(ptr[prop][n] == null){
              ptr[prop][n] = {};
            }
            ptr = ptr[prop][n];
          }else{
            if(i === arr.length - 1){
              ptr[prop] = vals.map((val)=> val.trim())
            }else if(ptr[prop] == null){
              ptr[prop] = {};
            }
            ptr = ptr[prop];
          }
        }, {})
      });
      return json;
    }
  }
}
