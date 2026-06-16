// import section

// Import AppHelper for utility functions and data loading
import { AppHelper } from "./appHelper";
// Import gsap for tween animations
import gsap from "gsap";

// declaration section

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
  rotationHandleDistance: number;
  rotationHandleRadius: number;
  puzzles: IPuzzle[];
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
  resetButton: string;
  targetLabel1: string;
  targetLabel2: string;
  targetLabel3: string;
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

// Current puzzle index
let currentPuzzleIndex = 0;

// Animation frame request ID
let animFrameId = 0;

// UI elements references array
let uiElements: HTMLElement[] = [];

// Whether sounds have been initialized
let soundsInitialized = false;

// Function to draw all target intersection shapes in their respective drop zones
function drawAllTargetIntersections(): void {
  for (const target of targetIntersections) {
    drawTargetIntersection(target);
  }
}

// Function to draw a single target intersection shape in a drop zone using clipping for geometric intersection
function drawTargetIntersection(target: ITargetIntersection): void {
  const dz = dropZones[target.dropZoneIndex];
  if (!dz) return;
  const cx = dz.x + dz.width / 2;
  const cy = dz.y + dz.height / 2;

  // We draw the intersection of two shapes:
  // 1. Draw shape A as a clip path
  // 2. Fill shape B within that clip → only the overlapping region is visible
  // Then color it with the target intersection color

  const shapeA = target.shapes[0];
  const shapeB = target.shapes[1];

  ctx.save();
  ctx.globalAlpha = target.opacity;
  ctx.globalCompositeOperation = "source-over";

  // Clip to the drop zone first
  drawRoundedRect(ctx, dz.x, dz.y, dz.width, dz.height, appData.dropZoneCornerRadius);
  ctx.clip();

  // Build clip path for shape A
  ctx.save();
  ctx.beginPath();
  const axCenter = cx + shapeA.offsetX;
  const ayCenter = cy + shapeA.offsetY;

  switch (shapeA.type) {
    case ShapeType.RECTANGLE: {
      const half = shapeA.size / 2;
      const cos = Math.cos(shapeA.rotation);
      const sin = Math.sin(shapeA.rotation);
      const corners = [
        [-half, -half],
        [half, -half],
        [half, half],
        [-half, half],
      ];
      const rotated = corners.map((c) => [axCenter + c[0] * cos - c[1] * sin, ayCenter + c[0] * sin + c[1] * cos]);
      ctx.moveTo(rotated[0][0], rotated[0][1]);
      for (let i = 1; i < rotated.length; i++) {
        ctx.lineTo(rotated[i][0], rotated[i][1]);
      }
      ctx.closePath();
      break;
    }
    case ShapeType.TRIANGLE: {
      const half = shapeA.size / 2;
      const cos = Math.cos(shapeA.rotation);
      const sin = Math.sin(shapeA.rotation);
      const verts = [
        [0, -half],
        [half, half],
        [-half, half],
      ];
      const rotated = verts.map((v) => [axCenter + v[0] * cos - v[1] * sin, ayCenter + v[0] * sin + v[1] * cos]);
      ctx.moveTo(rotated[0][0], rotated[0][1]);
      for (let i = 1; i < rotated.length; i++) {
        ctx.lineTo(rotated[i][0], rotated[i][1]);
      }
      ctx.closePath();
      break;
    }
    case ShapeType.CIRCLE: {
      ctx.arc(axCenter, ayCenter, shapeA.size / 2, 0, Math.PI * 2);
      ctx.closePath();
      break;
    }
  }
  ctx.clip();

  // Now draw shape B filled with the intersection color within the clip of shape A
  const bxCenter = cx + shapeB.offsetX;
  const byCenter = cy + shapeB.offsetY;

  ctx.fillStyle = target.color;
  ctx.beginPath();
  switch (shapeB.type) {
    case ShapeType.RECTANGLE: {
      const half = shapeB.size / 2;
      const cos = Math.cos(shapeB.rotation);
      const sin = Math.sin(shapeB.rotation);
      const corners = [
        [-half, -half],
        [half, -half],
        [half, half],
        [-half, half],
      ];
      const rotated = corners.map((c) => [bxCenter + c[0] * cos - c[1] * sin, byCenter + c[0] * sin + c[1] * cos]);
      ctx.moveTo(rotated[0][0], rotated[0][1]);
      for (let i = 1; i < rotated.length; i++) {
        ctx.lineTo(rotated[i][0], rotated[i][1]);
      }
      ctx.closePath();
      break;
    }
    case ShapeType.TRIANGLE: {
      const half = shapeB.size / 2;
      const cos = Math.cos(shapeB.rotation);
      const sin = Math.sin(shapeB.rotation);
      const verts = [
        [0, -half],
        [half, half],
        [-half, half],
      ];
      const rotated = verts.map((v) => [bxCenter + v[0] * cos - v[1] * sin, byCenter + v[0] * sin + v[1] * cos]);
      ctx.moveTo(rotated[0][0], rotated[0][1]);
      for (let i = 1; i < rotated.length; i++) {
        ctx.lineTo(rotated[i][0], rotated[i][1]);
      }
      ctx.closePath();
      break;
    }
    case ShapeType.CIRCLE: {
      ctx.arc(bxCenter, byCenter, shapeB.size / 2, 0, Math.PI * 2);
      ctx.closePath();
      break;
    }
  }
  ctx.fill();

  // Add a subtle stroke around the intersection shape for clarity
  ctx.strokeStyle = "rgba(0,0,0,0.15)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
  ctx.restore();
}

