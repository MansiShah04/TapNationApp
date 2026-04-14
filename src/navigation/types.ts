/**
 * Navigation type definitions for type-safe route params.
 */
export type AuthStackParamList = {
  Login: undefined;
};

export type AppStackParamList = {
  OfferWall: undefined;
  Game: { offerId: string; gameType: string; reward: number };
};

export type RootStackParamList = AuthStackParamList & AppStackParamList;
