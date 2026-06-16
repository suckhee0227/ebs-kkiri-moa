// import section

// Import AppHelper for utility functions and data loading
import { AppHelper } from "./appHelper";
// Import gsap for tween animations
import gsap from "gsap";
// Import canvas-confetti for celebration effects
import confetti from "canvas-confetti";

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
  nearHintThreshold: number;
  nearHintAngleThreshold: number;
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
  gameOverTitle: string;
  gameOverMessage: string;
  gameOverRestart: string;
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
  nearHint: boolean;
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
  GAMEOVER = "gameover",
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

// Neon hint glow animation time tracker
let hintGlowTime = 0;

// Game over animation alpha for fade in
let gameOverAlpha = 0;

// Function to check angle match with symmetry awareness - strict ±10 degree tolerance
function isAngleMatchWithSymmetry(
  shapeType: ShapeType,
  currentRotation: number,
  targetRotation: number,
  thresholdDeg: number,
): boolean {
  if (shapeType === ShapeType.CIRCLE) {
    return true;
  }

  // Convert both angles from radians to degrees
  const currentDeg = (currentRotation * 180) / Math.PI;
  const targetDeg = (targetRotation * 180) / Math.PI;

  // [FIX 1] Compute the absolute difference between current angle and target angle FIRST
  const diff = Math.abs(currentDeg - targetDeg);

  if (shapeType === ShapeType.RECTANGLE) {
    // Blue square: 90-degree rotational symmetry
    // Compute remainder of diff divided by 90
    const mod = diff % 90;
    // Match if mod is within ±thresholdDeg of a multiple of 90
    // i.e., mod <= thresholdDeg (close to 0) OR mod >= (90 - thresholdDeg) (close to 90)
    if (mod <= thresholdDeg || mod >= 90 - thresholdDeg) {
      return true;
    }
    return false;
  }

  if (shapeType === ShapeType.TRIANGLE) {
    // Yellow equilateral triangle: 120-degree rotational symmetry
    // Compute remainder of diff divided by 120
    const mod = diff % 120;
    // Match if mod is within ±thresholdDeg of a multiple of 120
    // i.e., mod <= thresholdDeg (close to 0) OR mod >= (120 - thresholdDeg) (close to 120)
    if (mod <= thresholdDeg || mod >= 120 - thresholdDeg) {
      return true;
    }
    return false;
  }

  // Fallback for other shapes: direct angle comparison in radians
  const thresholdRad = (thresholdDeg * Math.PI) / 180;
  const diffRad = Math.abs(normalizeAngle(currentRotation - targetRotation));
  return diffRad <= thresholdRad;
}

