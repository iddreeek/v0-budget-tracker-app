import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type")
    const categoryId = searchParams.get("categoryId")
    const minAmount = searchParams.get("minAmount")
    const maxAmount = searchParams.get("maxAmount")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    let query = `
      SELECT t.*, c.name as category_name 
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE 1=1
    `

    const params: any[] = []
    let paramIndex = 1

    if (type && type !== "all") {
      query += ` AND t.type = $${paramIndex}`
      params.push(type)
      paramIndex++
    }

    if (categoryId && categoryId !== "all") {
      query += ` AND t.category_id = $${paramIndex}`
      params.push(Number.parseInt(categoryId))
      paramIndex++
    }

    if (minAmount) {
      query += ` AND t.amount >= $${paramIndex}`
      params.push(Number.parseFloat(minAmount))
      paramIndex++
    }

    if (maxAmount) {
      query += ` AND t.amount <= $${paramIndex}`
      params.push(Number.parseFloat(maxAmount))
      paramIndex++
    }

    if (startDate) {
      query += ` AND t.date >= $${paramIndex}`
      params.push(startDate)
      paramIndex++
    }

    if (endDate) {
      query += ` AND t.date <= $${paramIndex}`
      params.push(endDate)
      paramIndex++
    }

    query += " ORDER BY t.date DESC"

    const transactions = await sql.query(query, params)
    return NextResponse.json(transactions)
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json({ message: "Failed to fetch transactions", error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { date, description, amount, type, category_id, notes } = await request.json()

    // Validate required fields
    if (!date || !description || !amount || !type || !category_id) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO transactions (date, description, amount, type, category_id, notes)
      VALUES (${date}, ${description}, ${amount}, ${type}, ${category_id}, ${notes})
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating transaction:", error)
    return NextResponse.json({ message: "Failed to create transaction", error: String(error) }, { status: 500 })
  }
}
