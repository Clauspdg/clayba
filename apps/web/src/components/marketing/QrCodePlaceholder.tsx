/**
 * Decorative QR-code-shaped placeholder (Sprint 7: "QR Code (placeholder)")
 * — a deterministic pseudo-random grid styled to look like a QR code. It
 * does not encode anything and isn't scannable: there's no published app
 * listing yet for a real code to point to, so a fake-but-scannable code
 * would be actively misleading. Once real store listings exist, swap this
 * for a real generated code pointing at them.
 */
export function QrCodePlaceholder({ size = 96 }: { size?: number }) {
  const cells = 7;
  const cellSize = size / cells;

  // Deterministic pattern (not random per render) so the placeholder doesn't flicker on re-render.
  const pattern = [
    [1, 1, 1, 0, 1, 1, 1],
    [1, 0, 1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1],
    [0, 0, 0, 1, 0, 0, 0],
    [1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 1],
    [1, 1, 1, 0, 1, 1, 1],
  ];

  return (
    <div
      className="shadow-elevation1 rounded-xl bg-white p-2"
      style={{ width: size + 16, height: size + 16 }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        role="img"
        aria-label="QR code placeholder"
      >
        <rect width={size} height={size} fill="white" />
        {pattern.map((row, y) =>
          row.map((cell, x) =>
            cell ? (
              <rect
                key={`${x}-${y}`}
                x={x * cellSize}
                y={y * cellSize}
                width={cellSize}
                height={cellSize}
                fill="#232323"
              />
            ) : null,
          ),
        )}
      </svg>
    </div>
  );
}
