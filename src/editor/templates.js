/* CC0-1.0 — https://creativecommons.org/publicdomain/zero/1.0/ */
/* Empty documents, the demo, and a new block of each type. */

function t(key) {
    const parts = key.split(".");
    let node = I18N[lang] || I18N.nl;
    for (let i = 0; i < parts.length; i++) {
        if (node == null) return key;
        node = node[parts[i]];
    }
    return node == null ? key : node;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function safeCss(value) {
    return String(value).replace(/["'<>;]/g, "");
}

function uid() {
    seq += 1;
    return "b" + seq;
}

function cvTheme() {
    return {
        sidebar: "#1e293b",
        sidebarText: "#f8fafc",
        accent: "#0284c7",
        accentLight: "#38bdf8",
        page: "#ffffff",
        text: "#334155",
        baseSize: 9.5,
        sidebarWidth: 33,
        font: "roboto"
    };
}

function letterTheme() {
    return {
        sidebar: "#0b1d16",
        sidebarText: "#ffffff",
        accent: "#047857",
        accentLight: "#6ee7b7",
        page: "#ffffff",
        text: "#111827",
        baseSize: 8.8,
        sidebarWidth: 32,
        font: "roboto"
    };
}

function block(type, fields) {
    return {
        id: uid(),
        type: type,
        color: "",
        background: "",
        fontSize: 0,
        fields: fields
    };
}

function barHeading(key) {
    return block("heading", { key: key, style: "bar", html: "" });
}

function labelHeading(html) {
    return block("heading", { key: "", style: "label", html: html });
}

function makeLetterhead(date, to, subject, title) {
    return block("letterhead", {
        title: title || "",
        date: date || "",
        to: to || "",
        subject: subject || ""
    });
}

function demoPack() {
    if (lang === "en") {
        return {
            role: "Designer",
            city: "Example City",
            born: "01-01-1998 (28)",
            skills: ["Writing", "Prototypes", "Layout", "Workshops", "HTML"],
            strengths: [
                ["Clear writing", "Turns a tangled idea into a short text."],
                ["Working together", "Keeps the notes when a made-up team changes the plan."],
                ["Structure", "Sorts a loose page into headings and a calm order."]
            ],
            projects: [
                ["North Light", "A made-up site for a studio that makes lamps."],
                ["North Cape", "A made-up exhibition. The captions are invented."],
                ["Example Guide", "A practice site where a team added its own pages."]
            ],
            intro: "Alex Jansen is a made-up designer from Example City. This CV belongs to nobody. It shows a name, a role, contact, skills, strengths, a short introduction, four jobs and two studies.",
            jobs: [
                ["Designer", "2022 – 2024", "North Light Ltd", ["A house style for a fictional lamp studio.", "Short product lines for a catalogue that does not exist."]],
                ["Designer", "2020 – 2022", "Example Bureau", ["Campaigns for clients who were never real.", "Presentations a stranger could follow in five minutes."]],
                ["Intern", "2019", "Example Studio", ["Sat in on a campaign that was never broadcast."]],
                ["Shop assistant", "2016 – 2018", "Example Shop", ["Worked in a shop beside a course, so this CV also shows a simple job."]]
            ],
            studies: [
                ["Communication", "2017 – 2021", "Example University", ["A graduation project about an imaginary museum."]],
                ["Media foundation", "2015 – 2017", "Example College", ["Type, pictures and a first practice site."]]
            ],
            letterIntro: "Alex Jansen is a made-up designer. This letter belongs to nobody. It shows a header, a recipient, a subject, a short box, sections and a signature.",
            every: "This example puts every block on the page, so a paragraph, a list, a header and a signature are all visible.",
            greeting: "Dear committee,",
            sections: [
                ["A wide base", "I like to work on the whole piece, not on one loose button. First the reader's question, then the text, then the page."],
                ["From question to page", "At North Light, a studio that exists only here, I wrote the product lines and built the site. The job was fictional. The order is real: a question, a text, a page."],
                ["Explaining to a team", "What I like most is making a difficult subject short for someone else. In this example that is a half-hour workshop and a one-page note."],
                ["Switching when it is busy", "At Example Bureau the campaigns were never broadcast. The example learned to keep a story short and to change the order the same afternoon."],
                ["Own projects", "North Cape is an imaginary exhibition about maps. I made the captions and the floor plan. Example Guide is a practice site. Both exist only in this letter."]
            ],
            list: [
                "A page that answers the reader's question at a glance.",
                "Text that stays short when the subject is complicated.",
                "The same words on screen and in the PDF."
            ],
            closeNote: "I will gladly explain this made-up application in a meeting that also does not exist.",
            closing: "Kind regards,",
            date: "Example City, 29 October 2026",
            to: "Example Organisation<br>For the committee<br>Example Street 1<br>1234 AB Example City",
            subject: "Subject: application as a designer, a made-up vacancy"
        };
    }
    return {
        role: "Ontwerper",
        city: "Voorbeeldstad",
        born: "01-01-1998 (28 jaar)",
        skills: ["Schrijven", "Prototypes", "Vormgeving", "Workshops", "HTML"],
        strengths: [
            ["Helder schrijven", "Maakt van een ingewikkeld idee een korte tekst."],
            ["Samenwerken", "Houdt de notities bij als een verzonnen team het plan wijzigt."],
            ["Structuur", "Zet een losse pagina om in koppen en een rustige volgorde."]
        ],
        projects: [
            ["Noorderlicht", "Een verzonnen site voor een studio die lampen maakt."],
            ["Noordkaap", "Een denkbeeldige tentoonstelling. De bijschriften zijn verzonnen."],
            ["Voorbeeldgids", "Een oefensite waarop een team zelf pagina's toevoegde."]
        ],
        intro: "Alex Jansen is een verzonnen ontwerper uit Voorbeeldstad. Dit cv hoort bij niemand. Het toont een naam, een rol, contact, vaardigheden, competenties, een korte introductie, vier banen en twee opleidingen.",
        jobs: [
            ["Ontwerper", "2022 – 2024", "Noorderlicht BV", ["Een huisstijl voor een fictieve lampenstudio.", "Korte productteksten voor een catalogus die niet bestaat."]],
            ["Vormgever", "2020 – 2022", "Voorbeeldbureau", ["Campagnes voor opdrachtgevers die nooit hebben bestaan.", "Presentaties die een buitenstaander in vijf minuten volgt."]],
            ["Stagiair", "2019", "Atelier Voorbeeld", ["Meegelopen bij een campagne die nooit is uitgezonden."]],
            ["Winkelmedewerker", "2016 – 2018", "Voorbeeldwinkel", ["Naast een opleiding in de winkel gestaan, zodat dit cv ook een eenvoudige baan toont."]]
        ],
        studies: [
            ["Communicatie", "2017 – 2021", "Voorbeeld Hogeschool", ["Afstudeerproject over een denkbeeldig museum."]],
            ["Voortraject media", "2015 – 2017", "Voorbeeld College", ["Typografie, beeld en een eerste oefensite."]]
        ],
        letterIntro: "Alex Jansen is een verzonnen ontwerper. Deze brief hoort bij niemand. Hij toont een briefkop, een ontvanger, een onderwerp, een kort vak, tussenkoppen en een handtekening.",
        every: "Dit voorbeeld zet elk blok op de pagina, zodat een alinea, een lijst, een briefkop en een handtekening allemaal te zien zijn.",
        greeting: "Beste commissie,",
        sections: [
            ["Een brede basis", "Ik werk het liefst aan het hele stuk, niet aan één losse knop. Eerst de vraag van de lezer, dan de tekst, dan de pagina."],
            ["Van vraag naar pagina", "Bij Noorderlicht, een studio die alleen in dit voorbeeld bestaat, schreef ik de productteksten en zette ik de site in elkaar. Het werk was fictief. De volgorde is echt: een vraag, een tekst, een pagina."],
            ["Uitleggen aan een team", "Wat ik het liefste doe is een ingewikkeld onderwerp kort maken voor iemand anders. In dit voorbeeld is dat een workshop van een half uur en een notitie van één bladzijde."],
            ["Schakelen als het druk is", "Bij Voorbeeldbureau zijn de campagnes nooit uitgezonden. Het voorbeeld leerde een verhaal kort te houden en dezelfde middag nog een andere volgorde te kiezen."],
            ["Eigen projecten", "Noordkaap is een denkbeeldige tentoonstelling over kaarten. Ik maakte het bijschrift en de plattegrond. Voorbeeldgids is een oefensite. Allebei bestaan alleen in deze brief."]
        ],
        list: [
            "Een pagina die in één oogopslag de vraag van de lezer beantwoordt.",
            "Teksten die kort blijven, ook als het onderwerp ingewikkeld is.",
            "Dezelfde woorden op het scherm en in de PDF."
        ],
        closeNote: "Ik licht deze verzonnen sollicitatie graag toe in een gesprek dat eveneens niet bestaat.",
        closing: "Met vriendelijke groet,",
        date: "Voorbeeldstad, 29 oktober 2026",
        to: "Voorbeeld Organisatie<br>Aan de commissie<br>Voorbeeldstraat 1<br>1234 AB Voorbeeldstad",
        subject: "Betreft: sollicitatie als ontwerper, een verzonnen vacature"
    };
}

function placeholderPhoto() {
    const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='240' height='320' viewBox='0 0 240 320'><rect width='240' height='320' fill='#d6dee8'/><circle cx='120' cy='118' r='46' fill='#94a3b8'/><ellipse cx='120' cy='270' rx='74' ry='58' fill='#94a3b8'/></svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

function demoSidebar(copy, withProjects, compactPhoto) {
    const side = [
        block("name", { html: "Alex<br>Jansen" }),
        block("photo", { src: placeholderPhoto(), original: "", caption: "", aspect: compactPhoto ? "1 / 1" : "3 / 4" }),
        block("role", { html: copy.role }),
        barHeading("doc.contact"),
        block("contact", { labelKey: "city", label: "", html: copy.city }),
        block("contact", { labelKey: "phone", label: "", html: "+31 6 0000 0000" }),
        block("contact", { labelKey: "email", label: "", html: "alex@example.com" }),
        block("contact", { labelKey: "born", label: "", html: copy.born }),
        barHeading("doc.skills")
    ];
    copy.skills.forEach(function (skill) { side.push(block("skill", { html: skill })); });
    if (withProjects) {
        side.push(barHeading("doc.projects"));
        copy.projects.forEach(function (item) {
            side.push(block("project", { title: item[0], body: item[1] }));
        });
    }
    side.push(barHeading("doc.strengths"));
    copy.strengths.forEach(function (item) {
        side.push(block("competence", { title: item[0], body: item[1] }));
    });
    return side;
}

function demoExperience(main, copy) {
    main.push(barHeading("doc.work"));
    copy.jobs.forEach(function (job) {
        main.push(block("timeline", { title: job[0], date: job[1], org: job[2], items: job[3] }));
    });
    main.push(barHeading("doc.education"));
    copy.studies.forEach(function (study) {
        main.push(block("timeline", { title: study[0], date: study[1], org: study[2], items: study[3] }));
    });
}

function demoCv() {
    const copy = demoPack();
    const main = [
        makeLetterhead(copy.date, copy.city, copy.role, "CV"),
        barHeading("doc.profile"),
        block("intro", { html: copy.intro }),
        block("paragraph", { html: copy.every }),
        block("list", { items: copy.list.slice() })
    ];
    demoExperience(main, copy);
    main.push(block("closing", { paragraphs: [copy.closing] }));
    main.push(block("signature", { html: "Alex Jansen" }));
    main.push(block("spacer", { size: 18 }));
    return {
        version: 1,
        lang: lang,
        kind: "cv",
        theme: cvTheme(),
        sidebar: demoSidebar(copy, true),
        main: main
    };
}

function demoLetter() {
    const copy = demoPack();
    const main = [
        makeLetterhead(copy.date, copy.to, copy.subject, t("doc.letter")),
        block("intro", { html: copy.letterIntro }),
        block("paragraph", { html: copy.greeting })
    ];
    copy.sections.forEach(function (section) {
        main.push(labelHeading(section[0]));
        main.push(block("paragraph", { html: section[1] }));
        if (section[2]) main.push(block("paragraph", { html: section[2] }));
    });
    main.push(block("list", { items: copy.list.slice() }));
    demoExperience(main, copy);
    main.push(block("paragraph", { html: copy.closeNote }));
    main.push(block("closing", { paragraphs: [copy.closing] }));
    main.push(block("signature", { html: "Alex Jansen" }));
    main.push(block("spacer", { size: 8 }));
    return {
        version: 1,
        lang: lang,
        kind: "letter",
        theme: letterTheme(),
        sidebar: demoSidebar(copy, true, true),
        main: main
    };
}

function emptyCv() {
    return {
        version: 1,
        lang: lang,
        kind: "cv",
        theme: cvTheme(),
        sidebar: [
            block("name", { html: "" }),
            block("role", { html: "" }),
            barHeading("doc.contact"),
            block("contact", { labelKey: "city", label: "", html: "" }),
            block("contact", { labelKey: "phone", label: "", html: "" }),
            block("contact", { labelKey: "email", label: "", html: "" }),
            block("contact", { labelKey: "born", label: "", html: "" }),
            barHeading("doc.skills"),
            block("skill", { html: "" }),
            barHeading("doc.strengths"),
            block("competence", { title: "", body: "" })
        ],
        main: [
            barHeading("doc.profile"),
            block("intro", { html: "" }),
            barHeading("doc.work"),
            block("timeline", { title: "", date: "", org: "", items: [""] }),
            barHeading("doc.education"),
            block("timeline", { title: "", date: "", org: "", items: [""] })
        ]
    };
}

function emptyLetter() {
    return {
        version: 1,
        lang: lang,
        kind: "letter",
        theme: letterTheme(),
        sidebar: [
            block("name", { html: "" }),
            block("role", { html: "" }),
            barHeading("doc.contact"),
            block("contact", { labelKey: "city", label: "", html: "" }),
            block("contact", { labelKey: "phone", label: "", html: "" }),
            block("contact", { labelKey: "email", label: "", html: "" })
        ],
        main: [
            makeLetterhead("", "", "", ""),
            block("intro", { html: "" }),
            block("paragraph", { html: "" }),
            block("paragraph", { html: "" }),
            block("closing", { paragraphs: [""] }),
            block("signature", { html: "" })
        ]
    };
}

function createBlock(type) {
    const fields = {
        name: { html: "" },
        role: { html: "" },
        contact: { labelKey: "custom", label: "", html: "" },
        heading: {
            key: "",
            style: doc && doc.kind === "letter" && addTarget === "main" ? "label" : "bar",
            html: ""
        },
        photo: { src: "", original: "", caption: "", aspect: "3 / 4", url: "" },
        skill: { html: "" },
        competence: { title: "", body: "" },
        project: { title: "", body: "" },
        timeline: { title: "", date: "", org: "", items: [""] },
        intro: { html: "" },
        paragraph: { html: "" },
        list: { items: [""] },
        letterhead: { title: "", date: "", to: "", subject: "" },
        spacer: { size: 12 },
        closing: { paragraphs: [""] },
        signature: { html: "" }
    };
    return block(type, fields[type] || { html: "" });
}

