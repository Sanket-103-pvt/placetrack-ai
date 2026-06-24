import { Check, Circle } from "lucide-react";

const steps = ["Applied", "Shortlisted", "Aptitude", "Technical", "HR", "Offer"];

export function ApplicationTimeline({ current = 3 }: { current?: number }) {
  return (
    <div className="timeline">
      {steps.map((step, index) => (
        <div className={`timeline-step ${index <= current ? "done" : ""}`} key={step}>
          <div className="timeline-marker">{index < current ? <Check size={12} /> : <Circle size={10} fill="currentColor" />}</div>
          <span>{step}</span>
        </div>
      ))}
    </div>
  );
}
