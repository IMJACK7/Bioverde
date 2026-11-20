
/**
 * BioVerde - Integración con WhatsApp
 *
 * Genera enlaces para comunicar pedidos
 * pendientes mediante WhatsApp.
 */

export interface WhatsAppOrderItem {
  name: string;
  variantName?: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  components?: {
    name: string;
    quantity: number;
  }[];
}

export interface WhatsAppOrderData {
  orderId: string;
  customerName: string;
  municipality: string;
  total: number;
  items: WhatsAppOrderItem[];
}

function formatCOP(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Obtiene el número de WhatsApp configurado.
 */
function getBioVerdeWhatsAppNumber(): string {
  const phone =
    process.env.NEXT_PUBLIC_BIOVERDE_WHATSAPP ?? "";

  const normalizedPhone = phone.replace(/\D/g, "");

  if (!/^\d{8,15}$/.test(normalizedPhone)) {
    throw new Error(
      "El número de WhatsApp de BioVerde no está configurado correctamente."
    );
  }

  return normalizedPhone;
}

/**
 * Construye el detalle de los artículos registrados.
 */

function formatOrderItems(
  items: WhatsAppOrderItem[]
): string[] {
  if (items.length === 0) {
    return [
      "No se recibió el detalle de los productos.",
    ];
  }

  return items.flatMap((item, index) => {
    const lines = [
      `${index + 1}. ${item.name}`,
    ];

    if (item.variantName) {
      lines.push(
        `   Variante: ${item.variantName}`
      );
    }

    lines.push(
      `   Cantidad: ${item.quantity}`,
      `   Precio unitario: ${formatCOP(item.unitPrice)}`,
      `   Subtotal: ${formatCOP(item.subtotal)}`
    );

    if (
      item.components &&
      item.components.length > 0
    ) {
      lines.push(
        "   Componentes por kit (cada unidad):"
      );

      for (const component of item.components) {
        lines.push(
          `   - ${component.quantity} x ${component.name}`
        );
      }
    }

    lines.push("");

    return lines;
  });
}


/**
 * Construye el mensaje que recibirá BioVerde.
 */
export function createOrderWhatsAppMessage(
  order: WhatsAppOrderData
): string {
  return [
    "*BIOVERDE - SOLICITUD DE PEDIDO*",
    "",
    "Hola, BioVerde.",
    "Quisiera continuar con mi solicitud de compra.",
    "",
    "*INFORMACIÓN DEL PEDIDO*",
    `Número: ${order.orderId}`,
    `Cliente: ${order.customerName}`,
    `Municipio: ${order.municipality}`,
    "",
    "*PRODUCTOS SOLICITADOS*",
    "",
    ...formatOrderItems(order.items),
    `*TOTAL REGISTRADO: ${formatCOP(order.total)}*`,
    "",
    "*ESTADO: PENDIENTE DE CONFIRMACIÓN*",
    "",
    "Entiendo que la disponibilidad de los productos y las condiciones de entrega deben confirmarse.",
    "",
    "¿Podrían indicarme los pasos para continuar con la compra?",
    "",
    "Muchas gracias.",
  ].join("\n");
}

/**
 * Construye un enlace de WhatsApp.
 *
 * No envía el mensaje automáticamente.
 */
export function createOrderWhatsAppUrl(
  order: WhatsAppOrderData
): string {
  const phone = getBioVerdeWhatsAppNumber();

  const message =
    createOrderWhatsAppMessage(order);

  return `https://wa.me/${phone}?text=${encodeURIComponent(
    message
  )}`;
}
