"use client";

import { useEffect, useState } from "react";
import { Doctor } from "./types";
import { doctors as seedDoctors } from "./utils";
import { getAllDoctors } from "./mock-db";

// Starts with the seeded list (matches server render), then merges in any
// self-registered doctors from localStorage once mounted in the browser.
export function useAllDoctors(): Doctor[] {
  const [list, setList] = useState<Doctor[]>(seedDoctors);

  useEffect(() => {
    setList(getAllDoctors());
  }, []);

  return list;
}

export function useDoctorBySlug(slug: string) {
  const [ready, setReady] = useState(false);
  const all = useAllDoctors();

  useEffect(() => {
    setReady(true);
  }, []);

  return { doctor: all.find((d) => d.slug === slug), ready };
}