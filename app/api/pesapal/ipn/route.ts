import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { pesapalClient } from "@/lib/pesapal/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderTrackingId = searchParams.get("OrderTrackingId")
    const merchantReference = searchParams.get("OrderMerchantReference")

    if (!orderTrackingId || !merchantReference) {
      return new NextResponse("Missing parameters", { status: 400 })
    }

    const supabase = await getSupabaseServerClient()

    // Get transaction
    const { data: transaction } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("merchant_reference", merchantReference)
      .single()

    if (!transaction) {
      return new NextResponse("Transaction not found", { status: 404 })
    }

    // Get payment status from Pesapal
    const status = await pesapalClient.getTransactionStatus(orderTrackingId)

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

    // Return the expected response format
    return new NextResponse(
      JSON.stringify({
        orderTrackingId,
        merchantReference,
        status: paymentStatus,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error: any) {
    console.error("[v0] Pesapal IPN error:", error)
    return new NextResponse("IPN processing failed", { status: 500 })
  }
}
