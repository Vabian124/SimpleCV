# LibreCV

LibreCV is a local editor for a CV or a motivation letter. The public site is [https://librecv.org/](https://librecv.org/). The source is [github.com/Vabian124/SimpleCV](https://github.com/Vabian124/SimpleCV).

Serve this folder at the site root. The editor loads its script and stylesheet from that root. There is no account. The document stays in the browser. Feedback is separate: a note includes the page, the browser, or the document only when that box is ticked.

The editor source is `src/editor/`. The styles are `src/css/`. `npm run build` joins them into `editor.js` and `styles.css`, which are the files the site loads. `npm test` checks that the join matches. `npm run lint` runs ESLint, Stylelint, and HTML Validate.

The first visit asks whether you want a CV or a motivation letter. Then you can walk through it step by step, start from a blank page, paste text, load demo data, or copy an AI template. Paste text uses Chrome's on-device model. Another browser warns first, and you can continue. Make blocks, in settings, sorts text in any browser. The template stays on this device: no account, no key, and the text is not sent to a server. In the studio, formatting appears above the block you touch. Settings, paste, colours and the typeface live in the panel on the right. Use your own AI, in the top bar, copies a template. Paste that into any model. An old CV and the job are optional. The model should answer with one code block, which pastes back onto the page. The template keeps a photo frame in the sidebar, with its shape, and leaves the picture file out. An https address on that frame can load the picture. Download a PDF whose text can be selected.

A PDF from this editor carries an attachment named `document.json`: the blocks, the language, the theme and the colours. Import that PDF to keep editing. A PDF without the attachment shows a message.

EN/NL switches the buttons and the fixed headings. Text you typed stays as it is. A new visit starts in English. A link with `?lang=nl` or `?lang=en` chooses that language for this visit.

These pages are separate from the editor, and they are listed in `sitemap.xml`:

- [https://librecv.org/nl/](https://librecv.org/nl/) is the Dutch introduction
- [https://librecv.org/motivation-letter/](https://librecv.org/motivation-letter/) and [https://librecv.org/nl/motivatiebrief/](https://librecv.org/nl/motivatiebrief/) are the letter, in English and Dutch
- [https://librecv.org/templates/](https://librecv.org/templates/) links to a software engineer CV and a nursing CV

`/step-1`, `/step-2`, `/step-3` and `/editor` are the editor itself. They stay out of the sitemap. The canonical URL of the editor is `https://librecv.org/`.

Feedback is a button in the editor header and in the footer of each setup step. The form loads when you open it. Send privately, or open a GitHub issue. The issue template tells an assistant not to paste a CV. Private notes are read at `/feedback/desk/`. That address is not linked from the public pages and is not indexed. Its password is not in this repository. A note can be deleted there, which removes the message and any document text. The private form uses a self-hosted ALTCHA check. Instructions for an assistant are in `feedback.txt`.

You design a page. It is not a markdown document.

The project's own code is CC0-1.0, as close to the public domain as the law here allows. The libraries keep their own licenses. See `NOTICE`.

## Nederlands

Een lokale editor voor een CV of een motivatiebrief. De site is [librecv.org](https://librecv.org/). Zet deze map neer als statische site, met de map als de root. Geen account en geen server. Het document blijft in de browser. De bron van de editor staat in `src/editor/`, de stijl in `src/css/`. `npm run build` voegt die bestanden samen tot `editor.js` en `styles.css`.

De eerste keer kies je een CV of een brief. Daarna stap voor stap, zelf invullen, tekst plakken, demodata, of Gebruik je eigen AI. Plak het sjabloon in een model. Een oud CV en de vacature zijn optioneel. Het antwoord hoort één codeblok te zijn, en dat plak je terug. Het sjabloon blijft op dit apparaat. Het houdt een fotokader in de zijbalk, met de vorm, en laat het beeldbestand zelf weg. Een https-adres op dat kader kan de foto laden. Download een PDF waarin de tekst selecteerbaar is.

NL/EN wisselt de knoppen en de vaste koppen. Een nieuw bezoek begint in het Engels. De Nederlandse uitleg staat op [librecv.org/nl/](https://librecv.org/nl/) en de brief op [librecv.org/nl/motivatiebrief/](https://librecv.org/nl/motivatiebrief/).

De eigen code is CC0-1.0. Bibliotheken houden hun eigen licentie. Zie `NOTICE`.

Feedback is een knop in de kop van de editor en in de voettekst van elke stap. Het formulier laadt pas als je het opent. Een privénotitie blijft buiten de zoekmachines. Een GitHub-issue is openbaar, dus daar hoort geen CV in.
