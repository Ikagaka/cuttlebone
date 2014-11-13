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
Nar.loadFromURL("./node_modules/ikagaka.nar.js/vender/mobilemaster.nar", function (err, tree){
  if(!!err) return console.error(err.stack);

  var shell = new Shell(tree);

  shell.load(Object.keys(shell.shells)[0], function(err){
    if(!!err) return console.error(err.stack);

    console.log(shell);

    var surface = shell.getSurface(0, 0);

    console.log(surface);

    if(surface != null){
      $(surface.element).on("IkagakaSurfaceEvent", function(ev){
        console.log(ev.detail);
      });

      $(surface.element).appendTo("body");
    }


  });
});
</script>
```
