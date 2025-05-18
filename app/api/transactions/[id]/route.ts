import { executeQuery } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const result = await executeQuery(
      `SELECT t.*, c.name as category_name 
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = $1`,
      [id],
    )

    if (result.length === 0) {
      return NextResponse.json({ message: "Transaction not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error fetching transaction:", error)
    return NextResponse.json({ message: "Failed to fetch transaction", error: String(error) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const { date, description, amount, type, category_id, notes } = await request.json()

    // Validate required fields
    if (!date || !description || !amount || !type || !category_id) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const result = await executeQuery(
      `UPDATE transactions 
       SET date = $1, description = $2, amount = $3, type = $4, category_id = $5, notes = $6
       WHERE id = $7
       RETURNING *`,
      [date, description, amount, type, category_id, notes, id],
    )

    if (result.length === 0) {
      return NextResponse.json({ message: "Transaction not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating transaction:", error)
    return NextResponse.json({ message: "Failed to update transaction", error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const result = await executeQuery("DELETE FROM transactions WHERE id = $1 RETURNING *", [id])

    if (result.length === 0) {
      return NextResponse.json({ message: "Transaction not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Transaction deleted successfully" })
  } catch (error) {
    console.error("Error deleting transaction:", error)
    return NextResponse.json({ message: "Failed to delete transaction", error: String(error) }, { status: 500 })
  }
}