// Function to initialize the target intersection shapes for each drop zone
function initTargetIntersections(): void {
  targetIntersections = [
    {
      // Box 1: Blue Rectangle + Yellow Triangle intersection → Green
      dropZoneIndex: 0,
      color: "#2ECC71",
      opacity: 0.7,
      shapes: [
        { type: ShapeType.RECTANGLE, offsetX: -15, offsetY: 0, rotation: (30 * Math.PI) / 180, size: 90 },
        { type: ShapeType.TRIANGLE, offsetX: 15, offsetY: 0, rotation: (-15 * Math.PI) / 180, size: 90 },
      ],
    },
    {
      // Box 2: Yellow Triangle + Red Circle intersection → Orange
      dropZoneIndex: 1,
      color: "#F39C12",
      opacity: 0.7,
      shapes: [
        { type: ShapeType.TRIANGLE, offsetX: -10, offsetY: 0, rotation: (20 * Math.PI) / 180, size: 90 },
        { type: ShapeType.CIRCLE, offsetX: 10, offsetY: 0, rotation: 0, size: 90 },
      ],
    },
    {
      // Box 3: Blue Rectangle + Red Circle intersection → Purple
      dropZoneIndex: 2,
      color: "#9B59B6",
      opacity: 0.7,
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
function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Function to draw a single shape at given position with rotation
function drawShape(
  ctx: CanvasRenderingContext2D,
  type: ShapeType,
  x: number,
  y: number,
  size: number,
  color: string,
  rotation: number,
  alpha: number,
): void {
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = alpha;

  switch (type) {
    case ShapeType.RECTANGLE:
      ctx.fillStyle = color;
      ctx.fillRect(-size / 2, -size / 2, size, size);
      ctx.strokeStyle = "rgba(0,0,0,0.2)";
      ctx.lineWidth = 2;
      ctx.strokeRect(-size / 2, -size / 2, size, size);
      break;
    case ShapeType.TRIANGLE:
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, -size / 2);
      ctx.lineTo(size / 2, size / 2);
      ctx.lineTo(-size / 2, size / 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.2)";
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    case ShapeType.CIRCLE:
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.2)";
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
  }

  ctx.restore();
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
  const handleDist = appData.rotationHandleDistance;
  const handleX = shape.x + Math.cos(shape.rotation - Math.PI / 2) * handleDist;
  const handleY = shape.y + Math.sin(shape.rotation - Math.PI / 2) * handleDist;
  const dx = px - handleX;
  const dy = py - handleY;
  return dx * dx + dy * dy <= appData.rotationHandleRadius * appData.rotationHandleRadius;
}

// Function to draw rotation handle for selected shape
function drawRotationHandle(ctx: CanvasRenderingContext2D, shape: ClonedShape): void {
  const handleDist = appData.rotationHandleDistance;
  const handleX = shape.x + Math.cos(shape.rotation - Math.PI / 2) * handleDist;
  const handleY = shape.y + Math.sin(shape.rotation - Math.PI / 2) * handleDist;

  ctx.save();
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = "source-over";

  // Dashed line from shape to handle
  ctx.strokeStyle = "#4A90D9";
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(shape.x, shape.y);
  ctx.lineTo(handleX, handleY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Handle circle
  ctx.fillStyle = "#4A90D9";
  ctx.beginPath();
  ctx.arc(handleX, handleY, appData.rotationHandleRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw rotation arrow icon
  ctx.save();
  ctx.translate(handleX, handleY);
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 6, -Math.PI * 0.7, Math.PI * 0.3);
  ctx.stroke();
  ctx.beginPath();
  const endAngle = Math.PI * 0.3;
  const endX = Math.cos(endAngle) * 6;
  const endY = Math.sin(endAngle) * 6;
  ctx.moveTo(endX - 3, endY - 3);
  ctx.lineTo(endX, endY);
  ctx.lineTo(endX + 3, endY - 2);
  ctx.stroke();
  ctx.restore();

  // Draw selection outline
  ctx.save();
  ctx.translate(shape.x, shape.y);
  ctx.rotate(shape.rotation);
  ctx.strokeStyle = "#4A90D9";
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 3]);
  const half = shape.size / 2 + 5;
  switch (shape.type) {
    case ShapeType.RECTANGLE:
      ctx.strokeRect(-half, -half, half * 2, half * 2);
      break;
    case ShapeType.TRIANGLE:
      ctx.beginPath();
      ctx.moveTo(0, -half);
      ctx.lineTo(half, half);
      ctx.lineTo(-half, half);
      ctx.closePath();
      ctx.stroke();
      break;
    case ShapeType.CIRCLE:
      ctx.beginPath();
      ctx.arc(0, 0, half, 0, Math.PI * 2);
      ctx.stroke();
      break;
  }
  ctx.setLineDash([]);
  ctx.restore();

  ctx.restore();
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
    color: "#4A90D9",
    rgbColor: hexToRgb("#4A90D9"),
    x: startX,
    y,
    size,
    label: "파랑 네모",
  });

  paletteShapes.push({
    type: ShapeType.TRIANGLE,
    color: "#F5D547",
    rgbColor: hexToRgb("#F5D547"),
    x: startX + gap,
    y,
    size,
    label: "노랑 세모",
  });

  paletteShapes.push({
    type: ShapeType.CIRCLE,
    color: "#E74C3C",
    rgbColor: hexToRgb("#E74C3C"),
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
  gradient.addColorStop(0, "#F0F4FF");
  gradient.addColorStop(1, "#E8ECF5");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, appData.canvasWidth, appData.canvasHeight);
  ctx.restore();
}

