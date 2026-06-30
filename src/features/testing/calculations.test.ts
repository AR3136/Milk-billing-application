import { calculateEntryRate } from '../milk-entry/services';

/**
 * Unit tests verifying business math calculations formulas
 */
export function runCalculationTests() {
  const results: string[] = [];

  const runTest = (name: string, assertion: () => boolean) => {
    try {
      const ok = assertion();
      results.push(`${ok ? '✅' : '❌'} - ${name}`);
    } catch (err) {
      results.push(`❌ - ${name} (Failed: ${err})`);
    }
  };

  // 1. Buffalo milk pricing formula deviation test
  runTest('Buffalo Pricing: Base standard fat=6.0 SNF=9.0 applies base rate', () => {
    const rate = calculateEntryRate({
      baseRate: 60.0,
      milkType: 'buffalo',
      fat: 6.0,
      snf: 9.0
    });
    return rate === 60.0;
  });

  runTest('Buffalo Pricing: Adding fat deviation yields premium rates', () => {
    const rate = calculateEntryRate({
      baseRate: 60.0,
      milkType: 'buffalo',
      fat: 7.0, // +1.0 Fat deviation
      snf: 9.0
    });
    // Expected: 60 + (1.0 * 3.0) = 63.0
    return rate === 63.0;
  });

  // 2. operational minimum bounds checks
  runTest('Quality pricing does not drop below operational threshold limit', () => {
    const rate = calculateEntryRate({
      baseRate: 40.0,
      milkType: 'cow',
      fat: 1.0, // Very low fat
      snf: 5.0  // Very low SNF
    });
    return rate >= 20.0;
  });

  return results;
}
