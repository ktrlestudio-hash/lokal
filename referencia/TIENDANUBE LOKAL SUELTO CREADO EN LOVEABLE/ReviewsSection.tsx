import { useState } from "react";
import { Star } from "lucide-react";
import type { Review } from "@/lib/types";

export function ReviewsSection({
  reviews,
  onAdd,
}: {
  reviews: Review[];
  onAdd?: (r: Omit<Review, "id">) => void;
}) {
  const [author, setAuthor] = useState("");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);

  return (
    <section className="px-4 sm:px-6">
      <h2 className="text-2xl font-bold">Reseñas</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {reviews.map((r) => (
          <article key={r.id} className="tenant-surface tenant-radius border tenant-border p-4 shadow-soft">
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i < r.rating ? "tenant-primary-text fill-current" : "text-[hsl(var(--t-muted-foreground))]"}`}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold">{r.author}</span>
            </div>
            <p className="mt-2 text-sm text-[hsl(var(--t-muted-foreground))]">{r.comment}</p>
          </article>
        ))}
      </div>

      {onAdd && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!author.trim() || !comment.trim()) return;
            onAdd({ author: author.trim().slice(0, 60), comment: comment.trim().slice(0, 400), rating });
            setAuthor("");
            setComment("");
            setRating(5);
          }}
          className="mt-6 tenant-muted tenant-radius border tenant-border p-4"
        >
          <h3 className="font-semibold">Dejá tu reseña</h3>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Tu nombre"
              className="flex-1 tenant-radius-sm border tenant-border tenant-surface px-3 py-2 text-sm"
              maxLength={60}
            />
            <div className="flex items-center gap-1 tenant-surface tenant-radius-sm border tenant-border px-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setRating(i + 1)}
                  aria-label={`${i + 1} estrellas`}
                >
                  <Star
                    className={`h-5 w-5 ${i < rating ? "tenant-primary-text fill-current" : "text-[hsl(var(--t-muted-foreground))]"}`}
                  />
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="Contanos tu experiencia..."
            className="mt-2 w-full resize-none tenant-radius-sm border tenant-border tenant-surface px-3 py-2 text-sm"
            maxLength={400}
          />
          <button
            type="submit"
            className="mt-2 rounded-full tenant-primary-bg px-4 py-2 text-sm font-semibold"
          >
            Publicar reseña
          </button>
        </form>
      )}
    </section>
  );
}
