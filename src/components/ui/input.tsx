import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-white/55 bg-white/60 backdrop-blur-md px-3 py-2 text-sm",
          "ring-offset-background placeholder:text-muted-foreground/60",
          "shadow-[inset_0_1px_3px_hsl(0_0%_0%/0.04),0_1px_2px_hsl(0_0%_0%/0.03)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-0",
          "focus-visible:border-primary/50 focus-visible:bg-white/75",
          "focus-visible:shadow-[0_0_0_3px_hsl(231_70%_55%/0.12),inset_0_1px_3px_hsl(0_0%_0%/0.04)]",
          "transition-all duration-200",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
