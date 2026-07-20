import type { SVGProps } from "react";

export function AuditIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5H7a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5Z" />
      <path d="M14 3.5V8h4" />
      <path d="m9 13 2 2 4-4" />
    </svg>
  );
}

export function PlagiarismIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 3.5 5 6v5.5c0 4.5 3 7.3 7 9 4-1.7 7-4.5 7-9V6l-7-2.5Z" />
      <circle cx="11" cy="10.5" r="2.25" />
      <path d="m14.5 14-2-2" />
    </svg>
  );
}

export function QuizIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="4" y="4" width="16" height="16" rx="1" />
      <path d="m8 11 1.5 1.5L12.5 9" />
      <path d="M9 16h6" />
    </svg>
  );
}

export function JuryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="9" cy="8" r="2.25" />
      <circle cx="16.5" cy="9.5" r="1.75" />
      <path d="M4.5 19v-1.2c0-2.1 2-3.8 4.5-3.8s4.5 1.7 4.5 3.8V19" />
      <path d="M14.5 14.3c1.9.2 3.5 1.7 3.5 3.5V19" />
    </svg>
  );
}
