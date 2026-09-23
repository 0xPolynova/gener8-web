"use client";

import { useEffect, useRef, useState } from "react";
import { BENTO_GAP, BENTO_ROW, packBento, tileSpan, useColumnCount } from "./masonry";

export function BentoGrid({
  items,
  render,
}: {
  items: { key: string; aspectRatio: string }[];
  render: (index: number) => React.ReactNode;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [gridWidth, setGridWidth] = useState(0);
  const columns = useColumnCount();

  useEffect(() => {
    const node = gridRef.current;
    if (!node) return;
    const measure = () => setGridWidth(node.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const colWidth =
    gridWidth > 0 ? (gridWidth - BENTO_GAP * (columns - 1)) / columns : 280;
  const placed = packBento(items.length, columns, (index) =>
    tileSpan(items[index]?.aspectRatio ?? "9:16", columns, colWidth),
  );

  return (
    <div
      ref={gridRef}
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gridAutoRows: `${BENTO_ROW}px`,
        gap: BENTO_GAP,
      }}
    >
      {placed.map((spot) => (
        <div
          key={items[spot.index]?.key ?? spot.index}
          className="min-h-0 min-w-0"
          style={{
            gridColumn: `${spot.col + 1} / span ${spot.colSpan}`,
            gridRow: `${spot.row + 1} / span ${spot.rowSpan}`,
          }}
        >
          {render(spot.index)}
        </div>
      ))}
    </div>
  );
}
