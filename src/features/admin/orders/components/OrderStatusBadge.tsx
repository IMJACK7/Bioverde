
import type { OrderStatus } from "@/generated/prisma/enums";

type OrderStatusBadgeProps = {
  status: OrderStatus;
};

const statusConfig: Record<
  OrderStatus,
  {
    label: string;
    className: string;
  }
> = {
  PENDING: {
    label: "Pendiente",
    className: "bg-amber-100 text-amber-800",
  },
  CONFIRMED: {
    label: "Confirmado",
    className: "bg-blue-100 text-blue-800",
  },
  PAID: {
    label: "Pagado",
    className: "bg-emerald-100 text-emerald-800",
  },
  COMPLETED: {
    label: "Completado",
    className: "bg-green-100 text-green-800",
  },
  CANCELLED: {
    label: "Cancelado",
    className: "bg-red-100 text-red-800",
  },
};

export default function OrderStatusBadge({
  status,
}: OrderStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}
