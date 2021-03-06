/*!
 Stencil Node System v0.0.0-dev.20210824195911 | MIT Licensed | https://stenciljs.com
 */
function _interopDefaultLegacy(e) {
 return e && "object" == typeof e && "default" in e ? e : {
  default: e
 };
}

function _interopNamespace(e) {
 if (e && e.__esModule) return e;
 var t = Object.create(null);
 return e && Object.keys(e).forEach((function(r) {
  if ("default" !== r) {
   var s = Object.getOwnPropertyDescriptor(e, r);
   Object.defineProperty(t, r, s.get ? s : {
    enumerable: !0,
    get: function() {
     return e[r];
    }
   });
  }
 })), t.default = e, t;
}

async function nodeCopyTasks(e, t) {
 const r = {
  diagnostics: [],
  dirPaths: [],
  filePaths: []
 };
 try {
  n = await Promise.all(e.map((e => async function r(e, t) {
   return (e => {
    const t = {
     "{": "}",
     "(": ")",
     "[": "]"
    }, r = /\\(.)|(^!|\*|[\].+)]\?|\[[^\\\]]+\]|\{[^\\}]+\}|\(\?[:!=][^\\)]+\)|\([^|]+\|[^\\)]+\))/;
    if ("" === e) return !1;
    let s;
    for (;s = r.exec(e); ) {
     if (s[2]) return !0;
     let r = s.index + s[0].length;
     const n = s[1], o = n ? t[n] : null;
     if (n && o) {
      const t = e.indexOf(o, r);
      -1 !== t && (r = t + 1);
     }
     e = e.slice(r);
    }
    return !1;
   })(e.src) ? await async function r(e, t) {
    return (await asyncGlob(e.src, {
     cwd: t,
     nodir: !0
    })).map((r => function s(e, t, r) {
     const s = path__default.default.join(e.dest, e.keepDirStructure ? r : path__default.default.basename(r));
     return {
      src: path__default.default.join(t, r),
      dest: s,
      warn: e.warn,
      keepDirStructure: e.keepDirStructure
     };
    }(e, t, r)));
   }(e, t) : [ {
    src: getSrcAbsPath(t, e.src),
    dest: e.keepDirStructure ? path__default.default.join(e.dest, e.src) : e.dest,
    warn: e.warn,
    keepDirStructure: e.keepDirStructure
   } ];
  }(e, t)))), e = n.flat ? n.flat(1) : n.reduce(((e, t) => (e.push(...t), e)), []);
  const s = [];
  for (;e.length > 0; ) {
   const t = e.splice(0, 100);
   await Promise.all(t.map((e => processCopyTask(r, s, e))));
  }
  const o = function s(e) {
   const t = [];
   return e.forEach((e => {
    !function r(e, t) {
     (t = normalizePath(t)) !== ROOT_DIR && t + "/" !== ROOT_DIR && "" !== t && (e.includes(t) || e.push(t));
    }(t, path__default.default.dirname(e.dest));
   })), t.sort(((e, t) => {
    const r = e.split("/").length, s = t.split("/").length;
    return r < s ? -1 : r > s ? 1 : e < t ? -1 : e > t ? 1 : 0;
   })), t;
  }(s);
  try {
   await Promise.all(o.map((e => mkdir(e, {
    recursive: !0
   }))));
  } catch (e) {}
  for (;s.length > 0; ) {
   const e = s.splice(0, 100);
   await Promise.all(e.map((e => copyFile(e.src, e.dest))));
  }
 } catch (e) {
  catchError(r.diagnostics, e);
 }
 var n;
 return r;
}

function getSrcAbsPath(e, t) {
 return path__default.default.isAbsolute(t) ? t : path__default.default.join(e, t);
}

async function processCopyTask(e, t, r) {
 try {
  r.src = normalizePath(r.src), r.dest = normalizePath(r.dest), (await stat(r.src)).isDirectory() ? (e.dirPaths.includes(r.dest) || e.dirPaths.push(r.dest), 
  await async function s(e, t, r) {
   try {
    const s = await readdir(r.src);
    await Promise.all(s.map((async s => {
     const n = {
      src: path__default.default.join(r.src, s),
      dest: path__default.default.join(r.dest, s),
      warn: r.warn
     };
     await processCopyTask(e, t, n);
    })));
   } catch (t) {
    catchError(e.diagnostics, t);
   }
  }(e, t, r)) : function n(e) {
   return e = e.trim().toLowerCase(), IGNORE.some((t => e.endsWith(t)));
  }(r.src) || (e.filePaths.includes(r.dest) || e.filePaths.push(r.dest), t.push(r));
 } catch (t) {
  !1 !== r.warn && (buildError(e.diagnostics).messageText = t.message);
 }
}

function asyncGlob(e, t) {
 return new Promise(((r, s) => {
  (0, glob__default.default.glob)(e, t, ((e, t) => {
   e ? s(e) : r(t);
  }));
 }));
}

function semiver(e, t, r) {
 return e = e.split("."), t = t.split("."), fn(e[0], t[0]) || fn(e[1], t[1]) || (t[2] = t.slice(2).join("."), 
 (r = /[.-]/.test(e[2] = e.slice(2).join("."))) == /[.-]/.test(t[2]) ? fn(e[2], t[2]) : r ? -1 : 1);
}

async function checkVersion(e, t) {
 try {
  const r = await async function r(e) {
   try {
    const e = await function t() {
     return new Promise((e => {
      fs__default.default.readFile(getLastCheckStoragePath(), "utf8", ((t, r) => {
       if (!t && isString(r)) try {
        e(JSON.parse(r));
       } catch (e) {}
       e(null);
      }));
     }));
    }();
    if (null == e) return setLastCheck(), null;
    if (!function r(e, t, s) {
     return t + s < e;
    }(Date.now(), e, 6048e5)) return null;
    const t = setLastCheck(), r = await async function s(e) {
     const t = await Promise.resolve().then((function() {
      return _interopNamespace(require("https"));
     }));
     return new Promise(((r, s) => {
      const n = t.request(e, (t => {
       if (t.statusCode > 299) return void s(`url: ${e}, staus: ${t.statusCode}`);
       t.once("error", s);
       const n = [];
       t.once("end", (() => {
        r(n.join(""));
       })), t.on("data", (e => {
        n.push(e);
       }));
      }));
      n.once("error", s), n.end();
     }));
    }(REGISTRY_URL), s = JSON.parse(r);
    return await t, s["dist-tags"].latest;
   } catch (t) {
    e.debug(`getLatestCompilerVersion error: ${t}`);
   }
   return null;
  }(e);
  if (null != r) return () => {
   semiver(t, r) < 0 ? function s(e, t, r) {
    const s = "npm install @stencil/core", n = [ `Update available: ${t} ${ARROW} ${r}`, "To get the latest, please run:", s, CHANGELOG ], o = n.reduce(((e, t) => t.length > e ? t.length : e), 0), i = [];
    let a = BOX_TOP_LEFT;
    for (;a.length <= o + 2 * PADDING; ) a += BOX_HORIZONTAL;
    a += BOX_TOP_RIGHT, i.push(a), n.forEach((e => {
     let t = BOX_VERTICAL;
     for (let e = 0; e < PADDING; e++) t += " ";
     for (t += e; t.length <= o + 2 * PADDING; ) t += " ";
     t += BOX_VERTICAL, i.push(t);
    }));
    let l = BOX_BOTTOM_LEFT;
    for (;l.length <= o + 2 * PADDING; ) l += BOX_HORIZONTAL;
    l += BOX_BOTTOM_RIGHT, i.push(l);
    let c = `${INDENT}${i.join(`\n${INDENT}`)}\n`;
    c = c.replace(t, e.red(t)), c = c.replace(r, e.green(r)), c = c.replace(s, e.cyan(s)), 
    c = c.replace(CHANGELOG, e.dim(CHANGELOG)), console.log(c);
   }(e, t, r) : console.debug(`${e.cyan("@stencil/core")} version ${e.green(t)} is the latest version`);
  };
 } catch (t) {
  e.debug(`unable to load latest compiler version: ${t}`);
 }
 return noop;
}

