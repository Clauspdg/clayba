# Ride Category Vehicle Photography — Source & License

Micro-sprint HOME-05B.1 — replaces the illustrated `VehicleIllustration`
placeholder on the homepage "Ride Categories" cards with real, licensed
stock photography for each category's `imageUrl` fallback. All 6 assets
live in `apps/web/public/media/vehicles/`, are bundled locally, and are
never hotlinked. The existing `VehicleIllustration` SVG remains the
fallback if an image ever fails to load (see `VehicleTypeGrid.tsx`).

All images are the **Pexels License**: free for commercial use, no
attribution required, modification permitted. Only restricted from:
implying false endorsement, reselling unmodified, using as a trademark,
or re-uploading to a competing stock site. https://www.pexels.com/license/

Every image below was downloaded and visually inspected frame-by-frame
before selection — several earlier candidates were rejected after
inspection for legible license plates, dealer/business branding, or
being extreme macro crops that didn't actually show the car (see
per-image notes for what was cropped/blurred and why).

## economy.jpg

|                     |                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------- |
| Source platform     | Pexels                                                                             |
| Original asset page | https://www.pexels.com/photo/silver-sedan-parked-beside-brown-brick-wall-11501948/ |
| Creator             | Kadir Akman                                                                        |
| License             | Pexels License — free for commercial use, no attribution required                  |
| Download date       | 2026-08-16                                                                         |
| Represents          | Ride / Economy                                                                     |
| Processed           | Full-frame side profile, scaled to 1200×800 (3:2) — 164KB                          |

Silver Volkswagen Passat, clean side profile against a red brick wall,
wet-pavement reflection. No license plate visible — the side-profile
framing structurally excludes it.

## comfort.jpg

|                     |                                                                               |
| ------------------- | ----------------------------------------------------------------------------- |
| Source platform     | Pexels                                                                        |
| Original asset page | https://www.pexels.com/photo/white-car-parked-beside-the-brick-wall-11490451/ |
| Creator             | Kadir Akman                                                                   |
| License             | Pexels License — free for commercial use, no attribution required             |
| Download date       | 2026-08-16                                                                    |
| Represents          | Comfort                                                                       |
| Processed           | Front 3/4 crop, scaled to 1200×800 (3:2) — 109KB                              |

White Volkswagen Passat, front 3/4 angle, same photographer/brick-wall
setting as `economy.jpg` for a consistent photography style. The front
bumper's license plate ("32 AAG 237" in the source) was **locally
blurred** with a Gaussian box blur before cropping — the front-3/4 angle
places the plate too high on the bumper to exclude by cropping alone
without also losing the wheels.

## suv.jpg

|                     |                                                                   |
| ------------------- | ----------------------------------------------------------------- |
| Source platform     | Pexels                                                            |
| Original asset page | https://pexels.com/photo/black-subaru-forester-car-19868893/      |
| Creator             | Ayyeee Ayyeee                                                     |
| License             | Pexels License — free for commercial use, no attribution required |
| Download date       | 2026-08-16                                                        |
| Represents          | SUV                                                               |
| Processed           | Side profile, scaled to 1200×800 (3:2) — 41KB                     |

Black Subaru Forester, clean side profile, white wall + sky backdrop,
roof rack visible. No plate visible (angle excludes it), no branding.

## van.jpg

|                     |                                                                                |
| ------------------- | ------------------------------------------------------------------------------ |
| Source platform     | Pexels                                                                         |
| Original asset page | https://pexels.com/photo/sleek-modern-minivan-driving-on-scenic-road-30195580/ |
| Creator             | Jeremy Li (@picswithjer)                                                       |
| License             | Pexels License — free for commercial use, no attribution required              |
| Download date       | 2026-08-16                                                                     |
| Represents          | Van                                                                            |
| Processed           | Full-frame side/3-4 view, scaled to 1200×800 (3:2) — 67KB                      |

Gray Chrysler Pacifica minivan in motion on a forest highway (Jasper,
Alberta). **Honesty note:** a small, motion-blurred rear plate and a
blurred driver silhouette are present but not legible — the panning
motion blur that gives the shot its premium "in motion" quality also
makes both non-dominant and unreadable.

## premium.jpg

|                     |                                                                              |
| ------------------- | ---------------------------------------------------------------------------- |
| Source platform     | Pexels                                                                       |
| Original asset page | https://pexels.com/photo/sleek-black-sedan-parked-in-urban-setting-35628774/ |
| Creator             | Oli Liao                                                                     |
| License             | Pexels License — free for commercial use, no attribution required            |
| Download date       | 2026-08-16                                                                   |
| Represents          | Premium                                                                      |
| Processed           | Side profile, scaled to 1200×800 (3:2) — 123KB                               |

Black executive-style sedan, clean side profile, modern glass-building
urban backdrop. No plate or branding visible.

## luxury.jpg

|                     |                                                                           |
| ------------------- | ------------------------------------------------------------------------- |
| Source platform     | Pexels                                                                    |
| Original asset page | https://pexels.com/photo/photo-of-a-black-mercedes-benz-s-class-26691322/ |
| Creator             | Mike Bird                                                                 |
| License             | Pexels License — free for commercial use, no attribution required         |
| Download date       | 2026-08-16                                                                |
| Represents          | Luxury                                                                    |
| Processed           | Rear 3/4 crop, scaled to 1200×800 (3:2) — 114KB                           |

Black Mercedes-Benz S-Class, rear 3/4 angle, rooftop parking setting
with trees and a modern building in the background. The "S450"/"4MATIC"
badges visible are the vehicle's own factory model badging, not a
ride-hailing logo or dealer overlay. **Honesty note:** the rear plate
holder is visible but is blank (a plain yellow rectangle with no
characters in the source photo) — nothing was blurred or removed here.

## Usage & fallback

Each category's `imageUrl` in `apps/web/src/components/marketing/vehicle-types.ts`
points to its file above (root-relative, bundled — not hotlinked). If an
image ever fails to load, `VehicleTypeGrid.tsx` swaps to the existing
`VehicleIllustration` SVG so a broken card is never shown. Vehicle
category names, descriptions, capacity, and pricing are all unchanged —
`imageUrl` is purely a presentational addition, same as the pre-existing
`icon` field.
