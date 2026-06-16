// import section

// Import AppHelper for utility functions and data loading
import { AppHelper } from "./appHelper";
// Import gsap for tween animations
import gsap from "gsap";

// declaration section

// Interface for answer map entry linking drop zone to its two answer shapes
interface IAnswerMapEntry {
  dropZoneIndex: number;
  shapes: { type: string; color: string; paletteIndex: number }[];
  targetOffsets: { x: number; y: number; rotation: number }[];
}

// Interface for target intersection shape displayed in drop zones
interface ITargetIntersection {
  dropZoneIndex: number;
  color: string;
  opacity: number;
  shapes: { type: ShapeType; offsetX: number; offsetY: number; rotation: number; size: number }[];
}

// Interface for the asset list containing images and sounds
interface IAssetList {
  images: {
    id: string;
    file_path: string;
    width: number;
    height: number;
    isBackgroundImage: boolean;
    isNewAsset: boolean;
    description: string;
  }[];
  sounds: {
    id: string;
    file_path: string;
    duration_seconds: number;
    volume: number;
    isBackgroundMusic: boolean;
    isNewAsset: boolean;
    description: string;
  }[];
}

// Interface for application configuration data
interface IAppData {
  canvasWidth: number;
  canvasHeight: number;
  dropZoneSize: number;
  dropZoneGap: number;
  dropZoneY: number;
  dropZoneCornerRadius: number;
  paletteY: number;
  shapeSize: number;
  snapThreshold: number;
  snapAngleThreshold: number;
  rotationHandleDistance: number;
  rotationHandleRadius: number;
  puzzles: IPuzzle[];
  answerMap: IAnswerMapEntry[];
  dropZoneBorderColors: string[];
}

// Interface for a single puzzle definition
interface IPuzzle {
  id: number;
  targetShapes: ITargetShape[];
  resultDescription: string;
}

