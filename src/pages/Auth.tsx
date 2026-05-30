import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import Input from "../components/Input";
import PlanTreeLogo from "../components/PlanTreeLogo";
import { createAccount, loginWithCredentials } from "../services/authApi";
import { setAuthToken, setAuthUser } from "../services/http";

type AuthMode = "login" | "register";

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [village, setVillage] = useState("");
  const [mandal, setMandal] = useState("");
  const [district, setDistrict] = useState("");
  const [stateName, setStateName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  const resetFeedback = () => {
    setError(undefined);
    setMessage(undefined);
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setPassword("");
    setConfirmPassword("");
    resetFeedback();
  };

  const handleLogin = async () => {
    setLoading(true);
    resetFeedback();

    try {
      const result = await loginWithCredentials(username, password);
      setAuthToken(result.token);
      setAuthUser(result.user);
      navigate("/");
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : "Unable to login",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    setLoading(true);
    resetFeedback();

    if (!name.trim()) {
      setLoading(false);
      setError("Enter your full name.");
      return;
    }

    if (!username.trim()) {
      setLoading(false);
      setError("Choose a username.");
      return;
    }

    if (!email.trim()) {
      setLoading(false);
      setError("Enter your email address.");
      return;
    }

    if (
      !village.trim() ||
      !mandal.trim() ||
      !district.trim() ||
      !stateName.trim()
    ) {
      setLoading(false);
      setError("Enter village, mandal, district, and state.");
      return;
    }

    if (
      password.length < 8 ||
      !/[A-Za-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      setLoading(false);
      setError(
        "Password must be at least 8 characters and include a letter and number.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setLoading(false);
      setError("Passwords do not match.");
      return;
    }

    try {
      const result = await createAccount({
        name,
        username,
        email,
        village,
        mandal,
        district,
        state: stateName,
        password,
      });
      setMessage(result.message);
      setMode("login");
      setConfirmPassword("");
    } catch (registerError) {
      setError(
        registerError instanceof Error
          ? registerError.message
          : "Unable to create account",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isRegister) {
      void handleCreateAccount();
      return;
    }

    void handleLogin();
  };

  return (
    <section className="min-h-[100dvh] px-3 py-4 sm:px-4 sm:py-6">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-md flex-col justify-center gap-4 sm:min-h-[calc(100dvh-3rem)]">
        <div className="flex flex-col items-center text-center">
          <PlanTreeLogo className="h-14 w-14 sm:h-16 sm:w-16" />
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            PlanTree
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Plant. Share. Earn badges.
          </p>
        </div>

        <Card className="rounded-[1.5rem] p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                mode === "login"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                mode === "register"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Create
            </button>
          </div>

          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            {isRegister ? (
              <Input
                type="text"
                autoComplete="name"
                placeholder="Full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            ) : null}

            <Input
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />

            {isRegister ? (
              <Input
                type="email"
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                placeholder="Email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            ) : null}

            {isRegister ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  type="text"
                  autoComplete="address-level4"
                  placeholder="Village / Town"
                  value={village}
                  onChange={(event) => setVillage(event.target.value)}
                />
                <Input
                  type="text"
                  autoComplete="address-level3"
                  placeholder="Mandal"
                  value={mandal}
                  onChange={(event) => setMandal(event.target.value)}
                />
                <Input
                  type="text"
                  autoComplete="address-level2"
                  placeholder="District"
                  value={district}
                  onChange={(event) => setDistrict(event.target.value)}
                />
                <Input
                  type="text"
                  autoComplete="address-level1"
                  placeholder="State"
                  value={stateName}
                  onChange={(event) => setStateName(event.target.value)}
                />
              </div>
            ) : null}

            <Input
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            {isRegister ? (
              <>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />

                <Button
                  type="submit"
                  disabled={
                    !name.trim() ||
                    !username.trim() ||
                    !email.trim() ||
                    !village.trim() ||
                    !mandal.trim() ||
                    !district.trim() ||
                    !stateName.trim() ||
                    !password ||
                    !confirmPassword ||
                    loading
                  }
                >
                  {loading ? "Creating..." : "Create Account"}
                </Button>
              </>
            ) : (
              <Button
                type="submit"
                disabled={!username.trim() || !password || loading}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
            )}

            {message ? (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {message}
              </p>
            ) : null}
            {error ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            ) : null}
          </form>
        </Card>
      </div>
    </section>
  );
}
