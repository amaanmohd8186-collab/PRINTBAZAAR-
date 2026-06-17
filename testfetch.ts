// Fetch test
const doFetch = async () => {
    try {
        const res = await fetch("http://localhost:3000/api/cashfree/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                amount: 100,
                customerId: "c1",
                customerPhone: "123",
                customerEmail: "123@abc.com"
            })
        });
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Response text:", text);
    } catch(e) {
        console.error("Fetch failed:", e);
    }
};
doFetch();
