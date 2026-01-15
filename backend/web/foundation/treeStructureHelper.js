/**
 * Converts a structure like
 * {
 *  children: [
 *  { pageId: 'page1', children: [...], otherData... },
 * }
 * 
 * to a flat map of nodes, including order data, like
 * {
 *  'page1': { pageId: 'page1', children: [...], order: i, parent: id | null, otherData... },
 * }
 */
export function destructureTree(rootNode, idKey) {
    const nodes = {};

    function walk(children, parentId = null) {
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            nodes[child[idKey]] = { ...child, order: i, parent: parentId };
            if (child.children) {
                walk(child.children, child[idKey]);
            }
        }
    }

    walk(rootNode.children);

    return nodes;
}