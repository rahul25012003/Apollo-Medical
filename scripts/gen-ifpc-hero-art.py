"""Generates an original illustration of a convention centre at dusk for the
IFPC hero (public/ifpc/hero-convention-dusk.svg). Drawn from scratch:
sky, clouds, tree line, a curved glass rotunda with a red fascia, brick
wings, a lit canopy entrance, lamp-lit paths, palms and foliage.

Run: python scripts/gen-ifpc-hero-art.py"""
import math, os, random

random.seed(26)
W, H = 1600, 900
out = []
add = out.append

def f(v):
    return f"{v:.1f}".rstrip("0").rstrip(".")

# ── defs ──────────────────────────────────────────────────────────────
add(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice">')
add("""<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#050d2e"/>
  <stop offset=".28" stop-color="#14215e"/>
  <stop offset=".46" stop-color="#3a2b80"/>
  <stop offset=".56" stop-color="#7d3a8f"/>
  <stop offset=".63" stop-color="#c9577f"/>
  <stop offset=".68" stop-color="#f08a6a"/>
  <stop offset=".72" stop-color="#ffb46a"/>
  <stop offset="1" stop-color="#ffb46a"/>
</linearGradient>
<radialGradient id="sunGlow" cx=".62" cy=".64" r=".5">
  <stop offset="0" stop-color="#ffd59a" stop-opacity=".75"/>
  <stop offset=".35" stop-color="#ff9f6e" stop-opacity=".35"/>
  <stop offset="1" stop-color="#ff9f6e" stop-opacity="0"/>
</radialGradient>
<filter id="b30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>
<filter id="b14" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
<filter id="b6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="b2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2"/></filter>
<filter id="signGlow" x="-20%" y="-60%" width="140%" height="220%">
  <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="g"/>
  <feMerge><feMergeNode in="g"/><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>
<radialGradient id="lamp" cx=".5" cy=".5" r=".5">
  <stop offset="0" stop-color="#fff3d1"/>
  <stop offset=".18" stop-color="#ffd27a" stop-opacity=".9"/>
  <stop offset=".45" stop-color="#ff9a3d" stop-opacity=".35"/>
  <stop offset="1" stop-color="#ff9a3d" stop-opacity="0"/>
</radialGradient>
<linearGradient id="glassUp" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#1c2f6b"/>
  <stop offset=".55" stop-color="#34569a"/>
  <stop offset="1" stop-color="#e7a766"/>
</linearGradient>
<linearGradient id="glassMain" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#1a2a62"/>
  <stop offset=".5" stop-color="#2d4a8e"/>
  <stop offset="1" stop-color="#f0b06a"/>
</linearGradient>
<linearGradient id="pane" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#ffe0a3"/>
  <stop offset="1" stop-color="#ff9a45"/>
</linearGradient>
<linearGradient id="entrance" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#fff0c8"/>
  <stop offset=".6" stop-color="#ffc57a"/>
  <stop offset="1" stop-color="#e98a3e"/>
</linearGradient>
<linearGradient id="fascia" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#d9493a"/>
  <stop offset="1" stop-color="#8e2620"/>
</linearGradient>
<linearGradient id="canopy" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#c63c30"/>
  <stop offset=".7" stop-color="#8f271f"/>
  <stop offset="1" stop-color="#5e1813"/>
</linearGradient>
<pattern id="brick" width="28" height="14" patternUnits="userSpaceOnUse">
  <rect width="28" height="14" fill="#5c2f2a"/>
  <rect x=".8" y=".8" width="12.4" height="5.6" fill="#8d4a3a"/>
  <rect x="14.8" y=".8" width="12.4" height="5.6" fill="#7e4034"/>
  <rect x="-6.2" y="7.8" width="12.4" height="5.6" fill="#7a3d31"/>
  <rect x="7.8" y="7.8" width="12.4" height="5.6" fill="#93503e"/>
  <rect x="21.8" y="7.8" width="12.4" height="5.6" fill="#86463a"/>
</pattern>
<linearGradient id="brickLight" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="#ffb070" stop-opacity=".28"/>
  <stop offset=".5" stop-color="#1a1840" stop-opacity=".25"/>
  <stop offset="1" stop-color="#0a0e2a" stop-opacity=".6"/>
</linearGradient>
<linearGradient id="brickDusk" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#2a1e55" stop-opacity=".45"/>
  <stop offset=".6" stop-color="#2a1e55" stop-opacity=".1"/>
  <stop offset="1" stop-color="#ff9a4a" stop-opacity=".25"/>
</linearGradient>
<linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#241a3c"/>
  <stop offset="1" stop-color="#070a1c"/>
</linearGradient>
<linearGradient id="path" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#f2b577"/>
  <stop offset=".35" stop-color="#9a6b73"/>
  <stop offset="1" stop-color="#2c2a4a"/>
</linearGradient>
<linearGradient id="shrub" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#0f2b24"/>
  <stop offset=".7" stop-color="#1d4a33"/>
  <stop offset="1" stop-color="#7a6a2a"/>
</linearGradient>
<linearGradient id="leaf" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#2e6b3f"/>
  <stop offset="1" stop-color="#0b2419"/>
</linearGradient>
<radialGradient id="vignette" cx=".55" cy=".5" r=".75">
  <stop offset=".55" stop-color="#000" stop-opacity="0"/>
  <stop offset="1" stop-color="#030616" stop-opacity=".7"/>
</radialGradient>
</defs>""")

# ── sky ───────────────────────────────────────────────────────────────
add(f'<rect width="{W}" height="{H}" fill="url(#sky)"/>')
add(f'<rect width="{W}" height="{H}" fill="url(#sunGlow)"/>')
for _ in range(70):
    x, y = random.uniform(0, W), random.uniform(0, 300)
    r = random.choice([0.7, 0.9, 1.1, 1.4])
    add(f'<circle cx="{f(x)}" cy="{f(y)}" r="{r}" fill="#fff" opacity="{f(random.uniform(.25,.85))}"/>')

# clouds: dark indigo banks lit pink/orange from below
def cloud(cx, cy, w, h, top, lit, op):
    add(f'<g opacity="{op}">')
    add(f'<g filter="url(#b14)">')
    for _ in range(9):
        x = cx + random.uniform(-w/2, w/2)
        y = cy + random.uniform(-h/3, h/3)
        add(f'<ellipse cx="{f(x)}" cy="{f(y)}" rx="{f(random.uniform(w*.16,w*.32))}" ry="{f(random.uniform(h*.45,h*.8))}" fill="{top}"/>')
    add('</g><g filter="url(#b6)">')
    for _ in range(6):
        x = cx + random.uniform(-w/2.3, w/2.3)
        y = cy + h*.28 + random.uniform(-6, 6)
        add(f'<ellipse cx="{f(x)}" cy="{f(y)}" rx="{f(random.uniform(w*.1,w*.2))}" ry="{f(random.uniform(8,16))}" fill="{lit}" opacity=".8"/>')
    add('</g></g>')

cloud(1180, 120, 620, 90, "#27265e", "#b35d92", .9)
cloud(650, 190, 520, 70, "#302a6c", "#d9738e", .85)
cloud(1420, 260, 460, 80, "#3b2c72", "#f09a78", .9)
cloud(960, 330, 700, 70, "#5a3386", "#ffb07a", .8)
cloud(300, 300, 520, 60, "#3a2c74", "#e27f8c", .7)
cloud(1300, 430, 520, 44, "#8a4a86", "#ffd08e", .65)

# horizon haze
add('<ellipse cx="1000" cy="585" rx="820" ry="110" fill="#ffc78a" opacity=".45" filter="url(#b30)"/>')

# distant tree line
pts = []
x = -20
while x <= W + 20:
    pts.append((x, 606 + math.sin(x / 61) * 6 + abs(math.sin(x / 23)) * -12 + random.uniform(-2, 2)))
    x += 9
d = "M-20,700 " + " ".join(f"L{f(a)},{f(b)}" for a, b in pts) + f" L{W+20},700 Z"
add(f'<path d="{d}" fill="#1b1838"/>')
pts = []
x = -20
while x <= W + 20:
    pts.append((x, 628 + abs(math.sin(x / 17)) * -10 + math.sin(x / 47) * 5))
    x += 7
d = "M-20,720 " + " ".join(f"L{f(a)},{f(b)}" for a, b in pts) + f" L{W+20},720 Z"
add(f'<path d="{d}" fill="#141330"/>')

add('<g transform="translate(40 70) scale(.9)">')
# ── building ──────────────────────────────────────────────────────────
def brick_block(x, y, w, h, band=24):
    add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="url(#brick)"/>')
    add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="url(#brickDusk)"/>')
    add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="url(#brickLight)"/>')
    add(f'<rect x="{x}" y="{y}" width="{w}" height="{band}" fill="url(#fascia)"/>')
    add(f'<rect x="{x}" y="{y+band}" width="{w}" height="3" fill="#2a0f0c" opacity=".6"/>')
    add(f'<rect x="{x}" y="{y-6}" width="{w}" height="6" fill="#d7d3dd" opacity=".55"/>')

def windows(x0, x1, y, h, step, wwid, lit_bias=.7):
    x = x0
    while x + wwid <= x1:
        lit = random.random() < lit_bias
        add(f'<rect x="{f(x)}" y="{y}" width="{wwid}" height="{h}" fill="#1a1f3e"/>')
        if lit:
            add(f'<rect x="{f(x+2)}" y="{y+2}" width="{wwid-4}" height="{h-4}" fill="url(#pane)" opacity="{f(random.uniform(.55,.95))}"/>')
            add(f'<rect x="{f(x-8)}" y="{y-8}" width="{wwid+16}" height="{h+16}" fill="#ffb25a" opacity=".18" filter="url(#b6)"/>')
        add(f'<rect x="{f(x)}" y="{y+h/2-1}" width="{wwid}" height="2" fill="#2b2240" opacity=".8"/>')
        x += step

# right wing (tall, brick) and a far-right tower
brick_block(1170, 330, 640, 380, band=28)
windows(1205, 1800, 395, 92, 58, 30, .75)
windows(1205, 1800, 520, 92, 58, 30, .6)
for px in range(1190, 1800, 116):
    add(f'<rect x="{px}" y="358" width="10" height="352" fill="#4d2621" opacity=".55"/>')
brick_block(1560, 250, 250, 90, band=20)

# left low wing
brick_block(470, 470, 190, 240, band=22)
windows(492, 660, 525, 70, 46, 26, .8)
windows(492, 660, 615, 60, 46, 26, .5)

# cylinder helper: front half of an ellipse
def arc_front(cx, rx, ry, y):
    return f"M{cx-rx},{y} A{rx},{ry} 0 0 0 {cx+rx},{y}"

def cyl_y(cx, rx, ry, y, x):
    t = (x - cx) / rx
    return y + ry * math.sqrt(max(0.0, 1 - t * t))

def cylinder(cx, rx, ry, top, bottom, fill, mull_step_deg, panes=True, rows=2):
    add(f'<path d="{arc_front(cx,rx,ry,top)} L{cx+rx},{bottom} A{rx},{ry} 0 0 1 {cx-rx},{bottom} Z" fill="{fill}"/>')
    # lit panes between mullions
    angles = list(range(-84, 85, mull_step_deg))
    xs = [cx + rx * math.sin(math.radians(a)) for a in angles]
    if panes:
        for i in range(len(xs) - 1):
            xa, xb = xs[i], xs[i + 1]
            for r in range(rows):
                ya = cyl_y(cx, rx, ry, top, xa) + (bottom - top) * r / rows + 5
                yb = cyl_y(cx, rx, ry, top, xb) + (bottom - top) * r / rows + 5
                hh = (bottom - top) / rows - 10
                if random.random() < .82:
                    op = random.uniform(.35, .95)
                    add(f'<path d="M{f(xa+2)},{f(ya)} L{f(xb-2)},{f(yb)} L{f(xb-2)},{f(yb+hh)} L{f(xa+2)},{f(ya+hh)} Z" fill="url(#pane)" opacity="{f(op)}"/>')
    for x in xs:
        add(f'<line x1="{f(x)}" y1="{f(cyl_y(cx,rx,ry,top,x))}" x2="{f(x)}" y2="{f(cyl_y(cx,rx,ry,bottom,x))}" stroke="#101634" stroke-width="3"/>')
    for r in range(1, rows):
        yy = top + (bottom - top) * r / rows
        add(f'<path d="{arc_front(cx,rx,ry,yy)}" fill="none" stroke="#101634" stroke-width="4"/>')
    # glass sheen
    add(f'<path d="{arc_front(cx,rx,ry,top)} L{cx+rx},{bottom} A{rx},{ry} 0 0 1 {cx-rx},{bottom} Z" fill="#9fc6ff" opacity=".08"/>')

# upper rotunda storey
cx = 905
cylinder(cx, 175, 24, 336, 430, "url(#glassUp)", 11, rows=1)
# roof rail and slab
add(f'<path d="{arc_front(cx,190,28,328)}" fill="none" stroke="#e8e3ee" stroke-width="5" opacity=".8"/>')
for a in range(-80, 81, 8):
    x = cx + 188 * math.sin(math.radians(a))
    y = cyl_y(cx, 188, 28, 328, x)
    add(f'<line x1="{f(x)}" y1="{f(y)}" x2="{f(x)}" y2="{f(y-16)}" stroke="#d9d4e6" stroke-width="1.6" opacity=".7"/>')
add(f'<path d="{arc_front(cx,190,28,312)}" fill="none" stroke="#d9d4e6" stroke-width="2" opacity=".7"/>')

# main rotunda with its red fascia
add(f'<path d="{arc_front(cx,285,44,432)} L{cx+285},{462} A285,44 0 0 1 {cx-285},{462} Z" fill="url(#fascia)"/>')
add(f'<path d="{arc_front(cx,285,44,432)}" fill="none" stroke="#f07a62" stroke-width="2" opacity=".7"/>')
add(f'<path d="{arc_front(cx,285,44,462)}" fill="none" stroke="#3a0d0a" stroke-width="4" opacity=".7"/>')
cylinder(cx, 268, 40, 466, 585, "url(#glassMain)", 9, rows=2)

# entrance canopy (curved band carrying the sign) and the lit lobby below
canopy_top, canopy_bot = 578, 616
add(f'<path d="{arc_front(cx,315,48,canopy_top)} L{cx+315},{canopy_bot} A315,48 0 0 1 {cx-315},{canopy_bot} Z" fill="url(#canopy)"/>')
add(f'<path d="{arc_front(cx,315,48,canopy_top)}" fill="none" stroke="#ff8f6b" stroke-width="2" opacity=".75"/>')
add(f'<path id="signArc" d="{arc_front(cx,300,46,canopy_top+26)}" fill="none"/>')
add('<text font-family="Arial Black, Arial, Helvetica, sans-serif" font-weight="900" font-size="25" letter-spacing="2.5" fill="#ffd36e" filter="url(#signGlow)">'
    '<textPath href="#signArc" startOffset="50%" text-anchor="middle">CONVENTION CENTRE</textPath></text>')
# soffit glow under the canopy
add(f'<path d="{arc_front(cx,300,46,canopy_bot+2)}" fill="none" stroke="#ffcf8a" stroke-width="6" opacity=".7" filter="url(#b6)"/>')
lobby_top, lobby_bot = 622, 700
add(f'<path d="{arc_front(cx,292,46,lobby_top)} L{cx+292},{lobby_bot} A292,46 0 0 1 {cx-292},{lobby_bot} Z" fill="url(#entrance)"/>')
# lobby interior hints: doors, people-less frames, ceiling lights
for a in range(-78, 79, 6):
    x = cx + 292 * math.sin(math.radians(a))
    add(f'<line x1="{f(x)}" y1="{f(cyl_y(cx,292,46,lobby_top,x))}" x2="{f(x)}" y2="{f(cyl_y(cx,292,46,lobby_bot,x))}" stroke="#6b3a1c" stroke-width="1.6" opacity=".7"/>')
add(f'<path d="{arc_front(cx,292,46,lobby_top+30)}" fill="none" stroke="#7a4420" stroke-width="2" opacity=".5"/>')
# blue columns carrying the canopy
for a in (-62, -38, -14, 14, 38, 62):
    x = cx + 300 * math.sin(math.radians(a))
    y0 = cyl_y(cx, 300, 46, canopy_bot, x)
    y1 = cyl_y(cx, 300, 46, lobby_bot + 6, x)
    add(f'<rect x="{f(x-7)}" y="{f(y0)}" width="14" height="{f(y1-y0)}" fill="#2c4fb0"/>')
    add(f'<rect x="{f(x-7)}" y="{f(y0)}" width="4" height="{f(y1-y0)}" fill="#7fa3ff" opacity=".6"/>')
# light spilling from the lobby
add(f'<ellipse cx="{cx}" cy="735" rx="360" ry="46" fill="#ffc07a" opacity=".55" filter="url(#b14)"/>')

# ── ground, steps, path ───────────────────────────────────────────────
add(f'<rect x="-100" y="700" width="{W+400}" height="260" fill="url(#ground)"/>')
for i in range(5):
    y = 704 + i * 7
    add(f'<path d="{arc_front(cx,300+i*18,48+i*3,y)}" fill="none" stroke="#e7b784" stroke-width="2" opacity="{f(.55-i*.08)}"/>')
# the walkway sweeping to the lower left
add('<path d="M720,742 C600,780 420,820 120,900 L520,900 C700,840 820,790 900,752 Z" fill="url(#path)" opacity=".95"/>')
add('<path d="M720,742 C600,780 420,820 120,900" fill="none" stroke="#ffd7a0" stroke-width="2" opacity=".5"/>')
add('<path d="M900,752 C820,790 700,840 520,900" fill="none" stroke="#ffd7a0" stroke-width="2" opacity=".35"/>')
# plaza toward the right
add('<path d="M980,748 C1120,780 1300,810 1800,830 L1800,900 L1000,900 C1040,850 1020,790 980,748 Z" fill="#2d2440" opacity=".85"/>')

# bollard lights along the walkway edges
def along(p0, p1, p2, p3, t):
    u = 1 - t
    return (u**3*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t**3*p3[0],
            u**3*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t**3*p3[1])

for curve in (((720,742),(600,780),(420,820),(120,900)), ((900,752),(820,790),(700,840),(520,900))):
    for k in range(1, 9):
        x, y = along(*curve, k / 9)
        s = .6 + k * .09
        add(f'<circle cx="{f(x)}" cy="{f(y-4*s)}" r="{f(30*s)}" fill="url(#lamp)" opacity=".9"/>')
        add(f'<rect x="{f(x-1.5*s)}" y="{f(y-6*s)}" width="{f(3*s)}" height="{f(8*s)}" fill="#1b1424"/>')

# lamp posts
def lamp_post(x, base, h, s=1.0):
    add(f'<line x1="{x}" y1="{base}" x2="{x}" y2="{base-h}" stroke="#15121f" stroke-width="{f(3.5*s)}"/>')
    add(f'<circle cx="{x}" cy="{base-h}" r="{f(80*s)}" fill="url(#lamp)"/>')
    add(f'<circle cx="{x}" cy="{base-h}" r="{f(4*s)}" fill="#fff6dc"/>')

lamp_post(640, 760, 110, .9)
lamp_post(1175, 748, 120, .95)
lamp_post(470, 820, 150, 1.15)
lamp_post(1380, 780, 140, 1.05)

# warm washes thrown up the facades by the lamps
for (x, y, rx, ry) in [(1175, 640, 120, 170), (1380, 650, 110, 160), (560, 660, 100, 130), (640, 640, 60, 110)]:
    add(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="#ffa24a" opacity=".22" filter="url(#b30)"/>')

# ── planting ──────────────────────────────────────────────────────────
def shrub_row(x0, x1, base, hmin, hmax):
    x = x0
    while x < x1:
        r = random.uniform(hmin, hmax)
        add(f'<ellipse cx="{f(x)}" cy="{f(base)}" rx="{f(r*1.3)}" ry="{f(r)}" fill="url(#shrub)"/>')
        x += r * 1.6

shrub_row(440, 690, 712, 14, 24)
shrub_row(1120, 1800, 720, 16, 30)
shrub_row(960, 1150, 735, 10, 18)

def palm(x, base, h, lean, s=1.0, color="#0e231b"):
    tx, ty = x + lean, base - h
    add(f'<path d="M{x},{base} Q{f(x+lean*.3)},{f(base-h*.55)} {f(tx)},{f(ty)}" fill="none" stroke="#1d1712" stroke-width="{f(7*s)}" stroke-linecap="round"/>')
    for k in range(9):
        ang = math.radians(-172 + k * 20.5 + random.uniform(-6, 6))
        L = random.uniform(85, 120) * s
        out_x = math.cos(ang) * L
        ex, ey = tx + out_x, ty + L * (.25 + .5 * abs(math.cos(ang)))
        mx, my = tx + out_x * .55, ty - L * (.28 - .2 * abs(math.cos(ang)))
        add(f'<path d="M{f(tx)},{f(ty)} Q{f(mx)},{f(my)} {f(ex)},{f(ey)}" fill="none" stroke="{color}" stroke-width="{f(9*s)}" stroke-linecap="round"/>')
        for j in range(1, 7):
            t = j / 7
            px = (1-t)**2*tx + 2*(1-t)*t*mx + t*t*ex
            py = (1-t)**2*ty + 2*(1-t)*t*my + t*t*ey
            add(f'<path d="M{f(px)},{f(py)} l{f(math.cos(ang+1.2)*14*s)},{f(math.sin(ang+1.2)*14*s+8*s)} M{f(px)},{f(py)} l{f(math.cos(ang-1.2)*14*s)},{f(math.sin(ang-1.2)*14*s+8*s)}" stroke="{color}" stroke-width="{f(3*s)}" stroke-linecap="round"/>')

palm(1300, 725, 250, 26, 1.0)
palm(1520, 735, 300, -30, 1.15)
palm(560, 715, 210, -18, .85)
palm(160, 760, 260, 20, 1.0, "#0b1d17")

# foreground leaves (soft, as if nearer the camera)
def big_leaf(x, y, L, ang, wdt, color):
    a = math.radians(ang)
    ex, ey = x + math.cos(a) * L, y + math.sin(a) * L
    nx, ny = -math.sin(a) * wdt, math.cos(a) * wdt
    mx, my = (x + ex) / 2, (y + ey) / 2
    add(f'<path d="M{f(x)},{f(y)} Q{f(mx+nx)},{f(my+ny)} {f(ex)},{f(ey)} Q{f(mx-nx)},{f(my-ny)} {f(x)},{f(y)} Z" fill="{color}"/>')
    add(f'<path d="M{f(x)},{f(y)} L{f(ex)},{f(ey)}" stroke="#4f8a4f" stroke-width="1.5" opacity=".5"/>')

add('<g filter="url(#b2)">')
for (x, y, L, ang, w) in [(760, 905, 170, -70, 36), (800, 910, 150, -105, 30), (720, 910, 140, -40, 28),
                          (1080, 905, 190, -60, 40), (1130, 910, 170, -95, 34), (1030, 910, 150, -125, 30),
                          (1450, 905, 200, -80, 42), (1520, 910, 170, -115, 36), (1390, 910, 160, -50, 32),
                          (300, 905, 170, -75, 36), (360, 910, 140, -110, 30)]:
    big_leaf(x, y, L, ang, w, "url(#leaf)")
add('</g>')

# warm uplights catching the foliage
for x in (700, 1090, 1460, 330):
    add(f'<ellipse cx="{x}" cy="880" rx="90" ry="30" fill="#ffb25a" opacity=".22" filter="url(#b14)"/>')

add('</g>')
add(f'<rect width="{W}" height="{H}" fill="url(#vignette)"/>')
add('</svg>')

open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "ifpc", "hero-convention-dusk.svg"), "w", encoding="utf-8").write("\n".join(out))
print("bytes", sum(len(s) + 1 for s in out))
