import Image from "next/image";

export function BrandMark({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#110f10] ${className}`}>
      <Image
        src="/seismic_logo.jpg"
        alt="Seismic logo"
        fill
        sizes="96px"
        className="object-cover"
      />
    </div>
  );
}
