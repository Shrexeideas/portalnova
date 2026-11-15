import {
  AudioRecording,
  DeductionNode,
  EndingDefinition,
  EvidenceItem,
  LocationId,
  LoreDiscrepancy,
} from '../types/game';

export const CASE_METADATA = {
  title: "DON'T LOOK AT THE DUCK",
  caseNumber: 'CASE FILE #89-DUCK',
  classification: 'CLASSIFIED / EYES ONLY',
  archiveRef: 'BRF-1994-1996-VANCE',
  parkName: "Miller's Creek / Oak Park Municipal Playground",
  borough: 'Willow Creek Borough',
  coordinates: "42°19'N 71°04'W",
  nodeId: 'OAK-PARK-FEED-07',
  terminalAuth: 'AGENT-ARCHIVIST #412',
  buildVersion: 'BUILD v2.0.4-CHRONOLOGY',
  totalCluesInPhase2: 8,
  gazeThresholdSeconds: 1.45,
  investigationDurationSeconds: 480,
} as const;

export const TIMELINE_EVENTS = [
  {
    year: 1994,
    code: 'PHASE I // DISAPPEARANCE',
    heading: "1994 — Jimmy Mercer's Disappearance",
    detail:
      'Five-year-old Jimmy Mercer vanished near Miller’s Creek Playground in November 1994. His broken yellow duck toy was recovered by the swings, no body was found, and two witnesses reported hearing a child laughing near the north treeline after dusk.',
  },
  {
    year: 1996,
    code: 'PHASE II // REOPENED CASE',
    heading: "1996 — Julian Vance's Investigation",
    detail:
      'Investigator Julian Vance reopened the cold file in 1996 after flagging timeline inconsistencies. Surveying the playground, maintenance shed, caretaker’s house, and drainage tunnels, he left five audio cassettes before vanishing—his final tape warning of something in the forest imitating a child’s voice.',
  },
  {
    year: 2026,
    code: 'PHASE III // ANONYMOUS PACKAGE',
    heading: '2026 — Your Night Arrival',
    detail:
      'Thirty years later, an unmarked parcel arrives at your door: a weathered 1994 photograph of Jimmy and a micro-cassette labeled with Julian’s handwriting. Tonight at 03:17 AM, you enter the abandoned grounds to finish what Julian recorded.',
  },
] as const;

export const UNIFIED_SUBJECTS = {
  child: {
    name: 'Jimmy Mercer',
    age: 5,
    missingDate: 'Nov 12, 1994',
    lastSeenLocation: "near Miller's Creek / Oak Park Municipal Playground",
    exhibitCode: 'EXHIBIT-00 (Broken Yellow Duck)',
  },
  investigator: {
    name: 'Julian Vance',
    role: 'Independent Cold-Case Investigator',
    disappearedDate: 'Nov 14, 1996 — 03:42 HRS',
    disappearedLocation: 'Willow Creek Playground / North Forest Boundary',
  },
  playerArrival: {
    year: 2026,
    trigger: 'Anonymous parcel containing 1994 photograph & 1996 micro-cassette',
  },
} as const;

export const LORE_DISCREPANCIES: LoreDiscrepancy[] = [
  {
    id: 'disc-timeline-unification',
    sourceFile: 'Story Update Timeline vs Earlier Prototype Drafts',
    conflict:
      'Earlier prototype drafts listed the missing boy as Tommy Mercer and compressed both disappearances into Nov 1994.',
    unifiedResolution:
      'Unified to canonical 3-tier chronology: Jimmy Mercer (age 5, vanished Nov 1994) -> Julian Vance (reopened case & disappeared Nov 1996) -> Player (arrives 2026 via anonymous package).',
  },
  {
    id: 'disc-park-naming',
    sourceFile: 'Stitch Exports (code_41d1a003 / code_78340122 / code_7e33d526)',
    conflict:
      'Stitch templates refer variously to St. Jude Memorial Park, Oak Park [SEC-07], and Miller’s Creek Municipal Playground.',
    unifiedResolution:
      'Unified operational site around Miller’s Creek / Oak Park Playground in Willow Creek Borough while preserving Stitch archival frame aesthetics.',
  },
];

