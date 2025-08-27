"use client";

import { useAuth } from "@/context/AuthProvider";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { User } from "firebase/auth";

// Note: Add OpenDyslexic font to your project.
// Download from https://antijingoist.itch.io/opendyslexic
// Place font files in public/fonts/ and add to globals.css:
// @font-face {
//   font-family: 'OpenDyslexic';
//   src: url('/fonts/OpenDyslexic-Regular.woff2') format('woff2');
//   font-weight: normal;
//   font-style: normal;
// }

// Define the Document type
interface Document {
  id: string;
  name?: string;
  originalText?: string;
  convertedText?: string;
  userId?: string;
  timestamp?: any; // Firestore timestamp
}

// Define the Auth context type
interface AuthContext {
  user: User | null;
  loading: boolean;
}

export default function DocumentPage() {
  const { user, loading } = useAuth() as AuthContext;
  const [document, setDocument] = useState<Document | null>(null);
  const [originalText, setOriginalText] = useState<string>("");
  const [convertedText, setConvertedText] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [oldName, setOldName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [fontFamily, setFontFamily] = useState<string>("Arial");
  const [fontSize, setFontSize] = useState<number>(16);
  const [letterSpacing, setLetterSpacing] = useState<number>(0.1);
  const [lineHeight, setLineHeight] = useState<number>(1.5);
  const [textColor, setTextColor] = useState<string>("#333333"); // Off-black
  const [bgColor, setBgColor] = useState<string>("#f9f9f9"); // Off-white/cream
  const router = useRouter();
  const params = useParams();
  const docId = params.id as string;

  useEffect(() => {
    if (user && docId) {
      const fetchSingleDocument = async () => {
        try {
          const docRef = doc(db, "documents", docId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.userId !== user.uid) {
              throw new Error("Unauthorized access");
            }
            const docData: Document = {
              id: docSnap.id,
              ...data,
            };
            setDocument(docData);
            setOriginalText(data.originalText || "");
            setConvertedText(data.convertedText || "");
            setName(data.name || "Untitled Document");
            setOldName(data.name || "Untitled Document");
          } else {
            setError("Document not found");
          }
        } catch (err: unknown) {
          console.error("Failed to fetch document:", (err as Error).message);
          setError("Failed to load document");
        }
      };
      fetchSingleDocument();
    }
  }, [user, docId]);

  const handleConvertText = async () => {
    if (!user || !originalText) return;
    setError(null);
    try {
      // Save originalText to Firestore first
      await updateDoc(doc(db, "documents", docId), {
        originalText,
      });

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/convert-text/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, originalText }),
      });
      if (!response.ok) {
        throw new Error("Failed to convert text");
      }
      const data = await response.json();
      setConvertedText(data.convertedText);
    } catch (err: unknown) {
      console.error("Failed to convert text:", (err as Error).message);
      setError("Failed to convert text. Please try again.");
    }
  };

  const handleRename = async () => {
    if (!user || name === oldName) return;
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/rename-document/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          docId,
          oldName: oldName,
          newName: name,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to rename document");
      }
      const data = await response.json();
      setName(data.newName);
      setOldName(data.newName);
      setIsEditingName(false);
    } catch (err: unknown) {
      console.error("Failed to rename document:", (err as Error).message);
      setError("Failed to rename document. Please try again.");
    }
  };

  const handleSaveOriginal = async () => {
    try {
      await updateDoc(doc(db, "documents", docId), {
        originalText,
      });
    } catch (err: unknown) {
      console.error("Failed to save original text:", (err as Error).message);
      setError("Failed to save changes");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  if (!document) {
    return <div>{error || "Loading document..."}</div>;
  }

  return (
    <main className="max-w-7xl mx-auto mt-12 p-4">
      <div className="flex items-center justify-between mb-6">
        {isEditingName ? (
          <div className="flex items-center space-x-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-2xl font-bold"
            />
            <Button onClick={handleRename}>Save</Button>
            <Button variant="outline" onClick={() => setIsEditingName(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <h1
            className="text-2xl font-bold cursor-pointer"
            onClick={() => setIsEditingName(true)}
          >
            {name}
          </h1>
        )}
        <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original Text */}
        <Card>
          <CardHeader>
            <CardTitle>Original Text</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
              placeholder="Enter your text here..."
              className="min-h-[300px]"
            />
            <div className="mt-4 flex space-x-2">
              <Button onClick={handleSaveOriginal}>Save Changes</Button>
              <Button onClick={handleConvertText}>Convert to Dyslexia-Friendly</Button>
            </div>
          </CardContent>
        </Card>

        {/* Converted Text with Adjustments */}
        <Card>
          <CardHeader>
            <CardTitle>Converted Text</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="min-h-[300px] p-4 border rounded"
              style={{
                fontFamily,
                fontSize: `${fontSize}px`,
                letterSpacing: `${letterSpacing}em`,
                lineHeight: lineHeight,
                color: textColor,
                backgroundColor: bgColor,
                textAlign: "left",
                maxWidth: "70ch", // Keep lines short
              }}
            >
              {convertedText.split("\n\n").map((paragraph, index) => (
                <p key={index} className="mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Font and Style Adjustments */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Customization Tools for Readability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Font Family</Label>
            <Select value={fontFamily} onValueChange={setFontFamily}>
              <SelectTrigger>
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Arial">Arial</SelectItem>
                <SelectItem value="Helvetica">Helvetica</SelectItem>
                <SelectItem value="Verdana">Verdana</SelectItem>
                <SelectItem value="OpenDyslexic">OpenDyslexic</SelectItem>
                <SelectItem value="'Comic Sans MS', cursive">Comic Sans</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Font Size: {fontSize}px</Label>
            <Slider
              value={[fontSize]}
              onValueChange={(value) => setFontSize(value[0])}
              min={12}
              max={32}
              step={1}
            />
          </div>

          <div>
            <Label>Letter Spacing: {letterSpacing}em</Label>
            <Slider
              value={[letterSpacing]}
              onValueChange={(value) => setLetterSpacing(value[0])}
              min={0}
              max={0.5}
              step={0.05}
            />
          </div>

          <div>
            <Label>Line Height: {lineHeight}</Label>
            <Slider
              value={[lineHeight]}
              onValueChange={(value) => setLineHeight(value[0])}
              min={1}
              max={3}
              step={0.1}
            />
          </div>

          <div>
            <Label>Text Color</Label>
            <Input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
            />
          </div>

          <div>
            <Label>Background Color</Label>
            <Input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}