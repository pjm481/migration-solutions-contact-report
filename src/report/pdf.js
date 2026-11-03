import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDisplayDate, formatDuration, reportFileName } from "../utils/format";

const COLORS = {
  ink: [31, 41, 51],
  line: [201, 209, 217],
  header: [233, 238, 242],
  total: [220, 231, 232],
};

const drawMatterHeader = (doc, report, matter, addPage = false) => {
  if (addPage) doc.addPage();
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...COLORS.ink);
  doc.text("Time Spent Matter Report", pageWidth / 2, 16, {
    align: "center",
  });

  autoTable(doc, {
    startY: 22,
    theme: "grid",
    body: [
      [
        `Contact Name: ${report.contact.name}`,
        `MS File No: ${report.contact.msFileNumber}`,
      ],
      [
        `Date Range: ${formatDisplayDate(
          report.range.startDate
        )} - ${formatDisplayDate(report.range.endDate)}`,
        `Matter No: ${matter.matterNumber}`,
      ],
    ],
    styles: {
      font: "helvetica",
      fontSize: 9,
      textColor: COLORS.ink,
      cellPadding: 2.2,
      lineColor: COLORS.line,
      lineWidth: 0.2,
    },
    columnStyles: { 0: { cellWidth: 88 }, 1: { cellWidth: 88 } },
    margin: { left: 17, right: 17 },
  });
  return doc.lastAutoTable.finalY;
};

const staffRows = (staff) => {
  const rowCount = Math.max(
    staff.stages.length,
    staff.categories.length,
    staff.activityTypes.length,
    1
  );
  return Array.from({ length: rowCount }, (_, index) => {
    const stage = staff.stages[index];
    const category = staff.categories[index];
    const activity = staff.activityTypes[index];
    return [
      stage?.label || "",
      stage ? String(stage.minutes) : "",
      category?.label || "",
      category ? String(category.minutes) : "",
      activity?.label || "",
      activity ? String(activity.minutes) : "",
    ];
  });
};

const estimateStaffHeight = (staff) =>
  24 +
  Math.max(
    staff.stages.length,
    staff.categories.length,
    staff.activityTypes.length,
    1
  ) *
    7;

const drawStaffTable = (doc, matter, staff, startY) => {
  const body = [
    [
      { content: "Matter No", colSpan: 2, styles: { fontStyle: "bold" } },
      { content: matter.matterNumber, colSpan: 4 },
    ],
    [
      { content: "Staff Member", colSpan: 2, styles: { fontStyle: "bold" } },
      { content: staff.ownerName, colSpan: 4 },
    ],
    ["Stage", "Time", "Category", "Time", "Activity Type", "Time"],
    ...staffRows(staff),
    [
      "Stage Total",
      formatDuration(staff.totalMinutes),
      "Category Total",
      formatDuration(staff.totalMinutes),
      "Activity Type Total",
      formatDuration(staff.totalMinutes),
    ],
  ];

  autoTable(doc, {
    startY,
    body,
    theme: "grid",
    rowPageBreak: "avoid",
    styles: {
      font: "helvetica",
      fontSize: 8,
      textColor: COLORS.ink,
      cellPadding: 2,
      lineColor: COLORS.line,
      lineWidth: 0.2,
      valign: "middle",
      overflow: "linebreak",
    },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 17, halign: "center" },
      2: { cellWidth: 40 },
      3: { cellWidth: 17, halign: "center" },
      4: { cellWidth: 42 },
      5: { cellWidth: 20, halign: "center" },
    },
    margin: { left: 16, right: 16 },
    didParseCell(data) {
      const isTotal = data.section === "body" && data.row.index === body.length - 1;
      const isIdentityRow = data.section === "body" && data.row.index < 2;
      const isHeaderRow = data.section === "body" && data.row.index === 2;
      if (isTotal) {
        data.cell.styles.fillColor = COLORS.total;
        data.cell.styles.fontStyle = "bold";
      } else if (isIdentityRow || isHeaderRow) {
        data.cell.styles.fillColor = COLORS.header;
        if (isHeaderRow) data.cell.styles.fontStyle = "bold";
      }
    },
  });
  return doc.lastAutoTable.finalY;
};

export const createPdfBlob = (report) => {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  let firstMatter = true;

  report.matters.forEach((matter) => {
    let y = drawMatterHeader(doc, report, matter, !firstMatter);
    firstMatter = false;
    matter.staff.forEach((staff) => {
      const bottom = doc.internal.pageSize.getHeight() - 16;
      if (y + estimateStaffHeight(staff) > bottom) {
        y = drawMatterHeader(doc, report, matter, true);
      }
      y = drawStaffTable(doc, matter, staff, y + 5);
    });
  });

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 112, 123);
    doc.text(
      `Page ${page} of ${pages}`,
      doc.internal.pageSize.getWidth() - 17,
      doc.internal.pageSize.getHeight() - 8,
      { align: "right" }
    );
  }

  return doc.output("blob");
};

export const downloadPdf = (report) => {
  const blob = createPdfBlob(report);
  const fileName = reportFileName(report, "pdf");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};
