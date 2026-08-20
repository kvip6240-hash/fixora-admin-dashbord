import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, forwardRef } from "react";
import { Eye, EyeOff, Loader2, AlertCircle, Building2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [{ title: "Login — Fixora Admin" }],
  }),
});

// Reusable Input Component
const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }
>(({ label, error, className = "", ...props }, ref) => {
  return (
    <div className="space-y-1.5 w-full">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="relative">
        <input
          ref={ref}
          className={`w-full h-10 px-3 py-2 rounded-lg border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
            error
              ? "border-destructive focus:ring-destructive/20 focus:border-destructive"
              : "border-border"
          } ${className}`}
          {...props}
        />
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-destructive mt-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
});
Input.displayName = "Input";

// Loading Spinner Component
function Spinner({ className = "" }: { className?: string }) {
  return <Loader2 className={`w-4 h-4 animate-spin ${className}`} />;
}

// Reusable Button Component (extended for loading)
function Button({
  children,
  isLoading,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { isLoading?: boolean }) {
  return (
    <button
      disabled={isLoading || props.disabled}
      className={`relative w-full h-10 flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition-all hover:bg-primary/90 disabled:opacity-70 disabled:pointer-events-none overflow-hidden ${className}`}
      {...props}
    >
      {isLoading ? <Spinner /> : children}

      {/* Subtle shine effect */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent hover:animate-[shine_1.5s_ease-in-out_infinite]" />
    </button>
  );
}

function LoginPage() {
  const navigate = useNavigate(); // Using useNavigate below

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        },
      );

      const data = await response.json();
      setIsLoading(false);

      if (response.ok && data.success) {
        localStorage.setItem("fixora_token", data.token);
        localStorage.setItem("fixora_user", JSON.stringify(data.user));
        navigate({ to: "/" });
      } else {
        setErrors({ general: data.message || "Invalid email or password" });
      }
    } catch (error) {
      setIsLoading(false);
      setErrors({
        general: "Unable to connect to the server. Please ensure the backend is running.",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-secondary/30">
      {/* Dynamic Background Pattern */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />

      <div className="flex-1 flex items-center justify-center p-4 z-10">
        <div className="w-full max-w-[420px]">
          {/* Logo Area */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20 mb-4">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Fixora Admin</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
          </div>

          {/* Login Card */}
          <div className="bg-card border border-border shadow-2xl shadow-black/5 rounded-2xl overflow-hidden backdrop-blur-xl">
            <div className="p-8">
              {errors.general && (
                <div className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{errors.general}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5" noValidate>
                <Input
                  label="Email address"
                  type="email"
                  placeholder="admin@fixora.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  error={errors.email}
                  disabled={isLoading}
                  autoComplete="email"
                />

                <div className="space-y-1.5 relative">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">Password</label>
                    <a
                      href="#"
                      className="text-xs font-medium text-primary hover:underline hover:text-primary/80 transition-colors"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors({ ...errors, password: undefined });
                      }}
                      disabled={isLoading}
                      autoComplete="current-password"
                      className={`w-full h-10 pl-3 pr-10 py-2 rounded-lg border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                        errors.password
                          ? "border-destructive focus:ring-destructive/20 focus:border-destructive"
                          : "border-border"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <div className="flex items-center gap-1.5 text-xs text-destructive mt-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.password}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-background bg-card cursor-pointer"
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm text-muted-foreground cursor-pointer select-none"
                  >
                    Remember me for 30 days
                  </label>
                </div>

                <div className="pt-2">
                  <Button type="submit" isLoading={isLoading}>
                    Sign in to dashboard
                  </Button>
                </div>
              </form>
            </div>

            {/* Card Footer */}
            <div className="px-8 py-4 bg-secondary/30 border-t border-border flex justify-center">
              <p className="text-xs text-muted-foreground text-center">
                Protected by enterprise-grade security. <br className="sm:hidden" />
                <a href="#" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
