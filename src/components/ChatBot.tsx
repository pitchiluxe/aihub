"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageCircle, X, Send, Loader } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SYSTEM_PROMPT = `You are AIHub Copilot, an AI expert assistant specializing in artificial intelligence, machine learning, agents, skills development, and best practices.

Your expertise includes:
- AI models, LLMs, and model selection
- Building AI agents and workflows
- Creating AI skills and extensions
- RAG systems and knowledge management
- Prompt engineering and optimization
- AI safety and best practices
- Automation and integration patterns

When users ask:
- About AI topics: Provide detailed, actionable insights
- How to build skills/agents: Give step-by-step guidance with code examples
- General questions: Redirect to AIHub resources or AI topics
- About the Skills & Agents Generator: Explain how to use it to create custom skills/agents

Always be helpful, specific, and encourage users to explore AIHub features.`;

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm AIHub Copilot. Ask me anything about AI, building agents, creating skills, or best practices. How can I help?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT,
            },
            ...[...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
          ],
          model: "deepseek/deepseek-chat-v3-0324:free",
          provider: "openrouter",
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || data.content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 rounded-full shadow-lg hover:shadow-xl transition-all"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 rounded-full animate-pulse opacity-30" />
          <div className="relative bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white rounded-full p-4 flex items-center justify-center">
            {isOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <MessageCircle className="h-6 w-6" />
            )}
          </div>
        </div>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-24 right-6 z-40 w-96 max-h-[600px] flex flex-col"
          >
            <Card className="flex flex-col h-full bg-background border-2 border-primary/20 shadow-2xl">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-4 rounded-t-lg">
                <h3 className="font-semibold text-lg">AIHub Copilot</h3>
                <p className="text-xs text-white/80">Always on — ask me anything</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-muted text-muted-foreground rounded-bl-none"
                      }`}
                    >
                      {message.content}
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-muted px-4 py-2 rounded-lg flex items-center gap-2">
                      <Loader className="h-4 w-4 animate-spin" />
                      <span className="text-xs text-muted-foreground">Thinking...</span>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="border-t p-3 bg-muted/50 rounded-b-lg flex gap-2">
                <Input
                  placeholder="Ask about AI, agents, skills..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isLoading}
                  className="text-xs h-9"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  size="sm"
                  className="px-3 h-9"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
