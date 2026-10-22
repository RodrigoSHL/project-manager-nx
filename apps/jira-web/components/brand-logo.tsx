export function FlowBoardLogo({
  className,
  alt = '',
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src="/flowboard-icon.svg"
      alt={alt}
      aria-hidden={alt ? undefined : true}
      className={className}
    />
  );
}
