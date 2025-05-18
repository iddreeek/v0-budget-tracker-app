import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { MainNav } from "@/components/main-nav"
import { Search } from "@/components/search"
import { UserNav } from "@/components/user-nav"
import { BudgetForm } from "@/components/budget-form"

export const metadata: Metadata = {
  title: "Add Budget - Budget Tracker",
  description: "Add a new budget category to your budget tracker.",
}

export default function NewBudgetPage() {
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
          <h2 className="text-3xl font-bold tracking-tight">Add Budget</h2>
          <div className="flex items-center space-x-2">
            <Link href="/budgets">
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </div>
        <div className="mx-auto max-w-2xl">
          <BudgetForm />
        </div>
      </div>
    </div>
  )
}
