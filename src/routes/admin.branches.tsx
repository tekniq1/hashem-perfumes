import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Clock,
  Edit2,
  ExternalLink,
  Loader2,
  MapPin,
  Phone,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import {
  createBranch,
  deleteBranch,
  fetchBranches,
  updateBranch,
  type Branch,
} from "@/lib/branches";
import { translateText } from "@/lib/translator";

export const Route = createFileRoute("/admin/branches")({
  component: AdminBranchesPage,
});

const field =
  "w-full rounded-xl border border-border bg-background/70 px-4 py-2.5 text-xs sm:text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary";

function AdminBranchesPage() {
  const { t, pick } = useI18n();
  const qc = useQueryClient();

  const [editing, setEditing] = useState<Branch | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [form, setForm] = useState<Partial<Branch>>({
    name_ar: "",
    name_en: "",
    city_ar: "سلطنة عمان",
    city_en: "Oman",
    address_ar: "",
    address_en: "",
    phone: "+96877036097",
    map_url: "",
    opening_hours_ar: "السبت - الخميس: ٩:٠٠ ص - ١٠:٠٠ م | الجمعة: ٤:٠٠ م - ١٠:٠٠ م",
    opening_hours_en: "Sat - Thu: 9:00 AM - 10:00 PM | Fri: 4:00 PM - 10:00 PM",
    display_order: 0,
    is_active: true,
  });

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ["branches-admin"],
    queryFn: () => fetchBranches(false),
  });

  const autoTranslateBranch = async () => {
    if (!form.name_ar && !form.name_en && !form.address_ar && !form.address_en) return;
    setTranslating(true);
    try {
      let nameAr = form.name_ar || "";
      let nameEn = form.name_en || "";
      let addrAr = form.address_ar || "";
      let addrEn = form.address_en || "";
      let cityAr = form.city_ar || "";
      let cityEn = form.city_en || "";

      if (nameAr && !nameEn) nameEn = await translateText(nameAr, "en");
      else if (nameEn && !nameAr) nameAr = await translateText(nameEn, "ar");

      if (addrAr && !addrEn) addrEn = await translateText(addrAr, "en");
      else if (addrEn && !addrAr) addrAr = await translateText(addrEn, "ar");

      if (cityAr && !cityEn) cityEn = await translateText(cityAr, "en");
      else if (cityEn && !cityAr) cityAr = await translateText(cityEn, "ar");

      setForm((p) => ({
        ...p,
        name_ar: nameAr,
        name_en: nameEn,
        address_ar: addrAr,
        address_en: addrEn,
        city_ar: cityAr,
        city_en: cityEn,
      }));
      toast.success(pick("تمت الترجمة التلقائية بنجاح", "Auto-translated successfully"));
    } catch {
      toast.error(pick("تعذرت الترجمة التلقائية", "Auto-translation failed"));
    } finally {
      setTranslating(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      let finalNameAr = form.name_ar?.trim() || "";
      let finalNameEn = form.name_en?.trim() || "";
      let finalAddressAr = form.address_ar?.trim() || "";
      let finalAddressEn = form.address_en?.trim() || "";

      if (!finalNameAr && !finalNameEn) {
        throw new Error(pick("يرجى إدخال اسم الفرع", "Please enter branch name"));
      }

      if (finalNameAr && !finalNameEn) finalNameEn = await translateText(finalNameAr, "en");
      else if (finalNameEn && !finalNameAr) finalNameAr = await translateText(finalNameEn, "ar");

      if (finalAddressAr && !finalAddressEn)
        finalAddressEn = await translateText(finalAddressAr, "en");
      else if (finalAddressEn && !finalAddressAr)
        finalAddressAr = await translateText(finalAddressEn, "ar");

      const payload = {
        name_ar: finalNameAr || finalNameEn,
        name_en: finalNameEn || finalNameAr,
        city_ar: form.city_ar || "سلطنة عمان",
        city_en: form.city_en || "Oman",
        address_ar: finalAddressAr || finalAddressEn,
        address_en: finalAddressEn || finalAddressAr,
        phone: form.phone || "+96877036097",
        map_url: form.map_url || null,
        opening_hours_ar: form.opening_hours_ar || null,
        opening_hours_en: form.opening_hours_en || null,
        display_order: Number(form.display_order) || 0,
        is_active: form.is_active ?? true,
      };

      if (editing) {
        await updateBranch(editing.id, payload);
      } else {
        await createBranch(payload as Omit<Branch, "id" | "created_at">);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["branches-admin"] });
      qc.invalidateQueries({ queryKey: ["branches"] });
      toast.success(t("saved"));
      setModalOpen(false);
      setEditing(null);
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : pick("حدث خطأ أثناء حفظ الفرع", "Error saving branch"),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBranch(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["branches-admin"] });
      qc.invalidateQueries({ queryKey: ["branches"] });
      toast.success(t("deleted"));
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : pick("تعذر حذف الفرع", "Failed to delete branch"),
      );
    },
  });

  const openAdd = () => {
    setEditing(null);
    setForm({
      name_ar: "",
      name_en: "",
      city_ar: "سلطنة عمان",
      city_en: "Oman",
      address_ar: "",
      address_en: "",
      phone: "+96877036097",
      map_url: "",
      opening_hours_ar: "السبت - الخميس: ٩:٠٠ ص - ١٠:٠٠ م | الجمعة: ٤:٠٠ م - ١٠:٠٠ م",
      opening_hours_en: "Sat - Thu: 9:00 AM - 10:00 PM | Fri: 4:00 PM - 10:00 PM",
      display_order: branches.length,
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEdit = (b: Branch) => {
    setEditing(b);
    setForm(b);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">
            {t("tab_branches")}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {pick(
              "إدارة مواقع الفروع وعناوينها وساعات العمل وأرقام التواصل",
              "Manage branch locations, addresses, working hours, and contact numbers.",
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-gold-gradient px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-gold-glow cursor-pointer"
        >
          <Plus className="size-4" />
          <span>{t("add_branch")}</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground">
          {pick("جاري تحميل الفروع...", "Loading branches...")}
        </div>
      ) : branches.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((b) => (
            <div
              key={b.id}
              className={`glass rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                b.is_active ? "border-border/80" : "border-border/40 opacity-60"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <MapPin className="size-4" />
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">
                        {pick(b.name_ar, b.name_en)}
                      </h4>
                      <span className="text-[11px] text-muted-foreground">
                        {pick(b.city_ar, b.city_en)}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      b.is_active
                        ? "bg-emerald-500/15 text-emerald-600"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {b.is_active ? pick("نشط", "Active") : pick("معطل", "Inactive")}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground pt-1">
                  <p className="flex items-center gap-2">
                    <MapPin className="size-3.5 text-primary/70 shrink-0" />
                    <span className="truncate">{pick(b.address_ar, b.address_en)}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="size-3.5 text-primary/70 shrink-0" />
                    <span className="truncate">{pick(b.opening_hours_ar, b.opening_hours_en)}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="size-3.5 text-primary/70 shrink-0" />
                    <span dir="ltr">{b.phone}</span>
                  </p>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-border/50 mt-4">
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEdit(b)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent cursor-pointer"
                    title={t("edit")}
                  >
                    <Edit2 className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          pick(
                            "هل أنت متأكد من حذف هذا الفرع؟",
                            "Are you sure you want to delete this branch?",
                          ),
                        )
                      ) {
                        deleteMutation.mutate(b.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                    title={t("delete")}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                {b.map_url ? (
                  <a
                    href={b.map_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="size-3" />
                    <span>{pick("الخريطة", "Map")}</span>
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl p-12 text-center max-w-md mx-auto">
          <p className="text-sm text-muted-foreground mb-4">
            {pick("لا توجد فروع مسجلة حتى الآن.", "No branches registered yet.")}
          </p>
          <button
            type="button"
            onClick={openAdd}
            className="rounded-xl bg-gold-gradient px-6 py-2.5 text-xs font-bold text-primary-foreground"
          >
            {t("add_branch")}
          </button>
        </div>
      )}

      {/* Branch Modal */}
      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="glass relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl p-6 sm:p-8 border border-border shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/70 pb-4 mb-5">
              <h3 className="font-display text-lg font-bold text-foreground">
                {editing ? pick("تعديل بيانات الفرع", "Edit Branch") : t("add_branch")}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={autoTranslateBranch}
                  disabled={translating}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg hover:bg-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                  title="ترجمة تلقائية / Auto-Translate"
                >
                  {translating ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Sparkles className="size-3" />
                  )}
                  <span>{translating ? t("auto_translating") : t("auto_translate_btn")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-muted-foreground block mb-1">
                    {pick("اسم الفرع (عربي)", "Branch Name (Arabic)")}{" "}
                    <span className="text-primary">*</span>
                  </label>
                  <input
                    className={field}
                    placeholder="الفرع الرئيسي — مسقط"
                    value={form.name_ar || ""}
                    onChange={(e) => setForm((p) => ({ ...p, name_ar: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="font-medium text-muted-foreground block mb-1">
                    {pick("اسم الفرع (إنجليزي)", "Branch Name (English)")}
                  </label>
                  <input
                    className={field}
                    placeholder="Main Branch — Muscat"
                    value={form.name_en || ""}
                    onChange={(e) => setForm((p) => ({ ...p, name_en: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-muted-foreground block mb-1">
                    {pick("المدينة / المنطقة (عربي)", "City / Region (Arabic)")}
                  </label>
                  <input
                    className={field}
                    placeholder="مسقط"
                    value={form.city_ar || ""}
                    onChange={(e) => setForm((p) => ({ ...p, city_ar: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="font-medium text-muted-foreground block mb-1">
                    {pick("المدينة (إنجليزي)", "City (English)")}
                  </label>
                  <input
                    className={field}
                    placeholder="Muscat"
                    value={form.city_en || ""}
                    onChange={(e) => setForm((p) => ({ ...p, city_en: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-muted-foreground block mb-1">
                  {pick("العنوان التفصيلي (عربي)", "Detailed Address (Arabic)")}{" "}
                  <span className="text-primary">*</span>
                </label>
                <input
                  className={field}
                  placeholder="سلطنة عمان — مسقط، الخوير"
                  value={form.address_ar || ""}
                  onChange={(e) => setForm((p) => ({ ...p, address_ar: e.target.value }))}
                />
              </div>

              <div>
                <label className="font-medium text-muted-foreground block mb-1">
                  {pick("العنوان (إنجليزي)", "Address (English)")}
                </label>
                <input
                  className={field}
                  placeholder="Sultanate of Oman — Muscat, Al Khuwair"
                  value={form.address_en || ""}
                  onChange={(e) => setForm((p) => ({ ...p, address_en: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-muted-foreground block mb-1">
                    {pick("رقم الهاتف / التواصل", "Phone Number")}
                  </label>
                  <input
                    className={field}
                    dir="ltr"
                    placeholder="+96877036097"
                    value={form.phone || ""}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="font-medium text-muted-foreground block mb-1">
                    {pick("رابط خريطة Google Maps", "Google Maps Link")}
                  </label>
                  <input
                    className={field}
                    dir="ltr"
                    placeholder="https://maps.google.com/..."
                    value={form.map_url || ""}
                    onChange={(e) => setForm((p) => ({ ...p, map_url: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-muted-foreground block mb-1">
                  {pick("ساعات وأوقات العمل (عربي)", "Opening Hours (Arabic)")}
                </label>
                <input
                  className={field}
                  placeholder="السبت - الخميس: ٩ ص - ١٠ م | الجمعة: ٤ م - ١٠ م"
                  value={form.opening_hours_ar || ""}
                  onChange={(e) => setForm((p) => ({ ...p, opening_hours_ar: e.target.value }))}
                />
              </div>

              <div>
                <label className="font-medium text-muted-foreground block mb-1">
                  {pick("ساعات وأوقات العمل (إنجليزي)", "Opening Hours (English)")}
                </label>
                <input
                  className={field}
                  placeholder="Sat - Thu: 9 AM - 10 PM | Fri: 4 PM - 10 PM"
                  value={form.opening_hours_en || ""}
                  onChange={(e) => setForm((p) => ({ ...p, opening_hours_en: e.target.value }))}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="branchActive"
                  checked={form.is_active ?? true}
                  onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                  className="rounded size-4 accent-primary"
                />
                <label
                  htmlFor="branchActive"
                  className="text-xs font-semibold text-foreground cursor-pointer"
                >
                  {pick("تفعيل وظهور الفرع للزوار", "Active and visible to visitors")}
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border/70 mt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-border px-5 py-2.5 text-xs font-medium text-foreground hover:bg-accent cursor-pointer"
                >
                  {t("cancel")}
                </button>
                <button
                  type="button"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="rounded-xl bg-gold-gradient px-7 py-2.5 text-xs font-bold text-primary-foreground shadow-gold-glow cursor-pointer disabled:opacity-50"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin inline" />
                  ) : (
                    t("save")
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