function setLastCheck() {
 return new Promise((e => {
  const t = JSON.stringify(Date.now());
  fs__default.default.writeFile(getLastCheckStoragePath(), t, (() => {
   e();
  }));
 }));
}

function getLastCheckStoragePath() {
 return path__default.default.join(os.tmpdir(), "stencil_last_version_node.json");
}

function getNextWorker(e) {
 const t = e.filter((e => !e.stopped));
 return 0 === t.length ? null : t.sort(((e, t) => e.tasks.size < t.tasks.size ? -1 : e.tasks.size > t.tasks.size ? 1 : e.totalTasksAssigned < t.totalTasksAssigned ? -1 : e.totalTasksAssigned > t.totalTasksAssigned ? 1 : 0))[0];
}

var ansiColors, create_1, fn;

Object.defineProperty(exports, "__esModule", {
 value: !0
});

const fs = require("./graceful-fs.js"), path = require("path"), util = require("util"), glob = require("./glob.js"), os = require("os"), crypto = require("crypto"), events = require("events"), cp = require("child_process"), fs__default = _interopDefaultLegacy(fs), path__default = _interopDefaultLegacy(path), glob__default = _interopDefaultLegacy(glob), os__namespace = _interopNamespace(os), cp__namespace = _interopNamespace(cp), createTerminalLogger = e => {
 let t = "info", r = null;
 const s = [], n = e => {
  if (e.length) {
   const t = new Date, r = "[" + ("0" + t.getMinutes()).slice(-2) + ":" + ("0" + t.getSeconds()).slice(-2) + "." + Math.floor(t.getMilliseconds() / 1e3 * 10) + "]";
   e[0] = f(r) + e[0].substr(r.length);
  }
 }, o = e => {
  if (e.length) {
   const t = "[ WARN  ]";
   e[0] = h(u(t)) + e[0].substr(t.length);
  }
 }, i = e => {
  if (e.length) {
   const t = "[ ERROR ]";
   e[0] = h(c(t)) + e[0].substr(t.length);
  }
 }, a = e => {
  if (e.length) {
   const t = new Date, r = "[" + ("0" + t.getMinutes()).slice(-2) + ":" + ("0" + t.getSeconds()).slice(-2) + "." + Math.floor(t.getMilliseconds() / 1e3 * 10) + "]";
   e[0] = d(r) + e[0].substr(r.length);
  }
 }, l = (t, n) => {
  if (r) {
   const r = new Date, o = ("0" + r.getHours()).slice(-2) + ":" + ("0" + r.getMinutes()).slice(-2) + ":" + ("0" + r.getSeconds()).slice(-2) + ".0" + Math.floor(r.getMilliseconds() / 1e3 * 10) + "  " + ("000" + (e.memoryUsage() / 1e6).toFixed(1)).slice(-6) + "MB  " + t + "  " + n.join(", ");
   s.push(o);
  }
 }, c = t => e.color(t, "red"), u = t => e.color(t, "yellow"), d = t => e.color(t, "cyan"), h = t => e.color(t, "bold"), f = t => e.color(t, "dim"), p = t => e.color(t, "bgRed"), g = e => LOG_LEVELS.indexOf(e) >= LOG_LEVELS.indexOf(t), m = (t, r, s) => {
  var n, o;
  let i = t.length - r + s - 1;
  for (;t.length + INDENT$1.length > e.getColumns(); ) if (r > t.length - r + s && r > 5) t = t.substr(1), 
  r--; else {
   if (!(i > 1)) break;
   t = t.substr(0, t.length - 1), i--;
  }
  const a = [], l = Math.max(t.length, r + s);
  for (n = 0; n < l; n++) o = t.charAt(n), n >= r && n < r + s && (o = p("" === o ? " " : o)), 
  a.push(o);
  return a.join("");
 }, _ = e => e.trim().startsWith("//") ? f(e) : e.split(" ").map((e => JS_KEYWORDS.indexOf(e) > -1 ? d(e) : e)).join(" "), y = e => {
  let t = !0;
  const r = [];
  for (var s = 0; s < e.length; s++) {
   const n = e.charAt(s);
   ";" === n || "{" === n ? t = !0 : ".#,:}@$[]/*".indexOf(n) > -1 && (t = !1), t && "abcdefghijklmnopqrstuvwxyz-_".indexOf(n.toLowerCase()) > -1 ? r.push(d(n)) : r.push(n);
  }
  return r.join("");
 };
 return {
  enableColors: e.enableColors,
  emoji: e.emoji,
  getLevel: () => t,
  setLevel: e => t = e,
  debug: (...t) => {
   if (g("debug")) {
    e.memoryUsage() > 0 && t.push(f(` MEM: ${(e.memoryUsage() / 1e6).toFixed(1)}MB`));
    const r = wordWrap(t, e.getColumns());
    a(r), console.log(r.join("\n"));
   }
   l("D", t);
  },
  info: (...t) => {
   if (g("info")) {
    const r = wordWrap(t, e.getColumns());
    n(r), console.log(r.join("\n"));
   }
   l("I", t);
  },
  warn: (...t) => {
   if (g("warn")) {
    const r = wordWrap(t, e.getColumns());
    o(r), console.warn("\n" + r.join("\n") + "\n");
   }
   l("W", t);
  },
  error: (...t) => {
   for (let e = 0; e < t.length; e++) if (t[e] instanceof Error) {
    const r = t[e];
    t[e] = r.message, r.stack && (t[e] += "\n" + r.stack);
   }
   if (g("error")) {
    const r = wordWrap(t, e.getColumns());
    i(r), console.error("\n" + r.join("\n") + "\n");
   }
   l("E", t);
  },
  createTimeSpan: (t, r = !1, s) => {
   const o = Date.now(), i = () => Date.now() - o, c = {
    duration: i,
    finish: (t, o, c, u) => {
     const d = i();
     let p;
     return p = d > 1e3 ? "in " + (d / 1e3).toFixed(2) + " s" : parseFloat(d.toFixed(3)) > 0 ? "in " + d + " ms" : "in less than 1 ms", 
     ((t, r, s, o, i, c, u) => {
      let d = t;
      if (s && (d = e.color(t, s)), o && (d = h(d)), d += " " + f(r), c) {
       if (g("debug")) {
        const t = [ d ], r = e.memoryUsage();
        r > 0 && t.push(f(` MEM: ${(r / 1e6).toFixed(1)}MB`));
        const s = wordWrap(t, e.getColumns());
        a(s), console.log(s.join("\n"));
       }
       l("D", [ `${t} ${r}` ]);
      } else {
       const s = wordWrap([ d ], e.getColumns());
       n(s), console.log(s.join("\n")), l("I", [ `${t} ${r}` ]), u && u.push(`${t} ${r}`);
      }
      i && console.log("");
     })(t, p, o, c, u, r, s), d;
    }
   };
   return ((t, r, s) => {
    const o = [ `${t} ${f("...")}` ];
    if (r) {
     if (g("debug")) {
      e.memoryUsage() > 0 && o.push(f(` MEM: ${(e.memoryUsage() / 1e6).toFixed(1)}MB`));
      const r = wordWrap(o, e.getColumns());
      a(r), console.log(r.join("\n")), l("D", [ `${t} ...` ]);
     }
    } else {
     const r = wordWrap(o, e.getColumns());
     n(r), console.log(r.join("\n")), l("I", [ `${t} ...` ]), s && s.push(`${t} ...`);
    }
   })(t, r, s), c;
  },
  printDiagnostics: (r, s) => {
   if (!r || 0 === r.length) return;
   let l = [ "" ];
   r.forEach((r => {
    l = l.concat(((r, s) => {
     const l = wordWrap([ r.messageText ], e.getColumns());
     let c = "";
     r.header && "Build Error" !== r.header && (c += r.header), "string" == typeof r.absFilePath && "string" != typeof r.relFilePath && ("string" != typeof s && (s = e.cwd()), 
     r.relFilePath = e.relativePath(s, r.absFilePath), r.relFilePath.includes("/") || (r.relFilePath = "./" + r.relFilePath));
     let h = r.relFilePath;
     return "string" != typeof h && (h = r.absFilePath), "string" == typeof h && (c.length > 0 && (c += ": "), 
     c += d(h), "number" == typeof r.lineNumber && r.lineNumber > -1 && (c += f(":"), 
     c += u(`${r.lineNumber}`), "number" == typeof r.columnNumber && r.columnNumber > -1 && (c += f(":"), 
     c += u(`${r.columnNumber}`)))), c.length > 0 && l.unshift(INDENT$1 + c), l.push(""), 
     r.lines && r.lines.length && (prepareLines(r.lines).forEach((e => {
      if (!isMeaningfulLine(e.text)) return;
      let t = "";
      for (e.lineNumber > -1 && (t = `L${e.lineNumber}:  `); t.length < INDENT$1.length; ) t = " " + t;
      let s = e.text;
      e.errorCharStart > -1 && (s = m(s, e.errorCharStart, e.errorLength)), t = f(t), 
      "typescript" === r.language || "javascript" === r.language ? t += _(s) : "scss" === r.language || "css" === r.language ? t += y(s) : t += s, 
      l.push(t);
     })), l.push("")), "error" === r.level ? i(l) : "warn" === r.level ? o(l) : "debug" === r.level ? a(l) : n(l), 
     null != r.debugText && "debug" === t && (l.push(r.debugText), a(wordWrap([ r.debugText ], e.getColumns()))), 
     l;
    })(r, s));
   })), console.log(l.join("\n"));
  },
  red: c,
  green: t => e.color(t, "green"),
  yellow: u,
  blue: t => e.color(t, "blue"),
  magenta: t => e.color(t, "magenta"),
  cyan: d,
  gray: t => e.color(t, "gray"),
  bold: h,
  dim: f,
  bgRed: p,
  setLogFilePath: e => r = e,
  writeLogs: t => {
   if (r) try {
    l("F", [ "--------------------------------------" ]), e.writeLogs(r, s.join("\n"), t);
   } catch (e) {}
   s.length = 0;
  }
 };
}, LOG_LEVELS = [ "debug", "info", "warn", "error" ], wordWrap = (e, t) => {
 const r = [], s = [];
 e.forEach((e => {
  null === e ? s.push("null") : void 0 === e ? s.push("undefined") : "string" == typeof e ? e.replace(/\s/gm, " ").split(" ").forEach((e => {
   e.trim().length && s.push(e.trim());
  })) : "number" == typeof e || "boolean" == typeof e || "function" == typeof e ? s.push(e.toString()) : Array.isArray(e) || Object(e) === e ? s.push((() => e.toString())) : s.push(e.toString());
 }));
 let n = INDENT$1;
 return s.forEach((e => {
  r.length > 25 || ("function" == typeof e ? (n.trim().length && r.push(n), r.push(e()), 
  n = INDENT$1) : INDENT$1.length + e.length > t - 1 ? (n.trim().length && r.push(n), 
  r.push(INDENT$1 + e), n = INDENT$1) : e.length + n.length > t - 1 ? (r.push(n), 
  n = INDENT$1 + e + " ") : n += e + " ");
 })), n.trim().length && r.push(n), r.map((e => e.trimRight()));
}, prepareLines = e => {
 const t = JSON.parse(JSON.stringify(e));
 for (let e = 0; e < 100; e++) {
  if (!eachLineHasLeadingWhitespace(t)) return t;
  for (let e = 0; e < t.length; e++) if (t[e].text = t[e].text.substr(1), t[e].errorCharStart--, 
  !t[e].text.length) return t;
 }
 return t;
}, eachLineHasLeadingWhitespace = e => {
 if (!e.length) return !1;
 for (var t = 0; t < e.length; t++) {
  if (!e[t].text || e[t].text.length < 1) return !1;
  const r = e[t].text.charAt(0);
  if (" " !== r && "\t" !== r) return !1;
 }
 return !0;
}, isMeaningfulLine = e => !!e && (e = e.trim()).length > 0, JS_KEYWORDS = [ "abstract", "any", "as", "break", "boolean", "case", "catch", "class", "console", "const", "continue", "debugger", "declare", "default", "delete", "do", "else", "enum", "export", "extends", "false", "finally", "for", "from", "function", "get", "if", "import", "in", "implements", "Infinity", "instanceof", "let", "module", "namespace", "NaN", "new", "number", "null", "public", "private", "protected", "require", "return", "static", "set", "string", "super", "switch", "this", "throw", "try", "true", "type", "typeof", "undefined", "var", "void", "with", "while", "yield" ], INDENT$1 = "           ", require$$0 = function createCommonjsModule(e, t, r) {
 return e(r = {
  path: t,
  exports: {},
  require: function(e, t) {
   return function r() {
    throw new Error("Dynamic requires are not currently supported by @rollup/plugin-commonjs");
   }();
  }
 }, r.exports), r.exports;
}((function(e) {
 const t = "Hyper" === process.env.TERM_PROGRAM, r = "win32" === process.platform, s = "linux" === process.platform, n = {
  ballotDisabled: "???",
  ballotOff: "???",
  ballotOn: "???",
  bullet: "???",
  bulletWhite: "???",
  fullBlock: "???",
  heart: "???",
  identicalTo: "???",
  line: "???",
  mark: "???",
  middot: "??",
  minus: "???",
  multiplication: "??",
  obelus: "??",
  pencilDownRight: "???",
  pencilRight: "???",
  pencilUpRight: "???",
  percent: "%",
  pilcrow2: "???",
  pilcrow: "??",
  plusMinus: "??",
  section: "??",
  starsOff: "???",
  starsOn: "???",
  upDownArrow: "???"
 }, o = Object.assign({}, n, {
  check: "???",
  cross: "??",
  ellipsisLarge: "...",
  ellipsis: "...",
  info: "i",
  question: "?",
  questionSmall: "?",
  pointer: ">",
  pointerSmall: "??",
  radioOff: "( )",
  radioOn: "(*)",
  warning: "???"
 }), i = Object.assign({}, n, {
  ballotCross: "???",
  check: "???",
  cross: "???",
  ellipsisLarge: "???",
  ellipsis: "???",
  info: "???",
  question: "?",
  questionFull: "???",
  questionSmall: "???",
  pointer: s ? "???" : "???",
  pointerSmall: s ? "???" : "???",
  radioOff: "???",
  radioOn: "???",
  warning: "???"
 });
 e.exports = r && !t ? o : i, Reflect.defineProperty(e.exports, "common", {
  enumerable: !1,
  value: n
 }), Reflect.defineProperty(e.exports, "windows", {
  enumerable: !1,
  value: o
 }), Reflect.defineProperty(e.exports, "other", {
  enumerable: !1,
  value: i
 });
})), ANSI_REGEX = /[\u001b\u009b][[\]#;?()]*(?:(?:(?:[^\W_]*;?[^\W_]*)\u0007)|(?:(?:[0-9]{1,4}(;[0-9]{0,4})*)?[~0-9=<>cf-nqrtyA-PRZ]))/g, create = () => {
 const e = {
  enabled: !0,
  visible: !0,
  styles: {},
  keys: {}
 };
 "FORCE_COLOR" in process.env && (e.enabled = "0" !== process.env.FORCE_COLOR);
 const t = (e, t, r) => "function" == typeof e ? e(t) : e.wrap(t, r), r = (r, s) => {
  if ("" === r || null == r) return "";
  if (!1 === e.enabled) return r;
  if (!1 === e.visible) return "";
  let n = "" + r, o = n.includes("\n"), i = s.length;
  for (i > 0 && s.includes("unstyle") && (s = [ ...new Set([ "unstyle", ...s ]) ].reverse()); i-- > 0; ) n = t(e.styles[s[i]], n, o);
  return n;
 }, s = (t, s, n) => {
  e.styles[t] = (e => {
   let t = e.open = `[${e.codes[0]}m`, r = e.close = `[${e.codes[1]}m`, s = e.regex = new RegExp(`\\u001b\\[${e.codes[1]}m`, "g");
   return e.wrap = (e, n) => {
    e.includes(r) && (e = e.replace(s, r + t));
    let o = t + e + r;
    return n ? o.replace(/\r*\n/g, `${r}$&${t}`) : o;
   }, e;
  })({
   name: t,
   codes: s
  }), (e.keys[n] || (e.keys[n] = [])).push(t), Reflect.defineProperty(e, t, {
   configurable: !0,
   enumerable: !0,
   set(r) {
    e.alias(t, r);
   },
   get() {
    let s = e => r(e, s.stack);
    return Reflect.setPrototypeOf(s, e), s.stack = this.stack ? this.stack.concat(t) : [ t ], 
    s;
   }
  });
 };
 return s("reset", [ 0, 0 ], "modifier"), s("bold", [ 1, 22 ], "modifier"), s("dim", [ 2, 22 ], "modifier"), 
 s("italic", [ 3, 23 ], "modifier"), s("underline", [ 4, 24 ], "modifier"), s("inverse", [ 7, 27 ], "modifier"), 
 s("hidden", [ 8, 28 ], "modifier"), s("strikethrough", [ 9, 29 ], "modifier"), s("black", [ 30, 39 ], "color"), 
 s("red", [ 31, 39 ], "color"), s("green", [ 32, 39 ], "color"), s("yellow", [ 33, 39 ], "color"), 
 s("blue", [ 34, 39 ], "color"), s("magenta", [ 35, 39 ], "color"), s("cyan", [ 36, 39 ], "color"), 
 s("white", [ 37, 39 ], "color"), s("gray", [ 90, 39 ], "color"), s("grey", [ 90, 39 ], "color"), 
 s("bgBlack", [ 40, 49 ], "bg"), s("bgRed", [ 41, 49 ], "bg"), s("bgGreen", [ 42, 49 ], "bg"), 
 s("bgYellow", [ 43, 49 ], "bg"), s("bgBlue", [ 44, 49 ], "bg"), s("bgMagenta", [ 45, 49 ], "bg"), 
 s("bgCyan", [ 46, 49 ], "bg"), s("bgWhite", [ 47, 49 ], "bg"), s("blackBright", [ 90, 39 ], "bright"), 
 s("redBright", [ 91, 39 ], "bright"), s("greenBright", [ 92, 39 ], "bright"), s("yellowBright", [ 93, 39 ], "bright"), 
 s("blueBright", [ 94, 39 ], "bright"), s("magentaBright", [ 95, 39 ], "bright"), 
 s("cyanBright", [ 96, 39 ], "bright"), s("whiteBright", [ 97, 39 ], "bright"), s("bgBlackBright", [ 100, 49 ], "bgBright"), 
 s("bgRedBright", [ 101, 49 ], "bgBright"), s("bgGreenBright", [ 102, 49 ], "bgBright"), 
 s("bgYellowBright", [ 103, 49 ], "bgBright"), s("bgBlueBright", [ 104, 49 ], "bgBright"), 
 s("bgMagentaBright", [ 105, 49 ], "bgBright"), s("bgCyanBright", [ 106, 49 ], "bgBright"), 
 s("bgWhiteBright", [ 107, 49 ], "bgBright"), e.ansiRegex = ANSI_REGEX, e.hasColor = e.hasAnsi = t => (e.ansiRegex.lastIndex = 0, 
 "string" == typeof t && "" !== t && e.ansiRegex.test(t)), e.alias = (t, s) => {
  let n = "string" == typeof s ? e[s] : s;
  if ("function" != typeof n) throw new TypeError("Expected alias to be the name of an existing color (string) or a function");
  n.stack || (Reflect.defineProperty(n, "name", {
   value: t
  }), e.styles[t] = n, n.stack = [ t ]), Reflect.defineProperty(e, t, {
   configurable: !0,
   enumerable: !0,
   set(r) {
    e.alias(t, r);
   },
   get() {
    let t = e => r(e, t.stack);
    return Reflect.setPrototypeOf(t, e), t.stack = this.stack ? this.stack.concat(n.stack) : n.stack, 
    t;
   }
  });
 }, e.theme = t => {
  if (null === (r = t) || "object" != typeof r || Array.isArray(r)) throw new TypeError("Expected theme to be an object");
  var r;
  for (let r of Object.keys(t)) e.alias(r, t[r]);
  return e;
 }, e.alias("unstyle", (t => "string" == typeof t && "" !== t ? (e.ansiRegex.lastIndex = 0, 
 t.replace(e.ansiRegex, "")) : "")), e.alias("noop", (e => e)), e.none = e.clear = e.noop, 
 e.stripColor = e.unstyle, e.symbols = require$$0, e.define = s, e;
};

