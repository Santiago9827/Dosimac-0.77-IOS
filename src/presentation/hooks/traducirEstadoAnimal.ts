export const traducirEstadoAnimal = (
    estado: string | null | undefined,
    t: (clave: string) => string
) => {
    if (!estado?.trim()) return "—";

    const estadoNormalizado = estado.trim().toLowerCase();

    const mapaEstados: Record<string, string> = {
        gestation: "animalState.gestation",
        maternity: "animalState.maternity",
        out_of_gestation: "animalState.out_of_gestation",
        out_of_maternity: "animalState.out_of_maternity",
    };

    const claveTraduccion = mapaEstados[estadoNormalizado];

    if (claveTraduccion) {
        return t(claveTraduccion);
    }

    return estado.replace(/_/g, " ");
};