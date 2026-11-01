// client/src/hooks/usePageTitle.js
// Sets the browser tab title for each page.

import { useEffect } from "react";

export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | AI Mystery Room` : "AI Mystery Room";
  }, [title]);
}
