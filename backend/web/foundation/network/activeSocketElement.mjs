import xxhash from "xxhash-wasm";
import { logEditor } from "../../../logger.mjs";
import { generateRandomUUID } from "../../../database/uuidBlober.mjs";

export default class ActiveSocketElement {
    constructor(loggingName = "Active socket element") {
        this.connectedClients = {};
        this.loggingName = loggingName;
    }

    bindEvents(ws, clientId) {
        ws.on("close", () => {
            this.disconnectClient(clientId);
            logEditor(`${this.loggingName} client disconnected:`, clientId);
        });
        ws.on("message", async (message) => {
            try {
                const parsedMessage = JSON.parse(message);
                await this.handleMessage(ws, parsedMessage, clientId);
            } catch (e) {
                logEditor(
                    `Error handling ws message for ${this.loggingName}:`,
                    e
                );
            }
        });
    }
    
    async connectClient(ws, clientId = generateRandomUUID()) {
        await this.onClientConnection(ws, clientId);
        this.bindEvents(ws, clientId);
        this.connectedClients[clientId] = ws;
    }

    disconnectClient(clientId) {
        delete this.connectedClients[clientId];
    }
    
    //Optional overrides
    async onClientConnection(ws, clientId) {
    }

    async getCurrentStateHash() {
        //Default to get hash of state key if not overridden
        const stateKey = await this.getCurrentStateKey();
        return await xxhash(stateKey);
    }

    async getCurrentStateKey() { //Can be ignored as long as hash methods are not called
        throw new Error("getCurrentStateKey method not implemented");
    }

    //Expected override
    async handleMessage(ws, message) {
        throw new Error("handleMessage method not implemented");
    }

    //Netowrking helpers

    async _toOtherClients(excludedWs, action) {
        for (const clientId in this.connectedClients) {
            const clientWs = this.connectedClients[clientId];
            if (clientWs !== excludedWs) {
                await action(clientWs, clientId);
            }
        }
    }

    async _toAllClients(action) {
        for (const clientId in this.connectedClients) {
            const clientWs = this.connectedClients[clientId];
            await action(clientWs, clientId);
        }
    }

    async sendWithHash(ws, message) {
        const hash = await this.getCurrentStateHash();

        const messageWithHash = {
            ...message,
            state_hash: hash,
        };
        ws.send(JSON.stringify(messageWithHash));
    }

    //Combinations of send with hash and to other/all clients
    async sendToOtherClientsWithHash(excludedWs, message) {
        await this._toOtherClients(excludedWs, async (clientWs) =>
            this.sendWithHash(clientWs, message)
        );
    }
    async sendToAllClientsWithHash(message) {
        await this._toAllClients(async (clientWs) =>
            this.sendWithHash(clientWs, message)
        );
    }

    async sendToOtherClients(message) {
        await this._toOtherClients(excludedWs, async (clientWs) =>
            clientWs.send(JSON.stringify(message))
        );
    }
    async sendToAllClients(message) {
        await this._toAllClients(async (clientWs) =>
            clientWs.send(JSON.stringify(message))
        );
    }

}
