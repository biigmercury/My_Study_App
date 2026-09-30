// Office 2013 ribbons (the version used in the CSC 272 lecture notes): tab → group → command.
// Later versions keep almost all of this; differences are noted in the lessons.

export interface Cmd {
  n: string
  d: string
  k?: string
}
export interface Group {
  g: string
  cmds: Cmd[]
}
export interface TabDef {
  t: string
  groups: Group[]
  ctx?: string
}
export interface AppDef {
  name: string
  color: string
  doc: string
  file: [string, string][]
  tabs: TabDef[]
  contextual: { trigger: string; label: string; tabs: TabDef[] }[]
}

const clipboard: Group = {
  g: 'Clipboard',
  cmds: [
    { n: 'Paste', d: 'Puts the last cut or copied item at the insertion point. The arrow under it opens Paste Options and Paste Special.', k: 'Ctrl+V' },
    { n: 'Cut', d: 'Removes the selection and places it on the Clipboard so it can be pasted (moved) elsewhere.', k: 'Ctrl+X' },
    { n: 'Copy', d: 'Places a copy of the selection on the Clipboard; the original stays where it is.', k: 'Ctrl+C' },
    { n: 'Format Painter', d: 'Copies the formatting of the selection so you can apply it to other text or cells. Double-click to apply it to several places.', k: 'Ctrl+Shift+C / Ctrl+Shift+V' },
  ],
}

