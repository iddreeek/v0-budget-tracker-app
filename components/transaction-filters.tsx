"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { useDateRange } from "@/contexts/date-range-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type Category = {
  id: number
  name: string
}

export function TransactionFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { dateRange } = useDateRange()

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const [type, setType] = useState(searchParams.get("type") || "all")
  const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") || "all")
  const [minAmount, setMinAmount] = useState(searchParams.get("minAmount") || "")
  const [maxAmount, setMaxAmount] = useState(searchParams.get("maxAmount") || "")

  // Format date to YYYY-MM-DD
  const formatDateForAPI = (date: Date): string => {
    return date.toISOString().split("T")[0]
  }

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/categories")
        if (!response.ok) throw new Error("Failed to fetch categories")
        const data = await response.json()
        setCategories(data)
      } catch (error) {
        console.error("Error fetching categories:", error)
        toast({
          title: "Error",
          description: "Failed to load categories. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const applyFilters = () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast({
        title: "Date range required",
        description: "Please select a date range first.",
        variant: "destructive",
      })
      return
    }

    const params = new URLSearchParams()

    if (type !== "all") params.set("type", type)
    if (categoryId !== "all") params.set("categoryId", categoryId)
    if (minAmount) params.set("minAmount", minAmount)
    if (maxAmount) params.set("maxAmount", maxAmount)

    // Add date range params
    params.set("startDate", formatDateForAPI(dateRange.from))
    params.set("endDate", formatDateForAPI(dateRange.to))

    router.push(`/transactions?${params.toString()}`)
  }

  const resetFilters = () => {
    setType("all")
    setCategoryId("all")
    setMinAmount("")
    setMaxAmount("")
    router.push("/transactions")
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <div className="flex justify-end mt-4 space-x-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="minAmount">Min Amount</Label>
            <Input
              id="minAmount"
              type="number"
              placeholder="0.00"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxAmount">Max Amount</Label>
            <Input
              id="maxAmount"
              type="number"
              placeholder="0.00"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end mt-4 space-x-2">
          <Button variant="outline" onClick={resetFilters}>
            Reset
          </Button>
          <Button onClick={applyFilters}>Apply Filters</Button>
        </div>
      </CardContent>
    </Card>
  )
}
