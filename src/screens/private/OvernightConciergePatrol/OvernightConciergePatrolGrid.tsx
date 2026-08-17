import {
  useAddOcpAttachments,
  useGetOcpWeekly,
  useUpdateOcpAttachment,
  useUpdateOcpWeeklyCell,
} from "@/src/api/overnightConciergePatrol.api";
import EmptyState from "@/src/components/feedback/EmptyState";
import { SkeletonCard } from "@/src/components/feedback/SkeletonCard";
import PageHeader from "@/src/components/layout/PageHeader";
import AppIcon from "@/src/components/ui/AppIcon";
import Card from "@/src/components/ui/Card";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import {
  formatApiDate,
  formatCompletedTime,
  formatWeekEndingDisplay,
  getCompletedDateForDay,
  getNextWeekEnding,
  getPreviousWeekEnding,
  getTodayDayCodeForWeek,
  getWeekEndingFriday,
  parseApiDate,
} from "@/src/helper/checklistDateUtils";
import {
  buildOcpAddAttachmentsFormData,
  buildOcpCellFormData,
  buildOcpUpdateAttachmentFormData,
  saveOcpDailyPdf,
} from "@/src/helper/ocpMedia";
import PdfClosingNamesSheet from "@/src/components/domain/PdfClosingNamesSheet";
import { flattenModules } from "@/src/helper/flattenModules";
import { normalizeModulePath } from "@/src/helper/accountMenuModules";
import { staffDisplayName } from "@/src/helper/pdfClosingNames";
import { loadOcpSignatures, saveOcpSignatures } from "@/src/helper/ocpSignatures";
import { waitForModalDismiss } from "@/src/helper/savePdfFile";
import { useAuth } from "@/src/providers/AuthProvider";
import { DAY_CODES, DayCode } from "@/src/types/checklist.types";
import {
  OCP_SIGNATURE_DEFAULTS,
  OcpAttachment,
  OcpDayCell,
  OcpDraftPhoto,
  OcpPhotoStatus,
  OcpSignatures,
  OcpWeeklyRow,
  ocpCellHasNotNormal,
} from "@/src/types/overnightConciergePatrol.types";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import AttachmentsSheet from "./AttachmentsSheet";
import CompleteTaskSheet from "./CompleteTaskSheet";
import PhotoPreviewModal from "./PhotoPreviewModal";

function normalizeOcpRow(row: OcpWeeklyRow, weekEnding: string): OcpWeeklyRow {
  const days = {} as Record<DayCode, OcpDayCell>;
  for (const day of DAY_CODES) {
    const existing = row.days?.[day];
    const completedDate = existing?.completedDate
      ? String(existing.completedDate).slice(0, 10)
      : getCompletedDateForDay(weekEnding, day);
    days[day] = {
      detailId: existing?.detailId ?? null,
      isDone: !!existing?.isDone,
      completedDate,
      completedTime: existing?.completedTime ?? null,
      attachments: existing?.attachments ?? [],
    };
  }
  return { ...row, days };
}

