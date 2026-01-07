'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { collection, query, where, or, and, limit } from 'firebase/firestore';
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
    
    const term = debouncedSearchTerm.toLowerCase();
    // A simple query to search for users by name or username
    // Note: Firestore does not support case-insensitive queries natively.
    // For a robust solution, you'd typically store a lowercase version of the fields.
    // This query is a basic example and might not be performant on large datasets
    // without proper indexing.
    return query(
      collection(firestore, 'users'),
      and(
        where('id', '!=', currentUser.id), // Exclude current user
        or(
            where('username', '>=', term),
            where('username', '<=', term + '\uf8ff')
        )
      ),
      limit(10)
    );
  }, [firestore, debouncedSearchTerm, currentUser.id]);

  const { data: users, isLoading } = useCollection<User>(usersQuery);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  const filteredUsers = useMemo(() => {
    if (!users || !debouncedSearchTerm) return [];
    const term = debouncedSearchTerm.toLowerCase();
    return users.filter(u => 
        u.fullName?.toLowerCase().includes(term) || 
        u.username?.toLowerCase().includes(term)
    );
  }, [users, debouncedSearchTerm]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="font-headline">Search Users</DialogTitle>
          <DialogDescription>
            Find and start a conversation with anyone on the platform.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6">
          <Input
            placeholder="Search by name or username..."
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
            {!isLoading && debouncedSearchTerm && filteredUsers.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No users found.
              </p>
            )}
            <div className="space-y-2">
              {filteredUsers.map((user) => (
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
