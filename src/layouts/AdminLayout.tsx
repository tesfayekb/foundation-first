import { DashboardLayout } from './DashboardLayout';
import { adminNavigation } from '@/config/admin-navigation';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { RequirePermission } from '@/components/auth/RequirePermission';
import { AccessDenied } from '@/components/dashboard/AccessDenied';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/config/routes';

/**
 * AdminLayout renders the shell unconditionally (sidebar + header),
 * then permission-gates the content area.
 * AccessDenied renders INSIDE the shell so navigation remains usable.
 *
 * MFA enforcement: admins without MFA enrolled are redirected to /mfa-enroll.
 * This is independent of RequireAuth's challenge_required check — it catches
 * the case where MFA has never been set up at all.
 */
export function AdminLayout() {
  const { mfaStatus } = useAuth();
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}${location.hash}`;

  return (
    <RequireAuth>
      <RequireMfaForAdmin mfaStatus={mfaStatus} returnTo={returnTo}>
        <DashboardLayout sections={adminNavigation} title="Admin Console">
          <RequirePermission
            permission="admin.access"
            fallback={<AccessDenied message="You need admin access to view this page." />}
          >
            <Outlet />
          </RequirePermission>
        </DashboardLayout>
      </RequireMfaForAdmin>
    </RequireAuth>
  );
}

/**
 * Redirects to MFA enrollment if admin user has no MFA factors enrolled.
 * mfaStatus === 'none' means the user has never set up MFA.
 * RequireAuth already handles 'challenge_required' (enrolled but not verified).
 */
function RequireMfaForAdmin({
  mfaStatus,
  returnTo,
  children,
}: {
  mfaStatus: string;
  returnTo: string;
  children: React.ReactNode;
}) {
  if (mfaStatus === 'none') {
    return <Navigate to={ROUTES.MFA_ENROLL} replace state={{ returnTo }} />;
  }
  return <>{children}</>;
}
