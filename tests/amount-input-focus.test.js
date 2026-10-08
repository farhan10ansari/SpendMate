import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../components/input/AmountInput.tsx', import.meta.url), 'utf8');
const body = source.match(/const focusAmount = \(\) => \{([\s\S]*?)\n    \};/)?.[1];
if (!body) throw new Error('Amount input tap handler not found');
const handleTap = new Function('inputRef', 'KeyboardController', body);

test('whole amount area uses the keyboard-restoring tap handler', () => {
  expect(source).toContain('style={styles.inputContainer} onPress={focusAmount}');
});

test.each([false, true])('amount-area tap opens keyboard when focused=%s', (focused) => {
  const actions = [];
  handleTap({ current: { isFocused: () => focused, focus: () => actions.push('focus') } },
    { setFocusTo: (direction) => actions.push(direction) });
  expect(actions).toEqual([focused ? 'current' : 'focus']);
});

test('unmounted amount input ignores taps safely', () => {
  expect(() => handleTap({ current: null }, {})).not.toThrow();
});
