'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserAvatar } from './user-avatar';
import { User, ChatRequest } from '@/lib/types';
import { MessageSquarePlus, Edit } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

type UserProfileDialogProps = {
  user: User | null;
  currentUser: User | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onStartChat: (user: User) => void;
};

export function UserProfileDialog({
  user,
  currentUser,
  isOpen,
  onOpenChange,
  onStartChat,
}: UserProfileDialogProps) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);

    const [fullName, setFullName] = useState(user?.fullName || '');
    const [username, setUsername] = useState(user?.username || '');

    useEffect(() => {
        if(isOpen) {
            setIsEditing(false); // Reset editing state on open
            setFullName(user?.fullName || '');
            setUsername(user?.username || '');
        }
    }, [isOpen, user]);

  if (!user || !currentUser) {
    return null;
  }
  
  const isViewingOwnProfile = user.id === currentUser.id;

  const handleSendChatRequest = () => {
    if (!firestore || !currentUser) return;
    const requestId = `req_${currentUser.id}_${user.id}`;
    const requestRef = doc(firestore, 'users', user.id, 'chatRequests', requestId);
    
    const requestData: Omit<ChatRequest, 'id'> = {
        fromUserId: currentUser.id,
        fromUserCode: currentUser.userCode!,
        fromFullName: currentUser.fullName!,
        fromAvatarUrl: currentUser.avatarUrl,
        status: 'pending',
        createdAt: serverTimestamp(),
    };

    setDocumentNonBlocking(requestRef, requestData, { merge: false });
    
    toast({
        title: "Request Sent!",
        description: `Your chat request has been sent to ${user.fullName}.`,
    });
    
    onOpenChange(false);
  };
  
  const handleSaveChanges = () => {
    if (!firestore || !isViewingOwnProfile) return;

    const userDocRef = doc(firestore, 'users', user.id);
    const userDirRef = doc(firestore, 'userDirectory', user.id);

    const newProfileData = {
        fullName: fullName,
        username: username,
    };
    
    const newDirectoryData = {
        fullName: fullName,
        searchableTerms: [
            ...new Set([
                username.toLowerCase(),
                fullName.toLowerCase(),
                ...fullName.toLowerCase().split(' ')
            ])
        ].filter(Boolean),
    }

    updateDocumentNonBlocking(userDocRef, newProfileData);
    updateDocumentNonBlocking(userDirRef, newDirectoryData);

    toast({
        title: "Profile Updated!",
        description: "Your changes have been saved.",
    });

    setIsEditing(false);
  }

  const dialogContent = isEditing ? (
    <>
      <DialogHeader className="items-center text-center">
        <UserAvatar
          src={user.avatarUrl}
          name={user.fullName || 'User'}
          className="size-24"
        />
         <DialogTitle className="font-headline text-2xl pt-4">
            Edit Profile
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)}/>
        </div>
         <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={username} onChange={e => setUsername(e.target.value)}/>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
        <Button onClick={handleSaveChanges}>Save Changes</Button>
      </DialogFooter>
    </>
  ) : (
    <>
       <DialogHeader className="items-center text-center">
          <UserAvatar
            src={user.avatarUrl}
            name={user.fullName || 'User'}
            isOnline={user.online}
            className="size-24"
          />
          <DialogTitle className="font-headline text-2xl pt-4">
            {user.fullName}
          </DialogTitle>
          <DialogDescription>{user.userCode}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
            {isViewingOwnProfile ? (
                <Button onClick={() => setIsEditing(true)} className="w-full">
                    <Edit className="mr-2 size-4" />
                    Edit Profile
                </Button>
            ) : (
                <Button onClick={handleSendChatRequest} className="w-full">
                    <MessageSquarePlus className="mr-2 size-4" />
                    Send Chat Request
                </Button>
            )}
        </DialogFooter>
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
       {dialogContent}
      </DialogContent>
    </Dialog>
  );
}
