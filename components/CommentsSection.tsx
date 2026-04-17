"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export default function CommentsSection({ listingId }: { listingId: string }) {
  const supabase = createClient();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
      await fetchComments();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchComments = async () => {
    setFetching(true);
    const { data } = await supabase
      .from("comments")
      .select("id, content, created_at, user_id, profiles(full_name, avatar_url)")
      .eq("listing_id", listingId)
      .order("created_at", { ascending: false });

    if (data) setComments(data as unknown as Comment[]);
    setFetching(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !userId) return;

    setLoading(true);
    const { error } = await supabase.from("comments").insert({
      listing_id: listingId,
      user_id: userId,
      content: newComment.trim(),
    });

    if (!error) {
      setNewComment("");
      await fetchComments();
    }
    setLoading(false);
  };

  const handleDelete = async (commentId: string) => {
    await supabase.from("comments").delete().eq("id", commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        <i className="fa-solid fa-comments text-[#2E7D32] mr-2"></i>
        Comments ({comments.length})
      </h3>

      {/* Comment Input */}
      {userId ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Ask a question or leave a comment..."
            maxLength={1000}
            rows={3}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">{newComment.length}/1000</span>
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className="bg-[#2E7D32] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <i className="fa-solid fa-spinner fa-spin mr-1"></i>
              ) : (
                <i className="fa-solid fa-paper-plane mr-1"></i>
              )}
              Post
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600">
            <a href="/login" className="text-[#2E7D32] font-semibold hover:underline">
              Sign in
            </a>{" "}
            to leave a comment
          </p>
        </div>
      )}

      {/* Comments List */}
      {fetching ? (
        <div className="text-center py-6 text-gray-400">
          <i className="fa-solid fa-spinner fa-spin text-xl"></i>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <i className="fa-regular fa-comment-dots text-3xl mb-2"></i>
          <p className="text-sm">No comments yet — be the first!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#2E7D32] flex items-center justify-center text-white font-bold text-sm">
                    {comment.profiles?.full_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {comment.profiles?.full_name || "Anonymous"}
                    </p>
                    <p className="text-xs text-gray-400">{timeAgo(comment.created_at)}</p>
                  </div>
                </div>
                {userId === comment.user_id && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-gray-300 hover:text-red-500 transition"
                    title="Delete comment"
                  >
                    <i className="fa-solid fa-trash-can text-sm"></i>
                  </button>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-700 leading-relaxed">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
