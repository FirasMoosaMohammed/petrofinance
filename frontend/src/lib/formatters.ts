/**
 * Formats a monetary number into Saudi Riyals (SAR).
 */
export function formatSAR(value: number | undefined | null, compact = false): string {
  if (value === undefined || value === null || isNaN(value)) return 'SAR 0.00';
  
  if (compact) {
    const absVal = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (absVal >= 1_000_000_000) {
      return `${sign}SAR ${(absVal / 1_000_000_000).toFixed(2)}B`;
    }
    if (absVal >= 1_000_000) {
      return `${sign}SAR ${(absVal / 1_000_000).toFixed(2)}M`;
    }
    if (absVal >= 1_000) {
      return `${sign}SAR ${(absVal / 1_000).toFixed(1)}K`;
    }
  }

  return `SAR ${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formats a percentage with a plus sign for positive values.
 */
export function formatPercent(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return '0.00%';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Formats volume in standard barrels (bbl).
 */
export function formatBarrels(value: number | undefined | null, compact = false): string {
  if (value === undefined || value === null || isNaN(value)) return '0 bbl';
  if (compact) {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(2)}M bbl`;
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K bbl`;
    }
  }
  return `${value.toLocaleString('en-US')} bbl`;
}

/**
 * Formats standard integers.
 */
export function formatNumber(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return '0';
  return value.toLocaleString('en-US');
}

