"use client";

import { useActionState } from "react";
import {
  addDirectoryContactAction,
  deleteDirectoryContactAction,
  type OpsActionState,
} from "@/app/(desk)/ops-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DirectoryContact } from "@/lib/data/ops";

const initial: OpsActionState = { error: null };

export function DirectoryPanel({ contacts }: { contacts: DirectoryContact[] }) {
  const [addState, addAction, addPending] = useActionState(
    addDirectoryContactAction,
    initial,
  );
  const [delState, delAction, delPending] = useActionState(
    deleteDirectoryContactAction,
    initial,
  );

  return (
    <div className="flex flex-col gap-4">
      {contacts.length === 0 ? (
        <p className="text-sm text-neutral-500">Rehber boş.</p>
      ) : (
        <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {contacts.map((contact) => (
            <li key={contact.id} className="flex items-center justify-between gap-2 px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{contact.name}</p>
                <p className="text-neutral-500">{contact.phone || contact.note}</p>
              </div>
              <form action={delAction}>
                <input type="hidden" name="id" value={contact.id} />
                <Button type="submit" size="sm" variant="outline" disabled={delPending}>
                  Sil
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
      {delState.error ? <p className="text-sm text-red-700">{delState.error}</p> : null}

      <form action={addAction} className="grid gap-2 rounded-2xl border border-neutral-200 bg-white p-4">
        <Label htmlFor="name">Ad</Label>
        <Input id="name" name="name" required />
        <Label htmlFor="phone">Telefon</Label>
        <Input id="phone" name="phone" inputMode="tel" />
        <Label htmlFor="note">Not</Label>
        <Input id="note" name="note" />
        <Button type="submit" disabled={addPending}>
          Ekle
        </Button>
        {addState.error ? <p className="text-sm text-red-700">{addState.error}</p> : null}
      </form>
    </div>
  );
}
