from pathlib import Path
p = Path('/home/ubuntu/mesago-delivery/server/catalog.test.ts')
text = p.read_text().replace('expect(order.id).toMatch(/^MG-\\d{4}$/);', 'expect(order.id).toMatch(/^MG-[A-Z0-9_-]{8}$/);')
p.write_text(text)
