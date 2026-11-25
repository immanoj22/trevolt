// declarations.d.ts
// declare module 'react-native-swipeable-list';
declare module '*.svg' {
    import React from 'react';
    import { SvgProps } from 'react-native-svg';
    const content: React.FC<SvgProps>;
    export default content;
}

declare module '*.png' {
    const value: any;
    export = value;
}
declare module '*.jpg' {
    const value: any;
    export = value;
}
declare module '*.jpeg' {
    const value: any;
    export = value;
}
declare module '*.gif' {
    const value: any;
    export = value;
}
declare module '*.webp' {
    const value: any;
    export = value;
}
declare module '*.mp4' {
    const value: any;
    export = value;
}
declare module '*.mp3' {
    const value: any;
    export = value;
}
declare module '*.wav' {
    const value: any;
    export = value;
}
declare module '*.aac' {
    const value: any;
    export = value;
}

declare module "@env" {
    export const BASE_URL: string;
    export const CRYPTO_SECRET_KEY: string;
    export const MOBILE_APP_SIGNING_SECRET: string;
    export const GCC_WEB_CLIENT_ID: string;
    export const ELEVENLABS_BASE_URL: string;
    export const ELEVENLABS_API_KEY: string;
    export const GOOGLE_API_KEY: string;
    export const GOOGLE_MAPS_BASE_URL: string;
    export const IMAGE_PROFILE: string
    export const REFERURL_URL: string
    export const SOCKET_URL: string
    export const KYCREDIRECT_URL: string
    export const SUPPORT_URL: string
    export const API_URL: string
    export const ENV_MODE: string
}