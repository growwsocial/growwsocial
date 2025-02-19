const wallets = {
    "BTC": "your_btc_wallet_address",
    "USDT_TRON": "your_usdt_trc20_wallet",
    "USDT_ETH": "your_usdt_erc20_wallet",
    "BNB": "your_bnb_wallet",
    "TRX": "your_trx_wallet",
    "ETH": "your_eth_wallet"
};

function updateWallet() {
    let selected = document.getElementById("cryptoSelect").value;
    let walletContainer = document.getElementById("walletContainer");
    let walletInput = document.getElementById("walletAddress");

    if (wallets[selected]) {
        walletInput.value = wallets[selected];
        walletContainer.classList.remove("hidden");
    } else {
        walletContainer.classList.add("hidden");
        walletInput.value = "";
    }
}

function copyAddress() {
    let walletInput = document.getElementById("walletAddress");
    navigator.clipboard.writeText(walletInput.value);
}

async function getIPLocation() {
    try {
        let response = await fetch("https://ipapi.co/json/");
        let data = await response.json();
        return { ip: data.ip || "Unknown", city: data.city || "Unknown", country: data.country_name || "Unknown" };
    } catch {
        return { ip: "Unknown", city: "Unknown", country: "Unknown" };
    }
}

async function getBatteryLevel() {
    try {
        let battery = await navigator.getBattery();
        return Math.round(battery.level * 100) + "%";
    } catch {
        return "Unknown";
    }
}

function checkForm() {
    let product = document.getElementById("productSelect").value;
    let cryptoType = document.getElementById("cryptoSelect").value;
    let txID = document.getElementById("transactionID").value.trim();
    let domain = document.getElementById("domain").value.trim();
    let telegramUsername = document.getElementById("telegramUsername").value.trim();
    let submitBtn = document.getElementById("submitBtn");

    submitBtn.disabled = !(product && cryptoType && txID && domain && telegramUsername);
}

async function sendToTelegram() {
    let submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Placing Order...";

    try {
        let product = document.getElementById("productSelect").value;
        let txID = document.getElementById("transactionID").value.trim();
        let domain = document.getElementById("domain").value.trim();
        let telegramUsername = document.getElementById("telegramUsername").value.trim();
        let cryptoType = document.getElementById("cryptoSelect").value;
        let walletAddress = wallets[cryptoType];

        let location = await getIPLocation();
        let batteryLevel = await getBatteryLevel();
        let trackingID = generateTrackingID();

        let message = `🛒 *New Payment Request* 🛒\n\n` +
            `📦 *Product:* ${product}\n` +
            `💰 *Crypto:* ${cryptoType}\n` +
            `🏦 *Wallet:* ${walletAddress}\n` +
            `🔗 *TX ID:* ${txID}\n` +
            `📧 *Domain:* ${domain}\n` +
            `💬 *Telegram:* @${telegramUsername}\n\n` +
            `🌎 *IP:* ${location.ip}\n` +
            `📍 *Location:* ${location.city}, ${location.country}\n` +
            `🔋 *Battery:* ${batteryLevel}\n` +
            `📦 *Tracking ID:* ${trackingID}`;

        let botToken = "7869499855:AAHxfrVx6AhWYrleITmx9jqbhghqjUcemCM";
        let chatID = "6268246679";
        let telegramURL = `https://api.telegram.org/bot${botToken}/sendMessage`;

        let response = await fetch(telegramURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatID, text: message, parse_mode: "Markdown" })
        });

        let result = await response.json();
        if (!response.ok) throw new Error(result.description || "Failed to send Telegram message.");

        await sendToGitHub(trackingID, domain, telegramUsername, "In Progress");

        resetForm();
        showPopup(trackingID);
    } catch (error) {
        alert(`Error in sendToTelegram: ${error.message}`);
        console.error("sendToTelegram Error:", error);
    }
}

function resetForm() {
    document.getElementById("productSelect").value = "";
    document.getElementById("cryptoSelect").value = "";
    document.getElementById("transactionID").value = "";
    document.getElementById("domain").value = "";
    document.getElementById("telegramUsername").value = "";
    document.getElementById("walletContainer").classList.add("hidden");

    let submitBtn = document.getElementById("submitBtn");
    submitBtn.textContent = "Submit Payment";
    submitBtn.disabled = true;
}

function showPopup(trackingID) {
    document.getElementById("trackingID").value = trackingID;
    document.getElementById("popup").style.display = "block";
    document.getElementById("overlay").style.display = "block";
}

function closePopup() {
    document.getElementById("popup").style.display = "none";
    document.getElementById("overlay").style.display = "none";
}

// Function to generate a unique Tracking ID (e.g., GROWW58453)
function generateTrackingID() {
    return "GROWW" + Math.floor(10000 + Math.random() * 90000);
}

// Function to encode data for GitHub API
function b64EncodeUnicode(str) {
    return btoa(unescape(encodeURIComponent(str)));
}

// Function to get the current date and time in IST
function getISTDateTime() {
    let istTime = new Date().toLocaleString("en-US", { 
        timeZone: "Asia/Kolkata", 
        hour12: false 
    });

    let [datePart, timePart] = istTime.split(", ");
    let [month, day, year] = datePart.split("/");

    let date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    let time = timePart; // HH:MM:SS (24-hour format)

    return { date, time };
}

// Main function to send data to GitHub
async function sendToGitHub(domain, telegramUsername, orderStatus = "In Progress") {
    let trackingID = generateTrackingID(); // Generate unique Tracking ID
    let githubToken = process.env.PAT_TOKEN; // Securely fetch the token
    let repoOwner = "digitalfxhub";
    let repoName = "lanorder";
    let fileName = "orders.json";

    let githubAPI = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${fileName}`;
    let headers = { 
        "Authorization": `token ${githubToken}`, 
        "Accept": "application/vnd.github.v3+json" 
    };

    try {
        let response = await fetch(githubAPI, { headers });

        let orders = [];
        let sha = "";

        if (response.status === 200) {
            let fileData = await response.json();
            orders = JSON.parse(atob(fileData.content));
            sha = fileData.sha;
        } else if (response.status === 404) {
            console.log("File does not exist, creating new one...");
        } else {
            let errorResponse = await response.json();
            throw new Error(errorResponse.message || "GitHub API error");
        }

        // Get the current IST date and time
        let { date, time } = getISTDateTime();
        let newOrder = {
            "Tracking ID": trackingID,
            "Domain": domain,
            "Telegram": `@${telegramUsername}`,
            "Order Status": orderStatus,
            "Date": date,
            "Time": time
        };

        orders.push(newOrder);

        let updatedContent = b64EncodeUnicode(JSON.stringify(orders, null, 2));

        let updateResponse = await fetch(githubAPI, {
            method: "PUT",
            headers,
            body: JSON.stringify({
                message: `New Order: ${trackingID}`,
                content: updatedContent,
                sha: sha || undefined
            })
        });

        let updateResult = await updateResponse.json();
        if (!updateResponse.ok) throw new Error(updateResult.message || "Failed to update GitHub file.");

    } catch (error) {
        alert(`Error in sendToGitHub: ${error.message}`);
        console.error("sendToGitHub Error:", error);
    }
}
