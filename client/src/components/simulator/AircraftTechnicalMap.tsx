import React from 'react';

export interface ComputedZone {
  id: string;
  name: string;
  status: 'completed' | 'in_progress' | 'on_hold' | 'blocked' | 'not_started';
  progress: number;
  taskCount: number;
}

interface AircraftTechnicalMapProps {
  zones: ComputedZone[];
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string) => void;
}

const statusColors: Record<string, string> = {
  completed: '#10b981', // emerald-500
  in_progress: '#3b82f6', // blue-500
  on_hold: '#f59e0b', // amber-500
  blocked: '#ef4444', // red-500
  not_started: '#64748b' // slate-500
};

export const AircraftTechnicalMap: React.FC<AircraftTechnicalMapProps> = ({ zones, selectedZoneId, onSelectZone }) => {
  const getZone = (id: string) => zones.find(z => z.id === id) || { id, name: id, status: 'not_started', progress: 0, taskCount: 0 };
  
  const getStyle = (id: string) => {
    const zone = getZone(id);
    const color = statusColors[zone.status];
    const isSelected = selectedZoneId === id;
    
    return {
      fill: isSelected ? `${color}30` : `${color}15`,
      stroke: color,
      strokeWidth: isSelected ? 3 : 1.5,
      transition: 'all 0.2s ease',
      cursor: 'pointer'
    };
  };

  const getProgressLabel = (id: string) => {
    const zone = getZone(id);
    if (zone.taskCount === 0) return '';
    return `${zone.progress}%`;
  };

  const handleClick = (id: string) => {
    onSelectZone(id);
  };

  return (
    <div className="w-full h-full min-h-[600px] flex items-center justify-center bg-slate-950 rounded-xl border border-slate-800 p-8 relative overflow-hidden shadow-2xl shrink-0">
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '100px 100px' }}></div>

      {/* Blueprint Annotations */}
      <div className="absolute top-4 left-4 z-0 pointer-events-none text-slate-600 font-mono text-[10px] uppercase tracking-widest leading-relaxed">
        <p>PROJECT: APEX-AERO</p>
        <p>VARIANT: P-12 TURBOPROP (FRONT-LEFT PERSPECTIVE)</p>
        <p>DRAWING: 88-A-01 REV 4-P</p>
        <p>SCALE: NTS</p>
      </div>

      <svg 
        viewBox="0 0 1000 700" 
        className="w-full h-full max-w-4xl z-10 drop-shadow-2xl"
      >
        <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="fuselageGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                <stop offset="50%" stopColor="currentColor" stopOpacity="0.05" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
            </linearGradient>
        </defs>

        {/* PERSPECTIVE GEOMETRY GROUP */}
        <g transform="translate(100, 100) scale(0.9)">
          
          {/* FINAL INSPECTION ZONE (Outer boundary) */}
          <g 
              onClick={() => handleClick('final_inspection')} 
              style={getStyle('final_inspection')}
              className="hover:brightness-125"
              aria-label="Final Inspection"
          >
              <rect x="-50" y="-50" width="900" height="600" rx="20" fill="none" strokeDasharray="10 10" className="opacity-20" />
              <text x="0" y="-20" fill="currentColor" className="text-white text-[12px] font-mono select-none pointer-events-none opacity-50 uppercase tracking-widest">AIRCRAFT ASSEMBLY ENVELOPE: {getProgressLabel('final_inspection')}</text>
          </g>

          {/* RIGHT WING (Rear, partially obscured) */}
          <g 
              onClick={() => handleClick('right_wing')} 
              style={getStyle('right_wing')}
              className="hover:brightness-125"
              aria-label="Right Wing"
          >
              <path d="M 400 320 L 750 380 L 780 410 L 400 380 Z" />
              <text x="680" y="370" fill="currentColor" className="text-white text-[10px] font-mono select-none pointer-events-none" transform="rotate(8, 680, 370)">R-WING {getProgressLabel('right_wing')}</text>
          </g>

          {/* TAIL CONE & STABILIZERS (Perspective Rear) */}
          <g 
              onClick={() => handleClick('tail_cone')} 
              style={getStyle('tail_cone')}
              className="hover:brightness-125"
              aria-label="Tail Cone"
          >
              <path d="M 600 320 L 780 200 L 800 220 L 600 380 Z" />
              <text x="700" y="320" fill="currentColor" className="text-white text-[10px] font-mono select-none pointer-events-none" transform="rotate(-30, 700, 320)">REAR FUSELAGE {getProgressLabel('tail_cone')}</text>
          </g>

          <g 
              onClick={() => handleClick('vertical_stabilizer')} 
              style={getStyle('vertical_stabilizer')}
              className="hover:brightness-125"
              aria-label="Vertical Stabilizer"
          >
              <path d="M 740 220 L 780 80 L 820 80 L 780 220 Z" />
              <text x="800" y="150" fill="currentColor" className="text-white text-[9px] font-mono select-none pointer-events-none">V-STAB {getProgressLabel('vertical_stabilizer')}</text>
          </g>

          <g 
              onClick={() => handleClick('horizontal_stabilizer')} 
              style={getStyle('horizontal_stabilizer')}
              className="hover:brightness-125"
              aria-label="Horizontal Stabilizer"
          >
              <path d="M 740 80 L 850 40 L 920 60 L 820 100 Z" />
              <path d="M 740 80 L 630 40 L 560 60 L 820 100 Z" opacity="0.6" />
              <text x="850" y="30" fill="currentColor" className="text-white text-[9px] font-mono select-none pointer-events-none">H-STAB {getProgressLabel('horizontal_stabilizer')}</text>
          </g>

          {/* MAIN FUSELAGE / CABIN */}
          <g 
              onClick={() => handleClick('cabin')} 
              style={getStyle('cabin')}
              className="hover:brightness-125"
              aria-label="Cabin"
          >
              <path d="M 300 280 L 600 320 L 600 380 L 300 420 Z" />
              {/* Perspective Windows */}
              <circle cx="340" cy="335" r="5" fill="#0f172a" className="opacity-40" />
              <circle cx="380" cy="340" r="5" fill="#0f172a" className="opacity-40" />
              <circle cx="420" cy="345" r="5" fill="#0f172a" className="opacity-40" />
              <circle cx="460" cy="350" r="5" fill="#0f172a" className="opacity-40" />
              <circle cx="500" cy="355" r="5" fill="#0f172a" className="opacity-40" />
              
              <text x="450" y="405" fill="currentColor" className="text-white text-[14px] font-mono font-bold select-none pointer-events-none" textAnchor="middle">CABIN ASSEMBLY {getProgressLabel('cabin')}</text>
          </g>

          {/* GALILEO HDX ANTENNA (Detailed from Reference) */}
          <g 
              onClick={() => handleClick('electrical_systems')} 
              style={getStyle('electrical_systems')}
              className="hover:brightness-125"
              aria-label="Gogo Galileo HDX Antenna"
          >
              <rect x="360" y="275" width="40" height="8" rx="2" transform="rotate(7, 380, 280)" />
              <text x="380" y="270" fill="currentColor" className="text-cyan-400 text-[8px] font-bold font-mono tracking-tighter select-none pointer-events-none" textAnchor="middle">GOGO GALILEO HDX</text>
              <line x1="380" y1="275" x2="380" y2="240" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" className="opacity-50" />
              <text x="380" y="235" fill="currentColor" className="text-white text-[7px] font-mono select-none pointer-events-none" textAnchor="middle">AVIONICS/SATCOM</text>
          </g>

          {/* COCKPIT (Top-Front slope) */}
          <g 
              onClick={() => handleClick('cockpit')} 
              style={getStyle('cockpit')}
              className="hover:brightness-125"
              aria-label="Cockpit"
          >
              <path d="M 180 320 L 300 280 L 300 420 L 180 360 Z" />
              {/* Windshield */}
              <path d="M 195 330 L 280 300 L 280 360 L 195 350 Z" fill="#0f172a" className="opacity-60 pointer-events-none" />
              <text x="240" y="400" fill="currentColor" className="text-xs font-mono font-bold select-none pointer-events-none" textAnchor="middle">COCKPIT {getProgressLabel('cockpit')}</text>
          </g>

          {/* NOSE / ENGINE COWLING */}
          <g 
              onClick={() => handleClick('nose_section')} 
              style={getStyle('nose_section')}
              className="hover:brightness-125"
              aria-label="Nose Section"
          >
              <path d="M 80 360 L 180 320 L 180 360 L 100 400 Z" />
              <text x="130" y="390" fill="currentColor" className="text-[9px] font-mono select-none pointer-events-none" transform="rotate(20, 130, 390)">COWLING {getProgressLabel('nose_section')}</text>
          </g>

          {/* PROPELLER (Isometric disc/blades) */}
          <g 
              onClick={() => handleClick('propeller')} 
              style={getStyle('propeller')}
              className="hover:brightness-125"
              aria-label="Propeller"
          >
              {/* Spinner */}
              <circle cx="80" cy="380" r="10" />
              {/* Blades (Abstractized for future look) */}
              <path d="M 80 380 L 60 300 L 100 300 Z" opacity="0.3" />
              <path d="M 80 380 L 160 360 L 160 400 Z" opacity="0.3" />
              <path d="M 80 380 L 80 480 L 40 480 Z" opacity="0.3" />
              <path d="M 80 380 L 0 400 L 0 360 Z" opacity="0.3" />
              <text x="75" y="495" fill="currentColor" className="text-[10px] font-mono font-bold text-cyan-400 select-none pointer-events-none" textAnchor="middle">5-BLADE PROP</text>
          </g>

          {/* LEFT WING (Front, detailed) */}
          <g 
              onClick={() => handleClick('left_wing')} 
              style={getStyle('left_wing')}
              className="hover:brightness-125"
              aria-label="Left Wing"
          >
              <path d="M 320 380 L 150 550 L 250 630 L 410 405 Z" />
              {/* Flaps/Control surfaces detail */}
              <line x1="200" y1="580" x2="380" y2="415" stroke="#0f172a" strokeWidth="2" className="opacity-30" />
              <text x="240" y="550" fill="currentColor" className="text-white text-[12px] font-mono font-bold select-none pointer-events-none" transform="rotate(30, 240, 550)">L-WING ASSEMBLY {getProgressLabel('left_wing')}</text>
          </g>

          {/* LANDING GEAR CALLOUTS */}
          <g 
              onClick={() => handleClick('landing_gear')} 
              style={getStyle('landing_gear')}
              className="hover:brightness-125"
              aria-label="Landing Gear"
          >
              {/* Nose Gear */}
              <circle cx="160" cy="420" r="12" fill="none" stroke="currentColor" strokeWidth="2" />
              <line x1="160" y1="420" x2="160" y2="450" stroke="currentColor" strokeWidth="2" />
              {/* Main Gear L */}
              <circle cx="340" cy="550" r="15" fill="none" stroke="currentColor" strokeWidth="2" />
              
              <text x="160" y="470" fill="currentColor" className="text-[8px] font-mono select-none pointer-events-none" textAnchor="middle">FRONT GEAR</text>
              <text x="340" y="580" fill="currentColor" className="text-[8px] font-mono select-none pointer-events-none" textAnchor="middle">L-MAIN GEAR {getProgressLabel('landing_gear')}</text>
          </g>

          {/* CARGO DOOR (Side Detail) */}
          <g 
              onClick={() => handleClick('cargo_door')} 
              style={getStyle('cargo_door')}
              className="hover:brightness-125"
              aria-label="Cargo Door"
          >
              <rect x="520" y="330" width="15" height="40" rx="2" transform="skewY(8)" />
              <text x="540" y="385" fill="currentColor" className="text-[8px] font-mono tracking-tighter select-none pointer-events-none">CARGO DOOR {getProgressLabel('cargo_door')}</text>
          </g>

          {/* CALLOUT LINES & TECH DETAILS */}
          <g className="pointer-events-none opacity-40 text-slate-500">
            <polyline points="300,280 250,220" stroke="currentColor" fill="none" />
            <text x="245" y="215" fill="currentColor" className="text-[7px] font-mono text-right">UPPER FUSELAGE SPINE</text>
            
            <polyline points="600,320 650,260" stroke="currentColor" fill="none" />
            <text x="655" y="255" fill="currentColor" className="text-[7px] font-mono">DORSAL FIN JUNCTION</text>

            <circle cx="380" cy="315" r="3" fill="cyan" />
            <text x="390" y="318" fill="cyan" className="text-[7px] font-bold font-mono">SYSTEMS BUS ACTIVE</text>
          </g>

        </g>
      </svg>
    </div>
  );
};