export const WORD: AppDef = {
  name: 'Word',
  color: '#2B579A',
  doc: 'Document1 - Word',
  file: [
    ['Info', 'Protect Document (Mark as Final, Encrypt with Password, Restrict Editing), Inspect Document (Check for Issues, Check Compatibility) and Versions.'],
    ['New', 'Start a Blank document or pick a template (letters, reports, flyers…).'],
    ['Open', 'Recent documents, OneDrive, Computer → Browse.'],
    ['Save', 'Saves changes to the current file (first save behaves like Save As).'],
    ['Save As', 'Save a copy with a new name, location or file type (.docx, .doc for Word 97-2003, .pdf…).'],
    ['Print', 'Print Preview on the right; printer, copies, pages, one-sided/two-sided, orientation, paper size, margins, pages per sheet.'],
    ['Share', 'Invite people, Email, Present Online, Post to Blog.'],
    ['Export', 'Create PDF/XPS Document or Change File Type.'],
    ['Close', 'Closes the document (prompts you to save unsaved changes).'],
    ['Options', 'Word Options — e.g. turn off the Start screen, proofing settings, customise the Ribbon and Quick Access Toolbar.'],
  ],
  tabs: [
    {
      t: 'HOME',
      groups: [
        clipboard,
        {
          g: 'Font',
          cmds: [
            { n: 'Font', d: 'Changes the typeface. Word 2013 default is Calibri (Body).' },
            { n: 'Font Size', d: 'Changes the text size in points. Default is 11 pt.' },
            { n: 'Grow Font / Shrink Font', d: 'Increases or decreases the size one step.', k: 'Ctrl+] / Ctrl+[' },
            { n: 'Change Case', d: 'Sentence case, lowercase, UPPERCASE, Capitalize Each Word, tOGGLE cASE.', k: 'Shift+F3' },
            { n: 'Clear All Formatting', d: 'Removes all formatting from the selection, leaving plain Normal-style text.' },
            { n: 'Bold', d: 'Makes the selected text bold.', k: 'Ctrl+B' },
            { n: 'Italic', d: 'Slants the selected text.', k: 'Ctrl+I' },
            { n: 'Underline', d: 'Underlines the selection; the arrow offers double, dotted, wavy and coloured underlines.', k: 'Ctrl+U' },
            { n: 'Strikethrough', d: 'Draws a line through the middle of the text, like this.' },
            { n: 'Subscript', d: 'Small letters below the baseline, e.g. the 2 in H₂O.', k: 'Ctrl+=' },
            { n: 'Superscript', d: 'Small letters above the line, e.g. the st in 21st or the 2 in x².', k: 'Ctrl+Shift++' },
            { n: 'Text Effects and Typography', d: 'Outline, shadow, reflection and glow effects on text.' },
            { n: 'Text Highlight Color', d: 'Marks text as if with a highlighter pen.' },
            { n: 'Font Color', d: 'Changes the colour of the text. More Colors… opens the full palette.' },
            { n: 'Font dialog launcher', d: 'The small arrow in the corner opens the Font dialog box with every font option (effects, character spacing).', k: 'Ctrl+D' },
          ],
        },
        {
          g: 'Paragraph',
          cmds: [
            { n: 'Bullets', d: 'Starts a bulleted list; the arrow picks a different bullet symbol.' },
            { n: 'Numbering', d: 'Starts a numbered list (1. 2. 3., a) b) c), i. ii. iii.).' },
            { n: 'Multilevel List', d: 'Lists with sub-levels, e.g. 1, 1.1, 1.1.1 — used for numbered headings.' },
            { n: 'Decrease Indent / Increase Indent', d: 'Moves the whole paragraph to the previous / next tab stop (0.5 in / 1.27 cm).' },
            { n: 'Sort', d: 'Sorts the selected paragraphs or table rows A→Z or Z→A by text, number or date.' },
            { n: 'Show/Hide ¶', d: 'Shows non-printing characters: ¶ paragraph marks, · spaces, → tabs, section and page breaks.', k: 'Ctrl+Shift+8' },
            { n: 'Align Left', d: 'Lines text up on the left margin (the default).', k: 'Ctrl+L' },
            { n: 'Center', d: 'Centres each line between the margins.', k: 'Ctrl+E' },
            { n: 'Align Right', d: 'Lines text up on the right margin.', k: 'Ctrl+R' },
            { n: 'Justify', d: 'Stretches lines so both left and right edges are straight (the last line stays left-aligned).', k: 'Ctrl+J' },
            { n: 'Line and Paragraph Spacing', d: '1.0, 1.15, 1.5, 2.0, 2.5, 3.0 line spacing plus Add Space Before/After Paragraph.' },
            { n: 'Shading', d: 'Colours the background behind the selected text or paragraph.' },
            { n: 'Borders', d: 'Adds lines around/under paragraphs; Horizontal Line; Borders and Shading dialog.' },
            { n: 'Paragraph dialog launcher', d: 'Opens the Paragraph dialog: alignment, exact left/right indents, Special (First line / Hanging), spacing before/after and line spacing.' },
          ],
        },
        {
          g: 'Styles',
          cmds: [
            { n: 'Styles gallery', d: 'Normal, No Spacing, Heading 1, Heading 2, Title, Subtitle… A style applies a whole set of formats at once. Headings are what a Table of Contents is built from.' },
            { n: 'Styles pane', d: 'The dialog launcher opens the Styles pane to create or modify styles.', k: 'Ctrl+Alt+Shift+S' },
          ],
        },
        {
          g: 'Editing',
          cmds: [
            { n: 'Find', d: 'Opens the Navigation pane search; every match is highlighted. The arrow also offers Advanced Find and Go To.', k: 'Ctrl+F' },
            { n: 'Replace', d: 'Find and Replace dialog: Replace, Replace All, Find Next; More >> for Match case, Find whole words only, formats and special characters.', k: 'Ctrl+H' },
            { n: 'Go To', d: 'Jumps straight to a page, section, line, comment, table, equation… by number (Find and Replace → Go To tab).', k: 'Ctrl+G / F5' },
            { n: 'Select', d: 'Select All, Select Objects, Select text with similar formatting.', k: 'Ctrl+A' },
          ],
        },
      ],
    },
    {
      t: 'INSERT',
      groups: [
        {
          g: 'Pages',
          cmds: [
            { n: 'Cover Page', d: 'Inserts a pre-designed title page at the start of the document.' },
            { n: 'Blank Page', d: 'Inserts a whole blank page at the insertion point.' },
            { n: 'Page Break', d: 'Starts the next text on a new page — better than pressing Enter many times.', k: 'Ctrl+Enter' },
          ],
        },
        { g: 'Tables', cmds: [{ n: 'Table', d: 'Drag over the grid, or Insert Table… to type the number of columns and rows; also Draw Table, Convert Text to Table, Excel Spreadsheet, Quick Tables.' }] },
        {
          g: 'Illustrations',
          cmds: [
            { n: 'Pictures', d: 'Inserts a picture file from your computer; the PICTURE TOOLS FORMAT tab then appears.' },
            { n: 'Online Pictures', d: 'Searches online images (Bing) or your OneDrive.' },
            { n: 'Shapes', d: 'Lines, arrows, rectangles, callouts, flowchart shapes.' },
            { n: 'SmartArt', d: 'Ready-made diagrams: lists, processes, cycles, hierarchies (organisation charts).' },
            { n: 'Chart', d: 'Inserts a chart; a small Excel sheet opens for its data.' },
            { n: 'Screenshot', d: 'Inserts a picture of another open window or a clipped part of the screen.' },
          ],
        },
        { g: 'Apps', cmds: [{ n: 'Apps for Office', d: 'Add-ins from the Office Store.' }] },
        { g: 'Media', cmds: [{ n: 'Online Video', d: 'Embeds a video from the web.' }] },
        {
          g: 'Links',
          cmds: [
            { n: 'Hyperlink', d: 'Links text to a web page, file, email address or a place in the document.', k: 'Ctrl+K' },
            { n: 'Bookmark', d: 'Names a location so you can link or jump to it.' },
            { n: 'Cross-reference', d: 'Refers to a numbered heading, figure or table (“see Figure 3”) that updates automatically.' },
          ],
        },
        { g: 'Comments', cmds: [{ n: 'Comment', d: 'Adds a note in the margin without changing the text.', k: 'Ctrl+Alt+M' }] },
        {
          g: 'Header & Footer',
          cmds: [
            { n: 'Header', d: 'Text repeated at the top of every page (of the section). Opens HEADER & FOOTER TOOLS DESIGN.' },
            { n: 'Footer', d: 'Text repeated at the bottom of every page (of the section).' },
            { n: 'Page Number', d: 'Top of Page, Bottom of Page, Page Margins, Current Position; Format Page Numbers… chooses 1,2,3 / a,b,c / i,ii,iii / -1-, and Start at.' },
          ],
        },
        {
          g: 'Text',
          cmds: [
            { n: 'Text Box', d: 'A movable box of text you can place anywhere on the page.' },
            { n: 'Quick Parts', d: 'Reusable pieces: AutoText, Document Property, Field….' },
            { n: 'WordArt', d: 'Decorative text effects.' },
            { n: 'Drop Cap', d: 'A large first letter at the start of a paragraph, as in newspapers.' },
            { n: 'Signature Line', d: 'Inserts a line for a signature.' },
            { n: 'Date & Time', d: 'Inserts today’s date in a chosen format; tick Update automatically to make it a field.' },
            { n: 'Object', d: 'Embeds another file or object (e.g. Microsoft Equation 3.0, an Excel sheet).' },
          ],
        },
        {
          g: 'Symbols',
          cmds: [
            { n: 'Equation', d: 'Inserts a built-in equation or a new one; EQUATION TOOLS DESIGN provides fractions, scripts, radicals, integrals, Greek letters. Kept together as one object.', k: 'Alt+=' },
            { n: 'Symbol', d: 'Characters not on the keyboard: ©, ±, °, ≠, Greek letters, ₦ (via More Symbols).' },
          ],
        },
      ],
    },
    {
      t: 'DESIGN',
      groups: [
        {
          g: 'Document Formatting',
          cmds: [
            { n: 'Themes', d: 'A coordinated set of colours, fonts and effects for the whole document (new tab in Word 2013).' },
            { n: 'Style Set', d: 'Changes how all the styles (headings, body) look at once.' },
            { n: 'Colors / Fonts', d: 'Change only the theme colours or the theme fonts.' },
            { n: 'Paragraph Spacing', d: 'Document-wide spacing presets: No Paragraph Space, Compact, Tight, Open, Relaxed, Double.' },
            { n: 'Effects', d: 'Theme effects for shapes and SmartArt.' },
            { n: 'Set as Default', d: 'Makes the current look the default for new documents.' },
          ],
        },
        {
          g: 'Page Background',
          cmds: [
            { n: 'Watermark', d: 'Faint text or picture behind the text on every page, e.g. CONFIDENTIAL, DRAFT, DO NOT COPY; Custom Watermark… for your own.' },
            { n: 'Page Color', d: 'Background colour of the page (not printed by default).' },
            { n: 'Page Borders', d: 'Borders and Shading dialog, Page Border tab: box, shadow, 3-D, art borders.' },
          ],
        },
      ],
    },
    {
      t: 'PAGE LAYOUT',
      groups: [
        {
          g: 'Page Setup',
          cmds: [
            { n: 'Margins', d: 'Normal (2.54 cm), Narrow (1.27 cm), Moderate, Wide, Mirrored or Custom Margins….' },
            { n: 'Orientation', d: 'Portrait (tall, the default) or Landscape (wide).' },
            { n: 'Size', d: 'Paper size: A4, Letter, Legal, A5…' },
            { n: 'Columns', d: 'Newspaper-style columns: One, Two, Three, Left, Right or More Columns… (up to more; e.g. 4 with a line between). Apply to selected text to affect one paragraph only.' },
            { n: 'Breaks', d: 'Page Breaks (Page, Column, Text Wrapping) and Section Breaks (Next Page, Continuous, Even Page, Odd Page).' },
            { n: 'Line Numbers', d: 'Numbers each line in the margin (legal documents).' },
            { n: 'Hyphenation', d: 'Splits long words at line ends with a hyphen.' },
            { n: 'Page Setup dialog launcher', d: 'Margins, Paper and Layout tabs — Layout has Vertical alignment (Top, Center, Justified, Bottom) and Different first page / odd and even headers.' },
          ],
        },
        {
          g: 'Paragraph',
          cmds: [
            { n: 'Indent Left / Right', d: 'Exact indents of the selected paragraph from the margins.' },
            { n: 'Spacing Before / After', d: 'Space above and below the paragraph in points — use this instead of pressing Enter repeatedly.' },
          ],
        },
        {
          g: 'Arrange',
          cmds: [
            { n: 'Position', d: 'Places a picture or shape at a preset spot on the page.' },
            { n: 'Wrap Text', d: 'How text flows around a picture: In Line with Text, Square, Tight, Through, Top and Bottom, Behind Text, In Front of Text.' },
            { n: 'Bring Forward / Send Backward', d: 'Changes which overlapping object is on top.' },
            { n: 'Selection Pane', d: 'Lists all objects on the page so you can select, hide or reorder them.' },
            { n: 'Align / Group / Rotate', d: 'Line objects up, join them into one, or turn/flip them.' },
          ],
        },
      ],
    },
    {
      t: 'REFERENCES',
      groups: [
        {
          g: 'Table of Contents',
          cmds: [
            { n: 'Table of Contents', d: 'Builds a TOC automatically from text formatted with Heading 1, Heading 2, … styles, with page numbers.' },
            { n: 'Add Text', d: 'Marks the current paragraph as a TOC level (applies a heading style).' },
            { n: 'Update Table', d: 'Refreshes page numbers or the entire table after the document changes.' },
          ],
        },
        {
          g: 'Footnotes',
          cmds: [
            { n: 'Insert Footnote', d: 'Numbered note at the bottom of the page.', k: 'Ctrl+Alt+F' },
            { n: 'Insert Endnote', d: 'Numbered note at the end of the document (or section).', k: 'Ctrl+Alt+D' },
            { n: 'Next Footnote / Show Notes', d: 'Move between notes; jump to the note area.' },
          ],
        },
        {
          g: 'Citations & Bibliography',
          cmds: [
            { n: 'Insert Citation', d: 'Adds an in-text citation such as (Adeyemi, 2019) and lets you Add New Source….' },
            { n: 'Manage Sources', d: 'Source Manager: all sources in the master list and the current document.' },
            { n: 'Style', d: 'Referencing style: APA, MLA, Chicago, Harvard, IEEE, ISO 690…' },
            { n: 'Bibliography', d: 'Inserts a Bibliography, References or Works Cited list generated from the cited sources.' },
          ],
        },
        {
          g: 'Captions',
          cmds: [
            { n: 'Insert Caption', d: 'Numbered label under/above a picture or table: “Figure 1: …”, “Table 1: …”.' },
            { n: 'Insert Table of Figures', d: 'Builds a List of Figures (or List of Tables — choose the caption label) from the captions.' },
            { n: 'Update Table', d: 'Refreshes the table of figures.' },
            { n: 'Cross-reference', d: 'Refers to a caption or heading so the number updates automatically.' },
          ],
        },
        {
          g: 'Index',
          cmds: [
            { n: 'Mark Entry', d: 'Marks a word to appear in the index.', k: 'Alt+Shift+X' },
            { n: 'Insert Index', d: 'Builds the alphabetical index with page numbers.' },
          ],
        },
        { g: 'Table of Authorities', cmds: [{ n: 'Mark Citation / Insert Table of Authorities', d: 'Lists cases and statutes cited in legal documents.' }] },
      ],
    },
    {
      t: 'MAILINGS',
      groups: [
        {
          g: 'Create',
          cmds: [
            { n: 'Envelopes', d: 'Creates and prints an envelope with delivery and return addresses.' },
            { n: 'Labels', d: 'Creates sheets of address or name labels.' },
          ],
        },
        {
          g: 'Start Mail Merge',
          cmds: [
            { n: 'Start Mail Merge', d: 'Choose the document type: Letters, E-mail Messages, Envelopes, Labels, Directory; or the Step-by-Step Mail Merge Wizard.' },
            { n: 'Select Recipients', d: 'Type a New List…, Use an Existing List… (Excel/Access/Word table), or Choose from Outlook Contacts.' },
            { n: 'Edit Recipient List', d: 'Tick/untick, sort and filter the recipients.' },
          ],
        },
        {
          g: 'Write & Insert Fields',
          cmds: [
            { n: 'Highlight Merge Fields', d: 'Shades the «fields» so you can see them.' },
            { n: 'Address Block', d: 'Inserts a formatted name-and-address block.' },
            { n: 'Greeting Line', d: 'Inserts “Dear «FirstName»,”-style greetings.' },
            { n: 'Insert Merge Field', d: 'Inserts one column of the data source, e.g. «Surname», «Score».' },
            { n: 'Rules', d: 'If…Then…Else and other conditional text.' },
          ],
        },
        {
          g: 'Preview Results',
          cmds: [
            { n: 'Preview Results', d: 'Shows real data in place of the «fields»; arrows move from record to record.' },
            { n: 'Check for Errors', d: 'Simulates the merge and reports problems.' },
          ],
        },
        { g: 'Finish', cmds: [{ n: 'Finish & Merge', d: 'Edit Individual Documents (one letter per record in a new document), Print Documents, or Send E-mail Messages.' }] },
      ],
    },
    {
      t: 'REVIEW',
      groups: [
        {
          g: 'Proofing',
          cmds: [
            { n: 'Spelling & Grammar', d: 'Checks the document from the insertion point (or just the selection); suggests corrections.', k: 'F7' },
            { n: 'Define', d: 'Dictionary definition of the selected word.' },
            { n: 'Thesaurus', d: 'Synonyms (and some antonyms) for the selected word; point to one and choose Insert.', k: 'Shift+F7' },
            { n: 'Word Count', d: 'Pages, words, characters (with/without spaces), paragraphs and lines — for the selection or the whole document.', k: 'Ctrl+Shift+G' },
          ],
        },
        {
          g: 'Language',
          cmds: [
            { n: 'Translate', d: 'Translates the selection or document.' },
            { n: 'Language', d: 'Set Proofing Language, e.g. English (United Kingdom) vs English (United States).' },
          ],
        },
        {
          g: 'Comments',
          cmds: [
            { n: 'New Comment', d: 'Adds a comment balloon for the selected text.' },
            { n: 'Delete / Previous / Next', d: 'Manage and move between comments.' },
            { n: 'Show Comments', d: 'Shows or hides comment balloons.' },
          ],
        },
        {
          g: 'Tracking',
          cmds: [
            { n: 'Track Changes', d: 'When on, every insertion, deletion and formatting change is recorded and marked so a reviewer’s edits can be accepted or rejected.', k: 'Ctrl+Shift+E' },
            { n: 'Display for Review', d: 'Simple Markup, All Markup, No Markup, Original.' },
            { n: 'Show Markup', d: 'Choose which kinds of changes are shown (insertions and deletions, formatting, comments, by reviewer).' },
            { n: 'Reviewing Pane', d: 'Lists every change and comment in a side or bottom pane.' },
          ],
        },
        {
          g: 'Changes',
          cmds: [
            { n: 'Accept', d: 'Accepts the current tracked change (or All Changes) and moves to the next.' },
            { n: 'Reject', d: 'Rejects (undoes) the current tracked change or all of them.' },
            { n: 'Previous / Next', d: 'Move between tracked changes.' },
          ],
        },
        { g: 'Compare', cmds: [{ n: 'Compare', d: 'Compares two versions of a document and shows the differences as tracked changes; Combine merges reviewers’ copies.' }] },
        {
          g: 'Protect',
          cmds: [
            { n: 'Block Authors', d: 'Stops co-authors editing a section (SharePoint/OneDrive).' },
            { n: 'Restrict Editing', d: 'Allow only certain kinds of editing (tracked changes, comments, filling in forms) with an optional password.' },
          ],
        },
      ],
    },
    {
      t: 'VIEW',
      groups: [
        {
          g: 'Views',
          cmds: [
            { n: 'Read Mode', d: 'Full-screen reading layout with no Ribbon; the document cannot be edited (new in 2013).' },
            { n: 'Print Layout', d: 'The default: pages exactly as they will print, with margins, headers and footers.' },
            { n: 'Web Layout', d: 'How the document would look as a web page (no page breaks).' },
            { n: 'Outline', d: 'Shows the heading structure; promote, demote and move whole sections.' },
            { n: 'Draft', d: 'Plain, fast view for typing (called Normal view in old Word); headers, footers and pictures hidden.' },
          ],
        },
        {
          g: 'Show',
          cmds: [
            { n: 'Ruler', d: 'Shows the horizontal and vertical rulers (indent markers and tab stops).' },
            { n: 'Gridlines', d: 'Shows a grid to line up objects.' },
            { n: 'Navigation Pane', d: 'Headings, Pages and search Results panes for moving around long documents.' },
          ],
        },
        {
          g: 'Zoom',
          cmds: [
            { n: 'Zoom', d: 'Magnifies the view only — the actual font size does not change.' },
            { n: '100% / One Page / Multiple Pages / Page Width', d: 'Zoom presets.' },
          ],
        },
        {
          g: 'Window',
          cmds: [
            { n: 'New Window', d: 'A second window on the same document.' },
            { n: 'Arrange All', d: 'Tiles all open documents on the screen.' },
            { n: 'Split', d: 'Two panes of the same document so you can see two parts at once.' },
            { n: 'View Side by Side', d: 'Two documents next to each other; Synchronous Scrolling makes them scroll together.' },
            { n: 'Switch Windows', d: 'Jump to another open document.' },
          ],
        },
        { g: 'Macros', cmds: [{ n: 'Macros', d: 'Record or run a macro (a saved sequence of commands).' }] },
      ],
    },
  ],
  contextual: [
    {
      trigger: 'Click inside a table',
      label: 'TABLE TOOLS',
      tabs: [
        {
          t: 'DESIGN',
          ctx: 'TABLE TOOLS',
          groups: [
            { g: 'Table Style Options', cmds: [{ n: 'Header Row / Total Row / Banded Rows / First Column', d: 'Turn special formatting on or off for parts of the table.' }] },
            { g: 'Table Styles', cmds: [{ n: 'Table Styles gallery', d: 'Ready-made designs of borders, fonts and shading.' }, { n: 'Shading', d: 'Colour the background of the selected cells.' }] },
            { g: 'Borders', cmds: [{ n: 'Borders', d: 'Line style, line weight (e.g. 4½ pt), pen colour and which borders to apply.' }, { n: 'Border Painter', d: 'Paints the chosen border onto cell edges you click.' }] },
          ],
        },
        {
          t: 'LAYOUT',
          ctx: 'TABLE TOOLS',
          groups: [
            { g: 'Table', cmds: [{ n: 'Select / View Gridlines / Properties', d: 'Select cells, rows or the table; show dotted gridlines where there are no borders.' }] },
            { g: 'Draw', cmds: [{ n: 'Draw Table / Eraser', d: 'Draw or erase cell borders freehand.' }] },
            { g: 'Rows & Columns', cmds: [{ n: 'Delete / Insert Above / Insert Below / Insert Left / Insert Right', d: 'Add or remove rows and columns.' }] },
            {
              g: 'Merge',
              cmds: [
                { n: 'Merge Cells', d: 'Joins the selected cells into one (e.g. for a title row across the table).' },
                { n: 'Split Cells', d: 'Divides a cell into a number of rows and columns.' },
                { n: 'Split Table', d: 'Breaks the table into two at the current row.' },
              ],
            },
            { g: 'Cell Size', cmds: [{ n: 'AutoFit / Height / Width / Distribute', d: 'Size cells to content or window, or make rows/columns equal.' }] },
            { g: 'Alignment', cmds: [{ n: 'Align (9 positions) / Text Direction / Cell Margins', d: 'Position text inside cells, e.g. Align Center.' }] },
            { g: 'Data', cmds: [{ n: 'Sort / Repeat Header Rows / Convert to Text / Formula', d: 'Sort rows; repeat headings on every page; simple formulas like =SUM(ABOVE).' }] },
          ],
        },
      ],
    },
    {
      trigger: 'Click a picture',
      label: 'PICTURE TOOLS',
      tabs: [
        {
          t: 'FORMAT',
          ctx: 'PICTURE TOOLS',
          groups: [
            { g: 'Adjust', cmds: [{ n: 'Remove Background / Corrections / Color / Artistic Effects', d: 'Brightness, contrast, recolour, effects.' }, { n: 'Compress / Change / Reset Picture', d: 'Reduce file size, swap or reset the picture.' }] },
            { g: 'Picture Styles', cmds: [{ n: 'Picture Styles / Border / Effects / Layout', d: 'Frames, shadows, soft edges; convert to SmartArt.' }] },
            { g: 'Arrange', cmds: [{ n: 'Position / Wrap Text / Align / Rotate', d: 'Place the picture and set how text flows around it.' }] },
            { g: 'Size', cmds: [{ n: 'Crop', d: 'Trims unwanted edges of the picture.' }, { n: 'Height / Width', d: 'Exact size (keeps proportions when Lock aspect ratio is on).' }] },
          ],
        },
      ],
    },
    {
      trigger: 'Double-click the header area',
      label: 'HEADER & FOOTER TOOLS',
      tabs: [
        {
          t: 'DESIGN',
          ctx: 'HEADER & FOOTER TOOLS',
          groups: [
            { g: 'Header & Footer', cmds: [{ n: 'Header / Footer / Page Number', d: 'Change the header, footer or page number; Format Page Numbers… sets the number format and Start at.' }] },
            { g: 'Insert', cmds: [{ n: 'Date & Time / Document Info / Pictures', d: 'Fields and pictures for the header or footer.' }] },
            { g: 'Navigation', cmds: [{ n: 'Go to Header / Go to Footer / Previous / Next', d: 'Move between headers and footers of different sections.' }, { n: 'Link to Previous', d: 'When ON, this section’s header/footer is the same as the previous section’s. Turn it OFF to give a section its own header, footer or numbering.' }] },
            { g: 'Options', cmds: [{ n: 'Different First Page / Different Odd & Even Pages / Show Document Text', d: 'E.g. no number on the title page.' }] },
            { g: 'Position', cmds: [{ n: 'Header from Top / Footer from Bottom', d: 'Distance from the page edge.' }] },
            { g: 'Close', cmds: [{ n: 'Close Header and Footer', d: 'Return to the document body (or double-click the body).' }] },
          ],
        },
      ],
    },
  ],
}

