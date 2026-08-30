
export function Checkbox({ checked, onCheckedChange, className = '', id, ...props }) {
  return (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange && onCheckedChange(e.target.checked)}
      className={`h-4 w-4 rounded border-lt-border text-lt-primary focus:ring-lt-primary ${className}`}
      {...props}
    />
  );
}
