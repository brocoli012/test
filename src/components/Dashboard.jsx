import React, { useEffect, useState } from 'react';
import {
  ChartBarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';
import { Line, Bar, Pie, Scatter } from 'react-chartjs-2';
import { analyzeSheet } from '../utils/analyzeSheet';
import { generateReport } from '../utils/generateReport';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import Card from './Card';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function extractSheetId(url) {
  const match = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

function getSummaryText(analysis, rowCount) {
  if (!analysis.length) return '';
  let summary = `총 ${rowCount}개의 데이터가 있습니다. `;
  const numericCols = analysis.filter(col => col.isNumeric);
  const categoryCols = analysis.filter(col => !col.isNumeric && col.uniqueCount < rowCount / 2);
  if (numericCols.length) {
    summary += `숫자형 컬럼은 ${numericCols.map(c => c.header).join(', ')}이며, `;
    summary += numericCols.map(c => `${c.header}의 평균은 ${Math.round(c.stats.avg).toLocaleString()}입니다`).join(', ') + '. ';
  }
  if (categoryCols.length) {
    summary += `범주형 컬럼은 ${categoryCols.map(c => c.header).join(', ')} 등이 있습니다. `;
  }
  summary += '아래에서 주요 지표, 차트, 표를 확인할 수 있습니다.';
  return summary;
}

const stats = [
  {
    name: '총 매출',
    value: '₩45,231,000',
    icon: CurrencyDollarIcon,
    change: '+20.1%',
    changeType: 'positive',
  },
  {
    name: '신규 고객',
    value: '2,338',
    icon: UsersIcon,
    change: '+15.3%',
    changeType: 'positive',
  },
  {
    name: '주문 수',
    value: '1,234',
    icon: ShoppingCartIcon,
    change: '+12.5%',
    changeType: 'positive',
  },
  {
    name: '전환율',
    value: '3.2%',
    icon: ChartBarIcon,
    change: '-2.3%',
    changeType: 'negative',
  },
];

const recentActivities = [
  {
    id: 1,
    orderNumber: 'ORD-001',
    customerName: '김철수',
    amount: 150000,
    status: '완료',
    date: '2024-02-20',
  },
  {
    id: 2,
    orderNumber: 'ORD-002',
    customerName: '이영희',
    amount: 230000,
    status: '처리중',
    date: '2024-02-20',
  },
  {
    id: 3,
    orderNumber: 'ORD-003',
    customerName: '박지민',
    amount: 89000,
    status: '완료',
    date: '2024-02-19',
  },
  {
    id: 4,
    orderNumber: 'ORD-004',
    customerName: '최수진',
    amount: 320000,
    status: '완료',
    date: '2024-02-19',
  },
  {
    id: 5,
    orderNumber: 'ORD-005',
    customerName: '정민수',
    amount: 175000,
    status: '처리중',
    date: '2024-02-18',
  },
];

const salesData = {
  labels: ['1월', '2월', '3월', '4월', '5월', '6월'],
  datasets: [
    {
      label: '매출',
      data: [30000000, 35000000, 32000000, 38000000, 42000000, 45231000],
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1,
    },
  ],
};

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: '월별 매출 추이',
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value) {
          return '₩' + value.toLocaleString();
        }
      }
    }
  }
};

const Accordion = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-4">
      <button
        className="w-full text-left px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-t focus:outline-none font-semibold"
        onClick={() => setOpen(o => !o)}
      >
        {open ? '▼ ' : '▶ '} {title}
      </button>
      {open && <div className="border rounded-b bg-white p-2">{children}</div>}
    </div>
  );
};

