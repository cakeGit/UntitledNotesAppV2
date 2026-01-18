import { logEditor } from "../../../logger.mjs";
import { RequestError } from "../../foundation_safe/requestError.js";

export default class ActiveElementManager {
    constructor(activeElementLoader, activeElementConnectionPredicate) {
        this.activeElementLoader = activeElementLoader;
        this.activeElementConnectionPredicate =
            activeElementConnectionPredicate;

        this.currentLoadingThreads = {};
        this.activeElements = {};
    }

    async getOrLoadActiveElementFor(activeElementKey) {
        //It is assumed that the first argument is the unique key, and the rest are loader arguments

        //Check the user can access the element before doing anything
        if (!this.activeElementConnectionPredicate(...arguments))
            //A more specific error may be thrown by the predicate
            throw new RequestError(
                "User is forbidden access to this resource: " + activeElementKey
            );

        //Check if an active element is already loaded
        if (this.activeElements[activeElementKey]) {
            return this.activeElements[activeElementKey];
        }

        //...Or if a loading thread is already in progress
        if (this.currentLoadingThreads[activeElementKey]) {
            return await this.currentLoadingThreads[activeElementKey];
        }

        //Start loading the active element
        logEditor("Loading active element synchronously:", activeElementKey);
        this.currentLoadingThreads[activeElementKey] = this.activeElementLoader(
            ...arguments
        ).then((activeElement) => {
            //Add a callback to remove the thread and make the active element available once loaded
            this.activeElements[activeElementKey] = activeElement;
            delete this.currentLoadingThreads[activeElementKey];
            return activeElement;
        });
        return await this.currentLoadingThreads[activeElementKey];
    }
}
