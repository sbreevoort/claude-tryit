import { useMutation, useQuery } from '@tanstack/react-query';
import type { AppComponentProps } from '../../Applications';
import { fetchUser } from '../../libs/shared/utils/userApi';
import { fetchDiscountCode } from '../../libs/shared/utils/vitalityApi';
import { Button } from '../../libs/shared/components';

export const VitalityApp = (_props: AppComponentProps) => {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
  });

  const { mutate, isPending, data } = useMutation({
    mutationFn: () => fetchDiscountCode(user?.email ?? ''),
  });

  return (
    <div>
      <h1>Mijn vitaliteit.</h1>
      <p>
        Wij vinden jouw vitaliteit belangrijk. Daarom hebben we afspraken
        gemaakt met SportCity zodat jij voordelig kunt sporten.
      </p>
      <h2>Hoe werkt het?</h2>
      <p>
        Klik op onderstaande button en ontvang je persoonlijke kortingscode. De
        code is vanaf het moment van aanvragen een jaar geldig.
      </p>
      <Button
        type="button"
        buttonStyle="filled"
        isLoading={isPending}
        onClick={() => mutate()}
      >
        Kortingscode
      </Button>
      {data && (
        <p>
          <strong>{data.discountCode}</strong>
        </p>
      )}
    </div>
  );
};
