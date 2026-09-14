import { customLightTheme, customDarkTheme } from './mint';
import { ocean } from './ocean';
import { rose } from './rose';
import { amber } from './amber';
import { violet } from './violet';
import { slate } from './slate';
import { lava } from './lava';
import { monochrome } from './monochrome';
import { ubuntu } from './ubuntu';
import { dracula } from './dracula';
import { nord } from './nord';
import { gruvbox } from './gruvbox';
export const themeCollections = {
  mint: { name: 'Mint', description: 'Fresh green & warm gold', light: customLightTheme, dark: customDarkTheme },
  ocean: { name: 'Ocean', description: 'Calm blue & coastal teal', ...ocean },
  rose: { name: 'Rose', description: 'Soft rose & mellow plum', ...rose },
  amber: { name: 'Amber', description: 'Warm honey & terracotta', ...amber },
  violet: { name: 'Violet', description: 'Rich purple & cool cyan', ...violet },
  slate: { name: 'Slate', description: 'Quiet neutrals & muted bronze', ...slate },
  lava: { name: 'Lava', description: 'Fiery orange & molten crimson', ...lava },
  monochrome: { name: 'Monochrome', description: 'Bold black, white & grayscale', ...monochrome },
  ubuntu: { name: 'Ubuntu', description: 'Ubuntu-inspired orange & aubergine', ...ubuntu },
  dracula: { name: 'Dracula', description: 'Dracula-inspired purple & vivid pink', ...dracula },
  nord: { name: 'Nord', description: 'Nord-inspired frost blue & sage', ...nord },
  gruvbox: { name: 'Gruvbox', description: 'Gruvbox-inspired warm retro earth tones', ...gruvbox },
};
export type ThemeCollectionId = keyof typeof themeCollections;
export function getThemeCollection(id: string) {
  return Object.hasOwn(themeCollections, id) ? themeCollections[id as ThemeCollectionId] : themeCollections.mint;
}
