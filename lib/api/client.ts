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

// Saves (PUT/PATCH/POST/DELETE) still in flight. Reads wait for them, so a page opened right after
// a change (e.g. tapping "Remind me" and going back) always loads the updated data.
const pendingWrites = new Set<Promise<unknown>>();

// Browser-side fetch for our JSON API. Throws ApiClientError with a user-friendly message.
export function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  if (method === "GET") {
    return Promise.allSettled([...pendingWrites]).then(() =>
      request<T>(path, init),
    );
  }
  const write = request<T>(path, init);
  pendingWrites.add(write);
  write.then(
    () => pendingWrites.delete(write),
    () => pendingWrites.delete(write),
  );
  return write;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiClientError(
      "Couldn't reach CityPulse. Check your connection and try again.",
      0,
    );
  }

  const body = (await response.json().catch(() => null)) as
    T | ApiErrorBody | null;
  if (!response.ok) {
    const error =
      body && typeof body === "object" && "error" in body ? body.error : null;
    throw new ApiClientError(
      error?.message ?? "Something went wrong on our side. Try again.",
      response.status,
      error?.fields,
    );
  }
  return body as T;
}
