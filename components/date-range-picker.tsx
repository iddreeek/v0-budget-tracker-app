"use client"

import * as React from "react"
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  useDateRange,
  getCurrentMonth,
  getLastMonth,
  getLast3Months,
  getLast6Months,
  getCurrentYear,
} from "@/contexts/date-range-context"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

export function CalendarDateRangePicker({ className }: React.HTMLAttributes<HTMLDivElement>) {
  const { dateRange, setDateRange } = useDateRange()
  const [calendarOpen, setCalendarOpen] = React.useState(false)
  const [presetOpen, setPresetOpen] = React.useState(false)

  const presets = [
    { name: "Current Month", value: "current-month", range: getCurrentMonth() },
    { name: "Last Month", value: "last-month", range: getLastMonth() },
    { name: "Last 3 Months", value: "last-3-months", range: getLast3Months() },
    { name: "Last 6 Months", value: "last-6-months", range: getLast6Months() },
    { name: "This Year", value: "current-year", range: getCurrentYear() },
  ]

  // Format date to string
  const formatDate = (date: Date): string => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const day = date.getDate()
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    return `${month} ${day}, ${year}`
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex flex-col sm:flex-row gap-2">
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-full sm:w-[260px] justify-start text-left font-normal",
                !dateRange && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
                  </>
                ) : (
                  formatDate(dateRange.from)
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={(range) => {
                // Ensure we always have a complete range
                if (range?.from && !range.to) {
                  // If only from date is selected, set to date to the same day
                  setDateRange({ from: range.from, to: range.from })
                } else {
                  setDateRange(range || getCurrentMonth())
                }

                // Only close if we have a complete range
                if (range?.from && range?.to) {
                  setCalendarOpen(false)
                }
              }}
              numberOfMonths={2}
              className="hidden sm:block"
            />
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={(range) => {
                // Ensure we always have a complete range
                if (range?.from && !range.to) {
                  // If only from date is selected, set to date to the same day
                  setDateRange({ from: range.from, to: range.from })
                } else {
                  setDateRange(range || getCurrentMonth())
                }

                // Only close if we have a complete range
                if (range?.from && range?.to) {
                  setCalendarOpen(false)
                }
              }}
              numberOfMonths={1}
              className="block sm:hidden"
            />
          </PopoverContent>
        </Popover>

        <Popover open={presetOpen} onOpenChange={setPresetOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-[200px] justify-between">
              <span>Date Range</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search date range..." />
              <CommandList>
                <CommandEmpty>No presets found.</CommandEmpty>
                <CommandGroup>
                  {presets.map((preset) => (
                    <CommandItem
                      key={preset.value}
                      onSelect={() => {
                        setDateRange(preset.range)
                        setPresetOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isRangeEqual(dateRange, preset.range) ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {preset.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

// Helper function to check if two date ranges are equal
function isRangeEqual(range1: DateRange, range2: DateRange): boolean {
  if (!range1 || !range2) return false
  if (!range1.from || !range2.from || !range1.to || !range2.to) return false

  return range1.from.getTime() === range2.from.getTime() && range1.to.getTime() === range2.to.getTime()
}
