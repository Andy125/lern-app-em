// Englisch Klasse 5, Gymnasium Baden-Württemberg (britisches Englisch).
// Die Vokabeln der aktuellen Unit kommen als eigenes Thema vor «Hunde-Englisch» dazu.
// Vokabel-Karten: en, de, auchEn (weitere richtige Schreibweisen), satz mit genau einer {Lücke} (eigene Sätze,
// nicht aus dem Buch). {hund} und {hund3} wie in inhalte-bio.js.
(function (root) {
  "use strict";
  const F = root.LN_FAECHER || (root.LN_FAECHER = []);
  F.push({
    id: "englisch",
    name: "Englisch",
    kurz: "Englisch",
    icon: "🇬🇧",
    sprache: "en",
    arbeit: { titel: "Vokabeltest Englisch", datum: null },
    themen: [
      {
        id: "hunde-englisch",
        name: "Hunde-Englisch",
        icon: "🐕",
        bonus: true, // zum Ausprobieren und Spaß, zählt nicht für den Plan bis zum Vokabeltest
        warum: {
          frage: "Warum versteht {hund} vielleicht bald Englisch?",
          text: "Viele Hundetrainer geben Kommandos auf Englisch: «Sit!», «Down!», «Stay!». Die Wörter sind kurz und klar, und Hunde lernen sie genauso gut wie deutsche. Und wer Englisch kann, versteht Menschen, Bücher und Filme auf der ganzen Welt.",
        },
        fakten: [
          "Labradore stammen von Hunden aus Neufundland in Kanada ab. Zur Rasse gezüchtet wurden sie in England.",
          "Ein Hund bellt auf Englisch nicht «wau wau», sondern «woof woof».",
          "Ein Welpe heißt auf Englisch «puppy».",
        ],
        karten: [
          { typ: "vokabel", id: "he-dog", en: "dog", de: "der Hund", satz: "My {dog} likes to play in the garden." },
          { typ: "vokabel", id: "he-puppy", en: "puppy", de: "der Welpe", satz: "The little {puppy} is only twelve weeks old." },
          { typ: "vokabel", id: "he-bone", en: "bone", de: "der Knochen", satz: "The dog is chewing a {bone}.", warum: "Das Wort kennst du schon aus Bio: Knochen!" },
          { typ: "vokabel", id: "he-paw", en: "paw", de: "die Pfote", satz: "Give me your {paw}, please!" },
          { typ: "vokabel", id: "he-tail", en: "tail", de: "der Schwanz", satz: "The dog wags its {tail}." },
          { typ: "vokabel", id: "he-ear", en: "ear", de: "das Ohr", satz: "A Labrador has soft {ears}." },
          { typ: "vokabel", id: "he-nose", en: "nose", de: "die Nase", satz: "Dogs have a very good {nose}." },
          { typ: "vokabel", id: "he-lead", en: "lead", de: "die Leine", auchEn: ["leash"], satz: "Put the dog on the {lead}, please.", tipp: "Im britischen Englisch heißt die Leine anders als im amerikanischen. Beides zählt." },
          { typ: "vokabel", id: "he-collar", en: "collar", de: "das Halsband", satz: "The dog has a red {collar}." },
          { typ: "vokabel", id: "he-bowl", en: "bowl", de: "der Napf", satz: "There is water in the {bowl}." },
          { typ: "vokabel", id: "he-treat", en: "treat", de: "das Leckerli", satz: "Sit! Good girl! Here is a {treat}." },
          { typ: "vokabel", id: "he-ball", en: "ball", de: "der Ball", satz: "Can you throw the {ball}?" },
          { typ: "vokabel", id: "he-bark", en: "to bark", de: "bellen", satz: "The dog {barks} at the cat." },
          { typ: "vokabel", id: "he-play", en: "to play", de: "spielen", satz: "Let's {play} in the park!" },
          { typ: "vokabel", id: "he-run", en: "to run", de: "rennen", satz: "Dogs can {run} very fast." },
          { typ: "vokabel", id: "he-sleep", en: "to sleep", de: "schlafen", satz: "The puppy wants to {sleep} now." },
          { typ: "vokabel", id: "he-fetch", en: "to fetch", de: "holen, apportieren", satz: "Can you {fetch} the stick?" },
          {
            typ: "paare", id: "he-kommandos", titel: "Hundekommandos: Ordne Deutsch und Englisch zu.",
            paare: [["Sitz!", "Sit!"], ["Platz!", "Down!"], ["Bleib!", "Stay!"], ["Komm!", "Come!"], ["Hol es!", "Fetch!"], ["Braves Mädchen!", "Good girl!"]],
            warum: "Probier es aus: Sag {hund3} ein Kommando auf Englisch.",
          },
          {
            typ: "auftrag", id: "he-kommando", art: "forschen", titel: "Ein Kommando auf Englisch",
            text: "Bring {hund3} ein Kommando auf Englisch bei, zum Beispiel «Sit!». Sag es immer gleich und lobe mit «Good girl!» und einem Leckerli. Klappt es nach ein paar Tagen?",
          },
          {
            typ: "auftrag", id: "he-knochen", art: "basteln", titel: "Vokabel-Knochen",
            text: "Schneide kleine Hundeknochen aus Pappe aus. Schreib auf die eine Seite das englische Wort, auf die andere das deutsche. Damit kann dich jemand abfragen, oder du fragst dich selbst ab.",
          },
          {
            typ: "auftrag", id: "he-zeigen", art: "bewegen", titel: "Zeigen und sagen",
            text: "Lauf durchs Haus und tippe auf alles, was zum Hund gehört. Sag dabei laut das englische Wort: bowl, lead, collar, ball, bone. Wie viele schaffst du in einer Minute?",
          },
        ],
      },
    ],
  });
})(typeof window !== "undefined" ? window : globalThis);
