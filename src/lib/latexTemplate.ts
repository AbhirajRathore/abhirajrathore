import type { ResumeJSON } from "./types";
import { escapeLatex } from "./utils";

// ─── Fixed LaTeX Template ─────────────────────────────────────────────────────
// AI formatting is FORBIDDEN. Only placeholder replacement is allowed.
// Structure is immutable — only content changes per application.

const LATEX_TEMPLATE = `\\documentclass[10pt,letterpaper]{article}

\\usepackage[left=0.5in,right=0.5in,top=0.4in,bottom=0.4in]{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage{titlesec}
\\usepackage{fontawesome5}
\\usepackage[T1]{fontenc}
\\usepackage{lmodern}
\\usepackage{microtype}
\\usepackage{xcolor}

\\definecolor{primary}{RGB}{30,64,175}
\\definecolor{secondary}{RGB}{75,85,99}

\\hypersetup{colorlinks=true, urlcolor=primary}
\\pagestyle{empty}
\\setlength{\\parindent}{0pt}

\\titleformat{\\section}{\\bfseries\\large\\color{primary}}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{6pt}{4pt}

\\setlist[itemize]{leftmargin=*, itemsep=1pt, topsep=2pt, parsep=0pt}

\\begin{document}

%% ── Header ──────────────────────────────────────────────────────────────────
{\\huge\\bfseries <<NAME>>} \\\\[4pt]
{\\color{secondary}\\small
  \\faEnvelope\\ <<EMAIL>> \\quad
  \\faPhone\\ <<PHONE>> \\quad
  \\faMapMarker*\\ <<LOCATION>> \\quad
  \\faLinkedin\\ \\href{https://<<LINKEDIN>>}{<<LINKEDIN>>}
}
\\vspace{4pt}\\hrule\\vspace{6pt}

%% ── Summary ──────────────────────────────────────────────────────────────────
\\section{Professional Summary}
<<SUMMARY>>

%% ── Skills ───────────────────────────────────────────────────────────────────
\\section{Technical Skills}
<<SKILLS>>

%% ── Experience ───────────────────────────────────────────────────────────────
\\section{Professional Experience}
<<EXPERIENCE>>

%% ── Education ────────────────────────────────────────────────────────────────
\\section{Education}
<<EDUCATION>>

%% ── Projects ─────────────────────────────────────────────────────────────────
<<PROJECTS_SECTION>>

\\end{document}`;

// ─── LaTeX Builders ───────────────────────────────────────────────────────────

function buildSkillsSection(resume: ResumeJSON): string {
  return resume.skills
    .map(
      (cat) =>
        `\\textbf{${escapeLatex(cat.category)}:} ${cat.skills.map(escapeLatex).join(", ")}`
    )
    .join(" \\\\\n");
}

function buildExperienceSection(resume: ResumeJSON): string {
  return resume.experience
    .map((exp) => {
      const bullets = exp.bullets
        .map((b) => `  \\item ${escapeLatex(b)}`)
        .join("\n");

      return `\\textbf{${escapeLatex(exp.title)}} \\hfill {\\small\\color{secondary}${escapeLatex(exp.start_date)} -- ${escapeLatex(exp.end_date)}}\\\\
{\\textit{${escapeLatex(exp.company)}}} \\hfill {\\small ${escapeLatex(exp.location)}}
\\begin{itemize}
${bullets}
\\end{itemize}
\\vspace{2pt}`;
    })
    .join("\n");
}

function buildEducationSection(resume: ResumeJSON): string {
  return resume.education
    .map(
      (edu) =>
        `\\textbf{${escapeLatex(edu.degree)}} \\hfill {\\small ${escapeLatex(edu.year)}}\\\\
{\\textit{${escapeLatex(edu.institution)}}}`
    )
    .join("\n\\vspace{4pt}\n");
}

function buildProjectsSection(resume: ResumeJSON): string {
  if (!resume.projects || resume.projects.length === 0) return "";

  const entries = resume.projects
    .map((proj) => {
      const bullets =
        proj.bullets.length > 0
          ? `\n\\begin{itemize}\n${proj.bullets.map((b) => `  \\item ${escapeLatex(b)}`).join("\n")}\n\\end{itemize}`
          : "";

      const tech =
        proj.technologies.length > 0
          ? ` {\\small\\textit{(${proj.technologies.map(escapeLatex).join(", ")})}}`
          : "";

      return `\\textbf{${escapeLatex(proj.name)}}${tech}\\\\
${escapeLatex(proj.description)}${bullets}`;
    })
    .join("\n\\vspace{4pt}\n");

  return `\\section{Projects}\n${entries}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Compiles a ResumeJSON into a complete LaTeX document string.
 * Returns the .tex source ready for compilation.
 */
export function buildLatexDocument(resume: ResumeJSON): string {
  return LATEX_TEMPLATE.replace("<<NAME>>", escapeLatex(resume.name))
    .replace("<<EMAIL>>", escapeLatex(resume.email))
    .replace("<<PHONE>>", escapeLatex(resume.phone))
    .replace("<<LOCATION>>", escapeLatex(resume.location))
    .replaceAll("<<LINKEDIN>>", escapeLatex(resume.linkedin))
    .replace("<<SUMMARY>>", escapeLatex(resume.summary))
    .replace("<<SKILLS>>", buildSkillsSection(resume))
    .replace("<<EXPERIENCE>>", buildExperienceSection(resume))
    .replace("<<EDUCATION>>", buildEducationSection(resume))
    .replace("<<PROJECTS_SECTION>>", buildProjectsSection(resume));
}

/**
 * Triggers a browser download of the .tex source file.
 * Call this client-side; the LaTeX source can be compiled at overleaf.com.
 */
export function downloadLatexFile(resume: ResumeJSON, filename?: string): void {
  const source = buildLatexDocument(resume);
  const blob = new Blob([source], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? `resume-${resume.name.replace(/\s+/g, "-")}.tex`;
  a.click();
  URL.revokeObjectURL(url);
}
