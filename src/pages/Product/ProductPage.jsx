import { useLocation } from 'react-router-dom';
import ProductList from "./ProductList";

export default function ProductPage() {
    const location = useLocation();
    return <ProductList key={location.state?.refresh || 'default'} />;
}
