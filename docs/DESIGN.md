# Design system

The owner's brief: a beautiful, dynamic page with things moving, easy and pleasant to read. Motion serves the reading: every animation either reveals data in order, shows a change, or responds to the reader.

## Direction

- **Night hero, paper body.** A deep navy hero (`--night`) with a dotted globe carries the identity; the reading area is warm paper (`--paper`) with white cards for long sessions.
- **Type:** Bricolage Grotesque Variable for headings and big numbers, Inter Variable for text, tabular figures for data. Both self-hosted via `@fontsource-variable/*` (SIL OFL).
- **Stance colours** form one diverging scale and are used for nothing else: `--uw2` strong UW, `--uw1` UW, `--n` neutral, `--ow1` OW, `--ow2` strong OW, plus a hatch for "no view". Every coloured cell also prints its label (OW, N, UW).
- **House colours** (`HOUSES[].color` in the catalogue) are categorical markers unrelated to brand colours; no logos are used.

## Motion inventory

| Where              | What moves                                                                                                                                                                                       | Implementation                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| Brand mark         | Three bars breathe                                                                                                                                                                               | CSS keyframes                  |
| Header             | Reading-progress bar; sliding edition pill                                                                                                                                                       | Motion `useScroll`, `layoutId` |
| Hero title         | Words rise and un-blur one by one; "reconciled." shimmers                                                                                                                                        | `WordReveal`, CSS gradient     |
| Globe              | Dotted Earth turns; signals travel between financial centres; drag to spin with inertia                                                                                                          | Canvas 2D (`Globe.tsx`)        |
| Glance cards, KPIs | Cards rise; numbers count up and glide on edition change                                                                                                                                         | Motion, `CountUp`              |
| Ticker             | Consensus per asset scrolls like a market tape; pauses on hover                                                                                                                                  | CSS marquee                    |
| Consensus meter    | Dots spring from neutral to their positions; average diamond follows; rows re-order smoothly on sort/filter; ghosts and dashed trails show moves since last edition; highlight dims other houses | `DotTrack`, Motion layout      |
| Full grid          | Cells flip in with a diagonal stagger; colours cross-fade on edition change; changes mode dims unchanged cells                                                                                   | CSS transitions                |
| Numbers            | Range bar grows from the median; house dots fly out to their values in lanes that avoid overlap                                                                                                  | Motion                         |
| Houses             | Cards rise; profile bars grow; a soft spotlight follows the pointer                                                                                                                              | Motion, CSS custom properties  |
| Narrative          | Theme bars fill; change rows slide in                                                                                                                                                            | Motion                         |
| Detail drawer      | Slides in over a blurred backdrop                                                                                                                                                                | Native `<dialog>` + CSS        |

Switching edition in the header re-computes everything, so the whole page animates from one quarter to the other.

## Accessibility

- Native buttons, links, `<dialog>` (focus trap, Esc, focus returned to the trigger) and real tables with headers.
- Decorative motion (globe, ticker, tracks) is `aria-hidden`; every visual has a text equivalent (row summaries, counts, value lists, labelled cells).
- `MotionConfig reducedMotion="user"` plus a CSS `prefers-reduced-motion` block: the globe renders a still frame, the ticker becomes a scrollable strip, transitions become instant.
- Touch targets ≥ 44 px for primary controls; nothing depends on hover.
- Layout verified at 390, 820 and 1440 px with no horizontal page scroll; the grid scrolls inside its frame on phones with a sticky asset column.

## Ideas for next iterations

- Per-asset and per-house pages with history across editions (animated timelines).
- A "time machine" slider across all editions once several real quarters exist.
- Themes as an animated bubble cluster; a world map of regional calls.
- Share cards: an auto-generated image of the consensus for LinkedIn posts.
