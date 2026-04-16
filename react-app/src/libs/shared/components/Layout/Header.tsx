import { useQuery } from '@tanstack/react-query';
import { fetchUser } from '../../utils/userApi';
import './Header.css';

const Header = () => {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
  });

  const displayName = user ? `${user.firstName}. ${user.lastName}.` : '…';

  return (
    <header className="header">
      <div className="header__user">
        <span className="header__greeting">Welkom, {displayName}</span>
        <button className="header__logout" type="button">
          Uitloggen
        </button>
      </div>
    </header>
  );
};

export default Header;
