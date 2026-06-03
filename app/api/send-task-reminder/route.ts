import { NextResponse } from 'next/server'
import { Task } from '@/lib/types'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { taskId, email, task } = body as { taskId: string; email: string; task: Task }

    if (!email || !task) {
      return NextResponse.json({ error: 'Missing email or task' }, { status: 400 })
    }

    // Используем встроенный сервис отправки email (например, SendGrid, Resend или встроенный SMTP)
    // Для локальной разработки можно логировать, а для продакшена настроить реальный сервис
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.warn('RESEND_API_KEY not configured, email reminder not sent (taskId:', taskId, ')')
      return NextResponse.json({ success: true, warning: 'Email service not configured' })
    }

    const emailContent = `
      <h2>Напоминание о задаче</h2>
      <p><strong>${task.title}</strong></p>
      <p>${task.description || 'Описание отсутствует'}</p>
      <p><strong>Срок:</strong> ${task.dueDate} ${task.dueTime}</p>
      <p style="margin-top: 20px; color: #999; font-size: 12px;">
        Это автоматическое напоминание из системы контрактов. Не отвечайте на письмо.
      </p>
    `

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@kontrakttreker.local',
        to: email,
        subject: `Напоминание: ${task.title}`,
        html: emailContent,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Resend API error:', error)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Email reminder sent' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('send-task-reminder error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
