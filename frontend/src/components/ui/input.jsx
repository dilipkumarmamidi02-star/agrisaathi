
export const Input = ({ className = '', ...props }) => {
  return (
    <input
      className={`w-full px-4 py-2 border border-lt-border rounded-xl focus:ring-2 focus:ring-lt-primary focus:border-transparent outline-none transition ${className}`}
      {...props}
    />
  );
};
