import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const categories = await sql`SELECT * FROM categories ORDER BY name`
    console.log("Categories fetched:", categories)
    return NextResponse.json(categories)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ message: "Failed to fetch categories", error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json()

    if (!name) {
      return NextResponse.json({ message: "Category name is required" }, { status: 400 })
    }

    const result = await sql`INSERT INTO categories (name) VALUES (${name}) RETURNING *`

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating category:", error)
    return NextResponse.json({ message: "Failed to create category", error: String(error) }, { status: 500 })
  }
}
