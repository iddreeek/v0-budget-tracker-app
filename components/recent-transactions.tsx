"use client"

import { useEffect, useState } from "react"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { useDateRange } from "@/contexts/date-range-context"

type Transaction = {
  id: number
  date: string
  description: string
  amount: number
  type: "income" | "expense"
  category: string
}

export function RecentTransactions() {
  const { dateRange } = useDateRange()
  const [data, setData] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecentTransactions = async () => {
      if (!dateRange?.from || !dateRange?.to) return

      try {
        setLoading(true)
        const startDate = formatDateForAPI(dateRange.from)
        const endDate = formatDateForAPI(dateRange.to)

        const response = await fetch(`/api/dashboard?startDate=${startDate}&endDate=${endDate}`)
        if (!response.ok) throw new Error("Failed to fetch dashboard data")
        const dashboardData = await response.json()
        setData(dashboardData.recentTransactions)
      } catch (error) {
        console.error("Error fetching recent transactions:", error)
        toast({
          title: "Error",
          description: "Failed to load recent transactions. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchRecentTransactions()
  }, [dateRange])

  // Format date to YYYY-MM-DD
  const formatDateForAPI = (date: Date): string => {
    return date.toISOString().split("T")[0]
  }

  if (loading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array(5)
            .fill(0)
            .map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-40" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-24" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-4 w-16 ml-auto" />
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-muted-foreground mb-4">No transactions found for the selected date range</p>
        <Link href="/transactions/new">
          <Button>Add Your First Transaction</Button>
        </Link>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
            <TableCell>{transaction.description}</TableCell>
            <TableCell>
              <Badge variant="outline">{transaction.category}</Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end">
                {transaction.type === "income" ? (
                  <ArrowUpIcon className="mr-1 h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownIcon className="mr-1 h-4 w-4 text-red-500" />
                )}
                <span className={cn(transaction.type === "income" ? "text-green-500" : "text-red-500")}>
                  ${Number.parseFloat(transaction.amount.toString()).toFixed(2)}
                </span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
