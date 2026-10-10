import { NextResponse } from "next/server";

export type FieldErrors = Record<string, string>;

export type ApiErrorBody = {
  error: { code: string; message: string; fields?: FieldErrors };
};

export function apiError(status: number, code: string, message: string, fields?: FieldErrors) {
  const body: ApiErrorBody = { error: { code, message, ...(fields && { fields }) } };
  return NextResponse.json(body, { status });
}

export function validationError(fields: FieldErrors) {
  return Object.keys(fields).length > 0
    ? apiError(400, "VALIDATION_ERROR", "Check the highlighted fields.", fields)
    : apiError(400, "INVALID_BODY", "Send a valid JSON request body.");
}

export const unauthorized = () =>
  apiError(401, "UNAUTHORIZED", "Log in to continue.");

export const forbidden = () =>
  apiError(403, "FORBIDDEN", "You don't have access to this.");

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}
