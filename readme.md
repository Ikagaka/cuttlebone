Shell.js
======================
  Shell.js can play SERIKO/2.0 animation.


Usage
--------

```html
<script src="./node_modules/ikagaka.nar.js/vender/encoding.js"></script>
<script src="./node_modules/ikagaka.nar.js/vender/jszip.min.js"></script>
<script src="./node_modules/ikagaka.nar.js/vender/XHRProxy.min.js"></script>
<script src="./node_modules/ikagaka.nar.js/vender/WMDescript.js"></script>
<script src="./node_modules/ikagaka.nar.js/Nar.js"></script>
<script src="./vender/surfaces_txt2yaml.js"></script>
<script src="./vender/underscore-min.js"></script>
<script src="./vender/js-yaml.min.js"></script>
<script src="./vender/zepto.min.js"></script>
<script src="./SurfaceUtil.js"></script>
<script src="./Surface.js"></script>
<script src="./Shell.js"></script>
<script>
var nar = new Nar();
nar.loadFromURL("./node_modules/ikagaka.nar.js/vender/mobilemaster.nar", function (err){
  if(!!err) return console.error(err.stack);

  if(nar.install.type === "ghost"){
    var shell = new Shell(nar.tree["shell"]["master"]);
  }else if(nar.install.type === "shell"){
    var shell = new Shell(nar.tree);
  }else{
    throw new Error("wrong nar file")
  }

  shell.load(function(err){
    if(!!err) return console.error(err.stack);

    console.log(shell);

    var surface = shell.getSurface(0, 0);

    console.log(surface);

    if(surface != null){
      $(surface.element).appendTo("body");
    }

  });
});
</script>
```
