// This file would contain functions to interact with a database in a real application
// For now, we'll use mock data

export type Transaction = {
  id: string
  date: string
  description: string
  amount: number
  type: "income" | "expense"
  category: string
  notes?: string
}

export type Budget = {
  id: string
  category: string
  budget: number
  spent: number
  remaining: number
  percentage: number
}

// In a real app, these would be API calls or database queries
export async function getTransactions(): Promise<Transaction[]> {
  return [
    {
      id: "1",
      date: "2023-06-01",
      description: "Salary",
      amount: 2000,
      type: "income",
      category: "Salary",
    },
    {
      id: "2",
      date: "2023-06-02",
      description: "Rent",
      amount: 800,
      type: "expense",
      category: "Housing",
    },
    // More transactions would be here
  ]
}

export async function getBudgets(): Promise<Budget[]> {
  return [
    {
      id: "1",
      category: "Housing",
      budget: 1000,
      spent: 800,
      remaining: 200,
      percentage: 80,
    },
    {
      id: "2",
      category: "Food",
      budget: 500,
      spent: 400,
      remaining: 100,
      percentage: 80,
    },
    // More budgets would be here
  ]
}

export async function addTransaction(transaction: Omit<Transaction, "id">): Promise<Transaction> {
  // In a real app, this would add to a database
  const newTransaction = {
    ...transaction,
    id: Math.random().toString(36).substring(2, 9),
  }

  return newTransaction
}

export async function updateTransaction(id: string, transaction: Partial<Transaction>): Promise<Transaction> {
  // In a real app, this would update in a database
  return {
    id,
    date: "2023-06-01",
    description: "Updated Transaction",
    amount: 100,
    type: "expense",
    category: "Food",
    ...transaction,
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  // In a real app, this would delete from a database
  console.log(`Deleted transaction ${id}`)
}

export async function addBudget(budget: Omit<Budget, "id" | "spent" | "remaining" | "percentage">): Promise<Budget> {
  // In a real app, this would add to a database
  const newBudget = {
    ...budget,
    id: Math.random().toString(36).substring(2, 9),
    spent: 0,
    remaining: budget.budget,
    percentage: 0,
  }

  return newBudget
}

export async function updateBudget(id: string, budget: Partial<Budget>): Promise<Budget> {
  // In a real app, this would update in a database
  return {
    id,
    category: "Updated Category",
    budget: 500,
    spent: 250,
    remaining: 250,
    percentage: 50,
    ...budget,
  }
}

export async function deleteBudget(id: string): Promise<void> {
  // In a real app, this would delete from a database
  console.log(`Deleted budget ${id}`)
}
