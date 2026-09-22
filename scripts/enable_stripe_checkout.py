from pathlib import Path
p = Path('/home/ubuntu/mesago-delivery/client/src/pages/Home.tsx')
text = p.read_text()
text = text.replace('  const orderMutation = trpc.order.create.useMutation();', '  const checkoutMutation = trpc.order.checkout.useMutation();')
text = text.replace('  useEffect(() => {\n    if (liveTracking?.status) {\n      const serverStage: TrackingStage = ["placed", "accepted"].includes(liveTracking.status) ? "confirmed" : liveTracking.status === "ready" ? "preparing" : "onway";\n      setTracking((current) => current ? { ...current, stage: serverStage } : current);\n    }\n  }, [liveTracking?.status]);\n\n  useEffect(() => {\n    if (!tracking) return;\n    const preparing = window.setTimeout(() => setTracking((current) => current ? { ...current, stage: "preparing" } : null), 2200);\n    const onway = window.setTimeout(() => setTracking((current) => current ? { ...current, stage: "onway" } : null), 5000);\n    return () => { window.clearTimeout(preparing); window.clearTimeout(onway); };\n  }, [tracking?.id]);', '''  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("order_id");
    if (params.get("checkout") === "success" && orderId) {
      setTracking({ id: orderId, restaurant: "Pedido Manduca", eta: "actualizando…", stage: "confirmed" });
      window.history.replaceState({}, "", window.location.pathname);
      toast.success("Pago recibido", { description: "Estamos confirmando tu pedido." });
    }
    if (params.get("checkout") === "cancelled") {
      window.history.replaceState({}, "", window.location.pathname);
      toast("Pago cancelado", { description: "Tu cesta sigue disponible para cuando quieras." });
    }
  }, []);

  useEffect(() => {
    if (!liveTracking?.status) return;
    const serverStage: TrackingStage = ["placed", "accepted"].includes(liveTracking.status) ? "confirmed" : liveTracking.status === "ready" ? "preparing" : "onway";
    setTracking((current) => current ? { ...current, restaurant: liveTracking.restaurant, stage: serverStage } : current);
  }, [liveTracking]);''')
old = '''  const submitOrder = () => {
    if (!cartRestaurant || !cart.length) return;
    orderMutation.mutate(
      { restaurantId: cartRestaurant.id, address, items: cart.map((line) => ({ id: line.item.id, quantity: line.quantity })), total },
      {
        onSuccess: (order) => {
          setTracking({ ...order, stage: "confirmed" });
          const historyKey = "manduca-history";
          const previousHistory = JSON.parse(localStorage.getItem(historyKey) || "[]") as Array<{ id: string; restaurant: string; total: number; createdAt: number }>;
          localStorage.setItem(historyKey, JSON.stringify([{ id: order.id, restaurant: order.restaurant, total, createdAt: order.createdAt }, ...previousHistory].slice(0, 20)));
          setCart([]);
          setCartRestaurant(null);
          setCheckoutOpen(false);
          setCartOpen(false);
          setSelectedRestaurant(null);
          toast.success("Pedido confirmado", { description: `Tu código es ${order.id}.` });
        },
        onError: () => toast.error("No se pudo confirmar el pedido", { description: "Prueba otra vez en un momento." }),
      },
    );
  };'''
new = '''  const submitOrder = () => {
    if (!cartRestaurant || !cart.length) return;
    checkoutMutation.mutate(
      { restaurantId: cartRestaurant.id, address, items: cart.map((line) => ({ id: line.item.id, quantity: line.quantity })), total },
      {
        onSuccess: ({ checkoutUrl, orderId }) => {
          const opened = window.open(checkoutUrl, "_blank", "noopener,noreferrer");
          if (!opened) window.location.assign(checkoutUrl);
          setCheckoutOpen(false);
          toast.success("Abriendo pago seguro", { description: `Pedido ${orderId} reservado hasta que Stripe confirme el pago.` });
        },
        onError: (error) => toast.error("No se pudo iniciar el pago", { description: error.message || "Revisa la configuración de Stripe." }),
      },
    );
  };'''
if old not in text:
    raise SystemExit('checkout function source not found')
text = text.replace(old, new)
text = text.replace('Pago de demostración ·•••• 4242', 'Stripe · Tarjeta, Apple Pay, Google Pay o Bizum')
text = text.replace('disabled={orderMutation.isPending} onClick={submitOrder}', 'disabled={checkoutMutation.isPending} onClick={submitOrder}')
text = text.replace('{orderMutation.isPending ? "Confirmando…" : "Confirmar pedido de demostración"}', '{checkoutMutation.isPending ? "Preparando pago seguro…" : "Pagar de forma segura"}')
text = text.replace('No se realiza ningún cobro real. Este flujo ilustra la experiencia de compra.', 'El pago se realiza en Stripe. Bizum aparece cuando esté habilitado para la cuenta española de Manduca.')
text = text.replace('Experiencia de demostración · Sin pagos reales', 'Manduca · Pago digital seguro')
p.write_text(text)
