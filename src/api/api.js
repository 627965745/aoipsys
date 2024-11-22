import axios from "axios";
import qs from "qs";

const instance = axios.create({
    baseURL: "https://rentwx.highmec.com/obj",
    timeout: 10000,
    headers: {
        "Content-Type": "application/x-www-form-urlencoded",
    },
    withCredentials: true,
});

export const getCaptcha = () => {
    return instance.get(`/Common/Captcha/get?t=${new Date().getTime()}`);
};

export const validateEmail = (data) => {
    return instance.post("/Common/Login/emailValidate", qs.stringify(data));
};

export const login = (data) => {
    return instance.post("/Common/Login/login", qs.stringify(data));
};

export const checkUser = () => {
    return instance.post("/Common/User/check");
};

export const logout = () => {
    return instance.post("/Common/User/logout");
};

export const register = (data) => {
    return instance.post("/Common/Login/register", qs.stringify(data));
};

export const getCategoryList = (data) => {
    return instance.post("/Admin/Category/read", qs.stringify(data));
};

export const createCategory = (data) => {
    return instance.post("/Admin/Category/create", qs.stringify(data));
};

export const getCategoryDropdown = (data) => {
  return instance.post("/Admin/Category/combo");
};
export const updateCategory = (data) => {
    return instance.post("/Admin/Category/update", qs.stringify(data));
};
export const getProductList = (data) => {
  return instance.post("/Admin/Product/read", qs.stringify(data));
};

export const createProduct = (data) => {
  return instance.post("/Admin/Product/create", qs.stringify(data));
};
export const getProductDropdown = (data) => {
  return instance.post("/Admin/Product/combo");
};

export const updateProduct = (data) => {
  return instance.post("/Admin/Product/update", qs.stringify(data));
};
export const getResourceList = (data) => {
  return instance.post("/Admin/Resource/read", qs.stringify(data));
};

export const createResource = (data) => {
  return instance.post("/Admin/Resource/create", qs.stringify(data));
};

export const updateResource = (data) => {
  return instance.post("/Admin/Resource/update", qs.stringify(data));
};
export const getUserList = (data) => {  
  return instance.post("/Admin/Operator/read", qs.stringify(data));
};
export const createUser = (data) => {
  return instance.post("/Admin/Operator/create", qs.stringify(data));
};
export const updateUser = (data) => {
  return instance.post("/Admin/Operator/update", qs.stringify(data));
};
export const resetUserPassword = (data) => {
  return instance.post("/Admin/Operator/reset", qs.stringify(data));
};
export const uploadFile = (formData) => {
    return instance.post("/Admin/Upload/upload", formData, {
        headers: {
            'Content-Type': 'multipart/form-data'  // Override default content type for file upload
        }
    });
};
export const resetPassword = (data) => {
    return instance.post("/Common/User/reset", qs.stringify(data));
};

export const getResource = (data) => {
    return instance.post("/Client/Search/resource", qs.stringify(data));
};
export const getResourceCondition = (data) => {
    return instance.post("/Client/Search/condition");
};
export default instance;