// 분석 의미 안내문
const sectionDescriptions = {
  summary: '데이터의 전체 개요와 결측치(누락된 값) 여부를 요약합니다. 데이터의 신뢰성과 전체 구조를 한눈에 파악할 수 있습니다.',
  stats: '주요 통계는 각 숫자형 컬럼의 합계, 평균, 중앙값, 최소/최대, 표준편차, 결측치, 왜도(분포의 비대칭성)를 보여줍니다. 데이터의 중심 경향과 분포 특성을 이해하는 데 도움이 됩니다.',
  correlation: '상관관계 분석은 숫자형 컬럼들 간의 선형적 관계(피어슨 상관계수)를 보여줍니다. 1에 가까울수록 강한 양의, -1에 가까울수록 강한 음의 상관관계가 있음을 의미합니다.',
  outliers: '이상치 탐지는 IQR(사분위수 범위) 기준으로 정상 범위를 벗어난 값을 찾아내어, 데이터의 품질 문제나 특이 현상을 빠르게 파악할 수 있도록 도와줍니다.',
  timeseries: '시계열 분석은 날짜/시간 컬럼을 기준으로 값의 변화를 시각화합니다. 트렌드, 계절성, 변동성 등 시간에 따른 패턴을 파악할 수 있습니다.',
  table: '전체 데이터 샘플은 실제 데이터의 일부를 직접 확인할 수 있도록 제공합니다. 데이터의 구체적인 예시를 확인하거나, 이상치/결측치 등 특이값을 직접 검토할 때 유용합니다.'
};

