import Link from "next/link";
import NewTemplateForm from "@/components/new-template-form";

export const dynamic = "force-dynamic";

export default function NewTemplatePage() {
  return (
    <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <Link
        href="/library"
        className="text-sm text-stone-500 hover:text-stone-800 inline-block"
      >
        ← Back to library
      </Link>
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-amber-700">
          Custom session
        </p>
        <h1 className="font-serif-display text-3xl font-black mt-1">
          New template
        </h1>
      </header>
      <NewTemplateForm />
    </main>
  );
}
