import type { ReactNode } from "react";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../dialog/Dialog";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  closeLabel: string;
}

/**
 * Prop-driven convenience API over `Dialog` for simple confirm/alert-style
 * dialogs — use `Dialog`/`DialogContent` directly for anything more custom.
 * Deliberately built on the same primitive rather than a second
 * implementation (see docs/design-system.md, "no duplicated code").
 */
export function Modal({ open, onOpenChange, title, description, children, footer, closeLabel }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={closeLabel}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
