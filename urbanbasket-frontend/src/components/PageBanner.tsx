import type { ReactNode } from 'react';

export function PageBanner({ image, children }: { image: string; children: ReactNode }) {
  return (
    <section className="page-banner">
      <div className="page-banner-frame">
        <img src={image} alt="" className="page-banner-photo" />
      </div>
      <div className="page-banner-shade" />
      <div className="page-banner-body">{children}</div>
    </section>
  );
}
