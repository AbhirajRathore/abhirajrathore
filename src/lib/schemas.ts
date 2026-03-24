import { z } from "zod";
import {
  normalizeEmailString,
  normalizeLinkedInString,
  normalizePhoneString,
} from "./utils";

// ─── Resume Schema ────────────────────────────────────────────────────────────

const ResumeExperienceSchema = z.object({
  company: z.string().min(1, "Company name required"),
  title: z.string().min(1, "Job title required"),
  location: z.string(),
  start_date: z.string().min(1, "Start date required"),
  end_date: z.string().min(1, "End date required"),
  bullets: z
    .array(z.string().min(1))
    .min(1, "At least one bullet point required"),
});

const ResumeEducationSchema = z.object({
  degree: z.string().min(1, "Degree required"),
  institution: z.string().min(1, "Institution required"),
  year: z.string().min(1, "Year required"),
});

const ResumeProjectSchema = z.object({
  name: z.string().min(1, "Project name required"),
  description: z.string(),
  technologies: z.array(z.string()),
  bullets: z.array(z.string()),
});

const ResumeSkillCategorySchema = z.object({
  category: z.string().min(1, "Category required"),
  skills: z.array(z.string().min(1)).min(1, "At least one skill required"),
});

export const ResumeSchema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.preprocess(
    normalizeEmailString,
    z.string().min(1, "Email required").email("Valid email required")
  ),
  phone: z.preprocess(
    normalizePhoneString,
    z.string().min(1, "Phone required")
  ),
  location: z.string().min(1, "Location required"),
  linkedin: z.preprocess(
    normalizeLinkedInString,
    z.string().min(1, "LinkedIn URL or profile path required")
  ),
  summary: z
    .string()
    .min(50, "Summary must be at least 50 characters")
    .max(1000, "Summary must be under 1000 characters"),
  skills: z
    .array(ResumeSkillCategorySchema)
    .min(1, "At least one skill category required"),
  experience: z
    .array(ResumeExperienceSchema)
    .min(1, "At least one experience entry required"),
  education: z
    .array(ResumeEducationSchema)
    .min(1, "At least one education entry required"),
  projects: z.array(ResumeProjectSchema).optional(),
});

// ─── Score Schema ─────────────────────────────────────────────────────────────

export const ScoreSchema = z.object({
  keyword_match: z
    .number()
    .min(0)
    .max(100, "Score must be between 0 and 100"),
  relevance: z.number().min(0).max(100, "Score must be between 0 and 100"),
  impact: z.number().min(0).max(100, "Score must be between 0 and 100"),
  clarity: z.number().min(0).max(100, "Score must be between 0 and 100"),
  total: z.number().min(0).max(100, "Score must be between 0 and 100"),
  missing_keywords: z.array(z.string()),
  improvements: z.array(z.string()),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type ResumeSchemaType = z.infer<typeof ResumeSchema>;
export type ScoreSchemaType = z.infer<typeof ScoreSchema>;
