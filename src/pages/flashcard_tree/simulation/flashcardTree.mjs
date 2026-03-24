const MAX_FAN_OUT = 3;

export const NODE_TYPE = { //Type is just used for color, but TODO convert to class inheritance at some point
    Flashcard: 0,
    FlashcardsOfPage: 1,
    SplitTransition: 2, //Transitionary node type, no tooltip just there to space things out
    Page: 3,
    Notebook: 4,
};

export class TreeNode {
    constructor(type, tooltip = null) {
        this.type = type;
        //Tooltip is optional except for root, as tooltip should just resolve to the next node up in the tree with a tooltip
        // Which means split nodes will just take the tooltip of their parent
        this.tooltip = tooltip;
        this.connectionLength = 1; //Connection length is initialised later for simplicity, but a factor can be applied ahead of time
        this.width = 0; //Late init again
        this.connections = [];

        this.position = { x: 0, y: 0 };
        //Store the last position for verlet integration
        this.previousPosition = { x: 0, y: 0 };
        this.simulationId = crypto.randomUUID(); //Ahead of time, create a unique id for reference in simulation

        this.flashcardLinkId = null; //Only for flashcard nodes, they may link the original ID for reference
    }

    getRenderedWidth() {
        if (this.type === NODE_TYPE.Flashcard) {
            return this.width * 12;
        }
        return this.width;
    }

    getMinMaxPositions() { //Get the min and max positions of this node and all subnodes, for framing purposes
        let minPoint = { x: this.position.x, y: this.position.y };
        let maxPoint = { x: this.position.x, y: this.position.y };
        this.itterate((node) => {
            minPoint.x = Math.min(minPoint.x, node.position.x);
            minPoint.y = Math.min(minPoint.y, node.position.y);
            maxPoint.x = Math.max(maxPoint.x, node.position.x);
            maxPoint.y = Math.max(maxPoint.y, node.position.y);
        });
        return [minPoint, maxPoint];
    }

    assignConnectionLength(depthScale) {
        this.connectionLength *= 0.5 - depthScale * 0.3;
    }

    assignWidth(depthScale) { //Depth from 0 to 1 where 1 is the max depth of all subnodes (so long depth distributes width as you go on)
        this.width = 0.05 - (depthScale * 0.045);
    }

    //Recursive method, itterates post order with depth and depth scale,
    //Returns the max depth for internal use
    itterateWithDepthInfo(callback, currentDepth = 0) {
        if (this.connections.length === 0) {
            callback(this, currentDepth, 1);
            return currentDepth;
        }
        const maxDepth = Math.max(...this.connections.map((node) => node.itterateWithDepthInfo(callback, currentDepth + 1)));
        const depthScale = currentDepth / maxDepth;
        callback(this, currentDepth, depthScale);
        return maxDepth;
    }

    //Itterate normally in pre order
    itterate(callback) {
        callback(this);
        this.connections.forEach((node) => node.itterate(callback));
    }

    //Collect is the same as itterate but it appends the results to a final array
    collect(callback) {
        let results = [];
        this.itterate((node) => {
            const result = callback(node);
            if (result != null) {
                results.push(result);
            }
        });
        return results;
    }
}

//Takes a list of nodes and ensures they are all within max fan out (which is 1 less than degree cause we dont count the parent connection)
function createSplitSubnodes(children, lengthFactor = 1) {
    if (children.length <= MAX_FAN_OUT) {
        return children;
    }

    const splitPos = Math.floor(children.length / 2);

    const leftChildren = children.slice(0, splitPos);
    const leftNode = new TreeNode(NODE_TYPE.SplitTransition);
    leftNode.connectionLength = lengthFactor;
    leftNode.connections = createSplitSubnodes(leftChildren, lengthFactor * 0.7);

    const rightChildren = children.slice(splitPos);
    const rightNode = new TreeNode(NODE_TYPE.SplitTransition);
    rightNode.connectionLength = lengthFactor;
    rightNode.connections = createSplitSubnodes(rightChildren, lengthFactor * 0.7);

    return [leftNode, rightNode];
}

//Turn a flashcard object into a tooltip string, giving a rough preview (should possibly do a full preview on the side)
function getTooltipOfFlashcard(flashcard) {
    return (flashcard.frontCanvasDocumentData ? "[Cavas] " : "") + (flashcard.frontImageResourceId ? "[Image] " : "") + flashcard.frontText + "\n" +
    " | " + (flashcard.backCanvasDocumentData ? "[Cavas] " : "") + (flashcard.backImageResourceId ? "[Image] " : "") + flashcard.backText;
}

