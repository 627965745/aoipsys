import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminAppLayout from "./components/AdminAppLayout";
import AdminHome from "./pages/AdminHome/Home";
import AdminLoginPage from "./pages/LoginPage/AdminLoginPage";
import ClientLoginPage from "./components/ClientLogin";
import AuthCheck from "./components/AuthCheck";
import Register from "./components/Register";
import ResetPassword from "./components/ResetPassword";
import CategoryPage from "./pages/Category/CategoryPage";
import ProductPage from "./pages/Product/ProductPage";
import ResourcePage from "./pages/Resource/ResourcePage";
import UserPage from "./pages/UserControl/UserPage";
import ClientHome from "./pages/ClientHome/Home";
import ClientAppLayout from "./components/ClientAppLayout";
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LangPage from "./pages/LanguageControl/LangPage";
function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/reset-password" element={
                        <ProtectedRoute requiredGroups={[1, 2, 3]}>
                            <ResetPassword />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="/admin" element={
                        <ProtectedRoute requiredGroups={[2, 3]}>
                            <AdminAppLayout />
                        </ProtectedRoute>
                    }>
                        <Route path="" element={<AdminHome />} />
                        <Route path="category" element={<CategoryPage />} />
                        <Route path="product" element={<ProductPage />} />
                        <Route path="resource" element={<ResourcePage />} />
                        <Route path="user" element={<UserPage />} />
                        <Route path="language" element={<LangPage />} />
                        <Route path="login" element={<AdminLoginPage />} />
                    </Route>

                    <Route path="/" element={
                        <ProtectedRoute requiredGroups={[1, 3]}>
                            <ClientAppLayout />
                        </ProtectedRoute>
                    }>
                        <Route path="" element={<ClientHome />} />
                        <Route path="register" element={<Register />} />
                        <Route path="login" element={<ClientLoginPage />} />
                    </Route>
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;