// Function to draw the blended intersection area between two cloned shapes inside a drop zone
function drawShapeIntersectionBlend(shapeA: ClonedShape, shapeB: ClonedShape, dz: DropZone): void {
  const blendedColor = blendColors(shapeA.color, shapeB.color);

  ctx.save();
  ctx.globalAlpha = 1.0;
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

// Function to blend two shape colors to produce the intersection mixed color
function blendColors(color1: string, color2: string): string {
  const colorMixMap: { [key: string]: string } = {
    "#5B8DEF+#FFD966": "rgba(76, 175, 80, 0.85)",
    "#FFD966+#5B8DEF": "rgba(76, 175, 80, 0.85)",
    "#FFD966+#FF6B6B": "rgba(255, 152, 50, 0.85)",
    "#FF6B6B+#FFD966": "rgba(255, 152, 50, 0.85)",
    "#5B8DEF+#FF6B6B": "rgba(142, 68, 199, 0.85)",
    "#FF6B6B+#5B8DEF": "rgba(142, 68, 199, 0.85)",
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

// Function to check if all drop zones have the correct shapes snapped with correct positions AND angles
function checkAllAnswers(): boolean {
  const answerMap = appData.answerMap;
  if (!answerMap || answerMap.length === 0) return false;

  for (const entry of answerMap) {
    const dzIndex = entry.dropZoneIndex;
    const dz = dropZones[dzIndex];
    if (!dz) return false;
    const centerX = dz.x + dz.width / 2;
    const centerY = dz.y + dz.height / 2;

    for (let i = 0; i < entry.shapes.length; i++) {
      const expectedType = entry.shapes[i].type as ShapeType;
      const expectedColor = entry.shapes[i].color.toUpperCase();
      const offset = entry.targetOffsets[i];
      const targetX = centerX + offset.x;
      const targetY = centerY + offset.y;
      const targetRotation = (offset.rotation * Math.PI) / 180;

      const matchingShape = clonedShapes.find((s) => {
        if (s.dropZoneIndex !== dzIndex) return false;
        if (s.type !== expectedType) return false;
        if (s.color.toUpperCase() !== expectedColor) return false;
        if (!s.snapped) return false;

        const dx = Math.abs(s.x - targetX);
        const dy = Math.abs(s.y - targetY);
        const dist = Math.sqrt(dx * dx + dy * dy);
        const posThreshold = appData.snapThreshold * 1.5;

        // Position check
        if (dist >= posThreshold) return false;

        // Strict angle check - MUST pass both position AND angle (AND condition)
        const angleMatch = isAngleMatchWithSymmetry(s.type, s.rotation, targetRotation, appData.snapAngleThreshold);
        if (!angleMatch) return false;

        return true;
      });

      if (!matchingShape) return false;
    }
  }

  return true;
}

// Function to build a shape path on the canvas context without filling/stroking
function buildShapePath(
  targetCtx: CanvasRenderingContext2D,
  type: ShapeType,
  cx: number,
  cy: number,
  size: number,
  rotation: number,
): void {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  switch (type) {
    case ShapeType.RECTANGLE: {
      const half = size / 2;
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
      // Equilateral triangle: all sides equal, all angles 60 degrees
      // For an equilateral triangle inscribed, we use the circumradius
      const sideLength = size;
      const circumR = sideLength / Math.sqrt(3);
      // Vertices at 0, 120, 240 degrees offset by -90 to point up
      const verts: number[][] = [];
      for (let i = 0; i < 3; i++) {
        const angle = (i * 2 * Math.PI) / 3 - Math.PI / 2;
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
    case ShapeType.CIRCLE: {
      const half = size / 2;
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

// Function to initialize the target intersection shapes for each drop zone using clip() masking
function initTargetIntersections(): void {
  targetIntersections = [];

  const colorMixMap: { [key: string]: string } = {
    "#5B8DEF+#FFD966": "rgba(76, 175, 80, 0.78)",
    "#FFD966+#5B8DEF": "rgba(76, 175, 80, 0.78)",
    "#FFD966+#FF6B6B": "rgba(255, 152, 50, 0.78)",
    "#FF6B6B+#FFD966": "rgba(255, 152, 50, 0.78)",
    "#5B8DEF+#FF6B6B": "rgba(142, 68, 199, 0.78)",
    "#FF6B6B+#5B8DEF": "rgba(142, 68, 199, 0.78)",
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
      opacity: 1.0,
      shapes: [
        {
          type: entry.shapes[0].type as ShapeType,
          offsetX: offset0.x,
          offsetY: offset0.y,
          rotation: (offset0.rotation * Math.PI) / 180,
          size: shapeSize,
        },
        {
          type: entry.shapes[1].type as ShapeType,
          offsetX: offset1.x,
          offsetY: offset1.y,
          rotation: (offset1.rotation * Math.PI) / 180,
          size: shapeSize,
        },
      ],
    });
  }
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

  targetCtx.shadowColor = "rgba(0,0,0,0.15)";
  targetCtx.shadowBlur = 6;
  targetCtx.shadowOffsetY = 3;

  switch (type) {
    case ShapeType.RECTANGLE:
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
    case ShapeType.TRIANGLE: {
      // Equilateral triangle rendering
      const sideLength = size;
      const circumR = sideLength / Math.sqrt(3);
      targetCtx.fillStyle = color;
      targetCtx.beginPath();
      for (let i = 0; i < 3; i++) {
        const angle = (i * 2 * Math.PI) / 3 - Math.PI / 2;
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
    case ShapeType.CIRCLE:
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

// Function to draw a shape with neon hint glow effect
function drawShapeWithHintGlow(
  targetCtx: CanvasRenderingContext2D,
  type: ShapeType,
  x: number,
  y: number,
  size: number,
  color: string,
  rotation: number,
  alpha: number,
): void {
  // Draw neon glow underneath
  const glowIntensity = 0.5 + 0.5 * Math.sin(hintGlowTime * 4);
  const glowColor = `rgba(180, 255, 50, ${0.4 + glowIntensity * 0.4})`;

  targetCtx.save();
  targetCtx.globalCompositeOperation = "source-over";
  targetCtx.translate(x, y);
  targetCtx.rotate(rotation);
  targetCtx.globalAlpha = alpha;

  // Outer neon glow
  targetCtx.shadowColor = glowColor;
  targetCtx.shadowBlur = 18 + glowIntensity * 10;
  targetCtx.strokeStyle = `rgba(180, 255, 50, ${0.6 + glowIntensity * 0.4})`;
  targetCtx.lineWidth = 4;

  switch (type) {
    case ShapeType.RECTANGLE:
      targetCtx.strokeRect(-size / 2, -size / 2, size, size);
      break;
    case ShapeType.TRIANGLE: {
      const sideLength = size;
      const circumR = sideLength / Math.sqrt(3);
      targetCtx.beginPath();
      for (let i = 0; i < 3; i++) {
        const angle = (i * 2 * Math.PI) / 3 - Math.PI / 2;
        const vx = circumR * Math.cos(angle);
        const vy = circumR * Math.sin(angle);
        if (i === 0) targetCtx.moveTo(vx, vy);
        else targetCtx.lineTo(vx, vy);
      }
      targetCtx.closePath();
      targetCtx.stroke();
      break;
    }
    case ShapeType.CIRCLE:
      targetCtx.beginPath();
      targetCtx.arc(0, 0, size / 2, 0, Math.PI * 2);
      targetCtx.closePath();
      targetCtx.stroke();
      break;
  }

  targetCtx.restore();

  // Draw the shape itself on top
  drawShape(targetCtx, type, x, y, size, color, rotation, alpha);
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
      // Equilateral triangle hit test
      const sideLength = shape.size;
      const circumR = sideLength / Math.sqrt(3);
      const verts: number[][] = [];
      for (let i = 0; i < 3; i++) {
        const angle = (i * 2 * Math.PI) / 3 - Math.PI / 2;
        verts.push([circumR * Math.cos(angle), circumR * Math.sin(angle)]);
      }
      const x0 = verts[0][0],
        y0 = verts[0][1];
      const x1 = verts[1][0],
        y1 = verts[1][1];
      const x2 = verts[2][0],
        y2 = verts[2][1];
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
  return dx * dx + dy * dy <= (appData.rotationHandleRadius + 6) * (appData.rotationHandleRadius + 6);
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
    case ShapeType.RECTANGLE:
      targetCtx.strokeRect(-half, -half, half * 2, half * 2);
      break;
    case ShapeType.TRIANGLE: {
      const sideLength = shape.size;
      const circumR = sideLength / Math.sqrt(3) + 5;
      targetCtx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = (i * 2 * Math.PI) / 3 - Math.PI / 2;
        const vx = circumR * Math.cos(a);
        const vy = circumR * Math.sin(a);
        if (i === 0) targetCtx.moveTo(vx, vy);
        else targetCtx.lineTo(vx, vy);
      }
      targetCtx.closePath();
      targetCtx.stroke();
      break;
    }
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

// Function to draw palette area background
function drawPaletteArea(): void {
  ctx.save();
  ctx.globalAlpha = 1.0;
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

// Function to check near-hint proximity for a shape (visual hint only, no snapping or movement) - differentiates position-only vs position+angle
function checkNearHint(shape: ClonedShape): boolean {
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
    const expectedType = entry.shapes[i].type as ShapeType;
    if (shape.type !== expectedType) continue;

    const expectedColor = entry.shapes[i].color.toUpperCase();
    if (shape.color.toUpperCase() !== expectedColor) continue;

    const offset = entry.targetOffsets[i];
    const targetX = centerX + offset.x;
    const targetY = centerY + offset.y;

    const dx = targetX - shape.x;
    const dy = targetY - shape.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Near hint shows when position is close - serves as a visual cue
    // This is purely visual - never triggers snapping or position/angle changes
    if (dist < nearThreshold) {
      return true;
    }
  }

  return false;
}

// Function to draw all cloned shapes with independent colors (no blending)
function drawClonedShapes(): void {
  const shapesByDropZone: Map<number, ClonedShape[]> = new Map();

  for (const s of clonedShapes) {
    if (s.dropZoneIndex >= 0) {
      if (!shapesByDropZone.has(s.dropZoneIndex)) {
        shapesByDropZone.set(s.dropZoneIndex, []);
      }
      shapesByDropZone.get(s.dropZoneIndex)!.push(s);
    }
  }

  // Separate shapes into non-dragging and dragging lists
  const nonDraggingShapes: ClonedShape[] = [];
  const draggingShapesList: ClonedShape[] = [];

  for (let i = 0; i < clonedShapes.length; i++) {
    const s = clonedShapes[i];
    if (s === draggingShape) {
      draggingShapesList.push(s);
    } else {
      nonDraggingShapes.push(s);
    }
  }

  // Draw non-dragging shapes first (below guide images)
  for (const s of nonDraggingShapes) {
    const isInDropZone = s.dropZoneIndex >= 0;
    const useHintGlow = s.nearHint && s === selectedShape;

    if (isInDropZone) {
      const dz = dropZones[s.dropZoneIndex];
      if (!dz) continue;
      ctx.save();
      ctx.globalAlpha = 1.0;
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

  // Draw intersection blends for non-dragging shapes in same drop zone
  shapesByDropZone.forEach((shapes, dzIndex) => {
    // Filter out dragging shape for intersection calculation
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

  // Re-draw the target intersection guides ABOVE non-dragging shapes but BELOW dragging shape
  // This ensures the guide image is visible when a shape is being dragged over it
  if (draggingShapesList.length > 0) {
    drawAllTargetIntersections();
  }

  // Draw dragging shapes on top (highest layer) with slight transparency so guide shows through
  for (const s of draggingShapesList) {
    const isInDropZone = s.dropZoneIndex >= 0;
    const useHintGlow = s.nearHint && (s === draggingShape || s === selectedShape);
    const dragAlpha = 0.7; // Make dragging shape semi-transparent so guide is visible underneath

    if (isInDropZone) {
      const dz = dropZones[s.dropZoneIndex];
      if (!dz) continue;
      ctx.save();
      ctx.globalAlpha = 1.0;
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

    // Draw intersection blend between dragging shape and other shapes in same zone
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

  if (selectedShape && currentState === AppState.PLAYING && !selectedShape.snapped) {
    drawRotationHandle(ctx, selectedShape);
  }
}

// Function to draw the guide character with speech bubble
function drawGuideCharacter(): void {
  const charX = 60;
  const charY = appData.paletteY - appData.shapeSize * 0.8 - 45;

  ctx.save();
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = "source-over";
  ctx.font = "44px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🕵️", charX, charY);
  ctx.restore();

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

// Function to draw the title screen
function drawTitleScreen(): void {
  const now = Date.now();

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

  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.globalCompositeOperation = "source-over";
  for (let row = 0; row < appData.canvasHeight; row += 6) {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, row, appData.canvasWidth, 1);
  }
  ctx.restore();

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

// Function to try snapping a shape to a target position within a drop zone (only on mouseup) - requires BOTH position AND angle match
function trySnapToTarget(shape: ClonedShape): boolean {
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
    const expectedType = entry.shapes[i].type as ShapeType;
    if (shape.type !== expectedType) continue;

    const expectedColor = entry.shapes[i].color.toUpperCase();
    if (shape.color.toUpperCase() !== expectedColor) continue;

    const offset = entry.targetOffsets[i];
    const targetX = centerX + offset.x;
    const targetY = centerY + offset.y;
    const targetRotation = (offset.rotation * Math.PI) / 180;

    const dx = targetX - shape.x;
    const dy = targetY - shape.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const alreadySnapped = clonedShapes.some(
      (s) =>
        s !== shape &&
        s.snapped &&
        s.dropZoneIndex === dzIndex &&
        s.type === expectedType &&
        s.color.toUpperCase() === expectedColor,
    );
    if (alreadySnapped) continue;

    // Check position proximity first
    const positionClose = dist < appData.snapThreshold;

    if (positionClose) {
      // Strict angle check with ±10 degree tolerance (using snapAngleThreshold from data)
      const angleMatch = isAngleMatchWithSymmetry(
        shape.type,
        shape.rotation,
        targetRotation,
        appData.snapAngleThreshold,
      );

      if (positionClose && angleMatch && dist < bestDist) {
        // BOTH position AND angle are correct - eligible for snap
        bestDist = dist;
        bestIndex = i;
        bestTargetX = targetX;
        bestTargetY = targetY;
        bestPositionCloseButAngleWrong = false;
      } else if (!angleMatch) {
        // Position is close but angle is WRONG - NO snap, only visual hint
        bestPositionCloseButAngleWrong = true;
      }
    }
  }

  // Only snap if BOTH position AND angle conditions are met (AND logic)
  if (bestIndex >= 0) {
    // Snap animation - ONLY moves position (x, y). Angle is NEVER auto-corrected.
    gsap.to(shape, {
      x: bestTargetX,
      y: bestTargetY,
      duration: 0.18,
      ease: "power2.out",
      onComplete: () => {
        showSnapCheckAnimation(bestTargetX, bestTargetY);
      },
    });
    shape.snapped = true;
    shape.nearHint = false;

    setTimeout(() => {
      checkAutoComplete();
    }, 250);

    return true;
  }

  // If position is close but angle is wrong: show near hint glow ONLY (no snap, no correct)
  if (bestPositionCloseButAngleWrong) {
    shape.nearHint = true;
    shape.snapped = false;
  }

  return false;
}

// Function to show a small check mark animation at snap position
function showSnapCheckAnimation(x: number, y: number): void {
  const checkEl = AppHelper.createUIElement(
    "div",
    "",
    {
      position: "absolute",
      left: (x / appData.canvasWidth) * 100 + "%",
      top: (y / appData.canvasHeight) * 100 + "%",
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
      boxSizing: "border-box",
    },
    "✅",
    [],
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

// Function to auto-check if all answers are complete
function checkAutoComplete(): void {
  if (currentState !== AppState.PLAYING) return;

  // Check if every drop zone has all required shapes snapped
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

// Function to handle correct answer with celebration
function handleCorrectAnswer(): void {
  currentState = AppState.RESULT;
  selectedShape = null;
  setBubbleText(textData.correctBubble);

  // Confetti celebration
  try {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#5B8DEF", "#FFD966", "#FF6B6B", "#76C893", "#A78BFA"],
    });
  } catch (_e) {
    // Confetti may fail silently
  }

  for (const s of clonedShapes) {
    if (s.snapped) {
      gsap.to(s, {
        scale: 1.12,
        duration: 0.25,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut",
      });
    }
  }

  // Transition to game over screen after celebration
  setTimeout(() => {
    showGameOverScreen();
  }, 2500);
}

// Function to show game over screen with UI overlay
function showGameOverScreen(): void {
  currentState = AppState.GAMEOVER;
  gameOverAlpha = 0;
  clearUI();

  // Create game over UI elements
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
      transition: "opacity 0.6s ease-in",
    },
    "",
    [],
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
      pointerEvents: "auto",
    },
    "",
    [],
  );

  const emoji = AppHelper.createUIElement(
    "div",
    "gameOverEmoji",
    {
      fontSize: "56px",
      lineHeight: "1.2",
      boxSizing: "border-box",
      pointerEvents: "none",
    },
    "🎉",
    [],
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
      pointerEvents: "none",
    },
    textData.gameOverTitle,
    [],
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
      pointerEvents: "none",
    },
    textData.gameOverMessage,
    [],
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
      marginTop: "8px",
    },
    textData.gameOverRestart,
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

  card.appendChild(emoji);
  card.appendChild(titleEl);
  card.appendChild(msgEl);
  card.appendChild(restartBtn);
  overlay.appendChild(card);
  uiLayer.appendChild(overlay);
  uiElements.push(overlay);

  // Fade in
  setTimeout(() => {
    overlay.style.opacity = "1";
  }, 50);
}

// Function to draw the game over screen overlay on canvas
function drawGameOverOverlay(): void {
  // Semi-transparent dark overlay
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, appData.canvasWidth, appData.canvasHeight);
  ctx.restore();

  // Animated particles/sparkles
  const now = Date.now();
  ctx.save();
  for (let i = 0; i < 20; i++) {
    const px = (Math.sin(i * 3.7 + now * 0.001) * 0.5 + 0.5) * appData.canvasWidth;
    const py = (Math.cos(i * 2.3 + now * 0.0012) * 0.5 + 0.5) * appData.canvasHeight;
    const sparkleSize = 2 + Math.sin(now * 0.005 + i) * 2;
    ctx.globalAlpha = 0.3 + 0.3 * Math.sin(now * 0.003 + i * 1.5);
    ctx.fillStyle = i % 3 === 0 ? "#FFD966" : i % 3 === 1 ? "#5B8DEF" : "#FF6B6B";
    ctx.beginPath();
    ctx.arc(px, py, sparkleSize, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Function to draw the main playing screen
function drawPlayingScreen(): void {
  drawBackground();

  // Draw header area - LEFT ALIGNED
  ctx.save();
  ctx.globalAlpha = 1.0;
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

  // Draw mission box (blue capsule) LEFT ALIGNED
  ctx.save();
  ctx.globalAlpha = 1.0;
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

  // Draw drop zones with guide images first
  drawDropZones();
  drawPaletteArea();
  drawPaletteShapes();

  // Draw cloned shapes (with dragging shape rendered on top, semi-transparent)
  // Guide images are re-drawn inside drawClonedShapes when dragging, so they appear above static shapes but below the dragged shape
  drawClonedShapes();
  drawGuideCharacter();

  // Draw game over overlay if in GAMEOVER state
  if (currentState === AppState.GAMEOVER) {
    drawGameOverOverlay();
  }
}

// Main render loop function
function render(): void {
  if (!ctx || !appData) return;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, appData.canvasWidth, appData.canvasHeight);

  // Update hint glow time
  hintGlowTime += 0.016;

  // Update near hint status for dragging/selected shapes (visual only - no position/rotation changes)
  for (const s of clonedShapes) {
    if (s === draggingShape || (s === selectedShape && isRotating)) {
      // [FIX 2] nearHint only controls visual glow - never triggers snapping or movement
      s.nearHint = checkNearHint(s);
    } else if (!s.snapped) {
      s.nearHint = false;
    }
  }

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
    case AppState.GAMEOVER:
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
    nearHint: false,
  };
  clonedShapes.push(clone);
  return clone;
}

// Function to update drop zone assignment for a shape
function updateShapeDropZone(shape: ClonedShape): void {
  shape.dropZoneIndex = getDropZoneIndex(shape.x, shape.y);
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
    appCanvas.style.cursor = "grabbing";
    return;
  }

  // Check if clicking on a cloned shape
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
    // Only the rotation handle updates the angle - this is the ONLY place angle changes
    const angle = Math.atan2(y - selectedShape.y, x - selectedShape.x);
    const deltaAngle = angle - rotationStartAngle;
    const newRotation = shapeStartAngle + deltaAngle;
    selectedShape.rotation = newRotation;
    return;
  }

  if (draggingShape) {
    // Only update position during drag - NEVER change angle
    draggingShape.x = x - dragOffsetX;
    draggingShape.y = y - dragOffsetY;
    updateShapeDropZone(draggingShape);
    // nearHint is used purely for visual glow effect in the render loop
    return;
  }
}

// Handler for pointer up events on canvas
function handlePointerUp(e: PointerEvent): void {
  e.preventDefault();

  if (currentState !== AppState.PLAYING) return;

  if (isRotating) {
    isRotating = false;
    appCanvas.style.cursor = "default";
    // On rotation end, try snap only if position AND angle both match
    if (selectedShape && selectedShape.dropZoneIndex >= 0) {
      trySnapToTarget(selectedShape);
    }
    return;
  }

  if (draggingShape) {
    updateShapeDropZone(draggingShape);

    if (draggingShape.y > appData.paletteY - appData.shapeSize * 0.5 && draggingShape.dropZoneIndex === -1) {
      // Dropping back on palette area - remove shape
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
          },
        });
      }
    } else if (draggingShape.dropZoneIndex >= 0) {
      // Snap judgment ONLY happens here at mouseup - checks both position AND angle
      trySnapToTarget(draggingShape);
    }

    draggingShape.nearHint = false;
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

  // Check Answer button - blue (only button)
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
        },
      });
    }

    setTimeout(() => {
      setBubbleText(textData.defaultBubble);
    }, 2000);
  }
}

// Function to handle reset
function handleReset(): void {
  clonedShapes = [];
  selectedShape = null;
  draggingShape = null;
  isRotating = false;
  isDraggingFromPalette = false;
  gameOverAlpha = 0;
  currentState = AppState.PLAYING;
  setBubbleText(textData.defaultBubble);
  clearUI();
  createPlayingUI();
}

// Function to initialize the application
async function initApp(): Promise<void> {
  appData = await AppHelper.loadAppData<IAppData>();
  textData = await AppHelper.loadTextData<ITextData>();
  assetListData = await AppHelper.loadAssetList<IAssetList>();

  appCanvas = document.getElementById("appCanvas") as HTMLCanvasElement;
  uiLayer = document.getElementById("uiLayer") as HTMLElement;
  ctx = appCanvas.getContext("2d")!;

  appCanvas.width = appData.canvasWidth;
  appCanvas.height = appData.canvasHeight;

  initDropZones();
  initPaletteShapes();
  initTargetIntersections();

  currentState = AppState.TITLE;
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

  render();
}

// export section

// Export the initApp function as entry point
export { initApp };
