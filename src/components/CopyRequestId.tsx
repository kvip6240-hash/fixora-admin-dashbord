import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type CopyRequestIdProps = {
  /** The API requestNumber. This value is displayed and copied without alteration. */
  requestNumber?: string | null;
  className?: string;
  textClassName?: string;
};

/** Displays an API request number with a small, accessible clipboard action. */
export function CopyRequestId({
  requestNumber,
  className = "",
  textClassName = "",
}: CopyRequestIdProps) {
  const [copied, setCopied] = useState(false);
  const canCopy = typeof requestNumber === "string" && requestNumber.length > 0;

  useEffect(() => {
    if (!copied) return;

    const timeout = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const copyRequestId = async (event: React.MouseEvent<HTMLButtonElement>) => {
    // Request-ID controls often sit in clickable rows; copying must not open details.
    event.preventDefault();
    event.stopPropagation();

    if (!canCopy) return;

    try {
      await navigator.clipboard.writeText(requestNumber);
      setCopied(true);
    } catch {
      toast.error("Unable to copy Request ID. Please try again.");
    }
  };

  const tooltipText = copied ? "Request ID copied" : "Copy Request ID";

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className={textClassName}>{canCopy ? requestNumber : "—"}</span>
      {canCopy && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={copyRequestId}
                onKeyDown={(event) => event.stopPropagation()}
                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                aria-label={tooltipText}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>{tooltipText}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </span>
  );
}