function formatDayHeaderDate(date: string): string {
  return parseApiDate(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function isNightComplete(
  rows: OcpWeeklyRow[],
  day: DayCode,
  justCompletedTemplateId: number,
): boolean {
  if (rows.length === 0) return false;
  return rows.every(
    (row) =>
      row.templateId === justCompletedTemplateId || !!row.days?.[day]?.isDone,
  );
}

type CellRef = { templateId: number; day: DayCode };

export default function OvernightConciergePatrolGrid() {
  const { user, buildingId } = useAuth();

  const [weekEnding, setWeekEnding] = useState(() =>
    formatApiDate(getWeekEndingFriday()),
  );
  const [pendingCell, setPendingCell] = useState<string | null>(null);
  const [completeTarget, setCompleteTarget] = useState<CellRef | null>(null);
  const [completePhotos, setCompletePhotos] = useState<OcpDraftPhoto[]>([]);
  const [attachmentsTarget, setAttachmentsTarget] = useState<CellRef | null>(
    null,
  );
  const [uncheckTarget, setUncheckTarget] = useState<CellRef | null>(null);
  const [previewAttachment, setPreviewAttachment] =
    useState<OcpAttachment | null>(null);
  const [signaturesVisible, setSignaturesVisible] = useState(false);
  const [pdfDatePending, setPdfDatePending] = useState<string | null>(null);
  const [signatures, setSignatures] = useState<OcpSignatures>({
    ...OCP_SIGNATURE_DEFAULTS,
  });
  const [signaturesSaving, setSignaturesSaving] = useState(false);
  const [downloadingDate, setDownloadingDate] = useState<string | null>(null);
  const [updatingAttachmentId, setUpdatingAttachmentId] = useState<
    number | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    loadOcpSignatures().then((saved) => {
      if (cancelled) return;
      setSignatures((prev) => {
        const night =
          saved.nightConcierge.trim() ||
          prev.nightConcierge.trim() ||
          staffDisplayName(user);
        return { ...saved, nightConcierge: night };
      });
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const todayDay = useMemo(
    () => getTodayDayCodeForWeek(weekEnding),
    [weekEnding],
  );

  const { data, isLoading, refetch, isRefetching } = useGetOcpWeekly(
    {
      buildingId: buildingId ?? undefined,
      weekEnding,
      employeeId: user?.userId,
    },
    !!user?.userId && buildingId != null,
  );

  useEffect(() => {
    const name = staffDisplayName(user) || data?.data?.employeeName || "";
    if (!name) return;
    setSignatures((prev) =>
      prev.nightConcierge.trim() ? prev : { ...prev, nightConcierge: name },
    );
  }, [user, data?.data?.employeeName]);

  const rows = useMemo(
    () =>
      (data?.data?.rows ?? []).map((row) => normalizeOcpRow(row, weekEnding)),
    [data?.data?.rows, weekEnding],
  );

  const cellMutation = useUpdateOcpWeeklyCell();
  const addAttachmentsMutation = useAddOcpAttachments();
  const updateAttachmentMutation = useUpdateOcpAttachment();

  const canManageTemplates = flattenModules(user?.moduleList ?? []).some(
    (m) =>
      normalizeModulePath(m.path) === "/overnight-concierge-patrol-template",
  );

  const busySaving =
    cellMutation.isPending ||
    addAttachmentsMutation.isPending ||
    updateAttachmentMutation.isPending;

  const downloadDayPdf = async (
    date: string,
    names: OcpSignatures = signatures,
  ) => {
    if (!buildingId) return;
    setDownloadingDate(date);
    try {
      await saveOcpDailyPdf({
        buildingId,
        date,
        employeeId: user?.userId,
        signatures: names,
      });
    } catch (e) {
      Alert.alert(
        "Download failed",
        e instanceof Error && e.message
          ? e.message
          : "Could not download the daily PDF.",
      );
    } finally {
      setDownloadingDate(null);
    }
  };

  const fillNightConcierge = (s: OcpSignatures): OcpSignatures => {
    if (s.nightConcierge.trim()) return s;
    const name = staffDisplayName(user) || data?.data?.employeeName || "";
    return name ? { ...s, nightConcierge: name } : s;
  };

  const openDownloadNames = (date: string) => {
    setSignatures((prev) => fillNightConcierge(prev));
    setPdfDatePending(date);
    setSignaturesVisible(true);
  };

  const findRow = (templateId: number) =>
    rows.find((r) => r.templateId === templateId);

  const closeComplete = () => {
    setCompleteTarget(null);
    setCompletePhotos([]);
  };

  const handleSaveComplete = async () => {
    if (!buildingId || !completeTarget || !user?.userId) return;
    const { templateId, day } = completeTarget;
    const row = findRow(templateId);
    if (!row) return;
    const cell = row.days?.[day];
    const completedDate =
      cell?.completedDate || getCompletedDateForDay(weekEnding, day);
    const cellKey = `${templateId}-${day}`;
    const lastOfNight = isNightComplete(rows, day, templateId);

    setPendingCell(cellKey);
    try {
      const fd = await buildOcpCellFormData({
        buildingId,
        weekEnding,
        templateId,
        completedDate,
        isDone: true,
        completedTime: formatCompletedTime(),
        employeeId: user.userId,
        photos: completePhotos,
      });
      await cellMutation.mutateAsync(fd);
      closeComplete();
      await refetch();
      if (lastOfNight) {
        await downloadDayPdf(completedDate, fillNightConcierge(signatures));
      }
    } catch {
      /* toast from mutation */
    } finally {
      setPendingCell(null);
    }
  };

  const handleConfirmUncheck = async () => {
    if (!buildingId || !uncheckTarget || !user?.userId) return;
    const { templateId, day } = uncheckTarget;
    const row = findRow(templateId);
    if (!row) return;
    const cell = row.days?.[day];
    const completedDate =
      cell?.completedDate || getCompletedDateForDay(weekEnding, day);
    const cellKey = `${templateId}-${day}`;

    setPendingCell(cellKey);
    try {
      const fd = await buildOcpCellFormData({
        buildingId,
        weekEnding,
        templateId,
        completedDate,
        isDone: false,
        employeeId: user.userId,
      });
      await cellMutation.mutateAsync(fd);
      setUncheckTarget(null);
      await refetch();
    } catch {
      /* toast from mutation */
    } finally {
      setPendingCell(null);
    }
  };

  const handleUpdateAttachment = async (
    id: number,
    draft: {
      title: string;
      area: string;
      status: OcpPhotoStatus;
      description: string;
      file?: { uri: string; name: string; mimeType: string } | null;
    },
  ) => {
    setUpdatingAttachmentId(id);
    try {
      const formData = await buildOcpUpdateAttachmentFormData(draft);
      await updateAttachmentMutation.mutateAsync({
        formData,
        pathVars: { id },
      });
      await refetch();
    } catch {
      /* toast from mutation */
    } finally {
      setUpdatingAttachmentId(null);
    }
  };

  const handleAddMore = async (photos: OcpDraftPhoto[]): Promise<boolean> => {
    const detailId = attachmentsTarget
      ? findRow(attachmentsTarget.templateId)?.days?.[attachmentsTarget.day]
          ?.detailId
      : null;
    if (detailId == null) return false;
    try {
      const formData = await buildOcpAddAttachmentsFormData(photos);
      await addAttachmentsMutation.mutateAsync({
        formData,
        pathVars: { detailId },
      });
      await refetch();
      return true;
    } catch {
      return false;
    }
  };

  const handleSaveSignatures = async () => {
    setSignaturesSaving(true);
    try {
      await saveOcpSignatures(signatures);
      const date = pdfDatePending;
      setPdfDatePending(null);
      setSignaturesVisible(false);
      if (date) {
        await waitForModalDismiss();
        await downloadDayPdf(date, signatures);
      }
    } finally {
      setSignaturesSaving(false);
    }
  };

  const completeRow = completeTarget
    ? findRow(completeTarget.templateId)
    : undefined;
  const attachmentsRow = attachmentsTarget
    ? findRow(attachmentsTarget.templateId)
    : undefined;
  const attachmentsCell = attachmentsTarget
    ? attachmentsRow?.days?.[attachmentsTarget.day]
    : undefined;

  return (
    <View className="flex-1">
      <PageHeader
        showBackButton
        icon="moon-outline"
        title="Overnight Concierge Patrol"
        subtitle="Scan-point photos for each weekday."
      />

      <View className="flex-row items-center justify-between px-1 mb-3">
        <Pressable
          onPress={() => setWeekEnding(getPreviousWeekEnding(weekEnding))}
          className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
        >
          <AppIcon name="chevron-back" size={18} color="#374151" />
        </Pressable>

        <View className="items-center">
          <Text className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
            Week Ending
          </Text>
          <Text className="text-sm font-bold text-textPrimary">
            {formatWeekEndingDisplay(weekEnding)}
          </Text>
        </View>

        <Pressable
          onPress={() => setWeekEnding(getNextWeekEnding(weekEnding))}
          className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
        >
          <AppIcon name="chevron-forward" size={18} color="#374151" />
        </Pressable>
      </View>

      <View className="flex-row gap-2 mb-3">
        <Pressable
          className="flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100"
          onPress={() => {
            setPdfDatePending(null);
            setSignatures((prev) => fillNightConcierge(prev));
            setSignaturesVisible(true);
          }}
        >
          <AppIcon name="create-outline" size={16} color="#334155" />
          <Text className="text-sm font-semibold text-slate-700">
            Signatures
          </Text>
        </Pressable>
        {canManageTemplates ? (
          <Pressable
            className="flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10"
            onPress={() =>
              router.push(
                "/(private)/overnight-concierge-patrol-template" as any,
              )
            }
          >
            <AppIcon name="settings-outline" size={16} color="#2563eb" />
            <Text className="text-sm font-semibold text-primary">
              Templates
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View className="flex-row mb-2 px-0.5">
        {DAY_CODES.map((day) => {
          const date = getCompletedDateForDay(weekEnding, day);
          const isToday = todayDay === day;
          const downloading = downloadingDate === date;
          return (
            <View key={day} className="flex-1 mx-0.5 items-center">
              <Text
                className={`text-[11px] font-bold ${
                  isToday ? "text-primary" : "text-slate-600"
                }`}
              >
                {day}
              </Text>
              <Text className="text-[9px] text-slate-400 mb-1">
                {formatDayHeaderDate(date)}
              </Text>
              <Pressable
                onPress={() => openDownloadNames(date)}
                disabled={!!downloadingDate}
                className="h-8 w-8 items-center justify-center rounded-full bg-slate-100"
              >
                {downloading ? (
                  <ActivityIndicator size="small" color="#2563eb" />
                ) : (
                  <AppIcon name="download-outline" size={16} color="#2563eb" />
                )}
              </Pressable>
            </View>
          );
        })}
      </View>

      {isLoading ? (
        <View>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : rows.length === 0 ? (
        <EmptyState message="No patrol duties configured for this building." />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {rows.map((row) => (
            <Card key={row.templateId} className="px-4 py-3 mb-3">
              <View className="flex-row items-start justify-between mb-2">
                <View className="flex-1 pr-2">
                  <Text className="text-sm font-bold text-textPrimary">
                    {row.serialNumber ?? row.sortOrder}. {row.workTitle}
                  </Text>
                  {!!row.time && (
                    <Text className="text-xs text-gray-500 mt-0.5">
                      {row.time}
                    </Text>
                  )}
                </View>
              </View>

              <View className="flex-row justify-between mt-1">
                {DAY_CODES.map((day) => {
                  const cell = row.days?.[day];
                  const done = !!cell?.isDone;
                  const isToday = todayDay === day;
                  const cellKey = `${row.templateId}-${day}`;
                  const busy = pendingCell === cellKey;
                  const attachments = cell?.attachments ?? [];
                  const amber = ocpCellHasNotNormal(cell);

                  return (
                    <View
                      key={day}
                      className={`flex-1 mx-0.5 h-[58px] rounded-lg items-center justify-center ${
                        done
                          ? "bg-green-500"
                          : isToday
                            ? "bg-primary/10 border border-primary"
                            : "bg-gray-100"
                      } ${busy ? "opacity-50" : ""}`}
                    >
                      {done ? (
                        <View className="items-center">
                          <Pressable
                            disabled={busySaving}
                            onPress={() =>
                              setUncheckTarget({
                                templateId: row.templateId,
                                day,
                              })
                            }
                            hitSlop={6}
                          >
                            <Text className="text-white text-base font-bold leading-5">
                              ×
                            </Text>
                          </Pressable>
                          <Pressable
                            disabled={busySaving}
                            onPress={() =>
                              setAttachmentsTarget({
                                templateId: row.templateId,
                                day,
                              })
                            }
                            className="flex-row items-center mt-0.5"
                            hitSlop={6}
                          >
                            <AppIcon
                              name="attach"
                              size={13}
                              color={amber ? "#fbbf24" : "#fff"}
                            />
                            <Text
                              className={`text-[10px] font-semibold ml-0.5 ${
                                amber ? "text-amber-300" : "text-white"
                              }`}
                            >
                              {attachments.length}
                            </Text>
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable
                          disabled={busySaving}
                          onPress={() => {
                            setCompletePhotos([]);
                            setCompleteTarget({
                              templateId: row.templateId,
                              day,
                            });
                          }}
                          className="flex-1 w-full items-center justify-center"
                        >
                          <AppIcon
                            name="camera-outline"
                            size={18}
                            color={isToday ? "#2563eb" : "#6b7280"}
                          />
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>
            </Card>
          ))}
        </ScrollView>
      )}

      <CompleteTaskSheet
        visible={!!completeTarget}
        dutyTitle={completeRow?.workTitle ?? ""}
        loading={cellMutation.isPending}
        photos={completePhotos}
        onChangePhotos={setCompletePhotos}
        onClose={closeComplete}
        onSave={handleSaveComplete}
      />

      <AttachmentsSheet
        visible={!!attachmentsTarget}
        dutyTitle={attachmentsRow?.workTitle ?? ""}
        attachments={attachmentsCell?.attachments ?? []}
        adding={addAttachmentsMutation.isPending}
        updatingId={updatingAttachmentId}
        onClose={() => setAttachmentsTarget(null)}
        onPreview={setPreviewAttachment}
        onUpdate={handleUpdateAttachment}
        onAddMore={handleAddMore}
      />

      <PdfClosingNamesSheet
        visible={signaturesVisible}
        title="PDF closing names"
        subtitle="Printed on the last page exactly as written."
        hint="Night Concierge defaults to the logged-in staff member. Blank names are omitted."
        fields={[
          {
            key: "nightConcierge",
            label: "Night Concierge",
            placeholder: "Staff member who completed the patrol",
          },
          { key: "operationsSupervisor", label: "Operations Supervisor" },
          { key: "operationsManager", label: "Operations Manager" },
          { key: "generalManager", label: "General Manager" },
          { key: "director", label: "Director" },
        ]}
        value={signatures}
        onChange={setSignatures}
        submitLabel={pdfDatePending ? "Download PDF" : "Save names"}
        loading={
          signaturesSaving ||
          (!!pdfDatePending && downloadingDate === pdfDatePending)
        }
        onClose={() => {
          setPdfDatePending(null);
          setSignaturesVisible(false);
        }}
        onSubmit={handleSaveSignatures}
      />

      <PhotoPreviewModal
        attachment={previewAttachment}
        onClose={() => setPreviewAttachment(null)}
      />

      <ConfirmModal
        visible={!!uncheckTarget}
        title="Uncheck duty"
        message="Mark this duty as not done for this night? Photos stay on the record unless the server removes them."
        confirmText="Uncheck"
        destructive
        loading={cellMutation.isPending}
        onCancel={() => setUncheckTarget(null)}
        onConfirm={handleConfirmUncheck}
      />
    </View>
  );
}
