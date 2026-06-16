// import section

// Import AppHelper for utility functions and data loading
import { AppHelper } from "./appHelper";
// Import gsap for tween animations
import gsap from "gsap";
// Import canvas-confetti for celebration effects
import confetti from "canvas-confetti";

// declaration section

// Shape kinds an object can have (stage 1: 세모/네모/동그라미/별)
type ShapeKind = "circle" | "triangle" | "square" | "star";

// Interface for a single object definition from data.json
interface IObjectDef {
  id: number;
  shape: ShapeKind;
  color: string; // color key: "red" | "yellow" | "green" | "blue"
}

// Interface for a column (vertical lane) definition within a stage
interface IColumnDef {
  key: string; // value to match against the active criterion
  label: string;
  icon: string; // "circle"|"triangle"|"square"|"heart"|"swatch"|"star"|"flower"|"drop"
  hint?: string; // optional sub-label (e.g. "큰 선물" on the size stage)
}

// Size criterion: a present definition for stage 3 (size-based sorting)
interface IGiftDef {
  id: number;
  size: string; // size key: "large" | "medium" | "small"
  color: string;
}

// Interface for a single sorting stage
interface IStageDef {
  criterion: "shape" | "color" | "size";
  criterionLabel: string;
  instruction: string;
  columns: IColumnDef[];
}

// Interface for application configuration data
interface IAppData {
  canvasWidth: number;
  canvasHeight: number;
  headerHeight: number;
  columnAreaY: number;
  columnAreaHeight: number;
  columnGap: number;
  columnSideMargin: number;
  guideGutter: number;
  poolY: number;
  poolHeight: number;
  objectRadius: number;
  colors: Record<string, string>;
  sizes: Record<string, number>; // size key -> radius scale factor (stage 3)
  objects: IObjectDef[];
  gifts: IGiftDef[]; // present set for the size stage
  stages: IStageDef[];
}

// Interface for text data used in the UI
interface ITextData {
  appTitle: string;
  codeBadge: string;
  titleScreen: string;
  titleSubtitle: string;
  titleInstruction: string;
  howtoTitle: string;
  howto1: string;
  howto2: string;
  howto3: string;
  howtoStart: string;
  startButton: string;
  stagePrefix: string;
  defaultBubble: string;
  correctBubble: string;
  wrongBubble: string;
  stageClearBubble: string;
  stageClearTitle: string;
  gameOverTitle: string;
  gameOverMessage: string;
  gameOverRestart: string;
}

// Interface for the asset list containing images and sounds
interface IAssetList {
  images: { id: string; file_path: string; description: string }[];
  sounds: {
    id: string;
    file_path: string;
    volume: number;
    isBackgroundMusic: boolean;
  }[];
}

// Runtime state for a freely draggable object. Stages 1 & 2 use uniform "shape"
// tiles; stage 3 uses "gift" boxes whose radius varies by size. There are no
// fixed slots — objects rest wherever they are dropped and the child groups
// same-attribute objects together by hand.
interface GameObject {
  id: number;
  kind: "shape" | "gift";
  shape: ShapeKind;
  colorKey: string;
  sizeKey: string; // size key for the gift stage ("" for shape tiles)
  radius: number;
  x: number;
  y: number;
  scale: number; // animated scale multiplier
  dragging: boolean;
}

// Enum for app states
enum AppState {
  TITLE = "title",
  HOWTO = "howto",
  PLAYING = "playing",
  STAGECLEAR = "stageclear",
  GAMEOVER = "gameover",
}

// module-level state

let appData: IAppData;
let textData: ITextData;
let assetListData: IAssetList;

let appCanvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let uiLayer: HTMLElement;

let currentState: AppState = AppState.TITLE;
let stageIndex = 0;

let gameObjects: GameObject[] = [];
let solved = false; // becomes true once the current stage is correctly grouped

let draggingObj: GameObject | null = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let dragOriginX = 0; // grid cell the dragged object came from (for swap-back)
let dragOriginY = 0;
let groupsBeforeDrag = 0; // complete-group count captured at drag start

let currentBubbleText = "";
let animFrameId = 0;
let bgPulse = 0;
let titlePulse = 0;

