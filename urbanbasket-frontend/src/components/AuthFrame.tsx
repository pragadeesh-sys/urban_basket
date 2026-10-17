import type { ReactNode } from 'react';
import { ThemeToggle } from './ThemeToggle';

export function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <div className="fresh-stage">
      <section className="fresh-phone" aria-label="UrbanBasket">
        <div className="fresh-pattern" aria-hidden="true" />
        <svg className="fresh-swoosh" viewBox="0 0 390 240" preserveAspectRatio="none" aria-hidden="true">
          <path d="M-10 150C70 40 150 210 250 120C310 70 360 90 410 40V260H-10Z" fill="#0b7a3e" />
          <path d="M-10 190C90 110 170 230 280 160C330 130 370 150 410 110V260H-10Z" fill="#12a85a" />
        </svg>
        <div className="fresh-theme">
          <ThemeToggle />
        </div>
        <div className="fresh-body">{children}</div>
      </section>
    </div>
  );
}
