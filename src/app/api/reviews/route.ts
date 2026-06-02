import { NextRequest, NextResponse } from "next/server";

export interface Review {
  id: string;
  ideaId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ReviewSummary {
  ideaId: string;
  avgRating: number;
  count: number;
  reviews: Review[];
}

// In-memory store — survives within server process lifetime
const store = new Map<string, Review[]>();

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function summary(ideaId: string): ReviewSummary {
  const reviews = store.get(ideaId) ?? [];
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  return { ideaId, avgRating: parseFloat(avg.toFixed(1)), count: reviews.length, reviews };
}

// GET /api/reviews?ideaId=xxx  — fetch reviews for an idea
// GET /api/reviews?all=1       — fetch all aggregated ratings
export async function GET(req: NextRequest) {
  const ideaId = req.nextUrl.searchParams.get("ideaId");
  if (ideaId) return NextResponse.json(summary(ideaId));

  // Return aggregate map { [ideaId]: ReviewSummary }
  const all: Record<string, ReviewSummary> = {};
  for (const [id] of store) all[id] = summary(id);
  return NextResponse.json(all);
}

// POST /api/reviews  — submit a review
export async function POST(req: NextRequest) {
  const { ideaId, rating, comment } = await req.json();
  if (!ideaId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "ideaId and rating (1-5) required" }, { status: 400 });
  }

  const review: Review = {
    id: uid(),
    ideaId,
    rating: Math.round(rating),
    comment: (comment ?? "").slice(0, 300),
    createdAt: new Date().toISOString(),
  };

  const list = store.get(ideaId) ?? [];
  list.push(review);
  store.set(ideaId, list);

  return NextResponse.json(summary(ideaId));
}
