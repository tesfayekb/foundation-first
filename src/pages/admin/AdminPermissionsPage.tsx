import { useMemo } from 'react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataTable, DataTableColumn } from '@/components/dashboard/DataTable';
import { LoadingSkeleton } from '@/components/dashboard/LoadingSkeleton';
import { ErrorState } from '@/components/dashboard/ErrorState';
import { Badge } from '@/components/ui/badge';
import { usePermissions, PermissionListItem } from '@/hooks/useRoles';

export default function AdminPermissionsPage() {
  const { data: permissions, isLoading, error, refetch } = usePermissions();

  const columns: DataTableColumn<PermissionListItem>[] = useMemo(() => [
    {
      key: 'key',
      header: 'Permission',
      cell: (row) => (
        <span className="text-sm font-medium font-mono text-foreground">{row.key}</span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row.description ?? '—'}</span>
      ),
    },
    {
      key: 'roles',
      header: 'Assigned To',
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.role_names.length > 0 ? (
            row.role_names.map((name) => (
              <Badge key={name} variant="secondary" className="text-xs">
                {name}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      ),
      className: 'w-48',
    },
  ], []);

  return (
    <>
      <PageHeader title="Permissions" subtitle="View all system permissions and their role assignments." />

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={10} />
      ) : error ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={permissions ?? []}
          emptyTitle="No permissions found"
          emptyDescription="No permissions have been created yet."
        />
      )}
    </>
  );
}
