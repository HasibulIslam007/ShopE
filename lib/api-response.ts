import { NextResponse } from "next/server";

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function isValidObjectId(value: string) {
  return /^[a-f\d]{24}$/i.test(value);
}