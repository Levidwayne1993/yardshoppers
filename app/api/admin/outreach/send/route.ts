// ============================================================
// FILE: route.ts
// WHERE TO PUT THIS:
//   C:\Users\citys\Documents\yardshoppers\app\api\admin\outreach\send\route.ts
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Admin email(s) allowed to use outreach
const ADMIN_EMAILS = [
  'levistocks93@gmail.com',
  'admin@yardshoppers.com',
  'erwin-levi@outlook.com',
  'gary.w.erwin@gmail.com',
];

async function getAuthUser(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() { /* read-only in route handlers */ },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const user = await getAuthUser(request);
    if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      to,
      subject,
      emailBody,
      fromName,
      replyTo,
    } = body;

    if (!to || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, emailBody' },
        { status: 400 }
      );
    }

    // Use environment variables for SMTP config
    const smtpHost = process.env.SMTP_HOST || 'smtp.hostinger.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
    const smtpEmail = process.env.SMTP_EMAIL || '';
    const smtpPassword = process.env.SMTP_PASSWORD || '';

    if (!smtpEmail || !smtpPassword) {
      return NextResponse.json(
        { error: 'SMTP credentials not configured. Add SMTP_EMAIL and SMTP_PASSWORD to environment variables.' },
        { status: 500 }
      );
    }

    const senderName = fromName || 'Levi & Gary Erwin — YardShoppers';
    const senderReplyTo = replyTo || smtpEmail;

    // Use nodemailer to send
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpEmail,
        pass: smtpPassword,
      },
    });

    await transporter.sendMail({
      from: `${senderName} <${smtpEmail}>`,
      to,
      subject,
      text: emailBody,
      replyTo: senderReplyTo,
    });

    return NextResponse.json({ success: true, to });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Outreach send error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
