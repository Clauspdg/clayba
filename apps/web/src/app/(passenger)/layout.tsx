import { PassengerShell } from "@/components/PassengerShell";

export default function PassengerLayout({ children }: { children: React.ReactNode }) {
  return <PassengerShell>{children}</PassengerShell>;
}
