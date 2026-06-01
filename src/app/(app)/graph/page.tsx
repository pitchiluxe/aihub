"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { GraphNode, NewsArticle } from "@/types";
import { INITIAL_GRAPH_DATA } from "@/lib/graph-data";
import {
  Search, ZoomIn, ZoomOut, X, RefreshCw,
  Brain, Share2, Filter, ChevronDown, ChevronRight as ChevronRightIcon,
  Crosshair, ExternalLink, Maximize2, Minimize2, Map as MapIcon,
  Newspaper, Clock, Tag, FileText, Eye, ChevronLeft,
} from "lucide-react";
import * as d3 from "d3";
import { cn } from "@/lib/utils";

// ── Color maps ────────────────────────────────────────────────
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
const CATEGORY_COLORS: Record<string, string> = {
  openai: "#10a37f", anthropic: "#d97706", google: "#4285f4", meta: "#0866ff",
  microsoft: "#00a4ef", xai: "#9ca3af", mistral: "#ff7000", deepseek: "#1e3a8a",
  "open-source": "#22c55e", research: "#8b5cf6", robotics: "#06b6d4",
  startups: "#f59e0b", agents: "#ec4899", "prompt-engineering": "#6366f1", all: "#6b7280",
};
const CATEGORY_LABELS: Record<string, string> = {
  openai: "OpenAI", anthropic: "Anthropic", google: "Google AI", meta: "Meta AI",
  microsoft: "Microsoft", xai: "xAI", mistral: "Mistral AI", deepseek: "DeepSeek",
  "open-source": "Open Source", research: "Research", robotics: "Robotics",
  startups: "AI Startups", agents: "Agents", "prompt-engineering": "Prompt Eng.",
};

const MIN_ZOOM   = 0.06;
const MAX_ZOOM   = 12;
const LABEL_ZOOM = 0.80;       // labels only appear when meaningfully zoomed in
const EDGE_LABEL_ZOOM = 1.6;

