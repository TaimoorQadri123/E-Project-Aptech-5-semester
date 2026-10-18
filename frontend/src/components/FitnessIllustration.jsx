
export default function FitnessIllustration() {
  return (
    <svg viewBox="0 0 400 400" className="illustration" xmlns="http://www.w3.org/2000/svg">
      <circle cx="200" cy="200" r="150" fill="rgba(255,255,255,0.12)" className="pulse" />
      <circle cx="200" cy="200" r="110" fill="rgba(255,255,255,0.15)" />

      <circle cx="200" cy="200" r="90" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="14" />
      <circle
        cx="200" cy="200" r="90" fill="none" stroke="#fde047" strokeWidth="14"
        strokeLinecap="round" strokeDasharray="565" strokeDashoffset="565"
        transform="rotate(-90 200 200)" className="ring"
      />

      <g className="float">
        <rect x="120" y="190" width="160" height="20" rx="10" fill="#ffffff" />
        <rect x="105" y="160" width="26" height="80" rx="8" fill="#0f172a" />
        <rect x="80" y="172" width="22" height="56" rx="8" fill="#1e293b" />
        <rect x="269" y="160" width="26" height="80" rx="8" fill="#0f172a" />
        <rect x="298" y="172" width="22" height="56" rx="8" fill="#1e293b" />
      </g>

      <polyline
        points="60,320 130,320 150,290 175,350 200,300 225,320 340,320"
        fill="none" stroke="#fde047" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="500" strokeDashoffset="500" className="beat"
      />

      <path
        d="M330 90 c-10 -18 -35 -8 -30 12 c4 15 30 30 30 30 c0 0 26 -15 30 -30 c5 -20 -20 -30 -30 -12z"
        fill="#f43f5e" className="pulse-heart"
      />

      <circle cx="70" cy="110" r="6" fill="#fde047" className="pulse" />
      <circle cx="95" cy="70" r="4" fill="#ffffff" className="pulse" />
      <circle cx="340" cy="260" r="5" fill="#ffffff" className="pulse" />
    </svg>
  );
}
