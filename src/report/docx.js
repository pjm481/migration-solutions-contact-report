import {
  AlignmentType,
  BorderStyle,
  Document,
  PageBreak,
  PageOrientation,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import { formatDisplayDate, formatDuration, reportFileName } from "../utils/format";
import { downloadBlob } from "./download";

const COLORS = {
  ink: "1F2933",
  muted: "52606D",
  line: "C9D1D9",
  header: "E9EEF2",
  total: "DCE7E8",
};

const border = {
  style: BorderStyle.SINGLE,
  size: 5,
  color: COLORS.line,
};

const cell = (
  text,
  { bold = false, align = AlignmentType.LEFT, fill, width, columnSpan } = {}
) =>
  new TableCell({
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    columnSpan,
    verticalAlign: VerticalAlign.CENTER,
    shading: fill ? { fill } : undefined,
    margins: { top: 90, right: 110, bottom: 90, left: 110 },
    borders: { top: border, right: border, bottom: border, left: border },
    children: [
      new Paragraph({
        alignment: align,
        spacing: { before: 0, after: 0 },
        children: [
          new TextRun({
            text: String(text ?? ""),
            bold,
            color: COLORS.ink,
            font: "Arial",
            size: 18,
          }),
        ],
      }),
    ],
  });

const metadataTable = (report, matter) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [5000, 5000],
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          cell(`Contact Name: ${report.contact.name}`, { width: 50 }),
          cell(`MS File No: ${report.contact.msFileNumber}`, { width: 50 }),
        ],
      }),
      new TableRow({
        cantSplit: true,
        children: [
          cell(
            `Date Range: ${formatDisplayDate(
              report.range.startDate
            )} - ${formatDisplayDate(report.range.endDate)}`,
            { width: 50 }
          ),
          cell(`Matter No: ${matter.matterNumber}`, { width: 50 }),
        ],
      }),
    ],
  });

const valueAt = (items, index) => items[index] || { label: "", minutes: null };

const staffTable = (matter, staff) => {
  const rowCount = Math.max(
    staff.stages.length,
    staff.categories.length,
    staff.activityTypes.length,
    1
  );
  const rows = [
    new TableRow({
      cantSplit: true,
      children: [
        cell("Matter No", { bold: true, fill: COLORS.header, columnSpan: 2 }),
        cell(matter.matterNumber, { columnSpan: 4 }),
      ],
    }),
    new TableRow({
      cantSplit: true,
      children: [
        cell("Staff Member", {
          bold: true,
          fill: COLORS.header,
          columnSpan: 2,
        }),
        cell(staff.ownerName, { columnSpan: 4 }),
      ],
    }),
    new TableRow({
      tableHeader: true,
      cantSplit: true,
      children: [
        cell("Stage", { bold: true, fill: COLORS.header, width: 24 }),
        cell("Time", {
          bold: true,
          fill: COLORS.header,
          align: AlignmentType.CENTER,
          width: 10,
        }),
        cell("Category", { bold: true, fill: COLORS.header, width: 23 }),
        cell("Time", {
          bold: true,
          fill: COLORS.header,
          align: AlignmentType.CENTER,
          width: 10,
        }),
        cell("Activity Type", {
          bold: true,
          fill: COLORS.header,
          width: 23,
        }),
        cell("Time", {
          bold: true,
          fill: COLORS.header,
          align: AlignmentType.CENTER,
          width: 10,
        }),
      ],
    }),
  ];

  for (let index = 0; index < rowCount; index += 1) {
    const stage = valueAt(staff.stages, index);
    const category = valueAt(staff.categories, index);
    const activity = valueAt(staff.activityTypes, index);
    rows.push(
      new TableRow({
        cantSplit: true,
        children: [
          cell(stage.label),
          cell(stage.minutes == null ? "" : String(stage.minutes), {
            align: AlignmentType.CENTER,
          }),
          cell(category.label),
          cell(category.minutes == null ? "" : String(category.minutes), {
            align: AlignmentType.CENTER,
          }),
          cell(activity.label),
          cell(activity.minutes == null ? "" : String(activity.minutes), {
            align: AlignmentType.CENTER,
          }),
        ],
      })
    );
  }

  rows.push(
    new TableRow({
      cantSplit: true,
      children: [
        cell("Stage Total", { bold: true, fill: COLORS.total }),
        cell(formatDuration(staff.totalMinutes), {
          bold: true,
          fill: COLORS.total,
          align: AlignmentType.CENTER,
        }),
        cell("Category Total", { bold: true, fill: COLORS.total }),
        cell(formatDuration(staff.totalMinutes), {
          bold: true,
          fill: COLORS.total,
          align: AlignmentType.CENTER,
        }),
        cell("Activity Type Total", { bold: true, fill: COLORS.total }),
        cell(formatDuration(staff.totalMinutes), {
          bold: true,
          fill: COLORS.total,
          align: AlignmentType.CENTER,
        }),
      ],
    })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [2400, 1000, 2300, 1000, 2300, 1000],
    rows,
  });
};

const matterChildren = (report, matter, index) => {
  const children = [];
  if (index > 0) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
  }
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      keepNext: true,
      spacing: { after: 180 },
      children: [
        new TextRun({
          text: "Time Spent Matter Report",
          bold: true,
          color: COLORS.ink,
          font: "Arial",
          size: 30,
        }),
      ],
    }),
    metadataTable(report, matter),
    new Paragraph({ spacing: { before: 0, after: 0 }, children: [] })
  );

  matter.staff.forEach((staff, staffIndex) => {
    if (staffIndex > 0) {
      children.push(
        new Paragraph({ spacing: { before: 120, after: 40 }, children: [] })
      );
    }
    children.push(staffTable(matter, staff));
  });
  return children;
};

export const createDocxBlob = async (report) => {
  const document = new Document({
    creator: "Migration Solutions",
    title: "Time Spent Matter Report",
    description: "Matter time-spent summary generated from Zoho CRM.",
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906,
              height: 16838,
              orientation: PageOrientation.PORTRAIT,
            },
            margin: { top: 900, right: 900, bottom: 900, left: 900 },
          },
        },
        children: report.matters.flatMap((matter, index) =>
          matterChildren(report, matter, index)
        ),
      },
    ],
  });
  return Packer.toBlob(document);
};

export const downloadDocx = async (report) => {
  const blob = await createDocxBlob(report);
  downloadBlob(blob, reportFileName(report, "docx"));
};
