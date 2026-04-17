"use client";

import { useEffect, useRef } from "react";

interface JsonLdProps {
  data: Record<string, any>;
}

export default function JsonLd({ data }: JsonLdProps) {
  const ref = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = JSON.stringify(data);
    }
  }, [data]);

  return (
    <script
      ref={ref}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
