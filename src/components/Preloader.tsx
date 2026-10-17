import { useEffect, useState } from "react";

interface PreloaderProps{
    onLoaded?: () => void;
}

export default function Preloader({onLoaded} :PreloaderProps){
    const [loading, setLoading] = useState(true);
    const [fadeExit, setFadeExit] = useState(false);

    useEffect(() => {
        const startTime = Date.now();
        const finishLoading = () => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 1800 - elapsed);

            setTimeout(() => {
                setFadeExit(true);
                setTimeout(() => {
                    setLoading(false);
                    onLoaded?.();
                }, 500);
            }, remaining);
        };
        if (document.readyState === "complete"){
            finishLoading();
        } else {
            window.addEventListener("load", finishLoading);
            return () => {
                window.removeEventListener("load", finishLoading);
            }
        }
    }, [onLoaded]);

    if (!loading) return null;

    return(
        <div className={`fixed inset-0 z-100 flex flex-col items-center justify-center bg-[#0d0c0b] text-white transition-opacity duration-500 ease-in-out ${fadeExit ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
            <style>
                {`
                @keyframes chefFloat{
                0%, 100% {
                transform: translateY(0px) rotate(0deg);
                }
                50% {
                transform: translateY(0px) rotate(1.5deg);
                }}
                @keyframes hatPuff {
                0%, 100% {
                transform: scale(1);
                }
                50%{
                transform: scale(1.04) translateY(-1px);
                }}
                @keyframes emberRise {
                0% {
                transform: translateY(6px) scale(0.6);
                }
                40% {
                opacity: 0.9;
                }
                100%{
                transform: translateY(-22px) scale(1.1);
                opacity: 0;
                }}
                @keyframes pulseGlow {
                0%, 100% {
                transform: scale(0.92);
                opacity:0.45;
                }}
                @keyframes lineShimmer {
                0% {
                transform: translateX(-100%);
                }
                100% {
                transform: translateX(200%);
                }}
                `}
            </style>
            <div className="absolute w-64 h-64 bg-[#f5a623]/10 rounded-full blur-[90px] pointer-events-none" style={{ animation: "pulseGlow 2.5s ease-in-out infinite" }} />
            <div className="relative w-28 h-29 flex items-center justify-center mb-6">
                <div className="absolute inset-0 rounded-full border border-[#f5a623]/20 scale-95" />
                <div className="absolute top-1 left-7 w-1.5 h-1.5 rounded-full bg-[#f5a623]" style={{ animation: "emberRise 1.8s ease-out infinite" }} />
                <div className="absolute top-0 right-7 w-2 h-2 rounded-full bg-[#f5a623]" style={{animation: "emberRise 2.1s ease-out infinite 0.5s" }}/>
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#e0951a]" style={{ animation: "emberRise 1.5s ease-out infinite 0.9s" }}/>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 25" className="w-20 h-20 text-[#f5a623] overflow-visible drop-shadow-[0_0_12px_rgba(245,166,35,0.3)]" style={{ animation: "chefFloat 2.6s ease-in-out infinite"}}>
                    <title>chef</title>
                    <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth={1.5}>
                        <path strokeLinejoin="round" className="origin-bottom" style={{ animation: "hatPuff 2.6s ease-in-out infinite"}}
                        d="
                        M15.398 4.41
                        A3.601 3.601 0 0 1 21 7.405
                        A3.6 3.6 0 0 1 17.625 11
                        H17
                        m-1.602-6.59
                        a3.602 3.602 0 0 0-6.796 0
                        m6.796 0
                        a3.6 3.6 0 0 1 .089 2.093
                        m-5.769-.9
                        A3.6 3.6 0 0 0 8.602 4.41
                        m0 0
                        A3.601 3.601 0 0 0 3 7.405
                        A3.6 3.6 0 0 0 6.375 11
                        H7
                        " />
                        <path d="
                        M17 14v-4
                        M7 14v-4
                        m11 4.5
                        c-1.599-.622-3.7-1-6-1
                        s-4.4.378-6 1
                        M17 17
                        a5 5 0 0 1-10 0" />
                    </g>
                </svg>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white mb-2">Dine<span className="text-[#f5a623]">Flow</span></h2>
            <p className="text-[11px] font-semibold text-zinc-400 tracking-[0.25em] uppercase mb-6 flex items-center gap-1"><span>The Green Leaf</span><span className="text-[#f5a623]">•</span><span>Hearth & Fire</span></p>
            <div className="w-36 h-0.5 bg-white/10 rounded-full overflow-hidden relative">
                <div className="absolute inset-y-0 left-0 bg-linear-to-r from-transparent via-[#f5a623] to-[#f5a623] w-1/2 rounded-full" style={{ animation: "lineShimmer 1.4s ease-in-out infinite"}}/>
            </div>
        </div>
    );
}