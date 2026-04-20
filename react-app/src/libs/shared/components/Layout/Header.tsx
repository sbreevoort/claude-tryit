import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchUser } from '../../utils/userApi';
import { useTheme } from '../../contexts/ThemeContext/useTheme';
import './Header.css';

const Header = () => {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
  });
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const displayName = user ? `${user.firstName}. ${user.lastName}.` : '…';

  return (
    <header className="header">
      <div className="header__user">
        <span className="header__greeting">Welkom, {displayName}</span>
        <button
          className="header__theme-toggle"
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          title={theme === 'light' ? 'Dark mode' : 'Light mode'}
        >
          {theme === 'light' ? '☾' : '☀'}
        </button>
        <button
          className="header__settings"
          type="button"
          onClick={() => navigate('/settings')}
          aria-label="Open settings"
          title="User & Role Management"
        >
          ⚙
        </button>
        <button className="header__logout" type="button">
          Uitloggen
        </button>
      </div>
    </header>
  );
};

export default Header;