export const LOCATION_CATALOG: Record<
  LocationId,
  { name: string; subtitle: string; unlockHint: string }
> = {
  playground: {
    name: '01 // Central Playground',
    subtitle: 'Swings, Slide, Seesaw & Carousel Grounds',
    unlockHint: 'Open upon arrival (2026 Entry Gate)',
  },
  'maintenance-shed': {
    name: '02 // Maintenance Shed',
    subtitle: 'NE Perimeter Utility Structure',
    unlockHint: 'Inspect at least 1 playground clue to force the rusted latch.',
  },
  'caretakers-house': {
    name: "03 // Caretaker's House",
    subtitle: 'West Fence Cottage & Front Porch',
    unlockHint: 'Investigate the Maintenance Shed surveillance photo or cassette.',
  },
  'drainage-tunnels': {
    name: '04 // Drainage Tunnels',
    subtitle: 'NE Concrete Storm Culvert & Sump',
    unlockHint: "Recover Caretaker's 1994/1996 Incident Log or Jimmy's photo.",
  },
  forest: {
    name: '05 // Final Forest',
    subtitle: 'Locked North Perimeter Woods',
    unlockHint:
      'Discover & examine all 8 mandatory clues, uncover all 4 hidden audio clues, and solve the Final Deduction.',
  },
};

