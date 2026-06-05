import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SITE_URL = 'https://contract-tracker-peach.vercel.app'

function inviteHtml(inviteUrl: string) {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f3f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f8;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,41,.08);">

        <!-- Header -->
        <tr>
          <td style="background:#0f1729;padding:24px 32px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:40px;height:40px;background:linear-gradient(160deg,#2f6bdc,#1f4ba8);border-radius:10px;text-align:center;vertical-align:middle;">
                  <span style="font-size:20px;">&#127959;</span>
                </td>
                <td style="padding-left:12px;">
                  <div style="color:#fff;font-size:17px;font-weight:700;letter-spacing:-0.01em;">&#1050;&#1086;&#1085;&#1090;&#1088;&#1072;&#1082;&#1090; &#1058;&#1088;&#1077;&#1082;&#1077;&#1088;</div>
                  <div style="color:#93a0bb;font-size:12px;margin-top:2px;">&#1059;&#1087;&#1088;&#1072;&#1074;&#1083;&#1077;&#1085;&#1080;&#1077; &#1079;&#1072;&#1082;&#1072;&#1079;&#1072;&#1084;&#1080;</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Badge -->
        <tr>
          <td style="padding:28px 32px 0;">
            <div style="display:inline-block;background:#eff6ff;color:#2f6bdc;font-size:12px;font-weight:700;padding:4px 10px;border-radius:6px;letter-spacing:0.05em;">
              &#128100; &#1055;&#1056;&#1048;&#1043;&#1051;&#1040;&#1064;&#1045;&#1053;&#1048;&#1045;
            </div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:16px 32px 28px;">
            <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#0f1729;letter-spacing:-0.02em;">
              &#1042;&#1072;&#1089; &#1087;&#1088;&#1080;&#1075;&#1083;&#1072;&#1096;&#1072;&#1102;&#1090; &#1074; &#1050;&#1086;&#1085;&#1090;&#1088;&#1072;&#1082;&#1090; &#1058;&#1088;&#1077;&#1082;&#1077;&#1088;
            </h1>
            <p style="margin:0 0 24px;color:#5a6478;font-size:15px;line-height:1.6;">
              &#1042;&#1099; &#1087;&#1086;&#1083;&#1091;&#1095;&#1080;&#1083;&#1080; &#1087;&#1088;&#1080;&#1075;&#1083;&#1072;&#1096;&#1077;&#1085;&#1080;&#1077; &#1076;&#1083;&#1103; &#1088;&#1072;&#1073;&#1086;&#1090;&#1099; &#1074; &#1089;&#1080;&#1089;&#1090;&#1077;&#1084;&#1077; &#1091;&#1087;&#1088;&#1072;&#1074;&#1083;&#1077;&#1085;&#1080;&#1103; &#1082;&#1086;&#1085;&#1090;&#1088;&#1072;&#1082;&#1090;&#1072;&#1084;&#1080;. &#1053;&#1072;&#1078;&#1084;&#1080;&#1090;&#1077; &#1082;&#1085;&#1086;&#1087;&#1082;&#1091; &#1085;&#1080;&#1078;&#1077;, &#1095;&#1090;&#1086;&#1073;&#1099; &#1087;&#1088;&#1080;&#1085;&#1103;&#1090;&#1100; &#1087;&#1088;&#1080;&#1075;&#1083;&#1072;&#1096;&#1077;&#1085;&#1080;&#1077; &#1080; &#1079;&#1072;&#1076;&#1072;&#1090;&#1100; &#1087;&#1072;&#1088;&#1086;&#1083;&#1100;.
            </p>

            <a href="${inviteUrl}" style="display:inline-block;background:#2f6bdc;color:#fff;font-size:15px;font-weight:700;padding:14px 28px;border-radius:10px;text-decoration:none;letter-spacing:-0.01em;">
              &#1055;&#1088;&#1080;&#1085;&#1103;&#1090;&#1100; &#1087;&#1088;&#1080;&#1075;&#1083;&#1072;&#1096;&#1077;&#1085;&#1080;&#1077; &rarr;
            </a>

            <p style="margin:24px 0 0;color:#b0b8c8;font-size:12px;line-height:1.5;">
              &#1057;&#1089;&#1099;&#1083;&#1082;&#1072; &#1076;&#1077;&#1081;&#1089;&#1090;&#1074;&#1091;&#1077;&#1090; 24 &#1095;&#1072;&#1089;&#1072;. &#1045;&#1089;&#1083;&#1080; &#1074;&#1099; &#1085;&#1077; &#1078;&#1076;&#1072;&#1083;&#1080; &#1087;&#1088;&#1080;&#1075;&#1083;&#1072;&#1096;&#1077;&#1085;&#1080;&#1103; — &#1087;&#1088;&#1086;&#1089;&#1090;&#1086; &#1080;&#1075;&#1085;&#1086;&#1088;&#1080;&#1088;&#1091;&#1081;&#1090;&#1077; &#1101;&#1090;&#1086; &#1087;&#1080;&#1089;&#1100;&#1084;&#1086;.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8f9fb;padding:16px 32px;border-top:1px solid #eef0f4;">
            <p style="margin:0;color:#b0b8c8;font-size:12px;text-align:center;">
              &#1040;&#1074;&#1090;&#1086;&#1084;&#1072;&#1090;&#1080;&#1095;&#1077;&#1089;&#1082;&#1086;&#1077; &#1091;&#1074;&#1077;&#1076;&#1086;&#1084;&#1083;&#1077;&#1085;&#1080;&#1077; &middot; &#1050;&#1086;&#1085;&#1090;&#1088;&#1072;&#1082;&#1090; &#1058;&#1088;&#1077;&#1082;&#1077;&#1088;<br>
              &#1053;&#1077; &#1086;&#1090;&#1074;&#1077;&#1095;&#1072;&#1081;&#1090;&#1077; &#1085;&#1072; &#1101;&#1090;&#1086; &#1087;&#1080;&#1089;&#1100;&#1084;&#1086;
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })

    // Генерируем ссылку-приглашение через Supabase admin
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'invite',
      email,
      options: { redirectTo: `${SITE_URL}/login` },
    })

    if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 })

    const inviteUrl = linkData.properties?.action_link
    if (!inviteUrl) return NextResponse.json({ error: 'Failed to generate invite link' }, { status: 500 })

    // Отправляем своё письмо через Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Контракт Трекер <onboarding@resend.dev>',
        to: email,
        subject: 'Приглашение в Контракт Трекер',
        html: inviteHtml(inviteUrl),
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: err }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
