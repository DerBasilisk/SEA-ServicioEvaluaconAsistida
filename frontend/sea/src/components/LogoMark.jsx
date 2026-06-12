import useThemeStore from "../store/themeStore";
import { Link, useNavigate } from "react-router-dom";

export function LogoMark({ width = 80 }) {
  const { theme } = useThemeStore();
  const getLogoSrc = () => {
    switch (theme) {
      case 'light': return '/logos/LogoBlue.svg';
      case 'dark': return '/logos/LogoWhite.svg';
      case 'high-contrast': return '/logos/LogoCyan.svg';
      default: return '/logos/LogoWhite.svg';
    }
  };
  return <img src={getLogoSrc()} width={width} alt="SEA" />;
}

export function SenaMark({ width = 60 }) {
  const { theme } = useThemeStore();

  const getLogoSrc = (theme) => {
    switch (theme) {
      case 'light':        return '/logosena/SenaGreen.svg';
      case 'dark':         return '/logosena/SenaWhite.svg';
      case 'high-contrast': return '/logosena/SenaOrange.svg';
      default:             return '/logosena/SenaBlack.svg';
    }
  };

  return (
    <Link 
      to="/" 
      style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: 8, 
        textDecoration: "none", 
        flexShrink: 0 
      }}
    >
      <img 
        src={getLogoSrc(theme)}
        width={40} 
        alt="SENA" 
        style={{ 
          display: "block",
          transition: "opacity 0.4s ease, transform 0.3s ease"
        }} 
      />
    </Link>
  );
}