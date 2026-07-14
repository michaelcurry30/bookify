interface EmailAttachment {
  filename: string;
  content: string; // base64-encoded content
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

export async function sendEmail({ to, subject, html, attachments }: SendEmailParams) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.RESEND_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL || "BookIfy AI <onboarding@resend.dev>",
      to,
      subject,
      html,
      ...(attachments ? { attachments } : {}),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Resend send error:", errText);
    throw new Error("Failed to send email: " + errText);
  }

  return res.json();
}
