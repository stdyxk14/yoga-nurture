import type { Gender, GenderCode } from "@/components/yoga/records";

const genderLabels: Record<GenderCode, Gender> = {
  female: "女性",
  male: "男性",
  other: "その他",
  prefer_not_to_say: "回答しない",
};

export const genderOptions: Array<{ value: GenderCode; label: Gender }> = [
  { value: "female", label: "女性" },
  { value: "male", label: "男性" },
  { value: "other", label: "その他" },
  { value: "prefer_not_to_say", label: "回答しない" },
];

export function toGenderLabel(value?: string | null): Gender {
  if (value && value in genderLabels) return genderLabels[value as GenderCode];
  if (value === "女性" || value === "男性" || value === "その他" || value === "回答しない") return value;
  return "回答しない";
}

export function toGenderCode(value?: string | null): GenderCode {
  if (value === "female" || value === "male" || value === "other" || value === "prefer_not_to_say") return value;
  if (value === "女性") return "female";
  if (value === "男性") return "male";
  if (value === "その他") return "other";
  return "prefer_not_to_say";
}
