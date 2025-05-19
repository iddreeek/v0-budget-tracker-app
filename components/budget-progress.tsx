"use client"

import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { useDateRange } from "@/contexts/date-range-context"
import { CalendarIcon } from "lucide-react"
import { formatCurrency } from "@/lib/format"

type BudgetData = {
  id: number
  category: string
  budget: number
  spent: number
  remaining: number
  percentage: number
  start_date: string
  end_date: string
}

export function BudgetProgress() {
  const { dateRange } = useDateRange()
  const [data, setData] = useState<BudgetData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBudgetData = async () => {
      if (!dateRange?.from || !dateRange?.to) return

      try {
        setLoading(true)
        const startDate = formatDateForAPI(dateRange.from)
        const endDate = formatDateForAPI(dateRange.to)

        const response = await fetch(`/api/budgets?startDate=${startDate}&endDate=${endDate}`)
        if (!response.ok) throw new Error("Failed to fetch budget data")
        const budgetData = await response.json()
        setData(budgetData)
      } catch (error) {
        console.error("Error fetching budget data:", error)
        toast({
          title: "Error",
          description: "Failed to load budget data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchBudgetData()
  }, [dateRange])

  // Format date to YYYY-MM-DD
  const formatDateForAPI = (date: Date): string => {
    return date.toISOString().split("T")[0]
  }

  // Format date range for display
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    const startDay = start.getDate()
    const startMonth = months[start.getMonth()]

    const endDay = end.getDate()
    const endMonth = months[end.getMonth()]
    const endYear = end.getFullYear()

    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${endYear}`
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array(5)
          .fill(0)
          .map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        No budget data available for the selected date range. Add a budget to get started.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">{item.category}</span>
              <div className="flex items-center text-xs text-muted-foreground">
                <CalendarIcon className="h-3 w-3 mr-1" />
                {formatDateRange(item.start_date, item.end_date)}
              </div>
            </div>
            <span className="text-sm text-muted-foreground">
              {formatCurrency(item.spent)} / {formatCurrency(item.budget)}
            </span>
          </div>
          <Progress
            value={item.percentage > 100 ? 100 : item.percentage}
            className={item.percentage > 100 ? "bg-muted" : ""}
            indicatorClassName={item.percentage > 100 ? "bg-destructive" : ""}
          />
        </div>
      ))}
    </div>
  )
}
