// Component, but specific to this page so ive left it inside the flashcard tree folder
// Main responsiblity here is to bring the generated tree into frame, and then create SVG representations
import { use, useEffect, useRef } from "react";
import {
    createFlashcardTreeFromData,
    NODE_TYPE,
} from "../simulation/flashcardTree.mjs";
import { simulateFlashcardTree } from "../simulation/flashcardTreeSim.mjs";
import { TreeFocusHandler } from "./treeFocusHandler.mjs";
import "tippy.js/themes/light-border.css";
import { getFlashcardPriority } from "../../flashcard_session/flashcardBundler.mjs";
import { HSL } from "./hsl.mjs";
import { createTooltipEffect } from "./treeTooltipEffect";
import { PageCenterContent } from "../../../components/layout/pageCenterContent/component";
import { AppLineBreak } from "../../../components/app/line_break/component";
import { FlashcardTreeSidebar } from "./treeSidebar";
import { Link } from "react-router-dom";

const GREEN_LEAF_HSL = HSL.fromCode("hsl(87, 100%, 52%)");
const RED_LEAF_HSL = HSL.fromCode("hsl(27, 90.1%, 62.5%)");
const UNLEARNED_LEAF_HSL = HSL.fromCode("hsl(90, 72%, 78%)62.5%)");

const UNLEARNED_LEAF_SIZE = 0.25;
const LEARNED_LEAF_SCALE = 0.5; //How much + or - the size of the leaf is based on learning state

const LEARNED_THRESHOLD = 0.9; //Max priority a leaf can have, below is clamped
const UNLEARNED_THRESHOLD = 1.5; //Min priority a leaf can have, above is clamped

function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}

function getLearningProgress(priority) {
    //If the leaf has a priority get the learning progress (learned = 1, unlearned = 0)
    return (
        1 -
        clamp(
            (priority - LEARNED_THRESHOLD) /
                (UNLEARNED_THRESHOLD - LEARNED_THRESHOLD),
            0,
            1,
        )
    );
}

function buildParentMap(root) {
    const map = {}; // child simulationId -> parent TreeNode
    root.itterate((node) => {
        node.connections.forEach((child) => {
            map[child.simulationId] = node;
        });
    });
    return map;
}

class Frame {
    //Helper class to project from the tree's coordinate space to the screen coordinate space
    constructor() {
        this.contentCenter = { x: 0, y: 0 };
        this.contentZoom = 1;
    }