ansiColors = create(), create_1 = create;

const ansiColor = ansiColors;

ansiColors.create = create_1;

const noop = () => {}, isString = e => "string" == typeof e, buildError = e => {
 const t = {
  level: "error",
  type: "build",
  header: "Build Error",
  messageText: "build error",
  relFilePath: null,
  absFilePath: null,
  lines: []
 };
 return e && e.push(t), t;
}, catchError = (e, t, r) => {
 const s = {
  level: "error",
  type: "build",
  header: "Build Error",
  messageText: "build error",
  relFilePath: null,
  absFilePath: null,
  lines: []
 };
 return isString(r) ? s.messageText = r : null != t && (null != t.stack ? s.messageText = t.stack.toString() : null != t.message ? s.messageText = t.message.toString() : s.messageText = t.toString()), 
 null == e || shouldIgnoreError(s.messageText) || e.push(s), s;
}, shouldIgnoreError = e => e === TASK_CANCELED_MSG, TASK_CANCELED_MSG = "task canceled", normalizePath = e => {
 if ("string" != typeof e) throw new Error("invalid path to normalize");
 e = normalizeSlashes(e.trim());
 const t = pathComponents(e, getRootLength(e)), r = reducePathComponents(t), s = r[0], n = r[1], o = s + r.slice(1).join("/");
 return "" === o ? "." : "" === s && n && e.includes("/") && !n.startsWith(".") && !n.startsWith("@") ? "./" + o : o;
}, normalizeSlashes = e => e.replace(backslashRegExp, "/"), backslashRegExp = /\\/g, reducePathComponents = e => {
 if (!Array.isArray(e) || 0 === e.length) return [];
 const t = [ e[0] ];
 for (let r = 1; r < e.length; r++) {
  const s = e[r];
  if (s && "." !== s) {
   if (".." === s) if (t.length > 1) {
    if (".." !== t[t.length - 1]) {
     t.pop();
     continue;
    }
   } else if (t[0]) continue;
   t.push(s);
  }
 }
 return t;
}, getRootLength = e => {
 const t = getEncodedRootLength(e);
 return t < 0 ? ~t : t;
}, getEncodedRootLength = e => {
 if (!e) return 0;
 const t = e.charCodeAt(0);
 if (47 === t || 92 === t) {
  if (e.charCodeAt(1) !== t) return 1;
  const r = e.indexOf(47 === t ? "/" : "\\", 2);
  return r < 0 ? e.length : r + 1;
 }
 if (isVolumeCharacter(t) && 58 === e.charCodeAt(1)) {
  const t = e.charCodeAt(2);
  if (47 === t || 92 === t) return 3;
  if (2 === e.length) return 2;
 }
 const r = e.indexOf("://");
 if (-1 !== r) {
  const t = r + "://".length, s = e.indexOf("/", t);
  if (-1 !== s) {
   const n = e.slice(0, r), o = e.slice(t, s);
   if ("file" === n && ("" === o || "localhost" === o) && isVolumeCharacter(e.charCodeAt(s + 1))) {
    const t = getFileUrlVolumeSeparatorEnd(e, s + 2);
    if (-1 !== t) {
     if (47 === e.charCodeAt(t)) return ~(t + 1);
     if (t === e.length) return ~t;
    }
   }
   return ~(s + 1);
  }
  return ~e.length;
 }
 return 0;
}, isVolumeCharacter = e => e >= 97 && e <= 122 || e >= 65 && e <= 90, getFileUrlVolumeSeparatorEnd = (e, t) => {
 const r = e.charCodeAt(t);
 if (58 === r) return t + 1;
 if (37 === r && 51 === e.charCodeAt(t + 1)) {
  const r = e.charCodeAt(t + 2);
  if (97 === r || 65 === r) return t + 3;
 }
 return -1;
}, pathComponents = (e, t) => {
 const r = e.substring(0, t), s = e.substring(t).split("/"), n = s.length;
 return n > 0 && !s[n - 1] && s.pop(), [ r, ...s ];
}, copyFile = util.promisify(fs__default.default.copyFile), mkdir = util.promisify(fs__default.default.mkdir), readdir = util.promisify(fs__default.default.readdir);

