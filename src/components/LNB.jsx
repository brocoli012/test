import React, { useState, useEffect } from 'react';

const LNB = ({ onSheetSelect }) => {
  const [input, setInput] = useState('');
  const [links, setLinks] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('sheetLinks') || '[]');
    setLinks(saved);
  }, []);

  const handleAdd = () => {
    if (!input) return;
    const newLinks = [...links, input];
    setLinks(newLinks);
    localStorage.setItem('sheetLinks', JSON.stringify(newLinks));
    setInput('');
  };

  return (
    <div className="w-64 bg-gray-800 text-white h-screen p-4 flex flex-col">
      <h2 className="text-lg font-bold mb-4">구글시트 관리</h2>
      <input
        className="p-2 mb-2 text-black rounded"
        placeholder="구글시트 링크 입력"
        value={input}
        onChange={e => setInput(e.target.value)}
      />
      <button
        className="bg-blue-500 rounded p-2 mb-4"
        onClick={handleAdd}
      >
        저장
      </button>
      <div className="flex-1 overflow-y-auto">
        {links.map((link, idx) => (
          <button
            key={idx}
            className="block w-full text-left p-2 mb-2 bg-gray-700 rounded hover:bg-blue-600"
            onClick={() => onSheetSelect(link)}
          >
            {link.slice(0, 30)}...
          </button>
        ))}
      </div>
    </div>
  );
};

export default LNB; 