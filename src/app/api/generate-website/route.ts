import { NextRequest, NextResponse } from "next/server";
import { callModel } from "@/lib/ai/client";
import JSZip from "jszip";

export const maxDuration = 60;

// ── Industry-Authentic Design Systems ─────────────────────────────────────────
// Each entry is a curated design brief for that business type.
// Principles drawn from ui-ux-pro-max skill: 50 styles, 21 palettes,
// industry-color mappings, typography pairings, and UX anti-patterns.
// Styles are NOT random across all types — each type only uses designs
// that are appropriate for that industry.

interface DesignBrief {
  name: string;
  // Visual direction sentence — what it should FEEL like
  feel: string;
  // Exact Tailwind color tokens and hex values to use
  palette: {
    background: string;
    surface: string;
    text: string;
    muted: string;
    accent: string;
    accentText: string;
    border: string;
  };
  // Typography instructions
  typography: {
    heading: string; // font-weight + size + style guidance
    body: string;
    special: string; // e.g. phone numbers, prices
  };
  // Component-level guidance
  components: string[];
  // Tailwind class examples for hero, cards, buttons
  tailwindExamples: {
    section: string;
    card: string;
    button: string;
    heading: string;
  };
}

const BUSINESS_DESIGN_SYSTEMS: Record<string, DesignBrief[]> = {
  "Medical Practice": [
    {
      name: "Clinical Trust",
      feel: "A real hospital or specialist clinic website — crisp white, calm teal-blue, lots of breathing room. Radiates competence and safety. Patients must feel reassured immediately.",
      palette: {
        background: "bg-white",
        surface: "bg-slate-50",
        text: "text-slate-900",
        muted: "text-slate-500",
        accent: "bg-[#0891b2] hover:bg-[#0e7490]",
        accentText: "text-[#0891b2]",
        border: "border-slate-200",
      },
      typography: {
        heading: "font-bold text-slate-900 tracking-tight — use Source Sans Pro style: clean, not decorative",
        body: "text-base text-slate-600 leading-relaxed — readable at all ages",
        special: "text-3xl font-black text-[#0891b2] for phone numbers and CTAs",
      },
      components: [
        "Sticky navbar: white bg, shadow-sm, logo left, 'Book Appointment' CTA button right in accent color",
        "Hero: large heading with doctor's specialty, subtext about patient care, TWO CTAs (Book Now + Call Us), trust badges (Board Certified, X Years Experience, Insurance Accepted)",
        "Services: 3-column grid with icon + title + short description — NOT colored icon circles, use simple line icons",
        "Meet the Doctor: photo left, credentials right, medical school + board certifications listed",
        "Insurance logos: real common insurance brand names in a clean horizontal scroll",
        "Patient reviews: full-width section with 5-star ratings, patient first name + last initial only",
        "Contact: two-column — form left, hours/map/phone right",
      ],
      tailwindExamples: {
        section: "py-20 px-4 sm:px-8 max-w-6xl mx-auto",
        card: "bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow",
        button: "bg-[#0891b2] hover:bg-[#0e7490] text-white font-semibold px-6 py-3 rounded-xl transition-colors cursor-pointer",
        heading: "text-4xl sm:text-5xl font-bold text-slate-900 leading-tight",
      },
    },
    {
      name: "Warm Care",
      feel: "Private practice with warmth — soft sage-green and warm white, photography of welcoming spaces. Not cold/clinical, but still professional and trust-building.",
      palette: {
        background: "bg-[#FAFAF8]",
        surface: "bg-white",
        text: "text-stone-900",
        muted: "text-stone-500",
        accent: "bg-[#16a34a] hover:bg-[#15803d]",
        accentText: "text-[#16a34a]",
        border: "border-stone-200",
      },
      typography: {
        heading: "font-bold text-stone-900 — warm and approachable but still professional",
        body: "text-stone-600 leading-relaxed text-base",
        special: "text-[#16a34a] font-bold text-2xl for CTAs and key stats",
      },
      components: [
        "Navbar: clean with rounded pill 'Schedule Visit' button in green",
        "Hero: large empathetic headline ('Your Health, Our Priority'), soft background, doctor photo right side on desktop",
        "Trust row: 3 badges (Licensed & Insured, Insurance Accepted, Same-Day Appointments)",
        "Services: warm card grid with subtle left border in accent green",
        "About section: personal story of the practice + photo, humanizing copy",
        "Testimonials: speech bubble style quotes",
        "Footer CTA + contact form",
      ],
      tailwindExamples: {
        section: "py-16 px-4 sm:px-8 max-w-6xl mx-auto",
        card: "bg-white rounded-2xl border-l-4 border-l-[#16a34a] border border-stone-200 p-6 shadow-sm",
        button: "bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold px-6 py-3 rounded-full transition-colors cursor-pointer",
        heading: "text-4xl sm:text-5xl font-bold text-stone-900",
      },
    },
  ],

  "Trade Business": [
    {
      name: "Contractor Authority",
      feel: "A real established contractor company — bold, direct, masculine. Deep navy background alternating with white sections, orange/amber accent for emergency CTAs. Homepage screams competence and reliability.",
      palette: {
        background: "bg-white",
        surface: "bg-[#0f172a]",
        text: "text-slate-900",
        muted: "text-slate-500",
        accent: "bg-[#ea580c] hover:bg-[#c2410c]",
        accentText: "text-[#ea580c]",
        border: "border-slate-200",
      },
      typography: {
        heading: "font-black text-slate-900 uppercase tracking-tight — big and bold",
        body: "text-slate-600 text-base leading-relaxed",
        special: "text-[#ea580c] font-black text-3xl sm:text-4xl for phone number — PROMINENTLY displayed",
      },
      components: [
        "Top bar: phone number left, 'Available 24/7' badge right — dark bg, white text",
        "Navbar: white, logo + services dropdown + 'Free Estimate' orange CTA button",
        "Hero: dark navy background, large white heading, orange subtitle, phone number huge, 'Get Free Quote' button, 5-star badge",
        "Services: 6-card grid on white section — icon + service name + 'Learn More' link",
        "Why Us: alternating dark/white sections with stats (15+ Years, 500+ Projects, Licensed & Insured, A+ BBB Rating)",
        "Service area map description with cities/ZIP codes listed",
        "Reviews: 5 customer reviews with name, neighborhood, and star rating",
        "Bottom CTA: dark section with 'Ready to Start? Call Us Now' + big phone number",
      ],
      tailwindExamples: {
        section: "py-16 px-4 sm:px-8 max-w-7xl mx-auto",
        card: "bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-[#ea580c] transition-all cursor-pointer",
        button: "bg-[#ea580c] hover:bg-[#c2410c] text-white font-black px-8 py-4 rounded-xl text-lg transition-colors cursor-pointer uppercase tracking-wide",
        heading: "text-5xl sm:text-6xl font-black text-white leading-tight uppercase",
      },
    },
    {
      name: "Modern Service Pro",
      feel: "Slightly more modern take on trades — charcoal + amber, clean grid layout, professional photography described in placeholder text. Feels like a premium version of a local service company.",
      palette: {
        background: "bg-[#f8fafc]",
        surface: "bg-[#1e293b]",
        text: "text-slate-900",
        muted: "text-slate-500",
        accent: "bg-amber-500 hover:bg-amber-600",
        accentText: "text-amber-500",
        border: "border-slate-200",
      },
      typography: {
        heading: "font-black text-slate-900 tracking-tight",
        body: "text-slate-600 leading-relaxed",
        special: "text-amber-500 font-black text-3xl for phone number",
      },
      components: [
        "Header with 24/7 availability notice and bold phone number",
        "Hero with strong headline and booking form on the right",
        "Services in a bento-style grid",
        "Credentials/certifications badge strip",
        "Before/after framing with 'Our Work' showcase",
        "Customer reviews with location",
        "Emergency contact footer strip",
      ],
      tailwindExamples: {
        section: "py-16 px-4 sm:px-8 max-w-7xl mx-auto",
        card: "bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow",
        button: "bg-amber-500 hover:bg-amber-600 text-white font-bold px-7 py-3.5 rounded-xl transition-colors cursor-pointer",
        heading: "text-4xl sm:text-5xl font-black text-slate-900 tracking-tight",
      },
    },
  ],

  "Law Firm": [
    {
      name: "Premium Legal Authority",
      feel: "High-end law firm like Quinn Emanuel or Jones Day — deep charcoal/navy, gold accents, wide spacious layout with lots of whitespace, strong serif-influenced display headings. Radiates authority, experience, and gravitas.",
      palette: {
        background: "bg-[#0a0a0f]",
        surface: "bg-[#111118]",
        text: "text-zinc-100",
        muted: "text-zinc-400",
        accent: "bg-[#B8953F] hover:bg-[#a07d35]",
        accentText: "text-[#C9A84C]",
        border: "border-zinc-800",
      },
      typography: {
        heading: "font-black text-white tracking-tight — large display text, commanding presence",
        body: "text-zinc-300 leading-relaxed text-base",
        special: "text-[#C9A84C] font-semibold for years of experience, wins, and key credentials",
      },
      components: [
        "Navbar: dark with gold 'Free Consultation' button, firm name in gold",
        "Hero: full-width dark section, large heading like 'Fighting For What You Deserve', gold accent underline, years established, 'Schedule Free Consultation' CTA",
        "Practice areas: clean cards with gold left border on dark surface",
        "Results/track record: dark section with gold numbers (case wins, settlements recovered, years experience)",
        "Attorney profiles: professional headshots described, credentials, bar admissions listed",
        "Client testimonials: elegant quote marks, gold accent",
        "Awards/recognition: bar association badges, super lawyers, etc.",
        "Contact: prominent consultation form in dark card",
      ],
      tailwindExamples: {
        section: "py-24 px-4 sm:px-8 max-w-6xl mx-auto",
        card: "bg-[#111118] rounded-xl border border-zinc-800 border-l-4 border-l-[#C9A84C] p-8 hover:border-zinc-700 transition-colors",
        button: "bg-[#B8953F] hover:bg-[#a07d35] text-white font-bold px-8 py-4 rounded-lg transition-colors cursor-pointer tracking-wide",
        heading: "text-5xl sm:text-7xl font-black text-white leading-none tracking-tight",
      },
    },
    {
      name: "Boutique Counsel",
      feel: "Smaller boutique firm — navy blue + cream white, trustworthy and approachable. Still professional but less intimidating than BigLaw aesthetic.",
      palette: {
        background: "bg-[#F8F6F0]",
        surface: "bg-white",
        text: "text-slate-900",
        muted: "text-slate-500",
        accent: "bg-[#1e3a5f] hover:bg-[#162d4a]",
        accentText: "text-[#1e3a5f]",
        border: "border-slate-200",
      },
      typography: {
        heading: "font-bold text-slate-900 — strong but approachable",
        body: "text-slate-600 leading-relaxed",
        special: "text-[#1e3a5f] font-bold text-xl",
      },
      components: [
        "Navbar: cream/white background, navy logo text, 'Free Consultation' navy button",
        "Hero: cream background, large navy heading, professional subtext, clear CTA",
        "Practice areas: clean icon + title + description cards on white",
        "Track record stats: cases won, years experience, satisfied clients",
        "Attorney bio section: warm and personal",
        "Testimonials on navy background with white text",
        "Contact form with office hours and address",
      ],
      tailwindExamples: {
        section: "py-20 px-4 sm:px-8 max-w-6xl mx-auto",
        card: "bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow",
        button: "bg-[#1e3a5f] hover:bg-[#162d4a] text-white font-semibold px-7 py-3 rounded-lg transition-colors cursor-pointer",
        heading: "text-4xl sm:text-6xl font-bold text-slate-900 leading-tight",
      },
    },
  ],

  "Restaurant / Cafe": [
    {
      name: "Warm Hospitality",
      feel: "A real restaurant website — warm amber/terracotta palette, large food photography described in placeholders, section backgrounds that feel like warm wood and candlelight. You can almost smell it.",
      palette: {
        background: "bg-[#1a0f00]",
        surface: "bg-[#0f0800]",
        text: "text-amber-50",
        muted: "text-amber-200/70",
        accent: "bg-[#d97706] hover:bg-[#b45309]",
        accentText: "text-[#fbbf24]",
        border: "border-amber-900/40",
      },
      typography: {
        heading: "font-black text-amber-50 — rich and inviting, feels handcrafted",
        body: "text-amber-100/80 leading-relaxed text-base",
        special: "text-[#fbbf24] font-black text-2xl for menu prices and specials",
      },
      components: [
        "Navbar: dark wood bg, restaurant name in warm amber, 'Reserve a Table' CTA button",
        "Hero: full-viewport dark section with overlaid heading, 'Signature Dish' featured photo described as large high-contrast image, 'Book a Table' + 'View Menu' CTAs",
        "Featured dishes: 3-column dark cards with dish name, description, and price",
        "Story section: alternating dark/amber, 'Our Story' with founding year and philosophy",
        "Ambiance gallery grid: described as 4 moody interior photos",
        "Menu preview: 3 categories (Starters, Mains, Desserts) with 3-4 items each with prices",
        "Customer reviews: 5-star ratings from real-sounding diners",
        "Reservations: elegant form with date/time picker, 'Reserve Now' button",
        "Hours + Location footer section",
      ],
      tailwindExamples: {
        section: "py-20 px-4 sm:px-8 max-w-6xl mx-auto",
        card: "bg-[#1a0f00] rounded-2xl border border-amber-900/40 p-6 hover:border-amber-700/60 transition-colors",
        button: "bg-[#d97706] hover:bg-[#b45309] text-white font-bold px-8 py-4 rounded-xl transition-colors cursor-pointer",
        heading: "text-5xl sm:text-7xl font-black text-amber-50 leading-tight",
      },
    },
    {
      name: "Bright Bistro",
      feel: "Daytime cafe or bright casual restaurant — light warm beige, terracotta accents, airy and Mediterranean feel. Linen textures suggested through subtle patterns.",
      palette: {
        background: "bg-[#FDF8F3]",
        surface: "bg-white",
        text: "text-stone-900",
        muted: "text-stone-500",
        accent: "bg-[#c2410c] hover:bg-[#9a3412]",
        accentText: "text-[#c2410c]",
        border: "border-stone-200",
      },
      typography: {
        heading: "font-black text-stone-900 — warm, friendly, inviting",
        body: "text-stone-600 leading-relaxed",
        special: "text-[#c2410c] font-black for featured dish names and specials",
      },
      components: [
        "Navbar: warm beige, logo in terracotta, 'Book Table' CTA",
        "Hero: large heading, light warm background, dish showcase",
        "Menu categories: tabbed or section-based with item cards",
        "About story: personal warmth, founding family",
        "Specials strip: highlighted daily specials with prices",
        "Reviews: warm speech bubble style",
        "Hours, address, and reservation form",
      ],
      tailwindExamples: {
        section: "py-16 px-4 sm:px-8 max-w-6xl mx-auto",
        card: "bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:shadow-md transition-shadow",
        button: "bg-[#c2410c] hover:bg-[#9a3412] text-white font-bold px-7 py-3.5 rounded-xl transition-colors cursor-pointer",
        heading: "text-4xl sm:text-6xl font-black text-stone-900 leading-tight",
      },
    },
  ],

  "Freelancer Portfolio": [
    {
      name: "Creative Dark Portfolio",
      feel: "Like a senior developer or designer's personal site — dark, bold, with neon accent. Think linear.app meets a personal portfolio. Shows technical depth and creative confidence.",
      palette: {
        background: "bg-[#09090b]",
        surface: "bg-[#111113]",
        text: "text-zinc-100",
        muted: "text-zinc-400",
        accent: "bg-[#6d28d9] hover:bg-[#5b21b6]",
        accentText: "text-violet-400",
        border: "border-zinc-800",
      },
      typography: {
        heading: "font-black text-white — large, confident, commanding viewport",
        body: "text-zinc-300 leading-relaxed text-base",
        special: "text-violet-400 font-mono text-sm for tech stack labels and code-style details",
      },
      components: [
        "Minimal navbar: first name only + 'Hire Me' CTA, transparent on scroll",
        "Hero: HUGE name display (text-7xl sm:text-9xl), specialty in smaller text below, brief tagline, 'View Work' + 'Get in Touch' CTAs, subtle animated gradient or code snippet decoration",
        "Services: 4-card grid on dark surface — service title + description + starting price",
        "Featured projects: 2-column grid with project thumbnail area (colored placeholder), stack tags, live link",
        "Tech stack: logos listed as text tags with monospace font — not icon grids",
        "Testimonials: 3 client quotes with name, company, role",
        "Availability status badge + Contact form",
      ],
      tailwindExamples: {
        section: "py-20 px-4 sm:px-8 max-w-5xl mx-auto",
        card: "bg-[#111113] rounded-2xl border border-zinc-800 p-6 hover:border-zinc-600 hover:bg-zinc-900 transition-all",
        button: "bg-[#6d28d9] hover:bg-[#5b21b6] text-white font-bold px-6 py-3 rounded-xl transition-colors cursor-pointer",
        heading: "text-7xl sm:text-9xl font-black text-white leading-none tracking-tighter",
      },
    },
    {
      name: "Light Creative Studio",
      feel: "Clean white portfolio with one bold accent color — like a freelancer who does branding or product design. Confident but approachable.",
      palette: {
        background: "bg-white",
        surface: "bg-slate-50",
        text: "text-slate-900",
        muted: "text-slate-500",
        accent: "bg-[#0f172a] hover:bg-[#1e293b]",
        accentText: "text-[#0f172a]",
        border: "border-slate-200",
      },
      typography: {
        heading: "font-black text-slate-900 tracking-tight — confident minimal",
        body: "text-slate-600 leading-relaxed",
        special: "bg-slate-900 text-white font-mono text-xs px-2 py-0.5 rounded for tech tags",
      },
      components: [
        "Navbar: white, name + nav links + 'Hire Me' black button",
        "Hero: large name in massive font, specialty below, subtle decoration",
        "Projects: large cards with colored placeholder image areas + descriptions",
        "Services with pricing",
        "About section with personality",
        "Skills as tag cloud",
        "Client testimonials",
        "Contact section",
      ],
      tailwindExamples: {
        section: "py-20 px-4 sm:px-8 max-w-5xl mx-auto",
        card: "bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300",
        button: "bg-slate-900 hover:bg-slate-700 text-white font-bold px-6 py-3 rounded-xl transition-colors cursor-pointer",
        heading: "text-5xl sm:text-7xl font-black text-slate-900 tracking-tight leading-none",
      },
    },
  ],
};

