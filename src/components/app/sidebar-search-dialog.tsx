'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { UserAvatar } from './user-avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { useDebounce } from '@/hooks/use-debounce';

type SidebarSearchDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  currentUser: User;
  onSelectUser: (user: User) => void;
};

export function SidebarSearchDialog({
  isOpen,
  onOpenChange,
  currentUser,
  onSelectUser,
}: SidebarSearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !debouncedSearchTerm) return null;
    
    return query(
      collection(firestore, 'users'),
      where('userCode', '==', debouncedSearchTerm),
      where('id', '!=', currentUser.id)
    );
  }, [firestore, debouncedSearchTerm, currentUser.id]);

  const { data: users, isLoading } = useCollection<User>(usersQuery);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="font-headline">Search Users</DialogTitle>
          <DialogDescription>
            Find and start a conversation by entering a user's unique code (e.g. "username#1234").
          </DialogDescription>
        </DialogHeader>
        <div className="px-6">
          <Input
            placeholder="Enter user code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <ScrollArea className="h-80">
          <div className="p-6 pt-2">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isLoading && debouncedSearchTerm && (!users || users.length === 0) && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No user found with that code.
              </p>
            )}
            <div className="space-y-2">
              {users && users.map((user) => (
                <Button
                  key={user.id}
                  variant="ghost"
                  className="flex h-auto w-full cursor-pointer items-center justify-start gap-3 p-2 text-left"
                  onClick={() => onSelectUser(user)}
                >
                  <UserAvatar
                    src={user.avatarUrl}
                    name={user.fullName || 'User'}
                    isOnline={user.online}
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{user.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      @{user.username}
                    </p>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