util.promisify(fs__default.default.readFile);

const stat = util.promisify(fs__default.default.stat), ROOT_DIR = normalizePath(path__default.default.resolve("/")), IGNORE = [ ".ds_store", ".gitignore", "desktop.ini", "thumbs.db" ];

fn = new Intl.Collator(0, {
 numeric: 1
}).compare;

const REGISTRY_URL = "https://registry.npmjs.org/@stencil/core", CHANGELOG = "https://github.com/ionic-team/stencil/blob/master/CHANGELOG.md", ARROW = "???", BOX_TOP_LEFT = "???", BOX_TOP_RIGHT = "???", BOX_BOTTOM_LEFT = "???", BOX_BOTTOM_RIGHT = "???", BOX_VERTICAL = "???", BOX_HORIZONTAL = "???", PADDING = 2, INDENT = "   ";

class NodeLazyRequire {
 constructor(e, t) {
  this.nodeResolveModule = e, this.lazyDependencies = t, this.ensured = new Set;
 }
 async ensure(e, t) {
  const r = [], s = [];
  if (t.forEach((t => {
   if (!this.ensured.has(t)) {
    const [r, n] = this.lazyDependencies[t];
    try {
     const s = this.nodeResolveModule.resolveModule(e, t);
     if (semiver(JSON.parse(fs__default.default.readFileSync(s, "utf8")).version, r) >= 0) return void this.ensured.add(t);
    } catch (e) {}
    s.push(`${t}@${n}`);
   }
  })), s.length > 0) {
   const e = buildError(r);
   e.header = "Please install missing dev dependencies with either npm or yarn.", e.messageText = `npm install --save-dev ${s.join(" ")}`;
  }
  return r;
 }
 require(e, t) {
  const r = this.getModulePath(e, t);
  return require(r);
 }
 getModulePath(e, t) {
  const r = this.nodeResolveModule.resolveModule(e, t);
  return path__default.default.dirname(r);
 }
}

