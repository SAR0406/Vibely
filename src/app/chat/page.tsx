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
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (userError) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p className="text-destructive">
          Something went wrong. Please try refreshing.
        </p>
      </div>
    );
  }

  if (user) {
    return <ChatLayout />;
  }

  // Fallback before navigation to login
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
