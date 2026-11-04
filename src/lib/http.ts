import { NextResponse, type NextRequest } from "next/server";

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function assertSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const configuredOrigin = process.env.APP_URL;
  if (!origin || !configuredOrigin) return false;
  try {
    return new URL(origin).origin === new URL(configuredOrigin).origin;
  } catch {
    return false;
  }
}

export function getClientAddress(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",").map(value => value.trim()).filter(Boolean);
  const address = request.headers.get("x-real-ip") ?? forwarded?.at(-1);
  return address && address.length <= 100 ? address : "unknown";
}

export function safeErrorResponse(error: unknown): NextResponse {
  console.error("Request failed.", error);
  return jsonError("The request could not be completed. Please try again.", 500);
}