// Function to draw the drop zones
function drawDropZones(): void {
  for (const dz of dropZones) {
    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = "source-over";

    // Drop zone shadow
    ctx.shadowColor = "rgba(0,0,0,0.08)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;

    drawRoundedRect(ctx, dz.x, dz.y, dz.width, dz.height, appData.dropZoneCornerRadius);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.strokeStyle = "#C0C8D8";
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Draw the target intersection shapes (fixed, non-draggable guide graphics)
  drawAllTargetIntersections();

  // Draw drop zone labels for zones that have target intersections
  for (const dz of dropZones) {
    // Draw a small label at the top of each drop zone
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#8899AA";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const target = targetIntersections.find((t) => t.dropZoneIndex === dz.index);
    if (target) {
      const labels = [
        textData.targetLabel1 || "파랑□ + 노랑△",
        textData.targetLabel2 || "노랑△ + 빨강○",
        textData.targetLabel3 || "파랑□ + 빨강○",
      ];
      ctx.fillText(labels[dz.index], dz.x + dz.width / 2, dz.y + 8);
    }
    ctx.restore();
  }
}

// Function to draw palette area background
function drawPaletteArea(): void {
  ctx.save();
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = "source-over";
  const palY = appData.paletteY - appData.shapeSize * 0.8;
  const palH = appData.shapeSize * 1.8;

  // Shadow for palette area
  ctx.shadowColor = "rgba(0,0,0,0.06)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = -2;

  drawRoundedRect(ctx, 20, palY, appData.canvasWidth - 40, palH, 20);
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.strokeStyle = "rgba(192, 200, 216, 0.5)";
  ctx.lineWidth = 2;
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
    // Draw small label beneath
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#666";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(ps.label, ps.x, ps.y + ps.size / 2 + 8);
    ctx.restore();
  }
}

