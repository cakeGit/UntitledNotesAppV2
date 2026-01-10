export class UnsuccessfulResponseError extends Error {
    constructor(data) {
        super(data.error || "Unknown API error " + JSON.stringify(data));
        this.data = data;
    }

    getData() {
        return this.data;
    }
}

const fetchesInProgress = {};
const cachedFetches = {};

export async function fetchApiCached(endpoint, body = null, options = {}) {
    let cacheKey = endpoint + JSON.stringify(body || {});
    if (cachedFetches[cacheKey]) {
        return cachedFetches[cacheKey];
    }
    
    const fetchPromise = fetchApi(endpoint, body, options);
    cachedFetches[cacheKey] = fetchPromise;

    try {
        return await fetchPromise;
    } finally {
        delete cachedFetches[cacheKey];
    }
}

export async function fetchApi(endpoint, body = null, options = {}) {
    if (fetchesInProgress[endpoint]) {
        return fetchesInProgress[endpoint];
    }
    let url = window.location.origin + "/api/" + endpoint;
    let fetchOptions = {
        method: body ? 'POST' : 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        ...options,
    };
    if (body) {
        fetchOptions.body = JSON.stringify(body);
    }
    const fetchInProgress = fetch(url, fetchOptions)
        .then(response => {
            // if (!response.ok) {
            //     throw new Error('Failed to fetch api: ' + response.statusText);
            // }
            return response.json() || { success: false, error: "Empty response from server" };
        })
        .then(data => {
            if (data?.success === false) {
                if (data.effect == "needs_new_login" && window.location.pathname !== "/get_account") {
                    window.location.href = "/get_account";
                }
                throw new UnsuccessfulResponseError(data);
            }
            return data;
        });
    fetchesInProgress[endpoint] = fetchInProgress;
    try {
        return await fetchInProgress;
    } finally {
        delete fetchesInProgress[endpoint];
    }
}