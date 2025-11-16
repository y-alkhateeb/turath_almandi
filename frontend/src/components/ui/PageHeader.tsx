import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
  }>;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`mb-6 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-4" aria-label="مسار التنقل">
          <ol className="flex items-center space-x-2 space-x-reverse">
            {breadcrumbs.map((breadcrumb, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <svg
                    className="w-4 h-4 text-gray-400 mx-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {breadcrumb.href ? (
                  <a
                    href={breadcrumb.href}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {breadcrumb.label}
                  </a>
                ) : breadcrumb.onClick ? (
                  <button
                    onClick={breadcrumb.onClick}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {breadcrumb.label}
                  </button>
                ) : (
                  <span className="text-sm text-gray-900 font-medium">
                    {breadcrumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-brand-gold-700 mb-2">{title}</h1>
          {description && (
            <p className="text-sm text-gray-600 max-w-3xl">{description}</p>
          )}
        </div>

        {actions && <div className="flex items-center gap-3 mr-4">{actions}</div>}
      </div>
    </div>
  );
}