export const INITIAL_EVIDENCE_ITEMS: EvidenceItem[] = [
  {
    id: 'ev-jimmy-poster',
    code: 'DOC #1994-01',
    title: '1994 Missing Poster: Jimmy Mercer',
    sector: 'South Walkway Notice Board',
    locationId: 'playground',
    year: 1994,
    category: 'document',
    mandatoryForForest: true,
    summary:
      'Rain-stained November 1994 flyer for five-year-old Jimmy Mercer. The facial photograph was scraped out with jagged strokes.',
    forensicNote:
      'Original mimeograph ink matches 1994 Willow Creek police bulletins. Two separate witnesses annotated the back: "Heard a boy laughing beyond the fence long after midnight."',
    ambiguityNote:
      'Whether the flyer was defaced by vandals in 1994 or by Julian Vance in 1996 remains unverified.',
    quote: '“MISSING — Jimmy Mercer, Age 5. Last seen holding a yellow toy duck.”',
    discovered: false,
  },
  {
    id: 'ev-broken-duck',
    code: 'ITEM #1994-02',
    title: 'Broken Yellow Duck Toy',
    sector: 'Playground Mulch near Swings',
    locationId: 'playground',
    year: 1994,
    category: 'physical',
    mandatoryForForest: true,
    summary:
      'Cracked 1994 hollow yellow rubber duck half-buried beside the swing pad. Left behind the night Jimmy vanished.',
    forensicNote:
      'Polymer matches Jimmy’s mother’s 1994 description. The beak seam has been split outward from internal pressure rather than stepped on.',
    ambiguityNote:
      'A larger fiberglass duck stands motionless on the nearby carousel—no park inventory lists it prior to 1995.',
    discovered: false,
  },
  {
    id: 'clue-01-beak-shard',
    code: 'ITEM #1996-03',
    title: 'Swing #2 Hidden Marking & Polymer Shard',
    sector: 'A-Frame Swing Set',
    locationId: 'playground',
    year: 1996,
    category: 'physical',
    mandatoryForForest: true,
    summary:
      'Yellow polymer shard wedged into Swing #2 chains above deep vertical gouges etched into the rusted crossbar.',
    forensicNote:
      'Five short tally marks scratched into the paint match Julian Vance’s 1996 field notes. Swing #2 oscillates even during dead calm.',
    ambiguityNote:
      'The gouges sit 1.9 meters above ground—far too high for a five-year-old.',
    quote: '“The swings move before the wind arrives. Keep your lamp low.”',
    discovered: false,
  },
  {
    id: 'ev-julian-tape-01',
    code: 'TAPE #1996-01',
    title: "Julian's Field Cassettes (Reels 01 & 02)",
    sector: 'Maintenance Shed Workbench',
    locationId: 'maintenance-shed',
    year: 1996,
    category: 'tape',
    mandatoryForForest: true,
    linkedAudioId: 'rec-01-initial',
    summary:
      'Two 1996 micro-cassettes sealed inside a rusted metal tin on the Maintenance Shed bench, paired with Julian Vance’s case tag.',
    forensicNote:
      'Recording 01 documents Julian’s arrival in Nov 1996; Recording 02 captures an eerie child-like laugh echoing twice from the playground fence.',
    ambiguityNote:
      'Playback in the Evidence Notebook is required to isolate the double-echo anomaly.',
    quote: '“Reopening File 89. The 1994 reports left out the night watchman’s second statement.”',
    discovered: false,
  },
  {
    id: 'ev-surveillance-photo',
    code: 'PHOTO #1996-02',
    title: '1994 / 1996 Treeline Surveillance Photo',
    sector: 'Maintenance Shed Pinboard',
    locationId: 'maintenance-shed',
    year: 1996,
    category: 'photo',
    mandatoryForForest: true,
    summary:
      'Grainy flash photograph pinned inside the shed. Shows a small coat-clad silhouette standing beside the north fence beneath an empty sky.',
    forensicNote:
      'Film stock is Kodak Tri-X 400 (1994–1996). Handwritten margin in Julian’s ink: "Exposed 19 days AFTER Jimmy vanished. Gate was padlocked from outside."',
    ambiguityNote:
      'The figure’s shadow extends toward the camera while a rounded duck-shaped outline sits in the foreground.',
    discovered: false,
  },
  {
    id: 'ev-jimmy-photo',
    code: 'PHOTO #1994-03',
    title: "Jimmy's Original 1994 Portrait",
    sector: "Caretaker's House Porch Desk",
    locationId: 'caretakers-house',
    year: 1994,
    category: 'photo',
    mandatoryForForest: true,
    summary:
      'An intact 1994 family snapshot tucked inside a ledger drawer: Jimmy Mercer smiling beside an unblemished yellow rubber duck.',
    forensicNote:
      'Matches the duplicate photo slipped into your anonymous 2026 package. The background reveals the Caretaker’s House window was boarded only after 1996.',
    ambiguityNote:
      'Someone circled the Caretaker’s treeline in faded red grease pencil.',
    discovered: false,
  },
  {
    id: 'ev-caretaker-log',
    code: 'LOG #1996-04',
    title: "Caretaker's Incident Log & Tape 03",
    sector: "Caretaker's House Table",
    locationId: 'caretakers-house',
    year: 1996,
    category: 'document',
    mandatoryForForest: true,
    linkedAudioId: 'rec-03-caretaker',
    summary:
      'Handwritten 1994–1996 logbook kept by the municipal groundsman alongside Julian’s third cassette recording.',
    forensicNote:
      'Entry dated Nov 13, 1994 contradicts police timelines: "Boy never said a word after sundown, not once. Yet something out by the culvert kept giggling till 4 AM."',
    ambiguityNote:
      'The final torn page mentions a spare culvert key dropped by the northeast drainage grate.',
    quote: '“Jimmy stopped speaking in 1994. Whatever answered from the woods wasn’t him.”',
    discovered: false,
  },
  {
    id: 'ev-julian-tape-05',
    code: 'TAPE #1996-05',
    title: "Julian's Final Recordings (Reels 04 & 05)",
    sector: 'Drainage Tunnels Culvert Sump',
    locationId: 'drainage-tunnels',
    year: 1996,
    category: 'tape',
    mandatoryForForest: true,
    linkedAudioId: 'rec-05-forest',
    summary:
      'Caked in culvert silt beside a dead lantern: Julian Vance’s final two 1996 tapes recorded inside the drain and at the locked Forest Gate.',
    forensicNote:
      'Captures wet webbed footsteps echoing inside the concrete pipe followed by Julian whispering: "It mimics a child’s voice to draw you past the north gate."',
    ambiguityNote:
      'No struggle appears on tape—only a calm click as Julian turned toward the woods.',
    discovered: false,
  },
  // Supporting optional clues (preserve Phase 2/3 items cleanly)
  {
    id: 'clue-02-cassette-04b',
    code: 'TAPE #1996-02B',
    title: 'Slide Chute Field Cassette (Copy B)',
    sector: 'North Slide Base',
    locationId: 'playground',
    year: 1996,
    category: 'tape',
    mandatoryForForest: false,
    linkedAudioId: 'rec-02-playground',
    summary:
      'Water-damaged micro-cassette left beneath the metal slide chute, syncing directly with Julian’s second playground survey.',
    forensicNote:
      'Sub-audible 14.2 Hz resonance precedes an unnaturally identical child laugh repeating twice.',
    ambiguityNote: 'Both laughs share identical waveform peaks down to the millisecond.',
    discovered: false,
  },
  {
    id: 'clue-03-webbed-prints',
    code: 'CAST #1996-06',
    title: '14-Inch Webbed Culvert Impressions',
    sector: 'Center Puddle & Drain Mouth',
    locationId: 'playground',
    year: 1996,
    category: 'physical',
    mandatoryForForest: false,
    summary:
      'Three-toed 14-inch impressions pressed deep into saturated clay, angling from the carousel toward the northeast culvert.',
    forensicNote:
      'Stride distance increases smoothly without slipping, ending at the concrete drainage grate.',
    ambiguityNote: 'Weight estimate exceeds 190 lbs—yet the tracks leave no return path.',
    discovered: false,
  },
  {
    id: 'clue-04-crayon-sketch',
    code: 'EXHIBIT #1994-07',
    title: "Jimmy's 1994 Crayon Drawing",
    sector: 'Seesaw Fulcrum',
    locationId: 'playground',
    year: 1994,
    category: 'document',
    mandatoryForForest: false,
    summary:
      'Jagged charcoal-and-crayon drawing labeled "HE IS WATCHING", dated two days before Jimmy disappeared in Nov 1994.',
    forensicNote:
      'Depicts the A-frame swing set beside a looming duck silhouette watching from the trees.',
    ambiguityNote:
      'Back margin shows a child’s handwriting: "Don’t look when it talks."',
    discovered: false,
  },
  {
    id: 'clue-05-yellow-whistle',
    code: 'TOKEN #1994-08',
    title: 'Silt-Stained Duck Whistle',
    sector: 'Carousel Perimeter',
    locationId: 'playground',
    year: 1994,
    category: 'physical',
    mandatoryForForest: false,
    summary:
      'Child’s yellow plastic duck whistle resting two paces from the carousel turntable.',
    forensicNote:
      'Cataloged originally in Jimmy Mercer’s 1994 personal effects before disappearing from precinct storage in 1996.',
    ambiguityNote: 'Plastic surface remains dry despite tonight’s rain.',
    discovered: false,
  },
  {
    id: 'ev-forest-ribbon',
    code: 'REMNANT #1994-09',
    title: 'Suspended 1994 Caution Ribbon & Toy Tag',
    sector: 'Final Forest Trail',
    locationId: 'forest',
    year: 1994,
    category: 'physical',
    mandatoryForForest: false,
    summary:
      'Faded 1994 police perimeter ribbon knotted around a low pine branch alongside a stitched yellow fabric tag.',
    forensicNote:
      'Marks the exact boundary where search dogs refused to advance in November 1994.',
    ambiguityNote: 'Fresh footprints circle the trunk but stop at the clearing edge.',
    discovered: false,
  },
  {
    id: 'ev-julian-compass',
    code: 'GEAR #1996-10',
    title: "Julian's Dropped Flashlight & Pocket Note",
    sector: 'Final Forest Clearing',
    locationId: 'forest',
    year: 1996,
    category: 'document',
    mandatoryForForest: false,
    summary:
      'Cracked 1996 Maglite and folded index card lying face-up before the north clearing.',
    forensicNote:
      'Last line written in shaky ink: "If it uses Jimmy’s voice, remember he stopped speaking after the first night. Do not trust what answers."',
    ambiguityNote: 'Batteries leaked decades ago, yet the switch is still clicked ON.',
    discovered: false,
  },
];

