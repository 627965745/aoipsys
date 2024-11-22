import { useTranslation } from "react-i18next";
import { Result, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { StopOutlined } from "@ant-design/icons";

const GroupError = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <Result
            status="403"
            title="403"
            icon={<StopOutlined className="text-red-500" />}
            subTitle={t("groupNotAuthorized")}
            extra={
                <Button type="primary" onClick={() => navigate(-1)}>
                    {t("back")}
                </Button>
            }
        />
    );
};

export default GroupError;