class NodeResolveModule {
 constructor() {
  this.resolveModuleCache = new Map;
 }
 resolveModule(e, t, r) {
  const s = `${e}:${t}`, n = this.resolveModuleCache.get(s);
  if (n) return n;
  if (r && r.manuallyResolve) return this.resolveModuleManually(e, t, s);
  if (t.startsWith("@types/")) return this.resolveTypesModule(e, t, s);
  const o = require("module");
  e = path__default.default.resolve(e);
  const i = path__default.default.join(e, "noop.js");
  let a = normalizePath(o._resolveFilename(t, {
   id: i,
   filename: i,
   paths: o._nodeModulePaths(e)
  }));
  const l = normalizePath(path__default.default.parse(e).root);
  let c;
  for (;a !== l; ) if (a = normalizePath(path__default.default.dirname(a)), c = path__default.default.join(a, "package.json"), 
  fs__default.default.existsSync(c)) return this.resolveModuleCache.set(s, c), c;
  throw new Error(`error loading "${t}" from "${e}"`);
 }
 resolveTypesModule(e, t, r) {
  const s = t.split("/"), n = normalizePath(path__default.default.parse(e).root);
  let o, i = normalizePath(path__default.default.join(e, "noop.js"));
  for (;i !== n; ) if (i = normalizePath(path__default.default.dirname(i)), o = path__default.default.join(i, "node_modules", s[0], s[1], "package.json"), 
  fs__default.default.existsSync(o)) return this.resolveModuleCache.set(r, o), o;
  throw new Error(`error loading "${t}" from "${e}"`);
 }
 resolveModuleManually(e, t, r) {
  const s = normalizePath(path__default.default.parse(e).root);
  let n, o = normalizePath(path__default.default.join(e, "noop.js"));
  for (;o !== s; ) if (o = normalizePath(path__default.default.dirname(o)), n = path__default.default.join(o, "node_modules", t, "package.json"), 
  fs__default.default.existsSync(n)) return this.resolveModuleCache.set(r, n), n;
  throw new Error(`error loading "${t}" from "${e}"`);
 }
}

