async function fetchOrders() {
            let url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${fileName}`;
            let response = await fetch(url, { headers: { Authorization: `token ${githubToken}` } });
            let data = await response.json();
            currentOrders = JSON.parse(atob(data.content));
            displayOrders();
        }

        async function fetchOrdersSha() {
            let url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${fileName}`;
            let response = await fetch(url, { headers: { Authorization: `token ${githubToken}` } });
            let data = await response.json();
            return data.sha;
        }

        async function updateOrders() {
            let updatedContent = btoa(JSON.stringify(currentOrders, null, 2));
            await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${fileName}`, {
                method: "PUT",
                headers: {
                    Authorization: `token ${githubToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: `Updated orders`,
                    content: updatedContent,
                    sha: await fetchOrdersSha()
                })
            });

            setTimeout(() => location.reload(), 500); // Refresh page after update
        }

        function displayOrders(searchTerm = "") {
    let orderTable = document.getElementById("orderTable");
    orderTable.innerHTML = "";

    let filteredOrders = currentOrders.filter(order =>
        order["Tracking ID"].toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order["Domain"] && order["Domain"].toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order["Telegram"] && order["Telegram"].toLowerCase().includes(searchTerm.toLowerCase()))
    );

    filteredOrders.sort((a, b) => (b["Order Status"] === "In Progress") - (a["Order Status"] === "In Progress"));

    filteredOrders.forEach(order => {
        let statusClass = "";
        if (order["Order Status"] === "In Progress") statusClass = "status-in-progress";
        else if (order["Order Status"] === "Rejected") statusClass = "status-rejected";
        else if (order["Order Status"] === "Delivered") statusClass = "status-delivered";

        let row = document.createElement("tr");
        row.innerHTML = `
            <td>${order["Tracking ID"]}</td>
            <td class="${statusClass}">${order["Order Status"]}</td>
            <td>
                <button class="manage-btn" onclick="toggleExpand('${order["Tracking ID"]}')">Manage</button>
                <div id="expand-${order["Tracking ID"]}" class="expand-section">
                    <div class="action-buttons">
                        <button class="orange-btn" onclick="viewDetails('${order["Tracking ID"]}')">View Details</button>
                        <button class="white-btn" onclick="changeStatus('${order["Tracking ID"]}', 'In Progress')">Mark as In Progress</button>
                        <button class="green-btn" onclick="changeStatus('${order["Tracking ID"]}', 'Delivered')">Mark as Delivered</button>
                        <button class="red-btn" onclick="showRejectPopup('${order["Tracking ID"]}')">Reject Order</button>
                        <button class="delete-btn" onclick="showDeletePopup('${order["Tracking ID"]}')">Delete</button>
                    </div>
                </div>
            </td>
        `;
        orderTable.appendChild(row);
    });
}

document.getElementById("search").addEventListener("input", function () {  
    displayOrders(this.value);  
});  

displayOrders();

        document.addEventListener("click", function (event) {
    let allExpandSections = document.querySelectorAll(".expand-section");
    let allManageButtons = document.querySelectorAll(".manage-btn");

    let isInsideExpand = Array.from(allExpandSections).some(section => section.contains(event.target));
    let isManageButton = Array.from(allManageButtons).some(button => button.contains(event.target));

    if (!isInsideExpand && !isManageButton) {
        allExpandSections.forEach(section => {
            section.style.display = "none";
        });
    }
});

function toggleExpand(trackingID) {
    let expandSection = document.getElementById(`expand-${trackingID}`);
    let isVisible = expandSection.style.display === "block";

    document.querySelectorAll(".expand-section").forEach(section => {
        section.style.display = "none";
    });

    expandSection.style.display = isVisible ? "none" : "block";
}

        let editingTrackingID = null;

function viewDetails(trackingID) {
    let order = currentOrders.find(o => o["Tracking ID"] === trackingID);
    editingTrackingID = trackingID;

    document.getElementById("orderDetails").innerText = JSON.stringify(order, null, 2);
    document.getElementById("editDomain").value = order["Domain"] || "";
    document.getElementById("editTelegram").value = order["Telegram"] || "";

    document.getElementById("editSection").style.display = "none";
    document.getElementById("editBtn").style.display = "block";
    document.getElementById("detailsPopup").style.display = "block";
}

function editDetails() {
    document.getElementById("editSection").style.display = "block";
    document.getElementById("editBtn").style.display = "none";
}

async function saveEditedDetails() {
    let order = currentOrders.find(o => o["Tracking ID"] === editingTrackingID);
    
    order["Domain"] = document.getElementById("editDomain").value;
    order["Telegram"] = document.getElementById("editTelegram").value;

    updateOrders();
    closePopup();
}
        

function showDeletePopup(trackingID) {
    deleteTrackingID = trackingID;
    document.getElementById("confirmPopup").style.display = "block";
}

function confirmDelete() {
    currentOrders = currentOrders.filter(order => order["Tracking ID"] !== deleteTrackingID);
    updateOrders();
    closePopup();
}
        function showRejectPopup(trackingID) {
            rejectTrackingID = trackingID;
            document.getElementById("rejectPopup").style.display = "block";
        }


function changeStatus(trackingID, status) {  
    let order = currentOrders.find(o => o["Tracking ID"] === trackingID);  
    order["Order Status"] = status;  

    if (status === "Delivered") {  
        order["Last Updated"] = new Date().toLocaleString();  
    }

    if (order.hasOwnProperty("Reason")) {  
        delete order["Reason"];  
    }  

    updateOrders();  
}  

function confirmReject() {  
    let reason = document.getElementById("rejectReason").value;  
    let order = currentOrders.find(o => o["Tracking ID"] === rejectTrackingID);  
    order["Order Status"] = "Rejected";  
    order["Reason"] = reason;  
    order["Last Updated"] = new Date().toLocaleString();  

    updateOrders();  
    closePopup();  
}

        function closePopup() {
            document.querySelectorAll(".popup").forEach(popup => popup.style.display = "none");
        }

        fetchOrders();
