export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      daily_recaps: {
        Row: {
          id: string;
          day_number: number;
          date: string;
          title: string;
          start_location: string | null;
          end_location: string | null;
          sleeping_location: string | null;
          country: string | null;
          latitude: number | null;
          longitude: number | null;
          distance_km: number | null;
          short_text: string | null;
          fatigue_rating: number | null;
          marin_fatigue_rating: number | null;
          marko_fatigue_rating: number | null;
          highlight_of_the_day: string | null;
          problem_of_the_day: string | null;
          is_rest_day: boolean;
          special_milestone_type: string | null;
          status: "draft" | "published" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["daily_recaps"]["Row"]> & {
          day_number: number;
          date: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["daily_recaps"]["Row"]>;
      };
      recap_images: {
        Row: {
          id: string;
          recap_id: string;
          image_url: string;
          storage_path: string | null;
          alt_text: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["recap_images"]["Row"]> & {
          recap_id: string;
          image_url: string;
        };
        Update: Partial<Database["public"]["Tables"]["recap_images"]["Row"]>;
      };
      current_locations: {
        Row: {
          id: string;
          latitude: number;
          longitude: number;
          note: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["current_locations"]["Row"]> & {
          latitude: number;
          longitude: number;
        };
        Update: Partial<Database["public"]["Tables"]["current_locations"]["Row"]>;
      };
      map_events: {
        Row: {
          id: string;
          emoji: string;
          title: string;
          description: string | null;
          location_name: string | null;
          country: string | null;
          latitude: number;
          longitude: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["map_events"]["Row"]> & {
          emoji: string;
          title: string;
          latitude: number;
          longitude: number;
        };
        Update: Partial<Database["public"]["Tables"]["map_events"]["Row"]>;
      };
      map_event_images: {
        Row: {
          id: string;
          map_event_id: string;
          image_url: string;
          storage_path: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["map_event_images"]["Row"]> & {
          map_event_id: string;
          image_url: string;
        };
        Update: Partial<Database["public"]["Tables"]["map_event_images"]["Row"]>;
      };
      trip_settings: {
        Row: {
          id: number;
          planned_total_km: number;
          current_country: string | null;
          countries_visited: number;
          border_crossings: number;
          donation_goal: number;
          donation_raised: number;
          donation_url: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["trip_settings"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["trip_settings"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
