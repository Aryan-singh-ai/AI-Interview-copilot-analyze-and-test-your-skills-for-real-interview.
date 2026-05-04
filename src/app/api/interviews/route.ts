import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const interviews = await prisma.interview.findMany({
      where: { userId },
      include: {
        responses: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const parsedInterviews = interviews.map(interview => ({
      ...interview,
      responses: interview.responses.map(resp => ({
        ...resp,
        strengths: resp.strengths ? JSON.parse(resp.strengths) : [],
        weaknesses: resp.weaknesses ? JSON.parse(resp.weaknesses) : [],
      }))
    }));

    return NextResponse.json({ interviews: parsedInterviews });
  } catch (error) {
    console.error("Get Interviews Error:", error);
    return NextResponse.json({ error: "Failed to fetch interviews" }, { status: 500 });
  }
}
