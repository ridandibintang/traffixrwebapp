import type { Database, Enums, Tables, TablesInsert, TablesUpdate } from "./database";

export type { Database, Enums, Tables, TablesInsert, TablesUpdate };

export type Profile = Tables<"profiles">;
export type Client = Tables<"clients">;
export type Cycle = Tables<"cycles">;
export type Task = Tables<"tasks">;
export type TaskTemplate = Tables<"task_templates">;
export type Backlink = Tables<"backlinks">;
export type GbpPost = Tables<"gbp_posts">;

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

// Shape stored in clients.services and clients.key_pages (jsonb)
export type LinkItem = { name: string; url: string };
