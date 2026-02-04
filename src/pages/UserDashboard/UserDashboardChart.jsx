import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const data = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  datasets: [
    {
      label: 'Actual',
      data: [80, 60, 80, 85, 60, 90, 40, 50, 75, 60, 80, 85],
      backgroundColor: '#6366f1'
    },
    {
      label: 'Projected',
      data: [120, 90, 100, 120, 110, 130, 90, 100, 120, 110, 130, 125],
      backgroundColor: '#e2e8f0'
    }
  ]
};

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'bottom'
    }
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
};

function UserDashboardChart() {
  return <Bar data={data} options={options} />;
}

export default UserDashboardChart;
