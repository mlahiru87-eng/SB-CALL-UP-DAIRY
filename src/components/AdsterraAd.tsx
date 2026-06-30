import { useEffect, useRef, useState } from "react";

interface AdProps {
  language?: 'en' | 'si';
}

// Detect if we are running in a framed/sandboxed environment
export const isIframeEnvironment = (): boolean => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};

export function AdsterraBanner320x50({ language = 'en' }: AdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    const checkIframe = isIframeEnvironment();
    setIsInIframe(checkIframe);
    
    if (checkIframe || !containerRef.current) return;
    
    // Clear container
    containerRef.current.innerHTML = "";
    
    // Configure atOptions on window
    (window as any).atOptions = {
      'key' : 'ac2304206623576cb7a4d0edf9e6a91f',
      'format' : 'iframe',
      'height' : 50,
      'width' : 320,
      'params' : {}
    };

    // Create script tag
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://www.highperformanceformat.com/ac2304206623576cb7a4d0edf9e6a91f/invoke.js";
    
    containerRef.current.appendChild(script);
  }, []);

  if (isInIframe) {
    return (
      <div className="flex flex-col items-center justify-center my-4 py-2 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 max-w-sm mx-auto">
        <span className="font-mono text-[9px] uppercase tracking-widest text-indigo-500 mb-1">
          {language === 'si' ? 'දැන්වීම් අවකාශය' : 'Ad Space'}
        </span>
        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono text-center px-4 leading-relaxed">
          {language === 'si' ? 'නව ටැබ් එකක විවෘත කළ විට දැන්වීම ක්‍රියාත්මක වේ' : 'Active in standalone tab / production mode'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center my-4 py-2 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-850/40 max-w-sm mx-auto">
      <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
        {language === 'si' ? 'දැන්වීම්' : 'Sponsored / Advertisement'}
      </span>
      <div ref={containerRef} className="w-[320px] h-[50px] overflow-hidden" id="ad-banner-320" />
    </div>
  );
}

export function AdsterraBanner300x250({ language = 'en' }: AdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    const checkIframe = isIframeEnvironment();
    setIsInIframe(checkIframe);
    
    if (checkIframe || !containerRef.current) return;
    
    // Clear container
    containerRef.current.innerHTML = "";
    
    // Configure atOptions on window
    (window as any).atOptions = {
      'key' : 'fea516e0fd448d25df9e61e61788717d',
      'format' : 'iframe',
      'height' : 250,
      'width' : 300,
      'params' : {}
    };

    // Create script tag
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://www.highperformanceformat.com/fea516e0fd448d25df9e61e61788717d/invoke.js";
    
    containerRef.current.appendChild(script);
  }, []);

  if (isInIframe) {
    return (
      <div className="flex flex-col items-center justify-center my-4 py-6 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 max-w-[340px] mx-auto min-h-[180px]">
        <span className="font-mono text-[9px] uppercase tracking-widest text-indigo-500 mb-3">
          {language === 'si' ? 'දැන්වීම් අවකාශය' : 'Ad Space (300x250)'}
        </span>
        <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono text-center px-6 leading-relaxed">
          {language === 'si' 
            ? 'මෙම දැන්වීම් අවකාශය නව ටැබ් එකක හෝ සජීවීව ධාවනය වන විට දර්ශනය වේ.' 
            : 'Adsterra 300x250 banner active in standalone tab / production environment.'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center my-4 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-[340px] mx-auto">
      <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
        {language === 'si' ? 'දැන්වීම්' : 'Sponsored / Advertisement'}
      </span>
      <div ref={containerRef} className="w-[300px] h-[250px] overflow-hidden rounded-xl bg-slate-50/50 dark:bg-slate-950/20" id="ad-banner-300" />
    </div>
  );
}

export function AdsterraContainerAd({ language = 'en' }: AdProps) {
  const containerId = "container-370d14c470e162ef719871352a5cdd2f";
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    const checkIframe = isIframeEnvironment();
    setIsInIframe(checkIframe);
    
    if (checkIframe) return;

    // Append the invocation script to body if not already present
    const existingScript = document.querySelector(`script[src*="370d14c470e162ef719871352a5cdd2f"]`);
    if (!existingScript) {
      const script = document.createElement("script");
      script.async = true;
      script.setAttribute("data-cfasync", "false");
      script.src = "https://pl30126828.effectivecpmnetwork.com/370d14c470e162ef719871352a5cdd2f/invoke.js";
      document.body.appendChild(script);
    }
  }, []);

  if (isInIframe) {
    return (
      <div className="flex flex-col items-center justify-center my-5 p-6 bg-slate-50/30 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 w-full min-h-[90px]">
        <span className="font-mono text-[9px] uppercase tracking-widest text-indigo-500 mb-1.5">
          {language === 'si' ? 'දැන්වීම් පුවරුව' : 'Ad Container'}
        </span>
        <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono text-center px-6 leading-relaxed">
          {language === 'si'
            ? 'iframe ආරක්ෂක සීමාවන් හේතුවෙන් පෙරදසුන තුළ දැන්වීම් අක්‍රිය කර ඇත.'
            : 'Adsterra CPM container active in production or standalone tab.'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center my-5 p-4 bg-slate-50/70 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 w-full">
      <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2.5">
        {language === 'si' ? 'දැන්වීම්' : 'Sponsored / Advertisement'}
      </span>
      <div id={containerId} className="w-full max-w-[728px] min-h-[90px] rounded-xl overflow-hidden flex items-center justify-center bg-white dark:bg-slate-950/40" />
    </div>
  );
}
