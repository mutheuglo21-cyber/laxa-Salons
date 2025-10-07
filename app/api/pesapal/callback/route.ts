import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { pesapalClient } from "@/lib/pesapal/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantReference = searchParams.get("merchant_reference")
    const orderTrackingId = searchParams.get("OrderTrackingId")

    if (!merchantReference) {
      return NextResponse.redirect(new URL("/checkout?error=invalid_reference", request.url))
    }

    const supabase = await getSupabaseServerClient()

    // Get transaction
    const { data: transaction, error: transactionError } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("merchant_reference", merchantReference)
      .single()

    if (transactionError || !transaction) {
      return NextResponse.redirect(new URL("/checkout?error=transaction_not_found", request.url))
    }

    // Get payment status from Pesapal
    const trackingId = orderTrackingId || transaction.pesapal_tracking_id
    if (!trackingId) {
      return NextResponse.redirect(new URL("/checkout?error=no_tracking_id", request.url))
    }

    const status = await pesapalClient.getTransactionStatus(trackingId)

    // Update transaction status
    const paymentStatus =
      status.payment_status_code === "1" ? "completed" : status.payment_status_code === "2" ? "failed" : "pending"

    await supabase
      .from("payment_transactions")
      .update({
        payment_status: paymentStatus,
        payment_method: status.payment_method,
        pesapal_response: status,
      })
      .eq("id", transaction.id)

    // Redirect based on status
    if (paymentStatus === "completed") {
      if (transaction.order_id) {
        return NextResponse.redirect(new URL(`/orders/${transaction.order_id}?payment=success`, request.url))
      } else if (transaction.appointment_id) {
        return NextResponse.redirect(
          new URL(`/appointments/${transaction.appointment_id}?payment=success`, request.url),
        )
      }
    } else if (paymentStatus === "failed") {
      return NextResponse.redirect(new URL("/checkout?payment=failed", request.url))
    }

    // Still pending
    return NextResponse.redirect(new URL("/checkout?payment=pending", request.url))
  } catch (error: any) {
    console.error("[v0] Pesapal callback error:", error)
    return NextResponse.redirect(new URL("/checkout?error=callback_failed", request.url))
  }
}
