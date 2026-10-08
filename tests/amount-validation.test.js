import { expect, test } from 'bun:test';
import { validateExpenseData, validateIncomeData, getExpenseFieldErrors, getIncomeFieldErrors } from '../lib/validations';

const date = new Date('2026-09-14T00:00:00Z');
for (const [kind, validate, fields] of [
    ['expense', validateExpenseData, { category: 'food', datetime: date }],
    ['income', validateIncomeData, { source: 'salary', dateTime: date }],
]) {
    for (const [code, valid, invalid] of [
        ['USD', '0.01', '0.009'],
        ['INR', '0.01', '0.009'],
        ['JPY', '1', '0.99'],
        ['KWD', '0.001', '0.0009'],
    ]) {
        const formatter = new Intl.NumberFormat('en', { style: 'currency', currency: code });
        const options = {
            decimalPlaces: formatter.resolvedOptions().maximumFractionDigits,
            formatCurrency: amount => formatter.format(amount),
        };
        test(`${kind}: accepts smallest ${code} unit`, () => {
            expect(validate({ ...fields, amount: valid }, options).isValid).toBe(true);
        });
        test(`${kind}: rejects below ${code} unit with localized minimum`, () => {
            const result = validate({ ...fields, amount: invalid }, options);
            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain(formatter.format(Number(valid)));
        });
    }
    for (const amount of ['', ' ', '.', '0', '-1', 'NaN', 'Infinity', '1abc', '1e2']) {
        test(`${kind}: rejects invalid amount ${JSON.stringify(amount)}`, () => {
            expect(validate({ ...fields, amount }, {
                decimalPlaces: 2, formatCurrency: value => '$' + value.toFixed(2),
            }).isValid).toBe(false);
        });
    }
    test(`${kind}: accepts decimal input with omitted leading zero or trailing decimal point`, () => {
        for (const amount of ['.50', '1.']) {
            expect(validate({ ...fields, amount }, {
                decimalPlaces: 2, formatCurrency: value => '$' + value.toFixed(2),
            }).isValid).toBe(true);
        }
    });
}

const inlineOptions = { decimalPlaces: 2, formatCurrency: value => '₹' + value.toFixed(2) };

test('inline expense validation reports all missing mandatory fields together', () => {
    const errors = getExpenseFieldErrors({ amount: '', category: null, datetime: null }, inlineOptions);
    expect(errors.amount).toBe('Please enter a valid amount');
    expect(errors.category).toBe('Please select a category');
    expect(errors.date).toBe('Please select a date and time');
});

test('inline income validation reports all missing mandatory fields together', () => {
    const errors = getIncomeFieldErrors({ amount: '', source: null, dateTime: null }, inlineOptions);
    expect(errors.amount).toBe('Please enter a valid amount');
    expect(errors.source).toBe('Please select an income source');
    expect(errors.date).toBe('Please select a date and time');
});

test('correcting fields clears their inline errors without requiring optional fields', () => {
    expect(getExpenseFieldErrors({ amount: '0.01', category: 'food', datetime: date }, inlineOptions)).toEqual({});
    expect(getIncomeFieldErrors({ amount: '0.01', source: 'salary', dateTime: date }, inlineOptions)).toEqual({});
    expect(getExpenseFieldErrors({ amount: '0', category: 'food', datetime: date }, inlineOptions)).toEqual({ amount: 'Minimum amount should be ₹0.01' });
});
