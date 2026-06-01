"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Copy, Search, X, ArrowRight, ExternalLink, Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import { WORKFLOWS, Workflow } from "@/lib/workflows";

const STEP_COLORS: Record<string, string> = {
  trigger: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  action: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  ai: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  condition: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  output: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

const DIFFICULTY_BADGES: Record<string, "success" | "info" | "warning"> = {
  simple: "success",
  intermediate: "info",
  complex: "warning",
};

export default function WorkflowsPage() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showCloneGuide, setShowCloneGuide] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  const filtered = WORKFLOWS.filter(
    (w) =>
      !search.trim() ||
      w.title.toLowerCase().includes(search.toLowerCase()) ||
      w.description.toLowerCase().includes(search.toLowerCase()) ||
      w.category.toLowerCase().includes(search.toLowerCase()) ||
      w.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  }

  function handleClone(workflow: Workflow) {
    setSelectedWorkflow(workflow);
    setShowCloneGuide(true);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Workflow Marketplace" description="n8n-inspired AI automation blueprints" />
      <div className="flex-1 p-3 md:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search workflows..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 h-9 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <Badge variant="secondary" className="text-xs">{filtered.length} results</Badge>
        </div>

        <div className="space-y-4">
          {filtered.map((workflow, i) => (
            <motion.div
              key={workflow.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="overflow-hidden">
                <div className={`h-1 bg-gradient-to-r ${workflow.color}`} />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-sm font-semibold">{workflow.title}</h3>
                        <Badge variant={DIFFICULTY_BADGES[workflow.difficulty]} className="text-xs capitalize">
                          {workflow.difficulty}
                        </Badge>
                        <Badge variant="outline" className="text-xs">{workflow.category}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{workflow.description}</p>

                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {workflow.estimatedTime}
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {workflow.tools.slice(0, 3).map((tool) => (
                            <span key={tool} className="text-xs px-1.5 py-0.5 bg-secondary rounded-md">{tool}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpanded(expanded === workflow.id ? null : workflow.id)}
                        className="text-xs gap-1"
                      >
                        {expanded === workflow.id ? "Hide" : "View"} Flow
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleClone(workflow)}
                        className="text-xs gap-1"
                      >
                        <Copy className="h-3 w-3" />
                        Clone
                      </Button>
                    </div>
                  </div>

                  {/* Workflow Steps Diagram */}
                  {expanded === workflow.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 pt-4 border-t border-border overflow-hidden"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Workflow Steps</p>
                      <div className="flex items-start gap-2 flex-wrap">
                        {workflow.steps.map((step, idx) => (
                          <div key={step.id} className="flex items-center gap-2">
                            <div className="flex flex-col items-center gap-1 min-w-0">
                              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${STEP_COLORS[step.type]} text-xs`}>
                                <step.icon className="h-3.5 w-3.5 flex-shrink-0" />
                                <div>
                                  <p className="font-semibold text-xs">{step.title}</p>
                                  <p className="opacity-75 text-xs leading-tight max-w-[120px]">{step.description}</p>
                                </div>
                              </div>
                            </div>
                            {idx < workflow.steps.length - 1 && (
                              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-2" />
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 mt-4 flex-wrap">
                        {Object.entries(STEP_COLORS).map(([type, cls]) => (
                          <div key={type} className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${cls}`}>
                            <span className="capitalize font-medium">{type}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Clone Guide Modal */}
      {showCloneGuide && selectedWorkflow && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold">{selectedWorkflow.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{selectedWorkflow.description}</p>
                </div>
                <button
                  onClick={() => setShowCloneGuide(false)}
                  className="text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Prerequisites */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                      1
                    </div>
                    <p className="font-semibold text-sm">Prerequisites</p>
                  </div>
                  <div className="pl-11 space-y-1.5">
                    {selectedWorkflow.tools.map((tool) => (
                      <div key={tool} className="text-xs flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                        <span>{tool} account</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Setup Steps */}
                {selectedWorkflow.setupGuide && (
                  <div className="space-y-2 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                        2
                      </div>
                      <p className="font-semibold text-sm">Setup Instructions</p>
                    </div>
                    <div className="pl-11 space-y-2">
                      {selectedWorkflow.setupGuide.split("\n").map((step, i) => (
                        <div key={i} className="text-xs text-muted-foreground flex gap-2">
                          <span className="font-semibold text-primary flex-shrink-0 min-w-fit">{i + 1}.</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Workflow Flow */}
                <div className="space-y-2 pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                      3
                    </div>
                    <p className="font-semibold text-sm">Workflow Flow</p>
                  </div>
                  <div className="pl-11 space-y-1">
                    {selectedWorkflow.steps.map((step, idx) => {
                      const StepIcon = step.icon;
                      return (
                        <div key={step.id}>
                          <div className={`flex items-center gap-2 px-3 py-2 rounded text-xs ${STEP_COLORS[step.type]}`}>
                            <StepIcon className="h-3 w-3 flex-shrink-0" />
                            <div>
                              <p className="font-semibold">{step.title}</p>
                              <p className="opacity-75 text-xs">{step.description}</p>
                            </div>
                          </div>
                          {idx < selectedWorkflow.steps.length - 1 && (
                            <div className="h-3 border-l border-border ml-5 my-0.5" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Getting Started */}
                <div className="space-y-2 pt-3 border-t bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                      4
                    </div>
                    <p className="font-semibold text-sm">Getting Started</p>
                  </div>
                  <div className="pl-11 space-y-1.5 text-xs text-muted-foreground">
                    <p>✓ Create an account on n8n or use your preferred workflow platform</p>
                    <p>✓ Create a new workflow and add nodes matching the flow above</p>
                    <p>✓ Connect each node's credentials (APIs, tokens, webhooks)</p>
                    <p>✓ Set up triggers and test the workflow</p>
                    <p>✓ Activate and monitor in real-time</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowCloneGuide(false)}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    copyToClipboard(JSON.stringify(selectedWorkflow, null, 2));
                    toast.success("Workflow config copied to clipboard!");
                  }}
                  className="flex-1 gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy Config
                </Button>
                <Button
                  onClick={() => {
                    window.open("https://n8n.io/workflows", "_blank");
                  }}
                  className="flex-1 gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open n8n
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
