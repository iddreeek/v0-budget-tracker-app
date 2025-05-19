import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const result = await sql`
      SELECT 
        ba.id, 
        ba.budget_id, 
        ba.transaction_id, 
        ba.amount, 
        ba.created_at,
        b.category_id,
        c.name as category_name,
        t.description as transaction_description,
        t.date as transaction_date
      FROM budget_allocations ba
      JOIN budgets b ON ba.budget_id = b.id
      JOIN categories c ON b.category_id = c.id
      JOIN transactions t ON ba.transaction_id = t.id
      WHERE ba.id = ${id}
    `

    if (result.length === 0) {
      return NextResponse.json({ message: "Budget allocation not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error fetching budget allocation:", error)
    return NextResponse.json({ message: "Failed to fetch budget allocation", error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const result = await sql`DELETE FROM budget_allocations WHERE id = ${id} RETURNING *`

    if (result.length === 0) {
      return NextResponse.json({ message: "Budget allocation not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Budget allocation deleted successfully" })
  } catch (error) {
    console.error("Error deleting budget allocation:", error)
    return NextResponse.json({ message: "Failed to delete budget allocation", error: String(error) }, { status: 500 })
  }
}
