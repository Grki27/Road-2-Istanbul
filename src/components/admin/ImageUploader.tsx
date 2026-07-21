"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { ArrowLeft, ArrowRight, ImagePlus, LoaderCircle, RefreshCw, Trash2 } from "lucide-react";
import {
  createImageRecordAction,
  deleteImageAction,
  reorderImagesAction,
  type AdminActionResult
} from "@app/admin/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { AdminActionMessage } from "@/components/admin/AdminFormUi";

export type AdminImage = {
  id: string;
  imageUrl: string;
  storagePath?: string;
  sortOrder: number;
};

type PendingUpload = {
  key: string;
  file: File;
  status: "waiting" | "compressing" | "uploading" | "error";
  error?: string;
};

type ImageUploaderProps = {
  kind: "recap" | "event";
  parentId?: string;
  initialImages: AdminImage[];
  maxImages: number;
};

const maxOriginalBytes = 20 * 1024 * 1024;

export function ImageUploader({ kind, parentId, initialImages, maxImages }: ImageUploaderProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState(() => [...initialImages].sort((a, b) => a.sortOrder - b.sortOrder));
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [result, setResult] = useState<AdminActionResult | null>(null);
  const [busyImageId, setBusyImageId] = useState<string>();
  const bucket = kind === "recap" ? "recap-images" : "map-event-images";

  async function uploadOne(item: PendingUpload, requestedSortOrder?: number) {
    if (!parentId) return;

    setPending((items) => items.map((current) => current.key === item.key ? { ...current, status: "compressing", error: undefined } : current));

    try {
      const compressed = await imageCompression(item.file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 2000,
        useWebWorker: true,
        fileType: "image/webp",
        initialQuality: 0.82
      });

      setPending((items) => items.map((current) => current.key === item.key ? { ...current, status: "uploading" } : current));
      const storagePath = `${parentId}/${crypto.randomUUID()}.webp`;
      const supabase = createSupabaseBrowserClient();
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(storagePath, compressed, { contentType: "image/webp", upsert: false });

      if (uploadError) throw new Error(uploadError.message);

      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(storagePath);
      const record = await createImageRecordAction({
        kind,
        parentId,
        imageUrl: publicUrlData.publicUrl,
        storagePath,
        sortOrder: requestedSortOrder ?? images.length,
        altText: item.file.name
      });

      if (!record.ok || !record.id) {
        await supabase.storage.from(bucket).remove([storagePath]);
        throw new Error(record.message);
      }

      setImages((current) => [
        ...current,
        {
          id: record.id!,
          imageUrl: publicUrlData.publicUrl,
          storagePath,
          sortOrder: current.length
        }
      ]);
      setPending((items) => items.filter((current) => current.key !== item.key));
      setResult({ ok: true, message: "Slika je uploadana." });
      router.refresh();
    } catch (error) {
      setPending((items) => items.map((current) => current.key === item.key
        ? { ...current, status: "error", error: error instanceof Error ? error.message : "Upload nije uspio." }
        : current));
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || !parentId) return;
    const available = maxImages - images.length - pending.length;
    const selected = Array.from(files).slice(0, Math.max(available, 0));

    if (selected.length < files.length) {
      setResult({ ok: false, message: `Možeš imati najviše ${maxImages} slika.` });
    }

    const valid: PendingUpload[] = [];
    selected.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        setResult({ ok: false, message: `${file.name} nije fotografija.` });
        return;
      }
      if (file.size > maxOriginalBytes) {
        setResult({ ok: false, message: `${file.name} je veći od 20 MB.` });
        return;
      }
      valid.push({ key: crypto.randomUUID(), file, status: "waiting" });
    });

    setPending((current) => [...current, ...valid]);
    for (const [index, item] of valid.entries()) {
      await uploadOne(item, images.length + index);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  async function removeImage(image: AdminImage) {
    if (!window.confirm("Trajno ukloniti ovu fotografiju?")) return;
    setBusyImageId(image.id);
    const actionResult = await deleteImageAction(kind, image.id);
    setResult(actionResult);
    if (actionResult.ok) {
      setImages((current) => current.filter((item) => item.id !== image.id));
      router.refresh();
    }
    setBusyImageId(undefined);
  }

  async function moveImage(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= images.length) return;

    const reordered = [...images];
    [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];
    const normalized = reordered.map((image, sortOrder) => ({ ...image, sortOrder }));
    setImages(normalized);
    const actionResult = await reorderImagesAction({
      kind,
      items: normalized.map((image) => ({ id: image.id, sortOrder: image.sortOrder }))
    });
    setResult(actionResult);
    if (!actionResult.ok) setImages(images);
  }

  if (!parentId) {
    return (
      <div className="rounded-2xl border border-dashed border-coffee/25 bg-white/40 p-5 text-sm font-bold text-coffee/70">
        Prvo spremi nacrt. Nakon toga možeš dodati fotografije bez gubitka teksta.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-black text-coffee">{images.length}/{maxImages} fotografija</p>
        <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-sunset px-5 py-3 font-black text-ink">
          <ImagePlus size={19} />
          Dodaj fotografije
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={images.length + pending.length >= maxImages}
            onChange={(event) => void handleFiles(event.target.files)}
          />
        </label>
      </div>

      <AdminActionMessage result={result} />

      {images.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => (
            <div key={image.id} className="overflow-hidden rounded-2xl bg-white shadow-paper">
              <div className="relative aspect-[4/3]">
                <Image src={image.imageUrl} alt={`Fotografija ${index + 1}`} fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
                {index === 0 ? <span className="absolute left-2 top-2 rounded-full bg-ink px-3 py-1 text-xs font-black text-paper">Naslovna</span> : null}
              </div>
              <div className="flex items-center justify-between p-2">
                <div className="flex gap-1">
                  <button type="button" onClick={() => void moveImage(index, -1)} disabled={index === 0} className="grid h-10 w-10 place-items-center rounded-full bg-sand disabled:opacity-30" aria-label="Pomakni lijevo"><ArrowLeft size={17} /></button>
                  <button type="button" onClick={() => void moveImage(index, 1)} disabled={index === images.length - 1} className="grid h-10 w-10 place-items-center rounded-full bg-sand disabled:opacity-30" aria-label="Pomakni desno"><ArrowRight size={17} /></button>
                </div>
                <button type="button" onClick={() => void removeImage(image)} disabled={busyImageId === image.id} className="grid h-10 w-10 place-items-center rounded-full bg-red-100 text-red-900" aria-label="Obriši fotografiju">
                  {busyImageId === image.id ? <LoaderCircle className="animate-spin" size={17} /> : <Trash2 size={17} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {pending.length ? (
        <div className="space-y-2">
          {pending.map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-3 rounded-2xl bg-white/70 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-black">{item.file.name}</p>
                <p className={`text-xs font-bold ${item.status === "error" ? "text-red-800" : "text-coffee/60"}`}>
                  {item.status === "compressing" ? "Kompresiram..." : item.status === "uploading" ? "Uploadam..." : item.status === "error" ? item.error : "Čeka upload"}
                </p>
              </div>
              {item.status === "error" ? (
                <button type="button" onClick={() => void uploadOne(item)} className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-2 text-xs font-black text-red-900"><RefreshCw size={15} /> Ponovi</button>
              ) : <LoaderCircle className="shrink-0 animate-spin text-clay" size={19} />}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
