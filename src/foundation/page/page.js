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
        
    }

    getTargetableContainers() {
        this.revalidateSubcontainers();
        return [
            this.primaryContainerRef.current,
            ...(this.subcontainers.filter((c) => c.canTarget()).map((c) => c.ref.current))
        ]
    }

}