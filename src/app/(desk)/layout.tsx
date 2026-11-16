import { DeskFrame } from "@/components/shells/desk-frame";

export default function DeskLayout({ children }: { children: React.ReactNode }) {
  return <DeskFrame>{children}</DeskFrame>;
}
