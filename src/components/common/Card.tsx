import { CSSProperties, ReactNode } from "react";

interface CardProps {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function Card({ title, actions, children, className = "", style }: CardProps) {
  return (
    <section className={`card-surface p-5 ${className}`.trim()} style={style}>
      {(title || actions) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}
