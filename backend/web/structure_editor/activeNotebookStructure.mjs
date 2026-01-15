export class ActiveNotebookStructure {
    constructor(notebookId, structure) {
        this.notebookId = notebookId;
        this.structure = structure;
        this.connectedClients = [];
    }

    movePage(pageId, newParentId, newIndex) {
        if (pageId === newParentId) {
            throw new RequestError("Cannot move a page into itself: " + pageId);
        }

        // Find and remove the page from its current location
        let pageToMove = null;
        function removePage(pages, pageId) {
            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                if (page.pageId === pageId) {
                    pageToMove = pages.splice(i, 1)[0];
                    return true;
                }
                if (page.children) {
                    if (removePage(page.children, pageId)) {
                        return true;
                    }
                }
            }
            return false;
        }

        removePage(this.structure.children, pageId);

        if (!pageToMove) {
            throw new RequestError("Page to move not found: " + pageId);
        }

        // Find the new parent and insert the page
        function insertPage(pages, parentId, pageToInsert, index) {
            if (parentId == null) {
                pages.splice(index, 0, pageToInsert);
                return true;
            }
            for (const page of pages) {
                if (page.pageId === parentId) {
                    if (!page.children) {
                        page.children = [];
                    }
                    page.children.splice(index, 0, pageToInsert);
                    return true;
                }
                if (page.children) {
                    if (insertPage(page.children, parentId, pageToInsert, index)) {
                        return true;
                    }
                }
            }
            return false;
        }
        insertPage(this.structure.children, newParentId, pageToMove, newIndex);
    }

    async handleClientMessage(ws, message) {
        if (message.type === "move_page") {
            const { pageId, newParentId, newIndex } = message;
            this.movePage(pageId, newParentId, newIndex);
            this.broadcastCurrentStructure();
            this.serializeCurrentStructure();
        } else if (message.type === "request_new_page") {
            // For simplicity, just add a new page at the root
            const pageId = generateRandomUUID();
            const newPageMeta = {
                pageId: pageId,
                name: "New Page",
                notebookId: this.notebookId,
            };
            await dbInterface.sendRequest("write_page_data", {
                metadata: newPageMeta,
                structure: { children: [] },
                content: {},
            });
            this.structure.children.push({
                pageId: pageId,
                name: newPageMeta.name,
                children: [],
            });
            this.broadcastCurrentStructure();
        } else {
            throw new RequestError("Unknown message type: " + message.type);
        }
    }

    async serializeCurrentStructure() {
        const structure = destructureTree(this.structure, "pageId");
        await dbInterface.sendRequest("notebook/update_page_structure", {
            structure,
        });
    }

    broadcastCurrentStructure() {
        const message = {
            type: "notebook_structure",
            structure: this.structure,
        };
        const messageString = JSON.stringify(message);
        this.connectedClients.forEach((client) => {
            client.send(messageString);
        });
    }

    connectClient(ws) {
        this.connectedClients.push(ws);

        ws.send(
            JSON.stringify({
                type: "notebook_structure",
                structure: this.structure,
            })
        );

        ws.on("message", async (message) => {
            const parsedMessage = JSON.parse(message);
            try {
                await this.handleClientMessage(ws, parsedMessage);
            } catch (error) {
                logEditor(
                    "Error handling message from structure editor client: " +
                        error.message
                );
                console.error(error);
                ws.send(
                    JSON.stringify({
                        type: "invalid_close_connection",
                        message: error.message,
                    })
                );
            }
        });

        ws.on("close", () => {
            this.connectedClients = this.connectedClients.filter(
                (client) => client !== ws
            );
        });
    }
}