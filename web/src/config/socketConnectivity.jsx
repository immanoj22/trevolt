//import lib
import io from 'socket.io-client'


// import config from '../config/config'
import config from '../config/env';
import isEmpty from 'is-empty';

// SECURITY FIX (VAPT: "Token Storage Security" — Points 44/49/70):
// withCredentials lets the socket.io handshake carry the same httpOnly
// auth cookie the REST API uses, instead of the client needing to hold or
// read a raw JWT itself.
const socket = io(config.SOCKET_URL, { withCredentials: true });


socket.on('connect', function () {
    if (socket.connected) {
        Reconnect()
    }
})

/**
 * SECURITY FIX (VAPT: "Token Storage Security" — Points 44/49/70).
 * This used to read the raw JWT out of localStorage on every reconnect and
 * decode it client-side purely to get `userId` for the CREATE_ROOM socket
 * event. The JWT is no longer persisted in the browser at all, so
 * reconnection now re-joins the room using the userId already held in
 * memory from the last successful login/session-hydration
 * (see GlobalProvider.jsx / HelperRoutes.js, which call
 * createSocketUser(userId) once user details are fetched via the
 * cookie-authenticated getUserDetailsHooks()).
 */
let lastKnownUserId = null;

const Reconnect = () => {
    try {
        if (!isEmpty(lastKnownUserId)) {
            createSocketUser(lastKnownUserId);
        }
    } catch (err) {
        console.log('Reconnect__Err', err);
    }
}

const createSocketUser = (userId) => {
    if (!isEmpty(userId)) {
        lastKnownUserId = userId;
    }
    socket.emit('CREATE_ROOM', userId)
}


socket.on('disconnect', (reason) => {
    if (reason == 'transport close') {
        // toast.success('network swtiching')
        // setConnectionState('switch')
    }
    else if (reason == 'transport error') {
        // setConnectionState('notconnected')
    }
    else if (reason == 'io server disconnect') {
        // setConnectionState('notconnected')
        socket.connect()
    }
    else if (reason == 'io client disconnect') {
        // setConnectionState('notconnected')
        socket.connect()
    }
    else if (socket.disconnected) {
        // setConnectionState('disconnected')
        // toast.error('Not connected to the Internet. Please connect and try again.')
    }
    if (!socket.active) {
        // setConnectionState('notconnected')
        socket.connect()
    }
    // toast.error('Your network is too low, please reload the page')
});


export {
    socket,
    createSocketUser
}