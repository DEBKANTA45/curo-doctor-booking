import Link from "next/link";
import { ChatPrompt } from "@/lib/chatbot-data";

interface ChatOptionsProps {
  prompts: ChatPrompt[];
  isGuest: boolean;
  disabled: boolean;
  onSelect: (text: string) => void;
  onNavigate: () => void;
}

export default function ChatOptions({
  prompts,
  isGuest,
  disabled,
  onSelect,
  onNavigate,
}: ChatOptionsProps) {
  return (
    <section aria-label="Quick chat actions" className="border-t border-line bg-bg px-3 py-3">
      <p className="mb-2 text-xs font-medium text-muted">Quick actions</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Suggested questions">
        {prompts.map((prompt) => (
          <button
            key={prompt.label}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(prompt.text)}
            className="rounded-full border border-line bg-surface px-3 py-1.5 text-left text-xs font-medium text-primary-dark transition-[background-color,border-color,transform] duration-150 ease-out hover:border-primary hover:bg-primary-light active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {prompt.label}
          </button>
        ))}
      </div>

      {isGuest && (
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
          <p className="text-xs leading-5 text-muted">Sign in for appointment and account help.</p>
          <div className="flex shrink-0 gap-2">
            <Link
              href="/login"
              onClick={onNavigate}
              className="rounded-sm bg-primary px-2.5 py-1.5 text-xs font-medium text-white transition-[transform,background-color] duration-150 ease-out hover:bg-primary-dark active:scale-[0.97]"
            >
              Patient
            </Link>
            <Link
              href="/doctor/login"
              onClick={onNavigate}
              className="rounded-sm border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-ink transition-[transform,border-color,background-color] duration-150 ease-out hover:border-primary hover:bg-primary-light active:scale-[0.97]"
            >
              Doctor
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
