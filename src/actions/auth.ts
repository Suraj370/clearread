import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, AuthError } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

interface AuthState {
  error: string | null;
  success: string | null;
}

// Type guard to check if error is a Firebase Auth error
function isAuthError(error: unknown): error is AuthError {
  return typeof error === 'object' && error !== null && 'code' in error;
}

export async function loginAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Validate inputs
    if (!email || !password) {
      return { error: "Email and password are required.", success: null };
    }

    await signInWithEmailAndPassword(auth, email.trim(), password.trim());

    return { error: null, success: "Logged in successfully!" };
  } catch (err: unknown) {
    let errorMessage = "An error occurred during login.";
    
    if (isAuthError(err)) {
      switch (err.code) {
        case "auth/invalid-credential":
          errorMessage = "Invalid email or password.";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many login attempts. Please try again later.";
          break;
        case "auth/user-disabled":
          errorMessage = "This account has been disabled.";
          break;
        case "auth/user-not-found":
          errorMessage = "No account found with this email.";
          break;
        case "auth/wrong-password":
          errorMessage = "Invalid email or password.";
          break;
        default:
          errorMessage = `Authentication error: ${err.message}`;
      }
    } else if (err instanceof Error) {
      errorMessage = err.message;
    }
    
    console.error("Login error:", err);
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

    // Validate inputs
    if (!email || !password || !displayName) {
      return { error: "All fields are required.", success: null };
    }

    if (password.length < 6) {
      return { error: "Password must be at least 6 characters long.", success: null };
    }

    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      email.trim(), 
      password.trim()
    );
    
    // Save additional user data to Firestore
    await setDoc(doc(db, "users", userCredential.user.uid), {
      email: email.trim(),
      displayName: displayName.trim(),
      createdAt: new Date().toISOString(),
    });

    return { error: null, success: "User created successfully!" };
  } catch (err: unknown) {
    let errorMessage = "An error occurred during signup.";
    
    if (isAuthError(err)) {
      switch (err.code) {
        case "auth/email-already-in-use":
          errorMessage = "This email is already registered.";
          break;
        case "auth/weak-password":
          errorMessage = "Password is too weak. Please use a stronger password.";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address.";
          break;
        case "auth/operation-not-allowed":
          errorMessage = "Email/password accounts are not enabled.";
          break;
        default:
          errorMessage = `Authentication error: ${err.message}`;
      }
    } else if (err instanceof Error) {
      errorMessage = err.message;
    }
    
    console.error("Signup error:", err);
    return { error: errorMessage, success: null };
  }
}