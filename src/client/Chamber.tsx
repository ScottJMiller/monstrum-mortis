import { useEffect, useRef, useState } from 'react';
import type { CreatureView } from '../shared/types.ts';
import { CHAMBER_URL, PHONE_CHAMBER_URL, creatureLayers, describeCreature } from './creature-render.ts';

/** Asset/graphics lifecycle is deliberately independent of room admission and transport. */
export function Chamber({ creature, motion }: { creature: CreatureView | null; motion: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<'loading' | 'ready' | 'static' | 'error'>('loading');
  const [backgroundFailed, setBackgroundFailed] = useState(false);
  const projection = creatureLayers(creature);
  const signature = JSON.stringify(creature?.parts ?? null);
  const motionRef = useRef(motion);
  const engine = useRef<{ motion: () => void } | null>(null);
  useEffect(() => { motionRef.current = motion; engine.current?.motion(); }, [motion]);
  useEffect(() => {
    if (!host.current) return;
    const element = host.current;
    let disposed = false;
    let cleanup = () => {};
    setState('loading');
    async function start() {
      let images: HTMLImageElement[];
      // Decode first so a texture failure has its own explicit retry and a usable static fallback.
      try {
        images = await Promise.all(projection.layers.map(layer => new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          const timeout = setTimeout(() => reject(new Error('Artwork load timed out')), 15_000);
          image.onload = () => { clearTimeout(timeout); resolve(image); };
          image.onerror = () => { clearTimeout(timeout); reject(new Error('Artwork unavailable')); };
          image.src = layer.asset.url;
        })));
      } catch { if (!disposed) setState('error'); return; }
      if (disposed) return;
      const { Application, Container, Sprite, Texture } = await import('pixi.js');
      const app = new Application();
      let initialized = false;
      try {
        await app.init({ width: 1024, height: 1536, backgroundAlpha: 0, autoStart: false, preference: 'webgl', resolution: Math.min(devicePixelRatio, 1.5), antialias: false });
        initialized = true;
        if (disposed) { app.destroy({ removeView: true }, { children: true }); return; }
        const stage = new Container();
        const body = new Container({ x: 512, y: 756 });
        stage.addChild(body); app.stage.addChild(stage);
        const sprites: { sprite: InstanceType<typeof Sprite>; height: number; eye: boolean }[] = [];
        for (const [index, layer] of projection.layers.entries()) {
          const texture = Texture.from(images[index]!);
          const sprite = new Sprite(texture); sprite.anchor.set(.5); sprite.position.set(layer.x - 300, layer.y - 360);
          sprite.width = layer.width; sprite.height = layer.height;
          if (layer.mirror) sprite.scale.x *= -1;
          body.addChild(sprite); sprites.push({ sprite, height: layer.height, eye: layer.asset.slot === 'eyes' });
        }
        if (disposed) { app.destroy({ removeView: true }, { children: true, texture: true, textureSource: true }); return; }
        element.appendChild(app.canvas); app.canvas.setAttribute('aria-hidden', 'true');
        let visible = true; let elapsed = 0;
        const updateMotion = () => {
          const animate = motionRef.current && visible && document.visibilityState === 'visible';
          element.parentElement?.setAttribute('data-animate', String(animate));
          if (animate) app.start();
          else { app.stop(); body.scale.set(1); body.rotation = 0; body.y = 756; for (const p of sprites) p.sprite.height = p.height; app.render(); }
        };
        engine.current = { motion: updateMotion };
        app.ticker.maxFPS = matchMedia('(pointer: coarse)').matches ? 30 : 60;
        app.ticker.add(ticker => {
          elapsed += ticker.deltaMS / 1000;
          body.scale.set(1 + Math.sin(elapsed * 1.3) * .012, 1 + Math.cos(elapsed * 1.3) * .014);
          body.rotation = Math.sin(elapsed * .7) * .008; body.y = 756 + Math.sin(elapsed * 1.1) * 5;
          const blink = elapsed % 11 < .13 ? .15 : 1;
          for (const p of sprites) if (p.eye) p.sprite.height = p.height * blink;
        });
        const resize = () => { const width = element.clientWidth; app.renderer.resize(width, width * 1.5); stage.scale.set(width / 1024); app.render(); };
        const observer = new ResizeObserver(resize); observer.observe(element); resize();
        const intersection = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? true; updateMotion(); }); intersection.observe(element);
        document.addEventListener('visibilitychange', updateMotion); updateMotion();
        cleanup = () => { observer.disconnect(); intersection.disconnect(); document.removeEventListener('visibilitychange', updateMotion); engine.current = null; app.destroy({ removeView: true }, { children: true, texture: true, textureSource: true }); };
        setState('ready');
      } catch {
        if (initialized) app.destroy({ removeView: true }, { children: true, texture: true, textureSource: true });
        if (!disposed) setState('static');
      }
    }
    void start().catch(() => { if (!disposed) setState('static'); });
    return () => { disposed = true; cleanup(); };
    // A snapshot's public composition, not its timer/revision, controls artwork loading.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, attempt]);
  const failure = backgroundFailed || state === 'error' || projection.missing.length > 0;
  return <figure className={`chamber ${motion ? '' : 'chamber-still'}`}>
    <div className="chamber-stage">
      <picture key={attempt}><source media="(max-width: 640px)" srcSet={PHONE_CHAMBER_URL} /><img className="chamber-backdrop" src={CHAMBER_URL} alt="" onError={() => setBackgroundFailed(true)} onLoad={() => setBackgroundFailed(false)} /></picture>
      <div className="chamber-canvas" role="img" aria-label={describeCreature(creature)} ref={host} />
      {(state === 'static' || state === 'error') && <div className="static-creature" aria-hidden="true">{projection.layers.map(layer => <img key={layer.key} src={layer.asset.url} alt="" style={{ left: `${layer.x / 6}%`, top: `${layer.y / 7.2}%`, width: `${layer.width / 6}%`, height: `${layer.height / 7.2}%`, transform: `translate(-50%, -50%)${layer.mirror ? ' scaleX(-1)' : ''}`, zIndex: layer.order + 5 }} />)}</div>}
      <div className="chamber-glass" aria-hidden="true" /><div className="chamber-fluid" aria-hidden="true"><span /><span /><span /></div>
      {state === 'loading' && <p className="art-notice" role="status">Preparing the chamber artwork… Controls remain available.</p>}
      {failure && <div className="art-notice" role="status"><p>Some laboratory artwork is unavailable. Your connection controls remain available.</p><button onClick={() => { setBackgroundFailed(false); setAttempt(n => n + 1); }}>Retry artwork</button></div>}
    </div>
    <figcaption>{creature ? 'Shared specimen · public anatomy' : 'Starter preview · awaiting specimen initialization'}{state === 'static' ? ' · static graphics fallback' : ''}</figcaption>
  </figure>;
}
