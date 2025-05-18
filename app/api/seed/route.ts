import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

const categories = [
  "Housing",
  "Food",
  "Transportation",
  "Entertainment",
  "Utilities",
  "Healthcare",
  "Shopping",
  "Education",
  "Salary",
  "Investments",
  "Side Hustle",
  "Other",
]

export async function GET() {
  try {
    console.log("Starting database seeding...")

    // First, check if the categories table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'categories'
      );
    `

    console.log("Table check result:", tableCheck)

    if (!tableCheck[0].exists) {
      console.log("Categories table doesn't exist, creating it...")
      await sql`
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE
        );
      `
    }

    // Insert categories using the tagged template syntax
    for (const category of categories) {
      console.log(`Inserting category: ${category}`)
      await sql`
        INSERT INTO categories (name) 
        VALUES (${category}) 
        ON CONFLICT (name) DO NOTHING
      `
    }

    // Verify categories were inserted
    const insertedCategories = await sql`SELECT * FROM categories ORDER BY name`
    console.log("Inserted categories:", insertedCategories)

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      categories: insertedCategories,
    })
  } catch (error) {
    console.error("Error seeding database:", error)
    return NextResponse.json(
      { success: false, message: "Failed to seed database", error: String(error) },
      { status: 500 },
    )
  }
}
