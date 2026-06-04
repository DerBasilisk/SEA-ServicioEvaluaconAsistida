import useThemeStore from "../store/themeStore";

export default function LogoMark({ width = 130 }) {
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