// Interface for a target shape in a puzzle
interface ITargetShape {
  type: string;
  color: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

// Interface for text data used in the UI
interface ITextData {
  title: string;
  subtitle: string;
  mission: string;
  checkAnswer: string;
  defaultBubble: string;
  correctBubble: string;
  wrongBubble: string;
  titleScreen: string;
  titleInstruction: string;
  startButton: string;
  instructionTitle: string;
  instruction1: string;
  instruction2: string;
  instruction3: string;
  instructionStart: string;
}

// Interface for a cloned shape on the canvas
interface ClonedShape {
  id: number;
  type: ShapeType;
  color: string;
  rgbColor: number[];
  x: number;
  y: number;
  rotation: number;
  scale: number;
  size: number;
  selected: boolean;
  dropZoneIndex: number;
  snapped: boolean;
}

// Interface for palette shape definition
interface PaletteShape {
  type: ShapeType;
  color: string;
  rgbColor: number[];
  x: number;
  y: number;
  size: number;
  label: string;
}

// Interface for drop zone area
interface DropZone {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
}

// Array of target intersection shapes to render in drop zones
let targetIntersections: ITargetIntersection[] = [];

// Loaded asset list data reference
let assetListData: IAssetList;

// Enum for shape types
enum ShapeType {
  RECTANGLE = "rectangle",
  TRIANGLE = "triangle",
  CIRCLE = "circle",
}

// Enum for app states
enum AppState {
  TITLE = "title",
  INSTRUCTION = "instruction",
  PLAYING = "playing",
  ANIMATING = "animating",
  RESULT = "result",
}

// Next ID counter for cloned shapes
let nextCloneId = 1;

// Current app state
let currentState: AppState = AppState.TITLE;

// Loaded app data reference
let appData: IAppData;

// Loaded text data reference
let textData: ITextData;

// Canvas element reference
let appCanvas: HTMLCanvasElement;

// Canvas 2D rendering context
let ctx: CanvasRenderingContext2D;

// UI layer element reference
let uiLayer: HTMLElement;

// Array of cloned shapes currently on canvas
let clonedShapes: ClonedShape[] = [];

// Array of palette shapes at the bottom
let paletteShapes: PaletteShape[] = [];

// Array of drop zone areas
let dropZones: DropZone[] = [];

// Currently selected cloned shape
let selectedShape: ClonedShape | null = null;

// Currently dragging cloned shape
let draggingShape: ClonedShape | null = null;

// Is dragging from palette (creating clone)
let isDraggingFromPalette = false;

// Is rotating a shape
let isRotating = false;

// Drag offset X
let dragOffsetX = 0;

// Drag offset Y
let dragOffsetY = 0;

// Rotation start angle
let rotationStartAngle = 0;

// Rotation shape start angle
let shapeStartAngle = 0;

// Current bubble text
let currentBubbleText = "";

// Animation frame request ID
let animFrameId = 0;

// UI elements references array
let uiElements: HTMLElement[] = [];

// Whether sounds have been initialized
let soundsInitialized = false;

// Function to build a shape path on the canvas context without filling/stroking
function buildShapePath(
  targetCtx: CanvasRenderingContext2D,
  type: ShapeType,
  cx: number,
  cy: number,
  size: number,
  rotation: number,
): void {
  const half = size / 2;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  switch (type) {
    case ShapeType.RECTANGLE: {
      const corners = [
        [-half, -half],
        [half, -half],
        [half, half],
        [-half, half],
      ];
      const rotated = corners.map((c) => [cx + c[0] * cos - c[1] * sin, cy + c[0] * sin + c[1] * cos]);
      targetCtx.moveTo(rotated[0][0], rotated[0][1]);
      for (let i = 1; i < rotated.length; i++) {
        targetCtx.lineTo(rotated[i][0], rotated[i][1]);
      }
      targetCtx.closePath();
      break;
    }
    case ShapeType.TRIANGLE: {
      const verts = [
        [0, -half],
        [half, half],
        [-half, half],
      ];
      const rotated = verts.map((v) => [cx + v[0] * cos - v[1] * sin, cy + v[0] * sin + v[1] * cos]);
      targetCtx.moveTo(rotated[0][0], rotated[0][1]);
      for (let i = 1; i < rotated.length; i++) {
        targetCtx.lineTo(rotated[i][0], rotated[i][1]);
      }
      targetCtx.closePath();
      break;
    }
    case ShapeType.CIRCLE: {
      targetCtx.arc(cx, cy, half, 0, Math.PI * 2);
      targetCtx.closePath();
      break;
    }
  }
}

// Function to draw all target intersection shapes in their respective drop zones
function drawAllTargetIntersections(): void {
  for (const target of targetIntersections) {
    drawTargetIntersection(target);
  }
}

// Function to draw a single target intersection shape in a drop zone using clip() masking for geometric intersection
function drawTargetIntersection(target: ITargetIntersection): void {
  const dz = dropZones[target.dropZoneIndex];
  if (!dz) return;
  const cx = dz.x + dz.width / 2;
  const cy = dz.y + dz.height / 2;

  const shapeA = target.shapes[0];
  const shapeB = target.shapes[1];

  // Check if any user shapes are snapped into this drop zone - if so, hide the target silhouette
  const snappedInZone = clonedShapes.filter((s) => s.dropZoneIndex === dz.index && s.snapped);
  if (snappedInZone.length > 0) return;

  ctx.save();
  ctx.globalAlpha = target.opacity;
  ctx.globalCompositeOperation = "source-over";

  // Clip to the drop zone first
  drawRoundedRect(ctx, dz.x, dz.y, dz.width, dz.height, appData.dropZoneCornerRadius);
  ctx.clip();

  // Build clip path for shape A
  ctx.save();
  ctx.beginPath();
  buildShapePath(ctx, shapeA.type, cx + shapeA.offsetX, cy + shapeA.offsetY, shapeA.size, shapeA.rotation);
  ctx.clip();

  // Fill shape B within the clip of shape A → only the intersection is visible
  ctx.beginPath();
  buildShapePath(ctx, shapeB.type, cx + shapeB.offsetX, cy + shapeB.offsetY, shapeB.size, shapeB.rotation);
  ctx.fillStyle = target.color;
  ctx.fill();

  // Add a subtle stroke around the intersection shape for clarity
  ctx.strokeStyle = "rgba(0,0,0,0.10)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
  ctx.restore();
}

// Function to initialize the target intersection shapes for each drop zone using clip() masking
function initTargetIntersections(): void {
  targetIntersections = [
    {
      dropZoneIndex: 0,
      color: "rgba(34, 160, 90, 0.75)",
      opacity: 1.0,
      shapes: [
        { type: ShapeType.RECTANGLE, offsetX: -15, offsetY: 0, rotation: (30 * Math.PI) / 180, size: 90 },
        { type: ShapeType.TRIANGLE, offsetX: 15, offsetY: 0, rotation: (-15 * Math.PI) / 180, size: 90 },
      ],
    },
    {
      dropZoneIndex: 1,
      color: "rgba(245, 158, 50, 0.75)",
      opacity: 1.0,
      shapes: [
        { type: ShapeType.TRIANGLE, offsetX: -10, offsetY: 0, rotation: (20 * Math.PI) / 180, size: 90 },
        { type: ShapeType.CIRCLE, offsetX: 10, offsetY: 0, rotation: 0, size: 90 },
      ],
    },
    {
      dropZoneIndex: 2,
      color: "rgba(139, 92, 246, 0.75)",
      opacity: 1.0,
      shapes: [
        { type: ShapeType.RECTANGLE, offsetX: -15, offsetY: 0, rotation: 0, size: 90 },
        { type: ShapeType.CIRCLE, offsetX: 15, offsetY: 0, rotation: 0, size: 90 },
      ],
    },
  ];
}

// Function to convert hex color to RGB array
function hexToRgb(hex: string): number[] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
  }
  return [0, 0, 0];
}

