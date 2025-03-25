import axios from "axios";
import qs from "qs";
import i18next from 'i18next';

const getErrorMessage = (status, endpoint = '') => {
    if ([21, 11, 12, 22, 51, 52, 61].includes(status)) {
        return i18next.t(`error.${status}`);
    }
    switch (endpoint) {
        case '/Common/User/check':
            if (status === 101) {
                return i18next.t('error.check.101');
            }
            break;
        case '/Common/User/reset':
            if ([101, 102, 103, 104].includes(status)) {
                return i18next.t(`error.reset.${status}`);
            }
            break;
        case '/Common/Login/login':
            if ([101, 102, 103, 104].includes(status)) {
                return i18next.t(`error.login.${status}`);
            }
            break;
        case '/Common/Login/register':
            if ([101, 102, 103].includes(status)) {
                return i18next.t(`error.register.${status}`);
            }
            break;
    }
    return i18next.t('unknownError', 'An unknown error occurred');
};

const instance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 1200000,
    headers: {
        "Content-Type": "application/x-www-form-urlencoded",
    },
    withCredentials: true,
});

instance.interceptors.response.use(
    (response) => {
        if (response.data.status !== 0) {
            response.data.message = getErrorMessage(response.data.status, response.config.url);
        }
        return response;
    },
    (error) => {
        return Promise.reject(error);
    }
);

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
export const uploadFile = (formData, config) => {
    return instance.post("/Admin/Upload/upload", formData, config);
};
export const resetPassword = (data) => {
    return instance.post("/Common/User/reset", qs.stringify(data));
};

export const getResource = (data) => {
    return instance.post("/Client/Search/resource", qs.stringify(data));
};
export const getResourceCondition = (data) => {
    return instance.post("/Client/Search/condition", qs.stringify(data));
};

export const getLanguageList = (data) => {
  return instance.post("/Admin/Language/read", qs.stringify(data));
};

export const getLanguageCombo = (data) => {
  return instance.post("/Common/Language/combo");
};

export const createLanguage = (data) => {
  return instance.post("/Admin/Language/create", qs.stringify(data));
};

export const updateLanguage = (data) => {
  return instance.post("/Admin/Language/update", qs.stringify(data));
};

export default instance;
