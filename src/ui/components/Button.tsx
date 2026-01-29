import { forwardRef } from 'react';
import { cn } from "../lib/utils.ts";

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'default', ...props }, ref) => {
        return (
            <button
                className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium",
                    "ring-offset-background transition-all duration-200 ease-in-out",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
                    "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
                    "active:scale-95 cursor-pointer",
                    {
                        'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 hover:shadow-lg hover:shadow-[var(--color-primary)]/20 hover:-translate-y-0.5': variant === 'default',
                        'border border-[var(--color-border-dark)] bg-[var(--color-surface-dark)] text-[var(--color-text-primary)] hover:bg-[var(--color-border-dark)] hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)] hover:shadow-md': variant === 'outline',
                        'hover:bg-[var(--color-border-dark)] hover:text-[var(--color-text-primary)] text-[var(--color-text-muted)]': variant === 'ghost',
                        'text-[var(--color-primary)] underline-offset-4 hover:underline hover:text-[var(--color-primary)]/80': variant === 'link',
                        'h-10 px-4 py-2': size === 'default',
                        'h-9 rounded-md px-3': size === 'sm',
                        'h-11 rounded-md px-8': size === 'lg',
                        'h-10 w-10': size === 'icon',
                    },
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button };
