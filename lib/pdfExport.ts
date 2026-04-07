// PDF export — runs entirely in the browser.
// We snapshot a DOM element with html2canvas and embed it into a jsPDF doc.

import type { Roadmap } from "./types";

export async function exportRoadmapToPdf(
  element: HTMLElement,
  roadmap: Roadmap,
): Promise<void> {
  // Dynamic imports keep these heavy libs out of the server bundle.
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const canvas = await html2canvas(element, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth - 40;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  // Title page-ish header
  pdf.setFontSize(22);
  pdf.text(`LearnFlow — ${roadmap.domain} / ${roadmap.track}`, 20, 30);
  pdf.setFontSize(12);
  pdf.text(
    `${roadmap.totalWeeks} weeks · ${roadmap.totalHours}h · ${roadmap.hoursPerWeek}h/week · level: ${roadmap.level}`,
    20,
    50,
  );

  let y = 70;
  if (imgHeight < pageHeight - y) {
    pdf.addImage(imgData, "PNG", 20, y, imgWidth, imgHeight);
  } else {
    // Multi-page tiling for very tall captures.
    let remaining = imgHeight;
    let offsetY = 0;
    while (remaining > 0) {
      pdf.addImage(imgData, "PNG", 20, y - offsetY, imgWidth, imgHeight);
      remaining -= pageHeight - y;
      offsetY += pageHeight - y;
      if (remaining > 0) {
        pdf.addPage();
        y = 20;
      }
    }
  }

  pdf.save(`learnflow-${roadmap.domain.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}
