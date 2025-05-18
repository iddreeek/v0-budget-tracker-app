import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Overview } from "@/components/overview"
import { RecentTransactions } from "@/components/recent-transactions"
import { Search } from "@/components/search"
import { UserNav } from "@/components/user-nav"
import { CalendarDateRangePicker } from "@/components/date-range-picker"
import { MainNav } from "@/components/main-nav"
import { BudgetProgress } from "@/components/budget-progress"
import { CategoryBreakdown } from "@/components/category-breakdown"
import { DashboardCards } from "@/components/dashboard-cards"

export const metadata: Metadata = {
  title: "Budget Tracker",
  description: "Track your income and expenses with ease.",
}

export default function DashboardPage() {
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
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <CalendarDateRangePicker />
            <Link href="/transactions/new" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">Add Transaction</Button>
            </Link>
          </div>
        </div>
        <DashboardCards />
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
          <Card className="col-span-1 lg:col-span-4">
            <CardHeader>
              <CardTitle>Monthly Overview</CardTitle>
              <CardDescription>Your income and expenses for the past 6 months</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <Overview />
            </CardContent>
          </Card>
          <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
              <CardDescription>Your expenses by category</CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryBreakdown />
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
          <Card className="col-span-1 lg:col-span-4">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your most recent transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentTransactions />
            </CardContent>
          </Card>
          <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
              <CardTitle>Budget Progress</CardTitle>
              <CardDescription>Your spending against budget by category</CardDescription>
            </CardHeader>
            <CardContent>
              <BudgetProgress />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
