import React, { useEffect, useRef, useState, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Hook للتحكم في Focus Trap
export const useFocusTrap = (isActive: boolean = true) => {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }

      if (e.key === 'Escape') {
        firstElement?.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);

  return containerRef;
};

// Hook للتحكم في الـ keyboard navigation
export const useKeyboardNavigation = (
  items: HTMLElement[],
  options: {
    orientation?: 'horizontal' | 'vertical';
    loop?: boolean;
    onActivate?: (index: number) => void;
  } = {}
) => {
  const { orientation = 'vertical', loop = true, onActivate } = options;
  const [activeIndex, setActiveIndex] = useState(0);

  const handleKeyDown = (e: KeyboardEvent) => {
    let newIndex = activeIndex;

    switch (e.key) {
      case orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown':
        e.preventDefault();
        newIndex = activeIndex + 1;
        if (newIndex >= items.length) {
          newIndex = loop ? 0 : items.length - 1;
        }
        break;

      case orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp':
        e.preventDefault();
        newIndex = activeIndex - 1;
        if (newIndex < 0) {
          newIndex = loop ? items.length - 1 : 0;
        }
        break;

      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;

      case 'End':
        e.preventDefault();
        newIndex = items.length - 1;
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        onActivate?.(activeIndex);
        return;
    }

    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
      items[newIndex]?.focus();
    }
  };

  return { activeIndex, setActiveIndex, handleKeyDown };
};

// مكون للإعلان عن التغييرات للقارئات الشاشة
interface ScreenReaderAnnouncerProps {
  message: string;
  priority?: 'polite' | 'assertive';
  clearAfter?: number;
}

export const ScreenReaderAnnouncer: React.FC<ScreenReaderAnnouncerProps> = ({
  message,
  priority = 'polite',
  clearAfter = 3000,
}) => {
  const [currentMessage, setCurrentMessage] = useState(message);

  useEffect(() => {
    setCurrentMessage(message);
    
    if (clearAfter > 0) {
      const timer = setTimeout(() => {
        setCurrentMessage('');
      }, clearAfter);
      
      return () => clearTimeout(timer);
    }
  }, [message, clearAfter]);

  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {currentMessage}
    </div>
  );
};

// Hook للإعلان عن الرسائل
export const useScreenReaderAnnouncer = () => {
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'polite' | 'assertive'>('polite');

  const announce = (text: string, announcePriority: 'polite' | 'assertive' = 'polite') => {
    setPriority(announcePriority);
    setMessage(text);
  };

  return { message, priority, announce };
};

// مكون Skip Link
interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ href, children, className }) => (
  <a
    href={href}
    className={cn(
      'sr-only focus:not-sr-only focus:absolute focus:top-2 focus:right-2',
      'bg-primary text-primary-foreground px-4 py-2 rounded-md',
      'focus:outline-none focus:ring-2 focus:ring-ring',
      'z-50',
      className
    )}
  >
    {children}
  </a>
);

// مكون التحكم في الـ Responsive Breakpoints
export const useResponsiveBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'>('md');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 640) setBreakpoint('xs');
      else if (width < 768) setBreakpoint('sm');
      else if (width < 1024) setBreakpoint('md');
      else if (width < 1280) setBreakpoint('lg');
      else if (width < 1536) setBreakpoint('xl');
      else setBreakpoint('2xl');
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return {
    breakpoint,
    isMobile: ['xs', 'sm'].includes(breakpoint),
    isTablet: breakpoint === 'md',
    isDesktop: ['lg', 'xl', '2xl'].includes(breakpoint),
  };
};

