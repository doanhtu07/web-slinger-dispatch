export const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950 to-black flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-600 to-red-900 rounded-full mb-4 shadow-lg shadow-red-600/50 animate-pulse">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-white">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-4l6-4-6-4v8z" />
          </svg>
        </div>
        <p className="text-red-300 text-lg">Loading...</p>
      </div>
    </div>
  );
};
