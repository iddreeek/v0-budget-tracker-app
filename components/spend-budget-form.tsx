"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatCurrency } from "@/lib/format"

const formSchema = z.object({
  budget_id: z.string().min(1, {
    message: "Please select a budget.",
  }),
  amount: z.coerce.number().positive({
    message: "Amount must be a positive number.",
  }),
  description: z.string().min(2, {
    message: "Description must be at least 2 characters.",
  }),
  notes: z.string().optional(),
})

type Budget = {
  id: number
  category: string
  budget: number
  spent: number
  remaining: number
}

export function SpendBudgetForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      budget_id: "",
      amount: undefined,
      description: "",
      notes: "",
    },
  })

  // Format date to YYYY-MM-DD
  const formatDateForAPI = (date: Date): string => {
    return date.toISOString().split("T")[0]
  }

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get current date for API
        const today = new Date()
        const startDate = formatDateForAPI(new Date(today.getFullYear(), today.getMonth(), 1))
        const endDate = formatDateForAPI(today)

        const response = await fetch(`/api/budgets?startDate=${startDate}&endDate=${endDate}`)
        if (!response.ok) throw new Error("Failed to fetch budgets")
        const data = await response.json()
        setBudgets(data)
      } catch (error) {
        console.error("Error fetching budgets:", error)
        setError(`Failed to load budgets: ${error instanceof Error ? error.message : String(error)}`)
      } finally {
        setLoading(false)
      }
    }

    fetchBudgets()
  }, [])

  // Update selected budget when budget_id changes
  useEffect(() => {
    const budgetId = form.watch("budget_id")
    if (budgetId) {
      const budget = budgets.find((b) => b.id.toString() === budgetId)
      setSelectedBudget(budget || null)
    } else {
      setSelectedBudget(null)
    }
  }, [form.watch("budget_id"), budgets])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    try {
      // First, create a transaction for this spending
      const transactionResponse = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: formatDateForAPI(new Date()),
          description: values.description,
          amount: values.amount,
          type: "expense",
          category_id: selectedBudget?.category_id,
          notes: values.notes || `Spent from budget: ${selectedBudget?.category}`,
        }),
      })

      if (!transactionResponse.ok) {
        const errorData = await transactionResponse.json()
        throw new Error(errorData.message || "Failed to create transaction")
      }

      const transaction = await transactionResponse.json()

      // Then, record the budget spending
      const spendResponse = await fetch("/api/budget-spending", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          budget_id: Number.parseInt(values.budget_id),
          transaction_id: transaction.id,
          amount: values.amount,
        }),
      })

      if (!spendResponse.ok) {
        const errorData = await spendResponse.json()
        throw new Error(errorData.message || "Failed to record budget spending")
      }

      toast({
        title: "Budget spent",
        description: "Your budget spending has been recorded successfully.",
      })

      router.push("/budgets")
      router.refresh()
    } catch (error) {
      console.error("Error spending from budget:", error)
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
          name="budget_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Budget</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={loading ? "Loading budgets..." : "Select a budget"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {loading ? (
                    <SelectItem value="loading" disabled>
                      Loading budgets...
                    </SelectItem>
                  ) : budgets.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No budgets available
                    </SelectItem>
                  ) : (
                    budgets.map((budget) => (
                      <SelectItem key={budget.id} value={budget.id.toString()}>
                        {budget.category} ({formatCurrency(budget.remaining)} remaining)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormDescription>Select a budget to spend from.</FormDescription>
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
              <FormDescription>
                Enter the amount to spend.
                {selectedBudget && <span className="ml-1">Available: {formatCurrency(selectedBudget.remaining)}</span>}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="What are you spending on?" {...field} />
              </FormControl>
              <FormDescription>Enter a description for this spending.</FormDescription>
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

        {selectedBudget && (
          <div className="p-4 bg-muted rounded-md">
            <h3 className="font-medium mb-2">Budget Summary</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Category:</div>
              <div>{selectedBudget.category}</div>
              <div>Total Budget:</div>
              <div>{formatCurrency(selectedBudget.budget)}</div>
              <div>Spent:</div>
              <div>{formatCurrency(selectedBudget.spent)}</div>
              <div>Remaining:</div>
              <div>{formatCurrency(selectedBudget.remaining)}</div>
            </div>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting || loading || budgets.length === 0}>
          {isSubmitting ? "Processing..." : "Spend from Budget"}
        </Button>
      </form>
    </Form>
  )
}
