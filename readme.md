# Shell.js

Shell.js can play SERIKO/2.0 animation.

![screenshot](https://raw.githubusercontent.com/Ikagaka/Shell.js/master/screenshot.png )

## Usage


[wiki](https://github.com/Ikagaka/Shell.js/wiki/Shell.js )

```html
<script src="./node_modules/ikagaka.nar.js/node_modules/encoding-japanese/encoding.js"></script>
<script src="./node_modules/ikagaka.nar.js/vender/jszip.min.js"></script>
<script src="./node_modules/ikagaka.nar.js/vender/XHRProxy.min.js"></script>
<script src="./node_modules/ikagaka.nar.js/vender/WMDescript.js"></script>
<script src="./node_modules/ikagaka.nar.js/Nar.js"></script>
<script src="./node_modules/surfaces_txt2yaml/lib/surfaces_txt2yaml.js"></script>
<script src="./node_modules/underscore/underscore-min.js"></script>
<script src="./node_modules/zepto/zepto.min.js"></script>
<script src="./SurfaceUtil.js"></script>
<script src="./Surface.js"></script>
<script src="./Shell.js"></script>
<script>
var nar = new Nar();
nar.loadFromURL("./node_modules/ikagaka.nar.js/vender/mobilemaster.nar", function (err){
  if(!!err) return console.error(err.stack);

  if(nar.install.type === "ghost"){
    var shellDir = nar.getDirectory(/shell\/master\//);
    var shell = new Shell(nar.directory);

  }else if(nar.install.type === "shell"){
    var shell = new Shell(nar.directory);

  }else{
    throw new Error("wrong nar file")
  }

  shell.load(function(err){
    if(!!err) return console.error(err.stack);

    console.log(shell);


    var $wrapper = $("<div />")
      .on("IkagakaSurfaceEvent", function(ev){
        console.log(ev.detail);
      })
      .appendTo("body");
    var $canvas = $("<canvas style='display:inline-block;' />")
      .appendTo($wrapper);

    var surface = shell.attachSurface($canvas[0], 0, 0);

    console.log(surface);
  });
});
</script>
```
