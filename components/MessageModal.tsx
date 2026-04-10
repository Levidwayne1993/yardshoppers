"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

interface MessageModalProps {
  receiverId: string;
  receiverName: string;
  listingId?: string;
  listingTitle?: string;
  onClose: () => void;
}

export default function MessageModal({
  receiverId,
  receiverName,
  listingId,
  listingTitle,
  onClose,
}: MessageModalProps) {
  const supabase = createClient();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!content.trim()) return;
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: receiverId,
      listing_id: listingId || null,
      content: content.trim(),
    });

    if (!error) {
      setSent(true);
      setTimeout(() => onClose(), 1500);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#2E7D32] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
              {receiverName[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Message {receiverName}</p>
              {listingTitle && (
                <p className="text-white/70 text-xs truncate max-w-[200px]">
                  Re: {listingTitle}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition"
          >
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {sent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fa-solid fa-check text-[#2E7D32] text-2xl"></i>
              </div>
              <p className="text-lg font-semibold text-gray-900">Message Sent!</p>
              <p className="text-sm text-gray-500 mt-1">
                {receiverName} will see your message in their inbox
              </p>
            </div>
          ) : (
            <>
              {/* Quick Replies */}
              <div className="flex flex-wrap gap-2 mb-3">
                {[
                  "Is this still available?",
                  "What time does it start?",
                  "Do you accept cards?",
                  "Can I get directions?",
                ].map((quick) => (
                  <button
                    key={quick}
                    onClick={() => setContent(quick)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-full transition"
                  >
                    {quick}
                  </button>
                ))}
              </div>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type your message..."
                maxLength={2000}
                rows={4}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent resize-none"
                autoFocus
              />

              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-400">{content.length}/2000</span>
                <div className="flex gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={loading || !content.trim()}
                    className="bg-[#2E7D32] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <i className="fa-solid fa-spinner fa-spin mr-1"></i>
                    ) : (
                      <i className="fa-solid fa-paper-plane mr-1"></i>
                    )}
                    Send
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
