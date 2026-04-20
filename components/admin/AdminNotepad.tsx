"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Lightbulb,
  AlertTriangle,
  Rocket,
  StickyNote,
  Pin,
  PinOff,
  Pencil,
  Trash2,
  Send,
  RefreshCw,
  Filter,
} from "lucide-react";

interface Note {
  id: string;
  author_email: string;
  content: string;
  category: "idea" | "problem" | "upgrade" | "general";
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { value: "idea", label: "Idea", icon: Lightbulb, color: "text-yellow-500", bg: "bg-yellow-50", border: "border-yellow-200", tag: "bg-yellow-100 text-yellow-800" },
  { value: "problem", label: "Problem", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50", border: "border-red-200", tag: "bg-red-100 text-red-800" },
  { value: "upgrade", label: "Upgrade", icon: Rocket, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-200", tag: "bg-blue-100 text-blue-800" },
  { value: "general", label: "General", icon: StickyNote, color: "text-gray-500", bg: "bg-gray-50", border: "border-gray-200", tag: "bg-gray-100 text-gray-800" },
];

function getCategoryMeta(cat: string) {
  return CATEGORIES.find((c) => c.value === cat) || CATEGORIES[3];
}

function formatName(email: string) {
  if (email === "erwin-levi@outlook.com") return "Levi";
  if (email === "gary.w.erwin@gmail.com") return "Gary";
  return email.split("@")[0];
}

function timeAgo(dateStr: string) {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AdminNotepad({ userEmail }: { userEmail: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<string>("idea");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notes");
      const data = await res.json();
      if (data.notes) setNotes(data.notes);
    } catch (e) {
      console.error("Failed to fetch notes:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handlePost = async () => {
    if (!newContent.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent, category: newCategory }),
      });
      if (res.ok) {
        setNewContent("");
        fetchNotes();
      }
    } catch (e) {
      console.error("Failed to post note:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this note?")) return;
    try {
      await fetch("/api/admin/notes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchNotes();
    } catch (e) {
      console.error("Failed to delete note:", e);
    }
  };

  const handleTogglePin = async (note: Note) => {
    try {
      await fetch("/api/admin/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: note.id, is_pinned: !note.is_pinned }),
      });
      fetchNotes();
    } catch (e) {
      console.error("Failed to toggle pin:", e);
    }
  };

  const handleEdit = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
    setEditCategory(note.category);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editContent.trim()) return;
    try {
      await fetch("/api/admin/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          content: editContent,
          category: editCategory,
        }),
      });
      setEditingId(null);
      fetchNotes();
    } catch (e) {
      console.error("Failed to update note:", e);
    }
  };

  const filteredNotes =
    filterCategory === "all"
      ? notes
      : notes.filter((n) => n.category === filterCategory);

  const pinnedCount = notes.filter((n) => n.is_pinned).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            📋 Admin Notepad
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {notes.length} note{notes.length !== 1 ? "s" : ""}
            {pinnedCount > 0 && ` · ${pinnedCount} pinned`}
          </p>
        </div>
        <button
          onClick={fetchNotes}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-700 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* New Note Form */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-gray-700">Category:</span>
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.value}
                onClick={() => setNewCategory(cat.value)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  newCategory === cat.value
                    ? `${cat.tag} ring-2 ring-offset-1 ring-current`
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handlePost();
            }}
            placeholder="Write a note... ideas, bugs, feature requests, anything."
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            rows={3}
          />
          <button
            onClick={handlePost}
            disabled={!newContent.trim() || submitting}
            className="self-end px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            Post
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Ctrl+Enter to post · Posting as{" "}
          <strong>{formatName(userEmail)}</strong>
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-400" />
        <button
          onClick={() => setFilterCategory("all")}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            filterCategory === "all"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilterCategory(cat.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterCategory === cat.value
                ? cat.tag
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Notes Feed */}
      {loading && notes.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Loading notes...</div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <StickyNote className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">
            {filterCategory === "all"
              ? "No notes yet. Start brainstorming!"
              : "No notes in this category."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotes.map((note) => {
            const meta = getCategoryMeta(note.category);
            const Icon = meta.icon;
            const isOwn = note.author_email === userEmail;
            const isEditing = editingId === note.id;

            return (
              <div
                key={note.id}
                className={`border rounded-xl p-4 transition-all ${
                  note.is_pinned
                    ? "border-yellow-300 bg-yellow-50/50 shadow-sm"
                    : `${meta.border} ${meta.bg} bg-opacity-30`
                }`}
              >
                {/* Note Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${meta.tag}`}
                    >
                      <Icon className="w-3 h-3" />
                      {meta.label}
                    </span>
                    {note.is_pinned && (
                      <span className="inline-flex items-center gap-0.5 text-xs text-yellow-600 font-medium">
                        <Pin className="w-3 h-3" /> Pinned
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleTogglePin(note)}
                      className="p-1.5 text-gray-400 hover:text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors"
                      title={note.is_pinned ? "Unpin" : "Pin to top"}
                    >
                      {note.is_pinned ? (
                        <PinOff className="w-4 h-4" />
                      ) : (
                        <Pin className="w-4 h-4" />
                      )}
                    </button>
                    {isOwn && (
                      <>
                        <button
                          onClick={() => handleEdit(note)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(note.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Note Body */}
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      {CATEGORIES.map((cat) => {
                        const CatIcon = cat.icon;
                        return (
                          <button
                            key={cat.value}
                            onClick={() => setEditCategory(cat.value)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all ${
                              editCategory === cat.value
                                ? `${cat.tag} ring-2 ring-offset-1 ring-current`
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                          >
                            <CatIcon className="w-3 h-3" />
                            {cat.label}
                          </button>
                        );
                      })}
                    </div>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        className="px-3 py-1.5 bg-green-700 text-white rounded-lg text-xs font-medium hover:bg-green-800 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {note.content}
                  </p>
                )}

                {/* Note Footer */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200/50">
                  <span className="text-xs text-gray-500">
                    <strong>{formatName(note.author_email)}</strong>
                  </span>
                  <span className="text-xs text-gray-400">
                    {timeAgo(note.created_at)}
                    {note.updated_at !== note.created_at && " · edited"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
