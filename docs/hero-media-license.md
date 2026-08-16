# Homepage Hero Media — Source & License

Micro-sprint HOME-03.1 — the bundled default Hero background (used only
when no admin has published a CMS Hero image/video override) is real,
licensed stock media, not a placeholder. Both assets live in
`apps/web/public/media/hero/`.

## Video — `hero-default.mp4`

|                     |                                                                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Source platform     | Pexels                                                                                                                       |
| Original asset page | https://www.pexels.com/video/driving-on-a-highway-at-night-15270404/                                                         |
| Creator             | Foster                                                                                                                       |
| License             | [Pexels License](https://www.pexels.com/license/) — free for commercial use, no attribution required, modification permitted |
| Download date       | 2026-08-15                                                                                                                   |
| Original            | 3840×2160, 60fps, 26.4s, H.264+AAC, ~76.5MB                                                                                  |
| Processed           | Trimmed to a 4.5s clip (3.5s–8.0s), downscaled to 1920×1080, audio removed, re-encoded H.264 (CRF 26, `+faststart`) — 744KB  |

No visible business branding, license plates, or identifiable people in
the trimmed segment (verified by reviewing frames before selecting the
in/out points — the source clip includes a passing car with a partially
visible plate later in the timeline, deliberately trimmed out).

## Image — `hero-default.jpg`

|                     |                                                                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Source platform     | Pexels                                                                                                                       |
| Original asset page | https://www.pexels.com/photo/busy-city-street-in-tropical-town-at-night-4947765/                                             |
| Creator             | Maria Orlova                                                                                                                 |
| License             | [Pexels License](https://www.pexels.com/license/) — free for commercial use, no attribution required, modification permitted |
| Download date       | 2026-08-15                                                                                                                   |
| Original            | 2784×1856 JPEG, ~624KB                                                                                                       |
| Processed           | Downscaled to 2400×1600, re-compressed — 339KB                                                                               |

**Honesty note on location:** the scene is California Avenue, Santa
Monica (a street sign is legible in-frame), not literally the Bahamas —
disclosed here rather than implied otherwise. It was chosen for how it
reads (palm-lined night street, warm neon glow, real traffic/movement,
premium and unmistakably tropical-urban) after a Nassau/Bahamas-specific
search on Pexels/Pixabay turned up almost exclusively beach/marina/
tourism footage, which the sprint brief explicitly asked to avoid. Mood
and visual language took priority over literal geography.

## Usage

Both are the **lowest-priority** background layer in `Hero.tsx` — an
admin-published CMS image/video (`homepage.background*Url`) always wins
over these; the crafted CSS gradient/grid composition from HOME-03 is
the layer below _this_ (used only if even the bundled JPEG fails to
resolve, which shouldn't happen for a bundled local asset). See
`Hero.tsx`'s own comments for the exact fallback chain.
