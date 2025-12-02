import svgPaths from "../assets/svg-5jelk77caj";

// DIGISYNTHETIC logo text (small version for nav bar)
export const DigisyntheticLogoSmall = ({ fill = "white", className = "" }) => (
    <svg className={className} viewBox="0 0 224 31" fill="none" preserveAspectRatio="xMidYMid meet">
        <path d={svgPaths.p75d5380} fill={fill} />
        <path d={svgPaths.p207e4b00} fill={fill} />
        <path d={svgPaths.p2773d500} fill={fill} />
        <path d={svgPaths.p187fe00} fill={fill} />
        <path d={svgPaths.pbba3000} fill={fill} />
        <path d={svgPaths.p35d01280} fill={fill} />
        <path d={svgPaths.p31cec600} fill={fill} />
        <path d={svgPaths.p2d5a34c0} fill={fill} />
        <path d={svgPaths.p4d92a00} fill={fill} />
        <path d={svgPaths.p3847e900} fill={fill} />
        <path d={svgPaths.p1c36ae00} fill={fill} />
        <path d={svgPaths.p19033b70} fill={fill} />
        <path d={svgPaths.p1f268a00} fill={fill} />
        <path clipRule="evenodd" d={svgPaths.p35e29200} fill={fill} fillRule="evenodd" stroke={fill} strokeMiterlimit="10" strokeWidth="0.25" />
        <path d={svgPaths.p3a903480} fill={fill} stroke={fill} strokeMiterlimit="10" strokeWidth="0.25" />
    </svg>
);

// DIGISYNTHETIC logo text (large version for brand section)
export const DigisyntheticLogoLarge = ({ fill = "white", className = "" }) => (
    <svg className={className} viewBox="0 0 244 34" fill="none">
        <path d={svgPaths.p376e0300} fill={fill} />
        <path d={svgPaths.p29868680} fill={fill} />
        <path d={svgPaths.p14d3e580} fill={fill} />
        <path d={svgPaths.p3f02b700} fill={fill} />
        <path d={svgPaths.p25bd7340} fill={fill} />
        <path d={svgPaths.p96d8280} fill={fill} />
        <path d={svgPaths.p3b515b00} fill={fill} />
        <path d={svgPaths.p34523500} fill={fill} />
        <path d={svgPaths.p35a95540} fill={fill} />
        <path d={svgPaths.p3346e4f0} fill={fill} />
        <path d={svgPaths.p160dab80} fill={fill} />
        <path d={svgPaths.p1abea340} fill={fill} />
        <path d={svgPaths.p32f02080} fill={fill} />
        <path clipRule="evenodd" d={svgPaths.p35017800} fill={fill} fillRule="evenodd" stroke={fill} strokeMiterlimit="10" strokeWidth="0.25" />
        <path d={svgPaths.pc3aebf0} fill={fill} stroke={fill} strokeMiterlimit="10" strokeWidth="0.25" />
    </svg>
);

// SoundNet logo
export const SoundNetLogo = ({ fillPrimary = "white", fillAccent = "#4077E6", className = "" }) => (
    <svg className={className} viewBox="0 0 181 32" fill="none" preserveAspectRatio="xMidYMid meet">
        <path d={svgPaths.p2b0e9880} fill={fillPrimary} />
        <path d={svgPaths.p312d4240} fill={fillPrimary} />
        <path d={svgPaths.p3c466b00} fill={fillPrimary} />
        <path d={svgPaths.p2ee0100} fill={fillPrimary} />
        <path d={svgPaths.p32d99258} fill={fillPrimary} />
        <path d={svgPaths.p3a505a80} fill={fillPrimary} />
        <path d={svgPaths.p2afc1500} fill={fillPrimary} />
        <path d={svgPaths.p1d9c1600} fill={fillAccent} />
    </svg>
);

export default {
    DigisyntheticLogoSmall,
    DigisyntheticLogoLarge,
    SoundNetLogo,
};

