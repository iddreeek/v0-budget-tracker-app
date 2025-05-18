import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate =
      searchParams.get("startDate") ||
      new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
    const endDate = searchParams.get("endDate") || new Date().toISOString().split("T")[0]

    console.log(`Fetching dashboard data from ${startDate} to ${endDate}`)

    // Get total income, expenses, and balance
    const financialSummary = await sql`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as balance
      FROM transactions
      WHERE date BETWEEN ${startDate} AND ${endDate}
    `

    // Get previous period's data for comparison
    // Calculate the length of the current period in days
    const currentStartDate = new Date(startDate)
    const currentEndDate = new Date(endDate)
    const periodLength = Math.ceil((currentEndDate.getTime() - currentStartDate.getTime()) / (1000 * 60 * 60 * 24))

    // Calculate the previous period's start and end dates
    const previousEndDate = new Date(currentStartDate)
    previousEndDate.setDate(previousEndDate.getDate() - 1)
    const previousStartDate = new Date(previousEndDate)
    previousStartDate.setDate(previousStartDate.getDate() - periodLength)

    const previousPeriodStartDate = previousStartDate.toISOString().split("T")[0]
    const previousPeriodEndDate = previousEndDate.toISOString().split("T")[0]

    const previousPeriodSummary = await sql`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as balance
      FROM transactions
      WHERE date BETWEEN ${previousPeriodStartDate} AND ${previousPeriodEndDate}
    `

    // Calculate percentage changes
    const incomeChange =
      previousPeriodSummary[0].total_income > 0
        ? ((financialSummary[0].total_income - previousPeriodSummary[0].total_income) /
            previousPeriodSummary[0].total_income) *
          100
        : 0

    const expensesChange =
      previousPeriodSummary[0].total_expenses > 0
        ? ((financialSummary[0].total_expenses - previousPeriodSummary[0].total_expenses) /
            previousPeriodSummary[0].total_expenses) *
          100
        : 0

    const balanceChange =
      previousPeriodSummary[0].balance !== 0
        ? ((financialSummary[0].balance - previousPeriodSummary[0].balance) /
            Math.abs(previousPeriodSummary[0].balance)) *
          100
        : 0

    // Get total budget for the categories with expenses in the selected period
    const totalBudget = await sql`
      SELECT COALESCE(SUM(b.amount), 0) as total_budget 
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE EXISTS (
        SELECT 1 FROM transactions t 
        WHERE t.category_id = c.id 
        AND t.type = 'expense'
        AND t.date BETWEEN ${startDate} AND ${endDate}
      )
    `

    // Get budget remaining
    const budgetRemaining = totalBudget[0].total_budget - financialSummary[0].total_expenses
    const budgetPercentage =
      totalBudget[0].total_budget > 0 ? (financialSummary[0].total_expenses / totalBudget[0].total_budget) * 100 : 0

    // Get monthly overview data
    // Determine how many months to show based on the date range
    const startMonth = new Date(startDate)
    const endMonth = new Date(endDate)
    const monthDiff =
      (endMonth.getFullYear() - startMonth.getFullYear()) * 12 + endMonth.getMonth() - startMonth.getMonth() + 1
    const monthsToShow = Math.min(Math.max(monthDiff, 1), 6) // Show at least 1 month, at most 6 months

    const monthlyOverview = await sql`
      WITH date_series AS (
        SELECT generate_series(
          date_trunc('month', ${startDate}::date),
          date_trunc('month', ${endDate}::date),
          interval '1 month'
        )::date as month_start
      )
      SELECT 
        to_char(d.month_start, 'Mon') as month,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as expenses
      FROM date_series d
      LEFT JOIN transactions t ON 
        t.date >= d.month_start AND 
        t.date < (d.month_start + interval '1 month')::date
      GROUP BY d.month_start
      ORDER BY d.month_start
      LIMIT ${monthsToShow}
    `

    // Get category breakdown
    const categoryBreakdown = await sql`
      SELECT 
        c.name, 
        COALESCE(SUM(t.amount), 0) as value
      FROM categories c
      LEFT JOIN transactions t ON 
        t.category_id = c.id AND 
        t.type = 'expense' AND
        t.date BETWEEN ${startDate} AND ${endDate}
      GROUP BY c.name
      HAVING COALESCE(SUM(t.amount), 0) > 0
      ORDER BY value DESC
    `

    // Get recent transactions
    const recentTransactions = await sql`
      SELECT t.*, c.name as category
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.date BETWEEN ${startDate} AND ${endDate}
      ORDER BY t.date DESC
      LIMIT 5
    `

    return NextResponse.json({
      summary: {
        balance: {
          value: financialSummary[0].balance,
          change: balanceChange.toFixed(1),
        },
        income: {
          value: financialSummary[0].total_income,
          change: incomeChange.toFixed(1),
        },
        expenses: {
          value: financialSummary[0].total_expenses,
          change: expensesChange.toFixed(1),
        },
        budget: {
          total: totalBudget[0].total_budget,
          remaining: budgetRemaining,
          percentage: budgetPercentage.toFixed(1),
        },
      },
      monthlyOverview,
      categoryBreakdown,
      recentTransactions,
      dateRange: {
        startDate,
        endDate,
        previousPeriod: {
          startDate: previousPeriodStartDate,
          endDate: previousPeriodEndDate,
        },
      },
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json({ message: "Failed to fetch dashboard data", error: String(error) }, { status: 500 })
  }
}