export const EXCEL: AppDef = {
  name: 'Excel',
  color: '#217346',
  doc: 'Book1 - Excel',
  file: [
    ['Info', 'Protect Workbook, Inspect Workbook, Versions, workbook properties.'],
    ['New', 'Blank workbook or templates (budgets, calendars, invoices…).'],
    ['Open', 'Recent workbooks, OneDrive, Computer → Browse.'],
    ['Save / Save As', 'Excel Workbook (.xlsx), Excel 97-2003 (.xls), Macro-Enabled (.xlsm), CSV, PDF…'],
    ['Print', 'Print Preview of the sheet; printer, Print Active Sheets / Entire Workbook / Selection, pages, orientation, paper size, margins, scaling (Fit Sheet on One Page).'],
    ['Share / Export', 'Invite people, email, create PDF/XPS, change file type.'],
    ['Close', 'Closes the workbook.'],
    ['Options', 'Excel Options — formulas (calculation mode), proofing, advanced, customise Ribbon.'],
  ],
  tabs: [
    {
      t: 'HOME',
      groups: [
        clipboard,
        {
          g: 'Font',
          cmds: [
            { n: 'Font / Font Size', d: 'Default is Calibri 11.' },
            { n: 'Bold / Italic / Underline', d: 'Character formatting for the selected cells.', k: 'Ctrl+B / Ctrl+I / Ctrl+U' },
            { n: 'Borders', d: 'Lines around cells — gridlines do not print unless you add borders or tick Print Gridlines.' },
            { n: 'Fill Color', d: 'Background colour of the cells.' },
            { n: 'Font Color', d: 'Colour of the text.' },
            { n: 'Format Cells dialog launcher', d: 'Format Cells: Number, Alignment, Font, Border, Fill, Protection tabs.', k: 'Ctrl+1' },
          ],
        },
        {
          g: 'Alignment',
          cmds: [
            { n: 'Top / Middle / Bottom Align', d: 'Vertical position of data in the cell.' },
            { n: 'Orientation', d: 'Angle or rotate text (e.g. Rotate Text Up for narrow headings).' },
            { n: 'Align Left / Center / Align Right', d: 'Horizontal alignment. By default text aligns left and numbers/dates right.' },
            { n: 'Decrease / Increase Indent', d: 'Moves content away from the cell border.' },
            { n: 'Wrap Text', d: 'Shows long text on several lines inside the cell; the row grows taller.' },
            { n: 'Merge & Center', d: 'Joins the selected cells into one and centres the content. Only the upper-left value is kept; Unmerge Cells splits it again.' },
          ],
        },
        {
          g: 'Number',
          cmds: [
            { n: 'Number Format', d: 'General, Number, Currency, Accounting, Short Date, Long Date, Time, Percentage, Fraction, Scientific, Text.' },
            { n: 'Accounting Number Format', d: 'Currency symbol lined up at the left of the cell; choose ₦, $, £, € …' },
            { n: 'Percent Style', d: 'Shows 0.25 as 25%.', k: 'Ctrl+Shift+%' },
            { n: 'Comma Style', d: 'Thousands separator and 2 decimal places: 1,234.50.' },
            { n: 'Increase / Decrease Decimal', d: 'Shows more or fewer decimal places — the stored value does not change.' },
          ],
        },
        {
          g: 'Styles',
          cmds: [
            { n: 'Conditional Formatting', d: 'Formats cells automatically by rule, e.g. red fill for scores below 40, data bars, colour scales.' },
            { n: 'Format as Table', d: 'Turns a range into a styled table with filter buttons and banded rows; Convert to Range undoes the table (formatting stays).' },
            { n: 'Cell Styles', d: 'Ready-made formats: Good, Bad, Neutral, Heading 1, Title, Total, Currency…' },
          ],
        },
        {
          g: 'Cells',
          cmds: [
            { n: 'Insert', d: 'Insert Cells…, Insert Sheet Rows (above the active row), Insert Sheet Columns (left of the active column), Insert Sheet.' },
            { n: 'Delete', d: 'Delete Cells…, Delete Sheet Rows, Delete Sheet Columns, Delete Sheet.' },
            { n: 'Format', d: 'Row Height, AutoFit Row Height, Column Width, AutoFit Column Width, Hide & Unhide, Rename Sheet, Move or Copy Sheet, Tab Color, Protect Sheet.' },
          ],
        },
        {
          g: 'Editing',
          cmds: [
            { n: 'AutoSum', d: 'Inserts =SUM() of the numbers above or to the left; the arrow gives Average, Count Numbers, Max, Min, More Functions.', k: 'Alt+=' },
            { n: 'Fill', d: 'Down, Right, Up, Left, Series…, Flash Fill.', k: 'Ctrl+D / Ctrl+R' },
            { n: 'Clear', d: 'Clear All, Clear Formats, Clear Contents, Clear Comments.' },
            { n: 'Sort & Filter', d: 'Sort A to Z / Z to A, Custom Sort, Filter (drop-down arrows on headings).' },
            { n: 'Find & Select', d: 'Find, Replace, Go To, Go To Special (e.g. all formulas, blanks).', k: 'Ctrl+F / Ctrl+H / F5' },
          ],
        },
      ],
    },
    {
      t: 'INSERT',
      groups: [
        {
          g: 'Tables',
          cmds: [
            { n: 'PivotTable', d: 'Summarises a large table by dragging fields (totals by region, by month…).' },
            { n: 'Recommended PivotTables', d: 'Excel suggests summaries for your data (new in 2013).' },
            { n: 'Table', d: 'Same as Format as Table.', k: 'Ctrl+T' },
          ],
        },
        { g: 'Illustrations', cmds: [{ n: 'Pictures / Online Pictures / Shapes / SmartArt / Screenshot', d: 'Objects placed on the sheet’s drawing layer, above the cells.' }] },
        { g: 'Apps', cmds: [{ n: 'Apps for Office', d: 'Add-ins from the Office Store.' }] },
        {
          g: 'Charts',
          cmds: [
            { n: 'Recommended Charts', d: 'Excel previews charts that suit the selected data (new in 2013).' },
            { n: 'Column / Bar', d: 'Compare values across categories (bars are horizontal columns).' },
            { n: 'Line / Area', d: 'Show a trend over time.' },
            { n: 'Pie / Doughnut', d: 'Parts of one whole — one data series only.' },
            { n: 'Scatter (X, Y)', d: 'Relationship between two numeric variables.' },
            { n: 'PivotChart', d: 'A chart of a PivotTable.' },
          ],
        },
        { g: 'Reports', cmds: [{ n: 'Power View', d: 'Interactive report sheet (Excel 2013 Professional Plus).' }] },
        { g: 'Sparklines', cmds: [{ n: 'Line / Column / Win/Loss', d: 'A tiny chart inside one cell showing a row’s trend.' }] },
        { g: 'Filters', cmds: [{ n: 'Slicer / Timeline', d: 'Buttons to filter tables and PivotTables.' }] },
        { g: 'Links', cmds: [{ n: 'Hyperlink', d: 'Link to a web page, file, email or another cell/sheet.', k: 'Ctrl+K' }] },
        { g: 'Text', cmds: [{ n: 'Text Box / Header & Footer / WordArt / Signature Line / Object', d: 'Header & Footer switches to Page Layout view to type headers and footers.' }] },
        { g: 'Symbols', cmds: [{ n: 'Equation / Symbol', d: 'Insert an equation object or a special character.' }] },
      ],
    },
    {
      t: 'PAGE LAYOUT',
      groups: [
        { g: 'Themes', cmds: [{ n: 'Themes / Colors / Fonts / Effects', d: 'Workbook-wide look.' }] },
        {
          g: 'Page Setup',
          cmds: [
            { n: 'Margins', d: 'Normal, Wide, Narrow or Custom Margins (and Center on page horizontally/vertically).' },
            { n: 'Orientation', d: 'Portrait or Landscape — wide sheets usually print better in Landscape.' },
            { n: 'Size', d: 'Paper size (A4…).' },
            { n: 'Print Area', d: 'Set Print Area: only the selected range will print; Clear Print Area.' },
            { n: 'Breaks', d: 'Insert or remove manual page breaks.' },
            { n: 'Background', d: 'Picture behind the sheet (on screen only).' },
            { n: 'Print Titles', d: 'Rows to repeat at top (e.g. $1:$1) and columns to repeat at left on every printed page.' },
          ],
        },
        {
          g: 'Scale to Fit',
          cmds: [
            { n: 'Width / Height', d: 'Fit the printout to a number of pages wide/tall, e.g. 1 page.' },
            { n: 'Scale', d: 'Print at a percentage of normal size.' },
          ],
        },
        {
          g: 'Sheet Options',
          cmds: [
            { n: 'Gridlines: View / Print', d: 'Show gridlines on screen; tick Print to print them.' },
            { n: 'Headings: View / Print', d: 'Row numbers and column letters on screen / on paper.' },
          ],
        },
        { g: 'Arrange', cmds: [{ n: 'Bring Forward / Send Backward / Align / Group / Rotate', d: 'For pictures, shapes and charts.' }] },
      ],
    },
    {
      t: 'FORMULAS',
      groups: [
        {
          g: 'Function Library',
          cmds: [
            { n: 'Insert Function', d: 'fx: search for a function by description, then fill in the Function Arguments dialog.', k: 'Shift+F3' },
            { n: 'AutoSum', d: 'Sum, Average, Count Numbers, Max, Min.' },
            { n: 'Recently Used', d: 'Functions you used last.' },
            { n: 'Financial / Logical / Text / Date & Time / Lookup & Reference / Math & Trig / More Functions', d: 'Functions by category: IF is under Logical; LEFT, RIGHT, MID, LEN under Text; TODAY, NOW under Date & Time; VLOOKUP under Lookup & Reference; SUM, ROUND under Math & Trig; AVERAGE, COUNT, MAX under More Functions → Statistical.' },
          ],
        },
        {
          g: 'Defined Names',
          cmds: [
            { n: 'Name Manager / Define Name / Use in Formula / Create from Selection', d: 'Give a range a name (e.g. Scores) and use it in formulas: =AVERAGE(Scores).', k: 'Ctrl+F3' },
          ],
        },
        {
          g: 'Formula Auditing',
          cmds: [
            { n: 'Trace Precedents / Trace Dependents', d: 'Arrows showing which cells feed a formula and which formulas use a cell.' },
            { n: 'Remove Arrows', d: 'Clears the tracer arrows.' },
            { n: 'Show Formulas', d: 'Displays formulas instead of their results in every cell.', k: 'Ctrl+`' },
            { n: 'Error Checking / Evaluate Formula', d: 'Finds errors; steps through a formula’s calculation.' },
            { n: 'Watch Window', d: 'Keeps an eye on chosen cells while you work elsewhere.' },
          ],
        },
        {
          g: 'Calculation',
          cmds: [
            { n: 'Calculation Options', d: 'Automatic (default) or Manual recalculation.' },
            { n: 'Calculate Now', d: 'Recalculates the whole workbook — volatile functions like RAND and NOW get new values.', k: 'F9' },
            { n: 'Calculate Sheet', d: 'Recalculates the active sheet only.', k: 'Shift+F9' },
          ],
        },
      ],
    },
    {
      t: 'DATA',
      groups: [
        { g: 'Get External Data', cmds: [{ n: 'From Access / From Web / From Text / From Other Sources / Existing Connections', d: 'Bring data into Excel from other files and databases.' }] },
        { g: 'Connections', cmds: [{ n: 'Refresh All / Connections / Properties / Edit Links', d: 'Update imported data.' }] },
        {
          g: 'Sort & Filter',
          cmds: [
            { n: 'Sort A to Z / Z to A', d: 'Quick sort by the active column; whole rows move together.' },
            { n: 'Sort', d: 'Sort dialog: several levels, e.g. by Department then by Score; “My data has headers”.' },
            { n: 'Filter', d: 'Drop-down arrows on the headings to show only matching rows.', k: 'Ctrl+Shift+L' },
            { n: 'Advanced', d: 'Filter with a criteria range; copy results elsewhere.' },
          ],
        },
        {
          g: 'Data Tools',
          cmds: [
            { n: 'Text to Columns', d: 'Splits one column (e.g. “Ade, Tunde”) into several.' },
            { n: 'Flash Fill', d: 'Fills a column by recognising a pattern you typed (new in 2013).', k: 'Ctrl+E' },
            { n: 'Remove Duplicates', d: 'Deletes repeated rows.' },
            { n: 'Data Validation', d: 'Controls what may be typed in a cell: whole numbers between 0 and 100, a list (Male, Female), dates in a range, text length — with input messages and error alerts.' },
            { n: 'Consolidate / What-If Analysis / Relationships', d: 'Combine ranges; Goal Seek, Scenario Manager, Data Table; relate tables.' },
          ],
        },
        { g: 'Outline', cmds: [{ n: 'Group / Ungroup / Subtotal', d: 'Collapse detail rows; insert subtotals for each group.' }] },
      ],
    },
    {
      t: 'REVIEW',
      groups: [
        { g: 'Proofing', cmds: [{ n: 'Spelling', d: 'Checks spelling on the sheet.', k: 'F7' }, { n: 'Research / Thesaurus', d: 'Reference and synonyms.' }] },
        { g: 'Language', cmds: [{ n: 'Translate', d: 'Translates the selected text.' }] },
        { g: 'Comments', cmds: [{ n: 'New Comment / Delete / Previous / Next / Show All Comments', d: 'Notes attached to cells (red triangle in the corner).', k: 'Shift+F2' }] },
        {
          g: 'Changes',
          cmds: [
            { n: 'Protect Sheet', d: 'Locks cells so they cannot be changed (optional password); unlock input cells first via Format Cells → Protection.' },
            { n: 'Protect Workbook', d: 'Prevents adding, deleting, renaming or moving sheets.' },
            { n: 'Share Workbook / Track Changes', d: 'Several users editing; record changes.' },
          ],
        },
      ],
    },
    {
      t: 'VIEW',
      groups: [
        {
          g: 'Workbook Views',
          cmds: [
            { n: 'Normal', d: 'The standard grid view.' },
            { n: 'Page Break Preview', d: 'Shows where pages will break; drag the blue lines.' },
            { n: 'Page Layout', d: 'Shows pages with margins, headers and footers.' },
            { n: 'Custom Views', d: 'Save display and print settings.' },
          ],
        },
        { g: 'Show', cmds: [{ n: 'Ruler / Gridlines / Formula Bar / Headings', d: 'Turn screen elements on or off.' }] },
        { g: 'Zoom', cmds: [{ n: 'Zoom / 100% / Zoom to Selection', d: 'Magnify the view only.' }] },
        {
          g: 'Window',
          cmds: [
            { n: 'New Window / Arrange All', d: 'Several windows on the workbook.' },
            { n: 'Freeze Panes', d: 'Freeze Panes (rows above and columns left of the active cell), Freeze Top Row, Freeze First Column; Unfreeze Panes when frozen.' },
            { n: 'Split / Hide / Unhide', d: 'Split the window into panes; hide a workbook window.' },
            { n: 'View Side by Side / Synchronous Scrolling / Switch Windows', d: 'Compare two workbooks.' },
          ],
        },
        { g: 'Macros', cmds: [{ n: 'Macros', d: 'Record or run a macro (VBA).' }] },
      ],
    },
  ],
  contextual: [
    {
      trigger: 'Click a chart',
      label: 'CHART TOOLS',
      tabs: [
        {
          t: 'DESIGN',
          ctx: 'CHART TOOLS',
          groups: [
            { g: 'Chart Layouts', cmds: [{ n: 'Add Chart Element', d: 'Axes, Axis Titles, Chart Title, Data Labels, Data Table, Error Bars, Gridlines, Legend, Trendline.' }, { n: 'Quick Layout', d: 'Preset arrangements of title, legend and labels.' }] },
            { g: 'Chart Styles', cmds: [{ n: 'Change Colors / Chart Styles', d: 'Colour sets and ready-made looks.' }] },
            { g: 'Data', cmds: [{ n: 'Switch Row/Column', d: 'Swaps which data is on the horizontal axis and which forms the series.' }, { n: 'Select Data', d: 'Change the chart’s data range, add/remove series, edit axis labels.' }] },
            { g: 'Type', cmds: [{ n: 'Change Chart Type', d: 'Switch to a different kind of chart without rebuilding it.' }] },
            { g: 'Location', cmds: [{ n: 'Move Chart', d: 'Move the chart to its own chart sheet (New sheet) or to another worksheet as an object.' }] },
          ],
        },
        {
          t: 'FORMAT',
          ctx: 'CHART TOOLS',
          groups: [
            { g: 'Current Selection', cmds: [{ n: 'Chart Elements box / Format Selection', d: 'Pick an element (e.g. Vertical Axis) and format it.' }] },
            { g: 'Shape Styles', cmds: [{ n: 'Shape Fill / Outline / Effects', d: 'Colours and effects for chart parts.' }] },
            { g: 'Size', cmds: [{ n: 'Height / Width', d: 'Exact chart size.' }] },
          ],
        },
      ],
    },
  ],
}

