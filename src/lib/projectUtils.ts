import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "./firebase";

export async function createProject(name: string, initialFiles?: Record<string, string>) {
  if (!auth.currentUser) throw new Error("Not authenticated");

  const defaultFiles: Record<string, string> = {
    "App.tsx": `import React, { useState } from 'react';\n\nexport default function App() {\n  const [count, setCount] = useState(0);\n  return (\n    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>\n      <h1>Welcome to ${name}</h1>\n      <p>Start building your project here.</p>\n      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>\n    </div>\n  );\n}`,
    "index.css": `body { margin: 0; font-family: system-ui, sans-serif; }`
  };

  const docRef = await addDoc(collection(db, "projects"), {
    name,
    ownerId: auth.currentUser.uid,
    files: initialFiles || defaultFiles,
    status: "active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}
