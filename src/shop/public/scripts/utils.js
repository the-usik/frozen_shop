function createDOMTree(tag, prop = {}, childs = []) {
    let parent;
    if (typeof tag == "string") {
        parent = document.createElement(tag);
        for (let p in prop) {
            parent[p] = prop[p];
        }
    } else if (Array.isArray(tag)) {
        parent = document.createDocumentFragment();
        childs = tag;
    } else if (tag instanceof DocumentFragment) {
        parent = tag;
    }

    if (Array.isArray(childs) && childs.length > 0) {
        for (let index in childs) {
            let inner = childs[index];
            if (!inner) continue;
            let child = inner instanceof HTMLElement ? inner : createDOMTree(...inner)
            parent.appendChild(child);
        }
    } else if (childs instanceof DocumentFragment) {
        parent.appendChild(childs);
    }

    return parent;
}

function escapeHtml(unsafe) {
    return unsafe.toString()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }