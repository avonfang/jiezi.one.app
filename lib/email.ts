import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export async function sendResetEmail(to: string, token: string): Promise<boolean> {
  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping email send');
    return false;
  }

  const host = process.env.JIEZI_DOMAIN || 'localhost:3000';
  const resetLink = `https://${host}/reset-password?token=${token}`;

  try {
    await resend.emails.send({
      from: '芥子 <onboarding@resend.dev>',
      to,
      subject: '找回你的芥子账号密码',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;padding:40px 20px;">
          <table align="center" style="max-width:480px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
            <tr><td style="padding:32px 32px 0;text-align:center;">
              <span style="font-size:28px;">🌱</span>
              <h1 style="font-size:18px;font-weight:700;color:#111;margin:8px 0 4px;">找回密码</h1>
              <p style="font-size:13px;color:#888;margin:0 0 24px;">点击下方按钮重置你的芥子账号密码</p>
            </td></tr>
            <tr><td style="padding:0 32px;text-align:center;">
              <a href="${resetLink}" style="display:inline-block;background:#10b981;color:#fff;font-size:14px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;margin-bottom:24px;">重置密码</a>
            </td></tr>
            <tr><td style="padding:0 32px 24px;text-align:center;">
              <p style="font-size:12px;color:#aaa;line-height:1.6;">如果按钮无法点击，请复制以下链接到浏览器：<br><a href="${resetLink}" style="color:#10b981;word-break:break-all;">${resetLink}</a></p>
              <p style="font-size:11px;color:#ccc;margin-top:16px;">此链接有效期 1 小时，如果不是你本人操作，请忽略此邮件。</p>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });
    return true;
  } catch (error) {
    console.error('Send email error:', error);
    return false;
  }
}