export const AUDIO_RECORDINGS: AudioRecording[] = [
  {
    id: 'rec-01-initial',
    code: 'TAPE 01',
    title: '01 — Initial Investigation',
    recordedYear: 1996,
    recordedTimestamp: '11-NOV-1996 · 23:54',
    locationLabel: 'Oak Park Entrance & Shed',
    requiredEvidenceId: 'ev-julian-tape-01',
    durationSec: 22,
    hiddenClueTimestampSec: 12,
    hiddenClueId: 'audio-clue-01-contradiction',
    hiddenClueTitle: 'Missing 1994 Witness Suppression',
    hiddenClueNote:
      'Julian notes the 1994 precinct file omitted two witness statements describing laughter from the woods.',
    reinterpretationRequiresEvidenceId: 'ev-surveillance-photo',
    reinterpretationNote:
      'With the 1994/1996 Surveillance Photo recovered, Julian’s "closed perimeter" was actually breached weeks after Jimmy vanished.',
    transcript: [
      {
        atSec: 0,
        speaker: 'JULIAN VANCE',
        text: 'Recording 01. November 11, 1996. Reopening Mercer cold file—two years to the week.',
      },
      {
        atSec: 6,
        speaker: 'JULIAN VANCE',
        text: 'Original 1994 file claims Jimmy wandered off alone. Broken yellow duck logged near the swings, no body recovered.',
      },
      {
        atSec: 12,
        speaker: 'JULIAN VANCE [LOW]',
        text: 'Wait—three witnesses in the supplemental drawer swore they heard a five-year-old laughing by the forest fence at 3 AM. Chief buried the page.',
        isHiddenClue: true,
      },
      {
        atSec: 18,
        speaker: 'STATIC / TAPE HISS',
        text: '[Rusted shed latch clicks outside; 14.2 Hz hum rises briefly]',
      },
    ],
  },
  {
    id: 'rec-02-playground',
    code: 'TAPE 02',
    title: '02 — The Playground',
    recordedYear: 1996,
    recordedTimestamp: '12-NOV-1996 · 02:18',
    locationLabel: 'Swings & Carousel Perimeter',
    requiredEvidenceId: 'ev-julian-tape-01',
    durationSec: 24,
    hiddenClueTimestampSec: 14,
    hiddenClueId: 'audio-clue-02-double-laugh',
    hiddenClueTitle: 'Identical Synthetic Child Laugh',
    hiddenClueNote:
      'At 00:14, two consecutive child laughs share identical pitch and cadence—like a tape loop rather than a living voice.',
    reinterpretationRequiresEvidenceId: 'clue-01-beak-shard',
    reinterpretationNote:
      'Cross-referenced with Swing #2’s polymer shard, the swing moved at the exact instant the laugh played from the carousel.',
    transcript: [
      {
        atSec: 0,
        speaker: 'JULIAN VANCE',
        text: 'Recording 02. Swings are moving without wind. The carousel duck isn’t on the 1992 city blueprint.',
      },
      {
        atSec: 7,
        speaker: 'JULIAN VANCE',
        text: 'Every time I sweep my beam away from the carousel, the yellow beak points slightly closer to my shoulder.',
      },
      {
        atSec: 14,
        speaker: 'BACKGROUND [TREELINE]',
        text: '[Distant child laugh echoes once... then repeats identically, note for note, 0.8 seconds later]',
        isHiddenClue: true,
      },
      {
        atSec: 19,
        speaker: 'JULIAN VANCE',
        text: 'That didn’t echo off the metal slide. Something out there is replaying a voice.',
      },
    ],
  },
  {
    id: 'rec-03-caretaker',
    code: 'TAPE 03',
    title: '03 — The Caretaker',
    recordedYear: 1996,
    recordedTimestamp: '13-NOV-1996 · 01:40',
    locationLabel: "Caretaker's House Porch",
    requiredEvidenceId: 'ev-caretaker-log',
    durationSec: 24,
    hiddenClueTimestampSec: 13,
    hiddenClueId: 'audio-clue-03-silent-boy',
    hiddenClueTitle: 'Jimmy Stopped Speaking in 1994',
    hiddenClueNote:
      'Both the caretaker and Jimmy’s mother stated Jimmy went completely mute after seeing something at the drain in 1994.',
    reinterpretationRequiresEvidenceId: 'ev-jimmy-photo',
    reinterpretationNote:
      'If Jimmy never spoke after that first week in 1994, any voice calling from the woods in 1996—or tonight—cannot simply be a lost child.',
    transcript: [
      {
        atSec: 0,
        speaker: 'JULIAN VANCE',
        text: 'Recording 03. Found the caretaker’s 1994 ledger inside the west cottage.',
      },
      {
        atSec: 6,
        speaker: 'JULIAN VANCE',
        text: 'Dates don’t line up. Neighbors reported a boy playing near the swings three days after police sealed the park.',
      },
      {
        atSec: 13,
        speaker: 'JULIAN VANCE',
        text: 'Caretaker wrote: "Jimmy stopped talking altogether after Monday. Never made a sound. So what was giggling in the drain?"',
        isHiddenClue: true,
      },
      {
        atSec: 19,
        speaker: 'WINDOW TAP',
        text: '[Wet rubber squeak against glass behind Julian; recorder clicks off]',
      },
    ],
  },
  {
    id: 'rec-04-tunnels',
    code: 'TAPE 04',
    title: '04 — The Tunnels',
    recordedYear: 1996,
    recordedTimestamp: '14-NOV-1996 · 03:19',
    locationLabel: 'NE Drainage Culvert',
    requiredEvidenceId: 'ev-julian-tape-05',
    durationSec: 22,
    hiddenClueTimestampSec: 11,
    hiddenClueId: 'audio-clue-04-mimicry',
    hiddenClueTitle: '14.2 Hz Acoustic Mimicry Inside Sump',
    hiddenClueNote:
      'Wet webbed strides echo beneath a distorted vocal hum—shifting from a duck’s squeak into a child’s whisper.',
    reinterpretationRequiresEvidenceId: 'clue-03-webbed-prints',
    reinterpretationNote:
      'The webbed mud prints lead straight into this culvert and vanish toward the locked Forest Gate.',
    transcript: [
      {
        atSec: 0,
        speaker: 'JULIAN VANCE',
        text: 'Recording 04. Inside the northeast storm drain. Water’s ankle-deep and freezing.',
      },
      {
        atSec: 6,
        speaker: 'JULIAN VANCE',
        text: 'Tracks go straight through the grate. Something heavy walked on two webbed feet toward the north fence.',
      },
      {
        atSec: 11,
        speaker: 'PIPE ECHO [14.2 Hz]',
        text: '[Heavy splash—then a broken plastic squeak warps into a faint child whisper: "...look..."]',
        isHiddenClue: true,
      },
      {
        atSec: 17,
        speaker: 'JULIAN VANCE [BREATHING]',
        text: 'Do not look directly at it. Keep the beam on the mud.',
      },
    ],
  },
  {
    id: 'rec-05-forest',
    code: 'FINAL TAPE',
    title: '05 — Final Recording: The Forest',
    recordedYear: 1996,
    recordedTimestamp: '14-NOV-1996 · 03:42',
    locationLabel: 'North Forest Gate',
    requiredEvidenceId: 'ev-julian-tape-05',
    durationSec: 26,
    hiddenClueTimestampSec: 15,
    hiddenClueId: 'audio-clue-05-forest-warning',
    hiddenClueTitle: "Julian's Final Warning on Mimicry",
    hiddenClueNote:
      'Julian’s last words warn that the voice beyond the gate imitates a child to lure investigators into looking directly.',
    reinterpretationRequiresEvidenceId: 'ev-caretaker-log',
    reinterpretationNote:
      'Read alongside the caretaker’s log, Julian knew the voice sounded wrong—yet walked through the gate anyway.',
    transcript: [
      {
        atSec: 0,
        speaker: 'JULIAN VANCE',
        text: 'Final recording. I unlocked the north forest gate. Fog’s thick enough to swallow my flashlight.',
      },
      {
        atSec: 8,
        speaker: 'JULIAN VANCE',
        text: 'If anyone finds these reels—do not trust the voice ahead of you in the pines.',
      },
      {
        atSec: 15,
        speaker: 'JULIAN VANCE',
        text: 'It is imitating a child’s voice. It knows Jimmy never spoke after that first week, yet it keeps calling—',
        isHiddenClue: true,
      },
      {
        atSec: 21,
        speaker: 'UNKNOWN VOICE [DISTANT]',
        text: '[Tape snaps cleanly after a single soft child breath: "...you’re here..."]',
      },
    ],
  },
];

