// Component, but specific to this page so ive left it inside the flashcard tree folder
// Main responsiblity here is to bring the generated tree into frame, and then create SVG representations
import { useEffect, useRef } from "react";
import {
    createFlashcardTreeFromData,
    NODE_TYPE,
} from "../simulation/flashcardTree.mjs";
import { simulateFlashcardTree } from "../simulation/flashcardTreeSim.mjs";
import { TreeFocusHandler } from "./treeFocusHandler.mjs";

class Frame {
    //Helper class to project from the tree's coordinate space to the screen coordinate space
    constructor() {
        this.contentCenter = { x: 0, y: 0 };
        this.contentZoom = 1;
    }


    project(point) {
        return {
            x: (point.x - this.contentCenter.x) * this.contentZoom,
            y: (point.y - this.contentCenter.y) * this.contentZoom,
        };
    }

    scale(length) {
        return length * this.contentZoom;
    }

    cover(minPoint, maxPoint) {
        //Adjust the frame to cover the given bounding box
        const contentWidth = maxPoint.x - minPoint.x;
        const contentHeight = maxPoint.y - minPoint.y;
        const zoomX = 2 / (contentWidth * 1.1); //Add some padding
        const zoomY = 2 / (contentHeight * 1.1);
        this.contentZoom = Math.min(zoomX, zoomY);
        this.contentCenter = {
            x: (minPoint.x + maxPoint.x) / 2,
            y: (minPoint.y + maxPoint.y) / 2,
        };
    }
}

function Grass() {
    //Basically just an oval centered at 0, 0.75, with radius 20 on x and 0.1 on y, and fills in below fully
    //Just draw the top with an arc
    return (
        <path
            d={
                "M -10 0.75 " + //Start
                "A 20 0.1 0 0 1 10 0.75 "+ //Arc to the right
                "L 20 20 "+ //Line down a bit
                "L -20 20 "+ //Line back across
                "Z" //Close path
            }
            fill="#66bf13"
        />
    );
}

export function FlashcardTreeView({ pageTree, flashcards }) {
    const treeRoot = createFlashcardTreeFromData(pageTree, flashcards);
    const panningContainer = useRef(null);
    simulateFlashcardTree(treeRoot);
    console.log(treeRoot); //For debugging, should show a tree with position data that is reasonably spaced out

    const frame = new Frame();
    frame.cover(...treeRoot.getMinMaxPositions());

    var panhandler = null;

    useEffect(() => {
        panhandler = new TreeFocusHandler(panningContainer);
        panhandler.bind();
        return () => {
            panhandler.unbind();
        }
    }, [panningContainer]);

    return (
        <div>
            <h2>Flashcard Learning Tree</h2>
            <div ref={panningContainer}>
                <svg
                    viewBox="-5 -5 10 10"
                    style={{ maxHeight: "80vh", maxWidth: "80vw", transform: "scale(3)" }}
                >
                    <Grass />

                    {treeRoot.collect((node) => {
                        const projectedPosition = frame.project(node.position);

                        //Render circle (width = node width) for node, render tapered path for connections (startwidth = parent width, endwidth = node width)

                        return (
                            <g key={node.simulationId}>
                                <circle
                                    cx={projectedPosition.x}
                                    cy={projectedPosition.y}
                                    r={frame.scale(node.getRenderedWidth())}
                                    fill={
                                        node.type == NODE_TYPE.Flashcard
                                            ? "#66bf13"
                                            : "#bf6113"
                                    }
                                />
                                {node.connections.map((connectedNode) => {
                                    //Path taper code taken from stack overflow (See diagram below code paste for explanation)
                                    const projectedConnectedPosition =
                                        frame.project(connectedNode.position);
                                    const angle = Math.atan2(
                                        projectedConnectedPosition.y -
                                            projectedPosition.y,
                                        projectedConnectedPosition.x -
                                            projectedPosition.x,
                                    );
                                    const perpendicularAngle =
                                        angle + Math.PI / 2;
                                    const startWidth = frame.scale(node.width);
                                    const endWidth = frame.scale(
                                        connectedNode.width,
                                    );
                                    const pathData = `M ${projectedPosition.x + Math.cos(perpendicularAngle) * startWidth} ${projectedPosition.y + Math.sin(perpendicularAngle) * startWidth}
                                L ${projectedConnectedPosition.x + Math.cos(perpendicularAngle) * endWidth} ${projectedConnectedPosition.y + Math.sin(perpendicularAngle) * endWidth}
                                L ${projectedConnectedPosition.x - Math.cos(perpendicularAngle) * endWidth} ${projectedConnectedPosition.y - Math.sin(perpendicularAngle) * endWidth}
                                L ${projectedPosition.x - Math.cos(perpendicularAngle) * startWidth} ${projectedPosition.y - Math.sin(perpendicularAngle) * startWidth}
                                Z`;
                                    return (
                                        <path
                                            key={connectedNode.simulationId}
                                            d={pathData}
                                            fill="#bf6113"
                                        />
                                    );
                                })}
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
}
