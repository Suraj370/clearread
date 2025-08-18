'use client'

import { useAuth } from "@/context/AuthProvider";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [displayName, setDisplayName] = useState<string | null>(null);

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
        } catch (err: any) {
          console.error("Failed to fetch user data:", err.message);
          setDisplayName(user.email || "User");
        }
      };
      fetchUserData();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err: any) {
      console.error("Logout failed:", err.message);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null; // AuthProvider handles redirect to /login
  }

  return (
  <main className=" max-w-7xl mx-auto mt-12">
    <div className=" flex items-center justify-between border-b-2 ">
      <div className="max-w-md flex flex-col items-center ">
        <h1 className="text-2xl font-bold mb-4">
          Welcome, {displayName || "Loading..."}!
        </h1>
        
        <p className="mb-4">This is your dashboard.</p>
        </div>
        
        <button
          onClick={handleLogout}
          className=" bg-red-500 text-white p-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
      <div className="mt-3">
        
      </div>
  </main>
  );
}