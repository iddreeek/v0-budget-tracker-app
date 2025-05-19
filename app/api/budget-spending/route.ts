import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const budgetId = searchParams.get("budgetId")

    let query = `
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
      WHERE 1=1
    `

    const params: any[] = []
    let paramIndex = 1

    if (budgetId) {
      query += ` AND bs.budget_id = $${paramIndex}`
      params.push(Number.parseInt(budgetId))
      paramIndex++
    }

    query += " ORDER BY bs.created_at DESC"

    const spending = await sql.query(query, params)
    return NextResponse.json(spending)
  } catch (error) {
    console.error("Error fetching budget spending:", error)
    return NextResponse.json({ message: "Failed to fetch budget spending", error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { budget_id, transaction_id, amount } = await request.json()

    // Validate required fields
    if (!budget_id || !transaction_id || !amount) {
      return NextResponse.json({ message: "Budget ID, transaction ID, and amount are required" }, { status: 400 })
    }

    // Start a transaction
    await sql`BEGIN`

    try {
      // Check if the transaction exists and is an expense
      const transactionCheck = await sql`
        SELECT * FROM transactions WHERE id = ${transaction_id} AND type = 'expense'
      `

      if (transactionCheck.length === 0) {
        throw new Error("Transaction not found or is not an expense transaction")
      }

      // Check if the budget exists
      const budgetCheck = await sql`
        SELECT * FROM budgets WHERE id = ${budget_id}
      `

      if (budgetCheck.length === 0) {
        throw new Error("Budget not found")
      }

      // We'll allow exceeding the budget, but we'll log it
      const budgetRemaining = await sql`
        SELECT 
          b.amount as budget,
          COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as spent,
          b.amount - COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as remaining
        FROM budgets b
        LEFT JOIN transactions t ON 
          t.category_id = b.category_id AND 
          t.type = 'expense' AND 
          t.date BETWEEN b.start_date AND b.end_date
        WHERE b.id = ${budget_id}
        GROUP BY b.id, b.amount
      `

      // Create the budget spending record
      const spending = await sql`
        INSERT INTO budget_spending (budget_id, transaction_id, amount, created_at)
        VALUES (${budget_id}, ${transaction_id}, ${amount}, NOW())
        RETURNING *
      `

      // Commit the transaction
      await sql`COMMIT`

      return NextResponse.json(spending[0])
    } catch (error) {
      // Rollback the transaction in case of error
      await sql`ROLLBACK`
      throw error
    }
  } catch (error) {
    console.error("Error creating budget spending:", error)
    return NextResponse.json({ message: "Failed to create budget spending", error: String(error) }, { status: 500 })
  }
}