const uiElements: HTMLElement[] = [];

// images
let characterImg: HTMLImageElement | null = null;
let bubbleImg: HTMLImageElement | null = null;
let backgroundImg: HTMLImageElement | null = null;

// sounds (howler instances)
let soundsInitialized = false;
let pickupSound: any = null;
let placeSound: any = null;
let correctSound: any = null;
let bgMusic: any = null;
let bgStarted = false;

// ---------------------------------------------------------------------------
// data / setup helpers
// ---------------------------------------------------------------------------

// Resolve the hex color for an object's color key
function colorHex(key: string): string {
  return appData.colors[key] || "#888888";
}

// Return the attribute value of an object for the active stage criterion
function attrFor(obj: GameObject, criterion: IStageDef["criterion"]): string {
  if (criterion === "shape") return obj.shape;
  if (criterion === "size") return obj.sizeKey;
  return obj.colorKey;
}

// Convert a #rrggbb hex string to an [r,g,b] array
function hexToRgb(hex: string): number[] {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h.split("").map((c) => c + c).join("")
      : h;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// Lighten a hex color toward white (amount 0..1)
function lighten(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  const r = Math.round(rgb[0] + (255 - rgb[0]) * amount);
  const g = Math.round(rgb[1] + (255 - rgb[1]) * amount);
  const b = Math.round(rgb[2] + (255 - rgb[2]) * amount);
  return `rgb(${r}, ${g}, ${b})`;
}

// Darken a hex color toward black (amount 0..1)
function darken(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  const r = Math.round(rgb[0] * (1 - amount));
  const g = Math.round(rgb[1] * (1 - amount));
  const b = Math.round(rgb[2] * (1 - amount));
  return `rgb(${r}, ${g}, ${b})`;
}

// The play rectangle the snap grid sits in: below the header, left of the guide.
function playArea(): { x0: number; y0: number; x1: number; y1: number } {
  return {
    x0: 56,
    y0: appData.headerHeight + 50,
    x1: appData.canvasWidth - appData.guideGutter - 6,
    y1: appData.canvasHeight - 56,
  };
}

// One snap-grid cell is sized to comfortably hold the largest object.
function gridCell(): number {
  return appData.objectRadius * 2 + 16;
}

// Grid geometry: a block of cols x rows cells centered in the play area.
function gridInfo(): { cell: number; cols: number; rows: number; gx: number; gy: number } {
  const a = playArea();
  const cell = gridCell();
  const cols = Math.max(1, Math.floor((a.x1 - a.x0) / cell));
  const rows = Math.max(1, Math.floor((a.y1 - a.y0) / cell));
  const gx = a.x0 + ((a.x1 - a.x0) - cols * cell) / 2 + cell / 2;
  const gy = a.y0 + ((a.y1 - a.y0) - rows * cell) / 2 + cell / 2;
  return { cell, cols, rows, gx, gy };
}

// Center coordinate of a grid cell.
function cellCenter(col: number, row: number): { x: number; y: number } {
  const g = gridInfo();
  return { x: g.gx + col * g.cell, y: g.gy + row * g.cell };
}

// Nearest grid cell (clamped into range) to an arbitrary point.
function nearestCell(x: number, y: number): { x: number; y: number } {
  const g = gridInfo();
  const col = clamp(Math.round((x - g.gx) / g.cell), 0, g.cols - 1);
  const row = clamp(Math.round((y - g.gy) / g.cell), 0, g.rows - 1);
  return cellCenter(col, row);
}

// Place the current stage's objects in random (but grid-aligned) cells. They are
// neatly lined up in rows; same-attribute objects are NOT pre-grouped.
function initObjects(): void {
  const isSize = appData.stages[stageIndex].criterion === "size";

  // Build the per-stage object set: shape tiles (stages 1 & 2) or gift boxes (stage 3).
  const specs = isSize
    ? appData.gifts.map((g) => ({
        id: g.id,
        kind: "gift" as const,
        shape: "square" as ShapeKind, // unused for gifts
        colorKey: g.color,
        sizeKey: g.size,
        radius: appData.objectRadius * (appData.sizes[g.size] ?? 1),
      }))
    : appData.objects.map((o) => ({
        id: o.id,
        kind: "shape" as const,
        shape: o.shape,
        colorKey: o.color,
        sizeKey: "",
        radius: appData.objectRadius,
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
      dragging: false,
    };
  });

  solved = false;
  gameObjects.forEach((o, i) => {
    gsap.to(o, { scale: 1, duration: 0.4, delay: 0.03 * i, ease: "back.out(2)" });
  });
}

// Return an array [0..n-1] in random order
function shuffledIndices(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Two snapped objects are in the same cluster when they sit in neighbouring grid
// cells (orthogonal or diagonal). Using the cell size keeps this independent of
// object radius, so small gifts cluster just like large ones.
function linked(a: GameObject, b: GameObject): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y) < gridCell() * 1.5;
}

