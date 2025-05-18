"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { useDateRange } from "@/contexts/date-range-context"

type DashboardData = {
  summary: {
    balance: {
      value: number
      change: string
    }
    income: {
      value: number
      change: string
    }
    expenses: {
      value: number
      change: string
    }
    budget: {
      total: number
      remaining: number
      percentage: string
    }
  }
}

export function DashboardCards() {
  const { dateRange } = useDateRange()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!dateRange?.from || !dateRange?.to) return

      try {
        setLoading(true)
        const startDate = formatDateForAPI(dateRange.from)
        const endDate = formatDateForAPI(dateRange.to)

        const response = await fetch(`/api/dashboard?startDate=${startDate}&endDate=${endDate}`)
        if (!response.ok) throw new Error("Failed to fetch dashboard data")
        const dashboardData = await response.json()
        setData(dashboardData)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [dateRange])

  // Format date to YYYY-MM-DD
  const formatDateForAPI = (date: Date): string => {
    return date.toISOString().split("T")[0]
  }

  if (loading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {Array(4)
          .fill(0)
          .map((_, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <Skeleton className="h-4 w-24" />
                </CardTitle>
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-24 mb-1" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${Number.parseFloat(data.summary.balance.value.toString()).toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            {Number.parseFloat(data.summary.balance.change) > 0 ? "+" : ""}
            {data.summary.balance.change}% from previous period
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Income</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M16 18V2M10 10l6-6M8 6v12M2 12l6 6" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${Number.parseFloat(data.summary.income.value.toString()).toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            {Number.parseFloat(data.summary.income.change) > 0 ? "+" : ""}
            {data.summary.income.change}% from previous period
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expenses</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M16 6v12M8 18V2M2 8l6 6M16 12l6-6" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${Number.parseFloat(data.summary.expenses.value.toString()).toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            {Number.parseFloat(data.summary.expenses.change) > 0 ? "+" : ""}
            {data.summary.expenses.change}% from previous period
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Budget Remaining</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <rect width="20" height="14" x="2" y="5" rx="2" />
            <path d="M2 10h20" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${Number.parseFloat(data.summary.budget.remaining.toString()).toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">{data.summary.budget.percentage}% of budget used</p>
        </CardContent>
      </Card>
    </div>
  )
}
