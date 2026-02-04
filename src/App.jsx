import React, { useState, useEffect, useLayoutEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import MainLayout from './layouts/MainLayout/MainLayout';
import Home from './pages/AdminHome/Home';
import DashboardContent from './pages/AdminDashboard/DashboardContent';
import FirmComparison from './pages/AdminDashboard/FirmComparison';
import Assessment from './pages/AdminAssessment/Assessment';
import ManageAssessment from './pages/AdminAssessment/ManageAssessment';
import ManageAssessmentV2 from './pages/AdminAssessment/ManageAssessmentV2';
import AdminAllResponses from './pages/AdminAssessment/AdminAllResponses';
import ManageUsers from './pages/UserManagement/ManageUsers';
import AdminUsers from './pages/UserManagement/AdminUsers';
import AdminUserProfile from './pages/UserManagement/AdminUserProfile';
import AdminUserProfilePage from './pages/UserManagement/AdminUserProfilePage';
import AdminMyProfile from './pages/UserManagement/AdminMyProfile';
import AdminProfile from './pages/AdminProfile/AdminProfile';
import ManageLearningMaterialsUnified from './pages/AdminLearningMaterials/ManageLearningMaterialsUnified';
import LearningMaterialsEditor from './pages/AdminLearningMaterials/LearningMaterialsEditor';
import EditMaterial from './pages/AdminLearningMaterials/EditMaterials';
import PreviewMaterial from './pages/AdminLearningMaterials/PreviewMaterial';
import LearningMaterialsSectionEditor from './pages/AdminLearningMaterials/LearningMaterialsSectionEditor';
import LearningMaterialsSectionPreview from './pages/AdminLearningMaterials/LearningMaterialsSectionPreview';
import ManageEvents from './pages/AdminEvents/ManageEvents';
import EventEditor from './pages/AdminEvents/EventEditor';
import PreviewEvent from './pages/AdminEvents/PreviewEvent';
import ManageAbout from './pages/AdminStaticPages/ManageAbout';
import ManagePKSlestari from './pages/AdminStaticPages/ManagePKSlestari';
import ManageFooter from './pages/AdminStaticPages/ManageFooter';
import ManageRegistrationTC from './pages/AdminStaticPages/ManageRegistrationTC';
import ManageESGReportingResources from './pages/AdminStaticPages/ManageESGReportingResources';
import FaqManagement from './pages/AdminSupport/FaqManagement';
import Feedback from './pages/AdminSupport/Feedback';
import ManageAchievements from './pages/AdminSupport/ManageAchievements';
import ApiTester from './pages/AdminSupport/ApiTester';
import InfoSetup from './pages/AdminSupport/InfoSetup';
import Landing from './pages/Landing/Landing';
import 'leaflet/dist/leaflet.css';
import './style.css';
import Login from './pages/Authentication/User/Login';
import AdminLogin from './pages/Authentication/Admin/AdminLogin';
import Register from './pages/Authentication/User/Register';
import AdminRegister from './pages/Authentication/Admin/AdminRegister';
import UserDashboardContent from './pages/UserDashboard/UserDashboardContent';
import UserAssessment from './pages/UserAssessment/UserAssessment';
import UserAssessmentResult from './pages/UserAssessment/UserAssessmentResult';
import UserAssessmentV2 from './pages/UserAssessment/UserAssessmentV2';
import UserLearningCenter from './pages/UserLearningCenter/UserLearningCenter';
import LearningMaterials from './pages/UserLearningCenter/LearningMaterials';
import UserLearningMaterialDetail from './pages/UserLearningCenter/LearningMaterialDetail';
import UserAchievement from './pages/UserAchievement/UserAchievement';
import UserEvents from './pages/UserEvents/ESG_Events';
import ESG_EventsPreview from './pages/UserEvents/ESG_EventsPreview';
import UserSupport from './pages/UserSupport/UserSupport';
import UserFAQ from './pages/UserSupport/UserFAQ';
import UserReport from './pages/UserReport/UserReport';
import UserChatbot from './pages/UserSupport/UserChatbot';
import UserFeedback from './pages/UserSupport/UserFeedback';
import UserProfile from './pages/UserProfile/UserProfile';
import UserVerification from './pages/UserProfile/UserVerification';
import UserMyAssessments from './pages/UserAssessment/UserMyAssessment';
import AssessmentDetails from './pages/UserAssessment/AssessmentDetails';
import AssessmentDetailsV2 from './pages/UserAssessment/AssessmentDetailsV2';
import AssessmentHistory from './pages/UserAssessment/AssessmentHistory';
import AdminAssessmentV2 from './pages/AdminAssessment/AdminAssessmentV2';
import AdminAssessmentDetailsV2 from './pages/AdminAssessment/AdminAssessmentDetailsV2';
import AdminFirmAssessments from './pages/AdminAssessment/AdminFirmAssessments';
import ViewAssessmentForms from './pages/AdminAssessment/ViewAssessmentForms';
import ManageReport from './pages/AdminManageReport/ManageReport';
import { LearningMaterials as PublicLearningMaterials, LearningMaterialDetail, ContactUs, Events, EventPreview, About, PKSlestari } from './pages/Landing';
import ESG_Events from './pages/UserEvents/ESG_Events';
import api from './utils/api';
import LandingLayout from './layouts/LandingLayout/LandingLayout';
import SuperAdminRegisterInit from './pages/Authentication/Admin/SuperAdminRegisterInit';
import Forgotpassword from './pages/Authentication/User/Forgotpassword';
import ForgotAdminPassword from './pages/Authentication/Admin/ForgotAdminPassword';
import VerifyEmail from './pages/Authentication/User/VerifyEmail';
import { initTextScaling, TEXT_SCALE_CONFIG } from './utils/textScale';
import { validateRoleIntegrity, validateRoleFallback } from './utils/roleValidation';
import { getToken } from './utils/api';
function useSessionAutoCheck() {
  useEffect(() => {
    const interval = setInterval(async () => {
      const token = getToken();
      if (token) {
        try {
          await api.get('/session/validate');
        } catch (err) {
          // Error handled by interceptor
        }
      }
    }, 30 * 60 * 1000); // 30 minutes
    return () => clearInterval(interval);
  }, []);
}

function PrivateRoute({ children }) {
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const validateAccess = async () => {
      if (!token) {
        setIsAuthorized(false);
        setIsValidating(false);
        return;
      }

      // Validate role from server to prevent tampering
      const validation = await validateRoleIntegrity().catch(() => 
        validateRoleFallback()
      );

      if (validation.isValid && validation.role === 'user') {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
        // Clear invalid session
        localStorage.removeItem('token');
        sessionStorage.removeItem('user_role');
      }
      setIsValidating(false);
    };

    validateAccess();
  }, [token]);

  if (isValidating) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Validating access...</span>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
}