class NodeWorkerMain extends events.EventEmitter {
 constructor(e, t) {
  super(), this.id = e, this.tasks = new Map, this.exitCode = null, this.processQueue = !0, 
  this.sendQueue = [], this.stopped = !1, this.successfulMessage = !1, this.totalTasksAssigned = 0, 
  this.fork(t);
 }
 fork(e) {
  const t = {
   execArgv: process.execArgv.filter((e => !/^--(debug|inspect)/.test(e))),
   env: process.env,
   cwd: process.cwd(),
   silent: !0
  };
  this.childProcess = cp__namespace.fork(e, [], t), this.childProcess.stdout.setEncoding("utf8"), 
  this.childProcess.stdout.on("data", (e => {
   console.log(e);
  })), this.childProcess.stderr.setEncoding("utf8"), this.childProcess.stderr.on("data", (e => {
   console.log(e);
  })), this.childProcess.on("message", this.receiveFromWorker.bind(this)), this.childProcess.on("error", (e => {
   this.emit("error", e);
  })), this.childProcess.once("exit", (e => {
   this.exitCode = e, this.emit("exit", e);
  }));
 }
 run(e) {
  this.totalTasksAssigned++, this.tasks.set(e.stencilId, e), this.sendToWorker({
   stencilId: e.stencilId,
   args: e.inputArgs
  });
 }
 sendToWorker(e) {
  this.processQueue ? this.childProcess.send(e, (e => {
   if (!(e && e instanceof Error) && (this.processQueue = !0, this.sendQueue.length > 0)) {
    const e = this.sendQueue.slice();
    this.sendQueue = [], e.forEach((e => this.sendToWorker(e)));
   }
  })) && !/^win/.test(process.platform) || (this.processQueue = !1) : this.sendQueue.push(e);
 }
 receiveFromWorker(e) {
  if (this.successfulMessage = !0, this.stopped) return;
  const t = this.tasks.get(e.stencilId);
  t ? (null != e.stencilRtnError ? t.reject(e.stencilRtnError) : t.resolve(e.stencilRtnValue), 
  this.tasks.delete(e.stencilId), this.emit("response", e)) : null != e.stencilRtnError && this.emit("error", e.stencilRtnError);
 }
 stop() {
  this.stopped = !0, this.tasks.forEach((e => e.reject(TASK_CANCELED_MSG))), this.tasks.clear(), 
  this.successfulMessage ? (this.childProcess.send({
   exit: !0
  }), setTimeout((() => {
   null === this.exitCode && this.childProcess.kill("SIGKILL");
  }), 100)) : this.childProcess.kill("SIGKILL");
 }
}

class NodeWorkerController extends events.EventEmitter {
 constructor(e, t) {
  super(), this.forkModulePath = e, this.workerIds = 0, this.stencilId = 0, this.isEnding = !1, 
  this.taskQueue = [], this.workers = [];
  const r = os.cpus().length;
  this.useForkedWorkers = t > 0, this.maxWorkers = Math.max(Math.min(t, r), 2) - 1, 
  this.useForkedWorkers ? this.startWorkers() : this.mainThreadRunner = require(e);
 }
 onError(e, t) {
  if ("ERR_IPC_CHANNEL_CLOSED" === e.code) return this.stopWorker(t);
  "EPIPE" !== e.code && console.error(e);
 }
 onExit(e) {
  setTimeout((() => {
   let t = !1;
   const r = this.workers.find((t => t.id === e));
   r && (r.tasks.forEach((e => {
    e.retries++, this.taskQueue.unshift(e), t = !0;
   })), r.tasks.clear()), this.stopWorker(e), t && this.processTaskQueue();
  }), 10);
 }
 startWorkers() {
  for (;this.workers.length < this.maxWorkers; ) this.startWorker();
 }
 startWorker() {
  const e = this.workerIds++, t = new NodeWorkerMain(e, this.forkModulePath);
  t.on("response", this.processTaskQueue.bind(this)), t.once("exit", (() => {
   this.onExit(e);
  })), t.on("error", (t => {
   this.onError(t, e);
  })), this.workers.push(t);
 }
 stopWorker(e) {
  const t = this.workers.find((t => t.id === e));
  if (t) {
   t.stop();
   const e = this.workers.indexOf(t);
   e > -1 && this.workers.splice(e, 1);
  }
 }
 processTaskQueue() {
  if (!this.isEnding) for (this.useForkedWorkers && this.startWorkers(); this.taskQueue.length > 0; ) {
   const e = getNextWorker(this.workers);
   if (!e) break;
   e.run(this.taskQueue.shift());
  }
 }
 send(...e) {
  return this.isEnding ? Promise.reject(TASK_CANCELED_MSG) : this.useForkedWorkers ? new Promise(((t, r) => {
   const s = {
    stencilId: this.stencilId++,
    inputArgs: e,
    retries: 0,
    resolve: t,
    reject: r
   };
   this.taskQueue.push(s), this.processTaskQueue();
  })) : this.mainThreadRunner[e[0]].apply(null, e.slice(1));
 }
 handler(e) {
  return (...t) => this.send(e, ...t);
 }
 cancelTasks() {
  for (const e of this.workers) e.tasks.forEach((e => e.reject(TASK_CANCELED_MSG))), 
  e.tasks.clear();
  this.taskQueue.length = 0;
 }
 destroy() {
  if (!this.isEnding) {
   this.isEnding = !0;
   for (const e of this.taskQueue) e.reject(TASK_CANCELED_MSG);
   this.taskQueue.length = 0;
   const e = this.workers.map((e => e.id));
   for (const t of e) this.stopWorker(t);
  }
 }
}

