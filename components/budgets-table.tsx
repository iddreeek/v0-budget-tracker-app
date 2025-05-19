"use client"

import { useState, useEffect } from "react"
import { PencilIcon, TrashIcon, CalendarIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { useDateRange } from "@/contexts/date-range-context"
import { formatCurrency } from "@/lib/format"

type Budget = {
  id: number
  category: string
  category_id: number
  budget: number
  spent: number
  remaining: number
  percentage: number
  start_date: string
  end_date: string
}

export function BudgetsTable() {
  const router = useRouter()
  const { dateRange } = useDateRange()
  const [data, setData] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if we're on a mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Initial check
    checkMobile()

    // Add event listener for window resize
    window.addEventListener("resize", checkMobile)

    // Cleanup
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      fetchBudgets()
    }
  }, [dateRange])

  const fetchBudgets = async () => {
    try {
      setLoading(true)

      // Format dates for API
      const startDate = dateRange?.from ? formatDateForAPI(dateRange.from) : undefined
      const endDate = dateRange?.to ? formatDateForAPI(dateRange.to) : undefined

      const queryParams = new URLSearchParams()
      if (startDate) queryParams.set("startDate", startDate)
      if (endDate) queryParams.set("endDate", endDate)

      const response = await fetch(`/api/budgets?${queryParams.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch budgets")
      const budgets = await response.json()
      setData(budgets)
    } catch (error) {
      console.error("Error fetching budgets:", error)
      toast({
        title: "Error",
        description: "Failed to load budgets. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/budgets/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete budget")
      }

      setData(data.filter((budget) => budget.id !== id))

      toast({
        title: "Budget deleted",
        description: "The budget has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting budget:", error)
      toast({
        title: "Error",
        description: String(error),
        variant: "destructive",
      })
    }
  }

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
    const startYear = start.getFullYear()

    const endDay = end.getDate()
    const endMonth = months[end.getMonth()]
    const endYear = end.getFullYear()

    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${endYear}`
  }

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Period</TableHead>
              <TableHead className="text-right">Budget</TableHead>
              <TableHead className="text-right">Spent</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(5)
              .fill(0)
              .map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-20 ml-auto" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-20 ml-auto" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-20 ml-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground mb-4">
          No budgets found for the selected date range. Add your first budget to get started.
        </p>
        <Link href="/budgets/new">
          <Button>Add Budget</Button>
        </Link>
      </div>
    )
  }

  // Mobile view
  if (isMobile) {
    return (
      <div className="space-y-4">
        {data.map((budget) => (
          <Card key={budget.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <h3 className="font-medium">{budget.category}</h3>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  {formatDateRange(budget.start_date, budget.end_date)}
                </div>
                <div className="mt-2">
                  <Progress
                    value={budget.percentage > 100 ? 100 : budget.percentage}
                    className={budget.percentage > 100 ? "bg-muted" : ""}
                    indicatorClassName={budget.percentage > 100 ? "bg-destructive" : ""}
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-muted-foreground">{formatCurrency(budget.spent)} spent</span>
                    <span className="text-xs text-muted-foreground">{Math.round(budget.percentage)}% of budget</span>
                  </div>
                </div>
              </div>
              <div className="p-4 flex flex-col space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Budget:</span>
                  <span className="font-medium">{formatCurrency(budget.budget)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Remaining:</span>
                  <span className={budget.remaining < 0 ? "text-red-500 font-medium" : "font-medium"}>
                    {formatCurrency(budget.remaining)}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <Link href={`/budgets/edit/${budget.id}`}>
                    <Button variant="outline" size="sm">
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-500 border-red-200">
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this budget. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(budget.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Desktop view
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Period</TableHead>
            <TableHead className="text-right">Budget</TableHead>
            <TableHead className="text-right">Spent</TableHead>
            <TableHead className="text-right">Remaining</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((budget) => (
            <TableRow key={budget.id}>
              <TableCell className="font-medium">{budget.category}</TableCell>
              <TableCell className="text-sm">
                <div className="flex items-center">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  {formatDateRange(budget.start_date, budget.end_date)}
                </div>
              </TableCell>
              <TableCell className="text-right">{formatCurrency(budget.budget)}</TableCell>
              <TableCell className="text-right">{formatCurrency(budget.spent)}</TableCell>
              <TableCell className="text-right">
                <span className={budget.remaining < 0 ? "text-red-500" : ""}>{formatCurrency(budget.remaining)}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress
                    value={budget.percentage > 100 ? 100 : budget.percentage}
                    className={budget.percentage > 100 ? "bg-muted" : ""}
                    indicatorClassName={budget.percentage > 100 ? "bg-destructive" : ""}
                  />
                  <span className="text-sm text-muted-foreground w-12">{Math.round(budget.percentage)}%</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Link href={`/budgets/edit/${budget.id}`}>
                    <Button variant="ghost" size="icon">
                      <PencilIcon className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <TrashIcon className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this budget. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(budget.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
