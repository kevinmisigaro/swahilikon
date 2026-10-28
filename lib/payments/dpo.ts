import "server-only";

// DPO Pay (3G Direct Pay) API v6 — https://docs.dpopay.com/dpo-pay-by-network/reference/quick-start-guide
// Flat XML-over-HTTP API: createToken starts an order, the buyer pays on
// DPO's hosted page, DPO calls our BackURL (see app/api/payments/dpo/callback)
// and the buyer's browser is sent to our RedirectURL (see
// app/(site)/tickets/confirm). verifyToken is the authoritative status check —
// DPO's push payload isn't signed, so callers of this module should always
// re-verify with DPO rather than trust a claimed status from elsewhere.

const API_URL = process.env.DPO_API_URL ?? "https://secure.3gdirectpay.com/API/v6/";
const PAYMENT_PAGE_URL =
  process.env.DPO_PAYMENT_PAGE_URL ?? "https://secure.3gdirectpay.com/pay.asp";

export function isDpoConfigured() {
  return Boolean(process.env.DPO_COMPANY_TOKEN && process.env.DPO_SERVICE_TYPE);
}

function getConfig() {
  const companyToken = process.env.DPO_COMPANY_TOKEN;
  const serviceType = process.env.DPO_SERVICE_TYPE;
  if (!companyToken || !serviceType) {
    throw new Error("DPO Pay is not configured (DPO_COMPANY_TOKEN / DPO_SERVICE_TYPE missing).");
  }
  return { companyToken, serviceType };
}

export class DpoError extends Error {
  code: string | null;
  constructor(code: string | null, message: string) {
    super(message);
    this.name = "DpoError";
    this.code = code;
  }
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function tag(name: string, value: string | number | undefined | null) {
  if (value === undefined || value === null || value === "") return "";
  return `<${name}>${escapeXml(String(value))}</${name}>`;
}

/** DPO's responses are flat (no repeated siblings for the fields we read), so a small per-tag regex is enough — no XML parser dependency needed. */
function extractTag(xml: string, name: string): string | null {
  const match = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return match ? match[1].trim() : null;
}

async function postXml(xml: string): Promise<string> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/xml; charset=utf-8", Accept: "application/xml" },
    body: xml,
  });
  return res.text();
}

function formatServiceDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export interface CreatePaymentTokenParams {
  amountCents: number;
  currency: string;
  companyRef: string;
  description: string;
  redirectUrl: string;
  backUrl: string;
  customerName: string;
  customerEmail: string;
}

export interface CreatePaymentTokenResult {
  transToken: string;
  transRef: string;
}

/** Starts a DPO transaction and returns the token used to build the hosted payment page URL. Throws DpoError on anything other than Result 000. */
export async function createPaymentToken(
  params: CreatePaymentTokenParams,
): Promise<CreatePaymentTokenResult> {
  const { companyToken, serviceType } = getConfig();
  const [firstName, ...rest] = params.customerName.trim().split(/\s+/);
  const lastName = rest.join(" ") || firstName;
  const amount = (params.amountCents / 100).toFixed(2);

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
${tag("CompanyToken", companyToken)}
<Request>createToken</Request>
<Transaction>
${tag("PaymentAmount", amount)}
${tag("PaymentCurrency", params.currency)}
${tag("CompanyRef", params.companyRef)}
${tag("RedirectURL", params.redirectUrl)}
${tag("BackURL", params.backUrl)}
${tag("customerFirstName", firstName)}
${tag("customerLastName", lastName)}
${tag("customerEmail", params.customerEmail)}
</Transaction>
<Services>
<Service>
${tag("ServiceType", serviceType)}
${tag("ServiceDescription", params.description)}
${tag("ServiceDate", formatServiceDate(new Date()))}
</Service>
</Services>
</API3G>`;

  const responseXml = await postXml(xml);
  const result = extractTag(responseXml, "Result");
  const explanation = extractTag(responseXml, "ResultExplanation") ?? "Unknown DPO error";

  if (result !== "000") {
    throw new DpoError(result, explanation);
  }

  const transToken = extractTag(responseXml, "TransToken");
  const transRef = extractTag(responseXml, "TransRef");
  if (!transToken || !transRef) {
    throw new DpoError(result, "DPO did not return a transaction token.");
  }

  return { transToken, transRef };
}

export function getPaymentPageUrl(transToken: string) {
  return `${PAYMENT_PAGE_URL}?ID=${encodeURIComponent(transToken)}`;
}

export type VerifiedPaymentStatus = "paid" | "pending" | "failed" | "cancelled";

export interface VerifyPaymentResult {
  status: VerifiedPaymentStatus;
  resultCode: string | null;
  resultExplanation: string;
}

// https://docs.dpopay.com/dpo-pay-by-network/reference/verify-token-response-codes
const PENDING_CODES = new Set(["001", "002", "003", "005", "007", "900"]);
const CANCELLED_CODES = new Set(["904"]);

/** The authoritative status check — call this instead of trusting a pushPayments payload. */
export async function verifyPayment(transToken: string): Promise<VerifyPaymentResult> {
  const { companyToken } = getConfig();

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
${tag("CompanyToken", companyToken)}
<Request>verifyToken</Request>
${tag("TransactionToken", transToken)}
</API3G>`;

  const responseXml = await postXml(xml);
  const resultCode = extractTag(responseXml, "Result");
  const resultExplanation = extractTag(responseXml, "ResultExplanation") ?? "Unknown DPO response";

  let status: VerifiedPaymentStatus;
  if (resultCode === "000") status = "paid";
  else if (resultCode && PENDING_CODES.has(resultCode)) status = "pending";
  else if (resultCode && CANCELLED_CODES.has(resultCode)) status = "cancelled";
  else status = "failed";

  return { status, resultCode, resultExplanation };
}

