import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { safeErrorResponse } from "@/lib/http";

export async function GET(): Promise<NextResponse> {
  try {
    const user = await getCurrentAdmin();
    return NextResponse.json({ user });
  } catch (error) {
    return safeErrorResponse(error);
  }
}
