import { useQuery } from '@tanstack/react-query';
import { fetchUser } from '../../libs/shared/utils/userApi';
import { applications } from '../../Applications';
import Card from '../components/Card/Card';
import './LandingPage.css';

const LandingPage = () => {
  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
  });

  const authorizedApps = user
    ? applications.filter((app) =>
        app.accessRoles.some((role) => user.roles.includes(role))
      )
    : [];

  return (
    <main className="landing">
      <header className="landing__hero">
        {isLoading ? (
          <div className="landing__loading">
            <span
              className="landing__spinner"
              role="status"
              aria-label="Laden..."
            />
            <p>Laden...</p>
          </div>
        ) : (
          <h1 className="landing__title">
            Welkom op de nieuwe AI✨ Application Portal, {user?.firstName}!
          </h1>
        )}
      </header>
      {!isLoading && (
        <section className="landing__grid">
          {authorizedApps.map((app) => (
            <Card
              key={app.routePath}
              name={app.name}
              routePath={app.routePath}
              accessRoles={app.accessRoles}
              avatar={app.avatar}
            />
          ))}
        </section>
      )}
    </main>
  );
};

export default LandingPage;
