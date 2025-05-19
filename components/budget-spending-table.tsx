"use client"

import { useState, useEffect } from "react"
import { TrashIcon } from "lucide-react"
import { useRouter } from "next/navigation"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
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
import { formatCurrency } from "@/lib/format"

type BudgetSpending = {
  id: number
  budget_id: number
  transaction_id: number
  amount: number
  created_at: string
  category_name: string
  transaction_description: string
  transaction_date: string
}

export function BudgetSpendingTable({ budgetId }: { budgetId?: number }) {
  const router = useRouter()
  const [data, setData] = useState<BudgetSpending[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSpending()
  }, [budgetId])

  const fetchSpending = async () => {
    try {
      setLoading(true)

      let url = "/api/budget-spending"
      if (budgetId) {
        url += `?budgetId=${budgetId}`
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch budget spending")
      const spending = await response.json()
      setData(spending)
    } catch (error) {
      console.error("Error fetching budget spending:", error)
      toast({
        title: "Error",
        description: "Failed to load budget spending. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/budget-spending/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete budget spending")
      }

      setData(data.filter((spending) => spending.id !== id))

      toast({
        title: "Spending deleted",
        description: "The budget spending has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting budget spending:", error)
      toast({
        title: "Error",
        description: String(error),
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(3)
              .fill(0)
              .map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-20 ml-auto" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-8 ml-auto" />
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
        <p className="text-muted-foreground mb-4">No budget spending found.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((spending) => (
            <TableRow key={spending.id}>
              <TableCell>{new Date(spending.transaction_date).toLocaleDateString()}</TableCell>
              <TableCell>{spending.transaction_description}</TableCell>
              <TableCell>{spending.category_name}</TableCell>
              <TableCell className="text-right">{formatCurrency(spending.amount)}</TableCell>
              <TableCell className="text-right">
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
                        This will permanently delete this budget spending record. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(spending.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
