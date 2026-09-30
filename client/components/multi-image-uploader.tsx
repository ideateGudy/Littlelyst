"use client";

import React, { useRef, useState } from "react";
import { Camera, Plus, Trash2, RefreshCw, UploadCloud, Image as ImageIcon } from "lucide-react";
import { compressImage } from "@/lib/cloudinary-upload";

export interface ImageUploadItem {
  id: string;
  file?: File;
  previewUrl: string;
  isCover?: boolean;
}

interface MultiImageUploaderProps {
  images: ImageUploadItem[];
  onChange: (images: ImageUploadItem[]) => void;
  maxImages?: number;
}

export function MultiImageUploader({
  images,
  onChange,
  maxImages = 6,
}: MultiImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) return;

    const filesToProcess = Array.from(fileList)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, remainingSlots);

    if (filesToProcess.length === 0) return;

    setIsProcessing(true);
    const newItems: ImageUploadItem[] = [];

    for (const file of filesToProcess) {
      try {
        const compressed = await compressImage(file);
        const previewUrl = URL.createObjectURL(compressed);
        newItems.push({
          id: Math.random().toString(36).substring(2, 9),
          file: compressed,
          previewUrl,
        });
      } catch (err) {
        console.error("Compression error:", err);
        const previewUrl = URL.createObjectURL(file);
        newItems.push({
          id: Math.random().toString(36).substring(2, 9),
          file,
          previewUrl,
        });
      }
    }

    onChange([...images, ...newItems]);
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemove = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleSetCover = (index: number) => {
    if (index === 0) return;
    const item = images[index];
    const rest = images.filter((_, i) => i !== index);
    onChange([item, ...rest]);
  };

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleCardDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleCardDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleCardDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(null);
  };

  const handleCardDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(null);

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const reordered = [...images];
    const [draggedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(dropIndex, 0, draggedItem);

    onChange(reordered);
    setDraggedIndex(null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const cameraInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3 w-full">
      {/* File input for photo gallery selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {/* File input for direct camera capture on mobile */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Grid of Uploaded Images */}
      {images.length > 0 ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((img, idx) => {
              const isCover = idx === 0;
              const isBeingDragged = draggedIndex === idx;
              const isTargetDrop = dragOverIndex === idx;

              return (
                <div
                  key={img.id}
                  draggable
                  onDragStart={(e) => handleCardDragStart(e, idx)}
                  onDragOver={(e) => handleCardDragOver(e, idx)}
                  onDragLeave={handleCardDragLeave}
                  onDrop={(e) => handleCardDrop(e, idx)}
                  className={`relative group rounded-2xl overflow-hidden aspect-square border cursor-grab active:cursor-grabbing transition-all duration-200 ${
                    isCover
                      ? "border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.35)] ring-2 ring-emerald-500/60"
                      : "border-white/10 hover:border-white/30"
                  } ${
                    isTargetDrop
                      ? isCover
                        ? "border-emerald-400 bg-emerald-500/20 scale-105 ring-4 ring-emerald-400"
                        : "border-cyan-400 bg-cyan-500/20 scale-105 ring-2 ring-cyan-400"
                      : ""
                  } ${isBeingDragged ? "opacity-30 scale-95" : "opacity-100"} bg-black/60`}
                >
                  <img
                    src={img.previewUrl}
                    alt={`Product photo ${idx + 1}`}
                    className="w-full h-full object-cover pointer-events-none group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Primary / Cover Tag or Drop Overlay */}
                  {isCover ? (
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-emerald-500 text-black text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow pointer-events-none">
                      <span>Cover Photo</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetCover(idx)}
                      className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 bg-black/75 hover:bg-emerald-500 hover:text-black text-white/90 text-[9px] font-semibold px-2 py-0.5 rounded-full transition-all cursor-pointer backdrop-blur-sm"
                    >
                      Make Cover
                    </button>
                  )}

                  {/* Drop hint when dragging over cover position */}
                  {isTargetDrop && isCover && (
                    <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-2 text-center pointer-events-none animate-in fade-in">
                      <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                        Drop to Make Cover!
                      </span>
                    </div>
                  )}

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-rose-500 text-white/80 hover:text-white transition-all cursor-pointer backdrop-blur-sm opacity-90 group-hover:opacity-100"
                    title="Remove image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Drag reorder handle indicator */}
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[9px] text-white/40 pointer-events-none group-hover:text-white/80 transition-colors">
                    Drag to move
                  </div>
                </div>
              );
            })}

            {/* Add More Button if slots available */}
            {images.length < maxImages && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="rounded-2xl border-2 border-dashed border-white/20 hover:border-emerald-400 bg-white/5 hover:bg-emerald-500/5 aspect-square flex flex-col items-center justify-center p-3 text-center transition-all cursor-pointer group disabled:opacity-50"
              >
                {isProcessing ? (
                  <div className="w-6 h-6 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-full bg-white/10 group-hover:bg-emerald-500/20 text-white/60 group-hover:text-emerald-400 flex items-center justify-center mb-1.5 transition-colors">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-white/70 group-hover:text-emerald-300">
                      Add Image
                    </span>
                    <span className="text-[10px] text-white/40">
                      {images.length}/{maxImages}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-white/50 px-1">
            <span>First photo is used as main store display card cover.</span>
            <span>{images.length} of {maxImages} uploaded</span>
          </div>
        </div>
      ) : (
        /* Empty State Dropzone */
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer w-full rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-8 sm:p-12 text-center aspect-[4/5] sm:aspect-[16/9] max-h-[320px] ${
            dragActive
              ? "border-emerald-400 bg-emerald-950/20 scale-[0.99]"
              : "border-white/15 hover:border-white/40 liquid-glass hover:bg-white/[0.03]"
          }`}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
              <p className="text-sm font-medium text-white/80">Processing photos...</p>
              <span className="text-xs text-white/40">Optimizing images for rapid upload</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full liquid-glass-card flex items-center justify-center text-white/90 shadow-xl group-hover:scale-110 transition-transform">
                <Camera className="w-8 h-8 text-emerald-400" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Upload Product Photos
                </h3>
                <p className="text-xs text-white/50 mt-1 max-w-xs">
                  Select up to {maxImages} images. First image will be used as the cover photo.
                </p>
              </div>

              <div className="flex items-center gap-3 mt-1" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="liquid-glass-button text-xs font-semibold px-4 py-2 rounded-full text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 cursor-pointer shadow-lg hover:scale-105 transition-all"
                >
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>Snap Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="liquid-glass-button text-xs font-semibold px-4 py-2 rounded-full text-white/90 hover:text-white flex items-center gap-1.5 cursor-pointer shadow-lg hover:scale-105 transition-all"
                >
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  <span>Photo Gallery</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