// Function to draw all cloned shapes with cellophane blend effect on each drop zone
function drawClonedShapes(): void {
  // Group shapes by drop zone
  for (const dz of dropZones) {
    const shapesInZone = clonedShapes.filter((s) => s.dropZoneIndex === dz.index);
    if (shapesInZone.length === 0) continue;

    // Create off-screen canvas for multiply blend using AppHelper
    const offCanvas = AppHelper.createUIElement("canvas", "", {}, "") as unknown as HTMLCanvasElement;
    offCanvas.width = appData.canvasWidth;
    offCanvas.height = appData.canvasHeight;
    const offCtx = offCanvas.getContext("2d");
    if (!offCtx) continue;

    // Clear the off-screen canvas to transparent
    offCtx.clearRect(0, 0, appData.canvasWidth, appData.canvasHeight);

    // Draw first layer normally
    offCtx.globalCompositeOperation = "source-over";
    drawShapeCellophane(
      offCtx,
      shapesInZone[0].type,
      shapesInZone[0].x,
      shapesInZone[0].y,
      shapesInZone[0].size,
      shapesInZone[0].color,
      shapesInZone[0].rotation,
    );

    // Draw subsequent layers with multiply
    for (let i = 1; i < shapesInZone.length; i++) {
      offCtx.globalCompositeOperation = "multiply";
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

    // Draw the off-screen canvas onto main canvas clipped to drop zone
    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = "source-over";
    drawRoundedRect(ctx, dz.x, dz.y, dz.width, dz.height, appData.dropZoneCornerRadius);
    ctx.clip();
    ctx.drawImage(offCanvas, 0, 0);
    ctx.restore();
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

  // Draw selection handles for selected shape
  if (selectedShape && currentState === AppState.PLAYING) {
    drawRotationHandle(ctx, selectedShape);
  }
}

// Function to draw the guide character with speech bubble
function drawGuideCharacter(): void {
  const charX = 60;
  const charY = appData.paletteY - appData.shapeSize * 0.8 - 40;

  // Draw character (emoji-based)
  ctx.save();
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = "source-over";
  ctx.font = "48px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🧑‍🏫", charX, charY);
  ctx.restore();

  // Draw speech bubble
  if (currentBubbleText) {
    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = "source-over";
    const bubbleX = charX + 45;
    const bubbleY = charY - 30;
    const padding = 16;

    // Measure text to size bubble
    ctx.font = "bold 13px sans-serif";
    const textWidth = ctx.measureText(currentBubbleText).width;
    const bubbleW = textWidth + padding * 2;
    const bubbleH = 36;

    // Shadow
    ctx.shadowColor = "rgba(0,0,0,0.1)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;

    drawRoundedRect(ctx, bubbleX, bubbleY, bubbleW, bubbleH, 12);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = "#D0D0D0";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Bubble tail
    ctx.beginPath();
    ctx.moveTo(bubbleX + 10, bubbleY + bubbleH);
    ctx.lineTo(bubbleX - 5, bubbleY + bubbleH + 10);
    ctx.lineTo(bubbleX + 25, bubbleY + bubbleH);
    ctx.closePath();
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.strokeStyle = "#D0D0D0";
    ctx.stroke();

    ctx.fillStyle = "#333";
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

  // Thematic background
  ctx.save();
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = "source-over";
  const gradient = ctx.createLinearGradient(0, 0, appData.canvasWidth, appData.canvasHeight);
  gradient.addColorStop(0, "#667eea");
  gradient.addColorStop(0.5, "#764ba2");
  gradient.addColorStop(1, "#f093fb");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, appData.canvasWidth, appData.canvasHeight);
  ctx.restore();

  // Decorative shapes in background
  ctx.save();
  const types = [ShapeType.RECTANGLE, ShapeType.TRIANGLE, ShapeType.CIRCLE];
  const colors = ["#4A90D9", "#F5D547", "#E74C3C"];
  for (let i = 0; i < 12; i++) {
    const sx = Math.sin(i * 2.1 + now * 0.001) * 300 + appData.canvasWidth / 2;
    const sy = Math.cos(i * 1.7 + now * 0.0008) * 200 + appData.canvasHeight / 2;
    const size = 40 + (i % 3) * 30;
    const rot = now * 0.001 * (i + 1) * 0.1;
    ctx.save();
    ctx.globalAlpha = 0.15;
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

  // Title text
  ctx.save();
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 36px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 10;
  ctx.fillText(textData.title, appData.canvasWidth / 2, appData.canvasHeight / 2 - 60);

  ctx.font = "24px sans-serif";
  ctx.fillText(textData.subtitle, appData.canvasWidth / 2, appData.canvasHeight / 2 - 10);

  // Pulsating start instruction
  const pulse = 0.6 + 0.4 * Math.sin(now * 0.003);
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
  ctx.fillStyle = "#333";
  ctx.font = "bold 28px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(textData.instructionTitle, appData.canvasWidth / 2, 80);

  const instructions = [textData.instruction1, textData.instruction2, textData.instruction3];
  const icons = ["👆", "🔄", "🎨"];
  for (let i = 0; i < instructions.length; i++) {
    const y = 160 + i * 80;

    // Icon background circle
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(74,144,217,0.1)";
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

    ctx.font = "18px sans-serif";
    ctx.fillStyle = "#444";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(instructions[i], appData.canvasWidth * 0.2, y);
    ctx.fillStyle = "#333";
  }

  // Draw example shapes on the right side
  drawShape(ctx, ShapeType.RECTANGLE, appData.canvasWidth * 0.75, 180, 50, "#4A90D9", 0, 0.7);
  drawShape(ctx, ShapeType.TRIANGLE, appData.canvasWidth * 0.82, 260, 50, "#F5D547", 0.3, 0.7);
  drawShape(ctx, ShapeType.CIRCLE, appData.canvasWidth * 0.78, 340, 50, "#E74C3C", 0, 0.7);

  // Pulsating start text
  const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.003);
  ctx.font = "18px sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(100,100,100," + pulse + ")";
  ctx.globalAlpha = 1.0;
  ctx.fillText(textData.instructionStart, appData.canvasWidth / 2, appData.canvasHeight - 60);
  ctx.restore();
}

// Function to draw the main playing screen
function drawPlayingScreen(): void {
  drawBackground();

  // Draw header area with subtle background
  ctx.save();
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  drawRoundedRect(ctx, 20, 8, appData.canvasWidth - 40, 60, 12);
  ctx.fill();
  ctx.restore();

  // Draw header text
  ctx.save();
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#2C3E50";
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(textData.title, appData.canvasWidth / 2, 15);

  ctx.fillStyle = "#666";
  ctx.font = "16px sans-serif";
  ctx.fillText(textData.mission, appData.canvasWidth / 2, 42);
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

  // Reset the entire canvas state
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

  // Ensure state is clean after drawing
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
  };
  clonedShapes.push(clone);
  return clone;
}

