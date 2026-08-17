"use client";

import { useVehicleCategories } from "@/hooks/useSiteContent";
import {
  Button,
  Icon,
  Input,
  Select,
  Textarea,
  useToast,
  useTranslation,
  type IconName,
} from "@the-ride/ui";
import { useAuth } from "@the-ride/hooks";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { RippleButton } from "./RippleButton";
import { buildDefaultVehicleCategories } from "./vehicle-types";

/**
 * Real, functional homepage booking widget (Sprint 6, polished in Sprint
 * 7). Deliberately does NOT write to Firestore directly — this is a
 * pre-signup lead-gen widget, distinct from the authenticated `/book`
 * flow (`apps/web/src/app/(passenger)/book`) which does the real booking
 * against real saved places. "Find a ride" routes a signed-in visitor
 * straight into that real flow; a signed-out visitor is sent to register
 * first. BOOKING-05 — this card has no geocoding, so it never shows a
 * dollar amount; see docs/booking-fare-integrity.md for why and what
 * replaced the earlier fabricated estimate.
 */
export function BookingCard() {
  const { t } = useTranslation();
  const { status } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [stops, setStops] = useState<string[]>([]);
  const [passengers, setPassengers] = useState("1");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [touched, setTouched] = useState(false);

  // BOOKING-04 — the real `vehicleCategories` collection (same source
  // `/book` and VehicleTypeGrid read), so this card's dropdown never
  // diverges from what's actually configured/bookable. Filtered by the
  // passengers this same form already collects, mirroring /book's own
  // `eligibleCategories` — a category too small for the chosen party
  // never appears as pickable here either.
  const { categories: allCategories, error: categoriesError } = useVehicleCategories(
    buildDefaultVehicleCategories(t),
  );
  const categories = useMemo(
    () => allCategories.filter((c) => c.maximumPassengers >= Number(passengers)),
    [allCategories, passengers],
  );
  const vehicle = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) ?? categories[0] ?? null,
    [categories, selectedCategoryId],
  );

  function addStop() {
    setStops([...stops, ""]);
  }

  function updateStop(index: number, value: string) {
    setStops(stops.map((s, i) => (i === index ? value : s)));
  }

  function removeStop(index: number) {
    setStops(stops.filter((_, i) => i !== index));
  }

  function handleFindRide() {
    setTouched(true);
    if (!pickup.trim() || !destination.trim()) {
      toast({ variant: "danger", title: t("booking.missingLocationsTitle") });
      return;
    }

    // BOOKING-01 fix — carry what /book can actually use: pickup/destination
    // text (still resolved there via the same manual-entry/geocode path),
    // real stops, passenger count, and a chosen date/time (mapped to /book's
    // own Now/Later toggle). Deliberately NOT carried: the selected vehicle
    // category (BOOKING-04 made this card's IDs real, matching /book's, but
    // carrying a *selection* forward is a separate handoff decision this
    // sprint didn't ask for — /book already re-derives real pricing for
    // whatever the passenger picks there) and `notes` (no field for it on
    // /book; adding one is a schema change, not a handoff fix).
    const params = new URLSearchParams({ pickup: pickup.trim(), destination: destination.trim() });
    for (const stop of stops) {
      if (stop.trim()) params.append("stop", stop.trim());
    }
    if (passengers !== "1") params.set("passengers", passengers);
    if (date && time) {
      params.set("scheduledDate", date);
      params.set("scheduledTime", time);
    }
    const bookHref = `/book?${params.toString()}`;

    if (status === "authenticated") {
      router.push(bookHref);
    } else {
      toast({ variant: "default", title: t("website.landing.bookingSignUpPrompt") });
      router.push(`/register?next=${encodeURIComponent(bookHref)}`);
    }
  }

  function handlePublishRide() {
    router.push("/become-a-driver");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      // HOME-04 — refined glass surface: less blur than before (was
      // backdrop-blur-xl/24px) for a cleaner, less "frosted" read; a
      // sharper hairline border; an inset top highlight for glass depth;
      // and a restrained, always-on copper edge glow (was hover-only)
      // tying the card to the Hero's own accent lighting from HOME-03/
      // 03.1 — intensifies only slightly on hover, never garish.
      className="w-full max-w-md rounded-3xl border border-white/15 bg-white/95 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5),0_1px_0_0_rgba(232,106,47,0.12),0_20px_50px_-20px_rgba(0,0,0,0.5),0_0_36px_-14px_rgba(232,106,47,0.35)] backdrop-blur-md transition-shadow duration-300 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.55),0_1px_0_0_rgba(232,106,47,0.22),0_24px_60px_-20px_rgba(0,0,0,0.55),0_0_48px_-12px_rgba(232,106,47,0.5)] dark:border-white/10 dark:bg-neutral-900/90"
    >
      <h3 className="mb-2.5 text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
        {t("website.landing.bookingCardTitle")}
      </h3>

      <div className="flex flex-col gap-2">
        <LocationField
          icon="mapPin"
          iconClassName="text-brand"
          label={t("booking.pickupLabel")}
          value={pickup}
          onChange={setPickup}
          placeholder={t("website.landing.pickupPlaceholder")}
          valid={pickup.trim().length > 0}
          errorText={touched && !pickup.trim() ? t("common.required") : undefined}
        />
        <LocationField
          icon="flag"
          iconClassName="text-neutral-900 dark:text-neutral-50"
          label={t("booking.destinationLabel")}
          value={destination}
          onChange={setDestination}
          placeholder={t("website.landing.destinationPlaceholder")}
          valid={destination.trim().length > 0}
          errorText={touched && !destination.trim() ? t("common.required") : undefined}
        />

        {stops.map((stop, index) => (
          <div key={index} className="flex items-end gap-2">
            <div className="flex-1">
              <LocationField
                icon="mapPin"
                iconClassName="text-neutral-400"
                label={`${t("booking.stopLabel").replace("{number}", String(index + 1))}`}
                value={stop}
                onChange={(value) => updateStop(index, value)}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeStop(index)}
              aria-label={t("common.delete")}
            >
              <Icon name="close" size={16} />
            </Button>
          </div>
        ))}
        <button
          type="button"
          onClick={addStop}
          className="text-brand hover:text-brand-600 self-start text-sm font-medium transition-colors hover:underline"
        >
          {t("booking.addStop")}
        </button>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label={t("website.landing.passengersLabel")}
            value={passengers}
            onValueChange={setPassengers}
            options={["1", "2", "3", "4", "5", "6"].map((n) => ({ value: n, label: n }))}
            className="h-11"
          />
          <Select
            label={t("booking.vehicleLabel")}
            value={vehicle?.id ?? ""}
            onValueChange={setSelectedCategoryId}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            className="h-11"
          />
        </div>
        {categoriesError && <p className="text-danger text-xs">{categoriesError}</p>}

        <div className="grid grid-cols-2 gap-3">
          <Input
            type="date"
            label={t("website.landing.departureDateLabel")}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-11"
          />
          <Input
            type="time"
            label={t("website.landing.departureTimeLabel")}
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="h-11"
          />
        </div>

        <Textarea
          label={t("website.landing.notesLabel")}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={1}
          className="h-11 resize-none"
        />

        {/* BOOKING-05 — this card has no resolved coordinates (free-text
            pickup/destination only, no geocoding here) and no route, so it
            can never produce a real fare. The old "Estimated fare: $X.XX"
            was computed from string length, not distance — a fabricated
            number presented as if it meant something. Replaced with an
            honest, non-monetary notice; the real fare appears on /book
            once a route actually resolves. */}
        <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 dark:border-neutral-800 dark:bg-neutral-900/60">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500">
            <Icon name="info" size={14} />
          </span>
          <span className="text-sm text-neutral-600 dark:text-neutral-300">
            {t("website.landing.fareAfterRouteMessage")}
          </span>
        </div>

        <div className="tablet:flex-row flex flex-col gap-2">
          <RippleButton className="flex-1">
            <Button
              fullWidth
              onClick={handleFindRide}
              className="duration-normal shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_8px_20px_-8px_rgba(232,106,47,0.55)] transition-all hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_12px_28px_-8px_rgba(232,106,47,0.7)]"
            >
              {t("website.landing.findRideCta")}
            </Button>
          </RippleButton>
          <RippleButton className="flex-1">
            <Button
              fullWidth
              variant="outline"
              onClick={handlePublishRide}
              className="border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              {t("website.landing.publishRideCta")}
            </Button>
          </RippleButton>
        </div>
      </div>
    </motion.div>
  );
}

interface LocationFieldProps {
  icon: IconName;
  iconClassName?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  valid?: boolean;
  errorText?: string;
}

/** Pickup/destination/stop field with a leading icon, an animated focus ring, and instant valid/invalid feedback (Sprint 7). */
function LocationField({
  icon,
  iconClassName,
  label,
  value,
  onChange,
  placeholder,
  valid,
  errorText,
}: LocationFieldProps) {
  return (
    <div className="group relative transition-transform duration-200 focus-within:scale-[1.01]">
      {/* HOME-04 — icon/checkmark `top` recomputed for the field's new
          unified h-11 height (label row ~26px + half of 44px ≈ 48px). */}
      <Icon
        name={icon}
        size={16}
        className={`pointer-events-none absolute left-3 top-[48px] z-10 -translate-y-1/2 ${iconClassName ?? "text-neutral-400"}`}
      />
      <Input
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 pl-10 pr-9"
        errorText={errorText}
      />
      {valid && !errorText && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-success absolute right-3 top-[48px] -translate-y-1/2"
        >
          <Icon name="checkCircle" size={16} />
        </motion.span>
      )}
    </div>
  );
}
