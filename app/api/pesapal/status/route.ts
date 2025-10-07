import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { pesapalClient } from "@/lib/pesapal/client"

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const merchantReference = searchParams.get("merchant_reference")
    const trackingId = searchParams.get("tracking_id")

    if (!merchantReference && !trackingId) {
      return NextResponse.json({ error: "Merchant reference or tracking ID required" }, { status: 400 })
    }

    // Get transaction from database
    let query = supabase.from("payment_transactions").select("*")

    if (merchantReference) {
      query = query.eq("merchant_reference", merchantReference)
    } else if (trackingId) {
      query = query.eq("pesapal_tracking_id", trackingId)
    }

    const { data: transaction, error: transactionError } = await query.single()

    if (transactionError || !transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // If transaction is already completed or failed, return cached status
    if (transaction.payment_status === "completed" || transaction.payment_status === "failed") {
      return NextResponse.json({
        status: transaction.payment_status,
        payment_method: transaction.payment_method,
        amount: transaction.amount,
        currency: transaction.currency,
        completed_at: transaction.completed_at,
      })
    }

    // Otherwise, check with Pesapal
    if (transaction.pesapal_tracking_id) {
      const status = await pesapalClient.getTransactionStatus(transaction.pesapal_tracking_id)

      const paymentStatus =
        status.payment_status_code === "1" ? "completed" : status.payment_status_code === "2" ? "failed" : "pending"

      // Update if status changed
      if (paymentStatus !== transaction.payment_status) {
        await supabase
          .from("payment_transactions")
          .update({
            payment_status: paymentStatus,
            payment_method: status.payment_method,
            pesapal_response: status,
          })
          .eq("id", transaction.id)
      }

      return NextResponse.json({
        status: paymentStatus,
        payment_method: status.payment_method,
        amount: status.amount,
        currency: status.currency,
        description: status.description,
      })
    }

    return NextResponse.json({
      status: transaction.payment_status,
      amount: transaction.amount,
      currency: transaction.currency,
    })
  } catch (error: any) {
    console.error("[v0] Payment status check error:", error)
    return NextResponse.json({ error: error.message || "Status check failed" }, { status: 500 })
  }
}
