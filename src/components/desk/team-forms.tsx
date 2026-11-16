"use client";

import { useActionState } from "react";
import {
  addAdvisorAction,
  addPinMemberAction,
  setMemberActiveAction,
  setMemberPinAction,
  type OpsActionState,
} from "@/app/(desk)/ops-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TeamMember } from "@/lib/data/ops";

const initial: OpsActionState = { error: null };

const ROLE_LABELS: Record<string, string> = {
  owner: "Patron",
  advisor: "Kabulcü",
  mechanic: "Usta",
  apprentice: "Çırak",
};

export function TeamPanel({ members }: { members: TeamMember[] }) {
  const [addState, addAction, addPending] = useActionState(addPinMemberAction, initial);
  const [advisorState, advisorAction, advisorPending] = useActionState(
    addAdvisorAction,
    initial,
  );
  const [pinState, pinAction, pinPending] = useActionState(setMemberPinAction, initial);
  const [activeState, activeAction, activePending] = useActionState(
    setMemberActiveAction,
    initial,
  );

  return (
    <div className="flex flex-col gap-6">
      <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        {members.map((member) => (
          <li key={member.id} className="px-4 py-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span>
                <span className="font-medium">{member.displayName}</span>
                <span className="ml-2 text-neutral-400">
                  {ROLE_LABELS[member.role] ?? member.role}
                </span>
              </span>
              <span className="text-neutral-400">
                {member.isActive ? "Aktif" : "Pasif"}
              </span>
            </div>
            {member.hasPin ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <form action={pinAction} className="flex gap-2">
                  <input type="hidden" name="membershipId" value={member.id} />
                  <Input
                    name="pin"
                    inputMode="numeric"
                    placeholder="Yeni PIN"
                    className="w-28"
                    required
                  />
                  <Button type="submit" size="sm" disabled={pinPending}>
                    PIN
                  </Button>
                </form>
                <form action={activeAction}>
                  <input type="hidden" name="membershipId" value={member.id} />
                  <input
                    type="hidden"
                    name="active"
                    value={member.isActive ? "false" : "true"}
                  />
                  <Button type="submit" size="sm" variant="outline" disabled={activePending}>
                    {member.isActive ? "Pasifleştir" : "Aktifleştir"}
                  </Button>
                </form>
              </div>
            ) : null}
            {member.role === "advisor" ? (
              <form action={activeAction} className="mt-2">
                <input type="hidden" name="membershipId" value={member.id} />
                <input
                  type="hidden"
                  name="active"
                  value={member.isActive ? "false" : "true"}
                />
                <Button type="submit" size="sm" variant="outline" disabled={activePending}>
                  {member.isActive ? "Pasifleştir" : "Aktifleştir"}
                </Button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
      {(pinState.error || activeState.error) && (
        <p className="text-sm text-red-700">{pinState.error || activeState.error}</p>
      )}

      <form action={addAction} className="grid gap-2 rounded-2xl border border-neutral-200 bg-white p-4">
        <h2 className="font-medium">Usta / çırak (PIN)</h2>
        <p className="text-xs text-neutral-500">
          Giriş: <span className="font-mono">/pin</span> + dükkan kodu + 4 haneli
          PIN. E-posta hesabı açılmaz.
        </p>
        <Label htmlFor="displayName">Ad</Label>
        <Input id="displayName" name="displayName" required />
        <Label htmlFor="role">Rol</Label>
        <select
          id="role"
          name="role"
          defaultValue="mechanic"
          className="h-11 rounded-lg border border-neutral-200 bg-white px-3"
        >
          <option value="mechanic">Usta</option>
          <option value="apprentice">Çırak</option>
        </select>
        <Label htmlFor="pin">PIN</Label>
        <Input id="pin" name="pin" inputMode="numeric" placeholder="1234" required />
        <Button type="submit" disabled={addPending}>
          Ekle
        </Button>
        {addState.error ? <p className="text-sm text-red-700">{addState.error}</p> : null}
      </form>

      <form
        action={advisorAction}
        className="grid gap-2 rounded-2xl border border-neutral-200 bg-white p-4"
      >
        <h2 className="font-medium">Kabulcü (e-posta + şifre)</h2>
        <p className="text-xs text-neutral-500">
          Giriş: e-posta ve şifre (Google değil). Geçici bir şifre ver; ilk
          girişten sonra Hesap’tan değiştirebilsin.
        </p>
        <Label htmlFor="advisorName">Ad</Label>
        <Input id="advisorName" name="displayName" required />
        <Label htmlFor="advisorEmail">E-posta</Label>
        <Input id="advisorEmail" name="email" type="email" required />
        <Label htmlFor="advisorPassword">Geçici şifre</Label>
        <Input id="advisorPassword" name="password" type="password" required minLength={8} />
        <Button type="submit" disabled={advisorPending}>
          Kabulcü ekle
        </Button>
        {advisorState.error ? (
          <p className="text-sm text-red-700">{advisorState.error}</p>
        ) : null}
      </form>
    </div>
  );
}
