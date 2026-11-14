import { env } from "../config/env.js";

export async function sendEmail({ to, subject, text }) {
  if (!env.emailApiKey || !env.emailFrom || !to)
    return { sent: false, reason: "email_not_configured" };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.emailApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: env.emailFrom, to: [to], subject, text }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok)
    throw new Error(`Email provider returned ${response.status}.`);
  return { sent: true };
}
