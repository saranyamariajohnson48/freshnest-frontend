import React, { useState, useEffect } from 'react';
import staffService from '../services/staffService';

const TestStaffAPI = () => {
  const [status, setStatus] = useState('Testing...');
  const [results, setResults] = useState([]);

  useEffect(() => {
    testAPI();
  }, []);

  const testAPI = async () => {
    const testResults = [];
    
    try {
      // Test 1: Check if staffService is imported correctly
      testResults.push({
        test: 'Staff Service Import',
        status: staffService ? '✅ Success' : '❌ Failed',
        details: staffService ? 'Service imported successfully' : 'Service not found'
      });

      // Test 2: Check API base URL
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      testResults.push({
        test: 'API Base URL',
        status: '✅ Success',
        details: `Using: ${apiUrl}`
      });

      // Test 3: Check if backend is reachable
      try {
        const response = await fetch(`${apiUrl}/health`);
        const data = await response.json();
        testResults.push({
          test: 'Backend Health Check',
          status: data.status === 'healthy' ? '✅ Success' : '❌ Failed',
          details: `Backend status: ${data.status}`
        });
      } catch (error) {
        testResults.push({
          test: 'Backend Health Check',
          status: '❌ Failed',
          details: `Error: ${error.message}`
        });
      }

      // Test 4: Check staff stats endpoint (this will fail without auth, but we can see the error)
      try {
        await staffService.getStaffStats();
        testResults.push({
          test: 'Staff Stats API',
          status: '✅ Success',
          details: 'Staff stats endpoint accessible'
        });
      } catch (error) {
        testResults.push({
          test: 'Staff Stats API',
          status: error.message.includes('401') || error.message.includes('unauthorized') ? '⚠️ Auth Required' : '❌ Failed',
          details: `Error: ${error.message}`
        });
      }

      setResults(testResults);
      setStatus('Tests completed');

    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Staff API Test Results</h1>
          
          <div className="mb-4">
            <p className="text-lg font-medium text-gray-700">Status: {status}</p>
          </div>

          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{result.test}</h3>
                  <span className="text-sm font-medium">{result.status}</span>
                </div>
                <p className="text-sm text-gray-600">{result.details}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Next Steps:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>1. Make sure you're logged in as an admin</li>
              <li>2. Navigate to Admin Dashboard → Staff section</li>
              <li>3. Click "Add Staff" to test the form</li>
              <li>4. The staff list should load automatically</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <h3 className="font-medium text-green-900 mb-2">Available URLs:</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>Frontend: <a href="http://localhost:5173" className="underline">http://localhost:5173</a></li>
              <li>Backend: <a href="http://localhost:3001" className="underline">http://localhost:3001</a></li>
              <li>Backend Health: <a href="http://localhost:3001/health" className="underline">http://localhost:3001/health</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestStaffAPI;