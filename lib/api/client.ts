import type { ApiErrorBody, FieldErrors } from "./response";

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fields?: FieldErrors,
  ) {
    super(message);
  }
}

// Browser-side fetch for our JSON API. Throws ApiClientError with a user-friendly message.
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiClientError("Couldn't reach CityPulse. Check your connection and try again.", 0);
  }

  const body = (await response.json().catch(() => null)) as T | ApiErrorBody | null;
  if (!response.ok) {
    const error = body && typeof body === "object" && "error" in body ? body.error : null;
    throw new ApiClientError(
      error?.message ?? "Something went wrong on our side. Try again.",
      response.status,
      error?.fields,
    );
  }
  return body as T;
}
