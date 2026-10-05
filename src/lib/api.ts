import { getCurrentUser, type SafeUser } from "@/lib/auth";

export function json(data: unknown, status = 200) {
  return Response.json(data as Record<string, unknown>, { status });
}

export function badRequest(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

export function unauthorized() {
  return Response.json({ error: "You must be signed in." }, { status: 401 });
}

export function notFound(message = "Not found") {
  return Response.json({ error: message }, { status: 404 });
}

export function serverError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Unexpected server error";
  if (message.includes("duplicate key")) {
    return Response.json(
      { error: "That record already exists." },
      { status: 409 },
    );
  }
  console.error("[api]", error);
  return Response.json({ error: message }, { status: 500 });
}

export async function withUser(
  handler: (user: SafeUser) => Promise<Response>,
): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  try {
    return await handler(user);
  } catch (error) {
    return serverError(error);
  }
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    return {} as T;
  }
}

export function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

export function num(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function optionalStr(value: unknown): string | null {
  const v = str(value);
  return v.length ? v : null;
}