// Function to update drop zone assignment for a shape
function updateShapeDropZone(shape: ClonedShape): void {
  shape.dropZoneIndex = getDropZoneIndex(shape.x, shape.y);
}

// Function to snap shape to drop zone center if close enough
function snapToDropZone(shape: ClonedShape): void {
  if (shape.dropZoneIndex >= 0) {
    const dz = dropZones[shape.dropZoneIndex];
    const centerX = dz.x + dz.width / 2;
    const centerY = dz.y + dz.height / 2;
    const dx = centerX - shape.x;
    const dy = centerY - shape.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < appData.snapThreshold) {
      shape.x = centerX;
      shape.y = centerY;
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
  if (selectedShape && isPointOnRotationHandle(x, y, selectedShape)) {
    isRotating = true;
    rotationStartAngle = Math.atan2(y - selectedShape.y, x - selectedShape.x);
    shapeStartAngle = selectedShape.rotation;
    return;
  }

  // Check if clicking on a cloned shape
  const clickedClone = findClonedShapeAt(x, y);
  if (clickedClone) {
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
    return;
  }
}

// Handler for pointer up events on canvas
function handlePointerUp(e: PointerEvent): void {
  e.preventDefault();

  if (currentState !== AppState.PLAYING) return;

  if (isRotating) {
    isRotating = false;
    return;
  }

  if (draggingShape) {
    updateShapeDropZone(draggingShape);
    snapToDropZone(draggingShape);

    // If shape was dropped outside any zone and outside palette area, keep it
    // If dropped back on palette area, remove it
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

// Function to create the playing state UI elements
function createPlayingUI(): void {
  clearUI();

  // Check Answer button
  const btnCheck = AppHelper.createUIElement(
    "button",
    "btnCheckAnswer",
    {
      position: "absolute",
      right: "2%",
      bottom: "12%",
      width: "14%",
      height: "6%",
      backgroundColor: "#4A90D9",
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
      boxShadow: "0 4px 12px rgba(74,144,217,0.4)",
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

  // Reset button
  const btnReset = AppHelper.createUIElement(
    "button",
    "btnReset",
    {
      position: "absolute",
      right: "2%",
      bottom: "4%",
      width: "14%",
      height: "5.5%",
      backgroundColor: "#95A5A6",
      color: "#FFFFFF",
      border: "none",
      borderRadius: "10px",
      fontSize: "13px",
      fontWeight: "bold",
      cursor: "pointer",
      pointerEvents: "auto",
      boxSizing: "border-box",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "10",
    },
    textData.resetButton,
    [
      {
        event: "pointerdown",
        handler: (ev: Event) => {
          ev.stopPropagation();
          handleReset();
        },
      },
    ],
  );
  uiLayer.appendChild(btnReset);
  uiElements.push(btnReset);
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

// Function to play the demonstration animation
function playDemoAnimation(): void {
  // Clear existing clones
  clonedShapes = [];
  selectedShape = null;

  const puzzle = appData.puzzles[currentPuzzleIndex];
  if (!puzzle) {
    currentState = AppState.PLAYING;
    return;
  }

  // Choose a target drop zone (first one)
  const targetDZ = dropZones[0];
  const centerX = targetDZ.x + targetDZ.width / 2;
  const centerY = targetDZ.y + targetDZ.height / 2;

  // Create shapes from puzzle definition
  const animShapes: ClonedShape[] = [];
  for (const ts of puzzle.targetShapes) {
    const shapeType = ts.type as ShapeType;
    let palette: PaletteShape | undefined;
    for (const ps of paletteShapes) {
      if (ps.type === shapeType) {
        palette = ps;
        break;
      }
    }
    if (!palette) continue;

    const clone: ClonedShape = {
      id: nextCloneId++,
      type: shapeType,
      color: palette.color,
      rgbColor: [...palette.rgbColor],
      x: palette.x,
      y: palette.y,
      rotation: 0,
      scale: 1,
      size: palette.size,
      selected: false,
      dropZoneIndex: -1,
    };
    clonedShapes.push(clone);
    animShapes.push(clone);
  }

  // Animate shapes moving to target positions
  const tl = gsap.timeline({
    onComplete: () => {
      for (const s of animShapes) {
        updateShapeDropZone(s);
      }
      setBubbleText(textData.correctBubble);
      currentState = AppState.RESULT;

      // Go back to playing state after delay
      setTimeout(() => {
        currentState = AppState.PLAYING;
        setBubbleText(textData.defaultBubble);
      }, 3000);
    },
  });

  for (let i = 0; i < animShapes.length; i++) {
    const ts = puzzle.targetShapes[i];
    const finalX = centerX + ts.x;
    const finalY = centerY + ts.y;
    const finalRotation = (ts.rotation * Math.PI) / 180;

    tl.to(
      animShapes[i],
      {
        x: finalX,
        y: finalY,
        rotation: finalRotation,
        duration: 1.2,
        ease: "power2.inOut",
      },
      i * 0.3,
    );
  }
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
