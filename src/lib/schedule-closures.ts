export type ScheduleClosureReasonCode =
  | "all_participants_cancelled"
  | "minimum_participants_not_met"
  | "instructor_unavailable"
  | "weather_disaster_transport"
  | "venue_unavailable"
  | "operational"
  | "other";

export type ScheduleClosure = {
  id: string;
  reasonCode: ScheduleClosureReasonCode;
  reasonLabel: string;
  decidedAt: string;
  decidedAtLabel: string;
  note: string;
  handoffNote: string;
  createdAt: string;
  revokedAt: string | null;
};

export const scheduleClosureReasonOptions: ReadonlyArray<{ value: ScheduleClosureReasonCode; label: string }> = [
  { value: "all_participants_cancelled", label: "参加者全員がキャンセル" },
  { value: "minimum_participants_not_met", label: "最少開催人数に満たなかった" },
  { value: "instructor_unavailable", label: "講師都合" },
  { value: "weather_disaster_transport", label: "天候・災害・交通事情" },
  { value: "venue_unavailable", label: "会場都合" },
  { value: "operational", label: "運営上の都合" },
  { value: "other", label: "その他" },
];

export function getScheduleClosureReasonLabel(reason: ScheduleClosureReasonCode) {
  return scheduleClosureReasonOptions.find((option) => option.value === reason)?.label ?? "その他";
}
