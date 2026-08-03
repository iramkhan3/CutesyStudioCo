import { HeartIcon, SparkleIcon, StarIcon } from "@/components/Icons";

/**
 * Purely decorative, absolutely-positioned scatter of sparkle/star/heart
 * icons used sparingly behind hero/section content. aria-hidden since it
 * carries no information.
 */
export function DecorativeScatter({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <StarIcon className="absolute left-[8%] top-[15%] h-5 w-5 text-gold/70 animate-twinkle" />
      <SparkleIcon className="absolute right-[12%] top-[22%] h-6 w-6 text-pastel/60 animate-float" />
      <HeartIcon className="absolute left-[18%] bottom-[18%] h-5 w-5 text-blush-dark/70 animate-float" />
      <StarIcon className="absolute right-[20%] bottom-[12%] h-4 w-4 text-lavender-dark/70 animate-twinkle" />
      <SparkleIcon className="absolute left-[45%] top-[8%] h-4 w-4 text-babyblue-dark/70 animate-twinkle" />
    </div>
  );
}
