import { useEffect, useState } from "react";

/** How far down the viewport a section must reach to count as being read. */
const READING_LINE = 0.35;

/** Tracks which of the given sections the reader has scrolled to. */
export function useActiveSection(ids: string[]): string | undefined {
  const [active, setActive] = useState(ids[0]);
  const key = ids.join(" ");

  useEffect(() => {
    const sectionIds = key.split(" ");

    const update = () => {
      const line = window.innerHeight * READING_LINE;
      let current = sectionIds[0];
      for (const id of sectionIds) {
        const element = document.getElementById(id);
        if (element && element.getBoundingClientRect().top <= line) {
          current = id;
        }
      }
      // At the foot of the page the last section may be too short to reach
      // the reading line. A page that has not been scrolled is at its top,
      // however little of it there is yet.
      const page = document.documentElement;
      if (
        window.scrollY > 0 &&
        window.innerHeight + window.scrollY >= page.scrollHeight - 2
      ) {
        current = sectionIds.at(-1);
      }
      setActive(current);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    // Sections move without a scroll when content above them loads.
    const resized = new ResizeObserver(update);
    resized.observe(document.body);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      resized.disconnect();
    };
  }, [key]);

  return active;
}
