import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import React from 'react';
import { Line } from 'react-chartjs-2';
import { ForecastItem } from '../services/weatherService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
);

interface WeatherChartProps {
  data: ForecastItem[];
  unit: 'metric' | 'imperial';
}

export const WeatherChart: React.FC<WeatherChartProps> = ({ data, unit }) => {
  const labels = data.map(item => 
    new Date(item.dt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
  );

  const chartData = {
    labels,
    datasets: [
      {
        fill: true,
        label: `Temperature (${unit === 'metric' ? '°C' : '°F'})`,
        data: data.map(item => item.temp),
        borderColor: 'rgba(96, 165, 250, 0.8)',
        backgroundColor: 'rgba(96, 165, 250, 0.1)',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#60a5fa',
        pointBorderColor: '#fff',
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' as const },
        bodyFont: { size: 13 },
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          font: { size: 10 },
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          font: { size: 10 },
        },
      },
    },
  };

  return (
    <div className="w-full h-48 mt-4">
      <Line data={chartData} options={options} />
    </div>
  );
};
