import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ManagePermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availablePermissions: { id: string; key: string; description: string | null }[];
  onConfirm: (permissionId: string) => void;
  loading?: boolean;
}

export function ManagePermissionsDialog({
  open,
  onOpenChange,
  availablePermissions,
  onConfirm,
  loading = false,
}: ManagePermissionsDialogProps) {
  const [selectedPermissionId, setSelectedPermissionId] = useState('');

  const handleConfirm = () => {
    if (selectedPermissionId) {
      onConfirm(selectedPermissionId);
      setSelectedPermissionId('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Permission</DialogTitle>
          <DialogDescription>
            Select a permission to assign to this role. This action is audited and requires recent authentication.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="perm-select">Permission</Label>
          <Select value={selectedPermissionId} onValueChange={setSelectedPermissionId}>
            <SelectTrigger id="perm-select">
              <SelectValue placeholder="Select a permission…" />
            </SelectTrigger>
            <SelectContent>
              {availablePermissions.map((perm) => (
                <SelectItem key={perm.id} value={perm.id}>
                  {perm.key}
                  {perm.description && (
                    <span className="ml-2 text-muted-foreground">— {perm.description}</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedPermissionId || loading}>
            {loading ? 'Adding…' : 'Add Permission'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
