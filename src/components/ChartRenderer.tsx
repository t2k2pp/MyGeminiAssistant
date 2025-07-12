
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartRendererProps {
  data: any[];
}

const ChartRenderer: React.FC<ChartRendererProps> = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return <div className="p-4 text-gray-400">No data available for chart.</div>;
  }

  const keys = Object.keys(data[0]).filter(key => typeof data[0][key] === 'number');
  const nameKey = Object.keys(data[0]).find(key => typeof data[0][key] === 'string');

  if (!nameKey || keys.length === 0) {
    return <div className="p-4 text-gray-400">Invalid data structure for chart.</div>;
  }

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

  return (
    <div className="w-full h-full p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4A4A52" />
          <XAxis dataKey={nameKey} stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              borderColor: '#4b5563',
            }}
            cursor={{ fill: '#4b5563', fillOpacity: 0.2 }}
          />
          <Legend />
          {keys.map((key, index) => (
            <Bar key={key} dataKey={key} fill={colors[index % colors.length]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChartRenderer;
