'use client'
import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import SubmitButton from "@/components/SubmitButton";



interface AuthState {
  error: string | null;
  success: string | null;
}

// Signup action
async function signupAction(
  _prevState: AuthState,
  { formData, formRef }: { formData: FormData; formRef: React.RefObject<HTMLFormElement>  }
): Promise<AuthState> {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const displayName = formData.get("displayName") as string;

    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password.trim());
    await setDoc(doc(db, "users", userCredential.user.uid), {
      email: email.trim(),
      displayName: displayName.trim(),
      createdAt: new Date().toISOString(),
    });

    // Reset form on success
    if (formRef.current) {
      formRef.current.reset();
    }

    return { error: null, success: "User created successfully!" };
  } catch (err: any) {
    return { error: err.message, success: null };
  }
}

// Signup component
export default function Signup() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    (prevState: AuthState, formData: FormData) => signupAction(prevState, { formData, formRef }),
    { error: null, success: null }
  );

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Sign Up</h2>
      {state.error && <p className="text-red-500 mb-4">{state.error}</p>}
      {state.success && <p className="text-green-500 mb-4">{state.success}</p>}
      <form ref={formRef} action={formAction} className="space-y-4">
        <div>
          <label htmlFor="displayName" className="block mb-1">Name</label>
          <input type="text" name="displayName" className="w-full p-2 border rounded" required />
        </div>
        <div>
          <label htmlFor="email" className="block mb-1">Email</label>
          <input type="email" name="email" className="w-full p-2 border rounded" required />
        </div>
        <div>
          <label htmlFor="password" className="block mb-1">Password</label>
          <input type="password" name="password" className="w-full p-2 border rounded" required />
        </div>
        <SubmitButton defaultText="Sign Up" loadingText="Signing up..." />
      </form>
    </div>
  );
}

// Login action
async function loginAction(
  _prevState: AuthState,
  { formData, formRef }: { formData: FormData; formRef: React.RefObject<HTMLFormElement> }
): Promise<AuthState> {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    await signInWithEmailAndPassword(auth, email, password);

    // Reset form on success
    if (formRef.current) {
      formRef.current.reset();
    }

    return { error: null, success: "Logged in successfully!" };
  } catch (err: any) {
    return { error: err.message, success: null };
  }
}

// Login component
export function Login() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    (prevState: AuthState, formData: FormData) => loginAction(prevState, { formData, formRef }),
    { error: null, success: null }
  );

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      {state.error && <p className="text-red-500 mb-4">{state.error}</p>}
      {state.success && <p className="text-green-500 mb-4">{state.success}</p>}
      <form ref={formRef} action={formAction} className="space-y-4">
        <div>
          <label htmlFor="email" className="block mb-1">Email</label>
          <input type="email" name="email" className="w-full p-2 border rounded" required />
        </div>
        <div>
          <label htmlFor="password" className="block mb-1">Password</label>
          <input type="password" name="password" className="w-full p-2 border rounded" required />
        </div>
        <SubmitButton defaultText="Login" loadingText="Logging in..." />
      </form>
    </div>
  );
}