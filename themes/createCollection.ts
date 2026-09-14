import Color from 'color';
import { customLightTheme, customDarkTheme } from './collections/mint';
import type { ThemeType } from './theme';

type Palette = Pick<ThemeType['colors'],
  'primary' | 'onPrimary' | 'primaryContainer' | 'onPrimaryContainer' |
  'secondary' | 'onSecondary' | 'secondaryContainer' | 'onSecondaryContainer' |
  'tertiary' | 'onTertiary' | 'tertiaryContainer' | 'onTertiaryContainer' |
  'background' | 'onBackground' | 'surface' | 'onSurface' |
  'surfaceVariant' | 'onSurfaceVariant' | 'outline' | 'outlineVariant'>;

export function createCollection(light: Palette, dark: Palette) {
  const build = (palette: Palette, isDark: boolean): ThemeType => {
    const base = isDark ? customDarkTheme : customLightTheme;
    const elevated = (amount: number) => Color(palette.surface).mix(Color(palette.primary), amount).hex();
    return { ...base, colors: {
      ...base.colors, ...palette,
      card: palette.surface, text: palette.onSurface, muted: palette.onSurfaceVariant, border: palette.outlineVariant,
      inverseSurface: isDark ? light.surface : dark.surface,
      inverseOnSurface: isDark ? light.onSurface : dark.onSurface,
      inversePrimary: isDark ? light.primary : dark.primary,
      ripplePrimary: Color(palette.primary).alpha(0.12).string(),
      rippleSecondary: Color(palette.secondary).alpha(0.12).string(),
      rippleTertiary: Color(palette.tertiary).alpha(0.12).string(),
      surfaceDisabled: Color(palette.onSurface).alpha(0.12).string(),
      onSurfaceDisabled: Color(palette.onSurface).alpha(0.38).string(),
      backdrop: Color(palette.onSurfaceVariant).alpha(0.4).string(),
      elevation: { level0: 'transparent', level1: elevated(0.05), level2: elevated(0.08),
        level3: elevated(0.11), level4: elevated(0.12), level5: elevated(0.14) },
    } };
  };
  return { light: build(light, false), dark: build(dark, true) };
}
