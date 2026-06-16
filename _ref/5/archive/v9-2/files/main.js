var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// node_modules/html-to-image/es/util.js
function resolveUrl(url, baseUrl) {
  if (url.match(/^[a-z]+:\/\//i)) {
    return url;
  }
  if (url.match(/^\/\//)) {
    return window.location.protocol + url;
  }
  if (url.match(/^[a-z]+:/i)) {
    return url;
  }
  const doc = document.implementation.createHTMLDocument();
  const base = doc.createElement("base");
  const a = doc.createElement("a");
  doc.head.appendChild(base);
  doc.body.appendChild(a);
  if (baseUrl) {
    base.href = baseUrl;
  }
  a.href = url;
  return a.href;
}
function toArray(arrayLike) {
  const arr = [];
  for (let i = 0, l = arrayLike.length; i < l; i++) {
    arr.push(arrayLike[i]);
  }
  return arr;
}
function getStyleProperties(options = {}) {
  if (styleProps) {
    return styleProps;
  }
  if (options.includeStyleProperties) {
    styleProps = options.includeStyleProperties;
    return styleProps;
  }
  styleProps = toArray(window.getComputedStyle(document.documentElement));
  return styleProps;
}
function px(node, styleProperty) {
  const win = node.ownerDocument.defaultView || window;
  const val = win.getComputedStyle(node).getPropertyValue(styleProperty);
  return val ? parseFloat(val.replace("px", "")) : 0;
}
function getNodeWidth(node) {
  const leftBorder = px(node, "border-left-width");
  const rightBorder = px(node, "border-right-width");
  return node.clientWidth + leftBorder + rightBorder;
}
function getNodeHeight(node) {
  const topBorder = px(node, "border-top-width");
  const bottomBorder = px(node, "border-bottom-width");
  return node.clientHeight + topBorder + bottomBorder;
}
function getImageSize(targetNode, options = {}) {
  const width = options.width || getNodeWidth(targetNode);
  const height = options.height || getNodeHeight(targetNode);
  return { width, height };
}
function getPixelRatio() {
  let ratio;
  let FINAL_PROCESS;
  try {
    FINAL_PROCESS = process;
  } catch (e) {
  }
  const val = FINAL_PROCESS && FINAL_PROCESS.env ? FINAL_PROCESS.env.devicePixelRatio : null;
  if (val) {
    ratio = parseInt(val, 10);
    if (Number.isNaN(ratio)) {
      ratio = 1;
    }
  }
  return ratio || window.devicePixelRatio || 1;
}
function checkCanvasDimensions(canvas) {
  if (canvas.width > canvasDimensionLimit || canvas.height > canvasDimensionLimit) {
    if (canvas.width > canvasDimensionLimit && canvas.height > canvasDimensionLimit) {
      if (canvas.width > canvas.height) {
        canvas.height *= canvasDimensionLimit / canvas.width;
        canvas.width = canvasDimensionLimit;
      } else {
        canvas.width *= canvasDimensionLimit / canvas.height;
        canvas.height = canvasDimensionLimit;
      }
    } else if (canvas.width > canvasDimensionLimit) {
      canvas.height *= canvasDimensionLimit / canvas.width;
      canvas.width = canvasDimensionLimit;
    } else {
      canvas.width *= canvasDimensionLimit / canvas.height;
      canvas.height = canvasDimensionLimit;
    }
  }
}
function createImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      img.decode().then(() => {
        requestAnimationFrame(() => resolve(img));
      });
    };
    img.onerror = reject;
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.src = url;
  });
}
async function svgToDataURL(svg) {
  return Promise.resolve().then(() => new XMLSerializer().serializeToString(svg)).then(encodeURIComponent).then((html) => `data:image/svg+xml;charset=utf-8,${html}`);
}
async function nodeToDataURL(node, width, height) {
  const xmlns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(xmlns, "svg");
  const foreignObject = document.createElementNS(xmlns, "foreignObject");
  svg.setAttribute("width", `${width}`);
  svg.setAttribute("height", `${height}`);
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  foreignObject.setAttribute("width", "100%");
  foreignObject.setAttribute("height", "100%");
  foreignObject.setAttribute("x", "0");
  foreignObject.setAttribute("y", "0");
  foreignObject.setAttribute("externalResourcesRequired", "true");
  svg.appendChild(foreignObject);
  foreignObject.appendChild(node);
  return svgToDataURL(svg);
}
var uuid, styleProps, canvasDimensionLimit, isInstanceOfElement;
var init_util = __esm({
  "node_modules/html-to-image/es/util.js"() {
    uuid = /* @__PURE__ */ (() => {
      let counter = 0;
      const random3 = () => (
        // eslint-disable-next-line no-bitwise
        `0000${(Math.random() * 36 ** 4 << 0).toString(36)}`.slice(-4)
      );
      return () => {
        counter += 1;
        return `u${random3()}${counter}`;
      };
    })();
    styleProps = null;
    canvasDimensionLimit = 16384;
    isInstanceOfElement = (node, instance) => {
      if (node instanceof instance)
        return true;
      const nodePrototype = Object.getPrototypeOf(node);
      if (nodePrototype === null)
        return false;
      return nodePrototype.constructor.name === instance.name || isInstanceOfElement(nodePrototype, instance);
    };
  }
});

// node_modules/html-to-image/es/clone-pseudos.js
function formatCSSText(style) {
  const content = style.getPropertyValue("content");
  return `${style.cssText} content: '${content.replace(/'|"/g, "")}';`;
}
function formatCSSProperties(style, options) {
  return getStyleProperties(options).map((name) => {
    const value = style.getPropertyValue(name);
    const priority = style.getPropertyPriority(name);
    return `${name}: ${value}${priority ? " !important" : ""};`;
  }).join(" ");
}
function getPseudoElementStyle(className, pseudo, style, options) {
  const selector3 = `.${className}:${pseudo}`;
  const cssText = style.cssText ? formatCSSText(style) : formatCSSProperties(style, options);
  return document.createTextNode(`${selector3}{${cssText}}`);
}
function clonePseudoElement(nativeNode, clonedNode, pseudo, options) {
  const style = window.getComputedStyle(nativeNode, pseudo);
  const content = style.getPropertyValue("content");
  if (content === "" || content === "none") {
    return;
  }
  const className = uuid();
  try {
    clonedNode.className = `${clonedNode.className} ${className}`;
  } catch (err) {
    return;
  }
  const styleElement = document.createElement("style");
  styleElement.appendChild(getPseudoElementStyle(className, pseudo, style, options));
  clonedNode.appendChild(styleElement);
}
function clonePseudoElements(nativeNode, clonedNode, options) {
  clonePseudoElement(nativeNode, clonedNode, ":before", options);
  clonePseudoElement(nativeNode, clonedNode, ":after", options);
}
var init_clone_pseudos = __esm({
  "node_modules/html-to-image/es/clone-pseudos.js"() {
    init_util();
  }
});

// node_modules/html-to-image/es/mimes.js
function getExtension(url) {
  const match = /\.([^./]*?)$/g.exec(url);
  return match ? match[1] : "";
}
function getMimeType(url) {
  const extension = getExtension(url).toLowerCase();
  return mimes[extension] || "";
}
var WOFF, JPEG, mimes;
var init_mimes = __esm({
  "node_modules/html-to-image/es/mimes.js"() {
    WOFF = "application/font-woff";
    JPEG = "image/jpeg";
    mimes = {
      woff: WOFF,
      woff2: WOFF,
      ttf: "application/font-truetype",
      eot: "application/vnd.ms-fontobject",
      png: "image/png",
      jpg: JPEG,
      jpeg: JPEG,
      gif: "image/gif",
      tiff: "image/tiff",
      svg: "image/svg+xml",
      webp: "image/webp"
    };
  }
});

// node_modules/html-to-image/es/dataurl.js
function getContentFromDataUrl(dataURL) {
  return dataURL.split(/,/)[1];
}
function isDataUrl(url) {
  return url.search(/^(data:)/) !== -1;
}
function makeDataUrl(content, mimeType) {
  return `data:${mimeType};base64,${content}`;
}
async function fetchAsDataURL(url, init4, process2) {
  const res = await fetch(url, init4);
  if (res.status === 404) {
    throw new Error(`Resource "${res.url}" not found`);
  }
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onloadend = () => {
      try {
        resolve(process2({ res, result: reader.result }));
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsDataURL(blob);
  });
}
function getCacheKey(url, contentType, includeQueryParams) {
  let key = url.replace(/\?.*/, "");
  if (includeQueryParams) {
    key = url;
  }
  if (/ttf|otf|eot|woff2?/i.test(key)) {
    key = key.replace(/.*\//, "");
  }
  return contentType ? `[${contentType}]${key}` : key;
}
async function resourceToDataURL(resourceUrl, contentType, options) {
  const cacheKey = getCacheKey(resourceUrl, contentType, options.includeQueryParams);
  if (cache[cacheKey] != null) {
    return cache[cacheKey];
  }
  if (options.cacheBust) {
    resourceUrl += (/\?/.test(resourceUrl) ? "&" : "?") + (/* @__PURE__ */ new Date()).getTime();
  }
  let dataURL;
  try {
    const content = await fetchAsDataURL(resourceUrl, options.fetchRequestInit, ({ res, result }) => {
      if (!contentType) {
        contentType = res.headers.get("Content-Type") || "";
      }
      return getContentFromDataUrl(result);
    });
    dataURL = makeDataUrl(content, contentType);
  } catch (error) {
    dataURL = options.imagePlaceholder || "";
    let msg = `Failed to fetch resource: ${resourceUrl}`;
    if (error) {
      msg = typeof error === "string" ? error : error.message;
    }
    if (msg) {
      console.warn(msg);
    }
  }
  cache[cacheKey] = dataURL;
  return dataURL;
}
var cache;
var init_dataurl = __esm({
  "node_modules/html-to-image/es/dataurl.js"() {
    cache = {};
  }
});

// node_modules/html-to-image/es/clone-node.js
async function cloneCanvasElement(canvas) {
  const dataURL = canvas.toDataURL();
  if (dataURL === "data:,") {
    return canvas.cloneNode(false);
  }
  return createImage(dataURL);
}
async function cloneVideoElement(video, options) {
  if (video.currentSrc) {
    const canvas = document.createElement("canvas");
    const ctx2 = canvas.getContext("2d");
    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;
    ctx2 === null || ctx2 === void 0 ? void 0 : ctx2.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataURL2 = canvas.toDataURL();
    return createImage(dataURL2);
  }
  const poster = video.poster;
  const contentType = getMimeType(poster);
  const dataURL = await resourceToDataURL(poster, contentType, options);
  return createImage(dataURL);
}
async function cloneIFrameElement(iframe, options) {
  var _a;
  try {
    if ((_a = iframe === null || iframe === void 0 ? void 0 : iframe.contentDocument) === null || _a === void 0 ? void 0 : _a.body) {
      return await cloneNode(iframe.contentDocument.body, options, true);
    }
  } catch (_b) {
  }
  return iframe.cloneNode(false);
}
async function cloneSingleNode(node, options) {
  if (isInstanceOfElement(node, HTMLCanvasElement)) {
    return cloneCanvasElement(node);
  }
  if (isInstanceOfElement(node, HTMLVideoElement)) {
    return cloneVideoElement(node, options);
  }
  if (isInstanceOfElement(node, HTMLIFrameElement)) {
    return cloneIFrameElement(node, options);
  }
  return node.cloneNode(isSVGElement(node));
}
async function cloneChildren(nativeNode, clonedNode, options) {
  var _a, _b;
  if (isSVGElement(clonedNode)) {
    return clonedNode;
  }
  let children = [];
  if (isSlotElement(nativeNode) && nativeNode.assignedNodes) {
    children = toArray(nativeNode.assignedNodes());
  } else if (isInstanceOfElement(nativeNode, HTMLIFrameElement) && ((_a = nativeNode.contentDocument) === null || _a === void 0 ? void 0 : _a.body)) {
    children = toArray(nativeNode.contentDocument.body.childNodes);
  } else {
    children = toArray(((_b = nativeNode.shadowRoot) !== null && _b !== void 0 ? _b : nativeNode).childNodes);
  }
  if (children.length === 0 || isInstanceOfElement(nativeNode, HTMLVideoElement)) {
    return clonedNode;
  }
  await children.reduce((deferred, child) => deferred.then(() => cloneNode(child, options)).then((clonedChild) => {
    if (clonedChild) {
      clonedNode.appendChild(clonedChild);
    }
  }), Promise.resolve());
  return clonedNode;
}
function cloneCSSStyle(nativeNode, clonedNode, options) {
  const targetStyle = clonedNode.style;
  if (!targetStyle) {
    return;
  }
  const sourceStyle = window.getComputedStyle(nativeNode);
  if (sourceStyle.cssText) {
    targetStyle.cssText = sourceStyle.cssText;
    targetStyle.transformOrigin = sourceStyle.transformOrigin;
  } else {
    getStyleProperties(options).forEach((name) => {
      let value = sourceStyle.getPropertyValue(name);
      if (name === "font-size" && value.endsWith("px")) {
        const reducedFont = Math.floor(parseFloat(value.substring(0, value.length - 2))) - 0.1;
        value = `${reducedFont}px`;
      }
      if (isInstanceOfElement(nativeNode, HTMLIFrameElement) && name === "display" && value === "inline") {
        value = "block";
      }
      if (name === "d" && clonedNode.getAttribute("d")) {
        value = `path(${clonedNode.getAttribute("d")})`;
      }
      targetStyle.setProperty(name, value, sourceStyle.getPropertyPriority(name));
    });
  }
}
function cloneInputValue(nativeNode, clonedNode) {
  if (isInstanceOfElement(nativeNode, HTMLTextAreaElement)) {
    clonedNode.innerHTML = nativeNode.value;
  }
  if (isInstanceOfElement(nativeNode, HTMLInputElement)) {
    clonedNode.setAttribute("value", nativeNode.value);
  }
}
function cloneSelectValue(nativeNode, clonedNode) {
  if (isInstanceOfElement(nativeNode, HTMLSelectElement)) {
    const clonedSelect = clonedNode;
    const selectedOption = Array.from(clonedSelect.children).find((child) => nativeNode.value === child.getAttribute("value"));
    if (selectedOption) {
      selectedOption.setAttribute("selected", "");
    }
  }
}
function decorate(nativeNode, clonedNode, options) {
  if (isInstanceOfElement(clonedNode, Element)) {
    cloneCSSStyle(nativeNode, clonedNode, options);
    clonePseudoElements(nativeNode, clonedNode, options);
    cloneInputValue(nativeNode, clonedNode);
    cloneSelectValue(nativeNode, clonedNode);
  }
  return clonedNode;
}
async function ensureSVGSymbols(clone, options) {
  const uses = clone.querySelectorAll ? clone.querySelectorAll("use") : [];
  if (uses.length === 0) {
    return clone;
  }
  const processedDefs = {};
  for (let i = 0; i < uses.length; i++) {
    const use = uses[i];
    const id = use.getAttribute("xlink:href");
    if (id) {
      const exist = clone.querySelector(id);
      const definition = document.querySelector(id);
      if (!exist && definition && !processedDefs[id]) {
        processedDefs[id] = await cloneNode(definition, options, true);
      }
    }
  }
  const nodes = Object.values(processedDefs);
  if (nodes.length) {
    const ns = "http://www.w3.org/1999/xhtml";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("xmlns", ns);
    svg.style.position = "absolute";
    svg.style.width = "0";
    svg.style.height = "0";
    svg.style.overflow = "hidden";
    svg.style.display = "none";
    const defs = document.createElementNS(ns, "defs");
    svg.appendChild(defs);
    for (let i = 0; i < nodes.length; i++) {
      defs.appendChild(nodes[i]);
    }
    clone.appendChild(svg);
  }
  return clone;
}
async function cloneNode(node, options, isRoot) {
  if (!isRoot && options.filter && !options.filter(node)) {
    return null;
  }
  return Promise.resolve(node).then((clonedNode) => cloneSingleNode(clonedNode, options)).then((clonedNode) => cloneChildren(node, clonedNode, options)).then((clonedNode) => decorate(node, clonedNode, options)).then((clonedNode) => ensureSVGSymbols(clonedNode, options));
}
var isSlotElement, isSVGElement;
var init_clone_node = __esm({
  "node_modules/html-to-image/es/clone-node.js"() {
    init_clone_pseudos();
    init_util();
    init_mimes();
    init_dataurl();
    isSlotElement = (node) => node.tagName != null && node.tagName.toUpperCase() === "SLOT";
    isSVGElement = (node) => node.tagName != null && node.tagName.toUpperCase() === "SVG";
  }
});

// node_modules/html-to-image/es/embed-resources.js
function toRegex(url) {
  const escaped = url.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1");
  return new RegExp(`(url\\(['"]?)(${escaped})(['"]?\\))`, "g");
}
function parseURLs(cssText) {
  const urls = [];
  cssText.replace(URL_REGEX, (raw, quotation, url) => {
    urls.push(url);
    return raw;
  });
  return urls.filter((url) => !isDataUrl(url));
}
async function embed(cssText, resourceURL, baseURL, options, getContentFromUrl) {
  try {
    const resolvedURL = baseURL ? resolveUrl(resourceURL, baseURL) : resourceURL;
    const contentType = getMimeType(resourceURL);
    let dataURL;
    if (getContentFromUrl) {
      const content = await getContentFromUrl(resolvedURL);
      dataURL = makeDataUrl(content, contentType);
    } else {
      dataURL = await resourceToDataURL(resolvedURL, contentType, options);
    }
    return cssText.replace(toRegex(resourceURL), `$1${dataURL}$3`);
  } catch (error) {
  }
  return cssText;
}
function filterPreferredFontFormat(str, { preferredFontFormat }) {
  return !preferredFontFormat ? str : str.replace(FONT_SRC_REGEX, (match) => {
    while (true) {
      const [src, , format] = URL_WITH_FORMAT_REGEX.exec(match) || [];
      if (!format) {
        return "";
      }
      if (format === preferredFontFormat) {
        return `src: ${src};`;
      }
    }
  });
}
function shouldEmbed(url) {
  return url.search(URL_REGEX) !== -1;
}
async function embedResources(cssText, baseUrl, options) {
  if (!shouldEmbed(cssText)) {
    return cssText;
  }
  const filteredCSSText = filterPreferredFontFormat(cssText, options);
  const urls = parseURLs(filteredCSSText);
  return urls.reduce((deferred, url) => deferred.then((css) => embed(css, url, baseUrl, options)), Promise.resolve(filteredCSSText));
}
var URL_REGEX, URL_WITH_FORMAT_REGEX, FONT_SRC_REGEX;
var init_embed_resources = __esm({
  "node_modules/html-to-image/es/embed-resources.js"() {
    init_util();
    init_mimes();
    init_dataurl();
    URL_REGEX = /url\((['"]?)([^'"]+?)\1\)/g;
    URL_WITH_FORMAT_REGEX = /url\([^)]+\)\s*format\((["']?)([^"']+)\1\)/g;
    FONT_SRC_REGEX = /src:\s*(?:url\([^)]+\)\s*format\([^)]+\)[,;]\s*)+/g;
  }
});

// node_modules/html-to-image/es/embed-images.js
async function embedProp(propName, node, options) {
  var _a;
  const propValue = (_a = node.style) === null || _a === void 0 ? void 0 : _a.getPropertyValue(propName);
  if (propValue) {
    const cssString = await embedResources(propValue, null, options);
    node.style.setProperty(propName, cssString, node.style.getPropertyPriority(propName));
    return true;
  }
  return false;
}
async function embedBackground(clonedNode, options) {
  ;
  await embedProp("background", clonedNode, options) || await embedProp("background-image", clonedNode, options);
  await embedProp("mask", clonedNode, options) || await embedProp("-webkit-mask", clonedNode, options) || await embedProp("mask-image", clonedNode, options) || await embedProp("-webkit-mask-image", clonedNode, options);
}
async function embedImageNode(clonedNode, options) {
  const isImageElement = isInstanceOfElement(clonedNode, HTMLImageElement);
  if (!(isImageElement && !isDataUrl(clonedNode.src)) && !(isInstanceOfElement(clonedNode, SVGImageElement) && !isDataUrl(clonedNode.href.baseVal))) {
    return;
  }
  const url = isImageElement ? clonedNode.src : clonedNode.href.baseVal;
  const dataURL = await resourceToDataURL(url, getMimeType(url), options);
  await new Promise((resolve, reject) => {
    clonedNode.onload = resolve;
    clonedNode.onerror = options.onImageErrorHandler ? (...attributes) => {
      try {
        resolve(options.onImageErrorHandler(...attributes));
      } catch (error) {
        reject(error);
      }
    } : reject;
    const image = clonedNode;
    if (image.decode) {
      image.decode = resolve;
    }
    if (image.loading === "lazy") {
      image.loading = "eager";
    }
    if (isImageElement) {
      clonedNode.srcset = "";
      clonedNode.src = dataURL;
    } else {
      clonedNode.href.baseVal = dataURL;
    }
  });
}
async function embedChildren(clonedNode, options) {
  const children = toArray(clonedNode.childNodes);
  const deferreds = children.map((child) => embedImages(child, options));
  await Promise.all(deferreds).then(() => clonedNode);
}
async function embedImages(clonedNode, options) {
  if (isInstanceOfElement(clonedNode, Element)) {
    await embedBackground(clonedNode, options);
    await embedImageNode(clonedNode, options);
    await embedChildren(clonedNode, options);
  }
}
var init_embed_images = __esm({
  "node_modules/html-to-image/es/embed-images.js"() {
    init_embed_resources();
    init_util();
    init_dataurl();
    init_mimes();
  }
});

// node_modules/html-to-image/es/apply-style.js
function applyStyle(node, options) {
  const { style } = node;
  if (options.backgroundColor) {
    style.backgroundColor = options.backgroundColor;
  }
  if (options.width) {
    style.width = `${options.width}px`;
  }
  if (options.height) {
    style.height = `${options.height}px`;
  }
  const manual = options.style;
  if (manual != null) {
    Object.keys(manual).forEach((key) => {
      style[key] = manual[key];
    });
  }
  return node;
}
var init_apply_style = __esm({
  "node_modules/html-to-image/es/apply-style.js"() {
  }
});

// node_modules/html-to-image/es/embed-webfonts.js
async function fetchCSS(url) {
  let cache2 = cssFetchCache[url];
  if (cache2 != null) {
    return cache2;
  }
  const res = await fetch(url);
  const cssText = await res.text();
  cache2 = { url, cssText };
  cssFetchCache[url] = cache2;
  return cache2;
}
async function embedFonts(data, options) {
  let cssText = data.cssText;
  const regexUrl = /url\(["']?([^"')]+)["']?\)/g;
  const fontLocs = cssText.match(/url\([^)]+\)/g) || [];
  const loadFonts = fontLocs.map(async (loc) => {
    let url = loc.replace(regexUrl, "$1");
    if (!url.startsWith("https://")) {
      url = new URL(url, data.url).href;
    }
    return fetchAsDataURL(url, options.fetchRequestInit, ({ result }) => {
      cssText = cssText.replace(loc, `url(${result})`);
      return [loc, result];
    });
  });
  return Promise.all(loadFonts).then(() => cssText);
}
function parseCSS(source) {
  if (source == null) {
    return [];
  }
  const result = [];
  const commentsRegex = /(\/\*[\s\S]*?\*\/)/gi;
  let cssText = source.replace(commentsRegex, "");
  const keyframesRegex = new RegExp("((@.*?keyframes [\\s\\S]*?){([\\s\\S]*?}\\s*?)})", "gi");
  while (true) {
    const matches = keyframesRegex.exec(cssText);
    if (matches === null) {
      break;
    }
    result.push(matches[0]);
  }
  cssText = cssText.replace(keyframesRegex, "");
  const importRegex = /@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi;
  const combinedCSSRegex = "((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})";
  const unifiedRegex = new RegExp(combinedCSSRegex, "gi");
  while (true) {
    let matches = importRegex.exec(cssText);
    if (matches === null) {
      matches = unifiedRegex.exec(cssText);
      if (matches === null) {
        break;
      } else {
        importRegex.lastIndex = unifiedRegex.lastIndex;
      }
    } else {
      unifiedRegex.lastIndex = importRegex.lastIndex;
    }
    result.push(matches[0]);
  }
  return result;
}
async function getCSSRules(styleSheets, options) {
  const ret = [];
  const deferreds = [];
  styleSheets.forEach((sheet) => {
    if ("cssRules" in sheet) {
      try {
        toArray(sheet.cssRules || []).forEach((item, index) => {
          if (item.type === CSSRule.IMPORT_RULE) {
            let importIndex = index + 1;
            const url = item.href;
            const deferred = fetchCSS(url).then((metadata) => embedFonts(metadata, options)).then((cssText) => parseCSS(cssText).forEach((rule) => {
              try {
                sheet.insertRule(rule, rule.startsWith("@import") ? importIndex += 1 : sheet.cssRules.length);
              } catch (error) {
                console.error("Error inserting rule from remote css", {
                  rule,
                  error
                });
              }
            })).catch((e) => {
              console.error("Error loading remote css", e.toString());
            });
            deferreds.push(deferred);
          }
        });
      } catch (e) {
        const inline = styleSheets.find((a) => a.href == null) || document.styleSheets[0];
        if (sheet.href != null) {
          deferreds.push(fetchCSS(sheet.href).then((metadata) => embedFonts(metadata, options)).then((cssText) => parseCSS(cssText).forEach((rule) => {
            inline.insertRule(rule, inline.cssRules.length);
          })).catch((err) => {
            console.error("Error loading remote stylesheet", err);
          }));
        }
        console.error("Error inlining remote css file", e);
      }
    }
  });
  return Promise.all(deferreds).then(() => {
    styleSheets.forEach((sheet) => {
      if ("cssRules" in sheet) {
        try {
          toArray(sheet.cssRules || []).forEach((item) => {
            ret.push(item);
          });
        } catch (e) {
          console.error(`Error while reading CSS rules from ${sheet.href}`, e);
        }
      }
    });
    return ret;
  });
}
function getWebFontRules(cssRules) {
  return cssRules.filter((rule) => rule.type === CSSRule.FONT_FACE_RULE).filter((rule) => shouldEmbed(rule.style.getPropertyValue("src")));
}
async function parseWebFontRules(node, options) {
  if (node.ownerDocument == null) {
    throw new Error("Provided element is not within a Document");
  }
  const styleSheets = toArray(node.ownerDocument.styleSheets);
  const cssRules = await getCSSRules(styleSheets, options);
  return getWebFontRules(cssRules);
}
function normalizeFontFamily(font) {
  return font.trim().replace(/["']/g, "");
}
function getUsedFonts(node) {
  const fonts = /* @__PURE__ */ new Set();
  function traverse(node2) {
    const fontFamily = node2.style.fontFamily || getComputedStyle(node2).fontFamily;
    fontFamily.split(",").forEach((font) => {
      fonts.add(normalizeFontFamily(font));
    });
    Array.from(node2.children).forEach((child) => {
      if (child instanceof HTMLElement) {
        traverse(child);
      }
    });
  }
  traverse(node);
  return fonts;
}
async function getWebFontCSS(node, options) {
  const rules = await parseWebFontRules(node, options);
  const usedFonts = getUsedFonts(node);
  const cssTexts = await Promise.all(rules.filter((rule) => usedFonts.has(normalizeFontFamily(rule.style.fontFamily))).map((rule) => {
    const baseUrl = rule.parentStyleSheet ? rule.parentStyleSheet.href : null;
    return embedResources(rule.cssText, baseUrl, options);
  }));
  return cssTexts.join("\n");
}
async function embedWebFonts(clonedNode, options) {
  const cssText = options.fontEmbedCSS != null ? options.fontEmbedCSS : options.skipFonts ? null : await getWebFontCSS(clonedNode, options);
  if (cssText) {
    const styleNode = document.createElement("style");
    const sytleContent = document.createTextNode(cssText);
    styleNode.appendChild(sytleContent);
    if (clonedNode.firstChild) {
      clonedNode.insertBefore(styleNode, clonedNode.firstChild);
    } else {
      clonedNode.appendChild(styleNode);
    }
  }
}
var cssFetchCache;
var init_embed_webfonts = __esm({
  "node_modules/html-to-image/es/embed-webfonts.js"() {
    init_util();
    init_dataurl();
    init_embed_resources();
    cssFetchCache = {};
  }
});

// node_modules/html-to-image/es/index.js
async function toSvg(node, options = {}) {
  const { width, height } = getImageSize(node, options);
  const clonedNode = await cloneNode(node, options, true);
  await embedWebFonts(clonedNode, options);
  await embedImages(clonedNode, options);
  applyStyle(clonedNode, options);
  const datauri = await nodeToDataURL(clonedNode, width, height);
  return datauri;
}
async function toCanvas(node, options = {}) {
  const { width, height } = getImageSize(node, options);
  const svg = await toSvg(node, options);
  const img = await createImage(svg);
  const canvas = document.createElement("canvas");
  const context3 = canvas.getContext("2d");
  const ratio = options.pixelRatio || getPixelRatio();
  const canvasWidth = options.canvasWidth || width;
  const canvasHeight = options.canvasHeight || height;
  canvas.width = canvasWidth * ratio;
  canvas.height = canvasHeight * ratio;
  if (!options.skipAutoScale) {
    checkCanvasDimensions(canvas);
  }
  canvas.style.width = `${canvasWidth}`;
  canvas.style.height = `${canvasHeight}`;
  if (options.backgroundColor) {
    context3.fillStyle = options.backgroundColor;
    context3.fillRect(0, 0, canvas.width, canvas.height);
  }
  context3.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}
async function toPng(node, options = {}) {
  const canvas = await toCanvas(node, options);
  return canvas.toDataURL();
}
var init_es = __esm({
  "node_modules/html-to-image/es/index.js"() {
    init_clone_node();
    init_embed_images();
    init_apply_style();
    init_embed_webfonts();
    init_util();
  }
});

// public/20260401183100_f1bbc072-ea26-42d7-a4eb-8de16f4caed3/appHelper.ts
var AppHelper;
var init_appHelper = __esm({
  "public/20260401183100_f1bbc072-ea26-42d7-a4eb-8de16f4caed3/appHelper.ts"() {
    init_es();
    AppHelper = class {
      static async fetchRawData() {
        const response = await fetch("data.json");
        if (!response.ok) throw new Error(`Failed to load data.json`);
        return await response.json();
      }
      static async loadAppData() {
        const data = await this.fetchRawData();
        return data.appData;
      }
      static async loadTextData() {
        const data = await this.fetchRawData();
        return data.textData;
      }
      static async loadAssetList() {
        const data = await this.fetchRawData();
        return data.assetList;
      }
      /**
       * 브라우저 클라이언트 좌표를 캔버스의 논리 해상도 좌표로 변환합니다.
       * AI 지침: appCanvas 규칙에 따라 모든 마우스/터치 좌표 보정에 이 함수를 사용하세요.
       * @param clientX - event.clientX
       * @param clientY - event.clientY
       * @param appCanvas - 기준이 되는 HTMLCanvasElement
       */
      static getRelativeCoordinates(clientX, clientY, appCanvas2) {
        const rect = appCanvas2.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const scaleX = appCanvas2.width / rect.width;
        const scaleY = appCanvas2.height / rect.height;
        return {
          x: x * scaleX,
          y: y * scaleY
        };
      }
      /** 기기 유형 감지 */
      static getPlatform() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) || navigator.maxTouchPoints > 0 ? "mobile" : "pc";
      }
      /** 화면 방향 감지 (가로 모드 여부) */
      static isLandscape() {
        return window.innerWidth > window.innerHeight;
      }
      /** 터치 지원 여부 (PC라도 터치 모니터일 수 있음) */
      static supportsTouch() {
        return "ontouchstart" in window || navigator.maxTouchPoints > 0;
      }
      /** 텍스트를 안전한 HTML로 변환 (XSS 방어) */
      static sanitizeText(text) {
        let safe = text.replace(
          /<(script|style|iframe|svg|math|form)\b[^>]*>[\s\S]*?<\/\1>/gi,
          ""
        );
        safe = safe.replace(
          /<\/?(script|style|iframe|svg|math|form)\b[^>]*\/?>/gi,
          ""
        );
        safe = safe.replace(
          /<\/?(img|a|input|button|textarea|select|option|label|fieldset|legend|link|meta|base|video|audio|source|object|embed|span|div|table|tr|td|th|thead|tbody|tfoot|col|colgroup|caption|h[1-6]|nav|section|article|header|footer|main|aside|details|summary)\b[^>]*>/gi,
          ""
        );
        safe = safe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        safe = safe.replace(/&lt;(br)\s*\/?&gt;/gi, "<br>");
        safe = safe.replace(/&lt;(\/?(?:p|b|i|u|strong|em|small))&gt;/gi, "<$1>");
        safe = safe.replace(/&amp;#(\d+);/g, (match, num) => {
          const n = parseInt(num, 10);
          return n === 38 || n === 60 || n === 62 ? match : `&#${num};`;
        });
        safe = safe.replace(/&amp;#x([0-9a-fA-F]+);/g, (match, hex) => {
          const n = parseInt(hex, 16);
          return n === 38 || n === 60 || n === 62 ? match : `&#x${hex};`;
        });
        safe = safe.replace(/\n/g, "<br>");
        return safe;
      }
      /** DOM기반 UI 요소 생성 */
      static createUIElement(elementType, id = "", styles = {}, textContent = "", eventListeners = []) {
        const element = document.createElement(elementType);
        if (id) element.id = id;
        Object.assign(element.style, styles);
        if (styles.pointerEvents === "auto") {
          element.style.touchAction = "none";
        }
        if (textContent) {
          element.innerHTML = this.sanitizeText(textContent);
        }
        eventListeners.forEach(({ event, handler }) => {
          element.addEventListener(event, handler);
        });
        return element;
      }
      /**
       * 캔버스를 캡처하여 Data URL을 반환합니다. (내부 구현용)
       * @param includeUILayer - true이면 UI 레이어 포함, false이면 appCanvas만 캡처
       * @returns Data URL 문자열 또는 캡처 실패 시 null
       */
      static async captureCanvasAsDataUrl(includeUILayer = true) {
        const appCanvas2 = document.getElementById("appCanvas");
        const appContainer = document.getElementById("appContainer");
        if (!appCanvas2 || !appContainer) return null;
        let dataUrl = null;
        try {
          if (includeUILayer) {
            const savedStyle = appContainer.style.cssText;
            appContainer.style.transform = "none";
            appContainer.style.position = "relative";
            appContainer.style.left = "0";
            appContainer.style.top = "0";
            dataUrl = await toPng(appContainer, {
              width: appCanvas2.width,
              height: appCanvas2.height
            });
            appContainer.style.cssText = savedStyle;
          } else {
            dataUrl = appCanvas2.toDataURL("image/webp");
          }
        } catch (e) {
          return null;
        }
        return dataUrl && dataUrl !== "data:," ? dataUrl : null;
      }
      /**
       * 캔버스를 캡처하여 HTMLImageElement로 반환합니다.
       * AI 지침: 게임 로직에서 캡처한 이미지를 바로 사용하려면 이 함수를 사용하세요. (예: 캔버스에 다시 그리기, UI에 표시 등)
       * @param includeUILayer - true이면 UI 레이어 포함, false이면 appCanvas만 캡처
       * @returns 로드된 HTMLImageElement 또는 캡처 실패 시 null
       */
      static async captureCanvasAsImage(includeUILayer = true) {
        const dataUrl = await this.captureCanvasAsDataUrl(includeUILayer);
        if (!dataUrl) return null;
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = dataUrl;
        });
      }
    };
  }
});

