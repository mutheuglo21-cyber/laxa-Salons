export const PESAPAL_CONFIG = {
  consumerKey: process.env.PESAPAL_CONSUMER_KEY!,
  consumerSecret: process.env.PESAPAL_CONSUMER_SECRET!,
  environment: process.env.NEXT_PUBLIC_PESAPAL_ENVIRONMENT || "sandbox",
  callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/pesapal/callback`,
  ipnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/pesapal/ipn`,
} as const

export const PESAPAL_API_URL =
  PESAPAL_CONFIG.environment === "live" ? "https://pay.pesapal.com/v3" : "https://cybqa.pesapal.com/pesapalv3"

export const PESAPAL_ENDPOINTS = {
  auth: `${PESAPAL_API_URL}/api/Auth/RequestToken`,
  registerIPN: `${PESAPAL_API_URL}/api/URLSetup/RegisterIPN`,
  submitOrder: `${PESAPAL_API_URL}/api/Transactions/SubmitOrderRequest`,
  getTransactionStatus: `${PESAPAL_API_URL}/api/Transactions/GetTransactionStatus`,
} as const
