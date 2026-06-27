import * as React from "react"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"

export function Dialog({ open, onOpenChange, children, className }: { open: boolean, onOpenChange: (open: boolean) => void, children: React.ReactNode, className?: string }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-0">
      <div 
        className="fixed inset-0" 
        onClick={() => onOpenChange(false)} 
      />
      <div className={cn("relative z-50 grid w-full max-w-lg gap-4 border bg-card text-card-foreground p-6 shadow-xl duration-200 rounded-xl", className)}>
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </button>
        {children}
      </div>
    </div>
  )
}
