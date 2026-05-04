import { NextResponse } from "next/server";
import OpenAI from "openai";
import { analyzeResumePrompt } from "@/lib/ai/prompts";
import PDFParser from "pdf2json";

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
    const formData = await req.formData();
    const file = formData.get("resume") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse PDF using pdf2json
    const pdfParser = new PDFParser(null, true);
    
    const resumeText = await new Promise<string>((resolve, reject) => {
      pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
      pdfParser.on("pdfParser_dataReady", () => {
        resolve(pdfParser.getRawTextContent());
      });
      pdfParser.parseBuffer(buffer);
    });

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json({ error: "Could not extract text from PDF" }, { status: 400 });
    }

    // Send to AI for analysis
    const prompt = analyzeResumePrompt(resumeText);
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [{ role: "system", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content || "{}";
    const data = JSON.parse(content);

    return NextResponse.json({ ...data, success: true });
  } catch (error) {
    console.error("Resume Analyze Error:", error);
    return NextResponse.json({ error: "Failed to analyze resume" }, { status: 500 });
  }
}
