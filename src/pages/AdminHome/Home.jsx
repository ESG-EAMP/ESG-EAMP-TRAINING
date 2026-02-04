import React from 'react';
import Title from '../../layouts/Title/Title';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { name: '1 May', value: 10000 },
  { name: '2 May', value: 19000 },
  { name: '3 May', value: 5000 },
  { name: '4 May', value: 13000 },
  { name: '5 May', value: 17000 },
  { name: '6 May', value: 20000 },
  { name: '7 May', value: 16000 },
  { name: '8 May', value: 23000 },
  { name: '9 May', value: 20000 },
  { name: '10 May', value: 28000 },
  { name: '11 May', value: 26000 },
  { name: '12 May', value: 33000 },
  { name: '13 May', value: 30000 },
  { name: '14 May', value: 50000 },
  { name: '15 May', value: 35000 },
];

function Home() {
  return (
      <div className="container-fluid">
        <Title title="Analytics" breadcrumb={[["Analytics", "/home"],"Analytics"]} />          
        <div className="row">
          <div className="col-lg-3 mb-4">
            <div className="bg-white p-4 rounded shadow-sm h-100">
              <p className="text-uppercase text-muted small fw-bold mb-2">Active Users</p>
              <h3 className="fw-bold">346</h3>
              <p className="text-success small">↑ 5.27% <span className="text-muted">Since last month</span></p>
            </div>
          </div>
          <div className="col-lg-3 mb-4">
            <div className="bg-white p-4 rounded shadow-sm h-100">
              <p className="text-uppercase text-muted small fw-bold mb-2">Views Per Minute</p>
              <h3 className="fw-bold">284</h3>
              <p className="text-danger small">↓ 1.08% <span className="text-muted">Since previous week</span></p>
            </div>
          </div>
          <div className="col-lg-6 mb-4">
            <div className="bg-white p-4 rounded shadow-sm h-100 d-flex align-items-center justify-content-between">
              <div>
                <p className="text-muted mb-2">Enhance your</p>
                <h5 className="fw-bold">Campaign</h5>
                <p className="text-muted">for better outreach →</p>
              </div>
              <img src="/assets/campaign.png" alt="Campaign" style={{ height: '150px' }} />
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="bg-white p-4 rounded shadow-sm">
              <h5 className="fw-semibold mb-3">Sessions Overview</h5>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#00d09c" strokeWidth={3} fillOpacity={0.1} fill="#00d09c" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
  );
}

export default Home;