// Direct mobile money charge (ChargeTokenMobile) — pushes a PIN prompt to the
// buyer's phone instead of sending them to DPO's hosted page. Confirmed live
// against DPO's sandbox (2026-10-21): ChargeTokenMobile's *error* responses use
// <Result>/<ResultExplanation> (e.g. 954 missing PhoneNumber, 955 invalid
// PhoneNumber), but a *successful* push uses a different, undocumented shape —
// <StatusCode>130</StatusCode><ResultExplanation>New invoice</ResultExplanation>
// <instructions>...</instructions><RedirectOption>1</RedirectOption> — so
// success can't be detected by checking Result like every other DPO call.
// The charge itself only confirms the push was sent; verifyPayment (polling or
// the BackURL webhook) is still what confirms the customer actually paid.

export type TanzaniaMobileNetwork = "mpesa" | "airtel_money" | "halopesa" | "mixx_by_yas";

export const TANZANIA_MOBILE_NETWORKS: { id: TanzaniaMobileNetwork; label: string }[] = [
  { id: "mpesa", label: "M-Pesa" },
  { id: "airtel_money", label: "Airtel Money" },
  { id: "halopesa", label: "HaloPesa" },
  { id: "mixx_by_yas", label: "Mixx by Yas" },
];

// MNO codes observed from a live CompanyMobilePaymentOptions call against a
// DPO Tanzania-enabled sandbox account: TIGOdebitMandate, Selcom_webPay_Airtel,
// Selcom_webPay_Halotel, Selcom_webPay_TTCL, Selcom_webPay_Zantel, and one
// unsuffixed Selcom_webPay. Airtel/Halotel/Zantel/TTCL all got an explicit
// suffix; Vodacom (M-Pesa) is the one major Tanzania network with no named
// entry, which is why the unsuffixed code is mapped to it here — that's an
// inference, not a confirmed mapping (DPO's response never names it as
// "Vodacom" or "Mpesa").
//
// Live-tested against the DPO test account (2026-10-28, ChargeTokenMobile
// with carrier-correct MSISDN prefixes): mixx_by_yas and airtel_money both
// push successfully (StatusCode 130). mpesa and halopesa both come back
// <Result>956</Result> "Terminal not found" — those two networks aren't
// provisioned on this merchant account yet (not a code bug). Ask DPO support
// to enable Vodacom M-Pesa and HaloPesa mobile money on the account, and
// reconfirm the mpesa code (unsuffixed Selcom_webPay was a guess) once they
// do — correct via DPO_MNO_MPESA / DPO_MNO_HALOPESA if needed.
const TANZANIA_MNO_CODES: Record<TanzaniaMobileNetwork, string> = {
  mixx_by_yas: process.env.DPO_MNO_MIXX_BY_YAS ?? "TIGOdebitMandate",
  airtel_money: process.env.DPO_MNO_AIRTEL_MONEY ?? "Selcom_webPay_Airtel",
  halopesa: process.env.DPO_MNO_HALOPESA ?? "Selcom_webPay_Halotel",
  mpesa: process.env.DPO_MNO_MPESA ?? "Selcom_webPay",
};

/** Normalizes a Tanzanian mobile number (0712345678, +255712345678, 255712345678, 712345678) to the 255-prefixed MSISDN form DPO expects. Returns null if it doesn't look like one. */
export function normalizeTanzaniaPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("255") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `255${digits.slice(1)}`;
  if (digits.length === 9) return `255${digits}`;
  return null;
}

export interface ChargeMobileMoneyResult {
  instructions: string;
}

/** Sends a mobile money PIN prompt to the buyer's phone. Resolving doesn't mean paid — it means DPO accepted the push request. Poll verifyPayment (or wait for the webhook) for the real outcome. */
export async function chargeMobileMoney(params: {
  transToken: string;
  phoneNumber: string;
  network: TanzaniaMobileNetwork;
}): Promise<ChargeMobileMoneyResult> {
  const { companyToken } = getConfig();
  const mno = TANZANIA_MNO_CODES[params.network];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<API3G>
${tag("CompanyToken", companyToken)}
<Request>ChargeTokenMobile</Request>
${tag("TransactionToken", params.transToken)}
${tag("PhoneNumber", params.phoneNumber)}
${tag("MNO", mno)}
${tag("MNOcountry", "Tanzania")}
</API3G>`;

  const responseXml = await postXml(xml);
  const statusCode = extractTag(responseXml, "StatusCode");
  const explanation = extractTag(responseXml, "ResultExplanation") ?? "Unknown DPO response";

  if (!statusCode) {
    // No StatusCode means the request was rejected outright (bad phone number,
    // unrecognized MNO, etc.) — these responses use Result, not StatusCode.
    throw new DpoError(extractTag(responseXml, "Result"), explanation);
  }

  const instructions = (extractTag(responseXml, "instructions") ?? explanation).replace(
    /<br\s*\/?>/gi,
    "\n",
  );

  return { instructions };
}
