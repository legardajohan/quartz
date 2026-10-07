import { ReactNode } from "react";
import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { REPORT_FOOTER_BANNER } from "../statusVisuals";
import type { IReportInstitution, IReportPeriod, IReportStudent } from "../types";

function formatFullName(person: { firstName: string; middleName?: string; lastName: string; secondLastName?: string }): string {
  return [person.firstName, person.middleName, person.lastName, person.secondLastName]
    .filter(Boolean)
    .join(" ");
}

function formatPrintDate(iso: string): string {
  const date = new Date(iso);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

interface LetterPageShellProps {
  institution: IReportInstitution;
  period: IReportPeriod;
  student: IReportStudent;
  shieldSrc?: string | null;
  generatedAt: string;
  children: ReactNode;
}

export default function LetterPageShell({
  institution,
  period,
  student,
  shieldSrc,
  generatedAt,
  children,
}: LetterPageShellProps) {
  return (
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}>
        {shieldSrc && (
          <View style={styles.shieldBox}>
            <Image src={shieldSrc} style={styles.shieldImage} />
          </View>
        )}
        <View style={styles.institutionBlock}>
          <Text style={styles.institutionName}>{institution.name}</Text>
          <Text style={styles.institutionMeta}>
            {institution.address} · DANE {institution.daneCode}
          </Text>
          <Text style={styles.institutionMeta}>
            Rector(a): {institution.rectorName} · {institution.email}
          </Text>
          <Text style={styles.reportTitle}>
            Carta Comunicativa · {period.name} {period.year}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaColumnStudent}>
          <Text style={styles.metaLabel}>Estudiante</Text>
          <Text style={styles.metaValue} wrap={false}>{formatFullName(student)}</Text>
        </View>
        <View style={styles.metaColumnGrade}>
          <Text style={styles.metaLabel}>Grado</Text>
          <Text style={styles.metaValue}>{student.grade}</Text>
        </View>
        <View style={styles.metaColumnSchool}>
          <Text style={styles.metaLabel}>Sede</Text>
          <Text style={styles.metaValue}>{student.school.name}</Text>
        </View>
        <View style={styles.metaColumnDate}>
          <Text style={styles.metaLabel}>Fecha de impresión</Text>
          <Text style={styles.metaValue}>{formatPrintDate(generatedAt)}</Text>
        </View>
      </View>

      {children}

      <Image src={REPORT_FOOTER_BANNER} style={styles.footerBanner} fixed />

      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        fixed
      />
    </Page>
  );
}

// 1cm exacto (72pt/in ÷ 2.54cm/in). Márgenes izq./der./sup./inf. del documento impreso —
// el footer vive DENTRO de estos márgenes (no a sangre), igual que el resto del contenido.
const ONE_CM = 28.35;
// Ancho útil entre los márgenes izquierdo y derecho (tamaño LETTER = 612pt de ancho).
const CONTENT_WIDTH = 612 - 2 * ONE_CM;
// Alto del footer manteniendo el aspect ratio real de footer.jpg (1400×192) al ancho útil,
// sin recortar la imagen (incluye el logo "Powered by" en su esquina).
const FOOTER_HEIGHT = CONTENT_WIDTH * (192 / 1400);
// Espacio entre el contenido normal (dimensiones/observaciones/firma) y el borde superior del footer.
const FOOTER_GAP = 6;

const styles = StyleSheet.create({
  page: {
    paddingTop: ONE_CM,
    paddingLeft: ONE_CM,
    paddingRight: ONE_CM,
    paddingBottom: ONE_CM + FOOTER_HEIGHT + FOOTER_GAP,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1f2937",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#581c87",
    borderBottomStyle: "solid",
  },
  shieldBox: {
    width: 56,
    height: 56,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  shieldImage: {
    width: 56,
    height: 56,
    objectFit: "contain",
  },
  institutionBlock: {
    flex: 1,
  },
  institutionName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#581c87",
  },
  institutionMeta: {
    fontSize: 8,
    color: "#4b5563",
    marginTop: 2,
  },
  reportTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 8,
    textTransform: "uppercase",
    color: "#1f2937",
  },
  metaRow: {
    flexDirection: "row",
    marginTop: 4,
    marginBottom: 16,
  },
  metaColumnStudent: {
    flexDirection: "column",
    width: "42%",
  },
  metaColumnGrade: {
    flexDirection: "column",
    width: "15%",
  },
  metaColumnSchool: {
    flexDirection: "column",
    width: "23%",
  },
  metaColumnDate: {
    flexDirection: "column",
    width: "20%",
  },
  metaLabel: {
    fontSize: 7,
    color: "#6b7280",
    textTransform: "uppercase",
  },
  metaValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
  },
  pageNumber: {
    // Superpuesto a la esquina inferior derecha de la banda de footer, en su zona blanca
    // sin arte. El footer se pinta antes (orden de documento), así que el número queda encima.
    position: "absolute",
    bottom: ONE_CM + 8,
    right: ONE_CM + 12,
    fontSize: 7,
    color: "#9ca3af",
  },
  footerBanner: {
    // Dentro del margen de 1cm (izq./der./inf.), no a sangre. left/right fijos → Yoga calcula
    // el ancho como CONTENT_WIDTH automáticamente; height ya respeta ese mismo aspect ratio.
    position: "absolute",
    bottom: ONE_CM,
    left: ONE_CM,
    right: ONE_CM,
    height: FOOTER_HEIGHT,
    objectFit: "contain",
  },
});