// Single-linkage clustering of the current objects by proximity (union-find).
function clusterObjects(): GameObject[][] {
  const n = gameObjects.length;
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; }
    return i;
  };
  const union = (a: number, b: number) => { parent[find(a)] = find(b); };
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (linked(gameObjects[i], gameObjects[j])) union(i, j);
    }
  }
  const groups: Record<number, GameObject[]> = {};
  for (let i = 0; i < n; i++) {
    const root = find(i);
    (groups[root] = groups[root] || []).push(gameObjects[i]);
  }
  return Object.values(groups);
}

// True when the objects form exactly one homogeneous cluster per attribute value.
function isStageSorted(): boolean {
  const criterion = appData.stages[stageIndex].criterion;
  const values = new Set(gameObjects.map((o) => attrFor(o, criterion)));
  const groups = clusterObjects();
  if (groups.length !== values.size) return false;
  return groups.every((g) => g.every((o) => attrFor(o, criterion) === attrFor(g[0], criterion)));
}

// ---------------------------------------------------------------------------
// drawing primitives
// ---------------------------------------------------------------------------

// Draw a rounded rectangle path (own beginPath)
function roundRectPath(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + rr, y);
  c.arcTo(x + w, y, x + w, y + h, rr);
  c.arcTo(x + w, y + h, x, y + h, rr);
  c.arcTo(x, y + h, x, y, rr);
  c.arcTo(x, y, x + w, y, rr);
  c.closePath();
}

// Append a rounded-rect sub-path (no beginPath)
function roundRectSubPath(x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// Append a 5-point star sub-path centered at (cx,cy) (no beginPath)
function starSubPath(cx: number, cy: number, outer: number, inner: number, points: number): void {
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? outer : inner;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const X = cx + Math.cos(a) * rad;
    const Y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(X, Y);
    else ctx.lineTo(X, Y);
  }
  ctx.closePath();
}

