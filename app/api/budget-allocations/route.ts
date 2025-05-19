import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const budgetId = searchParams.get("budgetId")

    let query = `
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
      WHERE 1=1
    `

    const params: any[] = []
    let paramIndex = 1

    if (budgetId) {
      query += ` AND ba.budget_id = $${paramIndex}`
      params.push(Number.parseInt(budgetId))
      paramIndex++
    }

    query += " ORDER BY ba.created_at DESC"

    const allocations = await sql.query(query, params)
    return NextResponse.json(allocations)
  } catch (error) {
    console.error("Error fetching budget allocations:", error)
    return NextResponse.json({ message: "Failed to fetch budget allocations", error: String(error) }, { status: 500 })
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
      // Check if the transaction exists and is an income
      const transactionCheck = await sql`
        SELECT * FROM transactions WHERE id = ${transaction_id} AND type = 'income'
      `

      if (transactionCheck.length === 0) {
        throw new Error("Transaction not found or is not an income transaction")
      }

      // Check if the budget exists
      const budgetCheck = await sql`
        SELECT * FROM budgets WHERE id = ${budget_id}
      `

      if (budgetCheck.length === 0) {
        throw new Error("Budget not found")
      }

      // Check if the transaction amount is sufficient
      if (transactionCheck[0].amount < amount) {
        throw new Error("Insufficient transaction amount")
      }

      // Create the budget allocation
      const allocation = await sql`
        INSERT INTO budget_allocations (budget_id, transaction_id, amount, created_at)
        VALUES (${budget_id}, ${transaction_id}, ${amount}, NOW())
        RETURNING *
      `

      // Commit the transaction
      await sql`COMMIT`

      return NextResponse.json(allocation[0])
    } catch (error) {
      // Rollback the transaction in case of error
      await sql`ROLLBACK`
      throw error
    }
  } catch (error) {
    console.error("Error creating budget allocation:", error)
    return NextResponse.json({ message: "Failed to create budget allocation", error: String(error) }, { status: 500 })
  }
}
