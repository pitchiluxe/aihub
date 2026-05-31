"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BookOpen, Star, Zap, Code, Brain, ChevronRight, Trophy } from "lucide-react";

const SKILL_PATHS = [
  {
    id: "beginner",
    title: "AI Foundations",
    level: "Beginner",
    color: "from-green-500 to-emerald-600",
    icon: "🌱",
    progress: 0,
    skills: [
      { name: "What is an LLM?", status: "available" },
      { name: "Prompt Basics", status: "available" },
      { name: "OpenRouter Setup", status: "available" },
      { name: "Ollama Local Setup", status: "available" },
      { name: "Build a Simple Chatbot", status: "locked" },
    ],
    description: "Master the fundamentals of AI: models, prompts, and your first AI app.",
    duration: "2-3 hours",
    xp: 500,
  },
  {
    id: "intermediate",
    title: "AI Engineering",
    level: "Intermediate",
    color: "from-blue-500 to-indigo-600",
    icon: "⚙️",
    progress: 0,
    skills: [
      { name: "Advanced Prompting", status: "available" },
      { name: "RAG with Vector DBs", status: "available" },
      { name: "LangChain Fundamentals", status: "available" },
      { name: "API Integration Patterns", status: "available" },
      { name: "AI App Deployment", status: "locked" },
      { name: "Streaming Responses", status: "locked" },
    ],
    description: "Build production AI applications with RAG, chains, and robust architectures.",
    duration: "5-8 hours",
    xp: 1500,
  },
  {
    id: "advanced",
    title: "Agent Architecture",
    level: "Advanced",
    color: "from-violet-500 to-purple-700",
    icon: "🤖",
    progress: 0,
    skills: [
      { name: "ReAct Agents", status: "available" },
      { name: "Tool Use & Function Calling", status: "available" },
      { name: "LangGraph State Machines", status: "available" },
      { name: "Multi-Agent Systems", status: "locked" },
      { name: "Agent Memory Systems", status: "locked" },
      { name: "MCP Integration", status: "locked" },
    ],
    description: "Design and build autonomous agents with tools, memory, and multi-agent orchestration.",
    duration: "10-15 hours",
    xp: 3000,
  },
  {
    id: "expert",
    title: "AI Research & Production",
    level: "Expert",
    color: "from-amber-500 to-orange-700",
    icon: "🔬",
    progress: 0,
    skills: [
      { name: "Fine-Tuning with LoRA", status: "available" },
      { name: "RLHF & Alignment", status: "locked" },
      { name: "Model Evaluation", status: "locked" },
      { name: "Production ML Systems", status: "locked" },
      { name: "AI Safety Practices", status: "locked" },
      { name: "Research Paper Analysis", status: "locked" },
    ],
    description: "Master fine-tuning, alignment, evaluation, and deploying AI systems at scale.",
    duration: "20+ hours",
    xp: 7500,
  },
];

const AI_SKILLS = [
  { name: "Prompt Engineering", level: 85, category: "Core", color: "#6366f1" },
  { name: "LangChain", level: 72, category: "Frameworks", color: "#22c55e" },
  { name: "RAG Systems", level: 68, category: "Architecture", color: "#06b6d4" },
  { name: "OpenRouter API", level: 90, category: "Tools", color: "#8b5cf6" },
  { name: "Ollama Local", level: 78, category: "Tools", color: "#22c55e" },
  { name: "AI Agent Design", level: 60, category: "Architecture", color: "#f59e0b" },
  { name: "Vector Databases", level: 55, category: "Infrastructure", color: "#06b6d4" },
  { name: "Fine-Tuning", level: 35, category: "Advanced", color: "#ef4444" },
];

export default function SkillsPage() {
  const [activePath, setActivePath] = useState<string | null>(null);

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Skills Library" description="Structured AI learning paths from beginner to expert" />
      <div className="flex-1 p-3 md:p-6 space-y-8">
        {/* Learning Paths */}
        <div>
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            Learning Paths
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {SKILL_PATHS.map((path) => (
              <motion.div
                key={path.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: SKILL_PATHS.indexOf(path) * 0.08 }}
              >
                <Card
                  className={`cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden ${
                    activePath === path.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setActivePath(activePath === path.id ? null : path.id)}
                >
                  <div className={`h-1.5 bg-gradient-to-r ${path.color}`} />
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">{path.icon}</span>
                      <div>
                        <p className="font-semibold text-sm">{path.title}</p>
                        <Badge variant="outline" className="text-xs mt-0.5">{path.level}</Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{path.description}</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{path.progress}%</span>
                      </div>
                      <Progress value={path.progress} className="h-1.5" />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{path.duration}</span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-500" />
                        {path.xp} XP
                      </span>
                    </div>
                    <Button
                      size="sm"
                      className={`w-full text-xs bg-gradient-to-r ${path.color} border-0`}
                    >
                      Start Path <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Expanded Skills */}
        {activePath && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="overflow-hidden"
          >
            {SKILL_PATHS.filter((p) => p.id === activePath).map((path) => (
              <Card key={path.id}>
                <CardHeader>
                  <CardTitle className="text-sm">{path.title} — Curriculum</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {path.skills.map((skill, i) => (
                      <div
                        key={skill.name}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          skill.status === "available"
                            ? "border-border hover:bg-accent cursor-pointer transition-colors"
                            : "border-border/50 opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <div
                          className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            skill.status === "available"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {i + 1}
                        </div>
                        <span className="text-sm font-medium">{skill.name}</span>
                        <div className="ml-auto">
                          {skill.status === "available" ? (
                            <Badge variant="success" className="text-xs">Available</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Locked</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {/* Skill Meter */}
        <div>
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Skill Proficiency Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AI_SKILLS.map((skill, i) => (
              <motion.div
                key={skill.name}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium">{skill.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{skill.category}</Badge>
                        <span className="text-xs font-semibold" style={{ color: skill.color }}>
                          {skill.level}%
                        </span>
                      </div>
                    </div>
                    <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="absolute left-0 top-0 h-full rounded-full"
                        style={{ backgroundColor: skill.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${skill.level}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: i * 0.05 + 0.3 }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
