"use client";

const LoaderComponent = () => {
  return (
    <div className="fixed inset-0 bg-white dark:bg-slate-950 flex items-center justify-center z-50 bg-linear-to-br from-white via-slate-50 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating linear orbs */}
        <div className="absolute w-96 h-96 bg-linear-to-r from-blue-600/10 to-slate-600/10 dark:from-blue-600/5 dark:to-slate-600/5 rounded-full blur-3xl -top-48 -right-48 animate-pulse" />
        <div className="absolute w-96 h-96 bg-linear-to-r from-slate-600/10 to-blue-600/10 dark:from-slate-600/5 dark:to-blue-600/5 rounded-full blur-3xl -bottom-48 -left-48 animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Content container */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Main spinner with brand colors */}
        <div className="relative w-20 h-20">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-500 border-b-slate-400 dark:border-t-blue-500 dark:border-r-blue-400 dark:border-b-slate-600 animate-spin" />
          
          {/* Middle rotating ring (counter-clockwise) */}
          <div className="absolute inset-2 rounded-full border-3 border-transparent border-b-slate-600 border-l-slate-500 dark:border-b-slate-500 dark:border-l-slate-400 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
          
          {/* Inner pulsing dot */}
          <div className="absolute inset-6 rounded-full bg-linear-to-r from-blue-600 to-slate-600 dark:from-blue-500 dark:to-slate-500 animate-pulse" />
        </div>

        {/* Loading text - neutral */}
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Loading
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Please wait a moment
          </p>
        </div>

        {/* Loading bar */}
        <div className="w-48 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-linear-to-r from-blue-600 to-slate-600 dark:from-blue-500 dark:to-slate-500 animate-pulse rounded-full" style={{ animationDuration: "2s" }} />
        </div>

        {/* Shimmer effect line */}
        <div className="relative w-32 h-px bg-linear-to-r from-transparent via-blue-600 to-transparent dark:via-blue-500 opacity-50">
          <div className="absolute inset-0 animate-pulse" style={{ animationDuration: "1.5s" }} />
        </div>
      </div>
    </div>
  );
};

export default LoaderComponent;
