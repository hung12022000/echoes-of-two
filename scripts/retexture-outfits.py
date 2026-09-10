"""Blender image pipeline for fitted coral Hưng&Mei outfits.

It recolors the source UV atlases while preserving skin/shading, then adds a
small sun tattoo to Mei's left forearm. The source textures are never changed.
"""
import bpy, pathlib, math

ROOT = pathlib.Path(__file__).resolve().parents[1]
PATTERN = ROOT / 'public' / 'textures' / 'oceanbound-outfit-v1.png'
OUT = ROOT / 'public' / 'textures'

def load(path, size=1024):
    image = bpy.data.images.load(str(path), check_existing=False)
    image.scale(size, size)
    return image

def skin(r, g, b):
    return r > .24 and r > g * 1.12 and g > b * .96 and (r - b) > .055

def female_garment(u, top):
    return ((top < .24 and .28 < u < .72) or
            (top > .50 and .30 < u < .70) or
            (top > .54 and (u < .31 or u > .69)))

def male_garment(u, top):
    return top < .75

def retexture(role, avatar, source_name):
    source = ROOT / 'art-source' / 'Assets' / 'Avatars' / 'Adults' / avatar / 'Textures' / (source_name + '_color.tga')
    image = load(source)
    pattern = load(PATTERN)
    pixels = list(image.pixels[:]); motif = list(pattern.pixels[:]); width, height = image.size
    for y in range(height):
        top = 1 - y / max(1, height - 1)
        for x in range(width):
            i = (y * width + x) * 4; r, g, b, a = pixels[i:i+4]
            if a < .05 or max(r, g, b) < .018 or skin(r, g, b): continue
            u = x / max(1, width - 1)
            if not (male_garment(u, top) if role == 'hung' else female_garment(u, top)): continue
            p = ((y % pattern.size[1]) * pattern.size[0] + (x % pattern.size[0])) * 4
            pr, pg, pb = motif[p:p+3]
            luminance = max(.34, min(1.15, .2 + (r + g + b) / 2.1))
            pixels[i] = min(1, pr * luminance); pixels[i+1] = min(1, pg * luminance); pixels[i+2] = min(1, pb * luminance)
    if role == 'mei':
        # The source left-forearm UV island is centered near u=.31, v=.64.
        cx, cy = int(width * .31), int(height * .64); radius = int(width * .016)
        base = (0.58, 0.34, 0.25)
        for y in range(cy - radius * 3, cy + radius * 3):
            for x in range(cx - radius * 3, cx + radius * 3):
                if not (0 <= x < width and 0 <= y < height): continue
                dx, dy = x - cx, y - cy; dist = math.hypot(dx, dy); angle = math.atan2(dy, dx)
                ring = abs(dist - radius) < 2.3
                ray = radius * 1.45 < dist < radius * 2.15 and abs(math.sin(angle * 8)) > .91
                core = dist < radius * .28
                if ring or ray or core:
                    i = (y * width + x) * 4; pixels[i:i+3] = (0.43, 0.08, 0.055)
    image.pixels[:] = pixels; image.update(); image.file_format = 'PNG'
    target = OUT / f'{role}-body-oceanbound.png'; image.filepath_raw = str(target); image.save()
    print('OUTFIT', role, target, flush=True)

retexture('hung', 'Male_Adult_07', 'm013_body')
retexture('mei', 'Female_Adult_03', 'f003_body')
