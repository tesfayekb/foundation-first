import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { useUserRoles } from '@/hooks/useUserRoles';
import { LoadingSkeleton } from '@/components/dashboard/LoadingSkeleton';

/**
 * Post-login smart router — redirects based on role context.
 * RequireAuth (in App.tsx) handles unauthenticated → /sign-in redirect.
 *
 * - Admin users (admin.access permission) → /admin
 * - All other users → /dashboard
 */
const Index = () => {
  const { permissions, loading } = useUserRoles();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSkeleton variant="page" />
      </div>
    );
  }

  const isAdmin = permissions.includes('admin.access');

  return <Navigate to={isAdmin ? ROUTES.ADMIN : ROUTES.DASHBOARD} replace />;
};

export default Index;
