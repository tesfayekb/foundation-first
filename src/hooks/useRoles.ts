import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RoleListItem {
  id: string;
  key: string;
  name: string;
  description: string | null;
  is_base: boolean;
  is_immutable: boolean;
  created_at: string;
  updated_at: string;
  permission_count: number;
  user_count: number;
}

export interface PermissionListItem {
  id: string;
  key: string;
  description: string | null;
  created_at: string;
  role_names: string[];
}

export interface RoleDetail extends RoleListItem {
  permissions: { id: string; key: string; description: string | null }[];
  users: { id: string; display_name: string | null; assigned_at: string }[];
}

async function fetchRoles(): Promise<RoleListItem[]> {
  const { data: roles, error } = await supabase
    .from('roles')
    .select('id, key, name, description, is_base, is_immutable, created_at, updated_at')
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);

  // Get permission counts per role
  const { data: rpData } = await supabase
    .from('role_permissions')
    .select('role_id');

  const permCounts = new Map<string, number>();
  for (const rp of rpData ?? []) {
    permCounts.set(rp.role_id, (permCounts.get(rp.role_id) ?? 0) + 1);
  }

  // Get user counts per role
  const { data: urData } = await supabase
    .from('user_roles')
    .select('role_id');

  const userCounts = new Map<string, number>();
  for (const ur of urData ?? []) {
    userCounts.set(ur.role_id, (userCounts.get(ur.role_id) ?? 0) + 1);
  }

  return (roles ?? []).map((r) => ({
    ...r,
    permission_count: permCounts.get(r.id) ?? 0,
    user_count: userCounts.get(r.id) ?? 0,
  }));
}

async function fetchRoleDetail(roleId: string): Promise<RoleDetail> {
  const { data: role, error } = await supabase
    .from('roles')
    .select('id, key, name, description, is_base, is_immutable, created_at, updated_at')
    .eq('id', roleId)
    .single();

  if (error || !role) throw new Error(error?.message ?? 'Role not found');

  // Get permissions for this role
  const { data: rpData } = await supabase
    .from('role_permissions')
    .select('permission_id, permissions(id, key, description)')
    .eq('role_id', roleId);

  const permissions = (rpData ?? []).map((rp: any) => ({
    id: rp.permissions?.id ?? rp.permission_id,
    key: rp.permissions?.key ?? '',
    description: rp.permissions?.description ?? null,
  }));

  // Get users with this role
  const { data: urData } = await supabase
    .from('user_roles')
    .select('user_id, assigned_at')
    .eq('role_id', roleId);

  let users: RoleDetail['users'] = [];
  if (urData && urData.length > 0) {
    const userIds = urData.map((ur) => ur.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds);

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));
    users = urData.map((ur) => ({
      id: ur.user_id,
      display_name: profileMap.get(ur.user_id) ?? null,
      assigned_at: ur.assigned_at,
    }));
  }

  return {
    ...role,
    permission_count: permissions.length,
    user_count: users.length,
    permissions,
    users,
  };
}

async function fetchPermissions(): Promise<PermissionListItem[]> {
  const { data: perms, error } = await supabase
    .from('permissions')
    .select('id, key, description, created_at')
    .order('key', { ascending: true });

  if (error) throw new Error(error.message);

  // Get role names per permission
  const { data: rpData } = await supabase
    .from('role_permissions')
    .select('permission_id, roles(name)');

  const roleNamesMap = new Map<string, string[]>();
  for (const rp of (rpData ?? []) as any[]) {
    const existing = roleNamesMap.get(rp.permission_id) ?? [];
    if (rp.roles?.name) existing.push(rp.roles.name);
    roleNamesMap.set(rp.permission_id, existing);
  }

  return (perms ?? []).map((p) => ({
    ...p,
    role_names: roleNamesMap.get(p.id) ?? [],
  }));
}

export function useRoles() {
  return useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: fetchRoles,
    staleTime: 30_000,
  });
}

export function useRoleDetail(roleId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'role', roleId],
    queryFn: () => fetchRoleDetail(roleId!),
    enabled: !!roleId,
    staleTime: 30_000,
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: ['admin', 'permissions'],
    queryFn: fetchPermissions,
    staleTime: 30_000,
  });
}