export const POWERPOINT: AppDef = {
  name: 'PowerPoint',
  color: '#B7472A',
  doc: 'Presentation1 - PowerPoint',
  file: [
    ['Info', 'Protect Presentation (Mark as Final, Encrypt with Password), Inspect Presentation, Versions.'],
    ['New', 'Blank Presentation or a template/theme.'],
    ['Open / Save / Save As', 'PowerPoint Presentation (.pptx), PowerPoint 97-2003 (.ppt), PowerPoint Show (.ppsx — opens straight into the slide show), PDF, template (.potx).'],
    ['Print', 'Full Page Slides, Notes Pages, Outline, Handouts (1, 2, 3, 4, 6 or 9 slides per page); colour, grayscale or pure black and white.'],
    ['Share', 'Invite people, Email, Present Online.'],
    ['Export', 'Create PDF/XPS, Create a Video (with recorded timings and narrations), Package Presentation for CD, Create Handouts (in Word).'],
    ['Close / Options', 'Close the file; PowerPoint Options.'],
  ],
  tabs: [
    {
      t: 'HOME',
      groups: [
        clipboard,
        {
          g: 'Slides',
          cmds: [
            { n: 'New Slide', d: 'Adds a slide after the current one; click the words (arrow) to choose a layout.', k: 'Ctrl+M' },
            { n: 'Layout', d: 'Changes the current slide’s layout: Title Slide, Title and Content, Section Header, Two Content, Comparison, Title Only, Blank, Content with Caption, Picture with Caption.' },
            { n: 'Reset', d: 'Resets placeholders to the layout’s default position, size and formatting.' },
            { n: 'Section', d: 'Groups slides into named sections.' },
          ],
        },
        {
          g: 'Font',
          cmds: [
            { n: 'Font / Font Size / Grow / Shrink', d: 'Default title font is Calibri Light 44 pt in 2013 (Calibri 44 in the notes).' },
            { n: 'Bold / Italic / Underline / Shadow / Strikethrough', d: 'Character formatting.' },
            { n: 'Character Spacing / Change Case / Font Color', d: 'Change Case turns text to UPPERCASE, lowercase, Sentence case….' },
          ],
        },
        {
          g: 'Paragraph',
          cmds: [
            { n: 'Bullets / Numbering', d: 'Turn bullets on/off; choose the bullet character; Bullets and Numbering… for picture/custom bullets.' },
            { n: 'Decrease / Increase List Level', d: 'Demote a point to a sub-bullet or promote it.', k: 'Tab / Shift+Tab' },
            { n: 'Line Spacing', d: '1.0, 1.5, 2.0 … and Line Spacing Options.' },
            { n: 'Align Left / Center / Align Right / Justify', d: 'Alignment of text in the placeholder.' },
            { n: 'Columns / Text Direction / Align Text', d: 'Text layout inside the box.' },
            { n: 'Convert to SmartArt', d: 'Turns a bulleted list into a diagram.' },
          ],
        },
        {
          g: 'Drawing',
          cmds: [
            { n: 'Shapes / Arrange / Quick Styles', d: 'Draw and style shapes.' },
            { n: 'Shape Fill / Shape Outline / Shape Effects', d: 'Colours, outlines and effects for shapes and placeholders.' },
          ],
        },
        { g: 'Editing', cmds: [{ n: 'Find / Replace / Select', d: 'Find text, Replace (also Replace Fonts), Select All / Selection Pane.' }] },
      ],
    },
    {
      t: 'INSERT',
      groups: [
        { g: 'Slides', cmds: [{ n: 'New Slide', d: 'Same as on the HOME tab.' }] },
        { g: 'Tables', cmds: [{ n: 'Table', d: 'Insert a table of rows and columns.' }] },
        {
          g: 'Images',
          cmds: [
            { n: 'Pictures', d: 'Picture from your computer.' },
            { n: 'Online Pictures', d: 'Search online images.' },
            { n: 'Screenshot', d: 'Picture of another window.' },
            { n: 'Photo Album', d: 'Creates a presentation with one picture per slide.' },
          ],
        },
        { g: 'Illustrations', cmds: [{ n: 'Shapes / SmartArt / Chart', d: 'SmartArt → Hierarchy → Organization Chart builds an organogram.' }] },
        { g: 'Apps', cmds: [{ n: 'Apps for Office', d: 'Add-ins.' }] },
        { g: 'Links', cmds: [{ n: 'Hyperlink / Action', d: 'Link text or a shape to a web page, another slide or a program.' }] },
        { g: 'Comments', cmds: [{ n: 'Comment', d: 'A review note on the slide.' }] },
        {
          g: 'Text',
          cmds: [
            { n: 'Text Box', d: 'Text anywhere on the slide (not part of the layout).' },
            { n: 'Header & Footer', d: 'Date and time (Update automatically or Fixed), Slide number, Footer text, Don’t show on title slide; Apply or Apply to All.' },
            { n: 'WordArt / Date & Time / Slide Number / Object', d: 'Decorative text and fields.' },
          ],
        },
        { g: 'Symbols', cmds: [{ n: 'Equation / Symbol', d: 'Maths and special characters.' }] },
        { g: 'Media', cmds: [{ n: 'Video / Audio', d: 'Online Video or Video on My PC; Audio on My PC or Record Audio (narration).' }] },
      ],
    },
    {
      t: 'DESIGN',
      groups: [
        { g: 'Themes', cmds: [{ n: 'Themes gallery', d: 'Coordinated background, colours and fonts; right-click a theme for Apply to All Slides / Apply to Selected Slides.' }] },
        { g: 'Variants', cmds: [{ n: 'Variants', d: 'Alternative colour schemes of the chosen theme.' }] },
        {
          g: 'Customize',
          cmds: [
            { n: 'Slide Size', d: 'Standard (4:3) or Widescreen (16:9, the 2013 default); Custom Slide Size… for A4, 35mm slides, overhead, banner, custom sizes (e.g. a greeting card or poster).' },
            { n: 'Format Background', d: 'Solid, gradient, picture or pattern fill for the slide background; Apply to All.' },
          ],
        },
      ],
    },
    {
      t: 'TRANSITIONS',
      groups: [
        { g: 'Preview', cmds: [{ n: 'Preview', d: 'Plays the current slide’s transition.' }] },
        {
          g: 'Transition to This Slide',
          cmds: [
            { n: 'Transitions gallery', d: 'How this slide arrives: None, Cut, Fade, Push, Wipe, Split, Reveal, Random Bars, Shape, Uncover, Cover, Flash; Exciting: Fall Over, Curtains…' },
            { n: 'Effect Options', d: 'Direction or variation of the transition (e.g. From Right).' },
          ],
        },
        {
          g: 'Timing',
          cmds: [
            { n: 'Sound', d: 'Plays a sound with the transition.' },
            { n: 'Duration', d: 'How long the transition takes (seconds) — longer is slower.' },
            { n: 'Apply To All', d: 'Uses this slide’s transition and timing on every slide — good practice for consistency.' },
            { n: 'Advance Slide: On Mouse Click / After', d: 'Advance manually, or automatically after a set time (for a self-running show).' },
          ],
        },
      ],
    },
    {
      t: 'ANIMATIONS',
      groups: [
        { g: 'Preview', cmds: [{ n: 'Preview', d: 'Plays the slide’s animations.' }] },
        {
          g: 'Animation',
          cmds: [
            { n: 'Animations gallery', d: 'Entrance (green: Appear, Fade, Fly In, Wipe…), Emphasis (yellow: Pulse, Spin, Grow/Shrink…), Exit (red: Disappear, Fade, Fly Out…), Motion Paths.' },
            { n: 'Effect Options', d: 'Direction, and Sequence: As One Object, All at Once, By Paragraph (one bullet at a time).' },
          ],
        },
        {
          g: 'Advanced Animation',
          cmds: [
            { n: 'Add Animation', d: 'Adds a second effect to the same object (e.g. entrance then emphasis).' },
            { n: 'Animation Pane', d: 'Lists every effect on the slide in order; reorder, time and remove them.' },
            { n: 'Trigger', d: 'Start an effect when a particular object is clicked.' },
            { n: 'Animation Painter', d: 'Copies animation from one object to another (like Format Painter).' },
          ],
        },
        {
          g: 'Timing',
          cmds: [
            { n: 'Start', d: 'On Click, With Previous, After Previous.' },
            { n: 'Duration / Delay', d: 'Speed of the effect; wait before it starts.' },
            { n: 'Reorder Animation', d: 'Move Earlier / Move Later.' },
          ],
        },
      ],
    },
    {
      t: 'SLIDE SHOW',
      groups: [
        {
          g: 'Start Slide Show',
          cmds: [
            { n: 'From Beginning', d: 'Runs the show from slide 1.', k: 'F5' },
            { n: 'From Current Slide', d: 'Runs the show from the selected slide.', k: 'Shift+F5' },
            { n: 'Present Online', d: 'Broadcast the show to people with a web link.' },
            { n: 'Custom Slide Show', d: 'Show a chosen subset of slides in a chosen order.' },
          ],
        },
        {
          g: 'Set Up',
          cmds: [
            { n: 'Set Up Slide Show', d: 'Presented by a speaker (full screen), Browsed by an individual (window), Browsed at a kiosk (loops until Esc); loop, show without narration/animation, slides from–to, pen colour.' },
            { n: 'Hide Slide', d: 'Keeps a slide in the file but skips it during the show (its number is crossed out).' },
            { n: 'Rehearse Timings', d: 'Runs the show with a timer; saves how long each slide stayed on screen.' },
            { n: 'Record Slide Show', d: 'Records narration, ink and laser pointer along with timings.' },
            { n: 'Play Narrations / Use Timings / Show Media Controls', d: 'Untick Use Timings to go back to advancing by click.' },
          ],
        },
        { g: 'Monitors', cmds: [{ n: 'Monitor / Use Presenter View', d: 'Presenter View shows your notes, next slide and a timer on your screen while the audience sees only the slide.' }] },
      ],
    },
    {
      t: 'REVIEW',
      groups: [
        { g: 'Proofing', cmds: [{ n: 'Spelling', d: 'Checks every slide and the notes.', k: 'F7' }, { n: 'Research / Thesaurus', d: 'Research task pane and synonyms.' }] },
        { g: 'Language', cmds: [{ n: 'Translate / Language', d: 'Translate text; set the proofing language.' }] },
        { g: 'Comments', cmds: [{ n: 'New Comment / Delete / Previous / Next / Show Comments', d: 'Review notes on slides.' }] },
        { g: 'Compare', cmds: [{ n: 'Compare / Accept / Reject', d: 'Merge another version and review the differences.' }] },
      ],
    },
    {
      t: 'VIEW',
      groups: [
        {
          g: 'Presentation Views',
          cmds: [
            { n: 'Normal', d: 'Slide thumbnails on the left, the slide in the middle, notes pane below — for building slides.' },
            { n: 'Outline View', d: 'The text of every slide as an outline.' },
            { n: 'Slide Sorter', d: 'All slides as thumbnails — best for reordering, deleting, hiding and seeing timings.' },
            { n: 'Notes Page', d: 'One slide per page with room for speaker notes (what prints with Notes Pages).' },
            { n: 'Reading View', d: 'Plays the show inside the window with the status bar visible.' },
          ],
        },
        {
          g: 'Master Views',
          cmds: [
            { n: 'Slide Master', d: 'Change fonts, colours, bullets, logos and placeholders once for every slide.' },
            { n: 'Handout Master / Notes Master', d: 'Layout of printed handouts and notes pages.' },
          ],
        },
        { g: 'Show', cmds: [{ n: 'Ruler / Gridlines / Guides / Notes', d: 'Alignment aids; show/hide the notes pane.' }] },
        { g: 'Zoom', cmds: [{ n: 'Zoom / Fit to Window', d: 'Magnify the slide pane.' }] },
        { g: 'Color/Grayscale', cmds: [{ n: 'Color / Grayscale / Black and White', d: 'Preview how slides print without colour.' }] },
        { g: 'Window', cmds: [{ n: 'New Window / Arrange All / Cascade / Switch Windows', d: 'Work with several presentations.' }] },
      ],
    },
  ],
  contextual: [
    {
      trigger: 'Click a picture',
      label: 'PICTURE TOOLS',
      tabs: [
        {
          t: 'FORMAT',
          ctx: 'PICTURE TOOLS',
          groups: [
            { g: 'Adjust', cmds: [{ n: 'Corrections / Color / Artistic Effects / Compress / Reset', d: 'Brightness, contrast, colour and file size.' }] },
            { g: 'Picture Styles', cmds: [{ n: 'Picture Styles / Border / Effects / Layout', d: 'Frames and effects.' }] },
            { g: 'Arrange', cmds: [{ n: 'Bring Forward / Send Backward / Align / Group / Rotate', d: 'Order and position.' }] },
            { g: 'Size', cmds: [{ n: 'Crop / Height / Width', d: 'Trim edges; exact size.' }] },
          ],
        },
      ],
    },
    {
      trigger: 'Click a SmartArt diagram',
      label: 'SMARTART TOOLS',
      tabs: [
        {
          t: 'DESIGN',
          ctx: 'SMARTART TOOLS',
          groups: [
            { g: 'Create Graphic', cmds: [{ n: 'Add Shape / Promote / Demote / Text Pane', d: 'Add boxes (e.g. a new staff member in an organogram) and change levels.' }] },
            { g: 'Layouts / SmartArt Styles', cmds: [{ n: 'Layouts / Change Colors / Styles', d: 'Switch diagram type and look.' }] },
          ],
        },
      ],
    },
  ],
}

