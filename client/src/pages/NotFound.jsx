// client/src/pages/NotFound.jsx
// Shown when the web address does not match any page.

import { Link } from "react-router-dom";
import { FileSearch } from "lucide-react";
import { EmptyState } from "../components/UI.jsx";
import usePageTitle from "../hooks/usePageTitle.js";

export default function NotFound() {
  usePageTitle("Page not found");
  return (
    <div className="mx-auto max-w-xl">
      <EmptyState
        icon={FileSearch}
        title="This page is not in the case files"
        text="The page you are looking for does not exist. Head back and start a new investigation."
      >
        <div className="mt-2 flex gap-3">
          <Link to="/" className="btn-ghost">
            Home
          </Link>
          <Link to="/create" className="btn-gold">
            New Case
          </Link>
        </div>
      </EmptyState>
    </div>
  );
}
