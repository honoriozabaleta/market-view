import { useEffect, useRef } from 'react';
import landPoints from '../assets/land-points.json';

/**
 * A slowly turning dotted globe with signals travelling between financial centres.
 * Purely decorative (aria-hidden). Land outline: Natural Earth 1:110m, public domain.
 */

const D = Math.PI / 180;
type City = { name: string; lat: number; lon: number; label?: boolean };
const CITIES: City[] = [
  { name: 'New York', lat: 40.71, lon: -74.01, label: true },
  { name: 'London', lat: 51.51, lon: -0.13 },
  { name: 'Zurich', lat: 47.37, lon: 8.54, label: true },
  { name: 'Frankfurt', lat: 50.11, lon: 8.68 },
  { name: 'Tokyo', lat: 35.68, lon: 139.69, label: true },
  { name: 'Hong Kong', lat: 22.32, lon: 114.17, label: true },
  { name: 'Singapore', lat: 1.35, lon: 103.82 },
  { name: 'Mumbai', lat: 19.08, lon: 72.88 },
  { name: 'Dubai', lat: 25.2, lon: 55.27 },
  { name: 'São Paulo', lat: -23.55, lon: -46.63 },
  { name: 'Buenos Aires', lat: -34.6, lon: -58.38, label: true },
  { name: 'Sydney', lat: -33.87, lon: 151.21 },
];
const ARCS: [string, string][] = [
  ['New York', 'London'],
  ['London', 'Zurich'],
  ['New York', 'São Paulo'],
  ['São Paulo', 'Buenos Aires'],
  ['Frankfurt', 'Dubai'],
  ['Dubai', 'Mumbai'],
  ['Mumbai', 'Singapore'],
  ['Singapore', 'Hong Kong'],
  ['Hong Kong', 'Tokyo'],
  ['Singapore', 'Sydney'],
  ['Zurich', 'Hong Kong'],
  ['New York', 'Frankfurt'],
  ['Tokyo', 'New York'],
];

type V3 = [number, number, number];
const toVec = (lat: number, lon: number): V3 => [
  Math.cos(lat * D) * Math.sin(lon * D),
  Math.sin(lat * D),
  Math.cos(lat * D) * Math.cos(lon * D),
];

function arcPath(a: V3, b: V3, steps = 72): V3[] {
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const om = Math.acos(dot);
  const s = Math.sin(om) || 1;
  const lift = 0.06 + 0.22 * (om / Math.PI);
  const pts: V3[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const k1 = Math.sin((1 - t) * om) / s;
    const k2 = Math.sin(t * om) / s;
    const e = 1 + lift * Math.sin(Math.PI * t);
    pts.push([
      (k1 * a[0] + k2 * b[0]) * e,
      (k1 * a[1] + k2 * b[1]) * e,
      (k1 * a[2] + k2 * b[2]) * e,
    ]);
  }
  return pts;
}

