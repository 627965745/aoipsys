import axios from "axios";
import qs from "qs";
import i18next from 'i18next';

// Configure qs.stringify options to preserve empty values
const qsOptions = {
    skipNulls: false,
    allowEmptyArrays: true,
    encode: true
};

// Helper function to stringify data with consistent options
const stringifyData = (data) => {
    if (!data) return '';
    return qs.stringify(data, qsOptions);
};

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
            if ([101, 102, 103, 104].includes(status)) {
                return i18next.t(`error.register.${status}`);
            }
            break;
    }
    return i18next.t('unknownError', 'An unknown error occurred');
};

const instance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 0,
    headers: {
        "Content-Type": "application/x-www-form-urlencoded",
    },
    withCredentials: true,
});

instance.interceptors.response.use(
    (response) => {
        if (response.data.status !== 0) {
            const url = new URL(response.config.url, response.config.baseURL);
            const endpoint = url.pathname;
            
            // For admin endpoints, use response.data.message directly
            if (endpoint.toLowerCase().startsWith('/admin')) {
                return Promise.reject({
                    response: {
                        data: {
                            message: response.data.message || 'An error occurred'
                        }
                    }
                });
            }
            
            return Promise.reject({
                response: {
                    data: {
                        message: getErrorMessage(response.data.status, endpoint)
                    }
                }
            });
        }
        return response;
    },
    (error) => {
        return Promise.reject({
            response: {
                data: {
                    message: i18next.t('networkError', 'Network error occurred')
                }
            }
        });
    }
);

export const getCaptcha = () => {
    return instance.get(`/Common/Captcha/get?t=${new Date().getTime()}`);
};

export const validateEmail = (data) => {
    return instance.post("/Common/Login/emailValidate", stringifyData(data));
};

export const login = (data) => {
    return instance.post("/Common/Login/login", stringifyData(data));
};

export const checkUser = () => {    
    return instance.post("/Common/User/check");
};
export const getUserInfo = () => {
    return instance.post("/Common/User/info");
};

export const logout = () => {
    return instance.post("/Common/User/logout");
};

export const subscribeEmail = (data) => {
    return instance.post("/Common/User/subscribe", stringifyData(data));
};

export const register = (data) => {
    return instance.post("/Common/Login/register", stringifyData(data));
};

export const getCategoryList = (data) => {
    return instance.post("/Admin/Category/read", stringifyData(data));
};

export const createCategory = (data) => {
    return instance.post("/Admin/Category/create", stringifyData(data));
};

export const getCategoryDropdown = (data) => {
  return instance.post("/Admin/Category/combo");
};
export const updateCategory = (data) => {
    return instance.post("/Admin/Category/update", stringifyData(data));
};
export const getProductList = (data) => {
  return instance.post("/Admin/Product/read", stringifyData(data));
};

export const createProduct = (data) => {
  return instance.post("/Admin/Product/create", stringifyData(data));
};
export const getProductDropdown = (data) => {
  return instance.post("/Admin/Product/combo");
};

export const updateProduct = (data) => {
  return instance.post("/Admin/Product/update", stringifyData(data));
};
export const getResourceList = (data) => {
  return instance.post("/Admin/Resource/read", stringifyData(data));
};

export const createResource = (data) => {
  return instance.post("/Admin/Resource/create", stringifyData(data));
};

export const updateResource = (data) => {
  return instance.post("/Admin/Resource/update", stringifyData(data));
};
export const getUserList = (data) => {  
  return instance.post("/Admin/Operator/read", stringifyData(data));
};
export const createUser = (data) => {
  return instance.post("/Admin/Operator/create", stringifyData(data));
};
export const updateUser = (data) => {
  return instance.post("/Admin/Operator/update", stringifyData(data));
};
export const resetUserPassword = (data) => {
  return instance.post("/Admin/Operator/reset", stringifyData(data));
};
export const uploadFile = (formData, config) => {
    return instance.post("/Admin/Upload/upload", formData, {
        ...config,
        timeout: 240000
    });
};
export const sendEmail = (data) => {
    return instance.post("/Admin/Email/create", stringifyData(data));
};
export const getEmailList = (data) => {
    return instance.post("/Admin/Email/read", stringifyData(data));
};
export const requestPdf = (data) => {
    return instance.post("/Client/Search/pdfGet", stringifyData(data), { timeout: 0 });
};
export const resetPassword = (data) => {
    return instance.post("/Common/User/reset", stringifyData(data));
};

export const getResource = (data) => {
    return instance.post("/Client/Search/resource", stringifyData(data));
};
export const getMarkdown = (data) => {
    return instance.post("/Admin/Resource/markdown", stringifyData(data));
};
export const getUserMarkdown = (data) => {
    return instance.post("/Client/Search/markdown", stringifyData(data));
};
export const getResourceCondition = (data) => {
    return instance.post("/Client/Search/condition", stringifyData(data));
};

export const getLanguageList = (data) => {
  return instance.post("/Admin/Language/read", stringifyData(data));
};

export const getLanguageCombo = (data) => {
  return instance.post("/Common/Language/combo");
};

export const createLanguage = (data) => {
  return instance.post("/Admin/Language/create", stringifyData(data));
};

export const updateLanguage = (data) => {
  return instance.post("/Admin/Language/update", stringifyData(data));
};

export default instance;
