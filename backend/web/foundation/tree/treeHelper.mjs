/**
 * Removes an element from a tree structure.
 * Returns the removed element, or null if not found.
 */
export function removeElement(rootNode, idKey, elementId) {
    //Walk function, returns true if the element is removed and we should stop searching
    let removedElement = null;
    function walkForRemoval(node) {
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            if (child[idKey] === elementId) {
                removedElement = node.children.splice(i, 1)[0];
                return true;
            }
            if (child.children && walkForRemoval(child)) {
                return true;
            }
        }
        return false;
    }
    walkForRemoval(rootNode);
    return removedElement;
}

/**
 * Inserts an element into a tree structure at the specified parent and index.
 * Returns whether the insertion was successful.
 */
export function insertElement(rootNode, idKey, elementNode, parentId, index) {
    //Walk function to find the parent and insert the element, similarly returning true if complete
    function walkForInsertion(node) {
        if (node[idKey] === parentId || (parentId === null && node === rootNode)) {
            node.children.splice(index, 0, elementNode);
            return true;
        }

        for (const child of node.children) {
            if (child.children && walkForInsertion(child)) {
                return true;
            }
        }
        return false;
    }
    return walkForInsertion(rootNode);
}

/**
 * Moves an element within a tree structure.
 * e.g. takes in:
 * {
 *  children: [
 *   { pageId: 'page1', children: [...] },
 *   { pageId: 'page2', children: [...] },
 * }
 * and moves 'page2' to be a child of 'page1' at index 0:
 * 
 * Returns true if successful, otherwise returns a string describing the error.
 */

export function moveElement(rootNode, idKey, elementId, newParentId, newIndex) {
    const removedElement = removeElement(rootNode, idKey, elementId);
    if (removedElement === null) {
        return `Element with ID ${elementId} not found for removal.`;
    }
    const insertionSuccess = insertElement(
        rootNode,
        idKey,
        removedElement,
        newParentId,
        newIndex
    );
    if (!insertionSuccess) {
        return `New parent with ID ${newParentId} not found for insertion.`;
    }
    return true;
}