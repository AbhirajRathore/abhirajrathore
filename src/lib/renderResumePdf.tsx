import React from "react";
import {
  renderToBuffer,
  Document,
  Page,
  Text,
  View,
  Link,
  StyleSheet,
  type DocumentProps,
} from "@react-pdf/renderer";
import type {
  ResumeJSON,
  ResumeExperience,
  ResumeSkillCategory,
  ResumeEducation,
  ResumeProject,
} from "@/lib/types";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 28,
    paddingBottom: 28,
    paddingLeft: 36,
    paddingRight: 36,
    color: "#111827",
  },
  headerName: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    color: "#1e3a8a",
  },
  headerContact: {
    fontSize: 9,
    color: "#4b5563",
    marginBottom: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  headerItem: { fontSize: 9, color: "#4b5563" },
  divider: { borderBottomWidth: 1, borderBottomColor: "#1e3a8a", marginBottom: 8 },
  section: { marginBottom: 10 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a8a",
    borderBottomWidth: 0.5,
    borderBottomColor: "#93c5fd",
    paddingBottom: 2,
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summary: { fontSize: 10, lineHeight: 1.5, color: "#1f2937" },
  skillRow: { flexDirection: "row", marginBottom: 3, flexWrap: "wrap" },
  skillCategory: { fontFamily: "Helvetica-Bold", fontSize: 9.5, marginRight: 4 },
  skillList: { fontSize: 9.5, color: "#374151", flex: 1 },
  expHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 1,
  },
  expTitle: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  expDate: { fontSize: 9, color: "#6b7280" },
  expCompany: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  expCompanyName: { fontFamily: "Helvetica-Oblique", fontSize: 9.5, color: "#374151" },
  expLocation: { fontSize: 9, color: "#6b7280" },
  bullet: { flexDirection: "row", marginBottom: 2, paddingLeft: 8 },
  bulletDot: { fontSize: 9, marginRight: 4, color: "#1e3a8a" },
  bulletText: { fontSize: 9.5, flex: 1, lineHeight: 1.4, color: "#1f2937" },
  expBlock: { marginBottom: 8 },
  eduBlock: { marginBottom: 6 },
  eduHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  eduDegree: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  eduYear: { fontSize: 9, color: "#6b7280" },
  eduInstitution: { fontFamily: "Helvetica-Oblique", fontSize: 9.5, color: "#374151" },
  projBlock: { marginBottom: 6 },
  projName: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  projTech: { fontFamily: "Helvetica-Oblique", fontSize: 9, color: "#6b7280", marginBottom: 2 },
  projDesc: { fontSize: 9.5, color: "#374151", marginBottom: 2 },
});

function Header({ resume }: { resume: ResumeJSON }) {
  return React.createElement(
    View,
    { style: styles.section },
    React.createElement(Text, { style: styles.headerName }, resume.name),
    React.createElement(
      View,
      { style: styles.headerContact },
      React.createElement(Text, { style: styles.headerItem }, `✉ ${resume.email}`),
      React.createElement(Text, { style: styles.headerItem }, `✆ ${resume.phone}`),
      React.createElement(Text, { style: styles.headerItem }, `⌖ ${resume.location}`),
      React.createElement(
        Link,
        { src: `https://${resume.linkedin}`, style: styles.headerItem },
        resume.linkedin
      )
    ),
    React.createElement(View, { style: styles.divider })
  );
}

function SummarySection({ resume }: { resume: ResumeJSON }) {
  return React.createElement(
    View,
    { style: styles.section },
    React.createElement(Text, { style: styles.sectionTitle }, "Professional Summary"),
    React.createElement(Text, { style: styles.summary }, resume.summary)
  );
}

function SkillsSection({ resume }: { resume: ResumeJSON }) {
  return React.createElement(
    View,
    { style: styles.section },
    React.createElement(Text, { style: styles.sectionTitle }, "Technical Skills"),
    ...resume.skills.map((cat: ResumeSkillCategory) =>
      React.createElement(
        View,
        { key: cat.category, style: styles.skillRow },
        React.createElement(Text, { style: styles.skillCategory }, `${cat.category}:`),
        React.createElement(Text, { style: styles.skillList }, cat.skills.join(", "))
      )
    )
  );
}

