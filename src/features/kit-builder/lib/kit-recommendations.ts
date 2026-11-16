
import type {
  KitComponent,
  KitComponentType,
} from "@/server/modules/kit-components/domain/kit-component.repository";

export interface KitRecommendation {
  id: string;
  title: string;
  message: string;
  suggestedType?: KitComponentType;
}

export function getKitRecommendations(
  components: KitComponent[],
  quantities: Record<string, number>
): KitRecommendation[] {
  const selectedComponents = components.filter(
    (component) => (quantities[component.id] ?? 0) > 0
  );

  if (selectedComponents.length === 0) {
    return [];
  }

  const selectedTypes = new Set(
    selectedComponents.map((component) => component.type)
  );

  const recommendations: KitRecommendation[] = [];

  const hasType = (type: KitComponentType) =>
    selectedTypes.has(type);

  const isAvailable = (type: KitComponentType) =>
    components.some(
      (component) =>
        component.type === type && component.stock > 0
    );

  // Si selecciona semillas, sugerir sustrato.
  if (
    hasType("SEED") &&
    !hasType("SUBSTRATE") &&
    isAvailable("SUBSTRATE")
  ) {
    recommendations.push({
      id: "suggest-substrate",
      title: "¿Ya tienes tierra para cultivar?",
      message:
        "Podrías agregar sustrato para facilitar la siembra de tus semillas.",
      suggestedType: "SUBSTRATE",
    });
  }

  // Si selecciona semillas, sugerir abono.
  if (
    hasType("SEED") &&
    !hasType("FERTILIZER") &&
    isAvailable("FERTILIZER")
  ) {
    recommendations.push({
      id: "suggest-fertilizer",
      title: "Nutrición para tus plantas",
      message:
        "Considera incluir abono orgánico para complementar el cuidado de tus cultivos.",
      suggestedType: "FERTILIZER",
    });
  }

  // Si selecciona semillas, sugerir maceta.
  if (
    hasType("SEED") &&
    !hasType("POT") &&
    isAvailable("POT")
  ) {
    recommendations.push({
      id: "suggest-pot",
      title: "¿Dónde vas a sembrar?",
      message:
        "Si no cuentas con un espacio de cultivo, podrías agregar una maceta.",
      suggestedType: "POT",
    });
  }

  // Si selecciona maceta o sustrato sin semillas.
  if (
    (hasType("POT") || hasType("SUBSTRATE")) &&
    !hasType("SEED") &&
    isAvailable("SEED")
  ) {
    recommendations.push({
      id: "suggest-seeds",
      title: "¿Qué te gustaría cultivar?",
      message:
        "Puedes explorar nuestras semillas de hortalizas y plantas aromáticas.",
      suggestedType: "SEED",
    });
  }

  // Recomendar herramientas si hay elementos de cultivo.
  if (
    (hasType("SEED") ||
      hasType("SUBSTRATE") ||
      hasType("POT")) &&
    !hasType("TOOL") &&
    isAvailable("TOOL")
  ) {
    recommendations.push({
      id: "suggest-tools",
      title: "Herramientas para comenzar",
      message:
        "Una pala o un trasplantador podrían facilitar la preparación de tu huerto.",
      suggestedType: "TOOL",
    });
  }

  // Recomendar guía para quienes están comenzando.
  if (
    hasType("SEED") &&
    !hasType("GUIDE") &&
    isAvailable("GUIDE")
  ) {
    recommendations.push({
      id: "suggest-guide",
      title: "Una ayuda para tus primeras siembras",
      message:
        "Puedes incluir nuestra guía básica de siembra para acompañar tu experiencia.",
      suggestedType: "GUIDE",
    });
  }

  return recommendations;
}
