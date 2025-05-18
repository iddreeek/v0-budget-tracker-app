"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useDateRange } from "@/contexts/date-range-context"

const formSchema = z
  .object({
    category_id: z.string().min(1, {
      message: "Please select a category.",
    }),
    amount: z.coerce.number().positive({
      message: "Budget must be a positive number.",
    }),
    start_date: z.date({
      required_error: "Start date is required.",
    }),
    end_date: z.date({
      required_error: "End date is required.",
    }),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: "End date must be after start date",
    path: ["end_date"],
  })

type Category = {
  id: number
  name: string
}

export function BudgetForm({ budget = null }: { budget?: any }) {
  const router = useRouter()
  const { dateRange } = useDateRange()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Format date to string
  const formatDate = (date: Date): string => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const day = date.getDate()
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    return `${month} ${day}, ${year}`
  }

  // Format date to YYYY-MM-DD
  const formatDateForAPI = (date: Date): string => {
    return date.toISOString().split("T")[0]
  }

  // First, let's seed the categories if needed
  useEffect(() => {
    const seedCategories = async () => {
      try {
        await fetch("/api/seed")
      } catch (error) {
        console.error("Error seeding categories:", error)
      }
    }

    seedCategories()
  }, [])

  useEffect(() => {
    // Fetch categories
    const fetchCategories = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch("/api/categories")

        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        console.log("Categories fetched:", data)

        if (!Array.isArray(data) || data.length === 0) {
          setError("No categories found. Please make sure the database is seeded.")
        } else {
          setCategories(data)
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
        setError(`Failed to load categories: ${error instanceof Error ? error.message : String(error)}`)
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category_id: budget?.category_id?.toString() || "",
      amount: budget?.budget || undefined,
      start_date: budget?.start_date ? new Date(budget.start_date) : dateRange?.from || new Date(),
      end_date: budget?.end_date ? new Date(budget.end_date) : dateRange?.to || new Date(),
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    try {
      const apiUrl = budget ? `/api/budgets/${budget.id}` : "/api/budgets"

      const method = budget ? "PUT" : "POST"

      const response = await fetch(apiUrl, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          category_id: Number.parseInt(values.category_id),
          start_date: formatDateForAPI(values.start_date),
          end_date: formatDateForAPI(values.end_date),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to save budget")
      }

      toast({
        title: budget ? "Budget updated" : "Budget added",
        description: budget ? "Your budget has been updated successfully." : "Your budget has been added successfully.",
      })

      router.push("/budgets")
      router.refresh()
    } catch (error) {
      console.error("Error saving budget:", error)
      toast({
        title: "Error",
        description: String(error),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={loading ? "Loading categories..." : "Select a category"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {loading ? (
                    <SelectItem value="loading" disabled>
                      Loading categories...
                    </SelectItem>
                  ) : categories.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No categories available
                    </SelectItem>
                  ) : (
                    categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormDescription>Select a category for your budget.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Budget Amount</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
              <FormDescription>Enter the budget amount for this period.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? formatDate(field.value) : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent>
                </Popover>
                <FormDescription>The start date of your budget period.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? formatDate(field.value) : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent>
                </Popover>
                <FormDescription>The end date of your budget period.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting || loading || categories.length === 0}>
          {isSubmitting ? "Saving..." : budget ? "Update Budget" : "Save Budget"}
        </Button>
      </form>
    </Form>
  )
}
