"use client";

import React, { useRef, useState } from "react";
import { Camera, Image as ImageIcon, RefreshCw, UploadCloud } from "lucide-react";
import { compressImage } from "@/lib/cloudinary-upload";

interface CameraCaptureProps {
  onImageReady: (file: File, previewUrl: string) => void;
  isCompressing: boolean;
  setIsCompressing: (val: boolean) => void;
  currentPreviewUrl: string | null;
  onClear: () => void;
}

export function CameraCapture({
  onImageReady,
  isCompressing,
  setIsCompressing,
  currentPreviewUrl,
  onClear,
}: CameraCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file");
      return;
    }

    setIsCompressing(true);
    try {
      // 1. Immediately compress client-side before showing preview
      const compressed = await compressImage(file);
      const preview = URL.createObjectURL(compressed);
      onImageReady(compressed, preview);
    } catch (err) {
      console.error("Image processing error:", err);
      const preview = URL.createObjectURL(file);
      onImageReady(file, preview);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full">
      {/* Hidden file input with direct camera capture on mobile phones */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {currentPreviewUrl ? (
        <div className="relative group rounded-3xl overflow-hidden liquid-glass border border-white/20 aspect-[4/5] sm:aspect-[16/10] w-full max-h-[380px] flex items-center justify-center bg-black/60 shadow-2xl">
          {/* Compressed Image Preview */}
          <img
            src={currentPreviewUrl}
            alt="Listing Preview"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

          {/* Retake badge */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              type="button"
              onClick={() => {
                onClear();
                fileInputRef.current?.click();
              }}
              className="liquid-glass-button px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 text-white/90 hover:text-white"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retake Photo
            </button>
          </div>

          <div className="absolute bottom-4 left-4 text-xs font-medium text-emerald-400 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Optimized & Compressed
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer w-full rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-8 sm:p-12 text-center aspect-[4/5] sm:aspect-[16/9] max-h-[360px] ${
            dragActive
              ? "border-emerald-400 bg-emerald-950/20 scale-[0.99]"
              : "border-white/15 hover:border-white/40 liquid-glass hover:bg-white/[0.03]"
          }`}
        >
          {isCompressing ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
              <p className="text-sm font-medium text-white/80">Compressing photo...</p>
              <span className="text-xs text-white/40">Optimizing for fast upload</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full liquid-glass-card flex items-center justify-center text-white/90 shadow-xl group-hover:scale-110 transition-transform">
                <Camera className="w-9 h-9 text-emerald-400" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white tracking-tight">
                  Snap or Upload Item
                </h3>
                <p className="text-xs text-white/50 mt-1 max-w-xs">
                  Opens camera directly on mobile. Auto-compressed to ~1MB for rapid upload.
                </p>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <span className="liquid-glass-button text-xs font-medium px-4 py-2 rounded-full text-white/90 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-emerald-400" /> Camera
                </span>
                <span className="liquid-glass-button text-xs font-medium px-4 py-2 rounded-full text-white/70 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" /> Gallery
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