// node_modules/gsap/gsap-core.js
function _assertThisInitialized(self2) {
  if (self2 === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }
  return self2;
}
function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  subClass.__proto__ = superClass;
}
var _config, _defaults, _suppressOverwrites, _reverting, _context, _bigNum, _tinyNum, _2PI, _HALF_PI, _gsID, _sqrt, _cos, _sin, _isString, _isFunction, _isNumber, _isUndefined, _isObject, _isNotFalse, _windowExists, _isFuncOrString, _isTypedArray, _isArray, _strictNumExp, _numExp, _numWithUnitExp, _complexStringNumExp, _relExp, _delimitedValueExp, _unitExp, _globalTimeline, _win, _coreInitted, _doc, _globals, _installScope, _coreReady, _install, _missingPlugin, _warn, _addGlobal, _emptyFunc, _startAtRevertConfig, _revertConfigNoKill, _revertConfig, _reservedProps, _lazyTweens, _lazyLookup, _lastRenderedFrame, _plugins, _effects, _nextGCFrame, _harnessPlugins, _callbackNames, _harness, _getCache, _getProperty, _forEachName, _round, _roundPrecise, _parseRelative, _arrayContainsAny, _lazyRender, _lazySafeRender, _numericIfPossible, _passThrough, _setDefaults, _setKeyframeDefaults, _merge, _mergeDeep, _copyExcluding, _inheritDefaults, _arraysMatch, _addLinkedListItem, _removeLinkedListItem, _removeFromParent, _uncache, _recacheAncestors, _rewindStartAt, _hasNoPausedAncestors, _elapsedCycleDuration, _animationCycle, _parentToChildTotalTime, _setEnd, _alignPlayhead, _postAddChecks, _addToTimeline, _scrollTrigger, _attemptInitTween, _parentPlayheadIsBeforeStart, _isFromOrFromStart, _renderZeroDurationTween, _findNextPauseTween, _setDuration, _onUpdateTotalDuration, _zeroPosition, _parsePosition, _createTweenType, _conditionalReturn, _clamp, getUnit, clamp, _slice, _isArrayLike, _flatten, toArray2, selector, shuffle, distribute, _roundModifier, snap, random, pipe, unitize, normalize, _wrapArray, wrap, wrapYoyo, _replaceRandom, mapRange, interpolate, _getLabelInDirection, _callback, _interrupt, _quickTween, _registerPluginQueue, _createPlugin, _255, _colorLookup, _hue, splitColor, _colorOrderData, _formatColors, _colorExp, _hslExp, _colorStringFilter, _tickerActive, _ticker, _wake, _easeMap, _customEaseExp, _quotesExp, _parseObjectInString, _valueInParentheses, _configEaseFromString, _invertEase, _propagateYoyoEase, _parseEase, _insertEase, _easeInOutFromOut, _configElastic, _configBack, GSCache, Animation, Timeline, _addComplexStringPropTween, _addPropTween, _processVars, _checkPlugin, _overwritingTween, _forceAllPropTweens, _initTween, _updatePropTweens, _addAliasesToVars, _parseKeyframe, _parseFuncOrString, _staggerTweenProps, _staggerPropsToSkip, Tween, _setterPlain, _setterFunc, _setterFuncWithParam, _setterAttribute, _getSetter, _renderPlain, _renderBoolean, _renderComplexString, _renderPropTweens, _addPluginModifier, _killPropTweensOf, _setterWithModifier, _sortPropTweensByPriority, PropTween, _media, _listeners, _emptyArray, _lastMediaTime, _contextID, _dispatch, _onMediaChange, Context, MatchMedia, _gsap, _getPluginPropTween, _addModifiers, _buildModifierPlugin, gsap, Power0, Power1, Power2, Power3, Power4, Linear, Quad, Cubic, Quart, Quint, Strong, Elastic, Back, SteppedEase, Bounce, Sine, Expo, Circ;
var init_gsap_core = __esm({
  "node_modules/gsap/gsap-core.js"() {
    _config = {
      autoSleep: 120,
      force3D: "auto",
      nullTargetWarn: 1,
      units: {
        lineHeight: ""
      }
    };
    _defaults = {
      duration: 0.5,
      overwrite: false,
      delay: 0
    };
    _bigNum = 1e8;
    _tinyNum = 1 / _bigNum;
    _2PI = Math.PI * 2;
    _HALF_PI = _2PI / 4;
    _gsID = 0;
    _sqrt = Math.sqrt;
    _cos = Math.cos;
    _sin = Math.sin;
    _isString = function _isString2(value) {
      return typeof value === "string";
    };
    _isFunction = function _isFunction2(value) {
      return typeof value === "function";
    };
    _isNumber = function _isNumber2(value) {
      return typeof value === "number";
    };
    _isUndefined = function _isUndefined2(value) {
      return typeof value === "undefined";
    };
    _isObject = function _isObject2(value) {
      return typeof value === "object";
    };
    _isNotFalse = function _isNotFalse2(value) {
      return value !== false;
    };
    _windowExists = function _windowExists2() {
      return typeof window !== "undefined";
    };
    _isFuncOrString = function _isFuncOrString2(value) {
      return _isFunction(value) || _isString(value);
    };
    _isTypedArray = typeof ArrayBuffer === "function" && ArrayBuffer.isView || function() {
    };
    _isArray = Array.isArray;
    _strictNumExp = /(?:-?\.?\d|\.)+/gi;
    _numExp = /[-+=.]*\d+[.e\-+]*\d*[e\-+]*\d*/g;
    _numWithUnitExp = /[-+=.]*\d+[.e-]*\d*[a-z%]*/g;
    _complexStringNumExp = /[-+=.]*\d+\.?\d*(?:e-|e\+)?\d*/gi;
    _relExp = /[+-]=-?[.\d]+/;
    _delimitedValueExp = /[^,'"\[\]\s]+/gi;
    _unitExp = /^[+\-=e\s\d]*\d+[.\d]*([a-z]*|%)\s*$/i;
    _globals = {};
    _installScope = {};
    _install = function _install2(scope) {
      return (_installScope = _merge(scope, _globals)) && gsap;
    };
    _missingPlugin = function _missingPlugin2(property, value) {
      return console.warn("Invalid property", property, "set to", value, "Missing plugin? gsap.registerPlugin()");
    };
    _warn = function _warn2(message, suppress) {
      return !suppress && console.warn(message);
    };
    _addGlobal = function _addGlobal2(name, obj) {
      return name && (_globals[name] = obj) && _installScope && (_installScope[name] = obj) || _globals;
    };
    _emptyFunc = function _emptyFunc2() {
      return 0;
    };
    _startAtRevertConfig = {
      suppressEvents: true,
      isStart: true,
      kill: false
    };
    _revertConfigNoKill = {
      suppressEvents: true,
      kill: false
    };
    _revertConfig = {
      suppressEvents: true
    };
    _reservedProps = {};
    _lazyTweens = [];
    _lazyLookup = {};
    _plugins = {};
    _effects = {};
    _nextGCFrame = 30;
    _harnessPlugins = [];
    _callbackNames = "";
    _harness = function _harness2(targets) {
      var target = targets[0], harnessPlugin, i;
      _isObject(target) || _isFunction(target) || (targets = [targets]);
      if (!(harnessPlugin = (target._gsap || {}).harness)) {
        i = _harnessPlugins.length;
        while (i-- && !_harnessPlugins[i].targetTest(target)) {
        }
        harnessPlugin = _harnessPlugins[i];
      }
      i = targets.length;
      while (i--) {
        targets[i] && (targets[i]._gsap || (targets[i]._gsap = new GSCache(targets[i], harnessPlugin))) || targets.splice(i, 1);
      }
      return targets;
    };
    _getCache = function _getCache2(target) {
      return target._gsap || _harness(toArray2(target))[0]._gsap;
    };
    _getProperty = function _getProperty2(target, property, v) {
      return (v = target[property]) && _isFunction(v) ? target[property]() : _isUndefined(v) && target.getAttribute && target.getAttribute(property) || v;
    };
    _forEachName = function _forEachName2(names, func) {
      return (names = names.split(",")).forEach(func) || names;
    };
    _round = function _round2(value) {
      return Math.round(value * 1e5) / 1e5 || 0;
    };
    _roundPrecise = function _roundPrecise2(value) {
      return Math.round(value * 1e7) / 1e7 || 0;
    };
    _parseRelative = function _parseRelative2(start, value) {
      var operator = value.charAt(0), end = parseFloat(value.substr(2));
      start = parseFloat(start);
      return operator === "+" ? start + end : operator === "-" ? start - end : operator === "*" ? start * end : start / end;
    };
    _arrayContainsAny = function _arrayContainsAny2(toSearch, toFind) {
      var l = toFind.length, i = 0;
      for (; toSearch.indexOf(toFind[i]) < 0 && ++i < l; ) {
      }
      return i < l;
    };
    _lazyRender = function _lazyRender2() {
      var l = _lazyTweens.length, a = _lazyTweens.slice(0), i, tween;
      _lazyLookup = {};
      _lazyTweens.length = 0;
      for (i = 0; i < l; i++) {
        tween = a[i];
        tween && tween._lazy && (tween.render(tween._lazy[0], tween._lazy[1], true)._lazy = 0);
      }
    };
    _lazySafeRender = function _lazySafeRender2(animation, time, suppressEvents, force) {
      _lazyTweens.length && !_reverting && _lazyRender();
      animation.render(time, suppressEvents, force || _reverting && time < 0 && (animation._initted || animation._startAt));
      _lazyTweens.length && !_reverting && _lazyRender();
    };
    _numericIfPossible = function _numericIfPossible2(value) {
      var n = parseFloat(value);
      return (n || n === 0) && (value + "").match(_delimitedValueExp).length < 2 ? n : _isString(value) ? value.trim() : value;
    };
    _passThrough = function _passThrough2(p) {
      return p;
    };
    _setDefaults = function _setDefaults2(obj, defaults2) {
      for (var p in defaults2) {
        p in obj || (obj[p] = defaults2[p]);
      }
      return obj;
    };
    _setKeyframeDefaults = function _setKeyframeDefaults2(excludeDuration) {
      return function(obj, defaults2) {
        for (var p in defaults2) {
          p in obj || p === "duration" && excludeDuration || p === "ease" || (obj[p] = defaults2[p]);
        }
      };
    };
    _merge = function _merge2(base, toMerge) {
      for (var p in toMerge) {
        base[p] = toMerge[p];
      }
      return base;
    };
    _mergeDeep = function _mergeDeep2(base, toMerge) {
      for (var p in toMerge) {
        p !== "__proto__" && p !== "constructor" && p !== "prototype" && (base[p] = _isObject(toMerge[p]) ? _mergeDeep2(base[p] || (base[p] = {}), toMerge[p]) : toMerge[p]);
      }
      return base;
    };
    _copyExcluding = function _copyExcluding2(obj, excluding) {
      var copy = {}, p;
      for (p in obj) {
        p in excluding || (copy[p] = obj[p]);
      }
      return copy;
    };
    _inheritDefaults = function _inheritDefaults2(vars) {
      var parent = vars.parent || _globalTimeline, func = vars.keyframes ? _setKeyframeDefaults(_isArray(vars.keyframes)) : _setDefaults;
      if (_isNotFalse(vars.inherit)) {
        while (parent) {
          func(vars, parent.vars.defaults);
          parent = parent.parent || parent._dp;
        }
      }
      return vars;
    };
    _arraysMatch = function _arraysMatch2(a1, a2) {
      var i = a1.length, match = i === a2.length;
      while (match && i-- && a1[i] === a2[i]) {
      }
      return i < 0;
    };
    _addLinkedListItem = function _addLinkedListItem2(parent, child, firstProp, lastProp, sortBy) {
      if (firstProp === void 0) {
        firstProp = "_first";
      }
      if (lastProp === void 0) {
        lastProp = "_last";
      }
      var prev = parent[lastProp], t;
      if (sortBy) {
        t = child[sortBy];
        while (prev && prev[sortBy] > t) {
          prev = prev._prev;
        }
      }
      if (prev) {
        child._next = prev._next;
        prev._next = child;
      } else {
        child._next = parent[firstProp];
        parent[firstProp] = child;
      }
      if (child._next) {
        child._next._prev = child;
      } else {
        parent[lastProp] = child;
      }
      child._prev = prev;
      child.parent = child._dp = parent;
      return child;
    };
    _removeLinkedListItem = function _removeLinkedListItem2(parent, child, firstProp, lastProp) {
      if (firstProp === void 0) {
        firstProp = "_first";
      }
      if (lastProp === void 0) {
        lastProp = "_last";
      }
      var prev = child._prev, next = child._next;
      if (prev) {
        prev._next = next;
      } else if (parent[firstProp] === child) {
        parent[firstProp] = next;
      }
      if (next) {
        next._prev = prev;
      } else if (parent[lastProp] === child) {
        parent[lastProp] = prev;
      }
      child._next = child._prev = child.parent = null;
    };
    _removeFromParent = function _removeFromParent2(child, onlyIfParentHasAutoRemove) {
      child.parent && (!onlyIfParentHasAutoRemove || child.parent.autoRemoveChildren) && child.parent.remove && child.parent.remove(child);
      child._act = 0;
    };
    _uncache = function _uncache2(animation, child) {
      if (animation && (!child || child._end > animation._dur || child._start < 0)) {
        var a = animation;
        while (a) {
          a._dirty = 1;
          a = a.parent;
        }
      }
      return animation;
    };
    _recacheAncestors = function _recacheAncestors2(animation) {
      var parent = animation.parent;
      while (parent && parent.parent) {
        parent._dirty = 1;
        parent.totalDuration();
        parent = parent.parent;
      }
      return animation;
    };
    _rewindStartAt = function _rewindStartAt2(tween, totalTime, suppressEvents, force) {
      return tween._startAt && (_reverting ? tween._startAt.revert(_revertConfigNoKill) : tween.vars.immediateRender && !tween.vars.autoRevert || tween._startAt.render(totalTime, true, force));
    };
    _hasNoPausedAncestors = function _hasNoPausedAncestors2(animation) {
      return !animation || animation._ts && _hasNoPausedAncestors2(animation.parent);
    };
    _elapsedCycleDuration = function _elapsedCycleDuration2(animation) {
      return animation._repeat ? _animationCycle(animation._tTime, animation = animation.duration() + animation._rDelay) * animation : 0;
    };
    _animationCycle = function _animationCycle2(tTime, cycleDuration) {
      var whole = Math.floor(tTime /= cycleDuration);
      return tTime && whole === tTime ? whole - 1 : whole;
    };
    _parentToChildTotalTime = function _parentToChildTotalTime2(parentTime, child) {
      return (parentTime - child._start) * child._ts + (child._ts >= 0 ? 0 : child._dirty ? child.totalDuration() : child._tDur);
    };
    _setEnd = function _setEnd2(animation) {
      return animation._end = _roundPrecise(animation._start + (animation._tDur / Math.abs(animation._ts || animation._rts || _tinyNum) || 0));
    };
    _alignPlayhead = function _alignPlayhead2(animation, totalTime) {
      var parent = animation._dp;
      if (parent && parent.smoothChildTiming && animation._ts) {
        animation._start = _roundPrecise(parent._time - (animation._ts > 0 ? totalTime / animation._ts : ((animation._dirty ? animation.totalDuration() : animation._tDur) - totalTime) / -animation._ts));
        _setEnd(animation);
        parent._dirty || _uncache(parent, animation);
      }
      return animation;
    };
    _postAddChecks = function _postAddChecks2(timeline2, child) {
      var t;
      if (child._time || !child._dur && child._initted || child._start < timeline2._time && (child._dur || !child.add)) {
        t = _parentToChildTotalTime(timeline2.rawTime(), child);
        if (!child._dur || _clamp(0, child.totalDuration(), t) - child._tTime > _tinyNum) {
          child.render(t, true);
        }
      }
      if (_uncache(timeline2, child)._dp && timeline2._initted && timeline2._time >= timeline2._dur && timeline2._ts) {
        if (timeline2._dur < timeline2.duration()) {
          t = timeline2;
          while (t._dp) {
            t.rawTime() >= 0 && t.totalTime(t._tTime);
            t = t._dp;
          }
        }
        timeline2._zTime = -_tinyNum;
      }
    };
    _addToTimeline = function _addToTimeline2(timeline2, child, position, skipChecks) {
      child.parent && _removeFromParent(child);
      child._start = _roundPrecise((_isNumber(position) ? position : position || timeline2 !== _globalTimeline ? _parsePosition(timeline2, position, child) : timeline2._time) + child._delay);
      child._end = _roundPrecise(child._start + (child.totalDuration() / Math.abs(child.timeScale()) || 0));
      _addLinkedListItem(timeline2, child, "_first", "_last", timeline2._sort ? "_start" : 0);
      _isFromOrFromStart(child) || (timeline2._recent = child);
      skipChecks || _postAddChecks(timeline2, child);
      timeline2._ts < 0 && _alignPlayhead(timeline2, timeline2._tTime);
      return timeline2;
    };
    _scrollTrigger = function _scrollTrigger2(animation, trigger) {
      return (_globals.ScrollTrigger || _missingPlugin("scrollTrigger", trigger)) && _globals.ScrollTrigger.create(trigger, animation);
    };
    _attemptInitTween = function _attemptInitTween2(tween, time, force, suppressEvents, tTime) {
      _initTween(tween, time, tTime);
      if (!tween._initted) {
        return 1;
      }
      if (!force && tween._pt && !_reverting && (tween._dur && tween.vars.lazy !== false || !tween._dur && tween.vars.lazy) && _lastRenderedFrame !== _ticker.frame) {
        _lazyTweens.push(tween);
        tween._lazy = [tTime, suppressEvents];
        return 1;
      }
    };
    _parentPlayheadIsBeforeStart = function _parentPlayheadIsBeforeStart2(_ref) {
      var parent = _ref.parent;
      return parent && parent._ts && parent._initted && !parent._lock && (parent.rawTime() < 0 || _parentPlayheadIsBeforeStart2(parent));
    };
    _isFromOrFromStart = function _isFromOrFromStart2(_ref2) {
      var data = _ref2.data;
      return data === "isFromStart" || data === "isStart";
    };
    _renderZeroDurationTween = function _renderZeroDurationTween2(tween, totalTime, suppressEvents, force) {
      var prevRatio = tween.ratio, ratio = totalTime < 0 || !totalTime && (!tween._start && _parentPlayheadIsBeforeStart(tween) && !(!tween._initted && _isFromOrFromStart(tween)) || (tween._ts < 0 || tween._dp._ts < 0) && !_isFromOrFromStart(tween)) ? 0 : 1, repeatDelay = tween._rDelay, tTime = 0, pt, iteration, prevIteration;
      if (repeatDelay && tween._repeat) {
        tTime = _clamp(0, tween._tDur, totalTime);
        iteration = _animationCycle(tTime, repeatDelay);
        tween._yoyo && iteration & 1 && (ratio = 1 - ratio);
        if (iteration !== _animationCycle(tween._tTime, repeatDelay)) {
          prevRatio = 1 - ratio;
          tween.vars.repeatRefresh && tween._initted && tween.invalidate();
        }
      }
      if (ratio !== prevRatio || _reverting || force || tween._zTime === _tinyNum || !totalTime && tween._zTime) {
        if (!tween._initted && _attemptInitTween(tween, totalTime, force, suppressEvents, tTime)) {
          return;
        }
        prevIteration = tween._zTime;
        tween._zTime = totalTime || (suppressEvents ? _tinyNum : 0);
        suppressEvents || (suppressEvents = totalTime && !prevIteration);
        tween.ratio = ratio;
        tween._from && (ratio = 1 - ratio);
        tween._time = 0;
        tween._tTime = tTime;
        pt = tween._pt;
        while (pt) {
          pt.r(ratio, pt.d);
          pt = pt._next;
        }
        totalTime < 0 && _rewindStartAt(tween, totalTime, suppressEvents, true);
        tween._onUpdate && !suppressEvents && _callback(tween, "onUpdate");
        tTime && tween._repeat && !suppressEvents && tween.parent && _callback(tween, "onRepeat");
        if ((totalTime >= tween._tDur || totalTime < 0) && tween.ratio === ratio) {
          ratio && _removeFromParent(tween, 1);
          if (!suppressEvents && !_reverting) {
            _callback(tween, ratio ? "onComplete" : "onReverseComplete", true);
            tween._prom && tween._prom();
          }
        }
      } else if (!tween._zTime) {
        tween._zTime = totalTime;
      }
    };
    _findNextPauseTween = function _findNextPauseTween2(animation, prevTime, time) {
      var child;
      if (time > prevTime) {
        child = animation._first;
        while (child && child._start <= time) {
          if (child.data === "isPause" && child._start > prevTime) {
            return child;
          }
          child = child._next;
        }
      } else {
        child = animation._last;
        while (child && child._start >= time) {
          if (child.data === "isPause" && child._start < prevTime) {
            return child;
          }
          child = child._prev;
        }
      }
    };
    _setDuration = function _setDuration2(animation, duration, skipUncache, leavePlayhead) {
      var repeat = animation._repeat, dur = _roundPrecise(duration) || 0, totalProgress = animation._tTime / animation._tDur;
      totalProgress && !leavePlayhead && (animation._time *= dur / animation._dur);
      animation._dur = dur;
      animation._tDur = !repeat ? dur : repeat < 0 ? 1e10 : _roundPrecise(dur * (repeat + 1) + animation._rDelay * repeat);
      totalProgress > 0 && !leavePlayhead && _alignPlayhead(animation, animation._tTime = animation._tDur * totalProgress);
      animation.parent && _setEnd(animation);
      skipUncache || _uncache(animation.parent, animation);
      return animation;
    };
    _onUpdateTotalDuration = function _onUpdateTotalDuration2(animation) {
      return animation instanceof Timeline ? _uncache(animation) : _setDuration(animation, animation._dur);
    };
    _zeroPosition = {
      _start: 0,
      endTime: _emptyFunc,
      totalDuration: _emptyFunc
    };
    _parsePosition = function _parsePosition2(animation, position, percentAnimation) {
      var labels = animation.labels, recent = animation._recent || _zeroPosition, clippedDuration = animation.duration() >= _bigNum ? recent.endTime(false) : animation._dur, i, offset, isPercent;
      if (_isString(position) && (isNaN(position) || position in labels)) {
        offset = position.charAt(0);
        isPercent = position.substr(-1) === "%";
        i = position.indexOf("=");
        if (offset === "<" || offset === ">") {
          i >= 0 && (position = position.replace(/=/, ""));
          return (offset === "<" ? recent._start : recent.endTime(recent._repeat >= 0)) + (parseFloat(position.substr(1)) || 0) * (isPercent ? (i < 0 ? recent : percentAnimation).totalDuration() / 100 : 1);
        }
        if (i < 0) {
          position in labels || (labels[position] = clippedDuration);
          return labels[position];
        }
        offset = parseFloat(position.charAt(i - 1) + position.substr(i + 1));
        if (isPercent && percentAnimation) {
          offset = offset / 100 * (_isArray(percentAnimation) ? percentAnimation[0] : percentAnimation).totalDuration();
        }
        return i > 1 ? _parsePosition2(animation, position.substr(0, i - 1), percentAnimation) + offset : clippedDuration + offset;
      }
      return position == null ? clippedDuration : +position;
    };
    _createTweenType = function _createTweenType2(type, params, timeline2) {
      var isLegacy = _isNumber(params[1]), varsIndex = (isLegacy ? 2 : 1) + (type < 2 ? 0 : 1), vars = params[varsIndex], irVars, parent;
      isLegacy && (vars.duration = params[1]);
      vars.parent = timeline2;
      if (type) {
        irVars = vars;
        parent = timeline2;
        while (parent && !("immediateRender" in irVars)) {
          irVars = parent.vars.defaults || {};
          parent = _isNotFalse(parent.vars.inherit) && parent.parent;
        }
        vars.immediateRender = _isNotFalse(irVars.immediateRender);
        type < 2 ? vars.runBackwards = 1 : vars.startAt = params[varsIndex - 1];
      }
      return new Tween(params[0], vars, params[varsIndex + 1]);
    };
    _conditionalReturn = function _conditionalReturn2(value, func) {
      return value || value === 0 ? func(value) : func;
    };
    _clamp = function _clamp2(min, max, value) {
      return value < min ? min : value > max ? max : value;
    };
    getUnit = function getUnit2(value, v) {
      return !_isString(value) || !(v = _unitExp.exec(value)) ? "" : v[1];
    };
    clamp = function clamp2(min, max, value) {
      return _conditionalReturn(value, function(v) {
        return _clamp(min, max, v);
      });
    };
    _slice = [].slice;
    _isArrayLike = function _isArrayLike2(value, nonEmpty) {
      return value && _isObject(value) && "length" in value && (!nonEmpty && !value.length || value.length - 1 in value && _isObject(value[0])) && !value.nodeType && value !== _win;
    };
    _flatten = function _flatten2(ar, leaveStrings, accumulator) {
      if (accumulator === void 0) {
        accumulator = [];
      }
      return ar.forEach(function(value) {
        var _accumulator;
        return _isString(value) && !leaveStrings || _isArrayLike(value, 1) ? (_accumulator = accumulator).push.apply(_accumulator, toArray2(value)) : accumulator.push(value);
      }) || accumulator;
    };
    toArray2 = function toArray3(value, scope, leaveStrings) {
      return _context && !scope && _context.selector ? _context.selector(value) : _isString(value) && !leaveStrings && (_coreInitted || !_wake()) ? _slice.call((scope || _doc).querySelectorAll(value), 0) : _isArray(value) ? _flatten(value, leaveStrings) : _isArrayLike(value) ? _slice.call(value, 0) : value ? [value] : [];
    };
    selector = function selector2(value) {
      value = toArray2(value)[0] || _warn("Invalid scope") || {};
      return function(v) {
        var el = value.current || value.nativeElement || value;
        return toArray2(v, el.querySelectorAll ? el : el === value ? _warn("Invalid scope") || _doc.createElement("div") : value);
      };
    };
    shuffle = function shuffle2(a) {
      return a.sort(function() {
        return 0.5 - Math.random();
      });
    };
    distribute = function distribute2(v) {
      if (_isFunction(v)) {
        return v;
      }
      var vars = _isObject(v) ? v : {
        each: v
      }, ease = _parseEase(vars.ease), from = vars.from || 0, base = parseFloat(vars.base) || 0, cache2 = {}, isDecimal = from > 0 && from < 1, ratios = isNaN(from) || isDecimal, axis = vars.axis, ratioX = from, ratioY = from;
      if (_isString(from)) {
        ratioX = ratioY = {
          center: 0.5,
          edges: 0.5,
          end: 1
        }[from] || 0;
      } else if (!isDecimal && ratios) {
        ratioX = from[0];
        ratioY = from[1];
      }
      return function(i, target, a) {
        var l = (a || vars).length, distances = cache2[l], originX, originY, x, y, d, j, max, min, wrapAt;
        if (!distances) {
          wrapAt = vars.grid === "auto" ? 0 : (vars.grid || [1, _bigNum])[1];
          if (!wrapAt) {
            max = -_bigNum;
            while (max < (max = a[wrapAt++].getBoundingClientRect().left) && wrapAt < l) {
            }
            wrapAt < l && wrapAt--;
          }
          distances = cache2[l] = [];
          originX = ratios ? Math.min(wrapAt, l) * ratioX - 0.5 : from % wrapAt;
          originY = wrapAt === _bigNum ? 0 : ratios ? l * ratioY / wrapAt - 0.5 : from / wrapAt | 0;
          max = 0;
          min = _bigNum;
          for (j = 0; j < l; j++) {
            x = j % wrapAt - originX;
            y = originY - (j / wrapAt | 0);
            distances[j] = d = !axis ? _sqrt(x * x + y * y) : Math.abs(axis === "y" ? y : x);
            d > max && (max = d);
            d < min && (min = d);
          }
          from === "random" && shuffle(distances);
          distances.max = max - min;
          distances.min = min;
          distances.v = l = (parseFloat(vars.amount) || parseFloat(vars.each) * (wrapAt > l ? l - 1 : !axis ? Math.max(wrapAt, l / wrapAt) : axis === "y" ? l / wrapAt : wrapAt) || 0) * (from === "edges" ? -1 : 1);
          distances.b = l < 0 ? base - l : base;
          distances.u = getUnit(vars.amount || vars.each) || 0;
          ease = ease && l < 0 ? _invertEase(ease) : ease;
        }
        l = (distances[i] - distances.min) / distances.max || 0;
        return _roundPrecise(distances.b + (ease ? ease(l) : l) * distances.v) + distances.u;
      };
    };
    _roundModifier = function _roundModifier2(v) {
      var p = Math.pow(10, ((v + "").split(".")[1] || "").length);
      return function(raw) {
        var n = _roundPrecise(Math.round(parseFloat(raw) / v) * v * p);
        return (n - n % 1) / p + (_isNumber(raw) ? 0 : getUnit(raw));
      };
    };
    snap = function snap2(snapTo, value) {
      var isArray = _isArray(snapTo), radius, is2D;
      if (!isArray && _isObject(snapTo)) {
        radius = isArray = snapTo.radius || _bigNum;
        if (snapTo.values) {
          snapTo = toArray2(snapTo.values);
          if (is2D = !_isNumber(snapTo[0])) {
            radius *= radius;
          }
        } else {
          snapTo = _roundModifier(snapTo.increment);
        }
      }
      return _conditionalReturn(value, !isArray ? _roundModifier(snapTo) : _isFunction(snapTo) ? function(raw) {
        is2D = snapTo(raw);
        return Math.abs(is2D - raw) <= radius ? is2D : raw;
      } : function(raw) {
        var x = parseFloat(is2D ? raw.x : raw), y = parseFloat(is2D ? raw.y : 0), min = _bigNum, closest = 0, i = snapTo.length, dx, dy;
        while (i--) {
          if (is2D) {
            dx = snapTo[i].x - x;
            dy = snapTo[i].y - y;
            dx = dx * dx + dy * dy;
          } else {
            dx = Math.abs(snapTo[i] - x);
          }
          if (dx < min) {
            min = dx;
            closest = i;
          }
        }
        closest = !radius || min <= radius ? snapTo[closest] : raw;
        return is2D || closest === raw || _isNumber(raw) ? closest : closest + getUnit(raw);
      });
    };
    random = function random2(min, max, roundingIncrement, returnFunction) {
      return _conditionalReturn(_isArray(min) ? !max : roundingIncrement === true ? !!(roundingIncrement = 0) : !returnFunction, function() {
        return _isArray(min) ? min[~~(Math.random() * min.length)] : (roundingIncrement = roundingIncrement || 1e-5) && (returnFunction = roundingIncrement < 1 ? Math.pow(10, (roundingIncrement + "").length - 2) : 1) && Math.floor(Math.round((min - roundingIncrement / 2 + Math.random() * (max - min + roundingIncrement * 0.99)) / roundingIncrement) * roundingIncrement * returnFunction) / returnFunction;
      });
    };
    pipe = function pipe2() {
      for (var _len = arguments.length, functions = new Array(_len), _key = 0; _key < _len; _key++) {
        functions[_key] = arguments[_key];
      }
      return function(value) {
        return functions.reduce(function(v, f) {
          return f(v);
        }, value);
      };
    };
    unitize = function unitize2(func, unit) {
      return function(value) {
        return func(parseFloat(value)) + (unit || getUnit(value));
      };
    };
    normalize = function normalize2(min, max, value) {
      return mapRange(min, max, 0, 1, value);
    };
    _wrapArray = function _wrapArray2(a, wrapper, value) {
      return _conditionalReturn(value, function(index) {
        return a[~~wrapper(index)];
      });
    };
    wrap = function wrap2(min, max, value) {
      var range = max - min;
      return _isArray(min) ? _wrapArray(min, wrap2(0, min.length), max) : _conditionalReturn(value, function(value2) {
        return (range + (value2 - min) % range) % range + min;
      });
    };
    wrapYoyo = function wrapYoyo2(min, max, value) {
      var range = max - min, total = range * 2;
      return _isArray(min) ? _wrapArray(min, wrapYoyo2(0, min.length - 1), max) : _conditionalReturn(value, function(value2) {
        value2 = (total + (value2 - min) % total) % total || 0;
        return min + (value2 > range ? total - value2 : value2);
      });
    };
    _replaceRandom = function _replaceRandom2(value) {
      var prev = 0, s = "", i, nums, end, isArray;
      while (~(i = value.indexOf("random(", prev))) {
        end = value.indexOf(")", i);
        isArray = value.charAt(i + 7) === "[";
        nums = value.substr(i + 7, end - i - 7).match(isArray ? _delimitedValueExp : _strictNumExp);
        s += value.substr(prev, i - prev) + random(isArray ? nums : +nums[0], isArray ? 0 : +nums[1], +nums[2] || 1e-5);
        prev = end + 1;
      }
      return s + value.substr(prev, value.length - prev);
    };
    mapRange = function mapRange2(inMin, inMax, outMin, outMax, value) {
      var inRange = inMax - inMin, outRange = outMax - outMin;
      return _conditionalReturn(value, function(value2) {
        return outMin + ((value2 - inMin) / inRange * outRange || 0);
      });
    };
    interpolate = function interpolate2(start, end, progress, mutate) {
      var func = isNaN(start + end) ? 0 : function(p2) {
        return (1 - p2) * start + p2 * end;
      };
      if (!func) {
        var isString = _isString(start), master = {}, p, i, interpolators, l, il;
        progress === true && (mutate = 1) && (progress = null);
        if (isString) {
          start = {
            p: start
          };
          end = {
            p: end
          };
        } else if (_isArray(start) && !_isArray(end)) {
          interpolators = [];
          l = start.length;
          il = l - 2;
          for (i = 1; i < l; i++) {
            interpolators.push(interpolate2(start[i - 1], start[i]));
          }
          l--;
          func = function func2(p2) {
            p2 *= l;
            var i2 = Math.min(il, ~~p2);
            return interpolators[i2](p2 - i2);
          };
          progress = end;
        } else if (!mutate) {
          start = _merge(_isArray(start) ? [] : {}, start);
        }
        if (!interpolators) {
          for (p in end) {
            _addPropTween.call(master, start, p, "get", end[p]);
          }
          func = function func2(p2) {
            return _renderPropTweens(p2, master) || (isString ? start.p : start);
          };
        }
      }
      return _conditionalReturn(progress, func);
    };
    _getLabelInDirection = function _getLabelInDirection2(timeline2, fromTime, backward) {
      var labels = timeline2.labels, min = _bigNum, p, distance, label;
      for (p in labels) {
        distance = labels[p] - fromTime;
        if (distance < 0 === !!backward && distance && min > (distance = Math.abs(distance))) {
          label = p;
          min = distance;
        }
      }
      return label;
    };
    _callback = function _callback2(animation, type, executeLazyFirst) {
      var v = animation.vars, callback = v[type], prevContext = _context, context3 = animation._ctx, params, scope, result;
      if (!callback) {
        return;
      }
      params = v[type + "Params"];
      scope = v.callbackScope || animation;
      executeLazyFirst && _lazyTweens.length && _lazyRender();
      context3 && (_context = context3);
      result = params ? callback.apply(scope, params) : callback.call(scope);
      _context = prevContext;
      return result;
    };
    _interrupt = function _interrupt2(animation) {
      _removeFromParent(animation);
      animation.scrollTrigger && animation.scrollTrigger.kill(!!_reverting);
      animation.progress() < 1 && _callback(animation, "onInterrupt");
      return animation;
    };
    _registerPluginQueue = [];
    _createPlugin = function _createPlugin2(config3) {
      if (!config3) return;
      config3 = !config3.name && config3["default"] || config3;
      if (_windowExists() || config3.headless) {
        var name = config3.name, isFunc = _isFunction(config3), Plugin = name && !isFunc && config3.init ? function() {
          this._props = [];
        } : config3, instanceDefaults = {
          init: _emptyFunc,
          render: _renderPropTweens,
          add: _addPropTween,
          kill: _killPropTweensOf,
          modifier: _addPluginModifier,
          rawVars: 0
        }, statics = {
          targetTest: 0,
          get: 0,
          getSetter: _getSetter,
          aliases: {},
          register: 0
        };
        _wake();
        if (config3 !== Plugin) {
          if (_plugins[name]) {
            return;
          }
          _setDefaults(Plugin, _setDefaults(_copyExcluding(config3, instanceDefaults), statics));
          _merge(Plugin.prototype, _merge(instanceDefaults, _copyExcluding(config3, statics)));
          _plugins[Plugin.prop = name] = Plugin;
          if (config3.targetTest) {
            _harnessPlugins.push(Plugin);
            _reservedProps[name] = 1;
          }
          name = (name === "css" ? "CSS" : name.charAt(0).toUpperCase() + name.substr(1)) + "Plugin";
        }
        _addGlobal(name, Plugin);
        config3.register && config3.register(gsap, Plugin, PropTween);
      } else {
        _registerPluginQueue.push(config3);
      }
    };
    _255 = 255;
    _colorLookup = {
      aqua: [0, _255, _255],
      lime: [0, _255, 0],
      silver: [192, 192, 192],
      black: [0, 0, 0],
      maroon: [128, 0, 0],
      teal: [0, 128, 128],
      blue: [0, 0, _255],
      navy: [0, 0, 128],
      white: [_255, _255, _255],
      olive: [128, 128, 0],
      yellow: [_255, _255, 0],
      orange: [_255, 165, 0],
      gray: [128, 128, 128],
      purple: [128, 0, 128],
      green: [0, 128, 0],
      red: [_255, 0, 0],
      pink: [_255, 192, 203],
      cyan: [0, _255, _255],
      transparent: [_255, _255, _255, 0]
    };
    _hue = function _hue2(h, m1, m2) {
      h += h < 0 ? 1 : h > 1 ? -1 : 0;
      return (h * 6 < 1 ? m1 + (m2 - m1) * h * 6 : h < 0.5 ? m2 : h * 3 < 2 ? m1 + (m2 - m1) * (2 / 3 - h) * 6 : m1) * _255 + 0.5 | 0;
    };
    splitColor = function splitColor2(v, toHSL, forceAlpha) {
      var a = !v ? _colorLookup.black : _isNumber(v) ? [v >> 16, v >> 8 & _255, v & _255] : 0, r, g, b, h, s, l, max, min, d, wasHSL;
      if (!a) {
        if (v.substr(-1) === ",") {
          v = v.substr(0, v.length - 1);
        }
        if (_colorLookup[v]) {
          a = _colorLookup[v];
        } else if (v.charAt(0) === "#") {
          if (v.length < 6) {
            r = v.charAt(1);
            g = v.charAt(2);
            b = v.charAt(3);
            v = "#" + r + r + g + g + b + b + (v.length === 5 ? v.charAt(4) + v.charAt(4) : "");
          }
          if (v.length === 9) {
            a = parseInt(v.substr(1, 6), 16);
            return [a >> 16, a >> 8 & _255, a & _255, parseInt(v.substr(7), 16) / 255];
          }
          v = parseInt(v.substr(1), 16);
          a = [v >> 16, v >> 8 & _255, v & _255];
        } else if (v.substr(0, 3) === "hsl") {
          a = wasHSL = v.match(_strictNumExp);
          if (!toHSL) {
            h = +a[0] % 360 / 360;
            s = +a[1] / 100;
            l = +a[2] / 100;
            g = l <= 0.5 ? l * (s + 1) : l + s - l * s;
            r = l * 2 - g;
            a.length > 3 && (a[3] *= 1);
            a[0] = _hue(h + 1 / 3, r, g);
            a[1] = _hue(h, r, g);
            a[2] = _hue(h - 1 / 3, r, g);
          } else if (~v.indexOf("=")) {
            a = v.match(_numExp);
            forceAlpha && a.length < 4 && (a[3] = 1);
            return a;
          }
        } else {
          a = v.match(_strictNumExp) || _colorLookup.transparent;
        }
        a = a.map(Number);
      }
      if (toHSL && !wasHSL) {
        r = a[0] / _255;
        g = a[1] / _255;
        b = a[2] / _255;
        max = Math.max(r, g, b);
        min = Math.min(r, g, b);
        l = (max + min) / 2;
        if (max === min) {
          h = s = 0;
        } else {
          d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
          h *= 60;
        }
        a[0] = ~~(h + 0.5);
        a[1] = ~~(s * 100 + 0.5);
        a[2] = ~~(l * 100 + 0.5);
      }
      forceAlpha && a.length < 4 && (a[3] = 1);
      return a;
    };
    _colorOrderData = function _colorOrderData2(v) {
      var values = [], c = [], i = -1;
      v.split(_colorExp).forEach(function(v2) {
        var a = v2.match(_numWithUnitExp) || [];
        values.push.apply(values, a);
        c.push(i += a.length + 1);
      });
      values.c = c;
      return values;
    };
    _formatColors = function _formatColors2(s, toHSL, orderMatchData) {
      var result = "", colors = (s + result).match(_colorExp), type = toHSL ? "hsla(" : "rgba(", i = 0, c, shell, d, l;
      if (!colors) {
        return s;
      }
      colors = colors.map(function(color) {
        return (color = splitColor(color, toHSL, 1)) && type + (toHSL ? color[0] + "," + color[1] + "%," + color[2] + "%," + color[3] : color.join(",")) + ")";
      });
      if (orderMatchData) {
        d = _colorOrderData(s);
        c = orderMatchData.c;
        if (c.join(result) !== d.c.join(result)) {
          shell = s.replace(_colorExp, "1").split(_numWithUnitExp);
          l = shell.length - 1;
          for (; i < l; i++) {
            result += shell[i] + (~c.indexOf(i) ? colors.shift() || type + "0,0,0,0)" : (d.length ? d : colors.length ? colors : orderMatchData).shift());
          }
        }
      }
      if (!shell) {
        shell = s.split(_colorExp);
        l = shell.length - 1;
        for (; i < l; i++) {
          result += shell[i] + colors[i];
        }
      }
      return result + shell[l];
    };
    _colorExp = (function() {
      var s = "(?:\\b(?:(?:rgb|rgba|hsl|hsla)\\(.+?\\))|\\B#(?:[0-9a-f]{3,4}){1,2}\\b", p;
      for (p in _colorLookup) {
        s += "|" + p + "\\b";
      }
      return new RegExp(s + ")", "gi");
    })();
    _hslExp = /hsl[a]?\(/;
    _colorStringFilter = function _colorStringFilter2(a) {
      var combined = a.join(" "), toHSL;
      _colorExp.lastIndex = 0;
      if (_colorExp.test(combined)) {
        toHSL = _hslExp.test(combined);
        a[1] = _formatColors(a[1], toHSL);
        a[0] = _formatColors(a[0], toHSL, _colorOrderData(a[1]));
        return true;
      }
    };
    _ticker = (function() {
      var _getTime = Date.now, _lagThreshold = 500, _adjustedLag = 33, _startTime = _getTime(), _lastUpdate = _startTime, _gap = 1e3 / 240, _nextTime = _gap, _listeners2 = [], _id, _req, _raf, _self, _delta, _i, _tick = function _tick2(v) {
        var elapsed = _getTime() - _lastUpdate, manual = v === true, overlap, dispatch, time, frame;
        (elapsed > _lagThreshold || elapsed < 0) && (_startTime += elapsed - _adjustedLag);
        _lastUpdate += elapsed;
        time = _lastUpdate - _startTime;
        overlap = time - _nextTime;
        if (overlap > 0 || manual) {
          frame = ++_self.frame;
          _delta = time - _self.time * 1e3;
          _self.time = time = time / 1e3;
          _nextTime += overlap + (overlap >= _gap ? 4 : _gap - overlap);
          dispatch = 1;
        }
        manual || (_id = _req(_tick2));
        if (dispatch) {
          for (_i = 0; _i < _listeners2.length; _i++) {
            _listeners2[_i](time, _delta, frame, v);
          }
        }
      };
      _self = {
        time: 0,
        frame: 0,
        tick: function tick() {
          _tick(true);
        },
        deltaRatio: function deltaRatio(fps) {
          return _delta / (1e3 / (fps || 60));
        },
        wake: function wake() {
          if (_coreReady) {
            if (!_coreInitted && _windowExists()) {
              _win = _coreInitted = window;
              _doc = _win.document || {};
              _globals.gsap = gsap;
              (_win.gsapVersions || (_win.gsapVersions = [])).push(gsap.version);
              _install(_installScope || _win.GreenSockGlobals || !_win.gsap && _win || {});
              _registerPluginQueue.forEach(_createPlugin);
            }
            _raf = typeof requestAnimationFrame !== "undefined" && requestAnimationFrame;
            _id && _self.sleep();
            _req = _raf || function(f) {
              return setTimeout(f, _nextTime - _self.time * 1e3 + 1 | 0);
            };
            _tickerActive = 1;
            _tick(2);
          }
        },
        sleep: function sleep() {
          (_raf ? cancelAnimationFrame : clearTimeout)(_id);
          _tickerActive = 0;
          _req = _emptyFunc;
        },
        lagSmoothing: function lagSmoothing(threshold, adjustedLag) {
          _lagThreshold = threshold || Infinity;
          _adjustedLag = Math.min(adjustedLag || 33, _lagThreshold);
        },
        fps: function fps(_fps) {
          _gap = 1e3 / (_fps || 240);
          _nextTime = _self.time * 1e3 + _gap;
        },
        add: function add(callback, once, prioritize) {
          var func = once ? function(t, d, f, v) {
            callback(t, d, f, v);
            _self.remove(func);
          } : callback;
          _self.remove(callback);
          _listeners2[prioritize ? "unshift" : "push"](func);
          _wake();
          return func;
        },
        remove: function remove(callback, i) {
          ~(i = _listeners2.indexOf(callback)) && _listeners2.splice(i, 1) && _i >= i && _i--;
        },
        _listeners: _listeners2
      };
      return _self;
    })();
    _wake = function _wake2() {
      return !_tickerActive && _ticker.wake();
    };
    _easeMap = {};
    _customEaseExp = /^[\d.\-M][\d.\-,\s]/;
    _quotesExp = /["']/g;
    _parseObjectInString = function _parseObjectInString2(value) {
      var obj = {}, split = value.substr(1, value.length - 3).split(":"), key = split[0], i = 1, l = split.length, index, val, parsedVal;
      for (; i < l; i++) {
        val = split[i];
        index = i !== l - 1 ? val.lastIndexOf(",") : val.length;
        parsedVal = val.substr(0, index);
        obj[key] = isNaN(parsedVal) ? parsedVal.replace(_quotesExp, "").trim() : +parsedVal;
        key = val.substr(index + 1).trim();
      }
      return obj;
    };
    _valueInParentheses = function _valueInParentheses2(value) {
      var open = value.indexOf("(") + 1, close = value.indexOf(")"), nested = value.indexOf("(", open);
      return value.substring(open, ~nested && nested < close ? value.indexOf(")", close + 1) : close);
    };
    _configEaseFromString = function _configEaseFromString2(name) {
      var split = (name + "").split("("), ease = _easeMap[split[0]];
      return ease && split.length > 1 && ease.config ? ease.config.apply(null, ~name.indexOf("{") ? [_parseObjectInString(split[1])] : _valueInParentheses(name).split(",").map(_numericIfPossible)) : _easeMap._CE && _customEaseExp.test(name) ? _easeMap._CE("", name) : ease;
    };
    _invertEase = function _invertEase2(ease) {
      return function(p) {
        return 1 - ease(1 - p);
      };
    };
    _propagateYoyoEase = function _propagateYoyoEase2(timeline2, isYoyo) {
      var child = timeline2._first, ease;
      while (child) {
        if (child instanceof Timeline) {
          _propagateYoyoEase2(child, isYoyo);
        } else if (child.vars.yoyoEase && (!child._yoyo || !child._repeat) && child._yoyo !== isYoyo) {
          if (child.timeline) {
            _propagateYoyoEase2(child.timeline, isYoyo);
          } else {
            ease = child._ease;
            child._ease = child._yEase;
            child._yEase = ease;
            child._yoyo = isYoyo;
          }
        }
        child = child._next;
      }
    };
    _parseEase = function _parseEase2(ease, defaultEase) {
      return !ease ? defaultEase : (_isFunction(ease) ? ease : _easeMap[ease] || _configEaseFromString(ease)) || defaultEase;
    };
    _insertEase = function _insertEase2(names, easeIn, easeOut, easeInOut) {
      if (easeOut === void 0) {
        easeOut = function easeOut2(p) {
          return 1 - easeIn(1 - p);
        };
      }
      if (easeInOut === void 0) {
        easeInOut = function easeInOut2(p) {
          return p < 0.5 ? easeIn(p * 2) / 2 : 1 - easeIn((1 - p) * 2) / 2;
        };
      }
      var ease = {
        easeIn,
        easeOut,
        easeInOut
      }, lowercaseName;
      _forEachName(names, function(name) {
        _easeMap[name] = _globals[name] = ease;
        _easeMap[lowercaseName = name.toLowerCase()] = easeOut;
        for (var p in ease) {
          _easeMap[lowercaseName + (p === "easeIn" ? ".in" : p === "easeOut" ? ".out" : ".inOut")] = _easeMap[name + "." + p] = ease[p];
        }
      });
      return ease;
    };
    _easeInOutFromOut = function _easeInOutFromOut2(easeOut) {
      return function(p) {
        return p < 0.5 ? (1 - easeOut(1 - p * 2)) / 2 : 0.5 + easeOut((p - 0.5) * 2) / 2;
      };
    };
    _configElastic = function _configElastic2(type, amplitude, period) {
      var p1 = amplitude >= 1 ? amplitude : 1, p2 = (period || (type ? 0.3 : 0.45)) / (amplitude < 1 ? amplitude : 1), p3 = p2 / _2PI * (Math.asin(1 / p1) || 0), easeOut = function easeOut2(p) {
        return p === 1 ? 1 : p1 * Math.pow(2, -10 * p) * _sin((p - p3) * p2) + 1;
      }, ease = type === "out" ? easeOut : type === "in" ? function(p) {
        return 1 - easeOut(1 - p);
      } : _easeInOutFromOut(easeOut);
      p2 = _2PI / p2;
      ease.config = function(amplitude2, period2) {
        return _configElastic2(type, amplitude2, period2);
      };
      return ease;
    };
    _configBack = function _configBack2(type, overshoot) {
      if (overshoot === void 0) {
        overshoot = 1.70158;
      }
      var easeOut = function easeOut2(p) {
        return p ? --p * p * ((overshoot + 1) * p + overshoot) + 1 : 0;
      }, ease = type === "out" ? easeOut : type === "in" ? function(p) {
        return 1 - easeOut(1 - p);
      } : _easeInOutFromOut(easeOut);
      ease.config = function(overshoot2) {
        return _configBack2(type, overshoot2);
      };
      return ease;
    };
    _forEachName("Linear,Quad,Cubic,Quart,Quint,Strong", function(name, i) {
      var power = i < 5 ? i + 1 : i;
      _insertEase(name + ",Power" + (power - 1), i ? function(p) {
        return Math.pow(p, power);
      } : function(p) {
        return p;
      }, function(p) {
        return 1 - Math.pow(1 - p, power);
      }, function(p) {
        return p < 0.5 ? Math.pow(p * 2, power) / 2 : 1 - Math.pow((1 - p) * 2, power) / 2;
      });
    });
    _easeMap.Linear.easeNone = _easeMap.none = _easeMap.Linear.easeIn;
    _insertEase("Elastic", _configElastic("in"), _configElastic("out"), _configElastic());
    (function(n, c) {
      var n1 = 1 / c, n2 = 2 * n1, n3 = 2.5 * n1, easeOut = function easeOut2(p) {
        return p < n1 ? n * p * p : p < n2 ? n * Math.pow(p - 1.5 / c, 2) + 0.75 : p < n3 ? n * (p -= 2.25 / c) * p + 0.9375 : n * Math.pow(p - 2.625 / c, 2) + 0.984375;
      };
      _insertEase("Bounce", function(p) {
        return 1 - easeOut(1 - p);
      }, easeOut);
    })(7.5625, 2.75);
    _insertEase("Expo", function(p) {
      return p ? Math.pow(2, 10 * (p - 1)) : 0;
    });
    _insertEase("Circ", function(p) {
      return -(_sqrt(1 - p * p) - 1);
    });
    _insertEase("Sine", function(p) {
      return p === 1 ? 1 : -_cos(p * _HALF_PI) + 1;
    });
    _insertEase("Back", _configBack("in"), _configBack("out"), _configBack());
    _easeMap.SteppedEase = _easeMap.steps = _globals.SteppedEase = {
      config: function config(steps, immediateStart) {
        if (steps === void 0) {
          steps = 1;
        }
        var p1 = 1 / steps, p2 = steps + (immediateStart ? 0 : 1), p3 = immediateStart ? 1 : 0, max = 1 - _tinyNum;
        return function(p) {
          return ((p2 * _clamp(0, max, p) | 0) + p3) * p1;
        };
      }
    };
    _defaults.ease = _easeMap["quad.out"];
    _forEachName("onComplete,onUpdate,onStart,onRepeat,onReverseComplete,onInterrupt", function(name) {
      return _callbackNames += name + "," + name + "Params,";
    });
    GSCache = function GSCache2(target, harness) {
      this.id = _gsID++;
      target._gsap = this;
      this.target = target;
      this.harness = harness;
      this.get = harness ? harness.get : _getProperty;
      this.set = harness ? harness.getSetter : _getSetter;
    };
    Animation = /* @__PURE__ */ (function() {
      function Animation2(vars) {
        this.vars = vars;
        this._delay = +vars.delay || 0;
        if (this._repeat = vars.repeat === Infinity ? -2 : vars.repeat || 0) {
          this._rDelay = vars.repeatDelay || 0;
          this._yoyo = !!vars.yoyo || !!vars.yoyoEase;
        }
        this._ts = 1;
        _setDuration(this, +vars.duration, 1, 1);
        this.data = vars.data;
        if (_context) {
          this._ctx = _context;
          _context.data.push(this);
        }
        _tickerActive || _ticker.wake();
      }
      var _proto = Animation2.prototype;
      _proto.delay = function delay(value) {
        if (value || value === 0) {
          this.parent && this.parent.smoothChildTiming && this.startTime(this._start + value - this._delay);
          this._delay = value;
          return this;
        }
        return this._delay;
      };
      _proto.duration = function duration(value) {
        return arguments.length ? this.totalDuration(this._repeat > 0 ? value + (value + this._rDelay) * this._repeat : value) : this.totalDuration() && this._dur;
      };
      _proto.totalDuration = function totalDuration(value) {
        if (!arguments.length) {
          return this._tDur;
        }
        this._dirty = 0;
        return _setDuration(this, this._repeat < 0 ? value : (value - this._repeat * this._rDelay) / (this._repeat + 1));
      };
      _proto.totalTime = function totalTime(_totalTime, suppressEvents) {
        _wake();
        if (!arguments.length) {
          return this._tTime;
        }
        var parent = this._dp;
        if (parent && parent.smoothChildTiming && this._ts) {
          _alignPlayhead(this, _totalTime);
          !parent._dp || parent.parent || _postAddChecks(parent, this);
          while (parent && parent.parent) {
            if (parent.parent._time !== parent._start + (parent._ts >= 0 ? parent._tTime / parent._ts : (parent.totalDuration() - parent._tTime) / -parent._ts)) {
              parent.totalTime(parent._tTime, true);
            }
            parent = parent.parent;
          }
          if (!this.parent && this._dp.autoRemoveChildren && (this._ts > 0 && _totalTime < this._tDur || this._ts < 0 && _totalTime > 0 || !this._tDur && !_totalTime)) {
            _addToTimeline(this._dp, this, this._start - this._delay);
          }
        }
        if (this._tTime !== _totalTime || !this._dur && !suppressEvents || this._initted && Math.abs(this._zTime) === _tinyNum || !_totalTime && !this._initted && (this.add || this._ptLookup)) {
          this._ts || (this._pTime = _totalTime);
          _lazySafeRender(this, _totalTime, suppressEvents);
        }
        return this;
      };
      _proto.time = function time(value, suppressEvents) {
        return arguments.length ? this.totalTime(Math.min(this.totalDuration(), value + _elapsedCycleDuration(this)) % (this._dur + this._rDelay) || (value ? this._dur : 0), suppressEvents) : this._time;
      };
      _proto.totalProgress = function totalProgress(value, suppressEvents) {
        return arguments.length ? this.totalTime(this.totalDuration() * value, suppressEvents) : this.totalDuration() ? Math.min(1, this._tTime / this._tDur) : this.rawTime() > 0 ? 1 : 0;
      };
      _proto.progress = function progress(value, suppressEvents) {
        return arguments.length ? this.totalTime(this.duration() * (this._yoyo && !(this.iteration() & 1) ? 1 - value : value) + _elapsedCycleDuration(this), suppressEvents) : this.duration() ? Math.min(1, this._time / this._dur) : this.rawTime() > 0 ? 1 : 0;
      };
      _proto.iteration = function iteration(value, suppressEvents) {
        var cycleDuration = this.duration() + this._rDelay;
        return arguments.length ? this.totalTime(this._time + (value - 1) * cycleDuration, suppressEvents) : this._repeat ? _animationCycle(this._tTime, cycleDuration) + 1 : 1;
      };
      _proto.timeScale = function timeScale(value, suppressEvents) {
        if (!arguments.length) {
          return this._rts === -_tinyNum ? 0 : this._rts;
        }
        if (this._rts === value) {
          return this;
        }
        var tTime = this.parent && this._ts ? _parentToChildTotalTime(this.parent._time, this) : this._tTime;
        this._rts = +value || 0;
        this._ts = this._ps || value === -_tinyNum ? 0 : this._rts;
        this.totalTime(_clamp(-Math.abs(this._delay), this._tDur, tTime), suppressEvents !== false);
        _setEnd(this);
        return _recacheAncestors(this);
      };
      _proto.paused = function paused(value) {
        if (!arguments.length) {
          return this._ps;
        }
        if (this._ps !== value) {
          this._ps = value;
          if (value) {
            this._pTime = this._tTime || Math.max(-this._delay, this.rawTime());
            this._ts = this._act = 0;
          } else {
            _wake();
            this._ts = this._rts;
            this.totalTime(this.parent && !this.parent.smoothChildTiming ? this.rawTime() : this._tTime || this._pTime, this.progress() === 1 && Math.abs(this._zTime) !== _tinyNum && (this._tTime -= _tinyNum));
          }
        }
        return this;
      };
      _proto.startTime = function startTime(value) {
        if (arguments.length) {
          this._start = value;
          var parent = this.parent || this._dp;
          parent && (parent._sort || !this.parent) && _addToTimeline(parent, this, value - this._delay);
          return this;
        }
        return this._start;
      };
      _proto.endTime = function endTime(includeRepeats) {
        return this._start + (_isNotFalse(includeRepeats) ? this.totalDuration() : this.duration()) / Math.abs(this._ts || 1);
      };
      _proto.rawTime = function rawTime(wrapRepeats) {
        var parent = this.parent || this._dp;
        return !parent ? this._tTime : wrapRepeats && (!this._ts || this._repeat && this._time && this.totalProgress() < 1) ? this._tTime % (this._dur + this._rDelay) : !this._ts ? this._tTime : _parentToChildTotalTime(parent.rawTime(wrapRepeats), this);
      };
      _proto.revert = function revert(config3) {
        if (config3 === void 0) {
          config3 = _revertConfig;
        }
        var prevIsReverting = _reverting;
        _reverting = config3;
        if (this._initted || this._startAt) {
          this.timeline && this.timeline.revert(config3);
          this.totalTime(-0.01, config3.suppressEvents);
        }
        this.data !== "nested" && config3.kill !== false && this.kill();
        _reverting = prevIsReverting;
        return this;
      };
      _proto.globalTime = function globalTime(rawTime) {
        var animation = this, time = arguments.length ? rawTime : animation.rawTime();
        while (animation) {
          time = animation._start + time / (Math.abs(animation._ts) || 1);
          animation = animation._dp;
        }
        return !this.parent && this._sat ? this._sat.globalTime(rawTime) : time;
      };
      _proto.repeat = function repeat(value) {
        if (arguments.length) {
          this._repeat = value === Infinity ? -2 : value;
          return _onUpdateTotalDuration(this);
        }
        return this._repeat === -2 ? Infinity : this._repeat;
      };
      _proto.repeatDelay = function repeatDelay(value) {
        if (arguments.length) {
          var time = this._time;
          this._rDelay = value;
          _onUpdateTotalDuration(this);
          return time ? this.time(time) : this;
        }
        return this._rDelay;
      };
      _proto.yoyo = function yoyo(value) {
        if (arguments.length) {
          this._yoyo = value;
          return this;
        }
        return this._yoyo;
      };
      _proto.seek = function seek(position, suppressEvents) {
        return this.totalTime(_parsePosition(this, position), _isNotFalse(suppressEvents));
      };
      _proto.restart = function restart(includeDelay, suppressEvents) {
        return this.play().totalTime(includeDelay ? -this._delay : 0, _isNotFalse(suppressEvents));
      };
      _proto.play = function play(from, suppressEvents) {
        from != null && this.seek(from, suppressEvents);
        return this.reversed(false).paused(false);
      };
      _proto.reverse = function reverse(from, suppressEvents) {
        from != null && this.seek(from || this.totalDuration(), suppressEvents);
        return this.reversed(true).paused(false);
      };
      _proto.pause = function pause(atTime, suppressEvents) {
        atTime != null && this.seek(atTime, suppressEvents);
        return this.paused(true);
      };
      _proto.resume = function resume() {
        return this.paused(false);
      };
      _proto.reversed = function reversed(value) {
        if (arguments.length) {
          !!value !== this.reversed() && this.timeScale(-this._rts || (value ? -_tinyNum : 0));
          return this;
        }
        return this._rts < 0;
      };
      _proto.invalidate = function invalidate() {
        this._initted = this._act = 0;
        this._zTime = -_tinyNum;
        return this;
      };
      _proto.isActive = function isActive() {
        var parent = this.parent || this._dp, start = this._start, rawTime;
        return !!(!parent || this._ts && this._initted && parent.isActive() && (rawTime = parent.rawTime(true)) >= start && rawTime < this.endTime(true) - _tinyNum);
      };
      _proto.eventCallback = function eventCallback(type, callback, params) {
        var vars = this.vars;
        if (arguments.length > 1) {
          if (!callback) {
            delete vars[type];
          } else {
            vars[type] = callback;
            params && (vars[type + "Params"] = params);
            type === "onUpdate" && (this._onUpdate = callback);
          }
          return this;
        }
        return vars[type];
      };
      _proto.then = function then(onFulfilled) {
        var self2 = this;
        return new Promise(function(resolve) {
          var f = _isFunction(onFulfilled) ? onFulfilled : _passThrough, _resolve = function _resolve2() {
            var _then = self2.then;
            self2.then = null;
            _isFunction(f) && (f = f(self2)) && (f.then || f === self2) && (self2.then = _then);
            resolve(f);
            self2.then = _then;
          };
          if (self2._initted && self2.totalProgress() === 1 && self2._ts >= 0 || !self2._tTime && self2._ts < 0) {
            _resolve();
          } else {
            self2._prom = _resolve;
          }
        });
      };
      _proto.kill = function kill() {
        _interrupt(this);
      };
      return Animation2;
    })();
    _setDefaults(Animation.prototype, {
      _time: 0,
      _start: 0,
      _end: 0,
      _tTime: 0,
      _tDur: 0,
      _dirty: 0,
      _repeat: 0,
      _yoyo: false,
      parent: null,
      _initted: false,
      _rDelay: 0,
      _ts: 1,
      _dp: 0,
      ratio: 0,
      _zTime: -_tinyNum,
      _prom: 0,
      _ps: false,
      _rts: 1
    });
    Timeline = /* @__PURE__ */ (function(_Animation) {
      _inheritsLoose(Timeline2, _Animation);
      function Timeline2(vars, position) {
        var _this;
        if (vars === void 0) {
          vars = {};
        }
        _this = _Animation.call(this, vars) || this;
        _this.labels = {};
        _this.smoothChildTiming = !!vars.smoothChildTiming;
        _this.autoRemoveChildren = !!vars.autoRemoveChildren;
        _this._sort = _isNotFalse(vars.sortChildren);
        _globalTimeline && _addToTimeline(vars.parent || _globalTimeline, _assertThisInitialized(_this), position);
        vars.reversed && _this.reverse();
        vars.paused && _this.paused(true);
        vars.scrollTrigger && _scrollTrigger(_assertThisInitialized(_this), vars.scrollTrigger);
        return _this;
      }
      var _proto2 = Timeline2.prototype;
      _proto2.to = function to(targets, vars, position) {
        _createTweenType(0, arguments, this);
        return this;
      };
      _proto2.from = function from(targets, vars, position) {
        _createTweenType(1, arguments, this);
        return this;
      };
      _proto2.fromTo = function fromTo(targets, fromVars, toVars, position) {
        _createTweenType(2, arguments, this);
        return this;
      };
      _proto2.set = function set(targets, vars, position) {
        vars.duration = 0;
        vars.parent = this;
        _inheritDefaults(vars).repeatDelay || (vars.repeat = 0);
        vars.immediateRender = !!vars.immediateRender;
        new Tween(targets, vars, _parsePosition(this, position), 1);
        return this;
      };
      _proto2.call = function call(callback, params, position) {
        return _addToTimeline(this, Tween.delayedCall(0, callback, params), position);
      };
      _proto2.staggerTo = function staggerTo(targets, duration, vars, stagger, position, onCompleteAll, onCompleteAllParams) {
        vars.duration = duration;
        vars.stagger = vars.stagger || stagger;
        vars.onComplete = onCompleteAll;
        vars.onCompleteParams = onCompleteAllParams;
        vars.parent = this;
        new Tween(targets, vars, _parsePosition(this, position));
        return this;
      };
      _proto2.staggerFrom = function staggerFrom(targets, duration, vars, stagger, position, onCompleteAll, onCompleteAllParams) {
        vars.runBackwards = 1;
        _inheritDefaults(vars).immediateRender = _isNotFalse(vars.immediateRender);
        return this.staggerTo(targets, duration, vars, stagger, position, onCompleteAll, onCompleteAllParams);
      };
      _proto2.staggerFromTo = function staggerFromTo(targets, duration, fromVars, toVars, stagger, position, onCompleteAll, onCompleteAllParams) {
        toVars.startAt = fromVars;
        _inheritDefaults(toVars).immediateRender = _isNotFalse(toVars.immediateRender);
        return this.staggerTo(targets, duration, toVars, stagger, position, onCompleteAll, onCompleteAllParams);
      };
      _proto2.render = function render4(totalTime, suppressEvents, force) {
        var prevTime = this._time, tDur = this._dirty ? this.totalDuration() : this._tDur, dur = this._dur, tTime = totalTime <= 0 ? 0 : _roundPrecise(totalTime), crossingStart = this._zTime < 0 !== totalTime < 0 && (this._initted || !dur), time, child, next, iteration, cycleDuration, prevPaused, pauseTween, timeScale, prevStart, prevIteration, yoyo, isYoyo;
        this !== _globalTimeline && tTime > tDur && totalTime >= 0 && (tTime = tDur);
        if (tTime !== this._tTime || force || crossingStart) {
          if (prevTime !== this._time && dur) {
            tTime += this._time - prevTime;
            totalTime += this._time - prevTime;
          }
          time = tTime;
          prevStart = this._start;
          timeScale = this._ts;
          prevPaused = !timeScale;
          if (crossingStart) {
            dur || (prevTime = this._zTime);
            (totalTime || !suppressEvents) && (this._zTime = totalTime);
          }
          if (this._repeat) {
            yoyo = this._yoyo;
            cycleDuration = dur + this._rDelay;
            if (this._repeat < -1 && totalTime < 0) {
              return this.totalTime(cycleDuration * 100 + totalTime, suppressEvents, force);
            }
            time = _roundPrecise(tTime % cycleDuration);
            if (tTime === tDur) {
              iteration = this._repeat;
              time = dur;
            } else {
              iteration = ~~(tTime / cycleDuration);
              if (iteration && iteration === tTime / cycleDuration) {
                time = dur;
                iteration--;
              }
              time > dur && (time = dur);
            }
            prevIteration = _animationCycle(this._tTime, cycleDuration);
            !prevTime && this._tTime && prevIteration !== iteration && this._tTime - prevIteration * cycleDuration - this._dur <= 0 && (prevIteration = iteration);
            if (yoyo && iteration & 1) {
              time = dur - time;
              isYoyo = 1;
            }
            if (iteration !== prevIteration && !this._lock) {
              var rewinding = yoyo && prevIteration & 1, doesWrap = rewinding === (yoyo && iteration & 1);
              iteration < prevIteration && (rewinding = !rewinding);
              prevTime = rewinding ? 0 : tTime % dur ? dur : tTime;
              this._lock = 1;
              this.render(prevTime || (isYoyo ? 0 : _roundPrecise(iteration * cycleDuration)), suppressEvents, !dur)._lock = 0;
              this._tTime = tTime;
              !suppressEvents && this.parent && _callback(this, "onRepeat");
              this.vars.repeatRefresh && !isYoyo && (this.invalidate()._lock = 1);
              if (prevTime && prevTime !== this._time || prevPaused !== !this._ts || this.vars.onRepeat && !this.parent && !this._act) {
                return this;
              }
              dur = this._dur;
              tDur = this._tDur;
              if (doesWrap) {
                this._lock = 2;
                prevTime = rewinding ? dur : -1e-4;
                this.render(prevTime, true);
                this.vars.repeatRefresh && !isYoyo && this.invalidate();
              }
              this._lock = 0;
              if (!this._ts && !prevPaused) {
                return this;
              }
              _propagateYoyoEase(this, isYoyo);
            }
          }
          if (this._hasPause && !this._forcing && this._lock < 2) {
            pauseTween = _findNextPauseTween(this, _roundPrecise(prevTime), _roundPrecise(time));
            if (pauseTween) {
              tTime -= time - (time = pauseTween._start);
            }
          }
          this._tTime = tTime;
          this._time = time;
          this._act = !timeScale;
          if (!this._initted) {
            this._onUpdate = this.vars.onUpdate;
            this._initted = 1;
            this._zTime = totalTime;
            prevTime = 0;
          }
          if (!prevTime && time && !suppressEvents && !iteration) {
            _callback(this, "onStart");
            if (this._tTime !== tTime) {
              return this;
            }
          }
          if (time >= prevTime && totalTime >= 0) {
            child = this._first;
            while (child) {
              next = child._next;
              if ((child._act || time >= child._start) && child._ts && pauseTween !== child) {
                if (child.parent !== this) {
                  return this.render(totalTime, suppressEvents, force);
                }
                child.render(child._ts > 0 ? (time - child._start) * child._ts : (child._dirty ? child.totalDuration() : child._tDur) + (time - child._start) * child._ts, suppressEvents, force);
                if (time !== this._time || !this._ts && !prevPaused) {
                  pauseTween = 0;
                  next && (tTime += this._zTime = -_tinyNum);
                  break;
                }
              }
              child = next;
            }
          } else {
            child = this._last;
            var adjustedTime = totalTime < 0 ? totalTime : time;
            while (child) {
              next = child._prev;
              if ((child._act || adjustedTime <= child._end) && child._ts && pauseTween !== child) {
                if (child.parent !== this) {
                  return this.render(totalTime, suppressEvents, force);
                }
                child.render(child._ts > 0 ? (adjustedTime - child._start) * child._ts : (child._dirty ? child.totalDuration() : child._tDur) + (adjustedTime - child._start) * child._ts, suppressEvents, force || _reverting && (child._initted || child._startAt));
                if (time !== this._time || !this._ts && !prevPaused) {
                  pauseTween = 0;
                  next && (tTime += this._zTime = adjustedTime ? -_tinyNum : _tinyNum);
                  break;
                }
              }
              child = next;
            }
          }
          if (pauseTween && !suppressEvents) {
            this.pause();
            pauseTween.render(time >= prevTime ? 0 : -_tinyNum)._zTime = time >= prevTime ? 1 : -1;
            if (this._ts) {
              this._start = prevStart;
              _setEnd(this);
              return this.render(totalTime, suppressEvents, force);
            }
          }
          this._onUpdate && !suppressEvents && _callback(this, "onUpdate", true);
          if (tTime === tDur && this._tTime >= this.totalDuration() || !tTime && prevTime) {
            if (prevStart === this._start || Math.abs(timeScale) !== Math.abs(this._ts)) {
              if (!this._lock) {
                (totalTime || !dur) && (tTime === tDur && this._ts > 0 || !tTime && this._ts < 0) && _removeFromParent(this, 1);
                if (!suppressEvents && !(totalTime < 0 && !prevTime) && (tTime || prevTime || !tDur)) {
                  _callback(this, tTime === tDur && totalTime >= 0 ? "onComplete" : "onReverseComplete", true);
                  this._prom && !(tTime < tDur && this.timeScale() > 0) && this._prom();
                }
              }
            }
          }
        }
        return this;
      };
      _proto2.add = function add(child, position) {
        var _this2 = this;
        _isNumber(position) || (position = _parsePosition(this, position, child));
        if (!(child instanceof Animation)) {
          if (_isArray(child)) {
            child.forEach(function(obj) {
              return _this2.add(obj, position);
            });
            return this;
          }
          if (_isString(child)) {
            return this.addLabel(child, position);
          }
          if (_isFunction(child)) {
            child = Tween.delayedCall(0, child);
          } else {
            return this;
          }
        }
        return this !== child ? _addToTimeline(this, child, position) : this;
      };
      _proto2.getChildren = function getChildren(nested, tweens, timelines, ignoreBeforeTime) {
        if (nested === void 0) {
          nested = true;
        }
        if (tweens === void 0) {
          tweens = true;
        }
        if (timelines === void 0) {
          timelines = true;
        }
        if (ignoreBeforeTime === void 0) {
          ignoreBeforeTime = -_bigNum;
        }
        var a = [], child = this._first;
        while (child) {
          if (child._start >= ignoreBeforeTime) {
            if (child instanceof Tween) {
              tweens && a.push(child);
            } else {
              timelines && a.push(child);
              nested && a.push.apply(a, child.getChildren(true, tweens, timelines));
            }
          }
          child = child._next;
        }
        return a;
      };
      _proto2.getById = function getById2(id) {
        var animations = this.getChildren(1, 1, 1), i = animations.length;
        while (i--) {
          if (animations[i].vars.id === id) {
            return animations[i];
          }
        }
      };
      _proto2.remove = function remove(child) {
        if (_isString(child)) {
          return this.removeLabel(child);
        }
        if (_isFunction(child)) {
          return this.killTweensOf(child);
        }
        _removeLinkedListItem(this, child);
        if (child === this._recent) {
          this._recent = this._last;
        }
        return _uncache(this);
      };
      _proto2.totalTime = function totalTime(_totalTime2, suppressEvents) {
        if (!arguments.length) {
          return this._tTime;
        }
        this._forcing = 1;
        if (!this._dp && this._ts) {
          this._start = _roundPrecise(_ticker.time - (this._ts > 0 ? _totalTime2 / this._ts : (this.totalDuration() - _totalTime2) / -this._ts));
        }
        _Animation.prototype.totalTime.call(this, _totalTime2, suppressEvents);
        this._forcing = 0;
        return this;
      };
      _proto2.addLabel = function addLabel(label, position) {
        this.labels[label] = _parsePosition(this, position);
        return this;
      };
      _proto2.removeLabel = function removeLabel(label) {
        delete this.labels[label];
        return this;
      };
      _proto2.addPause = function addPause(position, callback, params) {
        var t = Tween.delayedCall(0, callback || _emptyFunc, params);
        t.data = "isPause";
        this._hasPause = 1;
        return _addToTimeline(this, t, _parsePosition(this, position));
      };
      _proto2.removePause = function removePause(position) {
        var child = this._first;
        position = _parsePosition(this, position);
        while (child) {
          if (child._start === position && child.data === "isPause") {
            _removeFromParent(child);
          }
          child = child._next;
        }
      };
      _proto2.killTweensOf = function killTweensOf(targets, props, onlyActive) {
        var tweens = this.getTweensOf(targets, onlyActive), i = tweens.length;
        while (i--) {
          _overwritingTween !== tweens[i] && tweens[i].kill(targets, props);
        }
        return this;
      };
      _proto2.getTweensOf = function getTweensOf2(targets, onlyActive) {
        var a = [], parsedTargets = toArray2(targets), child = this._first, isGlobalTime = _isNumber(onlyActive), children;
        while (child) {
          if (child instanceof Tween) {
            if (_arrayContainsAny(child._targets, parsedTargets) && (isGlobalTime ? (!_overwritingTween || child._initted && child._ts) && child.globalTime(0) <= onlyActive && child.globalTime(child.totalDuration()) > onlyActive : !onlyActive || child.isActive())) {
              a.push(child);
            }
          } else if ((children = child.getTweensOf(parsedTargets, onlyActive)).length) {
            a.push.apply(a, children);
          }
          child = child._next;
        }
        return a;
      };
      _proto2.tweenTo = function tweenTo(position, vars) {
        vars = vars || {};
        var tl = this, endTime = _parsePosition(tl, position), _vars = vars, startAt = _vars.startAt, _onStart = _vars.onStart, onStartParams = _vars.onStartParams, immediateRender = _vars.immediateRender, initted, tween = Tween.to(tl, _setDefaults({
          ease: vars.ease || "none",
          lazy: false,
          immediateRender: false,
          time: endTime,
          overwrite: "auto",
          duration: vars.duration || Math.abs((endTime - (startAt && "time" in startAt ? startAt.time : tl._time)) / tl.timeScale()) || _tinyNum,
          onStart: function onStart() {
            tl.pause();
            if (!initted) {
              var duration = vars.duration || Math.abs((endTime - (startAt && "time" in startAt ? startAt.time : tl._time)) / tl.timeScale());
              tween._dur !== duration && _setDuration(tween, duration, 0, 1).render(tween._time, true, true);
              initted = 1;
            }
            _onStart && _onStart.apply(tween, onStartParams || []);
          }
        }, vars));
        return immediateRender ? tween.render(0) : tween;
      };
      _proto2.tweenFromTo = function tweenFromTo(fromPosition, toPosition, vars) {
        return this.tweenTo(toPosition, _setDefaults({
          startAt: {
            time: _parsePosition(this, fromPosition)
          }
        }, vars));
      };
      _proto2.recent = function recent() {
        return this._recent;
      };
      _proto2.nextLabel = function nextLabel(afterTime) {
        if (afterTime === void 0) {
          afterTime = this._time;
        }
        return _getLabelInDirection(this, _parsePosition(this, afterTime));
      };
      _proto2.previousLabel = function previousLabel(beforeTime) {
        if (beforeTime === void 0) {
          beforeTime = this._time;
        }
        return _getLabelInDirection(this, _parsePosition(this, beforeTime), 1);
      };
      _proto2.currentLabel = function currentLabel(value) {
        return arguments.length ? this.seek(value, true) : this.previousLabel(this._time + _tinyNum);
      };
      _proto2.shiftChildren = function shiftChildren(amount, adjustLabels, ignoreBeforeTime) {
        if (ignoreBeforeTime === void 0) {
          ignoreBeforeTime = 0;
        }
        var child = this._first, labels = this.labels, p;
        while (child) {
          if (child._start >= ignoreBeforeTime) {
            child._start += amount;
            child._end += amount;
          }
          child = child._next;
        }
        if (adjustLabels) {
          for (p in labels) {
            if (labels[p] >= ignoreBeforeTime) {
              labels[p] += amount;
            }
          }
        }
        return _uncache(this);
      };
      _proto2.invalidate = function invalidate(soft) {
        var child = this._first;
        this._lock = 0;
        while (child) {
          child.invalidate(soft);
          child = child._next;
        }
        return _Animation.prototype.invalidate.call(this, soft);
      };
      _proto2.clear = function clear(includeLabels) {
        if (includeLabels === void 0) {
          includeLabels = true;
        }
        var child = this._first, next;
        while (child) {
          next = child._next;
          this.remove(child);
          child = next;
        }
        this._dp && (this._time = this._tTime = this._pTime = 0);
        includeLabels && (this.labels = {});
        return _uncache(this);
      };
      _proto2.totalDuration = function totalDuration(value) {
        var max = 0, self2 = this, child = self2._last, prevStart = _bigNum, prev, start, parent;
        if (arguments.length) {
          return self2.timeScale((self2._repeat < 0 ? self2.duration() : self2.totalDuration()) / (self2.reversed() ? -value : value));
        }
        if (self2._dirty) {
          parent = self2.parent;
          while (child) {
            prev = child._prev;
            child._dirty && child.totalDuration();
            start = child._start;
            if (start > prevStart && self2._sort && child._ts && !self2._lock) {
              self2._lock = 1;
              _addToTimeline(self2, child, start - child._delay, 1)._lock = 0;
            } else {
              prevStart = start;
            }
            if (start < 0 && child._ts) {
              max -= start;
              if (!parent && !self2._dp || parent && parent.smoothChildTiming) {
                self2._start += start / self2._ts;
                self2._time -= start;
                self2._tTime -= start;
              }
              self2.shiftChildren(-start, false, -Infinity);
              prevStart = 0;
            }
            child._end > max && child._ts && (max = child._end);
            child = prev;
          }
          _setDuration(self2, self2 === _globalTimeline && self2._time > max ? self2._time : max, 1, 1);
          self2._dirty = 0;
        }
        return self2._tDur;
      };
      Timeline2.updateRoot = function updateRoot(time) {
        if (_globalTimeline._ts) {
          _lazySafeRender(_globalTimeline, _parentToChildTotalTime(time, _globalTimeline));
          _lastRenderedFrame = _ticker.frame;
        }
        if (_ticker.frame >= _nextGCFrame) {
          _nextGCFrame += _config.autoSleep || 120;
          var child = _globalTimeline._first;
          if (!child || !child._ts) {
            if (_config.autoSleep && _ticker._listeners.length < 2) {
              while (child && !child._ts) {
                child = child._next;
              }
              child || _ticker.sleep();
            }
          }
        }
      };
      return Timeline2;
    })(Animation);
    _setDefaults(Timeline.prototype, {
      _lock: 0,
      _hasPause: 0,
      _forcing: 0
    });
    _addComplexStringPropTween = function _addComplexStringPropTween2(target, prop, start, end, setter, stringFilter, funcParam) {
      var pt = new PropTween(this._pt, target, prop, 0, 1, _renderComplexString, null, setter), index = 0, matchIndex = 0, result, startNums, color, endNum, chunk, startNum, hasRandom, a;
      pt.b = start;
      pt.e = end;
      start += "";
      end += "";
      if (hasRandom = ~end.indexOf("random(")) {
        end = _replaceRandom(end);
      }
      if (stringFilter) {
        a = [start, end];
        stringFilter(a, target, prop);
        start = a[0];
        end = a[1];
      }
      startNums = start.match(_complexStringNumExp) || [];
      while (result = _complexStringNumExp.exec(end)) {
        endNum = result[0];
        chunk = end.substring(index, result.index);
        if (color) {
          color = (color + 1) % 5;
        } else if (chunk.substr(-5) === "rgba(") {
          color = 1;
        }
        if (endNum !== startNums[matchIndex++]) {
          startNum = parseFloat(startNums[matchIndex - 1]) || 0;
          pt._pt = {
            _next: pt._pt,
            p: chunk || matchIndex === 1 ? chunk : ",",
            //note: SVG spec allows omission of comma/space when a negative sign is wedged between two numbers, like 2.5-5.3 instead of 2.5,-5.3 but when tweening, the negative value may switch to positive, so we insert the comma just in case.
            s: startNum,
            c: endNum.charAt(1) === "=" ? _parseRelative(startNum, endNum) - startNum : parseFloat(endNum) - startNum,
            m: color && color < 4 ? Math.round : 0
          };
          index = _complexStringNumExp.lastIndex;
        }
      }
      pt.c = index < end.length ? end.substring(index, end.length) : "";
      pt.fp = funcParam;
      if (_relExp.test(end) || hasRandom) {
        pt.e = 0;
      }
      this._pt = pt;
      return pt;
    };
    _addPropTween = function _addPropTween2(target, prop, start, end, index, targets, modifier, stringFilter, funcParam, optional) {
      _isFunction(end) && (end = end(index || 0, target, targets));
      var currentValue = target[prop], parsedStart = start !== "get" ? start : !_isFunction(currentValue) ? currentValue : funcParam ? target[prop.indexOf("set") || !_isFunction(target["get" + prop.substr(3)]) ? prop : "get" + prop.substr(3)](funcParam) : target[prop](), setter = !_isFunction(currentValue) ? _setterPlain : funcParam ? _setterFuncWithParam : _setterFunc, pt;
      if (_isString(end)) {
        if (~end.indexOf("random(")) {
          end = _replaceRandom(end);
        }
        if (end.charAt(1) === "=") {
          pt = _parseRelative(parsedStart, end) + (getUnit(parsedStart) || 0);
          if (pt || pt === 0) {
            end = pt;
          }
        }
      }
      if (!optional || parsedStart !== end || _forceAllPropTweens) {
        if (!isNaN(parsedStart * end) && end !== "") {
          pt = new PropTween(this._pt, target, prop, +parsedStart || 0, end - (parsedStart || 0), typeof currentValue === "boolean" ? _renderBoolean : _renderPlain, 0, setter);
          funcParam && (pt.fp = funcParam);
          modifier && pt.modifier(modifier, this, target);
          return this._pt = pt;
        }
        !currentValue && !(prop in target) && _missingPlugin(prop, end);
        return _addComplexStringPropTween.call(this, target, prop, parsedStart, end, setter, stringFilter || _config.stringFilter, funcParam);
      }
    };
    _processVars = function _processVars2(vars, index, target, targets, tween) {
      _isFunction(vars) && (vars = _parseFuncOrString(vars, tween, index, target, targets));
      if (!_isObject(vars) || vars.style && vars.nodeType || _isArray(vars) || _isTypedArray(vars)) {
        return _isString(vars) ? _parseFuncOrString(vars, tween, index, target, targets) : vars;
      }
      var copy = {}, p;
      for (p in vars) {
        copy[p] = _parseFuncOrString(vars[p], tween, index, target, targets);
      }
      return copy;
    };
    _checkPlugin = function _checkPlugin2(property, vars, tween, index, target, targets) {
      var plugin, pt, ptLookup, i;
      if (_plugins[property] && (plugin = new _plugins[property]()).init(target, plugin.rawVars ? vars[property] : _processVars(vars[property], index, target, targets, tween), tween, index, targets) !== false) {
        tween._pt = pt = new PropTween(tween._pt, target, property, 0, 1, plugin.render, plugin, 0, plugin.priority);
        if (tween !== _quickTween) {
          ptLookup = tween._ptLookup[tween._targets.indexOf(target)];
          i = plugin._props.length;
          while (i--) {
            ptLookup[plugin._props[i]] = pt;
          }
        }
      }
      return plugin;
    };
    _initTween = function _initTween2(tween, time, tTime) {
      var vars = tween.vars, ease = vars.ease, startAt = vars.startAt, immediateRender = vars.immediateRender, lazy = vars.lazy, onUpdate = vars.onUpdate, runBackwards = vars.runBackwards, yoyoEase = vars.yoyoEase, keyframes = vars.keyframes, autoRevert = vars.autoRevert, dur = tween._dur, prevStartAt = tween._startAt, targets = tween._targets, parent = tween.parent, fullTargets = parent && parent.data === "nested" ? parent.vars.targets : targets, autoOverwrite = tween._overwrite === "auto" && !_suppressOverwrites, tl = tween.timeline, cleanVars, i, p, pt, target, hasPriority, gsData, harness, plugin, ptLookup, index, harnessVars, overwritten;
      tl && (!keyframes || !ease) && (ease = "none");
      tween._ease = _parseEase(ease, _defaults.ease);
      tween._yEase = yoyoEase ? _invertEase(_parseEase(yoyoEase === true ? ease : yoyoEase, _defaults.ease)) : 0;
      if (yoyoEase && tween._yoyo && !tween._repeat) {
        yoyoEase = tween._yEase;
        tween._yEase = tween._ease;
        tween._ease = yoyoEase;
      }
      tween._from = !tl && !!vars.runBackwards;
      if (!tl || keyframes && !vars.stagger) {
        harness = targets[0] ? _getCache(targets[0]).harness : 0;
        harnessVars = harness && vars[harness.prop];
        cleanVars = _copyExcluding(vars, _reservedProps);
        if (prevStartAt) {
          prevStartAt._zTime < 0 && prevStartAt.progress(1);
          time < 0 && runBackwards && immediateRender && !autoRevert ? prevStartAt.render(-1, true) : prevStartAt.revert(runBackwards && dur ? _revertConfigNoKill : _startAtRevertConfig);
          prevStartAt._lazy = 0;
        }
        if (startAt) {
          _removeFromParent(tween._startAt = Tween.set(targets, _setDefaults({
            data: "isStart",
            overwrite: false,
            parent,
            immediateRender: true,
            lazy: !prevStartAt && _isNotFalse(lazy),
            startAt: null,
            delay: 0,
            onUpdate: onUpdate && function() {
              return _callback(tween, "onUpdate");
            },
            stagger: 0
          }, startAt)));
          tween._startAt._dp = 0;
          tween._startAt._sat = tween;
          time < 0 && (_reverting || !immediateRender && !autoRevert) && tween._startAt.revert(_revertConfigNoKill);
          if (immediateRender) {
            if (dur && time <= 0 && tTime <= 0) {
              time && (tween._zTime = time);
              return;
            }
          }
        } else if (runBackwards && dur) {
          if (!prevStartAt) {
            time && (immediateRender = false);
            p = _setDefaults({
              overwrite: false,
              data: "isFromStart",
              //we tag the tween with as "isFromStart" so that if [inside a plugin] we need to only do something at the very END of a tween, we have a way of identifying this tween as merely the one that's setting the beginning values for a "from()" tween. For example, clearProps in CSSPlugin should only get applied at the very END of a tween and without this tag, from(...{height:100, clearProps:"height", delay:1}) would wipe the height at the beginning of the tween and after 1 second, it'd kick back in.
              lazy: immediateRender && !prevStartAt && _isNotFalse(lazy),
              immediateRender,
              //zero-duration tweens render immediately by default, but if we're not specifically instructed to render this tween immediately, we should skip this and merely _init() to record the starting values (rendering them immediately would push them to completion which is wasteful in that case - we'd have to render(-1) immediately after)
              stagger: 0,
              parent
              //ensures that nested tweens that had a stagger are handled properly, like gsap.from(".class", {y: gsap.utils.wrap([-100,100]), stagger: 0.5})
            }, cleanVars);
            harnessVars && (p[harness.prop] = harnessVars);
            _removeFromParent(tween._startAt = Tween.set(targets, p));
            tween._startAt._dp = 0;
            tween._startAt._sat = tween;
            time < 0 && (_reverting ? tween._startAt.revert(_revertConfigNoKill) : tween._startAt.render(-1, true));
            tween._zTime = time;
            if (!immediateRender) {
              _initTween2(tween._startAt, _tinyNum, _tinyNum);
            } else if (!time) {
              return;
            }
          }
        }
        tween._pt = tween._ptCache = 0;
        lazy = dur && _isNotFalse(lazy) || lazy && !dur;
        for (i = 0; i < targets.length; i++) {
          target = targets[i];
          gsData = target._gsap || _harness(targets)[i]._gsap;
          tween._ptLookup[i] = ptLookup = {};
          _lazyLookup[gsData.id] && _lazyTweens.length && _lazyRender();
          index = fullTargets === targets ? i : fullTargets.indexOf(target);
          if (harness && (plugin = new harness()).init(target, harnessVars || cleanVars, tween, index, fullTargets) !== false) {
            tween._pt = pt = new PropTween(tween._pt, target, plugin.name, 0, 1, plugin.render, plugin, 0, plugin.priority);
            plugin._props.forEach(function(name) {
              ptLookup[name] = pt;
            });
            plugin.priority && (hasPriority = 1);
          }
          if (!harness || harnessVars) {
            for (p in cleanVars) {
              if (_plugins[p] && (plugin = _checkPlugin(p, cleanVars, tween, index, target, fullTargets))) {
                plugin.priority && (hasPriority = 1);
              } else {
                ptLookup[p] = pt = _addPropTween.call(tween, target, p, "get", cleanVars[p], index, fullTargets, 0, vars.stringFilter);
              }
            }
          }
          tween._op && tween._op[i] && tween.kill(target, tween._op[i]);
          if (autoOverwrite && tween._pt) {
            _overwritingTween = tween;
            _globalTimeline.killTweensOf(target, ptLookup, tween.globalTime(time));
            overwritten = !tween.parent;
            _overwritingTween = 0;
          }
          tween._pt && lazy && (_lazyLookup[gsData.id] = 1);
        }
        hasPriority && _sortPropTweensByPriority(tween);
        tween._onInit && tween._onInit(tween);
      }
      tween._onUpdate = onUpdate;
      tween._initted = (!tween._op || tween._pt) && !overwritten;
      keyframes && time <= 0 && tl.render(_bigNum, true, true);
    };
    _updatePropTweens = function _updatePropTweens2(tween, property, value, start, startIsRelative, ratio, time, skipRecursion) {
      var ptCache = (tween._pt && tween._ptCache || (tween._ptCache = {}))[property], pt, rootPT, lookup, i;
      if (!ptCache) {
        ptCache = tween._ptCache[property] = [];
        lookup = tween._ptLookup;
        i = tween._targets.length;
        while (i--) {
          pt = lookup[i][property];
          if (pt && pt.d && pt.d._pt) {
            pt = pt.d._pt;
            while (pt && pt.p !== property && pt.fp !== property) {
              pt = pt._next;
            }
          }
          if (!pt) {
            _forceAllPropTweens = 1;
            tween.vars[property] = "+=0";
            _initTween(tween, time);
            _forceAllPropTweens = 0;
            return skipRecursion ? _warn(property + " not eligible for reset") : 1;
          }
          ptCache.push(pt);
        }
      }
      i = ptCache.length;
      while (i--) {
        rootPT = ptCache[i];
        pt = rootPT._pt || rootPT;
        pt.s = (start || start === 0) && !startIsRelative ? start : pt.s + (start || 0) + ratio * pt.c;
        pt.c = value - pt.s;
        rootPT.e && (rootPT.e = _round(value) + getUnit(rootPT.e));
        rootPT.b && (rootPT.b = pt.s + getUnit(rootPT.b));
      }
    };
    _addAliasesToVars = function _addAliasesToVars2(targets, vars) {
      var harness = targets[0] ? _getCache(targets[0]).harness : 0, propertyAliases = harness && harness.aliases, copy, p, i, aliases;
      if (!propertyAliases) {
        return vars;
      }
      copy = _merge({}, vars);
      for (p in propertyAliases) {
        if (p in copy) {
          aliases = propertyAliases[p].split(",");
          i = aliases.length;
          while (i--) {
            copy[aliases[i]] = copy[p];
          }
        }
      }
      return copy;
    };
    _parseKeyframe = function _parseKeyframe2(prop, obj, allProps, easeEach) {
      var ease = obj.ease || easeEach || "power1.inOut", p, a;
      if (_isArray(obj)) {
        a = allProps[prop] || (allProps[prop] = []);
        obj.forEach(function(value, i) {
          return a.push({
            t: i / (obj.length - 1) * 100,
            v: value,
            e: ease
          });
        });
      } else {
        for (p in obj) {
          a = allProps[p] || (allProps[p] = []);
          p === "ease" || a.push({
            t: parseFloat(prop),
            v: obj[p],
            e: ease
          });
        }
      }
    };
    _parseFuncOrString = function _parseFuncOrString2(value, tween, i, target, targets) {
      return _isFunction(value) ? value.call(tween, i, target, targets) : _isString(value) && ~value.indexOf("random(") ? _replaceRandom(value) : value;
    };
    _staggerTweenProps = _callbackNames + "repeat,repeatDelay,yoyo,repeatRefresh,yoyoEase,autoRevert";
    _staggerPropsToSkip = {};
    _forEachName(_staggerTweenProps + ",id,stagger,delay,duration,paused,scrollTrigger", function(name) {
      return _staggerPropsToSkip[name] = 1;
    });
    Tween = /* @__PURE__ */ (function(_Animation2) {
      _inheritsLoose(Tween2, _Animation2);
      function Tween2(targets, vars, position, skipInherit) {
        var _this3;
        if (typeof vars === "number") {
          position.duration = vars;
          vars = position;
          position = null;
        }
        _this3 = _Animation2.call(this, skipInherit ? vars : _inheritDefaults(vars)) || this;
        var _this3$vars = _this3.vars, duration = _this3$vars.duration, delay = _this3$vars.delay, immediateRender = _this3$vars.immediateRender, stagger = _this3$vars.stagger, overwrite = _this3$vars.overwrite, keyframes = _this3$vars.keyframes, defaults2 = _this3$vars.defaults, scrollTrigger = _this3$vars.scrollTrigger, yoyoEase = _this3$vars.yoyoEase, parent = vars.parent || _globalTimeline, parsedTargets = (_isArray(targets) || _isTypedArray(targets) ? _isNumber(targets[0]) : "length" in vars) ? [targets] : toArray2(targets), tl, i, copy, l, p, curTarget, staggerFunc, staggerVarsToMerge;
        _this3._targets = parsedTargets.length ? _harness(parsedTargets) : _warn("GSAP target " + targets + " not found. https://gsap.com", !_config.nullTargetWarn) || [];
        _this3._ptLookup = [];
        _this3._overwrite = overwrite;
        if (keyframes || stagger || _isFuncOrString(duration) || _isFuncOrString(delay)) {
          vars = _this3.vars;
          tl = _this3.timeline = new Timeline({
            data: "nested",
            defaults: defaults2 || {},
            targets: parent && parent.data === "nested" ? parent.vars.targets : parsedTargets
          });
          tl.kill();
          tl.parent = tl._dp = _assertThisInitialized(_this3);
          tl._start = 0;
          if (stagger || _isFuncOrString(duration) || _isFuncOrString(delay)) {
            l = parsedTargets.length;
            staggerFunc = stagger && distribute(stagger);
            if (_isObject(stagger)) {
              for (p in stagger) {
                if (~_staggerTweenProps.indexOf(p)) {
                  staggerVarsToMerge || (staggerVarsToMerge = {});
                  staggerVarsToMerge[p] = stagger[p];
                }
              }
            }
            for (i = 0; i < l; i++) {
              copy = _copyExcluding(vars, _staggerPropsToSkip);
              copy.stagger = 0;
              yoyoEase && (copy.yoyoEase = yoyoEase);
              staggerVarsToMerge && _merge(copy, staggerVarsToMerge);
              curTarget = parsedTargets[i];
              copy.duration = +_parseFuncOrString(duration, _assertThisInitialized(_this3), i, curTarget, parsedTargets);
              copy.delay = (+_parseFuncOrString(delay, _assertThisInitialized(_this3), i, curTarget, parsedTargets) || 0) - _this3._delay;
              if (!stagger && l === 1 && copy.delay) {
                _this3._delay = delay = copy.delay;
                _this3._start += delay;
                copy.delay = 0;
              }
              tl.to(curTarget, copy, staggerFunc ? staggerFunc(i, curTarget, parsedTargets) : 0);
              tl._ease = _easeMap.none;
            }
            tl.duration() ? duration = delay = 0 : _this3.timeline = 0;
          } else if (keyframes) {
            _inheritDefaults(_setDefaults(tl.vars.defaults, {
              ease: "none"
            }));
            tl._ease = _parseEase(keyframes.ease || vars.ease || "none");
            var time = 0, a, kf, v;
            if (_isArray(keyframes)) {
              keyframes.forEach(function(frame) {
                return tl.to(parsedTargets, frame, ">");
              });
              tl.duration();
            } else {
              copy = {};
              for (p in keyframes) {
                p === "ease" || p === "easeEach" || _parseKeyframe(p, keyframes[p], copy, keyframes.easeEach);
              }
              for (p in copy) {
                a = copy[p].sort(function(a2, b) {
                  return a2.t - b.t;
                });
                time = 0;
                for (i = 0; i < a.length; i++) {
                  kf = a[i];
                  v = {
                    ease: kf.e,
                    duration: (kf.t - (i ? a[i - 1].t : 0)) / 100 * duration
                  };
                  v[p] = kf.v;
                  tl.to(parsedTargets, v, time);
                  time += v.duration;
                }
              }
              tl.duration() < duration && tl.to({}, {
                duration: duration - tl.duration()
              });
            }
          }
          duration || _this3.duration(duration = tl.duration());
        } else {
          _this3.timeline = 0;
        }
        if (overwrite === true && !_suppressOverwrites) {
          _overwritingTween = _assertThisInitialized(_this3);
          _globalTimeline.killTweensOf(parsedTargets);
          _overwritingTween = 0;
        }
        _addToTimeline(parent, _assertThisInitialized(_this3), position);
        vars.reversed && _this3.reverse();
        vars.paused && _this3.paused(true);
        if (immediateRender || !duration && !keyframes && _this3._start === _roundPrecise(parent._time) && _isNotFalse(immediateRender) && _hasNoPausedAncestors(_assertThisInitialized(_this3)) && parent.data !== "nested") {
          _this3._tTime = -_tinyNum;
          _this3.render(Math.max(0, -delay) || 0);
        }
        scrollTrigger && _scrollTrigger(_assertThisInitialized(_this3), scrollTrigger);
        return _this3;
      }
      var _proto3 = Tween2.prototype;
      _proto3.render = function render4(totalTime, suppressEvents, force) {
        var prevTime = this._time, tDur = this._tDur, dur = this._dur, isNegative = totalTime < 0, tTime = totalTime > tDur - _tinyNum && !isNegative ? tDur : totalTime < _tinyNum ? 0 : totalTime, time, pt, iteration, cycleDuration, prevIteration, isYoyo, ratio, timeline2, yoyoEase;
        if (!dur) {
          _renderZeroDurationTween(this, totalTime, suppressEvents, force);
        } else if (tTime !== this._tTime || !totalTime || force || !this._initted && this._tTime || this._startAt && this._zTime < 0 !== isNegative) {
          time = tTime;
          timeline2 = this.timeline;
          if (this._repeat) {
            cycleDuration = dur + this._rDelay;
            if (this._repeat < -1 && isNegative) {
              return this.totalTime(cycleDuration * 100 + totalTime, suppressEvents, force);
            }
            time = _roundPrecise(tTime % cycleDuration);
            if (tTime === tDur) {
              iteration = this._repeat;
              time = dur;
            } else {
              iteration = ~~(tTime / cycleDuration);
              if (iteration && iteration === _roundPrecise(tTime / cycleDuration)) {
                time = dur;
                iteration--;
              }
              time > dur && (time = dur);
            }
            isYoyo = this._yoyo && iteration & 1;
            if (isYoyo) {
              yoyoEase = this._yEase;
              time = dur - time;
            }
            prevIteration = _animationCycle(this._tTime, cycleDuration);
            if (time === prevTime && !force && this._initted && iteration === prevIteration) {
              this._tTime = tTime;
              return this;
            }
            if (iteration !== prevIteration) {
              timeline2 && this._yEase && _propagateYoyoEase(timeline2, isYoyo);
              if (this.vars.repeatRefresh && !isYoyo && !this._lock && this._time !== cycleDuration && this._initted) {
                this._lock = force = 1;
                this.render(_roundPrecise(cycleDuration * iteration), true).invalidate()._lock = 0;
              }
            }
          }
          if (!this._initted) {
            if (_attemptInitTween(this, isNegative ? totalTime : time, force, suppressEvents, tTime)) {
              this._tTime = 0;
              return this;
            }
            if (prevTime !== this._time && !(force && this.vars.repeatRefresh && iteration !== prevIteration)) {
              return this;
            }
            if (dur !== this._dur) {
              return this.render(totalTime, suppressEvents, force);
            }
          }
          this._tTime = tTime;
          this._time = time;
          if (!this._act && this._ts) {
            this._act = 1;
            this._lazy = 0;
          }
          this.ratio = ratio = (yoyoEase || this._ease)(time / dur);
          if (this._from) {
            this.ratio = ratio = 1 - ratio;
          }
          if (time && !prevTime && !suppressEvents && !iteration) {
            _callback(this, "onStart");
            if (this._tTime !== tTime) {
              return this;
            }
          }
          pt = this._pt;
          while (pt) {
            pt.r(ratio, pt.d);
            pt = pt._next;
          }
          timeline2 && timeline2.render(totalTime < 0 ? totalTime : timeline2._dur * timeline2._ease(time / this._dur), suppressEvents, force) || this._startAt && (this._zTime = totalTime);
          if (this._onUpdate && !suppressEvents) {
            isNegative && _rewindStartAt(this, totalTime, suppressEvents, force);
            _callback(this, "onUpdate");
          }
          this._repeat && iteration !== prevIteration && this.vars.onRepeat && !suppressEvents && this.parent && _callback(this, "onRepeat");
          if ((tTime === this._tDur || !tTime) && this._tTime === tTime) {
            isNegative && !this._onUpdate && _rewindStartAt(this, totalTime, true, true);
            (totalTime || !dur) && (tTime === this._tDur && this._ts > 0 || !tTime && this._ts < 0) && _removeFromParent(this, 1);
            if (!suppressEvents && !(isNegative && !prevTime) && (tTime || prevTime || isYoyo)) {
              _callback(this, tTime === tDur ? "onComplete" : "onReverseComplete", true);
              this._prom && !(tTime < tDur && this.timeScale() > 0) && this._prom();
            }
          }
        }
        return this;
      };
      _proto3.targets = function targets() {
        return this._targets;
      };
      _proto3.invalidate = function invalidate(soft) {
        (!soft || !this.vars.runBackwards) && (this._startAt = 0);
        this._pt = this._op = this._onUpdate = this._lazy = this.ratio = 0;
        this._ptLookup = [];
        this.timeline && this.timeline.invalidate(soft);
        return _Animation2.prototype.invalidate.call(this, soft);
      };
      _proto3.resetTo = function resetTo(property, value, start, startIsRelative, skipRecursion) {
        _tickerActive || _ticker.wake();
        this._ts || this.play();
        var time = Math.min(this._dur, (this._dp._time - this._start) * this._ts), ratio;
        this._initted || _initTween(this, time);
        ratio = this._ease(time / this._dur);
        if (_updatePropTweens(this, property, value, start, startIsRelative, ratio, time, skipRecursion)) {
          return this.resetTo(property, value, start, startIsRelative, 1);
        }
        _alignPlayhead(this, 0);
        this.parent || _addLinkedListItem(this._dp, this, "_first", "_last", this._dp._sort ? "_start" : 0);
        return this.render(0);
      };
      _proto3.kill = function kill(targets, vars) {
        if (vars === void 0) {
          vars = "all";
        }
        if (!targets && (!vars || vars === "all")) {
          this._lazy = this._pt = 0;
          return this.parent ? _interrupt(this) : this;
        }
        if (this.timeline) {
          var tDur = this.timeline.totalDuration();
          this.timeline.killTweensOf(targets, vars, _overwritingTween && _overwritingTween.vars.overwrite !== true)._first || _interrupt(this);
          this.parent && tDur !== this.timeline.totalDuration() && _setDuration(this, this._dur * this.timeline._tDur / tDur, 0, 1);
          return this;
        }
        var parsedTargets = this._targets, killingTargets = targets ? toArray2(targets) : parsedTargets, propTweenLookup = this._ptLookup, firstPT = this._pt, overwrittenProps, curLookup, curOverwriteProps, props, p, pt, i;
        if ((!vars || vars === "all") && _arraysMatch(parsedTargets, killingTargets)) {
          vars === "all" && (this._pt = 0);
          return _interrupt(this);
        }
        overwrittenProps = this._op = this._op || [];
        if (vars !== "all") {
          if (_isString(vars)) {
            p = {};
            _forEachName(vars, function(name) {
              return p[name] = 1;
            });
            vars = p;
          }
          vars = _addAliasesToVars(parsedTargets, vars);
        }
        i = parsedTargets.length;
        while (i--) {
          if (~killingTargets.indexOf(parsedTargets[i])) {
            curLookup = propTweenLookup[i];
            if (vars === "all") {
              overwrittenProps[i] = vars;
              props = curLookup;
              curOverwriteProps = {};
            } else {
              curOverwriteProps = overwrittenProps[i] = overwrittenProps[i] || {};
              props = vars;
            }
            for (p in props) {
              pt = curLookup && curLookup[p];
              if (pt) {
                if (!("kill" in pt.d) || pt.d.kill(p) === true) {
                  _removeLinkedListItem(this, pt, "_pt");
                }
                delete curLookup[p];
              }
              if (curOverwriteProps !== "all") {
                curOverwriteProps[p] = 1;
              }
            }
          }
        }
        this._initted && !this._pt && firstPT && _interrupt(this);
        return this;
      };
      Tween2.to = function to(targets, vars) {
        return new Tween2(targets, vars, arguments[2]);
      };
      Tween2.from = function from(targets, vars) {
        return _createTweenType(1, arguments);
      };
      Tween2.delayedCall = function delayedCall(delay, callback, params, scope) {
        return new Tween2(callback, 0, {
          immediateRender: false,
          lazy: false,
          overwrite: false,
          delay,
          onComplete: callback,
          onReverseComplete: callback,
          onCompleteParams: params,
          onReverseCompleteParams: params,
          callbackScope: scope
        });
      };
      Tween2.fromTo = function fromTo(targets, fromVars, toVars) {
        return _createTweenType(2, arguments);
      };
      Tween2.set = function set(targets, vars) {
        vars.duration = 0;
        vars.repeatDelay || (vars.repeat = 0);
        return new Tween2(targets, vars);
      };
      Tween2.killTweensOf = function killTweensOf(targets, props, onlyActive) {
        return _globalTimeline.killTweensOf(targets, props, onlyActive);
      };
      return Tween2;
    })(Animation);
    _setDefaults(Tween.prototype, {
      _targets: [],
      _lazy: 0,
      _startAt: 0,
      _op: 0,
      _onInit: 0
    });
    _forEachName("staggerTo,staggerFrom,staggerFromTo", function(name) {
      Tween[name] = function() {
        var tl = new Timeline(), params = _slice.call(arguments, 0);
        params.splice(name === "staggerFromTo" ? 5 : 4, 0, 0);
        return tl[name].apply(tl, params);
      };
    });
    _setterPlain = function _setterPlain2(target, property, value) {
      return target[property] = value;
    };
    _setterFunc = function _setterFunc2(target, property, value) {
      return target[property](value);
    };
    _setterFuncWithParam = function _setterFuncWithParam2(target, property, value, data) {
      return target[property](data.fp, value);
    };
    _setterAttribute = function _setterAttribute2(target, property, value) {
      return target.setAttribute(property, value);
    };
    _getSetter = function _getSetter2(target, property) {
      return _isFunction(target[property]) ? _setterFunc : _isUndefined(target[property]) && target.setAttribute ? _setterAttribute : _setterPlain;
    };
    _renderPlain = function _renderPlain2(ratio, data) {
      return data.set(data.t, data.p, Math.round((data.s + data.c * ratio) * 1e6) / 1e6, data);
    };
    _renderBoolean = function _renderBoolean2(ratio, data) {
      return data.set(data.t, data.p, !!(data.s + data.c * ratio), data);
    };
    _renderComplexString = function _renderComplexString2(ratio, data) {
      var pt = data._pt, s = "";
      if (!ratio && data.b) {
        s = data.b;
      } else if (ratio === 1 && data.e) {
        s = data.e;
      } else {
        while (pt) {
          s = pt.p + (pt.m ? pt.m(pt.s + pt.c * ratio) : Math.round((pt.s + pt.c * ratio) * 1e4) / 1e4) + s;
          pt = pt._next;
        }
        s += data.c;
      }
      data.set(data.t, data.p, s, data);
    };
    _renderPropTweens = function _renderPropTweens2(ratio, data) {
      var pt = data._pt;
      while (pt) {
        pt.r(ratio, pt.d);
        pt = pt._next;
      }
    };
    _addPluginModifier = function _addPluginModifier2(modifier, tween, target, property) {
      var pt = this._pt, next;
      while (pt) {
        next = pt._next;
        pt.p === property && pt.modifier(modifier, tween, target);
        pt = next;
      }
    };
    _killPropTweensOf = function _killPropTweensOf2(property) {
      var pt = this._pt, hasNonDependentRemaining, next;
      while (pt) {
        next = pt._next;
        if (pt.p === property && !pt.op || pt.op === property) {
          _removeLinkedListItem(this, pt, "_pt");
        } else if (!pt.dep) {
          hasNonDependentRemaining = 1;
        }
        pt = next;
      }
      return !hasNonDependentRemaining;
    };
    _setterWithModifier = function _setterWithModifier2(target, property, value, data) {
      data.mSet(target, property, data.m.call(data.tween, value, data.mt), data);
    };
    _sortPropTweensByPriority = function _sortPropTweensByPriority2(parent) {
      var pt = parent._pt, next, pt2, first, last;
      while (pt) {
        next = pt._next;
        pt2 = first;
        while (pt2 && pt2.pr > pt.pr) {
          pt2 = pt2._next;
        }
        if (pt._prev = pt2 ? pt2._prev : last) {
          pt._prev._next = pt;
        } else {
          first = pt;
        }
        if (pt._next = pt2) {
          pt2._prev = pt;
        } else {
          last = pt;
        }
        pt = next;
      }
      parent._pt = first;
    };
    PropTween = /* @__PURE__ */ (function() {
      function PropTween2(next, target, prop, start, change, renderer, data, setter, priority) {
        this.t = target;
        this.s = start;
        this.c = change;
        this.p = prop;
        this.r = renderer || _renderPlain;
        this.d = data || this;
        this.set = setter || _setterPlain;
        this.pr = priority || 0;
        this._next = next;
        if (next) {
          next._prev = this;
        }
      }
      var _proto4 = PropTween2.prototype;
      _proto4.modifier = function modifier(func, tween, target) {
        this.mSet = this.mSet || this.set;
        this.set = _setterWithModifier;
        this.m = func;
        this.mt = target;
        this.tween = tween;
      };
      return PropTween2;
    })();
    _forEachName(_callbackNames + "parent,duration,ease,delay,overwrite,runBackwards,startAt,yoyo,immediateRender,repeat,repeatDelay,data,paused,reversed,lazy,callbackScope,stringFilter,id,yoyoEase,stagger,inherit,repeatRefresh,keyframes,autoRevert,scrollTrigger", function(name) {
      return _reservedProps[name] = 1;
    });
    _globals.TweenMax = _globals.TweenLite = Tween;
    _globals.TimelineLite = _globals.TimelineMax = Timeline;
    _globalTimeline = new Timeline({
      sortChildren: false,
      defaults: _defaults,
      autoRemoveChildren: true,
      id: "root",
      smoothChildTiming: true
    });
    _config.stringFilter = _colorStringFilter;
    _media = [];
    _listeners = {};
    _emptyArray = [];
    _lastMediaTime = 0;
    _contextID = 0;
    _dispatch = function _dispatch2(type) {
      return (_listeners[type] || _emptyArray).map(function(f) {
        return f();
      });
    };
    _onMediaChange = function _onMediaChange2() {
      var time = Date.now(), matches = [];
      if (time - _lastMediaTime > 2) {
        _dispatch("matchMediaInit");
        _media.forEach(function(c) {
          var queries = c.queries, conditions = c.conditions, match, p, anyMatch, toggled;
          for (p in queries) {
            match = _win.matchMedia(queries[p]).matches;
            match && (anyMatch = 1);
            if (match !== conditions[p]) {
              conditions[p] = match;
              toggled = 1;
            }
          }
          if (toggled) {
            c.revert();
            anyMatch && matches.push(c);
          }
        });
        _dispatch("matchMediaRevert");
        matches.forEach(function(c) {
          return c.onMatch(c, function(func) {
            return c.add(null, func);
          });
        });
        _lastMediaTime = time;
        _dispatch("matchMedia");
      }
    };
    Context = /* @__PURE__ */ (function() {
      function Context2(func, scope) {
        this.selector = scope && selector(scope);
        this.data = [];
        this._r = [];
        this.isReverted = false;
        this.id = _contextID++;
        func && this.add(func);
      }
      var _proto5 = Context2.prototype;
      _proto5.add = function add(name, func, scope) {
        if (_isFunction(name)) {
          scope = func;
          func = name;
          name = _isFunction;
        }
        var self2 = this, f = function f2() {
          var prev = _context, prevSelector = self2.selector, result;
          prev && prev !== self2 && prev.data.push(self2);
          scope && (self2.selector = selector(scope));
          _context = self2;
          result = func.apply(self2, arguments);
          _isFunction(result) && self2._r.push(result);
          _context = prev;
          self2.selector = prevSelector;
          self2.isReverted = false;
          return result;
        };
        self2.last = f;
        return name === _isFunction ? f(self2, function(func2) {
          return self2.add(null, func2);
        }) : name ? self2[name] = f : f;
      };
      _proto5.ignore = function ignore(func) {
        var prev = _context;
        _context = null;
        func(this);
        _context = prev;
      };
      _proto5.getTweens = function getTweens() {
        var a = [];
        this.data.forEach(function(e) {
          return e instanceof Context2 ? a.push.apply(a, e.getTweens()) : e instanceof Tween && !(e.parent && e.parent.data === "nested") && a.push(e);
        });
        return a;
      };
      _proto5.clear = function clear() {
        this._r.length = this.data.length = 0;
      };
      _proto5.kill = function kill(revert, matchMedia3) {
        var _this4 = this;
        if (revert) {
          (function() {
            var tweens = _this4.getTweens(), i2 = _this4.data.length, t;
            while (i2--) {
              t = _this4.data[i2];
              if (t.data === "isFlip") {
                t.revert();
                t.getChildren(true, true, false).forEach(function(tween) {
                  return tweens.splice(tweens.indexOf(tween), 1);
                });
              }
            }
            tweens.map(function(t2) {
              return {
                g: t2._dur || t2._delay || t2._sat && !t2._sat.vars.immediateRender ? t2.globalTime(0) : -Infinity,
                t: t2
              };
            }).sort(function(a, b) {
              return b.g - a.g || -Infinity;
            }).forEach(function(o) {
              return o.t.revert(revert);
            });
            i2 = _this4.data.length;
            while (i2--) {
              t = _this4.data[i2];
              if (t instanceof Timeline) {
                if (t.data !== "nested") {
                  t.scrollTrigger && t.scrollTrigger.revert();
                  t.kill();
                }
              } else {
                !(t instanceof Tween) && t.revert && t.revert(revert);
              }
            }
            _this4._r.forEach(function(f) {
              return f(revert, _this4);
            });
            _this4.isReverted = true;
          })();
        } else {
          this.data.forEach(function(e) {
            return e.kill && e.kill();
          });
        }
        this.clear();
        if (matchMedia3) {
          var i = _media.length;
          while (i--) {
            _media[i].id === this.id && _media.splice(i, 1);
          }
        }
      };
      _proto5.revert = function revert(config3) {
        this.kill(config3 || {});
      };
      return Context2;
    })();
    MatchMedia = /* @__PURE__ */ (function() {
      function MatchMedia2(scope) {
        this.contexts = [];
        this.scope = scope;
        _context && _context.data.push(this);
      }
      var _proto6 = MatchMedia2.prototype;
      _proto6.add = function add(conditions, func, scope) {
        _isObject(conditions) || (conditions = {
          matches: conditions
        });
        var context3 = new Context(0, scope || this.scope), cond = context3.conditions = {}, mq, p, active;
        _context && !context3.selector && (context3.selector = _context.selector);
        this.contexts.push(context3);
        func = context3.add("onMatch", func);
        context3.queries = conditions;
        for (p in conditions) {
          if (p === "all") {
            active = 1;
          } else {
            mq = _win.matchMedia(conditions[p]);
            if (mq) {
              _media.indexOf(context3) < 0 && _media.push(context3);
              (cond[p] = mq.matches) && (active = 1);
              mq.addListener ? mq.addListener(_onMediaChange) : mq.addEventListener("change", _onMediaChange);
            }
          }
        }
        active && func(context3, function(f) {
          return context3.add(null, f);
        });
        return this;
      };
      _proto6.revert = function revert(config3) {
        this.kill(config3 || {});
      };
      _proto6.kill = function kill(revert) {
        this.contexts.forEach(function(c) {
          return c.kill(revert, true);
        });
      };
      return MatchMedia2;
    })();
    _gsap = {
      registerPlugin: function registerPlugin() {
        for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args[_key2] = arguments[_key2];
        }
        args.forEach(function(config3) {
          return _createPlugin(config3);
        });
      },
      timeline: function timeline(vars) {
        return new Timeline(vars);
      },
      getTweensOf: function getTweensOf(targets, onlyActive) {
        return _globalTimeline.getTweensOf(targets, onlyActive);
      },
      getProperty: function getProperty(target, property, unit, uncache) {
        _isString(target) && (target = toArray2(target)[0]);
        var getter = _getCache(target || {}).get, format = unit ? _passThrough : _numericIfPossible;
        unit === "native" && (unit = "");
        return !target ? target : !property ? function(property2, unit2, uncache2) {
          return format((_plugins[property2] && _plugins[property2].get || getter)(target, property2, unit2, uncache2));
        } : format((_plugins[property] && _plugins[property].get || getter)(target, property, unit, uncache));
      },
      quickSetter: function quickSetter(target, property, unit) {
        target = toArray2(target);
        if (target.length > 1) {
          var setters = target.map(function(t) {
            return gsap.quickSetter(t, property, unit);
          }), l = setters.length;
          return function(value) {
            var i = l;
            while (i--) {
              setters[i](value);
            }
          };
        }
        target = target[0] || {};
        var Plugin = _plugins[property], cache2 = _getCache(target), p = cache2.harness && (cache2.harness.aliases || {})[property] || property, setter = Plugin ? function(value) {
          var p2 = new Plugin();
          _quickTween._pt = 0;
          p2.init(target, unit ? value + unit : value, _quickTween, 0, [target]);
          p2.render(1, p2);
          _quickTween._pt && _renderPropTweens(1, _quickTween);
        } : cache2.set(target, p);
        return Plugin ? setter : function(value) {
          return setter(target, p, unit ? value + unit : value, cache2, 1);
        };
      },
      quickTo: function quickTo(target, property, vars) {
        var _merge22;
        var tween = gsap.to(target, _merge((_merge22 = {}, _merge22[property] = "+=0.1", _merge22.paused = true, _merge22), vars || {})), func = function func2(value, start, startIsRelative) {
          return tween.resetTo(property, value, start, startIsRelative);
        };
        func.tween = tween;
        return func;
      },
      isTweening: function isTweening(targets) {
        return _globalTimeline.getTweensOf(targets, true).length > 0;
      },
      defaults: function defaults(value) {
        value && value.ease && (value.ease = _parseEase(value.ease, _defaults.ease));
        return _mergeDeep(_defaults, value || {});
      },
      config: function config2(value) {
        return _mergeDeep(_config, value || {});
      },
      registerEffect: function registerEffect(_ref3) {
        var name = _ref3.name, effect = _ref3.effect, plugins = _ref3.plugins, defaults2 = _ref3.defaults, extendTimeline = _ref3.extendTimeline;
        (plugins || "").split(",").forEach(function(pluginName) {
          return pluginName && !_plugins[pluginName] && !_globals[pluginName] && _warn(name + " effect requires " + pluginName + " plugin.");
        });
        _effects[name] = function(targets, vars, tl) {
          return effect(toArray2(targets), _setDefaults(vars || {}, defaults2), tl);
        };
        if (extendTimeline) {
          Timeline.prototype[name] = function(targets, vars, position) {
            return this.add(_effects[name](targets, _isObject(vars) ? vars : (position = vars) && {}, this), position);
          };
        }
      },
      registerEase: function registerEase(name, ease) {
        _easeMap[name] = _parseEase(ease);
      },
      parseEase: function parseEase(ease, defaultEase) {
        return arguments.length ? _parseEase(ease, defaultEase) : _easeMap;
      },
      getById: function getById(id) {
        return _globalTimeline.getById(id);
      },
      exportRoot: function exportRoot(vars, includeDelayedCalls) {
        if (vars === void 0) {
          vars = {};
        }
        var tl = new Timeline(vars), child, next;
        tl.smoothChildTiming = _isNotFalse(vars.smoothChildTiming);
        _globalTimeline.remove(tl);
        tl._dp = 0;
        tl._time = tl._tTime = _globalTimeline._time;
        child = _globalTimeline._first;
        while (child) {
          next = child._next;
          if (includeDelayedCalls || !(!child._dur && child instanceof Tween && child.vars.onComplete === child._targets[0])) {
            _addToTimeline(tl, child, child._start - child._delay);
          }
          child = next;
        }
        _addToTimeline(_globalTimeline, tl, 0);
        return tl;
      },
      context: function context(func, scope) {
        return func ? new Context(func, scope) : _context;
      },
      matchMedia: function matchMedia2(scope) {
        return new MatchMedia(scope);
      },
      matchMediaRefresh: function matchMediaRefresh() {
        return _media.forEach(function(c) {
          var cond = c.conditions, found, p;
          for (p in cond) {
            if (cond[p]) {
              cond[p] = false;
              found = 1;
            }
          }
          found && c.revert();
        }) || _onMediaChange();
      },
      addEventListener: function addEventListener(type, callback) {
        var a = _listeners[type] || (_listeners[type] = []);
        ~a.indexOf(callback) || a.push(callback);
      },
      removeEventListener: function removeEventListener(type, callback) {
        var a = _listeners[type], i = a && a.indexOf(callback);
        i >= 0 && a.splice(i, 1);
      },
      utils: {
        wrap,
        wrapYoyo,
        distribute,
        random,
        snap,
        normalize,
        getUnit,
        clamp,
        splitColor,
        toArray: toArray2,
        selector,
        mapRange,
        pipe,
        unitize,
        interpolate,
        shuffle
      },
      install: _install,
      effects: _effects,
      ticker: _ticker,
      updateRoot: Timeline.updateRoot,
      plugins: _plugins,
      globalTimeline: _globalTimeline,
      core: {
        PropTween,
        globals: _addGlobal,
        Tween,
        Timeline,
        Animation,
        getCache: _getCache,
        _removeLinkedListItem,
        reverting: function reverting() {
          return _reverting;
        },
        context: function context2(toAdd) {
          if (toAdd && _context) {
            _context.data.push(toAdd);
            toAdd._ctx = _context;
          }
          return _context;
        },
        suppressOverwrites: function suppressOverwrites(value) {
          return _suppressOverwrites = value;
        }
      }
    };
    _forEachName("to,from,fromTo,delayedCall,set,killTweensOf", function(name) {
      return _gsap[name] = Tween[name];
    });
    _ticker.add(Timeline.updateRoot);
    _quickTween = _gsap.to({}, {
      duration: 0
    });
    _getPluginPropTween = function _getPluginPropTween2(plugin, prop) {
      var pt = plugin._pt;
      while (pt && pt.p !== prop && pt.op !== prop && pt.fp !== prop) {
        pt = pt._next;
      }
      return pt;
    };
    _addModifiers = function _addModifiers2(tween, modifiers) {
      var targets = tween._targets, p, i, pt;
      for (p in modifiers) {
        i = targets.length;
        while (i--) {
          pt = tween._ptLookup[i][p];
          if (pt && (pt = pt.d)) {
            if (pt._pt) {
              pt = _getPluginPropTween(pt, p);
            }
            pt && pt.modifier && pt.modifier(modifiers[p], tween, targets[i], p);
          }
        }
      }
    };
    _buildModifierPlugin = function _buildModifierPlugin2(name, modifier) {
      return {
        name,
        rawVars: 1,
        //don't pre-process function-based values or "random()" strings.
        init: function init4(target, vars, tween) {
          tween._onInit = function(tween2) {
            var temp, p;
            if (_isString(vars)) {
              temp = {};
              _forEachName(vars, function(name2) {
                return temp[name2] = 1;
              });
              vars = temp;
            }
            if (modifier) {
              temp = {};
              for (p in vars) {
                temp[p] = modifier(vars[p]);
              }
              vars = temp;
            }
            _addModifiers(tween2, vars);
          };
        }
      };
    };
    gsap = _gsap.registerPlugin({
      name: "attr",
      init: function init(target, vars, tween, index, targets) {
        var p, pt, v;
        this.tween = tween;
        for (p in vars) {
          v = target.getAttribute(p) || "";
          pt = this.add(target, "setAttribute", (v || 0) + "", vars[p], index, targets, 0, 0, p);
          pt.op = p;
          pt.b = v;
          this._props.push(p);
        }
      },
      render: function render(ratio, data) {
        var pt = data._pt;
        while (pt) {
          _reverting ? pt.set(pt.t, pt.p, pt.b, pt) : pt.r(ratio, pt.d);
          pt = pt._next;
        }
      }
    }, {
      name: "endArray",
      init: function init2(target, value) {
        var i = value.length;
        while (i--) {
          this.add(target, i, target[i] || 0, value[i], 0, 0, 0, 0, 0, 1);
        }
      }
    }, _buildModifierPlugin("roundProps", _roundModifier), _buildModifierPlugin("modifiers"), _buildModifierPlugin("snap", snap)) || _gsap;
    Tween.version = Timeline.version = gsap.version = "3.12.5";
    _coreReady = 1;
    _windowExists() && _wake();
    Power0 = _easeMap.Power0;
    Power1 = _easeMap.Power1;
    Power2 = _easeMap.Power2;
    Power3 = _easeMap.Power3;
    Power4 = _easeMap.Power4;
    Linear = _easeMap.Linear;
    Quad = _easeMap.Quad;
    Cubic = _easeMap.Cubic;
    Quart = _easeMap.Quart;
    Quint = _easeMap.Quint;
    Strong = _easeMap.Strong;
    Elastic = _easeMap.Elastic;
    Back = _easeMap.Back;
    SteppedEase = _easeMap.SteppedEase;
    Bounce = _easeMap.Bounce;
    Sine = _easeMap.Sine;
    Expo = _easeMap.Expo;
    Circ = _easeMap.Circ;
  }
});

// node_modules/gsap/CSSPlugin.js
var _win2, _doc2, _docElement, _pluginInitted, _tempDiv, _tempDivStyler, _recentSetterPlugin, _reverting2, _windowExists3, _transformProps, _RAD2DEG, _DEG2RAD, _atan2, _bigNum2, _capsExp, _horizontalExp, _complexExp, _propertyAliases, _renderCSSProp, _renderPropWithEnd, _renderCSSPropWithBeginning, _renderRoundedCSSProp, _renderNonTweeningValue, _renderNonTweeningValueOnlyAtEnd, _setterCSSStyle, _setterCSSProp, _setterTransform, _setterScale, _setterScaleWithRender, _setterTransformWithRender, _transformProp, _transformOriginProp, _saveStyle, _removeIndependentTransforms, _revertStyle, _getStyleSaver, _supports3D, _createElement, _getComputedProperty, _prefixes, _checkPropPrefix, _initCore, _getBBoxHack, _getAttributeFallbacks, _getBBox, _isSVG, _removeProperty, _addNonTweeningPT, _nonConvertibleUnits, _nonStandardLayouts, _convertToUnit, _get, _tweenComplexCSSString, _keywordToPercent, _convertKeywordsToPercentages, _renderClearProps, _specialProps, _identity2DMatrix, _rotationalProperties, _isNullTransform, _getComputedTransformMatrixAsArray, _getMatrix, _applySVGOrigin, _parseTransform, _firstTwoOnly, _addPxTranslate, _renderNon3DTransforms, _zeroDeg, _zeroPx, _endParenthesis, _renderCSSTransforms, _renderSVGTransforms, _addRotationalPropTween, _assign, _addRawTransformPTs, CSSPlugin;
var init_CSSPlugin = __esm({
  "node_modules/gsap/CSSPlugin.js"() {
    init_gsap_core();
    _windowExists3 = function _windowExists4() {
      return typeof window !== "undefined";
    };
    _transformProps = {};
    _RAD2DEG = 180 / Math.PI;
    _DEG2RAD = Math.PI / 180;
    _atan2 = Math.atan2;
    _bigNum2 = 1e8;
    _capsExp = /([A-Z])/g;
    _horizontalExp = /(left|right|width|margin|padding|x)/i;
    _complexExp = /[\s,\(]\S/;
    _propertyAliases = {
      autoAlpha: "opacity,visibility",
      scale: "scaleX,scaleY",
      alpha: "opacity"
    };
    _renderCSSProp = function _renderCSSProp2(ratio, data) {
      return data.set(data.t, data.p, Math.round((data.s + data.c * ratio) * 1e4) / 1e4 + data.u, data);
    };
    _renderPropWithEnd = function _renderPropWithEnd2(ratio, data) {
      return data.set(data.t, data.p, ratio === 1 ? data.e : Math.round((data.s + data.c * ratio) * 1e4) / 1e4 + data.u, data);
    };
    _renderCSSPropWithBeginning = function _renderCSSPropWithBeginning2(ratio, data) {
      return data.set(data.t, data.p, ratio ? Math.round((data.s + data.c * ratio) * 1e4) / 1e4 + data.u : data.b, data);
    };
    _renderRoundedCSSProp = function _renderRoundedCSSProp2(ratio, data) {
      var value = data.s + data.c * ratio;
      data.set(data.t, data.p, ~~(value + (value < 0 ? -0.5 : 0.5)) + data.u, data);
    };
    _renderNonTweeningValue = function _renderNonTweeningValue2(ratio, data) {
      return data.set(data.t, data.p, ratio ? data.e : data.b, data);
    };
    _renderNonTweeningValueOnlyAtEnd = function _renderNonTweeningValueOnlyAtEnd2(ratio, data) {
      return data.set(data.t, data.p, ratio !== 1 ? data.b : data.e, data);
    };
    _setterCSSStyle = function _setterCSSStyle2(target, property, value) {
      return target.style[property] = value;
    };
    _setterCSSProp = function _setterCSSProp2(target, property, value) {
      return target.style.setProperty(property, value);
    };
    _setterTransform = function _setterTransform2(target, property, value) {
      return target._gsap[property] = value;
    };
    _setterScale = function _setterScale2(target, property, value) {
      return target._gsap.scaleX = target._gsap.scaleY = value;
    };
    _setterScaleWithRender = function _setterScaleWithRender2(target, property, value, data, ratio) {
      var cache2 = target._gsap;
      cache2.scaleX = cache2.scaleY = value;
      cache2.renderTransform(ratio, cache2);
    };
    _setterTransformWithRender = function _setterTransformWithRender2(target, property, value, data, ratio) {
      var cache2 = target._gsap;
      cache2[property] = value;
      cache2.renderTransform(ratio, cache2);
    };
    _transformProp = "transform";
    _transformOriginProp = _transformProp + "Origin";
    _saveStyle = function _saveStyle2(property, isNotCSS) {
      var _this = this;
      var target = this.target, style = target.style, cache2 = target._gsap;
      if (property in _transformProps && style) {
        this.tfm = this.tfm || {};
        if (property !== "transform") {
          property = _propertyAliases[property] || property;
          ~property.indexOf(",") ? property.split(",").forEach(function(a) {
            return _this.tfm[a] = _get(target, a);
          }) : this.tfm[property] = cache2.x ? cache2[property] : _get(target, property);
          property === _transformOriginProp && (this.tfm.zOrigin = cache2.zOrigin);
        } else {
          return _propertyAliases.transform.split(",").forEach(function(p) {
            return _saveStyle2.call(_this, p, isNotCSS);
          });
        }
        if (this.props.indexOf(_transformProp) >= 0) {
          return;
        }
        if (cache2.svg) {
          this.svgo = target.getAttribute("data-svg-origin");
          this.props.push(_transformOriginProp, isNotCSS, "");
        }
        property = _transformProp;
      }
      (style || isNotCSS) && this.props.push(property, isNotCSS, style[property]);
    };
    _removeIndependentTransforms = function _removeIndependentTransforms2(style) {
      if (style.translate) {
        style.removeProperty("translate");
        style.removeProperty("scale");
        style.removeProperty("rotate");
      }
    };
    _revertStyle = function _revertStyle2() {
      var props = this.props, target = this.target, style = target.style, cache2 = target._gsap, i, p;
      for (i = 0; i < props.length; i += 3) {
        props[i + 1] ? target[props[i]] = props[i + 2] : props[i + 2] ? style[props[i]] = props[i + 2] : style.removeProperty(props[i].substr(0, 2) === "--" ? props[i] : props[i].replace(_capsExp, "-$1").toLowerCase());
      }
      if (this.tfm) {
        for (p in this.tfm) {
          cache2[p] = this.tfm[p];
        }
        if (cache2.svg) {
          cache2.renderTransform();
          target.setAttribute("data-svg-origin", this.svgo || "");
        }
        i = _reverting2();
        if ((!i || !i.isStart) && !style[_transformProp]) {
          _removeIndependentTransforms(style);
          if (cache2.zOrigin && style[_transformOriginProp]) {
            style[_transformOriginProp] += " " + cache2.zOrigin + "px";
            cache2.zOrigin = 0;
            cache2.renderTransform();
          }
          cache2.uncache = 1;
        }
      }
    };
    _getStyleSaver = function _getStyleSaver2(target, properties) {
      var saver = {
        target,
        props: [],
        revert: _revertStyle,
        save: _saveStyle
      };
      target._gsap || gsap.core.getCache(target);
      properties && properties.split(",").forEach(function(p) {
        return saver.save(p);
      });
      return saver;
    };
    _createElement = function _createElement2(type, ns) {
      var e = _doc2.createElementNS ? _doc2.createElementNS((ns || "http://www.w3.org/1999/xhtml").replace(/^https/, "http"), type) : _doc2.createElement(type);
      return e && e.style ? e : _doc2.createElement(type);
    };
    _getComputedProperty = function _getComputedProperty2(target, property, skipPrefixFallback) {
      var cs = getComputedStyle(target);
      return cs[property] || cs.getPropertyValue(property.replace(_capsExp, "-$1").toLowerCase()) || cs.getPropertyValue(property) || !skipPrefixFallback && _getComputedProperty2(target, _checkPropPrefix(property) || property, 1) || "";
    };
    _prefixes = "O,Moz,ms,Ms,Webkit".split(",");
    _checkPropPrefix = function _checkPropPrefix2(property, element, preferPrefix) {
      var e = element || _tempDiv, s = e.style, i = 5;
      if (property in s && !preferPrefix) {
        return property;
      }
      property = property.charAt(0).toUpperCase() + property.substr(1);
      while (i-- && !(_prefixes[i] + property in s)) {
      }
      return i < 0 ? null : (i === 3 ? "ms" : i >= 0 ? _prefixes[i] : "") + property;
    };
    _initCore = function _initCore2() {
      if (_windowExists3() && window.document) {
        _win2 = window;
        _doc2 = _win2.document;
        _docElement = _doc2.documentElement;
        _tempDiv = _createElement("div") || {
          style: {}
        };
        _tempDivStyler = _createElement("div");
        _transformProp = _checkPropPrefix(_transformProp);
        _transformOriginProp = _transformProp + "Origin";
        _tempDiv.style.cssText = "border-width:0;line-height:0;position:absolute;padding:0";
        _supports3D = !!_checkPropPrefix("perspective");
        _reverting2 = gsap.core.reverting;
        _pluginInitted = 1;
      }
    };
    _getBBoxHack = function _getBBoxHack2(swapIfPossible) {
      var svg = _createElement("svg", this.ownerSVGElement && this.ownerSVGElement.getAttribute("xmlns") || "http://www.w3.org/2000/svg"), oldParent = this.parentNode, oldSibling = this.nextSibling, oldCSS = this.style.cssText, bbox;
      _docElement.appendChild(svg);
      svg.appendChild(this);
      this.style.display = "block";
      if (swapIfPossible) {
        try {
          bbox = this.getBBox();
          this._gsapBBox = this.getBBox;
          this.getBBox = _getBBoxHack2;
        } catch (e) {
        }
      } else if (this._gsapBBox) {
        bbox = this._gsapBBox();
      }
      if (oldParent) {
        if (oldSibling) {
          oldParent.insertBefore(this, oldSibling);
        } else {
          oldParent.appendChild(this);
        }
      }
      _docElement.removeChild(svg);
      this.style.cssText = oldCSS;
      return bbox;
    };
    _getAttributeFallbacks = function _getAttributeFallbacks2(target, attributesArray) {
      var i = attributesArray.length;
      while (i--) {
        if (target.hasAttribute(attributesArray[i])) {
          return target.getAttribute(attributesArray[i]);
        }
      }
    };
    _getBBox = function _getBBox2(target) {
      var bounds;
      try {
        bounds = target.getBBox();
      } catch (error) {
        bounds = _getBBoxHack.call(target, true);
      }
      bounds && (bounds.width || bounds.height) || target.getBBox === _getBBoxHack || (bounds = _getBBoxHack.call(target, true));
      return bounds && !bounds.width && !bounds.x && !bounds.y ? {
        x: +_getAttributeFallbacks(target, ["x", "cx", "x1"]) || 0,
        y: +_getAttributeFallbacks(target, ["y", "cy", "y1"]) || 0,
        width: 0,
        height: 0
      } : bounds;
    };
    _isSVG = function _isSVG2(e) {
      return !!(e.getCTM && (!e.parentNode || e.ownerSVGElement) && _getBBox(e));
    };
    _removeProperty = function _removeProperty2(target, property) {
      if (property) {
        var style = target.style, first2Chars;
        if (property in _transformProps && property !== _transformOriginProp) {
          property = _transformProp;
        }
        if (style.removeProperty) {
          first2Chars = property.substr(0, 2);
          if (first2Chars === "ms" || property.substr(0, 6) === "webkit") {
            property = "-" + property;
          }
          style.removeProperty(first2Chars === "--" ? property : property.replace(_capsExp, "-$1").toLowerCase());
        } else {
          style.removeAttribute(property);
        }
      }
    };
    _addNonTweeningPT = function _addNonTweeningPT2(plugin, target, property, beginning, end, onlySetAtEnd) {
      var pt = new PropTween(plugin._pt, target, property, 0, 1, onlySetAtEnd ? _renderNonTweeningValueOnlyAtEnd : _renderNonTweeningValue);
      plugin._pt = pt;
      pt.b = beginning;
      pt.e = end;
      plugin._props.push(property);
      return pt;
    };
    _nonConvertibleUnits = {
      deg: 1,
      rad: 1,
      turn: 1
    };
    _nonStandardLayouts = {
      grid: 1,
      flex: 1
    };
    _convertToUnit = function _convertToUnit2(target, property, value, unit) {
      var curValue = parseFloat(value) || 0, curUnit = (value + "").trim().substr((curValue + "").length) || "px", style = _tempDiv.style, horizontal = _horizontalExp.test(property), isRootSVG = target.tagName.toLowerCase() === "svg", measureProperty = (isRootSVG ? "client" : "offset") + (horizontal ? "Width" : "Height"), amount = 100, toPixels = unit === "px", toPercent = unit === "%", px2, parent, cache2, isSVG;
      if (unit === curUnit || !curValue || _nonConvertibleUnits[unit] || _nonConvertibleUnits[curUnit]) {
        return curValue;
      }
      curUnit !== "px" && !toPixels && (curValue = _convertToUnit2(target, property, value, "px"));
      isSVG = target.getCTM && _isSVG(target);
      if ((toPercent || curUnit === "%") && (_transformProps[property] || ~property.indexOf("adius"))) {
        px2 = isSVG ? target.getBBox()[horizontal ? "width" : "height"] : target[measureProperty];
        return _round(toPercent ? curValue / px2 * amount : curValue / 100 * px2);
      }
      style[horizontal ? "width" : "height"] = amount + (toPixels ? curUnit : unit);
      parent = ~property.indexOf("adius") || unit === "em" && target.appendChild && !isRootSVG ? target : target.parentNode;
      if (isSVG) {
        parent = (target.ownerSVGElement || {}).parentNode;
      }
      if (!parent || parent === _doc2 || !parent.appendChild) {
        parent = _doc2.body;
      }
      cache2 = parent._gsap;
      if (cache2 && toPercent && cache2.width && horizontal && cache2.time === _ticker.time && !cache2.uncache) {
        return _round(curValue / cache2.width * amount);
      } else {
        if (toPercent && (property === "height" || property === "width")) {
          var v = target.style[property];
          target.style[property] = amount + unit;
          px2 = target[measureProperty];
          v ? target.style[property] = v : _removeProperty(target, property);
        } else {
          (toPercent || curUnit === "%") && !_nonStandardLayouts[_getComputedProperty(parent, "display")] && (style.position = _getComputedProperty(target, "position"));
          parent === target && (style.position = "static");
          parent.appendChild(_tempDiv);
          px2 = _tempDiv[measureProperty];
          parent.removeChild(_tempDiv);
          style.position = "absolute";
        }
        if (horizontal && toPercent) {
          cache2 = _getCache(parent);
          cache2.time = _ticker.time;
          cache2.width = parent[measureProperty];
        }
      }
      return _round(toPixels ? px2 * curValue / amount : px2 && curValue ? amount / px2 * curValue : 0);
    };
    _get = function _get2(target, property, unit, uncache) {
      var value;
      _pluginInitted || _initCore();
      if (property in _propertyAliases && property !== "transform") {
        property = _propertyAliases[property];
        if (~property.indexOf(",")) {
          property = property.split(",")[0];
        }
      }
      if (_transformProps[property] && property !== "transform") {
        value = _parseTransform(target, uncache);
        value = property !== "transformOrigin" ? value[property] : value.svg ? value.origin : _firstTwoOnly(_getComputedProperty(target, _transformOriginProp)) + " " + value.zOrigin + "px";
      } else {
        value = target.style[property];
        if (!value || value === "auto" || uncache || ~(value + "").indexOf("calc(")) {
          value = _specialProps[property] && _specialProps[property](target, property, unit) || _getComputedProperty(target, property) || _getProperty(target, property) || (property === "opacity" ? 1 : 0);
        }
      }
      return unit && !~(value + "").trim().indexOf(" ") ? _convertToUnit(target, property, value, unit) + unit : value;
    };
    _tweenComplexCSSString = function _tweenComplexCSSString2(target, prop, start, end) {
      if (!start || start === "none") {
        var p = _checkPropPrefix(prop, target, 1), s = p && _getComputedProperty(target, p, 1);
        if (s && s !== start) {
          prop = p;
          start = s;
        } else if (prop === "borderColor") {
          start = _getComputedProperty(target, "borderTopColor");
        }
      }
      var pt = new PropTween(this._pt, target.style, prop, 0, 1, _renderComplexString), index = 0, matchIndex = 0, a, result, startValues, startNum, color, startValue, endValue, endNum, chunk, endUnit, startUnit, endValues;
      pt.b = start;
      pt.e = end;
      start += "";
      end += "";
      if (end === "auto") {
        startValue = target.style[prop];
        target.style[prop] = end;
        end = _getComputedProperty(target, prop) || end;
        startValue ? target.style[prop] = startValue : _removeProperty(target, prop);
      }
      a = [start, end];
      _colorStringFilter(a);
      start = a[0];
      end = a[1];
      startValues = start.match(_numWithUnitExp) || [];
      endValues = end.match(_numWithUnitExp) || [];
      if (endValues.length) {
        while (result = _numWithUnitExp.exec(end)) {
          endValue = result[0];
          chunk = end.substring(index, result.index);
          if (color) {
            color = (color + 1) % 5;
          } else if (chunk.substr(-5) === "rgba(" || chunk.substr(-5) === "hsla(") {
            color = 1;
          }
          if (endValue !== (startValue = startValues[matchIndex++] || "")) {
            startNum = parseFloat(startValue) || 0;
            startUnit = startValue.substr((startNum + "").length);
            endValue.charAt(1) === "=" && (endValue = _parseRelative(startNum, endValue) + startUnit);
            endNum = parseFloat(endValue);
            endUnit = endValue.substr((endNum + "").length);
            index = _numWithUnitExp.lastIndex - endUnit.length;
            if (!endUnit) {
              endUnit = endUnit || _config.units[prop] || startUnit;
              if (index === end.length) {
                end += endUnit;
                pt.e += endUnit;
              }
            }
            if (startUnit !== endUnit) {
              startNum = _convertToUnit(target, prop, startValue, endUnit) || 0;
            }
            pt._pt = {
              _next: pt._pt,
              p: chunk || matchIndex === 1 ? chunk : ",",
              //note: SVG spec allows omission of comma/space when a negative sign is wedged between two numbers, like 2.5-5.3 instead of 2.5,-5.3 but when tweening, the negative value may switch to positive, so we insert the comma just in case.
              s: startNum,
              c: endNum - startNum,
              m: color && color < 4 || prop === "zIndex" ? Math.round : 0
            };
          }
        }
        pt.c = index < end.length ? end.substring(index, end.length) : "";
      } else {
        pt.r = prop === "display" && end === "none" ? _renderNonTweeningValueOnlyAtEnd : _renderNonTweeningValue;
      }
      _relExp.test(end) && (pt.e = 0);
      this._pt = pt;
      return pt;
    };
    _keywordToPercent = {
      top: "0%",
      bottom: "100%",
      left: "0%",
      right: "100%",
      center: "50%"
    };
    _convertKeywordsToPercentages = function _convertKeywordsToPercentages2(value) {
      var split = value.split(" "), x = split[0], y = split[1] || "50%";
      if (x === "top" || x === "bottom" || y === "left" || y === "right") {
        value = x;
        x = y;
        y = value;
      }
      split[0] = _keywordToPercent[x] || x;
      split[1] = _keywordToPercent[y] || y;
      return split.join(" ");
    };
    _renderClearProps = function _renderClearProps2(ratio, data) {
      if (data.tween && data.tween._time === data.tween._dur) {
        var target = data.t, style = target.style, props = data.u, cache2 = target._gsap, prop, clearTransforms, i;
        if (props === "all" || props === true) {
          style.cssText = "";
          clearTransforms = 1;
        } else {
          props = props.split(",");
          i = props.length;
          while (--i > -1) {
            prop = props[i];
            if (_transformProps[prop]) {
              clearTransforms = 1;
              prop = prop === "transformOrigin" ? _transformOriginProp : _transformProp;
            }
            _removeProperty(target, prop);
          }
        }
        if (clearTransforms) {
          _removeProperty(target, _transformProp);
          if (cache2) {
            cache2.svg && target.removeAttribute("transform");
            _parseTransform(target, 1);
            cache2.uncache = 1;
            _removeIndependentTransforms(style);
          }
        }
      }
    };
    _specialProps = {
      clearProps: function clearProps(plugin, target, property, endValue, tween) {
        if (tween.data !== "isFromStart") {
          var pt = plugin._pt = new PropTween(plugin._pt, target, property, 0, 0, _renderClearProps);
          pt.u = endValue;
          pt.pr = -10;
          pt.tween = tween;
          plugin._props.push(property);
          return 1;
        }
      }
      /* className feature (about 0.4kb gzipped).
      , className(plugin, target, property, endValue, tween) {
      	let _renderClassName = (ratio, data) => {
      			data.css.render(ratio, data.css);
      			if (!ratio || ratio === 1) {
      				let inline = data.rmv,
      					target = data.t,
      					p;
      				target.setAttribute("class", ratio ? data.e : data.b);
      				for (p in inline) {
      					_removeProperty(target, p);
      				}
      			}
      		},
      		_getAllStyles = (target) => {
      			let styles = {},
      				computed = getComputedStyle(target),
      				p;
      			for (p in computed) {
      				if (isNaN(p) && p !== "cssText" && p !== "length") {
      					styles[p] = computed[p];
      				}
      			}
      			_setDefaults(styles, _parseTransform(target, 1));
      			return styles;
      		},
      		startClassList = target.getAttribute("class"),
      		style = target.style,
      		cssText = style.cssText,
      		cache = target._gsap,
      		classPT = cache.classPT,
      		inlineToRemoveAtEnd = {},
      		data = {t:target, plugin:plugin, rmv:inlineToRemoveAtEnd, b:startClassList, e:(endValue.charAt(1) !== "=") ? endValue : startClassList.replace(new RegExp("(?:\\s|^)" + endValue.substr(2) + "(?![\\w-])"), "") + ((endValue.charAt(0) === "+") ? " " + endValue.substr(2) : "")},
      		changingVars = {},
      		startVars = _getAllStyles(target),
      		transformRelated = /(transform|perspective)/i,
      		endVars, p;
      	if (classPT) {
      		classPT.r(1, classPT.d);
      		_removeLinkedListItem(classPT.d.plugin, classPT, "_pt");
      	}
      	target.setAttribute("class", data.e);
      	endVars = _getAllStyles(target, true);
      	target.setAttribute("class", startClassList);
      	for (p in endVars) {
      		if (endVars[p] !== startVars[p] && !transformRelated.test(p)) {
      			changingVars[p] = endVars[p];
      			if (!style[p] && style[p] !== "0") {
      				inlineToRemoveAtEnd[p] = 1;
      			}
      		}
      	}
      	cache.classPT = plugin._pt = new PropTween(plugin._pt, target, "className", 0, 0, _renderClassName, data, 0, -11);
      	if (style.cssText !== cssText) { //only apply if things change. Otherwise, in cases like a background-image that's pulled dynamically, it could cause a refresh. See https://gsap.com/forums/topic/20368-possible-gsap-bug-switching-classnames-in-chrome/.
      		style.cssText = cssText; //we recorded cssText before we swapped classes and ran _getAllStyles() because in cases when a className tween is overwritten, we remove all the related tweening properties from that class change (otherwise class-specific stuff can't override properties we've directly set on the target's style object due to specificity).
      	}
      	_parseTransform(target, true); //to clear the caching of transforms
      	data.css = new gsap.plugins.css();
      	data.css.init(target, changingVars, tween);
      	plugin._props.push(...data.css._props);
      	return 1;
      }
      */
    };
    _identity2DMatrix = [1, 0, 0, 1, 0, 0];
    _rotationalProperties = {};
    _isNullTransform = function _isNullTransform2(value) {
      return value === "matrix(1, 0, 0, 1, 0, 0)" || value === "none" || !value;
    };
    _getComputedTransformMatrixAsArray = function _getComputedTransformMatrixAsArray2(target) {
      var matrixString = _getComputedProperty(target, _transformProp);
      return _isNullTransform(matrixString) ? _identity2DMatrix : matrixString.substr(7).match(_numExp).map(_round);
    };
    _getMatrix = function _getMatrix2(target, force2D) {
      var cache2 = target._gsap || _getCache(target), style = target.style, matrix = _getComputedTransformMatrixAsArray(target), parent, nextSibling, temp, addedToDOM;
      if (cache2.svg && target.getAttribute("transform")) {
        temp = target.transform.baseVal.consolidate().matrix;
        matrix = [temp.a, temp.b, temp.c, temp.d, temp.e, temp.f];
        return matrix.join(",") === "1,0,0,1,0,0" ? _identity2DMatrix : matrix;
      } else if (matrix === _identity2DMatrix && !target.offsetParent && target !== _docElement && !cache2.svg) {
        temp = style.display;
        style.display = "block";
        parent = target.parentNode;
        if (!parent || !target.offsetParent) {
          addedToDOM = 1;
          nextSibling = target.nextElementSibling;
          _docElement.appendChild(target);
        }
        matrix = _getComputedTransformMatrixAsArray(target);
        temp ? style.display = temp : _removeProperty(target, "display");
        if (addedToDOM) {
          nextSibling ? parent.insertBefore(target, nextSibling) : parent ? parent.appendChild(target) : _docElement.removeChild(target);
        }
      }
      return force2D && matrix.length > 6 ? [matrix[0], matrix[1], matrix[4], matrix[5], matrix[12], matrix[13]] : matrix;
    };
    _applySVGOrigin = function _applySVGOrigin2(target, origin, originIsAbsolute, smooth, matrixArray, pluginToAddPropTweensTo) {
      var cache2 = target._gsap, matrix = matrixArray || _getMatrix(target, true), xOriginOld = cache2.xOrigin || 0, yOriginOld = cache2.yOrigin || 0, xOffsetOld = cache2.xOffset || 0, yOffsetOld = cache2.yOffset || 0, a = matrix[0], b = matrix[1], c = matrix[2], d = matrix[3], tx = matrix[4], ty = matrix[5], originSplit = origin.split(" "), xOrigin = parseFloat(originSplit[0]) || 0, yOrigin = parseFloat(originSplit[1]) || 0, bounds, determinant, x, y;
      if (!originIsAbsolute) {
        bounds = _getBBox(target);
        xOrigin = bounds.x + (~originSplit[0].indexOf("%") ? xOrigin / 100 * bounds.width : xOrigin);
        yOrigin = bounds.y + (~(originSplit[1] || originSplit[0]).indexOf("%") ? yOrigin / 100 * bounds.height : yOrigin);
      } else if (matrix !== _identity2DMatrix && (determinant = a * d - b * c)) {
        x = xOrigin * (d / determinant) + yOrigin * (-c / determinant) + (c * ty - d * tx) / determinant;
        y = xOrigin * (-b / determinant) + yOrigin * (a / determinant) - (a * ty - b * tx) / determinant;
        xOrigin = x;
        yOrigin = y;
      }
      if (smooth || smooth !== false && cache2.smooth) {
        tx = xOrigin - xOriginOld;
        ty = yOrigin - yOriginOld;
        cache2.xOffset = xOffsetOld + (tx * a + ty * c) - tx;
        cache2.yOffset = yOffsetOld + (tx * b + ty * d) - ty;
      } else {
        cache2.xOffset = cache2.yOffset = 0;
      }
      cache2.xOrigin = xOrigin;
      cache2.yOrigin = yOrigin;
      cache2.smooth = !!smooth;
      cache2.origin = origin;
      cache2.originIsAbsolute = !!originIsAbsolute;
      target.style[_transformOriginProp] = "0px 0px";
      if (pluginToAddPropTweensTo) {
        _addNonTweeningPT(pluginToAddPropTweensTo, cache2, "xOrigin", xOriginOld, xOrigin);
        _addNonTweeningPT(pluginToAddPropTweensTo, cache2, "yOrigin", yOriginOld, yOrigin);
        _addNonTweeningPT(pluginToAddPropTweensTo, cache2, "xOffset", xOffsetOld, cache2.xOffset);
        _addNonTweeningPT(pluginToAddPropTweensTo, cache2, "yOffset", yOffsetOld, cache2.yOffset);
      }
      target.setAttribute("data-svg-origin", xOrigin + " " + yOrigin);
    };
    _parseTransform = function _parseTransform2(target, uncache) {
      var cache2 = target._gsap || new GSCache(target);
      if ("x" in cache2 && !uncache && !cache2.uncache) {
        return cache2;
      }
      var style = target.style, invertedScaleX = cache2.scaleX < 0, px2 = "px", deg = "deg", cs = getComputedStyle(target), origin = _getComputedProperty(target, _transformOriginProp) || "0", x, y, z, scaleX, scaleY, rotation, rotationX, rotationY, skewX, skewY, perspective, xOrigin, yOrigin, matrix, angle, cos, sin, a, b, c, d, a12, a22, t1, t2, t3, a13, a23, a33, a42, a43, a32;
      x = y = z = rotation = rotationX = rotationY = skewX = skewY = perspective = 0;
      scaleX = scaleY = 1;
      cache2.svg = !!(target.getCTM && _isSVG(target));
      if (cs.translate) {
        if (cs.translate !== "none" || cs.scale !== "none" || cs.rotate !== "none") {
          style[_transformProp] = (cs.translate !== "none" ? "translate3d(" + (cs.translate + " 0 0").split(" ").slice(0, 3).join(", ") + ") " : "") + (cs.rotate !== "none" ? "rotate(" + cs.rotate + ") " : "") + (cs.scale !== "none" ? "scale(" + cs.scale.split(" ").join(",") + ") " : "") + (cs[_transformProp] !== "none" ? cs[_transformProp] : "");
        }
        style.scale = style.rotate = style.translate = "none";
      }
      matrix = _getMatrix(target, cache2.svg);
      if (cache2.svg) {
        if (cache2.uncache) {
          t2 = target.getBBox();
          origin = cache2.xOrigin - t2.x + "px " + (cache2.yOrigin - t2.y) + "px";
          t1 = "";
        } else {
          t1 = !uncache && target.getAttribute("data-svg-origin");
        }
        _applySVGOrigin(target, t1 || origin, !!t1 || cache2.originIsAbsolute, cache2.smooth !== false, matrix);
      }
      xOrigin = cache2.xOrigin || 0;
      yOrigin = cache2.yOrigin || 0;
      if (matrix !== _identity2DMatrix) {
        a = matrix[0];
        b = matrix[1];
        c = matrix[2];
        d = matrix[3];
        x = a12 = matrix[4];
        y = a22 = matrix[5];
        if (matrix.length === 6) {
          scaleX = Math.sqrt(a * a + b * b);
          scaleY = Math.sqrt(d * d + c * c);
          rotation = a || b ? _atan2(b, a) * _RAD2DEG : 0;
          skewX = c || d ? _atan2(c, d) * _RAD2DEG + rotation : 0;
          skewX && (scaleY *= Math.abs(Math.cos(skewX * _DEG2RAD)));
          if (cache2.svg) {
            x -= xOrigin - (xOrigin * a + yOrigin * c);
            y -= yOrigin - (xOrigin * b + yOrigin * d);
          }
        } else {
          a32 = matrix[6];
          a42 = matrix[7];
          a13 = matrix[8];
          a23 = matrix[9];
          a33 = matrix[10];
          a43 = matrix[11];
          x = matrix[12];
          y = matrix[13];
          z = matrix[14];
          angle = _atan2(a32, a33);
          rotationX = angle * _RAD2DEG;
          if (angle) {
            cos = Math.cos(-angle);
            sin = Math.sin(-angle);
            t1 = a12 * cos + a13 * sin;
            t2 = a22 * cos + a23 * sin;
            t3 = a32 * cos + a33 * sin;
            a13 = a12 * -sin + a13 * cos;
            a23 = a22 * -sin + a23 * cos;
            a33 = a32 * -sin + a33 * cos;
            a43 = a42 * -sin + a43 * cos;
            a12 = t1;
            a22 = t2;
            a32 = t3;
          }
          angle = _atan2(-c, a33);
          rotationY = angle * _RAD2DEG;
          if (angle) {
            cos = Math.cos(-angle);
            sin = Math.sin(-angle);
            t1 = a * cos - a13 * sin;
            t2 = b * cos - a23 * sin;
            t3 = c * cos - a33 * sin;
            a43 = d * sin + a43 * cos;
            a = t1;
            b = t2;
            c = t3;
          }
          angle = _atan2(b, a);
          rotation = angle * _RAD2DEG;
          if (angle) {
            cos = Math.cos(angle);
            sin = Math.sin(angle);
            t1 = a * cos + b * sin;
            t2 = a12 * cos + a22 * sin;
            b = b * cos - a * sin;
            a22 = a22 * cos - a12 * sin;
            a = t1;
            a12 = t2;
          }
          if (rotationX && Math.abs(rotationX) + Math.abs(rotation) > 359.9) {
            rotationX = rotation = 0;
            rotationY = 180 - rotationY;
          }
          scaleX = _round(Math.sqrt(a * a + b * b + c * c));
          scaleY = _round(Math.sqrt(a22 * a22 + a32 * a32));
          angle = _atan2(a12, a22);
          skewX = Math.abs(angle) > 2e-4 ? angle * _RAD2DEG : 0;
          perspective = a43 ? 1 / (a43 < 0 ? -a43 : a43) : 0;
        }
        if (cache2.svg) {
          t1 = target.getAttribute("transform");
          cache2.forceCSS = target.setAttribute("transform", "") || !_isNullTransform(_getComputedProperty(target, _transformProp));
          t1 && target.setAttribute("transform", t1);
        }
      }
      if (Math.abs(skewX) > 90 && Math.abs(skewX) < 270) {
        if (invertedScaleX) {
          scaleX *= -1;
          skewX += rotation <= 0 ? 180 : -180;
          rotation += rotation <= 0 ? 180 : -180;
        } else {
          scaleY *= -1;
          skewX += skewX <= 0 ? 180 : -180;
        }
      }
      uncache = uncache || cache2.uncache;
      cache2.x = x - ((cache2.xPercent = x && (!uncache && cache2.xPercent || (Math.round(target.offsetWidth / 2) === Math.round(-x) ? -50 : 0))) ? target.offsetWidth * cache2.xPercent / 100 : 0) + px2;
      cache2.y = y - ((cache2.yPercent = y && (!uncache && cache2.yPercent || (Math.round(target.offsetHeight / 2) === Math.round(-y) ? -50 : 0))) ? target.offsetHeight * cache2.yPercent / 100 : 0) + px2;
      cache2.z = z + px2;
      cache2.scaleX = _round(scaleX);
      cache2.scaleY = _round(scaleY);
      cache2.rotation = _round(rotation) + deg;
      cache2.rotationX = _round(rotationX) + deg;
      cache2.rotationY = _round(rotationY) + deg;
      cache2.skewX = skewX + deg;
      cache2.skewY = skewY + deg;
      cache2.transformPerspective = perspective + px2;
      if (cache2.zOrigin = parseFloat(origin.split(" ")[2]) || !uncache && cache2.zOrigin || 0) {
        style[_transformOriginProp] = _firstTwoOnly(origin);
      }
      cache2.xOffset = cache2.yOffset = 0;
      cache2.force3D = _config.force3D;
      cache2.renderTransform = cache2.svg ? _renderSVGTransforms : _supports3D ? _renderCSSTransforms : _renderNon3DTransforms;
      cache2.uncache = 0;
      return cache2;
    };
    _firstTwoOnly = function _firstTwoOnly2(value) {
      return (value = value.split(" "))[0] + " " + value[1];
    };
    _addPxTranslate = function _addPxTranslate2(target, start, value) {
      var unit = getUnit(start);
      return _round(parseFloat(start) + parseFloat(_convertToUnit(target, "x", value + "px", unit))) + unit;
    };
    _renderNon3DTransforms = function _renderNon3DTransforms2(ratio, cache2) {
      cache2.z = "0px";
      cache2.rotationY = cache2.rotationX = "0deg";
      cache2.force3D = 0;
      _renderCSSTransforms(ratio, cache2);
    };
    _zeroDeg = "0deg";
    _zeroPx = "0px";
    _endParenthesis = ") ";
    _renderCSSTransforms = function _renderCSSTransforms2(ratio, cache2) {
      var _ref = cache2 || this, xPercent = _ref.xPercent, yPercent = _ref.yPercent, x = _ref.x, y = _ref.y, z = _ref.z, rotation = _ref.rotation, rotationY = _ref.rotationY, rotationX = _ref.rotationX, skewX = _ref.skewX, skewY = _ref.skewY, scaleX = _ref.scaleX, scaleY = _ref.scaleY, transformPerspective = _ref.transformPerspective, force3D = _ref.force3D, target = _ref.target, zOrigin = _ref.zOrigin, transforms = "", use3D = force3D === "auto" && ratio && ratio !== 1 || force3D === true;
      if (zOrigin && (rotationX !== _zeroDeg || rotationY !== _zeroDeg)) {
        var angle = parseFloat(rotationY) * _DEG2RAD, a13 = Math.sin(angle), a33 = Math.cos(angle), cos;
        angle = parseFloat(rotationX) * _DEG2RAD;
        cos = Math.cos(angle);
        x = _addPxTranslate(target, x, a13 * cos * -zOrigin);
        y = _addPxTranslate(target, y, -Math.sin(angle) * -zOrigin);
        z = _addPxTranslate(target, z, a33 * cos * -zOrigin + zOrigin);
      }
      if (transformPerspective !== _zeroPx) {
        transforms += "perspective(" + transformPerspective + _endParenthesis;
      }
      if (xPercent || yPercent) {
        transforms += "translate(" + xPercent + "%, " + yPercent + "%) ";
      }
      if (use3D || x !== _zeroPx || y !== _zeroPx || z !== _zeroPx) {
        transforms += z !== _zeroPx || use3D ? "translate3d(" + x + ", " + y + ", " + z + ") " : "translate(" + x + ", " + y + _endParenthesis;
      }
      if (rotation !== _zeroDeg) {
        transforms += "rotate(" + rotation + _endParenthesis;
      }
      if (rotationY !== _zeroDeg) {
        transforms += "rotateY(" + rotationY + _endParenthesis;
      }
      if (rotationX !== _zeroDeg) {
        transforms += "rotateX(" + rotationX + _endParenthesis;
      }
      if (skewX !== _zeroDeg || skewY !== _zeroDeg) {
        transforms += "skew(" + skewX + ", " + skewY + _endParenthesis;
      }
      if (scaleX !== 1 || scaleY !== 1) {
        transforms += "scale(" + scaleX + ", " + scaleY + _endParenthesis;
      }
      target.style[_transformProp] = transforms || "translate(0, 0)";
    };
    _renderSVGTransforms = function _renderSVGTransforms2(ratio, cache2) {
      var _ref2 = cache2 || this, xPercent = _ref2.xPercent, yPercent = _ref2.yPercent, x = _ref2.x, y = _ref2.y, rotation = _ref2.rotation, skewX = _ref2.skewX, skewY = _ref2.skewY, scaleX = _ref2.scaleX, scaleY = _ref2.scaleY, target = _ref2.target, xOrigin = _ref2.xOrigin, yOrigin = _ref2.yOrigin, xOffset = _ref2.xOffset, yOffset = _ref2.yOffset, forceCSS = _ref2.forceCSS, tx = parseFloat(x), ty = parseFloat(y), a11, a21, a12, a22, temp;
      rotation = parseFloat(rotation);
      skewX = parseFloat(skewX);
      skewY = parseFloat(skewY);
      if (skewY) {
        skewY = parseFloat(skewY);
        skewX += skewY;
        rotation += skewY;
      }
      if (rotation || skewX) {
        rotation *= _DEG2RAD;
        skewX *= _DEG2RAD;
        a11 = Math.cos(rotation) * scaleX;
        a21 = Math.sin(rotation) * scaleX;
        a12 = Math.sin(rotation - skewX) * -scaleY;
        a22 = Math.cos(rotation - skewX) * scaleY;
        if (skewX) {
          skewY *= _DEG2RAD;
          temp = Math.tan(skewX - skewY);
          temp = Math.sqrt(1 + temp * temp);
          a12 *= temp;
          a22 *= temp;
          if (skewY) {
            temp = Math.tan(skewY);
            temp = Math.sqrt(1 + temp * temp);
            a11 *= temp;
            a21 *= temp;
          }
        }
        a11 = _round(a11);
        a21 = _round(a21);
        a12 = _round(a12);
        a22 = _round(a22);
      } else {
        a11 = scaleX;
        a22 = scaleY;
        a21 = a12 = 0;
      }
      if (tx && !~(x + "").indexOf("px") || ty && !~(y + "").indexOf("px")) {
        tx = _convertToUnit(target, "x", x, "px");
        ty = _convertToUnit(target, "y", y, "px");
      }
      if (xOrigin || yOrigin || xOffset || yOffset) {
        tx = _round(tx + xOrigin - (xOrigin * a11 + yOrigin * a12) + xOffset);
        ty = _round(ty + yOrigin - (xOrigin * a21 + yOrigin * a22) + yOffset);
      }
      if (xPercent || yPercent) {
        temp = target.getBBox();
        tx = _round(tx + xPercent / 100 * temp.width);
        ty = _round(ty + yPercent / 100 * temp.height);
      }
      temp = "matrix(" + a11 + "," + a21 + "," + a12 + "," + a22 + "," + tx + "," + ty + ")";
      target.setAttribute("transform", temp);
      forceCSS && (target.style[_transformProp] = temp);
    };
    _addRotationalPropTween = function _addRotationalPropTween2(plugin, target, property, startNum, endValue) {
      var cap = 360, isString = _isString(endValue), endNum = parseFloat(endValue) * (isString && ~endValue.indexOf("rad") ? _RAD2DEG : 1), change = endNum - startNum, finalValue = startNum + change + "deg", direction, pt;
      if (isString) {
        direction = endValue.split("_")[1];
        if (direction === "short") {
          change %= cap;
          if (change !== change % (cap / 2)) {
            change += change < 0 ? cap : -cap;
          }
        }
        if (direction === "cw" && change < 0) {
          change = (change + cap * _bigNum2) % cap - ~~(change / cap) * cap;
        } else if (direction === "ccw" && change > 0) {
          change = (change - cap * _bigNum2) % cap - ~~(change / cap) * cap;
        }
      }
      plugin._pt = pt = new PropTween(plugin._pt, target, property, startNum, change, _renderPropWithEnd);
      pt.e = finalValue;
      pt.u = "deg";
      plugin._props.push(property);
      return pt;
    };
    _assign = function _assign2(target, source) {
      for (var p in source) {
        target[p] = source[p];
      }
      return target;
    };
    _addRawTransformPTs = function _addRawTransformPTs2(plugin, transforms, target) {
      var startCache = _assign({}, target._gsap), exclude = "perspective,force3D,transformOrigin,svgOrigin", style = target.style, endCache, p, startValue, endValue, startNum, endNum, startUnit, endUnit;
      if (startCache.svg) {
        startValue = target.getAttribute("transform");
        target.setAttribute("transform", "");
        style[_transformProp] = transforms;
        endCache = _parseTransform(target, 1);
        _removeProperty(target, _transformProp);
        target.setAttribute("transform", startValue);
      } else {
        startValue = getComputedStyle(target)[_transformProp];
        style[_transformProp] = transforms;
        endCache = _parseTransform(target, 1);
        style[_transformProp] = startValue;
      }
      for (p in _transformProps) {
        startValue = startCache[p];
        endValue = endCache[p];
        if (startValue !== endValue && exclude.indexOf(p) < 0) {
          startUnit = getUnit(startValue);
          endUnit = getUnit(endValue);
          startNum = startUnit !== endUnit ? _convertToUnit(target, p, startValue, endUnit) : parseFloat(startValue);
          endNum = parseFloat(endValue);
          plugin._pt = new PropTween(plugin._pt, endCache, p, startNum, endNum - startNum, _renderCSSProp);
          plugin._pt.u = endUnit || 0;
          plugin._props.push(p);
        }
      }
      _assign(endCache, startCache);
    };
    _forEachName("padding,margin,Width,Radius", function(name, index) {
      var t = "Top", r = "Right", b = "Bottom", l = "Left", props = (index < 3 ? [t, r, b, l] : [t + l, t + r, b + r, b + l]).map(function(side) {
        return index < 2 ? name + side : "border" + side + name;
      });
      _specialProps[index > 1 ? "border" + name : name] = function(plugin, target, property, endValue, tween) {
        var a, vars;
        if (arguments.length < 4) {
          a = props.map(function(prop) {
            return _get(plugin, prop, property);
          });
          vars = a.join(" ");
          return vars.split(a[0]).length === 5 ? a[0] : vars;
        }
        a = (endValue + "").split(" ");
        vars = {};
        props.forEach(function(prop, i) {
          return vars[prop] = a[i] = a[i] || a[(i - 1) / 2 | 0];
        });
        plugin.init(target, vars, tween);
      };
    });
    CSSPlugin = {
      name: "css",
      register: _initCore,
      targetTest: function targetTest(target) {
        return target.style && target.nodeType;
      },
      init: function init3(target, vars, tween, index, targets) {
        var props = this._props, style = target.style, startAt = tween.vars.startAt, startValue, endValue, endNum, startNum, type, specialProp, p, startUnit, endUnit, relative, isTransformRelated, transformPropTween, cache2, smooth, hasPriority, inlineProps;
        _pluginInitted || _initCore();
        this.styles = this.styles || _getStyleSaver(target);
        inlineProps = this.styles.props;
        this.tween = tween;
        for (p in vars) {
          if (p === "autoRound") {
            continue;
          }
          endValue = vars[p];
          if (_plugins[p] && _checkPlugin(p, vars, tween, index, target, targets)) {
            continue;
          }
          type = typeof endValue;
          specialProp = _specialProps[p];
          if (type === "function") {
            endValue = endValue.call(tween, index, target, targets);
            type = typeof endValue;
          }
          if (type === "string" && ~endValue.indexOf("random(")) {
            endValue = _replaceRandom(endValue);
          }
          if (specialProp) {
            specialProp(this, target, p, endValue, tween) && (hasPriority = 1);
          } else if (p.substr(0, 2) === "--") {
            startValue = (getComputedStyle(target).getPropertyValue(p) + "").trim();
            endValue += "";
            _colorExp.lastIndex = 0;
            if (!_colorExp.test(startValue)) {
              startUnit = getUnit(startValue);
              endUnit = getUnit(endValue);
            }
            endUnit ? startUnit !== endUnit && (startValue = _convertToUnit(target, p, startValue, endUnit) + endUnit) : startUnit && (endValue += startUnit);
            this.add(style, "setProperty", startValue, endValue, index, targets, 0, 0, p);
            props.push(p);
            inlineProps.push(p, 0, style[p]);
          } else if (type !== "undefined") {
            if (startAt && p in startAt) {
              startValue = typeof startAt[p] === "function" ? startAt[p].call(tween, index, target, targets) : startAt[p];
              _isString(startValue) && ~startValue.indexOf("random(") && (startValue = _replaceRandom(startValue));
              getUnit(startValue + "") || startValue === "auto" || (startValue += _config.units[p] || getUnit(_get(target, p)) || "");
              (startValue + "").charAt(1) === "=" && (startValue = _get(target, p));
            } else {
              startValue = _get(target, p);
            }
            startNum = parseFloat(startValue);
            relative = type === "string" && endValue.charAt(1) === "=" && endValue.substr(0, 2);
            relative && (endValue = endValue.substr(2));
            endNum = parseFloat(endValue);
            if (p in _propertyAliases) {
              if (p === "autoAlpha") {
                if (startNum === 1 && _get(target, "visibility") === "hidden" && endNum) {
                  startNum = 0;
                }
                inlineProps.push("visibility", 0, style.visibility);
                _addNonTweeningPT(this, style, "visibility", startNum ? "inherit" : "hidden", endNum ? "inherit" : "hidden", !endNum);
              }
              if (p !== "scale" && p !== "transform") {
                p = _propertyAliases[p];
                ~p.indexOf(",") && (p = p.split(",")[0]);
              }
            }
            isTransformRelated = p in _transformProps;
            if (isTransformRelated) {
              this.styles.save(p);
              if (!transformPropTween) {
                cache2 = target._gsap;
                cache2.renderTransform && !vars.parseTransform || _parseTransform(target, vars.parseTransform);
                smooth = vars.smoothOrigin !== false && cache2.smooth;
                transformPropTween = this._pt = new PropTween(this._pt, style, _transformProp, 0, 1, cache2.renderTransform, cache2, 0, -1);
                transformPropTween.dep = 1;
              }
              if (p === "scale") {
                this._pt = new PropTween(this._pt, cache2, "scaleY", cache2.scaleY, (relative ? _parseRelative(cache2.scaleY, relative + endNum) : endNum) - cache2.scaleY || 0, _renderCSSProp);
                this._pt.u = 0;
                props.push("scaleY", p);
                p += "X";
              } else if (p === "transformOrigin") {
                inlineProps.push(_transformOriginProp, 0, style[_transformOriginProp]);
                endValue = _convertKeywordsToPercentages(endValue);
                if (cache2.svg) {
                  _applySVGOrigin(target, endValue, 0, smooth, 0, this);
                } else {
                  endUnit = parseFloat(endValue.split(" ")[2]) || 0;
                  endUnit !== cache2.zOrigin && _addNonTweeningPT(this, cache2, "zOrigin", cache2.zOrigin, endUnit);
                  _addNonTweeningPT(this, style, p, _firstTwoOnly(startValue), _firstTwoOnly(endValue));
                }
                continue;
              } else if (p === "svgOrigin") {
                _applySVGOrigin(target, endValue, 1, smooth, 0, this);
                continue;
              } else if (p in _rotationalProperties) {
                _addRotationalPropTween(this, cache2, p, startNum, relative ? _parseRelative(startNum, relative + endValue) : endValue);
                continue;
              } else if (p === "smoothOrigin") {
                _addNonTweeningPT(this, cache2, "smooth", cache2.smooth, endValue);
                continue;
              } else if (p === "force3D") {
                cache2[p] = endValue;
                continue;
              } else if (p === "transform") {
                _addRawTransformPTs(this, endValue, target);
                continue;
              }
            } else if (!(p in style)) {
              p = _checkPropPrefix(p) || p;
            }
            if (isTransformRelated || (endNum || endNum === 0) && (startNum || startNum === 0) && !_complexExp.test(endValue) && p in style) {
              startUnit = (startValue + "").substr((startNum + "").length);
              endNum || (endNum = 0);
              endUnit = getUnit(endValue) || (p in _config.units ? _config.units[p] : startUnit);
              startUnit !== endUnit && (startNum = _convertToUnit(target, p, startValue, endUnit));
              this._pt = new PropTween(this._pt, isTransformRelated ? cache2 : style, p, startNum, (relative ? _parseRelative(startNum, relative + endNum) : endNum) - startNum, !isTransformRelated && (endUnit === "px" || p === "zIndex") && vars.autoRound !== false ? _renderRoundedCSSProp : _renderCSSProp);
              this._pt.u = endUnit || 0;
              if (startUnit !== endUnit && endUnit !== "%") {
                this._pt.b = startValue;
                this._pt.r = _renderCSSPropWithBeginning;
              }
            } else if (!(p in style)) {
              if (p in target) {
                this.add(target, p, startValue || target[p], relative ? relative + endValue : endValue, index, targets);
              } else if (p !== "parseTransform") {
                _missingPlugin(p, endValue);
                continue;
              }
            } else {
              _tweenComplexCSSString.call(this, target, p, startValue, relative ? relative + endValue : endValue);
            }
            isTransformRelated || (p in style ? inlineProps.push(p, 0, style[p]) : inlineProps.push(p, 1, startValue || target[p]));
            props.push(p);
          }
        }
        hasPriority && _sortPropTweensByPriority(this);
      },
      render: function render2(ratio, data) {
        if (data.tween._time || !_reverting2()) {
          var pt = data._pt;
          while (pt) {
            pt.r(ratio, pt.d);
            pt = pt._next;
          }
        } else {
          data.styles.revert();
        }
      },
      get: _get,
      aliases: _propertyAliases,
      getSetter: function getSetter(target, property, plugin) {
        var p = _propertyAliases[property];
        p && p.indexOf(",") < 0 && (property = p);
        return property in _transformProps && property !== _transformOriginProp && (target._gsap.x || _get(target, "x")) ? plugin && _recentSetterPlugin === plugin ? property === "scale" ? _setterScale : _setterTransform : (_recentSetterPlugin = plugin || {}) && (property === "scale" ? _setterScaleWithRender : _setterTransformWithRender) : target.style && !_isUndefined(target.style[property]) ? _setterCSSStyle : ~property.indexOf("-") ? _setterCSSProp : _getSetter(target, property);
      },
      core: {
        _removeProperty,
        _getMatrix
      }
    };
    gsap.utils.checkPrefix = _checkPropPrefix;
    gsap.core.getStyleSaver = _getStyleSaver;
    (function(positionAndScale, rotation, others, aliases) {
      var all = _forEachName(positionAndScale + "," + rotation + "," + others, function(name) {
        _transformProps[name] = 1;
      });
      _forEachName(rotation, function(name) {
        _config.units[name] = "deg";
        _rotationalProperties[name] = 1;
      });
      _propertyAliases[all[13]] = positionAndScale + "," + rotation;
      _forEachName(aliases, function(name) {
        var split = name.split(":");
        _propertyAliases[split[1]] = all[split[0]];
      });
    })("x,y,z,scale,scaleX,scaleY,xPercent,yPercent", "rotation,rotationX,rotationY,skewX,skewY", "transform,transformOrigin,svgOrigin,force3D,smoothOrigin,transformPerspective", "0:translateX,1:translateY,2:translateZ,8:rotate,8:rotationZ,8:rotateZ,9:rotateX,10:rotateY");
    _forEachName("x,y,z,top,right,bottom,left,width,height,fontSize,padding,margin,perspective", function(name) {
      _config.units[name] = "px";
    });
    gsap.registerPlugin(CSSPlugin);
  }
});

// node_modules/gsap/index.js
var gsapWithCSS, TweenMaxWithCSS;
var init_gsap = __esm({
  "node_modules/gsap/index.js"() {
    init_gsap_core();
    init_CSSPlugin();
    gsapWithCSS = gsap.registerPlugin(CSSPlugin) || gsap;
    TweenMaxWithCSS = gsapWithCSS.core.Tween;
  }
});

// node_modules/canvas-confetti/dist/confetti.module.mjs
var module, confetti_module_default, create;
var init_confetti_module = __esm({
  "node_modules/canvas-confetti/dist/confetti.module.mjs"() {
    module = {};
    (function main(global, module2, isWorker, workerSize) {
      var canUseWorker = !!(global.Worker && global.Blob && global.Promise && global.OffscreenCanvas && global.OffscreenCanvasRenderingContext2D && global.HTMLCanvasElement && global.HTMLCanvasElement.prototype.transferControlToOffscreen && global.URL && global.URL.createObjectURL);
      var canUsePaths = typeof Path2D === "function" && typeof DOMMatrix === "function";
      var canDrawBitmap = (function() {
        if (!global.OffscreenCanvas) {
          return false;
        }
        var canvas = new OffscreenCanvas(1, 1);
        var ctx2 = canvas.getContext("2d");
        ctx2.fillRect(0, 0, 1, 1);
        var bitmap = canvas.transferToImageBitmap();
        try {
          ctx2.createPattern(bitmap, "no-repeat");
        } catch (e) {
          return false;
        }
        return true;
      })();
      function noop() {
      }
      function promise(func) {
        var ModulePromise = module2.exports.Promise;
        var Prom = ModulePromise !== void 0 ? ModulePromise : global.Promise;
        if (typeof Prom === "function") {
          return new Prom(func);
        }
        func(noop, noop);
        return null;
      }
      var bitmapMapper = /* @__PURE__ */ (function(skipTransform, map) {
        return {
          transform: function(bitmap) {
            if (skipTransform) {
              return bitmap;
            }
            if (map.has(bitmap)) {
              return map.get(bitmap);
            }
            var canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
            var ctx2 = canvas.getContext("2d");
            ctx2.drawImage(bitmap, 0, 0);
            map.set(bitmap, canvas);
            return canvas;
          },
          clear: function() {
            map.clear();
          }
        };
      })(canDrawBitmap, /* @__PURE__ */ new Map());
      var raf = (function() {
        var TIME = Math.floor(1e3 / 60);
        var frame, cancel;
        var frames = {};
        var lastFrameTime = 0;
        if (typeof requestAnimationFrame === "function" && typeof cancelAnimationFrame === "function") {
          frame = function(cb) {
            var id = Math.random();
            frames[id] = requestAnimationFrame(function onFrame(time) {
              if (lastFrameTime === time || lastFrameTime + TIME - 1 < time) {
                lastFrameTime = time;
                delete frames[id];
                cb();
              } else {
                frames[id] = requestAnimationFrame(onFrame);
              }
            });
            return id;
          };
          cancel = function(id) {
            if (frames[id]) {
              cancelAnimationFrame(frames[id]);
            }
          };
        } else {
          frame = function(cb) {
            return setTimeout(cb, TIME);
          };
          cancel = function(timer) {
            return clearTimeout(timer);
          };
        }
        return { frame, cancel };
      })();
      var getWorker = /* @__PURE__ */ (function() {
        var worker;
        var prom;
        var resolves = {};
        function decorate2(worker2) {
          function execute(options, callback) {
            worker2.postMessage({ options: options || {}, callback });
          }
          worker2.init = function initWorker(canvas) {
            var offscreen = canvas.transferControlToOffscreen();
            worker2.postMessage({ canvas: offscreen }, [offscreen]);
          };
          worker2.fire = function fireWorker(options, size, done) {
            if (prom) {
              execute(options, null);
              return prom;
            }
            var id = Math.random().toString(36).slice(2);
            prom = promise(function(resolve) {
              function workerDone(msg) {
                if (msg.data.callback !== id) {
                  return;
                }
                delete resolves[id];
                worker2.removeEventListener("message", workerDone);
                prom = null;
                bitmapMapper.clear();
                done();
                resolve();
              }
              worker2.addEventListener("message", workerDone);
              execute(options, id);
              resolves[id] = workerDone.bind(null, { data: { callback: id } });
            });
            return prom;
          };
          worker2.reset = function resetWorker() {
            worker2.postMessage({ reset: true });
            for (var id in resolves) {
              resolves[id]();
              delete resolves[id];
            }
          };
        }
        return function() {
          if (worker) {
            return worker;
          }
          if (!isWorker && canUseWorker) {
            var code = [
              "var CONFETTI, SIZE = {}, module = {};",
              "(" + main.toString() + ")(this, module, true, SIZE);",
              "onmessage = function(msg) {",
              "  if (msg.data.options) {",
              "    CONFETTI(msg.data.options).then(function () {",
              "      if (msg.data.callback) {",
              "        postMessage({ callback: msg.data.callback });",
              "      }",
              "    });",
              "  } else if (msg.data.reset) {",
              "    CONFETTI && CONFETTI.reset();",
              "  } else if (msg.data.resize) {",
              "    SIZE.width = msg.data.resize.width;",
              "    SIZE.height = msg.data.resize.height;",
              "  } else if (msg.data.canvas) {",
              "    SIZE.width = msg.data.canvas.width;",
              "    SIZE.height = msg.data.canvas.height;",
              "    CONFETTI = module.exports.create(msg.data.canvas);",
              "  }",
              "}"
            ].join("\n");
            try {
              worker = new Worker(URL.createObjectURL(new Blob([code])));
            } catch (e) {
              typeof console !== void 0 && typeof console.warn === "function" ? console.warn("\u{1F38A} Could not load worker", e) : null;
              return null;
            }
            decorate2(worker);
          }
          return worker;
        };
      })();
      var defaults2 = {
        particleCount: 50,
        angle: 90,
        spread: 45,
        startVelocity: 45,
        decay: 0.9,
        gravity: 1,
        drift: 0,
        ticks: 200,
        x: 0.5,
        y: 0.5,
        shapes: ["square", "circle"],
        zIndex: 100,
        colors: [
          "#26ccff",
          "#a25afd",
          "#ff5e7e",
          "#88ff5a",
          "#fcff42",
          "#ffa62d",
          "#ff36ff"
        ],
        // probably should be true, but back-compat
        disableForReducedMotion: false,
        scalar: 1
      };
      function convert(val, transform) {
        return transform ? transform(val) : val;
      }
      function isOk(val) {
        return !(val === null || val === void 0);
      }
      function prop(options, name, transform) {
        return convert(
          options && isOk(options[name]) ? options[name] : defaults2[name],
          transform
        );
      }
      function onlyPositiveInt(number) {
        return number < 0 ? 0 : Math.floor(number);
      }
      function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
      }
      function toDecimal(str) {
        return parseInt(str, 16);
      }
      function colorsToRgb(colors) {
        return colors.map(hexToRgb2);
      }
      function hexToRgb2(str) {
        var val = String(str).replace(/[^0-9a-f]/gi, "");
        if (val.length < 6) {
          val = val[0] + val[0] + val[1] + val[1] + val[2] + val[2];
        }
        return {
          r: toDecimal(val.substring(0, 2)),
          g: toDecimal(val.substring(2, 4)),
          b: toDecimal(val.substring(4, 6))
        };
      }
      function getOrigin(options) {
        var origin = prop(options, "origin", Object);
        origin.x = prop(origin, "x", Number);
        origin.y = prop(origin, "y", Number);
        return origin;
      }
      function setCanvasWindowSize(canvas) {
        canvas.width = document.documentElement.clientWidth;
        canvas.height = document.documentElement.clientHeight;
      }
      function setCanvasRectSize(canvas) {
        var rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
      function getCanvas(zIndex) {
        var canvas = document.createElement("canvas");
        canvas.style.position = "fixed";
        canvas.style.top = "0px";
        canvas.style.left = "0px";
        canvas.style.pointerEvents = "none";
        canvas.style.zIndex = zIndex;
        return canvas;
      }
      function ellipse(context3, x, y, radiusX, radiusY, rotation, startAngle, endAngle, antiClockwise) {
        context3.save();
        context3.translate(x, y);
        context3.rotate(rotation);
        context3.scale(radiusX, radiusY);
        context3.arc(0, 0, 1, startAngle, endAngle, antiClockwise);
        context3.restore();
      }
      function randomPhysics(opts) {
        var radAngle = opts.angle * (Math.PI / 180);
        var radSpread = opts.spread * (Math.PI / 180);
        return {
          x: opts.x,
          y: opts.y,
          wobble: Math.random() * 10,
          wobbleSpeed: Math.min(0.11, Math.random() * 0.1 + 0.05),
          velocity: opts.startVelocity * 0.5 + Math.random() * opts.startVelocity,
          angle2D: -radAngle + (0.5 * radSpread - Math.random() * radSpread),
          tiltAngle: (Math.random() * (0.75 - 0.25) + 0.25) * Math.PI,
          color: opts.color,
          shape: opts.shape,
          tick: 0,
          totalTicks: opts.ticks,
          decay: opts.decay,
          drift: opts.drift,
          random: Math.random() + 2,
          tiltSin: 0,
          tiltCos: 0,
          wobbleX: 0,
          wobbleY: 0,
          gravity: opts.gravity * 3,
          ovalScalar: 0.6,
          scalar: opts.scalar,
          flat: opts.flat
        };
      }
      function updateFetti(context3, fetti) {
        fetti.x += Math.cos(fetti.angle2D) * fetti.velocity + fetti.drift;
        fetti.y += Math.sin(fetti.angle2D) * fetti.velocity + fetti.gravity;
        fetti.velocity *= fetti.decay;
        if (fetti.flat) {
          fetti.wobble = 0;
          fetti.wobbleX = fetti.x + 10 * fetti.scalar;
          fetti.wobbleY = fetti.y + 10 * fetti.scalar;
          fetti.tiltSin = 0;
          fetti.tiltCos = 0;
          fetti.random = 1;
        } else {
          fetti.wobble += fetti.wobbleSpeed;
          fetti.wobbleX = fetti.x + 10 * fetti.scalar * Math.cos(fetti.wobble);
          fetti.wobbleY = fetti.y + 10 * fetti.scalar * Math.sin(fetti.wobble);
          fetti.tiltAngle += 0.1;
          fetti.tiltSin = Math.sin(fetti.tiltAngle);
          fetti.tiltCos = Math.cos(fetti.tiltAngle);
          fetti.random = Math.random() + 2;
        }
        var progress = fetti.tick++ / fetti.totalTicks;
        var x1 = fetti.x + fetti.random * fetti.tiltCos;
        var y1 = fetti.y + fetti.random * fetti.tiltSin;
        var x2 = fetti.wobbleX + fetti.random * fetti.tiltCos;
        var y2 = fetti.wobbleY + fetti.random * fetti.tiltSin;
        context3.fillStyle = "rgba(" + fetti.color.r + ", " + fetti.color.g + ", " + fetti.color.b + ", " + (1 - progress) + ")";
        context3.beginPath();
        if (canUsePaths && fetti.shape.type === "path" && typeof fetti.shape.path === "string" && Array.isArray(fetti.shape.matrix)) {
          context3.fill(transformPath2D(
            fetti.shape.path,
            fetti.shape.matrix,
            fetti.x,
            fetti.y,
            Math.abs(x2 - x1) * 0.1,
            Math.abs(y2 - y1) * 0.1,
            Math.PI / 10 * fetti.wobble
          ));
        } else if (fetti.shape.type === "bitmap") {
          var rotation = Math.PI / 10 * fetti.wobble;
          var scaleX = Math.abs(x2 - x1) * 0.1;
          var scaleY = Math.abs(y2 - y1) * 0.1;
          var width = fetti.shape.bitmap.width * fetti.scalar;
          var height = fetti.shape.bitmap.height * fetti.scalar;
          var matrix = new DOMMatrix([
            Math.cos(rotation) * scaleX,
            Math.sin(rotation) * scaleX,
            -Math.sin(rotation) * scaleY,
            Math.cos(rotation) * scaleY,
            fetti.x,
            fetti.y
          ]);
          matrix.multiplySelf(new DOMMatrix(fetti.shape.matrix));
          var pattern = context3.createPattern(bitmapMapper.transform(fetti.shape.bitmap), "no-repeat");
          pattern.setTransform(matrix);
          context3.globalAlpha = 1 - progress;
          context3.fillStyle = pattern;
          context3.fillRect(
            fetti.x - width / 2,
            fetti.y - height / 2,
            width,
            height
          );
          context3.globalAlpha = 1;
        } else if (fetti.shape === "circle") {
          context3.ellipse ? context3.ellipse(fetti.x, fetti.y, Math.abs(x2 - x1) * fetti.ovalScalar, Math.abs(y2 - y1) * fetti.ovalScalar, Math.PI / 10 * fetti.wobble, 0, 2 * Math.PI) : ellipse(context3, fetti.x, fetti.y, Math.abs(x2 - x1) * fetti.ovalScalar, Math.abs(y2 - y1) * fetti.ovalScalar, Math.PI / 10 * fetti.wobble, 0, 2 * Math.PI);
        } else if (fetti.shape === "star") {
          var rot = Math.PI / 2 * 3;
          var innerRadius = 4 * fetti.scalar;
          var outerRadius = 8 * fetti.scalar;
          var x = fetti.x;
          var y = fetti.y;
          var spikes = 5;
          var step = Math.PI / spikes;
          while (spikes--) {
            x = fetti.x + Math.cos(rot) * outerRadius;
            y = fetti.y + Math.sin(rot) * outerRadius;
            context3.lineTo(x, y);
            rot += step;
            x = fetti.x + Math.cos(rot) * innerRadius;
            y = fetti.y + Math.sin(rot) * innerRadius;
            context3.lineTo(x, y);
            rot += step;
          }
        } else {
          context3.moveTo(Math.floor(fetti.x), Math.floor(fetti.y));
          context3.lineTo(Math.floor(fetti.wobbleX), Math.floor(y1));
          context3.lineTo(Math.floor(x2), Math.floor(y2));
          context3.lineTo(Math.floor(x1), Math.floor(fetti.wobbleY));
        }
        context3.closePath();
        context3.fill();
        return fetti.tick < fetti.totalTicks;
      }
      function animate(canvas, fettis, resizer, size, done) {
        var animatingFettis = fettis.slice();
        var context3 = canvas.getContext("2d");
        var animationFrame;
        var destroy;
        var prom = promise(function(resolve) {
          function onDone() {
            animationFrame = destroy = null;
            context3.clearRect(0, 0, size.width, size.height);
            bitmapMapper.clear();
            done();
            resolve();
          }
          function update() {
            if (isWorker && !(size.width === workerSize.width && size.height === workerSize.height)) {
              size.width = canvas.width = workerSize.width;
              size.height = canvas.height = workerSize.height;
            }
            if (!size.width && !size.height) {
              resizer(canvas);
              size.width = canvas.width;
              size.height = canvas.height;
            }
            context3.clearRect(0, 0, size.width, size.height);
            animatingFettis = animatingFettis.filter(function(fetti) {
              return updateFetti(context3, fetti);
            });
            if (animatingFettis.length) {
              animationFrame = raf.frame(update);
            } else {
              onDone();
            }
          }
          animationFrame = raf.frame(update);
          destroy = onDone;
        });
        return {
          addFettis: function(fettis2) {
            animatingFettis = animatingFettis.concat(fettis2);
            return prom;
          },
          canvas,
          promise: prom,
          reset: function() {
            if (animationFrame) {
              raf.cancel(animationFrame);
            }
            if (destroy) {
              destroy();
            }
          }
        };
      }
      function confettiCannon(canvas, globalOpts) {
        var isLibCanvas = !canvas;
        var allowResize = !!prop(globalOpts || {}, "resize");
        var hasResizeEventRegistered = false;
        var globalDisableForReducedMotion = prop(globalOpts, "disableForReducedMotion", Boolean);
        var shouldUseWorker = canUseWorker && !!prop(globalOpts || {}, "useWorker");
        var worker = shouldUseWorker ? getWorker() : null;
        var resizer = isLibCanvas ? setCanvasWindowSize : setCanvasRectSize;
        var initialized = canvas && worker ? !!canvas.__confetti_initialized : false;
        var preferLessMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion)").matches;
        var animationObj;
        function fireLocal(options, size, done) {
          var particleCount = prop(options, "particleCount", onlyPositiveInt);
          var angle = prop(options, "angle", Number);
          var spread = prop(options, "spread", Number);
          var startVelocity = prop(options, "startVelocity", Number);
          var decay = prop(options, "decay", Number);
          var gravity = prop(options, "gravity", Number);
          var drift = prop(options, "drift", Number);
          var colors = prop(options, "colors", colorsToRgb);
          var ticks = prop(options, "ticks", Number);
          var shapes = prop(options, "shapes");
          var scalar = prop(options, "scalar");
          var flat = !!prop(options, "flat");
          var origin = getOrigin(options);
          var temp = particleCount;
          var fettis = [];
          var startX = canvas.width * origin.x;
          var startY = canvas.height * origin.y;
          while (temp--) {
            fettis.push(
              randomPhysics({
                x: startX,
                y: startY,
                angle,
                spread,
                startVelocity,
                color: colors[temp % colors.length],
                shape: shapes[randomInt(0, shapes.length)],
                ticks,
                decay,
                gravity,
                drift,
                scalar,
                flat
              })
            );
          }
          if (animationObj) {
            return animationObj.addFettis(fettis);
          }
          animationObj = animate(canvas, fettis, resizer, size, done);
          return animationObj.promise;
        }
        function fire(options) {
          var disableForReducedMotion = globalDisableForReducedMotion || prop(options, "disableForReducedMotion", Boolean);
          var zIndex = prop(options, "zIndex", Number);
          if (disableForReducedMotion && preferLessMotion) {
            return promise(function(resolve) {
              resolve();
            });
          }
          if (isLibCanvas && animationObj) {
            canvas = animationObj.canvas;
          } else if (isLibCanvas && !canvas) {
            canvas = getCanvas(zIndex);
            document.body.appendChild(canvas);
          }
          if (allowResize && !initialized) {
            resizer(canvas);
          }
          var size = {
            width: canvas.width,
            height: canvas.height
          };
          if (worker && !initialized) {
            worker.init(canvas);
          }
          initialized = true;
          if (worker) {
            canvas.__confetti_initialized = true;
          }
          function onResize() {
            if (worker) {
              var obj = {
                getBoundingClientRect: function() {
                  if (!isLibCanvas) {
                    return canvas.getBoundingClientRect();
                  }
                }
              };
              resizer(obj);
              worker.postMessage({
                resize: {
                  width: obj.width,
                  height: obj.height
                }
              });
              return;
            }
            size.width = size.height = null;
          }
          function done() {
            animationObj = null;
            if (allowResize) {
              hasResizeEventRegistered = false;
              global.removeEventListener("resize", onResize);
            }
            if (isLibCanvas && canvas) {
              if (document.body.contains(canvas)) {
                document.body.removeChild(canvas);
              }
              canvas = null;
              initialized = false;
            }
          }
          if (allowResize && !hasResizeEventRegistered) {
            hasResizeEventRegistered = true;
            global.addEventListener("resize", onResize, false);
          }
          if (worker) {
            return worker.fire(options, size, done);
          }
          return fireLocal(options, size, done);
        }
        fire.reset = function() {
          if (worker) {
            worker.reset();
          }
          if (animationObj) {
            animationObj.reset();
          }
        };
        return fire;
      }
      var defaultFire;
      function getDefaultFire() {
        if (!defaultFire) {
          defaultFire = confettiCannon(null, { useWorker: true, resize: true });
        }
        return defaultFire;
      }
      function transformPath2D(pathString, pathMatrix, x, y, scaleX, scaleY, rotation) {
        var path2d = new Path2D(pathString);
        var t1 = new Path2D();
        t1.addPath(path2d, new DOMMatrix(pathMatrix));
        var t2 = new Path2D();
        t2.addPath(t1, new DOMMatrix([
          Math.cos(rotation) * scaleX,
          Math.sin(rotation) * scaleX,
          -Math.sin(rotation) * scaleY,
          Math.cos(rotation) * scaleY,
          x,
          y
        ]));
        return t2;
      }
      function shapeFromPath(pathData) {
        if (!canUsePaths) {
          throw new Error("path confetti are not supported in this browser");
        }
        var path, matrix;
        if (typeof pathData === "string") {
          path = pathData;
        } else {
          path = pathData.path;
          matrix = pathData.matrix;
        }
        var path2d = new Path2D(path);
        var tempCanvas = document.createElement("canvas");
        var tempCtx = tempCanvas.getContext("2d");
        if (!matrix) {
          var maxSize = 1e3;
          var minX = maxSize;
          var minY = maxSize;
          var maxX = 0;
          var maxY = 0;
          var width, height;
          for (var x = 0; x < maxSize; x += 2) {
            for (var y = 0; y < maxSize; y += 2) {
              if (tempCtx.isPointInPath(path2d, x, y, "nonzero")) {
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
              }
            }
          }
          width = maxX - minX;
          height = maxY - minY;
          var maxDesiredSize = 10;
          var scale = Math.min(maxDesiredSize / width, maxDesiredSize / height);
          matrix = [
            scale,
            0,
            0,
            scale,
            -Math.round(width / 2 + minX) * scale,
            -Math.round(height / 2 + minY) * scale
          ];
        }
        return {
          type: "path",
          path,
          matrix
        };
      }
      function shapeFromText(textData2) {
        var text, scalar = 1, color = "#000000", fontFamily = '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", "EmojiOne Color", "Android Emoji", "Twemoji Mozilla", "system emoji", sans-serif';
        if (typeof textData2 === "string") {
          text = textData2;
        } else {
          text = textData2.text;
          scalar = "scalar" in textData2 ? textData2.scalar : scalar;
          fontFamily = "fontFamily" in textData2 ? textData2.fontFamily : fontFamily;
          color = "color" in textData2 ? textData2.color : color;
        }
        var fontSize = 10 * scalar;
        var font = "" + fontSize + "px " + fontFamily;
        var canvas = new OffscreenCanvas(fontSize, fontSize);
        var ctx2 = canvas.getContext("2d");
        ctx2.font = font;
        var size = ctx2.measureText(text);
        var width = Math.ceil(size.actualBoundingBoxRight + size.actualBoundingBoxLeft);
        var height = Math.ceil(size.actualBoundingBoxAscent + size.actualBoundingBoxDescent);
        var padding = 2;
        var x = size.actualBoundingBoxLeft + padding;
        var y = size.actualBoundingBoxAscent + padding;
        width += padding + padding;
        height += padding + padding;
        canvas = new OffscreenCanvas(width, height);
        ctx2 = canvas.getContext("2d");
        ctx2.font = font;
        ctx2.fillStyle = color;
        ctx2.fillText(text, x, y);
        var scale = 1 / scalar;
        return {
          type: "bitmap",
          // TODO these probably need to be transfered for workers
          bitmap: canvas.transferToImageBitmap(),
          matrix: [scale, 0, 0, scale, -width * scale / 2, -height * scale / 2]
        };
      }
      module2.exports = function() {
        return getDefaultFire().apply(this, arguments);
      };
      module2.exports.reset = function() {
        getDefaultFire().reset();
      };
      module2.exports.create = confettiCannon;
      module2.exports.shapeFromPath = shapeFromPath;
      module2.exports.shapeFromText = shapeFromText;
    })((function() {
      if (typeof window !== "undefined") {
        return window;
      }
      if (typeof self !== "undefined") {
        return self;
      }
      return this || {};
    })(), module, false);
    confetti_module_default = module.exports;
    create = module.exports.create;
  }
});

// public/20260401183100_f1bbc072-ea26-42d7-a4eb-8de16f4caed3/app.ts
function isAngleMatchWithSymmetry(shapeType, currentRotation, targetRotation, thresholdDeg) {
  if (shapeType === "circle" /* CIRCLE */) {
    return true;
  }
  const thresholdRad = thresholdDeg * Math.PI / 180;
  if (shapeType === "rectangle" /* RECTANGLE */) {
    const mod = Math.PI / 2;
    let diff2 = (currentRotation - targetRotation) % mod;
    if (diff2 < 0) diff2 += mod;
    if (diff2 > mod / 2) diff2 = mod - diff2;
    return Math.abs(diff2) < thresholdRad;
  }
  if (shapeType === "triangle" /* TRIANGLE */) {
    const mod = Math.PI * 2 / 3;
    let diff2 = (currentRotation - targetRotation) % mod;
    if (diff2 < 0) diff2 += mod;
    if (diff2 > mod / 2) diff2 = mod - diff2;
    return Math.abs(diff2) < thresholdRad;
  }
  const diff = Math.abs(normalizeAngle(currentRotation - targetRotation));
  return diff < thresholdRad;
}
function findNearestSymmetricRotation(shapeType, currentRotation, targetRotation) {
  if (shapeType === "circle" /* CIRCLE */) {
    return currentRotation;
  }
  let symmetryPeriod;
  if (shapeType === "rectangle" /* RECTANGLE */) {
    symmetryPeriod = Math.PI / 2;
  } else if (shapeType === "triangle" /* TRIANGLE */) {
    symmetryPeriod = Math.PI * 2 / 3;
  } else {
    return targetRotation;
  }
  let best = targetRotation;
  let bestDiff = Math.abs(normalizeAngle(currentRotation - targetRotation));
  for (let k = -4; k <= 4; k++) {
    const candidate = targetRotation + k * symmetryPeriod;
    const diff = Math.abs(normalizeAngle(currentRotation - candidate));
    if (diff < bestDiff) {
      bestDiff = diff;
      best = candidate;
    }
  }
  return best;
}
function drawShapeIntersectionBlend(shapeA, shapeB, dz) {
  const blendedColor = blendColors(shapeA.color, shapeB.color);
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  drawRoundedRect(ctx, dz.x, dz.y, dz.width, dz.height, appData.dropZoneCornerRadius);
  ctx.clip();
  ctx.save();
  ctx.beginPath();
  buildShapePath(ctx, shapeA.type, shapeA.x, shapeA.y, shapeA.size, shapeA.rotation);
  ctx.clip();
  ctx.beginPath();
  buildShapePath(ctx, shapeB.type, shapeB.x, shapeB.y, shapeB.size, shapeB.rotation);
  ctx.fillStyle = blendedColor;
  ctx.fill();
  ctx.restore();
  ctx.restore();
}
function blendColors(color1, color2) {
  const colorMixMap = {
    "#5B8DEF+#FFD966": "rgba(76, 175, 80, 0.85)",
    "#FFD966+#5B8DEF": "rgba(76, 175, 80, 0.85)",
    "#FFD966+#FF6B6B": "rgba(255, 152, 50, 0.85)",
    "#FF6B6B+#FFD966": "rgba(255, 152, 50, 0.85)",
    "#5B8DEF+#FF6B6B": "rgba(142, 68, 199, 0.85)",
    "#FF6B6B+#5B8DEF": "rgba(142, 68, 199, 0.85)"
  };
  const key = color1 + "+" + color2;
  if (colorMixMap[key]) return colorMixMap[key];
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  const r = Math.round((rgb1[0] + rgb2[0]) / 2);
  const g = Math.round((rgb1[1] + rgb2[1]) / 2);
  const b = Math.round((rgb1[2] + rgb2[2]) / 2);
  return `rgba(${r}, ${g}, ${b}, 0.85)`;
}
function checkAllAnswers() {
  const answerMap = appData.answerMap;
  if (!answerMap || answerMap.length === 0) return false;
  for (const entry of answerMap) {
    const dzIndex = entry.dropZoneIndex;
    const dz = dropZones[dzIndex];
    if (!dz) return false;
    const centerX = dz.x + dz.width / 2;
    const centerY = dz.y + dz.height / 2;
    for (let i = 0; i < entry.shapes.length; i++) {
      const expectedType = entry.shapes[i].type;
      const expectedColor = entry.shapes[i].color.toUpperCase();
      const offset = entry.targetOffsets[i];
      const targetX = centerX + offset.x;
      const targetY = centerY + offset.y;
      const targetRotation = offset.rotation * Math.PI / 180;
      const matchingShape = clonedShapes.find((s) => {
        if (s.dropZoneIndex !== dzIndex) return false;
        if (s.type !== expectedType) return false;
        if (s.color.toUpperCase() !== expectedColor) return false;
        const dx = Math.abs(s.x - targetX);
        const dy = Math.abs(s.y - targetY);
        const dist = Math.sqrt(dx * dx + dy * dy);
        const posThreshold = appData.snapThreshold * 1.5;
        if (dist >= posThreshold) return false;
        return isAngleMatchWithSymmetry(s.type, s.rotation, targetRotation, appData.snapAngleThreshold * 2);
      });
      if (!matchingShape) return false;
    }
  }
  return true;
}
function buildShapePath(targetCtx, type, cx, cy, size, rotation) {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  switch (type) {
    case "rectangle" /* RECTANGLE */: {
      const half = size / 2;
      const corners = [
        [-half, -half],
        [half, -half],
        [half, half],
        [-half, half]
      ];
      const rotated = corners.map((c) => [cx + c[0] * cos - c[1] * sin, cy + c[0] * sin + c[1] * cos]);
      targetCtx.moveTo(rotated[0][0], rotated[0][1]);
      for (let i = 1; i < rotated.length; i++) {
        targetCtx.lineTo(rotated[i][0], rotated[i][1]);
      }
      targetCtx.closePath();
      break;
    }
    case "triangle" /* TRIANGLE */: {
      const sideLength = size;
      const circumR = sideLength / Math.sqrt(3);
      const verts = [];
      for (let i = 0; i < 3; i++) {
        const angle = i * 2 * Math.PI / 3 - Math.PI / 2;
        verts.push([circumR * Math.cos(angle), circumR * Math.sin(angle)]);
      }
      const rotated = verts.map((v) => [cx + v[0] * cos - v[1] * sin, cy + v[0] * sin + v[1] * cos]);
      targetCtx.moveTo(rotated[0][0], rotated[0][1]);
      for (let i = 1; i < rotated.length; i++) {
        targetCtx.lineTo(rotated[i][0], rotated[i][1]);
      }
      targetCtx.closePath();
      break;
    }
    case "circle" /* CIRCLE */: {
      const half = size / 2;
      targetCtx.arc(cx, cy, half, 0, Math.PI * 2);
      targetCtx.closePath();
      break;
    }
  }
}
function drawAllTargetIntersections() {
  for (const target of targetIntersections) {
    drawTargetIntersection(target);
  }
}
function drawTargetIntersection(target) {
  const dz = dropZones[target.dropZoneIndex];
  if (!dz) return;
  const cx = dz.x + dz.width / 2;
  const cy = dz.y + dz.height / 2;
  const shapeA = target.shapes[0];
  const shapeB = target.shapes[1];
  const snappedInZone = clonedShapes.filter((s) => s.dropZoneIndex === dz.index && s.snapped);
  if (snappedInZone.length >= 2) return;
  const shapesInZone = clonedShapes.filter((s) => s.dropZoneIndex === dz.index);
  if (shapesInZone.length >= 2) return;
  ctx.save();
  ctx.globalAlpha = target.opacity;
  ctx.globalCompositeOperation = "source-over";
  drawRoundedRect(ctx, dz.x, dz.y, dz.width, dz.height, appData.dropZoneCornerRadius);
  ctx.clip();
  ctx.save();
  ctx.beginPath();
  buildShapePath(ctx, shapeA.type, cx + shapeA.offsetX, cy + shapeA.offsetY, shapeA.size, shapeA.rotation);
  ctx.clip();
  ctx.beginPath();
  buildShapePath(ctx, shapeB.type, cx + shapeB.offsetX, cy + shapeB.offsetY, shapeB.size, shapeB.rotation);
  ctx.fillStyle = target.color;
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.10)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}
function initTargetIntersections() {
  targetIntersections = [];
  const colorMixMap = {
    "#5B8DEF+#FFD966": "rgba(76, 175, 80, 0.78)",
    "#FFD966+#5B8DEF": "rgba(76, 175, 80, 0.78)",
    "#FFD966+#FF6B6B": "rgba(255, 152, 50, 0.78)",
    "#FF6B6B+#FFD966": "rgba(255, 152, 50, 0.78)",
    "#5B8DEF+#FF6B6B": "rgba(142, 68, 199, 0.78)",
    "#FF6B6B+#5B8DEF": "rgba(142, 68, 199, 0.78)"
  };
  for (const entry of appData.answerMap) {
    const mixKey = entry.shapes[0].color + "+" + entry.shapes[1].color;
    const blendedColor = colorMixMap[mixKey] || "rgba(128, 128, 128, 0.7)";
    const shapeSize = appData.shapeSize;
    const offset0 = entry.targetOffsets[0];
    const offset1 = entry.targetOffsets[1];
    targetIntersections.push({
      dropZoneIndex: entry.dropZoneIndex,
      color: blendedColor,
      opacity: 1,
      shapes: [
        {
          type: entry.shapes[0].type,
          offsetX: offset0.x,
          offsetY: offset0.y,
          rotation: offset0.rotation * Math.PI / 180,
          size: shapeSize
        },
        {
          type: entry.shapes[1].type,
          offsetX: offset1.x,
          offsetY: offset1.y,
          rotation: offset1.rotation * Math.PI / 180,
          size: shapeSize
        }
      ]
    });
  }
}
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
  }
  return [0, 0, 0];
}
function drawRoundedRect(targetCtx, x, y, w, h, r) {
  targetCtx.beginPath();
  targetCtx.moveTo(x + r, y);
  targetCtx.lineTo(x + w - r, y);
  targetCtx.quadraticCurveTo(x + w, y, x + w, y + r);
  targetCtx.lineTo(x + w, y + h - r);
  targetCtx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  targetCtx.lineTo(x + r, y + h);
  targetCtx.quadraticCurveTo(x, y + h, x, y + h - r);
  targetCtx.lineTo(x, y + r);
  targetCtx.quadraticCurveTo(x, y, x + r, y);
  targetCtx.closePath();
}
function drawShape(targetCtx, type, x, y, size, color, rotation, alpha) {
  targetCtx.save();
  targetCtx.globalCompositeOperation = "source-over";
  targetCtx.translate(x, y);
  targetCtx.rotate(rotation);
  targetCtx.globalAlpha = alpha;
  targetCtx.shadowColor = "rgba(0,0,0,0.15)";
  targetCtx.shadowBlur = 6;
  targetCtx.shadowOffsetY = 3;
  switch (type) {
    case "rectangle" /* RECTANGLE */:
      targetCtx.fillStyle = color;
      targetCtx.fillRect(-size / 2, -size / 2, size, size);
      targetCtx.shadowBlur = 0;
      targetCtx.shadowOffsetY = 0;
      targetCtx.strokeStyle = "rgba(255,255,255,0.4)";
      targetCtx.lineWidth = 2;
      targetCtx.strokeRect(-size / 2 + 1, -size / 2 + 1, size - 2, size - 2);
      targetCtx.strokeStyle = "rgba(0,0,0,0.08)";
      targetCtx.lineWidth = 1;
      targetCtx.strokeRect(-size / 2, -size / 2, size, size);
      break;
    case "triangle" /* TRIANGLE */: {
      const sideLength = size;
      const circumR = sideLength / Math.sqrt(3);
      targetCtx.fillStyle = color;
      targetCtx.beginPath();
      for (let i = 0; i < 3; i++) {
        const angle = i * 2 * Math.PI / 3 - Math.PI / 2;
        const vx = circumR * Math.cos(angle);
        const vy = circumR * Math.sin(angle);
        if (i === 0) targetCtx.moveTo(vx, vy);
        else targetCtx.lineTo(vx, vy);
      }
      targetCtx.closePath();
      targetCtx.fill();
      targetCtx.shadowBlur = 0;
      targetCtx.shadowOffsetY = 0;
      targetCtx.strokeStyle = "rgba(255,255,255,0.4)";
      targetCtx.lineWidth = 2;
      targetCtx.stroke();
      targetCtx.strokeStyle = "rgba(0,0,0,0.08)";
      targetCtx.lineWidth = 1;
      targetCtx.stroke();
      break;
    }
    case "circle" /* CIRCLE */:
      targetCtx.fillStyle = color;
      targetCtx.beginPath();
      targetCtx.arc(0, 0, size / 2, 0, Math.PI * 2);
      targetCtx.closePath();
      targetCtx.fill();
      targetCtx.shadowBlur = 0;
      targetCtx.shadowOffsetY = 0;
      targetCtx.strokeStyle = "rgba(255,255,255,0.4)";
      targetCtx.lineWidth = 2;
      targetCtx.stroke();
      targetCtx.strokeStyle = "rgba(0,0,0,0.08)";
      targetCtx.lineWidth = 1;
      targetCtx.stroke();
      break;
  }
  targetCtx.restore();
}
function drawShapeWithHintGlow(targetCtx, type, x, y, size, color, rotation, alpha) {
  const glowIntensity = 0.5 + 0.5 * Math.sin(hintGlowTime * 4);
  const glowColor = `rgba(180, 255, 50, ${0.4 + glowIntensity * 0.4})`;
  targetCtx.save();
  targetCtx.globalCompositeOperation = "source-over";
  targetCtx.translate(x, y);
  targetCtx.rotate(rotation);
  targetCtx.globalAlpha = alpha;
  targetCtx.shadowColor = glowColor;
  targetCtx.shadowBlur = 18 + glowIntensity * 10;
  targetCtx.strokeStyle = `rgba(180, 255, 50, ${0.6 + glowIntensity * 0.4})`;
  targetCtx.lineWidth = 4;
  switch (type) {
    case "rectangle" /* RECTANGLE */:
      targetCtx.strokeRect(-size / 2, -size / 2, size, size);
      break;
    case "triangle" /* TRIANGLE */: {
      const sideLength = size;
      const circumR = sideLength / Math.sqrt(3);
      targetCtx.beginPath();
      for (let i = 0; i < 3; i++) {
        const angle = i * 2 * Math.PI / 3 - Math.PI / 2;
        const vx = circumR * Math.cos(angle);
        const vy = circumR * Math.sin(angle);
        if (i === 0) targetCtx.moveTo(vx, vy);
        else targetCtx.lineTo(vx, vy);
      }
      targetCtx.closePath();
      targetCtx.stroke();
      break;
    }
    case "circle" /* CIRCLE */:
      targetCtx.beginPath();
      targetCtx.arc(0, 0, size / 2, 0, Math.PI * 2);
      targetCtx.closePath();
      targetCtx.stroke();
      break;
  }
  targetCtx.restore();
  drawShape(targetCtx, type, x, y, size, color, rotation, alpha);
}
function isPointInShape(px2, py, shape) {
  const dx = px2 - shape.x;
  const dy = py - shape.y;
  const cos = Math.cos(-shape.rotation);
  const sin = Math.sin(-shape.rotation);
  const lx = dx * cos - dy * sin;
  const ly = dx * sin + dy * cos;
  const half = shape.size / 2;
  switch (shape.type) {
    case "rectangle" /* RECTANGLE */:
      return Math.abs(lx) <= half && Math.abs(ly) <= half;
    case "triangle" /* TRIANGLE */: {
      const sideLength = shape.size;
      const circumR = sideLength / Math.sqrt(3);
      const verts = [];
      for (let i = 0; i < 3; i++) {
        const angle = i * 2 * Math.PI / 3 - Math.PI / 2;
        verts.push([circumR * Math.cos(angle), circumR * Math.sin(angle)]);
      }
      const x0 = verts[0][0], y0 = verts[0][1];
      const x1 = verts[1][0], y1 = verts[1][1];
      const x2 = verts[2][0], y2 = verts[2][1];
      const d1 = (lx - x2) * (y0 - y2) - (x0 - x2) * (ly - y2);
      const d2 = (lx - x0) * (y1 - y0) - (x1 - x0) * (ly - y0);
      const d3 = (lx - x1) * (y2 - y1) - (x2 - x1) * (ly - y1);
      const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
      const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
      return !(hasNeg && hasPos);
    }
    case "circle" /* CIRCLE */:
      return lx * lx + ly * ly <= half * half;
  }
}
function isPointOnRotationHandle(px2, py, shape) {
  if (shape.snapped) return false;
  const handleDist = appData.rotationHandleDistance;
  const handleX = shape.x + Math.cos(shape.rotation - Math.PI / 2) * handleDist;
  const handleY = shape.y + Math.sin(shape.rotation - Math.PI / 2) * handleDist;
  const dx = px2 - handleX;
  const dy = py - handleY;
  return dx * dx + dy * dy <= (appData.rotationHandleRadius + 6) * (appData.rotationHandleRadius + 6);
}
function drawRotationHandle(targetCtx, shape) {
  if (shape.snapped) return;
  const handleDist = appData.rotationHandleDistance;
  const handleX = shape.x + Math.cos(shape.rotation - Math.PI / 2) * handleDist;
  const handleY = shape.y + Math.sin(shape.rotation - Math.PI / 2) * handleDist;
  targetCtx.save();
  targetCtx.globalAlpha = 1;
  targetCtx.globalCompositeOperation = "source-over";
  targetCtx.strokeStyle = "#6366F1";
  targetCtx.lineWidth = 2;
  targetCtx.setLineDash([4, 4]);
  targetCtx.beginPath();
  targetCtx.moveTo(shape.x, shape.y);
  targetCtx.lineTo(handleX, handleY);
  targetCtx.stroke();
  targetCtx.setLineDash([]);
  const handleGrad = targetCtx.createRadialGradient(
    handleX,
    handleY,
    0,
    handleX,
    handleY,
    appData.rotationHandleRadius
  );
  handleGrad.addColorStop(0, "#818CF8");
  handleGrad.addColorStop(1, "#6366F1");
  targetCtx.fillStyle = handleGrad;
  targetCtx.beginPath();
  targetCtx.arc(handleX, handleY, appData.rotationHandleRadius, 0, Math.PI * 2);
  targetCtx.fill();
  targetCtx.strokeStyle = "#FFFFFF";
  targetCtx.lineWidth = 2;
  targetCtx.stroke();
  targetCtx.save();
  targetCtx.translate(handleX, handleY);
  targetCtx.strokeStyle = "#FFFFFF";
  targetCtx.lineWidth = 2;
  targetCtx.beginPath();
  targetCtx.arc(0, 0, 6, -Math.PI * 0.7, Math.PI * 0.3);
  targetCtx.stroke();
  targetCtx.beginPath();
  const endAngle = Math.PI * 0.3;
  const endX = Math.cos(endAngle) * 6;
  const endY = Math.sin(endAngle) * 6;
  targetCtx.moveTo(endX - 3, endY - 3);
  targetCtx.lineTo(endX, endY);
  targetCtx.lineTo(endX + 3, endY - 2);
  targetCtx.stroke();
  targetCtx.restore();
  targetCtx.save();
  targetCtx.translate(shape.x, shape.y);
  targetCtx.rotate(shape.rotation);
  targetCtx.strokeStyle = "#6366F1";
  targetCtx.lineWidth = 2.5;
  targetCtx.setLineDash([6, 3]);
  const half = shape.size / 2 + 5;
  switch (shape.type) {
    case "rectangle" /* RECTANGLE */:
      targetCtx.strokeRect(-half, -half, half * 2, half * 2);
      break;
    case "triangle" /* TRIANGLE */: {
      const sideLength = shape.size;
      const circumR = sideLength / Math.sqrt(3) + 5;
      targetCtx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = i * 2 * Math.PI / 3 - Math.PI / 2;
        const vx = circumR * Math.cos(a);
        const vy = circumR * Math.sin(a);
        if (i === 0) targetCtx.moveTo(vx, vy);
        else targetCtx.lineTo(vx, vy);
      }
      targetCtx.closePath();
      targetCtx.stroke();
      break;
    }
    case "circle" /* CIRCLE */:
      targetCtx.beginPath();
      targetCtx.arc(0, 0, half, 0, Math.PI * 2);
      targetCtx.stroke();
      break;
  }
  targetCtx.setLineDash([]);
  targetCtx.restore();
  targetCtx.restore();
}
function getDropZoneIndex(x, y) {
  for (const dz of dropZones) {
    if (x >= dz.x && x <= dz.x + dz.width && y >= dz.y && y <= dz.y + dz.height) {
      return dz.index;
    }
  }
  return -1;
}
function clearUI() {
  for (const el of uiElements) {
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }
  uiElements = [];
}
function setBubbleText(text) {
  currentBubbleText = text;
  const bubbleEl = document.getElementById("bubbleText");
  if (bubbleEl) {
    bubbleEl.textContent = text;
  }
}
function initDropZones() {
  dropZones = [];
  const totalWidth = 3 * appData.dropZoneSize + 2 * appData.dropZoneGap;
  const startX = (appData.canvasWidth - totalWidth) / 2;
  for (let i = 0; i < 3; i++) {
    dropZones.push({
      x: startX + i * (appData.dropZoneSize + appData.dropZoneGap),
      y: appData.dropZoneY,
      width: appData.dropZoneSize,
      height: appData.dropZoneSize,
      index: i
    });
  }
}
function initPaletteShapes() {
  paletteShapes = [];
  const totalShapes = 3;
  const totalWidth = appData.canvasWidth * 0.5;
  const startX = (appData.canvasWidth - totalWidth) / 2;
  const gap = totalWidth / (totalShapes - 1);
  const y = appData.paletteY;
  const size = appData.shapeSize;
  paletteShapes.push({
    type: "rectangle" /* RECTANGLE */,
    color: "#5B8DEF",
    rgbColor: hexToRgb("#5B8DEF"),
    x: startX,
    y,
    size,
    label: "\uD30C\uB791 \uB124\uBAA8"
  });
  paletteShapes.push({
    type: "triangle" /* TRIANGLE */,
    color: "#FFD966",
    rgbColor: hexToRgb("#FFD966"),
    x: startX + gap,
    y,
    size,
    label: "\uB178\uB791 \uC138\uBAA8"
  });
  paletteShapes.push({
    type: "circle" /* CIRCLE */,
    color: "#FF6B6B",
    rgbColor: hexToRgb("#FF6B6B"),
    x: startX + gap * 2,
    y,
    size,
    label: "\uBE68\uAC15 \uB3D9\uADF8\uB77C\uBBF8"
  });
}
function drawBackground() {
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  const gradient = ctx.createLinearGradient(0, 0, 0, appData.canvasHeight);
  gradient.addColorStop(0, "#F5F7FB");
  gradient.addColorStop(0.5, "#EEF1F8");
  gradient.addColorStop(1, "#E8EDF6");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, appData.canvasWidth, appData.canvasHeight);
  ctx.restore();
}
function drawDropZones() {
  const borderColors = appData.dropZoneBorderColors || ["#F4A7BB", "#A7D7A0", "#7EB8E0"];
  for (let i = 0; i < dropZones.length; i++) {
    const dz = dropZones[i];
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.shadowColor = "rgba(91, 141, 239, 0.10)";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 6;
    drawRoundedRect(ctx, dz.x, dz.y, dz.width, dz.height, appData.dropZoneCornerRadius);
    ctx.fillStyle = "#FAFBFF";
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = borderColors[i];
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }
  drawAllTargetIntersections();
}
function drawPaletteArea() {
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  const palY = appData.paletteY - appData.shapeSize * 0.8;
  const palH = appData.shapeSize * 1.8;
  ctx.shadowColor = "rgba(91, 141, 239, 0.08)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = -2;
  drawRoundedRect(ctx, 20, palY, appData.canvasWidth - 40, palH, 20);
  const palGrad = ctx.createLinearGradient(20, palY, 20, palY + palH);
  palGrad.addColorStop(0, "rgba(255, 255, 255, 0.85)");
  palGrad.addColorStop(1, "rgba(245, 247, 251, 0.80)");
  ctx.fillStyle = palGrad;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.strokeStyle = "rgba(184, 198, 224, 0.45)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}
function drawPaletteShapes() {
  for (const ps of paletteShapes) {
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    drawShape(ctx, ps.type, ps.x, ps.y, ps.size, ps.color, 0, 0.9);
    ctx.restore();
  }
}
function checkNearHint(shape) {
  if (shape.dropZoneIndex < 0) return false;
  const dzIndex = shape.dropZoneIndex;
  const dz = dropZones[dzIndex];
  if (!dz) return false;
  const centerX = dz.x + dz.width / 2;
  const centerY = dz.y + dz.height / 2;
  const entry = appData.answerMap.find((e) => e.dropZoneIndex === dzIndex);
  if (!entry) return false;
  const nearThreshold = appData.nearHintThreshold || 80;
  const nearAngleThreshold = appData.nearHintAngleThreshold || 35;
  for (let i = 0; i < entry.shapes.length; i++) {
    const expectedType = entry.shapes[i].type;
    if (shape.type !== expectedType) continue;
    const expectedColor = entry.shapes[i].color.toUpperCase();
    if (shape.color.toUpperCase() !== expectedColor) continue;
    const offset = entry.targetOffsets[i];
    const targetX = centerX + offset.x;
    const targetY = centerY + offset.y;
    const targetRotation = offset.rotation * Math.PI / 180;
    const dx = targetX - shape.x;
    const dy = targetY - shape.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angleMatch = isAngleMatchWithSymmetry(shape.type, shape.rotation, targetRotation, nearAngleThreshold);
    if (dist < nearThreshold && angleMatch) {
      return true;
    }
  }
  return false;
}
function drawClonedShapes() {
  const shapesByDropZone = /* @__PURE__ */ new Map();
  for (const s of clonedShapes) {
    if (s.dropZoneIndex >= 0) {
      if (!shapesByDropZone.has(s.dropZoneIndex)) {
        shapesByDropZone.set(s.dropZoneIndex, []);
      }
      shapesByDropZone.get(s.dropZoneIndex).push(s);
    }
  }
  for (let i = 0; i < clonedShapes.length; i++) {
    const s = clonedShapes[i];
    const isInDropZone = s.dropZoneIndex >= 0;
    const useHintGlow = s.nearHint && (s === draggingShape || s === selectedShape);
    if (isInDropZone) {
      const dz = dropZones[s.dropZoneIndex];
      if (!dz) continue;
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      drawRoundedRect(ctx, dz.x, dz.y, dz.width, dz.height, appData.dropZoneCornerRadius);
      ctx.clip();
      if (useHintGlow) {
        drawShapeWithHintGlow(ctx, s.type, s.x, s.y, s.size, s.color, s.rotation, 0.85);
      } else {
        drawShape(ctx, s.type, s.x, s.y, s.size, s.color, s.rotation, 0.85);
      }
      ctx.restore();
    } else {
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      if (useHintGlow) {
        drawShapeWithHintGlow(ctx, s.type, s.x, s.y, s.size, s.color, s.rotation, 0.85);
      } else {
        drawShape(ctx, s.type, s.x, s.y, s.size, s.color, s.rotation, 0.85);
      }
      ctx.restore();
    }
  }
  shapesByDropZone.forEach((shapes, dzIndex) => {
    if (shapes.length >= 2) {
      const dz = dropZones[dzIndex];
      if (!dz) return;
      for (let a = 0; a < shapes.length; a++) {
        for (let b = a + 1; b < shapes.length; b++) {
          drawShapeIntersectionBlend(shapes[a], shapes[b], dz);
        }
      }
    }
  });
  if (selectedShape && currentState === "playing" /* PLAYING */ && !selectedShape.snapped) {
    drawRotationHandle(ctx, selectedShape);
  }
}
function drawGuideCharacter() {
  const charX = 60;
  const charY = appData.paletteY - appData.shapeSize * 0.8 - 45;
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.font = "44px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("\u{1F575}\uFE0F", charX, charY);
  ctx.restore();
  if (currentBubbleText) {
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    const bubbleX = charX + 50;
    const bubbleY = charY - 28;
    const padding = 16;
    ctx.font = "bold 13px sans-serif";
    const textWidth = ctx.measureText(currentBubbleText).width;
    const bubbleW = textWidth + padding * 2;
    const bubbleH = 36;
    ctx.shadowColor = "rgba(91, 141, 239, 0.12)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;
    drawRoundedRect(ctx, bubbleX, bubbleY, bubbleW, bubbleH, 14);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = "#C8D3E8";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bubbleX + 5, bubbleY + bubbleH * 0.5 - 5);
    ctx.lineTo(bubbleX - 10, bubbleY + bubbleH * 0.5 + 2);
    ctx.lineTo(bubbleX + 5, bubbleY + bubbleH * 0.5 + 8);
    ctx.closePath();
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.strokeStyle = "#C8D3E8";
    ctx.stroke();
    ctx.fillStyle = "#4A5578";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(currentBubbleText, bubbleX + bubbleW / 2, bubbleY + bubbleH / 2);
    ctx.restore();
  }
}
function drawTitleScreen() {
  const now = Date.now();
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  const gradient = ctx.createLinearGradient(0, 0, appData.canvasWidth, appData.canvasHeight);
  gradient.addColorStop(0, "#4A6CF7");
  gradient.addColorStop(0.4, "#6366F1");
  gradient.addColorStop(0.7, "#8B5CF6");
  gradient.addColorStop(1, "#A78BFA");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, appData.canvasWidth, appData.canvasHeight);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.globalCompositeOperation = "source-over";
  for (let row = 0; row < appData.canvasHeight; row += 6) {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, row, appData.canvasWidth, 1);
  }
  ctx.restore();
  ctx.save();
  const types = ["rectangle" /* RECTANGLE */, "triangle" /* TRIANGLE */, "circle" /* CIRCLE */];
  const colors = ["#93C5FD", "#FDE68A", "#FCA5A5"];
  for (let i = 0; i < 12; i++) {
    const sx = Math.sin(i * 2.1 + now * 1e-3) * 300 + appData.canvasWidth / 2;
    const sy = Math.cos(i * 1.7 + now * 8e-4) * 200 + appData.canvasHeight / 2;
    const size = 40 + i % 3 * 30;
    const rot = now * 1e-3 * (i + 1) * 0.1;
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.globalCompositeOperation = "source-over";
    ctx.translate(sx, sy);
    ctx.rotate(rot);
    switch (types[i % 3]) {
      case "rectangle" /* RECTANGLE */:
        ctx.fillStyle = colors[i % 3];
        ctx.fillRect(-size / 2, -size / 2, size, size);
        break;
      case "triangle" /* TRIANGLE */:
        ctx.fillStyle = colors[i % 3];
        ctx.beginPath();
        ctx.moveTo(0, -size / 2);
        ctx.lineTo(size / 2, size / 2);
        ctx.lineTo(-size / 2, size / 2);
        ctx.closePath();
        ctx.fill();
        break;
      case "circle" /* CIRCLE */:
        ctx.fillStyle = colors[i % 3];
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        break;
    }
    ctx.restore();
  }
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 36px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.2)";
  ctx.shadowBlur = 12;
  ctx.fillText(textData.title, appData.canvasWidth / 2, appData.canvasHeight / 2 - 60);
  ctx.font = "24px sans-serif";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText(textData.subtitle, appData.canvasWidth / 2, appData.canvasHeight / 2 - 10);
  const pulse = 0.5 + 0.5 * Math.sin(now * 3e-3);
  ctx.font = "20px sans-serif";
  ctx.fillStyle = "rgba(255,255,255," + pulse + ")";
  ctx.shadowBlur = 0;
  ctx.fillText(textData.titleInstruction, appData.canvasWidth / 2, appData.canvasHeight / 2 + 60);
  ctx.restore();
}
function drawInstructionScreen() {
  drawBackground();
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  const accentGrad = ctx.createLinearGradient(0, 0, appData.canvasWidth, 0);
  accentGrad.addColorStop(0, "#5B8DEF");
  accentGrad.addColorStop(0.5, "#8B5CF6");
  accentGrad.addColorStop(1, "#A78BFA");
  ctx.fillStyle = accentGrad;
  ctx.fillRect(0, 0, appData.canvasWidth, 4);
  ctx.fillStyle = "#3B4A6B";
  ctx.font = "bold 28px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(textData.instructionTitle, appData.canvasWidth / 2, 70);
  const instructions = [textData.instruction1, textData.instruction2, textData.instruction3];
  const icons = ["\u{1F446}", "\u{1F504}", "\u{1F3A8}"];
  const iconBgColors = ["rgba(91, 141, 239, 0.12)", "rgba(139, 92, 246, 0.12)", "rgba(255, 107, 107, 0.12)"];
  for (let i = 0; i < instructions.length; i++) {
    const y = 160 + i * 85;
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.shadowColor = "rgba(91, 141, 239, 0.08)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;
    drawRoundedRect(ctx, appData.canvasWidth * 0.06, y - 32, appData.canvasWidth * 0.6, 64, 14);
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = iconBgColors[i];
    ctx.beginPath();
    ctx.arc(appData.canvasWidth * 0.12, y, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.font = "32px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(icons[i], appData.canvasWidth * 0.12, y);
    ctx.font = "17px sans-serif";
    ctx.fillStyle = "#4A5578";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(instructions[i], appData.canvasWidth * 0.2, y);
    ctx.fillStyle = "#3B4A6B";
  }
  drawShape(ctx, "rectangle" /* RECTANGLE */, appData.canvasWidth * 0.78, 180, 50, "#5B8DEF", 0.15, 0.75);
  drawShape(ctx, "triangle" /* TRIANGLE */, appData.canvasWidth * 0.85, 265, 50, "#FFD966", 0.3, 0.75);
  drawShape(ctx, "circle" /* CIRCLE */, appData.canvasWidth * 0.8, 345, 50, "#FF6B6B", 0, 0.75);
  const pulse = 0.4 + 0.6 * Math.sin(Date.now() * 3e-3);
  ctx.font = "18px sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(91, 107, 139," + pulse + ")";
  ctx.globalAlpha = 1;
  ctx.fillText(textData.instructionStart, appData.canvasWidth / 2, appData.canvasHeight - 60);
  ctx.restore();
}
function normalizeAngle(angle) {
  let a = angle % (Math.PI * 2);
  if (a > Math.PI) a -= Math.PI * 2;
  if (a < -Math.PI) a += Math.PI * 2;
  return a;
}
function trySnapToTarget(shape) {
  if (shape.dropZoneIndex < 0) return false;
  const dzIndex = shape.dropZoneIndex;
  const dz = dropZones[dzIndex];
  if (!dz) return false;
  const centerX = dz.x + dz.width / 2;
  const centerY = dz.y + dz.height / 2;
  const entry = appData.answerMap.find((e) => e.dropZoneIndex === dzIndex);
  if (!entry) return false;
  let bestDist = Infinity;
  let bestIndex = -1;
  let bestTargetX = 0;
  let bestTargetY = 0;
  let bestTargetRotation = 0;
  for (let i = 0; i < entry.shapes.length; i++) {
    const expectedType = entry.shapes[i].type;
    if (shape.type !== expectedType) continue;
    const expectedColor = entry.shapes[i].color.toUpperCase();
    if (shape.color.toUpperCase() !== expectedColor) continue;
    const offset = entry.targetOffsets[i];
    const targetX = centerX + offset.x;
    const targetY = centerY + offset.y;
    const targetRotation = offset.rotation * Math.PI / 180;
    const dx = targetX - shape.x;
    const dy = targetY - shape.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angleMatch = isAngleMatchWithSymmetry(shape.type, shape.rotation, targetRotation, appData.snapAngleThreshold);
    const alreadySnapped = clonedShapes.some(
      (s) => s !== shape && s.snapped && s.dropZoneIndex === dzIndex && s.type === expectedType && s.color.toUpperCase() === expectedColor
    );
    if (alreadySnapped) continue;
    if (dist < appData.snapThreshold && angleMatch && dist < bestDist) {
      bestDist = dist;
      bestIndex = i;
      bestTargetX = targetX;
      bestTargetY = targetY;
      bestTargetRotation = targetRotation;
    }
  }
  if (bestIndex >= 0) {
    const snapRotation = findNearestSymmetricRotation(shape.type, shape.rotation, bestTargetRotation);
    gsapWithCSS.to(shape, {
      x: bestTargetX,
      y: bestTargetY,
      rotation: snapRotation,
      duration: 0.18,
      ease: "power2.out",
      onComplete: () => {
        showSnapCheckAnimation(bestTargetX, bestTargetY);
      }
    });
    shape.snapped = true;
    shape.nearHint = false;
    setTimeout(() => {
      checkAutoComplete();
    }, 250);
    return true;
  }
  return false;
}
function showSnapCheckAnimation(x, y) {
  const checkEl = AppHelper.createUIElement(
    "div",
    "",
    {
      position: "absolute",
      left: x / appData.canvasWidth * 100 + "%",
      top: y / appData.canvasHeight * 100 + "%",
      width: "40px",
      height: "40px",
      marginLeft: "-20px",
      marginTop: "-20px",
      fontSize: "28px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "none",
      zIndex: "20",
      opacity: "1",
      transition: "all 0.5s ease-out",
      boxSizing: "border-box"
    },
    "\u2705",
    []
  );
  uiLayer.appendChild(checkEl);
  setTimeout(() => {
    checkEl.style.opacity = "0";
    checkEl.style.transform = "translateY(-20px) scale(1.3)";
  }, 50);
  setTimeout(() => {
    if (checkEl.parentNode) {
      checkEl.parentNode.removeChild(checkEl);
    }
  }, 600);
}
function checkAutoComplete() {
  if (currentState !== "playing" /* PLAYING */) return;
  let allComplete = true;
  for (const entry of appData.answerMap) {
    const dzIndex = entry.dropZoneIndex;
    const snappedInZone = clonedShapes.filter((s) => s.dropZoneIndex === dzIndex && s.snapped);
    if (snappedInZone.length < entry.shapes.length) {
      allComplete = false;
      break;
    }
  }
  if (allComplete) {
    const isCorrect = checkAllAnswers();
    if (isCorrect) {
      handleCorrectAnswer();
    }
  }
}
function handleCorrectAnswer() {
  currentState = "result" /* RESULT */;
  selectedShape = null;
  setBubbleText(textData.correctBubble);
  try {
    confetti_module_default({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#5B8DEF", "#FFD966", "#FF6B6B", "#76C893", "#A78BFA"]
    });
  } catch (_e) {
  }
  for (const s of clonedShapes) {
    if (s.snapped) {
      gsapWithCSS.to(s, {
        scale: 1.12,
        duration: 0.25,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut"
      });
    }
  }
  setTimeout(() => {
    showGameOverScreen();
  }, 2500);
}
function showGameOverScreen() {
  currentState = "gameover" /* GAMEOVER */;
  gameOverAlpha = 0;
  clearUI();
  const overlay = AppHelper.createUIElement(
    "div",
    "gameOverOverlay",
    {
      position: "absolute",
      left: "0",
      top: "0",
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "auto",
      zIndex: "30",
      boxSizing: "border-box",
      opacity: "0",
      transition: "opacity 0.6s ease-in"
    },
    "",
    []
  );
  const card = AppHelper.createUIElement(
    "div",
    "gameOverCard",
    {
      position: "relative",
      width: "50%",
      padding: "4% 3%",
      backgroundColor: "rgba(255,255,255,0.96)",
      borderRadius: "24px",
      boxShadow: "0 12px 40px rgba(99, 102, 241, 0.25)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "16px",
      boxSizing: "border-box",
      pointerEvents: "auto"
    },
    "",
    []
  );
  const emoji = AppHelper.createUIElement(
    "div",
    "gameOverEmoji",
    {
      fontSize: "56px",
      lineHeight: "1.2",
      boxSizing: "border-box",
      pointerEvents: "none"
    },
    "\u{1F389}",
    []
  );
  const titleEl = AppHelper.createUIElement(
    "div",
    "gameOverTitleEl",
    {
      fontSize: "28px",
      fontWeight: "bold",
      color: "#3B4A6B",
      textAlign: "center",
      boxSizing: "border-box",
      pointerEvents: "none"
    },
    textData.gameOverTitle,
    []
  );
  const msgEl = AppHelper.createUIElement(
    "div",
    "gameOverMsgEl",
    {
      fontSize: "16px",
      color: "#6B7A99",
      textAlign: "center",
      lineHeight: "1.5",
      boxSizing: "border-box",
      pointerEvents: "none"
    },
    textData.gameOverMessage,
    []
  );
  const restartBtn = AppHelper.createUIElement(
    "button",
    "gameOverRestartBtn",
    {
      padding: "12px 36px",
      backgroundColor: "#6366F1",
      color: "#FFFFFF",
      border: "none",
      borderRadius: "14px",
      fontSize: "18px",
      fontWeight: "bold",
      cursor: "pointer",
      pointerEvents: "auto",
      boxSizing: "border-box",
      boxShadow: "0 4px 16px rgba(99, 102, 241, 0.35)",
      marginTop: "8px"
    },
    textData.gameOverRestart,
    [
      {
        event: "pointerdown",
        handler: (ev) => {
          ev.stopPropagation();
          handleReset();
        }
      }
    ]
  );
  card.appendChild(emoji);
  card.appendChild(titleEl);
  card.appendChild(msgEl);
  card.appendChild(restartBtn);
  overlay.appendChild(card);
  uiLayer.appendChild(overlay);
  uiElements.push(overlay);
  setTimeout(() => {
    overlay.style.opacity = "1";
  }, 50);
}
function drawGameOverOverlay() {
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, appData.canvasWidth, appData.canvasHeight);
  ctx.restore();
  const now = Date.now();
  ctx.save();
  for (let i = 0; i < 20; i++) {
    const px2 = (Math.sin(i * 3.7 + now * 1e-3) * 0.5 + 0.5) * appData.canvasWidth;
    const py = (Math.cos(i * 2.3 + now * 12e-4) * 0.5 + 0.5) * appData.canvasHeight;
    const sparkleSize = 2 + Math.sin(now * 5e-3 + i) * 2;
    ctx.globalAlpha = 0.3 + 0.3 * Math.sin(now * 3e-3 + i * 1.5);
    ctx.fillStyle = i % 3 === 0 ? "#FFD966" : i % 3 === 1 ? "#5B8DEF" : "#FF6B6B";
    ctx.beginPath();
    ctx.arc(px2, py, sparkleSize, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
function drawPlayingScreen() {
  drawBackground();
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.shadowColor = "rgba(91, 141, 239, 0.08)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  drawRoundedRect(ctx, 20, 8, appData.canvasWidth - 40, 32, 10);
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.save();
  const headerAccent = ctx.createLinearGradient(20, 8, appData.canvasWidth - 20, 8);
  headerAccent.addColorStop(0, "#5B8DEF");
  headerAccent.addColorStop(0.5, "#8B5CF6");
  headerAccent.addColorStop(1, "#A78BFA");
  drawRoundedRect(ctx, 20, 8, appData.canvasWidth - 40, 3, 2);
  ctx.fillStyle = headerAccent;
  ctx.fill();
  ctx.restore();
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#3B4A6B";
  ctx.font = "bold 18px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(textData.title, 36, 25);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  const missionY = 48;
  const missionH = 34;
  const missionPadding = 20;
  ctx.font = "bold 14px sans-serif";
  const missionTextWidth = ctx.measureText(textData.mission).width;
  const missionW = missionTextWidth + missionPadding * 2;
  const missionX = 20;
  drawRoundedRect(ctx, missionX, missionY, missionW, missionH, 8);
  ctx.fillStyle = "#4285F4";
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(textData.mission, missionX + missionPadding, missionY + missionH / 2);
  ctx.restore();
  drawDropZones();
  drawPaletteArea();
  drawPaletteShapes();
  drawClonedShapes();
  drawGuideCharacter();
  if (currentState === "gameover" /* GAMEOVER */) {
    drawGameOverOverlay();
  }
}
function render3() {
  if (!ctx || !appData) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, appData.canvasWidth, appData.canvasHeight);
  hintGlowTime += 0.016;
  for (const s of clonedShapes) {
    if (s === draggingShape || s === selectedShape && isRotating) {
      s.nearHint = checkNearHint(s);
    } else if (!s.snapped) {
      s.nearHint = false;
    }
  }
  switch (currentState) {
    case "title" /* TITLE */:
      drawTitleScreen();
      break;
    case "instruction" /* INSTRUCTION */:
      drawInstructionScreen();
      break;
    case "playing" /* PLAYING */:
    case "animating" /* ANIMATING */:
    case "result" /* RESULT */:
    case "gameover" /* GAMEOVER */:
      drawPlayingScreen();
      break;
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  animFrameId = requestAnimationFrame(render3);
}
function findPaletteShapeAt(x, y) {
  for (let i = paletteShapes.length - 1; i >= 0; i--) {
    const ps = paletteShapes[i];
    if (isPointInShape(x, y, { type: ps.type, x: ps.x, y: ps.y, size: ps.size, rotation: 0 })) {
      return ps;
    }
  }
  return null;
}
function findClonedShapeAt(x, y) {
  for (let i = clonedShapes.length - 1; i >= 0; i--) {
    const cs = clonedShapes[i];
    if (isPointInShape(x, y, cs)) {
      return cs;
    }
  }
  return null;
}
function createClone(palette, x, y) {
  const clone = {
    id: nextCloneId++,
    type: palette.type,
    color: palette.color,
    rgbColor: [...palette.rgbColor],
    x,
    y,
    rotation: 0,
    scale: 1,
    size: palette.size,
    selected: false,
    dropZoneIndex: -1,
    snapped: false,
    nearHint: false
  };
  clonedShapes.push(clone);
  return clone;
}
function updateShapeDropZone(shape) {
  shape.dropZoneIndex = getDropZoneIndex(shape.x, shape.y);
}
function handlePointerDown(e) {
  e.preventDefault();
  const coords = AppHelper.getRelativeCoordinates(e.clientX, e.clientY, appCanvas);
  const x = coords.x;
  const y = coords.y;
  if (currentState === "title" /* TITLE */) {
    soundsInitialized = true;
    currentState = "instruction" /* INSTRUCTION */;
    return;
  }
  if (currentState === "instruction" /* INSTRUCTION */) {
    currentState = "playing" /* PLAYING */;
    setBubbleText(textData.defaultBubble);
    createPlayingUI();
    return;
  }
  if (currentState !== "playing" /* PLAYING */) return;
  if (selectedShape && !selectedShape.snapped && isPointOnRotationHandle(x, y, selectedShape)) {
    isRotating = true;
    rotationStartAngle = Math.atan2(y - selectedShape.y, x - selectedShape.x);
    shapeStartAngle = selectedShape.rotation;
    appCanvas.style.cursor = "grabbing";
    return;
  }
  const clickedClone = findClonedShapeAt(x, y);
  if (clickedClone) {
    if (clickedClone.snapped) {
      clickedClone.snapped = false;
    }
    selectedShape = clickedClone;
    draggingShape = clickedClone;
    isDraggingFromPalette = false;
    dragOffsetX = x - clickedClone.x;
    dragOffsetY = y - clickedClone.y;
    const idx = clonedShapes.indexOf(clickedClone);
    if (idx >= 0) {
      clonedShapes.splice(idx, 1);
      clonedShapes.push(clickedClone);
    }
    return;
  }
  const clickedPalette = findPaletteShapeAt(x, y);
  if (clickedPalette) {
    const clone = createClone(clickedPalette, x, y);
    selectedShape = clone;
    draggingShape = clone;
    isDraggingFromPalette = true;
    dragOffsetX = 0;
    dragOffsetY = 0;
    return;
  }
  selectedShape = null;
}
function handlePointerMove(e) {
  e.preventDefault();
  const coords = AppHelper.getRelativeCoordinates(e.clientX, e.clientY, appCanvas);
  const x = coords.x;
  const y = coords.y;
  if (currentState !== "playing" /* PLAYING */) return;
  if (isRotating && selectedShape) {
    const angle = Math.atan2(y - selectedShape.y, x - selectedShape.x);
    const deltaAngle = angle - rotationStartAngle;
    let newRotation = shapeStartAngle + deltaAngle;
    selectedShape.rotation = newRotation;
    return;
  }
  if (draggingShape) {
    draggingShape.x = x - dragOffsetX;
    draggingShape.y = y - dragOffsetY;
    updateShapeDropZone(draggingShape);
    return;
  }
}
function handlePointerUp(e) {
  e.preventDefault();
  if (currentState !== "playing" /* PLAYING */) return;
  if (isRotating) {
    isRotating = false;
    appCanvas.style.cursor = "default";
    if (selectedShape && selectedShape.dropZoneIndex >= 0) {
      trySnapToTarget(selectedShape);
    }
    return;
  }
  if (draggingShape) {
    updateShapeDropZone(draggingShape);
    if (draggingShape.y > appData.paletteY - appData.shapeSize * 0.5 && draggingShape.dropZoneIndex === -1) {
      const idx = clonedShapes.indexOf(draggingShape);
      if (idx >= 0) {
        const removingShape = draggingShape;
        gsapWithCSS.to(removingShape, {
          scale: 0,
          duration: 0.2,
          ease: "power2.in",
          onComplete: () => {
            const removeIdx = clonedShapes.indexOf(removingShape);
            if (removeIdx >= 0) {
              clonedShapes.splice(removeIdx, 1);
            }
            if (selectedShape === removingShape) selectedShape = null;
          }
        });
      }
    } else if (draggingShape.dropZoneIndex >= 0) {
      trySnapToTarget(draggingShape);
    }
    draggingShape.nearHint = false;
    draggingShape = null;
    isDraggingFromPalette = false;
  }
}
function handleKeyDown(e) {
  if (currentState !== "playing" /* PLAYING */) return;
  if (e.key === "Delete" || e.key === "Backspace") {
    if (selectedShape) {
      const idx = clonedShapes.indexOf(selectedShape);
      if (idx >= 0) {
        clonedShapes.splice(idx, 1);
      }
      selectedShape = null;
    }
  }
}
function createPlayingUI() {
  clearUI();
  const btnCheck = AppHelper.createUIElement(
    "button",
    "btnCheckAnswer",
    {
      position: "absolute",
      right: "2%",
      bottom: "6%",
      width: "14%",
      height: "6%",
      backgroundColor: "#4285F4",
      color: "#FFFFFF",
      border: "none",
      borderRadius: "12px",
      fontSize: "15px",
      fontWeight: "bold",
      cursor: "pointer",
      pointerEvents: "auto",
      boxSizing: "border-box",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 4px 14px rgba(66, 133, 244, 0.35)",
      zIndex: "10"
    },
    textData.checkAnswer,
    [
      {
        event: "pointerdown",
        handler: (ev) => {
          ev.stopPropagation();
          handleCheckAnswer();
        }
      }
    ]
  );
  uiLayer.appendChild(btnCheck);
  uiElements.push(btnCheck);
}
function handleCheckAnswer() {
  if (currentState !== "playing" /* PLAYING */) return;
  const isCorrect = checkAllAnswers();
  if (isCorrect) {
    handleCorrectAnswer();
  } else {
    setBubbleText(textData.wrongBubble);
    const unsnappedInZones = clonedShapes.filter((s) => s.dropZoneIndex >= 0 && !s.snapped);
    for (const s of unsnappedInZones) {
      const origX = s.x;
      gsapWithCSS.to(s, {
        x: origX + 8,
        duration: 0.05,
        yoyo: true,
        repeat: 5,
        ease: "power1.inOut",
        onComplete: () => {
          s.x = origX;
        }
      });
    }
    setTimeout(() => {
      setBubbleText(textData.defaultBubble);
    }, 2e3);
  }
}
function handleReset() {
  clonedShapes = [];
  selectedShape = null;
  draggingShape = null;
  isRotating = false;
  isDraggingFromPalette = false;
  gameOverAlpha = 0;
  currentState = "playing" /* PLAYING */;
  setBubbleText(textData.defaultBubble);
  clearUI();
  createPlayingUI();
}
async function initApp() {
  appData = await AppHelper.loadAppData();
  textData = await AppHelper.loadTextData();
  assetListData = await AppHelper.loadAssetList();
  appCanvas = document.getElementById("appCanvas");
  uiLayer = document.getElementById("uiLayer");
  ctx = appCanvas.getContext("2d");
  appCanvas.width = appData.canvasWidth;
  appCanvas.height = appData.canvasHeight;
  initDropZones();
  initPaletteShapes();
  initTargetIntersections();
  currentState = "title" /* TITLE */;
  currentBubbleText = textData.defaultBubble;
  appCanvas.addEventListener("pointerdown", handlePointerDown);
  appCanvas.addEventListener("pointermove", handlePointerMove);
  appCanvas.addEventListener("pointerup", handlePointerUp);
  appCanvas.addEventListener("pointercancel", handlePointerUp);
  appCanvas.addEventListener("contextmenu", (e) => e.preventDefault());
  appCanvas.addEventListener("touchstart", (e) => e.preventDefault(), { passive: false });
  appCanvas.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
  document.addEventListener("keydown", handleKeyDown);
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = 0;
  }
  render3();
}
var targetIntersections, assetListData, nextCloneId, currentState, appData, textData, appCanvas, ctx, uiLayer, clonedShapes, paletteShapes, dropZones, selectedShape, draggingShape, isDraggingFromPalette, isRotating, dragOffsetX, dragOffsetY, rotationStartAngle, shapeStartAngle, currentBubbleText, animFrameId, uiElements, soundsInitialized, hintGlowTime, gameOverAlpha;
var init_app = __esm({
  "public/20260401183100_f1bbc072-ea26-42d7-a4eb-8de16f4caed3/app.ts"() {
    init_appHelper();
    init_gsap();
    init_confetti_module();
    targetIntersections = [];
    nextCloneId = 1;
    currentState = "title" /* TITLE */;
    clonedShapes = [];
    paletteShapes = [];
    dropZones = [];
    selectedShape = null;
    draggingShape = null;
    isDraggingFromPalette = false;
    isRotating = false;
    dragOffsetX = 0;
    dragOffsetY = 0;
    rotationStartAngle = 0;
    shapeStartAngle = 0;
    currentBubbleText = "";
    animFrameId = 0;
    uiElements = [];
    soundsInitialized = false;
    hintGlowTime = 0;
    gameOverAlpha = 0;
  }
});

// public/20260401183100_f1bbc072-ea26-42d7-a4eb-8de16f4caed3/main.ts
var require_main = __commonJS({
  "public/20260401183100_f1bbc072-ea26-42d7-a4eb-8de16f4caed3/main.ts"() {
    init_app();
    init_appHelper();
    var logicalWidth = 0;
    var logicalHeight = 0;
    var appCanvas2 = document.getElementById("appCanvas");
    var uiLayer2 = document.getElementById("uiLayer");
    var appContainer = document.getElementById("appContainer");
    var isCanvasLayoutUpdating = false;
    function UpdateCanvasLayout() {
      if (!isCanvasLayoutUpdating) {
        window.requestAnimationFrame(() => {
          isCanvasLayoutUpdating = true;
          if (appCanvas2.width !== 1 && appCanvas2.height !== 1) {
            if (logicalWidth === 0 && logicalHeight === 0) {
              logicalWidth = appCanvas2.width;
              logicalHeight = appCanvas2.height;
            }
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            appContainer.style.cssText = "";
            appCanvas2.style.cssText = "";
            uiLayer2.style.cssText = "";
            const aspectCanvas = appCanvas2.width / appCanvas2.height;
            let displayWidth;
            let displayHeight;
            if (vw / vh > aspectCanvas) {
              displayHeight = vh;
              displayWidth = vh * aspectCanvas;
            } else {
              displayWidth = vw;
              displayHeight = vw / aspectCanvas;
            }
            const appContainerScale = displayWidth / appCanvas2.width;
            appContainer.style.position = "absolute";
            appContainer.style.width = appCanvas2.width + "px";
            appContainer.style.height = appCanvas2.height + "px";
            appContainer.style.transformOrigin = "top left";
            appContainer.style.transform = `scale(${appContainerScale})`;
            appContainer.style.left = (vw - displayWidth) / 2 + "px";
            appContainer.style.top = (vh - displayHeight) / 2 + "px";
            appCanvas2.style.position = "absolute";
            appCanvas2.style.width = appCanvas2.width + "px";
            appCanvas2.style.height = "auto";
            appCanvas2.style.top = "0";
            appCanvas2.style.left = "0";
            appCanvas2.style.touchAction = "none";
            const uiLayerScale = appCanvas2.width / logicalWidth;
            ;
            uiLayer2.style.position = "absolute";
            uiLayer2.style.width = logicalWidth + "px";
            uiLayer2.style.height = logicalHeight + "px";
            uiLayer2.style.transformOrigin = "top left";
            uiLayer2.style.transform = `scale(${uiLayerScale})`;
            uiLayer2.style.top = "0";
            uiLayer2.style.left = "0";
          }
          isCanvasLayoutUpdating = false;
        });
      }
    }
    function SetCanvasFocus() {
      if (document.activeElement !== appCanvas2) {
        window.focus();
        appCanvas2.focus();
      }
    }
    var resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.target === appCanvas2) {
          UpdateCanvasLayout();
        }
      }
    });
    var isCapturing = false;
    var lastPingTime = 0;
    var lastCaptureTime = 0;
    var lastResolutionTime = 0;
    var MIN_PARENT_MESSAGE_INTERVAL = 1e3;
    window.parent.postMessage({
      source: "typingx-x-iframe",
      type: "ping-pong-ready"
    }, "*");
    window.addEventListener("message", async (event) => {
      if (!event.data || event.data.source !== "alparka-parent") return;
      const now = Date.now();
      if (event.data.type === "ping" && now - lastPingTime > MIN_PARENT_MESSAGE_INTERVAL) {
        lastPingTime = now;
        window.parent.postMessage({
          source: "typingx-x-iframe",
          type: "pong"
        }, "*");
      } else if (event.data.type === "request-canvas-capture" && now - lastCaptureTime > MIN_PARENT_MESSAGE_INTERVAL && !isCapturing) {
        lastCaptureTime = now;
        isCapturing = true;
        try {
          const dataUrl = await AppHelper.captureCanvasAsDataUrl(true);
          if (dataUrl) {
            window.parent.postMessage({
              source: "typingx-x-iframe",
              type: "canvas-capture",
              payload: { dataUrl }
            }, "*");
          }
        } finally {
          isCapturing = false;
        }
      } else if (event.data.type === "request-app-resolution" && now - lastResolutionTime > MIN_PARENT_MESSAGE_INTERVAL) {
        lastResolutionTime = now;
        window.parent.postMessage({
          source: "typingx-x-iframe",
          type: "app-resolution",
          payload: { width: appCanvas2.width, height: appCanvas2.height }
        }, "*");
      }
    });
    window.addEventListener("resize", UpdateCanvasLayout);
    appCanvas2.addEventListener("pointerdown", SetCanvasFocus);
    document.addEventListener("contextmenu", (e) => e.preventDefault());
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(() => {
        resizeObserver.observe(appCanvas2);
        initApp();
        SetCanvasFocus();
        UpdateCanvasLayout();
      }, 0);
    });
  }
});
export default require_main();
/*! Bundled license information:

gsap/gsap-core.js:
  (*!
   * GSAP 3.12.5
   * https://gsap.com
   *
   * @license Copyright 2008-2024, GreenSock. All rights reserved.
   * Subject to the terms at https://gsap.com/standard-license or for
   * Club GSAP members, the agreement issued with that membership.
   * @author: Jack Doyle, jack@greensock.com
  *)

gsap/CSSPlugin.js:
  (*!
   * CSSPlugin 3.12.5
   * https://gsap.com
   *
   * Copyright 2008-2024, GreenSock. All rights reserved.
   * Subject to the terms at https://gsap.com/standard-license or for
   * Club GSAP members, the agreement issued with that membership.
   * @author: Jack Doyle, jack@greensock.com
  *)
*/
