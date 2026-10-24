import { useTranslation } from "@the-ride/hooks";
import { BOOKABLE_PAYMENT_METHODS, type BookablePaymentMethod } from "@the-ride/types";
import { Pressable, StyleSheet, View } from "react-native";

import { usePalette } from "@/theme/usePalette";
import { radius, spacing } from "@/theme/tokens";

import { AppText } from "./AppText";

export interface AppPaymentMethodPickerProps {
  value: BookablePaymentMethod;
  onChange: (method: BookablePaymentMethod) => void;
  disabled?: boolean;
}

/** Cash / PayPal choice on the Booking Confirmation screen — same selectable-row look as `AppVehicleCategoryCard`. */
export function AppPaymentMethodPicker({ value, onChange, disabled }: AppPaymentMethodPickerProps) {
  const palette = usePalette();
  const { t } = useTranslation();

  return (
    <View style={styles.container} accessibilityRole="radiogroup">
      <AppText variant="caption" tone="muted">
        {t("payments.methodLabel")}
      </AppText>
      {BOOKABLE_PAYMENT_METHODS.map((method) => {
        const selected = value === method;
        return (
          <Pressable
            key={method}
            onPress={() => onChange(method)}
            disabled={disabled}
            style={[
              styles.row,
              { borderColor: selected ? palette.primary : palette.border },
              selected && styles.selected,
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled }}
          >
            <AppText variant="subheading">{t(`payments.${method}`)}</AppText>
            <AppText variant="caption" tone="muted">
              {t(`payments.${method}Hint`)}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  row: { gap: 2, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  selected: { borderWidth: 2 },
});
