import { PESAPAL_CONFIG, PESAPAL_ENDPOINTS } from "./config"

interface PesapalAuthResponse {
  token: string
  expiryDate: string
  error?: string
  message?: string
}

interface PesapalIPNResponse {
  url: string
  ipn_id: string
  error?: string
  message?: string
}

interface PesapalOrderRequest {
  id: string
  currency: string
  amount: number
  description: string
  callback_url: string
  notification_id: string
  billing_address: {
    email_address: string
    phone_number?: string
    country_code?: string
    first_name?: string
    middle_name?: string
    last_name?: string
    line_1?: string
    line_2?: string
    city?: string
    state?: string
    postal_code?: string
    zip_code?: string
  }
}

interface PesapalOrderResponse {
  order_tracking_id: string
  merchant_reference: string
  redirect_url: string
  error?: string
  message?: string
  status?: string
}

interface PesapalTransactionStatus {
  payment_method: string
  amount: number
  created_date: string
  confirmation_code: string
  payment_status_description: string
  description: string
  message: string
  payment_account: string
  call_back_url: string
  status_code: number
  merchant_reference: string
  payment_status_code: string
  currency: string
  error?: string
}

class PesapalClient {
  private token: string | null = null
  private tokenExpiry: Date | null = null
  private ipnId: string | null = null

  async getAuthToken(): Promise<string> {
    // Return cached token if still valid
    if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.token
    }

    const response = await fetch(PESAPAL_ENDPOINTS.auth, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        consumer_key: PESAPAL_CONFIG.consumerKey,
        consumer_secret: PESAPAL_CONFIG.consumerSecret,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Pesapal auth failed: ${error}`)
    }

    const data: PesapalAuthResponse = await response.json()

    if (data.error) {
      throw new Error(`Pesapal auth error: ${data.message || data.error}`)
    }

    this.token = data.token
    this.tokenExpiry = new Date(data.expiryDate)

    return this.token
  }

  async registerIPN(): Promise<string> {
    // Return cached IPN ID if available
    if (this.ipnId) {
      return this.ipnId
    }

    const token = await this.getAuthToken()

    const response = await fetch(PESAPAL_ENDPOINTS.registerIPN, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        url: PESAPAL_CONFIG.ipnUrl,
        ipn_notification_type: "GET",
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Pesapal IPN registration failed: ${error}`)
    }

    const data: PesapalIPNResponse = await response.json()

    if (data.error) {
      throw new Error(`Pesapal IPN error: ${data.message || data.error}`)
    }

    this.ipnId = data.ipn_id

    return this.ipnId
  }

  async submitOrder(orderData: PesapalOrderRequest): Promise<PesapalOrderResponse> {
    const token = await this.getAuthToken()

    const response = await fetch(PESAPAL_ENDPOINTS.submitOrder, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Pesapal order submission failed: ${error}`)
    }

    const data: PesapalOrderResponse = await response.json()

    if (data.error || data.status === "500") {
      throw new Error(`Pesapal order error: ${data.message || data.error}`)
    }

    return data
  }

  async getTransactionStatus(orderTrackingId: string): Promise<PesapalTransactionStatus> {
    const token = await this.getAuthToken()

    const response = await fetch(`${PESAPAL_ENDPOINTS.getTransactionStatus}?orderTrackingId=${orderTrackingId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Pesapal status check failed: ${error}`)
    }

    const data: PesapalTransactionStatus = await response.json()

    if (data.error) {
      throw new Error(`Pesapal status error: ${data.error}`)
    }

    return data
  }
}

export const pesapalClient = new PesapalClient()
