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

// Updated data to show ESG performance by industry
const data = {
  labels: ['Manufacturing/kilang gua', 'Services', 'Retail', 'Technology', 'Agriculture', 'Construction'],
  datasets: [
    {
      label: 'Environment Score',
      data: [72, 68, 65, 78, 58, 62],
      backgroundColor: '#10b981',
      borderColor: '#059669',
      borderWidth: 1
    },
    {
      label: 'Social Score',
      data: [68, 72, 70, 75, 62, 65],
      backgroundColor: '#3b82f6',
      borderColor: '#2563eb',
      borderWidth: 1
    },
    {
      label: 'Governance Score',
      data: [65, 70, 68, 82, 55, 60],
      backgroundColor: '#f59e0b',
      borderColor: '#d97706',
      borderWidth: 1
    }
  ]
};

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        padding: 20
      }
    },
    title: {
      display: true,
      text: 'ESG Performance by Industry (2026)',
      font: {
        size: 16,
        weight: 'bold'
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
      title: {
        display: true,
        text: 'Score (%)'
      }
    },
    x: {
      title: {
        display: true,
        text: 'Industry'
      }
    }
  },
  interaction: {
    mode: 'index',
    intersect: false
  }
};

function DashboardChart() {
  return <Bar data={data} options={options} />;
}

export default DashboardChart;
