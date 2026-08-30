/* eslint-disable react-hooks/rules-of-hooks */
import { createContext, useContext, useEffect } from 'react'

const DialogContext = createContext();

export const Dialog = ({ children, open, onOpenChange, ...props }) => {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
};

export const DialogContent = ({ children, className = '', ...props }) => {
  const { open, onOpenChange } = useContext(DialogContext);
  if (!open) return null;

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onOpenChange(false); };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [onOpenChange]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className={`relative bg-lt-card rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-auto p-6 ${className}`} {...props}>
        {children}
      </div>
    </div>
  );
};

export const DialogHeader = ({ children, className = '', ...props }) => {
  return <div className={`mb-4 ${className}`} {...props}>{children}</div>;
};

export const DialogTitle = ({ children, className = '', ...props }) => {
  return <h2 className={`text-xl font-bold text-lt-text ${className}`} {...props}>{children}</h2>;
};

export const DialogDescription = ({ children, className = '', ...props }) => {
  return <p className={`text-sm text-lt-text-secondary mt-1 ${className}`} {...props}>{children}</p>;
};

export const DialogTrigger = ({ children, asChild, ...props }) => {
  const { setOpen } = useContext(DialogContext);
  return (
    <div onClick={() => setOpen(true)} {...props}>
      {children}
    </div>
  );
};
