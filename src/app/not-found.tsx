import Link from "next/link";
import { Sparkles, Home, Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center p-8 gap-6">
      <div className="h-20 w-20 rounded-3xl ai-gradient flex items-center justify-center mb-2">
        <Sparkles className="h-10 w-10 text-white" />
      </div>
      <div>
        <p className="text-8xl font-black text-muted-foreground/20">404</p>
        <h1 className="text-2xl font-bold -mt-4">Page Not Found</h1>
        <p className="text-muted-foreground mt-2 max-w-sm">
          This page doesn&apos;t exist in the AI universe. Let&apos;s get you back on track.
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/dashboard"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Home className="h-4 w-4" />
          Dashboard
        </Link>
        <Link href="/search"
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors">
          <Search className="h-4 w-4" />
          Search
        </Link>
      </div>
    </div>
  );
}
