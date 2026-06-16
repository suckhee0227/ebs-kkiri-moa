// appHelper.ts
import { toPng } from "html-to-image";
var AppHelper = class {
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
  static getRelativeCoordinates(clientX, clientY, appCanvas3) {
    const rect = appCanvas3.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const scaleX = appCanvas3.width / rect.width;
    const scaleY = appCanvas3.height / rect.height;
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
    const appCanvas3 = document.getElementById("appCanvas");
    const appContainer2 = document.getElementById("appContainer");
    if (!appCanvas3 || !appContainer2) return null;
    let dataUrl = null;
    try {
      if (includeUILayer) {
        const savedStyle = appContainer2.style.cssText;
        appContainer2.style.transform = "none";
        appContainer2.style.position = "relative";
        appContainer2.style.left = "0";
        appContainer2.style.top = "0";
        dataUrl = await toPng(appContainer2, {
          width: appCanvas3.width,
          height: appCanvas3.height
        });
        appContainer2.style.cssText = savedStyle;
      } else {
        dataUrl = appCanvas3.toDataURL("image/webp");
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

// app.ts
import gsap from "gsap";
import confetti from "canvas-confetti";
var appData;
var textData;
var assetListData;
var appCanvas;
var ctx;
var uiLayer;
var currentState = "title" /* TITLE */;
var stageIndex = 0;
var gameObjects = [];
var solved = false;
var draggingObj = null;
var dragOffsetX = 0;
var dragOffsetY = 0;
var dragOriginX = 0;
var dragOriginY = 0;
var groupsBeforeDrag = 0;
var currentBubbleText = "";
var animFrameId = 0;
var bgPulse = 0;
var titlePulse = 0;
var uiElements = [];
var characterImg = null;
var bubbleImg = null;
var backgroundImg = null;
var soundsInitialized = false;
var pickupSound = null;
var placeSound = null;
var correctSound = null;
var bgMusic = null;
var bgStarted = false;
function colorHex(key) {
  return appData.colors[key] || "#888888";
}
function attrFor(obj, criterion) {
  if (criterion === "shape") return obj.shape;
  if (criterion === "size") return obj.sizeKey;
  return obj.colorKey;
}
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(full, 16);
  return [num >> 16 & 255, num >> 8 & 255, num & 255];
}
function lighten(hex, amount) {
  const rgb = hexToRgb(hex);
  const r = Math.round(rgb[0] + (255 - rgb[0]) * amount);
  const g = Math.round(rgb[1] + (255 - rgb[1]) * amount);
  const b = Math.round(rgb[2] + (255 - rgb[2]) * amount);
  return `rgb(${r}, ${g}, ${b})`;
}
function darken(hex, amount) {
  const rgb = hexToRgb(hex);
  const r = Math.round(rgb[0] * (1 - amount));
  const g = Math.round(rgb[1] * (1 - amount));
  const b = Math.round(rgb[2] * (1 - amount));
  return `rgb(${r}, ${g}, ${b})`;
}
function playArea() {
  return {
    x0: 56,
    y0: appData.headerHeight + 50,
    x1: appData.canvasWidth - appData.guideGutter - 6,
    y1: appData.canvasHeight - 56
  };
}
function gridCell() {
  return appData.objectRadius * 2 + 16;
}
function gridInfo() {
  const a = playArea();
  const cell = gridCell();
  const cols = Math.max(1, Math.floor((a.x1 - a.x0) / cell));
  const rows = Math.max(1, Math.floor((a.y1 - a.y0) / cell));
  const gx = a.x0 + (a.x1 - a.x0 - cols * cell) / 2 + cell / 2;
  const gy = a.y0 + (a.y1 - a.y0 - rows * cell) / 2 + cell / 2;
  return { cell, cols, rows, gx, gy };
}
function cellCenter(col, row) {
  const g = gridInfo();
  return { x: g.gx + col * g.cell, y: g.gy + row * g.cell };
}
function nearestCell(x, y) {
  const g = gridInfo();
  const col = clamp(Math.round((x - g.gx) / g.cell), 0, g.cols - 1);
  const row = clamp(Math.round((y - g.gy) / g.cell), 0, g.rows - 1);
  return cellCenter(col, row);
}
function initObjects() {
  const isSize = appData.stages[stageIndex].criterion === "size";
  const specs = isSize ? appData.gifts.map((g2) => ({
    id: g2.id,
    kind: "gift",
    shape: "square",
    // unused for gifts
    colorKey: g2.color,
    sizeKey: g2.size,
    radius: appData.objectRadius * (appData.sizes[g2.size] ?? 1)
  })) : appData.objects.map((o) => ({
    id: o.id,
    kind: "shape",
    shape: o.shape,
    colorKey: o.color,
    sizeKey: "",
    radius: appData.objectRadius
  }));
  const g = gridInfo();
  const cells = shuffledIndices(g.cols * g.rows).slice(0, specs.length);
  gameObjects = specs.map((spec, i) => {
    const ci = cells[i];
    const pos = cellCenter(ci % g.cols, Math.floor(ci / g.cols));
    return {
      id: spec.id,
      kind: spec.kind,
      shape: spec.shape,
      colorKey: spec.colorKey,
      sizeKey: spec.sizeKey,
      radius: spec.radius,
      x: pos.x,
      y: pos.y,
      scale: 0,
      dragging: false
    };
  });
  solved = false;
  gameObjects.forEach((o, i) => {
    gsap.to(o, { scale: 1, duration: 0.4, delay: 0.03 * i, ease: "back.out(2)" });
  });
}
function shuffledIndices(n) {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function linked(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y) < gridCell() * 1.5;
}
function clusterObjects() {
  const n = gameObjects.length;
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (i) => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const union = (a, b) => {
    parent[find(a)] = find(b);
  };
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (linked(gameObjects[i], gameObjects[j])) union(i, j);
    }
  }
  const groups = {};
  for (let i = 0; i < n; i++) {
    const root = find(i);
    (groups[root] = groups[root] || []).push(gameObjects[i]);
  }
  return Object.values(groups);
}
function isStageSorted() {
  const criterion = appData.stages[stageIndex].criterion;
  const values = new Set(gameObjects.map((o) => attrFor(o, criterion)));
  const groups = clusterObjects();
  if (groups.length !== values.size) return false;
  return groups.every((g) => g.every((o) => attrFor(o, criterion) === attrFor(g[0], criterion)));
}
function roundRectPath(c, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + rr, y);
  c.arcTo(x + w, y, x + w, y + h, rr);
  c.arcTo(x + w, y + h, x, y + h, rr);
  c.arcTo(x, y + h, x, y, rr);
  c.arcTo(x, y, x + w, y, rr);
  c.closePath();
}
function roundRectSubPath(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
function starSubPath(cx, cy, outer, inner, points) {
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? outer : inner;
    const a = i / (points * 2) * Math.PI * 2 - Math.PI / 2;
    const X = cx + Math.cos(a) * rad;
    const Y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(X, Y);
    else ctx.lineTo(X, Y);
  }
  ctx.closePath();
}
function buildShapePath(shape, cx, cy, r) {
  ctx.beginPath();
  if (shape === "circle") {
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
  } else if (shape === "square") {
    const s = r * 0.9;
    roundRectSubPath(cx - s, cy - s, s * 2, s * 2, s * 0.26);
  } else if (shape === "triangle") {
    const a = r * 1.12;
    ctx.moveTo(cx, cy - a);
    ctx.lineTo(cx + a * 0.92, cy + a * 0.72);
    ctx.lineTo(cx - a * 0.92, cy + a * 0.72);
    ctx.closePath();
  } else {
    starSubPath(cx, cy, r * 1.08, r * 0.5, 5);
  }
}
function drawBackground() {
  const w = appData.canvasWidth;
  const h = appData.canvasHeight;
  if (backgroundImg && backgroundImg.complete && backgroundImg.naturalWidth > 0) {
    ctx.drawImage(backgroundImg, 0, 0, w, h);
    ctx.fillStyle = "rgba(255,249,238,0.32)";
    ctx.fillRect(0, 0, w, h);
    return;
  }
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#FFF7E6");
  g.addColorStop(0.55, "#FDEFD6");
  g.addColorStop(1, "#FCE6C8");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  for (let i = 0; i < 9; i++) {
    const px = i * 137.5 % w;
    const py = 120 + i * 90 % (h - 200);
    const drift = Math.sin(bgPulse * 0.8 + i) * 8;
    ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.45)" : "rgba(255,214,153,0.35)";
    ctx.beginPath();
    ctx.arc(px, py + drift, 16 + i % 3 * 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
function drawHeader() {
  const w = appData.canvasWidth;
  const hh = appData.headerHeight;
  const stage = appData.stages[stageIndex];
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, "#FF8A3D");
  g.addColorStop(1, "#FF6B6B");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, hh);
  ctx.save();
  roundRectPath(ctx, 22, 14, 86, hh - 28, 12);
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fill();
  ctx.fillStyle = "#FF6B3D";
  ctx.font = "700 24px 'Jua','Noto Sans KR',sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(textData.codeBadge, 65, hh / 2 + 1);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 30px 'Jua','Noto Sans KR',sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(textData.appTitle, 124, hh / 2 + 1);
  const chipText = `${stageIndex + 1}${textData.stagePrefix} : ${stage.criterionLabel}`;
  ctx.font = "700 20px 'Jua','Noto Sans KR',sans-serif";
  const cw = ctx.measureText(chipText).width + 36;
  const chipX = w - cw - 132;
  roundRectPath(ctx, chipX, 16, cw, hh - 32, 16);
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText(chipText, chipX + cw / 2, hh / 2 + 1);
  const dotsX = w - 102;
  for (let i = 0; i < appData.stages.length; i++) {
    const dx = dotsX + i * 30;
    ctx.beginPath();
    ctx.arc(dx, hh / 2, 9, 0, Math.PI * 2);
    if (i < stageIndex) ctx.fillStyle = "#FFE08A";
    else if (i === stageIndex) ctx.fillStyle = "#ffffff";
    else ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fill();
  }
  ctx.restore();
}
function drawInstruction() {
  const stage = appData.stages[stageIndex];
  ctx.save();
  ctx.fillStyle = "#A85A20";
  ctx.font = "700 22px 'Jua','Noto Sans KR',sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(stage.instruction, appData.canvasWidth / 2, appData.headerHeight + 16);
  ctx.restore();
}
function drawClusterHalos() {
  const criterion = appData.stages[stageIndex].criterion;
  const groups = clusterObjects();
  ctx.save();
  for (const g of groups) {
    if (g.length < 2) continue;
    const val = attrFor(g[0], criterion);
    if (!g.every((o) => attrFor(o, criterion) === val)) continue;
    let cx = 0, cy = 0;
    for (const o of g) {
      cx += o.x;
      cy += o.y;
    }
    cx /= g.length;
    cy /= g.length;
    let rad = 0;
    for (const o of g) rad = Math.max(rad, Math.hypot(o.x - cx, o.y - cy) + o.radius);
    rad += 20;
    const rgb = criterion === "color" ? hexToRgb(colorHex(val)) : [255, 198, 120];
    const grad = ctx.createRadialGradient(cx, cy, rad * 0.35, cx, cy, rad);
    grad.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.30)`);
    grad.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
function drawSanta(x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = "rgba(80,50,20,0.22)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = "#FAD9B8";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.fillStyle = "#FBFBFB";
  ctx.beginPath();
  ctx.arc(0, r * 0.35, r * 0.92, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.arc(0, r * 0.2, r * 0.7, 0.85 * Math.PI, 0.15 * Math.PI, true);
  ctx.fill();
  ctx.fillStyle = "#E0392B";
  ctx.beginPath();
  ctx.moveTo(-r * 1.05, -r * 0.55);
  ctx.quadraticCurveTo(r * 0.2, -r * 2.2, r * 1, -r * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#FBFBFB";
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.58, r * 1.08, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(r * 0.62, -r * 1.55, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#5A3A28";
  ctx.beginPath();
  ctx.arc(-r * 0.32, -r * 0.05, r * 0.12, 0, Math.PI * 2);
  ctx.arc(r * 0.32, -r * 0.05, r * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#E8746A";
  ctx.beginPath();
  ctx.arc(0, r * 0.2, r * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function drawObject(obj) {
  const hex = colorHex(obj.colorKey);
  const r = obj.radius * obj.scale;
  if (r <= 0.5) return;
  ctx.save();
  ctx.translate(obj.x, obj.y);
  ctx.shadowColor = "rgba(80,50,20,0.28)";
  ctx.shadowBlur = obj.dragging ? 26 : 12;
  ctx.shadowOffsetY = obj.dragging ? 12 : 6;
  if (obj.kind === "gift") {
    drawGiftBox(r, hex);
    ctx.restore();
    return;
  }
  const g = ctx.createLinearGradient(0, -r, 0, r);
  g.addColorStop(0, lighten(hex, 0.3));
  g.addColorStop(1, hex);
  ctx.fillStyle = g;
  buildShapePath(obj.shape, 0, 0, r);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.lineWidth = 3;
  ctx.strokeStyle = darken(hex, 0.22);
  ctx.stroke();
  ctx.save();
  buildShapePath(obj.shape, 0, 0, r);
  ctx.clip();
  ctx.globalAlpha = 0.32;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(-r * 0.28, -r * 0.42, r * 0.5, r * 0.28, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.restore();
}
function drawGiftBox(r, hex) {
  const half = r * 0.92;
  const lidH = r * 0.34;
  const ribbonW = Math.max(4, r * 0.22);
  const g = ctx.createLinearGradient(0, -half, 0, half);
  g.addColorStop(0, lighten(hex, 0.28));
  g.addColorStop(1, hex);
  ctx.fillStyle = g;
  roundRectPath(ctx, -half, -half, half * 2, half * 2, r * 0.16);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.lineWidth = Math.max(2, r * 0.06);
  ctx.strokeStyle = darken(hex, 0.24);
  ctx.stroke();
  ctx.save();
  roundRectPath(ctx, -half, -half, half * 2, half * 2, r * 0.16);
  ctx.clip();
  ctx.fillStyle = darken(hex, 0.12);
  ctx.fillRect(-half, -half, half * 2, lidH);
  ctx.restore();
  const ribbon = lighten(hex, 0.62);
  ctx.fillStyle = ribbon;
  ctx.fillRect(-ribbonW / 2, -half, ribbonW, half * 2);
  ctx.fillRect(-half, -ribbonW / 2, half * 2, ribbonW);
  const bowY = -half;
  const loop = r * 0.34;
  ctx.fillStyle = ribbon;
  ctx.strokeStyle = darken(hex, 0.1);
  ctx.lineWidth = Math.max(1.5, r * 0.04);
  ctx.beginPath();
  ctx.ellipse(-loop * 0.7, bowY - loop * 0.5, loop * 0.7, loop * 0.5, -0.5, 0, Math.PI * 2);
  ctx.ellipse(loop * 0.7, bowY - loop * 0.5, loop * 0.7, loop * 0.5, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, bowY - loop * 0.35, r * 0.16, 0, Math.PI * 2);
  ctx.fillStyle = lighten(hex, 0.4);
  ctx.fill();
  ctx.stroke();
}
function drawObjectAt(shape, colorKey, x, y, r) {
  const hex = colorHex(colorKey);
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = "rgba(80,50,20,0.25)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 5;
  const g = ctx.createLinearGradient(0, -r, 0, r);
  g.addColorStop(0, lighten(hex, 0.3));
  g.addColorStop(1, hex);
  ctx.fillStyle = g;
  buildShapePath(shape, 0, 0, r);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.lineWidth = 3;
  ctx.strokeStyle = darken(hex, 0.22);
  ctx.stroke();
  ctx.restore();
}
function drawGuide() {
  const baseX = appData.canvasWidth - 100;
  const baseY = appData.canvasHeight - 30;
  const bob = Math.sin(bgPulse * 1.6) * 5;
  const cw = 174;
  let charTop = baseY - 180 + bob;
  if (characterImg && characterImg.complete && characterImg.naturalWidth > 0) {
    const ch = characterImg.naturalHeight / characterImg.naturalWidth * cw;
    charTop = baseY - ch + bob;
    ctx.drawImage(characterImg, baseX - cw / 2, charTop, cw, ch);
  }
  const text = currentBubbleText || textData.defaultBubble;
  const bw = 196;
  const bh = 96;
  const bx = appData.canvasWidth - bw - 18;
  const by = Math.max(appData.columnAreaY + appData.columnAreaHeight + 10, charTop - bh - 6);
  if (bubbleImg && bubbleImg.complete && bubbleImg.naturalWidth > 0) {
    ctx.drawImage(bubbleImg, bx, by, bw, bh);
  } else {
    ctx.save();
    roundRectPath(ctx, bx, by, bw, bh, 20);
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.18)";
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.restore();
  }
  ctx.save();
  ctx.fillStyle = "#5A3A18";
  ctx.font = "700 20px 'Jua','Noto Sans KR',sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const lines = text.split(/<br\s*\/?>/i);
  const lh = 24;
  const startY = by + bh / 2 - (lines.length - 1) * lh / 2 - 2;
  lines.forEach((ln, i) => ctx.fillText(ln, bx + bw / 2, startY + i * lh));
  ctx.restore();
}
function drawTitleScreen() {
  drawBackground();
  const w = appData.canvasWidth;
  const cx = w / 2;
  const demo = [
    { shape: "triangle", color: "red", x: cx - 250, y: 180 },
    { shape: "star", color: "blue", x: cx + 230, y: 160 },
    { shape: "square", color: "green", x: cx + 260, y: 300 },
    { shape: "circle", color: "yellow", x: cx - 270, y: 320 }
  ];
  demo.forEach((d, i) => {
    const bob = Math.sin(bgPulse * 1.4 + i) * 10;
    drawObjectAt(d.shape, d.color, d.x, d.y + bob, 34);
  });
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "#FF6B3D";
  ctx.font = "700 78px 'Jua','Noto Sans KR',sans-serif";
  ctx.shadowColor = "rgba(255,150,90,0.4)";
  ctx.shadowBlur = 16;
  ctx.fillText(textData.titleScreen, cx, 280);
  ctx.shadowColor = "transparent";
  ctx.fillStyle = "#A85A20";
  ctx.font = "700 28px 'Jua','Noto Sans KR',sans-serif";
  ctx.fillText(textData.titleSubtitle, cx, 340);
  const alpha = 0.55 + Math.sin(titlePulse * 3) * 0.4;
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.fillStyle = "#FF8A3D";
  ctx.font = "700 26px 'Jua','Noto Sans KR',sans-serif";
  ctx.fillText(textData.titleInstruction, cx, 470);
  ctx.restore();
}
function drawHowtoScreen() {
  drawBackground();
  const w = appData.canvasWidth;
  const cx = w / 2;
  const cardW = 660;
  const cardH = 416;
  const cardX = cx - cardW / 2;
  const cardY = 120;
  ctx.save();
  roundRectPath(ctx, cardX, cardY, cardW, cardH, 30);
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(120,70,20,0.22)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "#FF6B3D";
  ctx.font = "700 38px 'Jua','Noto Sans KR',sans-serif";
  ctx.fillText(textData.howtoTitle, cx, cardY + 64);
  const steps = [textData.howto1, textData.howto2, textData.howto3];
  const stepIcons = [
    { kind: "shape", shape: "star", color: "red" },
    { kind: "group" },
    { kind: "dots" }
  ];
  const rowY0 = cardY + 128;
  const rowGap = 76;
  for (let i = 0; i < steps.length; i++) {
    const ry = rowY0 + i * rowGap;
    const chipX = cardX + 70;
    ctx.beginPath();
    ctx.arc(chipX, ry, 24, 0, Math.PI * 2);
    ctx.fillStyle = "#FFE2BE";
    ctx.fill();
    ctx.fillStyle = "#E0702A";
    ctx.font = "700 26px 'Jua','Noto Sans KR',sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(i + 1), chipX, ry + 1);
    drawHowtoStepIcon(stepIcons[i], chipX + 58, ry);
    ctx.textAlign = "left";
    ctx.fillStyle = "#6B4A28";
    ctx.font = "700 23px 'Jua','Noto Sans KR',sans-serif";
    ctx.fillText(steps[i], chipX + 96, ry + 1);
  }
  ctx.restore();
  const alpha = 0.55 + Math.sin(titlePulse * 3) * 0.4;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.textAlign = "center";
  ctx.fillStyle = "#FF8A3D";
  ctx.font = "700 25px 'Jua','Noto Sans KR',sans-serif";
  ctx.fillText(textData.howtoStart, cx, cardY + cardH + 56);
  ctx.restore();
}
function drawHowtoStepIcon(icon, x, y) {
  ctx.save();
  if (icon.kind === "shape" && icon.shape && icon.color) {
    drawObjectAt(icon.shape, icon.color, x, y, 17);
  } else if (icon.kind === "group") {
    const rgb = hexToRgb(colorHex("green"));
    const grad = ctx.createRadialGradient(x, y, 4, x, y, 22);
    grad.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.28)`);
    grad.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colorHex("green");
    const pts = [[-8, 3], [8, 3], [0, -8]];
    for (const [dx, dy] of pts) {
      ctx.beginPath();
      ctx.arc(x + dx, y + dy, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (icon.kind === "dots") {
    const cols = ["red", "yellow", "green", "blue"];
    for (let k = 0; k < 4; k++) {
      ctx.fillStyle = colorHex(cols[k]);
      ctx.beginPath();
      ctx.arc(x - 18 + k * 12, y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}
function drawPlayingScreen() {
  drawBackground();
  drawHeader();
  drawInstruction();
  drawClusterHalos();
  if (appData.stages[stageIndex].criterion === "size") {
    drawSanta(appData.canvasWidth - appData.guideGutter / 2, 150, 22);
  }
  drawGuide();
  gameObjects.forEach((o) => {
    if (!o.dragging) drawObject(o);
  });
  if (draggingObj) drawObject(draggingObj);
}
function render() {
  bgPulse += 0.016;
  titlePulse += 0.016;
  ctx.clearRect(0, 0, appData.canvasWidth, appData.canvasHeight);
  if (currentState === "title" /* TITLE */) drawTitleScreen();
  else if (currentState === "howto" /* HOWTO */) drawHowtoScreen();
  else drawPlayingScreen();
  animFrameId = requestAnimationFrame(render);
}
function pointInObject(px, py, obj) {
  const dx = px - obj.x;
  const dy = py - obj.y;
  return dx * dx + dy * dy <= obj.radius * obj.radius * 1.1;
}
function objectAt(px, py) {
  for (let i = gameObjects.length - 1; i >= 0; i--) {
    const o = gameObjects[i];
    if (pointInObject(px, py, o)) return o;
  }
  return null;
}
function setBubble(text) {
  currentBubbleText = text;
}
function completeGroupCount() {
  const criterion = appData.stages[stageIndex].criterion;
  return clusterObjects().filter(
    (g) => g.length >= 2 && g.every((o) => attrFor(o, criterion) === attrFor(g[0], criterion))
  ).length;
}
function handlePointerDown(e) {
  const { x, y } = AppHelper.getRelativeCoordinates(e.clientX, e.clientY, appCanvas);
  if (currentState === "title" /* TITLE */) {
    startBgMusic();
    currentState = "howto" /* HOWTO */;
    return;
  }
  if (currentState === "howto" /* HOWTO */) {
    startGame();
    return;
  }
  if (currentState !== "playing" /* PLAYING */) return;
  const obj = objectAt(x, y);
  if (obj) {
    draggingObj = obj;
    obj.dragging = true;
    dragOffsetX = x - obj.x;
    dragOffsetY = y - obj.y;
    dragOriginX = obj.x;
    dragOriginY = obj.y;
    groupsBeforeDrag = completeGroupCount();
    gameObjects = gameObjects.filter((o) => o !== obj);
    gameObjects.push(obj);
    gsap.killTweensOf(obj);
    gsap.to(obj, { scale: 1.15, duration: 0.16, ease: "back.out(2)" });
    playSound(pickupSound);
  }
}
function handlePointerMove(e) {
  if (!draggingObj) return;
  const { x, y } = AppHelper.getRelativeCoordinates(e.clientX, e.clientY, appCanvas);
  const r = draggingObj.radius;
  draggingObj.x = clamp(x - dragOffsetX, r, appData.canvasWidth - r);
  draggingObj.y = clamp(y - dragOffsetY, appData.headerHeight + r, appData.canvasHeight - r);
}
function handlePointerUp() {
  if (!draggingObj) return;
  const obj = draggingObj;
  draggingObj = null;
  obj.dragging = false;
  const cell = nearestCell(obj.x, obj.y);
  const occupant = gameObjects.find(
    (o) => o !== obj && Math.hypot(o.x - cell.x, o.y - cell.y) < gridCell() * 0.5
  );
  if (occupant) {
    occupant.x = dragOriginX;
    occupant.y = dragOriginY;
    gsap.killTweensOf(occupant);
    gsap.fromTo(occupant, { scale: 0.82 }, { scale: 1, duration: 0.2, ease: "back.out(2)" });
  }
  obj.x = cell.x;
  obj.y = cell.y;
  gsap.killTweensOf(obj);
  gsap.fromTo(obj, { scale: 1.15 }, { scale: 1, duration: 0.18, ease: "back.out(2)" });
  playSound(placeSound);
  if (solved) return;
  setBubble(completeGroupCount() > groupsBeforeDrag ? textData.correctBubble : textData.defaultBubble);
  if (isStageSorted()) {
    solved = true;
    window.setTimeout(() => finishStage(), 360);
  }
}
function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}
function startGame() {
  startBgMusic();
  stageIndex = 0;
  currentState = "playing" /* PLAYING */;
  initObjects();
  setBubble(textData.defaultBubble);
}
function finishStage() {
  currentState = "stageclear" /* STAGECLEAR */;
  setBubble(textData.stageClearBubble);
  playSound(correctSound);
  burstConfetti();
  window.setTimeout(() => {
    if (stageIndex >= appData.stages.length - 1) {
      showGameOver();
    } else {
      stageIndex++;
      currentState = "playing" /* PLAYING */;
      initObjects();
      setBubble(textData.defaultBubble);
    }
  }, 1400);
}
function burstConfetti() {
  try {
    confetti({ particleCount: 130, spread: 80, startVelocity: 42, origin: { x: 0.5, y: 0.4 }, zIndex: 9999 });
  } catch (_e) {
  }
}
function showGameOver() {
  currentState = "gameover" /* GAMEOVER */;
  burstConfetti();
  window.setTimeout(burstConfetti, 350);
  const overlay = AppHelper.createUIElement("div", "gameOverOverlay", {
    position: "absolute",
    left: "0",
    top: "0",
    width: appData.canvasWidth + "px",
    height: appData.canvasHeight + "px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(40,20,10,0.45)",
    pointerEvents: "auto",
    zIndex: "50"
  });
  const card = AppHelper.createUIElement("div", "gameOverCard", {
    width: "520px",
    padding: "44px 40px",
    background: "#ffffff",
    borderRadius: "32px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    textAlign: "center",
    fontFamily: "'Jua','Noto Sans KR',sans-serif"
  });
  const title = AppHelper.createUIElement("div", "", {
    fontSize: "42px",
    fontWeight: "700",
    color: "#FF6B3D",
    marginBottom: "18px"
  }, textData.gameOverTitle);
  const msg = AppHelper.createUIElement("div", "", {
    fontSize: "24px",
    color: "#7A5230",
    lineHeight: "1.5",
    marginBottom: "32px",
    whiteSpace: "pre-line"
  }, textData.gameOverMessage);
  const btn = AppHelper.createUIElement("button", "", {
    fontSize: "26px",
    fontWeight: "700",
    color: "#ffffff",
    background: "linear-gradient(90deg,#FF8A3D,#FF6B6B)",
    border: "none",
    borderRadius: "999px",
    padding: "16px 44px",
    cursor: "pointer",
    fontFamily: "'Jua','Noto Sans KR',sans-serif",
    boxShadow: "0 8px 20px rgba(255,107,61,0.4)"
  }, textData.gameOverRestart, [{ event: "click", handler: () => restartGame() }]);
  card.appendChild(title);
  card.appendChild(msg);
  card.appendChild(btn);
  overlay.appendChild(card);
  uiLayer.appendChild(overlay);
  uiElements.push(overlay);
}
function clearUI() {
  uiElements.forEach((el) => el.remove());
  uiElements.length = 0;
}
function restartGame() {
  clearUI();
  startGame();
}
async function loadSounds() {
  if (soundsInitialized) return;
  soundsInitialized = true;
  try {
    const howlerModule = await import("howler");
    const Howl = howlerModule.Howl || window.Howl;
    if (!Howl || !assetListData || !assetListData.sounds) return;
    const find = (id) => assetListData.sounds.find((s) => s.id === id);
    const pickup = find("pickup");
    if (pickup) pickupSound = new Howl({ src: [pickup.file_path], volume: pickup.volume });
    const place = find("place");
    if (place) placeSound = new Howl({ src: [place.file_path], volume: place.volume });
    const correct = find("correct_chime");
    if (correct) correctSound = new Howl({ src: [correct.file_path], volume: correct.volume });
    const bg = find("bg_music");
    if (bg) bgMusic = new Howl({ src: [bg.file_path], volume: bg.volume, loop: true });
  } catch (_e) {
  }
}
function playSound(sound) {
  try {
    if (sound && sound.play) sound.play();
  } catch (_e) {
  }
}
function startBgMusic() {
  if (bgStarted) return;
  bgStarted = true;
  try {
    if (bgMusic && bgMusic.play) bgMusic.play();
  } catch (_e) {
  }
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
  const charDef = assetListData.images.find((i) => i.id === "character");
  if (charDef) {
    characterImg = new Image();
    characterImg.src = charDef.file_path;
  }
  const bubbleDef = assetListData.images.find((i) => i.id === "speech_bubble");
  if (bubbleDef) {
    bubbleImg = new Image();
    bubbleImg.src = bubbleDef.file_path;
  }
  const bgDef = assetListData.images.find((i) => i.id === "background");
  if (bgDef) {
    backgroundImg = new Image();
    backgroundImg.src = bgDef.file_path;
  }
  await loadSounds();
  currentState = "title" /* TITLE */;
  currentBubbleText = textData.defaultBubble;
  appCanvas.addEventListener("pointerdown", handlePointerDown);
  appCanvas.addEventListener("pointermove", handlePointerMove);
  appCanvas.addEventListener("pointerup", handlePointerUp);
  appCanvas.addEventListener("pointercancel", handlePointerUp);
  appCanvas.addEventListener("contextmenu", (e) => e.preventDefault());
  appCanvas.addEventListener("touchstart", (e) => e.preventDefault(), { passive: false });
  appCanvas.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
  if (typeof location !== "undefined" && location.search.indexOf("debug") !== -1) {
    window.__kkiri = {
      snapshot: () => {
        const criterion = appData.stages[stageIndex].criterion;
        return {
          state: currentState,
          stageIndex,
          criterion,
          grid: gridInfo(),
          values: [...new Set(gameObjects.map((o) => attrFor(o, criterion)))],
          sorted: isStageSorted(),
          objects: gameObjects.map((o) => ({
            id: o.id,
            x: o.x,
            y: o.y,
            r: o.radius,
            attr: attrFor(o, criterion)
          })),
          gameOver: !!document.getElementById("gameOverOverlay")
        };
      }
    };
  }
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = 0;
  }
  render();
}

// main.ts
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
