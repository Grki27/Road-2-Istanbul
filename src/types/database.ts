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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          recap_id: string;
          author_name: string;
          message: string;
          status: "pending" | "approved" | "rejected";
          moderation_reason: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["comments"]["Row"]> & {
          recap_id: string;
          author_name: string;
          message: string;
        };
        Update: Partial<Database["public"]["Tables"]["comments"]["Row"]>;
        Relationships: [];
      };
      comment_reactions: {
        Row: {
          id: string;
          comment_id: string;
          client_id: string;
          emoji: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["comment_reactions"]["Row"]> & {
          comment_id: string;
          client_id: string;
          emoji: string;
        };
        Update: Partial<Database["public"]["Tables"]["comment_reactions"]["Row"]>;
        Relationships: [];
      };
      wall_notes: {
        Row: {
          id: string;
          author_name: string;
          message: string;
          note_color: string | null;
          x_position: number | null;
          y_position: number | null;
          rotation: number | null;
          drawing_data: Json | null;
          status: "pending" | "approved" | "rejected";
          moderation_reason: string | null;
          created_at: string;
          expires_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["wall_notes"]["Row"]> & {
          author_name: string;
          message: string;
          expires_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["wall_notes"]["Row"]>;
        Relationships: [];
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
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      admin_update_current_location: {
        Args: {
          p_latitude: number;
          p_longitude: number;
          p_note?: string | null;
          p_current_country?: string | null;
        };
        Returns: Database["public"]["Tables"]["current_locations"]["Row"];
      };
      public_move_wall_note: {
        Args: {
          p_id: string;
          p_x_position: number;
          p_y_position: number;
        };
        Returns: Database["public"]["Tables"]["wall_notes"]["Row"];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
