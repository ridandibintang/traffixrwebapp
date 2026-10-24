export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          meta: Json
          updated_at: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          meta?: Json
          updated_at?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          meta?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_reviews: {
        Row: {
          article_id: string
          created_at: string
          decision: Database["public"]["Enums"]["review_decision"]
          facts_ok: boolean
          id: string
          intent_ok: boolean
          notes: string | null
          readability_ok: boolean
          reviewer_id: string | null
          round: number
          updated_at: string
        }
        Insert: {
          article_id: string
          created_at?: string
          decision: Database["public"]["Enums"]["review_decision"]
          facts_ok?: boolean
          id?: string
          intent_ok?: boolean
          notes?: string | null
          readability_ok?: boolean
          reviewer_id?: string | null
          round?: number
          updated_at?: string
        }
        Update: {
          article_id?: string
          created_at?: string
          decision?: Database["public"]["Enums"]["review_decision"]
          facts_ok?: boolean
          id?: string
          intent_ok?: boolean
          notes?: string | null
          readability_ok?: boolean
          reviewer_id?: string | null
          round?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_reviews_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          approved_at: string | null
          brief_id: string | null
          client_id: string
          created_at: string
          cycle_id: string | null
          draft_url: string | null
          due_date: string | null
          id: string
          published_at: string | null
          published_url: string | null
          status: Database["public"]["Enums"]["article_status"]
          submitted_at: string | null
          title: string
          updated_at: string
          writer_id: string | null
        }
        Insert: {
          approved_at?: string | null
          brief_id?: string | null
          client_id: string
          created_at?: string
          cycle_id?: string | null
          draft_url?: string | null
          due_date?: string | null
          id?: string
          published_at?: string | null
          published_url?: string | null
          status?: Database["public"]["Enums"]["article_status"]
          submitted_at?: string | null
          title: string
          updated_at?: string
          writer_id?: string | null
        }
        Update: {
          approved_at?: string | null
          brief_id?: string | null
          client_id?: string
          created_at?: string
          cycle_id?: string | null
          draft_url?: string | null
          due_date?: string | null
          id?: string
          published_at?: string | null
          published_url?: string | null
          status?: Database["public"]["Enums"]["article_status"]
          submitted_at?: string | null
          title?: string
          updated_at?: string
          writer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "content_briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_writer_id_fkey"
            columns: ["writer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_findings: {
        Row: {
          audit_id: string
          category: Database["public"]["Enums"]["task_category"] | null
          created_at: string
          details: Json
          id: string
          issue_name: string
          severity: Database["public"]["Enums"]["finding_severity"]
          state: Database["public"]["Enums"]["finding_state"]
          status: Database["public"]["Enums"]["finding_status"]
          task_id: string | null
          updated_at: string
          url: string
        }
        Insert: {
          audit_id: string
          category?: Database["public"]["Enums"]["task_category"] | null
          created_at?: string
          details?: Json
          id?: string
          issue_name: string
          severity?: Database["public"]["Enums"]["finding_severity"]
          state?: Database["public"]["Enums"]["finding_state"]
          status?: Database["public"]["Enums"]["finding_status"]
          task_id?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          audit_id?: string
          category?: Database["public"]["Enums"]["task_category"] | null
          created_at?: string
          details?: Json
          id?: string
          issue_name?: string
          severity?: Database["public"]["Enums"]["finding_severity"]
          state?: Database["public"]["Enums"]["finding_state"]
          status?: Database["public"]["Enums"]["finding_status"]
          task_id?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_findings_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_findings_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      audits: {
        Row: {
          client_id: string
          crawl_date: string
          created_at: string
          cycle_id: string | null
          file_paths: string[]
          id: string
          summary: string | null
          total_urls: number | null
          type: Database["public"]["Enums"]["audit_type"]
          updated_at: string
        }
        Insert: {
          client_id: string
          crawl_date?: string
          created_at?: string
          cycle_id?: string | null
          file_paths?: string[]
          id?: string
          summary?: string | null
          total_urls?: number | null
          type: Database["public"]["Enums"]["audit_type"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          crawl_date?: string
          created_at?: string
          cycle_id?: string | null
          file_paths?: string[]
          id?: string
          summary?: string | null
          total_urls?: number | null
          type?: Database["public"]["Enums"]["audit_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audits_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      backlinks: {
        Row: {
          anchor_text: string | null
          client_id: string
          cost: number | null
          created_at: string
          id: string
          live_at: string | null
          month: string
          notes: string | null
          ordered_at: string | null
          source_domain: string
          source_url: string | null
          status: Database["public"]["Enums"]["backlink_status"]
          target_url: string
          updated_at: string
        }
        Insert: {
          anchor_text?: string | null
          client_id: string
          cost?: number | null
          created_at?: string
          id?: string
          live_at?: string | null
          month: string
          notes?: string | null
          ordered_at?: string | null
          source_domain: string
          source_url?: string | null
          status?: Database["public"]["Enums"]["backlink_status"]
          target_url: string
          updated_at?: string
        }
        Update: {
          anchor_text?: string | null
          client_id?: string
          cost?: number | null
          created_at?: string
          id?: string
          live_at?: string | null
          month?: string
          notes?: string | null
          ordered_at?: string | null
          source_domain?: string
          source_url?: string | null
          status?: Database["public"]["Enums"]["backlink_status"]
          target_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "backlinks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      brief_competitors: {
        Row: {
          brief_id: string
          created_at: string
          domain: string
          id: string
          page_title: string | null
          position: number
          updated_at: string
          url: string
        }
        Insert: {
          brief_id: string
          created_at?: string
          domain: string
          id?: string
          page_title?: string | null
          position: number
          updated_at?: string
          url: string
        }
        Update: {
          brief_id?: string
          created_at?: string
          domain?: string
          id?: string
          page_title?: string | null
          position?: number
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "brief_competitors_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "content_briefs"
            referencedColumns: ["id"]
          },
        ]
      }
      brief_internal_links: {
        Row: {
          anchor_text: string
          brief_id: string
          created_at: string
          id: string
          placement_note: string | null
          position: number
          updated_at: string
          url: string
        }
        Insert: {
          anchor_text: string
          brief_id: string
          created_at?: string
          id?: string
          placement_note?: string | null
          position: number
          updated_at?: string
          url: string
        }
        Update: {
          anchor_text?: string
          brief_id?: string
          created_at?: string
          id?: string
          placement_note?: string | null
          position?: number
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "brief_internal_links_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "content_briefs"
            referencedColumns: ["id"]
          },
        ]
      }
      brief_outline_items: {
        Row: {
          brief_id: string
          created_at: string
          heading: string
          id: string
          key_points: string | null
          level: Database["public"]["Enums"]["outline_level"]
          position: number
          updated_at: string
        }
        Insert: {
          brief_id: string
          created_at?: string
          heading: string
          id?: string
          key_points?: string | null
          level?: Database["public"]["Enums"]["outline_level"]
          position: number
          updated_at?: string
        }
        Update: {
          brief_id?: string
          created_at?: string
          heading?: string
          id?: string
          key_points?: string | null
          level?: Database["public"]["Enums"]["outline_level"]
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brief_outline_items_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "content_briefs"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          audience: string | null
          brand_voice: string | null
          client_notes: string | null
          cms: string | null
          created_at: string
          gbp_url: string | null
          id: string
          industry: string | null
          key_pages: Json
          name: string
          services: Json
          started_at: string | null
          status: Database["public"]["Enums"]["client_status"]
          updated_at: string
          website_url: string
        }
        Insert: {
          audience?: string | null
          brand_voice?: string | null
          client_notes?: string | null
          cms?: string | null
          created_at?: string
          gbp_url?: string | null
          id?: string
          industry?: string | null
          key_pages?: Json
          name: string
          services?: Json
          started_at?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
          website_url: string
        }
        Update: {
          audience?: string | null
          brand_voice?: string | null
          client_notes?: string | null
          cms?: string | null
          created_at?: string
          gbp_url?: string | null
          id?: string
          industry?: string | null
          key_pages?: Json
          name?: string
          services?: Json
          started_at?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
          website_url?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["comment_entity"]
          id: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["comment_entity"]
          id?: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["comment_entity"]
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_briefs: {
        Row: {
          client_id: string
          conclusion_notes: string | null
          content_gaps: string | null
          created_at: string
          created_by: string | null
          cta_copy: string | null
          docx_path: string | null
          id: string
          intent_reason: string | null
          keyword_id: string | null
          meta_description: string | null
          meta_title: string | null
          objective: string | null
          search_intent: Database["public"]["Enums"]["search_intent"] | null
          status: Database["public"]["Enums"]["brief_status"]
          target_audience: string | null
          target_keyword: string
          updated_at: string
          word_count_max: number | null
          word_count_min: number | null
          writing_best_practices: string | null
        }
        Insert: {
          client_id: string
          conclusion_notes?: string | null
          content_gaps?: string | null
          created_at?: string
          created_by?: string | null
          cta_copy?: string | null
          docx_path?: string | null
          id?: string
          intent_reason?: string | null
          keyword_id?: string | null
          meta_description?: string | null
          meta_title?: string | null
          objective?: string | null
          search_intent?: Database["public"]["Enums"]["search_intent"] | null
          status?: Database["public"]["Enums"]["brief_status"]
          target_audience?: string | null
          target_keyword: string
          updated_at?: string
          word_count_max?: number | null
          word_count_min?: number | null
          writing_best_practices?: string | null
        }
        Update: {
          client_id?: string
          conclusion_notes?: string | null
          content_gaps?: string | null
          created_at?: string
          created_by?: string | null
          cta_copy?: string | null
          docx_path?: string | null
          id?: string
          intent_reason?: string | null
          keyword_id?: string | null
          meta_description?: string | null
          meta_title?: string | null
          objective?: string | null
          search_intent?: Database["public"]["Enums"]["search_intent"] | null
          status?: Database["public"]["Enums"]["brief_status"]
          target_audience?: string | null
          target_keyword?: string
          updated_at?: string
          word_count_max?: number | null
          word_count_min?: number | null
          writing_best_practices?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_briefs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_briefs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_briefs_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      cycles: {
        Row: {
          client_id: string
          created_at: string
          end_date: string
          id: string
          meeting_date: string | null
          number: number
          start_date: string
          status: Database["public"]["Enums"]["cycle_status"]
          summary: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          end_date: string
          id?: string
          meeting_date?: string | null
          number: number
          start_date: string
          status?: Database["public"]["Enums"]["cycle_status"]
          summary?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          end_date?: string
          id?: string
          meeting_date?: string | null
          number?: number
          start_date?: string
          status?: Database["public"]["Enums"]["cycle_status"]
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cycles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      gbp_posts: {
        Row: {
          body: string | null
          client_id: string
          created_at: string
          cta_url: string | null
          id: string
          image_path: string | null
          post_type: Database["public"]["Enums"]["gbp_post_type"]
          published_at: string | null
          requested_by_client: boolean
          scheduled_date: string
          status: Database["public"]["Enums"]["gbp_post_status"]
          title: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          client_id: string
          created_at?: string
          cta_url?: string | null
          id?: string
          image_path?: string | null
          post_type?: Database["public"]["Enums"]["gbp_post_type"]
          published_at?: string | null
          requested_by_client?: boolean
          scheduled_date: string
          status?: Database["public"]["Enums"]["gbp_post_status"]
          title?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          client_id?: string
          created_at?: string
          cta_url?: string | null
          id?: string
          image_path?: string | null
          post_type?: Database["public"]["Enums"]["gbp_post_type"]
          published_at?: string | null
          requested_by_client?: boolean
          scheduled_date?: string
          status?: Database["public"]["Enums"]["gbp_post_status"]
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gbp_posts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_rules: {
        Row: {
          category: Database["public"]["Enums"]["task_category"]
          created_at: string
          default_severity: Database["public"]["Enums"]["finding_severity"]
          id: string
          ignore_by_default: boolean
          issue_name: string
          task_title_template: string | null
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["task_category"]
          created_at?: string
          default_severity?: Database["public"]["Enums"]["finding_severity"]
          id?: string
          ignore_by_default?: boolean
          issue_name: string
          task_title_template?: string | null
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["task_category"]
          created_at?: string
          default_severity?: Database["public"]["Enums"]["finding_severity"]
          id?: string
          ignore_by_default?: boolean
          issue_name?: string
          task_title_template?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      keyword_clusters: {
        Row: {
          client_id: string
          created_at: string
          id: string
          intent: Database["public"]["Enums"]["search_intent"] | null
          name: string
          page_type: Database["public"]["Enums"]["page_type"] | null
          priority: Database["public"]["Enums"]["priority_level"]
          target_url: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          intent?: Database["public"]["Enums"]["search_intent"] | null
          name: string
          page_type?: Database["public"]["Enums"]["page_type"] | null
          priority?: Database["public"]["Enums"]["priority_level"]
          target_url?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          intent?: Database["public"]["Enums"]["search_intent"] | null
          name?: string
          page_type?: Database["public"]["Enums"]["page_type"] | null
          priority?: Database["public"]["Enums"]["priority_level"]
          target_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "keyword_clusters_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      keywords: {
        Row: {
          client_id: string
          cluster_id: string | null
          cpc: number | null
          created_at: string
          difficulty: number | null
          fetched_at: string | null
          id: string
          intent: Database["public"]["Enums"]["search_intent"] | null
          keyword: string
          search_volume: number | null
          source: Database["public"]["Enums"]["keyword_source"]
          updated_at: string
        }
        Insert: {
          client_id: string
          cluster_id?: string | null
          cpc?: number | null
          created_at?: string
          difficulty?: number | null
          fetched_at?: string | null
          id?: string
          intent?: Database["public"]["Enums"]["search_intent"] | null
          keyword: string
          search_volume?: number | null
          source?: Database["public"]["Enums"]["keyword_source"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          cluster_id?: string | null
          cpc?: number | null
          created_at?: string
          difficulty?: number | null
          fetched_at?: string | null
          id?: string
          intent?: Database["public"]["Enums"]["search_intent"] | null
          keyword?: string
          search_volume?: number | null
          source?: Database["public"]["Enums"]["keyword_source"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "keywords_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "keywords_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "keyword_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      metric_snapshots: {
        Row: {
          client_id: string
          created_at: string
          dimension_type: Database["public"]["Enums"]["dimension_type"]
          dimension_value: string | null
          id: string
          metrics: Json
          period_end: string
          period_start: string
          source: Database["public"]["Enums"]["metric_source"]
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          dimension_type?: Database["public"]["Enums"]["dimension_type"]
          dimension_value?: string | null
          id?: string
          metrics?: Json
          period_end: string
          period_start: string
          source: Database["public"]["Enums"]["metric_source"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          dimension_type?: Database["public"]["Enums"]["dimension_type"]
          dimension_value?: string | null
          id?: string
          metrics?: Json
          period_end?: string
          period_start?: string
          source?: Database["public"]["Enums"]["metric_source"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "metric_snapshots_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          client_id: string
          created_at: string
          cycle_id: string
          done_summary: string | null
          id: string
          next_plan: string | null
          notes: string | null
          offpage_summary: string | null
          pdf_path: string | null
          performance_summary: string | null
          period_end: string
          period_start: string
          status: Database["public"]["Enums"]["report_status"]
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          cycle_id: string
          done_summary?: string | null
          id?: string
          next_plan?: string | null
          notes?: string | null
          offpage_summary?: string | null
          pdf_path?: string | null
          performance_summary?: string | null
          period_end: string
          period_start: string
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          cycle_id?: string
          done_summary?: string | null
          id?: string
          next_plan?: string | null
          notes?: string | null
          offpage_summary?: string | null
          pdf_path?: string | null
          performance_summary?: string | null
          period_end?: string
          period_start?: string
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: true
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          category: Database["public"]["Enums"]["task_category"]
          client_id: string | null
          created_at: string
          default_assignee_id: string | null
          frequency: Database["public"]["Enums"]["template_frequency"]
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["task_category"]
          client_id?: string | null
          created_at?: string
          default_assignee_id?: string | null
          frequency?: Database["public"]["Enums"]["template_frequency"]
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["task_category"]
          client_id?: string | null
          created_at?: string
          default_assignee_id?: string | null
          frequency?: Database["public"]["Enums"]["template_frequency"]
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_templates_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_templates_default_assignee_id_fkey"
            columns: ["default_assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          affected_urls: string[]
          assignee_id: string | null
          audit_id: string | null
          category: Database["public"]["Enums"]["task_category"]
          client_id: string
          completed_at: string | null
          created_at: string
          cycle_id: string | null
          description: string | null
          due_date: string | null
          id: string
          period_key: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          source: Database["public"]["Enums"]["task_source"]
          status: Database["public"]["Enums"]["task_status"]
          template_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          affected_urls?: string[]
          assignee_id?: string | null
          audit_id?: string | null
          category?: Database["public"]["Enums"]["task_category"]
          client_id: string
          completed_at?: string | null
          created_at?: string
          cycle_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          period_key?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          source?: Database["public"]["Enums"]["task_source"]
          status?: Database["public"]["Enums"]["task_status"]
          template_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          affected_urls?: string[]
          assignee_id?: string | null
          audit_id?: string | null
          category?: Database["public"]["Enums"]["task_category"]
          client_id?: string
          completed_at?: string | null
          created_at?: string
          cycle_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          period_key?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          source?: Database["public"]["Enums"]["task_source"]
          status?: Database["public"]["Enums"]["task_status"]
          template_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_active_user: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      article_status:
        | "draft"
        | "assigned"
        | "writing"
        | "submitted"
        | "in_review"
        | "revision"
        | "approved"
        | "published"
      audit_type: "on_page" | "technical"
      backlink_status: "planned" | "ordered" | "live" | "lost"
      brief_status: "draft" | "ready" | "archived"
      client_status: "active" | "paused" | "ended"
      comment_entity: "content_brief" | "article"
      cycle_status: "planning" | "active" | "review" | "closed"
      dimension_type: "total" | "query" | "page"
      finding_severity: "low" | "medium" | "high" | "critical"
      finding_state: "new" | "persisting" | "fixed"
      finding_status: "open" | "converted" | "ignored"
      gbp_post_status: "draft" | "scheduled" | "published"
      gbp_post_type: "update" | "offer" | "event"
      keyword_source: "manual" | "dataforseo" | "se_ranking"
      metric_source: "gsc" | "ga4"
      outline_level: "h1" | "h2" | "h3"
      page_type: "blog" | "landing" | "service"
      priority_level: "low" | "medium" | "high" | "urgent"
      report_status: "draft" | "final"
      review_decision: "approve" | "revise"
      search_intent:
        | "informational"
        | "navigational"
        | "commercial"
        | "transactional"
      task_category:
        | "on_page"
        | "technical"
        | "content"
        | "keyword_research"
        | "off_page"
        | "gbp"
        | "reporting"
        | "other"
      task_source: "manual" | "audit" | "template"
      task_status: "todo" | "in_progress" | "done" | "blocked" | "wont_do"
      template_frequency: "per_cycle" | "weekly" | "monthly"
      user_role: "admin" | "writer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      article_status: [
        "draft",
        "assigned",
        "writing",
        "submitted",
        "in_review",
        "revision",
        "approved",
        "published",
      ],
      audit_type: ["on_page", "technical"],
      backlink_status: ["planned", "ordered", "live", "lost"],
      brief_status: ["draft", "ready", "archived"],
      client_status: ["active", "paused", "ended"],
      comment_entity: ["content_brief", "article"],
      cycle_status: ["planning", "active", "review", "closed"],
      dimension_type: ["total", "query", "page"],
      finding_severity: ["low", "medium", "high", "critical"],
      finding_state: ["new", "persisting", "fixed"],
      finding_status: ["open", "converted", "ignored"],
      gbp_post_status: ["draft", "scheduled", "published"],
      gbp_post_type: ["update", "offer", "event"],
      keyword_source: ["manual", "dataforseo", "se_ranking"],
      metric_source: ["gsc", "ga4"],
      outline_level: ["h1", "h2", "h3"],
      page_type: ["blog", "landing", "service"],
      priority_level: ["low", "medium", "high", "urgent"],
      report_status: ["draft", "final"],
      review_decision: ["approve", "revise"],
      search_intent: [
        "informational",
        "navigational",
        "commercial",
        "transactional",
      ],
      task_category: [
        "on_page",
        "technical",
        "content",
        "keyword_research",
        "off_page",
        "gbp",
        "reporting",
        "other",
      ],
      task_source: ["manual", "audit", "template"],
      task_status: ["todo", "in_progress", "done", "blocked", "wont_do"],
      template_frequency: ["per_cycle", "weekly", "monthly"],
      user_role: ["admin", "writer"],
    },
  },
} as const
