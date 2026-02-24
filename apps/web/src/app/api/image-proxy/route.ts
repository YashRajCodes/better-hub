import { NextRequest, NextResponse } from "next/server";
import { getGitHubToken } from "@/lib/github";

const ALLOWED_HOSTS = new Set([
	"github.com",
	"raw.githubusercontent.com",
	"private-user-images.githubusercontent.com",
	"github-production-user-asset-6210df.s3.amazonaws.com",
]);

export async function GET(request: NextRequest) {
	const url = request.nextUrl.searchParams.get("url");
	if (!url) {
		return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
	}

	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
	}

	if (!ALLOWED_HOSTS.has(parsed.hostname)) {
		return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
	}

	const token = await getGitHubToken();
	if (!token) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	try {
		const res = await fetch(url, {
			headers: {
				Authorization: `token ${token}`,
				Accept: "image/*,*/*",
			},
			redirect: "follow",
		});

		if (!res.ok) {
			return NextResponse.json(
				{ error: `Upstream error (${res.status})` },
				{ status: res.status },
			);
		}

		const contentType = res.headers.get("content-type") || "application/octet-stream";
		const body = await res.arrayBuffer();

		return new NextResponse(body, {
			headers: {
				"Content-Type": contentType,
				"Cache-Control": "public, max-age=3600, immutable",
			},
		});
	} catch {
		return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
	}
}
