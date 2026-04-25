import { chatWithAI } from "@/lib/ai";
import { isDeveloperEmail } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { execSync } from "child_process";

export async function POST(request: Request) {
  try {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    if (!isDeveloperEmail(token?.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tasks } = await request.json();

    // 1. Calculate the 10-minute threshold
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const tenMinutesAgoISO = tenMinutesAgo.toISOString();

    // 2. Get Technical Context (Git Local or GitHub API)
    let technicalContext = "";
    const GITHUB_PAT = process.env.GITHUB_PAT;
    const GITHUB_REPO = process.env.GITHUB_REPO;

    // Try Local Git first (for development)
    try {
      // Use --since="10 minutes ago" for local git
      const status = execSync("git status --short").toString();
      const diff = execSync('git log --since="10 minutes ago" --stat --oneline').toString();
      
      if (status || diff) {
        technicalContext += `
        LOCAL GIT CHANGES (Last 10 Mins):
        ${status}
        
        LOG & STATS:
        ${diff || "No commits in last 10 mins, but files were modified."}
        `;
      }
    } catch (e) {
      console.log("Local Git not available or no recent changes.");
    }

    // Try GitHub API (for production/Vercel)
    if (GITHUB_PAT && GITHUB_REPO) {
      try {
        // Use since parameter for GitHub API
        const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/commits?since=${tenMinutesAgoISO}`, {
          headers: {
            "Authorization": `token ${GITHUB_PAT}`,
            "Accept": "application/vnd.github.v3+json"
          }
        });
        if (res.ok) {
          const commits = await res.json();
          if (commits.length > 0) {
            const commitSummary = commits.map((c: any) => `- ${c.commit.message} (${c.sha.substring(0,7)})`).join("\n");
            technicalContext += `
            RECENT GITHUB COMMITS (Last 10 Mins):
            ${commitSummary}
            `;
          }
        }
      } catch (e) {
        console.error("GitHub API fetch failed:", e);
      }
    }

    const taskList = tasks?.map((t: any) => `- [${t.type}] ${t.title || t.description}`).join("\n") || "No explicit tasks provided.";

    const prompt = `
    You are a Lead Software Developer at Autoworx Repairs.
    I am about to publish a system update. Please analyze the following inputs FROM THE LAST 10 MINUTES:
    
    1. DEVELOPER TASK LIST (Intended):
    ${taskList}
    
    2. TECHNICAL CONTEXT (Actual changes in the last 10 minutes):
    ${technicalContext || "No code changes detected in the last 10 minutes."}
    
    Based ONLY on these recent changes, please generate:
    1. A catchy, professional Release Title.
    2. A structured Release Summary (bullet points).
    
    Rules:
    - Focus strictly on what happened in the last 10 minutes.
    - If no technical context is found, rely on the task list.
    - Return your response STRICTLY as a JSON object with "title" and "summary" keys.
    `;

    const aiResponse = await chatWithAI([
      { role: "system", content: "You are a professional technical writer. Output only valid JSON." },
      { role: "user", content: prompt }
    ], { raw: true });

    try {
      const jsonStr = aiResponse.match(/\{[\s\S]*\}/)?.[0] || aiResponse;
      const parsed = JSON.parse(jsonStr);
      return NextResponse.json(parsed);
    } catch (e) {
      return NextResponse.json({ 
        title: "System Update", 
        summary: tasks?.map((t: any) => `• ${t.title || t.description}`).join("\n") || "Recent maintenance and performance improvements."
      });
    }

  } catch (error: any) {
    console.error("Error generating release notes:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