export function Globe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const raw = landPoints as number[];
    const n = raw.length / 2;
    const land = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const v = toVec(raw[i * 2 + 1], raw[i * 2]);
      land.set(v, i * 3);
    }
    const city = new Map(CITIES.map((c) => [c.name, { ...c, v: toVec(c.lat, c.lon) }]));
    const arcs = ARCS.map(([a, b], i) => ({
      pts: arcPath(city.get(a)!.v, city.get(b)!.v),
      to: city.get(b)!.v,
      offset: i * 0.83,
    }));

    let w = 0;
    let h = 0;
    let dpr = 1;
    let R = 0;
    let cx = 0;
    let cy = 0;
    let lambda = -35 * D; // centre longitude: the Atlantic faces the viewer first
    let phi = 0.36; // tilt towards the north, where most financial centres are
    let spin = -0.00007; // radians per ms
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let lastT = 0;
    let raf = 0;
    let visible = true;
    let t0 = performance.now();

    let cl = 1,
      sl = 0,
      cp = 1,
      sp = 0;
    const project = (v: V3 | Float32Array, o = 0) => {
      const x = v[o],
        y = v[o + 1],
        z = v[o + 2];
      const xr = x * cl - z * sl;
      const zr = x * sl + z * cl;
      const yr = y * cp - zr * sp;
      const zz = y * sp + zr * cp;
      return { x: cx + xr * R, y: cy - yr * R, z: zz };
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      R = Math.min(w, h) * 0.42;
      cx = w / 2;
      cy = h / 2;
    };

    const draw = (now: number) => {
      const t = (now - t0) / 1000;
      cl = Math.cos(lambda);
      sl = Math.sin(lambda);
      cp = Math.cos(phi);
      sp = Math.sin(phi);
      ctx.clearRect(0, 0, w, h);

      // atmosphere
      const glow = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, R * 1.28);
      glow.addColorStop(0, 'rgba(91,140,255,0.22)');
      glow.addColorStop(1, 'rgba(91,140,255,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.28, 0, Math.PI * 2);
      ctx.fill();

      // sphere body
      const body = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
      body.addColorStop(0, '#1d2c58');
      body.addColorStop(0.65, '#111a35');
      body.addColorStop(1, '#0b1124');
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(127,162,255,0.28)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // land dots, back side first for depth
      const size = Math.max(0.9, R / 190);
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < n; i++) {
          const p = project(land, i * 3);
          if (pass === 0 ? p.z >= 0 : p.z < 0) continue;
          if (pass === 0) {
            ctx.fillStyle = 'rgba(160,185,255,0.07)';
            ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
          } else {
            const a = 0.25 + 0.7 * p.z;
            ctx.fillStyle = `rgba(206,222,255,${a.toFixed(3)})`;
            const s = size * (0.75 + 0.6 * p.z);
            ctx.beginPath();
            ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // arcs: faint path plus a travelling signal
      for (const arc of arcs) {
        const proj = arc.pts.map((v) => project(v));
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(91,227,168,0.16)';
        ctx.beginPath();
        let pen = false;
        for (const p of proj) {
          if (p.z > -0.05) {
            if (pen) ctx.lineTo(p.x, p.y);
            else ctx.moveTo(p.x, p.y);
            pen = true;
          } else pen = false;
        }
        ctx.stroke();

        const cycle = 5.2;
        const prog = ((((t + arc.offset) % cycle) + cycle) % cycle) / 2.4;
        if (prog <= 1) {
          const head = Math.floor(prog * (proj.length - 1));
          const tail = Math.max(0, head - 16);
          for (let i = tail; i < head; i++) {
            const p1 = proj[i],
              p2 = proj[i + 1];
            if (p1.z < -0.05 || p2.z < -0.05) continue;
            const k = (i - tail) / Math.max(1, head - tail);
            ctx.strokeStyle = `rgba(140,255,205,${(0.15 + 0.85 * k).toFixed(3)})`;
            ctx.lineWidth = 1 + 1.6 * k;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
          const hp = proj[head];
          if (hp.z > -0.05) {
            ctx.fillStyle = 'rgba(200,255,230,0.95)';
            ctx.beginPath();
            ctx.arc(hp.x, hp.y, 2.2, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (prog < 1.45) {
          const p = project(arc.to);
          if (p.z > 0) {
            const k = (prog - 1) / 0.45;
            ctx.strokeStyle = `rgba(91,227,168,${(0.7 * (1 - k)).toFixed(3)})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3 + 14 * k, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }

      // cities
      ctx.font = '600 11px "Inter Variable", system-ui, sans-serif';
      ctx.textBaseline = 'middle';
      for (const c of city.values()) {
        const p = project(c.v);
        if (p.z <= 0.05) continue;
        const pulse = (Math.sin(t * 2.2 + c.lon) + 1) / 2;
        ctx.fillStyle = `rgba(127,162,255,${(0.18 + 0.2 * pulse) * p.z})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5 + 3 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * p.z})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
        ctx.fill();
        if (c.label && p.z > 0.3 && R > 120) {
          ctx.fillStyle = `rgba(238,241,247,${(0.85 * p.z).toFixed(3)})`;
          ctx.fillText(c.name, p.x + 8, p.y);
        }
      }
    };

    const loop = (now: number) => {
      if (!dragging) {
        const dt = Math.min(50, now - (lastT || now));
        lambda += spin * dt;
        spin += (-0.00007 - spin) * 0.02; // ease back to cruising speed after a flick
      }
      lastT = now;
      draw(now);
      raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
    };
    const start = () => {
      if (reduce) {
        draw(performance.now());
        return;
      }
      if (!raf) {
        lastT = 0;
        raf = requestAnimationFrame(loop);
      }
    };

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      lambda -= dx / R;
      phi = Math.max(0.05, Math.min(0.75, phi + dy / (R * 2)));
      spin = -dx / R / 16;
      if (reduce) draw(performance.now());
    };
    const onUp = () => {
      dragging = false;
    };

    resize();
    t0 = performance.now();
    start();
    const ro = new ResizeObserver(() => {
      resize();
      if (reduce || !raf) draw(performance.now());
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    io.observe(canvas);
    const onVis = () => {
      if (!document.hidden) start();
    };
    document.addEventListener('visibilitychange', onVis);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
    };
  }, []);

  return (
    <div className="globe-wrap">
      <canvas ref={canvasRef} className="globe" aria-hidden="true" />
      <span className="globe-caption" aria-hidden="true">
        Drag to spin
      </span>
    </div>
  );
}
