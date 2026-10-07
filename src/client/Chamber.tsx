import { useEffect, useRef, useState } from 'react';
import type { CreatureView } from '../shared/types.ts';
import { CHAMBER_URL, PHONE_CHAMBER_URL, creatureLayers, describeCreature } from './creature-render.ts';
import type { RenderLayer } from './creature-render.ts';

interface Scene { update: (layers: RenderLayer[]) => Promise<void>; motion: () => void }
/** Scene lifetime is independent of anatomy revisions and transport/session ownership. */
export function Chamber({ creature, motion }: { creature: CreatureView | null; motion: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<'loading' | 'ready' | 'static' | 'error'>('loading');
  const [backgroundFailed, setBackgroundFailed] = useState(false);
  const projection = creatureLayers(creature);
  const signature = JSON.stringify(creature?.parts ?? null);
  const latest = useRef(projection.layers); latest.current = projection.layers;
  const motionRef = useRef(motion);
  const engine = useRef<Scene | null>(null);
  useEffect(() => { motionRef.current = motion; engine.current?.motion(); }, [motion]);
  useEffect(() => { void engine.current?.update(latest.current); }, [signature]);
  useEffect(() => {
    if (!host.current) return;
    const element = host.current;
    let disposed = false;
    let cleanup = () => {};
    setState('loading');
    async function start() {
      const { Application, Container, Sprite, Texture } = await import('pixi.js');
      const app = new Application();
      let initialized = false;
      try {
        await app.init({ width: 1024, height: 1536, backgroundAlpha: 0, autoStart: false, preference: 'webgl', resolution: Math.min(devicePixelRatio, 1.5), antialias: false });
        initialized = true;
        if (disposed) { app.destroy({ removeView: true }, { children: true }); return; }
        const stage = new Container();
        const body = new Container({ x: 512, y: 756 }); stage.addChild(body); app.stage.addChild(stage);
        const sprites = new Map<string, { sprite: InstanceType<typeof Sprite>; height: number; eye: boolean }>();
        const textures = new Map<string, InstanceType<typeof Texture>>();
        const images = new Map<string, Promise<HTMLImageElement>>();
        let generation = 0; let visible = true; let elapsed = 0; let accentUntil = 0;
        const load = (url: string) => {
          let promise = images.get(url);
          if (!promise) {
            promise = new Promise<HTMLImageElement>((resolve, reject) => {
              const image = new Image();
              const timeout = setTimeout(() => reject(new Error('Artwork load timed out')), 15_000);
              image.onload = () => { clearTimeout(timeout); resolve(image); };
              image.onerror = () => { clearTimeout(timeout); reject(new Error('Artwork unavailable')); };
              image.src = url;
            }); images.set(url, promise);
          }
          return promise;
        };
        const updateMotion = () => {
          const animate = motionRef.current && visible && document.visibilityState === 'visible';
          element.parentElement?.setAttribute('data-animate', String(animate));
          if (animate) app.start();
          else { app.stop(); body.scale.set(1); body.rotation = 0; body.y = 756; for (const p of sprites.values()) p.sprite.height = p.height; app.render(); }
        };
        const update = async (layers: RenderLayer[]) => {
          const requested = ++generation;
          setState('loading');
          let decoded: HTMLImageElement[];
          try { decoded = await Promise.all(layers.map(l => load(l.asset.url))); }
          catch { if (!disposed && requested === generation) setState('error'); return; }
          if (disposed || requested !== generation) return;
          const keys = new Set(layers.map(l => l.key));
          for (const [key, value] of sprites) if (!keys.has(key)) { body.removeChild(value.sprite); value.sprite.destroy(); sprites.delete(key); }
          for (const [index, layer] of layers.entries()) {
            let texture = textures.get(layer.asset.url);
            if (!texture) { texture = Texture.from(decoded[index]!); textures.set(layer.asset.url, texture); }
            let value = sprites.get(layer.key);
            if (!value) { value = { sprite: new Sprite(texture), height: layer.height, eye: layer.asset.slot === 'eyes' }; sprites.set(layer.key, value); body.addChild(value.sprite); }
            value.sprite.texture = texture; value.height = layer.height; value.eye = layer.asset.slot === 'eyes';
            value.sprite.anchor.set(.5); value.sprite.position.set(layer.x - 300, layer.y - 360);
            value.sprite.scale.set(1); value.sprite.width = layer.width; value.sprite.height = layer.height;
            value.sprite.alpha = layer.opacity;
            if (layer.mirror) value.sprite.scale.x *= -1;
            body.setChildIndex(value.sprite, index);
          }
          const used = new Set(layers.map(l => l.asset.url));
          for (const [url, texture] of textures) if (textures.size > 16 && !used.has(url)) { texture.destroy(true); textures.delete(url); images.delete(url); }
          // One short accent targets the latest anatomy, never one queued animation per injection.
          accentUntil = elapsed + .35; element.dataset.parts = layers.map(l => l.asset.id).join(',');
          element.dataset.composition = layers.map(l => l.key).join(','); element.dataset.textureCount = String(textures.size);
          setState('ready'); updateMotion(); app.render();
        };
        engine.current = { update, motion: updateMotion };
        element.appendChild(app.canvas); app.canvas.setAttribute('aria-hidden', 'true');
        app.ticker.maxFPS = matchMedia('(pointer: coarse)').matches ? 30 : 60;
        app.ticker.add(ticker => {
          elapsed += ticker.deltaMS / 1000;
          const accent = Math.max(0, accentUntil - elapsed) * .035;
          body.scale.set(1 + Math.sin(elapsed * 1.3) * .012 + accent, 1 + Math.cos(elapsed * 1.3) * .014 + accent);
          body.rotation = Math.sin(elapsed * .7) * .008; body.y = 756 + Math.sin(elapsed * 1.1) * 5;
          const blink = elapsed % 11 < .13 ? .15 : 1;
          for (const p of sprites.values()) if (p.eye) p.sprite.height = p.height * blink;
        });
        const resize = () => { const width = element.clientWidth; app.renderer.resize(width, width * 1.5); stage.scale.set(width / 1024); app.render(); };
        const observer = new ResizeObserver(resize); observer.observe(element); resize();
        const intersection = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? true; updateMotion(); }); intersection.observe(element);
        document.addEventListener('visibilitychange', updateMotion);
        cleanup = () => {
          generation++; observer.disconnect(); intersection.disconnect(); document.removeEventListener('visibilitychange', updateMotion);
          engine.current = null; app.destroy({ removeView: true }, { children: true });
          for (const texture of textures.values()) texture.destroy(true); textures.clear(); images.clear();
        };
        await update(latest.current);
      } catch {
        if (initialized) app.destroy({ removeView: true }, { children: true });
        if (!disposed) setState('static');
      }
    }
    void start().catch(() => { if (!disposed) setState('static'); });
    return () => { disposed = true; cleanup(); };
  }, [attempt]);
  const failure = backgroundFailed || state === 'error' || projection.missing.length > 0;
  return <figure className={`chamber ${motion ? '' : 'chamber-still'}`}>
    <div className="chamber-stage">
      <picture key={attempt}><source media="(max-width: 640px)" srcSet={PHONE_CHAMBER_URL} /><img className="chamber-backdrop" src={CHAMBER_URL} alt="" onError={() => setBackgroundFailed(true)} onLoad={() => setBackgroundFailed(false)} /></picture>
      <div className="chamber-canvas" role="img" aria-label={describeCreature(creature)} ref={host} style={{ visibility: state === 'ready' ? 'visible' : 'hidden' }} />
      {state !== 'ready' && <div className="static-creature" aria-hidden="true">{projection.layers.map(layer => <img key={layer.key} src={layer.asset.url} alt="" style={{ left: `${layer.x / 6}%`, top: `${layer.y / 7.2}%`, width: `${layer.width / 6}%`, height: `${layer.height / 7.2}%`, transform: `translate(-50%, -50%)${layer.mirror ? ' scaleX(-1)' : ''}`, zIndex: layer.order + 5, opacity: layer.opacity }} />)}</div>}
      <div className="chamber-glass" aria-hidden="true" /><div className="chamber-fluid" aria-hidden="true"><span /><span /><span /></div>
      {state === 'loading' && <p className="art-notice" role="status">Preparing the chamber artwork… Controls remain available.</p>}
      {failure && <div className="art-notice" role="status"><p>Some laboratory artwork is unavailable. Your connection controls remain available.</p><button onClick={() => { setBackgroundFailed(false); setAttempt(n => n + 1); }}>Retry artwork</button></div>}
    </div>
    <figcaption>{creature ? 'Shared specimen · public anatomy' : 'Starter preview · awaiting specimen initialization'}{state === 'static' ? ' · static graphics fallback' : ''}</figcaption>
  </figure>;
}