// ── Anti-patterns the model must NEVER produce ────────────────────────────────
const ANTI_PATTERNS = `
STRICT RULES — These make websites look AI-generated and are FORBIDDEN:
- NO floating gradient orbs or blobs (those abstract circle backgrounds)
- NO "Lorem ipsum" text — use realistic, specific, industry-authentic placeholder content
- NO wavy SVG dividers between sections
- NO gradient mesh backgrounds (the purple/pink/blue noise gradient look)
- NO generic icon-in-colored-circle grid patterns for services
- NO particle animations or floating dots
- NO "Transform your [X] with AI/cutting-edge/innovative" copy — use industry-specific language
- NO Tailwind gradient text on headings unless it's genuinely appropriate for the style
- NO "hero-pattern" CSS tricks
- NO emojis used as icons — use only lucide-react icons
- Section backgrounds must alternate meaningfully (not every section the same color)
- Reviews must have full names, neighborhoods, and specific experiences — not "John D. — Great service!"
- Phone numbers must be formatted like real local numbers: (555) 847-2900
- Addresses must be specific: "847 Oak Street, Suite 204, [City], [State]"
`;

// ── Business structure configs ─────────────────────────────────────────────────
const BUSINESS_CONFIGS: Record<string, { sections: string[]; lucideIcons: string; copyGuidance: string }> = {
  "Trade Business": {
    sections: [
      "Top bar: 24/7 availability + phone number prominently displayed",
      "Navbar: logo + service links + 'Free Estimate' CTA",
      "Hero: bold headline, primary CTA, trust badges (Licensed, Insured, BBB A+)",
      "Services grid: 6 core services with icon + name + brief description",
      "Why Choose Us: 4 differentiators with stats (years, projects, rating)",
      "Service Area: neighborhoods/cities served, mention response time",
      "Customer Reviews: 5 detailed reviews with name + neighborhood",
      "Emergency CTA strip: dark background, big phone, 'Call Now for Emergency Service'",
      "Contact form + address + business hours",
    ],
    lucideIcons: "Wrench, Zap, Droplets, Flame, Shield, Phone, Clock, Star, CheckCircle2, MapPin, Mail, ArrowRight, Menu, X, ChevronRight",
    copyGuidance: "Use trade-specific language: 'licensed master plumber', 'HVAC technician', 'same-day service', 'emergency dispatch', 'no hidden fees'. Mention specific services like 'water heater installation', 'panel upgrades', 'drain cleaning'.",
  },
  "Medical Practice": {
    sections: [
      "Navbar: logo + services + 'Book Appointment' CTA in accent color",
      "Hero: empathetic headline, specialty description, dual CTAs (Book + Call), trust signals",
      "Services/Specialties: 6 cards with icon + specialty name + brief description",
      "Meet the Provider: photo placeholder, credentials, medical school, board certifications, years experience",
      "Insurance & Payment: major insurance logos listed by name, payment options",
      "Patient Experience: waiting room comfort, appointment process steps",
      "Reviews: 5 patient testimonials with first name + last initial + condition treated",
      "Appointment Booking Form: name, phone, insurance, preferred time, reason for visit",
      "Contact: address with floor/suite, phone, fax, hours M-F + weekend",
    ],
    lucideIcons: "Heart, Activity, Stethoscope, Calendar, Clock, Phone, MapPin, Mail, Star, CheckCircle2, Shield, ArrowRight, Menu, X, User",
    copyGuidance: "Use medical copy: 'board-certified', 'accepting new patients', 'same-day appointments available', 'in-network with most major insurance'. Never use 'cutting-edge' — say 'evidence-based' or 'clinical expertise'.",
  },
  "Law Firm": {
    sections: [
      "Navbar: firm name + practice areas dropdown + 'Free Consultation' prominent CTA",
      "Hero: powerful headline (outcome-focused, not process), credentials strip, CTA",
      "Practice Areas: 6 cards — Personal Injury, Criminal Defense, Family Law, etc.",
      "Track Record: numbers section — cases won, years combined experience, settlements recovered",
      "About the Firm: founding story, core values, approach to client representation",
      "Attorney Profiles: 2-3 attorneys with name, title, bar admissions, photo placeholder",
      "Client Testimonials: 5 detailed reviews with case type mentioned",
      "Awards & Recognition: Super Lawyers, Best Lawyers, AV Preeminent listed by name",
      "Free Consultation Form: name, phone, case type, brief description",
    ],
    lucideIcons: "Scale, Shield, Briefcase, Award, Users, Phone, Mail, MapPin, Star, CheckCircle2, ArrowRight, Menu, X, Clock",
    copyGuidance: "Use legal language: 'experienced trial attorney', 'maximize your compensation', 'aggressive legal representation', 'no fee unless we win'. For practice areas use specific terms: 'slip and fall', 'wrongful termination', 'DUI defense'.",
  },
  "Restaurant / Cafe": {
    sections: [
      "Navbar: restaurant name + Menu + About + Reservations + 'Book Table' CTA",
      "Hero: atmospheric full-section, restaurant name large, tagline, dual CTAs (Reserve + View Menu)",
      "Featured Dishes: 3 signature dishes with name, description, and price",
      "Our Story: founding narrative, chef background, philosophy of food",
      "Menu Preview: 3 categories with 3-4 items each — item name + description + price",
      "Ambiance: gallery section described as 4 interior/food photos",
      "Customer Reviews: 5 detailed diner experiences",
      "Reservations: date, time, party size, name, phone, special requests",
      "Hours + Location: detailed hours Mon-Sun, address, neighborhood description",
    ],
    lucideIcons: "UtensilsCrossed, Clock, MapPin, Phone, Star, Calendar, Users, ChefHat, ArrowRight, Menu, X, Heart",
    copyGuidance: "Use food copy: specific dish ingredients, cooking methods, farm-to-table if applicable, neighborhood context. Hours format: 'Tuesday – Sunday, 11:30am – 10pm. Closed Mondays.' Prices like '$18' not '$18.00'.",
  },
  "Freelancer Portfolio": {
    sections: [
      "Minimal navbar: first name + nav links + 'Hire Me' CTA",
      "Hero: name huge, specialty in smaller text, tagline, availability status badge, CTAs",
      "Services: 4-6 services with title, description, and starting price",
      "Featured Work: 3-4 projects with title, client, stack used, outcome, link placeholder",
      "Tech Stack: languages and tools listed as tag chips",
      "Process: 4 steps of how you work with clients",
      "Testimonials: 3 client quotes with name, company, role",
      "About: personality section — background, interests, working style",
      "Contact: form + email + response time commitment",
    ],
    lucideIcons: "Code2, Globe, Laptop, Rocket, Star, Mail, Github, Linkedin, ArrowRight, Menu, X, Terminal, Zap, CheckCircle2",
    copyGuidance: "Use developer/designer language: 'React & TypeScript specialist', 'pixel-perfect implementation', 'delivered on time and on budget'. Stack tags should be realistic: Next.js, TypeScript, Tailwind CSS, PostgreSQL, AWS.",
  },
};

