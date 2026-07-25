/**
 * Umbra mark — a total eclipse. The warm ivory crescent is the corona escaping
 * past the umbral disc. Red is reserved for crisis, so the resting mark is light.
 */
export function UmbraMark({
  size = 24,
  className = "",
  tone = "#ece6d8",
}: {
  size?: number;
  className?: string;
  tone?: string;
}) {
  const id = `um-${size}-${tone.replace("#", "")}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <mask id={id}>
        <rect width="24" height="24" fill="#fff" />
        {/* the umbral moon occludes most of the disc, leaving a crescent */}
        <circle cx="14.4" cy="10.8" r="8.1" fill="#000" />
      </mask>
      {/* lit disc → becomes a crescent through the mask */}
      <circle cx="12" cy="12" r="7.9" fill={tone} mask={`url(#${id})`} />
      {/* corona ring */}
      <circle cx="12" cy="12" r="8.8" stroke={tone} strokeWidth="1.1" opacity="0.9" />
    </svg>
  );
}
