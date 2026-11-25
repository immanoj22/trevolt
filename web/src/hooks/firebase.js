import React, { useEffect, useState } from "react";

/** Config */
import config from '../config/env';
// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';



const app = initializeApp(config.FIREBASECONFIG);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// // Force user to select account every time
provider.setCustomParameters({
    prompt: 'select_account'
});

export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        return { status: true, data: result.user, token: result._tokenResponse }
    } catch (error) {
        return { status: false, error: error.toString() }
    }
};


export const logout = async () => {
    try {
        await signOut(auth);
        return { status: true };
    } catch (error) {
        return { status: false, error: error?.message || error.toString() };
    }
};