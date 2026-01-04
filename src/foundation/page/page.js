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

    sendChange(blockId) {
        if (!this.linkedNetHandler) {
            console.log("No linkedNetHandler to send changes, dropping");
            return;
        }
        this.linkedNetHandler.sendBlockChange(blockId, this.content[blockId]);
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
}
