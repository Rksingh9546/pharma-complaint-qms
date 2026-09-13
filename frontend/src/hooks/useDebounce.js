import { useEffect, useState } from "react";

/** Returns `value` once it has been stable for `delay` ms. */
export default function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);   // value changed mid-delay -> restart the clock
  }, [value, delay]);

  return debounced;
}