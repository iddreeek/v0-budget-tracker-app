"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const formSchema = z.object({
  description: z.string().min(2, {
    message: "Description must be at least 2 characters.",
  }),
  amount: z.coerce.number().positive({
    message: "Amount must be a positive number.",
  }),
  date: z.date(),
  type: z.enum(["income", "expense"]),
  category_id: z.string().min(1, {
    message: "Please select a category.",
  }),
  notes: z.string().optional(),
})

type Category = {
  id: number
  name: string
}

export function TransactionForm({ transaction = null }: { transaction?: any }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [seeding, setSeeding] = useState(false)

  // First, let's seed the categories if needed
  useEffect(() => {
    const seedCategories = async () => {
      try {
        setSeeding(true)
        const response = await fetch("/api/seed")
        const data = await response.json()
        console.log("Seed response:", data)

        if (!data.success) {
          throw new Error(data.message || "Failed to seed categories")
        }

        // If seeding was successful, fetch categories
        fetchCategories()
      } catch (error) {
        console.error("Error seeding categories:", error)
        setError(`Failed to seed categories: ${error instanceof Error ? error.message : String(error)}`)
      } finally {
        setSeeding(false)
      }
    }

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
          // If no categories found, try seeding again
          if (!seeding) {
            seedCategories()
          }
        } else {
          setCategories(data)
          setError(null)
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

    // Start by seeding categories
    seedCategories()
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: transaction?.description || "",
      amount: transaction?.amount || undefined,
      date: transaction?.date ? new Date(transaction.date) : new Date(),
      type: transaction?.type || "expense",
      category_id: transaction?.category_id?.toString() || "",
      notes: transaction?.notes || "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    try {
      const apiUrl = transaction ? `/api/transactions/${transaction.id}` : "/api/transactions"

      const method = transaction ? "PUT" : "POST"

      const response = await fetch(apiUrl, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          category_id: Number.parseInt(values.category_id),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to save transaction")
      }

      toast({
        title: transaction ? "Transaction updated" : "Transaction added",
        description: transaction
          ? "Your transaction has been updated successfully."
          : "Your transaction has been added successfully.",
      })

      router.push("/transactions")
      router.refresh()
    } catch (error) {
      console.error("Error saving transaction:", error)
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

      {seeding && (
        <Alert className="mb-6">
          <AlertTitle>Setting up categories</AlertTitle>
          <AlertDescription>Please wait while we set up the categories...</AlertDescription>
        </Alert>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder="Rent, Groceries, Salary, etc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select transaction type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={loading || seeding ? "Loading categories..." : "Select a category"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {loading || seeding ? (
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
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Add any additional details here..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || loading || seeding || categories.length === 0}
        >
          {isSubmitting
            ? "Saving..."
            : loading || seeding
              ? "Loading..."
              : transaction
                ? "Update Transaction"
                : "Save Transaction"}
        </Button>
      </form>
    </Form>
  )
}
