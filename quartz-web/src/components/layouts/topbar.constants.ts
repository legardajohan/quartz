/**
 * Altura única para la fila superior de marca/usuario, compartida entre `ProfileNavbar`
 * (header) y `SidebarMenu` (cabecera del sidebar). Ambas filas parten del mismo origen
 * vertical (y=0 del viewport: el sidebar es `fixed top-0` y el header es el primer hijo
 * de flujo de la página), así que si ambas fijan esta MISMA altura explícita, su centro
 * vertical coincide siempre —sin importar paddings, breakpoints o contenido interno—
 * evitando que vuelvan a desalinearse al alternar el sidebar.
 */
export const TOPBAR_HEIGHT_CLASS = "h-20";
