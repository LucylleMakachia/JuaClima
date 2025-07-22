import { SignUp } from "@clerk/clerk-react";

export default function SignUpPage() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <SignUp path="/sign-up" routing="path" />
    </div>
  );
}
