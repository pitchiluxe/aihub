"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center p-8 gap-6">
          <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Something went wrong</h1>
            <p className="text-muted-foreground mt-1 max-w-sm text-sm">
              {error.message ?? "An unexpected error occurred."}
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground/60 mt-2 font-mono">Error ID: {error.digest}</p>
            )}
          </div>
          <div className="flex gap-3">
            <Button onClick={reset} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" onClick={() => { window.location.href = "/dashboard"; }} className="gap-2">
              <Home className="h-4 w-4" />
              Dashboard
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
