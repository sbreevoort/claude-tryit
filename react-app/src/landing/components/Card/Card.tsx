import { Link } from 'react-router-dom';
import clsx from 'clsx';
import './Card.css';

interface CardProps {
  name: string;
  routePath: string;
  accessRoles: string[];
  className?: string;
}

const Card = ({ name, routePath, accessRoles, className }: CardProps) => {
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className={clsx('card', className)}>
      <div className="card__avatar" aria-hidden="true">
        {initial}
      </div>
      <h2 className="card__name">{name}</h2>
      <p className="card__role">{accessRoles.join(', ')}</p>
      <Link to={routePath} className="card__button">
        Openen
      </Link>
    </div>
  );
};

export default Card;
