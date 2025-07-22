import { UserProfile } from "@clerk/clerk-react";

export default function UserProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <UserProfile path="/profile" routing="path" />
    </div>
  );
}
