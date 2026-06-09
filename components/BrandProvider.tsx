"use client";

import { createContext, useContext } from "react";

type BrandContextValue = { logoUrl: string | null; brandName: string };

const BrandContext = createContext<BrandContextValue>({
  logoUrl: null,
  brandName: "PHASA",
});

export function BrandProvider({
  children,
  logoUrl,
  brandName,
}: {
  children: React.ReactNode;
  logoUrl: string | null;
  brandName: string;
}) {
  return (
    <BrandContext.Provider value={{ logoUrl, brandName }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  return useContext(BrandContext);
}
