import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const result = await sql`
      SELECT 
        bs.id, 
        bs.budget_id, 
        bs.transaction_id, 
        bs.amount, 
        bs.created_at,
        b.category_id,
        c.name as category_name,
        t.description as transaction_description,
        t.date as transaction_date
      FROM budget_spending bs
      JOIN budgets b ON bs.budget_id = b.id
      JOIN categories c ON b.category_id = c.id
      JOIN transactions t ON bs.transaction_id = t.id
      WHERE bs.id = ${id}
    `

    if (result.length === 0) {
      return NextResponse.json({ message: "Budget spending not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error fetching budget spending:", error)
    return NextResponse.json({ message: "Failed to fetch budget spending", error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Start a transaction
    await sql`BEGIN`

    try {
      // Get the spending record to find the associated transaction
      const spendingRecord = await sql`
        SELECT * FROM budget_spending WHERE id = ${id}
      `

      if (spendingRecord.length === 0) {
        return NextResponse.json({ message: "Budget spending not found" }, { status: 404 })
      }

      // Delete the spending record
      await sql`DELETE FROM budget_spending WHERE id = ${id}`

      // Delete the associated transaction
      await sql`DELETE FROM transactions WHERE id = ${spendingRecord[0].transaction_id}`

      // Commit the transaction
      await sql`COMMIT`

      return NextResponse.json({ message: "Budget spending deleted successfully" })
    } catch (error) {
      // Rollback the transaction in case of error
      await sql`ROLLBACK`
      throw error
    }
  } catch (error) {
    console.error("Error deleting budget spending:", error)
    return NextResponse.json({ message: "Failed to delete budget spending", error: String(error) }, { status: 500 })
  }
}
