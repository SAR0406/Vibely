'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Info } from 'lucide-react';
import { UserAvatar } from './user-avatar';
import { User } from '@/lib/types';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { useDebounce } from '@/hooks/use-debounce';
import { ScrollArea } from '../ui/scroll-area';

type FindPeopleDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSelectUser: (user: User) => void;
  currentUser: User;
};

export function FindPeopleDialog({
  isOpen,
  onOpenChange,
  onSelectUser,
  currentUser,
}: FindPeopleDialogProps) {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !debouncedSearchTerm) return null;
    return query(
      collection(firestore, 'userDirectory'),
      where('searchableTerms', 'array-contains', debouncedSearchTerm.toLowerCase()),
      limit(10)
    );
  }, [firestore, debouncedSearchTerm]);

  const { data: searchedUsers, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);
  
  useEffect(() => {
    if (isOpen) {
        setSearchTerm('');
    }
   }, [isOpen]);


  const displayedSearchResults = useMemo(() => {
    if (!searchedUsers) return [];
    return searchedUsers.filter(u => u.id !== currentUser?.id);
  }, [searchedUsers, currentUser]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Find People</DialogTitle>
          <DialogDescription>
            Search for users by their name or user code.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <Input
                placeholder="Search by name or user code..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
            <ScrollArea className="h-80 border rounded-md">
                 <div className="p-2">
                    {isLoadingUsers && <div className="flex justify-center p-4"><Loader2 className="size-5 animate-spin" /></div>}
                    {!isLoadingUsers && debouncedSearchTerm && displayedSearchResults.length === 0 && <p className='text-center text-sm text-muted-foreground p-4'>No users found.</p>}
                    {!isLoadingUsers && !debouncedSearchTerm && (
                        <div className='flex flex-col items-center justify-center text-center text-sm text-muted-foreground p-4 h-full'>
                            <Info className='size-5 mb-2'/>
                            <p>Start typing to search for people to chat with.</p>
                        </div>
                    )}
                    {displayedSearchResults.map(u => (
                        <Button
                            type="button"
                            key={u.id}
                            variant={'ghost'}
                            className="w-full justify-start h-auto p-2"
                            onClick={() => onSelectUser(u)}
                        >
                            <UserAvatar src={u.avatarUrl} name={u.fullName || 'User'} className="mr-2" />
                            <div>
                                <p>{u.fullName}</p>
                                <p className='text-xs text-muted-foreground text-left'>{u.userCode}</p>
                            </div>
                        </Button>
                    ))}
                </div>
            </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
