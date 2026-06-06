import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE_URL } from "../src/services/api";
import { getSession } from "../src/services/sessionService";
import { shadows, spacing } from "../src/theme";
import { resolveSchoolName } from "../src/utils/schoolUtils";

type HealthItem = {
  key: string;
  label: string;
  status: string;
  message: string;
};

type AuditItem = {
  eventType: string;
  title: string;
  description: string;
  status: string;
  eventAt?: string;
};

type ActivationOperationsCenter = {
  schoolId: string;
  schoolName: string;
  activationStatus: string;
  reportingStatus: string;
  readinessPercent: number;
  readyForActivation: boolean;
  tenantActive: boolean;
  operationsNote: string;
  timeline: {
    stepKey: string;
    title: string;
    status: string;
    note: string;
    eventAt?: string;
  }[];
  notesHistory: string[];
};

type WorkbookIssue = {
  sheetName?: string;
  rowNumber?: number;
  fieldName?: string;
  severity?: string;
  message?: string;
};

type WorkbookErrorGroup = {
  category: string;
  title: string;
  explanation: string;
  recommendedAction: string;
  errorCount: number;
  warningCount: number;
  issues: WorkbookIssue[];
};

type WorkbookErrorIntelligence = {
  schoolId: string;
  fileName: string;
  status: string;
  headline: string;
  totalErrors: number;
  totalWarnings: number;
  activationBlocked: boolean;
  missingSheets: string[];
  schoolIdMismatchExplanations: string[];
  groups: WorkbookErrorGroup[];
};

type ActivationSummary = {
  schoolId: string;
  schoolName: string;
  academicYear?: string;
  activationStatus: string;
  activationMessage: string;
  schoolProfileReady: boolean;
  academicYearReady: boolean;
  workspaceSetupReady: boolean;
  importCommitted: boolean;
  readyForActivation: boolean;
  readinessPercent: number;
  committedWorkbookCount: number;
  lastWorkbookCommittedAt?: string;
  tenantActive?: boolean;
  goLiveStatus?: string;
  activationButtonLabel?: string;
  activationStage?: string;
  tenantLifecycleStatus?: string;
  credentialProvisioningStatus?: string;
  activationSuccessTitle?: string;
  activationSuccessMessage?: string;
  activationNotifications?: string[];
  activatedBy?: string;
  activatedAt?: string;
  healthItems: HealthItem[];
  auditTrail: AuditItem[];
};

function unwrap<T>(payload: any): T {
  return payload?.data ?? payload;
}

function label(value?: string) {
  return String(value || "PENDING").replace(/_/g, " ");
}

