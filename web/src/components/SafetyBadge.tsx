import type { AirlinesConfig } from "../types";

interface Props {
  airline: string;
  airlines: AirlinesConfig;
}

export default function SafetyBadge({ airline, airlines }: Props) {
  const info = airlines.airlines[airline];
  if (!info) {
    return <span className="badge badge-unknown" title="No safety data for this airline yet">? / 7</span>;
  }
  const cls = info.euBanned
    ? "badge-danger"
    : info.safetyRating >= 7
      ? "badge-good"
      : info.safetyRating >= 6
        ? "badge-ok"
        : "badge-warn";
  const label = info.euBanned ? "EU banned" : `${info.safetyRating}/7`;
  return (
    <span className={`badge ${cls}`} title={info.notes}>
      {label}
    </span>
  );
}
