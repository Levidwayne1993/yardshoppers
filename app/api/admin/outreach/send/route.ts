// ============================================================
// FILE: route.ts
// WHERE TO PUT THIS:
//   C:\Users\citys\Documents\yardshoppers\app\api\admin\outreach\send\route.ts
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
      // New fields for send history
      category,
      organizationName,
    } = body;

    if (!to || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, emailBody' },
        { status: 400 }
      );
    }

    const smtpHost = process.env.SMTP_HOST || 'smtp.hostinger.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
    const smtpEmail = process.env.SMTP_EMAIL || '';
    const smtpPassword = process.env.SMTP_PASSWORD || '';

    if (!smtpEmail || !smtpPassword) {
      return NextResponse.json(
        { error: 'SMTP credentials not configured.' },
        { status: 500 }
      );
    }

    const senderName = fromName || 'Levi & Gary Erwin — YardShoppers';
    const senderReplyTo = replyTo || smtpEmail;

    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpEmail, pass: smtpPassword },
    });

    await transporter.sendMail({
      from: `${senderName} <${smtpEmail}>`,
      to,
      subject,
      text: emailBody,
      replyTo: senderReplyTo,
    });

    return NextResponse.json({
      success: true,
      to,
      sentByEmail: user.email,
      category: category || null,
      organizationName: organizationName || null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Outreach send error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
