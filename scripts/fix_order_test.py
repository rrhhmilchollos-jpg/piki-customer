from pathlib import Path
p = Path('/home/ubuntu/mesago-delivery/server/catalog.test.ts')
text = p.read_text().replace('expect(order.status).toBe("confirmed");', 'expect(order.status).toBe("placed");')
p.write_text(text)
