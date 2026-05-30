import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import LeaderboardSlider from "../components/LeaderboardSlider";
import {
  addPostComment,
  deletePostComment,
  fetchFeedPosts,
  fetchPostComments,
  likePost,
  savePost,
  sharePost,
  type FeedPost,
  type PostComment,
} from "../services/backendApi";
import { getAuthUser } from "../services/http";

const postTimes = ["2h ago", "5h ago", "Yesterday", "2 days ago"];
const zoneToneClass = {
  NEGATIVE: "from-emerald-900 via-emerald-700 to-lime-500",
  NORMAL: "from-sky-900 via-teal-700 to-emerald-500",
};

export default function Home() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<
    string | null
  >(null);
  const [commentsByPost, setCommentsByPost] = useState<
    Record<string, PostComment[]>
  >({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>(
    {},
  );
  const [commentLoadingPostId, setCommentLoadingPostId] = useState<
    string | null
  >(null);
  const [submittingCommentPostId, setSubmittingCommentPostId] = useState<
    string | null
  >(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null,
  );
  const [actionMessage, setActionMessage] = useState("");
  const authUser = getAuthUser();

  useEffect(() => {
    let active = true;

    fetchFeedPosts()
      .then((payload) => {
        if (active) {
          setPosts(payload.posts);
        }
      })
      .catch(() => {
        if (active) {
          setPosts([]);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const communityPosts = useMemo(
    () => posts.filter((post) => post.user.id !== authUser?.id),
    [authUser?.id, posts],
  );

  const handleLike = async (postId: string) => {
    const result = await likePost(postId).catch(() => null);
    if (!result) return;

    setPosts((current) =>
      current.map((item) => (item.id === postId ? result.post : item)),
    );
  };

  const handleSave = async (postId: string) => {
    const result = await savePost(postId).catch(() => null);
    if (!result) return;

    setPosts((current) =>
      current.map((item) => (item.id === postId ? result.post : item)),
    );
  };

  const updatePost = (post: FeedPost | null) => {
    if (!post) return;
    setPosts((current) =>
      current.map((item) => (item.id === post.id ? post : item)),
    );
  };

  const loadComments = async (postId: string) => {
    setCommentLoadingPostId(postId);
    const result = await fetchPostComments(postId).catch(() => null);
    if (result) {
      setCommentsByPost((current) => ({
        ...current,
        [postId]: result.comments,
      }));
    }
    setCommentLoadingPostId(null);
  };

  const handleOpenComments = async (postId: string) => {
    const nextPostId = activeCommentsPostId === postId ? null : postId;
    setActiveCommentsPostId(nextPostId);
    if (nextPostId && !commentsByPost[nextPostId]) {
      await loadComments(nextPostId);
    }
  };

  const handleSubmitComment = async (postId: string) => {
    const body = commentDrafts[postId]?.trim();
    if (!body) return;

    setSubmittingCommentPostId(postId);
    const result = await addPostComment(postId, body).catch(() => null);
    setSubmittingCommentPostId(null);

    if (!result) {
      setActionMessage("Comment failed. Please try again.");
      return;
    }

    setCommentDrafts((current) => ({ ...current, [postId]: "" }));
    setCommentsByPost((current) => ({
      ...current,
      [postId]: [...(current[postId] ?? []), result.comment],
    }));
    updatePost(result.post);
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    setDeletingCommentId(commentId);
    const result = await deletePostComment(postId, commentId).catch(() => null);
    setDeletingCommentId(null);

    if (!result) {
      setActionMessage("Comment delete failed. Please try again.");
      return;
    }

    setCommentsByPost((current) => ({
      ...current,
      [postId]: (current[postId] ?? []).filter(
        (comment) => comment.id !== commentId,
      ),
    }));
    updatePost(result.post);
    setActionMessage("Comment deleted.");
  };

  const handleShare = async (post: FeedPost) => {
    const shareUrl = `${window.location.origin}/?post=${encodeURIComponent(post.id)}`;
    const shareData = {
      title: "PlanTree planting post",
      text: `${post.user.name} planted ${post.trees} trees on PlanTree.`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        const result = await sharePost(post.id).catch(() => null);
        if (result) updatePost(result.post);
        setActionMessage("Post shared.");
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      const result = await sharePost(post.id).catch(() => null);
      if (result) updatePost(result.post);
      setActionMessage("Post link copied.");
    } catch {
      setActionMessage("Share cancelled.");
    }
  };

  return (
    <section className="space-y-4 p-4">
      <LeaderboardSlider />

      <div className="space-y-1 px-1">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
          Posts
        </p>
        <h2 className="text-xl font-semibold text-slate-900">
          Latest posts from other planters
        </h2>
      </div>

      {actionMessage ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <span>{actionMessage}</span>
          <button
            type="button"
            onClick={() => setActionMessage("")}
            className="text-emerald-700"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {loading ? (
        <Card>
          <p className="text-sm text-slate-500">Loading community feed...</p>
        </Card>
      ) : (
        <div className="space-y-5">
          {communityPosts.map((post, index) => {
            const initials = post.user.name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            const toneClass = zoneToneClass[post.zoneTag ?? "NORMAL"];

            return (
              <Card key={post.id} className="overflow-hidden p-0">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {post.user.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {post.user.place} -{" "}
                        {postTimes[index % postTimes.length]}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label={`More actions for ${post.user.name}'s post`}
                    className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                </div>

                <div
                  className={`relative aspect-[4/5] bg-gradient-to-br ${toneClass}`}
                >
                  {post.photoUrls?.[0] ? (
                    <img
                      src={post.photoUrls[0]}
                      alt={`${post.user.name} planting proof`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.24),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.18),transparent_30%)]" />
                  )}
                  {post.photoUrls && post.photoUrls.length > 1 ? (
                    <div className="absolute right-3 top-3 flex gap-1">
                      {post.photoUrls.slice(0, 3).map((url, photoIndex) => (
                        <img
                          key={url}
                          src={url}
                          alt={`Planting proof ${photoIndex + 1}`}
                          className="h-12 w-12 rounded-xl border border-white/50 object-cover shadow-sm"
                        />
                      ))}
                    </div>
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <div className="inline-flex rounded-full border border-white/20 bg-black/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                      {post.trees} trees planted
                    </div>
                    <p className="mt-3 max-w-[17rem] text-2xl font-semibold leading-tight">
                      {post.caption}
                    </p>
                  </div>
                </div>

                <div className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-slate-700">
                      <button
                        type="button"
                        onClick={() => handleLike(post.id)}
                        aria-label="Like post"
                        className="transition hover:text-rose-500"
                      >
                        <Heart size={20} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenComments(post.id)}
                        aria-label="Comment on post"
                        className={`transition hover:text-emerald-600 ${
                          activeCommentsPostId === post.id
                            ? "text-emerald-600"
                            : ""
                        }`}
                      >
                        <MessageCircle size={20} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShare(post)}
                        aria-label="Share post"
                        className="transition hover:text-emerald-600"
                      >
                        <Send size={20} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSave(post.id)}
                      aria-label="Save post"
                      className={`transition hover:text-emerald-600 ${
                        post.saved ? "text-emerald-600" : ""
                      }`}
                    >
                      <Bookmark size={20} />
                    </button>
                  </div>

                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    {post.likes} likes - {post.comments} comments
                    {post.shares ? ` - ${post.shares} shares` : ""}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    <span className="mr-2 font-semibold text-slate-900">
                      {post.user.name}
                    </span>
                    {post.caption}
                  </p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                    {post.zoneTag === "NEGATIVE"
                      ? "Negative impact zone"
                      : "Community green zone"}
                  </p>

                  {activeCommentsPostId === post.id ? (
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <div className="space-y-3">
                        {commentLoadingPostId === post.id ? (
                          <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">
                            Loading comments...
                          </p>
                        ) : (commentsByPost[post.id] ?? []).length === 0 ? (
                          <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">
                            No comments yet.
                          </p>
                        ) : (
                          (commentsByPost[post.id] ?? []).map((comment) => (
                            <div
                              key={comment.id}
                              className="rounded-2xl bg-slate-50 p-3"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-slate-900">
                                    {comment.user.name}
                                  </p>
                                  <p className="text-[11px] text-slate-400">
                                    {new Date(
                                      comment.createdAt,
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                                {comment.canDelete ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteComment(post.id, comment.id)
                                    }
                                    disabled={deletingCommentId === comment.id}
                                    className="rounded-xl p-2 text-rose-500 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-rose-300"
                                    aria-label="Delete comment"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                ) : null}
                              </div>
                              <p className="mt-1 text-sm leading-5 text-slate-700">
                                {comment.body}
                              </p>
                            </div>
                          ))
                        )}
                      </div>

                      <form
                        className="mt-3 flex gap-2"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void handleSubmitComment(post.id);
                        }}
                      >
                        <input
                          value={commentDrafts[post.id] ?? ""}
                          onChange={(event) =>
                            setCommentDrafts((current) => ({
                              ...current,
                              [post.id]: event.target.value,
                            }))
                          }
                          maxLength={500}
                          placeholder="Write a comment..."
                          className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                        />
                        <button
                          type="submit"
                          disabled={submittingCommentPostId === post.id}
                          className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                        >
                          {submittingCommentPostId === post.id
                            ? "Posting"
                            : "Post"}
                        </button>
                      </form>
                    </div>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
