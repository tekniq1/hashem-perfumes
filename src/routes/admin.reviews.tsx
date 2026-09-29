import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, MessageSquare, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { fetchAllReviews, approveReview, deleteReview } from "@/lib/reviews";
import { BlockSkeleton } from "@/components/site/Skeletons";

export const Route = createFileRoute("/admin/reviews")({
  component: AdminReviews,
});

function AdminReviews() {
  const { t, pick } = useI18n();
  const queryClient = useQueryClient();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: fetchAllReviews,
  });

  const toggleApproval = useMutation({
    mutationFn: ({ id, is_approved }: { id: string; is_approved: boolean }) =>
      approveReview(id, is_approved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success(pick("تم تحديث حالة التقييم", "Review status updated"));
    },
    onError: () => {
      toast.error(pick("حدث خطأ", "An error occurred"));
    },
  });

  const removeReview = useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success(pick("تم حذف التقييم", "Review deleted"));
    },
    onError: () => {
      toast.error(pick("حدث خطأ", "An error occurred"));
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <BlockSkeleton className="h-10 w-48" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <BlockSkeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            {pick("إدارة التقييمات", "Manage Reviews")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pick("راجع آراء العملاء واعتمدها لتظهر في المتجر", "Review and approve customer reviews")}
          </p>
        </div>
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MessageSquare className="size-6" />
        </div>
      </div>

      <div className="grid gap-4">
        {reviews?.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
            {pick("لا توجد تقييمات حتى الآن", "No reviews yet")}
          </div>
        ) : (
          reviews?.map((review) => (
            <div
              key={review.id}
              className={`relative overflow-hidden rounded-2xl border p-5 transition-all ${
                review.is_approved ? "border-primary/20 bg-card" : "border-amber-500/30 bg-amber-500/5"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-lg">{review.customer_name}</h3>
                    <div className="flex text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                         <Star
                          key={i}
                          className={`size-4 ${i < review.rating ? "fill-current" : "text-muted/30"}`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {review.products && (
                    <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {pick(review.products.name_ar, review.products.name_en)}
                    </span>
                  )}
                  
                  <p className="text-muted-foreground mt-2 text-sm max-w-2xl leading-relaxed">
                    {review.comment || pick("لا يوجد تعليق", "No comment")}
                  </p>
                  
                  <p className="text-[10px] text-muted-foreground/60 pt-2">
                    {new Date(review.created_at).toLocaleDateString("en-GB")}
                  </p>
                </div>

                <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                  {review.is_approved ? (
                    <button
                      onClick={() => toggleApproval.mutate({ id: review.id, is_approved: false })}
                      className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-600 transition-colors hover:bg-amber-500/20"
                    >
                      <X className="size-4" />
                      {pick("إلغاء النشر", "Unpublish")}
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleApproval.mutate({ id: review.id, is_approved: true })}
                      className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                    >
                      <Check className="size-4" />
                      {pick("نشر التقييم", "Publish")}
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      if (confirm(pick("هل أنت متأكد من الحذف؟", "Are you sure?"))) {
                        removeReview.mutate(review.id);
                      }
                    }}
                    className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20"
                  >
                    <Trash2 className="size-4" />
                    {pick("حذف", "Delete")}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
