import { NextResponse } from "next/server";
import OpenAI from "openai";
import { evaluateAnswerPrompt } from "@/lib/ai/prompts";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "InterviewPilot AI",
  },
});

export async function POST(req: Request) {
  try {
    const { answer, question, role, interviewId } = await req.json();

    const prompt = evaluateAnswerPrompt(question, answer, role);

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [{ role: "system", content: prompt }],
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0]?.message?.content || "{}";
    const data = JSON.parse(responseContent);

    // Save to DB if interviewId exists
    if (interviewId) {
      const { prisma } = await import("@/lib/prisma");
      await prisma.response.create({
        data: {
          interviewId,
          question,
          userAnswer: answer,
          score: data.score,
          feedback: data.improvedAnswer,
          strengths: JSON.stringify(data.strengths),
          weaknesses: JSON.stringify(data.weaknesses),
          improvedAnswer: data.improvedAnswer,
        }
      });

      // Update overall interview score (simple average for MVP)
      const allResponses = await prisma.response.findMany({ where: { interviewId } });
      const avgScore = allResponses.reduce((acc, curr) => acc + (curr.score || 0), 0) / allResponses.length;
      
      await prisma.interview.update({
        where: { id: interviewId },
        data: { overallScore: avgScore }
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Evaluate API Error:", error);
    return NextResponse.json({ error: "Failed to evaluate answer" }, { status: 500 });
  }
}
