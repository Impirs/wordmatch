interface SwitcherProps {
  enabled: boolean;
  onToggle: () => void;
}

export function Switcher({ enabled, onToggle }: SwitcherProps) {
  return (
    <button
      onClick={onToggle}
      className="w-14 md:w-16 h-8 md:h-9 rounded-full transition-colors relative bg-primary"
    >
      <div
        className={`absolute top-1 w-6 h-6 md:w-7 md:h-7 bg-white rounded-full transition-transform shadow-md ${
          enabled ? "left-7 md:left-8" : "left-1"
        }`}
      />
    </button>
  );
}
