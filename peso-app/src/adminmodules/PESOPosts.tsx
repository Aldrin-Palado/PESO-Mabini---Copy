import { useEffect, useRef, useState, type FormEvent } from "react";
import { supabase } from "../services/supabase";

type PESOPost = {
  id: string;
  title: string;
  content: string;
  category: string;
  image_url: string | null;
  image_urls: string[] | null;
  status: "published" | "draft";
  created_at: string;
  created_by: string | null;
};

type SelectedImage = {
  file: File;
  previewUrl: string;
};

const categories = ["Activities", "Achievements", "Events", "Programs"];
const imageTypes = ["image/jpeg", "image/png", "image/webp"];
const imageTypeLabels = "JPG, PNG, or WEBP";
const bucketName = "peso-post-images";
const emptyForm = {
  title: "",
  content: "",
  category: "Activities",
  status: "draft" as PESOPost["status"],
};

function getSupabaseErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (!error || typeof error !== "object") {
    return error instanceof Error ? error.message : "Unknown database error.";
  }

  const details = error as {
    code?: unknown;
    message?: unknown;
    details?: unknown;
    hint?: unknown;
  };
  const code = typeof details.code === "string" ? details.code : "";
  const message =
    typeof details.message === "string"
      ? details.message
      : error instanceof Error
        ? error.message
        : "Unknown database error.";
  const normalizedMessage = message.toLowerCase();
  const missingTable =
    code === "42P01" ||
    code === "PGRST205" ||
    (normalizedMessage.includes("peso_posts") &&
        (normalizedMessage.includes("does not exist") ||
          normalizedMessage.includes("could not find") ||
          normalizedMessage.includes("schema cache")));

  if (missingTable) {
    return `PESO posts database setup is missing or unavailable. Apply the latest Supabase migration. Details: ${message}`;
  }

  const extra = [
    typeof details.details === "string" ? details.details : "",
    typeof details.hint === "string" ? details.hint : "",
  ].filter(Boolean);

  return [message, ...extra].join(" ");
}

function getStoredImagePath(imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  const marker = `/${bucketName}/`;
  const pathStart = imageUrl.indexOf(marker);
  if (pathStart < 0) return null;
  return decodeURIComponent(imageUrl.slice(pathStart + marker.length).split("?")[0]);
}

function getPostImages(post: PESOPost): string[] {
  return [...new Set([...(post.image_urls ?? []), ...(post.image_url ? [post.image_url] : [])])];
}

