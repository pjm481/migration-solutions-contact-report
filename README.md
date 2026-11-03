# Time Spent Report Widget

A Zoho CRM embedded widget that builds the Time Spent Matter Report from Matter
History. The widget opens directly on the report preview and downloads the same
report as DOCX or PDF.

## Supported CRM contexts

- **Contact record:** loads the Contact, its related `Applications`, and each
  Matter's `Application_History` related list.
- **Application record:** loads the current Matter and its primary Contact.
- **Local browser:** automatically uses representative demo data so the full
  preview and download flow can be tested outside Zoho CRM.

The widget is read-only. It does not create or update CRM records.

## Report behavior

- Inclusive start and end dates.
- Multi-select History Owner filter with Select All and Clear All.
- Compact filters in the report toolbar; there is no separate setup page.
- One report page per Matter.
- One summary per Staff Member, aggregating minutes by Stage, Category, and
  Activity Type.
- Total Duration in hours and minutes.
- Browser-side DOCX and PDF generation; no report server is required.

The source template was distilled into
[`docs/report-template-spec.md`](docs/report-template-spec.md).

## Install and run

```powershell
pnpm install
pnpm dev
```

Open the local URL shown by Vite. When the Zoho Embedded App SDK is unavailable,
the widget starts in Demo data mode.

## Test and build

```powershell
pnpm test
pnpm build
```

Vite writes the deployable static widget to `dist`. The project uses `base: "./"`
so the generated files work when hosted from a Zoho widget path.

## Zoho packaging

After a successful build, zip the **contents** of `dist` so that `index.html` is
at the root of the archive. Upload that archive as a Zoho CRM widget and place
it on either a Contact or Application record page.

The widget loads Zoho's embedded SDK from:

```text
https://live.zwidgets.com/js-sdk/1.2/ZohoEmbededAppSDK.min.js
```

## CRM API names

The defaults are kept in [`src/config.js`](src/config.js):

| Purpose | API name |
| --- | --- |
| Contacts module | `Contacts` |
| Matters module | `Applications` |
| Contact-to-Matters related list | `Applications` |
| Matter History related list | `Application_History` with `Applications_History` fallback |
| MS File Number | `ID_Number` |
| Matter Number | `Name` |
| History date | `Date` |
| History owner | `Owner` |
| Stage | `Current_Stage` |
| Category | `History_Type` |
| Activity Type | `History_Result` |
| Duration in minutes | `Duration_Min` |

If the live CRM uses a different API name, update only `src/config.js`; the
normalization, preview, tests, and file generators do not need to change.
