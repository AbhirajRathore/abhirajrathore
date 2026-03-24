export type ApplicationStatus =
  | "draft"
  | "ready"
  | "applied"
  | "interview"
  | "rejected";

export interface ApplicationScore {
  keyword_match: number;
  relevance: number;
  impact: number;
  clarity: number;
  total: number;
}

export interface ApplicationPrompts {
  resume_prompt?: string;
  scoring_prompt?: string;
  improvement_prompt?: string;
}

export interface ResumeExperience {
  company: string;
  title: string;
  location: string;
  start_date: string;
  end_date: string;
  bullets: string[];
}

export interface ResumeEducation {
  degree: string;
  institution: string;
  year: string;
}

export interface ResumeProject {
  name: string;
  description: string;
  technologies: string[];
  bullets: string[];
}

export interface ResumeSkillCategory {
  category: string;
  skills: string[];
}

export interface ResumeJSON {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  summary: string;
  skills: ResumeSkillCategory[];
  experience: ResumeExperience[];
  education: ResumeEducation[];
  projects?: ResumeProject[];
}

export interface ApplicationRecord {
  id: string;
  company: string;
  role: string;
  job_description: string;

  created_at: string;
  updated_at: string;
  applied_at?: string;

  resume_json?: ResumeJSON;
  resume_pdf_url?: string;
  resume_version_id?: string;

  score?: ApplicationScore;
  missing_keywords?: string[];
  improvements?: string[];

  status: ApplicationStatus;

  notion_synced?: boolean;
  notion_page_id?: string;

  prompts: ApplicationPrompts;
}

export type CreateApplicationInput = Pick<
  ApplicationRecord,
  "company" | "role" | "job_description"
>;

export type UpdateApplicationInput = Partial<
  Omit<ApplicationRecord, "id" | "created_at">
>;
