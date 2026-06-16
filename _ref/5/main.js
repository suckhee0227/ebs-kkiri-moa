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
var targetIntersections = [];
var targetImages = [];
var rotateIconImg;
var assetListData;
var nextCloneId = 1;
var currentState = "title" /* TITLE */;
var appData;
var textData;
var appCanvas;
var ctx;
var uiLayer;
var clonedShapes = [];
var paletteShapes = [];
var dropZones = [];
var selectedShape = null;
var draggingShape = null;
var isDraggingFromPalette = false;
var isRotating = false;
var dragOffsetX = 0;
var dragOffsetY = 0;
var rotationStartAngle = 0;
var shapeStartAngle = 0;
var currentBubbleText = "";
var guideBubbleEl = null;
var animFrameId = 0;
var uiElements = [];
var soundLoaded = false;
var pickupSound = null;
var placeSound = null;
var hintGlowTime = 0;
async function loadSounds() {
  if (soundLoaded) return;
  soundLoaded = true;
  try {
    const howlerModule = await import("howler");
    const Howl = howlerModule.Howl || window.Howl;
    if (Howl) {
      if (assetListData && assetListData.sounds && assetListData.sounds.length > 0) {
        const pickupData = assetListData.sounds.find((s) => s.id === "pickup");
        if (pickupData) {
          pickupSound = new Howl({ src: [pickupData.file_path], volume: pickupData.volume });
        }
        const placeData = assetListData.sounds.find((s) => s.id === "place");
        if (placeData) {
          placeSound = new Howl({ src: [placeData.file_path], volume: placeData.volume });
        }
      }
    }
  } catch (_e) {
  }
}
function playSound(sound) {
  try {
    if (sound && sound.play) {
      sound.play();
    }
  } catch (_e) {
  }
}
function drawShapeIntersectionBlend(shapeA, shapeB, dz) {
  const blendedColor = blendColors(shapeA.color, shapeB.color);
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.beginPath();
  buildShapePath(ctx, shapeA.type, shapeA.x, shapeA.y, shapeA.size, shapeA.rotation);
  ctx.clip();
  ctx.beginPath();
  buildShapePath(ctx, shapeB.type, shapeB.x, shapeB.y, shapeB.size, shapeB.rotation);
  ctx.fillStyle = blendedColor;
  ctx.fill();
  ctx.restore();
}
function blendColors(color1, color2) {
  const colorMixMap = {
    "#3D6FD9+#F09030": "rgba(100, 130, 100, 0.9)",
    "#F09030+#3D6FD9": "rgba(100, 130, 100, 0.9)",
    "#F09030+#E04040": "rgba(230, 100, 50, 0.9)",
    "#E04040+#F09030": "rgba(230, 100, 50, 0.9)",
    "#3D6FD9+#E04040": "rgba(120, 70, 140, 0.9)",
    "#E04040+#3D6FD9": "rgba(120, 70, 140, 0.9)"
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
      const allowedRots = offset.allowedRotations || [];
      const anyRot = offset.anyRotation === true;
      const rotTolerance = 20;
      const matchingShape = clonedShapes.find((s) => {
        if (s.dropZoneIndex !== dzIndex) return false;
        if (s.type !== expectedType) return false;
        if (s.color.toUpperCase() !== expectedColor) return false;
        const dx = Math.abs(s.x - targetX);
        const dy = Math.abs(s.y - targetY);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist >= appData.snapThreshold * 2) return false;
        if (!anyRot && allowedRots.length > 0) {
          let shapeDeg = s.rotation * 180 / Math.PI % 360;
          if (shapeDeg < -180) shapeDeg += 360;
          if (shapeDeg > 180) shapeDeg -= 360;
          let rotMatch = false;
          for (const allowed of allowedRots) {
            let diff = Math.abs(shapeDeg - allowed);
            if (diff > 180) diff = 360 - diff;
            if (diff <= rotTolerance) {
              rotMatch = true;
              break;
            }
          }
          if (!rotMatch) return false;
        }
        return true;
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
  for (let i = 0; i < dropZones.length && i < targetImages.length; i++) {
    const dz = dropZones[i];
    const img = targetImages[i];
    if (!img || !img.complete) continue;
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.drawImage(img, dz.x, dz.y, dz.width, dz.height);
    ctx.restore();
  }
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
function isPointInShape(px, py, shape) {
  const dx = px - shape.x;
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
function isPointOnRotationHandle(px, py, shape) {
  if (shape.snapped) return false;
  const half = shape.size / 2 + 5;
  let iconLocalX = 0;
  let iconLocalY = 0;
  switch (shape.type) {
    case "rectangle" /* RECTANGLE */:
      iconLocalX = half;
      iconLocalY = -half;
      break;
    case "triangle" /* TRIANGLE */: {
      const circumR = shape.size / Math.sqrt(3) + 5;
      iconLocalX = 0;
      iconLocalY = -circumR;
      break;
    }
    case "circle" /* CIRCLE */:
      iconLocalX = half * 0.7;
      iconLocalY = -half * 0.7;
      break;
  }
  const cos = Math.cos(shape.rotation);
  const sin = Math.sin(shape.rotation);
  const handleX = shape.x + iconLocalX * cos - iconLocalY * sin;
  const handleY = shape.y + iconLocalX * sin + iconLocalY * cos;
  const dx = px - handleX;
  const dy = py - handleY;
  const hitRadius = 20;
  return dx * dx + dy * dy <= hitRadius * hitRadius;
}
function drawRotationHandle(targetCtx, shape) {
  if (shape.snapped) return;
  targetCtx.save();
  targetCtx.globalAlpha = 1;
  targetCtx.globalCompositeOperation = "source-over";
  targetCtx.save();
  targetCtx.translate(shape.x, shape.y);
  targetCtx.rotate(shape.rotation);
  targetCtx.strokeStyle = "#000000";
  targetCtx.lineWidth = 2;
  targetCtx.setLineDash([6, 3]);
  const half = shape.size / 2 + 5;
  let iconLocalX = 0;
  let iconLocalY = 0;
  switch (shape.type) {
    case "rectangle" /* RECTANGLE */:
      targetCtx.strokeRect(-half, -half, half * 2, half * 2);
      iconLocalX = half;
      iconLocalY = -half;
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
      iconLocalX = 0;
      iconLocalY = -circumR;
      break;
    }
    case "circle" /* CIRCLE */:
      targetCtx.beginPath();
      targetCtx.arc(0, 0, half, 0, Math.PI * 2);
      targetCtx.stroke();
      iconLocalX = half * 0.7;
      iconLocalY = -half * 0.7;
      break;
  }
  targetCtx.setLineDash([]);
  if (rotateIconImg && rotateIconImg.complete) {
    const iconSize = 26;
    targetCtx.drawImage(rotateIconImg, iconLocalX - iconSize / 2, iconLocalY - iconSize / 2, iconSize, iconSize);
  }
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
  if (guideBubbleEl) {
    guideBubbleEl.innerHTML = text;
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
  const totalWidth = appData.canvasWidth * 0.25;
  const startX = (appData.canvasWidth - totalWidth) / 2;
  const gap = totalWidth / (totalShapes - 1);
  const y = appData.paletteY;
  const size = appData.shapeSize;
  paletteShapes.push({
    type: "rectangle" /* RECTANGLE */,
    color: "#3D6FD9",
    rgbColor: hexToRgb("#3D6FD9"),
    x: startX,
    y,
    size,
    label: "\uD30C\uB791 \uB124\uBAA8"
  });
  paletteShapes.push({
    type: "triangle" /* TRIANGLE */,
    color: "#F09030",
    rgbColor: hexToRgb("#F09030"),
    x: startX + gap,
    y: y + 8,
    size: size + 5,
    label: "\uC8FC\uD669 \uC138\uBAA8"
  });
  paletteShapes.push({
    type: "circle" /* CIRCLE */,
    color: "#E04040",
    rgbColor: hexToRgb("#E04040"),
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
  ctx.fillStyle = "#FFFFFF";
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
    drawRoundedRect(ctx, dz.x, dz.y, dz.width, dz.height, appData.dropZoneCornerRadius);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.restore();
  }
  drawAllTargetIntersections();
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
  for (let i = 0; i < entry.shapes.length; i++) {
    const expectedType = entry.shapes[i].type;
    if (shape.type !== expectedType) continue;
    const expectedColor = entry.shapes[i].color.toUpperCase();
    if (shape.color.toUpperCase() !== expectedColor) continue;
    const offset = entry.targetOffsets[i];
    const targetX = centerX + offset.x;
    const targetY = centerY + offset.y;
    const dx = targetX - shape.x;
    const dy = targetY - shape.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < nearThreshold) {
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
  const nonDraggingShapes = [];
  const draggingShapesList = [];
  for (let i = 0; i < clonedShapes.length; i++) {
    const s = clonedShapes[i];
    if (s === draggingShape) {
      draggingShapesList.push(s);
    } else {
      nonDraggingShapes.push(s);
    }
  }
  for (const s of nonDraggingShapes) {
    const isInDropZone = s.dropZoneIndex >= 0;
    const useHintGlow = s.nearHint && s === selectedShape;
    ctx.save();
    if (isInDropZone) {
      ctx.globalCompositeOperation = "multiply";
      if (useHintGlow) {
        drawShapeWithHintGlow(ctx, s.type, s.x, s.y, s.size, s.color, s.rotation, 0.5);
      } else {
        drawShape(ctx, s.type, s.x, s.y, s.size, s.color, s.rotation, 0.5);
      }
    } else {
      ctx.globalCompositeOperation = "source-over";
      if (useHintGlow) {
        drawShapeWithHintGlow(ctx, s.type, s.x, s.y, s.size, s.color, s.rotation, 1);
      } else {
        drawShape(ctx, s.type, s.x, s.y, s.size, s.color, s.rotation, 1);
      }
    }
    ctx.restore();
  }
  shapesByDropZone.forEach((shapes, dzIndex) => {
    const nonDragInZone = shapes.filter((s) => s !== draggingShape);
    if (nonDragInZone.length >= 2) {
      const dz = dropZones[dzIndex];
      if (!dz) return;
      for (let a = 0; a < nonDragInZone.length; a++) {
        for (let b = a + 1; b < nonDragInZone.length; b++) {
          drawShapeIntersectionBlend(nonDragInZone[a], nonDragInZone[b], dz);
        }
      }
    }
  });
  for (const s of draggingShapesList) {
    const isInDropZone = s.dropZoneIndex >= 0;
    const useHintGlow = s.nearHint && (s === draggingShape || s === selectedShape);
    ctx.save();
    if (isInDropZone) {
      ctx.globalCompositeOperation = "multiply";
      if (useHintGlow) {
        drawShapeWithHintGlow(ctx, s.type, s.x, s.y, s.size, s.color, s.rotation, 0.85);
      } else {
        drawShape(ctx, s.type, s.x, s.y, s.size, s.color, s.rotation, 0.85);
      }
    } else {
      ctx.globalCompositeOperation = "source-over";
      if (useHintGlow) {
        drawShapeWithHintGlow(ctx, s.type, s.x, s.y, s.size, s.color, s.rotation, 0.9);
      } else {
        drawShape(ctx, s.type, s.x, s.y, s.size, s.color, s.rotation, 0.9);
      }
    }
    ctx.restore();
    if (isInDropZone) {
      const dzShapes = shapesByDropZone.get(s.dropZoneIndex);
      if (dzShapes) {
        const dz = dropZones[s.dropZoneIndex];
        if (dz) {
          for (const other of dzShapes) {
            if (other !== s) {
              drawShapeIntersectionBlend(s, other, dz);
            }
          }
        }
      }
    }
  }
  if (selectedShape && currentState === "playing" /* PLAYING */ && !selectedShape.snapped) {
    drawRotationHandle(ctx, selectedShape);
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
  let bestPositionCloseButAngleWrong = false;
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
    const alreadySnapped = clonedShapes.some(
      (s) => s !== shape && s.snapped && s.dropZoneIndex === dzIndex && s.type === expectedType && s.color.toUpperCase() === expectedColor
    );
    if (alreadySnapped) continue;
    if (dist < appData.snapThreshold && dist < bestDist) {
      const allowedRots = offset.allowedRotations || [];
      const anyRot = offset.anyRotation === true;
      if (anyRot) {
        bestDist = dist;
        bestIndex = i;
        bestTargetX = targetX;
        bestTargetY = targetY;
      } else if (allowedRots.length > 0) {
        let shapeDeg = shape.rotation * 180 / Math.PI % 360;
        if (shapeDeg < -180) shapeDeg += 360;
        if (shapeDeg > 180) shapeDeg -= 360;
        for (const allowed of allowedRots) {
          let diff = Math.abs(shapeDeg - allowed);
          if (diff > 180) diff = 360 - diff;
          if (diff <= 25) {
            bestDist = dist;
            bestIndex = i;
            bestTargetX = targetX;
            bestTargetY = targetY;
            break;
          }
        }
      } else {
        bestDist = dist;
        bestIndex = i;
        bestTargetX = targetX;
        bestTargetY = targetY;
      }
    }
  }
  if (bestIndex >= 0) {
    const offset = entry.targetOffsets[bestIndex];
    const allowedRots = offset.allowedRotations || [];
    const anyRot = offset.anyRotation === true;
    let bestTargetRot = shape.rotation;
    if (!anyRot && allowedRots.length > 0) {
      let shapeDeg = shape.rotation * 180 / Math.PI % 360;
      if (shapeDeg < -180) shapeDeg += 360;
      if (shapeDeg > 180) shapeDeg -= 360;
      let minDiff = 999;
      for (const allowed of allowedRots) {
        let diff = Math.abs(shapeDeg - allowed);
        if (diff > 180) diff = 360 - diff;
        if (diff < minDiff) {
          minDiff = diff;
          bestTargetRot = allowed * Math.PI / 180;
        }
      }
    }
    gsap.to(shape, {
      x: bestTargetX,
      y: bestTargetY,
      rotation: bestTargetRot,
      duration: 0.25,
      ease: "power2.out",
      onComplete: () => {
        showSnapCheckAnimation(bestTargetX, bestTargetY);
        playSound(placeSound);
        const dzEntry = appData.answerMap.find((e) => e.dropZoneIndex === dzIndex);
        if (dzEntry) {
          const snappedCount = clonedShapes.filter((s) => s.dropZoneIndex === dzIndex && s.snapped).length;
          if (snappedCount >= dzEntry.shapes.length) {
            const dz2 = dropZones[dzIndex];
            if (dz2) {
              try {
                confetti({
                  particleCount: 40,
                  spread: 50,
                  origin: {
                    x: (dz2.x + dz2.width / 2) / appData.canvasWidth,
                    y: (dz2.y + dz2.height / 2) / appData.canvasHeight
                  },
                  colors: ["#FFD700", "#FF6B6B", "#4CAF50", "#2979FF", "#A78BFA"]
                });
              } catch (_) {
              }
            }
            setBubbleText(textData.correctBubble);
          }
        }
      }
    });
    shape.snapped = true;
    shape.nearHint = false;
    setTimeout(() => {
      checkAutoComplete();
    }, 250);
    return true;
  }
  if (false) {
    shape.nearHint = true;
    shape.snapped = false;
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
}
function handleCorrectAnswer() {
  currentState = "result" /* RESULT */;
  selectedShape = null;
  setBubbleText(textData.correctBubble);
  try {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#5B8DEF", "#FFD966", "#FF6B6B", "#76C893", "#A78BFA"]
    });
  } catch (_e) {
  }
  for (const s of clonedShapes) {
    if (s.snapped) {
      gsap.to(s, {
        scale: 1.12,
        duration: 0.25,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut"
      });
    }
  }
  setTimeout(() => {
    currentState = "playing" /* PLAYING */;
  }, 2500);
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
    const px = (Math.sin(i * 3.7 + now * 1e-3) * 0.5 + 0.5) * appData.canvasWidth;
    const py = (Math.cos(i * 2.3 + now * 12e-4) * 0.5 + 0.5) * appData.canvasHeight;
    const sparkleSize = 2 + Math.sin(now * 5e-3 + i) * 2;
    ctx.globalAlpha = 0.3 + 0.3 * Math.sin(now * 3e-3 + i * 1.5);
    ctx.fillStyle = i % 3 === 0 ? "#FFD966" : i % 3 === 1 ? "#5B8DEF" : "#FF6B6B";
    ctx.beginPath();
    ctx.arc(px, py, sparkleSize, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
function drawPlayingScreen() {
  drawBackground();
  drawDropZones();
  drawPaletteShapes();
  drawClonedShapes();
  if (currentState === "gameover" /* GAMEOVER */) {
    drawGameOverOverlay();
  }
}
function render() {
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
  animFrameId = requestAnimationFrame(render);
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
  if (currentState === "title" /* TITLE */ || currentState === "instruction" /* INSTRUCTION */) {
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
    playSound(pickupSound);
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
    playSound(pickupSound);
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
    const rawRotation = shapeStartAngle + deltaAngle;
    const rawDeg = rawRotation * 180 / Math.PI;
    const snappedDeg = Math.round(rawDeg / 15) * 15;
    selectedShape.rotation = snappedDeg * Math.PI / 180;
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
        gsap.to(removingShape, {
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
      const dzIdx = draggingShape.dropZoneIndex;
      const dzEntry = appData.answerMap.find((e2) => e2.dropZoneIndex === dzIdx);
      const isValidShape = dzEntry && dzEntry.shapes.some(
        (s) => s.type === draggingShape.type && s.color.toUpperCase() === draggingShape.color.toUpperCase()
      );
      if (!isValidShape) {
        setBubbleText(textData.wrongBubble);
        setTimeout(() => {
          setBubbleText(textData.defaultBubble);
        }, 2e3);
      } else {
        trySnapToTarget(draggingShape);
      }
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
  buildCharacterUI();
  const headerStrip = AppHelper.createUIElement("div", "headerStrip", {
    position: "absolute",
    left: "0",
    top: "0",
    width: "100%",
    height: "7%",
    backgroundColor: "#F5F5F5",
    borderBottom: "1px solid #CCCCCC",
    pointerEvents: "none",
    boxSizing: "border-box",
    zIndex: "10"
  });
  uiLayer.appendChild(headerStrip);
  uiElements.push(headerStrip);
  const topLeftContainer = AppHelper.createUIElement("div", "topLeftContainer", {
    position: "absolute",
    left: "2%",
    top: "1.5%",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    pointerEvents: "none",
    zIndex: "11"
  });
  uiLayer.appendChild(topLeftContainer);
  uiElements.push(topLeftContainer);
  const topBarText = textData.title;
  const spaceIdx = topBarText.indexOf(" ");
  const codeText = spaceIdx > 0 ? topBarText.substring(0, spaceIdx) : "B1-3";
  const titleText = spaceIdx > 0 ? topBarText.substring(spaceIdx + 1) : topBarText;
  const codeBadge = AppHelper.createUIElement("div", "codeBadge", {
    backgroundColor: "#222222",
    color: "#FFFFFF",
    padding: "4px 14px",
    borderRadius: "20px",
    fontSize: "17px",
    fontWeight: "bold",
    pointerEvents: "none",
    whiteSpace: "nowrap"
  }, codeText);
  topLeftContainer.appendChild(codeBadge);
  const titleLabel = AppHelper.createUIElement("div", "titleLabel", {
    color: "#333333",
    fontSize: "19px",
    fontWeight: "800",
    pointerEvents: "none",
    whiteSpace: "nowrap"
  }, titleText);
  topLeftContainer.appendChild(titleLabel);
  const topRightContainer = AppHelper.createUIElement("div", "topRightContainer", {
    position: "absolute",
    right: "2%",
    top: "1.5%",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    pointerEvents: "none",
    zIndex: "11"
  });
  uiLayer.appendChild(topRightContainer);
  uiElements.push(topRightContainer);
  const pageBadge = AppHelper.createUIElement("div", "pageBadge", {
    backgroundColor: "#FFFFFF",
    color: "#333333",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "bold",
    boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
    pointerEvents: "none",
    whiteSpace: "nowrap"
  }, "26p");
  topRightContainer.appendChild(pageBadge);
  const squareIcon = AppHelper.createUIElement("div", "squareIcon", {
    position: "relative",
    width: "28px",
    height: "28px",
    cursor: "pointer",
    pointerEvents: "auto",
    boxSizing: "border-box"
  });
  topRightContainer.appendChild(squareIcon);
  const sqBack = AppHelper.createUIElement("div", "", {
    position: "absolute",
    top: "3px",
    left: "9px",
    width: "16px",
    height: "16px",
    border: "2px solid #666",
    borderRadius: "2px",
    backgroundColor: "#FFFFFF",
    boxSizing: "border-box",
    pointerEvents: "none"
  });
  squareIcon.appendChild(sqBack);
  const sqFront = AppHelper.createUIElement("div", "", {
    position: "absolute",
    top: "9px",
    left: "3px",
    width: "16px",
    height: "16px",
    border: "2px solid #666",
    borderRadius: "2px",
    backgroundColor: "#FFFFFF",
    boxSizing: "border-box",
    pointerEvents: "none"
  });
  squareIcon.appendChild(sqFront);
  const closeIcon = AppHelper.createUIElement("div", "closeIcon", {
    width: "24px",
    height: "24px",
    cursor: "pointer",
    pointerEvents: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "bold",
    color: "#666",
    boxSizing: "border-box"
  }, "\u2715");
  topRightContainer.appendChild(closeIcon);
  const missionBox = AppHelper.createUIElement("div", "missionBox", {
    position: "absolute",
    left: "3%",
    top: "10%",
    backgroundColor: "#2979FF",
    color: "#FFFFFF",
    padding: "6px 12px",
    borderRadius: "10px",
    fontSize: "19px",
    fontWeight: "bold",
    textAlign: "left",
    lineHeight: "1.5",
    whiteSpace: "nowrap",
    boxShadow: "0 3px 10px rgba(41,121,255,0.3)",
    pointerEvents: "none",
    boxSizing: "border-box",
    zIndex: "5"
  }, textData.mission);
  uiLayer.appendChild(missionBox);
  uiElements.push(missionBox);
  const btnCheck = AppHelper.createUIElement(
    "button",
    "btnCheckAnswer",
    {
      position: "absolute",
      right: "4%",
      bottom: "5%",
      backgroundColor: "#2979FF",
      color: "#FFFFFF",
      border: "none",
      borderRadius: "8px",
      padding: "10px 24px",
      fontSize: "17px",
      fontWeight: "bold",
      cursor: "pointer",
      pointerEvents: "auto",
      boxSizing: "border-box",
      boxShadow: "0 4px 12px rgba(41,121,255,0.35)",
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
  const isAlreadyCorrect = checkAllAnswers();
  if (isAlreadyCorrect) {
    handleCorrectAnswer();
    return;
  }
  currentState = "animating" /* ANIMATING */;
  selectedShape = null;
  draggingShape = null;
  clonedShapes = [];
  const answerMap = appData.answerMap;
  let animCount = 0;
  let totalAnims = 0;
  let nextId = 1e3;
  for (const entry of answerMap) {
    totalAnims += entry.shapes.length;
  }
  let delayAccum = 0;
  for (const entry of answerMap) {
    const dzIndex = entry.dropZoneIndex;
    const dz = dropZones[dzIndex];
    if (!dz) continue;
    const centerX = dz.x + dz.width / 2;
    const centerY = dz.y + dz.height / 2;
    for (let i = 0; i < entry.shapes.length; i++) {
      const expectedType = entry.shapes[i].type;
      const expectedColor = entry.shapes[i].color;
      const paletteIdx = entry.shapes[i].paletteIndex;
      const palette = paletteShapes[paletteIdx];
      const offset = entry.targetOffsets[i];
      const targetX = centerX + offset.x;
      const targetY = centerY + offset.y;
      const targetRot = offset.rotation * Math.PI / 180;
      const newShape = {
        id: nextId++,
        type: expectedType,
        color: expectedColor,
        rgbColor: hexToRgb(expectedColor),
        x: palette ? palette.x : appData.canvasWidth / 2,
        y: palette ? palette.y : appData.canvasHeight - 100,
        rotation: 0,
        scale: 1,
        size: palette ? palette.size : appData.shapeSize,
        selected: false,
        dropZoneIndex: dzIndex,
        snapped: false,
        nearHint: false
      };
      clonedShapes.push(newShape);
      const currentDelay = delayAccum;
      delayAccum += 0.3;
      gsap.to(newShape, {
        x: targetX,
        y: targetY,
        rotation: targetRot,
        duration: 0.8,
        ease: "power2.inOut",
        delay: currentDelay,
        onComplete: () => {
          newShape.snapped = true;
          animCount++;
          if (animCount >= totalAnims) {
            setTimeout(() => {
              currentState = "playing" /* PLAYING */;
              setBubbleText(textData.correctBubble);
            }, 500);
          }
        }
      });
    }
  }
}
function buildCharacterUI() {
  const bottomLeftContainer = AppHelper.createUIElement("div", "bottomLeftContainer", {
    position: "absolute",
    left: "0.5%",
    bottom: "3%",
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-end",
    gap: "0px",
    pointerEvents: "none"
  });
  uiLayer.appendChild(bottomLeftContainer);
  const characterImg = AppHelper.createUIElement("div", "characterImg", {
    width: "120px",
    height: "156px",
    backgroundImage: "url(character.png)",
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center bottom",
    pointerEvents: "none",
    flexShrink: "0"
  });
  bottomLeftContainer.appendChild(characterImg);
  const speechBubbleWrapper = AppHelper.createUIElement("div", "speechBubbleWrapper", {
    position: "relative",
    width: "200px",
    marginLeft: "-45px",
    marginBottom: "10px",
    pointerEvents: "none"
  });
  bottomLeftContainer.appendChild(speechBubbleWrapper);
  const bubbleImg = AppHelper.createUIElement("img", "bubbleImg", {
    width: "100%",
    height: "auto",
    display: "block",
    pointerEvents: "none"
  });
  bubbleImg.src = "speech_bubble.png";
  bubbleImg.alt = "";
  speechBubbleWrapper.appendChild(bubbleImg);
  guideBubbleEl = AppHelper.createUIElement(
    "div",
    "guideBubbleText",
    {
      position: "absolute",
      top: "12%",
      left: "27%",
      width: "65%",
      height: "65%",
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-start",
      textAlign: "left",
      fontSize: "15px",
      fontWeight: "bold",
      color: "#333",
      lineHeight: "1.5",
      pointerEvents: "none",
      wordBreak: "keep-all"
    },
    currentBubbleText
  );
  speechBubbleWrapper.appendChild(guideBubbleEl);
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
  const targetSrcs = ["target_left.png", "target_center.png", "target_right.png"];
  targetImages = targetSrcs.map((src) => {
    const img = new Image();
    img.src = src;
    return img;
  });
  rotateIconImg = new Image();
  rotateIconImg.src = "rotate_icon.png";
  currentState = "playing" /* PLAYING */;
  currentBubbleText = textData.defaultBubble;
  await loadSounds();
  createPlayingUI();
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
