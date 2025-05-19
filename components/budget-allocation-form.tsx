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
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatCurrency } from "@/lib/format"

const formSchema = z.object({
  budget_id: z.string().min(1, {
    message: "Please select a budget.",
  }),
  transaction_id: z.string().min(1, {
    message: "Please select a transaction.",
  }),
  amount: z.coerce.number().positive({
    message: "Amount must be a positive number.",
  }),
})

type Budget = {
  id: number
  category: string
  budget: number
  spent: number
  remaining: number
}

type Transaction = {
  id: number
  description: string
  amount: number
  type: string
  date: string
}

export function BudgetAllocationForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      budget_id: "",
      transaction_id: "",
      amount: undefined,
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

    const fetchTransactions = async () => {
      try {
        setLoading(true)

        // Get current date for API
        const today = new Date()
        const startDate = formatDateForAPI(new Date(today.getFullYear(), today.getMonth(), 1))
        const endDate = formatDateForAPI(today)

        const response = await fetch(`/api/transactions?startDate=${startDate}&endDate=${endDate}&type=income`)
        if (!response.ok) throw new Error("Failed to fetch transactions")
        const data = await response.json()
        setTransactions(data)
      } catch (error) {
        console.error("Error fetching transactions:", error)
        setError(`Failed to load transactions: ${error instanceof Error ? error.message : String(error)}`)
      } finally {
        setLoading(false)
      }
    }

    fetchBudgets()
    fetchTransactions()
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

  // Update selected transaction when transaction_id changes
  useEffect(() => {
    const transactionId = form.watch("transaction_id")
    if (transactionId) {
      const transaction = transactions.find((t) => t.id.toString() === transactionId)
      setSelectedTransaction(transaction || null)

      // Auto-fill amount if transaction is selected
      if (transaction) {
        form.setValue("amount", transaction.amount)
      }
    } else {
      setSelectedTransaction(null)
    }
  }, [form.watch("transaction_id"), transactions, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/budget-allocations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          budget_id: Number.parseInt(values.budget_id),
          transaction_id: Number.parseInt(values.transaction_id),
          amount: values.amount,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to allocate budget")
      }

      toast({
        title: "Budget allocated",
        description: "Your budget has been allocated successfully.",
      })

      router.push("/budgets")
      router.refresh()
    } catch (error) {
      console.error("Error allocating budget:", error)
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
              <FormDescription>Select a budget to allocate funds to.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="transaction_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Income Source</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={loading ? "Loading transactions..." : "Select an income source"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {loading ? (
                    <SelectItem value="loading" disabled>
                      Loading transactions...
                    </SelectItem>
                  ) : transactions.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No income transactions available
                    </SelectItem>
                  ) : (
                    transactions.map((transaction) => (
                      <SelectItem key={transaction.id} value={transaction.id.toString()}>
                        {transaction.description} ({formatCurrency(transaction.amount)})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormDescription>Select an income source to allocate from.</FormDescription>
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
                Enter the amount to allocate.
                {selectedTransaction && (
                  <span className="ml-1">Available: {formatCurrency(selectedTransaction.amount)}</span>
                )}
              </FormDescription>
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

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || loading || budgets.length === 0 || transactions.length === 0}
        >
          {isSubmitting ? "Allocating..." : "Allocate Budget"}
        </Button>
      </form>
    </Form>
  )
}
