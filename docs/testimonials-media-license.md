# Testimonials Bundled Portraits — Source & License

Micro-sprint HOME-07B — a small curated set of royalty-free portraits
used as the **default** presentation for testimonials that have no
CMS-uploaded photo. Bundled locally at
`apps/web/public/media/testimonials/`, never hotlinked.

**These are decorative defaults, not the actual people who wrote the
testimonials.** `TestimonialsSection.tsx` assigns one by rotating
through the set (`index % 4`), and any testimonial with its own
CMS-uploaded `photoUrl` always uses that instead — see "Usage &
fallback" below. Named generically (`portrait-1.jpg` … `portrait-4.jpg`)
rather than after any testimonial's name, deliberately, so nothing
implies a specific photo belongs to a specific named reviewer.

All images are the **Pexels License**: free for commercial use, no
attribution required, modification permitted. Only restricted from:
implying false endorsement, reselling unmodified, using as a trademark,
or re-uploading to a competing stock site. https://www.pexels.com/license/

Every image was downloaded and visually inspected before selection —
two earlier candidates were rejected after inspection for a visible
clothing-brand logo, and one for a heavy dappled-shadow pattern across
the face that would read as noise at small avatar size.

## portrait-1.jpg

|                     |                                                                       |
| ------------------- | --------------------------------------------------------------------- |
| Source platform     | Pexels                                                                |
| Original asset page | https://www.pexels.com/photo/a-woman-in-blue-knitted-sweater-5227692/ |
| Creator             | Фотограф Лисовский Стас                                               |
| License             | Pexels License — free for commercial use, no attribution required     |
| Download date       | 2026-08-16                                                            |
| Processed           | Square crop centered on face, scaled to 500×500 — 15KB                |

## portrait-2.jpg

|                     |                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------ |
| Source platform     | Pexels                                                                                     |
| Original asset page | https://pexels.com/photo/portrait-of-a-smiling-man-against-yellow-wall-in-merida-31899613/ |
| Creator             | Alan Morales                                                                               |
| License             | Pexels License — free for commercial use, no attribution required                          |
| Download date       | 2026-08-16                                                                                 |
| Processed           | Square crop centered on face, scaled to 500×500 — 33KB                                     |

Warm yellow-wall backdrop (Mérida, Mexico) — chosen partly for its
"Caribbean-compatible" warm tone.

## portrait-3.jpg

|                     |                                                                          |
| ------------------- | ------------------------------------------------------------------------ |
| Source platform     | Pexels                                                                   |
| Original asset page | https://pexels.com/photo/close-up-photography-of-a-woman-smiling-962337/ |
| Creator             | Min An                                                                   |
| License             | Pexels License — free for commercial use, no attribution required        |
| Download date       | 2026-08-16                                                               |
| Processed           | Square crop centered on face, scaled to 500×500 — 20KB                   |

## portrait-4.jpg

|                     |                                                                   |
| ------------------- | ----------------------------------------------------------------- |
| Source platform     | Pexels                                                            |
| Original asset page | https://pexels.com/photo/close-up-shot-of-a-man-smiling-12446392/ |
| Creator             | Matheus Bertelli                                                  |
| License             | Pexels License — free for commercial use, no attribution required |
| Download date       | 2026-08-16                                                        |
| Processed           | Square crop centered on face, scaled to 500×500 — 17KB            |

## Usage & fallback

Priority per testimonial, implemented in `TestimonialsSection.tsx`:
a CMS-uploaded `photoUrl` always wins → otherwise one of the four
portraits above (assigned by rotating index, so the same testimonial
consistently gets the same default portrait across renders) → if that
image ever fails to load, the existing initials-on-gradient avatar
fallback (unchanged, already built into the shared `Avatar` component)
takes over. Existing testimonial names/quotes/roles were not changed —
only the accompanying photo presentation.
