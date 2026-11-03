# Time Spent Matter Report Template Specification

## Reference

- Source: `C:\Users\Administrator\Downloads\Time Spent Report Format.docx`
- SHA-256: `4A00FCDEDD8D6A488E88B086A02136D850C80F935EC2D274D581FFFB8E9AB3F2`
- Stored page count: 2
- Sections: 1
- Page: A4 portrait, 8.27 by 11.69 inches
- Margins: 1 inch on all sides
- Headers and footers: empty
- Tables: four, all using the Word `Table Grid` style

The packaged document renderer was unavailable on the Windows host because the
bundled workspace runtime did not contain LibreOffice. The source was therefore
inspected structurally with the bundled document runtime, including paragraphs,
tables, styles, sections, package parts, and field content. The source file was
not modified.

## Report Page Pattern

Each Matter starts on a new page and repeats the same page pattern:

1. Centered title: `Time Spent Matter Report`.
2. Two-column, two-row metadata table:
   - Contact Name | MS File No
   - Date Range | Matter No
3. One staff summary table for each selected History Owner with time entries on
   that Matter.

## Staff Summary Table

The table contains six columns:

| Stage | Time | Category | Time | Activity Type | Time |
| --- | ---: | --- | ---: | --- | ---: |

The first two rows identify the Matter Number and Staff Member. The body lists
independently aggregated values for Stage, Category, and Activity Type. The
final row shows Stage Total, Category Total, and Activity Type Total. All three
totals represent the same total duration for that staff member on that Matter.

## CRM Slot Map

| Report value | CRM source |
| --- | --- |
| Contact Name | `Contacts.Full_Name` |
| MS File No | `Contacts.ID_Number` |
| Date Range | User-selected inclusive start and end dates |
| Matter No | `Applications.Name`, with `Applications_History.Matter_No` retained as a record snapshot |
| Staff Member | `Applications_History.Owner` |
| Stage | `Applications_History.Current_Stage` |
| Category | `Applications_History.History_Type` |
| Activity Type | `Applications_History.History_Result` |
| Time | `Applications_History.Duration_Min` |
| History date | `Applications_History.Date` |

## Report Rules

- Users can select all History Owners or any combination of owners.
- The date range is inclusive.
- Zero-minute, invalid-date, and out-of-range entries are omitted.
- New Matter summaries begin on a new page.
- Staff summary rows do not split across pages when the target format supports it.
- Totals are formatted as hours and minutes, for example `3 hr 15 min`.
- The DOCX and PDF use the same normalized report data and aggregation rules as
  the on-screen preview.
