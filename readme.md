# cuttlebone

[![npm](https://img.shields.io/npm/v/cuttlebone.svg?style=flat)](https://npmjs.com/package/cuttlebone) [![bower](https://img.shields.io/bower/v/cuttlebone.svg)](http://bower.io/search/?q=ikagaka)

ukagaka shell renderer for web browser

![screenshot](https://raw.githubusercontent.com/Ikagaka/cuttlebone/master/screenshot.png)

## About
cuttleboneは伺かのシェル描画エンジンです。

+ [demo](https://ikagaka.github.io/cuttlebone/demo/playground.html)

# 使い方

```bash
mkdir helloworld
cd helloworld
npm install -g bower
bower install cuttlebone narloader
mkdir nar
cp path/to/mobilemaster.nar nar
cp path/to/origin.nar nar
touch index.html
vim index.html
```

次の内容が`index.html`でゴーストを表示するための最小のサンプルコードです。

```html
<script src="bower_components/bluebird/js/browser/bluebird.min.js"></script>
<script src="bower_components/encoding-japanese/encoding.min.js"></script>
<script src="bower_components/jszip/dist/jszip.min.js"></script>
<script src="bower_components/narloader/NarLoader.js"></script>
<script src="bower_components/cuttlebone/dist/cuttlebone.js"></script>
<script>
Promise.all([
  NarLoader.loadFromURL("./nar/mobilemaster.nar"),
  NarLoader.loadFromURL("./nar/origin.nar")
]).then(function(arg){
  var shellNanikaDir = arg[0];
  var balloonNanikaDir = arg[1];
  var shellDir = shellNanikaDir.getDirectory("shell/master").asArrayBuffer();
  var balloonDir = balloonNanikaDir.asArrayBuffer();
  var shell = new cuttlebone.Shell(shellDir);
  var balloon = new cuttlebone.Balloon(balloonDir);
  return Promise.all([
    shell.load(),
    balloon.load()
  ]);
}).then(function(arg){
  var shell = arg[0];
  var balloon = arg[1];

  var nmdmgr = new cuttlebone.NamedManager()
  document.body.appendChild(nmdmgr.element);

  var hwnd = nmdmgr.materialize(shell, balloon);
  var named = nmdmgr.named(hwnd);


  var hwnd = nmdmgr.materialize(shell, balloon);
  var named = nmdmgr.named(hwnd);

  named.scope(0).surface(0);
  named.scope(0).blimp(0).talk("Hello world!");
});
</script>
```

詳しくは以下のドキュメントも参照してください。

* [NamedManager.js](https://github.com/Ikagaka/NamedManager.js/)
  * [Shell.js](https://github.com/Ikagaka/Shell.js/)
  * [Balloon.js](https://github.com/Ikagaka/Balloon.js/)
