"use client";

import { Trash } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DeleteConfirmButton({
  itemLabel,
  onConfirm,
  pending,
  variant = "icon",
}: {
  itemLabel: string;
  onConfirm: () => void;
  pending?: boolean;
  variant?: "icon" | "full";
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          variant === "icon" ? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Hapus ${itemLabel}`}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash className="size-4" />
            </Button>
          ) : (
            <Button variant="destructive" disabled={pending}>
              <Trash className="size-4" />
              {pending ? "Menghapus..." : "Hapus"}
            </Button>
          )
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus {itemLabel}?</AlertDialogTitle>
          <AlertDialogDescription>
            Tindakan ini tidak bisa dibatalkan. Data akan dihapus secara permanen.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={onConfirm}
          >
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
