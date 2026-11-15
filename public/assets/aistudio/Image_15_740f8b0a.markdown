---
name: Psychological Dossier & Paranoia HUD
colors:
  surface: '#121416'
  surface-dim: '#121416'
  surface-bright: '#38393c'
  surface-container-lowest: '#0c0e10'
  surface-container-low: '#1a1c1e'
  surface-container: '#1e2022'
  surface-container-high: '#282a2c'
  surface-container-highest: '#333537'
  on-surface: '#e2e2e5'
  on-surface-variant: '#e4beb9'
  inverse-surface: '#e2e2e5'
  inverse-on-surface: '#2f3033'
  outline: '#ab8985'
  outline-variant: '#5b403d'
  surface-tint: '#ffb4ab'
  primary: '#ffb4ab'
  on-primary: '#690006'
  primary-container: '#ba181b'
  on-primary-container: '#ffccc6'
  inverse-primary: '#ba181b'
  secondary: '#b6c9dc'
  on-secondary: '#203241'
  secondary-container: '#394b5b'
  on-secondary-container: '#a8bbcd'
  tertiary: '#cac6bb'
  on-tertiary: '#323129'
  tertiary-container: '#605e55'
  on-tertiary-container: '#dcd8cc'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb4ab'
  on-primary-fixed: '#410002'
  on-primary-fixed-variant: '#93000c'
  secondary-fixed: '#d2e5f8'
  secondary-fixed-dim: '#b6c9dc'
  on-secondary-fixed: '#0a1d2b'
  on-secondary-fixed-variant: '#374958'
  tertiary-fixed: '#e6e2d7'
  tertiary-fixed-dim: '#cac6bb'
  on-tertiary-fixed: '#1d1c15'
  on-tertiary-fixed-variant: '#49473f'
  background: '#121416'
  on-background: '#e2e2e5'
  surface-variant: '#333537'
typography:
  display-lg:
    fontFamily: Syne
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 52px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Syne
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Syne
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Syne
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Syne
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Syne
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Courier Prime
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Courier Prime
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Courier Prime
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Space Mono
    fontSize: 13px
    fontWeight: '700'
    lineHeight: 18px
    letterSpacing: 0.08em
  label-md:
    fontFamily: Space Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.1em
  label-sm:
    fontFamily: Space Mono
    fontSize: 9px
    fontWeight: '400'
    lineHeight: 12px
    letterSpacing: 0.14em
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1.25rem
  margin-lg: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style
The design system manifests tactile dread, cold institutional decay, and acute psychological surveillance. Drawing from an uneasy tension between analog forensic archives and flickering nocturnal electronics, it balances archival evidentiary artifacts (dossiers, classified case logs, weathered tape, redacted documentation) with a stark, minimal diegetic HUD that tracks mental composure, proximity markers, and surveillance timestamps. 

The aesthetic is grounded in low-fi surveillance realism mixed with physical brutality:
- **Atmosphere:** Oppressive, clinical, cold, and forensic.
- **Visual Texture:** Faint CRT interlacing, matte photographic paper, high-contrast tape markers, and subtle monochromatic grain that responds dynamically to psychological degradation.
- **Interaction Ethos:** Deliberate, mechanical, and quiet. Interfaces operate like real-world analog evidence folders and field monitoring gear, where negative space signals tension and high-contrast red alerts signal imminent psychic collapse.

## Colors
The palette balances light absorption with intense analog signaling:

- **Dominant Base (`#0A0C0E` to `#0F1215`):** Black-charcoal foundation mimicking unlit playground asphalt and deep surveillance shadows.
- **Mid-Tone Slate (`#181F26` to `#242D38`):** Cold steel, tactical clipboards, and heavy institutional machinery housing data cards and monitor frames.
- **Desaturated Mist (`#637586`):** Used for passive telemetry, secondary metadata, scan grids, and non-threatening environmental status indicators.
- **Dirty Paper / Archive White (`#D4D0C5` with `#E8E5DC` accents):** High-readability evidence paper, typewriter debossing, stark body copy, and polaroid border frames.
- **Analog Crimson Warning (`#BA181B` base, `#9B2226` deep, `#E63946` reactive glow):** Used strictly for direct hazard states, classified redaction blocks, critical focus markers, and panic surges.

## Typography
Typographic rules strictly differentiate between narrative psychological impact and cold mechanical precision:

