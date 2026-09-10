import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { STATUS_ICON_JPG, REPORT_FOOTER_BANNER } from "../statusVisuals";
import type { ICommunicativeLetterTemplate, QualitativeValuation } from "../types";

const VALUATION_COLORS: Record<QualitativeValuation, string> = {
  Logrado: "#16a34a",
  "En proceso": "#d97706",
  "Con dificultad": "#dc2626",
};

interface PersonName {
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
}

function formatFullName(person: PersonName): string {
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

interface CommunicativeLetterDocumentProps {
  report: ICommunicativeLetterTemplate;
  shieldSrc?: string | null;
}

export default function CommunicativeLetterDocument({ report, shieldSrc }: CommunicativeLetterDocumentProps) {
  const { institution, period, teacher, student, subjects, observations, generatedAt } = report;
  const hasObservations = !!observations && observations.trim().length > 0;

  return (
    <Document title={`Carta Comunicativa - ${formatFullName(student)}`}>
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

        {subjects.map((subject) => (
          <View style={styles.subjectRow} key={subject.subjectId} wrap>
            <View style={styles.subjectMain}>
              <View style={styles.subjectHeaderRow} minPresenceAhead={36}>
                <Text style={styles.subjectHeaderText}>Dimensión {subject.subjectName}</Text>
              </View>
              <View style={styles.conceptBox}>
                <Text style={styles.conceptText}>
                  {subject.conceptText || "Sin descripción registrada."}
                </Text>
              </View>
            </View>
            {subject.valuationType && (
              <View style={styles.statusColumn}>
                <Image src={STATUS_ICON_JPG[subject.valuationType]} style={styles.statusIcon} />
                <View style={styles.statusBadge}>
                  <View style={[styles.levelDot, { backgroundColor: VALUATION_COLORS[subject.valuationType] }]} />
                  <Text style={[styles.statusBadgeText, { color: VALUATION_COLORS[subject.valuationType] }]}>
                    {subject.valuationType}
                  </Text>
                </View>
              </View>
            )}
          </View>
        ))}

        {hasObservations && (
          <View style={styles.observationsBlock} wrap>
            <Text style={styles.subjectHeaderText} minPresenceAhead={36}>Observaciones</Text>
            <View style={styles.conceptBox}>
              <Text style={styles.conceptText}>{observations}</Text>
            </View>
          </View>
        )}

        <View style={styles.footer} wrap={false}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.teacherName}>{formatFullName(teacher)}</Text>
            <Text style={styles.teacherRole}>Docente · {teacher.school}</Text>
          </View>
        </View>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />

        <Image src={REPORT_FOOTER_BANNER} style={styles.footerBanner} fixed />
      </Page>
    </Document>
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
// Espacio entre el número de página y el borde superior del footer (quedan pegados), y entre
// el número de página y el contenido normal (dimensiones/observaciones/firma) por encima.
const FOOTER_GAP = 6;
const PAGE_NUMBER_ROW = 14;

const styles = StyleSheet.create({
  page: {
    paddingTop: ONE_CM,
    paddingLeft: ONE_CM,
    paddingRight: ONE_CM,
    paddingBottom: ONE_CM + FOOTER_HEIGHT + FOOTER_GAP + PAGE_NUMBER_ROW,
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
  subjectRow: {
    flexDirection: "row",
    marginBottom: 14,
  },
  subjectMain: {
    flex: 1,
    marginRight: 10,
  },
  subjectHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#581c87",
    padding: 6,
  },
  subjectHeaderText: {
    color: "#ffffff",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  statusColumn: {
    width: 110,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderStyle: "solid",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    paddingVertical: 10,
  },
  statusIcon: {
    width: 68,
    height: 68,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  levelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusBadgeText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  conceptBox: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderStyle: "solid",
    borderTopWidth: 0,
    padding: 10,
  },
  conceptText: {
    fontSize: 10,
    color: "#374151",
    lineHeight: 1.5,
    textAlign: "justify",
  },
  observationsBlock: {
    marginBottom: 12,
  },
  footer: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  signatureBlock: {
    alignItems: "center",
    width: 220,
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#9ca3af",
    borderTopStyle: "solid",
    width: "100%",
    marginBottom: 4,
    marginTop: 30,
  },
  teacherName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  teacherRole: {
    fontSize: 7,
    color: "#6b7280",
  },
  pageNumber: {
    // Pegado justo encima del footer (FOOTER_GAP), alineado a la derecha con el margen de 1cm.
    position: "absolute",
    bottom: ONE_CM + FOOTER_HEIGHT + FOOTER_GAP,
    right: ONE_CM,
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
