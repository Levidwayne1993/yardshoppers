"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  listing_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  partnerId: string;
  partnerName: string;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  listingTitle: string | null;
}

export default function MessagesPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePartner, setActivePartner] = useState<string | null>(null);
  const [thread, setThread] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }
      setUserId(user.id);
      await fetchConversations(user.id);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchConversations = async (uid: string) => {
    setLoading(true);
    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
      .order("created_at", { ascending: false });

    if (!messages) {
      setLoading(false);
      return;
    }

    const partnerMap = new Map<string, { msgs: Message[]; unread: number }>();

    for (const msg of messages) {
      const partnerId = msg.sender_id === uid ? msg.receiver_id : msg.sender_id;
      if (!partnerMap.has(partnerId)) {
        partnerMap.set(partnerId, { msgs: [], unread: 0 });
      }
      const entry = partnerMap.get(partnerId)!;
      entry.msgs.push(msg);
      if (!msg.is_read && msg.receiver_id === uid) {
        entry.unread++;
      }
    }

    const partnerIds = Array.from(partnerMap.keys());
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", partnerIds);

    const profileMap = new Map<string, string>();
    profiles?.forEach((p) => profileMap.set(p.id, p.full_name || "Anonymous"));

    // Get listing titles for context
    const listingIds = [
      ...new Set(
        messages
          .filter((m) => m.listing_id)
          .map((m) => m.listing_id as string)
      ),
    ];
    const listingMap = new Map<string, string>();
    if (listingIds.length > 0) {
      const { data: listings } = await supabase
        .from("listings")
        .select("id, title")
        .in("id", listingIds);
      listings?.forEach((l) => listingMap.set(l.id, l.title));
    }

    const convos: Conversation[] = [];
    partnerMap.forEach((entry, partnerId) => {
      const latest = entry.msgs[0];
      const listingId = latest.listing_id;
      convos.push({
        partnerId,
        partnerName: profileMap.get(partnerId) || "Anonymous",
        lastMessage: latest.content,
        lastTime: latest.created_at,
        unreadCount: entry.unread,
        listingTitle: listingId ? listingMap.get(listingId) || null : null,
      });
    });

    convos.sort(
      (a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()
    );

    setConversations(convos);
    setLoading(false);
  };

  const openThread = async (partnerId: string) => {
    if (!userId) return;
    setActivePartner(partnerId);
    setShowSidebar(false);

    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`
      )
      .order("created_at", { ascending: true });

    if (data) {
      setThread(data);
      // Mark unread messages as read
      const unreadIds = data
        .filter((m) => m.receiver_id === userId && !m.is_read)
        .map((m) => m.id);
      if (unreadIds.length > 0) {
        await supabase
          .from("messages")
          .update({ is_read: true })
          .in("id", unreadIds);
        setConversations((prev) =>
          prev.map((c) =>
            c.partnerId === partnerId ? { ...c, unreadCount: 0 } : c
          )
        );
      }
    }

    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleSend = async () => {
    if (!reply.trim() || !userId || !activePartner) return;
    setSending(true);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: userId,
        receiver_id: activePartner,
        listing_id: conversations.find((c) => c.partnerId === activePartner)
          ?.listingTitle
          ? null
          : null,
        content: reply.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      setThread((prev) => [...prev, data]);
      setReply("");
      setConversations((prev) =>
        prev.map((c) =>
          c.partnerId === activePartner
            ? { ...c, lastMessage: data.content, lastTime: data.created_at }
            : c
        )
      );
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    return new Date(dateStr).toLocaleDateString();
  };

  const activeConvo = conversations.find((c) => c.partnerId === activePartner);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <i className="fa-solid fa-spinner fa-spin text-[#2E7D32] text-3xl"></i>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="flex h-[calc(100vh-80px)] bg-white shadow-sm border border-gray-200 rounded-b-xl overflow-hidden">
          {/* Sidebar - Conversation List */}
          <div
            className={`w-full md:w-[340px] md:min-w-[340px] border-r border-gray-200 flex flex-col ${
              !showSidebar ? "hidden md:flex" : "flex"
            }`}
          >
            {/* Sidebar Header */}
            <div className="px-5 py-4 border-b border-gray-100">
              <h1 className="text-xl font-bold text-gray-900">
                <i className="fa-solid fa-inbox text-[#2E7D32] mr-2"></i>
                Messages
              </h1>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <i className="fa-regular fa-envelope text-gray-300 text-4xl mb-3"></i>
                  <p className="text-gray-500 text-sm">No messages yet</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Messages from sellers and buyers will appear here
                  </p>
                </div>
              ) : (
                conversations.map((convo) => (
                  <button
                    key={convo.partnerId}
                    onClick={() => openThread(convo.partnerId)}
                    className={`w-full text-left px-5 py-4 border-b border-gray-50 hover:bg-gray-50 transition ${
                      activePartner === convo.partnerId ? "bg-green-50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-full bg-[#2E7D32] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {convo.partnerName[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {convo.partnerName}
                          </p>
                          <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                            {timeAgo(convo.lastTime)}
                          </span>
                        </div>
                        {convo.listingTitle && (
                          <p className="text-xs text-[#2E7D32] truncate">
                            {convo.listingTitle}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {convo.lastMessage}
                        </p>
                      </div>
                      {convo.unreadCount > 0 && (
                        <span className="bg-[#FF6B35] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                          {convo.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Thread View */}
          <div
            className={`flex-1 flex flex-col ${
              showSidebar ? "hidden md:flex" : "flex"
            }`}
          >
            {activePartner && activeConvo ? (
              <>
                {/* Thread Header */}
                <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
                  <button
                    onClick={() => setShowSidebar(true)}
                    className="md:hidden text-gray-500 hover:text-gray-700"
                  >
                    <i className="fa-solid fa-arrow-left"></i>
                  </button>
                  <div className="w-9 h-9 rounded-full bg-[#2E7D32] flex items-center justify-center text-white font-bold text-sm">
                    {activeConvo.partnerName[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {activeConvo.partnerName}
                    </p>
                    {activeConvo.listingTitle && (
                      <p className="text-xs text-gray-400">
                        {activeConvo.listingTitle}
                      </p>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {thread.map((msg) => {
                    const isMine = msg.sender_id === userId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                            isMine
                              ? "bg-[#2E7D32] text-white rounded-br-md"
                              : "bg-gray-100 text-gray-800 rounded-bl-md"
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          <p
                            className={`text-[10px] mt-1 ${
                              isMine ? "text-white/60" : "text-gray-400"
                            }`}
                          >
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Reply Input */}
                <div className="px-4 py-3 border-t border-gray-100">
                  <div className="flex items-end gap-2">
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message..."
                      maxLength={2000}
                      rows={1}
                      className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent resize-none max-h-32"
                      style={{ minHeight: "42px" }}
                    />
                    <button
                      onClick={handleSend}
                      disabled={sending || !reply.trim()}
                      className="bg-[#2E7D32] text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      {sending ? (
                        <i className="fa-solid fa-spinner fa-spin text-sm"></i>
                      ) : (
                        <i className="fa-solid fa-paper-plane text-sm"></i>
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center px-6">
                <div>
                  <i className="fa-regular fa-comments text-gray-200 text-5xl mb-4"></i>
                  <p className="text-gray-400 text-sm">
                    Select a conversation to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
