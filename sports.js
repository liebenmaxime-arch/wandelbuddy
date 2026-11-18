// Wandelbuddy · lijst "Andere sport"
// Elke sport heeft een categorie. Die bepaalt het icoontje en hoeveel stappen we ongeveer schatten.
// De vaste knoppen (Wandelen, Lopen, Padel, Fietsen, Yoga) staan hier niet in.

const svg = (inner) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

// eigen tekeningen (geen afbeeldingen van het internet)
export const CAT_ICONS = {
  bal: svg('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c3 2.6 3 14.4 0 17M12 3.5c-3 2.6-3 14.4 0 17"/>'),
  racket: svg('<circle cx="10" cy="10" r="6"/><path d="M14.3 14.3L20 20M6.5 8.5h7M6.5 11.5h7M8.5 5.5v9M11.5 5.5v9"/>'),
  water: svg('<path d="M3 8.5c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 13.5c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 18.5c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>'),
  winter: svg('<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5"/>'),
  vecht: svg('<path d="M7 11V7.5A4.5 4.5 0 0 1 11.5 3h1A4.5 4.5 0 0 1 17 7.5V13a5 5 0 0 1-5 5H9a2 2 0 0 1-2-2zM7 11H5.5a1.5 1.5 0 0 0 0 3H7M9.5 18v3h5v-3"/>'),
  fitness: svg('<path d="M6 7.5v9M3.5 10v4M18 7.5v9M20.5 10v4M6 12h12"/>'),
  dans: svg('<circle cx="7" cy="17.5" r="2.5"/><circle cx="17" cy="15.5" r="2.5"/><path d="M9.5 17.5V6.5l10-2v11"/>'),
  wiel: svg('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="1.6"/><path d="M12 3.5v6.9M12 13.6v6.9M3.5 12h6.9M13.6 12h6.9"/>'),
  loop: svg('<circle cx="15" cy="4" r="2"/><path d="M5 21l4-5 3 2 2-6M8 10l3-3h4l2 4 3 1M14 12l-2 6"/>'),
  klim: svg('<path d="M2.5 20.5L9.5 8l4 6.5 2.5-4 5.5 10z"/><path d="M7.6 11.5l1.9 1.6 1.8-1.4"/>'),
  doel: svg('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>'),
  paard: svg('<path d="M7 20.5V12a5 5 0 0 1 10 0v8.5M4.5 20.5H9M15 20.5h4.5M9.5 14h.01M14.5 14h.01M9.5 17.5h.01M14.5 17.5h.01"/>'),
  balans: svg('<circle cx="12" cy="4.5" r="2"/><path d="M4 9l8 2 8-2M12 11v4M12 15l-4 6M12 15l4 6"/>'),
  ster: svg('<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>'),
};

// geschatte stappen per minuut (0 = telt in beweegminuten)
export const CAT_SPM = { bal: 90, racket: 80, water: 0, winter: 0, vecht: 40, fitness: 30, dans: 90, wiel: 0, loop: 150, klim: 20, doel: 30, paard: 0, balans: 0, ster: 0 };

