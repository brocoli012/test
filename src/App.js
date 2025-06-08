import React, { useState } from 'react';
import LNB from './components/LNB';
import Dashboard from './components/Dashboard';

function App() {
  const [sheetUrl, setSheetUrl] = useState('');

  return (
    <div className="flex">
      <LNB onSheetSelect={setSheetUrl} />
      <div className="flex-1">
        <Dashboard sheetUrl={sheetUrl} />
      </div>
    </div>
  );
}

export default App; 