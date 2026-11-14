// Englisch Klasse 5, Gymnasium Baden-Württemberg (britisches Englisch).
// Wörter und Bedeutungen nach der Vokabelliste des Schulbuchs (Hello! bis Unit 1, Station 3).
// Beispielsätze sind selbst geschrieben. Alles zählt für den Plan, nur «Hunde-Englisch» ist Bonus.
// Vokabel-Karten: en, de, auchEn (weitere richtige Schreibweisen), satz mit genau einer {Lücke}.
// Ein englisches Wort darf im ganzen Fach nur einmal vorkommen. {hund} und {hund3} wie in inhalte-bio.js.
(function (root) {
  "use strict";
  const F = root.LN_FAECHER || (root.LN_FAECHER = []);
  const slug = (s) => String(s).toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const vok = (p) => (en, de, x) => Object.assign({ typ: "vokabel", id: p + "-" + slug(en), en, de }, x || {});

  const k = vok("kn"), a = vok("u1a"), b = vok("u1b"), c = vok("u1c"), d = vok("u1d");
  const h = vok("w1"), l = vok("w2"), z = vok("w3"), g = vok("w4"), f = vok("w5"), s = vok("w6"), he = vok("he");

  F.push({
    id: "englisch",
    name: "Englisch",
    kurz: "Englisch",
    icon: "🇬🇧",
    sprache: "en",
    arbeit: { titel: "Vokabeltest Englisch", datum: null },
    themen: [
      // ======================================================================
      {
        id: "knifflig",
        name: "Knifflige Wörter",
        icon: "🧩",
        warum: {
          frage: "Warum schreibt man «teacher» und nicht «titscher»?",
          text: "Im Englischen klingt vieles anders, als es geschrieben wird. Darum lohnt es sich, schwierige Wörter genau anzuschauen, laut zu sagen und dann selbst zu schreiben. Zwei Regeln bringen im Test viele Punkte: Englische Nomen schreibt man klein (a happy dog, a bed). Groß schreibt man nur am Satzanfang, bei Namen und bei «I».",
        },
        fakten: [
          "Englische Nomen schreibt man klein: dog, bed, teacher.",
          "«I» (ich) schreibt man im Englischen immer groß.",
          "«Let's» ist kurz für «let us» und heißt «Lass uns …».",
          "«my» heißt «mein», «me» heißt «mich» oder «mir».",
        ],
        karten: [
          k("why", "warum", { tipp: "Es fängt mit «wh» an, wie viele Fragewörter." }),
          k("happy", "glücklich; froh; fröhlich", { satz: "The puppy is very {happy} today." }),
          k("crazy", "verrückt", { satz: "That's a {crazy} idea!" }),
          k("year", "Jahr; Schuljahr; Jahrgangsstufe", { satz: "This is my first {year} at this school.", tipp: "Es klingt wie «jier», fängt aber mit «y» an." }),
          k("teacher", "Lehrer/-in", { satz: "Our {teacher} is very friendly.", tipp: "Der Laut «ie» wird hier «ea» geschrieben, «tsch» wird «ch»." }),
          k("English teacher", "Englischlehrer/-in", { tipp: "Zwei Wörter. «English» schreibt man immer groß, «teacher» klein." }),
          k("bed", "Bett", { satz: "The cat is under the {bed}." }),
          k("twin", "Zwilling; Zwillings-", { satz: "My friend has a {twin} sister." }),
          k("number", "Zahl; Nummer", { satz: "Seven is my lucky {number}.", tipp: "Nur ein «m»." }),
          k("yellow", "gelb", { satz: "The sun is {yellow}.", tipp: "Doppel-l und am Ende «ow»." }),
          k("My favourite …", "Mein/e Lieblings-…", { tipp: "Im britischen Englisch mit «ou»: favourite." }),
          k("Where are you from?", "Woher kommst du?; Woher kommt ihr?; Woher kommen Sie?", { tipp: "«Where» schreibt man mit «wh» und «ere»." }),
          k("Don't worry!", "Keine Sorge!", { auchEn: ["Do not worry!"] }),
          k("Let's …", "Lass(t) uns …", { auchEn: ["Let us …"] }),
          k("to look for", "suchen nach", { satz: "Can you help me {look} for my pen?" }),
          k("over there", "da drüben; dort drüben; nach dort drüben"),
          k("me", "mich; mir"),
          k("to talk to", "reden mit"),
          k("My favourite colour is green.", "Meine Lieblingsfarbe ist grün."),
          k("Don't worry! This is my cat.", "Keine Sorge! Das ist meine Katze.", { auchEn: ["Do not worry! This is my cat."] }),
          k("Let's look for the ball under the table.", "Lass uns den Ball unter dem Tisch suchen.", { auchEn: ["Let us look for the ball under the table."] }),
          k("Look, your pens are over there.", "Schau mal, deine Stifte sind da drüben."),
          {
            typ: "paare", id: "kn-my", titel: "Mein, dein, sein: Ordne zu.",
            paare: [["mein/-e", "my"], ["dein/-e", "your"], ["sein/-e (von ihm)", "his"], ["ihr/-e (von ihr)", "her"], ["unser/-e", "our"], ["ihr/-e (von mehreren)", "their"]],
            merk: "«my dog» heißt «mein Hund». «me» heißt «mich» oder «mir»: Look at me!",
          },
          { typ: "wahr", id: "kn-nomen", satz: "Englische Nomen schreibt man groß, wie im Deutschen.", wahr: false, korrektur: "Englische Nomen schreibt man klein: a dog, a bed, a teacher. Groß nur am Satzanfang, bei Namen und bei «I»." },
          { typ: "wahr", id: "kn-ich", satz: "«I» (ich) schreibt man im Englischen immer groß.", wahr: true },
          { typ: "wahr", id: "kn-lets-regel", satz: "«Let's play!» heißt «Lass uns spielen!».", wahr: true },
          {
            typ: "auftrag", id: "kn-huepfen", art: "bewegen", titel: "Buchstaben-Hüpfen",
            text: "Lass dir ein deutsches Wort sagen, zum Beispiel «Lehrer». Hüpfe bei jedem Buchstaben des englischen Wortes einmal und sag ihn laut: t, e, a, c, h, e, r. So merkt sich dein Körper die Schreibweise.",
          },
        ],
      },
      // ======================================================================
      {
        id: "u1-checkin",
        name: "Unit 1: Check-in",
        icon: "🏫",
        warum: {
          frage: "Wie fühlst du dich am ersten Schultag?",
          text: "Nervous, happy, surprised? Mit diesen Wörtern kannst du auf Englisch sagen, wie es dir geht, und andere fragen, wie es ihnen geht. Ein neues Schuljahr ist überall aufregend, auch an Schulen in London.",
        },
        fakten: [
          "«Mrs» spricht man ungefähr «Missis».",
          "In vielen britischen Schulen tragen alle Kinder eine Schuluniform.",
          "«sad» und «happy» sind Gegenteile, genau wie «boring» und «exciting».",
        ],
        karten: [
          a("to look at", "anschauen; ansehen"), a("us", "uns"), a("Look!", "Schau mal!; Schaut mal!"), a("to look", "schauen; sehen; aussehen"),
          a("nervous", "nervös; aufgeregt"), a("to sit", "sitzen"), a("together", "zusammen; miteinander; gemeinsam"), a("sports ground", "Sportplatz"),
          a("Mrs", "Frau (Anrede)"), a("please", "bitte"), a("to take", "nehmen; mitnehmen; wegnehmen; bringen; mitbringen"), a("home", "nach Hause"),
          a("That's …", "Das ist …", { auchEn: ["That is …"] }), a("in front of", "vor"), a("to think", "denken; nachdenken; glauben; finden; meinen"),
          a("angry", "wütend; zornig; verärgert; böse"), a("surprised", "überrascht"), a("sad", "traurig"), a("uniform", "Uniform"),
          a("boring", "langweilig"), a("ugly", "hässlich"), a("silly", "dumm; doof; albern"), a("no", "nein; kein/-e"), a("today", "heute"),
          a("bedroom", "Schlafzimmer"), a("under", "unter"),
          {
            typ: "auftrag", id: "u1a-gefuehle", art: "bewegen", titel: "Gefühle-Pantomime",
            text: "Zeig mit Gesicht und Körper ein Gefühl: nervous, happy, angry, surprised, sad, bored. Die anderen raten auf Englisch. Dann wird getauscht.",
          },
        ],
      },
      // ======================================================================
      {
        id: "u1-station1",
        name: "Unit 1: Station 1",
        icon: "📚",
        warum: {
          frage: "Wie sieht ein Schultag in England aus?",
          text: "Viele Kinder in Großbritannien tragen eine Schuluniform, treffen sich zur «assembly» und essen mittags in der «cafeteria». Mit diesen Wörtern könntest du dich dort schon zurechtfinden und sagen, was dir gefällt.",
        },
        fakten: [
          "In britischen Schulen heißt die Klassenlehrerin oder der Klassenlehrer «tutor».",
          "«Excuse me», «please» und «thank you» hört man in Großbritannien ständig.",
          "«Mum» und «Dad» schreibt man nur groß, wenn man die Eltern damit anspricht: Hello, Mum!",
        ],
        karten: [
          b("Good morning.", "Guten Morgen."), b("tutor", "Klassenlehrer/-in"), b("not", "nicht"), b("friendly", "freundlich; nett"),
          b("to help", "helfen"), b("question", "Frage"), b("planner", "Handbuch; Kalender"), b("timetable", "Stundenplan; Fahrplan"),
          b("map", "Stadtplan; Landkarte"), b("rule", "Regel"), b("Don't be late for school.", "Komm(t) nicht zu spät zur Schule.", { auchEn: ["Do not be late for school."] }),
          b("lesson", "Unterrichtsstunde; Schulstunde; Unterricht"), b("strict", "streng; strikt"), b("library", "Bibliothek; Bücherei"),
          b("an", "ein/-e (vor Vokalen)"), b("assembly", "Versammlung; Morgenappell"), b("hall", "Halle; Saal"), b("gym(nasium)", "Turnhalle"),
          b("recording studio", "Aufnahmestudio; Tonstudio"), b("to show", "zeigen"), b("tour", "Tour; Fahrt; Rundgang"), b("to have lunch", "zu Mittag essen"),
          b("cafeteria", "Cafeteria"), b("Excuse me …", "Entschuldigung!; Entschuldigen Sie!"), b("art", "Kunst; Kunstunterricht"), b("room", "Zimmer; Raum"),
          b("to say", "sagen; aufsagen; sprechen"), b("there", "da; dort; dahin; dorthin"), b("student", "Schüler/-in; Student/-in"), b("to want (to)", "wollen; mögen"),
          b("drink", "Getränk"), b("classroom", "Klassenzimmer"), b("What's wrong?", "Was ist los?; Was stimmt nicht?", { auchEn: ["What is wrong?"] }),
          b("scary", "unheimlich; gruselig; beängstigend"), b("everything", "alles"), b("mum", "Mama"), b("parents", "Eltern"), b("divorced", "geschieden"),
          b("alone", "allein; ohne fremde Hilfe"), b("easy", "einfach; leicht"), b("after", "nach (zeitlich)"), b("dad", "Papa"), b("to be right", "recht haben"),
          b("family", "Familie"), b("place", "Ort; Stelle; Platz"), b("people", "Leute; Menschen"), b("nice", "schön; nett; lieb"),
        ],
      },
      // ======================================================================
      {
        id: "u1-station2",
        name: "Unit 1: Station 2",
        icon: "🚪",
        warum: {
          frage: "Wie würdest du deine Schule auf Englisch zeigen?",
          text: "Tische, Stühle, eine Leseecke, ein schwarzes Brett: Mit diesen Wörtern kannst du deine eigene Schule und dein Zimmer auf Englisch beschreiben. Mit «There is …» und «There are …» sagst du, was es dort gibt.",
        },
        fakten: [
          "«There is» sagt man bei einem Ding, «there are» bei mehreren: There are two chairs.",
          "«information» hat im Englischen keine Mehrzahl.",
          "Ein «noticeboard» ist das schwarze Brett, an dem Neuigkeiten hängen.",
        ],
        karten: [
          c("there is/are", "da ist/sind; es gibt", { auchEn: ["there is", "there are"] }), c("class", "Klasse; Schulklasse"), c("media centre", "Medienzentrum"),
          c("table", "Tisch"), c("headphones", "Kopfhörer"), c("to use", "benutzen; verwenden; gebrauchen"), c("break", "Pause"), c("power socket", "Steckdose"),
          c("reading corner", "Leseecke"), c("(news)paper", "Zeitung"), c("magazine", "Zeitschrift"), c("to find", "finden; herausfinden"),
          c("man", "Mann", { tipp: "Mehrzahl: men." }), c("behind", "hinter"), c("information desk", "Infotheke"), c("noticeboard", "schwarzes Brett"),
          c("next to", "neben"), c("door", "Tür"), c("wall", "Wand; Mauer"), c("chair", "Stuhl"), c("clock", "Uhr"), c("about", "über; von"),
          c("desk", "Schreibtisch"), c("slide", "Rutschbahn"), c("chill-out area", "Platz zum Chillen; Chill-Ecke"), c("sofa", "Sofa; Couch"),
          c("screen", "Bildschirm"), c("seat", "Sitz; Sitzplatz"), c("outdoor area", "Freiluftbereich"), c("sun lounger", "Sonnenliege"),
          c("robot", "Roboter; Automat"), c("lamp", "Lampe; Leuchte"), c("VR goggles", "VR-Brille"), c("lots (of)", "viel/-e; jede Menge"),
          {
            typ: "auftrag", id: "u1c-zettel", art: "basteln", titel: "Englische Zettel im Zimmer",
            text: "Schreib englische Wörter auf kleine Zettel und kleb sie an die Dinge in deinem Zimmer: bed, chair, door, lamp, desk, wall, clock. Jedes Mal, wenn du vorbeigehst, sagst du das Wort laut.",
          },
          {
            typ: "auftrag", id: "u1c-playmobil", art: "basteln", titel: "Klassenzimmer zum Spielen",
            text: "Bau mit Playmobil, Lego oder Knete ein kleines Klassenzimmer: desks, chairs, a clock, a noticeboard. Erzähl dann auf Englisch, was es gibt: «There is a clock. There are four chairs.»",
          },
        ],
      },
      // ======================================================================
      {
        id: "u1-station3",
        name: "Unit 1: Station 3",
        icon: "🍕",
        warum: {
          frage: "Was isst du am liebsten in der Pause?",
          text: "Chips, tomatoes, ice cream: Beim Essen und in der Pause braucht man viele Wörter. Und wer «Are you allergic to …?» fragen kann, ist ein richtig guter Gastgeber. Übrigens: «Chips» sind auf Englisch Pommes frites!",
        },
        fakten: [
          "«Chips» sind im britischen Englisch Pommes frites. Kartoffelchips heißen «crisps».",
          "«homework» steht immer in der Einzahl: Our homework is easy.",
          "Im Englischen gibt es nur ein Wort für «essen» und «fressen»: eat.",
        ],
        karten: [
          d("to forget", "vergessen"), d("veggie", "vegetarisch"), d("chips", "Pommes frites"), d("yuk", "igitt"), d("allergic to", "allergisch gegen"),
          d("tomato", "Tomate", { tipp: "Mehrzahl: tomatoes." }), d("fresh", "frisch"), d("all", "alle/-s; ganz"), d("to stare", "starren; anstarren"),
          d("rude", "unhöflich; unverschämt"), d("to do", "machen; tun"), d("to bring", "bringen; mitbringen"), d("to buy", "kaufen"),
          d("to eat", "essen; fressen"), d("our", "unser/-e"), d("to talk (about)", "sprechen (über); reden (über)"), d("polite", "höflich"), d("too", "zu (zu viel, zu laut)", { tipp: "Mit zwei «o». Mit einem «o» heißt es «zu, nach» wie in «to school»." }),
          d("classmate", "Klassenkamerad/-in; Mitschüler/-in"), d("homework", "Hausaufgabe(n)"), d("right", "richtig; korrekt"), d("to sleep", "schlafen"),
          d("on the phone", "am Telefon"), d("to ask", "fragen; bitten"), d("to send", "schicken; senden"), d("hair", "Haar; Haare"),
          d("Take a tour of …", "Begib dich/Begebt euch auf eine Tour durch …"), d("reception area", "Empfangsbereich"), d("fast", "schnell"),
          d("to be prepared", "bereit sein"), d("to focus (on)", "sich konzentrieren (auf)"), d("other", "anders; andere/-r/-s; weitere"), d("to give", "geben; schenken"),
          {
            typ: "auftrag", id: "u1d-knete", art: "basteln", titel: "Englisches Essen aus Ofenknete",
            text: "Forme aus Ofenknete Essen für deine Playmobil-Figuren: chips, tomatoes, pizza, ice cream, a sandwich. Mach kleine Schilder mit den englischen Wörtern dazu und eröffne eine Cafeteria.",
          },
        ],
      },
      // ======================================================================
      {
        id: "w-hello", name: "Wiederholung: Hello!", icon: "👋",
        karten: [
          h("Hello.", "Hallo."), h("My name is …", "Ich heiße …"), h("to be", "sein"), h("What's your name?", "Wie heißt du?; Wie heißen Sie?", { auchEn: ["What is your name?"] }),
          h("Hi.", "Hi."), h("I'm …", "Ich bin …", { auchEn: ["I am …"] }), h("I'm from …", "Ich bin aus …", { auchEn: ["I am from …"] }), h("but", "aber"),
          h("I live in …", "Ich wohne in …"), h("to live", "wohnen; leben"), h("How old are you?", "Wie alt bist du?; Wie alt sind Sie?"), h("Me too.", "Ich auch."),
          h("See you!", "Bis dann!; Bis …"), h("to see", "sehen"), h("Bye!", "Tschüss!"), h("new", "neu"), h("friend", "Freund/-in"), h("I can …", "Ich kann …"),
          h("to speak", "sprechen"), h("to understand", "verstehen"), h("to read", "lesen"), h("to write", "schreiben"), h("I don't know …", "Ich kann kein …", { auchEn: ["I do not know …"] }),
          h("I'd like to learn …", "Ich würde gerne … lernen.", { auchEn: ["I would like to learn …"] }), h("I like …", "Mir gefällt …; Ich mag …"), h("word", "Wort"),
          h("sound", "Ton; Geräusch; Klang"), h("of", "von"), h("It sounds …", "Es klingt …"), h("great", "großartig; toll; super"), h("song", "Song; Lied"),
          h("Sing …", "Singe/Singt …"), h("Add …", "Füge/Fügt … hinzu."),
        ],
      },
      {
        id: "w-london", name: "Wiederholung: Welcome to London!", icon: "🎡",
        karten: [
          l("welcome (to)", "willkommen (in)"), l("What can you hear?", "Was kannst du hören?; Was könnt ihr hören?"), l("to hear", "hören"), l("the", "der; die; das"),
          l("a", "ein/-e"), l("boat", "Boot"), l("flower", "Blume"), l("girl", "Mädchen"), l("on", "auf; an; am; in; im"), l("skates", "Inlineskates; Rollschuhe; Schlittschuhe"),
          l("boy", "Junge"), l("mother", "Mutter"), l("father", "Vater"), l("dog", "Hund"), l("cat", "Katze"), l("bird", "Vogel"), l("butterfly", "Schmetterling"),
          l("bee", "Biene"), l("tree", "Baum"), l("grass", "Gras"), l("bike", "Fahrrad"), l("to have a picnic", "ein Picknick machen"), l("book", "Buch"),
          l("to play", "spielen"), l("to ride", "fahren; reiten"), l("parrot", "Papagei"), l("pigeon", "Taube"), l("clouds", "Wolken"), l("river", "Fluss"),
          l("sky", "Himmel"), l("merry-go-round", "Karussell"), l("jeans", "Jeans"), l("T-shirt", "T-Shirt"), l("trousers", "Hose"), l("shorts", "Shorts; kurze Hose"),
          l("helmet", "Helm"), l("trainers", "Turnschuhe"), l("football", "Fußball"), l("skateboard", "Skateboard"), l("food truck", "Imbisswagen"),
          l("plane", "Flugzeug"), l("ship", "Schiff"), l("baby", "Baby"), l("woman", "Frau"), l("to have a snack", "eine Kleinigkeit essen"),
          l("to meet friends", "Freunde treffen"), l("to sit on a bench", "auf einer Bank sitzen"),
        ],
      },
      {
        id: "w-zahlen", name: "Wiederholung: Numbers and colours", icon: "🎨",
        karten: [
          z("zero", "null"), z("one", "eins"), z("two", "zwei"), z("three", "drei"), z("four", "vier"), z("five", "fünf"), z("six", "sechs"),
          z("seven", "sieben"), z("eight", "acht"), z("nine", "neun"), z("ten", "zehn"), z("eleven", "elf"), z("twelve", "zwölf"),
          z("colour", "Farbe"), z("black", "schwarz"), z("blue", "blau"), z("brown", "braun"), z("green", "grün"), z("grey", "grau"),
          z("orange", "orange"), z("pink", "pink; rosa"), z("purple", "lila"), z("red", "rot"), z("white", "weiß"),
        ],
      },
      {
        id: "w-greenwich", name: "Wiederholung: The friends in Greenwich", icon: "👫",
        karten: [
          g("to like", "mögen; gern haben"), g("to take photos", "Fotos machen"), g("big", "groß"), g("sister", "Schwester"), g("best", "beste/-r/-s"),
          g("and", "und"), g("we're", "wir sind", { auchEn: ["we are"] }), g("to have", "haben"), g("funny", "lustig; witzig"), g("food", "Essen; Lebensmittel"),
          g("to cook", "kochen"), g("netball", "Korbball"), g("he's", "er ist", { auchEn: ["he is"] }), g("good", "gut"), g("brother", "Bruder"),
          g("Who is it?", "Wer ist es?"), g("or", "oder"), g("hobby", "Hobby", { tipp: "Mehrzahl: hobbies." }), g("You too?", "Du auch?; Ihr auch?; Sie auch?"),
          g("to watch", "beobachten; (sich) ansehen; zuschauen"), g("you're", "du bist; Sie sind", { auchEn: ["you are"] }), g("My turn.", "Ich bin dran."),
          g("to draw", "zeichnen"), g("picture", "Bild; Foto"), g("pet", "Haustier"), g("game", "Spiel"), g("to sing", "singen"), g("horse", "Pferd"),
          g("to dance", "tanzen"), g("can't", "kann nicht; können nicht", { auchEn: ["cannot"] }),
          {
            typ: "paare", id: "w4-pronomen", titel: "Ich, du, er: Ordne zu.",
            paare: [["ich", "I"], ["du", "you"], ["er", "he"], ["sie (eine Person)", "she"], ["es", "it"], ["wir", "we"], ["sie (mehrere)", "they"]],
          },
        ],
      },
      {
        id: "w-freizeit", name: "Wiederholung: Free time", icon: "🎸",
        karten: [
          f("basketball", "Basketball"), f("tennis", "Tennis"), f("skiing", "Skifahren"), f("windsurfing", "Windsurfen"), f("cinema", "Kino"),
          f("picnic", "Picknick"), f("video", "Video"), f("music", "Musik"), f("guitar", "Gitarre"), f("piano", "Klavier; Piano"),
          f("at", "in; auf; bei; an"), f("house", "Haus"), f("bored", "gelangweilt"), f("to go (to)", "gehen (zu/nach); fahren (zu/nach)"),
          f("to", "zu; nach; auf; in"), f("How are you?", "Wie geht es dir?; Wie geht es euch?; Wie geht es Ihnen?"), f("fine", "gut; in Ordnung; schön"),
          f("Thanks.", "Danke."), f("this", "dies; diese/-r/-s"), f("here", "hier"), f("tomorrow", "morgen"), f("the first day of school", "der erste Schultag"),
          f("yes", "ja"), f("Come on!", "Komm schon!; Kommt schon!; Komm jetzt!"), f("to come", "kommen"), f("It's time for …", "Es ist Zeit für …", { auchEn: ["It is time for …"] }),
          f("ice cream", "Eis; Eiscreme"),
        ],
      },
      {
        id: "w-schulsachen", name: "Wiederholung: School things", icon: "✏️",
        karten: [
          s("thing", "Ding; Sache"), s("exercise book", "Übungsheft; Heft"), s("marker", "Leuchtstift"), s("pen", "Füller; Kugelschreiber"),
          s("pencil", "Bleistift; Buntstift"), s("pencil case", "Federmäppchen; Mäppchen"), s("rubber", "Radiergummi"), s("ruler", "Lineal"),
          s("schoolbag", "Schultasche"), s("crayon", "Buntstift"), s("glue", "Klebestift"), s("scissors", "Schere"), s("sharpener", "Spitzer"),
        ],
      },
      // ======================================================================
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
          he("puppy", "der Welpe", { satz: "The little {puppy} is only twelve weeks old." }),
          he("bone", "der Knochen", { satz: "The dog is chewing a {bone}.", warum: "Das Wort kennst du schon aus Bio: Knochen!" }),
          he("paw", "die Pfote", { satz: "Give me your {paw}, please!" }),
          he("tail", "der Schwanz", { satz: "The dog wags its {tail}." }),
          he("ear", "das Ohr", { satz: "A Labrador has soft {ears}." }),
          he("nose", "die Nase", { satz: "Dogs have a very good {nose}." }),
          Object.assign(he("leash", "die Leine", { auchEn: ["lead"], satz: "Put the dog on the {leash}, please.", tipp: "In deinem Buch steht «leash». Im britischen Alltag sagt man auch «lead». Beides zählt." }), { id: "he-lead" }),
          he("collar", "das Halsband", { satz: "The dog has a red {collar}." }),
          he("bowl", "der Napf", { satz: "There is water in the {bowl}." }),
          he("treat", "das Leckerli", { satz: "Sit! Good girl! Here is a {treat}." }),
          he("ball", "der Ball", { satz: "Can you throw the {ball}?" }),
          he("to bark", "bellen", { satz: "The dog {barks} at the cat." }),
          he("to run", "rennen", { satz: "Dogs can {run} very fast." }),
          he("to fetch", "holen, apportieren", { satz: "Can you {fetch} the stick?" }),
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
            text: "Lauf durchs Haus und tippe auf alles, was zum Hund gehört. Sag dabei laut das englische Wort: bowl, leash, collar, ball, bone. Wie viele schaffst du in einer Minute?",
          },
        ],
      },
    ],
  });
})(typeof window !== "undefined" ? window : globalThis);
