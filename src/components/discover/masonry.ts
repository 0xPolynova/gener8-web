"use client";

import { useEffect, useState } from "react";

export function useColumnCount() {
  const [count, setCount] = useState(2);
  useEffect(() => {
    const update = () => {
      const width = window.innerWidth;
      setCount(width >= 1280 ? 5 : width >= 768 ? 3 : 2);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return count;
}

export function aspectWeight(ratio: string) {
  if (ratio === "9:16") return 16 / 9;
  if (ratio === "3:4") return 4 / 3;
  if (ratio === "1:1") return 1;
  if (ratio === "4:3") return 3 / 4;
  return 9 / 16;
}

/** Drop each item into the current shortest column so the bottoms stay even. */
export function packColumns<T>(items: T[], count: number, heightOf: (item: T) => number) {
  const columns = Array.from({ length: Math.max(1, count) }, () => [] as T[]);
  const heights = Array(columns.length).fill(0);
  for (const item of items) {
    let slot = 0;
    for (let i = 1; i < columns.length; i++) {
      if (heights[i] < heights[slot]) slot = i;
    }
    columns[slot].push(item);
    heights[slot] += heightOf(item);
  }
  return columns;
}
