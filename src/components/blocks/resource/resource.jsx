import { useState } from "react";
import "./resource.css";
import { UrlInputModal } from "../assignment/inner_modals/urlInputModal.jsx";
import { useModal } from "../../../foundation/modals/genericModal.jsx";
import { FaExternalLinkAlt, FaLink } from "react-icons/fa";
import { FaPencil } from "react-icons/fa6";

function getDomainBreakdown(urlString) {
    try {
        const url = new URL(urlString); //Use URL library to help break down the URL without needing to hard code parsing
        return {
            protocol: url.protocol + "//",
            domain: url.hostname,
            path: url.pathname,
        };
    } catch {
        return urlString;
    }
}

export function PageResourceBlock({ blockId, data, pageRef, blockRef }) {
    const modalHook = useModal();
    const [url, setUrl] = useState(data.resourceLinkText);

    function openUrlModal(e) {
        //Using the same modal as the URL input from assignment block
        e.preventDefault();
        e.stopPropagation();
        function updateUrl(newUrl) {
            pageRef.current.content[blockId].resourceLinkText = newUrl;
            setUrl(newUrl);
            pageRef.current.onChange(blockId);
        }
        modalHook.openModal(new UrlInputModal(modalHook, url, updateUrl));
    }

    if (!url) {
        //Exit early due to different structure when there is no URL
        return (
            <div
                ref={blockRef}
                className="resource_block resource_block_empty"
                onClick={openUrlModal}
            >
                {modalHook.render()}
                <FaLink className="resource_block_icon" />
                Click to add hyperlink
            </div>
        );
    }

    const { protocol, domain, path } = getDomainBreakdown(url);

    function openUrl() {
        //Use an event listener to avoid the URL being opened when the user is trying to click the edit button
        window.open(url, "_blank");
    }

    return (
        <>
            {modalHook.render()}
            <div
                ref={blockRef}
                onClick={openUrl}
                className="resource_block resource_block_filled"
            >
                <div className="resource_block_content">
                    <span>
                        {protocol}
                        <b className="resource_block_domain">{domain}</b>
                        {path}
                    </span>
                    <FaExternalLinkAlt className="resource_block_icon" />
                </div>
                <button
                    className="resource_edit_button"
                    onClick={openUrlModal}
                    title="Edit link"
                >
                    <FaPencil />
                </button>
            </div>
        </>
    );
}
