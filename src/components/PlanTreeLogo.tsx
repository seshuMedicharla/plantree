type PlanTreeLogoProps = {
  className?: string
}

export default function PlanTreeLogo({ className = '' }: PlanTreeLogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={className}
      role="img"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="pt-leaf" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>

      <rect
        x="6"
        y="6"
        width="52"
        height="52"
        rx="18"
        fill="#ecfdf5"
        stroke="#a7f3d0"
      />

      <path
        d="M19 35C19 25 27 17 37 17C38 27 31 39 21 41C20 39 19 37 19 35Z"
        fill="url(#pt-leaf)"
      />

      <path
        d="M29 27L43 32L29 37V27Z"
        fill="#ffffff"
        stroke="#d1fae5"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      <path
        d="M21 45C24 41 28 37 33 34"
        stroke="#047857"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
