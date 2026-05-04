import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { otpStore } from "@/lib/otpStore";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins

    otpStore.set(email, { code: otp, expiresAt });

    // Real Gmail SMTP transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"InterviewPilot AI" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "🔐 Your InterviewPilot Login Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #f9fafb; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #16a34a, #22c55e); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">InterviewPilot AI</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">Your Personal Interview Coach</p>
          </div>
          <div style="padding: 40px 32px; text-align: center;">
            <p style="color: #374151; font-size: 16px; margin: 0 0 24px;">Use the code below to sign in. It expires in <strong>10 minutes</strong>.</p>
            <div style="background: white; border: 2px solid #bbf7d0; border-radius: 12px; padding: 24px; display: inline-block;">
              <span style="font-size: 48px; font-weight: 900; letter-spacing: 12px; color: #16a34a;">${otp}</span>
            </div>
            <p style="color: #9ca3af; font-size: 13px; margin: 24px 0 0;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        </div>
      `,
    });

    console.log(`-----------------------------------------`);
    console.log(`🔐 OTP sent to ${email}: ${otp}`);
    console.log(`-----------------------------------------`);

    return NextResponse.json({ success: true, message: "OTP sent to your Gmail!" });
  } catch (error) {
    console.error("OTP Send Error:", error);
    return NextResponse.json({ error: "Failed to send OTP. Check Gmail credentials." }, { status: 500 });
  }
}