export const DEDUCTION_NODES: DeductionNode[] = [
  {
    id: 'deduction-timeline-gap',
    title: 'Link 01 // 1994–1996 Timeline Anomaly',
    premiseA: '1994 Missing Poster & Broken Yellow Duck',
    premiseB: 'Surveillance Photo & Recording 01–02 (Double Laugh)',
    requiredEvidenceIds: ['ev-jimmy-poster', 'ev-broken-duck', 'ev-surveillance-photo'],
    requiredAudioClueIds: ['audio-clue-01-contradiction', 'audio-clue-02-double-laugh'],
    conclusion:
      'Sightings after Jimmy vanished were not searches—something remained on the grounds repeating an identical child laugh.',
    isFinalDeduction: false,
  },
  {
    id: 'deduction-silent-voice',
    title: 'Link 02 // The Voice Contradiction',
    premiseA: "Jimmy's 1994 Portrait & Caretaker's Log",
    premiseB: 'Recording 03 ("Jimmy stopped speaking")',
    requiredEvidenceIds: ['ev-jimmy-photo', 'ev-caretaker-log'],
    requiredAudioClueIds: ['audio-clue-03-silent-boy'],
    conclusion:
      'Jimmy stopped speaking before his disappearance; the giggling reported at the fence and culvert cannot be verified as Jimmy himself.',
    isFinalDeduction: false,
  },
  {
    id: 'deduction-final-bridge',
    title: 'FINAL DEDUCTION // Unlock North Forest Gate',
    premiseA: 'All 8 Mandatory Exhibits (1994 & 1996)',
    premiseB: "Julian's Drainage & Forest Mimicry Warnings",
    requiredEvidenceIds: [
      'ev-jimmy-poster',
      'ev-broken-duck',
      'clue-01-beak-shard',
      'ev-julian-tape-01',
      'ev-surveillance-photo',
      'ev-jimmy-photo',
      'ev-caretaker-log',
      'ev-julian-tape-05',
    ],
    requiredAudioClueIds: [
      'audio-clue-01-contradiction',
      'audio-clue-02-double-laugh',
      'audio-clue-03-silent-boy',
      'audio-clue-05-forest-warning',
    ],
    conclusion:
      'Whether the Duck guards what happened to Jimmy or mimics what was left behind, the answer Julian followed in 1996 lies past the North Forest Gate.',
    isFinalDeduction: true,
  },
];

