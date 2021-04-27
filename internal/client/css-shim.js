/*
 Stencil Client Patch Esm v0.0.0-dev.20210427205737 | MIT Licensed | https://stenciljs.com
 */
var __assign=undefined&&undefined.__assign||function(){return (__assign=Object.assign||function(e){for(var t,r=1,n=arguments.length;r<n;r++)for(var s in t=arguments[r])Object.prototype.hasOwnProperty.call(t,s)&&(e[s]=t[s]);return e}).apply(this,arguments)},StyleNode=function(){this.start=0,this.end=0,this.previous=null,this.parent=null,this.rules=null,this.parsedCssText="",this.cssText="",this.atRule=!1,this.type=0,this.keyframesName="",this.selector="",this.parsedSelector="";};function parse(e){return parseCss(lex(e=clean(e)),e)}function clean(e){return e.replace(RX.comments,"").replace(RX.port,"")}function lex(e){var t=new StyleNode;t.start=0,t.end=e.length;for(var r=t,n=0,s=e.length;n<s;n++)if(e[n]===OPEN_BRACE){r.rules||(r.rules=[]);var o=r,a=o.rules[o.rules.length-1]||null;(r=new StyleNode).start=n+1,r.parent=o,r.previous=a,o.rules.push(r);}else e[n]===CLOSE_BRACE&&(r.end=n+1,r=r.parent||t);return t}function parseCss(e,t){var r=t.substring(e.start,e.end-1);if(e.parsedCssText=e.cssText=r.trim(),e.parent){var n=e.previous?e.previous.end:e.parent.start;r=(r=(r=_expandUnicodeEscapes(r=t.substring(n,e.start-1))).replace(RX.multipleSpaces," ")).substring(r.lastIndexOf(";")+1);var s=e.parsedSelector=e.selector=r.trim();e.atRule=0===s.indexOf(AT_START),e.atRule?0===s.indexOf(MEDIA_START)?e.type=types.MEDIA_RULE:s.match(RX.keyframesRule)&&(e.type=types.KEYFRAMES_RULE,e.keyframesName=e.selector.split(RX.multipleSpaces).pop()):0===s.indexOf(VAR_START)?e.type=types.MIXIN_RULE:e.type=types.STYLE_RULE;}var o=e.rules;if(o)for(var a=0,i=o.length,l=void 0;a<i&&(l=o[a]);a++)parseCss(l,t);return e}function _expandUnicodeEscapes(e){return e.replace(/\\([0-9a-f]{1,6})\s/gi,(function(){for(var e=arguments[1],t=6-e.length;t--;)e="0"+e;return "\\"+e}))}var types={STYLE_RULE:1,KEYFRAMES_RULE:7,MEDIA_RULE:4,MIXIN_RULE:1e3},OPEN_BRACE="{",CLOSE_BRACE="}",RX={comments:/\/\*[^*]*\*+([^/*][^*]*\*+)*\//gim,port:/@import[^;]*;/gim,customProp:/(?:^[^;\-\s}]+)?--[^;{}]*?:[^{};]*?(?:[;\n]|$)/gim,mixinProp:/(?:^[^;\-\s}]+)?--[^;{}]*?:[^{};]*?{[^}]*?}(?:[;\n]|$)?/gim,mixinApply:/@apply\s*\(?[^);]*\)?\s*(?:[;\n]|$)?/gim,varApply:/[^;:]*?:[^;]*?var\([^;]*\)(?:[;\n]|$)?/gim,keyframesRule:/^@[^\s]*keyframes/,multipleSpaces:/\s+/g},VAR_START="--",MEDIA_START="@media",AT_START="@";function findRegex(e,t,r){e.lastIndex=0;var n=t.substring(r).match(e);if(n){var s=r+n.index;return {start:s,end:s+n[0].length}}return null}var VAR_USAGE_START=/\bvar\(/,VAR_ASSIGN_START=/\B--[\w-]+\s*:/,COMMENTS=/\/\*[^*]*\*+([^/*][^*]*\*+)*\//gim,TRAILING_LINES=/^[\t ]+\n/gm;function resolveVar(e,t,r){return e[t]?e[t]:r?executeTemplate(r,e):""}function findVarEndIndex(e,t){for(var r=0,n=t;n<e.length;n++){var s=e[n];if("("===s)r++;else if(")"===s&&--r<=0)return n+1}return n}function parseVar(e,t){var r=findRegex(VAR_USAGE_START,e,t);if(!r)return null;var n=findVarEndIndex(e,r.start),s=e.substring(r.end,n-1).split(","),o=s[0],a=s.slice(1);return {start:r.start,end:n,propName:o.trim(),fallback:a.length>0?a.join(",").trim():void 0}}function compileVar(e,t,r){var n=parseVar(e,r);if(!n)return t.push(e.substring(r,e.length)),e.length;var s=n.propName,o=null!=n.fallback?compileTemplate(n.fallback):void 0;return t.push(e.substring(r,n.start),(function(e){return resolveVar(e,s,o)})),n.end}function executeTemplate(e,t){for(var r="",n=0;n<e.length;n++){var s=e[n];r+="string"==typeof s?s:s(t);}return r}function findEndValue(e,t){for(var r=!1,n=!1,s=t;s<e.length;s++){var o=e[s];if(r)n&&'"'===o&&(r=!1),n||"'"!==o||(r=!1);else if('"'===o)r=!0,n=!0;else if("'"===o)r=!0,n=!1;else {if(";"===o)return s+1;if("}"===o)return s}}return s}function removeCustomAssigns(e){for(var t="",r=0;;){var n=findRegex(VAR_ASSIGN_START,e,r),s=n?n.start:e.length;if(t+=e.substring(r,s),!n)break;r=findEndValue(e,s);}return t}function compileTemplate(e){var t=0;e=removeCustomAssigns(e=e.replace(COMMENTS,"")).replace(TRAILING_LINES,"");for(var r=[];t<e.length;)t=compileVar(e,r,t);return r}function resolveValues(e){var t={};e.forEach((function(e){e.declarations.forEach((function(e){t[e.prop]=e.value;}));}));for(var r={},n=Object.entries(t),s=function(e){var t=!1;if(n.forEach((function(e){var n=e[0],s=executeTemplate(e[1],r);s!==r[n]&&(r[n]=s,t=!0);})),!t)return "break"},o=0;o<10;o++){if("break"===s())break}return r}function getSelectors(e,t){if(void 0===t&&(t=0),!e.rules)return [];var r=[];return e.rules.filter((function(e){return e.type===types.STYLE_RULE})).forEach((function(e){var n=getDeclarations(e.cssText);n.length>0&&e.parsedSelector.split(",").forEach((function(e){e=e.trim(),r.push({selector:e,declarations:n,specificity:computeSpecificity(),nu:t});})),t++;})),r}function computeSpecificity(e){return 1}var IMPORTANT="!important",FIND_DECLARATIONS=/(?:^|[;\s{]\s*)(--[\w-]*?)\s*:\s*(?:((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^)]*?\)|[^};{])+)|\{([^}]*)\}(?:(?=[;\s}])|$))/gm;function getDeclarations(e){for(var t,r=[];t=FIND_DECLARATIONS.exec(e.trim());){var n=normalizeValue(t[2]),s=n.value,o=n.important;r.push({prop:t[1].trim(),value:compileTemplate(s),important:o});}return r}function normalizeValue(e){var t=(e=e.replace(/\s+/gim," ").trim()).endsWith(IMPORTANT);return t&&(e=e.substr(0,e.length-IMPORTANT.length).trim()),{value:e,important:t}}function getActiveSelectors(e,t,r){var n=[],s=getScopesForElement(t,e);return r.forEach((function(e){return n.push(e)})),s.forEach((function(e){return n.push(e)})),sortSelectors(getSelectorsForScopes(n).filter((function(t){return matches(e,t.selector)})))}function getScopesForElement(e,t){for(var r=[];t;){var n=e.get(t);n&&r.push(n),t=t.parentElement;}return r}function getSelectorsForScopes(e){var t=[];return e.forEach((function(e){t.push.apply(t,e.selectors);})),t}function sortSelectors(e){return e.sort((function(e,t){return e.specificity===t.specificity?e.nu-t.nu:e.specificity-t.specificity})),e}function matches(e,t){return ":root"===t||"html"===t||e.matches(t)}function parseCSS(e){var t=parse(e),r=compileTemplate(e);return {original:e,template:r,selectors:getSelectors(t),usesCssVars:r.length>1}}function addGlobalStyle(e,t){if(e.some((function(e){return e.styleEl===t})))return !1;var r=parseCSS(t.textContent);return r.styleEl=t,e.push(r),!0}function updateGlobalScopes(e){var t=resolveValues(getSelectorsForScopes(e));e.forEach((function(e){e.usesCssVars&&(e.styleEl.textContent=executeTemplate(e.template,t));}));}function reScope(e,t){var r=e.template.map((function(r){return "string"==typeof r?replaceScope(r,e.scopeId,t):r})),n=e.selectors.map((function(r){return __assign(__assign({},r),{selector:replaceScope(r.selector,e.scopeId,t)})}));return __assign(__assign({},e),{template:r,selectors:n,scopeId:t})}function replaceScope(e,t,r){return e=replaceAll(e,"\\."+t,"."+r)}function replaceAll(e,t,r){return e.replace(new RegExp(t,"g"),r)}function loadDocument(e,t){return loadDocumentStyles(e,t),loadDocumentLinks(e,t).then((function(){updateGlobalScopes(t);}))}function startWatcher(e,t){"undefined"!=typeof MutationObserver&&new MutationObserver((function(){loadDocumentStyles(e,t)&&updateGlobalScopes(t);})).observe(document.head,{childList:!0});}function loadDocumentLinks(e,t){for(var r=[],n=e.querySelectorAll('link[rel="stylesheet"][href]:not([data-no-shim])'),s=0;s<n.length;s++)r.push(addGlobalLink(e,t,n[s]));return Promise.all(r)}function loadDocumentStyles(e,t){return Array.from(e.querySelectorAll("style:not([data-styles]):not([data-no-shim])")).map((function(e){return addGlobalStyle(t,e)})).some(Boolean)}function addGlobalLink(e,t,r){var n=r.href;return fetch(n).then((function(e){return e.text()})).then((function(s){if(hasCssVariables(s)&&r.parentNode){hasRelativeUrls(s)&&(s=fixRelativeUrls(s,n));var o=e.createElement("style");o.setAttribute("data-styles",""),o.textContent=s,addGlobalStyle(t,o),r.parentNode.insertBefore(o,r),r.remove();}})).catch((function(e){console.error(e);}))}var CSS_VARIABLE_REGEXP=/[\s;{]--[-a-zA-Z0-9]+\s*:/m;function hasCssVariables(e){return e.indexOf("var(")>-1||CSS_VARIABLE_REGEXP.test(e)}var CSS_URL_REGEXP=/url[\s]*\([\s]*['"]?(?!(?:https?|data)\:|\/)([^\'\"\)]*)[\s]*['"]?\)[\s]*/gim;function hasRelativeUrls(e){return CSS_URL_REGEXP.lastIndex=0,CSS_URL_REGEXP.test(e)}function fixRelativeUrls(e,t){var r=t.replace(/[^/]*$/,"");return e.replace(CSS_URL_REGEXP,(function(e,t){var n=r+t;return e.replace(t,n)}))}var CustomStyle=function(){function e(e,t){this.win=e,this.doc=t,this.count=0,this.hostStyleMap=new WeakMap,this.hostScopeMap=new WeakMap,this.globalScopes=[],this.scopesMap=new Map,this.didInit=!1;}return e.prototype.i=function(){var e=this;return this.didInit||!this.win.requestAnimationFrame?Promise.resolve():(this.didInit=!0,new Promise((function(t){e.win.requestAnimationFrame((function(){startWatcher(e.doc,e.globalScopes),loadDocument(e.doc,e.globalScopes).then((function(){return t()}));}));})))},e.prototype.addLink=function(e){var t=this;return addGlobalLink(this.doc,this.globalScopes,e).then((function(){t.updateGlobal();}))},e.prototype.addGlobalStyle=function(e){addGlobalStyle(this.globalScopes,e)&&this.updateGlobal();},e.prototype.createHostStyle=function(e,t,r,n){if(this.hostScopeMap.has(e))throw new Error("host style already created");var s=this.registerHostTemplate(r,t,n),o=this.doc.createElement("style");return o.setAttribute("data-no-shim",""),s.usesCssVars?n?(o["s-sc"]=t=s.scopeId+"-"+this.count,o.textContent="/*needs update*/",this.hostStyleMap.set(e,o),this.hostScopeMap.set(e,reScope(s,t)),this.count++):(s.styleEl=o,s.usesCssVars||(o.textContent=executeTemplate(s.template,{})),this.globalScopes.push(s),this.updateGlobal(),this.hostScopeMap.set(e,s)):o.textContent=r,o},e.prototype.removeHost=function(e){var t=this.hostStyleMap.get(e);t&&t.remove(),this.hostStyleMap.delete(e),this.hostScopeMap.delete(e);},e.prototype.updateHost=function(e){var t=this.hostScopeMap.get(e);if(t&&t.usesCssVars&&t.isScoped){var r=this.hostStyleMap.get(e);if(r){var n=resolveValues(getActiveSelectors(e,this.hostScopeMap,this.globalScopes));r.textContent=executeTemplate(t.template,n);}}},e.prototype.updateGlobal=function(){updateGlobalScopes(this.globalScopes);},e.prototype.registerHostTemplate=function(e,t,r){var n=this.scopesMap.get(t);return n||((n=parseCSS(e)).scopeId=t,n.isScoped=r,this.scopesMap.set(t,n)),n},e}();!function(e){!e||e.__cssshim||e.CSS&&e.CSS.supports&&e.CSS.supports("color","var(--c)")||(e.__cssshim=new CustomStyle(e,e.document));}("undefined"!=typeof window&&window);
