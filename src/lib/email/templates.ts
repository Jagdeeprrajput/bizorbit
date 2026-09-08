// Plain HTML for now — Phase 12 replaces these with React Email components.

function shell(title: string, bodyHtml: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f6f4f0;font-family:system-ui,sans-serif;color:#1f1b17;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
      <tr>
        <td align="center">
          <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:32px;">
                <p style="font-size:18px;font-weight:600;margin:0 0 24px;">
                  Biz<span style="color:#ae4c0d;">Orbit</span>
                </p>
                <h1 style="font-size:20px;margin:0 0 16px;">${title}</h1>
                ${bodyHtml}
                <p style="margin-top:32px;font-size:12px;color:#8a8177;">
                  BizOrbit · Internal workforce platform
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function verificationEmail(url: string) {
  const html = shell(
    "Verify your email",
    `<p style="font-size:14px;line-height:1.6;color:#48423b;">
      Confirm this is your work email to finish setting up your BizOrbit account.
    </p>
    <a href="${url}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#ed7014;color:#1f1b17;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
      Verify email
    </a>
    <p style="margin-top:24px;font-size:12px;color:#8a8177;">This link expires in 24 hours.</p>`,
  );
  return {
    html,
    text: `Verify your BizOrbit email: ${url} (expires in 24 hours)`,
  };
}

export function welcomeEmail(url: string) {
  const html = shell(
    "Welcome to BizOrbit",
    `<p style="font-size:14px;line-height:1.6;color:#48423b;">
      HR just created your BizOrbit account. Set a password to finish setting it up —
      minimum 12 characters.
    </p>
    <a href="${url}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#ed7014;color:#1f1b17;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
      Set your password
    </a>
    <p style="margin-top:24px;font-size:12px;color:#8a8177;">This link expires in 1 hour.</p>`,
  );
  return {
    html,
    text: `Welcome to BizOrbit. Set your password: ${url} (expires in 1 hour)`,
  };
}

export function resetPasswordEmail(url: string) {
  const html = shell(
    "Reset your password",
    `<p style="font-size:14px;line-height:1.6;color:#48423b;">
      We got a request to reset your BizOrbit password. If this wasn't you, ignore this email.
    </p>
    <a href="${url}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#ed7014;color:#1f1b17;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
      Reset password
    </a>
    <p style="margin-top:24px;font-size:12px;color:#8a8177;">This link expires in 1 hour and can only be used once.</p>`,
  );
  return {
    html,
    text: `Reset your BizOrbit password: ${url} (expires in 1 hour)`,
  };
}
