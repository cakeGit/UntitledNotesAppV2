export class UnsuccessfulResponseError extends Error {
    constructor(data) {
        super(data.error || "Unknown API error");
        this.data = data;
    }

    getData() {
        return this.data;
    }
}

export async function fetchRawApi(endpoint, body = null, options = {}) {
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
    return fetch(url, fetchOptions)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch api: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            if (data.success === false) {
                throw new UnsuccessfulResponseError(data.error, data);
            }
            return data;
        });
}