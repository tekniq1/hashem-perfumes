export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      branches: {
        Row: {
          address_ar: string;
          address_en: string;
          city_ar: string;
          city_en: string;
          created_at: string;
          display_order: number;
          id: string;
          is_active: boolean;
          map_url: string | null;
          name_ar: string;
          name_en: string;
          opening_hours_ar: string | null;
          opening_hours_en: string | null;
          phone: string;
        };
        Insert: {
          address_ar: string;
          address_en: string;
          city_ar: string;
          city_en: string;
          created_at?: string;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          map_url?: string | null;
          name_ar: string;
          name_en: string;
          opening_hours_ar?: string | null;
          opening_hours_en?: string | null;
          phone: string;
        };
        Update: {
          address_ar?: string;
          address_en?: string;
          city_ar?: string;
          city_en?: string;
          created_at?: string;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          map_url?: string | null;
          name_ar?: string;
          name_en?: string;
          opening_hours_ar?: string | null;
          opening_hours_en?: string | null;
          phone?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string;
          id: string;
          image_url: string | null;
          name_ar: string;
          name_en: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          image_url?: string | null;
          name_ar: string;
          name_en: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          image_url?: string | null;
          name_ar?: string;
          name_en?: string;
          slug?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          created_at: string;
          id: string;
          is_read: boolean;
          message: string;
          title: string;
          type: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_read?: boolean;
          message: string;
          title: string;
          type?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_read?: boolean;
          message?: string;
          title?: string;
          type?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          quantity: number;
          unit_cost: number;
          unit_price: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          quantity?: number;
          unit_cost?: number;
          unit_price?: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          quantity?: number;
          unit_cost?: number;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          created_at: string;
          customer_email: string | null;
          customer_name: string;
          customer_notes: string | null;
          customer_phone: string;
          delivery_address: string;
          delivery_method: string;
          id: string;
          location_lat: number | null;
          location_lng: number | null;
          map_url: string | null;
          order_number: string | null;
          payment_method: string;
          receipt_image_url: string | null;
          status: Database["public"]["Enums"]["order_status"];
          total_amount: number;
          total_cost: number;
          total_profit: number;
          transfer_reference: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          customer_email?: string | null;
          customer_name: string;
          customer_notes?: string | null;
          customer_phone: string;
          delivery_address: string;
          delivery_method?: string;
          id?: string;
          location_lat?: number | null;
          location_lng?: number | null;
          map_url?: string | null;
          order_number?: string | null;
          payment_method?: string;
          receipt_image_url?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          total_amount?: number;
          total_cost?: number;
          total_profit?: number;
          transfer_reference?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          customer_email?: string | null;
          customer_name?: string;
          customer_notes?: string | null;
          customer_phone?: string;
          delivery_address?: string;
          delivery_method?: string;
          id?: string;
          location_lat?: number | null;
          location_lng?: number | null;
          map_url?: string | null;
          order_number?: string | null;
          payment_method?: string;
          receipt_image_url?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          total_amount?: number;
          total_cost?: number;
          total_profit?: number;
          transfer_reference?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      products: {
        Row: {
          category_id: string | null;
          cost_price: number;
          created_at: string;
          description_ar: string | null;
          description_en: string | null;
          discount_price: number | null;
          id: string;
          images: string[];
          is_featured: boolean;
          low_stock_threshold: number;
          name_ar: string;
          name_en: string;
          price: number;
          stock_quantity: number;
        };
        Insert: {
          category_id?: string | null;
          cost_price?: number;
          created_at?: string;
          description_ar?: string | null;
          description_en?: string | null;
          discount_price?: number | null;
          id?: string;
          images?: string[];
          is_featured?: boolean;
          low_stock_threshold?: number;
          name_ar: string;
          name_en: string;
          price?: number;
          stock_quantity?: number;
        };
        Update: {
          category_id?: string | null;
          cost_price?: number;
          created_at?: string;
          description_ar?: string | null;
          description_en?: string | null;
          discount_price?: number | null;
          id?: string;
          images?: string[];
          is_featured?: boolean;
          low_stock_threshold?: number;
          name_ar?: string;
          name_en?: string;
          price?: number;
          stock_quantity?: number;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          role: Database["public"]["Enums"]["app_role"];
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
        };
        Relationships: [];
      };
      promotional_videos: {
        Row: {
          created_at: string;
          cta_link: string | null;
          display_order: number;
          id: string;
          is_active: boolean;
          target_product_id: string | null;
          thumbnail_url: string | null;
          title_ar: string;
          title_en: string;
          video_url: string;
        };
        Insert: {
          created_at?: string;
          cta_link?: string | null;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          target_product_id?: string | null;
          thumbnail_url?: string | null;
          title_ar?: string;
          title_en?: string;
          video_url: string;
        };
        Update: {
          created_at?: string;
          cta_link?: string | null;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          target_product_id?: string | null;
          thumbnail_url?: string | null;
          title_ar?: string;
          title_en?: string;
          video_url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "promotional_videos_target_product_id_fkey";
            columns: ["target_product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      store_settings: {
        Row: {
          about_description_ar: string | null;
          about_description_en: string | null;
          about_title_ar: string | null;
          about_title_en: string | null;
          announcement_bar_active: boolean | null;
          announcement_bar_text: string | null;
          announcement_enabled: boolean | null;
          announcement_text_ar: string | null;
          announcement_text_en: string | null;
          bank_account_number: string | null;
          bank_name: string | null;
          bank_phone_transfer: string | null;
          bank_recipient_name: string | null;
          created_at: string;
          email: string | null;
          hero_image_url: string | null;
          id: string;
          instagram_handle: string | null;
          logo_url: string | null;
          site_name_ar: string | null;
          site_name_en: string | null;
          tagline_ar: string | null;
          tagline_en: string | null;
          updated_at: string;
          whatsapp_number: string | null;
        };
        Insert: {
          about_description_ar?: string | null | undefined;
          about_description_en?: string | null | undefined;
          about_title_ar?: string | null | undefined;
          about_title_en?: string | null | undefined;
          announcement_bar_active?: boolean | null | undefined;
          announcement_bar_text?: string | null | undefined;
          announcement_enabled?: boolean | null | undefined;
          announcement_text_ar?: string | null | undefined;
          announcement_text_en?: string | null | undefined;
          bank_account_number?: string | null | undefined;
          bank_name?: string | null | undefined;
          bank_phone_transfer?: string | null | undefined;
          bank_recipient_name?: string | null | undefined;
          created_at?: string | undefined;
          email?: string | null | undefined;
          hero_image_url?: string | null | undefined;
          id?: string | undefined;
          instagram_handle?: string | null | undefined;
          logo_url?: string | null | undefined;
          site_name_ar?: string | null | undefined;
          site_name_en?: string | null | undefined;
          tagline_ar?: string | null | undefined;
          tagline_en?: string | null | undefined;
          updated_at?: string | undefined;
          whatsapp_number?: string | null | undefined;
        };
        Update: {
          about_description_ar?: string | null | undefined;
          about_description_en?: string | null | undefined;
          about_title_ar?: string | null | undefined;
          about_title_en?: string | null | undefined;
          announcement_bar_active?: boolean | null | undefined;
          announcement_bar_text?: string | null | undefined;
          announcement_enabled?: boolean | null | undefined;
          announcement_text_ar?: string | null | undefined;
          announcement_text_en?: string | null | undefined;
          bank_account_number?: string | null | undefined;
          bank_name?: string | null | undefined;
          bank_phone_transfer?: string | null | undefined;
          bank_recipient_name?: string | null | undefined;
          created_at?: string | undefined;
          email?: string | null | undefined;
          hero_image_url?: string | null | undefined;
          id?: string | undefined;
          instagram_handle?: string | null | undefined;
          logo_url?: string | null | undefined;
          site_name_ar?: string | null | undefined;
          site_name_en?: string | null | undefined;
          tagline_ar?: string | null | undefined;
          tagline_en?: string | null | undefined;
          updated_at?: string | undefined;
          whatsapp_number?: string | null | undefined;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      decrement_stock: {
        Args: { _product_id: string; _qty: number };
        Returns: undefined;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "customer";
      order_status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "customer"],
      order_status: ["pending", "processing", "shipped", "delivered", "cancelled"],
    },
  },
} as const;
