const sandbox = process.env.SSLCOMMERZ_IS_LIVE !== "true";
export const sslBaseUrl = sandbox ? "https://sandbox.sslcommerz.com" : "https://securepay.sslcommerz.com";

export function sslConfigured() {
  return Boolean(process.env.SSLCOMMERZ_STORE_ID && process.env.SSLCOMMERZ_STORE_PASSWORD);
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