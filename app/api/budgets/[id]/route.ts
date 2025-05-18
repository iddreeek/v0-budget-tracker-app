import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const query = `
      SELECT 
        b.id, 
        b.amount as budget, 
        c.id as category_id, 
        c.name as category,
        b.start_date,
        b.end_date,
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as spent,
        b.amount - COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as remaining,
        CASE 
          WHEN b.amount = 0 THEN 0
          ELSE ROUND((COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) / b.amount) * 100)
        END as percentage
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      LEFT JOIN transactions t ON 
        t.category_id = c.id AND 
        t.type = 'expense' AND 
        t.date BETWEEN b.start_date AND b.end_date
      WHERE b.id = $1
      GROUP BY b.id, c.id, c.name, b.amount, b.start_date, b.end_date
    `

    const result = await sql.query(query, [id])

    if (result.length === 0) {
      return NextResponse.json({ message: "Budget not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error fetching budget:", error)
    return NextResponse.json({ message: "Failed to fetch budget", error: String(error) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const { amount, start_date, end_date } = await request.json()

    if (!amount || !start_date || !end_date) {
      return NextResponse.json(
        {
          message: "Amount, start date, and end date are required",
        },
        { status: 400 },
      )
    }

    const result = await sql`
      UPDATE budgets 
      SET 
        amount = ${amount},
        start_date = ${start_date},
        end_date = ${end_date}
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ message: "Budget not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating budget:", error)
    return NextResponse.json({ message: "Failed to update budget", error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const result = await sql`DELETE FROM budgets WHERE id = ${id} RETURNING *`

    if (result.length === 0) {
      return NextResponse.json({ message: "Budget not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Budget deleted successfully" })
  } catch (error) {
    console.error("Error deleting budget:", error)
    return NextResponse.json({ message: "Failed to delete budget", error: String(error) }, { status: 500 })
  }
}
