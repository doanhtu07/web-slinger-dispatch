import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, Shield, User } from 'lucide-react';
import logo from '../images/logo.png';
import { useTranslation } from 'react-i18next';

export function Login() {
  const { t, i18n } = useTranslation();
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
    <div className="min-h-screen bg-sv-hero flex items-center justify-center p-4 relative overflow-hidden">
      {/* language selector top-right */}
      <div className="absolute top-4 right-4 z-50">
        <select
          value={i18n.language || localStorage.getItem('lng') || 'en'}
          onChange={(e) => {
            const lng = e.target.value;
            i18n.changeLanguage(lng);
            localStorage.setItem('lng', lng);
          }}
          className="bg-black/30 border border-sv-red-900/50 text-sm rounded px-2 py-1 text-white"
        >
          <option value="en">EN</option>
          <option value="vi">VI</option>
          <option value="es">ES</option>
        </select>
      </div>
      <div className="absolute inset-0 sv-faint-grid opacity-30 pointer-events-none"></div>

      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-sv-magenta-500 rounded-full blur-[150px] opacity-18"></div>

      <div className="relative bg-black/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-sv-red-900/50 w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logo} alt="Web-Slinger Dispatch Logo" className="w-40 h-40 mx-auto mb-4" />
  

          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-red-700 mb-2">
            {t('appTitle')}
          </h1>
          <p className="text-sv-red-200/80 text-sm">
            {t('protecting')}
          </p>
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
            <span className="font-semibold">{t('citizen')}</span>
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
            <span className="font-semibold">{t('officer')}</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-sv-red-900/30 border border-sv-red-600/50 rounded-lg flex items-center gap-2 text-sv-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-red-100 mb-2"
                  >
                    {t('name')}
                  </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isSignUp}
                  className="w-full px-4 py-3 bg-black/50 border border-sv-red-900/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-sv-red-500 focus:border-transparent text-white placeholder-sv-red-300/30 transition-all"
                  placeholder="Your name"
                />
              </div>
              {isOfficerLogin && (
                <div>
                  <label
                    htmlFor="badge"
                    className="block text-sm font-medium text-red-100 mb-2"
                  >
                    {t('badgeNumber')}
                  </label>
                  <input
                    type="text"
                    id="badge"
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    required={isOfficerLogin && isSignUp}
                    className="w-full px-4 py-3 bg-black/50 border border-sv-red-900/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-sv-red-500 focus:border-transparent text-white placeholder-sv-red-300/30 transition-all"
                    placeholder="Officer badge number"
                  />
                </div>
              )}
            </>
          )}

          <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-red-100 mb-2"
                >
                  {t('email')}
                </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-black/50 border border-sv-red-900/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-sv-red-500 focus:border-transparent text-white placeholder-sv-red-300/30 transition-all"
              placeholder="your@email.com"
            />
          </div>

          <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-red-100 mb-2"
                >
                  {t('password')}
                </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-black/50 border border-sv-red-900/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-sv-red-500 focus:border-transparent text-white placeholder-sv-red-300/30 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-sv-magenta-500 to-sv-red-500 hover:from-sv-red-600 hover:to-sv-red-700 text-white font-semibold rounded-lg sv-red-glow hover:shadow-sv-red-glow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
          >
            {loading ? t('loading') : isSignUp ? t('signUp') : t('signIn')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            className="text-sv-red-300 hover:text-sv-red-200 text-sm transition-colors"
          >
            {isSignUp ? t('alreadyHaveAccount') : t('dontHaveAccount')}
          </button>
        </div>
      </div>
    </div>
  );
}
