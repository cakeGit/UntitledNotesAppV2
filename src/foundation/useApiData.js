import { useEffect, useState } from "react";

export function useApi(handler) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        if (!handler || data || error) return;

        setLoading(true);
        setError(null);
        handler()
            .then((result) => {
                if (isMounted) {
                    setData(result);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (isMounted) {
                    console.error("Error in useApi handler:", err);
                    setError(err);
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [handler]);

    return { data, loading, error };
}
