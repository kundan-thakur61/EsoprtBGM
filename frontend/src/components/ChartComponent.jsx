import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function ChartComponent({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <CartesianGrid stroke="#eee" />
        <Line type="monotone" dataKey="users" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
}