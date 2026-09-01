import {
  Stethoscope,
  Sparkles,
  Baby,
  HeartHandshake,
  Smile,
  HeartPulse,
  Bone,
  Ear,
  Brain,
  Eye,
  LucideIcon,
} from "lucide-react";

export const iconMap: Record<string, LucideIcon> = {
  Stethoscope,
  Sparkles,
  Baby,
  HeartHandshake,
  Smile,
  HeartPulse,
  Bone,
  Ear,
  Brain,
  Eye,
};

export function getSpecialtyIcon(name: string): LucideIcon {
  return iconMap[name] ?? Stethoscope;
}
