/**
 * antiblock.js
 * 
 * 1. Aggressively removes elements associated with web filters (Blocksi, etc.)
 * 2. Attempts to reload images that fail to load by using a public proxy.
 */

(function () {
    console.log("[AntiBlock] Initializing protection...");

    // --- 1. DOM CLEANER (Blocksi/Filter remover) ---
    const badKeywords = [
        "blocksi", "bl0cksi", "webfilter", "filtering",
        "blocked", "overlay", "bsecure", "securly", "goguardian"
    ];

    function clean(node) {
        if (!node || node.nodeType !== 1) return; // Only check elements

        // Check ID, Class, and InnerHTML (careful with innerHTML on large nodes)
        const checkStr = (node.id + " " + node.className + " " + (node.getAttribute("name") || "")).toLowerCase();

        // If the element ITSELF matches
        for (let w of badKeywords) {
            if (checkStr.includes(w)) {
                console.log(`[AntiBlock] Removing detected element: <${node.tagName}> matching "${w}"`);
                node.remove();
                return;
            }
        }

        // Deep check for specific blocking iframes or overlays
        // (Sometimes filters inject an iframe with a specific specific URL)
        if (node.tagName === "IFRAME") {
            try {
                if (node.src && badKeywords.some(k => node.src.toLowerCase().includes(k))) {
                    console.log(`[AntiBlock] Removing blocking iframe: ${node.src}`);
                    node.remove();
                    return;
                }
            } catch (e) { }
        }
    }

    const observer = new MutationObserver(mutations => {
        mutations.forEach(m => {
            m.addedNodes.forEach(n => {
                clean(n);
                if (n.querySelectorAll) {
                    // Check all children of added node
                    n.querySelectorAll("*").forEach(clean);
                }
            });
        });
    });

    // Start observing immediately
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    // Also run once on existing DOM
    document.querySelectorAll("*").forEach(clean);


    // --- 2. IMAGE UNBLOCKER ---
    // Listen for image load errors and try to proxy them
    window.addEventListener("error", function (e) {
        if (e.target.tagName === "IMG") {
            const img = e.target;
            const src = img.src;

            // Avoid infinite loops if the proxy also fails
            if (img.getAttribute("data-tried-proxy") === "true") return;

            console.warn(`[AntiBlock] Image failed to load: ${src}. Attempting proxy...`);
            img.setAttribute("data-tried-proxy", "true");

            // Use a public image proxy (wsrv.nl is reliable and fast)
            // Alternative: `https://api.allorigins.win/raw?url=${encodeURIComponent(src)}`
            const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(src)}`;

            img.src = proxyUrl;
        }
    }, true); // Capture phase to catch error events on elements

    console.log("[AntiBlock] Active.");
})();
