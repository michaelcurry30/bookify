function baseTemplate(bodyHtml) {
  return `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#052e16;font-family:Inter,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#052e16;padding:40px 16px;">
      <tr>
        <td align="center">
          <table width="480" cellpadding="0" cellspacing="0" style="background-color:#0a1f14;border:1px solid rgba(74,222,128,0.2);border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 0;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px;">
                  <span style="font-size:18px;font-weight:800;color:#f0fdf4;">Book<span style="color:#22c55e;">Ify</span> AI</span>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;color:#f0fdf4;font-size:15px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
          </table>
          <p style="color:rgba(240,253,244,0.3);font-size:12px;margin-top:20px;">
            BookIfy AI - AI-powered lead response for service businesses.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function button(text, url) {
  return `
    <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#16a34a,#22c55e);color:#052e16;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;margin-top:16px;">
      ${text}
    </a>`;
}

export function welcomeEmailHtml(businessName, dashboardUrl) {
  return baseTemplate(`
    <h1 style="font-size:22px;margin:0 0 12px;">Welcome to BookIfy AI, ${businessName}!</h1>
    <p>Your BookIfy AI is set up. Here is how to get your first lead captured in the next 15 minutes:</p>
    <ol style="padding-left:20px;color:rgba(240,253,244,0.85);">
      <li style="margin-bottom:8px;">Confirm your business details in Settings</li>
      <li style="margin-bottom:8px;">Connect your lead sources (website, Facebook, Google)</li>
      <li style="margin-bottom:8px;">Send yourself a test lead to see the AI respond</li>
    </ol>
    ${button("Go to Your Dashboard", dashboardUrl)}
    <p style="margin-top:24px;color:rgba(240,253,244,0.5);font-size:13px;">
      Questions? Just reply to this email - a real person will help.
    </p>
  `);
}

export function fourDaysLeftHtml(businessName, leadsCount, bookingsCount, upgradeUrl) {
  return baseTemplate(`
    <h1 style="font-size:22px;margin:0 0 12px;">${businessName}, you have 4 days left in your trial</h1>
    <p>Here is what you will lose if your trial ends without upgrading:</p>
    <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:10px;padding:16px;margin:16px 0;">
      <p style="margin:0 0 6px;color:#fca5a5;font-weight:700;">${leadsCount} leads</p>
      <p style="margin:0 0 6px;color:#fca5a5;font-weight:700;">${bookingsCount} booked appointments</p>
      <p style="margin:0;color:#fca5a5;">All AI conversation history</p>
    </div>
    <p>Upgrade now to keep everything BookIfy has captured for you so far.</p>
    ${button("Upgrade Now", upgradeUrl)}
  `);
}

export function lastDayHtml(businessName, leadsCount, bookingsCount, upgradeUrl) {
  return baseTemplate(`
    <h1 style="font-size:22px;margin:0 0 12px;">${businessName}, your trial ends tomorrow</h1>
    <p>Your <strong>${leadsCount} leads</strong> and <strong>${bookingsCount} bookings</strong> are at risk. Once your trial ends, you will lose access to all of it.</p>
    <p style="color:rgba(240,253,244,0.7);">Upgrade now to keep everything and stay live - no interruption to your AI responding to leads.</p>
    ${button("Upgrade Now - Do Not Lose Your Data", upgradeUrl)}
  `);
}

export function trialEndedHtml(businessName, reactivateUrl) {
  return baseTemplate(`
    <h1 style="font-size:22px;margin:0 0 12px;">${businessName}, your free trial has ended</h1>
    <p>Your BookIfy AI has stopped responding to new leads. But do not worry - your data is still here.</p>
    <p style="color:rgba(240,253,244,0.7);">Reactivate in one click to recover your leads and get back to booking jobs automatically.</p>
    ${button("Reactivate My Account", reactivateUrl)}
  `);
}
