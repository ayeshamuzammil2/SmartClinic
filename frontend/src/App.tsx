import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute, { RoleRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import ToastContainer from './components/ToastContainer';
import Spinner from './components/Spinner';
import { roleHome } from './utils';

import Login from './pages/Login';
import Register from './pages/Register';

import PatientDashboard from './pages/patient/PatientDashboard';
import BookAppointment from './pages/patient/BookAppointment';
import PatientRecords from './pages/patient/PatientRecords';

import DoctorDashboard from './pages/doctor/DoctorDashboard';
import VisitView from './pages/doctor/VisitView';
import DoctorRecords from './pages/doctor/DoctorRecords';

import BookingBoard from './pages/reception/BookingBoard';
import WalkInBooking from './pages/reception/WalkInBooking';
import PreAuthTracker from './pages/reception/PreAuthTracker';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDoctors from './pages/admin/AdminDoctors';
import AdminRooms from './pages/admin/AdminRooms';

/** "/" → the signed-in user's dashboard, or /login. */
function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner block size={32} label="Loading SmartClinic…" />;
  return <Navigate to={user ? roleHome(user.role) : '/login'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route element={<RoleRoute role="patient" />}>
                <Route path="/patient" element={<PatientDashboard />} />
                <Route path="/patient/book" element={<BookAppointment />} />
                <Route path="/patient/records" element={<PatientRecords />} />
              </Route>

              <Route element={<RoleRoute role="doctor" />}>
                <Route path="/doctor" element={<DoctorDashboard />} />
                <Route path="/doctor/visit/:appointmentId" element={<VisitView />} />
                <Route path="/doctor/records" element={<DoctorRecords />} />
              </Route>

              <Route element={<RoleRoute role="receptionist" />}>
                <Route path="/reception" element={<BookingBoard />} />
                <Route path="/reception/walkin" element={<WalkInBooking />} />
                <Route path="/reception/preauth" element={<PreAuthTracker />} />
              </Route>

              <Route element={<RoleRoute role="admin" />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/doctors" element={<AdminDoctors />} />
                <Route path="/admin/rooms" element={<AdminRooms />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer />
      </AuthProvider>
    </BrowserRouter>
  );
}
