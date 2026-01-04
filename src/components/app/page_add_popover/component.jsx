import { useEffect, useRef } from "react";
import "./style.css";
import { renderToStaticMarkup } from "react-dom/server";
import { BLOCK_REGISTRY } from "../../../foundation/page/blockRegistry";

export function PageAddBlockPopover({ pageRef }) {
    const resultsRef = useRef(null);
    const selectedAddBlock = useRef(null);
    const pageModalRef = useRef(null);

    const adjacentBlockIdRef = useRef(null);

    const onType = (e) => {
        const value = e.target.value;
        let results = [];

        if (value.length === 0) {
            resultsRef.current.innerHTML = "";
            return;
        }

        for (const blockType in BLOCK_REGISTRY) {
            const blockDef = BLOCK_REGISTRY[blockType];
            let score = 0;

            if (blockDef.name.toLowerCase().includes(value.toLowerCase())) {
                score += 10;
            }

            if (blockDef.description.toLowerCase().includes(value.toLowerCase())) {
                score += 5;
            }

            if (score > 0) {
                results.push({ blockType, score });
            }
        }

        let first = true;
        results = results
            .sort((a, b) => b.score - a.score);

        resultsRef.current.innerHTML = results
            .map(({ blockType }) => {
                let wasFirst = first;
                first = false;
                return renderToStaticMarkup(<div className={wasFirst ? "selected_add_block" : ""}>
                    {BLOCK_REGISTRY[blockType].name}&nbsp;
                    <span className='add_block_description'>{BLOCK_REGISTRY[blockType].description}</span>
                </div>);
            })
            .join("");
        
        selectedAddBlock.current = results.length > 0 ? results[0].blockType : null;
    };

    const onSubmit = (e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        if (!selectedAddBlock.current) return;

        let newBlockId = pageRef.current.addNewBlock(
            selectedAddBlock.current,
            adjacentBlockIdRef.current,
            selectedAddBlock.current in BLOCK_REGISTRY ? BLOCK_REGISTRY[selectedAddBlock.current].defaultData : {}
        );
        pageRef.current.triggerStructureRerender();
        pageRef.current.sendNewBlock(adjacentBlockIdRef.current, newBlockId);
        pageModalRef.current.style.display = "none";    
    };

    useEffect(() => {
        if (!pageRef.current) return;

        pageRef.current.openAddBlockPopover = (adjacentBlockId, blockRef) => {
            pageModalRef.current.style.display = "block";
            
            const rect = blockRef.current.getBoundingClientRect();
            pageModalRef.current.style.top = `${rect.bottom + window.scrollY}px`;
            pageModalRef.current.style.left = `${rect.left + window.scrollX}px`;

            adjacentBlockIdRef.current = adjacentBlockId;
        }
    }, [pageRef]);

    return <div style={{display: "none", position: "absolute"}} ref={pageModalRef}>
        <input placeholder="Type the name of the block to insert, enter to confirm" onChange={onType} onKeyDown={onSubmit}/>
        <div ref={resultsRef}>
        </div>
    </div>
}