import { AppHelper } from "./appHelper";
import gsap from "gsap";
import confetti from "canvas-confetti";
let targetIntersections = [];
let assetListData;
var ShapeType = /* @__PURE__ */ ((ShapeType2) => {
  ShapeType2["RECTANGLE"] = "rectangle";
  ShapeType2["TRIANGLE"] = "triangle";
  ShapeType2["CIRCLE"] = "circle";
  return ShapeType2;
})(ShapeType || {});
var AppState = /* @__PURE__ */ ((AppState2) => {
  AppState2["TITLE"] = "title";
  AppState2["INSTRUCTION"] = "instruction";
  AppState2["PLAYING"] = "playing";
  AppState2["ANIMATING"] = "animating";
  AppState2["RESULT"] = "result";
  AppState2["GAMEOVER"] = "gameover";
  return AppState2;
})(AppState || {});
let nextCloneId = 1;
let currentState = "title" /* TITLE */;
let appData;
let textData;
let appCanvas;
let ctx;
let uiLayer;
let clonedShapes = [];
let paletteShapes = [];
let dropZones = [];
let selectedShape = null;
let draggingShape = null;
let isDraggingFromPalette = false;
let isRotating = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let rotationStartAngle = 0;
let shapeStartAngle = 0;
let currentBubbleText = "";
let guideBubbleEl = null;
let animFrameId = 0;
let uiElements = [];
let soundsInitialized = false;
let hintGlowTime = 0;
let gameOverAlpha = 0;
function isAngleMatchWithSymmetry(shapeType, currentRotation, targetRotation, thresholdDeg) {
  if (shapeType === "circle" /* CIRCLE */) {
    return true;
  }
  const currentDeg = currentRotation * 180 / Math.PI;
  const targetDeg = targetRotation * 180 / Math.PI;
  const diff = Math.abs(currentDeg - targetDeg);
  if (shapeType === "rectangle" /* RECTANGLE */) {
    const mod = diff % 90;
    if (mod <= thresholdDeg || mod >= 90 - thresholdDeg) {
      return true;
    }
    return false;
  }
  if (shapeType === "triangle" /* TRIANGLE */) {
    const mod = diff % 120;
    if (mod <= thresholdDeg || mod >= 120 - thresholdDeg) {
      return true;
    }
    return false;
  }
  const thresholdRad = thresholdDeg * Math.PI / 180;
  const diffRad = Math.abs(normalizeAngle(currentRotation - targetRotation));
  return diffRad <= thresholdRad;
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
        if (!s.snapped) return false;
        const dx = Math.abs(s.x - targetX);
        const dy = Math.abs(s.y - targetY);
        const dist = Math.sqrt(dx * dx + dy * dy);
        const posThreshold = appData.snapThreshold * 1.5;
        if (dist >= posThreshold) return false;
        const angleMatch = isAngleMatchWithSymmetry(s.type, s.rotation, targetRotation, appData.snapAngleThreshold);
        if (!angleMatch) return false;
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
  const handleDist = appData.rotationHandleDistance;
  const handleX = shape.x + Math.cos(shape.rotation - Math.PI / 2) * handleDist;
  const handleY = shape.y + Math.sin(shape.rotation - Math.PI / 2) * handleDist;
  const dx = px - handleX;
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
  if (draggingShapesList.length > 0) {
    drawAllTargetIntersections();
  }
  for (const s of draggingShapesList) {
    const isInDropZone = s.dropZoneIndex >= 0;
    const useHintGlow = s.nearHint && (s === draggingShape || s === selectedShape);
    const dragAlpha = 0.7;
    if (isInDropZone) {
      const dz = dropZones[s.dropZoneIndex];
      if (!dz) continue;
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      drawRoundedRect(ctx, dz.x, dz.y, dz.width, dz.height, appData.dropZoneCornerRadius);
      ctx.clip();
      if (useHintGlow) {
        drawShapeWithHintGlow(ctx, s.type, s.x, s.y, s.size, s.color, s.rotation, dragAlpha);
      } else {
        drawShape(ctx, s.type, s.x, s.y, s.size, s.color, s.rotation, dragAlpha);
      }
      ctx.restore();
    } else {
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      if (useHintGlow) {
        drawShapeWithHintGlow(ctx, s.type, s.x, s.y, s.size, s.color, s.rotation, dragAlpha);
      } else {
        drawShape(ctx, s.type, s.x, s.y, s.size, s.color, s.rotation, dragAlpha);
      }
      ctx.restore();
    }
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
    const positionClose = dist < appData.snapThreshold;
    if (positionClose) {
      const angleMatch = isAngleMatchWithSymmetry(
        shape.type,
        shape.rotation,
        targetRotation,
        appData.snapAngleThreshold
      );
      if (positionClose && angleMatch && dist < bestDist) {
        bestDist = dist;
        bestIndex = i;
        bestTargetX = targetX;
        bestTargetY = targetY;
        bestPositionCloseButAngleWrong = false;
      } else if (!angleMatch) {
        bestPositionCloseButAngleWrong = true;
      }
    }
  }
  if (bestIndex >= 0) {
    gsap.to(shape, {
      x: bestTargetX,
      y: bestTargetY,
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
  if (bestPositionCloseButAngleWrong) {
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
    const newRotation = shapeStartAngle + deltaAngle;
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
    fontSize: "14px",
    fontWeight: "bold",
    pointerEvents: "none",
    whiteSpace: "nowrap"
  }, codeText);
  topLeftContainer.appendChild(codeBadge);
  const titleLabel = AppHelper.createUIElement("div", "titleLabel", {
    color: "#333333",
    fontSize: "16px",
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
      right: "2%",
      bottom: "3%",
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
  const isCorrect = checkAllAnswers();
  if (isCorrect) {
    handleCorrectAnswer();
  } else {
    setBubbleText(textData.wrongBubble);
    const unsnappedInZones = clonedShapes.filter((s) => s.dropZoneIndex >= 0 && !s.snapped);
    for (const s of unsnappedInZones) {
      const origX = s.x;
      gsap.to(s, {
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
function buildCharacterUI() {
  const bottomLeftContainer = AppHelper.createUIElement("div", "bottomLeftContainer", {
    position: "absolute",
    left: "0.5%",
    bottom: "0.5%",
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-end",
    gap: "0px",
    pointerEvents: "none"
  });
  uiLayer.appendChild(bottomLeftContainer);
  const characterImg = AppHelper.createUIElement("div", "characterImg", {
    width: "100px",
    height: "130px",
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
    width: "170px",
    marginLeft: "-30px",
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
      left: "12%",
      width: "76%",
      height: "65%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "left",
      fontSize: "14px",
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
  currentState = "playing" /* PLAYING */;
  currentBubbleText = textData.defaultBubble;
  soundsInitialized = true;
  createPlayingUI();
  buildCharacterUI();
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
export {
  initApp
};
