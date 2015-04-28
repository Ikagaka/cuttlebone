### (C) 2015 Legokichi : Licensed under The MIT License ###

# import thirdparty libraries
global           = ((this || 0).self || global)
Encoding         = global["Encoding"]
SurfacesTxt2Yaml = global["SurfacesTxt2Yaml"]
_                = global["_"]
$                = global["Zepto"]

Util =
  convert: (buffer)->
    Encoding.codeToString(Encoding.convert(new Uint8Array(buffer), 'UNICODE', 'AUTO'))

  parseDescript: `function (text){
    // @arg String
    // @ret {[id: String]: String;}
    text = text.replace(/(?:\r\n|\r|\n)/g, "\n"); // CRLF->LF
    while(true){// remove commentout
      var match = (/(?:(?:^|\s)\/\/.*)|^\s+?$/g.exec(text) || ["",""])[0];
      if(match.length === 0) break;
      text = text.replace(match, "");
    }
    var lines = text.split("\n");
    lines = lines.filter(function(line){ return line.length !== 0; }); // remove no content line
    var dic = lines.reduce(function(dic, line){
      var tmp = line.split(",");
      var key = tmp[0];
      var vals = tmp.slice(1);
      key = key.trim();
      var val = vals.join(",").trim();
      dic[key] = val;
      return dic;
    }, {});
    return dic;
  }`
