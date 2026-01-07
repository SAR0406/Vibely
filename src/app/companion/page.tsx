'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Bot, Trash2, Edit } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, where, doc } from 'firebase/firestore';
import type { Companion } from '@/lib/types';
import { UserAvatar } from '@/components/app/user-avatar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteCompanion } from '@/firebase/companions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const CompanionCard = ({ companion, onDelete }: { companion: Companion, onDelete: (id: string) => void }) => {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { toast } = useToast();

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteCompanion(companion.id);
            toast({
                title: "Companion Deleted",
                description: `${companion.name} has been removed.`,
            });
            onDelete(companion.id);
        } catch (error) {
            console.error("Error deleting companion:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete companion. Please try again.",
            });
        } finally {
            setIsDeleting(false);
            setIsConfirmOpen(false);
        }
    };
    
    return (
        <>
            <Card className="flex flex-col">
                <CardHeader className="flex-row items-start gap-4">
                    <UserAvatar src={companion.avatarUrl} name={companion.name} className="size-12" />
                    <div>
                        <CardTitle className="font-headline text-xl">{companion.name}</CardTitle>
                        <CardDescription className="line-clamp-2">{companion.persona}</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow">
                    <div className="text-sm text-muted-foreground space-y-2">
                        <p><strong className="font-semibold text-foreground">Voice:</strong> {companion.voice}</p>
                        <p><strong className="font-semibold text-foreground">Tools:</strong> {companion.tools.join(', ') || 'None'}</p>
                    </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                    <Button variant="outline" className="w-full">
                        <Edit className="mr-2 size-4" /> Edit
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => setIsConfirmOpen(true)}>
                        <Trash2 className="size-4" />
                        <span className="sr-only">Delete</span>
                    </Button>
                </CardFooter>
            </Card>
            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                    This will permanently delete the AI Companion "{companion.name}". This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting && <Loader2 className="mr-2 size-4 animate-spin" />}
                        Continue
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};


export default function CompanionPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const companionsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, 'companions'), where('ownerId', '==', user.uid));
    }, [user, firestore]);

    const { data: companions, isLoading: companionsLoading } = useCollection<Companion>(companionsQuery);
    
    // Local state to manage UI without waiting for Firestore sync
    const [localCompanions, setLocalCompanions] = useState<Companion[] | null>(null);

    // Sync local state with Firestore data
    useState(() => {
        if (companions) {
            setLocalCompanions(companions);
        }
    }, [companions]);

    const handleCompanionDeleted = (deletedId: string) => {
        setLocalCompanions(prev => prev ? prev.filter(c => c.id !== deletedId) : null);
    };

    if (isUserLoading || companionsLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    if (!user) {
        router.push('/login');
        return null;
    }
    
    const displayCompanions = localCompanions ?? companions;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold font-headline">My AI Companions</h1>
                <Button onClick={() => router.push('/companion/new')}>
                    <PlusCircle className="mr-2 size-4" />
                    Create New Companion
                </Button>
            </div>
            
            {displayCompanions && displayCompanions.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <Bot className="mx-auto size-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No Companions Yet</h3>
                    <p className="mt-2 text-sm text-muted-foreground">Get started by creating your first AI companion.</p>
                    <Button className="mt-4" onClick={() => router.push('/companion/new')}>Create Companion</Button>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {displayCompanions?.map((companion) => (
                        <CompanionCard key={companion.id} companion={companion} onDelete={handleCompanionDeleted} />
                    ))}
                </div>
            )}
        </div>
    );
}
