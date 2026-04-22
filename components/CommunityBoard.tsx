// ============================================================
// PASTE INTO: components/CommunityBoard.tsx
// ============================================================
"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase-browser";

// --------------- Types ---------------
interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Post {
  id: string;
  user_id: string;
  city: string;
  state: string;
  content: string;
  photo_urls: string[];
  category: string;
  likes_count: number;
  comments_count: number;
  is_pinned: boolean;
  created_at: string;
  profiles?: Profile;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
}

interface Props {
  userId: string;
  userCity: string;
  userState: string;
}

const CATEGORIES = [
  { value: "general",        label: "General",        icon: "fa-comments",     color: "bg-blue-100 text-blue-700" },
  { value: "yard-sale",      label: "Yard Sale",      icon: "fa-tag",          color: "bg-green-100 text-green-700" },
  { value: "recommendation", label: "Recommendation", icon: "fa-thumbs-up",    color: "bg-purple-100 text-purple-700" },
  { value: "event",          label: "Event",          icon: "fa-calendar",     color: "bg-amber-100 text-amber-700" },
  { value: "photo",          label: "Photo",          icon: "fa-camera",       color: "bg-pink-100 text-pink-700" },
  { value: "question",       label: "Question",       icon: "fa-circle-question", color: "bg-cyan-100 text-cyan-700" },
];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY"
];

