type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

const createToastElement = (message: string, type: ToastType): HTMLDivElement => {
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white transform transition-all duration-300 translate-x-0 z-50 ${getToastColor(type)}`;
  toast.textContent = message;
  toast.style.animation = 'slideIn 0.3s ease-out';
  return toast;
};

const getToastColor = (type: ToastType): string => {
  switch (type) {
    case 'success':
      return 'bg-green-500';
    case 'error':
      return 'bg-red-500';
    case 'warning':
      return 'bg-yellow-500';
    case 'info':
      return 'bg-blue-500';
    default:
      return 'bg-gray-500';
  }
};

export const toast = {
  show: ({ message, type = 'info', duration = 3000 }: ToastOptions) => {
    const toastElement = createToastElement(message, type);
    document.body.appendChild(toastElement);

    setTimeout(() => {
      toastElement.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        document.body.removeChild(toastElement);
      }, 300);
    }, duration);
  },

  success: (message: string, duration?: number) => {
    toast.show({ message, type: 'success', duration });
  },

  error: (message: string, duration?: number) => {
    toast.show({ message, type: 'error', duration });
  },

  warning: (message: string, duration?: number) => {
    toast.show({ message, type: 'warning', duration });
  },

  info: (message: string, duration?: number) => {
    toast.show({ message, type: 'info', duration });
  },
};

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
