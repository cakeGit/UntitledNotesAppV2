import { ActivePage } from "./activePage.mjs";

const currentPageEditor = new ActivePage(
    {
        children: [
            {
                blockId: "textboxid",
                children: [
                    {
                        blockId: "textboxid2",
                    },
                ],
            },
        ],
    },
    {
        textboxid: {
            type: "textbox",
            textContent: "hey",
        },
        textboxid2: {
            type: "textbox",
            textContent: "hooo",
        },
    }
);

export function addPageEditorRouterEndpoint(app) {
    app.ws("/page_editor", (ws, req) => {
        console.log("New WebSocket connection to /page_editor");

        currentPageEditor.connectClient(ws);
    });
}
