import { useTranslation } from "react-i18next";
import { useAuth0 } from "@auth0/auth0-react";

export function Login() {
  const { loginWithRedirect } = useAuth0();

  const { t, i18n } = useTranslation();

  return (
    <div
      className="min-h-screen bg-sv-hero flex items-start justify-center py-12 px-4 relative overflow-y-auto max-h-screen"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {/* Language selector top-right */}
      <div className="absolute top-4 right-4 z-50">
        <select
          value={i18n.language || localStorage.getItem("lng") || "en"}
          onChange={(e) => {
            const lng = e.target.value;
            i18n.changeLanguage(lng);
            localStorage.setItem("lng", lng);
          }}
          className="bg-black/30 border border-sv-red-900/50 text-sm rounded px-2 py-1 text-white"
        >
          <option value="en">EN</option>
          <option value="vi">VI</option>
          <option value="es">ES</option>
        </select>
      </div>

      <div className="absolute inset-0 sv-faint-grid opacity-30 pointer-events-none"></div>

      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-80 h-80 md:w-96 md:h-96 bg-sv-magenta-500 rounded-full blur-[150px] opacity-18 pointer-events-none"></div>

      <div className="relative bg-black/80 backdrop-blur-xl p-6 md:p-8 rounded-2xl shadow-2xl border border-sv-red-900/50 w-full max-w-md mx-auto mt-8">
        <div className="text-center mb-8">
          <img
            src={"/logo.png"}
            alt="Web-Slinger Dispatch Logo"
            className="w-40 h-40 mx-auto mb-4"
          />

          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-red-700 mb-2">
            {t("appTitle")}
          </h1>

          <p className="text-sv-red-200/80 text-sm">{t("protecting")}</p>
        </div>

        <div className="space-y-4">
          <button
            className="w-full py-3 px-4 bg-gradient-to-r from-sv-magenta-500 to-sv-red-500 hover:from-sv-red-600 hover:to-sv-red-700 text-white font-semibold rounded-lg sv-red-glow hover:shadow-sv-red-glow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
            onClick={() => {
              loginWithRedirect();
            }}
          >
            Sign in with Auth0
          </button>
        </div>
      </div>
    </div>
  );
}
