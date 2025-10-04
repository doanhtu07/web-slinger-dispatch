import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { AlertCircle, Shield, User } from "lucide-react";

export function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isOfficerLogin, setIsOfficerLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [badgeNumber, setBadgeNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        const metadata: any = { name };
        if (isOfficerLogin && badgeNumber) {
          metadata.role = "officer";
          metadata.badge_number = badgeNumber;
        }
        await signUp(email, password, name);
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950 to-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZjAwMDAiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzAtMS4xLS45LTItMi0ycy0yIC45LTIgMiAuOSAyIDIgMiAyLS45IDItMnptLTggMGMwLTEuMS0uOS0yLTItMnMtMiAuOS0yIDIgLjkgMiAyIDIgMi0uOSAyLTJ6bTAgOGMwLTEuMS0uOS0yLTItMnMtMiAuOS0yIDIgLjkgMiAyIDIgMi0uOSAyLTJ6bTggMGMwLTEuMS0uOS0yLTItMnMtMiAuOS0yIDIgLjkgMiAyIDIgMi0uOSAyLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>

      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600 rounded-full blur-[150px] opacity-20"></div>

      <div className="relative bg-black/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-red-900/50 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-600 to-red-900 rounded-full mb-4 shadow-lg shadow-red-600/50">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-4l6-4-6-4v8z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-red-700 mb-2">
            Web-Slinger Dispatch
          </h1>
          <p className="text-red-200/80 text-sm">Protecting the Multiverse, One Report at a Time</p>
        </div>

        <div className="mb-6 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setIsOfficerLogin(false);
              setBadgeNumber("");
              setError("");
            }}
            className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
              !isOfficerLogin
                ? "border-red-600 bg-red-900/30 text-red-100"
                : "border-red-900/30 bg-black/30 text-red-300 hover:border-red-800/50"
            }`}
          >
            <User className="w-5 h-5" />
            <span className="font-semibold">Citizen</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOfficerLogin(true);
              setError("");
            }}
            className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
              isOfficerLogin
                ? "border-red-600 bg-red-900/30 text-red-100"
                : "border-red-900/30 bg-black/30 text-red-300 hover:border-red-800/50"
            }`}
          >
            <Shield className="w-5 h-5" />
            <span className="font-semibold">Officer</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-600/50 rounded-lg flex items-center gap-2 text-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-red-100 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isSignUp}
                  className="w-full px-4 py-3 bg-black/50 border border-red-900/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent text-white placeholder-red-300/30 transition-all"
                  placeholder="Your name"
                />
              </div>
              {isOfficerLogin && (
                <div>
                  <label htmlFor="badge" className="block text-sm font-medium text-red-100 mb-2">
                    Badge Number
                  </label>
                  <input
                    type="text"
                    id="badge"
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    required={isOfficerLogin && isSignUp}
                    className="w-full px-4 py-3 bg-black/50 border border-red-900/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent text-white placeholder-red-300/30 transition-all"
                    placeholder="Officer badge number"
                  />
                </div>
              )}
            </>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-red-100 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-black/50 border border-red-900/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent text-white placeholder-red-300/30 transition-all"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-red-100 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-black/50 border border-red-900/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent text-white placeholder-red-300/30 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-lg shadow-lg shadow-red-600/30 hover:shadow-red-600/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
          >
            {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            className="text-red-300 hover:text-red-200 text-sm transition-colors"
          >
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