function pickDesignBrief(businessType: string): DesignBrief {
  const options = BUSINESS_DESIGN_SYSTEMS[businessType] ?? BUSINESS_DESIGN_SYSTEMS["Trade Business"];
  return options[Math.floor(Math.random() * options.length)];
}

function buildPrompt(
  businessType: string,
  businessName: string,
  tagline: string,
  city: string,
  brief: DesignBrief,
): string {
  const config = BUSINESS_CONFIGS[businessType] ?? BUSINESS_CONFIGS["Trade Business"];
  const sections = config.sections.map((s, i) => `${i + 1}. ${s}`).join("\n");

  return `You are a world-class React/Next.js developer who specializes in industry-specific web design.
Generate a COMPLETE, stunning, production-ready homepage for a ${businessType}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BUSINESS INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Business Name: "${businessName || (businessType + " of " + (city || "New York"))}"
- Tagline: "${tagline || "Professional " + businessType + " services in " + (city || "New York")}"
- City: "${city || "New York, NY"}"
- Type: ${businessType}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESIGN SYSTEM: ${brief.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Visual Feel: ${brief.feel}

Color System:
- Page background: ${brief.palette.background}
- Surface/cards: ${brief.palette.surface}
- Primary text: ${brief.palette.text}
- Muted text: ${brief.palette.muted}
- Accent (buttons, highlights): ${brief.palette.accent}
- Accent text/links: ${brief.palette.accentText}
- Borders: ${brief.palette.border}

Typography Rules:
- Headings: ${brief.typography.heading}
- Body: ${brief.typography.body}
- Special elements: ${brief.typography.special}

Tailwind Class Examples (use as base patterns):
- Section wrapper: ${brief.tailwindExamples.section}
- Cards: ${brief.tailwindExamples.card}
- Primary button: ${brief.tailwindExamples.button}
- Main heading: ${brief.tailwindExamples.heading}

Industry-Specific Component Rules:
${brief.components.map((c, i) => `${i + 1}. ${c}`).join("\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUIRED PAGE SECTIONS (in order)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${sections}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COPYWRITING GUIDANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${config.copyGuidance}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECHNICAL REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Start with: "use client";\n\nimport { useState } from "react";
2. Import ONLY these lucide-react icons at the top: ${config.lucideIcons}
3. Use ONLY Tailwind CSS v4 utility classes
4. Every section MUST be mobile-responsive (sm: md: lg: breakpoints)
5. Include smooth hover effects: hover:shadow-lg, transition-all duration-300, hover:-translate-y-0.5
6. Mobile hamburger menu with useState (open/close) on navbar
7. All clickable elements must have cursor-pointer
8. Minimum touch target size 44x44px for all interactive elements
9. At least 5 customer reviews with realistic content (full name, neighborhood, specific detail)
10. All form inputs must have associated label elements
11. Business phone format: (555) 847-XXXX
12. Sections should alternate backgrounds meaningfully per the design system

${ANTI_PATTERNS}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Return ONLY the complete TypeScript JSX for src/app/page.tsx.
No markdown fences. No explanation. No imports other than React useState and lucide-react.
Raw .tsx code starting with "use client";`;
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

function readme(businessName: string, businessType: string, designName: string) {
  return `# ${businessName || "My Business"} — Website

Generated by **AIHub Website Builder**
Business Type: ${businessType}
Design System: ${designName}

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

- Edit \`src/app/page.tsx\` — all content lives in one file
- Replace placeholder phone numbers, addresses, and names with your real info
- Update colors by changing Tailwind classes matching the design system
- Add real photos by replacing the placeholder sections with \`<img>\` tags

---
Generated by AIHub · aihub-eight-xi.vercel.app
`;
}

export async function POST(req: NextRequest) {
  try {
    const { businessType, businessName, tagline, city } = await req.json();

    const brief = pickDesignBrief(businessType);
    const prompt = buildPrompt(businessType, businessName, tagline, city, brief);

    const pageCode = await callModel(
      [
        {
          role: "system",
          content: `You are a senior UI engineer who builds industry-specific websites that look like they were made by a human designer for that specific industry — not a generic AI-generated template. You follow the design brief exactly and never produce generic floating blobs, gradient meshes, or lorem ipsum. Raw .tsx code only, no markdown.`,
        },
        { role: "user", content: prompt },
      ],
      8000,
    );

    const cleanCode = pageCode
      .replace(/^```(?:tsx?|jsx?)?\n?/gm, "")
      .replace(/```$/gm, "")
      .trim();

    const files = [
      { name: "README.md", content: readme(businessName, businessType, brief.name) },
      { name: "package.json", content: packageJson(businessName) },
      { name: "next.config.ts", content: `import type { NextConfig } from "next";\nconst nextConfig: NextConfig = {};\nexport default nextConfig;\n` },
      { name: "src/app/layout.tsx", content: rootLayout(businessName, tagline) },
      { name: "src/app/globals.css", content: globalsCss() },
      { name: "src/app/page.tsx", content: cleanCode },
    ];

    const zip = new JSZip();
    const slug = (businessName || "website").toLowerCase().replace(/[^a-z0-9]/g, "-");
    const root = zip.folder(slug)!;
    for (const f of files) root.file(f.name, f.content);
    const buffer = await zip.generateAsync({ type: "arraybuffer" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${slug}-website.zip"`,
        "X-Design-Style": brief.name,
        "X-Files-Count": String(files.length),
      },
    });
  } catch (err) {
    console.error("[generate-website]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
