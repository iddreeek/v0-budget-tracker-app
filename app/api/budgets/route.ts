import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Default to current month if no date range is provided
    const defaultStartDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
    const defaultEndDate = new Date().toISOString().split("T")[0]

    const effectiveStartDate = startDate || defaultStartDate
    const effectiveEndDate = endDate || defaultEndDate

    // Get budgets that overlap with the selected date range
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
        t.date BETWEEN 
          GREATEST(b.start_date, $1) AND 
          LEAST(b.end_date, $2)
      WHERE 
        -- Get budgets that overlap with the selected date range
        (b.start_date <= $2 AND b.end_date >= $1)
      GROUP BY b.id, c.id, c.name, b.amount, b.start_date, b.end_date
      ORDER BY c.name
    `

    const budgets = await sql.query(query, [effectiveStartDate, effectiveEndDate])
    return NextResponse.json(budgets)
  } catch (error) {
    console.error("Error fetching budgets:", error)
    return NextResponse.json({ message: "Failed to fetch budgets", error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { category_id, amount, start_date, end_date } = await request.json()

    if (!category_id || !amount || !start_date || !end_date) {
      return NextResponse.json(
        {
          message: "Category ID, amount, start date, and end date are required",
        },
        { status: 400 },
      )
    }

    // Check if a budget already exists for this category and date range
    const existingBudget = await sql`
      SELECT * FROM budgets 
      WHERE 
        category_id = ${category_id} AND
        (
          (start_date <= ${end_date} AND end_date >= ${start_date})
        )
    `

    if (existingBudget.length > 0) {
      // Update existing budget
      const result = await sql`
        UPDATE budgets 
        SET 
          amount = ${amount},
          start_date = ${start_date},
          end_date = ${end_date}
        WHERE id = ${existingBudget[0].id}
        RETURNING *
      `
      return NextResponse.json(result[0])
    } else {
      // Create new budget
      const result = await sql`
        INSERT INTO budgets (category_id, amount, start_date, end_date) 
        VALUES (${category_id}, ${amount}, ${start_date}, ${end_date}) 
        RETURNING *
      `
      return NextResponse.json(result[0])
    }
  } catch (error) {
    console.error("Error creating/updating budget:", error)
    return NextResponse.json({ message: "Failed to create/update budget", error: String(error) }, { status: 500 })
  }
}
