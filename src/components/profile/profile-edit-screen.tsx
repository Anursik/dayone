"use client";

import { Check, CircleAlert, LoaderCircle } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { SectionTitle } from "@/components/ui/section-title";
import {
  BODY_FIELDS,
  DAILY_GOAL_FIELDS,
  NUTRITION_GOAL_FIELDS,
  buildPatch,
  caloriesFromMacros,
  initialDraft,
  type NumericFieldDef,
} from "@/features/profile/profile-form";
import { useProfile } from "@/features/profile/use-profile";
import { useAutosave, type AutosaveStatus } from "@/hooks/use-autosave";
import type { Profile } from "@/lib/db/schemas";
import { toDataError } from "@/lib/db/errors";
import { formatNumber } from "@/lib/format";
import { profileRepository, type ProfilePatch } from "@/lib/repositories/profile-repository";
import { toast } from "@/lib/toast";

function SaveIndicator({ status }: { status: AutosaveStatus }) {
  if (status === "idle") return null;
  const content =
    status === "error" ? (
      <>
        <CircleAlert className="size-4 text-destructive" /> Ошибка
      </>
    ) : status === "saved" ? (
      <>
        <Check className="size-4 text-health" /> Сохранено
      </>
    ) : (
      <>
        <LoaderCircle className="size-4 animate-spin" /> Сохранение
      </>
    );
  return (
    <span role="status" className="mb-1.5 inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground">
      {content}
    </span>
  );
}

function ProfileForm({ profile }: { profile: Profile }) {
  const [draft, setDraft] = useState(() => initialDraft(profile));
  const [version, setVersion] = useState(0);
  const { patch, errors } = useMemo(() => buildPatch(draft), [draft]);

  const save = useCallback(async (value: ProfilePatch) => {
    try {
      await profileRepository.update(value);
    } catch (error) {
      toast(toDataError(error).userMessage, "error");
      throw error;
    }
  }, []);

  const { status } = useAutosave(patch, version, save, { delay: 600 });

  const setField = (key: string, value: string) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setVersion((v) => v + 1);
  };

  const renderField = (def: NumericFieldDef) => (
    <FormField
      key={def.key}
      label={def.label}
      suffix={def.suffix}
      inputMode={def.decimals > 0 ? "decimal" : "numeric"}
      placeholder={def.placeholder ?? "—"}
      value={draft[def.key]}
      error={errors[def.key]}
      onChange={(e) => setField(def.key, e.target.value)}
    />
  );

  const macroKcal = caloriesFromMacros(
    patch.goals?.proteinG ?? null,
    patch.goals?.fatG ?? null,
    patch.goals?.carbsG ?? null,
  );

  return (
    <>
      <PageHeader title="Профиль и цели" backHref="/profile" action={<SaveIndicator status={status} />} />

      <SectionTitle className="mt-0">О себе</SectionTitle>
      <Card className="space-y-4">
        <FormField
          label="Имя"
          autoComplete="given-name"
          maxLength={60}
          placeholder="Как к вам обращаться"
          value={draft.name}
          onChange={(e) => setField("name", e.target.value)}
        />
        <div className="grid grid-cols-3 gap-3">{BODY_FIELDS.map(renderField)}</div>
      </Card>

      <SectionTitle>Норма питания в день</SectionTitle>
      <Card className="space-y-4">
        {renderField(NUTRITION_GOAL_FIELDS[0])}
        <div className="grid grid-cols-3 gap-3">{NUTRITION_GOAL_FIELDS.slice(1).map(renderField)}</div>
        {macroKcal !== null ? (
          <p className="px-1 text-[13px] text-muted-foreground">
            По БЖУ получается ≈ {formatNumber(macroKcal)} ккал
          </p>
        ) : null}
      </Card>

      <SectionTitle>Цели на день</SectionTitle>
      <Card className="grid grid-cols-2 gap-x-3 gap-y-4">{DAILY_GOAL_FIELDS.map(renderField)}</Card>

      <p className="mt-4 px-1 text-[13px] leading-relaxed text-muted-foreground">
        Изменения сохраняются автоматически на этом устройстве. Пустое поле — цель не задана.
      </p>
    </>
  );
}

export function ProfileEditScreen() {
  const profile = useProfile();
  if (!profile) return <div className="min-h-[60dvh]" aria-busy="true" />;
  return <ProfileForm profile={profile} />;
}
