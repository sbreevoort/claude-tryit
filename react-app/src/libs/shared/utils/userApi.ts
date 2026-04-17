interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
}

export const fetchUser = async (): Promise<UserData> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    firstName: 'S',
    lastName: 'B',
    email: 'sb@tst.randstadgroep.nl',
    roles: ['MKBTOOL_ADMIN', 'Integration_Dashboard_Client_Int_Tech_user', 'VITALITY_USER', 'AI_TESTER', 'PITCH_GENERATOR'],
  };
};
