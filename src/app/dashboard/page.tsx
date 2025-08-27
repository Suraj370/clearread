"use client";

import { useAuth } from "@/context/AuthProvider";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "firebase/auth";
import Link from "next/link";

// Define the Document type
interface Document {
  id: string;
  name?: string;
  creationDate?:
    | string
    | { _seconds: number; _nanoseconds: number }
    | { toDate: () => Date };
  originalText?: string;
  userId?: string;
}

// Define the Auth context type for better type safety
interface AuthContext {
  user: User | null;
  loading: boolean;
}

export default function Dashboard() {
  const { user, loading } = useAuth() as AuthContext;
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setDisplayName(userDoc.data().displayName || user.email || "User");
          } else {
            setDisplayName(user.email || "User");
          }
        } catch (err: unknown) {
          console.error("Failed to fetch user data:", (err as Error).message);
          setDisplayName(user.email || "User");
        }
      };

      const fetchDocuments = async () => {
        const userDocs = await fetchDocument(user.uid);
        setDocuments(userDocs);
      };

      fetchUserData();
      fetchDocuments();
    }
  }, [user]);

  const fetchDocument = async (userId: string): Promise<Document[]> => {
    try {
      const documentsRef = collection(db, "documents");
      const q = query(documentsRef, where("userId", "==", userId));
      const snapshot = await getDocs(q);
      
      const userDocs = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            creationDate: doc.data().timestamp,
            ...doc.data(),
          } as Document)
      );
      return userDocs;
    } catch (err: unknown) {
      console.error("Failed to fetch documents:", (err as Error).message);
      return [];
    }
  };

  const createNewDocument = async () => {
  if (!user) return;
  setError(null);
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const response = await fetch(`${apiUrl}/create-document/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.uid }),
    });
    if (!response.ok) {
      throw new Error("Failed to create document");
    }
    const data = await response.json();
    console.log("New document data:", data); // Log API response
    console.log("Current documents:", documents); // Log current state
    if (documents.some(doc => doc.id === data.id)) {
      console.warn("Duplicate document ID detected:", data.id);
      setError("A document with this ID already exists.");
      return;
    }
    const userDocs = await fetchDocument(user.uid);
    console.log("Updated documents:", userDocs); // Log updated state
    setDocuments(userDocs);
  } catch (err: unknown) {
    console.error("Failed to create document:", (err as Error).message);
    setError("Failed to create document. Please try again.");
  }
};
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err: unknown) {
      console.error("Logout failed:", (err as Error).message);
    }
  };

  const formatTimestamp = (timestamp?: Document["creationDate"]): string => {
    if (!timestamp) return "N/A";
    if (typeof timestamp === "string") {
      // Handle ISO string format
      return new Date(timestamp).toLocaleDateString();
    }
    if (
      typeof timestamp === "object" &&
      "_seconds" in timestamp &&
      "_nanoseconds" in timestamp
    ) {
      // Handle raw timestamp dictionary
      return new Date(timestamp._seconds * 1000).toLocaleDateString();
    }
    if (typeof timestamp === "object" && "toDate" in timestamp) {
      // Handle Firestore Timestamp
      return timestamp.toDate().toLocaleDateString();
    }
    return "N/A";
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <main className="max-w-7xl mx-auto mt-12">
      <div className="flex items-center justify-between border-b-2 pb-4">
        <div className="max-w-md flex flex-col items-center">
          <h1 className="text-2xl font-bold mb-4">
            Welcome, {displayName || "Loading..."}!
          </h1>
          <p className="mb-4">This is your dashboard.</p>
        </div>
        <Button className="bg-amber-700" onClick={handleLogout}>
          Logout
        </Button>
      </div>
      <div>
        <h2 className="text-xl font-bold">Your Documents</h2>
        <p className="mt-2">Here you can manage your documents.</p>
        <Button className="mt-2 bg-amber-700" onClick={createNewDocument}>
          Create New Document
        </Button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-4">
        {documents.length > 0 ? (
          documents.map((doc) => {
            return (
              <Link href={`/document/${doc.id}`} key={doc.id} className="no-underline">
                <Card
                  key={doc.id}
                  className="cursor-pointer hover:bg-gray-100"
                >
                <CardHeader>
                  <CardTitle>{doc.name || "Untitled Document"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Created: {formatTimestamp(doc.creationDate)}</p>
                  <p>
                    {doc.originalText
                      ? doc.originalText.substring(0, 100) + "..."
                      : "No content"}
                  </p>
                </CardContent>
              </Card>
              </Link>
            );
          })
        ) : (
          <p>No documents found. Create a new one to get started!</p>
        )}
      </div>
    </main>
  );
}
