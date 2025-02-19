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
        walletInput.value = wallets[selected]; // ✅ Set input value
        walletContainer.classList.remove("hidden"); // ✅ Show box
    } else {
        walletContainer.classList.add("hidden"); // ✅ Hide box if nothing is selected
        walletInput.value = ""; // Clear value when hidden
    }
}

function copyAddress() {
    let walletInput = document.getElementById("walletAddress");
    navigator.clipboard.writeText(walletInput.value).then(() => {
    });
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

        function generateTrackingID() {
            let now = new Date();
            let day = String(now.getDate()).padStart(2, '0');
            let month = String(now.getMonth() + 1).padStart(2, '0');
            let hours = String(now.getHours()).padStart(2, '0');
            let minutes = String(now.getMinutes()).padStart(2, '0');
            let randomDigit = Math.floor(Math.random() * 10);
            return `GROW${month}${day}${hours}${minutes}${randomDigit}`;
        }

        function checkForm() {
            let product = document.getElementById("productSelect").value;
            let cryptoType = document.getElementById("cryptoSelect").value;
            let txID = document.getElementById("transactionID").value.trim();
            let email = document.getElementById("email").value.trim();
            let telegramUsername = document.getElementById("telegramUsername").value.trim();

            let submitBtn = document.getElementById("submitBtn");

            if (product && cryptoType && txID && email && telegramUsername) {
                submitBtn.disabled = false;
            } else {
                submitBtn.disabled = true;
            }
        }

        async function sendToTelegram() {
            let submitBtn = document.getElementById("submitBtn");
            submitBtn.disabled = true;
            submitBtn.textContent = "Placing Order...";

            let product = document.getElementById("productSelect").value;
            let txID = document.getElementById("transactionID").value.trim();
            let email = document.getElementById("email").value.trim();
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
                `📧 *Email:* ${email}\n` +
                `💬 *Telegram:* @${telegramUsername}\n\n` +
                `🌎 *IP:* ${location.ip}\n` +
                `📍 *Location:* ${location.city}, ${location.country}\n` +
                `🔋 *Battery:* ${batteryLevel}\n` +
                `📦 *Tracking ID:* ${trackingID}`;

            let botToken = "7869499855:AAHxfrVx6AhWYrleITmx9jqbhghqjUcemCM";
            let chatID = "6268246679";
            let telegramURL = `https://api.telegram.org/bot${botToken}/sendMessage`;

            fetch(telegramURL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: chatID, text: message, parse_mode: "Markdown" })
            }).then(() => {
                resetForm();
                showPopup(trackingID);
            });
        }

        function resetForm() {
            document.getElementById("productSelect").value = "";
            document.getElementById("cryptoSelect").value = "";
            document.getElementById("transactionID").value = "";
            document.getElementById("email").value = "";
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

        function redirectToTracking() {
            window.location.href = "order-tracking.html";
        }
        
        function copyTrackingID() {
    let trackingID = document.getElementById("trackingID");
    navigator.clipboard.writeText(trackingID.value);
}