export default function PESOPosts() {
  const [posts, setPosts] = useState<PESOPost[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const selectedImagesRef = useRef<SelectedImage[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [editingPost, setEditingPost] = useState<PESOPost | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyPostId, setBusyPostId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void fetchPosts();
  }, []);

  useEffect(
    () => () => selectedImagesRef.current.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl)),
    [],
  );

  const fetchPosts = async () => {
    setLoading(true);
    setLoadError("");

    try {
      const { data, error } = await supabase
        .from("peso_posts")
        .select("id, title, content, category, image_url, image_urls, status, created_at, created_by")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts((data ?? []) as PESOPost[]);
    } catch (error) {
      console.error("Error fetching PESO posts:", error);
      setLoadError(`Unable to load PESO posts: ${getSupabaseErrorMessage(error)}`);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    selectedImagesRef.current.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
    selectedImagesRef.current = [];
    setSelectedImages([]);
    setExistingImageUrls([]);
    setEditingPost(null);
    setShowForm(false);
    setActionError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageChange = (files: FileList | null) => {
    const newFiles = Array.from(files ?? []);
    if (newFiles.length === 0) return;
    const invalidType = newFiles.find((file) => !imageTypes.includes(file.type));
    if (invalidType) {
      setActionError(`Choose images in ${imageTypeLabels} format.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    const oversizedImage = newFiles.find((file) => file.size > 5 * 1024 * 1024);
    if (oversizedImage) {
      setActionError(`Each image must not exceed 5 MB (${oversizedImage.name}).`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setActionError("");
    const additions = newFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    const next = [...selectedImagesRef.current, ...additions];
    selectedImagesRef.current = next;
    setSelectedImages(next);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEdit = (post: PESOPost) => {
    setEditingPost(post);
    setForm({
      title: post.title,
      content: post.content,
      category: post.category,
      status: post.status,
    });
    selectedImagesRef.current.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
    selectedImagesRef.current = [];
    setSelectedImages([]);
    setExistingImageUrls(getPostImages(post));
    setActionError("");
    setNotice("");
    setShowForm(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const uploadImage = async (
    postId: string,
    selectedImage: File,
  ): Promise<{ url: string; path: string }> => {
    const extension = selectedImage.type === "image/jpeg"
      ? "jpg"
      : selectedImage.type === "image/png"
        ? "png"
        : "webp";
    const path = `${postId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(path, selectedImage, {
        cacheControl: "3600",
        upsert: false,
        contentType: selectedImage.type,
      });

    if (error) throw error;
    const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
    return { url: data.publicUrl, path };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const title = form.title.trim();
    const content = form.content.trim();
    if (!title || !content) {
      setActionError("Enter both a post title and description.");
      return;
    }

    setSaving(true);
    setActionError("");
    setNotice("");
    const uploadedImagePaths: string[] = [];
    let newlyCreatedPostId: string | null = null;
    let imageCleanupWarning = false;

    try {
      let postId = editingPost?.id;
      if (!postId) {
        const { data, error } = await supabase
          .from("peso_posts")
          .insert({
            title: form.title.trim(),
            content: form.content.trim(),
            category: form.category,
            status: form.status,
          })
          .select("id")
          .single();
        if (error) throw error;
        postId = data.id;
        newlyCreatedPostId = data.id;
      }

      if (!postId) {
        throw new Error("The post could not be identified for saving.");
      }

      const uploadedImages: { url: string; path: string }[] = [];
      for (const selectedImage of selectedImages) {
        const uploadedImage = await uploadImage(postId, selectedImage.file);
        uploadedImages.push(uploadedImage);
        uploadedImagePaths.push(uploadedImage.path);
      }
      const imageUrls = [
        ...existingImageUrls,
        ...uploadedImages.map(({ url }) => url),
      ];

      const update = await supabase
        .from("peso_posts")
        .update({
          title,
          content,
          category: form.category,
          status: form.status,
          image_url: imageUrls[0] ?? null,
          image_urls: imageUrls,
        })
        .eq("id", postId);
      if (update.error) throw update.error;

      if (editingPost) {
        const oldImageUrls = getPostImages(editingPost);
        const removedImagePaths = oldImageUrls
          .filter((url) => !imageUrls.includes(url))
          .map(getStoredImagePath)
          .filter((path): path is string => path !== null);
        if (removedImagePaths.length > 0) {
          const { error } = await supabase.storage
            .from(bucketName)
            .remove(removedImagePaths);
          if (error) {
            console.error("Could not remove deleted PESO post images:", error);
            imageCleanupWarning = true;
          }
        }
      }

      setNotice(
        imageCleanupWarning
          ? "Post saved, but the previous image could not be removed from storage."
          : form.status === "published"
            ? "Post published. It is now visible on the public home page."
            : "Draft saved. Publish it when it is ready for the public home page.",
      );
      resetForm();
      await fetchPosts();
    } catch (error) {
      console.error("Error saving PESO post:", error);
      if (newlyCreatedPostId) {
        const { error: postCleanupError } = await supabase
          .from("peso_posts")
          .delete()
          .eq("id", newlyCreatedPostId);
        if (postCleanupError) {
          console.error("Could not remove incomplete PESO post:", postCleanupError);
        }
      }
      if (uploadedImagePaths.length > 0) {
        const { error: cleanupError } = await supabase.storage
          .from(bucketName)
          .remove(uploadedImagePaths);
        if (cleanupError) {
          console.error("Could not clean up an unused PESO post image:", cleanupError);
        }
      }
      setActionError(
        error instanceof Error ? `Failed to save post: ${error.message}` : "Failed to save PESO post.",
      );
    } finally {
      setSaving(false);
    }
  };

  const updatePostStatus = async (post: PESOPost) => {
    setBusyPostId(post.id);
    setActionError("");
    setNotice("");
    const status = post.status === "published" ? "draft" : "published";

    try {
      const { error } = await supabase
        .from("peso_posts")
        .update({ status })
        .eq("id", post.id);
      if (error) throw error;
      setNotice(status === "published" ? "Post published." : "Post moved to drafts.");
      await fetchPosts();
    } catch (error) {
      console.error("Error changing PESO post status:", error);
      setActionError(
        `Unable to update post: ${
          error instanceof Error ? error.message : "Unexpected error."
        }`,
      );
    } finally {
      setBusyPostId(null);
    }
  };

  const deletePost = async (post: PESOPost) => {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    setBusyPostId(post.id);
    setActionError("");
    setNotice("");

    try {
      const { error } = await supabase.from("peso_posts").delete().eq("id", post.id);
      if (error) throw error;

      const imagePaths = getPostImages(post)
        .map(getStoredImagePath)
        .filter((path): path is string => path !== null);
      if (imagePaths.length > 0) {
        const { error: imageError } = await supabase.storage
          .from(bucketName)
          .remove(imagePaths);
        if (imageError) {
          console.error("Could not remove deleted PESO post image:", imageError);
          setNotice("Post deleted, but its image could not be removed from storage.");
        } else {
          setNotice("Post deleted.");
        }
      } else {
        setNotice("Post deleted.");
      }
      await fetchPosts();
    } catch (error) {
      console.error("Error deleting PESO post:", error);
      setActionError(
        `Unable to delete post: ${
          error instanceof Error ? error.message : "Unexpected error."
        }`,
      );
    } finally {
      setBusyPostId(null);
    }
  };

  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      !normalizedSearch ||
      post.title.toLocaleLowerCase().includes(normalizedSearch) ||
      post.content.toLocaleLowerCase().includes(normalizedSearch);
    const matchesCategory =
      categoryFilter === "All" || post.category === categoryFilter;
    const matchesStatus = statusFilter === "All" || post.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });
  const publishedCount = posts.filter((post) => post.status === "published").length;
  const draftCount = posts.length - publishedCount;

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-1 text-sm font-medium text-blue-700">Content Management</p>
          <h1 className="text-2xl font-bold text-[#123B70] md:text-3xl">PESO Posts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Share official activities, achievements, events, and programs on the public home page.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowForm(true);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="rounded-lg bg-blue-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900"
        >
          Create post
        </button>
      </header>

      {actionError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {actionError}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {notice}
        </p>
      )}

      <section aria-label="Post statistics" className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total posts", value: posts.length, color: "text-[#123B70]" },
          { label: "Published", value: publishedCount, color: "text-green-600" },
          { label: "Drafts", value: draftCount, color: "text-orange-500" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`mt-2 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </section>

      {showForm && (
        <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm md:p-7">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#123B70]">
                {editingPost ? "Edit post" : "Create a post"}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Published posts appear on the public home page. Drafts are visible only to staff and admins.
              </p>
            </div>
            <button type="button" onClick={resetForm} className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100">
              Close
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block text-sm font-semibold text-gray-700">
              Post title
              <input
                type="text"
                value={form.title}
                maxLength={160}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="Give your post a clear title"
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                required
              />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block text-sm font-semibold text-gray-700">
                Category
                <select
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-600"
                >
                  {categories.map((category) => <option key={category}>{category}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold text-gray-700">
                Status
                <select
                  value={form.status}
                  onChange={(event) => setForm({
                    ...form,
                    status: event.target.value as PESOPost["status"],
                  })}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-600"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>
            </div>

            <label className="block text-sm font-semibold text-gray-700">
              Description
              <textarea
                rows={7}
                value={form.content}
                maxLength={10000}
                onChange={(event) => setForm({ ...form, content: event.target.value })}
                placeholder="Share useful details about the PESO activity, event, program, or achievement."
                className="mt-2 w-full resize-y rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                required
              />
              <span className="mt-1 block text-right text-xs font-normal text-gray-400">
                {form.content.length}/10,000
              </span>
            </label>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Post images (optional)
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex min-h-28 w-full items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-center transition hover:border-blue-500 hover:bg-blue-50"
              >
                <span>
                  <span className="block text-sm font-semibold text-gray-700">
                    Add one or more images
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    {imageTypeLabels} · up to 5 MB each
                  </span>
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                onChange={(event) => handleImageChange(event.target.files)}
              />
              {(existingImageUrls.length > 0 || selectedImages.length > 0) && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {existingImageUrls.map((imageUrl) => (
                    <div key={imageUrl} className="relative overflow-hidden rounded-lg border border-gray-200">
                      <img src={imageUrl} alt="Existing post image" className="h-28 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          setExistingImageUrls((current) =>
                            current.filter((url) => url !== imageUrl),
                          )
                        }
                        aria-label="Remove existing image"
                        className="absolute right-1 top-1 rounded-full bg-slate-950/75 px-2 py-1 text-xs font-bold text-white hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {selectedImages.map((image, index) => (
                    <div key={`${image.file.name}-${image.previewUrl}`} className="relative overflow-hidden rounded-lg border border-gray-200">
                      <img src={image.previewUrl} alt={image.file.name} className="h-28 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          URL.revokeObjectURL(image.previewUrl);
                          const next = selectedImagesRef.current.filter((_, currentIndex) => currentIndex !== index);
                          selectedImagesRef.current = next;
                          setSelectedImages(next);
                        }}
                        aria-label={`Remove ${image.file.name}`}
                        className="absolute right-1 top-1 rounded-full bg-slate-950/75 px-2 py-1 text-xs font-bold text-white hover:bg-red-700"
                      >
                        Remove
                      </button>
                      <p className="truncate px-2 py-1 text-xs text-gray-600">{image.file.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse justify-end gap-3 border-t border-gray-100 pt-5 sm:flex-row">
              <button type="button" onClick={resetForm} disabled={saving} className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="rounded-lg bg-blue-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:cursor-wait disabled:opacity-60">
                {saving ? "Saving..." : form.status === "published" ? "Publish post" : "Save draft"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
        <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-lg font-bold text-[#123B70]">Manage posts</h2>
            <p className="mt-1 text-sm text-gray-500">Search and filter drafts or published content.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search posts"
              aria-label="Search posts"
              className="min-w-0 rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-600"
            />
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              aria-label="Filter by category"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-600"
            >
              <option value="All">All categories</option>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-600"
            >
              <option value="All">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {loadError ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            <p>{loadError}</p>
            <button type="button" onClick={() => void fetchPosts()} className="mt-3 font-semibold underline">
              Try again
            </button>
          </div>
        ) : loading ? (
          <p className="py-12 text-center text-sm text-gray-500">Loading PESO posts...</p>
        ) : filteredPosts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-14 text-center">
            <h3 className="font-semibold text-gray-700">
              {posts.length === 0 ? "No posts yet" : "No matching posts"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {posts.length === 0
                ? "Create a post to share PESO Mabini activities and updates."
                : "Try another search or filter."}
            </p>
            {posts.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("All");
                  setStatusFilter("All");
                }}
                className="mt-3 text-sm font-semibold text-blue-700 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredPosts.map((post) => (
              <article key={post.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-md">
                {getPostImages(post).length > 0 ? (
                  <div className="relative">
                    <img src={getPostImages(post)[0]} alt="" className="h-48 w-full bg-slate-50 object-cover" loading="lazy" />
                    {getPostImages(post).length > 1 && (
                      <span className="absolute bottom-2 right-2 rounded-full bg-slate-950/75 px-2.5 py-1 text-xs font-bold text-white">
                        {getPostImages(post).length} images
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center bg-blue-50 text-4xl text-blue-300" aria-hidden="true">
                    PESO
                  </div>
                )}
                <div className="p-5">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{post.category}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${post.status === "published" ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"}`}>
                      {post.status === "published" ? "Published" : "Draft"}
                    </span>
                  </div>
                  <h3 className="line-clamp-2 text-lg font-bold text-[#123B70]">{post.title}</h3>
                  <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-gray-600">{post.content}</p>
                  <p className="mt-4 text-xs text-gray-400">
                    {new Date(post.created_at).toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                    <button type="button" onClick={() => handleEdit(post)} disabled={busyPostId !== null} className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50">
                      Edit
                    </button>
                    <button type="button" onClick={() => void updatePostStatus(post)} disabled={busyPostId !== null} className="rounded-lg bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-100 disabled:opacity-50">
                      {busyPostId === post.id ? "Updating..." : post.status === "published" ? "Unpublish" : "Publish"}
                    </button>
                    <button type="button" onClick={() => void deletePost(post)} disabled={busyPostId !== null} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50">
                      {busyPostId === post.id ? "Working..." : "Delete"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
