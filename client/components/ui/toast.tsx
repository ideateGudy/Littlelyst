import { Toaster, toast as hotToast } from 'react-hot-toast';

/**
 * Simple wrapper around `react-hot-toast` to provide a consistent API used in the codebase.
 *
 * The existing UI expects a `toast` function with the shape:
 *   toast({ title: string, description?: string, variant?: 'default' | 'destructive' })
 *
 * This implementation composes a readable message and forwards it to `react-hot-toast`.
 */
export function toast({
  title,
  description,
  variant = 'default',
}: {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}): void {
  const message = description ? `${title}: ${description}` : title;
  hotToast(message, {
    style: {
      background: variant === 'destructive' ? '#ef4444' : '#10b981',
      color: '#ffffff',
    },
    icon: variant === 'destructive' ? '⚠️' : '✅',
  });
}

/**
 * Export a `Toaster` component that should be placed once in the app (e.g. in the root layout).
 */
export const ToastProvider = () => <Toaster position="bottom-center" />;
