
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

interface AuthState {
  error: string | null;
  success: string | null;
}

export async function loginAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    await signInWithEmailAndPassword(auth, email.trim(), password.trim());

    return { error: null, success: "Logged in successfully!" };
  } catch (err: any) {
    let errorMessage = "An error occurred during login.";
    if (err.code === "auth/invalid-credential") {
      errorMessage = "Invalid email or password.";
    } else if (err.code === "auth/invalid-email") {
      errorMessage = "Invalid email address.";
    } else if (err.code === "auth/too-many-requests") {
      errorMessage = "Too many login attempts. Please try again later.";
    }
    return { error: errorMessage, success: null };
  }
}

export async function signupAction(
  _prevState: AuthState,
  formData: FormData
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

    return { error: null, success: "User created successfully!" };
  } catch (err: any) {
    let errorMessage = "An error occurred during signup.";
    if (err.code === "auth/email-already-in-use") {
      errorMessage = "This email is already registered.";
    } else if (err.code === "auth/weak-password") {
      errorMessage = "Password is too weak. Please use a stronger password.";
    } else if (err.code === "auth/invalid-email") {
      errorMessage = "Invalid email address.";
    }
    return { error: errorMessage, success: null };
  }
}