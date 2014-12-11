// Generated by CoffeeScript 1.8.0
(function() {
  var $, Nar, Promise, Shell, Surface, SurfaceUtil, SurfacesTxt2Yaml, URL, _, _ref, _ref1, _ref2;

  _ = window["_"];

  $ = window["Zepto"];

  SurfacesTxt2Yaml = window["SurfacesTxt2Yaml"];

  Nar = window["Nar"] || ((_ref = window["Ikagaka"]) != null ? _ref["Nar"] : void 0) || require("ikagaka.nar.js");

  Surface = window["Surface"] || ((_ref1 = window["Ikagaka"]) != null ? _ref1["Surface"] : void 0) || require("./Surface.js");

  SurfaceUtil = window["SurfaceUtil"] || ((_ref2 = window["Ikagaka"]) != null ? _ref2["SurfaceUtil"] : void 0) || require("./SurfaceUtil.js");

  Promise = window["Promise"];

  URL = window["URL"];

  Shell = (function() {
    function Shell(directory) {
      this.directory = directory;
      this.descript = null;
      this.surfaces = null;
    }

    Shell.prototype.load = function() {
      var hits, keys, prm, surfaces;
      if (!!this.directory["descript.txt"]) {
        this.descript = Nar.parseDescript(Nar.convert(this.directory["descript.txt"]));
      } else {
        this.descript = {};
        console.warn("descript.txt is not found");
      }
      keys = Object.keys(this.directory);
      hits = keys.filter(function(name) {
        return /surfaces\d*\.txt$/.test(name);
      });
      if (hits.length === 0) {
        console.warn("surfaces.txt is not found");
        surfaces = {
          "surfaces": {}
        };
      } else {
        surfaces = hits.reduce(((function(_this) {
          return function(obj, name) {
            var _srfs;
            console.log(name);
            _srfs = Shell.parseSurfaces(Nar.convert(_this.directory[name]));
            return $.extend(true, obj, _srfs);
          };
        })(this)), {});
      }
      prm = Promise.resolve(surfaces);
      prm = prm.then(Shell.mergeSurfacesAndSurfacesFiles(this.directory));
      prm = prm.then(Shell.loadSurfaces(this.directory));
      prm = prm.then(Shell.loadElements(this.directory));
      prm = prm.then(Shell.createBases(this.directory));
      prm = prm.then((function(_this) {
        return function(surfaces) {
          _this.surfaces = surfaces;
          _this.directory = null;
          return _this;
        };
      })(this));
      prm = prm["catch"](function(err) {
        console.error(err);
        err.message && console.error(err.message);
        err.stack && console.error(err.stack);
        throw err;
      });
      return prm;
    };

    Shell.prototype.attachSurface = function(canvas, scopeId, surfaceId) {
      var hit, keys, srfs, type, _ref3, _ref4, _surfaceId;
      type = scopeId === 0 ? "sakura" : "kero";
      if (Array.isArray((_ref3 = this.surfaces.aliases) != null ? (_ref4 = _ref3[type]) != null ? _ref4[surfaceId] : void 0 : void 0)) {
        _surfaceId = SurfaceUtil.choice(this.surfaces.aliases[type][surfaceId]);
      } else {
        _surfaceId = surfaceId;
      }
      srfs = this.surfaces.surfaces;
      keys = Object.keys(srfs);
      hit = keys.find(function(name) {
        return srfs[name].is === _surfaceId;
      });
      if (!hit) {
        return null;
      }
      return new Surface(canvas, scopeId, hit, this.surfaces);
    };

    Shell.createBases = function(directory) {
      return function(surfaces) {
        return new Promise(function(resolve, reject) {
          var keys, srfs;
          srfs = surfaces.surfaces;
          keys = Object.keys(srfs);
          keys.forEach(function(name) {
            var baseSurface, elms, mapped, sortedElms, srfutil, _keys, _ref3;
            sortedElms = [];
            if (!!srfs[name].elements) {
              elms = srfs[name].elements;
              _keys = Object.keys(elms);
              mapped = _keys.map(function(key) {
                return {
                  is: elms[key].is,
                  x: elms[key].x,
                  y: elms[key].y,
                  canvas: elms[key].canvas,
                  type: elms[key].type
                };
              });
              sortedElms = mapped.sort(function(elmA, elmB) {
                if (elmA.is > elmB.is) {
                  return 1;
                } else {
                  return -1;
                }
              });
              delete srfs[name].elements;
            }
            baseSurface = srfs[name].baseSurface || ((_ref3 = sortedElms[0]) != null ? _ref3.canvas : void 0);
            if (!baseSurface) {
              console.warn(name + " does not have base surface");
              return;
            }
            baseSurface = SurfaceUtil.copy(baseSurface);
            baseSurface = SurfaceUtil.transImage(baseSurface);
            srfutil = new SurfaceUtil(baseSurface);
            srfutil.composeElements(sortedElms);
            return srfs[name].baseSurface = baseSurface;
          });
          return resolve(surfaces);
        });
      };
    };

    Shell.loadElements = function(directory) {
      return function(surfaces) {
        return new Promise(function(resolve, reject) {
          var hits, keys, prm, promises, srfs;
          srfs = surfaces.surfaces;
          keys = Object.keys(srfs);
          hits = keys.filter(function(name) {
            return !!srfs[name].elements;
          });
          promises = [];
          hits.forEach(function(srfName) {
            var elmKeys;
            elmKeys = Object.keys(srfs[srfName].elements);
            return elmKeys.forEach(function(elmName) {
              var elm, file, filename, path, type, x, y, _prm;
              elm = srfs[srfName].elements[elmName];
              type = elm.type, file = elm.file, x = elm.x, y = elm.y;
              keys = Object.keys(directory);
              path = keys.find(function(path) {
                var a, b;
                a = path.toLowerCase();
                b = file.toLowerCase();
                if (a === b) {
                  return true;
                }
                if (a === (b + ".png").toLowerCase()) {
                  console.warn("element file " + b + " is need '.png' extension");
                  return true;
                }
                return false;
              });
              if (!path) {
                console.warn("element " + file + " is not found");
                elm.canvas = document.createElement("canvas");
                elm.canvas.width = 1;
                elm.canvas.height = 1;
                return;
              }
              if (!!directory[path]) {
                filename = path;
              } else if (!!directory[path + ".png"]) {
                filename = path + ".png";
              } else {
                filename = null;
              }
              if (!!filename) {
                _prm = Promise.resolve(filename);
                _prm = _prm.then(Shell.loadPNGAndPNA(directory));
                _prm = _prm.then(function(cnv) {
                  return elm.canvas = cnv;
                });
                _prm = _prm["catch"](reject);
                return promises.push(_prm);
              }
            });
          });
          prm = Promise.all(promises);
          prm = prm.then(function() {
            return resolve(surfaces);
          });
          prm = prm["catch"](reject);
          return prm;
        });
      };
    };

    Shell.loadSurfaces = function(directory) {
      return function(surfaces) {
        return new Promise(function(resolve, reject) {
          var hits, keys, prm, promises, srfs;
          srfs = surfaces.surfaces;
          keys = Object.keys(srfs);
          hits = keys.filter(function(name) {
            return !!srfs[name].filename;
          });
          promises = hits.map(function(name) {
            var _prm;
            _prm = Promise.resolve(srfs[name].filename);
            _prm = _prm.then(Shell.loadPNGAndPNA(directory));
            _prm = _prm.then(function(cnv) {
              return srfs[name].baseSurface = cnv;
            });
            _prm = _prm["catch"](reject);
            return _prm;
          });
          prm = Promise.all(promises);
          prm = prm.then(function() {
            return resolve(surfaces);
          });
          prm = prm["catch"](reject);
          return prm;
        });
      };
    };

    Shell.loadPNGAndPNA = function(directory) {
      return function(filename) {
        return new Promise(function(resolve, reject) {
          var buffer, url;
          buffer = directory[filename];
          url = URL.createObjectURL(new Blob([buffer], {
            type: "image/png"
          }));
          return SurfaceUtil.loadImage(url, function(err, img) {
            var cnv;
            if (!!err) {
              URL.revokeObjectURL(url);
              return reject(err);
            } else {
              cnv = SurfaceUtil.copy(img);
              URL.revokeObjectURL(url);
              filename = filename.replace(/\.png$/, ".pna");
              if (!directory[filename.replace(/\.png$/, ".pna")]) {
                return resolve(SurfaceUtil.transImage(cnv));
              } else {
                buffer = directory[filename];
                url = URL.createObjectURL(new Blob([buffer], {
                  type: "image/png"
                }));
                return SurfaceUtil.loadImage(url, function(err, img) {
                  var pnacnv;
                  if (!!err) {
                    URL.revokeObjectURL(url);
                    return resolve(SurfaceUtil.transImage(cnv));
                  } else {
                    pnacnv = SurfaceUtil.copy(img);
                    URL.revokeObjectURL(url);
                    cnv = SurfaceUtil.pna(cnv, pnacnv);
                    return resolve(cnv);
                  }
                });
              }
            }
          });
        });
      };
    };

    Shell.mergeSurfacesAndSurfacesFiles = function(directory) {
      return function(surfaces) {
        return new Promise(function(resolve, reject) {
          var hits, keys, srfs, tuples;
          srfs = surfaces.surfaces;
          keys = Object.keys(directory);
          hits = keys.filter(function(filename) {
            return /^surface\d+\.png$/i.test(filename);
          });
          tuples = hits.map(function(filename) {
            return [Number((/^surface(\d+)\.png$/i.exec(filename) || ["", "-1"])[1]), filename];
          });
          tuples.forEach(function(_arg) {
            var filename, n, name;
            n = _arg[0], filename = _arg[1];
            name = Object.keys(srfs).find(function(name) {
              return srfs[name].is === n;
            });
            name = name || "surface" + n;
            srfs[name] = srfs[name] || {
              is: n
            };
            srfs[name].filename = filename;
            srfs[name].baseSurface = document.createElement("canvas");
            srfs[name].baseSurface.width = 1;
            return srfs[name].baseSurface.height = 1;
          });
          return resolve(surfaces);
        });
      };
    };

    Shell.parseSurfaces = function(text) {
      var keys, srfs, surfaces;
      surfaces = SurfacesTxt2Yaml.txt_to_data(text, {
        compatible: 'ssp-lazy'
      });
      surfaces.surfaces = surfaces.surfaces || {};
      srfs = surfaces.surfaces;
      keys = Object.keys(srfs);
      surfaces.surfaces = keys.reduce((function(obj, name) {
        if (typeof srfs[name].is !== "undefined") {
          obj[name] = srfs[name];
        }
        if (Array.isArray(srfs[name].base)) {
          srfs[name].base.forEach(function(key) {
            return $.extend(true, srfs[name], srfs[key]);
          });
          delete srfs[name].base;
        }
        return obj;
      }), {});
      return surfaces;
    };

    Shell.SurfaceUtil = SurfaceUtil;

    return Shell;

  })();

  if ((typeof module !== "undefined" && module !== null ? module.exports : void 0) != null) {
    module.exports = Shell;
  } else if (this.Ikagaka != null) {
    this.Ikagaka.Shell = Shell;
  } else {
    this.Shell = Shell;
  }

}).call(this);
