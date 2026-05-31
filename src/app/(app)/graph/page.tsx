"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { Badge } from "@/components/ui/badge";
import { GraphNode, GraphLink } from "@/types";
import { INITIAL_GRAPH_DATA } from "@/lib/graph-data";
import {
  Search, ZoomIn, ZoomOut, Maximize2, X, RefreshCw,
  Brain, Share2, Filter, ChevronDown, ChevronRight as ChevronRightIcon,
  Crosshair, Play, ExternalLink,
} from "lucide-react";
import * as d3 from "d3";
import { cn } from "@/lib/utils";

const NODE_COLORS: Record<string, string> = {
  model:     "#8b5cf6",
  company:   "#6366f1",
  research:  "#10b981",
  framework: "#f59e0b",
  concept:   "#06b6d4",
  tool:      "#ef4444",
};

const NODE_TYPE_LABELS: Record<string, string> = {
  model: "Models", company: "Companies", research: "Research",
  framework: "Frameworks", concept: "Concepts", tool: "Tools",
};

const NODE_TYPE_ICONS: Record<string, string> = {
  model: "🧠", company: "🏢", research: "📄",
  framework: "⚙️", concept: "💡", tool: "🔧",
};

interface ExtendedNode extends GraphNode, d3.SimulationNodeDatum {
  x?: number; y?: number; vx?: number; vy?: number;
  fx?: number | null; fy?: number | null;
}

