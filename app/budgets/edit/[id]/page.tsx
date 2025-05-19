import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Button } from "@/components/ui/button"
import { MainNav } from "@/components/main-nav"
import { Search } from "@/components/search"
import { UserNav } from "@/components/user-nav"
import { BudgetForm } from "@/components/budget-form"
import { sql } from "@/lib/db"
import { BudgetSpendingTable } from "@/components/budget-spending-table"

export const metadata: Metadata = {
  title: "Edit Budget - Budget Tracker",
  description: "Edit an existing budget in your budget tracker.",
}

async function getBudget(id: string) {
  try {
    const result = await sql`
      SELECT b.*, c.name as category_name 
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.id = ${id}
    `

    if (result.length === 0) {
      return null
    }

    return {
      ...result[0],
      budget: result[0].amount,
    }
  } catch (error) {
    console.error("Error fetching budget:", error)
    return null
  }
}

export default async function EditBudgetPage({ params }: { params: { id: string } }) {
  const budget = await getBudget(params.id)

  if (!budget) {
    notFound()
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <MainNav className="mx-6" />
          <div className="ml-auto flex items-center space-x-4">
            <Search />
            <UserNav />
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Edit Budget</h2>
          <div className="flex items-center space-x-2">
            <Link href="/budgets">
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </div>
        <div className="mx-auto max-w-2xl">
          <BudgetForm budget={budget} />
        </div>
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">Budget Spending</h3>
          <BudgetSpendingTable budgetId={budget.id} />
        </div>
      </div>
    </div>
  )
}
