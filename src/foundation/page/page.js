import xxhash from "xxhash-wasm";

function generateRandomUUID() {
    return crypto.randomUUID();
}

const hash = await xxhash();

export class Page {
    removeSubcontainer(refToRemove) {
        this.subcontainers = this.subcontainers.filter(
            (container) => container.ref !== refToRemove
        );
    }

    constructor(structureJSON, contentJSON) {
        this.structure = structureJSON;
        this.content = contentJSON;
        this.primaryContainerRef = null;
        this.subcontainers = [];
        this.triggerStructureRerender = null;
        this.linkedNetHandler = null;
    }

    checkForNetAndRun(runnable) {
        if (!this.linkedNetHandler) {
            console.log("No linkedNetHandler to send changes, dropping");
            return;
        }
        runnable();
    }

    sendChange(blockId) {
        this.checkForNetAndRun(() =>
            this.linkedNetHandler.sendBlockChange(
                blockId,
                this.content[blockId]
            )
        );
    }

    sendStructureChange(newStructure) {
        this.checkForNetAndRun(() =>
            this.linkedNetHandler.sendStructureChange(newStructure)
        );
    }

    sendDeleted(blockId) {
        this.checkForNetAndRun(() =>
            this.linkedNetHandler.sendBlockDeletion(blockId)
        );
    }

    sendNewBlock(adjacentBlockId, newBlockId) {
        this.checkForNetAndRun(() =>
            this.linkedNetHandler.sendNewBlock(
                adjacentBlockId,
                newBlockId,
                this.content[newBlockId]
            )
        );
    }

    addNewBlock(blockType, blockIdBelow, initialData = {}) {
        const newBlockId = generateRandomUUID();

        this.content[newBlockId] = { type: blockType, ...initialData };

        this.insertBlockAfter(blockIdBelow, newBlockId);
        return newBlockId;
    }

    insertBlockAfter(adjacentBlockId, newBlockId) {
        this.findAndPerform(adjacentBlockId, (children, index) => {
            children.splice(index + 1, 0, { blockId: newBlockId });
        });
    }

    addTargetableSubcomponentContainer(subcontainer) {
        // Avoid duplicates by checking if this ref is already registered
        const existingIndex = this.subcontainers.findIndex(
            (container) => container.ref === subcontainer.ref
        );

        if (existingIndex === -1) {
            this.subcontainers.push(subcontainer);
        } else {
            // Update existing entry
            this.subcontainers[existingIndex] = subcontainer;
        }
    }

    revalidateSubcontainers() {
        const validContainers = [];
        const seenRefs = new Set();

        // Get all valid blockIds from the current structure
        const validBlockIds = this.getAllBlockIds();

        this.subcontainers.forEach((container) => {
            // Keep only containers with valid refs, no duplicates, and valid blockIds
            if (
                container.ref &&
                container.ref.current &&
                !seenRefs.has(container.ref.current) &&
                validBlockIds.has(container.blockId)
            ) {
                validContainers.push(container);
                seenRefs.add(container.ref.current);
            }
        });

        this.subcontainers = validContainers;
    }

    getAllBlockIds() {
        const blockIds = new Set();

        function walkStructure(node) {
            if (node.blockId) {
                blockIds.add(node.blockId);
            }
            if (node.children) {
                node.children.forEach(walkStructure);
            }
        }

        walkStructure(this.structure);
        return blockIds;
    }

    //Performs a tree walk to find the children of a blockId.
    getStructureChildren(blockId) {
        function walkTreeForBlockId(node, blockId) {
            if (node.blockId === blockId) return node.children || [];
            if (node.children) {
                for (const child of node.children) {
                    const result = walkTreeForBlockId(child, blockId);
                    if (result) return result;
                }
            }
            return null;
        }
        return walkTreeForBlockId(this.structure, blockId) || [];
    }

    deleteBlock(blockId) {
        delete this.content[blockId];
        function walkAndDelete(node, blockId) {
            if (!node.children) return;

            const index = node.children.findIndex(
                (child) => child.blockId === blockId
            );

            if (index !== -1) {
                node.children.splice(index, 1);
                return;
            }

            for (const child of node.children) {
                if (walkAndDelete(child, blockId)) {
                    return;
                }
            }
            return;
        }

        walkAndDelete(this.structure, blockId);
    }

    /**
     * The primary container is always included, where the containing blockId is undefined.
     * @returns List in the form {element: HTMLElement, blockId: string (undefined for primary container)}
     */
    getTargetableContainers() {
        this.revalidateSubcontainers();

        const containers = [
            { element: this.primaryContainerRef.current, blockId: undefined },
            ...this.subcontainers
                .filter((c) => c.canTarget())
                .map((c) => ({ element: c.ref.current, blockId: c.blockId })),
        ];

        return containers;
    }

    findAndPerform(targetBlockId, performer, currentNode = this.structure) {
        if (!currentNode.children) {
            return;
        }
        for (let i = 0; i < currentNode.children.length; i++) {
            const child = currentNode.children[i];
            if (child.blockId === targetBlockId) {
                performer(currentNode.children, i);
                return;
            }
            this.findAndPerform(targetBlockId, performer, child);
        }
    }

    getLocalHash() {
        const contentForHash = {};
        for (const blockId in this.content) {
            contentForHash[blockId] = this.linkedNetHandler.getCleanNetworkBlockData(this.content[blockId])
        }
        const contentString = JSON.stringify(contentForHash);
        const structureString = JSON.stringify(this.structure);
        const hashValue = hash.h32(contentString + structureString);
        return hashValue;
    }

}