const Dashboard = ({ sheetUrl }) => {
  const [sheetData, setSheetData] = useState([]);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState([]);
  const [report, setReport] = useState({ sections: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sheetUrl) return;
    setLoading(true);
    const sheetId = extractSheetId(sheetUrl);
    if (!sheetId) {
      setError('구글시트 링크가 올바르지 않습니다.');
      setSheetData([]);
      setAnalysis([]);
      setReport({ sections: [] });
      setLoading(false);
      return;
    }
    setError('');
    const SHEET_URL = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
    fetch(SHEET_URL)
      .then(res => res.text())
      .then(text => {
        try {
          const json = JSON.parse(text.substr(47).slice(0, -2));
          const rows = json.table.rows.map(row =>
            row.c.map(cell => (cell ? cell.v : ''))
          );
          setSheetData(rows);
        } catch (e) {
          setError('구글시트 데이터를 불러올 수 없습니다.');
          setSheetData([]);
          setAnalysis([]);
          setReport({ sections: [] });
        }
        setLoading(false);
      })
      .catch(() => {
        setError('구글시트 데이터를 불러올 수 없습니다.');
        setSheetData([]);
        setAnalysis([]);
        setReport({ sections: [] });
        setLoading(false);
      });
  }, [sheetUrl]);

  const headers = sheetData[0] || [];
  const rows = sheetData.slice(1);

  useEffect(() => {
    if (headers.length && rows.length) {
      const a = analyzeSheet(headers, rows);
      setAnalysis(a);
      setReport(generateReport(a, rows));
    } else {
      setAnalysis([]);
      setReport({ sections: [] });
    }
  }, [headers, rows]);

  // 목차 생성
  const toc = report.sections.map(s => ({ id: s.id, title: s.title }));

  // 섹션별 차트/표 렌더링
  function renderSectionContent(content, sectionId) {
    return content.map((item, idx) => {
      if (Array.isArray(item) && item[0] === 'pie') {
        // 파이차트 (compact)
        const counts = item[2];
        return (
          <div key={idx} className="max-w-xs mx-auto">
            <Pie
              data={{
                labels: counts.map(c => c.value),
                datasets: [{ data: counts.map(c => c.count), backgroundColor: ['#FF6384','#36A2EB','#FFCE56','#4BC0C0','#9966FF','#FF9F40'] }]
              }}
              options={{ plugins: { legend: { position: 'bottom' } } }}
            />
          </div>
        );
      }
      if (Array.isArray(item) && item[0] === 'timeseries') {
        // 시계열 라인차트 (크게)
        const xCol = item[1];
        const yCol = item[2];
        const xIdx = analysis.findIndex(c => c.header === xCol);
        const yIdx = analysis.findIndex(c => c.header === yCol);
        return (
          <div key={idx} className="max-w-3xl mx-auto">
            <Line
              data={{
                labels: rows.map(r => r[xIdx]),
                datasets: [{
                  label: yCol,
                  data: rows.map(r => Number(r[yIdx])),
                  borderColor: 'rgb(75, 192, 192)',
                  backgroundColor: 'rgba(75,192,192,0.2)',
                  tension: 0.1,
                }]
              }}
              options={{ plugins: { legend: { position: 'top' } } }}
              height={400}
            />
          </div>
        );
      }
      if (Array.isArray(item) && item[0] === 'outlier-bar') {
        // 이상치 bar+scatter를 하나의 Bar 차트로 합침
        const header = item[1];
        let all = item[2].map(v => Number(v)).filter(v => !isNaN(v));
        let outliers = item[3].map(v => Number(v)).filter(v => !isNaN(v));
        const labels = all.map((_, i) => i + 1);
        // 이상치 인덱스
        const outlierIndices = all.map((v, i) => outliers.includes(v) ? i : null).filter(i => i !== null);
        // 이상치 scatter 데이터
        const scatterData = outlierIndices.map(i => ({ x: labels[i], y: all[i] }));
        if (!all.length) {
          return <div key={idx} className="text-gray-400 text-center">이상치 데이터가 없습니다.</div>;
        }
        return (
          <div key={idx} className="max-w-2xl mx-auto">
            <Bar
              data={{
                labels,
                datasets: [
                  {
                    type: 'bar',
                    label: '전체',
                    data: all,
                    backgroundColor: all.map((v, i) => outlierIndices.includes(i) ? '#e11d48' : '#cbd5e1'),
                    borderWidth: 1,
                    barPercentage: 1.0,
                    categoryPercentage: 1.0,
                  },
                  scatterData.length > 0 ? {
                    type: 'scatter',
                    label: '이상치',
                    data: scatterData,
                    backgroundColor: '#e11d48',
                    pointRadius: 7,
                    pointHoverRadius: 10,
                    showLine: false,
                    order: 2,
                  } : null,
                ].filter(Boolean),
              }}
              options={{
                plugins: { legend: { display: false }, tooltip: { enabled: true } },
                scales: { x: { display: false }, y: { display: true } },
                maintainAspectRatio: false,
                aspectRatio: 2.5,
              }}
              height={260}
            />
          </div>
        );
      }
      // 이상치 탐지 표는 무조건 아코디언에 넣기
      if (sectionId === 'outliers' && React.isValidElement(item) && item.type === 'table') {
        return (
          <Accordion key={idx} title="이상치 표 펼치기/접기">
            {item}
          </Accordion>
        );
      }
      // 표는 row가 10개 이상이면 아코디언으로 감싸기 (table 섹션)
      if (sectionId === 'table' && React.isValidElement(item) && item.type === 'div') {
        const rowCount = item.props.children.props.children[1].props.children.length;
        if (rowCount > 10) {
          return (
            <Accordion key={idx} title="표 데이터 펼치기/접기">
              {item}
            </Accordion>
          );
        } else {
          return <div key={idx}>{item}</div>;
        }
      }
      return item;
    });
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">AI 리포트 대시보드</h1>
      {!sheetUrl && <div>좌측에서 구글시트 링크를 선택하세요.</div>}
      {loading && <div className="text-blue-500 mb-4">데이터를 불러오는 중입니다...</div>}
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {/* 목차 */}
      {toc.length > 1 && (
        <nav className="mb-8 flex flex-wrap gap-2 text-sm">
          {toc.map(s => (
            <a key={s.id} href={`#${s.id}`} className="px-3 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition">{s.title}</a>
          ))}
        </nav>
      )}
      {/* 리포트 섹션 */}
      {report.sections.map(section => (
        <Card key={section.id} id={section.id} title={section.title}>
          {/* 분석 의미 안내문 */}
          {sectionDescriptions[section.id] && (
            <div className="mb-3 text-sm text-blue-900 bg-blue-50 rounded px-3 py-2">
              {sectionDescriptions[section.id]}
            </div>
          )}
          {renderSectionContent(section.content, section.id)}
        </Card>
      ))}
    </div>
  );
};

export default Dashboard; 