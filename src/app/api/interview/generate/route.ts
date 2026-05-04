import { NextResponse } from "next/server";
import OpenAI from "openai";
import { generateInterviewPrompt } from "@/lib/ai/prompts";

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
    const { role, experience, difficulty } = await req.json();

    const prompt = generateInterviewPrompt(role, experience, difficulty);

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [{ role: "system", content: prompt }],
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0]?.message?.content || "{}";
    const data = JSON.parse(responseContent);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Generate API Error:", error);
    return NextResponse.json({ error: "Failed to generate interview question" }, { status: 500 });
  }
}
