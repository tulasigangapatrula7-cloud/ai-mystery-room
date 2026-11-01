// client/src/App.jsx
// All pages (routes) of the website.

import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import { ToastProvider } from "./components/UI.jsx";
import Home from "./pages/Home.jsx";
import Create from "./pages/Create.jsx";
import Case from "./pages/Case.jsx";
import Accuse from "./pages/Accuse.jsx";
import Result from "./pages/Result.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<Create />} />
          <Route path="/case/:id" element={<Case />} />
          <Route path="/case/:id/accuse" element={<Accuse />} />
          <Route path="/case/:id/result" element={<Result />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}
