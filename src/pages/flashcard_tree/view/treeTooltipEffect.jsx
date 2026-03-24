import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";

export function createTooltipEffect(svgRef, treeRoot, parentMap) {
    if (!svgRef.current) return;

    const instances = {};

    // Create tippy instances only on nodes that own their tooltip
    treeRoot.itterate((node) => {
        if (node.tooltip === null) return;
        const element = svgRef.current.querySelector(
            //Save setting up refs, realised its much easier to use queries with data
            //Theres only a single treeview ever so this is safe
            `circle[data-node-id="${node.simulationId}"]`,
        );
        if (!element) return;
        instances[node.simulationId] = tippy(element, {
            content: node.tooltip,
            trigger: "mouseenter focus",
            hideOnClick: false,
            theme: "light-border",
            placement: "right",
        });
    });

    // Walk up the parent chain to find the nearest ancestor with a tippy instance
    function resolveInstance(node) {
        let current = node;
        while (current) {
            if (instances[current.simulationId])
                return instances[current.simulationId];
            current = parentMap[current.simulationId];
        }
        return null;
    }

    const cleanups = [];

    // For nodes without their own tooltip, wire their circle to the ancestor's tippy
    treeRoot.itterate((node) => {
        if (node.tooltip !== null) return; // already has its own tippy
        const el = svgRef.current.querySelector(
            `circle[data-node-id="${node.simulationId}"]`,
        );
        if (!el) return;
        const instance = resolveInstance(node);
        if (!instance) return;

        const onEnter = () => instance.show();
        const onLeave = () => instance.hide();
        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);
        cleanups.push(() => {
            el.removeEventListener("mouseenter", onEnter);
            el.removeEventListener("mouseleave", onLeave);
        });
    });

    // For each connection path, show the parent node's tippy on hover
    treeRoot.itterate((node) => {
        node.connections.forEach((child) => {
            const connectionElement = svgRef.current.querySelector(
                `line[data-conn-parent-id="${node.simulationId}"][data-conn-child-id="${child.simulationId}"]`,
            );
            if (!connectionElement) return;

            const instance = resolveInstance(node);
            if (!instance) return;

            const onEnter = () => instance.show();
            const onLeave = () => instance.hide();
            connectionElement.addEventListener("mouseenter", onEnter);
            connectionElement.addEventListener("mouseleave", onLeave);
            cleanups.push(() => {
                connectionElement.removeEventListener("mouseenter", onEnter);
                connectionElement.removeEventListener("mouseleave", onLeave);
            });
        });
    });

    return () => {
        Object.values(instances).forEach((instance) => instance.destroy());
        cleanups.forEach((fn) => fn());
    };
}
