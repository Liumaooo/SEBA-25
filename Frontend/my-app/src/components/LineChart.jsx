import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const LineChart = ({ labels, dataPoints }) => {
  const maxValue = Math.max(...dataPoints);
  let stepSize = 1;

  if (maxValue > 100 && maxValue <= 1000) stepSize = 100;
  else if (maxValue > 1000 && maxValue <= 10000) stepSize = 1000;
  else if (maxValue > 10000) stepSize = Math.pow(10, Math.floor(Math.log10(maxValue)) - 1);

  const data = {
    labels,
    datasets: [
      {
        label: 'Performance',
        data: dataPoints,
        borderColor: 'green',
        backgroundColor: 'rgba(0,128,0,0.1)',
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.y}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: stepSize, // ✅ 修复
          callback: function (value) {
            return Number.isInteger(value) ? value : '';
          },
        },
      },
    },
  };

  return <Line data={data} options={options} />;
};

export default LineChart;
