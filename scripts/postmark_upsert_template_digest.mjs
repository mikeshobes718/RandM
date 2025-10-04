import { ServerClient } from 'postmark';

const token = process.env.POSTMARK_SERVER_TOKEN;
if (!token) {
  console.error('POSTMARK_SERVER_TOKEN missing');
  process.exit(1);
}

const client = new ServerClient(token);

const Alias = 'daily-digest';
const Name = 'Daily Click Digest (Reviews & Marketing)';

const Subject = 'Your last 24h review-link clicks — {{total}} total';
const HtmlBody = `
  <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height:1.5;">
    <h2 style="margin:0 0 8px 0;">Last 24 hours</h2>
    <p style="margin:0 0 12px 0;">Here’s how customers engaged with your review link:</p>
    <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
      <tr><td style="padding:4px 8px;">QR</td><td style="padding:4px 8px;"><strong>{{qr}}</strong></td></tr>
      <tr><td style="padding:4px 8px;">WhatsApp</td><td style="padding:4px 8px;"><strong>{{whatsapp}}</strong></td></tr>
      <tr><td style="padding:4px 8px;">SMS</td><td style="padding:4px 8px;"><strong>{{sms}}</strong></td></tr>
      <tr><td style="padding:4px 8px;">Email</td><td style="padding:4px 8px;"><strong>{{email}}</strong></td></tr>
      <tr><td style="padding:4px 8px;">Other</td><td style="padding:4px 8px;"><strong>{{link}}</strong></td></tr>
      <tr><td style="padding:4px 8px;border-top:1px solid #eee;">Total</td><td style="padding:4px 8px;border-top:1px solid #eee;"><strong>{{total}}</strong></td></tr>
    </table>
    <p style="color:#6B7280;font-size:12px;margin-top:16px;">Dashboard: <a href="{{dashboard_url}}">{{dashboard_url}}</a></p>
  </div>
`;
const TextBody = `Last 24 hours click totals
QR: {{qr}}
WhatsApp: {{whatsapp}}
SMS: {{sms}}
Email: {{email}}
Other: {{link}}
Total: {{total}}

Dashboard: {{dashboard_url}}
`;

async function run() {
  const list = await client.getTemplates({ count: 300, offset: 0 });
  const found = list.Templates.find(t => t.Alias === Alias);
  if (found) {
    await client.editTemplate(found.TemplateId, { Name, Alias, Subject, HtmlBody, TextBody });
    console.log('Digest template updated:', found.TemplateId);
  } else {
    const created = await client.createTemplate({ Name, Alias, Subject, HtmlBody, TextBody });
    console.log('Digest template created:', created.TemplateId);
  }
}

run().catch((e) => { console.error(e); process.exit(1); });





















