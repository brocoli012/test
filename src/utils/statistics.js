export function getStats(values) {
  const nums = values.map(Number).filter(v => !isNaN(v));
  if (!nums.length) return {};
  const sum = nums.reduce((a, b) => a + b, 0);
  const avg = sum / nums.length;
  const sorted = [...nums].sort((a, b) => a - b);
  const median = sorted[Math.floor(nums.length / 2)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const std = Math.sqrt(nums.reduce((a, b) => a + (b - avg) ** 2, 0) / nums.length);
  const missing = values.length - nums.length;
  // IQR 이상치
  const q1 = sorted[Math.floor(nums.length * 0.25)];
  const q3 = sorted[Math.floor(nums.length * 0.75)];
  const iqr = q3 - q1;
  const outliers = nums.filter(v => v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr);
  // 왜도
  const skewness = nums.length > 2 ? (nums.reduce((a, b) => a + Math.pow((b - avg) / std, 3), 0) / nums.length) : 0;
  return { sum, avg, median, min, max, std, missing, outliers, q1, q3, iqr, skewness };
}

export function correlation(a, b) {
  const n = a.length;
  const avgA = a.reduce((x, y) => x + y, 0) / n;
  const avgB = b.reduce((x, y) => x + y, 0) / n;
  const cov = a.reduce((sum, v, i) => sum + (v - avgA) * (b[i] - avgB), 0) / n;
  const stdA = Math.sqrt(a.reduce((sum, v) => sum + (v - avgA) ** 2, 0) / n);
  const stdB = Math.sqrt(b.reduce((sum, v) => sum + (v - avgB) ** 2, 0) / n);
  return cov / (stdA * stdB);
} 