"use client";

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
import { estimateSimulatedFare, VEHICLE_TYPES } from "./vehicle-types";

/**
 * Real, functional homepage booking widget (Sprint 6, polished in Sprint
 * 7). Deliberately does NOT write to Firestore directly — this is a
 * pre-signup lead-gen widget, distinct from the authenticated `/book`
 * flow (`apps/web/src/app/(passenger)/book`) which does the real booking
 * against real saved places. "Find a ride" routes a signed-in visitor
 * straight into that real flow; a signed-out visitor is sent to register
 * first. Fare is explicitly simulated per the sprint brief.
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
  const [vehicleId, setVehicleId] = useState(VEHICLE_TYPES[0]!.id);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [touched, setTouched] = useState(false);

  const vehicle = useMemo(
    () => VEHICLE_TYPES.find((v) => v.id === vehicleId) ?? VEHICLE_TYPES[0]!,
    [vehicleId],
  );
  const estimatedFare = useMemo(
    () =>
      pickup.trim() && destination.trim()
        ? estimateSimulatedFare(pickup, destination, vehicle)
        : null,
    [pickup, destination, vehicle],
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
    if (status === "authenticated") {
      router.push("/book");
    } else {
      toast({ variant: "default", title: t("website.landing.bookingSignUpPrompt") });
      router.push("/register");
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
      className="w-full max-w-md rounded-3xl border border-white/10 bg-white/95 p-5 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-shadow duration-300 hover:shadow-[0_32px_70px_-15px_rgba(232,106,47,0.35)] dark:bg-neutral-900/95"
    >
      <h3 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
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
          />
          <Select
            label={t("booking.vehicleLabel")}
            value={vehicleId}
            onValueChange={setVehicleId}
            options={VEHICLE_TYPES.map((v) => ({ value: v.id, label: t(v.nameKey) }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            type="date"
            label={t("website.landing.departureDateLabel")}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="py-2"
          />
          <Input
            type="time"
            label={t("website.landing.departureTimeLabel")}
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="py-2"
          />
        </div>

        <Textarea
          label={t("website.landing.notesLabel")}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={1}
          className="py-2"
        />

        <motion.div
          key={estimatedFare ?? "empty"}
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-brand-50 dark:bg-brand-900 flex items-center justify-between rounded-xl px-4 py-2"
        >
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
            {t("website.landing.estimatedFareLabel")}
          </span>
          <span className="text-brand-700 dark:text-brand-200 text-lg font-bold">
            {estimatedFare !== null ? `$${estimatedFare.toFixed(2)}` : "—"}
          </span>
        </motion.div>

        <div className="tablet:flex-row flex flex-col gap-2">
          <RippleButton className="flex-1">
            <Button fullWidth onClick={handleFindRide}>
              {t("website.landing.findRideCta")}
            </Button>
          </RippleButton>
          <RippleButton className="flex-1">
            <Button fullWidth variant="outline" onClick={handlePublishRide}>
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
      <Icon
        name={icon}
        size={16}
        className={`pointer-events-none absolute left-3 top-[42px] z-10 -translate-y-1/2 ${iconClassName ?? "text-neutral-400"}`}
      />
      <Input
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="py-2 pl-9 pr-9"
        errorText={errorText}
      />
      {valid && !errorText && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-success absolute right-3 top-[42px] -translate-y-1/2"
        >
          <Icon name="checkCircle" size={16} />
        </motion.span>
      )}
    </div>
  );
}
