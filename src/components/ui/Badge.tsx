'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'crystal-badge',
      success: 'crystal-badge-success',
      warning: 'crystal-badge-warning',
      error: 'crystal-badge-error',
      info: 'crystal-badge-info',
    };

    return (
      <span
        ref={ref}
        className={cn(variants[variant], className)}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
