import { useEffect, useState } from 'react';
import api from '../../services/api';
import ChartComponent from '../../components/ChartComponent';

export default function AdminDashboard() {
  const [chartData, setChartData] = useState([]);
  useEffect(() => {
    api.get('/admin/stats').then(res => setChartData(res.data));
  }, []);
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">User Growth</h2>
      <ChartComponent data={chartData} />
    </div>
  );
}
