import { redirect } from "next/navigation";
import { BeyGlyph } from "@/components/icons";
import { AuthForm } from "./auth-form";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeeded } from "@/db/seed";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const [{ mode }, user] = await Promise.all([
    searchParams,
    getCurrentUser(),
  ]);
  if (user) redirect("/dashboard");
  await ensureSeeded().catch(() => undefined);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <BeyGlyph className="h-14 w-14 spin-slow" />
          <h1 className="mt-4 text-2xl font-black uppercase tracking-[0.18em]">
            Beyblade<span className="text-blaze-500">X</span> HQ
          </h1>
          <p className="mt-1 text-sm text-white/45">
            Organizer & judge sign in — let it rip!
          </p>
        </div>
        <AuthForm defaultMode={mode === "register" ? "register" : "login"} />
        <p className="mt-6 text-center text-xs text-white/35">
          Demo organizer: <span className="text-white/60">admin@bx.gg</span> /{" "}
          <span className="text-white/60">letitrip</span>
        </p>
      </div>
    </div>
  );
}
