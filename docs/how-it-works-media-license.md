# How It Works — Photography Source & License

Micro-sprint HOME-06B — replaces the icon-only "How It Works" cards with
real, licensed photography telling the passenger journey (request → ride
→ arrive), bundled locally at `apps/web/public/media/how-it-works/`, never
hotlinked. The existing per-step CMS `imageUrl` still overrides these on
a per-step basis; the existing icon tile remains the final fallback if
neither a CMS nor bundled image is available. See `ProcessSteps.tsx` for
the exact fallback chain.

All images are the **Pexels License**: free for commercial use, no
attribution required, modification permitted. Only restricted from:
implying false endorsement, reselling unmodified, using as a trademark,
or re-uploading to a competing stock site. https://www.pexels.com/license/

Every image was downloaded and visually inspected before selection —
consistent with the same vetting standard used for the Ride Categories
photography (HOME-05B.1): no legible license plates, no dealer/ride-hailing
branding, no watermarks.

## request.jpg — Step 1 ("Set your route")

|                     |                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------ |
| Source platform     | Pexels                                                                               |
| Original asset page | https://www.pexels.com/photo/a-woman-in-beige-blazer-using-her-mobile-phone-6415382/ |
| Creator             | RDNE Stock project                                                                   |
| License             | Pexels License — free for commercial use, no attribution required                    |
| Download date       | 2026-08-16                                                                           |
| Represents          | Step 1 — passenger requesting a ride via phone                                       |
| Processed           | Square crop centered on subject, scaled to 1200×1200 — 81KB                          |

Woman on a city sidewalk at golden hour, checking her phone. Warm,
contemporary, authentic — no app UI visible on the phone screen, no
legible plates or branding in the softly blurred background traffic.

## ride.jpg — Step 2 ("Get matched")

|                     |                                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------- |
| Source platform     | Pexels                                                                                                |
| Original asset page | https://www.pexels.com/photo/man-in-a-gray-suit-opening-a-car-door-for-a-woman-in-black-suit-8425027/ |
| Creator             | Pavel Danilyuk                                                                                        |
| License             | Pexels License — free for commercial use, no attribution required                                     |
| Download date       | 2026-08-16                                                                                            |
| Represents          | Step 2 — passenger meeting a professional driver and modern vehicle                                   |
| Processed           | Square crop keeping both people in frame, scaled to 1200×1200 — 143KB                                 |

A driver in a modern suit holding the car door open for a passenger
beside a premium black sedan. **Honesty note:** a hotel's own "M" wall
sign is faintly visible, out of focus, in the background architecture —
that's an unrelated hotel brand from the original photo location, not a
ride-hailing competitor, and unreadable at card size.

## arrive.jpg — Step 3 ("Ride and go")

|                     |                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| Source platform     | Pexels                                                                                            |
| Original asset page | https://www.pexels.com/photo/man-in-suit-jacket-and-gray-pants-standing-beside-black-car-8425410/ |
| Creator             | Pavel Danilyuk                                                                                    |
| License             | Pexels License — free for commercial use, no attribution required                                 |
| Download date       | 2026-08-16                                                                                        |
| Represents          | Step 3 — passenger arriving safely at a modern destination                                        |
| Processed           | Square crop centered on subject, scaled to 1200×1200 — 151KB                                      |

The same photographer/car/architecture as `ride.jpg`, continuing the
visual thread — a passenger stepping out beside a premium black sedan at
a sleek modern building. No plate, no branding, no watermark.

## Usage & fallback

Priority per step, implemented in `ProcessSteps.tsx`: a CMS-published
per-step image always wins → otherwise the bundled photo above for
steps 1–3 by position → otherwise the original icon tile (also used for
any step beyond the first three, e.g. if an admin adds a 4th step with
no image of its own). Admin customization is untouched — publishing a
CMS step image still overrides everything here.
