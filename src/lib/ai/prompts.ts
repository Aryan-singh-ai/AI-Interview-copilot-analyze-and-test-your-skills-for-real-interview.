export const JOB_ROLES = [
  // Engineering
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Mobile Developer (React Native)",
  "Mobile Developer (iOS/Swift)",
  "Mobile Developer (Android/Kotlin)",
  "DevOps Engineer",
  "Cloud Engineer (AWS)",
  "Cloud Engineer (GCP)",
  "Cloud Engineer (Azure)",
  "Machine Learning Engineer",
  "Data Scientist",
  "Data Analyst",
  "Data Engineer",
  "AI/LLM Engineer",
  "Blockchain Developer",
  "Embedded Systems Engineer",
  "QA Engineer",
  "Security Engineer / Penetration Tester",
  "Site Reliability Engineer (SRE)",
  "Database Administrator",
  "Game Developer",
  // Product & Design
  "Product Manager",
  "UX Designer",
  "UI Designer",
  "UX Researcher",
  "Technical Program Manager",
  // Business & Management
  "Project Manager",
  "Business Analyst",
  "Scrum Master",
  "HR Manager",
  "Marketing Manager",
  "Sales Engineer",
  "Financial Analyst",
  "Operations Manager",
  // Other Tech
  "System Administrator",
  "Network Engineer",
  "Solutions Architect",
  "Technical Writer",
];

export const generateInterviewPrompt = (role: string, experience: string, difficulty: string) => `
You are an expert interviewer at a top-tier company hiring for the role of "${role}".
Your goal is to generate a single, highly relevant and realistic interview question.

Candidate Profile:
- Role: ${role}
- Experience: ${experience} years
- Difficulty: ${difficulty}

Role-specific guidance:
${getRoleGuidance(role)}

Instructions:
1. Generate ONE specific, open-ended interview question tailored to the "${role}" role.
2. The question should assess depth of knowledge, real-world experience, or problem-solving.
3. Vary question types: sometimes technical deep-dives, sometimes behavioral (STAR method), sometimes system design.
4. Provide 3-4 "hints" — key concepts/topics the candidate should ideally mention.

Output ONLY valid JSON:
{
  "question": "Your interview question here...",
  "hints": ["Key topic 1", "Key topic 2", "Key topic 3"]
}
`;

export const evaluateAnswerPrompt = (question: string, answer: string, role: string) => `
You are a strict but fair expert interviewer evaluating a candidate for a "${role}" position.

Question Asked: "${question}"
Candidate's Answer: "${answer}"

Evaluation Criteria:
- Technical Accuracy (does the answer reflect real knowledge?)
- Completeness (did they cover the main points?)
- Clarity & Communication (is it well-structured and clear?)
- Relevance (does it directly address the question?)

Instructions:
1. Score the answer strictly out of 10. Be honest — a vague or wrong answer should score 2-4, a decent answer 5-7, and an excellent answer 8-10.
2. List 2-3 specific strengths of the answer.
3. List 2-3 specific weaknesses or missing concepts.
4. Provide a concise, professional model answer they should aim for.

Output ONLY valid JSON:
{
  "score": 7.5,
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "improvedAnswer": "A strong answer would cover..."
}
`;

export const analyzeResumePrompt = (resumeText: string) => `
You are an expert career counselor and technical recruiter with deep knowledge of all major job roles across tech, business, design, and management.

A candidate has submitted their resume. Analyze it carefully and identify:
1. Their most likely job roles based on their skills, experience, and projects.
2. Their estimated experience level in years.
3. A brief summary of their professional profile.

Resume Content:
---
${resumeText.slice(0, 4000)}
---

Available Job Roles to choose from:
${JOB_ROLES.map((r, i) => `${i + 1}. ${r}`).join("\n")}

Instructions:
- Pick the TOP 3 most suitable roles from the list above based on the resume.
- Estimate their experience level (0-1 = Junior, 2-4 = Mid, 5-8 = Senior, 9+ = Principal/Lead).
- Write a 1-2 sentence profile summary.

Output ONLY valid JSON:
{
  "topRoles": ["Role 1", "Role 2", "Role 3"],
  "experienceYears": "3",
  "experienceLevel": "Mid-Level",
  "profileSummary": "A brief description of the candidate's background."
}
`;

function getRoleGuidance(role: string): string {
  const guidance: Record<string, string> = {
    "Frontend Developer": "Focus on React, Vue, Angular, CSS, performance optimization, accessibility, and web APIs.",
    "Backend Developer": "Focus on REST APIs, databases (SQL/NoSQL), server architecture, caching, authentication, and scalability.",
    "Full Stack Developer": "Balance frontend and backend questions. Cover system design, APIs, and deployment.",
    "Mobile Developer (React Native)": "Cover React Native architecture, native modules, performance, and cross-platform challenges.",
    "Mobile Developer (iOS/Swift)": "Cover Swift, UIKit, SwiftUI, Core Data, networking, and App Store guidelines.",
    "Mobile Developer (Android/Kotlin)": "Cover Kotlin, Jetpack Compose, Room, MVVM, and Android lifecycle.",
    "DevOps Engineer": "Focus on CI/CD pipelines, Docker, Kubernetes, Terraform, monitoring, and incident management.",
    "Cloud Engineer (AWS)": "Cover EC2, S3, Lambda, RDS, IAM, CloudFormation, and AWS architecture patterns.",
    "Machine Learning Engineer": "Cover model training, evaluation, feature engineering, MLOps, and deployment.",
    "Data Scientist": "Cover statistics, ML algorithms, EDA, Python (pandas, sklearn), and experiment design.",
    "Data Analyst": "Cover SQL, data visualization, Excel/Sheets, KPIs, and business reporting.",
    "Data Engineer": "Cover ETL pipelines, Spark, Airflow, data warehouses, and streaming (Kafka).",
    "AI/LLM Engineer": "Cover prompt engineering, RAG, fine-tuning, vector databases, and LLM deployment.",
    "Product Manager": "Cover product roadmap, prioritization frameworks (RICE, MoSCoW), metrics, and stakeholder management.",
    "UX Designer": "Cover user research, wireframing, usability testing, design systems, and Figma.",
    "QA Engineer": "Cover test planning, automation (Selenium, Cypress), TDD/BDD, and defect lifecycle.",
    "Security Engineer / Penetration Tester": "Cover OWASP, vulnerability assessment, SIEM, and secure coding.",
    "Business Analyst": "Cover requirements gathering, process mapping, stakeholder analysis, and Agile.",
    "Solutions Architect": "Cover system design, cloud architecture, trade-offs, scalability, and enterprise patterns.",
    "Project Manager": "Cover project lifecycle, risk management, budget tracking, and team coordination.",
  };
  return guidance[role] || `Ask questions relevant to the core skills and responsibilities of a ${role}.`;
}
