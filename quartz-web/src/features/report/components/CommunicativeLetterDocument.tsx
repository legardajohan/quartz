import { Document, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { STATUS_ICON_JPG } from "../statusVisuals";
import LetterPageShell from "./LetterPageShell";
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

interface CommunicativeLetterDocumentProps {
  report: ICommunicativeLetterTemplate;
  shieldSrc?: string | null;
}

export default function CommunicativeLetterDocument({ report, shieldSrc }: CommunicativeLetterDocumentProps) {
  const { institution, period, teacher, student, subjects, observations, generatedAt } = report;
  const hasObservations = !!observations && observations.trim().length > 0;

  return (
    <Document title={`Carta Comunicativa - ${formatFullName(student)}`}>
      <LetterPageShell institution={institution} period={period} student={student} shieldSrc={shieldSrc} generatedAt={generatedAt}>
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
      </LetterPageShell>
    </Document>
  );
}

const styles = StyleSheet.create({
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
});
