// Generated by CoffeeScript 1.7.1
var Shell;

Shell = (function() {
  var Nar, Promise, Surface, SurfacesTxt2Yaml, URL, _;

  _ = window["_"];

  Nar = window["Nar"];

  Promise = window["Promise"];

  Surface = window["Surface"];

  SurfacesTxt2Yaml = window["SurfacesTxt2Yaml"];

  URL = window["URL"];

  function Shell(tree) {
    if (!tree["descript.txt"]) {
      throw new Error("descript.txt not found");
    }
    this.tree = tree;
    this.descript = Nar.parseDescript(Nar.convert(this.tree["descript.txt"].asArrayBuffer()));
    this.surfaces = null;
  }

  Shell.prototype.load = function(callback) {
    var merged, surfacesYaml;
    if (!!this.tree["surfaces.txt"]) {
      surfacesYaml = Shell.parseSurfaces(Nar.convert(this.tree["surfaces.txt"].asArrayBuffer()));
    } else {
      surfacesYaml = {
        "surfaces": {}
      };
    }
    merged = Shell.mergeSurfacesAndSurfacesFiles(surfacesYaml, this.tree);
    return Shell.loadSurfaces(merged, this.tree, (function(_this) {
      return function(err, loaded) {
        return Shell.loadElements(loaded, _this.tree, function(err, loaded) {
          if (!!err) {
            return callback(err);
          }
          _this.surfaces = Shell.createBases(loaded);
          return callback(null);
        });
      };
    })(this));
  };

  Shell.prototype.getSurface = function(scopeId, surfaceId) {
    var hits, n, srfs;
    n = surfaceId;
    srfs = this.surfaces.surfaces;
    hits = Object.keys(srfs).filter(function(name) {
      return Number(srfs[name].is) === n;
    });
    if (hits.length === 0) {
      return null;
    }
    return new Surface(scopeId, srfs[hits[0]], this.surfaces);
  };

  Shell.createBases = function(loaded) {
    var srfs;
    srfs = loaded.surfaces;
    Object.keys(srfs).forEach(function(name) {
      var base, cnv, sorted, srfutil;
      srfs[name].is = srfs[name].is;
      cnv = srfs[name].canvas;
      if (!srfs[name].elements) {
        srfs[name].base = cnv;
      } else {
        sorted = Object.keys(srfs[name].elements).sort(function(a, b) {
          if (a.is > b.is) {
            return 1;
          } else {
            return -1;
          }
        }).map(function(key) {
          return srfs[name].elements[key];
        });
        base = sorted[0].canvas || srfs[name].canvas;
        srfutil = new SurfaceUtil(base);
        srfutil.composeElements(sorted);
        srfs[name].base = base;
      }
      return srfs[name].canvas = null;
    });
    return loaded;
  };

  Shell.loadSurfaces = function(merged, surfacesDir, callback) {
    var promises, srfs;
    srfs = merged.surfaces;
    promises = Object.keys(srfs).filter(function(name) {
      return !!srfs[name].file;
    }).map(function(name) {
      return new Promise(function(resolve, reject) {
        return setTimeout(function() {
          var buffer, url;
          buffer = srfs[name].file.asArrayBuffer();
          url = URL.createObjectURL(new Blob([buffer], {
            type: "image/png"
          }));
          return SurfaceUtil.loadImage(url, function(err, img) {
            URL.revokeObjectURL(url);
            if (!!err) {
              return reject(err);
            }
            srfs[name].canvas = SurfaceUtil.transImage(img);
            return resolve();
          });
        });
      });
    });
    Promise.all(promises).then(function() {
      return callback(null, merged);
    })["catch"](function(err) {
      console.error(err, err.stack);
      return callback(err, null);
    });
    return void 0;
  };

  Shell.loadElements = function(merged, surfacesDir, callback) {
    var promises, srfs;
    srfs = merged.surfaces;
    promises = Object.keys(srfs).filter(function(name) {
      return !!srfs[name].elements;
    }).reduce((function(arr, srfName) {
      return arr.concat(Object.keys(srfs[srfName].elements).map(function(elmName) {
        var elm;
        elm = srfs[srfName].elements[elmName];
        return new Promise(function(resolve, reject) {
          return setTimeout(function() {
            var buffer, file, type, url, x, y;
            type = elm.type, file = elm.file, x = elm.x, y = elm.y;
            if (!surfacesDir[file]) {
              file += ".png";
            }
            if (!surfacesDir[file]) {
              reject(new Error(file.substr(0, file.length - 4) + "element file not found"));
            }
            buffer = surfacesDir[file].asArrayBuffer();
            url = URL.createObjectURL(new Blob([buffer], {
              type: "image/png"
            }));
            return SurfaceUtil.loadImage(url, function(err, img) {
              URL.revokeObjectURL(url);
              if (!!err) {
                return reject(err.error);
              }
              elm.canvas = SurfaceUtil.transImage(img);
              return resolve();
            });
          });
        });
      }));
    }), []);
    Promise.all(promises).then(function() {
      return callback(null, merged);
    })["catch"](function(err) {
      console.error(err, err.stack);
      return callback(err, null);
    });
    return void 0;
  };

  Shell.mergeSurfacesAndSurfacesFiles = function(surfaces, surfacesDir) {
    return Object.keys(surfacesDir).filter(function(filename) {
      return /^surface\d+\.png$/i.test(filename);
    }).map(function(filename) {
      return [Number((/^surface(\d+)\.png$/i.exec(filename) || ["", "-1"])[1]), surfacesDir[filename]];
    }).reduce((function(surfaces, _arg) {
      var file, n, name, srfs;
      n = _arg[0], file = _arg[1];
      name = "surface" + n;
      srfs = surfaces.surfaces;
      if (!srfs[name]) {
        srfs[name] = {
          is: "" + n
        };
      }
      srfs[name].file = file;
      srfs[name].canvas = null;
      srfs[name].base = null;
      return surfaces;
    }), surfaces);
  };

  Shell.parseSurfaces = function(text) {
    var data;
    data = SurfacesTxt2Yaml.txt_to_data(text);
    data.surfaces = Object.keys(data.surfaces).reduce((function(obj, name) {
      if (data.surfaces[name].is != null) {
        obj[name] = data.surfaces[name];
      }
      if (data.surfaces[name].base != null) {
        data.surfaces[name].base.forEach(function(key) {
          return data.surfaces[name] = _.extend(data.surfaces[name], data.surfaces[key]);
        });
      }
      return obj;
    }), {});
    return data;
  };

  return Shell;

})();
