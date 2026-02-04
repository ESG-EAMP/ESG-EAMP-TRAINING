import React, { useState, useEffect } from 'react';
import { FaPlay, FaCopy, FaTrash, FaLock, FaUnlock, FaChevronDown, FaChevronUp, FaCode, FaCheck, FaTimes } from 'react-icons/fa';
import Swal from 'sweetalert2';
import api, { API_BASE, getToken, setToken, removeToken } from '../../utils/api';
import './ApiTester.css';

const ApiTester = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [token, setTokenState] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginType, setLoginType] = useState('user'); // 'user' or 'admin'
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [requestBody, setRequestBody] = useState('');
  const [queryParams, setQueryParams] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [customEndpoint, setCustomEndpoint] = useState('');

  // API Endpoints organized by user type and category
  const apiEndpoints = {
    '🔐 Authentication (Public)': {
      'User Login': { method: 'POST', path: '/auth/user/login', requiresAuth: false, userType: 'user', body: { email: 'string', password: 'string' } },
      'User Register': { method: 'POST', path: '/auth/user/register', requiresAuth: false, userType: 'user', body: { email: 'string', password: 'string', name: 'string' } },
      'User Forgot Password': { method: 'POST', path: '/auth/user/resetpassword', requiresAuth: false, userType: 'user', body: { email: 'string' } },
      'Admin Login': { method: 'POST', path: '/auth/admin/login', requiresAuth: false, userType: 'admin', body: { email: 'string', password: 'string' } },
      'Admin Register': { method: 'POST', path: '/auth/admin/register', requiresAuth: false, userType: 'admin', body: { email: 'string', password: 'string', name: 'string' } },
      'Admin Forgot Password': { method: 'POST', path: '/auth/admin/resetpassword', requiresAuth: false, userType: 'admin', body: { email: 'string' } },
    },
    '👤 MSME User APIs': {
      'Assessment - Get Questions': { method: 'GET', path: '/assessment/user/v2/get-questions', requiresAuth: true, userType: 'user' },
      'Assessment - Get User Responses': { method: 'GET', path: '/assessment/user/v2/get-responses-2', requiresAuth: true, userType: 'user', query: ['user_id', 'selected_only'] },
      'Assessment - Submit Response': { method: 'POST', path: '/assessment/user/submit-response', requiresAuth: true, userType: 'user', body: { user_id: 'string', assessment_year: 'number', responses: 'array' } },
      'Assessment - Get Responses': { method: 'GET', path: '/assessment/user/get-responses', requiresAuth: true, userType: 'user', query: ['user_id', 'selected_only'] },
      'User Profile - Get User Info': { method: 'GET', path: '/auth/user/user/{id}', requiresAuth: true, userType: 'user', params: ['id'] },
      'User Profile - Update User': { method: 'PUT', path: '/management/users/{id}', requiresAuth: true, userType: 'user', params: ['id'], body: { name: 'string', email: 'string' } },
      'Learning Materials - Get Public List': { method: 'GET', path: '/learning-materials/public/list', requiresAuth: false, userType: 'user' },
      'Learning Materials - Get Material': { method: 'GET', path: '/learning-materials/{id}', requiresAuth: true, userType: 'user', params: ['id'] },
      'Learning Materials Sections - Get Sections': { method: 'GET', path: '/learning-materials-sections/', requiresAuth: false, userType: 'user' },
      'Events - Get Event': { method: 'GET', path: '/events/{id}', requiresAuth: false, userType: 'user', params: ['id'] },
      'FAQ - Get All FAQs': { method: 'GET', path: '/faq/', requiresAuth: false, userType: 'user' },
      'FAQ - Get FAQ by ID': { method: 'GET', path: '/faq/{id}', requiresAuth: false, userType: 'user', params: ['id'] },
      'Achievements - Get User Achievements': { method: 'GET', path: '/achievements/user/{user_id}', requiresAuth: true, userType: 'user', params: ['user_id'] },
      'AI - Chat': { method: 'POST', path: '/ai/chat', requiresAuth: true, userType: 'user', body: { message: 'string', conversation_id: 'string' } },
      'Session - Validate': { method: 'GET', path: '/session/validate', requiresAuth: true, userType: 'user' },
    },
    '🛡️ Admin APIs': {
      'User Management - Get All Users': { method: 'GET', path: '/management/users', requiresAuth: true, userType: 'admin' },
      'User Management - Get User by ID': { method: 'GET', path: '/management/users/{id}', requiresAuth: true, userType: 'admin', params: ['id'] },
      'User Management - Update User': { method: 'PUT', path: '/management/users/{id}', requiresAuth: true, userType: 'admin', params: ['id'], body: { name: 'string', email: 'string' } },
      'User Management - Delete User': { method: 'DELETE', path: '/management/users/{id}', requiresAuth: true, userType: 'admin', params: ['id'] },
      'Admin Management - Get All Admins': { method: 'GET', path: '/management/admin/admins', requiresAuth: true, userType: 'admin' },
      'Admin Management - Get Admin by ID': { method: 'GET', path: '/management/admin/admins/{id}', requiresAuth: true, userType: 'admin', params: ['id'] },
      'Admin Management - Create Admin': { method: 'POST', path: '/management/admin/admins', requiresAuth: true, userType: 'admin', body: { email: 'string', password: 'string', name: 'string' } },
      'Admin Management - Update Admin': { method: 'PUT', path: '/management/admin/admins/{id}', requiresAuth: true, userType: 'admin', params: ['id'], body: { name: 'string', email: 'string' } },
      'Admin Management - Delete Admin': { method: 'DELETE', path: '/management/admin/admins/{id}', requiresAuth: true, userType: 'admin', params: ['id'] },
      'Assessment - Get All Assessments': { method: 'GET', path: '/assessment/admin/v2/get-all-assessments', requiresAuth: true, userType: 'admin' },
      'Assessment - Get Assessment Details': { method: 'GET', path: '/assessment/admin/v2/get-assessment/{id}', requiresAuth: true, userType: 'admin', params: ['id'] },
      'Assessment - Get All Responses': { method: 'GET', path: '/assessment/admin/v2/get-all-responses', requiresAuth: true, userType: 'admin' },
      'Learning Materials - Get All': { method: 'GET', path: '/learning-materials/', requiresAuth: true, userType: 'admin' },
      'Learning Materials - Get by ID': { method: 'GET', path: '/learning-materials/{id}', requiresAuth: true, userType: 'admin', params: ['id'] },
      'Learning Materials - Create': { method: 'POST', path: '/learning-materials/', requiresAuth: true, userType: 'admin', body: { title: 'string', description: 'string', content: 'string' } },
      'Learning Materials - Update': { method: 'PUT', path: '/learning-materials/{id}', requiresAuth: true, userType: 'admin', params: ['id'], body: { title: 'string', description: 'string' } },
      'Learning Materials - Delete': { method: 'DELETE', path: '/learning-materials/{id}', requiresAuth: true, userType: 'admin', params: ['id'] },
      'Learning Materials - Upload Image': { method: 'POST', path: '/learning-materials/upload-image', requiresAuth: true, userType: 'admin', body: 'FormData' },
      'Learning Materials Sections - Get All': { method: 'GET', path: '/learning-materials-sections/', requiresAuth: true, userType: 'admin' },
      'Learning Materials Sections - Get by ID': { method: 'GET', path: '/learning-materials-sections/{id}', requiresAuth: true, userType: 'admin', params: ['id'] },
      'Learning Materials Sections - Create': { method: 'POST', path: '/learning-materials-sections/', requiresAuth: true, userType: 'admin', body: { title: 'string', description: 'string', category: 'string' } },
      'Learning Materials Sections - Update': { method: 'PUT', path: '/learning-materials-sections/{id}', requiresAuth: true, userType: 'admin', params: ['id'], body: { title: 'string', description: 'string' } },
      'Learning Materials Sections - Delete': { method: 'DELETE', path: '/learning-materials-sections/{id}', requiresAuth: true, userType: 'admin', params: ['id'] },
      'Events - Get All': { method: 'GET', path: '/events/', requiresAuth: true, userType: 'admin' },
      'Events - Get by ID': { method: 'GET', path: '/events/{id}', requiresAuth: true, userType: 'admin', params: ['id'] },
      'Events - Create': { method: 'POST', path: '/events/', requiresAuth: true, userType: 'admin', body: { title: 'string', description: 'string', date: 'string', location: 'string' } },
      'Events - Update': { method: 'PUT', path: '/events/{id}', requiresAuth: true, userType: 'admin', params: ['id'], body: { title: 'string', description: 'string' } },
      'Events - Delete': { method: 'DELETE', path: '/events/{id}', requiresAuth: true, userType: 'admin', params: ['id'] },
      'FAQ - Get All': { method: 'GET', path: '/faq/', requiresAuth: false, userType: 'admin' },
      'FAQ - Get by ID': { method: 'GET', path: '/faq/{id}', requiresAuth: false, userType: 'admin', params: ['id'] },
      'FAQ - Create': { method: 'POST', path: '/faq/', requiresAuth: true, userType: 'admin', body: { question: 'string', answer: 'string' } },
      'FAQ - Update': { method: 'PUT', path: '/faq/{id}', requiresAuth: true, userType: 'admin', params: ['id'], body: { question: 'string', answer: 'string' } },
      'FAQ - Delete': { method: 'DELETE', path: '/faq/{id}', requiresAuth: true, userType: 'admin', params: ['id'] },
      'Achievements - Get All': { method: 'GET', path: '/achievements/', requiresAuth: true, userType: 'admin' },
      'Achievements - Get by ID': { method: 'GET', path: '/achievements/{id}', requiresAuth: true, userType: 'admin', params: ['id'] },
      'Achievements - Create': { method: 'POST', path: '/achievements/', requiresAuth: true, userType: 'admin', body: { name: 'string', description: 'string', criteria: 'object' } },
      'Achievements - Update': { method: 'PUT', path: '/achievements/{id}', requiresAuth: true, userType: 'admin', params: ['id'], body: { name: 'string', description: 'string' } },
      'Achievements - Delete': { method: 'DELETE', path: '/achievements/{id}', requiresAuth: true, userType: 'admin', params: ['id'] },
      'Reports - Get All': { method: 'GET', path: '/reports/', requiresAuth: true, userType: 'admin' },
      'Reports - Get by ID': { method: 'GET', path: '/reports/{id}', requiresAuth: true, userType: 'admin', params: ['id'] },
      'Reports - Create': { method: 'POST', path: '/reports/', requiresAuth: true, userType: 'admin', body: { title: 'string', content: 'string' } },
      'Reports - Delete': { method: 'DELETE', path: '/reports/{id}', requiresAuth: true, userType: 'admin', params: ['id'] },
      'Storage - Upload File': { method: 'POST', path: '/storage/upload', requiresAuth: true, userType: 'admin', body: 'FormData' },
      'Storage - Get File': { method: 'GET', path: '/storage/{filename}', requiresAuth: true, userType: 'admin', params: ['filename'] },
    },
    '🌐 Public APIs': {
      'Health Check': { method: 'GET', path: '/health', requiresAuth: false, userType: 'public' },
      'CORS Test': { method: 'GET', path: '/test-cors', requiresAuth: false, userType: 'public' },
    },
  };

  useEffect(() => {
    const currentToken = getToken();
    if (currentToken) {
      setTokenState(currentToken);
      setAuthenticated(true);
    }
  }, []);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const loginPath = loginType === 'admin' ? '/auth/admin/login' : '/auth/user/login';
      const res = await api.post(loginPath, {
        email: loginEmail,
        password: loginPassword,
      });

      if (res.data && res.data.token) {
        const newToken = res.data.token;
        setToken(newToken);
        setTokenState(newToken);
        setAuthenticated(true);
        Swal.fire({
          icon: 'success',
          title: 'Authenticated!',
          text: 'You can now test authenticated endpoints.',
          timer: 2000,
        });
      } else {
        throw new Error('No token received');
      }
    } catch (error) {
      console.error('Login error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: error.response?.data?.detail || error.message || 'Invalid credentials',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    setTokenState('');
    setAuthenticated(false);
    Swal.fire({
      icon: 'success',
      title: 'Logged Out',
      text: 'You have been logged out.',
      timer: 1500,
    });
  };

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const selectEndpoint = (endpointName, endpoint) => {
    setSelectedEndpoint({ name: endpointName, ...endpoint });
    // Initialize request body with example if available
    if (endpoint.body && typeof endpoint.body === 'object') {
      setRequestBody(JSON.stringify(endpoint.body, null, 2));
    } else {
      setRequestBody('');
    }
    setQueryParams('');
    setResponse(null);
  };

  const replacePathParams = (path, params) => {
    let newPath = path;
    if (params) {
      params.forEach(param => {
        const value = prompt(`Enter value for parameter: ${param}`);
        if (value) {
          newPath = newPath.replace(`{${param}}`, value);
        }
      });
    }
    return newPath;
  };

  const buildQueryString = (queryString) => {
    if (!queryString || !queryString.trim()) return '';
    const params = new URLSearchParams();
    queryString.split('&').forEach(param => {
      const [key, value] = param.split('=');
      if (key && value) {
        params.append(key.trim(), value.trim());
      }
    });
    return params.toString();
  };

  const executeRequest = async () => {
    if (!selectedEndpoint) {
      Swal.fire({
        icon: 'warning',
        title: 'No Endpoint Selected',
        text: 'Please select an endpoint first.',
      });
      return;
    }

    if (selectedEndpoint.requiresAuth && !authenticated) {
      Swal.fire({
        icon: 'warning',
        title: 'Authentication Required',
        text: 'Please login first to test this endpoint.',
      });
      return;
    }

    try {
      setLoading(true);
      setResponse(null);

      let path = selectedEndpoint.path;
      
      // Replace path parameters
      if (selectedEndpoint.params) {
        path = replacePathParams(path, selectedEndpoint.params);
      }

      // Build query string
      const queryString = buildQueryString(queryParams);
      if (queryString) {
        path += `?${queryString}`;
      }

      // Prepare request config
      const config = {};
      let body = null;

      // Parse request body if provided
      if (requestBody && requestBody.trim()) {
        try {
          body = JSON.parse(requestBody);
        } catch (e) {
          Swal.fire({
            icon: 'error',
            title: 'Invalid JSON',
            text: 'Request body must be valid JSON.',
          });
          setLoading(false);
          return;
        }
      }

      // Execute request based on method
      let res;
      const method = selectedEndpoint.method.toLowerCase();
      
      switch (method) {
        case 'get':
          res = await api.get(path, config);
          break;
        case 'post':
          res = await api.post(path, body || {}, config);
          break;
        case 'put':
          res = await api.put(path, body || {}, config);
          break;
        case 'delete':
          res = await api.delete(path, config);
          break;
        case 'patch':
          res = await api.patch(path, body || {}, config);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
        data: res.data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      setResponse({
        status: error.response?.status || 'Error',
        statusText: error.response?.statusText || error.message,
        headers: error.response?.headers || {},
        data: error.response?.data || { error: error.message },
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const executeCustomRequest = async () => {
    if (!customEndpoint.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'No Endpoint',
        text: 'Please enter an endpoint path.',
      });
      return;
    }

    const [method, ...pathParts] = customEndpoint.trim().split(' ');
    const path = pathParts.join(' ');

    if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Method',
        text: 'Method must be GET, POST, PUT, DELETE, or PATCH.',
      });
      return;
    }

    try {
      setLoading(true);
      setResponse(null);

      let body = null;
      if (requestBody && requestBody.trim()) {
        try {
          body = JSON.parse(requestBody);
        } catch (e) {
          Swal.fire({
            icon: 'error',
            title: 'Invalid JSON',
            text: 'Request body must be valid JSON.',
          });
          setLoading(false);
          return;
        }
      }

      const queryString = buildQueryString(queryParams);
      const fullPath = queryString ? `${path}?${queryString}` : path;

      let res;
      const methodLower = method.toLowerCase();
      
      switch (methodLower) {
        case 'get':
          res = await api.get(fullPath);
          break;
        case 'post':
          res = await api.post(fullPath, body || {});
          break;
        case 'put':
          res = await api.put(fullPath, body || {});
          break;
        case 'delete':
          res = await api.delete(fullPath);
          break;
        case 'patch':
          res = await api.patch(fullPath, body || {});
          break;
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
        data: res.data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      setResponse({
        status: error.response?.status || 'Error',
        statusText: error.response?.statusText || error.message,
        headers: error.response?.headers || {},
        data: error.response?.data || { error: error.message },
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    Swal.fire({
      icon: 'success',
      title: 'Copied!',
      text: 'Copied to clipboard',
      timer: 1000,
    });
  };

  const formatJSON = (obj) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return String(obj);
    }
  };

  const getMethodColor = (method) => {
    const colors = {
      'GET': '#61affe',
      'POST': '#49cc90',
      'PUT': '#fca130',
      'DELETE': '#f93e3e',
      'PATCH': '#50e3c2',
    };
    return colors[method] || '#000';
  };

  return (
    <div className="api-tester-container" style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px' }}>
      <div className="mb-4">
        <h1 className="display-5 fw-bold mb-2">API Tester</h1>
        <p className="text-muted">Test and explore all API endpoints</p>
      </div>
      
      <div className="row">
        {/* Left Sidebar - Authentication & Endpoints */}
        <div className="col-lg-3">
          <div className="card mb-3">
            <div className="card-header bg-primary text-white">
              <h5 className="">
                {authenticated ? <FaLock className="me-1" /> : <FaUnlock className="me-1" />}
                Authentication
              </h5>
            </div>
            <div className="card-body">
              {!authenticated ? (
                <>
                  <div className="mb-3">
                    <label className="form-label">Login Type</label>
                    <select 
                      className="form-select" 
                      value={loginType} 
                      onChange={(e) => setLoginType(e.target.value)}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Password"
                    />
                  </div>
                  <button
                    className="btn btn-primary w-100"
                    onClick={handleLogin}
                    disabled={loading || !loginEmail || !loginPassword}
                  >
                    {loading ? 'Logging in...' : 'Login'}
                  </button>
                </>
              ) : (
                <>
                  <div className="mb-3">
                    <label className="form-label">Token</label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        value={token.substring(0, 20) + '...'}
                        readOnly
                      />
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => copyToClipboard(token)}
                        title="Copy full token"
                      >
                        <FaCopy />
                      </button>
                    </div>
                  </div>
                  <button
                    className="btn btn-danger w-100"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Endpoints List */}
          <div className="card">
            <div className="card-header bg-secondary text-white">
              <h5 className="">API Endpoints</h5>
            </div>
            <div className="card-body p-0" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {Object.entries(apiEndpoints).map(([groupName, endpoints]) => {
                const firstEndpoint = Object.values(endpoints)[0];
                const userType = firstEndpoint?.userType || 'public';
                const groupColor = userType === 'user' ? '#28a745' : userType === 'admin' ? '#dc3545' : '#6c757d';
                
                return (
                  <div key={groupName} className="endpoint-group">
                    <div
                      className="endpoint-group-header"
                      onClick={() => toggleGroup(groupName)}
                      style={{ 
                        borderLeft: `4px solid ${groupColor}`,
                        backgroundColor: userType === 'user' ? '#f0f9f4' : userType === 'admin' ? '#fff5f5' : '#f8f9fa'
                      }}
                    >
                      <span style={{ fontWeight: 'bold' }}>{groupName}</span>
                      {expandedGroups[groupName] ? <FaChevronUp /> : <FaChevronDown />}
                    </div>
                    {expandedGroups[groupName] && (
                      <div className="endpoint-list">
                        {Object.entries(endpoints).map(([endpointName, endpoint]) => (
                          <div
                            key={endpointName}
                            className={`endpoint-item ${selectedEndpoint?.name === endpointName ? 'active' : ''}`}
                            onClick={() => selectEndpoint(endpointName, endpoint)}
                          >
                            <span
                              className="method-badge"
                              style={{ backgroundColor: getMethodColor(endpoint.method) }}
                            >
                              {endpoint.method}
                            </span>
                            <span className="endpoint-name">{endpointName}</span>
                            {endpoint.requiresAuth && <FaLock className="ms-auto" size={10} />}
                            {endpoint.userType && (
                              <span 
                                className="badge ms-2"
                                style={{ 
                                  backgroundColor: endpoint.userType === 'user' ? '#28a745' : endpoint.userType === 'admin' ? '#dc3545' : '#6c757d',
                                  color: 'white',
                                  fontSize: '9px',
                                  padding: '2px 6px'
                                }}
                              >
                                {endpoint.userType}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side - Request/Response */}
        <div className="col-lg-9">
          <div className="card">
            <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
              <h5 className="">Request Builder</h5>
              <div>
                <input
                  type="text"
                  className="form-control form-control-sm d-inline-block"
                  style={{ width: '300px' }}
                  placeholder="Custom: GET /endpoint/path"
                  value={customEndpoint}
                  onChange={(e) => setCustomEndpoint(e.target.value)}
                />
              </div>
            </div>
            <div className="card-body">
              {selectedEndpoint ? (
                <>
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <span
                        className="method-badge me-1"
                        style={{ backgroundColor: getMethodColor(selectedEndpoint.method) }}
                      >
                        {selectedEndpoint.method}
                      </span>
                      <code className="flex-grow-1">{API_BASE}{selectedEndpoint.path}</code>
                      {selectedEndpoint.requiresAuth && (
                        <span className="badge bg-warning text-dark ms-2">
                          <FaLock size={10} className="me-1" />
                          Auth Required
                        </span>
                      )}
                    </div>
                    {selectedEndpoint.body && (
                      <div className="alert alert-info">
                        <small>
                          <strong>Expected Body:</strong> {typeof selectedEndpoint.body === 'object' 
                            ? JSON.stringify(selectedEndpoint.body, null, 2) 
                            : selectedEndpoint.body}
                        </small>
                      </div>
                    )}
                  </div>

                  {selectedEndpoint.query && (
                    <div className="mb-3">
                      <label className="form-label">Query Parameters</label>
                      <input
                        type="text"
                        className="form-control"
                        value={queryParams}
                        onChange={(e) => setQueryParams(e.target.value)}
                        placeholder="key1=value1&key2=value2"
                      />
                      <small className="text-muted">Format: key=value&key2=value2</small>
                    </div>
                  )}

                  {['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) && (
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label ">Request Body (JSON)</label>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => copyToClipboard(requestBody)}
                        >
                          <FaCopy /> Copy
                        </button>
                      </div>
                      <textarea
                        className="form-control font-monospace"
                        rows="10"
                        value={requestBody}
                        onChange={(e) => setRequestBody(e.target.value)}
                        placeholder='{"key": "value"}'
                      />
                    </div>
                  )}

                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-success"
                      onClick={executeRequest}
                      disabled={loading}
                    >
                      <FaPlay className="me-1" />
                      {loading ? 'Sending...' : 'Send Request'}
                    </button>
                    {customEndpoint && (
                      <button
                        className="btn btn-primary"
                        onClick={executeCustomRequest}
                        disabled={loading}
                      >
                        <FaPlay className="me-1" />
                        Execute Custom
                      </button>
                    )}
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setRequestBody('');
                        setQueryParams('');
                        setResponse(null);
                      }}
                    >
                      <FaTrash className="me-1" />
                      Clear
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted py-5">
                  <FaCode size={48} className="mb-3" />
                  <p>Select an endpoint from the sidebar to start testing</p>
                </div>
              )}
            </div>
          </div>

          {/* Response Section */}
          {response && (
            <div className="card mt-3">
              <div className={`card-header text-white ${response.status >= 200 && response.status < 300 ? 'bg-success' : 'bg-danger'}`}>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="">
                    Response
                    {response.status >= 200 && response.status < 300 ? (
                      <FaCheck className="ms-2" />
                    ) : (
                      <FaTimes className="ms-2" />
                    )}
                  </h5>
                  <div>
                    <span className="badge bg-light text-dark me-1">
                      Status: {response.status} {response.statusText}
                    </span>
                    <button
                      className="btn btn-sm btn-light"
                      onClick={() => copyToClipboard(formatJSON(response))}
                    >
                      <FaCopy /> Copy Response
                    </button>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <strong>Timestamp:</strong> {new Date(response.timestamp).toLocaleString()}
                </div>
                
                <div className="mb-3">
                  <strong>Response Headers:</strong>
                  <pre className="bg-light p-2 rounded mt-2" style={{ fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}>
                    {formatJSON(response.headers)}
                  </pre>
                </div>

                <div>
                  <strong>Response Body:</strong>
                  <pre className="bg-light p-3 rounded mt-2" style={{ fontSize: '12px', maxHeight: '500px', overflow: 'auto' }}>
                    {formatJSON(response.data)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiTester;

