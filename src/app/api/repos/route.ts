import { getAllRepositories, searchRepositories } from "@/lib/repos";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    let repos;
    if (query && query.trim()) {
      repos = await searchRepositories(query);
    } else {
      repos = await getAllRepositories();
    }

    return Response.json(
      { repos, total: repos.length },
      {
        headers: {
          "Cache-Control": "public, max-age=3600", // Cache for 1 hour
        },
      }
    );
  } catch (error) {
    console.error("Repos API error:", error);
    return Response.json(
      { error: "Failed to fetch repositories", repos: [] },
      { status: 500 }
    );
  }
}
