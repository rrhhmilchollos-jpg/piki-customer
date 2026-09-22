from pathlib import Path
p = Path('/home/ubuntu/mesago-delivery/client/src/pages/Home.tsx')
text = p.read_text()
text = text.replace('/manus-storage/manduca-hero_6c5f0245.jpg', '/manus-storage/mesago-hero_6c5f0245.jpg')
text = text.replace('/manus-storage/manduca-bowl_0c8f947b.jpg', '/manus-storage/mesago-bowl_0c8f947b.jpg')
text = text.replace('/manus-storage/manduca-pizza_52125c0e.jpg', '/manus-storage/mesago-pizza_52125c0e.jpg')
p.write_text(text)
