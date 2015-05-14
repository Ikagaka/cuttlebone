var cuttlebone;
(function (cuttlebone) {
    var Descript;
    (function (Descript) {
        function parse(txt) {
            var lines = txt.split("\r").join("\n").split(/\n+/);
            var json = {};
            lines.forEach(function (line) {
                var _a = line.split(","), key = _a[0], vals = _a.slice(1);
                var ptr = json;
                key.split(".").forEach(function (prop, i, arr) {
                    if (prop === "sakura")
                        prop = "char0";
                    if (prop === "kero")
                        prop = "char1";
                    if (/^(.*[^\d])(\d+)$/.test(prop)) {
                        var _a = /^(.*[^\d])(\d+)$/.exec(prop), _ = _a[0], prop = _a[1], n = _a[2];
                        if (!Array.isArray(ptr[prop]))
                            ptr[prop] = [];
                        if (i === arr.length - 1) {
                            ptr[prop][n] = vals.map(function (val) { return val.trim(); });
                        }
                        else if (ptr[prop][n] == null) {
                            ptr[prop][n] = {};
                        }
                        ptr = ptr[prop][n];
                    }
                    else {
                        if (i === arr.length - 1) {
                            ptr[prop] = vals.map(function (val) { return val.trim(); });
                        }
                        else if (ptr[prop] == null) {
                            ptr[prop] = {};
                        }
                        ptr = ptr[prop];
                    }
                }, {});
            });
            return json;
        }
        Descript.parse = parse;
    })(Descript = cuttlebone.Descript || (cuttlebone.Descript = {}));
})(cuttlebone || (cuttlebone = {}));