// Function to draw a rounded rectangle path on canvas
function drawRoundedRect(
  targetCtx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
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

// Function to draw a single shape at given position with rotation
function drawShape(
  targetCtx: CanvasRenderingContext2D,
  type: ShapeType,
  x: number,
  y: number,
  size: number,
  color: string,
  rotation: number,
  alpha: number,
): void {
  targetCtx.save();
  targetCtx.globalCompositeOperation = "source-over";
  targetCtx.translate(x, y);
  targetCtx.rotate(rotation);
  targetCtx.globalAlpha = alpha;

  // Subtle inner shadow effect
  targetCtx.shadowColor = "rgba(0,0,0,0.12)";
  targetCtx.shadowBlur = 4;
  targetCtx.shadowOffsetY = 2;

  switch (type) {
    case ShapeType.RECTANGLE:
      targetCtx.fillStyle = color;
      targetCtx.fillRect(-size / 2, -size / 2, size, size);
      targetCtx.shadowBlur = 0;
      targetCtx.shadowOffsetY = 0;
      targetCtx.strokeStyle = "rgba(255,255,255,0.35)";
      targetCtx.lineWidth = 2;
      targetCtx.strokeRect(-size / 2, -size / 2, size, size);
      break;
    case ShapeType.TRIANGLE:
      targetCtx.fillStyle = color;
      targetCtx.beginPath();
      targetCtx.moveTo(0, -size / 2);
      targetCtx.lineTo(size / 2, size / 2);
      targetCtx.lineTo(-size / 2, size / 2);
      targetCtx.closePath();
      targetCtx.fill();
      targetCtx.shadowBlur = 0;
      targetCtx.shadowOffsetY = 0;
      targetCtx.strokeStyle = "rgba(255,255,255,0.35)";
      targetCtx.lineWidth = 2;
      targetCtx.stroke();
      break;
    case ShapeType.CIRCLE:
      targetCtx.fillStyle = color;
      targetCtx.beginPath();
      targetCtx.arc(0, 0, size / 2, 0, Math.PI * 2);
      targetCtx.closePath();
      targetCtx.fill();
      targetCtx.shadowBlur = 0;
      targetCtx.shadowOffsetY = 0;
      targetCtx.strokeStyle = "rgba(255,255,255,0.35)";
      targetCtx.lineWidth = 2;
      targetCtx.stroke();
      break;
  }

  targetCtx.restore();
}

// Function to draw shape with semi-transparent fill for cellophane effect
function drawShapeCellophane(
  targetCtx: CanvasRenderingContext2D,
  type: ShapeType,
  x: number,
  y: number,
  size: number,
  color: string,
  rotation: number,
): void {
  targetCtx.save();
  targetCtx.globalCompositeOperation = "source-over";
  targetCtx.translate(x, y);
  targetCtx.rotate(rotation);
  targetCtx.globalAlpha = 0.6;

  switch (type) {
    case ShapeType.RECTANGLE:
      targetCtx.fillStyle = color;
      targetCtx.fillRect(-size / 2, -size / 2, size, size);
      break;
    case ShapeType.TRIANGLE:
      targetCtx.fillStyle = color;
      targetCtx.beginPath();
      targetCtx.moveTo(0, -size / 2);
      targetCtx.lineTo(size / 2, size / 2);
      targetCtx.lineTo(-size / 2, size / 2);
      targetCtx.closePath();
      targetCtx.fill();
      break;
    case ShapeType.CIRCLE:
      targetCtx.fillStyle = color;
      targetCtx.beginPath();
      targetCtx.arc(0, 0, size / 2, 0, Math.PI * 2);
      targetCtx.closePath();
      targetCtx.fill();
      break;
  }

  targetCtx.restore();
}

// Function to check if a point is inside a shape
function isPointInShape(
  px: number,
  py: number,
  shape: { type: ShapeType; x: number; y: number; size: number; rotation: number },
): boolean {
  const dx = px - shape.x;
  const dy = py - shape.y;
  const cos = Math.cos(-shape.rotation);
  const sin = Math.sin(-shape.rotation);
  const lx = dx * cos - dy * sin;
  const ly = dx * sin + dy * cos;
  const half = shape.size / 2;

  switch (shape.type) {
    case ShapeType.RECTANGLE:
      return Math.abs(lx) <= half && Math.abs(ly) <= half;
    case ShapeType.TRIANGLE: {
      const x0 = 0,
        y0 = -half;
      const x1 = half,
        y1 = half;
      const x2 = -half,
        y2 = half;
      const d1 = (lx - x2) * (y0 - y2) - (x0 - x2) * (ly - y2);
      const d2 = (lx - x0) * (y1 - y0) - (x1 - x0) * (ly - y0);
      const d3 = (lx - x1) * (y2 - y1) - (x2 - x1) * (ly - y1);
      const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
      const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
      return !(hasNeg && hasPos);
    }
    case ShapeType.CIRCLE:
      return lx * lx + ly * ly <= half * half;
  }
}

// Function to check if a point is on the rotation handle of a shape
function isPointOnRotationHandle(px: number, py: number, shape: ClonedShape): boolean {
  if (shape.snapped) return false;
  const handleDist = appData.rotationHandleDistance;
  const handleX = shape.x + Math.cos(shape.rotation - Math.PI / 2) * handleDist;
  const handleY = shape.y + Math.sin(shape.rotation - Math.PI / 2) * handleDist;
  const dx = px - handleX;
  const dy = py - handleY;
  return dx * dx + dy * dy <= appData.rotationHandleRadius * appData.rotationHandleRadius;
}

// Function to draw rotation handle for selected shape
function drawRotationHandle(targetCtx: CanvasRenderingContext2D, shape: ClonedShape): void {
  if (shape.snapped) return;
  const handleDist = appData.rotationHandleDistance;
  const handleX = shape.x + Math.cos(shape.rotation - Math.PI / 2) * handleDist;
  const handleY = shape.y + Math.sin(shape.rotation - Math.PI / 2) * handleDist;

  targetCtx.save();
  targetCtx.globalAlpha = 1.0;
  targetCtx.globalCompositeOperation = "source-over";

  // Dashed line from shape to handle
  targetCtx.strokeStyle = "#6366F1";
  targetCtx.lineWidth = 2;
  targetCtx.setLineDash([4, 4]);
  targetCtx.beginPath();
  targetCtx.moveTo(shape.x, shape.y);
  targetCtx.lineTo(handleX, handleY);
  targetCtx.stroke();
  targetCtx.setLineDash([]);

  // Handle circle with gradient
  const handleGrad = targetCtx.createRadialGradient(
    handleX,
    handleY,
    0,
    handleX,
    handleY,
    appData.rotationHandleRadius,
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

  // Draw rotation arrow icon
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

  // Draw selection outline
  targetCtx.save();
  targetCtx.translate(shape.x, shape.y);
  targetCtx.rotate(shape.rotation);
  targetCtx.strokeStyle = "#6366F1";
  targetCtx.lineWidth = 2.5;
  targetCtx.setLineDash([6, 3]);
  const half = shape.size / 2 + 5;
  switch (shape.type) {
    case ShapeType.RECTANGLE:
      targetCtx.strokeRect(-half, -half, half * 2, half * 2);
      break;
    case ShapeType.TRIANGLE:
      targetCtx.beginPath();
      targetCtx.moveTo(0, -half);
      targetCtx.lineTo(half, half);
      targetCtx.lineTo(-half, half);
      targetCtx.closePath();
      targetCtx.stroke();
      break;
    case ShapeType.CIRCLE:
      targetCtx.beginPath();
      targetCtx.arc(0, 0, half, 0, Math.PI * 2);
      targetCtx.stroke();
      break;
  }
  targetCtx.setLineDash([]);
  targetCtx.restore();

  targetCtx.restore();
}

// Function to determine which drop zone a point belongs to
function getDropZoneIndex(x: number, y: number): number {
  for (const dz of dropZones) {
    if (x >= dz.x && x <= dz.x + dz.width && y >= dz.y && y <= dz.y + dz.height) {
      return dz.index;
    }
  }
  return -1;
}

// Function to clear all UI elements
function clearUI(): void {
  for (const el of uiElements) {
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }
  uiElements = [];
}

// Function to set the bubble text for the guide character
function setBubbleText(text: string): void {
  currentBubbleText = text;
  const bubbleEl = document.getElementById("bubbleText");
  if (bubbleEl) {
    bubbleEl.textContent = text;
  }
}

// Function to initialize drop zones based on app data
function initDropZones(): void {
  dropZones = [];
  const totalWidth = 3 * appData.dropZoneSize + 2 * appData.dropZoneGap;
  const startX = (appData.canvasWidth - totalWidth) / 2;
  for (let i = 0; i < 3; i++) {
    dropZones.push({
      x: startX + i * (appData.dropZoneSize + appData.dropZoneGap),
      y: appData.dropZoneY,
      width: appData.dropZoneSize,
      height: appData.dropZoneSize,
      index: i,
    });
  }
}

// Function to initialize palette shapes
function initPaletteShapes(): void {
  paletteShapes = [];
  const totalShapes = 3;
  const totalWidth = appData.canvasWidth * 0.5;
  const startX = (appData.canvasWidth - totalWidth) / 2;
  const gap = totalWidth / (totalShapes - 1);
  const y = appData.paletteY;
  const size = appData.shapeSize;

  paletteShapes.push({
    type: ShapeType.RECTANGLE,
    color: "#5B8DEF",
    rgbColor: hexToRgb("#5B8DEF"),
    x: startX,
    y,
    size,
    label: "파랑 네모",
  });

  paletteShapes.push({
    type: ShapeType.TRIANGLE,
    color: "#FFD966",
    rgbColor: hexToRgb("#FFD966"),
    x: startX + gap,
    y,
    size,
    label: "노랑 세모",
  });

  paletteShapes.push({
    type: ShapeType.CIRCLE,
    color: "#FF6B6B",
    rgbColor: hexToRgb("#FF6B6B"),
    x: startX + gap * 2,
    y,
    size,
    label: "빨강 동그라미",
  });
}

// Function to draw the background with a subtle gradient
function drawBackground(): void {
  ctx.save();
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = "source-over";
  const gradient = ctx.createLinearGradient(0, 0, 0, appData.canvasHeight);
  gradient.addColorStop(0, "#F5F7FB");
  gradient.addColorStop(0.5, "#EEF1F8");
  gradient.addColorStop(1, "#E8EDF6");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, appData.canvasWidth, appData.canvasHeight);
  ctx.restore();
}

// Function to draw the drop zones with solid pastel borders
function drawDropZones(): void {
  const borderColors = appData.dropZoneBorderColors || ["#F4A7BB", "#A7D7A0", "#7EB8E0"];
  for (let i = 0; i < dropZones.length; i++) {
    const dz = dropZones[i];
    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = "source-over";

    // Drop zone shadow
    ctx.shadowColor = "rgba(91, 141, 239, 0.10)";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 6;

    drawRoundedRect(ctx, dz.x, dz.y, dz.width, dz.height, appData.dropZoneCornerRadius);
    ctx.fillStyle = "#FAFBFF";
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Solid pastel border instead of dashed
    ctx.strokeStyle = borderColors[i];
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  }

  // Draw the target intersection shapes (fixed, non-draggable guide graphics)
  drawAllTargetIntersections();
}

// Function to draw palette area background
function drawPaletteArea(): void {
  ctx.save();
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = "source-over";
  const palY = appData.paletteY - appData.shapeSize * 0.8;
  const palH = appData.shapeSize * 1.8;

  // Shadow for palette area
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

// Function to draw palette shapes at the bottom
function drawPaletteShapes(): void {
  for (const ps of paletteShapes) {
    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = "source-over";
    drawShape(ctx, ps.type, ps.x, ps.y, ps.size, ps.color, 0, 0.9);
    ctx.restore();
  }
}

// Function to draw the real-time intersection color for overlapping shapes using multiply blend
function drawIntersectionBlend(targetCtx: CanvasRenderingContext2D, shapeA: ClonedShape, shapeB: ClonedShape): void {
  // Determine the mixed color based on which two colors overlap
  const colorA = shapeA.color.toUpperCase();
  const colorB = shapeB.color.toUpperCase();
  let mixedColor = "";

  // Blue + Yellow = Green
  if ((colorA === "#5B8DEF" && colorB === "#FFD966") || (colorA === "#FFD966" && colorB === "#5B8DEF")) {
    mixedColor = "rgba(34, 160, 90, 0.85)";
  }
  // Yellow + Red = Orange
  else if ((colorA === "#FFD966" && colorB === "#FF6B6B") || (colorA === "#FF6B6B" && colorB === "#FFD966")) {
    mixedColor = "rgba(245, 158, 50, 0.85)";
  }
  // Blue + Red = Purple
  else if ((colorA === "#5B8DEF" && colorB === "#FF6B6B") || (colorA === "#FF6B6B" && colorB === "#5B8DEF")) {
    mixedColor = "rgba(139, 92, 246, 0.85)";
  }

  if (!mixedColor) return;

  // Use clip intersection: clip to shapeA, then fill shapeB with the mixed color
  targetCtx.save();
  targetCtx.globalAlpha = 0.8;
  targetCtx.globalCompositeOperation = "source-over";

  // Clip to shape A
  targetCtx.beginPath();
  buildShapePath(targetCtx, shapeA.type, shapeA.x, shapeA.y, shapeA.size, shapeA.rotation);
  targetCtx.clip();

  // Fill shape B within clip = intersection area
  targetCtx.beginPath();
  buildShapePath(targetCtx, shapeB.type, shapeB.x, shapeB.y, shapeB.size, shapeB.rotation);
  targetCtx.fillStyle = mixedColor;
  targetCtx.fill();

  targetCtx.restore();
}

// Function to draw all cloned shapes with cellophane blend effect on each drop zone
function drawClonedShapes(): void {
  // Group shapes by drop zone
  for (const dz of dropZones) {
    const shapesInZone = clonedShapes.filter((s) => s.dropZoneIndex === dz.index);
    if (shapesInZone.length === 0) continue;

    // Create off-screen canvas for blending using AppHelper
    const offCanvas = AppHelper.createUIElement("canvas", "", {}, "", []) as unknown as HTMLCanvasElement;
    (offCanvas as HTMLCanvasElement).width = appData.canvasWidth;
    (offCanvas as HTMLCanvasElement).height = appData.canvasHeight;
    const offCtx = (offCanvas as HTMLCanvasElement).getContext("2d");
    if (!offCtx) continue;

    offCtx.clearRect(0, 0, appData.canvasWidth, appData.canvasHeight);

    // Draw each shape with cellophane transparency
    for (let i = 0; i < shapesInZone.length; i++) {
      offCtx.globalCompositeOperation = "source-over";
      drawShapeCellophane(
        offCtx,
        shapesInZone[i].type,
        shapesInZone[i].x,
        shapesInZone[i].y,
        shapesInZone[i].size,
        shapesInZone[i].color,
        shapesInZone[i].rotation,
      );
    }

    // Draw real intersection colors for each pair
    for (let i = 0; i < shapesInZone.length; i++) {
      for (let j = i + 1; j < shapesInZone.length; j++) {
        drawIntersectionBlend(offCtx, shapesInZone[i], shapesInZone[j]);
      }
    }

    // Composite off-screen onto main canvas clipped to drop zone
    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = "source-over";
    drawRoundedRect(ctx, dz.x, dz.y, dz.width, dz.height, appData.dropZoneCornerRadius);
    ctx.clip();
    ctx.drawImage(offCanvas as HTMLCanvasElement, 0, 0);
    ctx.restore();

    // Remove the temporary off-screen canvas from DOM if it was added
    if (offCanvas.parentNode) {
      offCanvas.parentNode.removeChild(offCanvas);
    }
  }

  // Draw shapes not in any drop zone normally
  const freeShapes = clonedShapes.filter((s) => s.dropZoneIndex === -1);
  for (let fi = 0; fi < freeShapes.length; fi++) {
    const s = freeShapes[fi];
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    drawShapeCellophane(ctx, s.type, s.x, s.y, s.size, s.color, s.rotation);
    ctx.restore();
  }

  // Draw intersection blend for free shapes that overlap
  for (let i = 0; i < freeShapes.length; i++) {
    for (let j = i + 1; j < freeShapes.length; j++) {
      ctx.save();
      drawIntersectionBlend(ctx, freeShapes[i], freeShapes[j]);
      ctx.restore();
    }
  }

  // Draw selection handles for selected shape
  if (selectedShape && currentState === AppState.PLAYING && !selectedShape.snapped) {
    drawRotationHandle(ctx, selectedShape);
  }
}

// Function to draw the guide character with speech bubble
function drawGuideCharacter(): void {
  const charX = 60;
  const charY = appData.paletteY - appData.shapeSize * 0.8 - 45;

  // Draw character (single explorer emoji)
  ctx.save();
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = "source-over";
  ctx.font = "44px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🕵️", charX, charY);
  ctx.restore();

  // Draw speech bubble to the right, non-overlapping
  if (currentBubbleText) {
    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = "source-over";
    const bubbleX = charX + 50;
    const bubbleY = charY - 28;
    const padding = 16;

    ctx.font = "bold 13px sans-serif";
    const textWidth = ctx.measureText(currentBubbleText).width;
    const bubbleW = textWidth + padding * 2;
    const bubbleH = 36;

    // Shadow
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

    // Bubble tail pointing left
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

// Function to draw the title screen
function drawTitleScreen(): void {
  const now = Date.now();

  // Thematic background with harmonious gradient
  ctx.save();
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = "source-over";
  const gradient = ctx.createLinearGradient(0, 0, appData.canvasWidth, appData.canvasHeight);
  gradient.addColorStop(0, "#4A6CF7");
  gradient.addColorStop(0.4, "#6366F1");
  gradient.addColorStop(0.7, "#8B5CF6");
  gradient.addColorStop(1, "#A78BFA");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, appData.canvasWidth, appData.canvasHeight);
  ctx.restore();

  // Subtle overlay pattern
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.globalCompositeOperation = "source-over";
  for (let row = 0; row < appData.canvasHeight; row += 6) {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, row, appData.canvasWidth, 1);
  }
  ctx.restore();

  // Decorative shapes in background
  ctx.save();
  const types = [ShapeType.RECTANGLE, ShapeType.TRIANGLE, ShapeType.CIRCLE];
  const colors = ["#93C5FD", "#FDE68A", "#FCA5A5"];
  for (let i = 0; i < 12; i++) {
    const sx = Math.sin(i * 2.1 + now * 0.001) * 300 + appData.canvasWidth / 2;
    const sy = Math.cos(i * 1.7 + now * 0.0008) * 200 + appData.canvasHeight / 2;
    const size = 40 + (i % 3) * 30;
    const rot = now * 0.001 * (i + 1) * 0.1;
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.globalCompositeOperation = "source-over";
    ctx.translate(sx, sy);
    ctx.rotate(rot);

    switch (types[i % 3]) {
      case ShapeType.RECTANGLE:
        ctx.fillStyle = colors[i % 3];
        ctx.fillRect(-size / 2, -size / 2, size, size);
        break;
      case ShapeType.TRIANGLE:
        ctx.fillStyle = colors[i % 3];
        ctx.beginPath();
        ctx.moveTo(0, -size / 2);
        ctx.lineTo(size / 2, size / 2);
        ctx.lineTo(-size / 2, size / 2);
        ctx.closePath();
        ctx.fill();
        break;
      case ShapeType.CIRCLE:
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

  // Title text with shadow
  ctx.save();
  ctx.globalAlpha = 1.0;
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

  // Pulsating start instruction
  const pulse = 0.5 + 0.5 * Math.sin(now * 0.003);
  ctx.font = "20px sans-serif";
  ctx.fillStyle = "rgba(255,255,255," + pulse + ")";
  ctx.shadowBlur = 0;
  ctx.fillText(textData.titleInstruction, appData.canvasWidth / 2, appData.canvasHeight / 2 + 60);
  ctx.restore();
}

// Function to draw the instruction screen
function drawInstructionScreen(): void {
  drawBackground();

  ctx.save();
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = "source-over";

  // Accent bar at top
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
  const icons = ["👆", "🔄", "🎨"];
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

    ctx.globalAlpha = 1.0;
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

  drawShape(ctx, ShapeType.RECTANGLE, appData.canvasWidth * 0.78, 180, 50, "#5B8DEF", 0.15, 0.75);
  drawShape(ctx, ShapeType.TRIANGLE, appData.canvasWidth * 0.85, 265, 50, "#FFD966", 0.3, 0.75);
  drawShape(ctx, ShapeType.CIRCLE, appData.canvasWidth * 0.8, 345, 50, "#FF6B6B", 0, 0.75);

  const pulse = 0.4 + 0.6 * Math.sin(Date.now() * 0.003);
  ctx.font = "18px sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(91, 107, 139," + pulse + ")";
  ctx.globalAlpha = 1.0;
  ctx.fillText(textData.instructionStart, appData.canvasWidth / 2, appData.canvasHeight - 60);
  ctx.restore();
}

// Function to normalize angle to [-PI, PI]
function normalizeAngle(angle: number): number {
  let a = angle % (Math.PI * 2);
  if (a > Math.PI) a -= Math.PI * 2;
  if (a < -Math.PI) a += Math.PI * 2;
  return a;
}

// Function to try snapping a shape to a target position within a drop zone
function trySnapToTarget(shape: ClonedShape): boolean {
  if (shape.dropZoneIndex < 0) return false;

  const dzIndex = shape.dropZoneIndex;
  const dz = dropZones[dzIndex];
  if (!dz) return false;
  const centerX = dz.x + dz.width / 2;
  const centerY = dz.y + dz.height / 2;

  // Find the answer map entry for this drop zone
  const entry = appData.answerMap.find((e) => e.dropZoneIndex === dzIndex);
  if (!entry) return false;

  // Check each expected shape position
  for (let i = 0; i < entry.shapes.length; i++) {
    const expectedType = entry.shapes[i].type as ShapeType;
    if (shape.type !== expectedType) continue;

    const offset = entry.targetOffsets[i];
    const targetX = centerX + offset.x;
    const targetY = centerY + offset.y;
    const targetRotation = (offset.rotation * Math.PI) / 180;

    const dx = targetX - shape.x;
    const dy = targetY - shape.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const angleDiff = Math.abs(normalizeAngle(shape.rotation - targetRotation));
    const angleThresholdRad = (appData.snapAngleThreshold * Math.PI) / 180;

    // Check if already snapped at this position by another shape
    const alreadySnapped = clonedShapes.some(
      (s) => s !== shape && s.snapped && s.dropZoneIndex === dzIndex && s.type === expectedType,
    );
    if (alreadySnapped) continue;

    if (dist < appData.snapThreshold && angleDiff < angleThresholdRad) {
      // Snap!
      shape.x = targetX;
      shape.y = targetY;
      shape.rotation = targetRotation;
      shape.snapped = true;
      return true;
    }
  }

  return false;
}

// Function to draw the main playing screen
function drawPlayingScreen(): void {
  drawBackground();

  // Draw header area - LEFT ALIGNED
  ctx.save();
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = "source-over";

  // Header card
  ctx.shadowColor = "rgba(91, 141, 239, 0.08)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  drawRoundedRect(ctx, 20, 8, appData.canvasWidth - 40, 32, 10);
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Thin accent line at top
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

  // Draw title text LEFT ALIGNED
  ctx.save();
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#3B4A6B";
  ctx.font = "bold 18px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(textData.title, 36, 25);
  ctx.restore();

  // Draw mission box (blue capsule) right below header
  ctx.save();
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = "source-over";
  const missionY = 48;
  const missionH = 34;
  const missionPadding = 20;
  ctx.font = "bold 14px sans-serif";
  const missionTextWidth = ctx.measureText(textData.mission).width;
  const missionW = missionTextWidth + missionPadding * 2;
  const missionX = (appData.canvasWidth - missionW) / 2;

  // Blue capsule background
  drawRoundedRect(ctx, missionX, missionY, missionW, missionH, 8);
  ctx.fillStyle = "#4285F4";
  ctx.fill();

  // White text
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(textData.mission, appData.canvasWidth / 2, missionY + missionH / 2);
  ctx.restore();

  drawDropZones();
  drawPaletteArea();
  drawPaletteShapes();
  drawClonedShapes();
  drawGuideCharacter();
}

// Main render loop function
function render(): void {
  if (!ctx || !appData) return;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, appData.canvasWidth, appData.canvasHeight);

  switch (currentState) {
    case AppState.TITLE:
      drawTitleScreen();
      break;
    case AppState.INSTRUCTION:
      drawInstructionScreen();
      break;
    case AppState.PLAYING:
    case AppState.ANIMATING:
    case AppState.RESULT:
      drawPlayingScreen();
      break;
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = "source-over";

  animFrameId = requestAnimationFrame(render);
}

// Function to find which palette shape is at a given point
function findPaletteShapeAt(x: number, y: number): PaletteShape | null {
  for (let i = paletteShapes.length - 1; i >= 0; i--) {
    const ps = paletteShapes[i];
    if (isPointInShape(x, y, { type: ps.type, x: ps.x, y: ps.y, size: ps.size, rotation: 0 })) {
      return ps;
    }
  }
  return null;
}

// Function to find which cloned shape is at a given point
function findClonedShapeAt(x: number, y: number): ClonedShape | null {
  for (let i = clonedShapes.length - 1; i >= 0; i--) {
    const cs = clonedShapes[i];
    if (isPointInShape(x, y, cs)) {
      return cs;
    }
  }
  return null;
}

// Function to create a clone from a palette shape
function createClone(palette: PaletteShape, x: number, y: number): ClonedShape {
  const clone: ClonedShape = {
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
  };
  clonedShapes.push(clone);
  return clone;
}

// Function to update drop zone assignment for a shape
function updateShapeDropZone(shape: ClonedShape): void {
  shape.dropZoneIndex = getDropZoneIndex(shape.x, shape.y);
}

// Function to snap shape to drop zone center if close enough (legacy fallback)
function snapToDropZone(shape: ClonedShape): void {
  if (shape.dropZoneIndex >= 0 && !shape.snapped) {
    // Try snapping to target answer position first
    const didSnap = trySnapToTarget(shape);
    if (!didSnap) {
      // Don't do center snap anymore - only snap to answer positions
    }
  }
}

// Handler for pointer down events on canvas
function handlePointerDown(e: PointerEvent): void {
  e.preventDefault();
  const coords = AppHelper.getRelativeCoordinates(e.clientX, e.clientY, appCanvas);
  const x = coords.x;
  const y = coords.y;

  if (currentState === AppState.TITLE) {
    soundsInitialized = true;
    currentState = AppState.INSTRUCTION;
    return;
  }

  if (currentState === AppState.INSTRUCTION) {
    currentState = AppState.PLAYING;
    setBubbleText(textData.defaultBubble);
    createPlayingUI();
    return;
  }

  if (currentState !== AppState.PLAYING) return;

  // Check rotation handle first
  if (selectedShape && !selectedShape.snapped && isPointOnRotationHandle(x, y, selectedShape)) {
    isRotating = true;
    rotationStartAngle = Math.atan2(y - selectedShape.y, x - selectedShape.x);
    shapeStartAngle = selectedShape.rotation;
    return;
  }

  // Check if clicking on a cloned shape
  const clickedClone = findClonedShapeAt(x, y);
  if (clickedClone) {
    // If shape is snapped, unsnap it on click to allow repositioning
    if (clickedClone.snapped) {
      clickedClone.snapped = false;
    }
    selectedShape = clickedClone;
    draggingShape = clickedClone;
    isDraggingFromPalette = false;
    dragOffsetX = x - clickedClone.x;
    dragOffsetY = y - clickedClone.y;
    // Bring to front
    const idx = clonedShapes.indexOf(clickedClone);
    if (idx >= 0) {
      clonedShapes.splice(idx, 1);
      clonedShapes.push(clickedClone);
    }
    return;
  }

  // Check if clicking on palette shape
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

  // Deselect
  selectedShape = null;
}

// Handler for pointer move events on canvas
function handlePointerMove(e: PointerEvent): void {
  e.preventDefault();
  const coords = AppHelper.getRelativeCoordinates(e.clientX, e.clientY, appCanvas);
  const x = coords.x;
  const y = coords.y;

  if (currentState !== AppState.PLAYING) return;

  if (isRotating && selectedShape) {
    const angle = Math.atan2(y - selectedShape.y, x - selectedShape.x);
    selectedShape.rotation = shapeStartAngle + (angle - rotationStartAngle);
    return;
  }

  if (draggingShape) {
    draggingShape.x = x - dragOffsetX;
    draggingShape.y = y - dragOffsetY;
    updateShapeDropZone(draggingShape);

    // Real-time snap check during drag
    if (draggingShape.dropZoneIndex >= 0) {
      const didSnap = trySnapToTarget(draggingShape);
      if (didSnap) {
        // Shape snapped! Release from dragging
        draggingShape = null;
        isDraggingFromPalette = false;
        return;
      }
    }
    return;
  }
}

// Handler for pointer up events on canvas
function handlePointerUp(e: PointerEvent): void {
  e.preventDefault();

  if (currentState !== AppState.PLAYING) return;

  if (isRotating) {
    isRotating = false;
    // After rotation, check if we should snap
    if (selectedShape && selectedShape.dropZoneIndex >= 0) {
      trySnapToTarget(selectedShape);
    }
    return;
  }

  if (draggingShape) {
    updateShapeDropZone(draggingShape);
    snapToDropZone(draggingShape);

    // If shape was dropped back on palette area, remove it
    if (draggingShape.y > appData.paletteY - appData.shapeSize * 0.5 && draggingShape.dropZoneIndex === -1) {
      const idx = clonedShapes.indexOf(draggingShape);
      if (idx >= 0) {
        clonedShapes.splice(idx, 1);
        if (selectedShape === draggingShape) selectedShape = null;
      }
    }

    draggingShape = null;
    isDraggingFromPalette = false;
  }
}

// Function to handle keyboard events for deleting shapes
function handleKeyDown(e: KeyboardEvent): void {
  if (currentState !== AppState.PLAYING) return;
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

// Function to create the playing state UI elements (only check answer button)
function createPlayingUI(): void {
  clearUI();

  // Check Answer button - blue
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
      zIndex: "10",
    },
    textData.checkAnswer,
    [
      {
        event: "pointerdown",
        handler: (ev: Event) => {
          ev.stopPropagation();
          handleCheckAnswer();
        },
      },
    ],
  );
  uiLayer.appendChild(btnCheck);
  uiElements.push(btnCheck);
}

// Function to handle check answer button click
function handleCheckAnswer(): void {
  if (currentState !== AppState.PLAYING) return;
  currentState = AppState.ANIMATING;
  selectedShape = null;

  // Play auto demonstration animation
  playDemoAnimation();
}

// Function to handle reset
function handleReset(): void {
  clonedShapes = [];
  selectedShape = null;
  draggingShape = null;
  isRotating = false;
  isDraggingFromPalette = false;
  currentState = AppState.PLAYING;
  setBubbleText(textData.defaultBubble);
}

// Function to play the demonstration animation for all 3 target boxes simultaneously
function playDemoAnimation(): void {
  clonedShapes = [];
  selectedShape = null;

  const answerMap = appData.answerMap;
  if (!answerMap || answerMap.length === 0) {
    currentState = AppState.PLAYING;
    return;
  }

  const allAnimShapes: ClonedShape[] = [];

  const tl = gsap.timeline({
    onComplete: () => {
      for (const s of allAnimShapes) {
        updateShapeDropZone(s);
        s.snapped = true;
      }
      setBubbleText(textData.correctBubble);
      currentState = AppState.RESULT;

      setTimeout(() => {
        handleReset();
      }, 3000);
    },
  });

  answerMap.forEach((entry, entryIdx) => {
    const dz = dropZones[entry.dropZoneIndex];
    if (!dz) return;
    const centerX = dz.x + dz.width / 2;
    const centerY = dz.y + dz.height / 2;

    entry.shapes.forEach((shapeDef, shapeIdx) => {
      const palette = paletteShapes[shapeDef.paletteIndex];
      if (!palette) return;

      const clone: ClonedShape = {
        id: nextCloneId++,
        type: shapeDef.type as ShapeType,
        color: palette.color,
        rgbColor: [...palette.rgbColor],
        x: palette.x,
        y: palette.y,
        rotation: 0,
        scale: 1,
        size: palette.size,
        selected: false,
        dropZoneIndex: -1,
        snapped: false,
      };
      clonedShapes.push(clone);
      allAnimShapes.push(clone);

      const offset = entry.targetOffsets[shapeIdx];
      const finalX = centerX + (offset ? offset.x : 0);
      const finalY = centerY + (offset ? offset.y : 0);
      const finalRotation = offset ? (offset.rotation * Math.PI) / 180 : 0;

      const startTime = entryIdx * 0.15 + shapeIdx * 0.1;

      tl.to(
        clone,
        {
          x: finalX,
          y: finalY,
          rotation: finalRotation,
          duration: 1.2,
          ease: "power2.inOut",
        },
        startTime,
      );
    });
  });
}

// Function to initialize the application
async function initApp(): Promise<void> {
  appData = await AppHelper.loadAppData<IAppData>();
  textData = await AppHelper.loadTextData<ITextData>();
  assetListData = await AppHelper.loadAssetList<IAssetList>();

  appCanvas = document.getElementById("appCanvas") as HTMLCanvasElement;
  uiLayer = document.getElementById("uiLayer") as HTMLElement;
  ctx = appCanvas.getContext("2d")!;

  // Set logical resolution
  appCanvas.width = appData.canvasWidth;
  appCanvas.height = appData.canvasHeight;

  // Initialize game elements
  initDropZones();
  initPaletteShapes();
  initTargetIntersections();

  currentState = AppState.TITLE;
  currentBubbleText = textData.defaultBubble;

  // Register pointer events on canvas
  appCanvas.addEventListener("pointerdown", handlePointerDown);
  appCanvas.addEventListener("pointermove", handlePointerMove);
  appCanvas.addEventListener("pointerup", handlePointerUp);
  appCanvas.addEventListener("pointercancel", handlePointerUp);

  // Prevent context menu on canvas
  appCanvas.addEventListener("contextmenu", (e) => e.preventDefault());

  // Touch event prevention for iOS scroll
  appCanvas.addEventListener("touchstart", (e) => e.preventDefault(), { passive: false });
  appCanvas.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });

  // Keyboard events
  document.addEventListener("keydown", handleKeyDown);

  // Cancel any existing animation frame
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = 0;
  }

  // Start render loop
  render();
}

// export section

// Export the initApp function as entry point
export { initApp };
