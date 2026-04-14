/**
 * Root navigator that switches between AuthStack and AppStack
 * based on whether the user has a wallet address.
 */
import React from "react";
import { useAuth } from "../hooks/useAuth";
import EmailAuthView from "../components/auth/EmailAuthView";
import EmailConflictWarningView from "../components/auth/EmailConflictWarningView";
import AuthStack from "./AuthStack";
import AppStack from "./AppStack";

export default function RootNavigator() {
  const {
    walletAddress,
    isEmailAuthInProgress,
    emailConflictInfo,
    isEmailConflictOpen,
    closeEmailAuth,
    onEmailAuthSuccess,
    closeEmailConflict,
    confirmEmailConflict,
  } = useAuth();

  return (
    <>
      {walletAddress ? <AppStack /> : <AuthStack />}

      {isEmailAuthInProgress && (
        <EmailAuthView
          onCancel={closeEmailAuth}
          onSuccess={onEmailAuthSuccess}
        />
      )}
      {isEmailConflictOpen && (
        <EmailConflictWarningView
          info={emailConflictInfo}
          onCancel={closeEmailConflict}
          onConfirm={confirmEmailConflict}
        />
      )}
    </>
  );
}
