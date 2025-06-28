export class Page {
    constructor(
        structureJSON,
        contentJSON
    ) {
        this.structure = structureJSON;
        this.content = contentJSON;
        this.primaryContainerRef = null;
        this.subcontainers = [];
    }

    addTargetableSubcomponentContainer(subcontainer) {
        this.subcontainers.push(subcontainer);
    }

    revalidateSubcontainers() {
        this.subcontainers = this.subcontainers.filter((container, index) => {
            if (!container.ref || !container.ref.current) return false;
            return this.subcontainers.findIndex(c => c.ref && c.ref.current === container.ref.current) === index;
        });
    }

    getTargetableContainers() {
        this.revalidateSubcontainers();
        return [
            this.primaryContainerRef.current,
            ...(this.subcontainers.filter((c) => c.canTarget()).map((c) => c.ref.current))
        ]
    }

}