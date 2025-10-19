import { useAuth } from "./contexts/AuthContext";
import { toast } from "sonner";

export default function SignOutButton() {
  const { logout, user } = useAuth();

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      await logout();
      toast.success("Signed out successfully!");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  return (
    <button
      className="px-4 py-2 rounded bg-white text-gray-700 border border-gray-200 font-semibold hover:bg-gray-50 transition-colors shadow-sm hover:shadow"
      onClick={handleSignOut}
    >
      Sign out
    </button>
  );
}