function timeAgo(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function CommunityBoard({ userId, userCity, userState }: Props) {
  const supabase = createClient();

  // Area selection
  const [boardCity, setBoardCity] = useState(userCity);
  const [boardState, setBoardState] = useState(userState);
  const [showAreaPicker, setShowAreaPicker] = useState(false);
  const [tempCity, setTempCity] = useState(userCity);
  const [tempState, setTempState] = useState(userState);

  // Posts
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // New post form
  const [showComposer, setShowComposer] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);

  // Comments
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});

  // Likes (track which posts this user liked)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  // Photo viewer
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  // ---- Fetch posts ----
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("community_posts")
      .select("*, profiles(id, display_name, avatar_url)")
      .eq("state", boardState)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);

    if (boardCity) {
      query = query.eq("city", boardCity);
    }

    const { data } = await query;
    setPosts((data as Post[]) || []);
    setLoading(false);
  }, [boardState, boardCity]);

  // ---- Fetch user's likes ----
  const fetchLikes = useCallback(async () => {
    const { data } = await supabase
      .from("community_likes")
      .select("post_id")
      .eq("user_id", userId);
    if (data) {
      setLikedPosts(new Set(data.map((l) => l.post_id)));
    }
  }, [userId]);

  useEffect(() => {
    fetchPosts();
    fetchLikes();
  }, [fetchPosts, fetchLikes]);

  // ---- Photo handling ----
  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length + newPhotos.length > 4) {
      alert("Maximum 4 photos per post");
      return;
    }
    setNewPhotos((prev) => [...prev, ...files]);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPhotoPreviewUrls((prev) => [...prev, ...urls]);
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(photoPreviewUrls[index]);
    setNewPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  }

  // ---- Create post ----
  async function handleCreatePost() {
    if (!newContent.trim()) return;
    setPosting(true);

    try {
      // Upload photos if any
      const uploadedUrls: string[] = [];
      for (const file of newPhotos) {
        const ext = file.name.split(".").pop();
        const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage
          .from("community-photos")
          .upload(path, file, { cacheControl: "3600", upsert: false });

        if (!error) {
          const { data: urlData } = supabase.storage
            .from("community-photos")
            .getPublicUrl(path);
          uploadedUrls.push(urlData.publicUrl);
        }
      }

      const { error } = await supabase.from("community_posts").insert({
        user_id: userId,
        city: boardCity,
        state: boardState,
        content: newContent.trim(),
        photo_urls: uploadedUrls,
        category: newCategory,
      });

      if (!error) {
        setNewContent("");
        setNewCategory("general");
        setNewPhotos([]);
        photoPreviewUrls.forEach((u) => URL.revokeObjectURL(u));
        setPhotoPreviewUrls([]);
        setShowComposer(false);
        fetchPosts();
      }
    } catch (err) {
      console.error("Failed to create post", err);
    }

    setPosting(false);
  }

  // ---- Like / Unlike ----
  async function toggleLike(postId: string) {
    const alreadyLiked = likedPosts.has(postId);

    // Optimistic update
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (alreadyLiked) next.delete(postId);
      else next.add(postId);
      return next;
    });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likes_count: p.likes_count + (alreadyLiked ? -1 : 1) }
          : p
      )
    );

    if (alreadyLiked) {
      await supabase
        .from("community_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);
    } else {
      await supabase
        .from("community_likes")
        .insert({ post_id: postId, user_id: userId });
    }
  }

  // ---- Comments ----
  async function loadComments(postId: string) {
    if (expandedPost === postId) {
      setExpandedPost(null);
      return;
    }
    setExpandedPost(postId);
    setLoadingComments((prev) => ({ ...prev, [postId]: true }));

    const { data } = await supabase
      .from("community_comments")
      .select("*, profiles(id, display_name, avatar_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    setComments((prev) => ({ ...prev, [postId]: (data as Comment[]) || [] }));
    setLoadingComments((prev) => ({ ...prev, [postId]: false }));
  }

  async function submitComment(postId: string) {
    const text = commentText[postId]?.trim();
    if (!text) return;

    await supabase.from("community_comments").insert({
      post_id: postId,
      user_id: userId,
      content: text,
    });

    setCommentText((prev) => ({ ...prev, [postId]: "" }));
    // Refresh comments
    const { data } = await supabase
      .from("community_comments")
      .select("*, profiles(id, display_name, avatar_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    setComments((prev) => ({ ...prev, [postId]: (data as Comment[]) || [] }));
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
      )
    );
  }

  // ---- Delete own post ----
  async function deletePost(postId: string) {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    await supabase.from("community_posts").delete().eq("id", postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  // ---- Area switch ----
  function applyAreaChange() {
    setBoardCity(tempCity.trim());
    setBoardState(tempState);
    setShowAreaPicker(false);
  }

  // ---- Filtered posts ----
  const filteredPosts =
    filterCategory === "all"
      ? posts
      : posts.filter((p) => p.category === filterCategory);

  const catInfo = (cat: string) =>
    CATEGORIES.find((c) => c.value === cat) || CATEGORIES[0];

  return (
    <div>
      {/* ====== AREA HEADER ====== */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-ys-100 rounded-xl flex items-center justify-center">
            <i className="fa-solid fa-users text-ys-700" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {boardCity ? `${boardCity}, ${boardState}` : boardState} Community
            </h2>
            <p className="text-xs text-gray-500">
              {filteredPosts.length} post{filteredPosts.length !== 1 ? "s" : ""}
              {filterCategory !== "all" && ` in ${catInfo(filterCategory).label}`}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setTempCity(boardCity);
            setTempState(boardState);
            setShowAreaPicker(!showAreaPicker);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-ys-400 hover:text-ys-800 transition"
        >
          <i className="fa-solid fa-location-crosshairs text-xs" />
          Switch Area
        </button>
      </div>

      {/* ====== AREA PICKER DROPDOWN ====== */}
      {showAreaPicker && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-5 shadow-lg">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            <i className="fa-solid fa-map-pin text-ys-600 mr-2 text-xs" />
            View a different community board
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={tempCity}
              onChange={(e) => setTempCity(e.target.value)}
              placeholder="City (optional — leave blank for whole state)"
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ys-300"
            />
            <select
              value={tempState}
              onChange={(e) => setTempState(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-ys-300 min-w-[120px]"
            >
              {US_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={applyAreaChange}
                className="px-5 py-2.5 bg-ys-700 hover:bg-ys-800 text-white rounded-xl text-sm font-bold transition"
              >
                Go
              </button>
              <button
                onClick={() => setShowAreaPicker(false)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
          <button
            onClick={() => {
              setTempCity(userCity);
              setTempState(userState);
              setBoardCity(userCity);
              setBoardState(userState);
              setShowAreaPicker(false);
            }}
            className="mt-2 text-xs text-ys-600 hover:text-ys-800 font-medium transition"
          >
            <i className="fa-solid fa-house text-[10px] mr-1" />
            Back to my area
          </button>
        </div>
      )}

      {/* ====== CATEGORY FILTER ====== */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setFilterCategory("all")}
          className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition ${
            filterCategory === "all"
              ? "bg-ys-700 text-white"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilterCategory(cat.value)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
              filterCategory === cat.value
                ? "bg-ys-700 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            <i className={`fa-solid ${cat.icon} text-[10px]`} />
            {cat.label}
          </button>
        ))}
      </div>

      {/* ====== NEW POST BUTTON / COMPOSER ====== */}
      {!showComposer ? (
        <button
          onClick={() => setShowComposer(true)}
          className="w-full flex items-center gap-3 p-4 bg-white border-2 border-dashed border-gray-200 rounded-2xl hover:border-ys-400 hover:bg-ys-50/50 transition group mb-5"
        >
          <div className="w-10 h-10 bg-ys-100 rounded-full flex items-center justify-center group-hover:bg-ys-200 transition">
            <i className="fa-solid fa-plus text-ys-700 text-sm" />
          </div>
          <span className="text-sm text-gray-400 group-hover:text-ys-700 font-medium transition">
            Share something with your community...
          </span>
        </button>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">
              <i className="fa-solid fa-pen text-ys-600 mr-2 text-xs" />
              New Post
            </h3>
            <button
              onClick={() => {
                setShowComposer(false);
                setNewContent("");
                setNewPhotos([]);
                photoPreviewUrls.forEach((u) => URL.revokeObjectURL(u));
                setPhotoPreviewUrls([]);
              }}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="What's going on in your neighborhood?"
            rows={3}
            maxLength={1000}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ys-300 resize-none"
          />

          {/* Photo previews */}
          {photoPreviewUrls.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {photoPreviewUrls.map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                  <Image src={url} alt="" fill className="object-cover" />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-red-600"
                  >
                    <i className="fa-solid fa-xmark" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              {/* Category selector */}
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-ys-300"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>

              {/* Photo upload */}
              <label className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 cursor-pointer transition">
                <i className="fa-solid fa-image text-[10px]" />
                Photo
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400">
                {newContent.length}/1000
              </span>
              <button
                onClick={handleCreatePost}
                disabled={posting || !newContent.trim()}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition ${
                  posting || !newContent.trim()
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-ys-700 hover:bg-ys-800 text-white"
                }`}
              >
                {posting ? (
                  <><i className="fa-solid fa-spinner fa-spin mr-1 text-xs" /> Posting...</>
                ) : (
                  "Post"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== POSTS FEED ====== */}
      {loading ? (
        <div className="text-center py-12">
          <i className="fa-solid fa-spinner fa-spin text-2xl text-gray-300 mb-3" />
          <p className="text-sm text-gray-400">Loading community posts...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl">
          <div className="w-16 h-16 bg-ys-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-users text-2xl text-ys-300" />
          </div>
          <p className="text-gray-500 mb-2 font-medium">No posts yet in this area</p>
          <p className="text-sm text-gray-400">Be the first to start the conversation!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => {
            const cat = catInfo(post.category);
            const isOwner = post.user_id === userId;
            const liked = likedPosts.has(post.id);
            const postComments = comments[post.id] || [];
            const isExpanded = expandedPost === post.id;

            return (
              <div
                key={post.id}
                className={`bg-white border rounded-2xl overflow-hidden transition hover:shadow-md ${
                  post.is_pinned ? "border-amber-200 bg-amber-50/30" : "border-gray-100"
                }`}
              >
                {/* Post header */}
                <div className="px-5 pt-4 pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-ys-100 flex items-center justify-center shrink-0">
                        {post.profiles?.avatar_url ? (
                          <Image
                            src={post.profiles.avatar_url}
                            alt=""
                            width={40}
                            height={40}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <i className="fa-solid fa-user text-ys-400 text-sm" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {post.profiles?.display_name || "Neighbor"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400">{timeAgo(post.created_at)}</span>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.color}`}>
                            <i className={`fa-solid ${cat.icon} text-[8px]`} />
                            {cat.label}
                          </span>
                          {post.is_pinned && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                              <i className="fa-solid fa-thumbtack text-[8px]" />
                              Pinned
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isOwner && (
                      <button
                        onClick={() => deletePost(post.id)}
                        className="text-gray-300 hover:text-red-500 transition p-1"
                        title="Delete post"
                      >
                        <i className="fa-solid fa-trash text-xs" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Post content */}
                <div className="px-5 pb-3">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {post.content}
                  </p>
                </div>

                {/* Post photos */}
                {post.photo_urls && post.photo_urls.length > 0 && (
                  <div className={`px-5 pb-3 grid gap-2 ${
                    post.photo_urls.length === 1 ? "grid-cols-1" :
                    post.photo_urls.length === 2 ? "grid-cols-2" :
                    "grid-cols-2"
                  }`}>
                    {post.photo_urls.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => setViewingPhoto(url)}
                        className={`relative rounded-xl overflow-hidden bg-gray-100 ${
                          post.photo_urls.length === 1 ? "aspect-video" :
                          post.photo_urls.length === 3 && i === 0 ? "row-span-2 aspect-square" :
                          "aspect-square"
                        }`}
                      >
                        <Image
                          src={url}
                          alt=""
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 50vw, 300px"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Action bar */}
                <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-4">
                  <button
                    onClick={() => toggleLike(post.id)}
                    className={`flex items-center gap-1.5 text-sm font-semibold transition ${
                      liked
                        ? "text-red-500"
                        : "text-gray-400 hover:text-red-400"
                    }`}
                  >
                    <i className={`fa-${liked ? "solid" : "regular"} fa-heart text-xs`} />
                    {post.likes_count > 0 && post.likes_count}
                  </button>

                  <button
                    onClick={() => loadComments(post.id)}
                    className={`flex items-center gap-1.5 text-sm font-semibold transition ${
                      isExpanded
                        ? "text-ys-700"
                        : "text-gray-400 hover:text-ys-600"
                    }`}
                  >
                    <i className="fa-regular fa-comment text-xs" />
                    {post.comments_count > 0 && post.comments_count}
                  </button>
                </div>

                {/* Comments section */}
                {isExpanded && (
                  <div className="px-5 pb-4 border-t border-gray-100 bg-gray-50/50">
                    {loadingComments[post.id] ? (
                      <div className="py-4 text-center">
                        <i className="fa-solid fa-spinner fa-spin text-gray-300" />
                      </div>
                    ) : (
                      <>
                        {postComments.length > 0 && (
                          <div className="space-y-3 pt-3 mb-3">
                            {postComments.map((c) => (
                              <div key={c.id} className="flex gap-2.5">
                                <div className="w-7 h-7 rounded-full overflow-hidden bg-ys-100 flex items-center justify-center shrink-0 mt-0.5">
                                  {c.profiles?.avatar_url ? (
                                    <Image
                                      src={c.profiles.avatar_url}
                                      alt=""
                                      width={28}
                                      height={28}
                                      className="object-cover w-full h-full"
                                    />
                                  ) : (
                                    <i className="fa-solid fa-user text-ys-400 text-[10px]" />
                                  )}
                                </div>
                                <div className="flex-1 bg-white rounded-xl px-3 py-2 border border-gray-100">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-xs font-bold text-gray-800">
                                      {c.profiles?.display_name || "Neighbor"}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                      {timeAgo(c.created_at)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600">{c.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Comment input */}
                        <div className="flex gap-2 pt-2">
                          <input
                            type="text"
                            value={commentText[post.id] || ""}
                            onChange={(e) =>
                              setCommentText((prev) => ({
                                ...prev,
                                [post.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                submitComment(post.id);
                              }
                            }}
                            placeholder="Write a comment..."
                            className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-ys-300"
                          />
                          <button
                            onClick={() => submitComment(post.id)}
                            disabled={!commentText[post.id]?.trim()}
                            className="px-3 py-2 bg-ys-700 hover:bg-ys-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <i className="fa-solid fa-paper-plane" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ====== PHOTO LIGHTBOX ====== */}
      {viewingPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setViewingPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition"
            onClick={() => setViewingPhoto(null)}
          >
            <i className="fa-solid fa-xmark text-lg" />
          </button>
          <div className="relative max-w-4xl max-h-[85vh] w-full h-full">
            <Image
              src={viewingPhoto}
              alt=""
              fill
              className="object-contain"
              sizes="100vw"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
