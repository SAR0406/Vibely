'use client';

import { Suspense } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import ChatLayout from '@/components/app/chat-layout';
import { Loader2 } from 'lucide-react';

function ChatPageContent() {
  const { user, isUserLoading, userError } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If loading is finished and there's no user, redirect to login
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // While loading auth state, show a full-screen loader
  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  // If there's an error, you might want to show an error message
  if (userError) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <p className="text-destructive">Something went wrong. Please try refreshing.</p>
        </div>
    );
  }

  // If user is authenticated, render the chat layout
  if (user) {
    return <ChatLayout />;
  }

  // Fallback for the brief moment before redirection happens
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  )
}
