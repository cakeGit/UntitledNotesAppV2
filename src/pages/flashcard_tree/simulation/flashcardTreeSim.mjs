import { NODE_TYPE } from "./flashcardTree.mjs";
import { Vec } from "./vecHelper.mjs";

const MAX_VELOCITY = 0.1;
const DAMPING = 0.1;
const UPWARD_PULL = -0.02;
const SPRING_STRENGTH = 0.1;
const REPULSION_BASE = 0.01;
const REPULSION_SCALE = { x: 1.5, y: 0.7 };

function stepSimulation(rootNode) {
    const velocityById = {};
    let nodeCount = 0;

    rootNode.itterate((node) => {
        velocityById[node.simulationId] = Vec.sub(
            node.position,
            node.previousPosition,
        );
        nodeCount++;
    });

    rootNode.itterateWithDepthInfo((node, depth, depthScale) => {
        // Pull harder on the higher branches to stretch the tree up, but, multiply this by 1 - dot (dir to parent, up)
        // This means nodes going up dont get pulled up, helps to balance the tree out to prevent sections being too compressed
        for (const connection of node.connections) {
            const dirToParent = Vec.sub(connection.position, node.position);
            const dot = Vec.dotNorm(dirToParent, { x: 0, y: -1 });
            const upwardFactor = 1 - dot;

            const basePullY = UPWARD_PULL * upwardFactor * (1 - depthScale);
            const pullY = connection.type === NODE_TYPE.Flashcard ? basePullY * 3 : basePullY;

            velocityById[connection.simulationId].y += pullY;
        }
    });

    rootNode.itterate((node) => {
        function isConnected(node1, node2) {
            return (
                node1.connections.includes(node2) ||
                node2.connections.includes(node1)
            );
        }
        function getConnectionLength(node1, node2) {
            return node1.connections.includes(node2)
                ? node1.connectionLength
                : node2.connectionLength;
        }

        rootNode.itterate((otherNode) => {
            if (node === otherNode) return;

            const distance = Vec.dist(node.position, otherNode.position);

            if (distance === 0) {
                // Nudge apart to prevent physics errors on overlap
                velocityById[node.simulationId].x +=
                    (Math.random() - 0.5) * 0.01;
                return;
            }

            const dPos = Vec.sub(otherNode.position, node.position);

            if (isConnected(node, otherNode)) {
                // Spring force
                const connectionLength = getConnectionLength(node, otherNode);
                const forceMag =
                    SPRING_STRENGTH * (distance - connectionLength);

                velocityById[node.simulationId] = Vec.add(
                    velocityById[node.simulationId],
                    Vec.scale(dPos, forceMag / distance),
                );
            } else {
                // Repel force (using distance squared for smoother push)
                let repStrength = REPULSION_BASE / nodeCount;

                velocityById[node.simulationId] = Vec.add(
                    velocityById[node.simulationId],
                    Vec.mul(
                        Vec.scale(
                            Vec.sub(node.position, otherNode.position),
                            repStrength,
                        ),
                        REPULSION_SCALE,
                    ),
                );
            }
        });
    });

    rootNode.itterate((node) => {
        if (node == rootNode) return; // Keep root locked

        let velocity = Vec.scale(velocityById[node.simulationId], DAMPING);
        velocity = Vec.clamp(velocity, MAX_VELOCITY);

        const newPosition = Vec.add(node.position, velocity);

        node.previousPosition = { ...node.position };
        node.position = newPosition;
    });
}

export function simulateFlashcardTree(rootNode) {
    for (let i = 0; i < 100; i++) {
        stepSimulation(rootNode);
    }
}
