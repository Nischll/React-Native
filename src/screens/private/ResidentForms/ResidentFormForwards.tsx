import {
  useForwardResidentForms,
  useGetResidentFormForwards,
  useGetResidentForms,
} from "@/src/api/residentForms.api";
import { MobileColumn, MobileDataList } from "@/src/components/layout/MobileDataList";
import PageHeader from "@/src/components/layout/PageHeader";
import AnchoredPopupMenu from "@/src/components/ui/AnchoredPopMenu";
import AppButton from "@/src/components/ui/AppButton";
import AppInput from "@/src/components/ui/AppInput";
import Card from "@/src/components/ui/Card";
import SelectField from "@/src/components/ui/SelectField";
import { useResidencesForActiveBuilding } from "@/src/hooks/useResidenceByBuilding";
import { useAuth } from "@/src/providers/AuthProvider";
import { ResidentFormForward } from "@/src/types/residentForm.types";
import { PAGE_SIZE, extractPaginatedList } from "@/src/utils/listPagination";
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

export default function ResidentFormForwards() {
  const { buildingId, user } = useAuth();
  const { residences } = useResidencesForActiveBuilding();
  const [formIds, setFormIds] = useState<string[]>([]);
  const [residentId, setResidentId] = useState("");
  const [filterResidentId, setFilterResidentId] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);
  const [viewItem, setViewItem] = useState<ResidentFormForward | null>(null);

  const { data: formsData } = useGetResidentForms(
    { buildingId: buildingId ?? undefined },
    !!user?.userId,
  );
  const { data, isLoading, refetch, isRefetching } = useGetResidentFormForwards(
    {
      page,
      limit: PAGE_SIZE,
      buildingId: buildingId ?? undefined,
      residentId: filterResidentId ? Number(filterResidentId) : undefined,
    },
    !!user?.userId,
  );
  const { mutate: forwardMutate, isPending } = useForwardResidentForms();

  useEffect(() => {
    setPage(1);
  }, [filterResidentId]);

  const formsRaw: any = formsData?.data;
  const formOptions = useMemo(
    () =>
      (Array.isArray(formsRaw) ? formsRaw : (formsRaw?.data ?? [])).map(
        (f: any) => ({
          label: f.title ?? String(f.id),
          value: String(f.id),
        }),
      ),
    [formsRaw],
  );

  const unitFilterOptions = useMemo(
    () => [{ label: "All units", value: "" }, ...residences],
    [residences],
  );

  const { items, total } = extractPaginatedList<ResidentFormForward>(data, {
    page,
    limit: PAGE_SIZE,
  });

  const columns: MobileColumn<ResidentFormForward>[] = [
    { key: "residentFormTitle", label: "Form", primary: true, searchable: true },
    { key: "residentName", label: "Resident" },
    { key: "residentEmail", label: "Email" },
    {
      key: "sentAt",
      label: "Sent",
      render: (v) => (v ? new Date(String(v)).toLocaleDateString() : "—"),
    },
  ];

  const handleForward = () => {
    if (!residentId || formIds.length === 0) return;
    forwardMutate(
      {
        residentId: Number(residentId),
        residentFormIds: formIds.map(Number),
        subject: subject || undefined,
        message: message || undefined,
      },
      {
        onSuccess: () => {
          setFormIds([]);
          setResidentId("");
          setSubject("");
          setMessage("");
          refetch();
        },
      },
    );
  };

  return (
    <View className="flex-1">
      <PageHeader
        showBackButton
        icon="send"
        title="Form Forwards"
        subtitle="Email resident forms to residents."
      />
      <Card className="p-4 mb-3 gap-3">
        <SelectField
          label="Forms"
          multi
          placeholder="Select forms"
          options={formOptions}
          value={formIds}
          onChange={setFormIds}
        />
        <SelectField
          label="Unit"
          placeholder="Select unit"
          options={residences}
          value={residentId}
          onChange={setResidentId}
        />
        <AppInput label="Subject" value={subject} onChangeText={setSubject} />
        <AppInput
          label="Message"
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={3}
        />
        <AppButton
          loading={isPending}
          disabled={!residentId || formIds.length === 0}
          onPress={handleForward}
        >
          Forward Forms
        </AppButton>
      </Card>

      <SelectField
        label="Filter by unit"
        placeholder="All units"
        options={unitFilterOptions}
        value={filterResidentId}
        onChange={setFilterResidentId}
      />

      <View className="flex-1 mt-3">
        <MobileDataList<ResidentFormForward>
          data={items}
          columns={columns}
          loading={isLoading}
          refreshing={isRefetching}
          searchable
          backendMode
          pagination={{
            page,
            pageSize: PAGE_SIZE,
            total,
            hasMore: page * PAGE_SIZE < total,
            onPageChange: setPage,
          }}
          keyExtractor={(item) => String(item.id)}
          emptyMessage="No forwards yet"
          onRefresh={refetch}
          renderActions={(row) => (
            <AnchoredPopupMenu
              items={[
                {
                  label: "View",
                  icon: "eye",
                  onPress: () => setViewItem(row),
                },
              ]}
            />
          )}
        />
      </View>

      <Modal
        transparent
        visible={!!viewItem}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setViewItem(null)}
      >
        <Pressable
          onPress={() => setViewItem(null)}
          className="flex-1 bg-black/50 items-center justify-center px-6"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="w-full rounded-2xl bg-white p-5 gap-2"
          >
            <Text className="text-lg font-bold text-textPrimary mb-1">
              Forward Details
            </Text>
            <Text className="text-xs text-textSecondary">Form</Text>
            <Text className="text-sm font-semibold mb-2">
              {viewItem?.residentFormTitle || "—"}
            </Text>
            <Text className="text-xs text-textSecondary">Resident</Text>
            <Text className="text-sm font-semibold mb-2">
              {viewItem?.residentName || "—"}
            </Text>
            <Text className="text-xs text-textSecondary">Email</Text>
            <Text className="text-sm font-semibold mb-2">
              {viewItem?.residentEmail || "—"}
            </Text>
            <Text className="text-xs text-textSecondary">Subject</Text>
            <Text className="text-sm font-semibold mb-2">
              {viewItem?.subject || "—"}
            </Text>
            <Text className="text-xs text-textSecondary">Message</Text>
            <Text className="text-sm font-semibold mb-2">
              {viewItem?.message || "—"}
            </Text>
            <Text className="text-xs text-textSecondary">Sent</Text>
            <Text className="text-sm font-semibold mb-3">
              {viewItem?.sentAt
                ? new Date(viewItem.sentAt).toLocaleString()
                : "—"}
            </Text>
            <AppButton variant="outline" onPress={() => setViewItem(null)}>
              Close
            </AppButton>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
