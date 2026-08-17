import Image from "next/image";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-subtle px-4">
      <div className="w-full max-w-[400px] rounded-lg border border-border bg-surface p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Image
            src="/nile-logo.png"
            alt="Nile"
            width={52}
            height={26}
            style={{ height: "26px", width: "auto" }}
            priority
          />
          <div>
            <h1 className="text-lg font-semi text-text-primary">Sign in to Initiative Tracker</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Use the email and password your admin gave you.
            </p>
          </div>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
