/**
 * Purely decorative wavy seam dropped at the bottom of a section, colored to
 * match the section that follows so the two blend with a soft curve instead
 * of a hard edge. aria-hidden since it carries no information.
 */
export function WaveDivider({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 60"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-x-0 bottom-0 h-10 w-full sm:h-14 ${className}`}
    >
      <path
        fill="currentColor"
        d="M0,32 C240,64 480,0 720,16 C960,32 1200,64 1440,32 L1440,60 L0,60 Z"
      />
    </svg>
  );
}
