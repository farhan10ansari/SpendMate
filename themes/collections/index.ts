import { customLightTheme, customDarkTheme } from './mint';
import { ocean } from './ocean';
import { rose } from './rose';
import { amber } from './amber';
import { violet } from './violet';
import { slate } from './slate';
export const themeCollections = {
  mint: { name: 'Mint', description: 'Fresh green & warm gold', light: customLightTheme, dark: customDarkTheme },
  ocean: { name: 'Ocean', description: 'Calm blue & coastal teal', ...ocean },
  rose: { name: 'Rose', description: 'Soft rose & mellow plum', ...rose },
  amber: { name: 'Amber', description: 'Warm honey & terracotta', ...amber },
  violet: { name: 'Violet', description: 'Rich purple & cool cyan', ...violet },
  slate: { name: 'Slate', description: 'Quiet neutrals & muted bronze', ...slate },
};
export type ThemeCollectionId = keyof typeof themeCollections;
export function getThemeCollection(id: string) {
  return Object.hasOwn(themeCollections, id) ? themeCollections[id as ThemeCollectionId] : themeCollections.mint;
}