function ExperienceSection({ resume }: { resume: ResumeJSON }) {
  return React.createElement(
    View,
    { style: styles.section },
    React.createElement(Text, { style: styles.sectionTitle }, "Professional Experience"),
    ...resume.experience.map((exp: ResumeExperience) =>
      React.createElement(
        View,
        { key: `${exp.company}-${exp.title}`, style: styles.expBlock },
        React.createElement(
          View,
          { style: styles.expHeader },
          React.createElement(Text, { style: styles.expTitle }, exp.title),
          React.createElement(
            Text,
            { style: styles.expDate },
            `${exp.start_date} – ${exp.end_date}`
          )
        ),
        React.createElement(
          View,
          { style: styles.expCompany },
          React.createElement(Text, { style: styles.expCompanyName }, exp.company),
          React.createElement(Text, { style: styles.expLocation }, exp.location)
        ),
        ...exp.bullets.map((b: string, i: number) =>
          React.createElement(
            View,
            { key: i, style: styles.bullet },
            React.createElement(Text, { style: styles.bulletDot }, "•"),
            React.createElement(Text, { style: styles.bulletText }, b)
          )
        )
      )
    )
  );
}

function EducationSection({ resume }: { resume: ResumeJSON }) {
  return React.createElement(
    View,
    { style: styles.section },
    React.createElement(Text, { style: styles.sectionTitle }, "Education"),
    ...resume.education.map((edu: ResumeEducation) =>
      React.createElement(
        View,
        { key: edu.institution, style: styles.eduBlock },
        React.createElement(
          View,
          { style: styles.eduHeader },
          React.createElement(Text, { style: styles.eduDegree }, edu.degree),
          React.createElement(Text, { style: styles.eduYear }, edu.year)
        ),
        React.createElement(Text, { style: styles.eduInstitution }, edu.institution)
      )
    )
  );
}

function ProjectsSection({ resume }: { resume: ResumeJSON }) {
  if (!resume.projects || resume.projects.length === 0) return null;

  return React.createElement(
    View,
    { style: styles.section },
    React.createElement(Text, { style: styles.sectionTitle }, "Projects"),
    ...resume.projects.map((proj: ResumeProject) =>
      React.createElement(
        View,
        { key: proj.name, style: styles.projBlock },
        React.createElement(Text, { style: styles.projName }, proj.name),
        proj.technologies.length > 0
          ? React.createElement(
              Text,
              { style: styles.projTech },
              proj.technologies.join(" · ")
            )
          : null,
        React.createElement(Text, { style: styles.projDesc }, proj.description),
        ...proj.bullets.map((b: string, i: number) =>
          React.createElement(
            View,
            { key: i, style: styles.bullet },
            React.createElement(Text, { style: styles.bulletDot }, "•"),
            React.createElement(Text, { style: styles.bulletText }, b)
          )
        )
      )
    )
  );
}

function ResumeDocument({ resume }: { resume: ResumeJSON }) {
  return React.createElement(
    Document,
    {
      title: `${resume.name} — Resume`,
      author: resume.name,
      creator: "Job Tracker",
    },
    React.createElement(
      Page,
      { size: "LETTER", style: styles.page },
      React.createElement(Header, { resume }),
      React.createElement(SummarySection, { resume }),
      React.createElement(SkillsSection, { resume }),
      React.createElement(ExperienceSection, { resume }),
      React.createElement(EducationSection, { resume }),
      React.createElement(ProjectsSection, { resume })
    )
  );
}

export async function renderResumePdfToBuffer(resume: ResumeJSON): Promise<Buffer> {
  const element = React.createElement(
    ResumeDocument,
    { resume }
  ) as unknown as React.ReactElement<DocumentProps>;
  return renderToBuffer(element);
}
