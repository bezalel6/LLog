import { BrowserRouter, Route, Router, Routes } from "react-router-dom";
import Home from "./Home";
import About from "./About";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home></Home>} />
        <Route path="about" element={<About></About>} />
      </Routes>
    </BrowserRouter>
  );
}
