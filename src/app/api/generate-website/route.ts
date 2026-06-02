import { NextRequest, NextResponse } from "next/server";
import { callModel } from "@/lib/ai/client";
import JSZip from "jszip";

export const maxDuration = 60;

const DESIGN_STYLES = [
  {
    name: "Aurora Dark",
    desc: "Deep dark background (#050d1a), glowing gradient blobs, glassmorphism cards with backdrop-blur, vibrant indigo/violet/cyan gradient text, neon glow on CTA buttons",
    palette: "bg-[#050d1a], text-white, gradient from indigo-500 via-violet-500 to-cyan-400, cards bg-white/5 backdrop-blur border border-white/10",
  },
  {
    name: "Clean Minimal",
    desc: "Pure white background, maximum white space, large black headings, thin borders, no shadows on cards just borders, one strong accent color (indigo-600)",
    palette: "bg-white, text-slate-900, accent indigo-600, borders border-slate-200, headings font-black text-slate-900",
  },
  {
    name: "Bold Brutalist",
    desc: "High contrast black and white, massive bold typography (text-8xl md:text-9xl), solid geometric shapes, yellow accent (#FFE135), hard box shadows (shadow-[6px_6px_0px_black]), uppercase everything",
    palette: "bg-white or bg-black alternating sections, text-black/text-white, accent bg-[#FFE135], brutal borders border-4 border-black",
  },
  {
    name: "Warm Organic",
    desc: "Warm cream/amber palette (#FDF6EC background), rounded-full and rounded-3xl everywhere, soft amber/orange gradients, hand-drawn feel with organic shapes, cozy and inviting",
    palette: "bg-[#FDF6EC], text-stone-800, accent amber-500/orange-500, rounded-3xl cards, warm shadow shadow-amber-100",
  },
  {
    name: "Premium Luxury",
    desc: "Deep charcoal (#0a0a0a) background, gold accents (#C9A84C), serif-inspired large display text, extremely spacious layout, subtle animated borders, elite professional feel",
    palette: "bg-[#0a0a0a], text-zinc-100, gold accent text-[#C9A84C] border-[#C9A84C], wide max-w-7xl with lots of py-32 spacing",
  },
];

const BUSINESS_CONFIGS: Record<string, { sections: string[]; icon: string; color: string }> = {
  "Trade Business": {
    sections: ["Hero with emergency call button + booking CTA", "Services grid (6 services with icons)", "Why Choose Us (trust badges: licensed, insured, 24/7)", "Before/After or Service Area Map", "Customer Reviews (5 stars)", "Contact form + Phone + Service area"],
    icon: "Wrench", color: "#f97316",
  },
  "Medical Practice": {
    sections: ["Hero with appointment booking CTA", "Specialties/Services (with descriptions)", "Meet the Doctor(s) section", "Insurance & Payment info", "Patient testimonials", "Appointment form + Map + Hours"],
    icon: "Heart", color: "#ef4444",
  },
  "Law Firm": {
    sections: ["Hero with free consultation CTA", "Practice areas (with case types)", "Why Our Firm (experience, wins, approach)", "Attorney profiles", "Client testimonials + case results", "Intake form + Office info"],
    icon: "Scale", color: "#6366f1",
  },
  "Restaurant / Cafe": {
    sections: ["Hero with reservation + order online CTA", "Featured Menu items (3 categories)", "Our Story/About section", "Ambiance gallery", "Customer reviews", "Reservation form + Hours + Location"],
    icon: "UtensilsCrossed", color: "#f59e0b",
  },
  "Freelancer Portfolio": {
    sections: ["Hero with name + specialty + hire CTA", "Services offered (4-6 with pricing hint)", "Featured Projects (3-4 cards with links)", "Tech stack / Skills", "Testimonials", "Contact form + availability status"],
    icon: "Code2", color: "#10b981",
  },
};