function AdminRoute({ children }) {
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const token = localStorage.getItem('token');
  const admin_services_role_access = ['admin', 'super_admin'];

  useEffect(() => {
    const validateAccess = async () => {
      if (!token) {
        setIsAuthorized(false);
        setIsValidating(false);
        return;
      }

      // Validate role from server to prevent tampering
      const validation = await validateRoleIntegrity().catch(() => 
        validateRoleFallback()
      );

      if (validation.isValid && admin_services_role_access.includes(validation.role)) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
        // Clear invalid session
        localStorage.removeItem('token');
        sessionStorage.removeItem('user_role');
      }
      setIsValidating(false);
    };

    validateAccess();
  }, [token]);

  if (isValidating) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Validating access...</span>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/admin/login" replace />;
  }

  return children ? children : <Outlet />;
}

function App() {
  useSessionAutoCheck();
  
  // Initialize dynamic text scaling - use useLayoutEffect for immediate synchronous update
  // You can customize the scale limits by passing a config object:
  // initTextScaling({ minScale: 0.6, maxScale: 1.4, idealWidth: 2048 })
/*   useLayoutEffect(() => {
    const cleanup = initTextScaling();
    // Or use custom config: initTextScaling({ minScale: 0.6, maxScale: 1.4 })
    return cleanup;
  }, []); */

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<Forgotpassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/events" element={<LandingLayout><Events landing={true} /></LandingLayout>} />
        <Route path="/events/preview/:id" element={<LandingLayout><EventPreview /></LandingLayout>} />
        <Route path="/learning-materials" element={<LandingLayout><PublicLearningMaterials landing={true} /></LandingLayout>} />
        <Route path="/learning-materials/:id" element={<LandingLayout><LearningMaterialDetail /></LandingLayout>} />
        <Route path="/about" element={<LandingLayout><About /></LandingLayout>} />
        <Route path="/pkslestari" element={<LandingLayout><PKSlestari /></LandingLayout>} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/forgot-password" element={<ForgotAdminPassword />} />
        {/* <Route path="/admin/register" element={<MainLayout><AdminRegister /></MainLayout>} /> */}
        <Route path="/root/register-init" element={<SuperAdminRegisterInit />} />
        <Route path="/api-tester" element={<ApiTester />} />
        {/* Protected User Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<MainLayout><UserMyAssessments /></MainLayout>} />
          <Route path="/my-assessments" element={<MainLayout><UserMyAssessments /></MainLayout>} />
          <Route path="/assessment" element={<MainLayout><UserAssessment /></MainLayout>} />
          <Route path="/assessment-v2" element={<MainLayout><UserAssessmentV2 /></MainLayout>} />
          <Route path="/assessment-history" element={<MainLayout><AssessmentHistory /></MainLayout>} />
          <Route path="/assessment-details/:year" element={<MainLayout><AssessmentDetails /></MainLayout>} />
          <Route path="/assessment-details-v2/:year" element={<MainLayout><AssessmentDetailsV2 /></MainLayout>} />
          <Route path="/assessment/results" element={<MainLayout><UserAssessmentResult /></MainLayout>} />
          <Route path="/reports" element={<MainLayout><UserReport /></MainLayout>} />
          <Route path="/learning-centre" element={<MainLayout><UserLearningCenter /></MainLayout>} />
          <Route path="/learning-centre/material/:id" element={<MainLayout><UserLearningMaterialDetail /></MainLayout>} />
          <Route path="/user/events" element={<MainLayout><ESG_Events /></MainLayout>} />
          <Route path="/user/events/preview/:id" element={<MainLayout><ESG_EventsPreview /></MainLayout>} />
          <Route path="/achievements" element={<MainLayout><UserAchievement /></MainLayout>} />
          <Route path="/support" element={<MainLayout><UserSupport /></MainLayout>} />
          <Route path="/support/faq" element={<MainLayout><UserFAQ /></MainLayout>} />
          <Route path="/support/chatbot" element={<MainLayout><UserChatbot /></MainLayout>} />
          <Route path="/support/feedback" element={<MainLayout><UserFeedback /></MainLayout>} />
          <Route path="/profile" element={<MainLayout><UserProfile /></MainLayout>} />
          <Route path="/profile/verification" element={<MainLayout><UserVerification /></MainLayout>} />
        </Route>
        {/* Protected Admin Routes (excluding login/register) */}
        <Route path="/admin/*" element={<AdminRoute><AdminRoutes /></AdminRoute>} />
        </Routes>
      </Router>
  );
}

