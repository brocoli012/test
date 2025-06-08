import { getStats, correlation } from './statistics';

function getRandomSample(arr, n) {
  const result = [];
  const used = new Set();
  while (result.length < n && result.length < arr.length) {
    const idx = Math.floor(Math.random() * arr.length);
    if (!used.has(idx)) {
      result.push(arr[idx]);
      used.add(idx);
    }
  }
  return result;
}

export function generateReport(analysis, rows) {
  if (!analysis.length || !rows.length) return { sections: [] };
  const sections = [];

  // 1. 요약
  const summary = [];
  summary.push(`이 구글시트에는 총 ${rows.length}개의 데이터가 있습니다. 주요 컬럼은 ${analysis.map(c => c.header).join(', ')}입니다.`);
  const missingCols = analysis.filter(c => c.values.filter(v => v === '' || v === null).length > 0);
  if (missingCols.length) {
    summary.push(`결측치가 있는 컬럼: ${missingCols.map(c => c.header).join(', ')}.`);
  }
  sections.push({
    id: 'summary',
    title: '요약',
    content: summary.map((t, i) => <p key={i}>{t}</p>),
  });

  // 2. 주요 통계
  const numericCols = analysis.filter(c => c.isNumeric);
  if (numericCols.length) {
    const statTable = [
      ['컬럼', '합계', '평균', '중앙값', '최소', '최대', '표준편차', '결측치', '왜도'],
      ...numericCols.map(c => {
        const s = getStats(c.values);
        return [
          c.header,
          Math.round(s.sum).toLocaleString(),
          Math.round(s.avg).toLocaleString(),
          Math.round(s.median).toLocaleString(),
          Math.round(s.min).toLocaleString(),
          Math.round(s.max).toLocaleString(),
          s.std.toFixed(2),
          s.missing,
          s.skewness.toFixed(2),
        ];
      })
    ];
    sections.push({
      id: 'stats',
      title: '주요 통계',
      content: [
        <table className="min-w-max border mb-4" key="stat-table">
          <thead>
            <tr>{statTable[0].map((h, i) => <th key={i} className="border px-2 py-1">{h}</th>)}</tr>
          </thead>
          <tbody>
            {statTable.slice(1).map((row, rIdx) => (
              <tr key={rIdx}>{row.map((cell, cIdx) => <td key={cIdx} className="border px-2 py-1">{cell}</td>)}</tr>
            ))}
          </tbody>
        </table>
      ]
    });
  }

  // 3. 상관관계 분석
  if (numericCols.length > 1) {
    const corrMatrix = numericCols.map(a => numericCols.map(b => {
      const arrA = a.values.map(Number).filter(v => !isNaN(v));
      const arrB = b.values.map(Number).filter(v => !isNaN(v));
      return correlation(arrA, arrB).toFixed(2);
    }));
    sections.push({
      id: 'correlation',
      title: '상관관계 분석',
      content: [
        <table className="min-w-max border mb-4" key="corr-table">
          <thead>
            <tr><th className="border px-2 py-1">-</th>{numericCols.map((c, i) => <th key={i} className="border px-2 py-1">{c.header}</th>)}</tr>
          </thead>
          <tbody>
            {numericCols.map((c, rIdx) => (
              <tr key={rIdx}>
                <th className="border px-2 py-1">{c.header}</th>
                {corrMatrix[rIdx].map((v, cIdx) => <td key={cIdx} className="border px-2 py-1">{v}</td>)}
              </tr>
            ))}
          </tbody>
        </table>,
        <p className="text-sm text-gray-500" key="corr-desc">1에 가까울수록 강한 양의 상관관계, -1에 가까울수록 강한 음의 상관관계입니다.</p>
      ]
    });
  }

  // 4. 이상치(IQR 기반) - 그래프 명령 추가
  const outlierRows = [];
  const outlierChartData = [];
  numericCols.forEach(col => {
    const s = getStats(col.values);
    s.outliers.forEach(v => {
      const idx = col.values.findIndex(val => Number(val) === v);
      if (idx !== -1) outlierRows.push({ col: col.header, value: v, row: idx + 2 });
    });
    if (s.outliers.length > 0) {
      outlierChartData.push({
        header: col.header,
        outliers: s.outliers,
        all: col.values.map(Number).filter(v => !isNaN(v)),
      });
    }
  });
  if (outlierRows.length) {
    sections.push({
      id: 'outliers',
      title: '이상치 탐지',
      content: [
        <p key="outlier-desc">아래 그래프는 이상치(IQR 기준, 빨간색)와 전체 분포(파란색)를 보여줍니다.</p>,
        ...outlierChartData.map((d, i) => ['outlier-bar', d.header, d.all, d.outliers]),
        <table className="min-w-max border mb-4" key="outlier-table">
          <thead><tr><th className="border px-2 py-1">컬럼</th><th className="border px-2 py-1">값</th><th className="border px-2 py-1">행 번호</th></tr></thead>
          <tbody>
            {outlierRows.map((o, i) => (
              <tr key={i}><td className="border px-2 py-1">{o.col}</td><td className="border px-2 py-1">{o.value}</td><td className="border px-2 py-1">{o.row}</td></tr>
            ))}
          </tbody>
        </table>
      ]
    });
  }

  // 5. 시계열(날짜형 컬럼)
  const dateCol = analysis.find(c => c.isDate);
  if (dateCol && numericCols.length) {
    const yCol = numericCols[0];
    sections.push({
      id: 'timeseries',
      title: '시계열 분석',
      content: [
        <p key="timeseries-desc">{dateCol.header}별 {yCol.header} 추이입니다.</p>,
        ['timeseries', dateCol.header, yCol.header]
      ]
    });
  }

  // 6. 범주형 분포(파이차트, 표)
  analysis.filter(c => !c.isNumeric && c.uniqueCount > 1 && c.uniqueCount <= 10).forEach(col => {
    const counts = col.unique.map(v => ({
      value: v,
      count: col.values.filter(x => x === v).length,
    }));
    sections.push({
      id: `pie-${col.header}`,
      title: `${col.header} 분포`,
      content: [
        ['pie', col.header, counts],
        <table className="min-w-max border mb-4" key={`pie-table-${col.header}`}>
          <thead><tr><th className="border px-2 py-1">{col.header}</th><th className="border px-2 py-1">건수</th></tr></thead>
          <tbody>
            {counts.map((c, i) => (
              <tr key={i}><td className="border px-2 py-1">{c.value}</td><td className="border px-2 py-1">{c.count}</td></tr>
            ))}
          </tbody>
        </table>
      ]
    });
  });

  // 7. 전체 데이터 표(10% 랜덤 샘플)
  const sampleSize = Math.max(1, Math.round(rows.length * 0.1));
  const sampleRows = getRandomSample(rows, sampleSize);
  sections.push({
    id: 'table',
    title: `전체 데이터 샘플(${sampleSize}건)`,
    content: [
      <div className="overflow-x-auto" key="all-table">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              {analysis.map((c, i) => (
                <th key={i} className="px-4 py-2 border">{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sampleRows.map((row, idx) => (
              <tr key={idx}>
                {row.map((cell, cidx) => (
                  <td key={cidx} className="px-4 py-2 border">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ]
  });

  return { sections };
} 