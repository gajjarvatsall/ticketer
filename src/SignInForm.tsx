import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "./contexts/AuthContext";

export default function SignInForm() {
  const { login, register } = useAuth();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      if (flow === "signIn") {
        await login(email, password);
        toast.success("Signed in successfully!");
      } else {
        const firstName = formData.get("firstName") as string;
        const lastName = formData.get("lastName") as string;
        await register({ email, password, firstName, lastName });
        toast.success("Signed up successfully!");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        (flow === "signIn"
          ? "Could not sign in. Please check your credentials."
          : "Could not sign up. Please try again.");
      toast.error(errorMessage);
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {flow === "signUp" && (
          <>
            <input
              className="auth-input-field"
              type="text"
              name="firstName"
              placeholder="First Name"
              required
            />
            <input
              className="auth-input-field"
              type="text"
              name="lastName"
              placeholder="Last Name"
              required
            />
          </>
        )}
        <input
          className="auth-input-field"
          type="email"
          name="email"
          placeholder="Email"
          required
        />
        <input
          className="auth-input-field"
          type="password"
          name="password"
          placeholder="Password"
          minLength={6}
          required
        />
        <button className="auth-button" type="submit" disabled={submitting}>
          {submitting
            ? "Processing..."
            : flow === "signIn"
            ? "Sign in"
            : "Sign up"}
        </button>
        <div className="text-center text-sm text-gray-600">
          <span>
            {flow === "signIn"
              ? "Don't have an account? "
              : "Already have an account? "}
          </span>
          <button
            type="button"
            className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
          </button>
        </div>
      </form>
    </div>
  );
}
