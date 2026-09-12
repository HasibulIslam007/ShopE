import crypto from "crypto";

const sandbox = process.env.SSLCOMMERZ_IS_LIVE !== "true";
export const sslBaseUrl = sandbox ? "https://sandbox.sslcommerz.com" : "https://securepay.sslcommerz.com";

export function sslConfigured() {
  return Boolean(process.env.SSLCOMMERZ_STORE_ID && process.env.SSLCOMMERZ_STORE_PASSWORD);
}

/**
 * Verify SSLCommerz's response signature when the store has "hash/verify"
 * enabled. SSLCommerz posts `verify_sign` + `verify_key` (a comma-separated
 * list of param names in signature order); the signature is:
 *
 *   SHA512(store_passwd + values of the verify_key params, in that order)
 *
 * Returns true when no signature is present (the val_id validator call below
 * remains the primary verification), so stores without hash enabled are
 * unaffected — but when a signature IS present it MUST be valid.
 */
export function verifySslSignature(params: URLSearchParams | Record<string, string>): boolean {
  const storePass = process.env.SSLCOMMERZ_STORE_PASSWORD ?? "";
  const get = (k: string) => (params instanceof URLSearchParams ? params.get(k) : params[k]);
  const verifySign = get("verify_sign");
  const verifyKey = get("verify_key");
  if (!verifySign || !verifyKey) return true;
  if (!storePass) return false;

  const keyNames = verifyKey.split(",").map((k) => k.trim()).filter(Boolean);
  const payload = storePass + keyNames.map((k) => get(k) ?? "").join("");
  const expected = crypto.createHash("sha512").update(payload, "utf8").digest("hex");
  return expected.toLowerCase() === verifySign.toLowerCase();
}

export async function initializeSslPayment(fields: Record<string, string>) {
  const body = new URLSearchParams({
    store_id: process.env.SSLCOMMERZ_STORE_ID ?? "",
    store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD ?? "",
    format: "json", ...fields,
  });
  const response = await fetch(`${sslBaseUrl}/gwprocess/v4/api.php`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body,
  });
  if (!response.ok) throw new Error("SSLCOMMERZ initialization failed");
  return response.json() as Promise<{ status?: string; GatewayPageURL?: string; failedreason?: string }>;
}

export async function validateSslPayment(valId: string) {
  const query = new URLSearchParams({
    val_id: valId, store_id: process.env.SSLCOMMERZ_STORE_ID ?? "",
    store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD ?? "", format: "json",
  });
  const response = await fetch(`${sslBaseUrl}/validator/api/validationserverAPI.php?${query}`);
  if (!response.ok) throw new Error("SSLCOMMERZ validation failed");
  return response.json() as Promise<{ status?: string; tran_id?: string; amount?: string; currency?: string; bank_tran_id?: string; risk_level?: string }>;
}