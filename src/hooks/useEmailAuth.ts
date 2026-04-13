/**
 * Hook that manages the two-step email authentication flow with Sequence WaaS.
 * Handles initiating auth, responding to the email code challenge, and account linking.
 */
import { useEffect, useState, useCallback } from "react";
import { Challenge } from "@0xsequence/waas";
import { sequenceWaas } from "../config/waasSetup";
import { isAccountAlreadyLinkedError } from "../utils/error";

interface UseEmailAuthOptions {
  onSuccess: (res: { wallet: string; sessionId: string }) => void;
  sessionName: string;
  linkAccount?: boolean;
}

export function useEmailAuth({ onSuccess, sessionName, linkAccount = false }: UseEmailAuthOptions) {
  const [error, setError] = useState<unknown>();
  const [loading, setLoading] = useState(false);
  const [inProgress, setInProgress] = useState(false);
  const [respondWithCode, setRespondWithCode] = useState<
    ((code: string) => Promise<void>) | null
  >();
  const [challenge, setChallenge] = useState<Challenge | undefined>();

  useEffect(() => {
    return sequenceWaas.onEmailAuthCodeRequired(async (respond) => {
      setLoading(false);
      setRespondWithCode(() => respond);
    });
  }, []);

  const initiateAuth = useCallback(
    async (email: string) => {
      setLoading(true);
      setInProgress(true);
      try {
        if (linkAccount) {
          const ch = await sequenceWaas.initAuth({ email });
          setChallenge(ch);
          setLoading(false);
        } else {
          const res = await sequenceWaas.signIn({ email }, sessionName);
          onSuccess(res);
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        if (!linkAccount) {
          setLoading(false);
          setInProgress(false);
        }
      }
    },
    [linkAccount, sessionName, onSuccess],
  );

  const sendChallengeAnswer = useCallback(
    async (answer: string) => {
      if (linkAccount && challenge) {
        try {
          await sequenceWaas.linkAccount(challenge.withAnswer(answer));
        } catch (e) {
          if (isAccountAlreadyLinkedError(e)) {
            console.log("Account already linked");
          }
        }
        setLoading(false);
        setInProgress(false);
        return;
      }
      if (respondWithCode) {
        await respondWithCode(answer);
      }
    },
    [linkAccount, challenge, respondWithCode],
  );

  const cancel = useCallback(() => {
    setInProgress(false);
    setLoading(false);
    setChallenge(undefined);
    setRespondWithCode(null);
  }, []);

  return {
    inProgress,
    initiateAuth,
    loading,
    error,
    sendChallengeAnswer: inProgress ? sendChallengeAnswer : undefined,
    cancel,
  };
}
