"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SalesChartProps {
  data: Array<{ name: string; volume: number; count: number }>;
}

export default function SalesChart({ data }: SalesChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FFD700" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v: any) => `${v}`} />
        <Tooltip
          contentStyle={{
            background: 'rgba(15,15,40,0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '1rem',
            backdropFilter: 'blur(16px)',
          }}
          itemStyle={{ color: '#ffffff', fontSize: '12px', fontWeight: 'bold' }}
          labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}
        />
        <Area type="monotone" dataKey="volume" stroke="#FFD700" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
