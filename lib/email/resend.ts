import { Resend } from "resend";

const FROM_ADDRESS =
  process.env.RESEND_FROM_ADDRESS ?? "Swahili Komik Con <events@swahilikomikcon.com>";

function getClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export async function sendTicketOrderConfirmationEmail(params: {
  to: string;
  buyerName: string;
  confirmationRef: string;
  eventTitle: string;
  eventDate: string;
  venue: string;
  unitPrice: string;
  discount: string | null;
  total: string;
  influencerName: string | null;
  paymentUrl: string | null;
  alreadyPaid: boolean;
}) {
  const resend = getClient();
  if (!resend) {
    console.warn(
      "[resend] RESEND_API_KEY is not set — skipping confirmation email send.",
    );
    return { status: "skipped" as const };
  }

  const {
    eventTitle,
    eventDate,
    venue,
    buyerName,
    confirmationRef,
    unitPrice,
    discount,
    total,
    influencerName,
    paymentUrl,
    alreadyPaid,
    to,
  } = params;

  const discountRow = discount
    ? `<tr><td style="padding:6px 0; color:#555;">Discount${influencerName ? ` (thanks to ${escapeHtml(influencerName)})` : ""}</td><td style="padding:6px 0; font-weight:bold; text-align:right; color:#019245;">-${escapeHtml(discount)}</td></tr>`
    : "";

  const paymentCta = alreadyPaid
    ? `<p style="margin:20px 0 0; font-size:13px; color:#777;">No payment needed — you're all set.</p>`
    : paymentUrl
      ? `<p style="margin:20px 0 0; text-align:center;"><a href="${escapeHtml(paymentUrl)}" style="display:inline-block; background:#C0272F; color:#FFFFFF; font-weight:bold; text-decoration:none; padding:12px 24px; border-radius:999px;">Complete your payment</a></p>`
      : `<p style="margin:20px 0 0; font-size:13px; color:#777;">We'll email you the payment link as soon as it's ready.</p>`;

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; background:#FFF9F4; border:3px solid #111111; border-radius:12px; overflow:hidden;">
      <div style="background:#C0272F; color:#FFFFFF; padding:20px 24px;">
        <p style="margin:0; font-size:12px; letter-spacing:.12em; text-transform:uppercase; opacity:.85;">Swahili Komik Con</p>
        <h1 style="margin:6px 0 0; font-size:22px;">Almost there, ${escapeHtml(buyerName)}!</h1>
      </div>
      <div style="padding:24px;">
        <p style="margin:0 0 16px; color:#111111;">Your ticket order for:</p>
        <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
          <tr><td style="padding:6px 0; color:#555;">Event</td><td style="padding:6px 0; font-weight:bold; text-align:right;">${escapeHtml(eventTitle)}</td></tr>
          <tr><td style="padding:6px 0; color:#555;">Date</td><td style="padding:6px 0; font-weight:bold; text-align:right;">${escapeHtml(eventDate)}</td></tr>
          <tr><td style="padding:6px 0; color:#555;">Venue</td><td style="padding:6px 0; font-weight:bold; text-align:right;">${escapeHtml(venue)}</td></tr>
          <tr><td style="padding:6px 0; color:#555;">Ticket price</td><td style="padding:6px 0; font-weight:bold; text-align:right;">${escapeHtml(unitPrice)}</td></tr>
          ${discountRow}
          <tr><td style="padding:6px 0; color:#555;">Total due</td><td style="padding:6px 0; font-weight:bold; text-align:right;">${escapeHtml(total)}</td></tr>
        </table>
        <div style="background:#FFFFFF; border:2px dashed #111111; border-radius:8px; padding:14px; text-align:center; margin-bottom:20px;">
          <p style="margin:0; font-size:12px; letter-spacing:.1em; text-transform:uppercase; color:#555;">Confirmation reference</p>
          <p style="margin:4px 0 0; font-size:24px; font-weight:bold; color:#C0272F; letter-spacing:.08em;">${escapeHtml(confirmationRef)}</p>
        </div>
        ${paymentCta}
        <p style="margin:20px 0 0; font-size:13px; color:#777;">Keep this email as your reference. See you there — Your World of Comics, Gaming, Animation &amp; Cosplay.</p>
      </div>
    </div>
  `;

  const result = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `Your SKC ticket order: ${eventTitle} — ${confirmationRef}`,
    html,
  });

  if (result.error) {
    console.error("[resend] send failed", result.error);
    return { status: "failed" as const, error: result.error.message };
  }

  return { status: "sent" as const };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
