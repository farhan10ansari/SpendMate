// Regex to validate a numeric amount with:
// - Up to 8 digits before the decimal point
// - An optional decimal point
// - Up to 2 digits after the decimal point
export const amountInputRegex = /^\d{0,8}(\.\d{0,2})?$/;


// Function to extract a human-readable message from an unknown error object
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}