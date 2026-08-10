import vLogo from '../assets/icona-V-trasparente.svg';
import { useSections } from '../context/SectionsContext';
import {
  AestheticSunIcon,
  AestheticBriefcaseIcon,
  AestheticCalendarIcon,
  AestheticHeadphonesIcon,
  AestheticHeartIcon,
  AestheticCommentsIcon,
  AestheticCogIcon,
  AestheticLightBulbIcon,
} from './AestheticIcons';

// Lava lamp bubble configuration
const BUBBLES = [
  { size: 90, left: '12%', delay: 0, duration: 12 },
  { size: 60, left: '55%', delay: 3.5, duration: 15 },
  { size: 110, left: '30%', delay: 7, duration: 18 },
  { size: 50, left: '70%', delay: 1.5, duration: 11 },
  { size: 75, left: '45%', delay: 9, duration: 14 },
  { size: 45, left: '20%', delay: 5, duration: 16 },
];

const BUBBLE_COLORS = [
  'rgba(131, 61, 111, 0.55)',  // Plum (#833d6f)
  'rgba(154, 133, 192, 0.45)', // Lavender (#9a85c0)
  'rgba(110, 90, 142, 0.50)',  // Sidebar Purple (#6e5a8e)
  'rgba(168, 198, 222, 0.35)', // Blue Accent (#a8c6de)
  'rgba(156, 169, 139, 0.40)', // Sage (#9ca98b)
  'rgba(143, 90, 90, 0.40)',   // Terracotta (#8f5a5a)
];

export default function Sidebar({ currentTab, setCurrentTab }) {
  const { enabledSections } = useSections();

  const navItems = [
    { id: 'today', icon: AestheticSunIcon, label: 'Oggi' },
    { id: 'projects', icon: AestheticBriefcaseIcon, label: 'Progetti' },
    { id: 'calendar', icon: AestheticCalendarIcon, label: 'Calendario' },
    ...(enabledSections.spotify ? [{ id: 'spotify', icon: AestheticHeadphonesIcon, label: 'Spotify' }] : []),
    ...(enabledSections.pinterest ? [{ id: 'pinterest', icon: AestheticHeartIcon, label: 'Moodboard' }] : []),
    { id: 'codequest', icon: AestheticLightBulbIcon, label: 'CodeQuest' },
    { id: 'chat', icon: AestheticCommentsIcon, label: 'Diaspro AI' },
    { id: 'settings', icon: AestheticCogIcon, label: 'Impostazioni' },
  ];

  return (
    <aside className="w-32 md:w-38 h-full py-6 px-3 flex flex-col items-center justify-between bg-sidebar select-none z-30 shadow-2xl relative overflow-hidden">

      {/* ── Lava Lamp Layer ── */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        {BUBBLES.map((b, i) => (
          <div
            key={i}
            className="lava-bubble"
            style={{
              width: b.size,
              height: b.size,
              left: b.left,
              bottom: `-${b.size}px`,
              background: BUBBLE_COLORS[i % BUBBLE_COLORS.length],
              animationDuration: `${b.duration}s`,
              animationDelay: `${b.delay}s`,
            }}
          />
        ))}
      </div>

      {/* ── Foreground Content ── */}
      <div className="relative z-10 flex flex-col items-center gap-5 w-full pt-1">
        {/* Brand App Header */}
        <div className="flex flex-col items-center gap-1.5 group cursor-pointer" title="Diaspro Viboard">
          <img src={vLogo} alt="Diaspro Viboard Logo" className="w-14 h-14 object-contain filter drop-shadow-xl group-hover:scale-110 transition-transform duration-300" />
          <div className="flex flex-col items-center text-center">
            <span className="text-[14px] font-black tracking-tight bg-gradient-to-r from-sand via-lavender to-blue bg-clip-text text-transparent drop-shadow-md leading-none">
              Diaspro
            </span>
            <span className="text-[11px] font-extrabold tracking-[0.2em] text-sand/90 uppercase leading-tight mt-1">
              Viboard
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex flex-col gap-4 mt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                title={item.label}
                className={`w-13 h-13 rounded-2xl flex items-center justify-center transition-all duration-300 relative ${isActive
                  ? 'bg-card border border-lavender/50 shadow-[0_0_15px_rgba(154,133,192,0.35)] scale-105'
                  : 'hover:bg-card/40 opacity-75 hover:opacity-100 hover:scale-105'
                  }`}
              >
                <Icon className="w-8 h-8 shrink-0 filter drop-shadow-sm" />
              </button>
            );
          })}
        </nav>
      </div>

      {/* Subtle version footer */}
      <div className="relative z-10 text-[9px] font-mono font-medium text-white/30 tracking-widest pb-1">
        v0.1
      </div>
    </aside>
  );
}