// ── Helpers ───────────────────────────────────────────────────
function nodeRadius(size: number) { return Math.max(7, Math.round(size * 0.42)); }
function easeBackOut(t: number, ov = 1.8) {
  const c = ov + 1;
  return 1 + c * Math.pow(t - 1, 3) + ov * Math.pow(t - 1, 2);
}
function hexToRgba(hex: string, a: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}
function typeEmoji(type: string) {
  return ({model:"🧠",company:"🏢",research:"📄",framework:"⚙️",concept:"💡",tool:"🔧",news:"📰"} as Record<string,string>)[type]??"●";
}
function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}
function timeAgo(iso: string): string {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function formatArticleRaw(a: NewsArticle): string {
  const date = new Date(a.publishedAt).toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" });
  return [
    `## ${a.title}`,
    ``,
    `**Source:** ${a.source}  ◦  **Category:** ${(CATEGORY_LABELS[a.category] ?? a.category).toUpperCase()}`,
    a.readTime ? `**Published:** ${date}  ◦  **Read time:** ${a.readTime} min read` : `**Published:** ${date}`,
    ``,
    `---`,
    ``,
    a.summary,
    ``,
    `### Key Topics`,
    ``,
    ...a.tags.map(t => `- ${t}`),
    ``,
    `[View Original Article](${a.url})`,
  ].join("\n");
}

// ── Types ─────────────────────────────────────────────────────
interface ExtNode extends GraphNode, d3.SimulationNodeDatum {
  x?: number; y?: number; vx?: number; vy?: number;
  fx?: number | null; fy?: number | null;
}
interface Transform { x: number; y: number; k: number }

export default function GraphPage() {
  // ── Refs ──────────────────────────────────────────────────
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
  const prevTabRef    = useRef<"graph" | "articles">("graph");
  const entranceActiveRef = useRef(false);
  const entranceStartRef  = useRef(0);
  const entranceMapRef    = useRef<Map<string, { delay: number; duration: number }>>(new Map());
  const nodeAnimRef       = useRef<Map<string, { t0: number; duration: number }>>(new Map());

  // ── State ─────────────────────────────────────────────────
  const [activeTab,      setActiveTab]      = useState<"graph" | "articles">("graph");
  const [activeTypes,    setActiveTypes]    = useState<Set<string>>(new Set(Object.keys(NODE_COLORS)));
  const [selectedNode,   setSelectedNode]   = useState<GraphNode | null>(null);
  const [hoveredNode,    setHoveredNode]    = useState<GraphNode | null>(null);
  const [zoom,           setZoom]           = useState(1);
  const [search,         setSearch]         = useState("");
  const [foldersOpen,    setFoldersOpen]    = useState(true);
  const [fullscreen,     setFullscreen]     = useState(false);
  const [showMiniMap,    setShowMiniMap]    = useState(true);
  const [graphArticles,  setGraphArticles]  = useState<{id:string;title:string;summary:string;source:string}[]>([]);

  const [articles,       setArticles]       = useState<NewsArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [articleSearch,  setArticleSearch]  = useState("");
  const [articleCategory, setArticleCategory] = useState("all");
  const [readerMode,     setReaderMode]     = useState<"raw" | "preview">("raw");
  const [folderOpen,     setFolderOpen]     = useState(false);

  useEffect(() => { showMiniMapRef.current = showMiniMap; }, [showMiniMap]);
  useEffect(() => { selectedIdRef.current = selectedNode?.id ?? null; }, [selectedNode]);

  // ── Fetch articles ────────────────────────────────────────
  useEffect(() => {
    fetch("/api/news?limit=60")
      .then(r => r.json())
      .then(data => {
        const list: NewsArticle[] = Array.isArray(data) ? data : (data.articles ?? []);
        setArticles(list);
        if (list.length > 0 && !selectedArticle) setSelectedArticle(list[0]);
      })
      .catch(() => {})
      .finally(() => setArticlesLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load graph articles from sessionStorage ────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const arts = JSON.parse(sessionStorage.getItem("graph_articles") ?? "[]");
      if (Array.isArray(arts)) setGraphArticles(arts);
    } catch { /* silent */ }
  }, []);

  // ── Pause/resume loop when switching tabs ─────────────────
  const stopLoop = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  }, []);

  const typeCounts = Object.keys(NODE_COLORS).reduce<Record<string, number>>((acc, t) => {
    acc[t] = t === "news" ? graphArticles.length : INITIAL_GRAPH_DATA.nodes.filter(n => n.type === t).length;
    return acc;
  }, {});

  // ── Draw ───────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x: tx, y: ty, k } = transformRef.current;
    const nodes = nodesRef.current;
    const links = linksRef.current;
    const selId = selectedIdRef.current;
    const now   = performance.now();
    const q     = search.toLowerCase().trim();

    const entranceActive  = entranceActiveRef.current;
    const entranceElapsed = entranceActive ? now - entranceStartRef.current : Infinity;
    if (entranceActive && entranceElapsed > 1500) entranceActiveRef.current = false;
    const edgeAlpha = entranceActive ? Math.min(1, entranceElapsed / 900) : 1;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dot grid
    const gs = 28; const dr = 0.8;
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    const ox = ((tx % (gs*k)) + gs*k) % (gs*k);
    const oy = ((ty % (gs*k)) + gs*k) % (gs*k);
    for (let gx = ox-gs*k; gx < canvas.width; gx += gs*k)
      for (let gy = oy-gs*k; gy < canvas.height; gy += gs*k) {
        ctx.beginPath(); ctx.arc(gx, gy, dr, 0, Math.PI*2); ctx.fill();
      }

    ctx.save(); ctx.translate(tx, ty); ctx.scale(k, k);

    let connectedIds: Set<string> | null = null;
    if (selId) {
      connectedIds = new Set([selId]);
      for (const l of INITIAL_GRAPH_DATA.links) {
        if (l.source === selId) connectedIds.add(String(l.target));
        if (l.target === selId) connectedIds.add(String(l.source));
      }
    }

    // Cluster halos — flat tinted ring (no gradient object per frame = fast)
    if (k > 0.30) {
      const groups: Record<string, {xs:number[];ys:number[]}> = {};
      for (const n of nodes) {
        if (!groups[n.type]) groups[n.type] = {xs:[],ys:[]};
        groups[n.type].xs.push(n.x??0); groups[n.type].ys.push(n.y??0);
      }
      for (const [type, {xs, ys}] of Object.entries(groups)) {
        if (xs.length < 3) continue;
        const cx = xs.reduce((a,b)=>a+b,0)/xs.length;
        const cy = ys.reduce((a,b)=>a+b,0)/ys.length;
        const r  = Math.max(...xs.map((x,i) => Math.hypot(x-cx,ys[i]-cy))) + 30;
        const col = NODE_COLORS[type] ?? "#6366f1";
        ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);
        ctx.strokeStyle = hexToRgba(col, 0.07);
        ctx.lineWidth   = 12 / k;
        ctx.stroke();
      }
    }

    // Edges
    for (const l of links) {
      const sx=l.source.x??0, sy=l.source.y??0, ex=l.target.x??0, ey=l.target.y??0;
      const src=l.source.id as string, tgt=l.target.id as string;
      const isTouching = selId && (src===selId||tgt===selId);
      const dx=ex-sx, dy=ey-sy, len=Math.sqrt(dx*dx+dy*dy)||1;
      const cpx=(sx+ex)/2+(-dy/len)*len*0.18, cpy=(sy+ey)/2+(dx/len)*len*0.18;

      if (selId) {
        if (isTouching) {
          const sn = nodes.find(nd=>nd.id===selId);
          const col = sn?(sn.color??NODE_COLORS[sn.type]??"#8b5cf6"):"#8b5cf6";
          ctx.strokeStyle=hexToRgba(col,0.8*edgeAlpha); ctx.lineWidth=2/k;
        } else { ctx.strokeStyle=`rgba(255,255,255,${0.025*edgeAlpha})`; ctx.lineWidth=0.6/k; }
      } else { ctx.strokeStyle=`rgba(255,255,255,${0.1*edgeAlpha})`; ctx.lineWidth=0.8/k; }
      ctx.globalAlpha=1;
      ctx.beginPath(); ctx.moveTo(sx,sy); ctx.quadraticCurveTo(cpx,cpy,ex,ey); ctx.stroke();

      if (isTouching && k>0.3) {
        const sn=nodes.find(nd=>nd.id===selId);
        const col=sn?(sn.color??NODE_COLORS[sn.type]??"#8b5cf6"):"#8b5cf6";
        const tn=nodes.find(nd=>nd.id===tgt), tr=nodeRadius(tn?.size??20)+1;
        const adx=ex-cpx, ady=ey-cpy, aLen=Math.sqrt(adx*adx+ady*ady)||1;
        const ux=adx/aLen, uy=ady/aLen;
        const tipX=ex-ux*tr, tipY=ey-uy*tr, as=7/k;
        ctx.beginPath();
        ctx.moveTo(tipX,tipY);
        ctx.lineTo(tipX-ux*as+uy*as*0.45, tipY-uy*as-ux*as*0.45);
        ctx.lineTo(tipX-ux*as-uy*as*0.45, tipY-uy*as+ux*as*0.45);
        ctx.closePath(); ctx.fillStyle=hexToRgba(col,0.85); ctx.fill();
      }

      if (k>=EDGE_LABEL_ZOOM && l.label && isTouching) {
        const mx=0.25*sx+0.5*cpx+0.25*ex, my=0.25*sy+0.5*cpy+0.25*ey;
        const sn=nodes.find(nd=>nd.id===selId);
        const col=sn?(sn.color??NODE_COLORS[sn.type]??"#8b5cf6"):"#8b5cf6";
        ctx.font=`${Math.max(5,6/k)}px Inter,system-ui,sans-serif`;
        ctx.textAlign="center";
        ctx.fillStyle=hexToRgba(col,0.85); ctx.globalAlpha=0.85;
        ctx.fillText(l.label,mx,my-3/k); ctx.globalAlpha=1;
      }
    }

    // Nodes
    for (const node of nodes) {
      const nx=node.x??0, ny=node.y??0, r=nodeRadius(node.size??20);
      const col=node.color??NODE_COLORS[node.type]??"#6366f1";
      const isSel=node.id===selId, isConn=connectedIds?connectedIds.has(node.id):true;
      const matchQ=!q||node.label.toLowerCase().includes(q)||(node.description??"").toLowerCase().includes(q);
      if (q&&!matchQ) { ctx.globalAlpha=0.04; }

      let animScale=1;
      if (entranceActive) {
        const info=entranceMapRef.current.get(node.id);
        if (info) { const el=entranceElapsed-info.delay; if(el<0) animScale=0; else if(el<info.duration) animScale=Math.max(0,easeBackOut(el/info.duration)); }
      }
      const anim=nodeAnimRef.current.get(node.id);
      if (anim) { const el=now-anim.t0; if(el<anim.duration) animScale=Math.max(0,easeBackOut(el/anim.duration)); else nodeAnimRef.current.delete(node.id); }

      const drawR=r*animScale;
      if (drawR<=0) { ctx.globalAlpha=1; continue; }
      const fillA=isSel?1:isConn?0.88:0.12, strokeA=isSel?1:isConn?0.5:0.07;
      const realR=isSel?drawR*1.35:drawR;

      if (isSel) { ctx.shadowColor=col; ctx.shadowBlur=20; }
      // Flat fill (fast — no gradient object created per frame)
      ctx.beginPath(); ctx.arc(nx,ny,realR,0,Math.PI*2);
      ctx.fillStyle=hexToRgba(col,fillA); ctx.fill();
      // Inner highlight dot for subtle depth
      if (realR > 5) {
        ctx.beginPath(); ctx.arc(nx-realR*0.28,ny-realR*0.28,realR*0.22,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,255,255,${fillA*0.22})`; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(nx,ny,realR,0,Math.PI*2);
      ctx.strokeStyle=hexToRgba(col,strokeA); ctx.lineWidth=(isSel?2.5:1.2)/k; ctx.stroke();
      if (isSel) ctx.shadowBlur=0;

      if (isSel) {
        const pulse=0.5+0.5*Math.sin(now*0.003);
        ctx.beginPath(); ctx.arc(nx,ny,realR+(6+pulse*5)/k,0,Math.PI*2);
        ctx.strokeStyle=hexToRgba(col,0.3+pulse*0.2); ctx.lineWidth=1.5/k; ctx.stroke();
      }
      if (hoveredRef.current?.id===node.id&&!selId) {
        ctx.beginPath(); ctx.arc(nx,ny,drawR+6/k,0,Math.PI*2);
        ctx.strokeStyle=hexToRgba(col,0.6); ctx.lineWidth=1.5/k; ctx.stroke();
      }
      ctx.globalAlpha=1;
    }

    if (k>=LABEL_ZOOM) {
      const fSize = Math.max(7, Math.min(13, 10/k));
      ctx.font=`500 ${fSize}px Inter,system-ui,sans-serif`; ctx.textAlign="center";
      for (const node of nodes) {
        const r=nodeRadius(node.size??20);
        // Skip labels for nodes that appear too small on screen
        if (r*k < 6 && node.id !== selId) continue;
        const isConn=connectedIds?connectedIds.has(node.id):true;
        if (selId&&!isConn) continue;
        const matchQ=!q||node.label.toLowerCase().includes(q);
        ctx.globalAlpha=q&&!matchQ?0.04:(node.id===selId?1:isConn?0.80:0.28);
        const lbl=node.label.length>22?node.label.slice(0,22)+"…":node.label;
        // Text shadow for readability
        ctx.fillStyle="rgba(0,0,0,0.6)";
        ctx.fillText(lbl,(node.x??0)+0.5,(node.y??0)+r+13/k+0.5);
        ctx.fillStyle=node.id===selId?"#ffffff":"#e2e8f0";
        ctx.fillText(lbl,node.x??0,(node.y??0)+r+13/k);
        ctx.globalAlpha=1;
      }
    }

    ctx.restore();

    // Mini-map
    if (showMiniMapRef.current && nodes.length>0) {
      const MW=160, MH=100, MP=6, MR=6;
      const MX=canvas.width-MW-12, MY=canvas.height-MH-12;
      const allXs=nodes.map(n=>n.x??0), allYs=nodes.map(n=>n.y??0);
      const mnX=Math.min(...allXs), mxX=Math.max(...allXs);
      const mnY=Math.min(...allYs), mxY=Math.max(...allYs);
      const dW=mxX-mnX||1, dH=mxY-mnY||1;
      const mmS=Math.min((MW-MP*2)/dW,(MH-MP*2)/dH);
      const mmOX=MX+MP+(MW-MP*2-dW*mmS)/2, mmOY=MY+MP+(MH-MP*2-dH*mmS)/2;
      roundRectPath(ctx,MX,MY,MW,MH,MR);
      ctx.fillStyle="rgba(8,13,24,0.88)"; ctx.fill();
      ctx.strokeStyle="rgba(255,255,255,0.08)"; ctx.lineWidth=1; ctx.stroke();
      // Skip per-edge lines in mini-map (too expensive with 400+ links); dots suffice
      ctx.globalAlpha=1;
      for (const node of nodes) {
        const nx=mmOX+((node.x??0)-mnX)*mmS, ny=mmOY+((node.y??0)-mnY)*mmS;
        const col=node.color??NODE_COLORS[node.type]??"#6366f1";
        ctx.beginPath(); ctx.arc(nx,ny,node.id===selectedIdRef.current?2:Math.max(1.2,(node.size??20)*0.045),0,Math.PI*2);
        ctx.fillStyle=col; ctx.globalAlpha=node.id===selectedIdRef.current?1:0.72; ctx.fill(); ctx.globalAlpha=1;
      }
      const {x:vx,y:vy,k:vk}=transformRef.current;
      const vpX=mmOX+(-vx/vk-mnX)*mmS, vpY=mmOY+(-vy/vk-mnY)*mmS;
      const vpW=(canvas.width/vk)*mmS, vpH=(canvas.height/vk)*mmS;
      ctx.strokeStyle="rgba(139,92,246,0.75)"; ctx.lineWidth=1;
      roundRectPath(ctx,vpX,vpY,vpW,vpH,2); ctx.stroke();
      ctx.font="9px Inter,system-ui,sans-serif"; ctx.fillStyle="rgba(255,255,255,0.3)"; ctx.textAlign="left";
      ctx.fillText("OVERVIEW",MX+6,MY+10);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, showMiniMap]);

  // ── Loop — adaptive framerate: 60fps while active, ~20fps when settled ──
  const startLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    let lastTs = 0;
    const loop = (ts: number) => {
      const alpha = simRef.current?.alpha() ?? 0;
      const hasHover = !!hoveredRef.current;
      const hasSel   = !!selectedIdRef.current;
      const active   = entranceActiveRef.current;
      // Throttle to ~20fps when sim settled and no active interaction
      if (!active && alpha < 0.004 && !hasHover && !hasSel && ts - lastTs < 48) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      lastTs = ts;
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [draw]);

  // ── Hit detection ─────────────────────────────────────────
  const getNodeAt = useCallback((cx: number, cy: number): ExtNode | null => {
    const canvas=canvasRef.current; if(!canvas) return null;
    const rect=canvas.getBoundingClientRect();
    const {x:tx,y:ty,k}=transformRef.current;
    const gx=(cx-rect.left-tx)/k, gy=(cy-rect.top-ty)/k;
    for (let i=nodesRef.current.length-1;i>=0;i--) {
      const n=nodesRef.current[i], r=nodeRadius(n.size??20)+4;
      const dx=(n.x??0)-gx, dy=(n.y??0)-gy;
      if (dx*dx+dy*dy<=r*r) return n;
    }
    return null;
  }, []);

  // ── Build graph ────────────────────────────────────────────
  const buildGraph = useCallback(() => {
    const canvas=canvasRef.current, container=containerRef.current;
    if (!canvas||!container) return;
    stopLoop();
    simRef.current?.stop();
    setSelectedNode(null); selectedIdRef.current=null;
    nodeAnimRef.current=new Map(); draggingRef.current=null; hoveredRef.current=null; setHoveredNode(null);

    const W=container.clientWidth||window.innerWidth, H=container.clientHeight||window.innerHeight;
    canvas.width=W; canvas.height=H;

    let allNodes=[...INITIAL_GRAPH_DATA.nodes];
    let allLinks=[...INITIAL_GRAPH_DATA.links];
    if (graphArticles.length>0) {
      allNodes=allNodes.filter(n=>n.type!=="news");
      graphArticles.forEach(a => {
        allNodes.push({id:a.id,label:a.title,type:"news",description:a.summary,size:18,color:"#ec4899"});
        const kw=a.source.toLowerCase();
        const rel=allNodes.find(n=>n.type==="company"&&n.label.toLowerCase().includes(kw.split(" ")[0]));
        if (rel) allLinks.push({source:a.id,target:rel.id,label:"mentions"});
      });
    }

    const visNodes:ExtNode[]=allNodes.filter(n=>activeTypes.has(n.type)).map(n=>({...n}));
    const visIds=new Set(visNodes.map(n=>n.id));
    const visLinks=allLinks.filter(l=>visIds.has(String(l.source))&&visIds.has(String(l.target))).map(l=>({...l}));
    const n=visNodes.length;

    const typeCentroids:Record<string,{x:number;y:number}>={
      company:{x:W*0.50,y:H*0.40},model:{x:W*0.70,y:H*0.35},concept:{x:W*0.50,y:H*0.65},
      framework:{x:W*0.30,y:H*0.60},research:{x:W*0.75,y:H*0.65},tool:{x:W*0.25,y:H*0.35},news:{x:W*0.50,y:H*0.20},
    };

    const sim=d3.forceSimulation<ExtNode>(visNodes)
      .alphaDecay(0.038).velocityDecay(0.44)
      .force("link",d3.forceLink(visLinks).id((d:unknown)=>(d as ExtNode).id).distance(Math.max(55,Math.min(110,55+n*0.22))).strength(0.45))
      .force("charge",d3.forceManyBody().strength(-Math.max(80,Math.min(320,300-n*0.5))).distanceMax(400))
      .force("center",d3.forceCenter(W/2,H/2).strength(0.04))
      .force("collision",d3.forceCollide().radius((d:unknown)=>nodeRadius((d as ExtNode).size??20)+5).strength(0.75))
      .force("cluster",(alpha:number)=>{
        for (const nd of visNodes) {
          const c=typeCentroids[nd.type]; if(!c) continue;
          nd.vx=(nd.vx??0)+(c.x-(nd.x??W/2))*0.0025*alpha;
          nd.vy=(nd.vy??0)+(c.y-(nd.y??H/2))*0.0025*alpha;
        }
      });

    simRef.current=sim; nodesRef.current=visNodes;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    linksRef.current=(sim.force("link") as any).links();

    const ticks=Math.min(140,Math.max(50,n));
    for (let i=0;i<ticks;i++) sim.tick();

    const xs=visNodes.map(nd=>nd.x??0), ys=visNodes.map(nd=>nd.y??0), pad=70;
    const fitK=Math.min((W-pad*2)/Math.max(Math.max(...xs)-Math.min(...xs),1),(H-pad*2)/Math.max(Math.max(...ys)-Math.min(...ys),1),2.2);
    transformRef.current={k:fitK,x:W/2-fitK*(Math.min(...xs)+Math.max(...xs))/2,y:H/2-fitK*(Math.min(...ys)+Math.max(...ys))/2};
    setZoom(fitK);

    const linkCount:Record<string,number>={};
    for (const l of INITIAL_GRAPH_DATA.links) {
      linkCount[String(l.source)]=(linkCount[String(l.source)]??0)+1;
      linkCount[String(l.target)]=(linkCount[String(l.target)]??0)+1;
    }
    const sorted=[...visNodes].sort((a,b)=>(linkCount[b.id]??0)-(linkCount[a.id]??0));
    const eMap=new Map<string,{delay:number;duration:number}>();
    sorted.forEach((nd,i)=>{ const p=i/sorted.length; eMap.set(nd.id,p<0.15?{delay:0,duration:520}:p<0.45?{delay:200,duration:430}:{delay:460,duration:360}); });
    entranceMapRef.current=eMap; entranceStartRef.current=performance.now(); entranceActiveRef.current=true;

    let isPanning=false, panStart={x:0,y:0}, panStartTx={x:0,y:0,k:1}, mouseDownPos={x:0,y:0}, didDrag=false;

    const onMouseDown=(e:MouseEvent)=>{ if(e.button!==0) return; mouseDownPos={x:e.clientX,y:e.clientY}; didDrag=false; const node=getNodeAt(e.clientX,e.clientY); if(node){draggingRef.current=node;node.fx=node.x;node.fy=node.y;sim.alphaTarget(0.5).restart();}else{isPanning=true;panStart={x:e.clientX,y:e.clientY};panStartTx={...transformRef.current};} };
    const onMouseMove=(e:MouseEvent)=>{ const ddx=e.clientX-mouseDownPos.x,ddy=e.clientY-mouseDownPos.y; if(Math.sqrt(ddx*ddx+ddy*ddy)>3) didDrag=true; if(draggingRef.current){const rect=canvas.getBoundingClientRect();const{x:tx2,y:ty2,k}=transformRef.current;draggingRef.current.fx=(e.clientX-rect.left-tx2)/k;draggingRef.current.fy=(e.clientY-rect.top-ty2)/k;}else if(isPanning){transformRef.current={k:panStartTx.k,x:panStartTx.x+(e.clientX-panStart.x),y:panStartTx.y+(e.clientY-panStart.y)};}else{const node=getNodeAt(e.clientX,e.clientY);if(node!==hoveredRef.current){hoveredRef.current=node;setHoveredNode(node);}} };
    const onMouseUp=()=>{ if(draggingRef.current){draggingRef.current.fx=null;draggingRef.current.fy=null;sim.alphaTarget(0.08);setTimeout(()=>simRef.current?.alphaTarget(0),500);draggingRef.current=null;}isPanning=false; };
    const onClick=(e:MouseEvent)=>{ if(didDrag) return; const node=getNodeAt(e.clientX,e.clientY); if(node){setSelectedNode(prev=>{const next=prev?.id===node.id?null:(node as GraphNode);selectedIdRef.current=next?.id??null;return next;});}else{setSelectedNode(null);selectedIdRef.current=null;} };
    const onWheel=(e:WheelEvent)=>{ e.preventDefault();
      const rect=canvas.getBoundingClientRect();
      const mx=e.clientX-rect.left, my=e.clientY-rect.top;
      // Normalize across deltaMode: 0=pixels, 1=lines, 2=pages
      const raw = e.deltaMode===1 ? e.deltaY*20 : e.deltaMode===2 ? e.deltaY*300 : e.deltaY;
      // clamp to avoid jumps from high-resolution trackpads
      const clamped = Math.max(-120, Math.min(120, raw));
      const factor = clamped > 0 ? 0.86 : 1.16;
      const{x:tx2,y:ty2,k}=transformRef.current;
      const newK=Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,k*factor));
      transformRef.current={k:newK,x:mx-(mx-tx2)*(newK/k),y:my-(my-ty2)*(newK/k)};
      setZoom(newK);
    };

    let lastTD=0;
    const onTouchStart=(e:TouchEvent)=>{ if(e.touches.length===2){const[a,b]=[e.touches[0],e.touches[1]];lastTD=Math.hypot(b.clientX-a.clientX,b.clientY-a.clientY);}else if(e.touches.length===1){isPanning=true;panStart={x:e.touches[0].clientX,y:e.touches[0].clientY};panStartTx={...transformRef.current};didDrag=false;mouseDownPos={x:e.touches[0].clientX,y:e.touches[0].clientY};} };
    const onTouchMove=(e:TouchEvent)=>{ e.preventDefault(); if(e.touches.length===2){const[a,b]=[e.touches[0],e.touches[1]];const dist=Math.hypot(b.clientX-a.clientX,b.clientY-a.clientY),factor=dist/Math.max(lastTD,1),mid={x:(a.clientX+b.clientX)/2,y:(a.clientY+b.clientY)/2};const rect=canvas.getBoundingClientRect();const mx=mid.x-rect.left,my=mid.y-rect.top;const{x:tx2,y:ty2,k}=transformRef.current;const newK=Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,k*factor));transformRef.current={k:newK,x:mx-(mx-tx2)*(newK/k),y:my-(my-ty2)*(newK/k)};setZoom(newK);lastTD=dist;}else if(e.touches.length===1&&isPanning){const dx=e.touches[0].clientX-panStart.x,dy=e.touches[0].clientY-panStart.y;if(Math.sqrt(dx*dx+dy*dy)>3)didDrag=true;transformRef.current={k:panStartTx.k,x:panStartTx.x+dx,y:panStartTx.y+dy};} };
    const onTouchEnd=()=>{ isPanning=false; };
    const onLeave=()=>{ hoveredRef.current=null; setHoveredNode(null); };

    canvas.addEventListener("mousedown",onMouseDown);
    canvas.addEventListener("mousemove",onMouseMove);
    canvas.addEventListener("mouseup",onMouseUp);
    canvas.addEventListener("mouseleave",onLeave);
    canvas.addEventListener("click",onClick);
    canvas.addEventListener("wheel",onWheel,{passive:false});
    canvas.addEventListener("touchstart",onTouchStart,{passive:false});
    canvas.addEventListener("touchmove",onTouchMove,{passive:false});
    canvas.addEventListener("touchend",onTouchEnd);
    startLoop();

    return () => {
      stopLoop(); sim.stop();
      canvas.removeEventListener("mousedown",onMouseDown);
      canvas.removeEventListener("mousemove",onMouseMove);
      canvas.removeEventListener("mouseup",onMouseUp);
      canvas.removeEventListener("mouseleave",onLeave);
      canvas.removeEventListener("click",onClick);
      canvas.removeEventListener("wheel",onWheel);
      canvas.removeEventListener("touchstart",onTouchStart);
      canvas.removeEventListener("touchmove",onTouchMove);
      canvas.removeEventListener("touchend",onTouchEnd);
    };
  }, [activeTypes, getNodeAt, startLoop, stopLoop, graphArticles]);

  useEffect(() => { const cleanup=buildGraph(); return cleanup; }, [buildGraph]);

  // Pause/resume when switching tabs
  useEffect(() => {
    if (activeTab==="graph" && prevTabRef.current==="articles") {
      requestAnimationFrame(() => {
        const c=canvasRef.current, ct=containerRef.current;
        if (c&&ct) { c.width=ct.clientWidth; c.height=ct.clientHeight; }
        startLoop();
        simRef.current?.alpha(0.1).restart();
      });
    } else if (activeTab==="articles") {
      stopLoop();
    }
    prevTabRef.current=activeTab;
  }, [activeTab, startLoop, stopLoop]);

  // Resize canvas + refit graph whenever the container grows/shrinks
  useEffect(() => {
    const ct=containerRef.current, cv=canvasRef.current; if(!ct||!cv) return;
    const ro=new ResizeObserver(()=>{
      if (activeTab!=="graph") return;
      const W=ct.clientWidth, H=ct.clientHeight;
      if (!W||!H) return;
      cv.width=W; cv.height=H;
      // Re-centre simulation forces
      simRef.current?.force("center", d3.forceCenter(W/2,H/2).strength(0.04));
      simRef.current?.alpha(0.08).restart();
      // Refit view after a short settle
      setTimeout(()=>{
        const nds=nodesRef.current; if(!nds.length) return;
        const xs=nds.map(n=>n.x??0), ys=nds.map(n=>n.y??0), pad=70;
        const fk=Math.min((W-pad*2)/Math.max(Math.max(...xs)-Math.min(...xs),1),(H-pad*2)/Math.max(Math.max(...ys)-Math.min(...ys),1),2.2);
        transformRef.current={k:fk,x:W/2-fk*(Math.min(...xs)+Math.max(...xs))/2,y:H/2-fk*(Math.min(...ys)+Math.max(...ys))/2};
        setZoom(fk);
      }, 300);
    });
    ro.observe(ct); return ()=>ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ── Zoom ──────────────────────────────────────────────────
  const doZoom=(factor:number)=>{ const cv=canvasRef.current; if(!cv) return; const{x,y,k}=transformRef.current; const nk=Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,k*factor)); const cx=cv.width/2,cy=cv.height/2; transformRef.current={k:nk,x:cx-(cx-x)*(nk/k),y:cy-(cy-y)*(nk/k)}; setZoom(nk); };
  const doZoomFit=()=>{ const cv=canvasRef.current, ct=containerRef.current, nds=nodesRef.current; if(!cv||!ct||!nds.length) return; const xs=nds.map(n=>n.x??0),ys=nds.map(n=>n.y??0),pad=70; const fk=Math.min((cv.width-pad*2)/Math.max(Math.max(...xs)-Math.min(...xs),1),(cv.height-pad*2)/Math.max(Math.max(...ys)-Math.min(...ys),1),2.2); transformRef.current={k:fk,x:cv.width/2-fk*(Math.min(...xs)+Math.max(...xs))/2,y:cv.height/2-fk*(Math.min(...ys)+Math.max(...ys))/2}; setZoom(fk); };
  const toggleType=(t:string)=>setActiveTypes(prev=>{ const n=new Set(prev); n.has(t)?n.delete(t):n.add(t); return n; });

  const connectedLinks=selectedNode?INITIAL_GRAPH_DATA.links.filter(l=>l.source===selectedNode.id||l.target===selectedNode.id):[];
  const connectedNodes=connectedLinks.map(l=>{ const oid=l.source===selectedNode?.id?l.target:l.source; const n=INITIAL_GRAPH_DATA.nodes.find(nd=>nd.id===oid); return n?{node:n,label:l.label,dir:l.source===selectedNode?.id?"→":"←"}:null; }).filter(Boolean);

  // ── Articles helpers ──────────────────────────────────────
  const filteredArticles = articles.filter(a => {
    const matchCat = articleCategory==="all" || a.category===articleCategory;
    const matchQ   = !articleSearch || a.title.toLowerCase().includes(articleSearch.toLowerCase()) || a.source.toLowerCase().includes(articleSearch.toLowerCase());
    return matchCat && matchQ;
  });

  const articlesByCategory = articles.reduce<Record<string,number>>((acc,a) => {
    acc[a.category]=(acc[a.category]??0)+1; return acc;
  }, {});

  const openArticle = (a: NewsArticle) => {
    setSelectedArticle(a);
    setActiveTab("articles");
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className={cn("flex flex-col h-screen bg-[#07090f]", fullscreen&&"fixed inset-0 z-50")}>
      <TopBar title="AI Brain" description="Obsidian-style knowledge graph + AI news reader" />

      <div className="flex flex-1 overflow-hidden">

        {/* ── Column 1: Nav Sidebar ─────────────────────────── */}
        <aside className="hidden md:flex w-52 flex-shrink-0 bg-[#080c17] border-r border-white/[0.06] flex-col h-full overflow-hidden">
          <div className="px-3 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-xs font-bold text-white leading-none">AI Brain</div>
                <div className="text-[10px] text-gray-600 leading-none mt-0.5">
                  {articles.length} notes · {INITIAL_GRAPH_DATA.links.length} edges
                </div>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
              <input
                type="text"
                placeholder={activeTab==="articles"?"Search notes…":"Search nodes…"}
                value={activeTab==="articles"?articleSearch:search}
                onChange={e=>activeTab==="articles"?setArticleSearch(e.target.value):setSearch(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-7 pr-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 scrollbar-hide">
            {/* ── Views ───────────────────────────────────── */}
            <div className="pb-1">
              <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider px-1">Views</span>
            </div>

            {/* Articles tab */}
            <button onClick={()=>setActiveTab("articles")}
              className={cn("vault-nav-item w-full", activeTab==="articles"&&"vault-nav-active")}>
              <Newspaper className="w-3.5 h-3.5 flex-shrink-0 text-pink-400" />
              <span className="flex-1 text-left">Articles</span>
              <span className={cn("text-[10px] px-1 rounded font-mono", activeTab==="articles"?"bg-pink-500/20 text-pink-400":"text-gray-600")}>
                {articles.length}
              </span>
            </button>

            {/* Graph View tab */}
            <button onClick={()=>setActiveTab("graph")}
              className={cn("vault-nav-item w-full", activeTab==="graph"&&"vault-nav-active")}>
              <Share2 className="w-3.5 h-3.5 flex-shrink-0 text-violet-400" />
              <span className="flex-1 text-left">Graph View</span>
              <span className={cn("text-[10px] px-1 rounded font-mono", activeTab==="graph"?"bg-violet-500/20 text-violet-400":"text-gray-600")}>D3</span>
            </button>

            {/* ── Folders ─────────────────────────────────── */}
            <div className="pt-3 pb-1">
              <button onClick={()=>setFolderOpen(f=>!f)}
                className="flex items-center gap-1 text-[10px] font-semibold text-gray-600 uppercase tracking-wider w-full hover:text-gray-400 px-1 transition-colors">
                {folderOpen?<ChevronDown className="w-3 h-3"/>:<ChevronRightIcon className="w-3 h-3"/>}
                {activeTab==="articles"?"Categories":"Node Types"}
              </button>
            </div>

            {activeTab==="articles" ? (
              folderOpen && Object.entries(articlesByCategory)
                .sort((a,b)=>b[1]-a[1])
                .map(([cat, count]) => (
                  <button key={cat}
                    onClick={()=>setArticleCategory(prev=>prev===cat?"all":cat)}
                    className={cn("vault-nav-item w-full", articleCategory===cat&&"vault-nav-active")}>
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{backgroundColor: articleCategory===cat?(CATEGORY_COLORS[cat]??"#6b7280"):"#2a2a3a"}} />
                    <span className="flex-1 text-left truncate text-xs">{CATEGORY_LABELS[cat]??cat}</span>
                    <span className="text-[10px] tabular-nums text-gray-600">{count}</span>
                  </button>
                ))
            ) : (
              folderOpen && Object.entries(NODE_COLORS).map(([type, color]) => (
                <button key={type} onClick={()=>toggleType(type)}
                  className={cn("vault-nav-item w-full", activeTypes.has(type)&&"vault-nav-active")}>
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors"
                    style={{backgroundColor:activeTypes.has(type)?color:"#2a2a3a"}} />
                  <span className="flex-1 text-left truncate">{NODE_TYPE_LABELS[type]}</span>
                  <span className={cn("text-[10px] tabular-nums", activeTypes.has(type)?"text-gray-500":"text-gray-700 line-through")}>
                    {typeCounts[type]}
                  </span>
                </button>
              ))
            )}

            {/* ── Stats (graph mode) ──────────────────────── */}
            {activeTab==="graph" && <>
              <div className="pt-3 pb-1">
                <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider px-1">Stats</span>
              </div>
              <div className="glass-card p-2.5 mx-0.5 space-y-1.5">
                {([
                  ["Active nodes", INITIAL_GRAPH_DATA.nodes.filter(n=>activeTypes.has(n.type)).length],
                  ["Connections",  INITIAL_GRAPH_DATA.links.length],
                  ["Types", activeTypes.size],
                  ["Zoom", `${Math.round(zoom*100)}%`],
                ] as [string,string|number][]).map(([kk,vv])=>(
                  <div key={kk} className="flex justify-between text-[11px]">
                    <span className="text-gray-600">{kk}</span>
                    <span className={typeof vv==="string"&&vv.includes("%")?"text-violet-400 font-mono":"text-white font-medium"}>{vv}</span>
                  </div>
                ))}
              </div>
              <div className="pt-3 pb-1">
                <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider px-1">Controls</span>
              </div>
              <div className="px-1 space-y-1">
                {[["Click","Select node"],["Drag","Move node"],["Scroll","Zoom"],["Pinch","Zoom (touch)"]].map(([k2,v2])=>(
                  <div key={k2} className="flex justify-between text-[10px]">
                    <kbd className="text-gray-600 font-mono">{k2}</kbd>
                    <span className="text-gray-700">{v2}</span>
                  </div>
                ))}
              </div>
            </>}
          </nav>
        </aside>

        {/* ── Column 2: Articles Notes List ────────────────── */}
        <AnimatePresence>
          {activeTab==="articles" && (
            <motion.div
              initial={{width:0,opacity:0}} animate={{width:260,opacity:1}} exit={{width:0,opacity:0}}
              transition={{type:"spring",stiffness:300,damping:28}}
              className="hidden md:flex flex-col flex-shrink-0 bg-[#09101e] border-r border-white/[0.05] overflow-hidden"
              style={{width:260}}
            >
              {/* Header */}
              <div className="px-3 py-2.5 border-b border-white/[0.05] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white">All Notes</span>
                  <span className="ml-1.5 text-[10px] text-gray-600">{filteredArticles.length}</span>
                </div>
                {articleCategory!=="all" && (
                  <button onClick={()=>setArticleCategory("all")} className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-white transition-colors">
                    <ChevronLeft className="w-3 h-3" /> All
                  </button>
                )}
              </div>

              {/* Articles list */}
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {articlesLoading ? (
                  <div className="p-4 space-y-3">
                    {[...Array(8)].map((_,i)=>(
                      <div key={i} className="space-y-1.5 animate-pulse">
                        <div className="h-3 bg-white/5 rounded w-4/5" />
                        <div className="h-2 bg-white/3 rounded w-1/2" />
                        <div className="h-2 bg-white/3 rounded w-3/4" />
                      </div>
                    ))}
                  </div>
                ) : filteredArticles.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-600">No articles found</div>
                ) : (
                  filteredArticles.map(a => (
                    <button
                      key={a.id}
                      onClick={()=>openArticle(a)}
                      onDoubleClick={()=>openArticle(a)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 border-b border-white/[0.04] hover:bg-white/[0.04] transition-colors group",
                        selectedArticle?.id===a.id && "bg-white/[0.06] border-l-2 border-l-violet-500"
                      )}
                    >
                      <div className="flex items-start gap-2 mb-1">
                        <Newspaper className="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-600 group-hover:text-pink-400 transition-colors" />
                        <p className="text-xs font-medium text-gray-200 leading-snug line-clamp-2 flex-1">
                          {a.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1 pl-5">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{backgroundColor:(CATEGORY_COLORS[a.category]??"#6b7280")+"20", color:CATEGORY_COLORS[a.category]??"#6b7280"}}>
                          {CATEGORY_LABELS[a.category]??a.category}
                        </span>
                        {a.readTime && <span className="text-[10px] text-gray-600 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5"/>{a.readTime}m</span>}
                      </div>
                      <div className="flex items-center gap-1.5 pl-5">
                        {a.tags.slice(0,2).map(tag=>(
                          <span key={tag} className="flex items-center gap-0.5 text-[9px] text-gray-600">
                            <Tag className="w-2 h-2"/>
                            {tag.slice(0,12)}
                          </span>
                        ))}
                        <span className="ml-auto text-[9px] text-gray-700">{timeAgo(a.publishedAt)}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Column 3a: Graph Canvas (always mounted) ──────── */}
        <div
          ref={containerRef}
          className={cn("flex-1 relative overflow-hidden", activeTab!=="graph"&&"hidden")}
        >
          <canvas ref={canvasRef} className="w-full h-full" style={{cursor:"default"}} />

          <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
            <button onClick={()=>doZoom(1.4)} className="graph-control-btn"><ZoomIn className="w-3.5 h-3.5"/></button>
            <button onClick={()=>doZoom(0.7)} className="graph-control-btn"><ZoomOut className="w-3.5 h-3.5"/></button>
            <button onClick={doZoomFit} className="graph-control-btn" title="Fit"><Crosshair className="w-3.5 h-3.5"/></button>
            <button onClick={()=>buildGraph()} className="graph-control-btn"><RefreshCw className="w-3.5 h-3.5"/></button>
            <button onClick={()=>setShowMiniMap(m=>!m)} className={cn("graph-control-btn",showMiniMap&&"!text-violet-400 !border-violet-500/40")}><MapIcon className="w-3.5 h-3.5"/></button>
            <button onClick={()=>setFullscreen(f=>!f)} className="graph-control-btn">{fullscreen?<Minimize2 className="w-3.5 h-3.5"/>:<Maximize2 className="w-3.5 h-3.5"/>}</button>
          </div>

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 overflow-x-auto max-w-[calc(100vw-2rem)] px-2 scrollbar-hide">
            {Object.entries(NODE_COLORS).map(([type,color])=>(
              <button key={type} onClick={()=>toggleType(type)}
                className={cn("graph-filter-btn flex items-center gap-1.5 whitespace-nowrap",activeTypes.has(type)&&"graph-filter-active")}>
                <span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor:activeTypes.has(type)?color:"#555"}}/>
                {NODE_TYPE_LABELS[type]}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {hoveredNode && (
              <motion.div key={hoveredNode.id} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                <div className="glass-card px-3 py-1.5 flex items-center gap-2 shadow-xl">
                  <span>{typeEmoji(hoveredNode.type)}</span>
                  <span className="text-xs font-semibold text-white">{hoveredNode.label}</span>
                  <span className="text-[10px] font-medium" style={{color:NODE_COLORS[hoveredNode.type]}}>{NODE_TYPE_LABELS[hoveredNode.type]}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
            <Filter className="w-3 h-3 text-gray-600"/>
            <span className="text-[10px] text-gray-600">{activeTypes.size}/{Object.keys(NODE_COLORS).length}</span>
          </div>
        </div>

        {/* ── Column 3b: Article Reader ─────────────────────── */}
        {activeTab==="articles" && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Raw text (monospace editor style) */}
            <div className="flex-1 overflow-y-auto bg-[#070b15] border-r border-white/[0.05] scrollbar-hide">
              <div className="sticky top-0 z-10 px-4 py-2 bg-[#070b15] border-b border-white/[0.05] flex items-center gap-2">
                <button onClick={()=>setReaderMode("raw")} className={cn("flex items-center gap-1 text-[10px] px-2 py-1 rounded transition-colors", readerMode==="raw"?"bg-violet-500/20 text-violet-400":"text-gray-600 hover:text-gray-400")}>
                  <FileText className="w-3 h-3"/>Raw
                </button>
                <button onClick={()=>setReaderMode("preview")} className={cn("flex items-center gap-1 text-[10px] px-2 py-1 rounded transition-colors", readerMode==="preview"?"bg-violet-500/20 text-violet-400":"text-gray-600 hover:text-gray-400")}>
                  <Eye className="w-3 h-3"/>Preview
                </button>
                {selectedArticle && (
                  <span className="ml-auto text-[10px] text-gray-700 truncate max-w-32">{selectedArticle.source}</span>
                )}
              </div>
              <div className="p-6">
                {!selectedArticle ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <Newspaper className="w-8 h-8 text-gray-700 mb-3"/>
                    <p className="text-sm text-gray-600">Select an article from the notes panel</p>
                    <p className="text-xs text-gray-700 mt-1">or double-click any article in the list</p>
                  </div>
                ) : (
                  <pre className="obsidian-editor text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                    {formatArticleRaw(selectedArticle)}
                  </pre>
                )}
              </div>
            </div>

            {/* Right: Rendered preview */}
            <div className="flex-1 overflow-y-auto bg-[#0a0f1e] scrollbar-hide">
              <div className="sticky top-0 z-10 px-4 py-2 bg-[#0a0f1e] border-b border-white/[0.05]">
                <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Rendered Preview</span>
              </div>
              <div className="p-6">
                {selectedArticle ? (
                  <div className="space-y-4 max-w-lg">
                    {/* Category badge */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{backgroundColor:(CATEGORY_COLORS[selectedArticle.category]??"#6b7280")+"20",color:CATEGORY_COLORS[selectedArticle.category]??"#6b7280",border:`1px solid ${CATEGORY_COLORS[selectedArticle.category]??"#6b7280"}30`}}>
                      <Newspaper className="w-3 h-3"/>
                      {(CATEGORY_LABELS[selectedArticle.category]??selectedArticle.category).toUpperCase()}
                    </div>

                    {/* Title */}
                    <h1 className="text-lg font-bold text-white leading-snug">{selectedArticle.title}</h1>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                      <span className="font-medium text-gray-400">{selectedArticle.source}</span>
                      <span>◦</span>
                      <span>{new Date(selectedArticle.publishedAt).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</span>
                      {selectedArticle.readTime && <>
                        <span>◦</span>
                        <span className="flex items-center gap-0.5"><Clock className="w-3 h-3"/>{selectedArticle.readTime} min</span>
                      </>}
                    </div>

                    {/* Divider gradient */}
                    <div className="h-px rounded-full" style={{background:`linear-gradient(90deg, ${CATEGORY_COLORS[selectedArticle.category]??"#6b7280"}, transparent)`}} />

                    {/* Summary */}
                    <p className="text-sm text-gray-300 leading-relaxed">{selectedArticle.summary}</p>

                    {/* Key Topics */}
                    {selectedArticle.tags.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Key Topics</h3>
                        <ul className="space-y-1.5">
                          {selectedArticle.tags.map(tag=>(
                            <li key={tag} className="flex items-center gap-2 text-sm text-gray-300">
                              <span className="w-1 h-1 rounded-full bg-violet-400 flex-shrink-0"/>
                              {tag}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Tags pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {selectedArticle.tags.slice(0,6).map(tag=>(
                        <span key={tag} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-500 border border-white/5">
                          <Tag className="w-2.5 h-2.5"/>{tag}
                        </span>
                      ))}
                    </div>

                    {/* View original CTA */}
                    <a href={selectedArticle.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
                      style={{backgroundColor:(CATEGORY_COLORS[selectedArticle.category]??"#6366f1")+"30",border:`1px solid ${CATEGORY_COLORS[selectedArticle.category]??"#6366f1"}40`}}>
                      <ExternalLink className="w-4 h-4"/>
                      View Original Article
                    </a>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <Eye className="w-8 h-8 text-gray-700 mb-3"/>
                    <p className="text-sm text-gray-600">Preview will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Detail Panel: Node (graph mode) ──────────────── */}
        <AnimatePresence>
          {activeTab==="graph" && selectedNode && (
            <motion.div initial={{opacity:0,x:320}} animate={{opacity:1,x:0}} exit={{opacity:0,x:320}}
              transition={{type:"spring",stiffness:300,damping:28}}
              className="hidden md:flex flex-col w-72 border-l border-white/[0.06] bg-[#080c17] overflow-hidden flex-shrink-0">
              <div className="p-4 space-y-4 overflow-y-auto flex-1 scrollbar-hide">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold text-white mb-2"
                      style={{backgroundColor:(selectedNode.color??NODE_COLORS[selectedNode.type])+"25",border:`1px solid ${selectedNode.color??NODE_COLORS[selectedNode.type]}35`}}>
                      <span>{typeEmoji(selectedNode.type)}</span>
                      {NODE_TYPE_LABELS[selectedNode.type]}
                    </div>
                    <h3 className="text-sm font-bold text-white leading-snug">{selectedNode.label}</h3>
                  </div>
                  <button onClick={()=>setSelectedNode(null)} className="text-gray-600 hover:text-white transition-colors mt-1 flex-shrink-0"><X className="w-4 h-4"/></button>
                </div>
                <div className="h-px w-full rounded-full" style={{background:`linear-gradient(90deg, ${selectedNode.color??NODE_COLORS[selectedNode.type]}, transparent)`}}/>
                {selectedNode.description && <p className="text-xs text-gray-400 leading-relaxed">{selectedNode.description}</p>}
                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 rounded-md text-[10px] font-mono bg-white/5 text-gray-500">{connectedNodes.length} connections</div>
                </div>
                {connectedNodes.length>0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 mb-2">Linked Nodes</p>
                    <div className="space-y-0.5">
                      {connectedNodes.map((item,i)=>{ if(!item) return null; const{node,label,dir}=item as {node:GraphNode;label?:string;dir:string}; return (
                        <button key={i} onClick={()=>setSelectedNode(node)} className="vault-nav-item w-full text-left group">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor:node.color??NODE_COLORS[node.type]}}/>
                          <span className="flex-1 truncate text-xs group-hover:text-white transition-colors">{node.label}</span>
                          <span className="text-[10px] text-gray-700 flex-shrink-0 font-mono">{dir}</span>
                          {label && <span className="text-[9px] text-gray-700 flex-shrink-0 italic">{label}</span>}
                        </button>
                      );})}
                    </div>
                  </div>
                )}
                {selectedNode.url && (
                  <a href={selectedNode.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                    <ExternalLink className="w-3 h-3"/> Open resource
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Mobile Bottom Sheet ───────────────────────────── */}
        <AnimatePresence>
          {activeTab==="graph" && selectedNode && (
            <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring",stiffness:300,damping:30}}
              className="md:hidden absolute bottom-0 left-0 right-0 z-20 bg-[#0d1526] border-t border-white/10 rounded-t-2xl p-4 max-h-[55vh] overflow-y-auto">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white mb-1.5"
                    style={{backgroundColor:(selectedNode.color??NODE_COLORS[selectedNode.type])+"25",border:`1px solid ${selectedNode.color??NODE_COLORS[selectedNode.type]}35`}}>
                    <span>{typeEmoji(selectedNode.type)}</span>{NODE_TYPE_LABELS[selectedNode.type]}
                  </div>
                  <h3 className="text-sm font-bold text-white">{selectedNode.label}</h3>
                </div>
                <button onClick={()=>setSelectedNode(null)} className="text-gray-500 hover:text-white transition-colors mt-1"><X className="w-4 h-4"/></button>
              </div>
              {selectedNode.description && <p className="text-xs text-gray-400 leading-relaxed mb-3">{selectedNode.description}</p>}
              {selectedNode.url && (
                <a href={selectedNode.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  <ExternalLink className="w-3 h-3"/> Open resource
                </a>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
