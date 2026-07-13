import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { IReportTemplate, QualitativeValuation } from "../types";

const VALUATION_COLORS: Record<QualitativeValuation, string> = {
  Logrado: "#16a34a",
  "En proceso": "#d97706",
  "Con dificultad": "#dc2626",
};

const VALUATION_ORDER: QualitativeValuation[] = ["Logrado", "En proceso", "Con dificultad"];

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
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

interface ChecklistReportDocumentProps {
  report: IReportTemplate;
}

export default function ChecklistReportDocument({ report }: ChecklistReportDocumentProps) {
  const { institution, period, teacher, student, valuation, generatedAt } = report;

  return (
    <Document title={`Lista de Chequeo - ${formatFullName(student)}`}>
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
              Lista de Chequeo · {period.name} {period.year}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaColumn}>
            <Text style={styles.metaLabel}>Estudiante</Text>
            <Text style={styles.metaValue}>{formatFullName(student)}</Text>
          </View>
          <View style={styles.metaColumn}>
            <Text style={styles.metaLabel}>Grado</Text>
            <Text style={styles.metaValue}>{student.grade}</Text>
          </View>
          <View style={styles.metaColumn}>
            <Text style={styles.metaLabel}>Sede</Text>
            <Text style={styles.metaValue}>{student.school.name}</Text>
          </View>
          <View style={styles.metaColumnLast}>
            <Text style={styles.metaLabel}>Fecha de impresión</Text>
            <Text style={styles.metaValue}>{formatPrintDate(generatedAt)}</Text>
          </View>
        </View>

        <View style={styles.legend}>
          {VALUATION_ORDER.map((label) => (
            <View style={styles.legendItem} key={label}>
              <View style={[styles.legendDot, { backgroundColor: VALUATION_COLORS[label] }]} />
              <Text style={styles.legendText}>{label}</Text>
            </View>
          ))}
        </View>

        {valuation.valuationsBySubject.map((subject) => (
          <View style={styles.subjectBlock} key={subject.subjectId} wrap={false}>
            <Text style={styles.subjectHeader}>{subject.subjectName}</Text>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.colNo, styles.headerCell]}>No</Text>
              <Text style={[styles.colLearning, styles.headerCell]}>Aprendizajes</Text>
              <Text style={[styles.colValuation, styles.headerCell]}>Valoración</Text>
            </View>
            {subject.learningValuations.map((lv, index) => (
              <View style={styles.tableRow} key={lv.learningId}>
                <Text style={styles.colNo}>{index + 1}</Text>
                <Text style={styles.colLearning}>{lv.learningDescription}</Text>
                <View style={styles.colValuation}>
                  {lv.qualitativeValuation && (
                    <View
                      style={[styles.radio, { backgroundColor: VALUATION_COLORS[lv.qualitativeValuation] }]}
                    />
                  )}
                </View>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.footer}>
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
    marginBottom: 14,
  },
  metaColumn: {
    flexDirection: "column",
    width: "25%",
  },
  metaColumnLast: {
    flexDirection: "column",
    width: "25%",
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
  legend: {
    flexDirection: "row",
    marginBottom: 14,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 4,
  },
  legendText: {
    fontSize: 7,
    color: "#4b5563",
  },
  subjectBlock: {
    marginBottom: 12,
  },
  subjectHeader: {
    backgroundColor: "#581c87",
    color: "#ffffff",
    padding: 6,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f3e8ff",
    borderBottomWidth: 1,
    borderBottomColor: "#d8b4fe",
    borderBottomStyle: "solid",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    borderBottomStyle: "solid",
  },
  colNo: {
    width: "8%",
    padding: 5,
    fontSize: 8,
  },
  colLearning: {
    width: "72%",
    padding: 5,
    fontSize: 8,
  },
  colValuation: {
    width: "20%",
    padding: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCell: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#581c87",
    textTransform: "uppercase",
  },
  radio: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
    fontSize: 9,
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
