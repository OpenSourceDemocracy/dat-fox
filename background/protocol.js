/**
 * Sets up redirects for dat:// urls to be proxied.
 */
import mime from 'mime';
import { addDatSite, datSites } from './sites';
import { showDatSecureIcon } from './page-action';

const datUrlMatcher = /^[0-9a-f]{64}(\+[0-9]+)?$/;

function init() {
    browser.protocol.registerProtocol('dat', async (request) => {
        const url = request.url.replace('dat://', 'http://');
        const path = url.split('?')[0];
        let contentType = mime.getType(path);
        if (path.endsWith('/')) {
            contentType = 'text/html';
        }
        console.log('xxx', url, contentType);
        return {
            contentType,
            content: (async function*() {
                const contentBlob = await (await fetch(url)).blob();
                const buffer = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        resolve(reader.result);
                    }
                    reader.readAsArrayBuffer(contentBlob);
                });
                yield buffer;
            })()
        };
    });

    // insert contentscript on dat pages
    browser.webRequest.onCompleted.addListener((details) => {
        const host = details.url.split('/')[2];
        if (datSites.has(host) || datUrlMatcher.test(host)) {
            browser.tabs.executeScript(details.tabId, {
                file: browser.extension.getURL('content_script.js'),
                runAt: 'document_start',
            });
            showDatSecureIcon(details.tabId);
        }
    }, {
        urls: ['http://*/*'],
        types: ['main_frame']
    });
}

export default {
    init,
};
