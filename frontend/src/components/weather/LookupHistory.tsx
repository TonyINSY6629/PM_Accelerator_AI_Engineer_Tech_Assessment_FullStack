import { useState } from "react";
import { History, Trash2, Download, Edit2, Check, X, Loader2 } from "lucide-react";
import type { GeocodeMatch, LookupRecord } from "@/lib/weather-types";
import { formatShortDate } from "@/lib/weather-utils";
import { SearchBar } from "./SearchBar";

type LookupHistoryProps = {
  lookups: LookupRecord[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onUpdate: (id: number, input: { start_date: string; end_date: string; notes?: string | null }) => void;
  onExport: (id: number) => void;
  isUpdating: number | null;
  isDeleting: number | null;
  isExporting: number | null;
};

export function LookupHistory({
  lookups,
  activeId,
  onSelect,
  onDelete,
  onUpdate,
  onExport,
  isUpdating,
  isDeleting,
  isExporting,
}: LookupHistoryProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ start_date: "", end_date: "", notes: "" });

  function startEdit(record: LookupRecord) {
    setEditingId(record.lookup_id);
    setEditForm({
      start_date: record.start_date,
      end_date: record.end_date,
      notes: record.notes ?? "",
    });
  }

  function saveEdit(id: number) {
    onUpdate(id, {
      start_date: editForm.start_date,
      end_date: editForm.end_date,
      notes: editForm.notes || null,
    });
    setEditingId(null);
  }

  if (lookups.length === 0) {
    return (
      <div className="board rounded-xl p-5">
        <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
          <History className="h-5 w-5" /> History
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">No lookups yet. Search a place to begin.</p>
      </div>
    );
  }

  return (
    <div className="board rounded-xl p-5">
      <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
        <History className="h-5 w-5" /> History
      </h3>
      <ul className="mt-4 space-y-2">
        {lookups.map((record) => {
          const isActive = activeId === record.lookup_id
          const isEditing = editingId === record.lookup_id;
          const location = [record.location_name, record.state, record.country]
            .filter(Boolean)
            .join(", ");

          return (
            <li
              key={record.lookup_id}
              className={`rounded-lg border p-3 transition-colors ${
                isActive
                  ? "border-secondary bg-secondary/10"
                  : "border-border/60 bg-background/40 hover:bg-background/70"
              }`}
            >
              {isEditing ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={editForm.start_date}
                      onChange={(e) => setEditForm((f) => ({ ...f, start_date: e.target.value }))}
                      className="rounded-md border border-input bg-background/70 px-2 py-1.5 text-sm"
                    />
                    <input
                      type="date"
                      value={editForm.end_date}
                      onChange={(e) => setEditForm((f) => ({ ...f, end_date: e.target.value }))}
                      className="rounded-md border border-input bg-background/70 px-2 py-1.5 text-sm"
                    />
                  </div>
                  <input
                    type="text"
                    value={editForm.notes}
                    onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Notes"
                    className="w-full rounded-md border border-input bg-background/70 px-2 py-1.5 text-sm"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-accent"
                    >
                      <X className="h-3 w-3" /> Cancel
                    </button>
                    <button
                      onClick={() => saveEdit(record.lookup_id)}
                      disabled={isUpdating === record.lookup_id}
                      className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {isUpdating === record.lookup_id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}{" "}
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <button
                    onClick={() => onSelect(record.lookup_id)}
                    className="text-left"
                  >
                    <div className="text-sm font-medium text-foreground">{location}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatShortDate(record.start_date)} → {formatShortDate(record.end_date)}
                    </div>
                    {record.notes && (
                      <div className="mt-1 text-xs text-foreground/70 line-clamp-1">
                        {record.notes}
                      </div>
                    )}
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(record)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                      aria-label="Edit"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onExport(record.lookup_id)}
                      disabled={isExporting === record.lookup_id}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
                      aria-label="Export CSV"
                    >
                      {isExporting === record.lookup_id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => onDelete(record.lookup_id)}
                      disabled={isDeleting === record.lookup_id}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                      aria-label="Delete"
                    >
                      {isDeleting === record.lookup_id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
