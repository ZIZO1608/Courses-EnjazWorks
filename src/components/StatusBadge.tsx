import type { RegistrationStatus } from "@/db/schema";

const styles: Record<RegistrationStatus, string> = {
  pending: "bg-warn-bg text-warn",
  accepted: "bg-ok-bg text-ok",
  rejected: "bg-bad-bg text-bad",
  waitlist: "bg-tint text-brand",
  cancelled: "bg-gray-100 text-gray-600",
};

export function StatusBadge({ status, label }: { status: RegistrationStatus; label: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${styles[status]}`}>
      {label}
    </span>
  );
}