const L = (cat, names) => names.split('|').map((n) => [n, cat]);
export const SPORTS = [
  ...L('bal', 'Voetbal|Zaalvoetbal|Minivoetbal|Walking football|Basketbal|3x3 basketbal|Volleybal|Beachvolleybal|Handbal|Beachhandbal|Korfbal|Rugby|Touch rugby|American football|Flag football|Australian football|Gaelic football|Hockey|Zaalhockey|Floorball|Honkbal|Softbal|Cricket|Lacrosse|Netbal|Kinball|Tchoukbal|Voetvolley|Sepak takraw|Hurling|Trefbal|Ultimate frisbee|Kickbal|Rolstoelbasketbal|Kaatsen|Padbol|Bossaball|Teqball|Spikeball|Rolstoelrugby|Goalbal|Zitvolleybal'),
  ...L('racket', 'Tennis|Badminton|Squash|Tafeltennis|Pickleball|Beachtennis|Racquetball|Speedminton|Platformtennis|Jeu de paume|Rolstoeltennis'),
  ...L('water', 'Zwemmen|Openwaterzwemmen|Duiken|Snorkelen|Roeien|Kajakken|Kanoën|Suppen|Surfen|Kitesurfen|Windsurfen|Zeilen|Waterskiën|Wakeboarden|Raften|Artistiek zwemmen|Schoonspringen|Aquajogging|Aquagym|Bodyboarden|Drakenbootvaren|Vrijduiken|Waterpolo|Onderwaterhockey|Kanopolo|Wildwaterkajakken|Hydrofoilen'),
  ...L('winter', 'Skiën|Langlaufen|Snowboarden|Schaatsen|Kunstschaatsen|Shorttrack|IJshockey|Curling|Sleeën|Biatlon|Skispringen|Toerskiën|Sneeuwschoenwandelen|Bobsleeën|Freestyleskiën'),
  ...L('vecht', 'Judo|Karate|Taekwondo|Boksen|Kickboksen|Thaiboksen|Jiujitsu|Braziliaans jiujitsu|Aikido|Kendo|Schermen|Worstelen|Krav maga|Capoeira|Kungfu|Wushu|Sumo|MMA|Zelfverdediging|Savate|Hapkido|Sambo|Muay thai|Kali|Wing chun'),
  ...L('fitness', 'Fitness|Crossfit|Bootcamp|Pilates|Spinning|Aerobics|Step-aerobics|Gewichtheffen|Powerlifting|Kettlebelltraining|HIIT|Circuittraining|Bodypump|Calisthenics|Functionele training|Indoor roeien|Touwtjespringen|TRX|Krachttraining|Core training|Bodyweight training|Tabata|Boxing fitness|Hyrox|Strongman'),
  ...L('dans', 'Dansen|Salsa|Bachata|Zumba|Ballet|Hiphop|Tango|Line dance|Stijldansen|Moderne dans|Jazzdans|Breakdance|Lindyhop|Volksdansen|Paaldansen|Tapdansen|Flamenco|Kizomba|Bollywooddans|Showdans|Streetdance|Afrodans|Merengue|Cha-cha-cha|Wals'),
  ...L('wiel', 'Wielrennen|Mountainbiken|BMX|Gravelfietsen|Veldrijden|Baanwielrennen|Skateboarden|Inline skaten|Rolschaatsen|Steppen|Longboarden|Handbiken|Tandemfietsen|Karting|Motorcross|Unicycling|Fietscross'),
  ...L('loop', 'Trailrunning|Atletiek|Sprinten|Hordelopen|Hoogspringen|Verspringen|Polsstokhoogspringen|Hink-stap-springen|Speerwerpen|Kogelstoten|Discuswerpen|Kogelslingeren|Marathon|Halve marathon|Oriëntatielopen|Nordic walking|Hiken|Trektocht|Snelwandelen|Bergwandelen|Hindernisloop|Triatlon|Duatlon|Crosslopen|Trappenlopen|Ultralopen|Joggen'),
  ...L('klim', 'Klimmen|Boulderen|Bergbeklimmen|Abseilen|Parkour|Via ferrata|Speleologie|Freerunning|Touwklimmen|Paragliden|Canyoning'),
  ...L('doel', 'Golf|Minigolf|Discgolf|Darts|Boogschieten|Bowling|Petanque|Biljart|Snooker|Kegelen|Krulbollen|Sportschieten|Footgolf|Croquet|Beugelen|Klootschieten|Kubb|Cornhole|Shuffleboard|Mölkky|Curve bowling|Jeu de boules'),
  ...L('paard', 'Paardrijden|Dressuur|Jumping|Eventing|Polo|Ponyrijden|Mennen|Voltige|Westernrijden|Endurance rijden'),
  ...L('balans', 'Tai chi|Qigong|Stretching|Turnen|Acrobatiek|Trampolinespringen|Slacklinen|Circusacrobatiek|Mobility training|Barre|Yin yoga|Acroyoga|Aerial yoga|Ritmische gymnastiek|Meditatief bewegen'),
].sort((a, b) => a[0].localeCompare(b[0], 'nl'));
