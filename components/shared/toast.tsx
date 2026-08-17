import { AlertCircle, Check } from "lucide-react";

interface ToastProps {
  message: string;
  tone?: "success" | "error";
}

export function Toast({ message, tone = "success" }: ToastProps) {
  return (
    <div className="fixed bottom-6.5 left-1/2 z-80 flex -translate-x-1/2 items-center gap-2.25 rounded-pill bg-text-primary px-4.5 py-2.75 text-[13.5px] font-med text-white shadow-lg">
      {tone === "success" ? (
        <Check size={16} className="text-success" />
      ) : (
        <AlertCircle size={16} className="text-danger-cta" />
      )}
      {message}
    </div>
  );
}
