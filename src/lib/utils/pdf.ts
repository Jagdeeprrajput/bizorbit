export function downloadPdf(params: {
  title: string;
  subtitle?: string;
  columns: string[];
  rows: (string | number)[][];
  filename: string;
}) {
  const { title, subtitle, columns, rows, filename } = params;

  import("jspdf").then(async ({ default: JsPDF }) => {
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new JsPDF({ orientation: rows.length > 0 && columns.length > 5 ? "landscape" : "portrait" });

    doc.setFontSize(14);
    doc.text(title, 14, 16);
    if (subtitle) {
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(subtitle, 14, 22);
    }

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: subtitle ? 28 : 22,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [234, 88, 12] },
      alternateRowStyles: { fillColor: [250, 250, 250] },
    });

    doc.save(filename);
  });
}
