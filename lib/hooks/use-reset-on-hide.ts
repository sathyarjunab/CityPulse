"use client";

import { useLayoutEffect, useRef } from "react";

// Next keeps visited pages mounted but hidden (React <Activity>), so their state survives
// navigation. Resetting when the page is hidden means coming back shows the loader and then
// fresh data, never the previous data first.
export function useResetOnHide(reset: () => void) {
  const latestReset = useRef(reset);
  useLayoutEffect(() => {
    latestReset.current = reset;
  });
  useLayoutEffect(() => () => latestReset.current(), []);
}
