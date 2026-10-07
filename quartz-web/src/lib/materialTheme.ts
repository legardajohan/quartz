// Tema compartido para @material-tailwind/react (ver ThemeProvider en `main.tsx`).
// Reduce el tamaño de texto por defecto de Input/Select/Textarea (`md`, el único tamaño
// usado en la app) para que sea proporcional al resto de la UI; el resto del tema
// (colores, alturas, paddings) se hereda sin tocar.
export const materialTheme = {
  input: {
    styles: {
      base: {
        label: { fontSize: "peer-placeholder-shown:text-xs" },
      },
      variants: {
        outlined: {
          sizes: {
            md: { input: { fontSize: "text-xs" } },
          },
        },
      },
    },
  },
  textarea: {
    styles: {
      base: {
        label: { fontSize: "peer-placeholder-shown:text-xs" },
      },
      variants: {
        outlined: {
          sizes: {
            md: { textarea: { fontSize: "text-xs" } },
          },
        },
      },
    },
  },
  select: {
    styles: {
      variants: {
        outlined: {
          sizes: {
            md: { select: { fontSize: "text-xs" } },
          },
          states: {
            close: { label: { fontSize: "text-xs" } },
          },
        },
      },
    },
  },
};
