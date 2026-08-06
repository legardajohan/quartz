import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
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
}

export default function CommunicativeLetterDocument({ report }: CommunicativeLetterDocumentProps) {
  const { institution, period, teacher, student, subjects, observations, generatedAt } = report;
  const hasObservations = !!observations && observations.trim().length > 0;

  return (
    <Document title={`Carta Comunicativa - ${formatFullName(student)}`}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.shieldBox}>
            <Text style={styles.shieldPlaceholderText}>Escudo</Text>
          </View>
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

        <Text style={styles.intro}>
          A continuación se presenta el desempeño de {formatFullName(student)} durante {period.name} {period.year},
          según lo valorado por el docente en cada dimensión.
        </Text>

        {subjects.map((subject) => (
          <View style={styles.subjectBlock} key={subject.subjectId} wrap>
            <View style={styles.subjectHeaderRow} minPresenceAhead={36}>
              <Text style={styles.subjectHeaderText}>Dimensión {subject.subjectName}</Text>
              {subject.valuationType && (
                <View style={styles.levelBadge}>
                  <View style={[styles.levelDot, { backgroundColor: VALUATION_COLORS[subject.valuationType] }]} />
                  <Text style={styles.levelBadgeText}>{subject.valuationType}</Text>
                </View>
              )}
            </View>
            <View style={styles.conceptBox}>
              <Text style={styles.conceptText}>
                {subject.conceptText || "Sin descripción registrada."}
              </Text>
            </View>
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
      </Page>
    </Document>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
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
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  shieldPlaceholderText: {
    fontSize: 6,
    color: "#9ca3af",
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
  intro: {
    fontSize: 9,
    color: "#4b5563",
    lineHeight: 1.5,
    marginBottom: 16,
  },
  subjectBlock: {
    marginBottom: 14,
  },
  subjectHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#581c87",
    padding: 6,
  },
  subjectHeaderText: {
    color: "#ffffff",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
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
  levelBadgeText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
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
    position: "absolute",
    bottom: 20,
    right: 40,
    fontSize: 7,
    color: "#9ca3af",
  },
});
