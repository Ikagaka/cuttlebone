Nar.js
======================
  Nar.js can read .nar file of "Nanika Archive".


Usage
--------

```html
<script src="./vender/encoding.js"></script>
<script src="./vender/jszip.min.js"></script>
<script src="./vender/XHRProxy.min.js"></script>
<script src="./vender/WMDescript.js"></script>
<script src="./Nar.js"></script>
<script>
Nar.loadFromURL("./vender/mobilemaster.nar", function(err, tree){
  if(!!err) return console.error(err.stack);

  var buffer = tree["ghost"]["master"]["descript.txt"].asArrayBuffer();
  var text = Nar.convert(buffer);
  var descript = Nar.parseDescript(text);
  console.assert(descript["name"] === 'the "MobileMaster"', "cannot read descript.txt");

});
</script>
```
