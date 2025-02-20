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

function copyTrackingID() {
    var trackingInput = document.getElementById("trackingID");

    if (trackingInput.value) {
        navigator.clipboard.writeText(trackingInput.value).then(() => {
            
        }).catch(err => {
            
        });
    } else {
        
    }
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

function generateTrackingID() {
    return "GROWW" + Math.floor(10000 + Math.random() * 90000);
}

function b64EncodeUnicode(str) {
    return btoa(unescape(encodeURIComponent(str)));
}

function getISTDateTime() {
    let istTime = new Date().toLocaleString("en-US", { 
        timeZone: "Asia/Kolkata", 
        hour12: false 
    });

    let [datePart, timePart] = istTime.split(", ");
    let [month, day, year] = datePart.split("/");

    let date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    let time = timePart;

    return { date, time };
}

async function sendToGitHub(trackingID, domain, telegramUsername, orderStatus = "In Progress") {
    let repoOwner = "digitalfxhub";
    let repoName = "lanorder";
    let fileName = "orders.json";

    let githubAPI = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${fileName}`;
    
    try {
        // Fetch token from environment variable (Node.js backend)
        let githubToken = process.env.GH_TOKEN_DFXHUB;
        if (!githubToken) throw new Error("GitHub Token not found!");

        let headers = {
            "Authorization": `token ${githubToken}`,
            "Accept": "application/vnd.github.v3+json"
        };

        let response = await fetch(githubAPI, { headers });

        let orders = [];
        let sha = "";

        if (response.status === 200) {
            let fileData = await response.json();
            orders = JSON.parse(atob(fileData.content));
            sha = fileData.sha;
        }

        let newOrder = {
            "Tracking ID": trackingID,
            "Domain": domain,
            "Telegram": `@${telegramUsername}`,
            "Order Status": orderStatus,
            "Date": new Date().toISOString()
        };

        orders.push(newOrder);

        let updatedContent = btoa(JSON.stringify(orders, null, 2));

        await fetch(githubAPI, {
            method: "PUT",
            headers,
            body: JSON.stringify({
                message: `New Order: ${trackingID}`,
                content: updatedContent,
                sha: sha || undefined
            })
        });

    } catch (error) {
        console.error("GitHub API Error:", error);
    }
}
