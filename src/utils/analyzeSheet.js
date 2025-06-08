export function analyzeSheet(headers, rows) {
  const columns = headers.map((header, idx) => {
    const values = rows.map(row => row[idx]);
    // 숫자형 판별
    const numericValues = values.map(v => Number(v)).filter(v => !isNaN(v));
    const isNumeric = numericValues.length > rows.length / 2;
    // 날짜형 판별
    const dateValues = values.map(v => new Date(v));
    const isDate = dateValues.filter(d => !isNaN(d)).length > rows.length / 2;
    // 범주형 판별
    const unique = [...new Set(values)];
    return {
      header,
      isNumeric,
      isDate,
      uniqueCount: unique.length,
      values,
      numericValues,
      stats: isNumeric
        ? {
            sum: numericValues.reduce((a, b) => a + b, 0),
            avg: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
            min: Math.min(...numericValues),
            max: Math.max(...numericValues),
          }
        : {},
      unique,
    };
  });
  return columns;
} 