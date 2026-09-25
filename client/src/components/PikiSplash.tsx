import { useEffect, useState } from "react";

type Service = "delivery" | "riders" | "admin";

const config = {
  delivery: { title: "PIKI Delivery", eyebrow: "Pedidos cerca de ti", accent: "#FFD72E", soft: "#fff0e9", logo: "/piki-delivery-512.png" },
  riders: { title: "PIKI Riders", eyebrow: "Tu ruta, tu ritmo", accent: "#171715", soft: "#eaf4e6", logo: "/piki-riders-512.png" },
  admin: { title: "PIKI Admin", eyebrow: "Centro de operaciones", accent: "#143b2b", soft: "#e8f0e7", logo: "/piki-admin-512.png" },
} as const;

export function PikiSplash({ service }: { service: Service }) {
  const [visible, setVisible] = useState(true);
  const item = config[service];

  useEffect(() => {
    // Mantener la identidad PIKI visible el tiempo suficiente para que el usuario
    // reconozca la aplicación antes de entrar al contenido.
    const timeout = window.setTimeout(() => setVisible(false), 4000);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!visible) return null;
  return <div className="piki-splash fixed inset-0 z-[100] grid place-items-center bg-[#fffdf9] p-6" role="status" aria-label={`Abriendo ${item.title}`}>
    <div className="text-center"><div className="mx-auto grid h-24 w-24 place-items-center overflow-hidden rounded-[2rem] bg-white shadow-[0_18px_36px_rgba(20,59,43,.18)]"><img src={item.logo} alt="" className="h-full w-full object-cover" /></div><p className="mt-7 text-[11px] font-extrabold uppercase tracking-[.24em]" style={{ color: item.accent }}>PIKI</p><h1 className="mt-2 font-display text-4xl font-semibold tracking-[-.06em] text-[#17241c]">{item.title.replace("PIKI ", "")}</h1><p className="mt-2 text-sm font-semibold text-[#6d7a70]">{item.eyebrow}</p><div className="mx-auto mt-7 h-1.5 w-28 overflow-hidden rounded-full" style={{ background: item.soft }}><div className="h-full w-2/3 animate-pulse rounded-full" style={{ background: item.accent }} /></div></div>
  </div>;
}
