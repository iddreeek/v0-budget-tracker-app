import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { transactionId: string } }) {
  try {
    const transactionId = params.transactionId

    const result = await sql`
      SELECT * FROM budget_spending
      WHERE transaction_id = ${transactionId}
      LIMIT 1
    `

    if (result.length === 0) {
      return NextResponse.json(null)
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error finding budget spending by transaction:", error)
    return NextResponse.json({ message: "Failed to find budget spending", error: String(error) }, { status: 500 })
  }
}
