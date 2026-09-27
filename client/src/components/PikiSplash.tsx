import { useCallback, useEffect, useState } from "react";

type Service = "delivery" | "riders" | "admin";

const config = {
  delivery: { title: "PIKI Delivery", eyebrow: "Pedidos cerca de ti", accent: "#FFD72E", soft: "#fff0e9", logo: "/piki-delivery-512.png" },
  riders: { title: "PIKI Riders", eyebrow: "Tu ruta, tu ritmo", accent: "#171715", soft: "#eaf4e6", logo: "/piki-riders-512.png" },
  admin: { title: "PIKI Admin", eyebrow: "Centro de operaciones", accent: "#143b2b", soft: "#e8f0e7", logo: "/piki-admin-512.png" },
} as const;

export function PikiSplash({ service }: { service: Service }) {
  const [visible, setVisible] = useState(true);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const item = config[service];
  const playWelcomeJingle = useCallback(() => {
    if (service !== "delivery") return;
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    try {
      const audio = new AudioContextCtor();
      const notes = [523.25, 659.25, 783.99, 659.25, 523.25, 392];
      const start = audio.currentTime + 0.04;
      notes.forEach((frequency, index) => {
        const oscillator = audio.createOscillator(); const gain = audio.createGain(); const at = start + index * 0.28;
        oscillator.type = "triangle"; oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, at); gain.gain.exponentialRampToValueAtTime(0.12, at + 0.035); gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.24);
        oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(at); oscillator.stop(at + 0.25);
      });
      void audio.resume().then(() => window.setTimeout(() => void audio.close(), 2200)).catch(() => setSoundBlocked(true));
    } catch { setSoundBlocked(true); }
  }, [service]);

  useEffect(() => {
    // Mantener la identidad PIKI visible el tiempo suficiente para que el usuario
    // reconozca la aplicación antes de entrar al contenido.
    const timeout = window.setTimeout(() => setVisible(false), 4000);
    playWelcomeJingle();
    return () => window.clearTimeout(timeout);
  }, [playWelcomeJingle]);

  if (!visible) return null;
  return <div className="piki-splash fixed inset-0 z-[100] grid place-items-center bg-[#fffdf9] p-6" role="status" aria-label={`Abriendo ${item.title}`}>
    <div className="text-center"><div className="mx-auto grid h-24 w-24 place-items-center overflow-hidden rounded-[2rem] bg-white shadow-[0_18px_36px_rgba(20,59,43,.18)]"><img src={item.logo} alt="" className="h-full w-full object-cover" /></div><p className="mt-7 text-[11px] font-extrabold uppercase tracking-[.24em]" style={{ color: item.accent }}>PIKI</p><h1 className="mt-2 font-display text-4xl font-semibold tracking-[-.06em] text-[#17241c]">{item.title.replace("PIKI ", "")}</h1><p className="mt-2 text-sm font-semibold text-[#6d7a70]">{item.eyebrow}</p><div className="mx-auto mt-7 h-1.5 w-28 overflow-hidden rounded-full" style={{ background: item.soft }}><div className="h-full w-2/3 animate-pulse rounded-full" style={{ background: item.accent }} /></div>{service === "delivery" && soundBlocked && <button type="button" onClick={() => { setSoundBlocked(false); playWelcomeJingle(); }} className="mx-auto mt-5 rounded-full border border-[#e8d26a] bg-[#fff8d4] px-4 py-2 text-xs font-bold text-[#665300]">Activar sonido PIKI</button>}</div>
  </div>;
}
