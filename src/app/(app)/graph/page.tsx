"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { GraphNode } from "@/types";
import { INITIAL_GRAPH_DATA } from "@/lib/graph-data";
import {
  Search, ZoomIn, ZoomOut, X, RefreshCw,
  Brain, Share2, Filter, ChevronDown, ChevronRight as ChevronRightIcon,
  Crosshair, ExternalLink, Maximize2, Minimize2, Map as MapIcon,
} from "lucide-react";
import * as d3 from "d3";
import { cn } from "@/lib/utils";

// ── Color + label maps ────────────────────────────────────────
const NODE_COLORS: Record<string, string> = {
  model:     "#8b5cf6",
  company:   "#6366f1",
  research:  "#10b981",
  framework: "#f59e0b",
  concept:   "#06b6d4",
  tool:      "#ef4444",
  news:      "#ec4899",
};
const NODE_TYPE_LABELS: Record<string, string> = {
  model: "Models", company: "Companies", research: "Research",
  framework: "Frameworks", concept: "Concepts", tool: "Tools", news: "News",
};

const MIN_ZOOM   = 0.06;
const MAX_ZOOM   = 12;
const LABEL_ZOOM = 0.55;
const EDGE_LABEL_ZOOM = 1.4;

// ── Utility helpers ───────────────────────────────────────────
function nodeRadius(size: number): number {
  return Math.max(5, Math.round(size * 0.28));
}
function easeBackOut(t: number, overshoot = 1.8): number {
  const c = overshoot + 1;
  return 1 + c * Math.pow(t - 1, 3) + overshoot * Math.pow(t - 1, 2);
}
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
function typeEmoji(type: string): string {
  return ({
    model: "🧠", company: "🏢", research: "📄",
    framework: "⚙️", concept: "💡", tool: "🔧", news: "📰",
  } as Record<string, string>)[type] ?? "●";
}
function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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

// ── Type definitions ──────────────────────────────────────────
interface ExtNode extends GraphNode, d3.SimulationNodeDatum {
  x?: number; y?: number; vx?: number; vy?: number;
  fx?: number | null; fy?: number | null;
}
interface Transform { x: number; y: number; k: number }

