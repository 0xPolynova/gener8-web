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

export const BENTO_ROW = 8;
export const BENTO_GAP = 12;

export function isWideAspect(ratio: string) {
  return ratio === "16:9" || ratio === "4:3";
}

export function heightOverWidth(ratio: string) {
  if (ratio === "9:16") return 16 / 9;
  if (ratio === "3:4") return 4 / 3;
  if (ratio === "1:1") return 1;
  if (ratio === "4:3") return 3 / 4;
  if (ratio === "16:9") return 9 / 16;
  return 16 / 9;
}

export function tileSpan(ratio: string, columns: number, colWidth: number) {
  const wide = isWideAspect(ratio);
  const colSpan = wide && columns >= 2 ? 2 : 1;
  const width = colSpan * colWidth + (colSpan - 1) * BENTO_GAP;
  const height = Math.max(colWidth, width * heightOverWidth(ratio));
  const rowSpan = Math.max(1, Math.round((height + BENTO_GAP) / (BENTO_ROW + BENTO_GAP)));
  return { colSpan, rowSpan };
}

export type BentoPlacement = {
  index: number;
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
};

/** Pack wide tiles across two columns and tall tiles down one column so the edges meet. */
export function packBento(
  count: number,
  columns: number,
  spanOf: (index: number) => { colSpan: number; rowSpan: number },
): BentoPlacement[] {
  const cols = Math.max(1, columns);
  const occupied: boolean[][] = [];
  const ensure = (row: number) => {
    while (occupied.length <= row) occupied.push(Array(cols).fill(false));
  };
  const fits = (col: number, row: number, colSpan: number, rowSpan: number) => {
    if (col + colSpan > cols) return false;
    for (let r = row; r < row + rowSpan; r++) {
      ensure(r);
      for (let c = col; c < col + colSpan; c++) {
        if (occupied[r][c]) return false;
      }
    }
    return true;
  };
  const mark = (col: number, row: number, colSpan: number, rowSpan: number) => {
    for (let r = row; r < row + rowSpan; r++) {
      ensure(r);
      for (let c = col; c < col + colSpan; c++) occupied[r][c] = true;
    }
  };

  const placed: BentoPlacement[] = [];
  for (let index = 0; index < count; index++) {
    const span = spanOf(index);
    const colSpan = Math.min(span.colSpan, cols);
    const rowSpan = Math.max(1, span.rowSpan);
    let found: { col: number; row: number } | null = null;
    const limit = occupied.length + rowSpan + 1;
    for (let row = 0; row < limit && !found; row++) {
      for (let col = 0; col <= cols - colSpan; col++) {
        if (fits(col, row, colSpan, rowSpan)) {
          found = { col, row };
          break;
        }
      }
    }
    const at = found ?? { col: 0, row: occupied.length };
    mark(at.col, at.row, colSpan, rowSpan);
    placed.push({ index, col: at.col, row: at.row, colSpan, rowSpan });
  }
  return placed;
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
