/**
 * Admin alerts adapter. Driver via ADMIN_ALERT_DRIVER:
 *   console (default) | telegram | webhook
 * Always no-ops gracefully — alerts must never break the caller.
 */

const DRIVER = process.env.ADMIN_ALERT_DRIVER || 'console'

export async function notifyAdmin(subject: string, body: string): Promise<void> {
  try {
    if (DRIVER === 'telegram') {
      const token = process.env.TELEGRAM_BOT_TOKEN
      const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
      if (!token || !chatId) {
        console.warn('[alerts] telegram driver selected but TELEGRAM_BOT_TOKEN / TELEGRAM_ADMIN_CHAT_ID missing')
        return
      }
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: `${subject}\n\n${body}` }),
      })
    } else if (DRIVER === 'webhook') {
      const url = process.env.ADMIN_ALERT_WEBHOOK
      if (!url) {
        console.warn('[alerts] webhook driver selected but ADMIN_ALERT_WEBHOOK missing')
        return
      }
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body }),
      })
    } else {
      console.log(`[alert] ${subject}\n${body}`)
    }
  } catch (err) {
    console.error('[alerts] delivery failed:', err)
  }
}