- **Syne (Headlines & Title Displays):** Geometric, striking, and unsettling when set in extreme uppercase with tight tracking. Reserved for chapter markers, psychological triggers, and anomalous subject headers.
- **Courier Prime (Body & Field Notes):** Evokes mid-century typewriter transcripts, psychiatric intake logs, and physical paper documentation. Used for primary narrative reading and incident records.
- **Space Mono (Labels, Timestamps & HUD):** Utilitarian, razor-sharp, and unfeeling. Delivers camera telemetry, coordinates, audio decibel readouts, and panic thresholds with zero ornamentation.

## Layout & Spacing
The layout adheres to a 12-column modular framework on desktop, condensing to 6 columns on tablet and 4 columns on mobile. 

- **Diegetic Viewport Framing:** The outer canvas retains a minimum `margin-lg` perimeter reserved for analog CRT bezel geometry, recording indicators (REC, Battery, FPS), and ambient vignette shadows.
- **The Caseboard Grid:** Internal investigative screens use asymmetric pinning modules. Documents and forensic cards align to strict gutters while accommodating subtle rotation offsets (-1.5deg to +2deg) for physical tactility.
- **Density:** High density within data tables and transcripts; stark, barren breathing room surrounding focal threat indicators.

## Elevation & Depth
Depth is constructed through tactile physical occlusion and optical CRT distortion rather than standard digital soft drop shadows:

- **Surface Tiers:**
  - *Base Void (`#0A0C0E`):* The primary sensory plane and dark peripheral camera feed.
  - *Dossier Surface (`#181F26` / `#242D38`):* Tactical clipboards and metal monitor backings with 1px hairline borders (`#637586` at 20% opacity).
  - *Evidence Layer (`#D4D0C5`):* Parchment, cardstock, and photo paper floating on top with crisp, offset ambient drop shadows (e.g., `0 8px 24px rgba(0, 0, 0, 0.75)`).
- **Physical Anchors:** Pinned photographs and paper scraps cast directional physical shadows downward, paired with visual masking artifacts (masking tape strips, pushpin nodes).
- **CRT / HUD Overlay:** Scanlines and chromatic aberration layers sit at z-index zenith, adding subtle barrel distortion and static fringe over all UI surfaces.

## Shapes
The shape language is severe, clinical, and unforgiving (`roundedness: 0`). 

- Every digital element, readout card, status bar, and data box maintains rigid, needle-sharp 90-degree corners.
- Physical artifacts (polaroids, incident reports, audio cassettes) utilize sharp rectangular geometry, broken only by irregular torn-paper edges or tape swatches.
- High-contrast HUD reticles and focus brackets use sharp right-angled bounding marks without smoothing.

## Components

- **Buttons & Action Triggers:**
  - *Primary Action:* Sharp rectangular blocks with `#BA181B` fill, stark `#D4D0C5` mono uppercase typography, and a 1px border. On hover, background shifts to `#E63946` with a rapid chromatic twitch effect.
  - *Ghost / Secondary Action:* Transparent fill, 1px `#637586` border, monospaced text. Inactive states feature subtle terminal bracket frames `[ EXAMINE ]`.

- **Evidence Dossier Cards & Polaroids:**
  - Polaroid modules feature thick `#D4D0C5` off-white borders, photographic desaturation, hand-scrawled timestamps, and semi-transparent adhesive tape strips anchoring them to the screen board.
  - Case file summaries utilize weathered manila-paper tones with horizontal rule guides and stamped metadata tags.

- **Redaction Blackouts:**
  - Heavy, solid `#0A0C0E` blocks stamped over sensitive text segments. Interactive redactions reveal blurred, trembling text when focused with cursor/reticle under elevated stress.

- **Input Fields & Monitored Logs:**
  - Dark slate boxes (`#0F1215`) framed by 1px muted slate outlines (`#242D38`). Blinking block cursors (`#BA181B`) simulate mechanical command line inputs.

- **Checkboxes & Toggles:**
  - Binary forensic switches resembling mechanical analog toggles or square brackets with an "X" mark: `[ ]` vs `[X]`, illuminated in crimson when armed.

- **Diegetic Sanity / Paranoia Meter:**
  - Segmented LED-style horizontal bar with sharp rectangular cells shifting from desaturated mist (`#637586`) to flashing warning red (`#E63946`) accompanied by audio static feedback.