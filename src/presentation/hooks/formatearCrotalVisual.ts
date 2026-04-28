export const formatearCrotalVisual = (
    valor?: string | number | null
): string => {
    if (valor === null || valor === undefined) return "—";

    const textoOriginal = String(valor).trim();
    if (!textoOriginal || textoOriginal === "—") return "—";

    const limpio = textoOriginal.replace(/\s+/g, "").replace(/-/g, "");

    if (!/^\d+$/.test(limpio)) {
        return textoOriginal;
    }

    if (limpio.startsWith("982") && limpio.length > 3) {
        return `${limpio.slice(0, 3)}-${limpio.slice(3)}`;
    }

    return limpio;
};