//First step, create the tree with no geometric data to start
//Specific rules of the algorithm (as per design section):
// 1. Notebook is the root node, all nodes are parents of root
// 2. Each node can only ever have a maximum fan out of 3, any more requires calls to createSplitSubnodes() 
//      (just call it always it is safe to no-op by itself), it just returns the max-degree safe list of children to use
function createTreeTopologyFromData(pageTree, flashcards) {
    const pageIdToNode = {};
    const pageIdToFlashcardNode = {};
    const pageIdToFlashcards = {};

    //First the flashcards are added, respecting split subnodes especially since there may be many flashcards per page
    for (const flashcard of flashcards) {
        pageIdToFlashcards[flashcard.pageId] = pageIdToFlashcards[flashcard.pageId] || [];
        pageIdToFlashcards[flashcard.pageId].push(flashcard);
    }

    for (const pageId in pageIdToFlashcards) {
        const pageFlashcards = pageIdToFlashcards[pageId];
        const flashcardListNode = new TreeNode(NODE_TYPE.FlashcardsOfPage);
        pageIdToFlashcardNode[pageId] = flashcardListNode;

        const flashcardNodes = [];

        for (const flashcard of pageFlashcards) {
            const flashcardNode = new TreeNode(NODE_TYPE.Flashcard, getTooltipOfFlashcard(flashcard));
            flashcardNode.flashcardLinkId = flashcard.flashcardLinkId;
            flashcardNodes.push(flashcardNode);
        }

        flashcardListNode.connections = createSplitSubnodes(flashcardNodes);
    }

    function createNodesForPageTree(pageNode) {
        const node = new TreeNode(NODE_TYPE.Page, pageNode.name);
        pageIdToNode[pageNode.pageId] = node;
        const nodeChildren = pageNode.children.map(createNodesForPageTree);
        
        if (pageIdToFlashcardNode[pageNode.pageId]) {
            nodeChildren.push(pageIdToFlashcardNode[pageNode.pageId]);
        }
        
        node.connections = createSplitSubnodes(nodeChildren);
        return node;
    }

    //First, create the node representation of the pageTree, while noting the nodes in order to add in flashcards later
    const notebookNode = new TreeNode(NODE_TYPE.Notebook, "Notebook");
    const treeStartNode = new TreeNode(NODE_TYPE.SplitTransition, pageTree.name);
    notebookNode.connections.push(treeStartNode);

    treeStartNode.connections = createSplitSubnodes(pageTree.children.map(createNodesForPageTree));

    return notebookNode;
}

function assignTreeGeometricProperties(rootNode) {
    rootNode.itterateWithDepthInfo((node, depth, depthScale) => {
        node.assignConnectionLength(depthScale);
        node.assignWidth(depthScale);
    });
}

//Geometry assignment rules (which is where most of the algorithm came from):
// 1. Setup widths and lengths first
// 2. Positions depend on angles, angles are evenly distributed on an arc (135 degrees centered by the previous angle)
function assignInitialTreeGeometry(rootNode) {
    assignTreeGeometricProperties(rootNode);

    function assignPositions(node, parentAngle = -90) {
        const angleSpread = 135;
        const degree = node.connections.length + 1;
        
        node.connections.forEach((childNode, index) => {
            const angle = (angleSpread / degree) * (index + 1) + (parentAngle - angleSpread / 2);
            const angleRad = angle * (Math.PI / 180);
            
            childNode.position.x = node.position.x + Math.cos(angleRad) * childNode.connectionLength;
            childNode.position.y = node.position.y + Math.sin(angleRad) * childNode.connectionLength;

            //Also set previous position
            childNode.previousPosition.x = childNode.position.x;
            childNode.previousPosition.y = childNode.position.y;
            
            assignPositions(childNode, angle);
        });
    }

    assignPositions(rootNode, -90); //Start going up
}

//Finally, compose it all together
export function createFlashcardTreeFromData(pageTree, flashcards) {
    const rootNode = createTreeTopologyFromData(pageTree, flashcards);
    assignInitialTreeGeometry(rootNode);
    return rootNode;
}