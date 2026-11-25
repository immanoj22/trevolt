// hooks/useSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { EventCallback, GenericEventCallback, SocketEventMap } from '.';
import SocketService from './index'
import { useSelector } from 'react-redux';
import { authSelector } from '../../Slices/auth';
import { getItem } from '../Storage/localstorage';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { isEmpty } from '../../Utilities/helerfunction';

interface CustomJwtPayload extends JwtPayload {
    userId?: string;
}

interface UseSocketOptions {
    events?: Partial<{
        [K in keyof SocketEventMap]: EventCallback<SocketEventMap[K]>
    }>;
    autoConnect?: boolean;
    url?: string;
    options?: any;
}

interface UseSocketReturn {
    isConnected: boolean;
    emit: <T = any>(event: string, data?: T, callback?: (response: any) => void) => void;
    disconnect: () => void;
}

const useSocket = ({
    events = {},
    autoConnect = false,
    url,
    options
}: UseSocketOptions = {}): UseSocketReturn => {
    const [isConnected, setIsConnected] = useState<boolean>(SocketService.getConnectionStatus());
    const eventHandlersRef = useRef<Map<string, GenericEventCallback>>(new Map());
    const { userData, isAuth } = useSelector(authSelector);
    const userdetails = useRef(userData)

    useEffect(() => {
        userdetails.current = userData
    }, [userData])
    // Handle connection status
    useEffect(() => {
        const handleConnectionChange: EventCallback<{ isConnected: boolean }> = ({ isConnected }) => {
            setIsConnected(isConnected);
            if (isConnected && isAuth) {
                const token = getItem("token")
                if (!isEmpty(token)) {
                    const decoded = jwtDecode<CustomJwtPayload>(token?.toString())
                    if (decoded) emit("CREATE_ROOM", !isEmpty(decoded?.userId) ? decoded?.userId : "")
                }

            }
        };

        SocketService.addEventListener('connection_change', handleConnectionChange);

        return () => {
            SocketService.removeEventListener('connection_change', handleConnectionChange);
        };
    }, []);

    // Auto-connect if specified
    useEffect(() => {
        if (autoConnect && url) {
            SocketService.initializeSocket(url, options);
        }
    }, [autoConnect, url, options]);

    // Register event handlers
    useEffect(() => {
        // Remove previous event handlers
        eventHandlersRef.current.forEach((handler, event) => {
            SocketService.removeEventListener(event as keyof SocketEventMap, handler);
        });
        eventHandlersRef.current.clear();

        // Register new event handlers
        Object.entries(events).forEach(([event, handler]) => {
            if (typeof handler === 'function') {
                eventHandlersRef.current.set(event, handler as GenericEventCallback);
                SocketService.addEventListener(
                    event as keyof SocketEventMap,
                    handler as EventCallback<any>
                );
            }
        });

        return () => {
            // Cleanup on unmount or when events change
            eventHandlersRef.current.forEach((handler, event) => {
                SocketService.removeEventListener(event as keyof SocketEventMap, handler);
            });
            eventHandlersRef.current.clear();
        };
    }, [events]);

    const emit = useCallback(<T = any>(
        event: string,
        data?: T,
        callback?: (response: any) => void
    ) => {
        SocketService.emit(event, data);
    }, []);

    const disconnect = useCallback(() => {
        SocketService.disconnect();
    }, []);

    return {
        isConnected,
        emit,
        disconnect
    };
};

export default useSocket;