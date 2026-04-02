import React from 'react'
import { useCheckSession } from '../api/useAuth';

const Test = () => {
  const { mutate: checkSession, data, isPending } = useCheckSession();

  return (
    <div className="p-8">
      <button 
        onClick={() => checkSession()}
        disabled={isPending}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {isPending ? 'Checking...' : 'Check Session'}
      </button>
      {data && (
        <div className="mt-4 p-4 bg-green-100 rounded">
          <p className="text-green-800">
            <strong>User ID:</strong> {data.user_id}
          </p>
          <p className="text-green-800">
            <strong>Authenticated:</strong> {data.authenticated ? 'Yes' : 'No'}
          </p>
        </div>
      )}
    </div>
  )
}

export default Test