function buildPrompt(
  businessType: string,
  businessName: string,
  tagline: string,
  city: string,
  style: typeof DESIGN_STYLES[0],
): string {
  const config = BUSINESS_CONFIGS[businessType] || BUSINESS_CONFIGS["Trade Business"];
  const sections = config.sections.join("\n- ");

  return `You are a world-class React/Next.js developer and UI designer. Generate a COMPLETE, stunning homepage for a ${businessType}.

Business Info:
- Name: "${businessName || "The Business"}"
- Tagline: "${tagline || config.sections[0]}"
- City: "${city || "New York, NY"}"
- Type: ${businessType}

Design Style: ${style.name}
Visual Direction: ${style.desc}
Color Palette Guidance: ${style.palette}

Required Sections (in order):
- ${sections}

Technical Requirements:
1. Start with "use client";\n\nimport { useState } from "react"; (use useState for any interactive elements like forms, mobile menu)
2. Import icons from lucide-react at the top (use: ${config.icon}, Phone, Mail, MapPin, Star, CheckCircle2, ArrowRight, Menu, X, Clock)
3. Use ONLY Tailwind CSS v4 utility classes — no custom CSS, no style={{}} except for specific hex colors
4. Every section MUST be fully mobile-responsive (sm: md: lg: prefixes)
5. Include subtle hover effects: hover:scale-105, hover:shadow-lg, transition-all duration-300
6. Use realistic, professional placeholder content specific to ${businessType} in ${city}
7. The design must look NOTHING like a generic AI template — be bold, creative, and specific to the style above
8. Include a working mobile hamburger menu (useState for open/close)
9. CTA buttons must be prominent and styled per the design direction
10. Include at least 5 fake client reviews with names and star ratings

Return ONLY the complete TypeScript JSX code for the file src/app/page.tsx.
No markdown fences. No explanation. Just the raw .tsx code starting with "use client";`;
}

function packageJson(businessName: string) {
  return JSON.stringify({
    name: (businessName || "my-business").toLowerCase().replace(/[^a-z0-9]/g, "-"),
    version: "0.1.0",
    private: true,
    scripts: { dev: "next dev", build: "next build", start: "next start" },
    dependencies: {
      next: "15.1.0",
      react: "^19.0.0",
      "react-dom": "^19.0.0",
      "lucide-react": "^0.468.0",
      tailwindcss: "^4",
    },
    devDependencies: {
      "@types/node": "^20",
      "@types/react": "^19",
      "@types/react-dom": "^19",
      typescript: "^5",
    },
  }, null, 2);
}

function rootLayout(businessName: string, tagline: string) {
  return `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "${businessName || "My Business"}",
  description: "${tagline || "Professional services you can trust."}",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;
}

function globalsCss() {
  return `@import "tailwindcss";

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { -webkit-font-smoothing: antialiased; }
`;
}

function readme(businessName: string, businessType: string, style: string) {
  return `# ${businessName || "My Business"} — Website

Generated by **AIHub Website Builder** · Style: ${style}

## Quick Start

\`\`\`bash
npm install
npm run dev
\`\`\`

Open http://localhost:3000

## Deploy to Vercel

\`\`\`bash
npm i -g vercel
vercel --prod
\`\`\`

## Customise

- Edit \`src/app/page.tsx\` — all content is in one file for easy editing
- Update colors in Tailwind classes
- Replace placeholder text with your real business info
- Add your phone number, address, and social links

---
Generated by AIHub · aihub-eight-xi.vercel.app
`;
}

export async function POST(req: NextRequest) {
  try {
    const { businessType, businessName, tagline, city } = await req.json();

    // Pick a random design style
    const style = DESIGN_STYLES[Math.floor(Math.random() * DESIGN_STYLES.length)];

    const prompt = buildPrompt(businessType, businessName, tagline, city, style);

    const pageCode = await callModel(
      [
        { role: "system", content: "You are a senior React/Tailwind developer. Generate production-ready code only. No markdown, no fences, no explanation — just raw .tsx code." },
        { role: "user", content: prompt },
      ],
      8000,
    );

    // Clean up any accidental markdown fences
    const cleanCode = pageCode.replace(/^```(?:tsx?|jsx?)?\n?/gm, "").replace(/```$/gm, "").trim();

    const files = [
      { name: "README.md", content: readme(businessName, businessType, style.name) },
      { name: "package.json", content: packageJson(businessName) },
      { name: "next.config.ts", content: `import type { NextConfig } from "next";\nconst nextConfig: NextConfig = {};\nexport default nextConfig;\n` },
      { name: "src/app/layout.tsx", content: rootLayout(businessName, tagline) },
      { name: "src/app/globals.css", content: globalsCss() },
      { name: "src/app/page.tsx", content: cleanCode },
    ];

    // Build ZIP
    const zip = new JSZip();
    const slug = (businessName || "website").toLowerCase().replace(/[^a-z0-9]/g, "-");
    const root = zip.folder(slug)!;
    for (const f of files) {
      root.file(f.name, f.content);
    }
    const buffer = await zip.generateAsync({ type: "arraybuffer" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${slug}-website.zip"`,
        "X-Design-Style": style.name,
        "X-Files-Count": String(files.length),
      },
    });
  } catch (err) {
    console.error("[generate-website]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
