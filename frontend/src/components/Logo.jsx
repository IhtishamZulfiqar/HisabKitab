export default function Logo({ className = "w-5 h-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6.5 6V18M6.5 12H12.5M12.5 6V18M12.5 12L17.5 6M12.5 12L17.5 18" />
    </svg>
  );
}