function titleStatus(value?: string) {
  return label(value)
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function fmt(value?: string) {
  if (!value) return "Not available";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function titleCaseSchoolName(value?: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
    .replace(/\bErp\b/g, "ERP");
}

function isActiveSummary(summary?: ActivationSummary | null) {
  return (
    summary?.activationStatus === "ACTIVE" || summary?.tenantActive === true
  );
}

function activatedByLabel(summary?: ActivationSummary | null) {
  return isActiveSummary(summary) && summary?.activatedBy
    ? summary.activatedBy
    : "Not activated";
}

function activatedAtLabel(summary?: ActivationSummary | null) {
  return isActiveSummary(summary) && summary?.activatedAt
    ? fmt(summary.activatedAt)
    : "Not activated";
}

function activationCtaLabel(
  summary?: ActivationSummary | null,
  intel?: WorkbookErrorIntelligence | null,
) {
  if (!summary) return "Activation Pending";
  if (summary.readyForActivation)
    return summary.activationButtonLabel || "Activate Workspace";
  if (intel?.activationBlocked || (intel?.totalErrors || 0) > 0)
    return "Resolve Errors First";
  if (!summary.importCommitted) return "Workbook Pending";
  return "Activation Pending";
}

function normalizeOperationsTimeline(
  ops: ActivationOperationsCenter,
): ActivationOperationsCenter {
  const uploads = ops.timeline.filter(
    (item) =>
      item.stepKey === "WORKBOOK_IMPORT" &&
      item.title.toLowerCase().includes("workbook"),
  );
  if (uploads.length <= 1) return ops;
  const firstUpload = uploads[0];
  const previousCount = Math.max(uploads.length - 1, 0);
  const groupedUpload = {
    ...firstUpload,
    title: `Workbook uploaded (${uploads.length} attempts)`,
    note: `${firstUpload.note}${previousCount ? ` • Previous uploads: ${previousCount}` : ""}`,
  };
  const timeline: ActivationOperationsCenter["timeline"] = [];
  let uploadAdded = false;
  ops.timeline.forEach((item) => {
    if (
      item.stepKey === "WORKBOOK_IMPORT" &&
      item.title.toLowerCase().includes("workbook")
    ) {
      if (!uploadAdded) {
        timeline.push(groupedUpload);
        uploadAdded = true;
      }
      return;
    }
    timeline.push(item);
  });
  return { ...ops, timeline };
}

function normalizeAuditTrail(items: AuditItem[] = []) {
  const uploads = items.filter((item) =>
    item.title.toLowerCase().includes("workbook uploaded"),
  );
  if (uploads.length <= 1) return items;
  const firstUpload = uploads[0];
  const previousCount = Math.max(uploads.length - 1, 0);
  const grouped = {
    ...firstUpload,
    title: `Workbook uploaded (${uploads.length} attempts)`,
    description: `${firstUpload.description}${previousCount ? ` • Previous uploads: ${previousCount}` : ""}`,
  };
  const output: AuditItem[] = [];
  let added = false;
  items.forEach((item) => {
    if (item.title.toLowerCase().includes("workbook uploaded")) {
      if (!added) {
        output.push(grouped);
        added = true;
      }
      return;
    }
    output.push(item);
  });
  return output;
}

function groupByCategory(
  intel?: WorkbookErrorIntelligence | null,
  category?: string,
) {
  return intel?.groups?.find((group) => group.category === category);
}

function isCompactValidationGroup(group: WorkbookErrorGroup) {
  return [
    "TEACHER_ASSIGNMENT_ISSUES",
    "SCHEDULE_ISSUES",
    "MISSING_SHEETS",
    "SCHOOL_ID_MISMATCH",
  ].includes(group.category);
}

function compactValidationMessage(group: WorkbookErrorGroup) {
  if (group.category === "TEACHER_ASSIGNMENT_ISSUES") {
    return "Review workbook validation results in Web ERP. Verify Teachers, TeacherAssignments, TeacherPools, Subjects, and ClassSections before activation.";
  }
  if (group.category === "SCHEDULE_ISSUES") {
    return "Review workbook validation results in Web ERP. Complete Schedules, AcademicRules, Subjects, TeacherPools, and ClassSections before activation.";
  }
  if (group.category === "MISSING_SHEETS") {
    return "Add the missing workbook tabs using the VidyaSetu master workbook template and upload again.";
  }
  if (group.category === "SCHOOL_ID_MISMATCH") {
    return "Workbook school ID does not match the active workspace. Use the same 4-character school_id in SchoolProfile as the logged-in school workspace.";
  }
  return "Review workbook validation results in Web ERP for correction guidance.";
}

export default function WorkspaceHealthScreen() {
  const params = useLocalSearchParams<{ role?: string; sourceRole?: string }>();
  const session = getSession();
  const schoolId = String(session?.schoolId || "BRK1").toUpperCase();
  const sourceRole = String(
    params.sourceRole || params.role || session?.role || "admin",
  ).toLowerCase();
  const roleLabel = sourceRole === "principal" ? "Principal" : "Admin";
  const schoolName = titleCaseSchoolName(
    resolveSchoolName(schoolId, session?.schoolName),
  );
  const [summary, setSummary] = useState<ActivationSummary | null>(null);
  const [operations, setOperations] =
    useState<ActivationOperationsCenter | null>(null);
  const [errorIntel, setErrorIntel] =
    useState<WorkbookErrorIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showFullProgress, setShowFullProgress] = useState(false);

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      "X-School-Id": schoolId,
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
    }),
    [schoolId, session?.token],
  );

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/workspace-activation/summary?schoolId=${schoolId}`,
        { headers },
      );
      if (!response.ok) throw new Error("Unable to load Workspace Health.");
      const payload = await response.json();
      setSummary(unwrap<ActivationSummary>(payload));
      const operationsResponse = await fetch(
        `${API_BASE_URL}/workspace-activation/operations-center?schoolId=${schoolId}`,
        { headers },
      );
      if (operationsResponse.ok) {
        const operationsPayload = await operationsResponse.json();
        setOperations(
          normalizeOperationsTimeline(
            unwrap<ActivationOperationsCenter>(operationsPayload),
          ),
        );
      }
      const intelligenceResponse = await fetch(
        `${API_BASE_URL}/workspace-activation/error-intelligence?schoolId=${schoolId}`,
        { headers },
      );
      if (intelligenceResponse.ok) {
        const intelligencePayload = await intelligenceResponse.json();
        setErrorIntel(unwrap<WorkbookErrorIntelligence>(intelligencePayload));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load Workspace Health.",
      );
    } finally {
      setLoading(false);
    }
  }, [headers, schoolId]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  async function activateWorkspace() {
    if (!summary?.readyForActivation) return;
    setActivating(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/workspace-activation/activate?schoolId=${schoolId}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            activatedBy: session?.displayName || roleLabel,
            remarks: "Activated from mobile Workspace Health",
          }),
        },
      );
      if (!response.ok)
        throw new Error("Workspace activation could not be completed.");
      const payload = await response.json();
      setSummary(unwrap<ActivationSummary>(payload));
      const operationsResponse = await fetch(
        `${API_BASE_URL}/workspace-activation/operations-center?schoolId=${schoolId}`,
        { headers },
      );
      if (operationsResponse.ok) {
        const operationsPayload = await operationsResponse.json();
        setOperations(
          normalizeOperationsTimeline(
            unwrap<ActivationOperationsCenter>(operationsPayload),
          ),
        );
      }
      const intelligenceResponse = await fetch(
        `${API_BASE_URL}/workspace-activation/error-intelligence?schoolId=${schoolId}`,
        { headers },
      );
      if (intelligenceResponse.ok) {
        const intelligencePayload = await intelligenceResponse.json();
        setErrorIntel(unwrap<WorkbookErrorIntelligence>(intelligencePayload));
      }
      setNotice(
        "Workspace activation completed. School is now ready for Admin/Principal monitoring.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Workspace activation could not be completed.",
      );
    } finally {
      setActivating(false);
    }
  }

  const gates = summary
    ? [
        { title: "School Profile", ready: summary.schoolProfileReady },
        { title: "Academic Year", ready: summary.academicYearReady },
        { title: "Workspace Setup", ready: summary.workspaceSetupReady },
        { title: "Workbook Commit", ready: summary.importCommitted },
        {
          title: "Go-Live Status",
          ready:
            summary.activationStatus === "ACTIVE" || !!summary.tenantActive,
        },
      ]
    : [];

  const teacherGroup = groupByCategory(errorIntel, "TEACHER_ASSIGNMENT_ISSUES");
  const scheduleGroup = groupByCategory(errorIntel, "SCHEDULE_ISSUES");
  const missingGroup = groupByCategory(errorIntel, "MISSING_SHEETS");
  const schoolIdGroup = groupByCategory(errorIntel, "SCHOOL_ID_MISMATCH");

  return (
    <ImageBackground
      source={require("../assets/branding/splash-gold.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadSummary} />
        }
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.back()}
          >
            <Text style={styles.navIcon}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() =>
              router.replace(
                sourceRole === "principal"
                  ? "/principal-home"
                  : "/admin-dashboard",
              )
            }
          >
            <Text style={styles.homeIcon}>⌂</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.schoolName}>{schoolName}</Text>
        <Text style={styles.subtitle}>
          VidyaSetu ERP • {roleLabel} Activation Visibility
        </Text>

        {loading && !summary ? (
          <View style={styles.card}>
            <ActivityIndicator />
            <Text style={styles.cardText}>Loading workspace health...</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.alert}>
            <Text style={styles.alertText}>{error}</Text>
          </View>
        ) : null}
        {notice ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}

        {summary ? (
          <>
            <View style={styles.heroCard}>
              <Text style={styles.pill}>{label(summary.activationStatus)}</Text>
              <Text style={styles.heroTitle}>
                {titleCaseSchoolName(summary.schoolName || schoolName)}
              </Text>
              <Text style={styles.heroText}>
                {errorIntel?.headline || summary.activationMessage}
              </Text>
              <View style={styles.readinessRow}>
                <View>
                  <Text style={styles.readiness}>
                    {summary.readinessPercent}%
                  </Text>
                  <Text style={styles.smallText}>Activation readiness</Text>
                  <Text style={styles.smallText}>
                    Activated by: {activatedByLabel(summary)}
                  </Text>
                  <Text style={styles.smallText}>
                    Activation: {label(summary.activationStage || summary.activationStatus)}
                  </Text>
                  <Text style={styles.smallText}>
                    Lifecycle:{" "}
                    {label(
                      summary.tenantLifecycleStatus || summary.activationStatus,
                    )}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                disabled={!summary.readyForActivation || activating}
                style={[
                  styles.activateButton,
                  (!summary.readyForActivation || activating) &&
                    styles.disabled,
                ]}
                onPress={activateWorkspace}
              >
                <Text style={styles.activateText}>
                  {activating
                    ? "Checking..."
                    : activationCtaLabel(summary, errorIntel)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.gateGrid}>
              {gates.map((gate) => (
                <View
                  key={gate.title}
                  style={[
                    styles.gateCard,
                    gate.ready ? styles.gateReady : styles.gatePending,
                  ]}
                >
                  <Text style={styles.gateTitle}>{gate.title}</Text>
                </View>
              ))}
            </View>

            {errorIntel ? (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                  Workbook Error Intelligence
                </Text>
                <View style={styles.rowCard}>
                  <Text style={styles.blockedPill}>
                    {label(errorIntel.status)}
                  </Text>
                  <Text style={styles.rowTitle}>Workbook Validation Required</Text>
                  <Text style={styles.cardText}>
                    Resolve workbook validation issues before activation.
                  </Text>
                </View>
                <View style={styles.summaryGrid}>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>
                      {errorIntel.totalErrors}
                    </Text>
                    <Text style={styles.metricLabel}>Errors</Text>
                  </View>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>
                      {errorIntel.totalWarnings}
                    </Text>
                    <Text style={styles.metricLabel}>Warnings</Text>
                  </View>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>
                      {errorIntel.activationBlocked ? "Yes" : "No"}
                    </Text>
                    <Text style={styles.metricLabel}>Blocked</Text>
                  </View>
                </View>
                <View style={styles.rowCard}>
                  <Text style={styles.rowTitle}>Missing Sheets Summary</Text>
                  <Text style={styles.cardText}>
                    These workbook tabs are required before activation.
                  </Text>
                  <View style={styles.chipWrap}>
                    {(errorIntel.missingSheets || []).map((sheet) => (
                      <Text key={sheet} style={styles.errorChip}>
                        {sheet}
                      </Text>
                    ))}
                  </View>
                </View>
                {errorIntel.schoolIdMismatchExplanations?.length ? (
                  <View style={styles.rowCard}>
                    <Text style={styles.rowTitle}>
                      School ID Validation
                    </Text>
                    <Text style={styles.issueText}>
                      Workbook school ID does not match the active workspace.
                      Use the same 4-character school_id in SchoolProfile as the
                      logged-in school workspace.
                    </Text>
                  </View>
                ) : null}
                {[teacherGroup, scheduleGroup, missingGroup, schoolIdGroup]
                  .filter(Boolean)
                  .map((group) => (
                    <View key={group!.category} style={styles.rowCard}>
                      <Text style={styles.blockedPill}>
                        {group!.errorCount} Errors • {group!.warningCount}{" "}
                        Warnings
                      </Text>
                      <Text style={styles.rowTitle}>{group!.title}</Text>
                      <Text style={styles.cardText}>{group!.explanation}</Text>
                      <Text style={styles.recommended}>Recommended action</Text>
                      <Text style={styles.cardText}>
                        {group!.recommendedAction}
                      </Text>
                      {!isCompactValidationGroup(group!) ? (
                        <>
                          {(group!.issues || [])
                            .slice(0, 1)
                            .map((issue, index) => (
                              <Text
                                key={`${group!.category}-${index}`}
                                style={styles.issueText}
                              >
                                {`${issue.sheetName || "Workbook"}${issue.rowNumber && issue.rowNumber > 0 ? ` • Row ${issue.rowNumber}` : ""}\n${issue.fieldName ? `${issue.fieldName}: ` : ""}${issue.message || "Review this workbook item."}`}
                              </Text>
                            ))}
                          {(group!.issues || []).length > 1 ? (
                            <Text style={styles.dateText}>
                              + {(group!.issues || []).length - 1} more issues.
                              Review Web ERP Workbook Validation for full
                              details.
                            </Text>
                          ) : null}
                        </>
                      ) : null}
                    </View>
                  ))}
              </View>
            ) : null}

            {operations ? (
              <View style={styles.card}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Activation History</Text>
                  {operations.timeline.length > 1 ? (
                    <TouchableOpacity
                      style={styles.expandButton}
                      onPress={() => setShowFullProgress((value) => !value)}
                    >
                      <Text style={styles.expandText}>
                        {showFullProgress ? "Hide History" : "View History"}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                {(showFullProgress
                  ? operations.timeline
                  : operations.timeline.slice(0, 1)
                ).map((item, index) => (
                  <View key={`${item.stepKey}-${index}`} style={styles.rowCard}>
                    <Text style={styles.pillSmall}>{label(item.status)}</Text>
                    <Text style={styles.rowTitle}>{item.title}</Text>
                    <Text style={styles.cardText}>{item.note}</Text>
                    <Text style={styles.dateText}>{fmt(item.eventAt)}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(74, 45, 4, 0.08)",
  },
  container: {
    paddingTop: 58,
    paddingHorizontal: spacing.lg,
    paddingBottom: 42,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  navButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(19, 31, 49, 0.88)",
    alignItems: "center",
    justifyContent: "center",
    ...shadows.soft,
  },
  navIcon: { color: "#f8df9b", fontSize: 34, lineHeight: 36 },
  homeIcon: { color: "#f8df9b", fontSize: 22, fontWeight: "900" },
  schoolName: {
    color: "#f3c35b",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  subtitle: {
    color: "#7a5422",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 5,
    marginBottom: spacing.lg,
  },
  heroCard: {
    borderRadius: 28,
    backgroundColor: "rgba(255, 250, 236, 0.985)",
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(126, 85, 20, 0.18)",
    ...shadows.soft,
  },
  pill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(116, 75, 10, 0.14)",
    color: "#7a4b0a",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    textTransform: "uppercase",
  },
  pillSmall: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(116, 75, 10, 0.12)",
    color: "#7a4b0a",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 10,
    fontWeight: "900",
    overflow: "hidden",
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#2d220f",
    fontSize: 22,
    fontWeight: "900",
    marginTop: spacing.md,
  },
  heroText: { color: "#604418", fontSize: 14, lineHeight: 21, marginTop: 8 },
  readinessRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: spacing.lg,
  },
  readiness: { color: "#9b650d", fontSize: 44, fontWeight: "900" },
  smallText: { color: "#7a5422", fontSize: 12, fontWeight: "700" },
  activateButton: {
    alignSelf: "flex-start",
    backgroundColor: "#9b650d",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    marginTop: spacing.md,
    alignItems: "center",
  },
  activateText: {
    color: "#fff8db",
    fontWeight: "900",
    fontSize: 12,
    textAlign: "center",
  },
  disabled: { opacity: 0.48 },
  gateGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: spacing.md,
  },
  gateCard: {
    width: "48%",
    borderRadius: 20,
    backgroundColor: "rgba(255, 250, 236, 0.94)",
    padding: spacing.md,
    borderWidth: 2,
    borderColor: "rgba(126, 85, 20, 0.15)",
  },
  gateReady: { borderColor: "rgba(32, 108, 56, 0.32)" },
  gatePending: { borderColor: "rgba(166, 91, 0, 0.32)" },
  ready: { color: "#206c38", fontWeight: "900", fontSize: 13 },
  pending: { color: "#a65b00", fontWeight: "900", fontSize: 13 },
  gateTitle: { color: "#37270e", fontWeight: "800" },
  card: {
    borderRadius: 26,
    backgroundColor: "rgba(255, 250, 236, 0.985)",
    padding: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(126, 85, 20, 0.16)",
    ...shadows.soft,
  },
  sectionTitle: {
    color: "#2d220f",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  expandButton: {
    borderRadius: 999,
    backgroundColor: "rgba(116, 75, 10, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  expandText: { color: "#7a4b0a", fontSize: 11, fontWeight: "900" },
  rowCard: {
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.90)",
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(126, 85, 20, 0.12)",
  },
  rowTitle: { color: "#2d220f", fontSize: 15, fontWeight: "900", marginTop: 8 },
  cardText: { color: "#604418", fontSize: 13, lineHeight: 19, marginTop: 4 },
  dateText: { color: "#8c6a32", fontSize: 11, fontWeight: "700", marginTop: 6 },

  blockedPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(145, 54, 54, 0.16)",
    color: "#8c2f2f",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 10,
    fontWeight: "900",
    overflow: "hidden",
    textTransform: "uppercase",
  },
  summaryGrid: { flexDirection: "row", gap: 8, marginTop: spacing.sm },
  metricCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.74)",
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(126, 85, 20, 0.12)",
  },
  metricValue: {
    color: "#8c2f2f",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
  },
  metricLabel: {
    color: "#604418",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: spacing.sm,
  },
  errorChip: {
    backgroundColor: "rgba(145, 54, 54, 0.12)",
    color: "#8c2f2f",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
  },
  issueText: {
    color: "#604418",
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.sm,
    backgroundColor: "rgba(255,255,255,0.90)",
    borderRadius: 14,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(126, 85, 20, 0.10)",
  },
  compactIssueText: {
    color: "#604418",
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.sm,
    backgroundColor: "rgba(255,255,255,0.90)",
    borderRadius: 14,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(126, 85, 20, 0.10)",
    fontWeight: "800",
  },
  recommended: {
    color: "#7a4b0a",
    fontSize: 12,
    fontWeight: "900",
    marginTop: spacing.sm,
  },
  alert: {
    backgroundColor: "rgba(119, 32, 20, 0.88)",
    borderRadius: 18,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  alertText: { color: "#ffe6df", fontWeight: "800" },
  notice: {
    backgroundColor: "rgba(28, 94, 51, 0.88)",
    borderRadius: 18,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  noticeText: { color: "#e2ffea", fontWeight: "800" },
});