// Build the path of a shape centered at (cx,cy) with radius r (own beginPath)
function buildShapePath(shape: ShapeKind, cx: number, cy: number, r: number): void {
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

// ---------------------------------------------------------------------------
// scene drawing
// ---------------------------------------------------------------------------

// Draw the background: the EBS "수학이 야호" scene when loaded, else a soft gradient.
function drawBackground(): void {
  const w = appData.canvasWidth;
  const h = appData.canvasHeight;

  if (backgroundImg && backgroundImg.complete && backgroundImg.naturalWidth > 0) {
    ctx.drawImage(backgroundImg, 0, 0, w, h);
    // warm-white scrim so the header/columns/text stay readable over the busy scene
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
    const px = (i * 137.5) % w;
    const py = 120 + ((i * 90) % (h - 200));
    const drift = Math.sin(bgPulse * 0.8 + i) * 8;
    ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.45)" : "rgba(255,214,153,0.35)";
    ctx.beginPath();
    ctx.arc(px, py + drift, 16 + (i % 3) * 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Draw the top header bar with title, criterion and progress
function drawHeader(): void {
  const w = appData.canvasWidth;
  const hh = appData.headerHeight;
  const stage = appData.stages[stageIndex];

  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, "#FF8A3D");
  g.addColorStop(1, "#FF6B6B");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, hh);

  ctx.save();
  // code badge
  roundRectPath(ctx, 22, 14, 86, hh - 28, 12);
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fill();
  ctx.fillStyle = "#FF6B3D";
  ctx.font = "700 24px 'Jua','Noto Sans KR',sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(textData.codeBadge, 65, hh / 2 + 1);

  // title
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 30px 'Jua','Noto Sans KR',sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(textData.appTitle, 124, hh / 2 + 1);

  // criterion chip
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

  // progress dots (one per stage)
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

// Draw the instruction line under the header
function drawInstruction(): void {
  const stage = appData.stages[stageIndex];
  ctx.save();
  ctx.fillStyle = "#A85A20";
  ctx.font = "700 22px 'Jua','Noto Sans KR',sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(stage.instruction, appData.canvasWidth / 2, appData.headerHeight + 16);
  ctx.restore();
}

// Draw a soft glow behind each homogeneous pile (positive grouping feedback).
// There are no frames — this is the only hint that a group is forming correctly.
function drawClusterHalos(): void {
  const criterion = appData.stages[stageIndex].criterion;
  const groups = clusterObjects();
  ctx.save();
  for (const g of groups) {
    if (g.length < 2) continue;
    const val = attrFor(g[0], criterion);
    if (!g.every((o) => attrFor(o, criterion) === val)) continue; // homogeneous only

    let cx = 0, cy = 0;
    for (const o of g) { cx += o.x; cy += o.y; }
    cx /= g.length; cy /= g.length;
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

// Draw a small Santa placeholder (the gift-giver) centered at (x,y) with face radius r
function drawSanta(x: number, y: number, r: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = "rgba(80,50,20,0.22)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;

  // face
  ctx.fillStyle = "#FAD9B8";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = "transparent";

  // beard (white rounded shape under the face)
  ctx.fillStyle = "#FBFBFB";
  ctx.beginPath();
  ctx.arc(0, r * 0.35, r * 0.92, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.arc(0, r * 0.2, r * 0.7, 0.85 * Math.PI, 0.15 * Math.PI, true);
  ctx.fill();

  // hat (red triangle) with white brim + pom
  ctx.fillStyle = "#E0392B";
  ctx.beginPath();
  ctx.moveTo(-r * 1.05, -r * 0.55);
  ctx.quadraticCurveTo(r * 0.2, -r * 2.2, r * 1.0, -r * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#FBFBFB";
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.58, r * 1.08, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(r * 0.62, -r * 1.55, r * 0.3, 0, Math.PI * 2);
  ctx.fill();

  // eyes + nose
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

// Draw a single game object as a glossy "paper tile" style shape
function drawObject(obj: GameObject): void {
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

  // gloss highlight
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

// Draw a wrapped gift box centered at the current origin, sized to radius r.
// Caller has already applied translate + shadow.
function drawGiftBox(r: number, hex: string): void {
  const half = r * 0.92;          // half-width/height of the box body
  const lidH = r * 0.34;          // lid band height at the top
  const ribbonW = Math.max(4, r * 0.22); // ribbon thickness

  // box body with vertical wrap gradient
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

  // lid band across the top
  ctx.save();
  roundRectPath(ctx, -half, -half, half * 2, half * 2, r * 0.16);
  ctx.clip();
  ctx.fillStyle = darken(hex, 0.12);
  ctx.fillRect(-half, -half, half * 2, lidH);
  ctx.restore();

  // ribbon cross (vertical + horizontal) in a soft contrasting tone
  const ribbon = lighten(hex, 0.62);
  ctx.fillStyle = ribbon;
  ctx.fillRect(-ribbonW / 2, -half, ribbonW, half * 2);
  ctx.fillRect(-half, -ribbonW / 2, half * 2, ribbonW);

  // bow: two loops + center knot sitting on top of the box
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

// Draw a standalone decorative object (title / how-to)
function drawObjectAt(shape: ShapeKind, colorKey: string, x: number, y: number, r: number): void {
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

// Draw the guide character and its speech bubble (bottom-right gutter)
function drawGuide(): void {
  const baseX = appData.canvasWidth - 100;
  const baseY = appData.canvasHeight - 30;
  const bob = Math.sin(bgPulse * 1.6) * 5;

  const cw = 174;
  let charTop = baseY - 180 + bob;
  if (characterImg && characterImg.complete && characterImg.naturalWidth > 0) {
    const ch = (characterImg.naturalHeight / characterImg.naturalWidth) * cw;
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
  const startY = by + bh / 2 - ((lines.length - 1) * lh) / 2 - 2;
  lines.forEach((ln, i) => ctx.fillText(ln, bx + bw / 2, startY + i * lh));
  ctx.restore();
}

// ---------------------------------------------------------------------------
// title / how-to / playing renderers
// ---------------------------------------------------------------------------

function drawTitleScreen(): void {
  drawBackground();
  const w = appData.canvasWidth;
  const cx = w / 2;

  const demo: { shape: ShapeKind; color: string; x: number; y: number }[] = [
    { shape: "triangle", color: "red", x: cx - 250, y: 180 },
    { shape: "star", color: "blue", x: cx + 230, y: 160 },
    { shape: "square", color: "green", x: cx + 260, y: 300 },
    { shape: "circle", color: "yellow", x: cx - 270, y: 320 },
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

// Draw the "how to play" instruction screen
function drawHowtoScreen(): void {
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
  const stepIcons: { shape?: ShapeKind; color?: string; kind: string }[] = [
    { kind: "shape", shape: "star", color: "red" },
    { kind: "group" },
    { kind: "dots" },
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

// Draw the small illustrative icon next to a how-to step
function drawHowtoStepIcon(icon: { shape?: ShapeKind; color?: string; kind: string }, x: number, y: number): void {
  ctx.save();
  if (icon.kind === "shape" && icon.shape && icon.color) {
    drawObjectAt(icon.shape, icon.color, x, y, 17);
  } else if (icon.kind === "group") {
    // a little pile of same-color dots inside a soft halo (grouping)
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

function drawPlayingScreen(): void {
  drawBackground();
  drawHeader();
  drawInstruction();
  drawClusterHalos();
  if (appData.stages[stageIndex].criterion === "size") {
    drawSanta(appData.canvasWidth - appData.guideGutter / 2, 150, 22);
  }
  drawGuide(); // drawn before objects so dragged objects always stay on top
  gameObjects.forEach((o) => { if (!o.dragging) drawObject(o); });
  if (draggingObj) drawObject(draggingObj);
}

// ---------------------------------------------------------------------------
// main render loop
// ---------------------------------------------------------------------------

function render(): void {
  bgPulse += 0.016;
  titlePulse += 0.016;
  ctx.clearRect(0, 0, appData.canvasWidth, appData.canvasHeight);

  if (currentState === AppState.TITLE) drawTitleScreen();
  else if (currentState === AppState.HOWTO) drawHowtoScreen();
  else drawPlayingScreen();

  animFrameId = requestAnimationFrame(render);
}

// ---------------------------------------------------------------------------
// interaction
// ---------------------------------------------------------------------------

function pointInObject(px: number, py: number, obj: GameObject): boolean {
  const dx = px - obj.x;
  const dy = py - obj.y;
  return dx * dx + dy * dy <= obj.radius * obj.radius * 1.1;
}

function objectAt(px: number, py: number): GameObject | null {
  for (let i = gameObjects.length - 1; i >= 0; i--) {
    const o = gameObjects[i];
    if (pointInObject(px, py, o)) return o;
  }
  return null;
}

function setBubble(text: string): void {
  currentBubbleText = text;
}

// Number of fully-formed, correctly separated homogeneous groups right now.
function completeGroupCount(): number {
  const criterion = appData.stages[stageIndex].criterion;
  return clusterObjects().filter(
    (g) => g.length >= 2 && g.every((o) => attrFor(o, criterion) === attrFor(g[0], criterion)),
  ).length;
}

function handlePointerDown(e: PointerEvent): void {
  const { x, y } = AppHelper.getRelativeCoordinates(e.clientX, e.clientY, appCanvas);

  if (currentState === AppState.TITLE) {
    startBgMusic();
    currentState = AppState.HOWTO;
    return;
  }
  if (currentState === AppState.HOWTO) {
    startGame();
    return;
  }
  if (currentState !== AppState.PLAYING) return;

  const obj = objectAt(x, y);
  if (obj) {
    draggingObj = obj;
    obj.dragging = true;
    dragOffsetX = x - obj.x;
    dragOffsetY = y - obj.y;
    dragOriginX = obj.x; // current cell, used to swap back an occupant
    dragOriginY = obj.y;
    groupsBeforeDrag = completeGroupCount();
    gameObjects = gameObjects.filter((o) => o !== obj);
    gameObjects.push(obj); // bring to front
    gsap.killTweensOf(obj);
    gsap.to(obj, { scale: 1.15, duration: 0.16, ease: "back.out(2)" });
    playSound(pickupSound);
  }
}

function handlePointerMove(e: PointerEvent): void {
  if (!draggingObj) return;
  const { x, y } = AppHelper.getRelativeCoordinates(e.clientX, e.clientY, appCanvas);
  const r = draggingObj.radius;
  // keep objects on-canvas and out of the header
  draggingObj.x = clamp(x - dragOffsetX, r, appData.canvasWidth - r);
  draggingObj.y = clamp(y - dragOffsetY, appData.headerHeight + r, appData.canvasHeight - r);
}

function handlePointerUp(): void {
  if (!draggingObj) return;
  const obj = draggingObj;
  draggingObj = null;
  obj.dragging = false;

  // snap to the nearest grid cell; if it's taken, swap the occupant back to the
  // cell this object came from
  const cell = nearestCell(obj.x, obj.y);
  const occupant = gameObjects.find(
    (o) => o !== obj && Math.hypot(o.x - cell.x, o.y - cell.y) < gridCell() * 0.5,
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

// Clamp a value into [lo, hi]
function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

// ---------------------------------------------------------------------------
// flow: start / stage transitions / game over
// ---------------------------------------------------------------------------

function startGame(): void {
  startBgMusic();
  stageIndex = 0;
  currentState = AppState.PLAYING;
  initObjects();
  setBubble(textData.defaultBubble);
}

function finishStage(): void {
  currentState = AppState.STAGECLEAR;
  setBubble(textData.stageClearBubble);
  playSound(correctSound);
  burstConfetti();

  window.setTimeout(() => {
    if (stageIndex >= appData.stages.length - 1) {
      showGameOver();
    } else {
      stageIndex++;
      currentState = AppState.PLAYING;
      initObjects();
      setBubble(textData.defaultBubble);
    }
  }, 1400);
}

function burstConfetti(): void {
  try {
    confetti({ particleCount: 130, spread: 80, startVelocity: 42, origin: { x: 0.5, y: 0.4 }, zIndex: 9999 });
  } catch (_e) {
    // best-effort
  }
}

function showGameOver(): void {
  currentState = AppState.GAMEOVER;
  burstConfetti();
  window.setTimeout(burstConfetti, 350);

  const overlay = AppHelper.createUIElement("div", "gameOverOverlay", {
    position: "absolute", left: "0", top: "0",
    width: appData.canvasWidth + "px", height: appData.canvasHeight + "px",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(40,20,10,0.45)", pointerEvents: "auto", zIndex: "50",
  });
  const card = AppHelper.createUIElement("div", "gameOverCard", {
    width: "520px", padding: "44px 40px", background: "#ffffff",
    borderRadius: "32px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    textAlign: "center", fontFamily: "'Jua','Noto Sans KR',sans-serif",
  });
  const title = AppHelper.createUIElement("div", "", {
    fontSize: "42px", fontWeight: "700", color: "#FF6B3D", marginBottom: "18px",
  }, textData.gameOverTitle);
  const msg = AppHelper.createUIElement("div", "", {
    fontSize: "24px", color: "#7A5230", lineHeight: "1.5", marginBottom: "32px", whiteSpace: "pre-line",
  }, textData.gameOverMessage);
  const btn = AppHelper.createUIElement("button", "", {
    fontSize: "26px", fontWeight: "700", color: "#ffffff",
    background: "linear-gradient(90deg,#FF8A3D,#FF6B6B)", border: "none",
    borderRadius: "999px", padding: "16px 44px", cursor: "pointer",
    fontFamily: "'Jua','Noto Sans KR',sans-serif", boxShadow: "0 8px 20px rgba(255,107,61,0.4)",
  }, textData.gameOverRestart, [{ event: "click", handler: () => restartGame() }]);

  card.appendChild(title);
  card.appendChild(msg);
  card.appendChild(btn);
  overlay.appendChild(card);
  uiLayer.appendChild(overlay);
  uiElements.push(overlay);
}

function clearUI(): void {
  uiElements.forEach((el) => el.remove());
  uiElements.length = 0;
}

function restartGame(): void {
  clearUI();
  startGame();
}

// ---------------------------------------------------------------------------
// sounds
// ---------------------------------------------------------------------------

async function loadSounds(): Promise<void> {
  if (soundsInitialized) return;
  soundsInitialized = true;
  try {
    const howlerModule: any = await import("howler");
    const Howl = howlerModule.Howl || (window as any).Howl;
    if (!Howl || !assetListData || !assetListData.sounds) return;
    const find = (id: string) => assetListData.sounds.find((s) => s.id === id);
    const pickup = find("pickup");
    if (pickup) pickupSound = new Howl({ src: [pickup.file_path], volume: pickup.volume });
    const place = find("place");
    if (place) placeSound = new Howl({ src: [place.file_path], volume: place.volume });
    const correct = find("correct_chime");
    if (correct) correctSound = new Howl({ src: [correct.file_path], volume: correct.volume });
    const bg = find("bg_music");
    if (bg) bgMusic = new Howl({ src: [bg.file_path], volume: bg.volume, loop: true });
  } catch (_e) {
    // audio is best-effort
  }
}

function playSound(sound: any): void {
  try { if (sound && sound.play) sound.play(); } catch (_e) { /* ignore */ }
}

function startBgMusic(): void {
  if (bgStarted) return;
  bgStarted = true;
  try { if (bgMusic && bgMusic.play) bgMusic.play(); } catch (_e) { /* ignore */ }
}

// ---------------------------------------------------------------------------
// bootstrap
// ---------------------------------------------------------------------------

async function initApp(): Promise<void> {
  appData = await AppHelper.loadAppData<IAppData>();
  textData = await AppHelper.loadTextData<ITextData>();
  assetListData = await AppHelper.loadAssetList<IAssetList>();

  appCanvas = document.getElementById("appCanvas") as HTMLCanvasElement;
  uiLayer = document.getElementById("uiLayer") as HTMLElement;
  ctx = appCanvas.getContext("2d")!;

  appCanvas.width = appData.canvasWidth;
  appCanvas.height = appData.canvasHeight;

  const charDef = assetListData.images.find((i) => i.id === "character");
  if (charDef) { characterImg = new Image(); characterImg.src = charDef.file_path; }
  const bubbleDef = assetListData.images.find((i) => i.id === "speech_bubble");
  if (bubbleDef) { bubbleImg = new Image(); bubbleImg.src = bubbleDef.file_path; }
  const bgDef = assetListData.images.find((i) => i.id === "background");
  if (bgDef) { backgroundImg = new Image(); backgroundImg.src = bgDef.file_path; }

  await loadSounds();

  currentState = AppState.TITLE;
  currentBubbleText = textData.defaultBubble;

  appCanvas.addEventListener("pointerdown", handlePointerDown);
  appCanvas.addEventListener("pointermove", handlePointerMove);
  appCanvas.addEventListener("pointerup", handlePointerUp);
  appCanvas.addEventListener("pointercancel", handlePointerUp);
  appCanvas.addEventListener("contextmenu", (e) => e.preventDefault());
  appCanvas.addEventListener("touchstart", (e) => e.preventDefault(), { passive: false });
  appCanvas.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });

  // Read-only inspection hook for automated testing (only when ?debug is present).
  if (typeof location !== "undefined" && location.search.indexOf("debug") !== -1) {
    (window as any).__kkiri = {
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
            id: o.id, x: o.x, y: o.y, r: o.radius,
            attr: attrFor(o, criterion),
          })),
          gameOver: !!document.getElementById("gameOverOverlay"),
        };
      },
    };
  }

  if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = 0; }
  render();
}

// export section

export { initApp };
