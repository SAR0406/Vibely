'use client';

import { doc, deleteDoc } from 'firebase/firestore';
import { initializeFirebase } from '.'; 

export async function deleteCompanion(companionId: string): Promise<void> {
  const { firestore } = initializeFirebase();
  if (!firestore) {
    throw new Error('Firestore is not initialized.');
  }

  const companionRef = doc(firestore, 'companions', companionId);
  
  try {
    await deleteDoc(companionRef);
  } catch (error) {
    console.error("Error deleting companion from Firestore: ", error);
    // Here you might want to re-throw the error or handle it in a specific way,
    // like showing a notification to the user.
    throw error;
  }
}
