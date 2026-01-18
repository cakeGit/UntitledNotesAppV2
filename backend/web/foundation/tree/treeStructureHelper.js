/**
 * Converts a structure like
 * {
 *  children: [
 *  { pageId: 'page1', children: [...], otherData... },
 * }
 *
 * to a flat list of nodes, including order data, like
 * [
 *  { pageId: 'page1', children: [...], order: i, parent: id | null, otherData... },
 * ]
 */
export function destructureTree(rootNode, idKey) {
    const nodes = [];

    function walk(children, parentId = null) {
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            nodes.push({ ...child, order: i, parent: parentId });
            if (child.children) {
                walk(child.children, child[idKey]);
            }
        }
    }

    walk(rootNode.children);

    return nodes;
}

/**
 * A reverse of destructure tree, to turn a flat list of elements with parent references and order into a tree like
 * [
 *  { pageId: 'page1', children: [...], order: i, parent: id | null, otherData... },
 * ]
 * turns into
 * {
 *  children: [
 *  { pageId: 'page1', children: [...], otherData... },
 * }
 */
export function restructureTree(elements, idKey, parentKey = "parent") {
    let rootNode = {
        children: [],
    };

    let parents = {};
    let treeNodes = {};

    //Fill out nodes and parent mapping
    for (const element of elements) {
        const node = {
            ...element,
            children: [],
        };
        treeNodes[element[idKey]] = node;
        if (element[parentKey]) {
            const parentId = element[parentKey];
            if (!parents[parentId]) {
                parents[parentId] = [];
            }
            parents[parentId].push(node);
        }
    }

    //Attach nodes to parents
    for (const nodeId in treeNodes) {
        const node = treeNodes[nodeId];
        if (parents[nodeId]) {
            node.children = parents[nodeId];
        }
        if (node[parentKey] == null) {
            rootNode.children.push(node);
        }
    }

    //Sort children by order
    function sortChildrenRecursive(node) {
        if (!node.children) return;
        node.children.sort((a, b) => a.order - b.order);
        for (const child of node.children) {
            sortChildrenRecursive(child);
        }
    }
    sortChildrenRecursive(rootNode);

    //Clean up order properties
    function cleanOrderProperties(node) {
        delete node.order;
        for (const child of node.children) {
            cleanOrderProperties(child);
        }
    }
    cleanOrderProperties(rootNode);
    return rootNode;
}