export const ACCESS: AppDef = {
  name: 'Access',
  color: '#A4373A',
  doc: 'SchoolDB : Database - Access',
  file: [
    ['Info', 'Compact & Repair Database, Encrypt with Password, database properties.'],
    ['New', 'Blank desktop database (.accdb) or a template (Custom web app needs SharePoint).'],
    ['Open', 'Recent databases, Computer → Browse.'],
    ['Save / Save As', 'Save Object As, or Save Database As (.accdb, Access 2002-2003 .mdb, template).'],
    ['Print', 'Quick Print, Print, Print Preview of the open object.'],
    ['Close / Options', 'Close the database; Access Options (e.g. current database settings).'],
  ],
  tabs: [
    {
      t: 'HOME',
      groups: [
        { g: 'Views', cmds: [{ n: 'View', d: 'Switch the open object between Datasheet View and Design View (and Form/Layout/Report/Print Preview views).' }] },
        clipboard,
        {
          g: 'Sort & Filter',
          cmds: [
            { n: 'Filter', d: 'Filter the records by the values in the current field.' },
            { n: 'Ascending / Descending', d: 'Sort records A→Z / Z→A by the current field.' },
            { n: 'Remove Sort', d: 'Back to the original order.' },
            { n: 'Selection / Advanced / Toggle Filter', d: 'Filter by the selected value; Filter by Form; switch the filter on/off.' },
          ],
        },
        {
          g: 'Records',
          cmds: [
            { n: 'Refresh All', d: 'Reloads the data.' },
            { n: 'New', d: 'Goes to a new blank record.', k: 'Ctrl++' },
            { n: 'Save', d: 'Saves the current record (records also save automatically when you leave them).', k: 'Shift+Enter' },
            { n: 'Delete', d: 'Deletes the current record — cannot be undone.' },
            { n: 'Totals', d: 'Adds a Total row to a datasheet (Sum, Average, Count…).' },
            { n: 'Spelling / More', d: 'Spell check; row height, field width, hide/freeze fields.' },
          ],
        },
        {
          g: 'Find',
          cmds: [
            { n: 'Find / Replace', d: 'Search a field or the whole table.', k: 'Ctrl+F / Ctrl+H' },
            { n: 'Go To / Select', d: 'Move to First, Previous, Next, Last or New record.' },
          ],
        },
        { g: 'Text Formatting', cmds: [{ n: 'Font / Size / Bold / Alignment / Gridlines / Alternate Row Color', d: 'Look of the datasheet.' }] },
      ],
    },
    {
      t: 'CREATE',
      groups: [
        { g: 'Templates', cmds: [{ n: 'Application Parts', d: 'Ready-made tables and forms (Contacts, Issues, Tasks…).' }] },
        {
          g: 'Tables',
          cmds: [
            { n: 'Table', d: 'New table in Datasheet View (starts with an ID AutoNumber field).' },
            { n: 'Table Design', d: 'New table in Design View: type Field Names, choose Data Types, set the Primary Key and field properties.' },
            { n: 'SharePoint Lists', d: 'Tables linked to SharePoint.' },
          ],
        },
        {
          g: 'Queries',
          cmds: [
            { n: 'Query Wizard', d: 'Step-by-step: Simple Query Wizard, Crosstab, Find Duplicates, Find Unmatched.' },
            { n: 'Query Design', d: 'Blank query in Design View: Show Table, drag fields to the grid, set Sort, Show and Criteria, then Run.' },
          ],
        },
        {
          g: 'Forms',
          cmds: [
            { n: 'Form', d: 'One-click form for the table/query selected in the Navigation Pane; opens in Layout View.' },
            { n: 'Form Design / Blank Form', d: 'Build a form from scratch in Design or Layout View.' },
            { n: 'Form Wizard', d: 'Pick fields, layout (Columnar, Tabular, Datasheet, Justified) and title.' },
            { n: 'Navigation / More Forms', d: 'Navigation forms (menus); Multiple Items, Datasheet, Split Form, Modal Dialog.' },
          ],
        },
        {
          g: 'Reports',
          cmds: [
            { n: 'Report', d: 'One-click report of the selected table/query; opens in Layout View.' },
            { n: 'Report Design / Blank Report', d: 'Build a report from scratch.' },
            { n: 'Report Wizard', d: 'Fields, grouping levels, sort order and summary options, layout, orientation.' },
            { n: 'Labels', d: 'Mailing labels from the records.' },
          ],
        },
        { g: 'Macros & Code', cmds: [{ n: 'Macro / Module / Class Module / Visual Basic', d: 'Automate tasks.' }] },
      ],
    },
    {
      t: 'EXTERNAL DATA',
      groups: [
        {
          g: 'Import & Link',
          cmds: [
            { n: 'Saved Imports / Linked Table Manager', d: 'Repeat saved imports; update links.' },
            { n: 'Excel', d: 'Import the source data into a new table, Append a copy to an existing table, or Link to the data source by creating a linked table.' },
            { n: 'Access', d: 'Import or link tables, queries, forms… from another Access database.' },
            { n: 'ODBC Database / Text File / XML File / More', d: 'Other sources (SQL Server, CSV text, XML, SharePoint, Outlook…).' },
          ],
        },
        {
          g: 'Export',
          cmds: [
            { n: 'Saved Exports', d: 'Repeat saved exports.' },
            { n: 'Excel / Text File / XML File / PDF or XPS / Email / Access', d: 'Send the selected object to another format.' },
            { n: 'Word Merge', d: 'Uses the table as the data source for a Word mail merge.' },
          ],
        },
      ],
    },
    {
      t: 'DATABASE TOOLS',
      groups: [
        { g: 'Tools', cmds: [{ n: 'Compact and Repair Database', d: 'Shrinks the file and fixes minor corruption.' }] },
        { g: 'Macro', cmds: [{ n: 'Visual Basic / Run Macro', d: 'Open the VBA editor; run a macro.' }] },
        {
          g: 'Relationships',
          cmds: [
            { n: 'Relationships', d: 'Window where tables are linked: drag a primary key onto the matching foreign key, tick Enforce Referential Integrity, see one-to-many (1–∞) lines.' },
            { n: 'Object Dependencies', d: 'Which objects use which tables/queries.' },
          ],
        },
        { g: 'Analyze', cmds: [{ n: 'Database Documenter / Analyze Performance / Analyze Table', d: 'Reports on the design; suggestions to split repeated data into tables.' }] },
        { g: 'Move Data', cmds: [{ n: 'SQL Server / Access Database', d: 'Upsize to SQL Server; split into front end and back end.' }] },
        { g: 'Add-ins', cmds: [{ n: 'Add-ins', d: 'Add-in manager.' }] },
      ],
    },
  ],
  contextual: [
    {
      trigger: 'Open a table in Design View',
      label: 'TABLE TOOLS',
      tabs: [
        {
          t: 'DESIGN',
          ctx: 'TABLE TOOLS',
          groups: [
            { g: 'Views', cmds: [{ n: 'View', d: 'Back to Datasheet View (you will be asked to save the design).' }] },
            {
              g: 'Tools',
              cmds: [
                { n: 'Primary Key', d: 'Makes the selected field(s) the primary key — a key symbol appears; no duplicates or blanks allowed.' },
                { n: 'Builder / Test Validation Rules', d: 'Expression builder; check existing data against new rules.' },
                { n: 'Insert Rows / Delete Rows', d: 'Add a field above the current one, or remove a field.' },
                { n: 'Modify Lookups', d: 'Lookup Wizard for a field.' },
              ],
            },
            { g: 'Show/Hide', cmds: [{ n: 'Property Sheet / Indexes', d: 'Table properties; list of indexes.' }] },
            { g: 'Relationships', cmds: [{ n: 'Relationships / Object Dependencies', d: 'Open the Relationships window.' }] },
          ],
        },
      ],
    },
    {
      trigger: 'Open a query in Design View',
      label: 'QUERY TOOLS',
      tabs: [
        {
          t: 'DESIGN',
          ctx: 'QUERY TOOLS',
          groups: [
            { g: 'Results', cmds: [{ n: 'View', d: 'Datasheet View, Design View or SQL View of the query.' }, { n: 'Run', d: 'Runs the query (the ! button) and shows the results.' }] },
            { g: 'Query Type', cmds: [{ n: 'Select', d: 'Shows records (the default query type).' }, { n: 'Make Table / Append / Update / Delete', d: 'Action queries that change data.' }, { n: 'Crosstab', d: 'Summary grid like a PivotTable.' }] },
            { g: 'Query Setup', cmds: [{ n: 'Show Table', d: 'Add tables or queries to the design.' }, { n: 'Insert/Delete Rows and Columns / Builder / Return', d: 'Edit the grid; Return limits to Top 5, 25, 5%….' }] },
            { g: 'Show/Hide', cmds: [{ n: 'Totals', d: 'Adds a Total row: Group By, Sum, Avg, Count, Max, Min.' }, { n: 'Parameters / Property Sheet / Table Names', d: 'Ask the user for a value when the query runs.' }] },
          ],
        },
      ],
    },
    {
      trigger: 'Open a form in Layout View',
      label: 'FORM LAYOUT TOOLS',
      tabs: [
        {
          t: 'DESIGN',
          ctx: 'FORM LAYOUT TOOLS',
          groups: [
            { g: 'Themes', cmds: [{ n: 'Themes / Colors / Fonts', d: 'Look of the form.' }] },
            { g: 'Controls', cmds: [{ n: 'Text Box / Label / Button / Combo Box / Check Box …', d: 'Items placed on the form.' }] },
            { g: 'Header / Footer', cmds: [{ n: 'Logo / Title / Date and Time', d: 'Form header items.' }] },
            { g: 'Tools', cmds: [{ n: 'Add Existing Fields / Property Sheet', d: 'Add a field that was added to the table after the form was made.' }] },
          ],
        },
        { t: 'ARRANGE', ctx: 'FORM LAYOUT TOOLS', groups: [{ g: 'Table', cmds: [{ n: 'Stacked / Tabular / Remove Layout', d: 'Arrange controls in columns or rows.' }] }] },
        { t: 'FORMAT', ctx: 'FORM LAYOUT TOOLS', groups: [{ g: 'Font / Number / Background', cmds: [{ n: 'Font / Conditional Formatting / Background Image', d: 'Format the controls.' }] }] },
      ],
    },
  ],
}

export const APPS: Record<string, AppDef> = { word: WORD, excel: EXCEL, powerpoint: POWERPOINT, access: ACCESS }
