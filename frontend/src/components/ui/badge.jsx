
export const Badge = ({ children, variant = 'default', className = '', ...props }) => {
  const variants = {
    default: 'bg-lt-bg text-lt-text',
    primary: 'bg-lt-primary/10 text-lt-primary',
    success: 'bg-lt-primary/10 text-lt-primary',
    warning: 'bg-amber-100 text-amber-700',
    destructive: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    outline: 'border border-lt-border text-lt-text bg-transparent',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant] || variants.default} ${className}`} {...props}>
      {children}
    </span>
  );
};
