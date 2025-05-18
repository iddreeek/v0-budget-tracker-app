import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Button } from "@/components/ui/button"
import { MainNav } from "@/components/main-nav"
import { Search } from "@/components/search"
import { UserNav } from "@/components/user-nav"
import { TransactionForm } from "@/components/transaction-form"
import { executeQuery } from "@/lib/db"

export const metadata: Metadata = {
  title: "Edit Transaction - Budget Tracker",
  description: "Edit an existing transaction in your budget tracker.",
}

async function getTransaction(id: string) {
  try {
    const result = await executeQuery(
      `SELECT t.*, c.name as category_name 
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = $1`,
      [id],
    )

    if (result.length === 0) {
      return null
    }

    return result[0]
  } catch (error) {
    console.error("Error fetching transaction:", error)
    return null
  }
}

export default async function EditTransactionPage({ params }: { params: { id: string } }) {
  const transaction = await getTransaction(params.id)

  if (!transaction) {
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
          <h2 className="text-3xl font-bold tracking-tight">Edit Transaction</h2>
          <div className="flex items-center space-x-2">
            <Link href="/transactions">
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </div>
        <div className="mx-auto max-w-2xl">
          <TransactionForm transaction={transaction} />
        </div>
      </div>
    </div>
  )
}