// مكون Modal محسن للوصول
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AccessibleModal = forwardRef<HTMLDivElement, AccessibleModalProps>(
  ({ isOpen, onClose, title, description, children, size = 'md', className }, ref) => {
    const modalRef = useFocusTrap(isOpen);
    const { announce } = useScreenReaderAnnouncer();

    useEffect(() => {
      if (isOpen) {
        announce(`نافذة ${title} مفتوحة`);
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }

      return () => {
        document.body.style.overflow = 'unset';
      };
    }, [isOpen, title, announce]);

    if (!isOpen) return null;

    const sizeClasses = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
    };

    return (
      <div
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? "modal-description" : undefined}
      >
        <div
          ref={modalRef}
          className={cn(
            'bg-background rounded-lg shadow-lg w-full',
            sizeClasses[size],
            'max-h-[90vh] overflow-y-auto',
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 id="modal-title" className="text-xl font-bold">
                {title}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label="إغلاق النافذة"
                className="h-8 w-8 p-0"
              >
                ×
              </Button>
            </div>
            
            {description && (
              <p id="modal-description" className="text-muted-foreground mb-4">
                {description}
              </p>
            )}
            
            {children}
          </div>
        </div>
      </div>
    );
  }
);

AccessibleModal.displayName = 'AccessibleModal';

// مكون Form Field محسن للوصول
interface AccessibleFieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const AccessibleField: React.FC<AccessibleFieldProps> = ({
  id,
  label,
  error,
  hint,
  required = false,
  children,
  className,
}) => {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <div className={cn('space-y-2', className)}>
      <label 
        htmlFor={id} 
        className="block text-sm font-medium text-right"
      >
        {label}
        {required && (
          <span className="text-destructive mr-1" aria-label="مطلوب">
            *
          </span>
        )}
      </label>
      
      {hint && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      
      <div>
        {React.cloneElement(children as React.ReactElement, {
          id,
          'aria-describedby': [
            hint ? hintId : '',
            error ? errorId : ''
          ].filter(Boolean).join(' ') || undefined,
          'aria-invalid': error ? 'true' : undefined,
          required,
        })}
      </div>
      
      {error && (
        <p 
          id={errorId} 
          className="text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};

// Hook للتحكم في التصريحات
export const useAriaLiveRegion = () => {
  const [message, setMessage] = useState('');
  const [region, setRegion] = useState<'polite' | 'assertive'>('polite');

  const announce = (text: string, priority: 'polite' | 'assertive' = 'polite') => {
    setRegion(priority);
    setMessage(''); // Clear first to ensure re-announcement
    setTimeout(() => setMessage(text), 10);
  };

  const clear = () => setMessage('');

  return { message, region, announce, clear };
};

// مكون للتحكم في الـ Toast المحسن للوصول
export const useAccessibleToast = () => {
  const { toast: originalToast } = useToast();
  const { announce } = useScreenReaderAnnouncer();

  const toast = (options: Parameters<typeof originalToast>[0]) => {
    // إعلان للقارئات الشاشة
    announce(
      `${options.title ? options.title + ': ' : ''}${options.description || ''}`,
      options.variant === 'destructive' ? 'assertive' : 'polite'
    );

    return originalToast(options);
  };

  return { toast };
};

// مكون البحث المحسن للوصول
interface AccessibleSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  resultCount?: number;
  isLoading?: boolean;
  className?: string;
}

export const AccessibleSearch: React.FC<AccessibleSearchProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = 'البحث...',
  resultCount,
  isLoading,
  className,
}) => {
  const searchId = 'search-input';
  const resultsId = 'search-results';
  const { announce } = useScreenReaderAnnouncer();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(value);
  };

  useEffect(() => {
    if (resultCount !== undefined) {
      announce(`تم العثور على ${resultCount} نتيجة`);
    }
  }, [resultCount, announce]);

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} role="search">
        <label htmlFor={searchId} className="sr-only">
          البحث
        </label>
        <div className="relative">
          <input
            id={searchId}
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            aria-describedby={resultCount !== undefined ? resultsId : undefined}
            className="w-full px-3 py-2 border border-input rounded-md"
            dir="rtl"
          />
          {isLoading && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        
        {resultCount !== undefined && (
          <div id={resultsId} className="sr-only" aria-live="polite">
            تم العثور على {resultCount} نتيجة للبحث عن "{value}"
          </div>
        )}
      </form>
    </div>
  );
}; 