import { useEffect, useRef, useState } from 'react';
import type { VREnvironment } from '../types/domain';

interface CareerWorldCanvasProps {
  environment: VREnvironment;
}

interface PlayerState {
  x: number;
  y: number;
  yaw: number;
}

type HotspotKind = 'monitor' | 'whiteboard' | 'server' | 'notes' | 'bookshelf' | 'mug' | 'core';

interface KnowledgeHotspot {
  id: string;
  kind: HotspotKind;
  title: string;
  represents: string;
  content: string;
}

const AI_ENGINEERING_HOTSPOTS: KnowledgeHotspot[] = [
  {
    id: 'desk-monitor',
    kind: 'monitor',
    title: 'Desk + monitor',
    represents: 'Daily coding work',
    content:
      'AI engineers write production code daily—often Python, plus tools like PyTorch or TensorFlow.',
  },
  {
    id: 'whiteboard-workflow',
    kind: 'whiteboard',
    title: 'Whiteboard workflow',
    represents: 'The ML workflow',
    content:
      'A typical pipeline moves from data collection to cleaning, training, evaluation, and deployment.',
  },
  {
    id: 'server-rack',
    kind: 'server',
    title: 'Server rack',
    represents: 'Infrastructure and deployment',
    content:
      'Models do not just run on a laptop—engineers deploy GPU clusters or cloud infrastructure like AWS or GCP.',
  },
  {
    id: 'sticky-notes',
    kind: 'notes',
    title: 'Sticky notes and task board',
    represents: 'Day-to-day collaboration',
    content: 'Most AI teams work in sprints alongside data scientists and product managers.',
  },
  {
    id: 'bookshelf-certificates',
    kind: 'bookshelf',
    title: 'Bookshelf and certificates',
    represents: 'Skills and background',
    content:
      'Common backgrounds include a computer science degree, ML coursework, or self-taught projects and Kaggle work.',
  },
  {
    id: 'coffee-mug',
    kind: 'mug',
    title: 'Coffee mug and desk clutter',
    represents: 'Ambience only',
    content:
      'Not every object needs to be interactive. Real workspaces include room for focus, breaks, and everyday routines.',
  },
  {
    id: 'ai-core',
    kind: 'core',
    title: 'AI core',
    represents: 'The role at a glance',
    content:
      'AI engineering combines software development, data, model evaluation, and deployment into systems people can use.',
  },
];

const WORLD_LIMIT = 7;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(x + width, y + height, x, y + height, safeRadius);
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
}