export default function GraphPage() {
  const svgRef    = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simRef    = useRef<d3.Simulation<ExtendedNode, undefined> | null>(null);
  const zoomRef   = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [search, setSearch]             = useState("");
  const [zoomLevel, setZoomLevel]       = useState(1);
  const [activeTypes, setActiveTypes]   = useState<Set<string>>(
    new Set(["model","company","research","framework","concept","tool"])
  );
  const [hoveredId, setHoveredId]       = useState<string | null>(null);
  const [foldersOpen, setFoldersOpen]   = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const toggleType = useCallback((t: string) => {
    setActiveTypes(prev => {
      const n = new Set(prev);
      n.has(t) ? n.delete(t) : n.add(t);
      return n;
    });
  }, []);

  // Count per type
  const typeCounts = Object.keys(NODE_COLORS).reduce<Record<string,number>>((acc, t) => {
    acc[t] = INITIAL_GRAPH_DATA.nodes.filter(n => n.type === t).length;
    return acc;
  }, {});

  // ── Build graph ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    const W = containerRef.current.clientWidth;
    const H = containerRef.current.clientHeight;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const nodes: ExtendedNode[] = INITIAL_GRAPH_DATA.nodes
      .filter(n => activeTypes.has(n.type))
      .map(n => ({ ...n }));

    const nodeIds = new Set(nodes.map(n => n.id));
    const links = INITIAL_GRAPH_DATA.links
      .filter(l => nodeIds.has(String(l.source)) && nodeIds.has(String(l.target)))
      .map(l => ({ ...l }));

    const defs = svg.append("defs");

    const glow = defs.append("filter").attr("id","glow").attr("x","-50%").attr("y","-50%").attr("width","200%").attr("height","200%");
    glow.append("feGaussianBlur").attr("stdDeviation","4").attr("result","blur");
    const merge = glow.append("feMerge");
    merge.append("feMergeNode").attr("in","blur");
    merge.append("feMergeNode").attr("in","SourceGraphic");

    const strongGlow = defs.append("filter").attr("id","glow-strong").attr("x","-80%").attr("y","-80%").attr("width","260%").attr("height","260%");
    strongGlow.append("feGaussianBlur").attr("stdDeviation","8").attr("result","blur");
    const merge2 = strongGlow.append("feMerge");
    merge2.append("feMergeNode").attr("in","blur");
    merge2.append("feMergeNode").attr("in","SourceGraphic");

    Object.entries(NODE_COLORS).forEach(([type, color]) => {
      const grad = defs.append("radialGradient").attr("id", `grad-${type}`);
      grad.append("stop").attr("offset","0%").attr("stop-color",color).attr("stop-opacity","1");
      grad.append("stop").attr("offset","100%").attr("stop-color",color).attr("stop-opacity","0.65");

      const f = defs.append("filter").attr("id",`glow-${type}`).attr("x","-60%").attr("y","-60%").attr("width","220%").attr("height","220%");
      f.append("feGaussianBlur").attr("stdDeviation","5").attr("in","SourceGraphic").attr("result","blur");
      const fm = f.append("feMerge");
      fm.append("feMergeNode").attr("in","blur");
      fm.append("feMergeNode").attr("in","SourceGraphic");
    });

    defs.append("marker").attr("id","arrow").attr("viewBox","0 0 8 8").attr("refX","22").attr("refY","4")
      .attr("markerWidth","5").attr("markerHeight","5").attr("orient","auto")
      .append("path").attr("d","M0,0 L8,4 L0,8 z").attr("fill","rgba(148,163,184,0.5)");

    const zb = d3.zoom<SVGSVGElement,unknown>()
      .scaleExtent([0.15,5])
      .on("zoom", ev => { g.attr("transform", ev.transform); setZoomLevel(ev.transform.k); });
    zoomRef.current = zb;
    svg.call(zb);

    const g = svg.append("g");

    const linkSel = g.append("g").selectAll("line")
      .data(links).enter().append("line")
      .attr("stroke","rgba(148,163,184,0.25)")
      .attr("stroke-width",1)
      .attr("marker-end","url(#arrow)")
      .style("stroke-dasharray","4 4")
      .style("animation","dash 4s linear infinite");

    const linkLabel = g.append("g").selectAll("text")
      .data(links).enter().append("text")
      .attr("text-anchor","middle")
      .attr("font-size","8px")
      .attr("fill","rgba(148,163,184,0.0)")
      .attr("dy","-3px")
      .text(d => d.label ?? "");

    const nodeG = g.append("g").selectAll("g")
      .data(nodes).enter().append("g")
      .attr("cursor","pointer")
      .call(
        d3.drag<SVGGElement, ExtendedNode>()
          .on("start", (ev,d) => {
            if (!ev.active && simRef.current) simRef.current.alphaTarget(0.3).restart();
            d.fx = d.x; d.fy = d.y;
          })
          .on("drag",  (ev,d) => { d.fx = ev.x; d.fy = ev.y; })
          .on("end",   (ev,d) => {
            if (!ev.active && simRef.current) simRef.current.alphaTarget(0);
            d.fx = null; d.fy = null;
          })
      );

    nodeG.append("circle")
      .attr("r", d => (d.size ?? 20) + 8)
      .attr("fill","none")
      .attr("stroke", d => d.color ?? NODE_COLORS[d.type] ?? "#6366f1")
      .attr("stroke-width",1.5)
      .attr("stroke-opacity",0.3)
      .attr("class","pulse-ring");

    nodeG.append("circle")
      .attr("r", d => d.size ?? 20)
      .attr("fill", d => `url(#grad-${d.type})`)
      .attr("stroke","rgba(255,255,255,0.25)")
      .attr("stroke-width",1.5)
      .attr("filter", d => `url(#glow-${d.type})`)
      .on("mouseenter", function(_, d) {
        d3.select(this.parentNode as SVGGElement).select("circle:nth-child(2)")
          .attr("stroke","rgba(255,255,255,0.8)").attr("stroke-width",2.5).attr("r",(d.size ?? 20) + 2);
        d3.select(this.parentNode as SVGGElement).select(".pulse-ring")
          .attr("stroke-opacity",0.8).attr("r",(d.size ?? 20) + 14);
        linkSel.attr("stroke", l => {
          const s = typeof l.source === "object" ? (l.source as ExtendedNode).id : l.source;
          const t = typeof l.target === "object" ? (l.target as ExtendedNode).id : l.target;
          return s === d.id || t === d.id ? "rgba(148,163,184,0.8)" : "rgba(148,163,184,0.1)";
        }).attr("stroke-width", l => {
          const s = typeof l.source === "object" ? (l.source as ExtendedNode).id : l.source;
          const t = typeof l.target === "object" ? (l.target as ExtendedNode).id : l.target;
          return s === d.id || t === d.id ? 2 : 0.5;
        });
        linkLabel.attr("fill", l => {
          const s = typeof l.source === "object" ? (l.source as ExtendedNode).id : l.source;
          const t = typeof l.target === "object" ? (l.target as ExtendedNode).id : l.target;
          return s === d.id || t === d.id ? "rgba(148,163,184,0.7)" : "rgba(148,163,184,0.0)";
        });
        setHoveredId(d.id);
      })
      .on("mouseleave", function(_, d) {
        d3.select(this.parentNode as SVGGElement).select("circle:nth-child(2)")
          .attr("stroke","rgba(255,255,255,0.25)").attr("stroke-width",1.5).attr("r", d.size ?? 20);
        d3.select(this.parentNode as SVGGElement).select(".pulse-ring")
          .attr("stroke-opacity",0.3).attr("r",(d.size ?? 20) + 8);
        linkSel.attr("stroke","rgba(148,163,184,0.25)").attr("stroke-width",1);
        linkLabel.attr("fill","rgba(148,163,184,0.0)");
        setHoveredId(null);
      })
      .on("click", (ev, d) => { ev.stopPropagation(); setSelectedNode(d); });

    nodeG.append("text")
      .text(d => d.label)
      .attr("text-anchor","middle")
      .attr("dy", d => (d.size ?? 20) + 14)
      .attr("font-size","10px")
      .attr("font-weight","600")
      .attr("fill","currentColor")
      .attr("class","fill-foreground select-none pointer-events-none")
      .attr("opacity",0.85);

    nodeG.append("text")
      .text(d => typeEmoji(d.type))
      .attr("text-anchor","middle")
      .attr("dy","0.4em")
      .attr("font-size", d => `${Math.max(10, (d.size ?? 20) * 0.65)}px`)
      .attr("class","select-none pointer-events-none");

    svg.on("click", () => setSelectedNode(null));

    const sim = d3.forceSimulation<ExtendedNode>(nodes)
      .force("link", d3.forceLink(links as d3.SimulationLinkDatum<ExtendedNode>[])
        .id((d) => (d as ExtendedNode).id).distance(150).strength(0.4))
      .force("charge",    d3.forceManyBody().strength(-450))
      .force("center",    d3.forceCenter(W/2, H/2))
      .force("collision", d3.forceCollide().radius(d => (d as ExtendedNode).size ?? 20 + 18))
      .on("tick", () => {
        linkSel
          .attr("x1", d => ((d.source as unknown as ExtendedNode).x ?? 0))
          .attr("y1", d => ((d.source as unknown as ExtendedNode).y ?? 0))
          .attr("x2", d => ((d.target as unknown as ExtendedNode).x ?? 0))
          .attr("y2", d => ((d.target as unknown as ExtendedNode).y ?? 0));
        linkLabel
          .attr("x", d => ((((d.source as unknown as ExtendedNode).x ?? 0) + ((d.target as unknown as ExtendedNode).x ?? 0))/2))
          .attr("y", d => ((((d.source as unknown as ExtendedNode).y ?? 0) + ((d.target as unknown as ExtendedNode).y ?? 0))/2));
        nodeG.attr("transform", d => `translate(${d.x ?? 0},${d.y ?? 0})`);
      });

    simRef.current = sim;
    return () => { sim.stop(); };
  }, [activeTypes]);

  // Search highlight
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const q = search.toLowerCase().trim();
    svg.selectAll<SVGGElement, ExtendedNode>("g g")
      .style("opacity", d => {
        if (!q || !d?.id) return null;
        const match = d.label?.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q);
        return match ? "1" : "0.15";
      });
  }, [search]);

  function zoomIn()  { if (svgRef.current && zoomRef.current) d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.5); }
  function zoomOut() { if (svgRef.current && zoomRef.current) d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 0.67); }
  function resetZoom(){ if (svgRef.current && zoomRef.current) d3.select(svgRef.current).transition().duration(500).call(zoomRef.current.transform, d3.zoomIdentity.translate(0,0).scale(1)); }

  const connectedLinks = selectedNode
    ? INITIAL_GRAPH_DATA.links.filter(l => l.source === selectedNode.id || l.target === selectedNode.id)
    : [];
  const connectedNodes = connectedLinks.map(l => {
    const otherId = l.source === selectedNode?.id ? l.target : l.source;
    const node = INITIAL_GRAPH_DATA.nodes.find(n => n.id === otherId);
    return node ? { node, label: l.label, dir: l.source === selectedNode?.id ? "→" : "←" } : null;
  }).filter(Boolean);

  return (
    <>
      <style>{`
        @keyframes dash { to { stroke-dashoffset: -24; } }
        .pulse-ring { animation: ringPulse 2.5s ease-in-out infinite; }
        @keyframes ringPulse {
          0%,100% { stroke-opacity: 0.2; transform: scale(1); }
          50% { stroke-opacity: 0.5; transform: scale(1.08); }
        }
        line { animation: dash 5s linear infinite; }
      `}</style>

      <div className="flex flex-col h-screen bg-[#080d18]">
        <TopBar title="AI Brain" description="Obsidian-style AI knowledge graph — explore relationships in the AI ecosystem" />

        <div className="flex flex-1 overflow-hidden">

          {/* ── Vault Sidebar ──────────────────────────────────────────── */}
          <aside className="w-52 flex-shrink-0 bg-[#0a0e1a] border-r border-white/5 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="px-3 py-3 border-b border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white leading-none">AI Brain</div>
                  <div className="text-[10px] text-gray-600 leading-none mt-0.5">
                    {INITIAL_GRAPH_DATA.nodes.filter(n => activeTypes.has(n.type)).length} nodes · {INITIAL_GRAPH_DATA.links.length} edges
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search nodes…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                />
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 scrollbar-hide">
              {/* Graph View */}
              <button className="vault-nav-item vault-nav-active w-full">
                <Share2 className="w-3.5 h-3.5 flex-shrink-0 text-violet-400" />
                <span className="flex-1 text-left">Graph View</span>
                <span className="text-[10px] bg-violet-500/20 text-violet-400 px-1 rounded font-mono">D3</span>
              </button>

              {/* Divider + Folders */}
              <div className="pt-3 pb-1">
                <button
                  onClick={() => setFoldersOpen(!foldersOpen)}
                  className="flex items-center gap-1 text-[10px] font-semibold text-gray-600 uppercase tracking-wider w-full hover:text-gray-400 px-1 transition-colors"
                >
                  {foldersOpen
                    ? <ChevronDown className="w-3 h-3" />
                    : <ChevronRightIcon className="w-3 h-3" />}
                  Node Types
                </button>
              </div>

              {foldersOpen && Object.entries(NODE_COLORS).map(([type, color]) => (
                <button
                  key={type}
                  onClick={() => {
                    setActiveCategory(activeCategory === type ? null : type);
                    toggleType(type);
                  }}
                  className={cn(
                    "vault-nav-item w-full",
                    activeTypes.has(type) && activeCategory === type && "vault-nav-active"
                  )}
                >
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="flex-1 text-left truncate">{NODE_TYPE_LABELS[type]}</span>
                  <span className={cn("text-[10px]", activeTypes.has(type) ? "text-gray-500" : "text-gray-700 line-through")}>
                    {typeCounts[type]}
                  </span>
                </button>
              ))}

              <div className="pt-3 pb-1">
                <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider px-1">Stats</span>
              </div>

              <div className="glass-card p-2.5 mx-0.5 space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-600">Active nodes</span>
                  <span className="text-white font-medium">{INITIAL_GRAPH_DATA.nodes.filter(n=>activeTypes.has(n.type)).length}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-600">Connections</span>
                  <span className="text-white font-medium">{INITIAL_GRAPH_DATA.links.length}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-600">Types visible</span>
                  <span className="text-white font-medium">{activeTypes.size}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-600">Zoom</span>
                  <span className="text-violet-400 font-mono">{Math.round(zoomLevel * 100)}%</span>
                </div>
              </div>

              {/* Tips */}
              <div className="pt-3 pb-1">
                <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider px-1">Controls</span>
              </div>
              <div className="px-1 space-y-1">
                {[
                  ["Click", "Select node"],
                  ["Drag", "Move node"],
                  ["Scroll", "Zoom in/out"],
                  ["⌘+scroll", "Precision zoom"],
                ].map(([key, val]) => (
                  <div key={key} className="flex justify-between text-[10px]">
                    <kbd className="text-gray-600 font-mono">{key}</kbd>
                    <span className="text-gray-700">{val}</span>
                  </div>
                ))}
              </div>
            </nav>
          </aside>

          {/* ── Main Graph Canvas ─────────────────────────────────────── */}
          <div className="flex-1 relative overflow-hidden">
            <div ref={containerRef} className="w-full h-full">
              <svg ref={svgRef} className="w-full h-full" style={{ cursor:"grab", background:"transparent" }} />
            </div>

            {/* Zoom controls (QB graph-control-btn style) */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
              <button onClick={zoomIn}    className="graph-control-btn"><ZoomIn    className="w-3.5 h-3.5"/></button>
              <button onClick={zoomOut}   className="graph-control-btn"><ZoomOut   className="w-3.5 h-3.5"/></button>
              <button onClick={resetZoom} className="graph-control-btn"><Crosshair className="w-3.5 h-3.5"/></button>
              <button onClick={resetZoom} className="graph-control-btn"><RefreshCw className="w-3.5 h-3.5"/></button>
            </div>

            {/* Type filter pills (QB graph-filter-btn style) */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {Object.entries(NODE_COLORS).map(([type, color]) => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={cn("graph-filter-btn flex items-center gap-1.5", activeTypes.has(type) && "graph-filter-active")}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeTypes.has(type) ? color : "#555" }} />
                  {NODE_TYPE_LABELS[type]}
                </button>
              ))}
            </div>

            {/* Hovered node tooltip */}
            <AnimatePresence>
              {hoveredId && (() => {
                const n = INITIAL_GRAPH_DATA.nodes.find(x => x.id === hoveredId);
                if (!n) return null;
                return (
                  <motion.div
                    key={hoveredId}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
                  >
                    <div className="glass-card px-3 py-1.5 flex items-center gap-2">
                      <span>{typeEmoji(n.type)}</span>
                      <span className="text-xs font-medium text-white">{n.label}</span>
                      <span className="text-[10px] text-gray-500" style={{ color: NODE_COLORS[n.type] }}>
                        {NODE_TYPE_LABELS[n.type]}
                      </span>
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </div>

          {/* ── Detail Panel ─────────────────────────────────────────── */}
          <AnimatePresence>
            {selectedNode && (
              <motion.div
                initial={{ opacity:0, x:320 }}
                animate={{ opacity:1, x:0 }}
                exit={{ opacity:0, x:320 }}
                transition={{ type:"spring", stiffness:300, damping:28 }}
                className="w-72 border-l border-white/5 bg-[#0a0e1a] overflow-y-auto flex-shrink-0 scrollbar-hide"
              >
                <div className="p-4 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white mb-2"
                        style={{ backgroundColor: (selectedNode.color ?? NODE_COLORS[selectedNode.type]) + "30",
                                 border: `1px solid ${selectedNode.color ?? NODE_COLORS[selectedNode.type]}40` }}
                      >
                        <span>{typeEmoji(selectedNode.type)}</span>
                        {NODE_TYPE_LABELS[selectedNode.type]}
                      </div>
                      <h3 className="text-sm font-bold text-white">{selectedNode.label}</h3>
                    </div>
                    <button onClick={() => setSelectedNode(null)} className="text-gray-600 hover:text-white transition-colors mt-1">
                      <X className="w-4 h-4"/>
                    </button>
                  </div>

                  {/* Color bar */}
                  <div
                    className="h-0.5 w-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${selectedNode.color ?? NODE_COLORS[selectedNode.type]}, transparent)` }}
                  />

                  {selectedNode.description && (
                    <p className="text-xs text-gray-400 leading-relaxed">{selectedNode.description}</p>
                  )}

                  {/* Connections */}
                  {connectedNodes.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 mb-2">
                        Connections ({connectedNodes.length})
                      </p>
                      <div className="space-y-1">
                        {connectedNodes.map((item, i) => {
                          if (!item) return null;
                          const { node, label, dir } = item as { node: GraphNode; label?: string; dir: string };
                          return (
                            <button
                              key={i}
                              onClick={() => setSelectedNode(node)}
                              className="vault-nav-item w-full text-left"
                            >
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: node.color ?? NODE_COLORS[node.type] }} />
                              <span className="flex-1 truncate text-xs">{node.label}</span>
                              <span className="text-[10px] text-gray-700 flex-shrink-0">{dir} {label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {selectedNode.url && (
                    <a href={selectedNode.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                      <ExternalLink className="w-3 h-3" />
                      Learn more
                    </a>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

function typeEmoji(type: string): string {
  return NODE_TYPE_ICONS[type] ?? "●";
}
