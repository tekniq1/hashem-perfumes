import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "ar" | "en";

const dict = {
  brand: { ar: "هاشم للطيب", en: "HASHEM LELTEEB" },
  brand_sub: { ar: "للطيب", en: "LELTEEB" },
  tagline: {
    ar: "عطور فاخرة وبخور ملكي",
    en: "Luxury Perfumes & Royal Incense",
  },
  nav_home: { ar: "الرئيسية", en: "Home" },
  nav_shop: { ar: "منتجاتنا", en: "Our Products" },
  nav_offers: { ar: "العروض", en: "Offers" },
  nav_branches: { ar: "فروعنا", en: "Our Branches" },
  nav_about: { ar: "من نحن", en: "About Us" },
  nav_incense: { ar: "البخور واللبان", en: "Incense & Luban" },
  nav_perfumes: { ar: "العطور الفاخرة", en: "Fine Perfumes" },
  nav_admin: { ar: "لوحة التحكم", en: "Admin" },
  nav_orders: { ar: "طلباتي", en: "My Orders" },
  sign_in: { ar: "تسجيل الدخول", en: "Sign in" },
  sign_out: { ar: "تسجيل الخروج", en: "Sign out" },
  sign_up: { ar: "إنشاء حساب", en: "Create account" },
  email: { ar: "البريد الإلكتروني", en: "Email" },
  password: { ar: "كلمة المرور", en: "Password" },
  full_name: { ar: "الاسم الكامل", en: "Full name" },
  phone: { ar: "رقم الهاتف / الواتساب", en: "Phone / WhatsApp" },
  hero_kicker: { ar: "بخور وعطور ملكية فاخرة", en: "Royal Incense & Fine Perfume" },
  hero_title_1: { ar: "فخامة عبيرك...", en: "The Luxury of Your Scent..." },
  hero_title_2: { ar: "اختيارك.", en: "Your Choice." },
  hero_sub: {
    ar: "عطور مركّزة وبخور ملكي واللبان الحوجري الأصيل، مختارة بعناية من قلب الجزيرة.",
    en: "Concentrated perfumes, royal incense and authentic Hojari luban, curated with care.",
  },
  cta_explore: { ar: "تسوق الآن", en: "Shop now" },
  cta_featured: { ar: "اكتشف المزيد", en: "Discover more" },
  direct_whatsapp_order: { ar: "طلب مباشر عبر واتساب", en: "Direct order via WhatsApp" },
  browse_luxury_fragrances: {
    ar: "تصفح تشكيلاتنا العطرية الفاخرة",
    en: "Browse our luxury fragrance collections",
  },
  view_all: { ar: "عرض الكل", en: "View all" },
  view_all_offers: { ar: "مشاهدة كل العروض", en: "View all offers" },
  most_popular_selection: {
    ar: "المختارات الملكية الأكثر طلباً",
    en: "Most requested royal selections",
  },
  visit_branches_title: {
    ar: "تفضل بزيارتنا في فروع هاشم للطيب",
    en: "Visit Hashem Lelteeb Branches",
  },
  visit_branches_desc: {
    ar: "فروعنا في سلطنة عمان تقدم لك فرصة تجربة الروائح الملكية واللبان الحوجري الفاخر عن قرب.",
    en: "Our branches in Oman offer you the chance to experience royal scents and premium Hojari luban in person.",
  },
  view_branches_info: {
    ar: "عرض عناوين وأوقات عمل الفروع",
    en: "View branch addresses & working hours",
  },
  marquee: {
    ar: "شحن لجميع المناطق • بخور وعطور ملكية فاخرة • منتجات أصيلة ١٠٠٪",
    en: "Shipping to all areas • Royal incense & fine perfume • 100% genuine products",
  },
  value_1_title: { ar: "منتجات أصيلة ١٠٠٪", en: "100% Genuine Products" },
  value_1_body: {
    ar: "أجود أنواع العود واللبان الحوجري الطبيعي",
    en: "Finest natural oud and authentic Hojari luban",
  },
  value_2_title: { ar: "توصيل سريع", en: "Fast Delivery" },
  value_2_body: {
    ar: "توصيل لجميع مناطق السلطنة ودول الخليج",
    en: "Delivery across Oman and the GCC",
  },
  value_3_title: { ar: "خدمة عملاء واتساب", en: "WhatsApp Customer Care" },
  value_3_body: {
    ar: "تواصل مباشر مع المتجر لإتمام الطلبات",
    en: "Direct instant assistance to complete orders",
  },
  shop_by_category: { ar: "تصنيفات المتجر", en: "Shop by Category" },
  promo_videos: {
    ar: "من عالم هاشم (فيديوهات المنتجات)",
    en: "From House of Hashem (Product Videos)",
  },
  shop_tagged: { ar: "اشتري الآن", en: "Shop tagged product" },
  mute: { ar: "كتم الصوت", en: "Mute" },
  unmute: { ar: "تشغيل الصوت", en: "Unmute" },
  play: { ar: "تشغيل", en: "Play" },
  pause: { ar: "إيقاف", en: "Pause" },
  tab_videos: { ar: "الفيديوهات الترويجية", en: "Promo Videos" },
  video_title_ar: { ar: "العنوان (عربي)", en: "Title (Arabic)" },
  video_title_en: { ar: "العنوان (إنجليزي)", en: "Title (English)" },
  video_file: { ar: "ملف الفيديو", en: "Video file" },
  video_target_product: { ar: "المنتج المرتبط (اختياري)", en: "Target product (optional)" },
  video_cta_link: { ar: "رابط مخصص (اختياري)", en: "Custom link (optional)" },
  display_order: { ar: "ترتيب العرض", en: "Display order" },
  upload_video: { ar: "رفع فيديو جديد", en: "Upload new video" },
  no_videos_yet: { ar: "لا توجد فيديوهات مضافة بعد", en: "No promotional videos yet" },
  featured_products: { ar: "المنتجات المميزة", en: "Featured Products" },
  all_products: { ar: "جميع المنتجات", en: "All Products" },
  offers_title: { ar: "العروض الحصرية", en: "Exclusive Offers & Deals" },
  offers_subtitle: {
    ar: "تخفيضات خاصة على أجود العطور والبخور الملكي لفترة محدودة",
    en: "Special discounts on royal fragrances and incense for a limited time",
  },
  offers_badge: { ar: "تخفيضات وعروض خاصة", en: "Special Discounts & Deals" },
  offers_explore_desc: {
    ar: "تصفح جميع المنتجات والبخور والعطور الملكية المتوفرة في المتجر.",
    en: "Browse all available perfumes, incense and royal fragrances.",
  },
  no_offers_now: {
    ar: "لا توجد عروض نشطة حالياً، ترقبوا جديدنا قريباً!",
    en: "No active offers at the moment, stay tuned!",
  },
  branches_title: { ar: "فروعنا", en: "Our Branches" },
  branches_subtitle: {
    ar: "يسعدنا تشريفكم وزيارتكم في فروع هاشم للطيب",
    en: "We are pleased to welcome you at Hashem Lelteeb branches",
  },
  branches_updating: { ar: "جاري تحديث قائمة الفروع", en: "Branch list is being updated" },
  branches_updating_desc: {
    ar: "تواصل معنا عبر واتساب لمعرفة أقرب نقطة استلام.",
    en: "Contact us on WhatsApp for the nearest pickup point.",
  },
  about_title: { ar: "من نحن — هاشم للطيب", en: "About Us — HASHEM LELTEEB" },
  contact_us: { ar: "تواصل معنا", en: "Contact Us" },
  our_story: { ar: "قصتنا وفلسفتنا", en: "Our Story & Philosophy" },
  opening_hours: { ar: "أوقات العمل", en: "Opening Hours" },
  view_on_map: { ar: "عرض على خرائط Google", en: "View on Google Maps" },
  call_branch: { ar: "اتصال بالفرع", en: "Call Branch" },
  cart: { ar: "حقيبة الشراء", en: "Cart" },
  cart_empty: { ar: "حقيبتك فارغة حالياً", en: "Your bag is empty" },
  add_to_cart: { ar: "إضافة للحقيبة", en: "Add to bag" },
  checkout: { ar: "إتمام الطلب عبر واتساب", en: "Checkout via WhatsApp" },
  continue_shopping: { ar: "متابعة التسوق", en: "Continue shopping" },
  subtotal: { ar: "المجموع", en: "Subtotal" },
  total: { ar: "الإجمالي", en: "Total" },
  quantity: { ar: "الكمية", en: "Quantity" },
  remove: { ar: "إزالة", en: "Remove" },
  out_of_stock: { ar: "نفد من المخزون", en: "Out of stock" },
  low_stock: { ar: "متبقي قليل", en: "Low stock" },
  in_stock: { ar: "متوفر", en: "In Stock" },
  sale: { ar: "عرض خاص", en: "Special Offer" },
  delivery_method: { ar: "طريقة الاستلام / الشحن", en: "Delivery / Pickup Method" },
  home_delivery: {
    ar: "توصيل (تُحسب التكلفة حسب المنطقة)",
    en: "Delivery (cost calculated by area)",
  },
  home_delivery_title: { ar: "توصيل للمنزل", en: "Home Delivery" },
  home_delivery_desc: {
    ar: "توصيل سريع لكافة المناطق (تُحسب التكلفة حسب الموقع)",
    en: "Fast delivery to all areas (cost based on location)",
  },
  pickup_from_branch: { ar: "استلام من الفرع (Pick up)", en: "Pick up from branch" },
  pickup_from_branch_desc: {
    ar: "استلام مجاني ومباشر من أحد فروع هاشم للطيب",
    en: "Free direct pickup from Hashem Lelteeb branches",
  },
  available_pickup_branches: {
    ar: "📍 فروع الاستلام المتاحة:",
    en: "📍 Available Pickup Branches:",
  },
  main_branch_pickup_info: {
    ar: "• الفرع الرئيسي — مسقط (يومياً من ٩ ص حتى ١٠ م).",
    en: "• Main Branch — Muscat (Daily from 9 AM to 10 PM).",
  },
  pickup_ready_notice: {
    ar: "سيتم تجهيز طلبك فور تأكيد الدفع وإبلاغك بجاهزية الاستلام عبر واتساب.",
    en: "Your order will be prepared upon payment confirmation and you will be notified via WhatsApp.",
  },
  delivery_address_label: {
    ar: "عنوان وموقع التوصيل (المنطقة / الشارع / رقم المنزل)",
    en: "Delivery Address & Location (Area / Street / Building)",
  },
  view_coords_on_map: { ar: "عرض الإحداثيات على الخريطة", en: "View coordinates on map" },
  shipping_notice: {
    ar: "تنويه: التوصيل غير مجاني وتكلفته تُحسب حسب المنطقة/المحل، ويتم الدفع مسبقاً عبر التحويل البنكي.",
    en: "Notice: Delivery is not free and calculated by location. Payment is required in advance via bank transfer.",
  },
  bank_transfer: { ar: "التحويل البنكي (الدفع مسبقاً)", en: "Bank Transfer (Advance Payment)" },
  cash_on_delivery: { ar: "الدفع عند الاستلام", en: "Cash on delivery" },
  bank_details_title: {
    ar: "معلومات الحساب البنكي للدفع (بنك مسقط)",
    en: "Bank Muscat Transfer Information",
  },
  bank_transfer_instruction: {
    ar: "يرجى تحويل مبلغ الطلب إلى الحساب البنكي التالي قبل أو فور إرسال رسالة الواتساب:",
    en: "Please transfer the order amount to the following bank account before or immediately upon sending the WhatsApp message:",
  },
  bank_label: { ar: "البنك", en: "Bank" },
  bank_proof_title: {
    ar: "إثبات التحويل البنكي (رقم الحوالة أو صورة الإشعار)",
    en: "Bank Transfer Proof (Reference or Receipt Image)",
  },
  bank_proof_desc: {
    ar: "راجع تفاصيل طلبك وحساب بنك مسقط، وأدخل رقم الحوالة أو صورة الإشعار ثم اضغط على زر إرسال الطلب.",
    en: "Review your order details and Bank Muscat info, enter reference or receipt photo, then click Submit.",
  },
  receipt_attached_success: {
    ar: "تم إرفاق إشعار التحويل بنجاح",
    en: "Receipt image attached successfully",
  },
  preview_image: { ar: "معاينة الصورة", en: "Preview image" },
  account_number: { ar: "رقم الحساب", en: "Account Number" },
  recipient_name: { ar: "اسم المستفيد", en: "Beneficiary Name" },
  phone_transfer: { ar: "تحويل برقم الجوال", en: "Mobile Transfer Number" },
  customer_notes: { ar: "ملاحظات إضافية على الطلب (اختياري)", en: "Order Notes (optional)" },
  step_details: { ar: "١. بيانات العميل", en: "1. Customer Info" },
  step_delivery: { ar: "٢. الاستلام والدفع", en: "2. Delivery & Payment" },
  step_review: { ar: "٣. مراجعة وتأكيد", en: "3. Review & Confirm" },
  next: { ar: "التالي", en: "Next" },
  back: { ar: "السابق", en: "Back" },
  confirm_and_whatsapp: {
    ar: "تأكيد وإرسال الطلب عبر واتساب 💬",
    en: "Confirm & Send via WhatsApp 💬",
  },
  order_placed: { ar: "تم تسجيل طلبك بنجاح!", en: "Order placed successfully!" },
  order_number_label: { ar: "رقم الطلب", en: "Order Number" },
  tab_overview: { ar: "نظرة عامة", en: "Overview" },
  tab_products: { ar: "المنتجات", en: "Products" },
  tab_categories: { ar: "الأقسام والتصنيفات", en: "Categories" },
  tab_orders: { ar: "الطلبات", en: "Orders" },
  tab_branches: { ar: "الفروع", en: "Branches" },
  tab_settings: { ar: "إعدادات المتجر والشريط الإعلاني واللوجو", en: "Store Settings & Logo" },
  add_product: { ar: "إضافة منتج جديد", en: "Add new product" },
  add_category: { ar: "إضافة تصنيف جديد", en: "Add new category" },
  add_branch: { ar: "إضافة فرع جديد", en: "Add new branch" },
  edit: { ar: "تعديل", en: "Edit" },
  delete: { ar: "حذف", en: "Delete" },
  save: { ar: "حفظ التغييرات", en: "Save changes" },
  cancel: { ar: "إلغاء", en: "Cancel" },
  price: { ar: "السعر الأصلي", en: "Original Price" },
  cost_price: { ar: "سعر التكلفة", en: "Cost price" },
  discount_price: { ar: "سعر العرض (اختياري)", en: "Discount price (optional)" },
  stock: { ar: "المخزون المتوفر", en: "Available stock" },
  threshold: { ar: "حد التنبيه للمخزون", en: "Alert threshold" },
  category: { ar: "القسم", en: "Category" },
  images: { ar: "الصور", en: "Images" },
  upload_images: { ar: "رفع صور المنتج", en: "Upload images" },
  name_ar: { ar: "الاسم (عربي)", en: "Name (Arabic)" },
  name_en: { ar: "الاسم (إنجليزي)", en: "Name (English)" },
  desc_ar: { ar: "الوصف والتفاصيل (عربي)", en: "Description (Arabic)" },
  desc_en: { ar: "الوصف والتفاصيل (إنجليزي)", en: "Description (English)" },
  auto_translate_btn: { ar: "ترجمة تلقائية ✨", en: "Auto-Translate ✨" },
  auto_translating: { ar: "جاري الترجمة...", en: "Translating..." },
  featured_flag: { ar: "عرض في قسم المنتجات المميزة بالرئيسية", en: "Show in featured section" },
  status: { ar: "الحالة", en: "Status" },
  profit: { ar: "الربح", en: "Profit" },
  customer: { ar: "العميل", en: "Customer" },
  address: { ar: "العنوان", en: "Address" },
  transfer_reference_label: { ar: "رقم الحوالة", en: "Transfer Reference" },
  notes_label: { ar: "ملاحظات", en: "Notes" },
  date: { ar: "التاريخ", en: "Date" },
  actions: { ar: "الإجراءات", en: "Actions" },
  no_data: { ar: "لا توجد بيانات حالياً", en: "No data yet" },
  pending: { ar: "قيد الانتظار", en: "Pending" },
  processing: { ar: "قيد التجهيز", en: "Processing" },
  shipped: { ar: "تم الشحن", en: "Shipped" },
  delivered: { ar: "تم التوصيل", en: "Delivered" },
  cancelled: { ar: "ملغي", en: "Cancelled" },
  saved: { ar: "تم الحفظ بنجاح", en: "Saved successfully" },
  deleted: { ar: "تم الحذف بنجاح", en: "Deleted successfully" },
  added_to_cart: { ar: "أُضيف إلى الحقيبة بنجاح", en: "Added to your bag" },
  purchase_history: { ar: "سجل الشراء", en: "Purchase history" },
  items: { ar: "المنتجات", en: "Items" },
  admin_only: { ar: "هذه الصفحة للإدارة فقط", en: "Admins only" },
  footer_note: {
    ar: "جميع الحقوق محفوظة © هاشم للطيب",
    en: "All rights reserved © HASHEM LELTEEB",
  },
  footer_tagline: {
    ar: "فخامة العبير الملكي واللبان الحوجري الأصيل",
    en: "The luxury of royal fragrance and authentic Hojari luban",
  },
  quick_links: { ar: "روابط سريعة", en: "Quick Links" },
  payment_delivery: { ar: "طرق الدفع والتوصيل", en: "Payment & Delivery" },
  bank_transfer_muscat: {
    ar: "💳 التحويل البنكي (بنك مسقط)",
    en: "💳 Bank Transfer (Bank Muscat)",
  },
  payment_advance_note: {
    ar: "يتم الدفع مسبقاً لحساب المحل قبل إرسال الطلب.",
    en: "Payment must be made in advance before order dispatch.",
  },
  delivery_pickup_title: { ar: "🚚 التوصيل والاستلام", en: "🚚 Delivery & Pickup" },
  delivery_pickup_desc: {
    ar: "التوصيل لجميع مناطق السلطنة ودول الخليج، أو الاستلام من فروعنا.",
    en: "Delivery across Oman and the GCC, or pick up from our branches.",
  },
  whatsapp_label: { ar: "واتساب", en: "WhatsApp" },
  branches_oman: { ar: "فروعنا في سلطنة عمان", en: "Our branches in Oman" },
  // Auth page
  already_signed_in: { ar: "أنت مسجل الدخول بالفعل", en: "You are already signed in" },
  welcome_user: { ar: "مرحباً", en: "Welcome" },
  go_home: { ar: "الذهاب إلى الصفحة الرئيسية", en: "Go to Home Page" },
  admin_panel: { ar: "لوحة تحكم المتجر (Admin)", en: "Store Admin Panel" },
  sign_out_account: { ar: "تسجيل الخروج من هذا الحساب", en: "Sign out of this account" },
  continue_with_google: { ar: "المتابعة باستخدام Google", en: "Continue with Google" },
  or_with_email: { ar: "أو بالبريد الإلكتروني", en: "or with email" },
  auth_enter_email_password: {
    ar: "يرجى إدخال البريد الإلكتروني وكلمة المرور",
    en: "Please enter email and password",
  },
  auth_login_success: { ar: "تم تسجيل الدخول بنجاح", en: "Signed in successfully" },
  auth_signup_success: { ar: "تم إنشاء الحساب بنجاح", en: "Account created successfully" },
  auth_error: { ar: "حدث خطأ أثناء المصادقة", en: "An error occurred during authentication" },
  auth_google_missing_id: {
    ar: "يتطلب تفعيل Google إدخال Client ID في لوحة تحكم Supabase",
    en: "Google sign-in requires configuring Client ID in Supabase",
  },
  auth_google_error: {
    ar: "تعذر الاتصال بمزود Google",
    en: "Could not connect to Google provider",
  },
  auth_google_connect_error: {
    ar: "حدث خطأ أثناء الاتصال بمزود Google",
    en: "Error connecting to Google provider",
  },
  auth_signout_success: { ar: "تم تسجيل الخروج", en: "Signed out successfully" },
  auth_signout_error: { ar: "حدث خطأ أثناء تسجيل الخروج", en: "Error signing out" },
  name_placeholder: { ar: "مثال: خالد العماني", en: "e.g. Khalid Al Omani" },
  // Checkout page
  checkout_enter_details: {
    ar: "أدخل بيانات التواصل الخاصة بك لإتمام وتسجيل الطلب.",
    en: "Enter your contact details to complete and register your order.",
  },
  checkout_name_placeholder: { ar: "مثال: حنان الحارثي", en: "e.g. Hanan Al Harthi" },
  checkout_phone_placeholder: { ar: "مثال: 96895081141", en: "e.g. 96895081141" },
  checkout_email_optional: { ar: "اختياري", en: "optional" },
  checkout_name_phone_required: {
    ar: "يرجى إدخال الاسم ورقم الهاتف للمتابعة",
    en: "Please enter name and phone to continue",
  },
  checkout_address_required: {
    ar: "يرجى كتابة عنوان التوصيل للمتابعة",
    en: "Please enter delivery address to continue",
  },
  checkout_address_placeholder: {
    ar: "مثال: مسقط — الخوير، شارع المها، بناية رقم 14",
    en: "e.g. Muscat — Al Khuwair, Al Maha St, Building 14",
  },
  checkout_detect_location: { ar: "تحديد موقعي الحالي تلقائياً", en: "Detect my current location" },
  checkout_update_location: { ar: "تحديث الموقع الجغرافي (GPS)", en: "Update GPS location" },
  checkout_notes_placeholder: {
    ar: "مثال: يرجى التوصيل بعد العصر، تغليف كهدية فاخرة...",
    en: "e.g. Please deliver after 4pm, gift wrapping...",
  },
  checkout_location_unavailable: {
    ar: "خدمة تحديد الموقع غير متوفرة في المتصفح",
    en: "Location service not available in this browser",
  },
  checkout_location_success: {
    ar: "تم تحديد إحداثيات موقعك بنجاح",
    en: "Your location coordinates detected successfully",
  },
  checkout_location_error: {
    ar: "تعذر تحديد الموقع تلقائياً",
    en: "Could not detect location automatically",
  },
  checkout_receipt_uploaded: {
    ar: "تم رفع صورة إشعار التحويل بنجاح",
    en: "Transfer receipt uploaded successfully",
  },
  checkout_receipt_upload_error: {
    ar: "فشل رفع صورة الإشعار",
    en: "Failed to upload receipt image",
  },
  checkout_receipt_uploading: { ar: "جاري رفع الإشعار...", en: "Uploading receipt..." },
  checkout_receipt_choose: {
    ar: "اختر صورة إشعار التحويل من جهازك",
    en: "Choose transfer receipt image from device",
  },
  checkout_receipt_alt: { ar: "إشعار التحويل", en: "Transfer receipt" },
  checkout_receipt_delete: { ar: "حذف الصورة", en: "Delete image" },
  checkout_transfer_placeholder: {
    ar: "مثال: TXN-89302194 / 10098432",
    en: "e.g. TXN-89302194 / 10098432",
  },
  checkout_transfer_ref: { ar: "رقم الحوالة / مرجع التحويل", en: "Transfer reference number" },
  checkout_receipt_image: {
    ar: "رفع صورة إشعار التحويل البنكي (اختياري)",
    en: "Upload bank transfer receipt (optional)",
  },
  checkout_pickup: { ar: "استلام من الفرع (Pick up)", en: "Pick up from branch" },
  checkout_delivery_cost: { ar: "توصيل (يُحدد حسب المنطقة)", en: "Delivery (cost based on area)" },
  checkout_pickup_branch: { ar: "استلام من الفرع", en: "Pick up from branch" },
  checkout_order_error: {
    ar: "حدث خطأ أثناء تسجيل الطلب",
    en: "An error occurred while placing the order",
  },
  checkout_name_phone_error: {
    ar: "يرجى إدخال الاسم ورقم الهاتف",
    en: "Please enter name and phone number",
  },
  checkout_address_error: { ar: "يرجى إدخال عنوان التوصيل", en: "Please enter delivery address" },
  // Shop page
  search_placeholder: {
    ar: "ابحث عن عطر، بخور، لبان...",
    en: "Search for perfume, incense, luban...",
  },
  filter_all: { ar: "جميع المنتجات", en: "All Products" },
  sort_by: { ar: "ترتيب حسب", en: "Sort by" },
  sort_newest: { ar: "الأحدث", en: "Newest" },
  sort_price_low: { ar: "السعر: من الأقل للأعلى", en: "Price: Low to High" },
  sort_price_high: { ar: "السعر: من الأعلى للأقل", en: "Price: High to Low" },
  // Admin & misc keys
  orders_count: { ar: "عدد الطلبات", en: "Orders count" },
  revenue: { ar: "الإيرادات", en: "Revenue" },
  net_profit: { ar: "صافي الأرباح", en: "Net profit" },
  open_map: { ar: "فتح الخريطة", en: "Open map" },
  none: { ar: "بدون", en: "None" },
  uploading: { ar: "جاري الرفع...", en: "Uploading..." },
  featured: { ar: "مميز", en: "Featured" },
  video_product: { ar: "المنتج المرتبط", en: "Linked product" },
  video_order: { ar: "الترتيب", en: "Order" },
  need_sign_in: {
    ar: "يرجى تسجيل الدخول لعرض قائمة طلباتك.",
    en: "Please sign in to view your orders.",
  },
  required_fields: { ar: "يرجى ملء الحقول المطلوبة", en: "Please fill required fields" },
  all: { ar: "الكل", en: "All" },
  language: { ar: "اللغة", en: "Language" },
} as const;

export type TKey = keyof typeof dict;

type Ctx = {
  lang: Lang;
  dir: "rtl" | "ltr";
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (k: TKey) => string;
  money: (v: number) => string;
  pick: (ar?: string | null, en?: string | null) => string;
};

const LangContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "og-lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved === "ar" || saved === "en") setLangState(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const value = useMemo<Ctx>(
    () => ({
      lang,
      dir,
      setLang,
      toggle: () => setLang(lang === "ar" ? "en" : "ar"),
      t: (k) => dict[k]?.[lang] ?? dict[k]?.ar ?? (k as string),
      money: (v) =>
        lang === "ar"
          ? `${new Intl.NumberFormat("ar-OM", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(v)} ر.ع`
          : `OMR ${new Intl.NumberFormat("en-OM", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(v)}`,
      pick: (ar, en) => {
        if (lang === "en") {
          return en && en.trim() ? en : ar || "";
        }
        return ar && ar.trim() ? ar : en || "";
      },
    }),
    [lang, dir, setLang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useI18n must be used inside LanguageProvider");
  return ctx;
}