function AdminRoutes() {
  return (
    <Routes>
      <Route path="/register" element={<MainLayout><AdminRegister /></MainLayout>} />
      <Route path="/home" element={<MainLayout><Home /></MainLayout>} />
      <Route path="/dashboard" element={<MainLayout><DashboardContent /></MainLayout>} />
      <Route path="/firm-comparison" element={<MainLayout><FirmComparison /></MainLayout>} />
      <Route path="/assessment/assessment-performance" element={<MainLayout><Assessment /></MainLayout>} />
      <Route path="/assessment/manage" element={<MainLayout><ManageAssessment /></MainLayout>} />
      <Route path="/assessment/manage-v2" element={<MainLayout><ManageAssessmentV2 /></MainLayout>} />
      <Route path="/assessment/view-forms" element={<MainLayout><ViewAssessmentForms /></MainLayout>} />
      <Route path="/assessment/all-responses" element={<MainLayout><AdminAllResponses /></MainLayout>} />
      <Route path="/firm-assessments/:userId" element={<MainLayout><AdminFirmAssessments /></MainLayout>} />
      <Route path="/assessment-v2/:userId" element={<MainLayout><AdminAssessmentV2 /></MainLayout>} />
      <Route path="/assessment-details-v2/:userId/:year" element={<MainLayout><AdminAssessmentDetailsV2 /></MainLayout>} />
      <Route path="/manage-users" element={<MainLayout><ManageUsers /></MainLayout>} />
      <Route path="/user-profile/:userId" element={<MainLayout><AdminUserProfile /></MainLayout>} />
      <Route path="/admin-user-profile/:userId" element={<MainLayout><AdminUserProfilePage /></MainLayout>} />
      <Route path="my-profile" element={<MainLayout><AdminMyProfile /></MainLayout>} />
      <Route path="/admin-users" element={<MainLayout><AdminUsers /></MainLayout>} />
      <Route path="/profile" element={<MainLayout><AdminProfile /></MainLayout>} />
      <Route path="/learning-materials" element={<MainLayout><ManageLearningMaterialsUnified /></MainLayout>} />
      <Route path="/learning-editor" element={<MainLayout><LearningMaterialsEditor /></MainLayout>} />
      <Route path="/learning-materials/edit/:id" element={<MainLayout><EditMaterial /></MainLayout>} />
      <Route path="learning-materials/preview/:id" element={<PreviewMaterial />} />
      <Route path="/learning-materials-sections/new" element={<MainLayout><LearningMaterialsSectionEditor /></MainLayout>} />
      <Route path="/learning-materials-sections/edit/:id" element={<MainLayout><LearningMaterialsSectionEditor /></MainLayout>} />
      <Route path="/learning-materials-sections/preview/:id" element={<MainLayout><LearningMaterialsSectionPreview /></MainLayout>} />
                <Route path="/faq-management" element={<MainLayout><FaqManagement /></MainLayout>} />
                <Route path="/feedback" element={<MainLayout><Feedback /></MainLayout>} />
                <Route path="/info-setup" element={<MainLayout><InfoSetup /></MainLayout>} />
      <Route path="/manage-achievements" element={<MainLayout><ManageAchievements /></MainLayout>} />
      <Route path="/events" element={<MainLayout><ManageEvents /></MainLayout>} />
      <Route path="/events/new" element={<MainLayout><EventEditor /></MainLayout>} />
      <Route path="/events/edit/:id" element={<MainLayout><EventEditor /></MainLayout>} />
      <Route path="/events/preview/:id" element={<MainLayout><PreviewEvent /></MainLayout>} />
      <Route path="/pages/about" element={<MainLayout><ManageAbout /></MainLayout>} />
      <Route path="/pages/pkslestari" element={<MainLayout><ManagePKSlestari /></MainLayout>} />
      <Route path="/pages/footer" element={<MainLayout><ManageFooter /></MainLayout>} />
      <Route path="/pages/registration-tc" element={<MainLayout><ManageRegistrationTC /></MainLayout>} />
      <Route path="/pages/esg-reporting-resources" element={<MainLayout><ManageESGReportingResources /></MainLayout>} />
      <Route path="/manage-report" element={<MainLayout><ManageReport /></MainLayout>} />
    </Routes>
  );
}

export default App;
