import { Video, MapPin } from "lucide-react";
import { Appointment, AppointmentPhase, ConsultationType } from "@/lib/types";
import { getPhaseLabel } from "@/lib/consultation";

interface ConsultationBadgeProps {
  type: ConsultationType;
  phase: AppointmentPhase;
  /** Hide the phase pill — used where "Upcoming" would be redundant. */
  hidePhaseWhenUpcoming?: boolean;
}

/**
 * The small "Online / In-person" + phase ("Starting soon" / "Live") pill
 * pair shown on every appointment card — patient appointments page,
 * doctor dashboard, and the consult page. Kept in one place so all three
 * always look and behave the same; change the styling here once instead
 * of in three files.
 */
export default function ConsultationBadge({ type, phase, hidePhaseWhenUpcoming = true }: ConsultationBadgeProps) {
  const showPhase = !hidePhaseWhenUpcoming || phase !== "upcoming";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span
        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
          type === "online" ? "bg-cyan-light text-cyan-dark" : "bg-primary-light text-primary-dark"
        }`}
      >
        {type === "online" ? <Video size={11} /> : <MapPin size={11} />}
        {type === "online" ? "Online" : "In-person"}
      </span>
      {showPhase && (
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
            phase === "live"
              ? "bg-success-light text-success"
              : phase === "cancelled"
              ? "bg-bg text-faint"
              : "bg-accent-light text-accent"
          }`}
        >
          {getPhaseLabel(phase, type)}
        </span>
      )}
    </div>
  );
}