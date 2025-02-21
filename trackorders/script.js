function trackOrder() {  
    let trackingId = document.getElementById("trackingInput").value.trim();  
    if (!trackingId) {  
        alert("⚠️ Please enter a Tracking ID");  
        return;  
    }  

    let url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${fileName}?nocache=${Date.now()}`;  

    fetch(url, {  
        headers: {  
            "Authorization": `Bearer ${githubToken}`,  
            "Accept": "application/vnd.github.v3.raw"  
        }  
    })  
    .then(response => {  
        if (!response.ok) {  
            throw new Error("Failed to fetch data");  
        }  
        return response.json();  
    })  
    .then(data => {  
        let order = data.find(item => item["Tracking ID"] === trackingId);  
        let resultDiv = document.getElementById("orderResult");  
        resultDiv.innerHTML = "";  

        if (order) {  
            let orderBox = document.createElement("div");  
            orderBox.className = "order-container";  

            let statusClass = getStatusClass(order["Order Status"]);  

            orderBox.innerHTML = `  
                <p><strong>Tracking ID:</strong> ${order["Tracking ID"]}</p>  
                <p><strong>Status:</strong> <span class="${statusClass}">${order["Order Status"]}</span></p>  
            `;  
            orderBox.onclick = function () { showOrderDetails(order); };  
            resultDiv.appendChild(orderBox);  
        } else {  
            resultDiv.innerHTML = "<p>❌ Tracking ID not found</p>";  
        }  
    })  
    .catch(error => alert("⚠️ Error fetching data: " + error.message));  
}

    function showOrderDetails(order) {
    document.getElementById("orderId").innerText = order["Tracking ID"];
    document.getElementById("orderDomain").innerText = order["Domain"];
    document.getElementById("orderTelegram").innerText = order["Telegram"];
    document.getElementById("orderDate").innerText = order["Date"];
    document.getElementById("orderTime").innerText = order["Time"];

    let statusElement = document.getElementById("orderStatus");
    statusElement.innerText = order["Order Status"];
    statusElement.className = getStatusClass(order["Order Status"]); // Apply color

    let deliveryDateElem = document.getElementById("deliveryDate").parentElement;
    let orderPopup = document.getElementById("orderPopup");

    // Remove any existing extra details (if opened previously)
    document.querySelectorAll(".extra-info").forEach(el => el.remove());

    // Hide "Expected Delivery" by default
    deliveryDateElem.style.display = "none";

    if (order["Order Status"] === "Rejected") {
        let rejectionReason = document.createElement("p");
        rejectionReason.className = "extra-info";
        rejectionReason.innerHTML = `<strong>Rejection Reason:</strong> ${order["Reason"] || "Not Provided"}`;
        orderPopup.appendChild(rejectionReason);

        let rejectionDate = document.createElement("p");
        rejectionDate.className = "extra-info";
        rejectionDate.innerHTML = `<strong>Rejected At:</strong> ${order["Last Updated"]}`;
        orderPopup.appendChild(rejectionDate);
    } else if (order["Order Status"] === "Delivered") {
        let deliveredAt = document.createElement("p");
        deliveredAt.className = "extra-info";
        deliveredAt.innerHTML = `<strong>Product Delivered At:</strong> ${order["Last Updated"]}`;
        orderPopup.appendChild(deliveredAt);
    } else {
        let orderDate = new Date(order["Date"]);
        orderDate.setDate(orderDate.getDate() + 3);
        let deliveryDate = orderDate.toISOString().split('T')[0];

        document.getElementById("deliveryDate").innerText = deliveryDate;
        deliveryDateElem.style.display = "block";
    }



    openPopup("orderPopup");
}

    function openPopup(id) {
        document.getElementById("overlay").style.display = "block";
        document.getElementById(id).style.display = "block";
    }

    function closePopup() {
        document.getElementById("overlay").style.display = "none";
        document.querySelectorAll(".popup").forEach(popup => popup.style.display = "none");
    }

    function openNoticePopup() {
        openPopup("noticePopup");
    }

    function getStatusClass(status) {
        return status === "In Progress" ? "status-inprogress" :
               status === "Delivered" ? "status-delivered" :
               status === "Rejected" ? "status-rejected" : "";
    }
