"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { useDateRange } from "@/contexts/date-range-context"
import { formatCurrency } from "@/lib/format"

type MonthlyData = {
  month: string
  income: number
  expenses: number
}

export function Overview() {
  const { dateRange } = useDateRange()
  const [data, setData] = useState<MonthlyData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOverviewData = async () => {
      if (!dateRange?.from || !dateRange?.to) return

      try {
        setLoading(true)
        const startDate = formatDateForAPI(dateRange.from)
        const endDate = formatDateForAPI(dateRange.to)

        const response = await fetch(`/api/dashboard?startDate=${startDate}&endDate=${endDate}`)
        if (!response.ok) throw new Error("Failed to fetch dashboard data")
        const dashboardData = await response.json()
        setData(dashboardData.monthlyOverview)
      } catch (error) {
        console.error("Error fetching overview data:", error)
        toast({
          title: "Error",
          description: "Failed to load overview data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchOverviewData()
  }, [dateRange])

  // Format date to YYYY-MM-DD
  const formatDateForAPI = (date: Date): string => {
    return date.toISOString().split("T")[0]
  }

  // Custom formatter for tooltip values
  const formatTooltipValue = (value: number) => {
    return formatCurrency(value)
  }

  if (loading) {
    return <Skeleton className="h-[350px] w-full" />
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px] text-muted-foreground">
        No data available for the selected date range
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={(value) => `₱${value}`} />
        <Tooltip formatter={formatTooltipValue} />
        <Legend />
        <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
