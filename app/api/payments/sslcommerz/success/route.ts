import { completePayment } from "@/app/api/payments/sslcommerz/complete";
export async function POST(request: Request) { return completePayment(request, "success"); }
export async function GET(request: Request) { return completePayment(request, "success"); }