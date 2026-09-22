from pathlib import Path
p = Path('/home/ubuntu/mesago-delivery/server/routers.ts')
text = p.read_text()
needle = '''    feed: publicProcedure.input(z.object({ statuses: z.array(z.enum(orderStatuses)).optional() }).optional()).query(async ({ input }) => {'''
insert = '''    get: publicProcedure.input(z.object({ id: z.string().min(1) })).query(async ({ input }) => {
      const rows = await listOrderRecords();
      const row = rows.find((item) => item.publicCode === input.id);
      return row ? { id: row.publicCode, status: row.status, restaurant: row.restaurantName, address: row.address, riderName: row.riderName, updatedAt: row.updatedAt.getTime() } : null;
    }),
    feed: publicProcedure.input(z.object({ statuses: z.array(z.enum(orderStatuses)).optional() }).optional()).query(async ({ input }) => {'''
text = text.replace(needle, insert)
p.write_text(text)

home = Path('/home/ubuntu/mesago-delivery/client/src/pages/Home.tsx')
text = home.read_text()
needle = '  const orderMutation = trpc.order.create.useMutation();\n'
replacement = needle + '  const trackingInput = useMemo(() => ({ id: tracking?.id ?? "" }), [tracking?.id]);\n  const { data: liveTracking } = trpc.order.get.useQuery(trackingInput, { enabled: Boolean(tracking), refetchInterval: 3000 });\n'
text = text.replace(needle, replacement)
needle2 = '  useEffect(() => {\n    if (!tracking) return;'
replacement2 = '''  useEffect(() => {
    if (liveTracking?.status) {
      const serverStage: TrackingStage = ["placed", "accepted"].includes(liveTracking.status) ? "confirmed" : liveTracking.status === "ready" ? "preparing" : "onway";
      setTracking((current) => current ? { ...current, stage: serverStage } : current);
    }
  }, [liveTracking?.status]);

  useEffect(() => {
    if (!tracking) return;'''
text = text.replace(needle2, replacement2, 1)
home.write_text(text)
