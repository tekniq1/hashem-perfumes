import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MessageCircle, X } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { fetchApprovedReviews, addReview } from "@/lib/reviews";

export function ReviewsSection({ productId }: { productId?: string }) {
  const { t, pick } = useI18n();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");

  const { data: reviews } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: () => fetchApprovedReviews(productId),
  });

  const submitReview = useMutation({
    mutationFn: addReview,
    onSuccess: () => {
      toast.success(
        pick("تم إرسال تقييمك بنجاح وسيتم نشره بعد المراجعة", "Review submitted for approval")
      );
      setIsOpen(false);
      setName("");
      setComment("");
      setRating(5);
    },
    onError: () => {
      toast.error(pick("حدث خطأ أثناء الإرسال", "An error occurred"));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) {
      toast.error(pick("يرجى تعبئة جميع الحقول", "Please fill all fields"));
      return;
    }
    submitReview.mutate({
      customer_name: name,
      rating,
      comment,
      product_id: productId || null,
    });
  };

  return (
    <section className="py-12 border-t border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">
              {pick("آراء العملاء", "Customer Reviews")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {pick("تجارب حقيقية من عملائنا الكرام", "Real experiences from our valued customers")}
            </p>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            <MessageCircle className="size-4" />
            {pick("أضف تقييمك", "Write a Review")}
          </button>
        </div>

        {reviews?.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-muted-foreground">
            {pick("كن أول من يقيم!", "Be the first to review!")}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews?.map((review) => (
              <div key={review.id} className="glass rounded-2xl p-5 border border-primary/10">
                <div className="flex text-amber-500 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`size-4 ${i < review.rating ? "fill-current" : "text-muted/30"}`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-4">
                  "{review.comment}"
                </p>
                <div className="flex items-center justify-between border-t border-border/50 pt-3">
                  <span className="font-bold text-foreground text-sm">
                    {review.customer_name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString("en-GB")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border/80 bg-background shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border/40 bg-accent/30 px-6 py-4">
                <h3 className="font-display text-lg font-bold">
                  {pick("تقييم جديد", "New Review")}
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    {pick("كيف كانت تجربتك؟", "How was your experience?")}
                  </label>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRating(i + 1)}
                        className={`transition-colors ${
                          i < rating ? "text-amber-500" : "text-muted/30 hover:text-amber-500/50"
                        }`}
                      >
                        <Star className="size-8 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">
                    {pick("الاسم الكريم", "Your Name")}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-input bg-transparent px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none"
                    placeholder={pick("اكتب اسمك هنا", "Enter your name")}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold">
                    {pick("رأيك يهمنا", "Your Review")}
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full rounded-xl border border-input bg-transparent px-4 py-3 text-sm transition-colors focus:border-primary focus:outline-none resize-none"
                    placeholder={pick("اكتب تجربتك مع منتجاتنا...", "Tell us about your experience...")}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitReview.isPending}
                  className="w-full rounded-xl bg-gold-gradient py-3 text-sm font-bold text-primary-foreground shadow-gold-glow hover:opacity-95 disabled:opacity-50 transition-opacity"
                >
                  {submitReview.isPending 
                    ? pick("جاري الإرسال...", "Submitting...") 
                    : pick("إرسال التقييم", "Submit Review")}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
