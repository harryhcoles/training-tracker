"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export default function LibraryItem({
  id,
  name,
  phase,
  durationMin,
  isCustom,
  color,
}: {
  id: string;
  name: string;
  phase: string;
  durationMin: number | null;
  isCustom: boolean;
  color: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/templates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(`Delete failed: ${j.error ?? res.status}`);
        setDeleting(false);
        return;
      }
      router.refresh();
    } catch (err) {
      alert(`Delete failed: ${err instanceof Error ? err.message : "error"}`);
      setDeleting(false);
    }
  }

  return (
    <div className="bg-white rounded-xl px-4 py-3 shadow-sm flex items-center gap-3">
      <span
        className="w-2 h-10 rounded-full shrink-0"
        style={{ background: color }}
      />
      <Link href={`/session/${id}`} className="flex-1 min-w-0">
        <p className="font-semibold text-stone-900 truncate">
          {name}
          {isCustom && (
            <span className="ml-2 text-xs bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded">
              Custom
            </span>
          )}
        </p>
        <p className="text-xs text-stone-500 mt-0.5">
          {phase}
          {durationMin ? ` · ${durationMin}min` : ""}
        </p>
      </Link>
      {isCustom && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-stone-400 hover:text-red-600 p-2 shrink-0 disabled:opacity-50"
          aria-label="Delete template"
        >
          <Trash2 size={18} />
        </button>
      )}
    </div>
  );
}
