import * as React from "react"
import { cn } from "../../lib/utils"

const Checkbox = React.forwardRef(({ className, checked, ...props }, ref) => (
  <input
    type="checkbox"
    ref={ref}
    checked={checked}
    className={cn(
      "h-5 w-5 rounded border-2 border-input bg-background",
      "focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "cursor-pointer transition-colors",
      "checked:bg-primary checked:border-primary",
      "dark:border-gray-600 dark:bg-gray-800",
      "dark:checked:bg-primary dark:checked:border-primary",
      "dark:focus:ring-primary dark:focus:ring-offset-gray-800",
      className
    )}
    {...props}
  />
))
Checkbox.displayName = "Checkbox"

export { Checkbox }
