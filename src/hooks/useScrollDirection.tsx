import { useState, useEffect } from "react";

export const useScrollDirection = () => {
  const [scrollDirection, setScrollDirection] = useState<"up" | "down">("up");
  const [prevOffset, setPrevOffset] = useState(0);

  useEffect(() => {
    const threshold = 10;
    let ticking = false;

    const updateScrollDirection = () => {
      const scrollY = window.pageYOffset;

      if (Math.abs(scrollY - prevOffset) < threshold) {
        ticking = false;
        return;
      }

      setScrollDirection(scrollY > prevOffset ? "down" : "up");
      setPrevOffset(scrollY);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll);

    return () => window.removeEventListener("scroll", onScroll);
  }, [prevOffset]);

  return scrollDirection;
};