export default function GraphPage() {
  // ── Refs ────────────────────────────────────────────────────
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);
  const simRef        = useRef<d3.Simulation<ExtNode, undefined> | null>(null);
  const nodesRef      = useRef<ExtNode[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linksRef      = useRef<any[]>([]);
  const transformRef  = useRef<Transform>({ x: 0, y: 0, k: 1 });
  const rafRef        = useRef<number | null>(null);
  const draggingRef   = useRef<ExtNode | null>(null);
  const hoveredRef    = useRef<ExtNode | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const showMiniMapRef = useRef(true);

  const entranceActiveRef = useRef(false);
  const entranceStartRef  = useRef(0);
  const entranceMapRef    = useRef<Map<string, { delay: number; duration: number }>>(new Map());
  const nodeAnimRef       = useRef<Map<string, { t0: number; duration: number }>>(new Map());

  // ── State ────────────────────────────────────────────────────
  const [activeTypes,  setActiveTypes]  = useState<Set<string>>(new Set(Object.keys(NODE_COLORS)));
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode,  setHoveredNode]  = useState<GraphNode | null>(null);
  const [zoom,         setZoom]         = useState(1);
  const [search,       setSearch]       = useState("");
  const [foldersOpen,  setFoldersOpen]  = useState(true);
  const [fullscreen,   setFullscreen]   = useState(false);
  const [showMiniMap,  setShowMiniMap]  = useState(true);
  const [graphArticles, setGraphArticles] = useState<{id: string; title: string; summary: string; source: string}[]>([]);

  useEffect(() => {
    showMiniMapRef.current = showMiniMap;
  }, [showMiniMap]);

  // ── Load articles from sessionStorage ──────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const articles = JSON.parse(sessionStorage.getItem("graph_articles") ?? "[]");
      if (Array.isArray(articles)) setGraphArticles(articles);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { selectedIdRef.current = selectedNode?.id ?? null; }, [selectedNode]);

  const typeCounts = Object.keys(NODE_COLORS).reduce<Record<string, number>>((acc, t) => {
    acc[t] = t === "news"
      ? graphArticles.length
      : INITIAL_GRAPH_DATA.nodes.filter(n => n.type === t).length;
    return acc;
  }, {});

  // ── Draw ────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x: tx, y: ty, k } = transformRef.current;
    const nodes  = nodesRef.current;
    const links  = linksRef.current;
    const selId  = selectedIdRef.current;
    const now    = performance.now();
    const q      = search.toLowerCase().trim();

    const entranceActive  = entranceActiveRef.current;
    const entranceElapsed = entranceActive ? now - entranceStartRef.current : Infinity;
    if (entranceActive && entranceElapsed > 1500) entranceActiveRef.current = false;
    const entranceEdgeAlpha = entranceActive ? Math.min(1, entranceElapsed / 900) : 1;

    // Background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Subtle dot grid background
    const gridSpacing = 28;
    const dotR = 0.8;
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    const offX = ((tx % (gridSpacing * k)) + gridSpacing * k) % (gridSpacing * k);
    const offY = ((ty % (gridSpacing * k)) + gridSpacing * k) % (gridSpacing * k);
    for (let gx = offX - gridSpacing * k; gx < canvas.width; gx += gridSpacing * k) {
      for (let gy = offY - gridSpacing * k; gy < canvas.height; gy += gridSpacing * k) {
        ctx.beginPath();
        ctx.arc(gx, gy, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.save();
    ctx.translate(tx, ty);
    ctx.scale(k, k);

    // ── Connected set ────────────────────────────────────────
    let connectedIds: Set<string> | null = null;
    if (selId) {
      connectedIds = new Set([selId]);
      for (const l of INITIAL_GRAPH_DATA.links) {
        if (l.source === selId) connectedIds.add(String(l.target));
        if (l.target === selId) connectedIds.add(String(l.source));
      }
    }

    // ── Cluster halos ────────────────────────────────────────
    if (k > 0.25) {
      const typeGroups: Record<string, { xs: number[]; ys: number[] }> = {};
      for (const nd of nodes) {
        if (!typeGroups[nd.type]) typeGroups[nd.type] = { xs: [], ys: [] };
        typeGroups[nd.type].xs.push(nd.x ?? 0);
        typeGroups[nd.type].ys.push(nd.y ?? 0);
      }
      for (const [type, { xs, ys }] of Object.entries(typeGroups)) {
        if (xs.length < 2) continue;
        const cx = xs.reduce((a, b) => a + b, 0) / xs.length;
        const cy = ys.reduce((a, b) => a + b, 0) / ys.length;
        const r  = Math.max(...xs.map((x, i) => Math.hypot(x - cx, ys[i] - cy))) + 40;
        const col = NODE_COLORS[type] ?? "#6366f1";
        const grad = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r);
        grad.addColorStop(0, hexToRgba(col, 0.0));
        grad.addColorStop(1, hexToRgba(col, 0.04));
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }
    }

    // ── Edges ────────────────────────────────────────────────
    for (const l of links) {
      const sx = l.source.x ?? 0, sy = l.source.y ?? 0;
      const ex = l.target.x ?? 0, ey = l.target.y ?? 0;
      const src = l.source.id as string;
      const tgt = l.target.id as string;

      const isTouching = selId && (src === selId || tgt === selId);

      // Bezier control point — perpendicular offset
      const dx = ex - sx, dy = ey - sy;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const bendFactor = 0.18;
      const cpx = (sx + ex) / 2 + (-dy / len) * len * bendFactor;
      const cpy = (sy + ey) / 2 + ( dx / len) * len * bendFactor;

      if (selId) {
        if (isTouching) {
          const selN = nodes.find(nd => nd.id === selId);
          const col  = selN ? (selN.color ?? NODE_COLORS[selN.type] ?? "#8b5cf6") : "#8b5cf6";
          ctx.strokeStyle = hexToRgba(col, 0.8 * entranceEdgeAlpha);
          ctx.lineWidth   = 2 / k;
          ctx.globalAlpha = 1;
        } else {
          ctx.strokeStyle = `rgba(255,255,255,${0.025 * entranceEdgeAlpha})`;
          ctx.lineWidth   = 0.6 / k;
          ctx.globalAlpha = 1;
        }
      } else {
        ctx.strokeStyle = `rgba(255,255,255,${0.10 * entranceEdgeAlpha})`;
        ctx.lineWidth   = 0.8 / k;
        ctx.globalAlpha = 1;
      }

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(cpx, cpy, ex, ey);
      ctx.stroke();

      // Arrowhead on selected edges
      if (isTouching && k > 0.3) {
        const selN = nodes.find(nd => nd.id === selId);
        const col  = selN ? (selN.color ?? NODE_COLORS[selN.type] ?? "#8b5cf6") : "#8b5cf6";
        const tgtNode = nodes.find(nd => nd.id === tgt);
        const tr  = nodeRadius(tgtNode?.size ?? 20) + 1;
        // Arrow direction from cp → end
        const adx = ex - cpx, ady = ey - cpy;
        const aLen = Math.sqrt(adx * adx + ady * ady) || 1;
        const ux = adx / aLen, uy = ady / aLen;
        const tipX = ex - ux * tr, tipY = ey - uy * tr;
        const arrowSize = 7 / k;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX - ux * arrowSize + uy * arrowSize * 0.45, tipY - uy * arrowSize - ux * arrowSize * 0.45);
        ctx.lineTo(tipX - ux * arrowSize - uy * arrowSize * 0.45, tipY - uy * arrowSize + ux * arrowSize * 0.45);
        ctx.closePath();
        ctx.fillStyle = hexToRgba(col, 0.85);
        ctx.fill();
      }

      // Edge labels at high zoom
      if (k >= EDGE_LABEL_ZOOM && l.label && isTouching) {
        const midX = 0.25 * sx + 0.5 * cpx + 0.25 * ex;
        const midY = 0.25 * sy + 0.5 * cpy + 0.25 * ey;
        const fontSize = Math.max(5, 6 / k);
        ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
        ctx.textAlign = "center";
        const selN = nodes.find(nd => nd.id === selId);
        const col  = selN ? (selN.color ?? NODE_COLORS[selN.type] ?? "#8b5cf6") : "#8b5cf6";
        ctx.fillStyle = hexToRgba(col, 0.85);
        ctx.globalAlpha = 0.85;
        ctx.fillText(l.label, midX, midY - 3 / k);
        ctx.globalAlpha = 1;
      }
    }

    // ── Nodes ────────────────────────────────────────────────
    for (const node of nodes) {
      const nx  = node.x ?? 0, ny = node.y ?? 0;
      const r   = nodeRadius(node.size ?? 20);
      const col = node.color ?? NODE_COLORS[node.type] ?? "#6366f1";
      const isSel  = node.id === selId;
      const isConn = connectedIds ? connectedIds.has(node.id) : true;
      const matchQ = !q || node.label.toLowerCase().includes(q) || (node.description ?? "").toLowerCase().includes(q);
      if (q && !matchQ) { ctx.globalAlpha = 0.04; }

      // Entrance animation
      let animScale = 1;
      if (entranceActive) {
        const info = entranceMapRef.current.get(node.id);
        if (info) {
          const el = entranceElapsed - info.delay;
          if (el < 0) animScale = 0;
          else if (el < info.duration) animScale = Math.max(0, easeBackOut(el / info.duration));
        }
      }
      const anim = nodeAnimRef.current.get(node.id);
      if (anim) {
        const el = now - anim.t0;
        if (el < anim.duration) animScale = Math.max(0, easeBackOut(el / anim.duration));
        else nodeAnimRef.current.delete(node.id);
      }

      const drawR = r * animScale;
      if (drawR <= 0) { ctx.globalAlpha = 1; continue; }

      const fillA   = isSel ? 1    : isConn ? 0.88 : 0.12;
      const strokeA = isSel ? 1    : isConn ? 0.5  : 0.07;
      const realR   = isSel ? drawR * 1.35 : drawR;

      // Glow shadow on selected
      if (isSel) {
        ctx.shadowColor = col;
        ctx.shadowBlur  = 22;
      }

      // Radial gradient fill
      const grad = ctx.createRadialGradient(nx - realR * 0.28, ny - realR * 0.28, 0, nx, ny, realR);
      grad.addColorStop(0, hexToRgba(col, Math.min(1, fillA + 0.18)));
      grad.addColorStop(1, hexToRgba(col, fillA));

      ctx.beginPath();
      ctx.arc(nx, ny, realR, 0, Math.PI * 2);
      ctx.fillStyle   = grad;
      ctx.fill();
      ctx.strokeStyle = hexToRgba(col, strokeA);
      ctx.lineWidth   = (isSel ? 2.5 : 1.2) / k;
      ctx.stroke();
      if (isSel) ctx.shadowBlur = 0;

      // Pulsing ring on selected node
      if (isSel) {
        const pulse = 0.5 + 0.5 * Math.sin(now * 0.003);
        ctx.beginPath();
        ctx.arc(nx, ny, realR + (6 + pulse * 5) / k, 0, Math.PI * 2);
        ctx.strokeStyle = hexToRgba(col, 0.3 + pulse * 0.2);
        ctx.lineWidth   = 1.5 / k;
        ctx.stroke();
      }

      // Hover halo
      const hov = hoveredRef.current;
      if (hov?.id === node.id && !selId) {
        ctx.beginPath();
        ctx.arc(nx, ny, drawR + 6 / k, 0, Math.PI * 2);
        ctx.strokeStyle = hexToRgba(col, 0.6);
        ctx.lineWidth   = 1.5 / k;
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    }

    // ── Labels ───────────────────────────────────────────────
    if (k >= LABEL_ZOOM) {
      const fontSize = Math.max(6, Math.min(12, 9 / k));
      ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
      ctx.textAlign = "center";
      for (const node of nodes) {
        const isConn = connectedIds ? connectedIds.has(node.id) : true;
        if (selId && !isConn) continue;
        const matchQ = !q || node.label.toLowerCase().includes(q);
        ctx.globalAlpha = q && !matchQ ? 0.04 : (node.id === selId ? 1 : isConn ? 0.75 : 0.22);
        const r   = nodeRadius(node.size ?? 20);
        const lbl = node.label.length > 20 ? node.label.slice(0, 20) + "…" : node.label;
        ctx.fillStyle = "#e2e8f0";
        ctx.fillText(lbl, node.x ?? 0, (node.y ?? 0) + r + 12 / k);
        ctx.globalAlpha = 1;
      }
    }

    ctx.restore();

    // ── Mini-map ─────────────────────────────────────────────
    if (showMiniMapRef.current && nodes.length > 0) {
      const MM_W = 160, MM_H = 100, MM_PAD = 6, MM_R = 6;
      const MM_X = canvas.width  - MM_W - 12;
      const MM_Y = canvas.height - MM_H - 12;

      const allXs = nodes.map(n => n.x ?? 0);
      const allYs = nodes.map(n => n.y ?? 0);
      const mnX = Math.min(...allXs), mxX = Math.max(...allXs);
      const mnY = Math.min(...allYs), mxY = Math.max(...allYs);
      const dW  = mxX - mnX || 1, dH = mxY - mnY || 1;
      const mmS = Math.min((MM_W - MM_PAD * 2) / dW, (MM_H - MM_PAD * 2) / dH);
      const mmOX = MM_X + MM_PAD + (MM_W - MM_PAD * 2 - dW * mmS) / 2;
      const mmOY = MM_Y + MM_PAD + (MM_H - MM_PAD * 2 - dH * mmS) / 2;

      // Background
      roundRectPath(ctx, MM_X, MM_Y, MM_W, MM_H, MM_R);
      ctx.fillStyle   = "rgba(8, 13, 24, 0.88)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth   = 1;
      ctx.stroke();

      // Edges
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth   = 0.4;
      for (const l of linksRef.current) {
        ctx.beginPath();
        ctx.moveTo(mmOX + ((l.source.x ?? 0) - mnX) * mmS, mmOY + ((l.source.y ?? 0) - mnY) * mmS);
        ctx.lineTo(mmOX + ((l.target.x ?? 0) - mnX) * mmS, mmOY + ((l.target.y ?? 0) - mnY) * mmS);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Nodes
      for (const node of nodes) {
        const nx  = mmOX + ((node.x ?? 0) - mnX) * mmS;
        const ny  = mmOY + ((node.y ?? 0) - mnY) * mmS;
        const col = node.color ?? NODE_COLORS[node.type] ?? "#6366f1";
        const nr  = Math.max(1.2, (node.size ?? 20) * 0.045);
        ctx.beginPath();
        ctx.arc(nx, ny, node.id === selId ? nr * 1.8 : nr, 0, Math.PI * 2);
        ctx.fillStyle   = col;
        ctx.globalAlpha = node.id === selId ? 1 : 0.72;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Viewport rect
      const { x: vx, y: vy, k: vk } = transformRef.current;
      const vpX = mmOX + (-vx / vk - mnX) * mmS;
      const vpY = mmOY + (-vy / vk - mnY) * mmS;
      const vpW = (canvas.width  / vk) * mmS;
      const vpH = (canvas.height / vk) * mmS;
      ctx.strokeStyle = "rgba(139,92,246,0.75)";
      ctx.lineWidth   = 1;
      roundRectPath(ctx, vpX, vpY, vpW, vpH, 2);
      ctx.stroke();

      // Label
      ctx.font      = "9px Inter, system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.textAlign = "left";
      ctx.fillText("OVERVIEW", MM_X + 6, MM_Y + 10);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, showMiniMap]);

  // ── RAF loop ────────────────────────────────────────────────
  const startLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const loop = () => { draw(); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
  }, [draw]);

  const stopLoop = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  }, []);

  // ── Hit detection ────────────────────────────────────────────
  const getNodeAt = useCallback((cx: number, cy: number): ExtNode | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const { x: tx, y: ty, k } = transformRef.current;
    const gx = (cx - rect.left - tx) / k;
    const gy = (cy - rect.top  - ty) / k;
    for (let i = nodesRef.current.length - 1; i >= 0; i--) {
      const n  = nodesRef.current[i];
      const r  = nodeRadius(n.size ?? 20) + 4;
      const dx = (n.x ?? 0) - gx, dy = (n.y ?? 0) - gy;
      if (dx * dx + dy * dy <= r * r) return n;
    }
    return null;
  }, []);

  // ── Build graph ──────────────────────────────────────────────
  const buildGraph = useCallback(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    stopLoop();
    simRef.current?.stop();
    setSelectedNode(null);
    selectedIdRef.current = null;
    nodeAnimRef.current   = new Map();
    draggingRef.current   = null;
    hoveredRef.current    = null;
    setHoveredNode(null);

    const W = container.clientWidth  || window.innerWidth;
    const H = container.clientHeight || window.innerHeight;
    canvas.width  = W;
    canvas.height = H;

    // Merge in article nodes
    let allNodes = [...INITIAL_GRAPH_DATA.nodes];
    let allLinks = [...INITIAL_GRAPH_DATA.links];

    if (graphArticles.length > 0) {
      allNodes = allNodes.filter(n => n.type !== "news");
      graphArticles.forEach((article) => {
        allNodes.push({ id: article.id, label: article.title, type: "news", description: article.summary, size: 18, color: "#ec4899" });
        const kw = article.source.toLowerCase();
        const rel = allNodes.find(n => n.type === "company" && n.label.toLowerCase().includes(kw.split(" ")[0]));
        if (rel) allLinks.push({ source: article.id, target: rel.id, label: "mentions" });
      });
    }

    const visNodes: ExtNode[] = allNodes.filter(n => activeTypes.has(n.type)).map(n => ({ ...n }));
    const visIds   = new Set(visNodes.map(n => n.id));
    const visLinks = allLinks
      .filter(l => visIds.has(String(l.source)) && visIds.has(String(l.target)))
      .map(l => ({ ...l }));

    const n = visNodes.length;

    // Build type → centroid map for cluster force
    const typeCentroids: Record<string, { x: number; y: number }> = {
      company:   { x: W * 0.50, y: H * 0.40 },
      model:     { x: W * 0.70, y: H * 0.35 },
      concept:   { x: W * 0.50, y: H * 0.65 },
      framework: { x: W * 0.30, y: H * 0.60 },
      research:  { x: W * 0.75, y: H * 0.65 },
      tool:      { x: W * 0.25, y: H * 0.35 },
      news:      { x: W * 0.50, y: H * 0.20 },
    };

    const chargeStr = -Math.max(80, Math.min(320, 300 - n * 0.5));
    const linkDist  = Math.max(55, Math.min(110, 55 + n * 0.22));

    const sim = d3.forceSimulation<ExtNode>(visNodes)
      .alphaDecay(0.022)
      .velocityDecay(0.38)
      .force("link",      d3.forceLink(visLinks).id((d: unknown) => (d as ExtNode).id).distance(linkDist).strength(0.45))
      .force("charge",    d3.forceManyBody().strength(chargeStr).distanceMax(400))
      .force("center",    d3.forceCenter(W / 2, H / 2).strength(0.04))
      .force("collision", d3.forceCollide().radius((d: unknown) => nodeRadius((d as ExtNode).size ?? 20) + 5).strength(0.75))
      .force("cluster",   (alpha: number) => {
        // Gentle nudge toward type centroid
        for (const nd of visNodes) {
          const c = typeCentroids[nd.type];
          if (!c) continue;
          nd.vx = (nd.vx ?? 0) + (c.x - (nd.x ?? W / 2)) * 0.006 * alpha;
          nd.vy = (nd.vy ?? 0) + (c.y - (nd.y ?? H / 2)) * 0.006 * alpha;
        }
      });

    simRef.current   = sim;
    nodesRef.current = visNodes;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    linksRef.current = (sim.force("link") as any).links();

    // Pre-tick for initial layout
    const ticks = Math.min(140, Math.max(50, n));
    for (let i = 0; i < ticks; i++) sim.tick();

    // Auto-fit viewport
    const xs  = visNodes.map(nd => nd.x ?? 0);
    const ys  = visNodes.map(nd => nd.y ?? 0);
    const pad = 70;
    const fitK = Math.min(
      (W - pad * 2) / Math.max(Math.max(...xs) - Math.min(...xs), 1),
      (H - pad * 2) / Math.max(Math.max(...ys) - Math.min(...ys), 1),
      2.2,
    );
    transformRef.current = {
      k: fitK,
      x: W / 2 - fitK * (Math.min(...xs) + Math.max(...xs)) / 2,
      y: H / 2 - fitK * (Math.min(...ys) + Math.max(...ys)) / 2,
    };
    setZoom(fitK);

    // Hub-first entrance cascade
    const linkCount: Record<string, number> = {};
    for (const l of INITIAL_GRAPH_DATA.links) {
      linkCount[String(l.source)] = (linkCount[String(l.source)] ?? 0) + 1;
      linkCount[String(l.target)] = (linkCount[String(l.target)] ?? 0) + 1;
    }
    const sorted = [...visNodes].sort((a, b) => (linkCount[b.id] ?? 0) - (linkCount[a.id] ?? 0));
    const eMap   = new Map<string, { delay: number; duration: number }>();
    sorted.forEach((nd, i) => {
      const pct = i / sorted.length;
      if (pct < 0.15)      eMap.set(nd.id, { delay: 0,   duration: 520 });
      else if (pct < 0.45) eMap.set(nd.id, { delay: 200, duration: 430 });
      else                  eMap.set(nd.id, { delay: 460, duration: 360 });
    });
    entranceMapRef.current    = eMap;
    entranceStartRef.current  = performance.now();
    entranceActiveRef.current = true;

    // ── Mouse / Touch Events ────────────────────────────────
    let isPanning    = false;
    let panStart     = { x: 0, y: 0 };
    let panStartTx   = { x: 0, y: 0, k: 1 };
    let mouseDownPos = { x: 0, y: 0 };
    let didDrag      = false;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      mouseDownPos = { x: e.clientX, y: e.clientY };
      didDrag      = false;
      const node   = getNodeAt(e.clientX, e.clientY);
      if (node) {
        draggingRef.current = node;
        node.fx = node.x; node.fy = node.y;
        sim.alphaTarget(0.5).restart();
      } else {
        isPanning  = true;
        panStart   = { x: e.clientX, y: e.clientY };
        panStartTx = { ...transformRef.current };
      }
    };
    const onMouseMove = (e: MouseEvent) => {
      const ddx = e.clientX - mouseDownPos.x, ddy = e.clientY - mouseDownPos.y;
      if (Math.sqrt(ddx * ddx + ddy * ddy) > 3) didDrag = true;
      if (draggingRef.current) {
        const rect   = canvas.getBoundingClientRect();
        const { x: tx2, y: ty2, k } = transformRef.current;
        draggingRef.current.fx = (e.clientX - rect.left - tx2) / k;
        draggingRef.current.fy = (e.clientY - rect.top  - ty2) / k;
      } else if (isPanning) {
        transformRef.current = {
          k: panStartTx.k,
          x: panStartTx.x + (e.clientX - panStart.x),
          y: panStartTx.y + (e.clientY - panStart.y),
        };
      } else {
        const node = getNodeAt(e.clientX, e.clientY);
        if (node !== hoveredRef.current) {
          hoveredRef.current = node;
          setHoveredNode(node);
        }
      }
    };
    const onMouseUp = () => {
      if (draggingRef.current) {
        draggingRef.current.fx = null; draggingRef.current.fy = null;
        sim.alphaTarget(0.08);
        setTimeout(() => simRef.current?.alphaTarget(0), 500);
        draggingRef.current = null;
      }
      isPanning = false;
    };
    const onClick = (e: MouseEvent) => {
      if (didDrag) return;
      const node = getNodeAt(e.clientX, e.clientY);
      if (node) {
        setSelectedNode(prev => {
          const next = prev?.id === node.id ? null : (node as GraphNode);
          selectedIdRef.current = next?.id ?? null;
          return next;
        });
      } else {
        setSelectedNode(null);
        selectedIdRef.current = null;
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect   = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const factor = e.deltaY > 0 ? 0.84 : 1.19;
      const { x: tx2, y: ty2, k } = transformRef.current;
      const newK = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, k * factor));
      transformRef.current = {
        k: newK,
        x: mx - (mx - tx2) * (newK / k),
        y: my - (my - ty2) * (newK / k),
      };
      setZoom(newK);
    };

    let lastTouchDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const [a, b] = [e.touches[0], e.touches[1]];
        lastTouchDist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
      } else if (e.touches.length === 1) {
        isPanning  = true;
        panStart   = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        panStartTx = { ...transformRef.current };
        didDrag    = false;
        mouseDownPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 2) {
        const [a, b] = [e.touches[0], e.touches[1]];
        const dist   = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
        const factor = dist / Math.max(lastTouchDist, 1);
        const mid    = { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
        const rect   = canvas.getBoundingClientRect();
        const mx = mid.x - rect.left, my = mid.y - rect.top;
        const { x: tx2, y: ty2, k } = transformRef.current;
        const newK = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, k * factor));
        transformRef.current = { k: newK, x: mx - (mx - tx2) * (newK / k), y: my - (my - ty2) * (newK / k) };
        setZoom(newK);
        lastTouchDist = dist;
      } else if (e.touches.length === 1 && isPanning) {
        const dx = e.touches[0].clientX - panStart.x, dy = e.touches[0].clientY - panStart.y;
        if (Math.sqrt(dx * dx + dy * dy) > 3) didDrag = true;
        transformRef.current = { k: panStartTx.k, x: panStartTx.x + dx, y: panStartTx.y + dy };
      }
    };
    const onTouchEnd = () => { isPanning = false; };
    const onLeave    = () => { hoveredRef.current = null; setHoveredNode(null); };

    canvas.addEventListener("mousedown",  onMouseDown);
    canvas.addEventListener("mousemove",  onMouseMove);
    canvas.addEventListener("mouseup",    onMouseUp);
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("click",      onClick);
    canvas.addEventListener("wheel",      onWheel, { passive: false });
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove",  onTouchMove,  { passive: false });
    canvas.addEventListener("touchend",   onTouchEnd);

    startLoop();

    return () => {
      stopLoop();
      sim.stop();
      canvas.removeEventListener("mousedown",  onMouseDown);
      canvas.removeEventListener("mousemove",  onMouseMove);
      canvas.removeEventListener("mouseup",    onMouseUp);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("click",      onClick);
      canvas.removeEventListener("wheel",      onWheel);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove",  onTouchMove);
      canvas.removeEventListener("touchend",   onTouchEnd);
    };
  }, [activeTypes, getNodeAt, startLoop, stopLoop, graphArticles]);

  useEffect(() => {
    const cleanup = buildGraph();
    return cleanup;
  }, [buildGraph]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas    = canvasRef.current;
    if (!container || !canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width  = container.clientWidth;
      canvas.height = container.clientHeight;
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // ── Zoom helpers ─────────────────────────────────────────────
  const doZoomIn = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const { x, y, k } = transformRef.current;
    const newK = Math.min(MAX_ZOOM, k * 1.4);
    const cx = canvas.width / 2, cy = canvas.height / 2;
    transformRef.current = { k: newK, x: cx - (cx - x) * (newK / k), y: cy - (cy - y) * (newK / k) };
    setZoom(newK);
  };
  const doZoomOut = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const { x, y, k } = transformRef.current;
    const newK = Math.max(MIN_ZOOM, k * 0.7);
    const cx = canvas.width / 2, cy = canvas.height / 2;
    transformRef.current = { k: newK, x: cx - (cx - x) * (newK / k), y: cy - (cy - y) * (newK / k) };
    setZoom(newK);
  };
  const doZoomFit = () => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    const nodes     = nodesRef.current;
    if (!canvas || !container || !nodes.length) return;
    const xs  = nodes.map(nd => nd.x ?? 0), ys = nodes.map(nd => nd.y ?? 0);
    const pad = 70;
    const fitK = Math.min(
      (canvas.width  - pad * 2) / Math.max(Math.max(...xs) - Math.min(...xs), 1),
      (canvas.height - pad * 2) / Math.max(Math.max(...ys) - Math.min(...ys), 1),
      2.2,
    );
    transformRef.current = {
      k: fitK,
      x: canvas.width  / 2 - fitK * (Math.min(...xs) + Math.max(...xs)) / 2,
      y: canvas.height / 2 - fitK * (Math.min(...ys) + Math.max(...ys)) / 2,
    };
    setZoom(fitK);
  };

  const toggleType = (t: string) => setActiveTypes(prev => {
    const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n;
  });

  // ── Connections for detail panel ─────────────────────────────
  const connectedLinks = selectedNode
    ? INITIAL_GRAPH_DATA.links.filter(l => l.source === selectedNode.id || l.target === selectedNode.id)
    : [];
  const connectedNodes = connectedLinks.map(l => {
    const otherId = l.source === selectedNode?.id ? l.target : l.source;
    const node    = INITIAL_GRAPH_DATA.nodes.find(n => n.id === otherId);
    return node ? { node, label: l.label, dir: l.source === selectedNode?.id ? "→" : "←" } : null;
  }).filter(Boolean);

  const nodeCount  = INITIAL_GRAPH_DATA.nodes.filter(n => activeTypes.has(n.type)).length;
  const edgeCount  = INITIAL_GRAPH_DATA.links.length;

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className={cn("flex flex-col h-screen bg-[#07090f]", fullscreen && "fixed inset-0 z-50")}>
      <TopBar title="AI Brain" description="Obsidian-style AI knowledge graph — explore relationships in the ecosystem" />

      <div className="flex flex-1 overflow-hidden">

        {/* ── Vault Sidebar ─────────────────────────────────── */}
        <aside className="hidden md:flex w-52 flex-shrink-0 bg-[#080c17] border-r border-white/[0.06] flex-col h-full overflow-hidden">
          <div className="px-3 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-xs font-bold text-white leading-none">AI Brain</div>
                <div className="text-[10px] text-gray-600 leading-none mt-0.5">
                  {nodeCount} nodes · {edgeCount} edges
                </div>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
              <input
                type="text" placeholder="Search nodes…" value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-7 pr-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 scrollbar-hide">
            {/* Graph View button */}
            <button className="vault-nav-item vault-nav-active w-full">
              <Share2 className="w-3.5 h-3.5 flex-shrink-0 text-violet-400" />
              <span className="flex-1 text-left">Graph View</span>
              <span className="text-[10px] bg-violet-500/20 text-violet-400 px-1 rounded font-mono">Canvas</span>
            </button>

            {/* Node Type filters */}
            <div className="pt-3 pb-1">
              <button
                onClick={() => setFoldersOpen(!foldersOpen)}
                className="flex items-center gap-1 text-[10px] font-semibold text-gray-600 uppercase tracking-wider w-full hover:text-gray-400 px-1 transition-colors"
              >
                {foldersOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />}
                Node Types
              </button>
            </div>

            {foldersOpen && Object.entries(NODE_COLORS).map(([type, color]) => (
              <button key={type} onClick={() => toggleType(type)}
                className={cn("vault-nav-item w-full", activeTypes.has(type) && "vault-nav-active")}>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors"
                  style={{ backgroundColor: activeTypes.has(type) ? color : "#2a2a3a" }} />
                <span className="flex-1 text-left truncate">{NODE_TYPE_LABELS[type]}</span>
                <span className={cn("text-[10px] tabular-nums", activeTypes.has(type) ? "text-gray-500" : "text-gray-700 line-through")}>
                  {typeCounts[type]}
                </span>
              </button>
            ))}

            {/* Stats */}
            <div className="pt-3 pb-1">
              <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider px-1">Stats</span>
            </div>
            <div className="glass-card p-2.5 mx-0.5 space-y-1.5">
              {([
                ["Active nodes", nodeCount],
                ["Connections",  edgeCount],
                ["Types visible", activeTypes.size],
                ["Zoom level", `${Math.round(zoom * 100)}%`],
              ] as [string, string | number][]).map(([kk, vv]) => (
                <div key={kk} className="flex justify-between text-[11px]">
                  <span className="text-gray-600">{kk}</span>
                  <span className={typeof vv === "string" && vv.includes("%") ? "text-violet-400 font-mono" : "text-white font-medium"}>{vv}</span>
                </div>
              ))}
            </div>

            {/* Controls */}
            <div className="pt-3 pb-1">
              <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider px-1">Controls</span>
            </div>
            <div className="px-1 space-y-1">
              {[["Click", "Select node"], ["Drag", "Move node"], ["Scroll", "Zoom in/out"], ["Pinch", "Zoom (mobile)"], ["Space-drag", "Pan view"]].map(([key, val]) => (
                <div key={key} className="flex justify-between text-[10px]">
                  <kbd className="text-gray-600 font-mono">{key}</kbd>
                  <span className="text-gray-700">{val}</span>
                </div>
              ))}
            </div>
          </nav>
        </aside>

        {/* ── Canvas Area ────────────────────────────────────── */}
        <div className="flex-1 relative overflow-hidden">
          <div ref={containerRef} className="w-full h-full">
            <canvas ref={canvasRef} className="w-full h-full" style={{ cursor: "default" }} />
          </div>

          {/* Zoom controls */}
          <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
            <button onClick={doZoomIn}             className="graph-control-btn"><ZoomIn    className="w-3.5 h-3.5"/></button>
            <button onClick={doZoomOut}            className="graph-control-btn"><ZoomOut   className="w-3.5 h-3.5"/></button>
            <button onClick={doZoomFit}            className="graph-control-btn" title="Fit view"><Crosshair className="w-3.5 h-3.5"/></button>
            <button onClick={() => buildGraph()}   className="graph-control-btn" title="Refresh"><RefreshCw className="w-3.5 h-3.5"/></button>
            <button
              onClick={() => setShowMiniMap(m => !m)}
              className={cn("graph-control-btn", showMiniMap && "!text-violet-400 !border-violet-500/40")}
              title="Toggle mini-map"
            >
              <MapIcon className="w-3.5 h-3.5"/>
            </button>
            <button onClick={() => setFullscreen(f => !f)} className="graph-control-btn">
              {fullscreen ? <Minimize2 className="w-3.5 h-3.5"/> : <Maximize2 className="w-3.5 h-3.5"/>}
            </button>
          </div>

          {/* Filter pills — bottom bar */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 overflow-x-auto max-w-[calc(100vw-2rem)] px-2 scrollbar-hide">
            {Object.entries(NODE_COLORS).map(([type, color]) => (
              <button key={type} onClick={() => toggleType(type)}
                className={cn("graph-filter-btn flex items-center gap-1.5 whitespace-nowrap", activeTypes.has(type) && "graph-filter-active")}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeTypes.has(type) ? color : "#555" }} />
                {NODE_TYPE_LABELS[type]}
              </button>
            ))}
          </div>

          {/* Hover tooltip */}
          <AnimatePresence>
            {hoveredNode && (
              <motion.div key={hoveredNode.id}
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                <div className="glass-card px-3 py-1.5 flex items-center gap-2 shadow-xl">
                  <span>{typeEmoji(hoveredNode.type)}</span>
                  <span className="text-xs font-semibold text-white">{hoveredNode.label}</span>
                  <span className="text-[10px] font-medium" style={{ color: NODE_COLORS[hoveredNode.type] }}>
                    {NODE_TYPE_LABELS[hoveredNode.type]}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filter badge */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
            <Filter className="w-3 h-3 text-gray-600" />
            <span className="text-[10px] text-gray-600">{activeTypes.size}/{Object.keys(NODE_COLORS).length}</span>
          </div>
        </div>

        {/* ── Detail Panel (desktop) ─────────────────────────── */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, x: 320 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 320 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="hidden md:flex flex-col w-72 border-l border-white/[0.06] bg-[#080c17] overflow-hidden flex-shrink-0"
            >
              <div className="p-4 space-y-4 overflow-y-auto flex-1 scrollbar-hide">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold text-white mb-2"
                      style={{
                        backgroundColor: (selectedNode.color ?? NODE_COLORS[selectedNode.type]) + "25",
                        border: `1px solid ${selectedNode.color ?? NODE_COLORS[selectedNode.type]}35`,
                      }}>
                      <span>{typeEmoji(selectedNode.type)}</span>
                      {NODE_TYPE_LABELS[selectedNode.type]}
                    </div>
                    <h3 className="text-sm font-bold text-white leading-snug">{selectedNode.label}</h3>
                  </div>
                  <button onClick={() => setSelectedNode(null)} className="text-gray-600 hover:text-white transition-colors mt-1 flex-shrink-0">
                    <X className="w-4 h-4"/>
                  </button>
                </div>

                {/* Divider */}
                <div className="h-px w-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${selectedNode.color ?? NODE_COLORS[selectedNode.type]}, transparent)` }} />

                {/* Description */}
                {selectedNode.description && (
                  <p className="text-xs text-gray-400 leading-relaxed">{selectedNode.description}</p>
                )}

                {/* Degree badge */}
                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 rounded-md text-[10px] font-mono bg-white/5 text-gray-500">
                    {connectedNodes.length} connections
                  </div>
                  <div className="px-2 py-1 rounded-md text-[10px] font-mono" style={{
                    backgroundColor: (selectedNode.color ?? NODE_COLORS[selectedNode.type]) + "20",
                    color: selectedNode.color ?? NODE_COLORS[selectedNode.type],
                  }}>
                    {NODE_TYPE_LABELS[selectedNode.type]}
                  </div>
                </div>

                {/* Connections list */}
                {connectedNodes.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 mb-2">
                      Linked Nodes ({connectedNodes.length})
                    </p>
                    <div className="space-y-0.5">
                      {connectedNodes.map((item, i) => {
                        if (!item) return null;
                        const { node, label, dir } = item as { node: GraphNode; label?: string; dir: string };
                        return (
                          <button key={i} onClick={() => setSelectedNode(node)}
                            className="vault-nav-item w-full text-left group">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: node.color ?? NODE_COLORS[node.type] }} />
                            <span className="flex-1 truncate text-xs group-hover:text-white transition-colors">{node.label}</span>
                            <span className="text-[10px] text-gray-700 flex-shrink-0 font-mono">{dir}</span>
                            {label && <span className="text-[9px] text-gray-700 flex-shrink-0 italic">{label}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* External link */}
                {selectedNode.url && (
                  <a href={selectedNode.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                    <ExternalLink className="w-3 h-3" /> Open resource
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Mobile Bottom Sheet ────────────────────────────── */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="md:hidden absolute bottom-0 left-0 right-0 z-20 bg-[#0d1526] border-t border-white/10 rounded-t-2xl p-4 max-h-[55vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white mb-1.5"
                    style={{
                      backgroundColor: (selectedNode.color ?? NODE_COLORS[selectedNode.type]) + "25",
                      border: `1px solid ${selectedNode.color ?? NODE_COLORS[selectedNode.type]}35`,
                    }}>
                    <span>{typeEmoji(selectedNode.type)}</span>
                    {NODE_TYPE_LABELS[selectedNode.type]}
                  </div>
                  <h3 className="text-sm font-bold text-white">{selectedNode.label}</h3>
                </div>
                <button onClick={() => setSelectedNode(null)} className="text-gray-500 hover:text-white transition-colors mt-1">
                  <X className="w-4 h-4"/>
                </button>
              </div>
              {selectedNode.description && <p className="text-xs text-gray-400 leading-relaxed mb-3">{selectedNode.description}</p>}
              {selectedNode.url && (
                <a href={selectedNode.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  <ExternalLink className="w-3 h-3" /> Open resource
                </a>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