export const ENDING_DEFINITIONS: EndingDefinition[] = [
  {
    id: 'erased-investigator',
    code: 'OUTCOME 1 OF 4',
    title: 'THE ERASED INVESTIGATOR',
    subtitle: 'Direct Gaze Fixation / Cognitive Erasure',
    statusTag: 'STATUS: RECORD EXPUNGED',
    narrativeSummary:
      'You held your gaze on the figure in the clearing. The rain stopped sounding like rain, your camera feed kept rolling, and by 04:00 AM another weathered flyer appeared on the notice board—no name, no face, only a yellow silhouette beneath the trees.',
    ambiguityPostscript:
      'Was Julian erased the exact same way in 1996, or did he step willingly out of sight?',
  },
  {
    id: 'yellow-token',
    code: 'OUTCOME 2 OF 4',
    title: 'THE YELLOW TOKEN',
    subtitle: 'Ritual Appeasement / Fragmented Escape',
    statusTag: 'STATUS: SURVIVED WITH OBJECT',
    narrativeSummary:
      'Lowering your flashlight, you placed the broken 1994 duck token onto the damp pine needles and backed away without looking up. Behind you, something heavy settled into the moss. You reached your car alive—yet an identical yellow whistle sat dry on your passenger seat.',
    ambiguityPostscript:
      'Leaving the token bought your exit, though neither Jimmy’s fate nor Julian’s final hour was settled.',
  },
  {
    id: 'whispering-drain',
    code: 'OUTCOME 3 OF 4',
    title: 'THE WHISPERING DRAIN',
    subtitle: 'Followed the Mimicked Voice Into the Mist',
    statusTag: 'STATUS: SIGNAL LOST BEYOND TREELINE',
    narrativeSummary:
      'When the child’s voice whispered "You took so long," you stepped toward it past the fallen caution ribbon. The trees closed behind your shoulder, and the last thing recorded on your pocket mic was two identical laughs echoing from opposite sides of the culvert.',
    ambiguityPostscript:
      'Listeners in 2026 still debate whether the voice belongs to Jimmy, Julian, or something wearing both memories.',
  },
  {
    id: 'true-closure',
    code: 'OUTCOME 4 OF 4',
    title: "TRUE CLOSURE: JULIAN'S RELEASE",
    subtitle: 'Complete 1994/1996 Reconstruction & Unflinching Witness',
    statusTag: 'STATUS: CASE ARCHIVE RECONSTRUCTED',
    narrativeSummary:
      'Armed with every 1994 exhibit, Julian’s five 1996 cassettes, and the contradiction of Jimmy’s silence, you refused to look directly at the Duck or follow the mimicry. You recovered Julian’s dropped 1996 journal and exited the treeline before dawn, finally delivering his warnings out of Willow Creek.',
    ambiguityPostscript:
      'Julian’s investigation reached daylight at last—yet the photograph on the first page still raises one unanswered question: why did the package arrive at your door in 2026?',
  },
];

export const SAMPLE_INTERACTION_PROMPTS = [
  {
    targetId: 'missing-poster-board',
    keyLabel: 'E',
    verb: 'READ',
    label: '1994 MISSING POSTER: JIMMY MERCER',
    detail: 'Nov 1994 // Notice Board',
  },
  {
    targetId: 'swing-chains',
    keyLabel: 'E',
    verb: 'INSPECT',
    label: 'RUSTED SWING #2',
    detail: 'Yellow polymer & 1996 scratch marks',
  },
  {
    targetId: 'broken-duck-toy',
    keyLabel: 'E',
    verb: 'INSPECT',
    label: '1994 BROKEN YELLOW DUCK',
    detail: 'Half-buried in swing mulch',
  },
] as const;
