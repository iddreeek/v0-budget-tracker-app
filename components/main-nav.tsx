"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface MainNavProps {
  className?: string
}

export function MainNav({ className }: MainNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const routes = [
    { href: "/", label: "Dashboard" },
    { href: "/transactions", label: "Transactions" },
    { href: "/budgets", label: "Budgets" },
  ]

  return (
    <>
      {/* Mobile Navigation */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] sm:w-[300px]">
            <nav className="flex flex-col gap-4 mt-8">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary px-2 py-2 rounded-md",
                    pathname === route.href || (route.href !== "/" && pathname.startsWith(route.href))
                      ? "bg-muted text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  {route.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Navigation */}
      <nav className={cn("hidden md:flex items-center space-x-4 lg:space-x-6", className)}>
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === route.href || (route.href !== "/" && pathname.startsWith(route.href))
                ? "text-primary"
                : "text-muted-foreground",
            )}
          >
            {route.label}
          </Link>
        ))}
      </nav>
    </>
  )
}
