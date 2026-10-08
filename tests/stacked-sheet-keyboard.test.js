import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const patchPath = packageJson.patchedDependencies?.['react-native-screens@4.26.2'];

test('Bun persists the stacked-sheet fix for local and EAS installs', () => {
  expect(patchPath).toBe('patches/react-native-screens@4.26.2.patch');
  const lockfile = readFileSync(new URL('../bun.lock', import.meta.url), 'utf8');
  expect(lockfile).toContain('"react-native-screens@4.26.2": "' + patchPath + '"');
});

test('native patch guards both keyboard resize and animation paths', () => {
  const patch = readFileSync(new URL('../' + patchPath, import.meta.url), 'utf8');
  expect(patch.match(/\+\s+if \(screen\.container\?\.topScreen !== screen\)/g)).toHaveLength(2);
  expect(patch).toContain('+            return insets');
  expect(patch).toContain('internal fun handleKeyboardInsetsProgress');
  expect(patch).toContain('+            return\n');
});

test('native patch clamps keyboard lift after navigation-bar compensation using live top insets', () => {
  const patch = readFileSync(new URL('../' + patchPath, import.meta.url), 'utf8');
  expect(patch).toContain('WindowInsetsCompat.Type.displayCutout()).top');
  expect(patch).toContain('+        updateScreenContainerBottomOffset()');
  expect(patch).toContain('+                lastScreenContainerTopOffset = maxOf(0, screenContainerRect.top)');
  expect(patch).toContain('if (!screen.sheetShouldOverflowTopInset)');
  expect(patch).toContain('lastTopSystemBarInset - lastScreenContainerTopOffset');
  expect(patch).toContain('screen.top - topInsetWithinContainer');
  expect(patch).toContain('return minOf(keyboardShift, safeUpwardTravel)');
});

// Arithmetic regression cases for the native clamp; device testing still checks
// Android's actual layout coordinates and inset delivery during IME animation.
test.each([
  ['gesture navigation', 62, 62, 0, 62, 24, 0],
  ['three-button navigation', 62, 62, 0, 62, 48, 0],
  ['large display cutout', 100, 100, 0, 100, 24, 0],
  ['smaller sheet keeps safe top', 200, 62, 0, 200, 24, 138],
  ['small keyboard permits partial lift', 400, 62, 0, 150, 24, 126],
  ['container already below status bar', 200, 62, 62, 200, 24, 176],
  ['one-pixel detent rounding', 63, 62, 0, 63, 24, 1],
  ['sheet already at safe boundary', 0, 62, 0, 62, 24, 0],
])('%s respects the safe top', (_, sheetTop, topInset, containerTop, proposedShift, navInset, expected) => {
  const keyboardShift = Math.max(0, proposedShift - navInset);
  const topInsetWithinContainer = Math.max(0, topInset - containerTop);
  const safeUpwardTravel = Math.max(0, sheetTop - topInsetWithinContainer);
  expect(Math.min(keyboardShift, safeUpwardTravel)).toBe(expected);
});
