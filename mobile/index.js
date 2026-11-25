/**
 * @format
 */
import 'react-native-get-random-values';
import "react-native-gesture-handler"
import { AppRegistry } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableScreens } from "react-native-screens";
import messaging from '@react-native-firebase/messaging';

import App from './App.tsx';
import { name as appName } from './app.json';
import { store } from './App/Slices/index.ts';

enableScreens(true)

// Must be registered here, outside any component — @react-native-firebase/messaging
// requires a background handler to exist or it logs a runtime warning and the
// background/quit delivery path is unreliable. The backend always sends a
// `notification` payload, so Android/iOS render the tray entry themselves; this
// handler only needs to resolve. Tapping the notification to reopen the app is
// handled separately via getInitialNotification()/onNotificationOpenedApp() in App.tsx.
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    if (__DEV__) {
        console.log('FCM background message:', remoteMessage?.messageId);
    }
});

const Wrapper = () => {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Provider store={store} >
                <SafeAreaProvider>
                    <App />
                </SafeAreaProvider>
            </Provider>
        </GestureHandlerRootView>
    );
};
AppRegistry.registerComponent(appName, () => Wrapper);