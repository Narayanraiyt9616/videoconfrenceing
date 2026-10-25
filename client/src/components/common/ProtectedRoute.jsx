import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { GraduationCap, ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

export function ProtectedRoute({ children, allowedRoles = null, facultyOnly = false }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const location = useLocation();

  // 1. Loading state while checking token with backend
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-[#1E3A8A] flex items-center justify-center text-white shadow-lg animate-pulse mb-4">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h3 className="text-sm font-bold text-[#0F172A]">Authenticating CampusVerse Live...</h3>
        <p className="text-xs text-[#64748B] mt-1">Verifying university session credentials</p>
      </div>
    );
  }

  // 2. Unauthenticated check: Redirect to Login with target path
  if (!isAuthenticated || !user) {
    const redirectUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectUrl}`} replace />;
  }

  // 3. Role-based Access Control (RBAC)
  const userRole = user.role || 'student';
  const isAdmin = userRole === 'admin';

  let hasPermission = true;

  if (facultyOnly && !['faculty', 'admin'].includes(userRole)) {
    hasPermission = false;
  }

  if (allowedRoles && Array.isArray(allowedRoles) && !isAdmin) {
    if (!allowedRoles.includes(userRole)) {
      hasPermission = false;
    }
  }

  // 4. Access Denied State (when student tries to access faculty-only page or unauthorized route)
  if (!hasPermission) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#CBD5E1] p-6 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold uppercase">
              Insufficient Permissions
            </span>
            <h2 className="text-xl font-extrabold text-[#0F172A] mt-2">
              Access Denied
            </h2>
            <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
              This academic section is reserved for{' '}
              <strong className="text-[#1E3A8A]">
                {facultyOnly ? 'Faculty Members' : allowedRoles?.join(' or ')}
              </strong>
              . You are currently signed in as a{' '}
              <strong className="text-amber-700 capitalize">{userRole}</strong> ({user.name}).
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go to {userRole === 'faculty' ? 'Faculty' : 'Student'} Dashboard</span>
            </Link>

            <button
              onClick={() => logout()}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-4 h-4 text-[#64748B]" />
              <span>Switch Account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. Authorized: Render protected component
  return children;
}
