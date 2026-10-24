// Hand-written for Phase 0: only the tables the UI reads today.
// From Phase 1 on, regenerate the full file from the linked project:
//   npm run db:types
// (that command overwrites this file with the generated Database type).

export type UserRole = "admin" | "writer";
export type ClientStatus = "active" | "paused" | "ended";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: UserRole;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          role?: UserRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: UserRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          name: string;
          website_url: string;
          cms: string | null;
          industry: string | null;
          status: ClientStatus;
          started_at: string | null;
          audience: string | null;
          brand_voice: string | null;
          services: Json;
          key_pages: Json;
          client_notes: string | null;
          gbp_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          website_url: string;
          cms?: string | null;
          industry?: string | null;
          status?: ClientStatus;
          started_at?: string | null;
          audience?: string | null;
          brand_voice?: string | null;
          services?: Json;
          key_pages?: Json;
          client_notes?: string | null;
          gbp_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          website_url?: string;
          cms?: string | null;
          industry?: string | null;
          status?: ClientStatus;
          started_at?: string | null;
          audience?: string | null;
          brand_voice?: string | null;
          services?: Json;
          key_pages?: Json;
          client_notes?: string | null;
          gbp_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_active_user: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      user_role: UserRole;
      client_status: ClientStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Client = Database["public"]["Tables"]["clients"]["Row"];
