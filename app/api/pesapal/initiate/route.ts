import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { pesapalClient } from "@/lib/pesapal/client"
import { PESAPAL_CONFIG } from "@/lib/pesapal/config"

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orderId, appointmentId, amount, description } = await request.json()

    if (!orderId && !appointmentId) {
      return NextResponse.json({ error: "Order ID or Appointment ID required" }, { status: 400 })
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    // Get user details
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("email, full_name, phone")
      .eq("id", user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Register IPN if not already registered
    const ipnId = await pesapalClient.registerIPN()

    // Generate unique merchant reference
    const merchantReference = `${orderId || appointmentId}-${Date.now()}`

    // Create payment transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from("payment_transactions")
      .insert({
        order_id: orderId || null,
        appointment_id: appointmentId || null,
        merchant_reference: merchantReference,
        amount,
        currency: "KES",
        payment_status: "pending",
        callback_url: PESAPAL_CONFIG.callbackUrl,
        ipn_id: ipnId,
      })
      .select()
      .single()

    if (transactionError) {
      console.error("[v0] Transaction creation error:", transactionError)
      return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
    }

    // Split full name
    const nameParts = userData.full_name?.split(" ") || ["", ""]
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || ""

    // Submit order to Pesapal
    const pesapalResponse = await pesapalClient.submitOrder({
      id: merchantReference,
      currency: "KES",
      amount,
      description: description || "Payment for order",
      callback_url: `${PESAPAL_CONFIG.callbackUrl}?merchant_reference=${merchantReference}`,
      notification_id: ipnId,
      billing_address: {
        email_address: userData.email,
        phone_number: userData.phone || undefined,
        first_name: firstName,
        last_name: lastName,
        country_code: "KE",
      },
    })

    // Update transaction with Pesapal tracking ID
    await supabase
      .from("payment_transactions")
      .update({
        pesapal_tracking_id: pesapalResponse.order_tracking_id,
        pesapal_response: pesapalResponse,
      })
      .eq("id", transaction.id)

    return NextResponse.json({
      success: true,
      redirect_url: pesapalResponse.redirect_url,
      merchant_reference: merchantReference,
      tracking_id: pesapalResponse.order_tracking_id,
    })
  } catch (error: any) {
    console.error("[v0] Pesapal initiation error:", error)
    return NextResponse.json({ error: error.message || "Payment initiation failed" }, { status: 500 })
  }
}
