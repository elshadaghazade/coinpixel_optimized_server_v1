import { Socket } from 'socket.io';

class SocketWrapper {

    constructor(public socket: Socket) {}

    on(event_name: string, listener: (...args: any[]) => void) {
        return this.socket.on(event_name, listener);
    }

    emit (ev: string, ...args: any[]) {
        return this.socket.emit(ev, ...args);
    }

    onAny (listener: (...args: any[]) => void) {
        return this.socket.onAny(listener)
    }

    offAny (listener?: ((...args: any[]) => void) | undefined) {
        return this.socket.offAny(listener);
    }

    off (eventName: string | symbol, listener: (...args: any[]) => void) {
        return this.socket.off(eventName, listener);
    }

    disconnect (close?: boolean) {
        return this.socket.disconnect(close);
    }

    get connected () {
        return this.socket.connected;
    }

    get disconnected () {
        return this.socket.disconnected;
    }

    get id () {
        return this.socket.id;
    }
}

export default SocketWrapper;