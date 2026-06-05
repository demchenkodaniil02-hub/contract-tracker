import { NextResponse } from 'next/server'
import { Task } from '@/lib/types'

// Конвертируем кириллицу в HTML-entities — единственный надёжный способ для Gmail
function e(str?: string) {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .split('').map(c => c.charCodeAt(0) > 127 ? `&#${c.charCodeAt(0)};` : c).join('')
}

function emailHtml(task: Task, contractNumber?: string, type: 'assigned' | 'reminder' = 'reminder', assignerName?: string) {
  const dueLabel = `${task.dueDate.split('-').reverse().join('.')} в ${task.dueTime}`
  const isAssigned = type === 'assigned'
  const badge = isAssigned ? '&#128100; &#1053;&#1040;&#1047;&#1053;&#1040;&#1063;&#1045;&#1053;&#1040; &#1047;&#1040;&#1044;&#1040;&#1063;&#1040;' : '&#9200; &#1053;&#1040;&#1055;&#1054;&#1052;&#1048;&#1053;&#1040;&#1053;&#1048;&#1045;'
  const badgeColor = isAssigned ? '#1f8a5b' : '#e07a1a'
  const badgeBg = isAssigned ? '#f0fdf4' : '#fff3e0'
  const heading = isAssigned ? '&#1042;&#1072;&#1084; &#1085;&#1072;&#1079;&#1085;&#1072;&#1095;&#1077;&#1085;&#1072; &#1079;&#1072;&#1076;&#1072;&#1095;&#1072;' : e(task.title)
  const subheading = isAssigned ? e(task.title) : ''
  const assignerBlock = isAssigned && assignerName ? `<p style="margin:0 0 20px;color:#5a6478;font-size:14px;">&#1053;&#1072;&#1079;&#1085;&#1072;&#1095;&#1080;&#1083;: <strong style="color:#0f1729;">${e(assignerName)}</strong></p>` : ''
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
                  <span style="font-size:20px;">🏗</span>
                </td>
                <td style="padding-left:12px;">
                  <div style="color:#fff;font-size:17px;font-weight:700;letter-spacing:-0.01em;">Контракт Трекер</div>
                  <div style="color:#93a0bb;font-size:12px;margin-top:2px;">Напоминание о задаче</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            <div style="display:inline-block;background:${badgeBg};color:${badgeColor};font-size:12px;font-weight:700;padding:4px 10px;border-radius:6px;letter-spacing:0.05em;margin-bottom:16px;">${badge}</div>

            <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f1729;letter-spacing:-0.02em;">${heading}</h1>
            ${subheading ? `<p style="margin:0 0 12px;color:#5a6478;font-size:15px;font-weight:600;">${subheading}</p>` : ''}
            ${assignerBlock}
            ${task.description ? `<p style="margin:0 0 20px;color:#5a6478;font-size:15px;line-height:1.6;">${e(task.description)}</p>` : ''}

            <!-- Due date block -->
            <table cellpadding="0" cellspacing="0" width="100%" style="background:#f0f4ff;border-radius:12px;margin-bottom:24px;">
              <tr>
                <td style="padding:16px 20px;">
                  <div style="color:#8a93a8;font-size:12px;font-weight:600;margin-bottom:4px;">СРОК ВЫПОЛНЕНИЯ</div>
                  <div style="color:#2f6bdc;font-size:20px;font-weight:700;">${dueLabel}</div>
                </td>
              </tr>
            </table>

            ${contractNumber ? `<p style="margin:0 0 24px;color:#8a93a8;font-size:13px;">&#1044;&#1086;&#1075;&#1086;&#1074;&#1086;&#1088;: <strong style="color:#0f1729;">${e(contractNumber)}</strong></p>` : ''}

            <!-- CTA -->
            <a href="https://contract-tracker-peach.vercel.app/contracts" style="display:inline-block;background:#2f6bdc;color:#fff;font-size:14px;font-weight:700;padding:12px 24px;border-radius:10px;text-decoration:none;letter-spacing:-0.01em;">Открыть Контракт Трекер →</a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8f9fb;padding:16px 32px;border-top:1px solid #eef0f4;">
            <p style="margin:0;color:#b0b8c8;font-size:12px;text-align:center;">
              Автоматическое уведомление · Контракт Трекер<br>
              Не отвечайте на это письмо
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
    const { taskId, email, task, contractNumber, type, assignerName } = await req.json() as {
      taskId: string; email: string; task: Task; contractNumber?: string; type?: 'assigned' | 'reminder'; assignerName?: string
    }

    if (!email || !task) {
      return NextResponse.json({ error: 'Missing email or task' }, { status: 400 })
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.warn('RESEND_API_KEY not configured, taskId:', taskId)
      return NextResponse.json({ success: true, warning: 'Email service not configured' })
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        from: 'Контракт Трекер <onboarding@resend.dev>',
        to: email,
        subject: type === 'assigned' ? `👤 Вам назначена задача: ${task.title}` : `⏰ Напоминание: ${task.title}`,
        html: emailHtml(task, contractNumber, type ?? 'reminder', assignerName),
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
