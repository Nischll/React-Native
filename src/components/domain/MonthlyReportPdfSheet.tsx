import FormSheetModal from "@/src/components/domain/FormSheetModal";
import AppInput from "@/src/components/ui/AppInput";
import { FilePicker, PickedFile } from "@/src/components/ui/FilePicker";
import SelectField from "@/src/components/ui/SelectField";
import {
  DEFAULT_MONTHLY_REPORT_COVER,
  MONTHLY_REPORT_ROLE_OPTIONS,
  MONTHLY_REPORT_SIGNATURE_FIELDS,
  REPORT_PDF_SIGNATURE_DEFAULTS,
  loadMonthlyReportPdfOptions,
  monthlyReportRoleLabel,
  validateMonthlyReportLogo,
} from "@/src/helper/reportSignatures";
import { MonthlyReportPdfOptions } from "@/src/types/reporting.types";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

export default function MonthlyReportPdfSheet({
  visible,
  month,
  buildingId,
  loading,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  month: string;
  buildingId: number;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (
    options: MonthlyReportPdfOptions,
    logo: PickedFile | null,
  ) => void;
}) {
  const [draft, setDraft] = useState<MonthlyReportPdfOptions>({
    ...REPORT_PDF_SIGNATURE_DEFAULTS,
    ...DEFAULT_MONTHLY_REPORT_COVER,
  });
  const [logo, setLogo] = useState<PickedFile | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setLogo(null);
    setLogoError(null);
    loadMonthlyReportPdfOptions().then((next) => {
      if (!cancelled) setDraft(next);
    });
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const roleLabel = monthlyReportRoleLabel(draft.reportRole);

  return (
    <FormSheetModal
      visible={visible}
      title="Download monthly PDF"
      subtitle={`Review cover details and signatories · ${month} · Building ${buildingId}`}
      submitLabel="Download PDF"
      loading={loading}
      submitDisabled={!!logoError}
      onClose={onClose}
      onSubmit={() => onSubmit(draft, logo)}
    >
      <Text className="text-sm font-semibold text-textPrimary mb-1">
        Cover
      </Text>
      <Text className="text-xs text-textSecondary mb-3">
        Printed on page 1. Preferences are remembered for next time.
      </Text>

      <SelectField
        label="Report role"
        mode="inline"
        value={draft.reportRole}
        onChange={(value) =>
          setDraft((prev) => ({
            ...prev,
            reportRole: value as MonthlyReportPdfOptions["reportRole"],
          }))
        }
        options={MONTHLY_REPORT_ROLE_OPTIONS}
        placeholder="Select role"
      />
      <Text className="text-[11px] text-textSecondary mt-1 mb-3">
        Shown as the single role line on the cover
      </Text>

      <AppInput
        label="Prepared by"
        value={draft.preparedBy}
        onChangeText={(preparedBy) =>
          setDraft((prev) => ({ ...prev, preparedBy }))
        }
        placeholder={`e.g. ${roleLabel} name`}
      />
      <Text className="text-[11px] text-textSecondary mt-1 mb-3">
        PREPARED BY on page 1 only · blank uses {roleLabel}
      </Text>

      <AppInput
        label="Company website"
        value={draft.companyWebsite}
        onChangeText={(companyWebsite) =>
          setDraft((prev) => ({ ...prev, companyWebsite }))
        }
        placeholder="https://www.alliancemaintenance.ca"
        autoCapitalize="none"
        keyboardType="url"
      />
      <Text className="text-[11px] text-textSecondary mt-1 mb-3">
        Printed on the cover · defaults to Alliance Maintenance
      </Text>

      <FilePicker
        accept="images"
        label="Company logo"
        hint="PNG, JPG, WebP, or GIF · max 5MB · optional"
        value={logo}
        onChange={async (file) => {
          if (!file) {
            setLogo(null);
            setLogoError(null);
            return;
          }
          const err = await validateMonthlyReportLogo(file);
          if (err) {
            setLogo(null);
            setLogoError(err);
            return;
          }
          setLogoError(null);
          setLogo(file);
        }}
      />
      {logoError ? (
        <Text className="text-[11px] text-red-600 mt-1">{logoError}</Text>
      ) : null}

      <Text className="text-sm font-semibold text-textPrimary mt-5 mb-1">
        Signatures
      </Text>
      <Text className="text-xs text-textSecondary mb-3">
        Printed on the last page exactly as written.
      </Text>

      {MONTHLY_REPORT_SIGNATURE_FIELDS.map((field, index) => {
        const isRoleLine = field.key === "buildingManager";
        return (
          <View key={field.key} className={index === 0 ? "" : "mt-3"}>
            <AppInput
              label={isRoleLine ? roleLabel : field.label}
              value={draft[field.key]}
              onChangeText={(text) =>
                setDraft((prev) => ({ ...prev, [field.key]: text }))
              }
              placeholder={
                isRoleLine
                  ? "Leave blank for an empty line"
                  : "Company default if blank"
              }
            />
            {isRoleLine ? (
              <Text className="text-[11px] text-textSecondary mt-1">
                Leave blank to print an empty {roleLabel.toLowerCase()}{" "}
                signature line.
              </Text>
            ) : null}
          </View>
        );
      })}
    </FormSheetModal>
  );
}
