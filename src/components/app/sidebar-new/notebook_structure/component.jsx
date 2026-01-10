import { useEffect, useRef } from "react";
import { ALL_FIELDS_PRESENT } from "../../../../../backend/web/foundation_safe/validations.js";

function handleStructureEditorMessage(message) {
    switch (message.type) {
        case "notebook_structure":
            const structure = message.structure;
            ALL_FIELDS_PRESENT.test({ structure }).throwErrorIfInvalid();
            //Render the notebook structure in the UI
            console.log("Received notebook structure:", structure);
            break;
        default:
            console.warn("Unknown message type from structure editor:", message.type);
    }
}

export function NotebookStructureView({ notebookId }) {
    let notebookStructureContainerRef = useRef(null);

    //Open a websocket connection to the structure editor for this notebook
    useEffect(() => {
        const ws = new WebSocket(
            `ws://${window.location.host}/structure_editor?notebookId=${notebookId}`
        );

        ws.onopen = () => {
            console.log("Connected to notebook structure editor WebSocket");
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log("Received message:", message);
            try {
                handleStructureEditorMessage(message);
            } catch (error) {
                console.error(
                    "Error handling message from structure editor:",
                    error
                );
            }
        };

        notebookStructureContainerRef.current.ws = ws;

        return () => {
            ws.close();
        };
    }, [notebookId]);

    return (
        <div
            ref={notebookStructureContainerRef}
            className="notebookStructureView"
        >
            {/* Notebook structure rendering logic goes here */}
        </div>
    );
}
