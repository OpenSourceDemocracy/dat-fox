/**
 * Sets up redirects for dat:// urls to be proxied.
 */
import { addDatSite, datSites } from './sites';
import { showDatSecureIcon } from './page-action';

const datUrlMatcher = /^[0-9a-f]{64}(\+[0-9]+)?$/;

function init() {
    /*
    * Listen for requests to a fake redirect host (dat.localhost), and redirect to a url which will be
    * proxied to the dat-gateway.
    */
    browser.webRequest.onBeforeRequest.addListener((details) => {
        // replace url encoded dat:// prefix
        const datUrl = decodeURIComponent(details.url.replace('http://dat.localhost/?dat%3A%2F%2F', ''));
        const hostOrAddress = datUrl.split('/')[0];

        // if its a plain dat url, just do the redirect
        if (datUrlMatcher.test(hostOrAddress)) {
            return {
                redirectUrl: `http://${datUrl}`,
            };
        }
        // otherwise, we need to add this hostname to the list of dat sites
        // TODO this will trigger a race condition
        addDatSite(hostOrAddress);
        return {
            redirectUrl: `http://${datUrl}`,
        };
    }, {
        urls: ['http://dat.localhost/*'],
    }, ['blocking']);

    // trigger dat secure page action for dat pages
    browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
        if (changeInfo.url && changeInfo.url.startsWith('http')) {
            const host = changeInfo.url.split('/')[2];
            if (datSites.has(host) || datUrlMatcher.test(host)) {
                showDatSecureIcon(tabId);
            }
        }
    });
}

export default {
    init,
};
