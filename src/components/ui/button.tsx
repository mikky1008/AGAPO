import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 tracking-wide",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[hsl(231_70%_55%)] to-[hsl(262_60%_62%)] text-white shadow-[0_4px_16px_hsl(231_70%_55%/0.35)] hover:shadow-[0_6px_24px_hsl(231_70%_55%/0.50)] hover:-translate-y-0.5 active:translate-y-0",
        destructive:
          "bg-gradient-to-r from-destructive to-red-500 text-destructive-foreground shadow-[0_4px_16px_hsl(0_72%_56%/0.30)] hover:shadow-[0_6px_24px_hsl(0_72%_56%/0.45)] hover:-translate-y-0.5",
        outline:
          "border border-white/60 bg-white/50 backdrop-blur-sm hover:bg-white/70 text-foreground shadow-[0_2px_8px_hsl(0_0%_0%/0.06)] hover:shadow-[0_4px_16px_hsl(231_70%_55%/0.12)] hover:-translate-y-0.5",
        secondary:
          "bg-gradient-to-r from-[hsl(262_60%_62%)] to-[hsl(200_85%_52%)] text-white shadow-[0_4px_16px_hsl(262_60%_62%/0.30)] hover:shadow-[0_6px_24px_hsl(262_60%_62%/0.45)] hover:-translate-y-0.5",
        ghost:
          "hover:bg-white/50 hover:backdrop-blur-sm hover:text-foreground text-muted-foreground transition-colors",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
