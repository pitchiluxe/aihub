"use client";

import { useStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotificationBell } from "@/components/layout/NotificationPanel";
import { Search, Moon, Sun, Command, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface TopBarProps {
  title?: string;
  description?: string;
}

export function TopBar({ title, description }: TopBarProps) {
  const { setCommandOpen, setSidebarOpen } = useStore();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [localSearch, setLocalSearch] = useState("");

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (localSearch.trim()) {
      router.push(`/search?q=${encodeURIComponent(localSearch.trim())}`);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 md:px-6">
      {/* Hamburger — mobile only */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex flex-1 items-center gap-4">
        {title && (
          <div className="hidden sm:block">
            <h1 className="text-sm font-semibold">{title}</h1>
            {description && (
              <p className="text-xs text-muted-foreground hidden md:block">{description}</p>
            )}
          </div>
        )}

        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md hidden sm:block">
          <Input
            placeholder="Search AI news, models, research..."
            icon={<Search className="h-3.5 w-3.5" />}
            suffix={
              <button
                type="button"
                onClick={() => setCommandOpen(true)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Command className="h-3 w-3" />
                <span className="hidden md:inline">K</span>
              </button>
            }
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="h-8 text-xs"
          />
        </form>
        {/* Mobile search button */}
        <button
          onClick={() => setCommandOpen(true)}
          className="sm:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <NotificationBell />
      </div>
    </header>
  );
}
