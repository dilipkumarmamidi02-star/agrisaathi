
export const Label = ({ children, className = '', ...props }) => {
  return (
    <label className={`block text-sm font-medium text-lt-text mb-1 ${className}`} {...props}>
      {children}
    </label>
  );
};
