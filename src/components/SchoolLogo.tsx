import React from 'react';

interface SchoolLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  showText?: boolean;
  lightText?: boolean;
}

export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
  lightText = false,
}) => {
  const sizeClasses: Record<string, string> = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
  };

  const isNamedSize = typeof size === 'string' && size in sizeClasses;
  const containerClass = isNamedSize ? sizeClasses[size as string] : 'w-10 h-10';
  const inlineStyle = typeof size === 'number' ? { width: `${size}px`, height: `${size}px` } : undefined;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`relative shrink-0 rounded-full shadow-sm select-none ${containerClass}`}
        style={inlineStyle}
      >
        {/* SVG Recreation of St. Xavier High School Tihidi Crest */}
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-sm transition-transform duration-300 hover:scale-105"
          aria-label="St. Xavier High School Crest"
        >
          <defs>
            {/* Outer circle path for curved text */}
            <path
              id="topTextPath"
              d="M 28 100 A 72 72 0 0 1 172 100"
              fill="none"
            />
            <path
              id="bottomTextPath"
              d="M 172 100 A 72 72 0 0 1 28 100"
              fill="none"
            />
            {/* Subtle gradients */}
            <linearGradient id="crestGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
            <radialGradient id="crestCenter" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#991b1b" />
              <stop offset="85%" stopColor="#7f1d1d" />
              <stop offset="100%" stopColor="#450a0a" />
            </radialGradient>
          </defs>

          {/* Outer Deep Blue Border Ring */}
          <circle cx="100" cy="100" r="98" fill="#1e3a8a" stroke="#172554" strokeWidth="2" />
          
          {/* Starburst / Sawtooth Red Decorative Ring */}
          <g fill="#b91c1c" stroke="#991b1b" strokeWidth="0.5">
            {Array.from({ length: 36 }).map((_, i) => {
              const angle = (i * 360) / 360 * 10;
              return (
                <polygon
                  key={i}
                  points="100,6 96,16 104,16"
                  transform={`rotate(${angle} 100 100)`}
                />
              );
            })}
          </g>

          {/* White Circular Band */}
          <circle cx="100" cy="100" r="84" fill="#ffffff" stroke="#1e3a8a" strokeWidth="2" />

          {/* Curved Text: ST-XAVIER HIGH SCHOOL (Top) */}
          <text
            fontSize="12.5"
            fontWeight="800"
            fontFamily="'Cinzel', 'Plus Jakarta Sans', serif"
            fill="#1e3a8a"
            letterSpacing="2"
          >
            <textPath href="#topTextPath" startOffset="50%" textAnchor="middle">
              ST-XAVIER HIGH SCHOOL
            </textPath>
          </text>

          {/* Left and Right Decorative Stars */}
          <text x="24" y="104" fontSize="11" fill="#b91c1c" textAnchor="middle" fontWeight="bold">★</text>
          <text x="176" y="104" fontSize="11" fill="#b91c1c" textAnchor="middle" fontWeight="bold">★</text>

          {/* Curved Text: TIHIDI, BHADRAK, ODISHA (Bottom) */}
          <text
            fontSize="10.5"
            fontWeight="800"
            fontFamily="'Plus Jakarta Sans', sans-serif"
            fill="#b91c1c"
            letterSpacing="1.8"
          >
            <textPath href="#bottomTextPath" startOffset="50%" textAnchor="middle">
              TIHIDI, BHADRAK, ODISHA
            </textPath>
          </text>

          {/* Inner Golden Border */}
          <circle cx="100" cy="100" r="56" fill="url(#crestCenter)" stroke="#eab308" strokeWidth="2.5" />
          <circle cx="100" cy="100" r="53" fill="none" stroke="#fef08a" strokeWidth="1" strokeDasharray="3 2" />

          {/* Inner Emblems: Sunburst of Wisdom, Open Book, Flaming Torch */}
          {/* Sun Rays */}
          <g stroke="#facc15" strokeWidth="1.5" opacity="0.6">
            <line x1="100" y1="52" x2="100" y2="60" />
            <line x1="124" y1="62" x2="118" y2="68" />
            <line x1="76" y1="62" x2="82" y2="68" />
          </g>

          {/* Torch Flame & Holder */}
          <path
            d="M 100 60 C 104 66 107 70 102 75 C 99 78 97 73 95 76 C 94 72 96 68 100 60 Z"
            fill="url(#crestGold)"
            stroke="#d97706"
            strokeWidth="0.5"
          />
          <path d="M 98 75 L 102 75 L 100 85 Z" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.5" />

          {/* Open Book of Knowledge */}
          <g transform="translate(100, 94) scale(0.68)">
            {/* Left Page */}
            <path
              d="M 0 0 C -15 -8 -30 -6 -40 -2 L -40 22 C -30 18 -15 16 0 24 Z"
              fill="#ffffff"
              stroke="#1e293b"
              strokeWidth="1.5"
            />
            {/* Right Page */}
            <path
              d="M 0 0 C 15 -8 30 -6 40 -2 L 40 22 C 30 18 15 16 0 24 Z"
              fill="#ffffff"
              stroke="#1e293b"
              strokeWidth="1.5"
            />
            {/* Page lines */}
            <line x1="-34" y1="6" x2="-8" y2="4" stroke="#94a3b8" strokeWidth="1.2" />
            <line x1="-34" y1="12" x2="-8" y2="10" stroke="#94a3b8" strokeWidth="1.2" />
            <line x1="8" y1="4" x2="34" y2="6" stroke="#94a3b8" strokeWidth="1.2" />
            <line x1="8" y1="10" x2="34" y2="12" stroke="#94a3b8" strokeWidth="1.2" />
          </g>

          {/* ESTD-2014 Pill Badge */}
          <rect
            x="64"
            y="126"
            width="72"
            height="18"
            rx="3"
            fill="#ffffff"
            stroke="#1e3a8a"
            strokeWidth="1.5"
          />
          <text
            x="100"
            y="139.5"
            fontSize="10"
            fontWeight="800"
            fontFamily="'Plus Jakarta Sans', sans-serif"
            fill="#b91c1c"
            textAnchor="middle"
            letterSpacing="0.8"
          >
            ESTD-2014
          </text>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-tight text-left">
          <span
            className={`font-serif font-extrabold tracking-tight text-lg sm:text-xl ${
              lightText ? 'text-white' : 'text-blue-950'
            }`}
          >
            St. Xavier High School
          </span>
          <span
            className={`text-xs font-semibold tracking-wider uppercase ${
              lightText ? 'text-blue-200' : 'text-amber-700'
            }`}
          >
            Tihidi, Bhadrak, Odisha • Estd. 2014
          </span>
        </div>
      )}
    </div>
  );
};
