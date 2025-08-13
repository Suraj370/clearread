import React from 'react'
import { useFormStatus } from 'react-dom';
interface SubmitButtonProps {
  defaultText: string;
  loadingText: string;
}
function SubmitButton({ defaultText, loadingText }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
    >
      {pending ? loadingText : defaultText}
    </button>
  );
}
    
export default SubmitButton