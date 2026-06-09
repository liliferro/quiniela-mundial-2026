"use client";

import { createContext, useContext } from "react";

type BrandContextValue = { logoUrl: string | null; brandName: string; logoFilter?: string };

const BrandContext = createContext<BrandContextValue>({
  logoUrl: null,
  brandName: "PHASA",
});

export function BrandProvider({
  children,
  logoUrl,
  brandName,
  logoFilter,
}: {
  children: React.ReactNode;
  logoUrl: string | null;
  brandName: string;
  logoFilter?: string;
}) {
  return (
    <BrandContext.Provider value={{ logoUrl, brandName, logoFilter }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  return useContext(BrandContext);
}
