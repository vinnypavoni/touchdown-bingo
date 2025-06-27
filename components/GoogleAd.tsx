"use client";
import { useEffect } from "react";

type GoogleAdProps = {
  adClient: string;
  adSlot: string;
  style?: React.CSSProperties;
  className?: string;
};

export default function GoogleAd({ adClient, adSlot, style, className }: GoogleAdProps) {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("Adsense error", e);
    }
  }, []);

  return (
    <ins
      className={`adsbygoogle ${className ?? ""}`}
      style={{ display: "block", ...style }}
      data-ad-client={adClient}
      data-ad-slot={adSlot}
      data-ad-format="auto"
      data-full-width-responsive="false"
    />
  );
}
