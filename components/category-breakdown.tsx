"use client"

import { useEffect, useState } from "react"
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { useDateRange } from "@/contexts/date-range-context"
import { formatCurrency } from "@/lib/format"

type CategoryData = {
  name: string
  value: number
  color: string
}

// Array of colors for the pie chart
const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"]

export function CategoryBreakdown() {
  const { dateRange } = useDateRange()
  const [data, setData] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategoryData = async () => {
      if (!dateRange?.from || !dateRange?.to) return

      try {
        setLoading(true)
        const startDate = formatDateForAPI(dateRange.from)
        const endDate = formatDateForAPI(dateRange.to)

        const response = await fetch(`/api/dashboard?startDate=${startDate}&endDate=${endDate}`)
        if (!response.ok) throw new Error("Failed to fetch dashboard data")
        const dashboardData = await response.json()

        // Map the category data to include colors
        const categoryData = dashboardData.categoryBreakdown.map((item: any, index: number) => ({
          ...item,
          color: COLORS[index % COLORS.length],
        }))

        setData(categoryData)
      } catch (error) {
        console.error("Error fetching category data:", error)
        toast({
          title: "Error",
          description: "Failed to load category data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCategoryData()
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
    return <Skeleton className="h-[300px] w-full" />
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No expense data available for the selected date range
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={formatTooltipValue} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
