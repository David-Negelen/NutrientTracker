import { ReactNode } from "react";

interface CardProps {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Card({ title, actions, children, className = "" }: CardProps) {
  return (
    <section className={`card-surface p-5 ${className}`.trim()}>
      {(title || actions) && (
        <header className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}