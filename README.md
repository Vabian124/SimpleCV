# LibreCV

LibreCV is a local editor for a CV or a motivation letter. The public site is [https://librecv.org/](https://librecv.org/). The source is [github.com/Vabian124/SimpleCV](https://github.com/Vabian124/SimpleCV).

Open `index.html` in a browser, or host this folder as a static site. There is no account and no server. The document stays in the browser.

The editor is written as several files in `src/editor/`. `npm run build` joins them into `editor.js`, which is the file the site loads. `npm test` checks that the join matches. `npm run lint` runs ESLint, Stylelint, and HTML Validate.

The first visit asks whether you want a CV or a motivation letter. Then you can walk through it step by step, start from a blank page, paste text, load demo data, or copy an AI template. Paste text uses Chrome's on-device model. Another browser warns first, and you can continue. Make blocks, in settings, sorts text in any browser. The template stays on this device: no account, no key, and the text is not sent to a server. In the studio, formatting appears above the block you touch. Settings, paste, colours and the typeface live in the panel on the right. AI in the top bar copies a template. Paste that into any model, then add an old CV and the job. The model should answer with one code block, which pastes back onto the page. Download a PDF whose text can be selected.

A PDF from this editor carries an attachment named `document.json`: the blocks, the language, the theme and the colours. Import that PDF to keep editing. A PDF without the attachment shows a message.

EN/NL switches the buttons and the fixed headings. Text you typed stays as it is. A new visit starts in English. A link with `?lang=nl` or `?lang=en` chooses that language for this visit.

These pages are separate from the editor, and they are listed in `sitemap.xml`:

- [https://librecv.org/nl/](https://librecv.org/nl/) is the Dutch introduction
- [https://librecv.org/motivation-letter/](https://librecv.org/motivation-letter/) and [https://librecv.org/nl/motivatiebrief/](https://librecv.org/nl/motivatiebrief/) are the letter, in English and Dutch
- [https://librecv.org/templates/](https://librecv.org/templates/) links to a software engineer CV and a nursing CV

`/step-1`, `/step-2`, `/step-3` and `/editor` are the editor itself. They stay out of the sitemap. The canonical URL of the editor is `https://librecv.org/`.

You design a page. It is not a markdown document.

The project's own code is CC0-1.0, as close to the public domain as the law here allows. The libraries keep their own licenses. See `NOTICE`.

## Nederlands

Een lokale editor voor een CV of een motivatiebrief. De site is [librecv.org](https://librecv.org/). Open `index.html`, of zet deze map neer als statische site. Geen account en geen server. Het document blijft in de browser. De bron van de editor staat in `src/editor/`. `npm run build` voegt die bestanden samen tot `editor.js`.

De eerste keer kies je een CV of een brief. Daarna stap voor stap, zelf invullen, tekst plakken, demodata, of een AI-sjabloon. Plak het sjabloon in een model, plus een oud CV en de vacature. Het antwoord hoort één codeblok te zijn, en dat plak je terug. Het sjabloon blijft op dit apparaat. Download een PDF waarin de tekst selecteerbaar is.

NL/EN wisselt de knoppen en de vaste koppen. Een nieuw bezoek begint in het Engels. De Nederlandse uitleg staat op [librecv.org/nl/](https://librecv.org/nl/) en de brief op [librecv.org/nl/motivatiebrief/](https://librecv.org/nl/motivatiebrief/).

De eigen code is CC0-1.0. Bibliotheken houden hun eigen licentie. Zie `NOTICE`.
