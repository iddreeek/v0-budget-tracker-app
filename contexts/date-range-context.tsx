"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { DateRange } from "react-day-picker"

type DateRangeContextType = {
  dateRange: DateRange
  setDateRange: (range: DateRange) => void
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined)

export function DateRangeProvider({ children }: { children: ReactNode }) {
  // Default to current month
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  })

  return <DateRangeContext.Provider value={{ dateRange, setDateRange }}>{children}</DateRangeContext.Provider>
}

export function useDateRange() {
  const context = useContext(DateRangeContext)
  if (context === undefined) {
    throw new Error("useDateRange must be used within a DateRangeProvider")
  }
  return context
}

// Predefined date ranges
export function getCurrentMonth(): DateRange {
  const today = new Date()
  return {
    from: new Date(today.getFullYear(), today.getMonth(), 1),
    to: new Date(today.getFullYear(), today.getMonth() + 1, 0),
  }
}

export function getLastMonth(): DateRange {
  const today = new Date()
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  return {
    from: lastMonth,
    to: new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0),
  }
}

export function getLast3Months(): DateRange {
  const today = new Date()
  return {
    from: new Date(today.getFullYear(), today.getMonth() - 2, 1),
    to: today,
  }
}

export function getLast6Months(): DateRange {
  const today = new Date()
  return {
    from: new Date(today.getFullYear(), today.getMonth() - 5, 1),
    to: today,
  }
}

export function getCurrentYear(): DateRange {
  const today = new Date()
  return {
    from: new Date(today.getFullYear(), 0, 1),
    to: new Date(today.getFullYear(), 11, 31),
  }
}
