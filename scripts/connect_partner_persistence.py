from pathlib import Path
p = Path('/home/ubuntu/mesago-delivery/server/routers.ts')
text = p.read_text()
text = text.replace('import { createOrderRecord, listOrderRecords, updateOrderRecord } from "./db";', 'import { createOrderRecord, createPartnerStoreRecord, listOrderRecords, updateOrderRecord } from "./db";')
old = '''    }).mutation(async ({ input, ctx }) => {
      return { ok: true, reviewStatus: "pending_review", ownerOpenId: ctx.user?.openId ?? "guest", store: input.name, items: input.items.length };
    }),'''
new = '''    }).mutation(async ({ input, ctx }) => {
      const stored = await createPartnerStoreRecord({ ownerOpenId: ctx.user?.openId ?? "guest", name: input.name, cuisine: input.cuisine, address: input.address, items: input.items });
      return { ok: true, reviewStatus: stored?.reviewStatus ?? "pending_review", ownerOpenId: ctx.user?.openId ?? "guest", store: input.name, items: input.items.length };
    }),'''
text = text.replace(old, new)
p.write_text(text)
