import type { Database, Enums, Tables, TablesInsert, TablesUpdate } from "./database";

export type { Database, Enums, Tables, TablesInsert, TablesUpdate };

export type Profile = Tables<"profiles">;
export type Client = Tables<"clients">;
export type Cycle = Tables<"cycles">;
export type Task = Tables<"tasks">;
export type TaskTemplate = Tables<"task_templates">;
export type Backlink = Tables<"backlinks">;
export type GbpPost = Tables<"gbp_posts">;
export type KeywordCluster = Tables<"keyword_clusters">;
export type Keyword = Tables<"keywords">;
export type ContentBrief = Tables<"content_briefs">;
export type BriefCompetitor = Tables<"brief_competitors">;
export type BriefInternalLink = Tables<"brief_internal_links">;
export type BriefOutlineItem = Tables<"brief_outline_items">;
export type Article = Tables<"articles">;
export type ArticleReview = Tables<"article_reviews">;
export type Comment = Tables<"comments">;

export type UserRole = Enums<"user_role">;
export type ClientStatus = Enums<"client_status">;
export type CycleStatus = Enums<"cycle_status">;
export type TaskCategory = Enums<"task_category">;
export type TaskStatus = Enums<"task_status">;
export type TaskSource = Enums<"task_source">;
export type PriorityLevel = Enums<"priority_level">;
export type TemplateFrequency = Enums<"template_frequency">;
export type BacklinkStatus = Enums<"backlink_status">;
export type GbpPostType = Enums<"gbp_post_type">;
export type GbpPostStatus = Enums<"gbp_post_status">;
export type SearchIntent = Enums<"search_intent">;
export type PageType = Enums<"page_type">;
export type KeywordSource = Enums<"keyword_source">;
export type BriefStatus = Enums<"brief_status">;
export type OutlineLevel = Enums<"outline_level">;
export type ArticleStatus = Enums<"article_status">;
export type ReviewDecision = Enums<"review_decision">;
export type CommentEntity = Enums<"comment_entity">;

// Shape stored in clients.services and clients.key_pages (jsonb)
export type LinkItem = { name: string; url: string };

// A brief with its three child lists, as pages and the exporter use it.
export type BriefWithChildren = ContentBrief & {
  competitors: BriefCompetitor[];
  internal_links: BriefInternalLink[];
  outline: BriefOutlineItem[];
};
