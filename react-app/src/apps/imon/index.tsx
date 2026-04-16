import { Link } from 'react-router-dom';
import type { AppComponentProps } from '../../Applications';

export const IntegrationMonitorApp = ({ name }: AppComponentProps) => {
  return (
    <div>
      <h1>{name}</h1>
      <Link to="/">Terug naar portaal</Link>
    </div>
  );
};
