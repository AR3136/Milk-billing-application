import { customerFormSchema } from '../customers/validation';
import { paymentFormSchema } from '../payments/validation';

/**
 * Unit tests for input Zod schemas
 */
export function runValidationTests() {
  const results: string[] = [];

  const runTest = (name: string, assertion: () => boolean) => {
    try {
      const ok = assertion();
      results.push(`${ok ? '✅' : '❌'} - ${name}`);
    } catch (err) {
      results.push(`❌ - ${name} (Failed: ${err})`);
    }
  };

  // 1. Phone number test
  runTest('Customer Form: Accept valid 10 digit phone number', () => {
    const data = {
      name: 'Ramesh Patil',
      phone: '9876543210',
      address: 'Pune',
      milkType: 'cow' as const,
      defaultQuantity: 5.0,
      ratePerLiter: 45.0,
    };
    return customerFormSchema.safeParse(data).success;
  });

  runTest('Customer Form: Reject invalid phone formats', () => {
    const data = {
      name: 'Ramesh Patil',
      phone: '98765432', // Too short
      address: 'Pune',
      milkType: 'cow' as const,
      defaultQuantity: 5.0,
      ratePerLiter: 45.0,
    };
    return !customerFormSchema.safeParse(data).success;
  });

  // 2. Positive payment amount test
  runTest('Payment Form: Reject negative amounts', () => {
    const data = {
      customerId: '12345678-1234-1234-1234-123456789012',
      amount: -100, // Negative
      paymentDate: '2026-06-30',
      paymentMethod: 'upi' as const,
    };
    return !paymentFormSchema.safeParse(data).success;
  });

  return results;
}
