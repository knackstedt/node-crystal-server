import { JSDOM } from 'jsdom';
import { URL } from 'url';
import { Request } from 'express';

export const SubstituteLinks = (
    html: string, 
    rootDomains: Map<string, boolean>,
    req: Request<any, any, any, any, Record<string, any>>
) => {
    const dom = new JSDOM(html, {
        url: req.protocol + '://' + req.get("host")
    });
    const document = dom.window.document;

    const updateUrl = (original: string) => {
        if (!original.startsWith("http")) {
            original = original.startsWith('/') ? original : '/' + original;
            original = req.protocol + '://' + req.get("host") + original;
        }

        try {
            const url = new URL(original);
            const isEmbedded = !rootDomains.get(url.host);

            // http://localhost:2797/_/https/www.googletagmanager.com/gtag/js?id=UA-90072-2
            if (isEmbedded) {
                const path = url.pathname;
                url.pathname = '/_/' + url.protocol.slice(0, -1) + '/' + url.host + path;
            }
            url.host = req.get("host");
            url.protocol = req.protocol;
            return url.toString();
        }
        catch(ex) {
            debugger;
            return "broken://" + original
        }
    }

    document.querySelectorAll("[href]").forEach(el => {
        el.setAttribute("href", updateUrl(el.getAttribute("href")));
    })
    document.querySelectorAll("[src]").forEach(el => {
        el.setAttribute("src", updateUrl(el.getAttribute("src")));    
    });

    return dom.serialize();
}