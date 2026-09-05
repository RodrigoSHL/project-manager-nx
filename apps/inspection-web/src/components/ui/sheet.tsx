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
  side?: 'left' | 'right';
};

function SheetContent({
  side = 'right',
  className,
  children,
  ...props
}: SheetContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-slate-950/50" />
      <DialogPrimitive.Content
        className={cn(
          'fixed inset-y-0 z-50 flex h-full flex-col shadow-xl',
          side === 'left' ? 'left-0' : 'right-0',
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-3 top-3 grid size-10 place-items-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white">
          <X className="size-5" />
          <span className="sr-only">Cerrar menú</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export { Sheet, SheetContent, SheetDescription, SheetTitle };
