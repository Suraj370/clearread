"use client";

import { useAuth } from "@/context/AuthProvider";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
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

// Define the Document type with proper Firestore timestamp typing
interface Document {
  id: string;
  name?: string;
  originalText?: string;
  convertedText?: string;
  userId?: string;
  timestamp?: Timestamp | { _seconds: number; _nanoseconds: number } | string;
}

// Define the Auth context type
interface AuthContext {
  user: User | null;
  loading: boolean;
}

// API response types
interface ConvertTextResponse {
  convertedText: string;
}

interface RenameDocumentResponse {
  newName: string;
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
              name: data.name,
              originalText: data.originalText,
              convertedText: data.convertedText,
              userId: data.userId,
              timestamp: data.timestamp,
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
          console.error("Failed to fetch document:", err instanceof Error ? err.message : String(err));
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
        throw new Error(`Failed to convert text: ${response.status} ${response.statusText}`);
      }
      
      const data: ConvertTextResponse = await response.json();
      setConvertedText(data.convertedText);
    } catch (err: unknown) {
      console.error("Failed to convert text:", err instanceof Error ? err.message : String(err));
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
        throw new Error(`Failed to rename document: ${response.status} ${response.statusText}`);
      }
      
      const data: RenameDocumentResponse = await response.json();
      setName(data.newName);
      setOldName(data.newName);
      setIsEditingName(false);
    } catch (err: unknown) {
      console.error("Failed to rename document:", err instanceof Error ? err.message : String(err));
      setError("Failed to rename document. Please try again.");
    }
  };

  const handleSaveOriginal = async () => {
    try {
      await updateDoc(doc(db, "documents", docId), {
        originalText,
      });
    } catch (err: unknown) {
      console.error("Failed to save original text:", err instanceof Error ? err.message : String(err));
      setError("Failed to save changes");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>{error || "Loading document..."}</div>
      </div>
    );
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
            className="text-2xl font-bold cursor-pointer hover:text-purple-600 transition-colors"
            onClick={() => setIsEditingName(true)}
            title="Click to edit document name"
          >
            {name}
          </h1>
        )}
        <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

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
              className="min-h-[300px] resize-y"
            />
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <Button onClick={handleSaveOriginal} variant="outline">
                Save Changes
              </Button>
              <Button onClick={handleConvertText} className="bg-purple-600 hover:bg-purple-700">
                Convert to Dyslexia-Friendly
              </Button>
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
              className="min-h-[300px] p-4 border rounded overflow-y-auto"
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
              {convertedText ? (
                convertedText.split("\n\n").map((paragraph, index) => (
                  <p key={index} className="mb-4 last:mb-0">
                    {paragraph}
                  </p>
                ))
              ) : (
                <p className="text-gray-500 italic">
                  Converted text will appear here after processing...
                </p>
              )}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="font-family">Font Family</Label>
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger id="font-family">
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
              <Label htmlFor="font-size">Font Size: {fontSize}px</Label>
              <Slider
                id="font-size"
                value={[fontSize]}
                onValueChange={(value) => setFontSize(value[0])}
                min={12}
                max={32}
                step={1}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="letter-spacing">Letter Spacing: {letterSpacing}em</Label>
              <Slider
                id="letter-spacing"
                value={[letterSpacing]}
                onValueChange={(value) => setLetterSpacing(value[0])}
                min={0}
                max={0.5}
                step={0.05}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="line-height">Line Height: {lineHeight}</Label>
              <Slider
                id="line-height"
                value={[lineHeight]}
                onValueChange={(value) => setLineHeight(value[0])}
                min={1}
                max={3}
                step={0.1}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="text-color">Text Color</Label>
              <Input
                id="text-color"
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-full h-10"
              />
            </div>

            <div>
              <Label htmlFor="bg-color">Background Color</Label>
              <Input
                id="bg-color"
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-full h-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}