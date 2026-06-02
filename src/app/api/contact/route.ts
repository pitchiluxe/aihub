import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"AIHub Contact" <${process.env.GMAIL_USER}>`,
      to: "erickomari243@gmail.com",
      replyTo: email,
      subject: `[AIHub] ${subject || "New message"} — from ${name}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #0d1421; color: #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 24px 32px;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: white;">✨ New AIHub Message</h1>
            <p style="margin: 4px 0 0; color: rgba(255,255,255,0.75); font-size: 13px;">${new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}</p>
          </div>
          <div style="padding: 28px 32px; border: 1px solid #1a2540; border-top: none; border-radius: 0 0 12px 12px; background: #0d1421;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #1a2540; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; width: 90px;">From</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #1a2540; color: #e2e8f0; font-size: 14px;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #1a2540; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Email</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #1a2540;"><a href="mailto:${email}" style="color: #6366f1; font-size: 14px; text-decoration: none;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #1a2540; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Subject</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #1a2540; color: #e2e8f0; font-size: 14px;">${subject || "—"}</td>
              </tr>
            </table>
            <div style="margin-top: 24px;">
              <p style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 10px;">Message</p>
              <div style="background: #152033; border: 1px solid #1a2540; border-radius: 8px; padding: 16px 20px; color: #e2e8f0; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${message}</div>
            </div>
            <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #1a2540; text-align: center;">
              <a href="mailto:${email}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; font-weight: 600; font-size: 13px; padding: 10px 24px; border-radius: 8px; text-decoration: none;">Reply to ${name}</a>
            </div>
          </div>
        </div>
      `,
    });

    // Auto-reply to sender
    await transporter.sendMail({
      from: `"Erick Omari — AIHub" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Got your message — I'll be in touch soon 👋",
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; background: #0d1421; color: #e2e8f0; border-radius: 12px; overflow: hidden; border: 1px solid #1a2540;">
          <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 24px 32px;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: white;">✨ AIHub</h1>
          </div>
          <div style="padding: 28px 32px;">
            <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.7;">Hey <strong>${name}</strong> 👋</p>
            <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.7; color: #94a3b8;">Thanks for reaching out through AIHub. I received your message and will get back to you as soon as possible.</p>
            <div style="background: #152033; border: 1px solid #1a2540; border-radius: 8px; padding: 14px 18px; margin: 20px 0; font-size: 13px; color: #64748b; font-style: italic; line-height: 1.6;">"${message.substring(0, 200)}${message.length > 200 ? "…" : ""}"</div>
            <p style="margin: 0; font-size: 14px; color: #94a3b8;">— Erick Omari</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: #475569;">Builder of AIHub · The Homepage of Artificial Intelligence</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact email error:", err);
    return NextResponse.json({ error: "Failed to send message. Please try again." }, { status: 500 });
  }
}
