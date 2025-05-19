"use client"

import { useState, useEffect } from "react"
import { ArrowDownIcon, ArrowUpIcon, PencilIcon, TrashIcon } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
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
import { Card, CardContent } from "@/components/ui/card"
import { useDateRange } from "@/contexts/date-range-context"
import { formatCurrency } from "@/lib/format"

type Transaction = {
  id: number
  date: string
  description: string
  amount: number
  type: "income" | "expense"
  category_id: number
  category_name: string
  notes?: string
}

export function TransactionsTable() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { dateRange } = useDateRange()
  const [data, setData] = useState<Transaction[]>([])
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
      fetchTransactions()
    }
  }, [dateRange, searchParams])

  // Format date to YYYY-MM-DD
  const formatDateForAPI = (date: Date): string => {
    return date.toISOString().split("T")[0]
  }

  const fetchTransactions = async () => {
    try {
      setLoading(true)

      // Get filter parameters from URL
      const type = searchParams.get("type")
      const categoryId = searchParams.get("categoryId")
      const minAmount = searchParams.get("minAmount")
      const maxAmount = searchParams.get("maxAmount")

      // Get date range
      const startDate = formatDateForAPI(dateRange.from!)
      const endDate = formatDateForAPI(dateRange.to!)

      // Build query string
      let queryString = `startDate=${startDate}&endDate=${endDate}`
      if (type && type !== "all") queryString += `&type=${type}`
      if (categoryId && categoryId !== "all") queryString += `&categoryId=${categoryId}`
      if (minAmount) queryString += `&minAmount=${minAmount}`
      if (maxAmount) queryString += `&maxAmount=${maxAmount}`

      const response = await fetch(`/api/transactions?${queryString}`)
      if (!response.ok) throw new Error("Failed to fetch transactions")
      const transactions = await response.json()
      setData(transactions)
    } catch (error) {
      console.error("Error fetching transactions:", error)
      toast({
        title: "Error",
        description: "Failed to load transactions. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete transaction")
      }

      setData(data.filter((transaction) => transaction.id !== id))

      toast({
        title: "Transaction deleted",
        description: "The transaction has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting transaction:", error)
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
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                  <TableCell>
                    <Skeleton className="h-6 w-20" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
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
        <p className="text-muted-foreground mb-4">No transactions found for the selected date range and filters.</p>
        <Link href="/transactions/new">
          <Button>Add Transaction</Button>
        </Link>
      </div>
    )
  }

  // Mobile view
  if (isMobile) {
    return (
      <div className="space-y-4">
        {data.map((transaction) => (
          <Card key={transaction.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 border-b flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{transaction.description}</h3>
                  <p className="text-sm text-muted-foreground">{new Date(transaction.date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center">
                  {transaction.type === "income" ? (
                    <ArrowUpIcon className="mr-1 h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownIcon className="mr-1 h-4 w-4 text-red-500" />
                  )}
                  <span
                    className={cn(transaction.type === "income" ? "text-green-500" : "text-red-500", "font-medium")}
                  >
                    {formatCurrency(transaction.amount)}
                  </span>
                </div>
              </div>
              <div className="p-4 flex flex-col space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Category:</span>
                  <Badge variant="outline">{transaction.category_name}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Type:</span>
                  <Badge variant={transaction.type === "income" ? "success" : "destructive"}>
                    {transaction.type === "income" ? "Income" : "Expense"}
                  </Badge>
                </div>
                <div className="flex justify-between pt-2">
                  <Link href={`/transactions/edit/${transaction.id}`}>
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
                          This will permanently delete this transaction. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(transaction.id)}>Delete</AlertDialogAction>
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
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
              <TableCell>{transaction.description}</TableCell>
              <TableCell>
                <Badge variant="outline">{transaction.category_name}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={transaction.type === "income" ? "success" : "destructive"}>
                  {transaction.type === "income" ? "Income" : "Expense"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end">
                  {transaction.type === "income" ? (
                    <ArrowUpIcon className="mr-1 h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownIcon className="mr-1 h-4 w-4 text-red-500" />
                  )}
                  <span className={cn(transaction.type === "income" ? "text-green-500" : "text-red-500")}>
                    {formatCurrency(transaction.amount)}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Link href={`/transactions/edit/${transaction.id}`}>
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
                          This will permanently delete this transaction. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(transaction.id)}>Delete</AlertDialogAction>
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
