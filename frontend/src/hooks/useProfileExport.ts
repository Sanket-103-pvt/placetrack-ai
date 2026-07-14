// useProfileExport.ts — Custom hook for exporting a DOM element as a PNG download.
// Uses html2canvas at 2× scale for crisp high-DPI output.
// Returns { exportCard, exporting } — call exportCard(ref, filename) to trigger.

import { useCallback, useState } from "react";

export function useProfileExport() {
  const [exporting, setExporting] = useState(false);

  const exportCard = useCallback(async (element: HTMLElement, filename: string) => {
    setExporting(true);
    try {
      // Dynamic import keeps html2canvas out of the initial bundle
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
        // Prevent html2canvas from scrolling the document
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = filename;
      link.click();
    } finally {
      setExporting(false);
    }
  }, []);

  return { exportCard, exporting };
}
