import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { assertSameOrigin, jsonError, safeErrorResponse } from "@/lib/http";
import { uploadMedia } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!assertSameOrigin(request)) return jsonError("Request origin could not be verified.", 403);
  try {
    const user = await getCurrentAdmin();
    if (!user || !["SUPER_ADMIN", "ADMIN", "EDITOR"].includes(user.role)) return jsonError("You are not authorized to upload media.", 403);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError("Choose an image to upload.", 400);
    const kind = form.get("kind");
    if (kind !== "image" && kind !== "document") return jsonError("Choose whether this is an image or PDF document.", 400);
    const asset = await uploadMedia(file, kind);
    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    if (error instanceof RangeError || error instanceof TypeError) return jsonError(error.message, 400);
    return safeErrorResponse(error);
  }
}