exports.createNodeLogger = e => {
 let t = !0;
 const r = e.process, s = createTerminalLogger({
  color: (e, r) => t ? ansiColor[r](e) : e,
  cwd: () => r.cwd(),
  emoji: e => "win32" !== r.platform ? e : "",
  enableColors: e => t = e,
  getColumns: () => {
   const e = r.stdout && r.stdout.columns || 80;
   return Math.max(Math.min(120, e), 60);
  },
  memoryUsage: () => r.memoryUsage().rss,
  relativePath: (e, t) => path__default.default.relative(e, t),
  writeLogs: (e, t, r) => {
   if (r) try {
    fs__default.default.accessSync(e);
   } catch (e) {
    r = !1;
   }
   r ? fs__default.default.appendFileSync(e, t) : fs__default.default.writeFileSync(e, t);
  }
 });
 return s.createLineUpdater = async () => {
  const e = await Promise.resolve().then((function() {
   return _interopNamespace(require("readline"));
  }));
  let t = Promise.resolve();
  const s = s => (s = s.substr(0, r.stdout.columns - 5) + "[0m", t = t.then((() => new Promise((t => {
   e.clearLine(r.stdout, 0), e.cursorTo(r.stdout, 0, null), r.stdout.write(s, t);
  })))));
  return r.stdout.write("[?25l"), {
   update: s,
   stop: () => s("[?25h")
  };
 }, s;
}, exports.createNodeSys = function createNodeSys(e = {}) {
 const t = e.process || global.process, r = new Set, s = [], n = os.cpus(), o = n.length, i = os.platform(), a = path__default.default.join(__dirname, "..", "..", "compiler", "stencil.js"), l = path__default.default.join(__dirname, "..", "..", "dev-server", "index.js"), c = () => {
  const e = [];
  let t;
  for (;"function" == typeof (t = s.pop()); ) try {
   const s = t();
   (r = s) && ("object" == typeof r || "function" == typeof r) && "function" == typeof r.then && e.push(s);
  } catch (e) {}
  var r;
  return e.length > 0 ? Promise.all(e) : null;
 }, u = {
  name: "node",
  version: t.versions.node,
  access: e => new Promise((t => {
   fs__default.default.access(e, (e => t(!e)));
  })),
  accessSync(e) {
   let t = !1;
   try {
    fs__default.default.accessSync(e), t = !0;
   } catch (e) {}
   return t;
  },
  addDestory(e) {
   r.add(e);
  },
  removeDestory(e) {
   r.delete(e);
  },
  applyPrerenderGlobalPatch(e) {
   if ("function" != typeof global.fetch) {
    const t = require(path__default.default.join(__dirname, "node-fetch.js"));
    global.fetch = (r, s) => {
     if ("string" == typeof r) {
      const n = new URL(r, e.devServerHostUrl).href;
      return t.fetch(n, s);
     }
     return r.url = new URL(r.url, e.devServerHostUrl).href, t.fetch(r, s);
    }, global.Headers = t.Headers, global.Request = t.Request, global.Response = t.Response, 
    global.FetchError = t.FetchError;
   }
   e.window.fetch = global.fetch, e.window.Headers = global.Headers, e.window.Request = global.Request, 
   e.window.Response = global.Response, e.window.FetchError = global.FetchError;
  },
  fetch: (e, t) => {
   const r = require(path__default.default.join(__dirname, "node-fetch.js"));
   if ("string" == typeof e) {
    const s = new URL(e).href;
    return r.fetch(s, t);
   }
   return e.url = new URL(e.url).href, r.fetch(e, t);
  },
  checkVersion,
  copyFile: (e, t) => new Promise((r => {
   fs__default.default.copyFile(e, t, (e => {
    r(!e);
   }));
  })),
  createDir: (e, t) => new Promise((r => {
   t ? fs__default.default.mkdir(e, t, (t => {
    r({
     basename: path__default.default.basename(e),
     dirname: path__default.default.dirname(e),
     path: e,
     newDirs: [],
     error: t
    });
   })) : fs__default.default.mkdir(e, (t => {
    r({
     basename: path__default.default.basename(e),
     dirname: path__default.default.dirname(e),
     path: e,
     newDirs: [],
     error: t
    });
   }));
  })),
  createDirSync(e, t) {
   const r = {
    basename: path__default.default.basename(e),
    dirname: path__default.default.dirname(e),
    path: e,
    newDirs: [],
    error: null
   };
   try {
    fs__default.default.mkdirSync(e, t);
   } catch (e) {
    r.error = e;
   }
   return r;
  },
  createWorkerController(e) {
   const t = path__default.default.join(__dirname, "worker.js");
   return new NodeWorkerController(t, e);
  },
  async destroy() {
   const e = [];
   r.forEach((t => {
    try {
     const r = t();
     r && r.then && e.push(r);
    } catch (e) {
     console.error(`node sys destroy: ${e}`);
    }
   })), e.length > 0 && await Promise.all(e), r.clear();
  },
  dynamicImport: e => Promise.resolve(require(e)),
  encodeToBase64: e => Buffer.from(e).toString("base64"),
  ensureDependencies: async () => ({
   stencilPath: u.getCompilerExecutingPath(),
   diagnostics: []
  }),
  async ensureResources() {},
  exit: async e => {
   await c(), function e(t, r) {
    function s() {
     n === r.length && process.exit(t);
    }
    r || (r = [ process.stdout, process.stderr ]);
    var n = 0;
    r.forEach((function(e) {
     0 === e.bufferSize ? n++ : e.write("", "utf-8", (function() {
      n++, s();
     })), e.write = function() {};
    })), s(), process.on("exit", (function() {
     process.exit(t);
    }));
   }(e);
  },
  getCurrentDirectory: () => normalizePath(t.cwd()),
  getCompilerExecutingPath: () => a,
  getDevServerExecutingPath: () => l,
  getEnvironmentVar: e => process.env[e],
  getLocalModulePath: () => null,
  getRemoteModuleUrl: () => null,
  glob: asyncGlob,
  hardwareConcurrency: o,
  isSymbolicLink: e => new Promise((t => {
   try {
    fs__default.default.lstat(e, ((e, r) => {
     t(!e && r.isSymbolicLink());
    }));
   } catch (e) {
    t(!1);
   }
  })),
  nextTick: t.nextTick,
  normalizePath,
  onProcessInterrupt: e => {
   s.includes(e) || s.push(e);
  },
  platformPath: path__default.default,
  readDir: e => new Promise((t => {
   fs__default.default.readdir(e, ((r, s) => {
    t(r ? [] : s.map((t => normalizePath(path__default.default.join(e, t)))));
   }));
  })),
  isTTY() {
   var e;
   return !!(null === (e = null === process || void 0 === process ? void 0 : process.stdout) || void 0 === e ? void 0 : e.isTTY);
  },
  readDirSync(e) {
   try {
    return fs__default.default.readdirSync(e).map((t => normalizePath(path__default.default.join(e, t))));
   } catch (e) {}
   return [];
  },
  readFile: (e, t) => new Promise("binary" === t ? t => {
   fs__default.default.readFile(e, ((e, r) => {
    t(r);
   }));
  } : t => {
   fs__default.default.readFile(e, "utf8", ((e, r) => {
    t(r);
   }));
  }),
  readFileSync(e) {
   try {
    return fs__default.default.readFileSync(e, "utf8");
   } catch (e) {}
  },
  homeDir() {
   try {
    return os__namespace.homedir();
   } catch (e) {}
  },
  realpath: e => new Promise((t => {
   fs__default.default.realpath(e, "utf8", ((e, r) => {
    t({
     path: r,
     error: e
    });
   }));
  })),
  realpathSync(e) {
   const t = {
    path: void 0,
    error: null
   };
   try {
    t.path = fs__default.default.realpathSync(e, "utf8");
   } catch (e) {
    t.error = e;
   }
   return t;
  },
  rename: (e, t) => new Promise((r => {
   fs__default.default.rename(e, t, (s => {
    r({
     oldPath: e,
     newPath: t,
     error: s,
     oldDirs: [],
     oldFiles: [],
     newDirs: [],
     newFiles: [],
     renamed: [],
     isFile: !1,
     isDirectory: !1
    });
   }));
  })),
  resolvePath: e => normalizePath(e),
  removeDir: (e, t) => new Promise((r => {
   t && t.recursive ? fs__default.default.rmdir(e, {
    recursive: !0
   }, (t => {
    r({
     basename: path__default.default.basename(e),
     dirname: path__default.default.dirname(e),
     path: e,
     removedDirs: [],
     removedFiles: [],
     error: t
    });
   })) : fs__default.default.rmdir(e, (t => {
    r({
     basename: path__default.default.basename(e),
     dirname: path__default.default.dirname(e),
     path: e,
     removedDirs: [],
     removedFiles: [],
     error: t
    });
   }));
  })),
  removeDirSync(e, t) {
   try {
    return t && t.recursive ? fs__default.default.rmdirSync(e, {
     recursive: !0
    }) : fs__default.default.rmdirSync(e), {
     basename: path__default.default.basename(e),
     dirname: path__default.default.dirname(e),
     path: e,
     removedDirs: [],
     removedFiles: [],
     error: null
    };
   } catch (t) {
    return {
     basename: path__default.default.basename(e),
     dirname: path__default.default.dirname(e),
     path: e,
     removedDirs: [],
     removedFiles: [],
     error: t
    };
   }
  },
  removeFile: e => new Promise((t => {
   fs__default.default.unlink(e, (r => {
    t({
     basename: path__default.default.basename(e),
     dirname: path__default.default.dirname(e),
     path: e,
     error: r
    });
   }));
  })),
  removeFileSync(e) {
   const t = {
    basename: path__default.default.basename(e),
    dirname: path__default.default.dirname(e),
    path: e,
    error: null
   };
   try {
    fs__default.default.unlinkSync(e);
   } catch (e) {
    t.error = e;
   }
   return t;
  },
  setupCompiler(e) {
   const t = e.ts, r = t.sys.watchDirectory, s = t.sys.watchFile;
   u.watchTimeout = 80, u.events = (() => {
    const e = [], t = t => {
     const r = e.findIndex((e => e.callback === t));
     return r > -1 && (e.splice(r, 1), !0);
    };
    return {
     emit: (t, r) => {
      const s = t.toLowerCase().trim(), n = e.slice();
      for (const e of n) if (null == e.eventName) try {
       e.callback(t, r);
      } catch (e) {
       console.error(e);
      } else if (e.eventName === s) try {
       e.callback(r);
      } catch (e) {
       console.error(e);
      }
     },
     on: (r, s) => {
      if ("function" == typeof r) {
       const s = null, n = r;
       return e.push({
        eventName: s,
        callback: n
       }), () => t(n);
      }
      if ("string" == typeof r && "function" == typeof s) {
       const n = r.toLowerCase().trim(), o = s;
       return e.push({
        eventName: n,
        callback: o
       }), () => t(o);
      }
      return () => !1;
     },
     unsubscribeAll: () => {
      e.length = 0;
     }
    };
   })(), u.watchDirectory = (e, t, s) => {
    const n = r(e, (e => {
     t(normalizePath(e), "fileUpdate");
    }), s), o = () => {
     n.close();
    };
    return u.addDestory(o), {
     close() {
      u.removeDestory(o), n.close();
     }
    };
   }, u.watchFile = (e, r) => {
    const n = s(e, ((e, s) => {
     e = normalizePath(e), s === t.FileWatcherEventKind.Created ? (r(e, "fileAdd"), u.events.emit("fileAdd", e)) : s === t.FileWatcherEventKind.Changed ? (r(e, "fileUpdate"), 
     u.events.emit("fileUpdate", e)) : s === t.FileWatcherEventKind.Deleted && (r(e, "fileDelete"), 
     u.events.emit("fileDelete", e));
    })), o = () => {
     n.close();
    };
    return u.addDestory(o), {
     close() {
      u.removeDestory(o), n.close();
     }
    };
   };
  },
  stat: e => new Promise((t => {
   fs__default.default.stat(e, ((e, r) => {
    t(e ? {
     isDirectory: !1,
     isFile: !1,
     isSymbolicLink: !1,
     size: 0,
     mtimeMs: 0,
     error: e
    } : {
     isDirectory: r.isDirectory(),
     isFile: r.isFile(),
     isSymbolicLink: r.isSymbolicLink(),
     size: r.size,
     mtimeMs: r.mtimeMs,
     error: null
    });
   }));
  })),
  statSync(e) {
   try {
    const t = fs__default.default.statSync(e);
    return {
     isDirectory: t.isDirectory(),
     isFile: t.isFile(),
     isSymbolicLink: t.isSymbolicLink(),
     size: t.size,
     mtimeMs: t.mtimeMs,
     error: null
    };
   } catch (e) {
    return {
     isDirectory: !1,
     isFile: !1,
     isSymbolicLink: !1,
     size: 0,
     mtimeMs: 0,
     error: e
    };
   }
  },
  tmpDirSync: () => os.tmpdir(),
  writeFile: (e, t) => new Promise((r => {
   fs__default.default.writeFile(e, t, (t => {
    r({
     path: e,
     error: t
    });
   }));
  })),
  writeFileSync(e, t) {
   const r = {
    path: e,
    error: null
   };
   try {
    fs__default.default.writeFileSync(e, t);
   } catch (e) {
    r.error = e;
   }
   return r;
  },
  generateContentHash(e, t) {
   let r = crypto.createHash("sha1").update(e).digest("hex").toLowerCase();
   return "number" == typeof t && (r = r.substr(0, t)), Promise.resolve(r);
  },
  generateFileHash: (e, t) => new Promise(((r, s) => {
   const n = crypto.createHash("sha1");
   fs__default.default.createReadStream(e).on("error", (e => s(e))).on("data", (e => n.update(e))).on("end", (() => {
    let e = n.digest("hex").toLowerCase();
    "number" == typeof t && (e = e.substr(0, t)), r(e);
   }));
  })),
  copy: nodeCopyTasks,
  details: {
   cpuModel: (Array.isArray(n) && n.length > 0 ? n[0] && n[0].model : "") || "",
   freemem: () => os.freemem(),
   platform: "darwin" === i || "linux" === i ? i : "win32" === i ? "windows" : "",
   release: os.release(),
   totalmem: os.totalmem()
  }
 }, d = new NodeResolveModule;
 return u.lazyRequire = new NodeLazyRequire(d, {
  "@types/jest": [ "24.9.1", "26.0.21" ],
  jest: [ "24.9.0", "26.6.3" ],
  "jest-cli": [ "24.9.0", "26.6.3" ],
  pixelmatch: [ "4.0.2", "4.0.2" ],
  puppeteer: [ "1.19.0", "10.0.0" ],
  "puppeteer-core": [ "1.19.0", "5.2.1" ],
  "workbox-build": [ "4.3.1", "4.3.1" ]
 }), t.on("SIGINT", c), t.on("exit", c), u;
}, exports.setupNodeProcess = function setupNodeProcess(e) {
 e.process.on("unhandledRejection", (t => {
  if (!shouldIgnoreError(t)) {
   let r = "unhandledRejection";
   null != t && ("string" == typeof t ? r += ": " + t : t.stack ? r += ": " + t.stack : t.message && (r += ": " + t.message)), 
   e.logger.error(r);
  }
 }));
};