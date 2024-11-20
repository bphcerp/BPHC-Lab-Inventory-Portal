import { useState } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';

const ConsumableReport = () => {
  const [type, setType] = useState('BOTH');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generatePDF = async () => {
    if (!startDate || !endDate) {
      alert('Please select a date range.');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/report/pdf`, {
        params: { type, startDate, endDate },
        responseType: 'blob',
        withCredentials: true,
      });

      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      saveAs(pdfBlob, 'consumable-report.pdf');
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate the report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-3xl">
        <h1 className="text-3xl font-semibold text-center text-gray-800 mb-6">Consumable Report</h1>

        <div className="mb-6">
          <label htmlFor="transactionType" className="block text-sm font-medium text-gray-700 mb-2">Transaction Type:</label>
          <select
            id="transactionType"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="BOTH">Both</option>
            <option value="ADD">Add</option>
            <option value="ISSUE">Issue</option>
          </select>
        </div>

        <div className="mb-6">
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">Start Date:</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">End Date:</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={generatePDF}
          disabled={isLoading}
          className={`w-full p-3 text-white rounded-lg focus:outline-none ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isLoading ? 'Generating...' : 'Generate PDF'}
        </button>
      </div>
    </div>
  );
};

export default ConsumableReport;
