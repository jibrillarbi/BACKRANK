import React, { useState } from 'react'
import { useSaveStrategy } from '../api/useAuth';
import { api } from '../api/index';

const Test = () => {
  const [name, setName] = useState('');
  const [entryRule, setEntryRule] = useState('SMA(2) > SMA(4) && Volume > VMA(3)');
  const [exitRule, setExitRule] = useState('Close < SMA(2)');
  const [sessionData, setSessionData] = useState(null);
  const [isPendingSession, setIsPendingSession] = useState(false);
  
  const { mutate: saveStrategy, isPending: isSavingStrategy, data: saveData, error: saveError } = useSaveStrategy();

  const handleCheckSession = async () => {
    setIsPendingSession(true);
    try {
      const data = await api.getCurrentUser();
      setSessionData(data);
    } catch (err) {
      console.error('Error checking session:', err);
    } finally {
      setIsPendingSession(false);
    }
  };

  const handleSaveStrategy = () => {
    saveStrategy({
      name,
      entry_rule: entryRule,
      exit_rule: exitRule,
      is_published: false
    });
  };

  return (
    <div className="p-8 space-y-8">
      {/* Session Check Test */}
      <div className="border border-gray-300 p-4 rounded">
        <h2 className="text-lg font-bold mb-4">Session Check</h2>
        <button 
          onClick={handleCheckSession}
          disabled={isPendingSession}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {isPendingSession ? 'Checking...' : 'Check Session'}
        </button>
        {sessionData && (
          <div className="mt-4 p-4 bg-green-100 rounded">
            <p className="text-green-800">
              <strong>UID:</strong> {sessionData.uid}
            </p>
          </div>
        )}
      </div>

      {/* Save Strategy Test */}
      <div className="border border-gray-300 p-4 rounded">
        <h2 className="text-lg font-bold mb-4">Save Strategy</h2>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Strategy Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
          <textarea
            placeholder="Entry Rule"
            value={entryRule}
            onChange={(e) => setEntryRule(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
          <textarea
            placeholder="Exit Rule"
            value={exitRule}
            onChange={(e) => setExitRule(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
          <button
            onClick={handleSaveStrategy}
            disabled={isSavingStrategy || !name || !entryRule || !exitRule}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            {isSavingStrategy ? 'Saving...' : 'Save Strategy'}
          </button>
        </div>
        {saveData && (
          <div className="mt-4 p-4 bg-green-100 rounded">
            <p className="text-green-800">Strategy saved successfully!</p>
          </div>
        )}
        {saveError && (
          <div className="mt-4 p-4 bg-red-100 rounded">
            <p className="text-red-800">Error: {saveError.message}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Test