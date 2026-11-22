import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./styles.css";
import "./shop.css";
import "./home.css";
import "./categories.css";
import "./menu.css";
import "./product.css";
import "./cart.css";
import { CartProvider } from "./CartContext.jsx";
import { MenuProvider } from "./MenuContext.jsx";
import Home from "./shop/Home.jsx";
import CategoriesPage from "./shop/CategoriesPage.jsx";
import Contact from "./shop/Contact.jsx";
import MenuPage from "./shop/MenuPage.jsx";
import ProductPage from "./shop/ProductPage.jsx";
import CartPage from "./shop/CartPage.jsx";
import Track from "./shop/Track.jsx";
import Admin from "./admin/Admin.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <CartProvider>
      <MenuProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/categorie/:id" element={<MenuPage />} />
          <Route path="/produit/:id" element={<ProductPage />} />
          <Route path="/panier" element={<CartPage />} />
          <Route path="/suivi/:token" element={<Track />} />
          <Route path="/back-office-bubble" element={<Admin />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </MenuProvider>
    </CartProvider>
  </BrowserRouter>
);
