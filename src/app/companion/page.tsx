'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Bot } from 'lucide-react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';

export default function CompanionPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const [companions, setCompanions] = useState([]); // Placeholder for actual companions

    if (isUserLoading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        router.push('/login');
        return null;
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold font-headline">My AI Companions</h1>
                <Button onClick={() => router.push('/companion/new')}>
                    <PlusCircle className="mr-2 size-4" />
                    Create New Companion
                </Button>
            </div>
            
            {companions.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <Bot className="mx-auto size-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No Companions Yet</h3>
                    <p className="mt-2 text-sm text-muted-foreground">Get started by creating your first AI companion.</p>
                    <Button className="mt-4" onClick={() => router.push('/companion/new')}>Create Companion</Button>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Map over companions here */}
                </div>
            )}
        </div>
    );
}
