/**
 * src/components/dashboard/AttachmentItem.tsx
 *
 * Robust, production-grade attachment renderer for Fixora Admin Dashboard.
 * Supports:
 * - Cloudinary & backend images (JPEG, PNG, WebP, GIF, SVG, etc.)
 * - Cloudinary & backend videos (MP4, MOV, WebM, etc.) with video player preview
 * - PDFs and office/text documents with distinct badges
 * - Click-to-preview lightbox modal for full-size viewing
 * - Safe error handling with informative fallback states (no blank boxes)
 */

import { useState } from "react";
import {
  FileText,
  File,
  Download,
  Eye,
  Play,
  Maximize2,
  X,
  AlertCircle,
  Film,
  Image as ImageIcon,
} from "lucide-react";
import { getAttachmentUrl, getAttachmentType, getMediaUrl, type AttachmentType } from "@/lib/api";

interface AttachmentItemProps {
  attachment: string | { url?: string; fileUrl?: string; secure_url?: string; path?: string; name?: string; type?: string; resource_type?: string; format?: string };
  index: number;
}

export function AttachmentItem({ attachment, index }: AttachmentItemProps) {
  // Safe diagnostic log during development (does not log secrets)
  console.log("[Attachment Diagnostic]", {
    index,
    type: typeof attachment,
    keys: attachment && typeof attachment === "object" ? Object.keys(attachment) : null,
    resource_type: attachment && typeof attachment === "object" ? (attachment as any).resource_type : null,
    format: attachment && typeof attachment === "object" ? (attachment as any).format : null,
  });

  const fullUrl = getAttachmentUrl(attachment);
  const fileType: AttachmentType = getAttachmentType(attachment);

  const [hasError, setHasError] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Extract display filename safely using getMediaUrl (never calls .split() on a non-string)
  const mediaUrl = getMediaUrl(attachment);
  const fileName =
    typeof mediaUrl === "string"
      ? (mediaUrl.split("/").pop()?.split("?")[0] ?? `Attachment ${index + 1}`)
      : `Attachment ${index + 1}`;

  if (!fullUrl) return null;

  return (
    <>
      <div className="p-3 rounded-xl bg-card border border-border flex flex-col items-center justify-between text-center gap-2 group hover:border-primary/40 hover:shadow-sm transition-all relative">
        {/* MEDIA PREVIEW CONTAINER */}
        <div className="w-full h-28 rounded-lg overflow-hidden bg-muted/60 relative flex items-center justify-center border border-border/40">
          {hasError ? (
            <div className="flex flex-col items-center justify-center p-2 text-muted-foreground text-xs gap-1">
              <AlertCircle className="w-6 h-6 text-amber-500" />
              <span className="text-[11px] font-medium">Failed to load</span>
            </div>
          ) : fileType === "image" ? (
            <div
              className="w-full h-full relative cursor-pointer group/img"
              onClick={() => setIsPreviewOpen(true)}
              title="Click to preview image"
            >
              <img
                src={fullUrl}
                alt={fileName || `Attachment ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-200 group-hover/img:scale-105"
                onError={() => setHasError(true)}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-medium">
                <Eye className="w-4 h-4" /> Preview
              </div>
            </div>
          ) : fileType === "video" ? (
            <div className="w-full h-full relative group/vid bg-black flex items-center justify-center">
              <video
                src={fullUrl}
                preload="metadata"
                className="w-full h-full object-cover opacity-80 group-hover/vid:opacity-95 transition-opacity"
                onError={() => setHasError(true)}
              />
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors text-white"
                title="Click to play video"
              >
                <div className="w-9 h-9 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-lg group-hover/vid:scale-110 transition-transform">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
              </button>
              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-medium text-white flex items-center gap-1 pointer-events-none">
                <Film className="w-3 h-3 text-primary" /> Video
              </div>
            </div>
          ) : fileType === "pdf" ? (
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-1.5 p-2 w-full h-full hover:bg-muted/80 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center font-bold text-xs border border-red-200/60 shadow-sm">
                PDF
              </div>
              <span className="text-[11px] font-medium text-foreground truncate max-w-[130px]" title={fileName}>
                {fileName || `Document #${index + 1}`}
              </span>
            </a>
          ) : (
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-1.5 p-2 w-full h-full hover:bg-muted/80 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-200/60 shadow-sm">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium text-foreground truncate max-w-[130px]" title={fileName}>
                {fileName || `File #${index + 1}`}
              </span>
            </a>
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="w-full flex items-center gap-1.5 pt-0.5">
          {(fileType === "image" || fileType === "video") && !hasError && (
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="flex-1 py-1.5 px-2 rounded-lg bg-secondary/80 hover:bg-secondary text-[11px] font-medium text-foreground flex items-center justify-center gap-1 transition-colors border border-border/50"
            >
              <Eye className="w-3 h-3 text-muted-foreground" /> View
            </button>
          )}
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="flex-1 py-1.5 px-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-[11px] font-semibold text-primary flex items-center justify-center gap-1 transition-colors border border-primary/20"
          >
            <Download className="w-3 h-3" /> Download
          </a>
        </div>
      </div>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="relative max-w-4xl max-h-[90vh] w-full bg-card rounded-2xl overflow-hidden shadow-2xl border border-border flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/90">
              <div className="flex items-center gap-2 min-w-0">
                {fileType === "video" ? (
                  <Film className="w-4 h-4 text-primary shrink-0" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-primary shrink-0" />
                )}
                <span className="text-sm font-semibold text-foreground truncate">
                  {fileName || `Attachment #${index + 1}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={fullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  title="Close preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Media Body */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/40 min-h-[300px]">
              {fileType === "video" ? (
                <video
                  src={fullUrl}
                  controls
                  autoPlay
                  className="max-h-[70vh] max-w-full rounded-lg shadow-lg"
                >
                  <source src={fullUrl} type="video/mp4" />
                  Your browser does not support HTML5 video.
                </video>
              ) : (
                <img
                  src={fullUrl}
                  alt={fileName || `Attachment ${index + 1}`}
                  className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
