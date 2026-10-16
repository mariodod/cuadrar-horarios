export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
        };
      };
      sessions: {
        Row: {
          id: string;
          title: string;
          created_by: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          title: string;
          created_by?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          title?: string;
          created_by?: string | null;
          is_active?: boolean;
        };
      };
      participants: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id: string;
          session_id: string;
          user_id: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string;
        };
      };
      availabilities: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          day: string;
          start_time: string;
          end_time: string;
          created_at: string;
        };
        Insert: {
          id: string;
          session_id: string;
          user_id: string;
          day: string;
          start_time: string;
          end_time: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string;
          day?: string;
          start_time?: string;
          end_time?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
