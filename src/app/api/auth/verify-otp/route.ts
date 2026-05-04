import { NextResponse } from "next/server";
import { otpStore } from "@/lib/otpStore";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    const storedData = otpStore.get(email);

    if (!storedData) {
      return NextResponse.json({ error: "No OTP found for this email" }, { status: 400 });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email);
      return NextResponse.json({ error: "OTP has expired" }, { status: 400 });
    }

    if (storedData.code === otp) {
      // Clear the OTP
      otpStore.delete(email);
      
      // Upsert user in database
      const { prisma } = await import("@/lib/prisma");
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          clerkId: `otp_${email}`, // Placeholder since we bypassed Clerk
          name: email.split('@')[0],
        },
      });

      const response = NextResponse.json({ 
        success: true, 
        message: "OTP verified successfully",
        user: { id: user.id, email: user.email }
      });

      // Set a simple cookie for "session"
      response.cookies.set("user_id", user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
      });

      return response;
    } else {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }
  } catch (error) {
    console.error("OTP Verify Error:", error);
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 });
  }
}
