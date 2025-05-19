"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CalendarIcon, PlusCircle } from "lucide-react"
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
import { formatCurrency } from "@/lib/format"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"

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

const budgetFormSchema = z.object({
  amount: z.coerce.number().positive({
    message: "Budget amount must be a positive number.",
  }),
  start_date: z.date({
    required_error: "Start date is required.",
  }),
  end_date: z.date({
    required_error: "End date is required.",
  }),
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
  const [selectedBudget, setSelectedBudget] = useState<any>(null)
  const [budgetWarning, setBudgetWarning] = useState<string | null>(null)
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false)
  const [createBudget, setCreateBudget] = useState(false)

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

  const budgetForm = useForm<z.infer<typeof budgetFormSchema>>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      amount: undefined,
      start_date: new Date(),
      end_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), // Last day of current month
    },
  })

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

  // Check budget when category or amount changes
  useEffect(() => {
    const checkBudget = async () => {
      const type = form.watch("type")
      const categoryId = form.watch("category_id")
      const amount = form.watch("amount")

      // Only check budget for expense transactions
      if (type !== "expense" || !categoryId || !amount) {
        setSelectedBudget(null)
        setBudgetWarning(null)
        return
      }

      try {
        // Use transaction date if editing, otherwise use today
        const checkDate = form.watch("date")
          ? form.watch("date").toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0]

        const response = await fetch(`/api/budgets/by-category/${categoryId}?date=${checkDate}`)

        if (response.ok) {
          const budget = await response.json()

          if (budget) {
            setSelectedBudget(budget)

            // If editing, we need to account for the current transaction amount
            let adjustedRemaining = budget.remaining
            if (transaction && transaction.type === "expense" && transaction.category_id.toString() === categoryId) {
              // Add back the current transaction amount since it's already counted in spent
              adjustedRemaining += transaction.amount
            }

            // Check if expense exceeds remaining budget
            if (adjustedRemaining < amount) {
              setBudgetWarning(
                `This expense exceeds your remaining budget by ${formatCurrency(amount - adjustedRemaining)}`,
              )
            } else {
              setBudgetWarning(null)
            }
          } else {
            setSelectedBudget(null)
            setBudgetWarning("No budget found for this category")
          }
        }
      } catch (error) {
        console.error("Error checking budget:", error)
        setSelectedBudget(null)
      }
    }

    checkBudget()
  }, [form, transaction])

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

      const savedTransaction = await response.json()

      // Handle budget creation for income transactions
      if (values.type === "income" && createBudget) {
        try {
          const budgetValues = budgetForm.getValues()

          await fetch("/api/budgets", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              category_id: Number.parseInt(values.category_id),
              amount: budgetValues.amount,
              start_date: formatDateForAPI(budgetValues.start_date),
              end_date: formatDateForAPI(budgetValues.end_date),
            }),
          })

          toast({
            title: "Budget created",
            description: "A new budget has been created for this category.",
          })
        } catch (error) {
          console.error("Error creating budget:", error)
          toast({
            title: "Budget creation failed",
            description: "The transaction was saved, but budget creation failed.",
            variant: "destructive",
          })
        }
      }

      // Handle budget spending for expense transactions
      if (values.type === "expense") {
        try {
          // Find the budget for this category
          const checkDate = values.date.toISOString().split("T")[0]

          const budgetResponse = await fetch(`/api/budgets/by-category/${values.category_id}?date=${checkDate}`)

          if (budgetResponse.ok) {
            const budget = await budgetResponse.json()

            if (budget && budget.id) {
              if (transaction) {
                // If editing, check if there's an existing budget spending record
                const spendingResponse = await fetch(`/api/budget-spending/by-transaction/${transaction.id}`)

                if (spendingResponse.ok) {
                  const existingSpending = await spendingResponse.json()

                  if (existingSpending && existingSpending.id) {
                    // Update existing spending record
                    await fetch(`/api/budget-spending/${existingSpending.id}`, {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        budget_id: budget.id,
                        amount: values.amount,
                      }),
                    })
                  } else {
                    // Create new spending record for existing transaction
                    await fetch("/api/budget-spending", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        budget_id: budget.id,
                        transaction_id: transaction.id,
                        amount: values.amount,
                      }),
                    })
                  }
                }
              } else {
                // Create a budget spending record for new transaction
                await fetch("/api/budget-spending", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    budget_id: budget.id,
                    transaction_id: savedTransaction.id,
                    amount: values.amount,
                  }),
                })
              }
            }
          }
        } catch (error) {
          console.error("Error linking expense to budget:", error)
          // Don't block the transaction save if budget linking fails
        }
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

  // Format date to YYYY-MM-DD
  const formatDateForAPI = (date: Date): string => {
    return date.toISOString().split("T")[0]
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
                <Select
                  onValueChange={(value) => {
                    field.onChange(value)
                    // Reset create budget flag when switching types
                    if (value !== "income") {
                      setCreateBudget(false)
                    }
                  }}
                  defaultValue={field.value}
                >
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

        {/* Budget section for expense transactions */}
        {form.watch("type") === "expense" && (
          <div className="space-y-2">
            {selectedBudget ? (
              <div className={`p-4 rounded-md ${budgetWarning ? "bg-red-50" : "bg-muted"}`}>
                <h3 className="font-medium mb-2">Budget Impact</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Category:</div>
                  <div>{selectedBudget.category}</div>
                  <div>Budget:</div>
                  <div>{formatCurrency(selectedBudget.budget)}</div>
                  <div>Already Spent:</div>
                  <div>{formatCurrency(selectedBudget.spent)}</div>
                  <div>Remaining:</div>
                  <div className={selectedBudget.remaining < 0 ? "text-red-500" : ""}>
                    {formatCurrency(selectedBudget.remaining)}
                  </div>
                  {budgetWarning && (
                    <>
                      <div className="text-red-500 font-medium">Warning:</div>
                      <div className="text-red-500">{budgetWarning}</div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              form.watch("category_id") && (
                <div className="p-4 bg-yellow-50 rounded-md">
                  <p className="text-yellow-700">No budget found for this category and date range.</p>
                </div>
              )
            )}
          </div>
        )}

        {/* Budget creation option for income transactions */}
        {form.watch("type") === "income" && form.watch("category_id") && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="create-budget"
                checked={createBudget}
                onCheckedChange={(checked) => {
                  setCreateBudget(checked === true)
                  if (checked) {
                    setBudgetDialogOpen(true)
                  }
                }}
              />
              <label
                htmlFor="create-budget"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Create a budget for this category
              </label>
            </div>

            {createBudget && (
              <Dialog open={budgetDialogOpen} onOpenChange={setBudgetDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" type="button" className="mt-2">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Configure Budget
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create Budget</DialogTitle>
                    <DialogDescription>
                      Set up a budget for the selected category. This budget will be created when you save the
                      transaction.
                    </DialogDescription>
                  </DialogHeader>

                  <Form {...budgetForm}>
                    <form className="space-y-4 py-4">
                      <FormField
                        control={budgetForm.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Budget Amount</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0.00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={budgetForm.control}
                          name="start_date"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Start Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground",
                                      )}
                                    >
                                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={budgetForm.control}
                          name="end_date"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>End Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground",
                                      )}
                                    >
                                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </form>
                  </Form>

                  <DialogFooter>
                    <Button
                      type="button"
                      onClick={() => {
                        const result = budgetForm.trigger()
                        if (result) {
                          setBudgetDialogOpen(false)
                        }
                      }}
                    >
                      Save Budget Settings
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}

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
