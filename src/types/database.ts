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