function drawPortal(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  environment: VREnvironment,
  scale: number,
  time: number,
) {
  const isData = environment.key === 'data-insights-studio';
  const accent = isData ? '#6fe3f7' : '#c8ef65';
  const shell = isData ? '#ede9db' : '#1f292c';
  const interior = isData ? '#faf8ef' : '#0d171a';

  context.save();
  context.translate(x, y);
  context.scale(scale, scale);
  context.shadowColor = accent;
  context.shadowBlur = isData ? 14 : 24;
  context.shadowOffsetY = 4;

  context.fillStyle = 'rgba(16, 22, 22, 0.2)';
  context.beginPath();
  context.ellipse(width / 2, height + 20, width * 0.62, 18, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = shell;
  drawRoundedRect(context, 0, 0, width, height, 22);
  context.fill();
  context.shadowBlur = 0;
  context.shadowOffsetY = 0;
  context.strokeStyle = accent;
  context.lineWidth = 3;
  context.stroke();

  context.fillStyle = interior;
  drawRoundedRect(context, 12, 14, width - 24, height - 18, 16);
  context.fill();

  context.strokeStyle = `rgba(255, 255, 255, ${0.18 + Math.sin(time / 700) * 0.04})`;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(22, 38);
  context.lineTo(width - 22, 38);
  context.stroke();

  if (isData) {
    context.strokeStyle = accent;
    context.lineWidth = 4;
    [0.26, 0.48, 0.74].forEach((bar, index) => {
      const barHeight = 32 + index * 18;
      context.beginPath();
      context.moveTo(width * bar, height - 28);
      context.lineTo(width * bar, height - 28 - barHeight);
      context.stroke();
    });
    context.beginPath();
    context.arc(width * 0.7, height * 0.47, 28, 0, Math.PI * 1.65);
    context.stroke();
  } else {
    context.strokeStyle = accent;
    context.lineWidth = 2;
    context.beginPath();
    context.arc(width * 0.52, height * 0.52, 34, 0, Math.PI * 2);
    context.stroke();
    [
      [0.34, 0.4],
      [0.7, 0.38],
      [0.4, 0.7],
      [0.68, 0.68],
    ].forEach(([nodeX, nodeY]) => {
      context.beginPath();
      context.arc(width * nodeX, height * nodeY, 5, 0, Math.PI * 2);
      context.fillStyle = accent;
      context.fill();
      context.beginPath();
      context.moveTo(width * 0.52, height * 0.52);
      context.lineTo(width * nodeX, height * nodeY);
      context.stroke();
    });
  }

  context.fillStyle = accent;
  context.font = '700 9px DM Mono, monospace';
  context.letterSpacing = '1px';
  context.fillText('WORLD PORTAL', 22, 25);
  context.font = '700 11px DM Mono, monospace';
  context.fillText(environment.title.toUpperCase(), 22, height - 14);
  context.restore();
}

interface HotspotAnchor {
  x: number;
  y: number;
  radius: number;
}

function getHotspotAnchor(
  hotspot: KnowledgeHotspot,
  width: number,
  horizon: number,
): HotspotAnchor {
  const centerX = width / 2;
  const anchors: Record<HotspotKind, { x: number; y: number; radius: number }> = {
    monitor: { x: -62, y: 30, radius: 30 },
    whiteboard: { x: -118, y: -42, radius: 28 },
    server: { x: 118, y: -36, radius: 28 },
    notes: { x: 55, y: 32, radius: 25 },
    bookshelf: { x: 142, y: 26, radius: 28 },
    mug: { x: -24, y: 44, radius: 20 },
    core: { x: 0, y: -36, radius: 27 },
  };
  const anchor = anchors[hotspot.kind];
  return { x: centerX + anchor.x, y: horizon + anchor.y, radius: anchor.radius };
}

function drawHotspotObject(
  context: CanvasRenderingContext2D,
  hotspot: KnowledgeHotspot,
  anchor: HotspotAnchor,
  accent: string,
  selected: boolean,
  time: number,
) {
  const { x, y } = anchor;
  context.save();
  context.translate(x, y);
  if (selected) {
    context.shadowColor = accent;
    context.shadowBlur = 16 + Math.sin(time / 280) * 4;
  }
  context.strokeStyle = accent;
  context.fillStyle = selected ? 'rgba(200, 239, 101, 0.22)' : 'rgba(25, 33, 32, 0.9)';
  context.lineWidth = selected ? 3 : 2;

  if (hotspot.kind === 'monitor') {
    context.fillRect(-20, -13, 40, 25);
    context.strokeRect(-20, -13, 40, 25);
    context.fillStyle = accent;
    context.fillRect(-14, -7, 28, 12);
    context.fillStyle = '#222a29';
    context.fillRect(-3, 12, 6, 12);
    context.fillRect(-14, 24, 28, 3);
  } else if (hotspot.kind === 'whiteboard') {
    context.fillStyle = '#f1f1e8';
    context.fillRect(-24, -18, 48, 30);
    context.strokeRect(-24, -18, 48, 30);
    context.strokeStyle = '#6b7e46';
    context.beginPath();
    context.moveTo(-17, -8);
    context.lineTo(-4, 0);
    context.lineTo(6, -10);
    context.lineTo(17, 2);
    context.stroke();
    context.fillStyle = '#222a29';
    context.fillRect(-19, 12, 4, 18);
    context.fillRect(15, 12, 4, 18);
  } else if (hotspot.kind === 'server') {
    context.fillStyle = '#1b292a';
    context.fillRect(-18, -25, 36, 50);
    context.strokeRect(-18, -25, 36, 50);
    for (let index = 0; index < 3; index += 1) {
      context.fillStyle = accent;
      context.fillRect(-11, -16 + index * 13, 22, 3);
      context.fillStyle = '#8c9584';
      context.beginPath();
      context.arc(11, -14 + index * 13, 2, 0, Math.PI * 2);
      context.fill();
    }
  } else if (hotspot.kind === 'notes') {
    const notes = [
      { x: -18, y: -5, color: '#e4b75d' },
      { x: 0, y: -15, color: '#c8ef65' },
      { x: 16, y: -2, color: '#e98d78' },
    ];
    notes.forEach((note) => {
      context.fillStyle = note.color;
      context.fillRect(note.x, note.y, 18, 16);
    });
    context.strokeStyle = '#273331';
    context.beginPath();
    context.moveTo(-25, 15);
    context.lineTo(25, 15);
    context.stroke();
  } else if (hotspot.kind === 'bookshelf') {
    context.fillStyle = '#5b493a';
    context.fillRect(-22, -28, 44, 56);
    context.strokeRect(-22, -28, 44, 56);
    context.fillStyle = '#e4b75d';
    context.fillRect(-16, -21, 6, 17);
    context.fillStyle = '#91b7c1';
    context.fillRect(-7, -21, 7, 17);
    context.fillStyle = '#d88473';
    context.fillRect(3, -21, 7, 17);
    context.fillStyle = '#dce5c4';
    context.fillRect(-16, 3, 26, 10);
  } else if (hotspot.kind === 'mug') {
    context.fillStyle = '#e7e1d2';
    context.fillRect(-11, -11, 22, 20);
    context.strokeRect(-11, -11, 22, 20);
    context.beginPath();
    context.arc(12, -1, 7, -Math.PI / 2, Math.PI / 2);
    context.stroke();
  } else {
    context.fillStyle = accent;
    context.beginPath();
    context.moveTo(0, -25 - Math.sin(time / 500) * 3);
    context.lineTo(14, -2);
    context.lineTo(0, 22);
    context.lineTo(-14, -2);
    context.closePath();
    context.fill();
    context.stroke();
  }

  context.shadowBlur = 0;
  context.fillStyle = '#202a29';
  context.font = '700 8px DM Mono, monospace';
  context.textAlign = 'center';
  context.fillText(hotspot.title.toUpperCase(), 0, anchor.radius + 13);
  context.restore();
}

function drawScene(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  environment: VREnvironment,
  player: PlayerState,
  time: number,
  selectedHotspotId: string | null,
) {
  const isData = environment.key === 'data-insights-studio';
  const accent = isData ? '#6fe3f7' : '#c8ef65';
  const background = context.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, isData ? '#223844' : '#152326');
  background.addColorStop(0.55, isData ? '#536e70' : '#334b46');
  background.addColorStop(1, '#e8e5d8');
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  const horizon = height * 0.47;
  context.fillStyle = 'rgba(245, 244, 239, 0.86)';
  context.fillRect(0, horizon, width, height - horizon);

  context.strokeStyle = 'rgba(58, 72, 65, 0.2)';
  context.lineWidth = 1;
  for (let index = -8; index <= 8; index += 1) {
    const baseX = width / 2 + index * (width / 18);
    context.beginPath();
    context.moveTo(width / 2 + (baseX - width / 2) * 0.08, horizon);
    context.lineTo(baseX, height);
    context.stroke();
  }
  for (let index = 1; index <= 8; index += 1) {
    const lineY = horizon + (height - horizon) * (index / 8) ** 1.8;
    context.beginPath();
    context.moveTo(0, lineY);
    context.lineTo(width, lineY);
    context.stroke();
  }

  context.fillStyle = 'rgba(255, 255, 255, 0.28)';
  context.beginPath();
  context.arc(width / 2, horizon - 12, 96 + Math.sin(time / 500) * 5, 0, Math.PI * 2);
  context.fill();

  const portalScale = Math.min(1, width / 900);
  drawPortal(
    context,
    width * 0.08,
    horizon - 150 * portalScale,
    230,
    150,
    environment,
    portalScale,
    time,
  );
  drawPortal(
    context,
    width * 0.62,
    horizon - 150 * portalScale,
    230,
    150,
    environment,
    portalScale,
    time,
  );

  context.save();
  context.translate(width / 2 + player.x * 14, horizon + 40 + player.y * 3);
  context.rotate(player.yaw * 0.15);
  context.fillStyle = '#212526';
  context.beginPath();
  context.arc(0, -26, 10, 0, Math.PI * 2);
  context.fill();
  context.fillRect(-10, -16, 20, 34);
  context.fillRect(-15, 17, 9, 28);
  context.fillRect(6, 17, 9, 28);
  context.strokeStyle = accent;
  context.lineWidth = 3;
  context.strokeRect(-8, -10, 16, 14);
  context.restore();

  context.save();
  context.translate(width / 2, horizon + 10);
  context.fillStyle = '#202626';
  context.beginPath();
  context.ellipse(0, 22, 112, 24, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = accent;
  context.lineWidth = 3;
  context.beginPath();
  context.ellipse(0, 14, 80, 16, 0, 0, Math.PI * 2);
  context.stroke();
  context.shadowColor = accent;
  context.shadowBlur = 20 + Math.sin(time / 420) * 5;
  context.fillStyle = accent;
  context.beginPath();
  context.moveTo(0, -66 - Math.sin(time / 500) * 5);
  context.lineTo(18, -38);
  context.lineTo(0, -8);
  context.lineTo(-18, -38);
  context.closePath();
  context.fill();
  context.shadowBlur = 0;
  context.restore();

  if (environment.key === 'ai-engineer-lab') {
    AI_ENGINEERING_HOTSPOTS.forEach((hotspot) => {
      drawHotspotObject(
        context,
        hotspot,
        getHotspotAnchor(hotspot, width, horizon),
        accent,
        selectedHotspotId === hotspot.id,
        time,
      );
    });
  }

  context.fillStyle = '#26302e';
  context.font = '700 12px DM Mono, monospace';
  context.fillText('PATHFINDER HUB', 22, 32);
  context.fillStyle = 'rgba(255, 255, 255, 0.82)';
  context.font = '12px Inter, sans-serif';
  context.fillText(
    environment.available ? 'Use WASD or arrow keys to explore' : 'Environment coming soon',
    22,
    52,
  );
}

export function CareerWorldCanvas({ environment }: CareerWorldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCanvasSupported, setIsCanvasSupported] = useState(true);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);
  const [controlsHintExpanded, setControlsHintExpanded] = useState(true);
  const playerRef = useRef<PlayerState>({ x: 0, y: 0, yaw: 0 });
  const pointerRef = useRef({ active: false, x: 0 });
  const pointerDownRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setSelectedHotspotId(null);
    setControlsHintExpanded(true);
    const collapseTimer = window.setTimeout(() => setControlsHintExpanded(false), 6500);
    return () => window.clearTimeout(collapseTimer);
  }, [environment.key]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext('2d');
    if (!context) {
      setIsCanvasSupported(false);
      return undefined;
    }
    setIsCanvasSupported(true);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animationFrame = 0;
    let width = 0;
    let height = 0;
    const pressedKeys = new Set<string>();

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(320, bounds.width);
      height = Math.max(260, bounds.height);
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(event.key)
      ) {
        event.preventDefault();
        pressedKeys.add(event.key.toLowerCase());
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      pressedKeys.delete(event.key.toLowerCase());
    };
    const onPointerDown = (event: PointerEvent) => {
      pointerRef.current = { active: true, x: event.clientX };
      pointerDownRef.current = { x: event.clientX, y: event.clientY };
      canvas.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!pointerRef.current.active) return;
      playerRef.current.yaw = clamp(
        playerRef.current.yaw + (event.clientX - pointerRef.current.x) * 0.01,
        -1.2,
        1.2,
      );
      pointerRef.current.x = event.clientX;
    };
    const onPointerUp = (event: PointerEvent) => {
      const moved =
        Math.abs(event.clientX - pointerDownRef.current.x) > 8 ||
        Math.abs(event.clientY - pointerDownRef.current.y) > 8;
      pointerRef.current.active = false;
      if (moved || environment.key !== 'ai-engineer-lab' || width <= 0 || height <= 0) return;
      const bounds = canvas.getBoundingClientRect();
      const pointX = event.clientX - bounds.left;
      const pointY = event.clientY - bounds.top;
      const horizon = height * 0.47;
      const hotspot = AI_ENGINEERING_HOTSPOTS.find((candidate) => {
        const anchor = getHotspotAnchor(candidate, width, horizon);
        return Math.hypot(pointX - anchor.x, pointY - anchor.y) <= anchor.radius + 12;
      });
      if (hotspot) setSelectedHotspotId(hotspot.id);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    const render = (time: number) => {
      const player = playerRef.current;
      const forward = pressedKeys.has('w') || pressedKeys.has('arrowup');
      const backward = pressedKeys.has('s') || pressedKeys.has('arrowdown');
      const left = pressedKeys.has('a') || pressedKeys.has('arrowleft');
      const right = pressedKeys.has('d') || pressedKeys.has('arrowright');
      player.y += (forward ? -0.12 : 0) + (backward ? 0.12 : 0);
      player.x += (right ? 0.12 : 0) + (left ? -0.12 : 0);
      player.x = clamp(player.x, -WORLD_LIMIT, WORLD_LIMIT);
      player.y = clamp(player.y, -WORLD_LIMIT, WORLD_LIMIT);
      if (width > 0 && height > 0) {
        drawScene(
          context,
          width,
          height,
          environment,
          player,
          prefersReducedMotion ? 0 : time,
          selectedHotspotId,
        );
      }
      animationFrame = window.requestAnimationFrame(render);
    };
    animationFrame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
    };
  }, [environment, selectedHotspotId]);

  return (
    <div className="vr-world" aria-label={`${environment.title} desktop 3D career environment`}>
      <div className="vr-world__stage">
        {isCanvasSupported ? (
          <>
            <canvas
              ref={canvasRef}
              className="vr-world__canvas"
              role="img"
              aria-label={`${environment.title} interactive desktop scene`}
              tabIndex={0}
            />
            <div className="vr-world__controls" aria-live="polite">
              {controlsHintExpanded ? (
                <button
                  className="vr-world__hint"
                  type="button"
                  onClick={() => setControlsHintExpanded(false)}
                  aria-label="Dismiss desktop controls"
                >
                  <span>
                    <strong>Desktop controls</strong> Click a hotspot to inspect it; use WASD or
                    arrow keys to move; drag horizontally to look around.
                  </span>
                  <span aria-hidden="true">×</span>
                </button>
              ) : (
                <button
                  className="vr-world__hint vr-world__hint--collapsed"
                  type="button"
                  onClick={() => setControlsHintExpanded(true)}
                  aria-label="Show desktop controls"
                >
                  <span aria-hidden="true">?</span>
                  <span>Controls</span>
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="vr-world__fallback" role="status">
            <strong>Interactive scene unavailable</strong>
            <span>
              Your browser does not support the desktop scene preview. Use the environment details
              and career actions below instead.
            </span>
          </div>
        )}
      </div>
      {environment.key === 'ai-engineer-lab' && (
        <section className="vr-hotspots" aria-label="AI Engineering Lab knowledge hotspots">
          <div className="vr-hotspots__list" role="list">
            {AI_ENGINEERING_HOTSPOTS.map((hotspot) => (
              <button
                key={hotspot.id}
                className={`vr-hotspot-chip${selectedHotspotId === hotspot.id ? ' vr-hotspot-chip--active' : ''}`}
                type="button"
                onClick={() => setSelectedHotspotId(hotspot.id)}
                aria-pressed={selectedHotspotId === hotspot.id}
              >
                <span className="vr-hotspot-chip__marker" aria-hidden="true">
                  {hotspot.kind === 'core' ? '◆' : '•'}
                </span>
                <strong title={hotspot.represents}>{hotspot.title}</strong>
              </button>
            ))}
          </div>
          {(() => {
            const selectedHotspot = AI_ENGINEERING_HOTSPOTS.find(
              (hotspot) => hotspot.id === selectedHotspotId,
            );
            return selectedHotspot ? (
              <article className="vr-hotspot-detail" aria-live="polite">
                <p className="eyebrow">Knowledge hotspot</p>
                <h3>{selectedHotspot.title}</h3>
                <p>{selectedHotspot.content}</p>
              </article>
            ) : null;
          })()}
        </section>
      )}
    </div>
  );
}
