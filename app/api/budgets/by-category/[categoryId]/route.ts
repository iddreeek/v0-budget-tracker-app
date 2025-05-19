import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { categoryId: string } }) {
  try {
    const categoryId = params.categoryId
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0]

    // Find a budget for this category that covers the given date
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
      WHERE 
        b.category_id = $1 AND
        $2 BETWEEN b.start_date AND b.end_date
      GROUP BY b.id, c.id, c.name, b.amount, b.start_date, b.end_date
      LIMIT 1
    `

    const budget = await sql.query(query, [categoryId, date])

    if (budget.length === 0) {
      return NextResponse.json(null)
    }

    return NextResponse.json(budget[0])
  } catch (error) {
    console.error("Error finding budget by category:", error)
    return NextResponse.json({ message: "Failed to find budget", error: String(error) }, { status: 500 })
  }
}
