/**
 * OfferWallContainer — screen-level wrapper for the offer wall.
 * Reads wallet + offers from context, delegates rendering to OfferWallScreen.
 */
import React, { useCallback, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../hooks/useAuth";
import { useWallet } from "../hooks/useWallet";
import { useOffers } from "../hooks/useOffers";
import OfferCard from "../components/offers/OfferCard";
import OfferWallScreen from "../components/offers/OfferWallScreen";
import type { Offer } from "../types/offer";
import type { AppStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<AppStackParamList, "OfferWall">;

export default function OfferWallContainer() {
  const navigation = useNavigation<Nav>();
  const { walletAddress, signOut } = useAuth();
  const {
    balanceWei,
    trackAddress,
    claimBalance,
    claimCount,
    gamesPlayed,
    gamesWon,
    recordGamePlayed,
  } = useWallet();
  const { offers } = useOffers();

  useEffect(() => {
    trackAddress(walletAddress);
  }, [walletAddress, trackAddress]);

  const handlePlay = useCallback(
    (offer: Offer) => {
      recordGamePlayed();
      navigation.navigate("Game", {
        offerId: offer.id,
        gameType: offer.gameType,
        reward: offer.reward,
      });
    },
    [navigation, recordGamePlayed],
  );

  const renderOfferCard = useCallback(
    (offer: Offer, index: number) => (
      <OfferCard key={offer.id} offer={offer} index={index} onPlay={handlePlay} />
    ),
    [handlePlay],
  );

  return (
    <OfferWallScreen
      walletAddress={walletAddress ?? ""}
      balanceWei={balanceWei}
      offers={offers}
      isGenerating={offers.length < 3}
      claimedToday={claimCount}
      gamesPlayed={gamesPlayed}
      gamesWon={gamesWon}
      onSignOut={signOut}
      onClaim={claimBalance}
      renderOfferCard={renderOfferCard}
    />
  );
}