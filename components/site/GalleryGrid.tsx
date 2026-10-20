import Image from "next/image";

export function GalleryGrid({
  images,
  limit,
  altPrefix = "Swahili Komik Con",
}: {
  images: string[];
  limit?: number;
  altPrefix?: string;
}) {
  const shown = limit ? images.slice(0, limit) : images;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {shown.map((src, i) => (
        <div
          key={src}
          className="comic-panel-sm relative aspect-square overflow-hidden rounded-2xl bg-comic-black/5"
        >
          <Image
            src={src}
            alt={`${altPrefix} — photo ${i + 1}`}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            sizes="(min-width: 768px) 25vw, 50vw"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}
