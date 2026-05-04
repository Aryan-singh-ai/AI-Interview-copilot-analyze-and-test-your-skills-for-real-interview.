import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, difficulty } = await req.json();

    const interview = await prisma.interview.create({
      data: {
        userId,
        role: role || "Software Engineer",
        difficulty: difficulty || "Medium",
        interviewType: "Technical",
        status: "IN_PROGRESS",
      },
    });

    return NextResponse.json({ interviewId: interview.id });
  } catch (error) {
    console.error("Start Interview Error:", error);
    return NextResponse.json({ error: "Failed to start interview" }, { status: 500 });
  }
}
