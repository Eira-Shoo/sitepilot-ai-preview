import { Resend } from "resend";

export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("RESEND_API_KEY missing — email skipped");
    return { skipped: true as const };
  }
  const resend = new Resend(key);
  const from = process.env.RESEND_FROM ?? "SitePilot <onboarding@resend.dev>";
  await resend.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
  return { skipped: false as const };
}
