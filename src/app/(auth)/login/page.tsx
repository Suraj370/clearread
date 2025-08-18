'use client'

import { useActionState, useRef, useEffect } from "react";
import SubmitButton from "@/components/SubmitButton";
import { loginAction } from "@/actions/auth";


export default function Login() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(loginAction, {
    error: null,
    success: null,
  });

  // Reset form on successful login
  useEffect(() => {
    if (state.success && formRef.current) {
      formRef.current.reset();
    }
  }, [state.success]);

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      {state.error && <p className="text-red-500 mb-4">{state.error}</p>}
      {state.success && <p className="text-green-500 mb-4">{state.success}</p>}
      <form ref={formRef} action={formAction} className="space-y-4">
        <div>
          <label htmlFor="email" className="block mb-1">Email</label>
          <input
            type="email"
            name="email"
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block mb-1">Password</label>
          <input
            type="password"
            name="password"
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <SubmitButton defaultText="Login" loadingText="Logging in..." />
      </form>
    </div>
  );
}