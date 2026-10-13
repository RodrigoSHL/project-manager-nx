import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

const Sheet = DialogPrimitive.Root;
const SheetTitle = DialogPrimitive.Title;
const SheetDescription = DialogPrimitive.Description;

type SheetContentProps = React.ComponentProps<
  typeof DialogPrimitive.Content
> & {
  side?: 'left' | 'right' | 'bottom';
  closeLabel?: string;
};

function SheetContent({
  side = 'right',
  closeLabel = 'Cerrar menú',
  className,
  children,
  ...props
}: SheetContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-slate-950/50" />
      <DialogPrimitive.Content
        className={cn(
          'fixed z-50 flex flex-col shadow-xl',
          side === 'bottom'
            ? 'inset-x-0 bottom-0 max-h-[90dvh] rounded-t-2xl bg-white'
            : `inset-y-0 h-full ${side === 'left' ? 'left-0' : 'right-0'}`,
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className={cn(
            'absolute right-3 top-3 grid size-11 place-items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400',
            side === 'bottom'
              ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              : 'text-slate-300 hover:bg-white/10 hover:text-white'
          )}
        >
          <X className="size-5" />
          <span className="sr-only">{closeLabel}</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export { Sheet, SheetContent, SheetDescription, SheetTitle };
