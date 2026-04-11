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

interface AssignRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableRoles: { id: string; name: string; key: string }[];
  onConfirm: (roleId: string) => void;
  loading?: boolean;
}

export function AssignRoleDialog({
  open,
  onOpenChange,
  availableRoles,
  onConfirm,
  loading = false,
}: AssignRoleDialogProps) {
  const [selectedRoleId, setSelectedRoleId] = useState('');

  const handleConfirm = () => {
    if (selectedRoleId) {
      onConfirm(selectedRoleId);
      setSelectedRoleId('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Role</DialogTitle>
          <DialogDescription>
            Select a role to assign to this user. This action is audited and requires recent authentication.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="role-select">Role</Label>
          <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
            <SelectTrigger id="role-select">
              <SelectValue placeholder="Select a role…" />
            </SelectTrigger>
            <SelectContent>
              {availableRoles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name} <span className="text-muted-foreground">({role.key})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedRoleId || loading}>
            {loading ? 'Assigning…' : 'Assign Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
