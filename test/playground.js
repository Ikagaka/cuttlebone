// Generated by CoffeeScript 1.9.2
(function() {
  var balloonDir, nmdmgr, onNarLoad;

  nmdmgr = null;

  balloonDir = null;

  $(function() {
    $("#nar").change(function(ev) {
      var file;
      file = ev.target.files[0];
      NarLoader.loadFromBlob(file).then(onNarLoad);
      return $(this).val(null);
    });
    return NarLoader.loadFromURL("../nar/origin.nar").then(function(nanikaDir) {
      console.log(balloonDir = nanikaDir.asArrayBuffer());
      console.log(nmdmgr = new cuttlebone.NamedManager());
      $(nmdmgr.element).appendTo("body");
      return NarLoader.loadFromURL("../nar/mobilemaster.nar").then(onNarLoad);
    });
  });

  onNarLoad = function(nanikaDir) {
    var balloon, shell, shellDir;
    console.log(shellDir = nanikaDir.getDirectory("shell/master").asArrayBuffer());
    console.log(shell = new cuttlebone.Shell(shellDir));
    console.log(balloon = new cuttlebone.Balloon(balloonDir));
    return Promise.all([shell.load(), balloon.load()]).then(function(arg) {
      var balloon, hwnd, named, shell, wait;
      shell = arg[0], balloon = arg[1];
      console.log(shell, balloon);
      console.log(hwnd = nmdmgr.materialize(shell, balloon));
      console.log(named = nmdmgr.named(hwnd));
      wait = function(ms, callback) {
        return function(ctx) {
          return new Promise(function(resolve) {
            return setTimeout((function() {
              callback(ctx);
              return resolve(ctx);
            }), ms);
          });
        };
      };
      named.on("mousedown", function(ev) {
        return console.log(ev);
      });
      named.on("mousemove", function(ev) {
        return console.log(ev);
      });
      named.on("mouseup", function(ev) {
        return console.log(ev);
      });
      named.on("mouseclick", function(ev) {
        return console.log(ev);
      });
      named.on("mousedblclick", function(ev) {
        return console.log(ev);
      });
      named.on("balloonclick", function(ev) {
        return console.log(ev);
      });
      named.on("balloondblclick", function(ev) {
        return console.log(ev);
      });
      named.on("anchorselect", function(ev) {
        return console.log(ev);
      });
      named.on("anchorselectex", function(ev) {
        return console.log(ev);
      });
      named.on("raise", function(ev) {
        return console.log(ev);
      });
      named.on("choiceselectex", function(ev) {
        return console.log(ev);
      });
      named.on("choiceselect", function(ev) {
        return console.log(ev);
      });
      return named.load().then(wait(0, function(named) {
        return named.scope(0);
      })).then(wait(0, function(named) {
        return named.scope().surface(0);
      })).then(wait(0, function(named) {
        return named.scope(1);
      })).then(wait(0, function(named) {
        return named.scope().surface(10);
      })).then(wait(0, function(named) {
        return named.scope(0);
      })).then(wait(0, function(named) {
        return named.scope().blimp(0);
      })).then(wait(80, function(named) {
        return named.scope().blimp().talk("H");
      })).then(wait(80, function(named) {
        return named.scope().blimp().talk("e");
      })).then(wait(80, function(named) {
        return named.scope().blimp().talk("l");
      })).then(wait(80, function(named) {
        return named.scope().blimp().talk("l");
      })).then(wait(80, function(named) {
        return named.scope().blimp().talk("o");
      })).then(wait(80, function(named) {
        return named.scope().blimp().talk(",");
      })).then(wait(80, function(named) {
        return named.scope().blimp().talk("w");
      })).then(wait(80, function(named) {
        return named.scope().blimp().talk("o");
      })).then(wait(80, function(named) {
        return named.scope().blimp().talk("r");
      })).then(wait(80, function(named) {
        return named.scope().blimp().talk("l");
      })).then(wait(80, function(named) {
        return named.scope().blimp().talk("d");
      })).then(wait(80, function(named) {
        return named.scope().blimp().talk("!");
      })).then(wait(160, function(named) {
        return named.scope(1);
      })).then(wait(0, function(named) {
        return named.scope().blimp().anchorBegin("AnchorID");
      })).then(wait(0, function(named) {
        return named.scope().blimp().talk("anchor");
      })).then(wait(0, function(named) {
        return named.scope().blimp().anchorEnd();
      })).then(wait(0, function(named) {
        return named.scope().blimp().br();
      })).then(wait(0, function(named) {
        return named.scope().blimp().talk("<" + "script>alert(1);<" + "/script>");
      })).then(wait(0, function(named) {
        return named.scope().blimp().br();
      })).then(wait(0, function(named) {
        return named.scope().blimp().choice("choice", "ChoceID");
      })).then(wait(0, function(named) {
        return named.scope().blimp().talk("hi.");
      })).then(wait(0, function(named) {
        return named.scope().blimp().showWait();
      })).then(wait(3000, function(named) {
        return named.scope().blimp().talk("stop wait");
      }));
    })["catch"](function(err) {
      return console.error(err, err.stack);
    });
  };

}).call(this);

//# sourceMappingURL=playground.js.map
