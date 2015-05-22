/// <reference path="../typings/bluebird/bluebird.d.ts"/>
/// <reference path="../typings/qunit/qunit.d.ts"/>
/// <reference path="../typings/zepto/zepto.d.ts"/>
/// <reference path="../tsd/NarLoader/NarLoader.d.ts"/>
/// <reference path="../src/Surface.ts"/>
/// <reference path="../src/Shell.ts"/>

var prmNar = NarLoader.loadFromURL("../nar/mobilemaster.nar");

prmNar.then((nanikaDir)=>{

  QUnit.module("cuttlebone.Shell");

  var shellDir = nanikaDir.getDirectory("shell/master").asArrayBuffer();
  console.dir(shellDir);

  var shell = new cuttlebone.Shell(shellDir);

  QUnit.test("shell#load", (assert)=> {
    var done = assert.async();
    //shell.enablePNGdecoder = false;
    return shell.load().then((shell)=>{
      assert.ok(true);
      console.log(shell);

      setInterval(()=>{
        shell.unbind(20);
        shell.unbind(30);
        shell.unbind(31);
        shell.unbind(32);
        shell.unbind(50);
        shell.enableRegionVisible = true;
        shell.render();
        setTimeout(()=>{
          shell.bind(20);
          shell.bind(30);
          shell.bind(31);
          shell.bind(32);
          shell.bind(50);
          shell.enableRegionVisible = false;
          shell.render();
        }, 3000);
      }, 6000);

      done();
    }).catch((err)=>{
      console.error(err, err.stack, shell);
      assert.ok(false);
      done();
    });
  });


  QUnit.test("shell#hasFile", (assert)=> {
    console.log(2)
    assert.ok(shell.hasFile("surface0.png"));
    assert.ok(shell.hasFile("surface0.PNG"));
    assert.ok(shell.hasFile(".\\SURFACE0.PNG"));
    assert.ok(!shell.hasFile("surface0+png"));
    assert.ok(shell.hasFile("./surface0.png"));
    assert.ok(!shell.hasFile("/surface0/png"));
  });

  QUnit.test("shell.descript", (assert)=> {
    assert.ok(shell.descript["kero.bindgroup20.name"] === "装備,飛行装備");
  });

  QUnit.test("shell.surfacesTxt", (assert)=> {
    assert.ok(shell.surfacesTxt.charset === "Shift_JIS");
    assert.ok(shell.surfacesTxt.descript.version === 1);
  });

  QUnit.test("shell#attachSurface (periodic)", (assert)=> {
    var cnv = document.createElement("canvas");
    var srf = shell.attachSurface(cnv, 0, 0);
    srf.render();
    assert.ok(srf.surfaceId === 0);
    setInterval(()=>{srf.talk()}, 80);
    setPictureFrame(srf, "※\s[0]。periodic,5瞬き、talk,4口パク。");
  });

  QUnit.test("shell#attachSurface (basic element and animation)", (assert)=> {
    var cnv = document.createElement("canvas");
    var srf = shell.attachSurface(cnv, 0, 3);
    console.log(srf)
    assert.ok(srf.surfaceId === 3);
    assert.ok(srf.element instanceof HTMLCanvasElement);
    assert.ok(srf.element.height === 445);
    assert.ok(srf.element.width === 182);
    assert.ok(srf.surfaceTreeNode.collisions[0].name === "Head");
    assert.ok(srf.surfaceTreeNode.animations[0].interval === "sometimes");
    setInterval(()=>{srf.talk()}, 80);
    setPictureFrame(srf, "※胸を腕で覆っている。sometimes瞬き、random,6目そらし、talk,4口パク。");
  });

  QUnit.test("shell#attachSurface (animation always)", (assert)=> {
    var cnv = document.createElement("canvas");
    var srf = shell.attachSurface(cnv, 0, 7);
    assert.ok(srf.surfaceId === 7);
    assert.ok(srf.element instanceof HTMLCanvasElement);
    assert.ok(srf.element.height === 445);
    assert.ok(srf.element.width === 182);
    assert.ok(srf.surfaceTreeNode.collisions[0].name === "Head");
    setInterval(()=>{srf.talk()}, 80);
    setPictureFrame(srf, "※腕組み。瞬き、always怒り、口パク。");
  });

  QUnit.test("shell#attachSurface (runonce)", (assert)=> {
    var cnv = document.createElement("canvas");
    var srf = shell.attachSurface(cnv, 0, 401);
    assert.ok(srf.surfaceId === 401);
    assert.ok(srf.element instanceof HTMLCanvasElement);
    assert.ok(srf.element.height === 445);
    assert.ok(srf.element.width === 182);
    setPictureFrame(srf, "※寝ぼけ。runonce口に手を当ててから直ぐ離し目パチ。");
  });

  QUnit.test("shell#attachSurface ", (assert)=> {
    var cnv = document.createElement("canvas");
    var srf = shell.attachSurface(cnv, 0, 11);
    console.log(srf)
    assert.ok(srf.surfaceId === 11);
    assert.ok(srf.element instanceof HTMLCanvasElement);
    assert.ok(srf.element.height === 210);
    assert.ok(srf.element.width === 230);
    assert.ok(srf.surfaceTreeNode.collisions[0].name === "Screen");
    setInterval(()=>{srf.talk()}, 80);
    setPictureFrame(srf, "CRTゅう");
  });

  QUnit.test("shell#attachSurface (srf.play())", (assert)=> {
    var cnv = document.createElement("canvas");
    var srf = shell.attachSurface(cnv, 0, 5000);
    srf.play(100);
    assert.ok(srf.surfaceId === 5000);
    setPictureFrame(srf, "※１回のみ爆発アニメ。");
  });

  QUnit.test("shell#attachSurface (error filepath handle)", (assert)=> {
    var cnv = document.createElement("canvas");
    var srf = shell.attachSurface(cnv, 0, 5001);
    srf.render();
    assert.ok(srf.surfaceId === 5001);
    assert.ok(srf.element instanceof HTMLCanvasElement);
    assert.ok(srf.element.height === 300);
    assert.ok(srf.element.width === 300);
    setPictureFrame(srf, "※透明です。ファイル名エラー補正のテスト。");
  });


  function setPictureFrame(srf: cuttlebone.Surface, description?: string): void {
    var fieldset = document.createElement("fieldset");
    var legend = document.createElement("legend");
    var p = document.createElement("p");
    legend.appendChild(document.createTextNode(""+srf.surfaceId));
    p.appendChild(document.createTextNode(description || ""));
    fieldset.appendChild(legend);
    fieldset.appendChild(srf.element);
    fieldset.appendChild(p);
    fieldset.style.display = "inline-block";
    fieldset.style.width = "310px";
    document.body.appendChild(fieldset);
    srf.element.addEventListener("mousemove", (ev)=>{
      var {pageX, pageY} = ev;
      var {left, top} = $(ev.target).offset();
      var offsetX = pageX - left;
      var offsetY = pageY - top;
      var hit = srf.getRegion(offsetX, offsetY);
      if(hit.isHit){
        $(ev.target).css({"cursor": "pointer"});
      }else{
        $(ev.target).css({"cursor": "default"});
      }
    });
  }
});
