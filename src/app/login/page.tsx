import { Suspense } from "react";
import { LoginForm, LoginShell } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginShell />}>
      <LoginForm />
    </Suspense>
  );
}