    project(point) {
        return {
            x: (point.x - this.contentCenter.x) * this.contentZoom - 1 / 2, //Apply a bias to left to align better with the sidebar
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

//Record of what the leaf should look like when the learning history is applied ontop
class LeafState {
    constructor(flashcard) {
        var priority = getFlashcardPriority(flashcard); //Use priority calculation as a base
        var unlearned = flashcard.lastLearnedTime === undefined;

        if (unlearned) {
            this.color = UNLEARNED_LEAF_HSL;
            this.size = UNLEARNED_LEAF_SIZE;
        } else {
            const learningProgress = getLearningProgress(priority);
            this.color = RED_LEAF_HSL.lerp(GREEN_LEAF_HSL, learningProgress);

            var minSize = 1 - LEARNED_LEAF_SCALE;
            var maxSize = 1 + LEARNED_LEAF_SCALE;
            this.size =
                minSize * (1 - learningProgress) + maxSize * learningProgress;
        }
    }

    scaleWidth(baseWidth) {
        return baseWidth * this.size;
    }

    getColorCode() {
        return this.color.getCode();
    }
}

function Grass() {
    //Basically just an oval centered at 0, 0.75, with radius 20 on x and 0.1 on y, and fills in below fully
    //Just draw the top with an arc
    return (
        <path
            d={
                "M -10 0.5 " + //Start
                "A 20 0.1 0 0 1 10 0.5 " + //Arc to the right
                "L 20 20 " + //Line down a bit
                "L -20 20 " + //Line back across
                "Z" //Close path
            }
            fill="#70d617"
        />
    );
}

export function FlashcardTreeView({ pageTree, flashcards }) {
    const panningContainer = useRef(null);
    const svgRef = useRef(null);
    const setFlashcardOnSidebarRef = useRef(null);

    const treeRoot = createFlashcardTreeFromData(pageTree, flashcards);
    simulateFlashcardTree(treeRoot);

    const flashcardsByLinkId = {};
    for (const flashcard of flashcards) {
        flashcardsByLinkId[flashcard.flashcardLinkId] = flashcard;
    }

    const parentMap = buildParentMap(treeRoot);

    const frame = new Frame();
    frame.cover(...treeRoot.getMinMaxPositions());

    useEffect(() => {
        const panning = new TreeFocusHandler(panningContainer);
        panning.bind();
        return () => panning.unbind();
    }, [panningContainer]);

    useEffect(
        () => createTooltipEffect(svgRef, treeRoot, parentMap),
        [parentMap],
    );

    return (
        <PageCenterContent>
            <h1>Flashcard Learning Tree <Link to={"/"}>(Return to app)</Link></h1>

            <AppLineBreak />

            <FlashcardTreeSidebar
                flashcardsByLinkId={flashcardsByLinkId}
                updateRef={setFlashcardOnSidebarRef}
            />

            <div
                style={{
                    position: "relative",
                    width: "100%",
                    overflow: "hidden",
                    border: "3px solid var(--color-soft-border)",
                    borderRadius: "8px",
                }}
            >
                <div
                    ref={panningContainer}
                    style={{ width: "100%", height: "100%" }}
                >
                    <svg
                        ref={svgRef}
                        viewBox="-5 -5 10 10"
                        style={{
                            maxHeight: "80vh",
                            maxWidth: "80vw",
                        }}
                    >
                        <Grass />

                        {treeRoot.collect((node) => {
                            const projectedPosition = frame.project(
                                node.position,
                            );

                            const leafState =
                                node.type === NODE_TYPE.Flashcard
                                    ? new LeafState(
                                          flashcardsByLinkId[
                                              node.flashcardLinkId
                                          ],
                                      )
                                    : null;

                            var width = frame.scale(node.getRenderedWidth());
                            var circleRadius = leafState
                                ? leafState.scaleWidth(width)
                                : width;

                            function onClick(e) {
                                e.stopPropagation(); //Prevent clicks from going to the connections behind the node
                                if (node.type === NODE_TYPE.Flashcard) {
                                    setFlashcardOnSidebarRef.current(
                                        node.flashcardLinkId,
                                    );
                                }
                            }

                            //Render circle (width = node width) for node, render tapered path for connections (startwidth = parent width, endwidth = node width)
                            return (
                                <g key={node.simulationId}>
                                    <circle
                                        cx={projectedPosition.x}
                                        cy={projectedPosition.y}
                                        r={circleRadius}
                                        fill={
                                            leafState !== null
                                                ? leafState.getColorCode()
                                                : "#bf6113"
                                        }
                                    />
                                    {/* Transparent hit area — larger radius for easier hovering */}
                                    <circle
                                        data-node-id={node.simulationId}
                                        cx={projectedPosition.x}
                                        cy={projectedPosition.y}
                                        r={circleRadius}
                                        onClick={onClick}
                                        fill="transparent"
                                        style={{
                                            cursor: "pointer",
                                            outline: "none",
                                        }}
                                    />
                                    {node.connections.map((connectedNode) => {
                                        //Path taper code taken from stack overflow (See diagram below code paste for explanation)
                                        const projectedConnectedPosition =
                                            frame.project(
                                                connectedNode.position,
                                            );
                                        const angle = Math.atan2(
                                            projectedConnectedPosition.y -
                                                projectedPosition.y,
                                            projectedConnectedPosition.x -
                                                projectedPosition.x,
                                        );
                                        const perpendicularAngle =
                                            angle + Math.PI / 2;
                                        const startWidth = frame.scale(
                                            node.width,
                                        );
                                        const endWidth = frame.scale(
                                            connectedNode.width,
                                        );
                                        const pathData = `M ${projectedPosition.x + Math.cos(perpendicularAngle) * startWidth} ${projectedPosition.y + Math.sin(perpendicularAngle) * startWidth}
                                L ${projectedConnectedPosition.x + Math.cos(perpendicularAngle) * endWidth} ${projectedConnectedPosition.y + Math.sin(perpendicularAngle) * endWidth}
                                L ${projectedConnectedPosition.x - Math.cos(perpendicularAngle) * endWidth} ${projectedConnectedPosition.y - Math.sin(perpendicularAngle) * endWidth}
                                L ${projectedPosition.x - Math.cos(perpendicularAngle) * startWidth} ${projectedPosition.y - Math.sin(perpendicularAngle) * startWidth}
                                Z`;
                                        return (
                                            <g key={connectedNode.simulationId}>
                                                <path
                                                    d={pathData}
                                                    fill="#bf6113"
                                                />
                                                {/* Transparent thick centerline hit area */}
                                                <line
                                                    data-conn-parent-id={
                                                        node.simulationId
                                                    }
                                                    data-conn-child-id={
                                                        connectedNode.simulationId
                                                    }
                                                    x1={projectedPosition.x}
                                                    y1={projectedPosition.y}
                                                    x2={
                                                        projectedConnectedPosition.x
                                                    }
                                                    y2={
                                                        projectedConnectedPosition.y
                                                    }
                                                    stroke="transparent"
                                                    strokeWidth={
                                                        frame.scale(
                                                            node.width,
                                                        ) * 8
                                                    }
                                                    strokeLinecap="round"
                                                    style={{
                                                        cursor: "pointer",
                                                    }}
                                                />
                                            </g>
                                        );
                                    })}
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>
        </PageCenterContent>
    );
}
