import {
  useForwardResidentForms,
  useGetResidentFormForwards,
  useGetResidentForms,
} from "@/src/api/residentForms.api";
import { MobileColumn, MobileDataList } from "@/src/components/layout/MobileDataList";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppInput from "@/src/components/ui/AppInput";
import SelectField from "@/src/components/ui/SelectField";
import { useResidencesForActiveBuilding } from "@/src/hooks/useResidenceByBuilding";
import { useAuth } from "@/src/providers/AuthProvider";
import { ResidentFormForward } from "@/src/types/residentForm.types";
import { PAGE_SIZE, extractPaginatedList } from "@/src/utils/listPagination";
import { useMemo, useState } from "react";
import { View } from "react-native";

export default function ResidentFormForwards() {
  const { buildingId, user } = useAuth();
  const { residences } = useResidencesForActiveBuilding();
  const [formIds, setFormIds] = useState<string[]>([]);
  const [residentId, setResidentId] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);

  const { data: formsData } = useGetResidentForms({ buildingId: buildingId ?? undefined }, !!user?.userId);
  const { data, isLoading, refetch, isRefetching } = useGetResidentFormForwards(
    { page, limit: PAGE_SIZE, buildingId: buildingId ?? undefined },
    !!user?.userId,
  );
  const { mutate: forwardMutate, isPending } = useForwardResidentForms();

  const formsRaw: any = formsData?.data;
  const formOptions = useMemo(
    () =>
      (Array.isArray(formsRaw) ? formsRaw : (formsRaw?.data ?? [])).map((f: any) => ({
        label: f.title ?? String(f.id),
        value: String(f.id),
      })),
    [formsRaw],
  );

  const { items, total } = extractPaginatedList<ResidentFormForward>(data, { page, limit: PAGE_SIZE });

  const columns: MobileColumn<ResidentFormForward>[] = [
    { key: "residentFormTitle", label: "Form", primary: true, searchable: true },
    { key: "residentName", label: "Resident" },
    { key: "residentEmail", label: "Email" },
    { key: "sentAt", label: "Sent", render: (v) => (v ? new Date(String(v)).toLocaleDateString() : "—") },
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
      <PageHeader showBackButton icon="send" title="Form Forwards" subtitle="Email resident forms to residents." />
      <View className="gap-3 mb-4">
        <SelectField label="Forms" multi placeholder="Select forms" options={formOptions} value={formIds} onChange={setFormIds} />
        <SelectField label="Unit" placeholder="Select unit" options={residences} value={residentId} onChange={setResidentId} />
        <AppInput label="Subject" value={subject} onChangeText={setSubject} />
        <AppInput label="Message" value={message} onChangeText={setMessage} multiline numberOfLines={3} />
        <AppButton loading={isPending} disabled={!residentId || formIds.length === 0} onPress={handleForward}>
          Forward Forms
        </AppButton>
      </View>
      <View className="flex-1">
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
        />
      </View>
    </View>
  );
}
