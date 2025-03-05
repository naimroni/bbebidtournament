// Data structures to store managers and players
let players = JSON.parse(localStorage.getItem('players')) || [];
let managers = JSON.parse(localStorage.getItem('managers')) || [];
let currentPlayerIndex = -1;
let currentBid = 0;
let currentHighestBidder = null;
let timer;
let isAuctionStarted = false;

// Load data from localStorage
function loadData() {
    try {
        players = JSON.parse(localStorage.getItem('players')) || [];
        managers = JSON.parse(localStorage.getItem('managers')) || [];
        console.log('Data loaded:', { players, managers });
        updatePlayersList();
        updateManagersList();
    } catch (error) {
        console.error('Error loading data:', error);
        players = [];
        managers = [];
    }
}

// Save data to localStorage
function saveData() {
    try {
        localStorage.setItem('players', JSON.stringify(players));
        localStorage.setItem('managers', JSON.stringify(managers));
        console.log('Data saved:', { players, managers });
    } catch (error) {
        console.error('Error saving data:', error);
        alert('Error saving data. Please try again.');
    }
}

// Update managers list display
function updateManagersList() {
    const managersList = document.getElementById('managersList');
    if (!managersList) {
        console.error('managersList element not found');
        return;
    }
    
    managersList.innerHTML = '';
    
    if (!managers || managers.length === 0) {
        managersList.innerHTML = '<p class="no-data">No managers registered yet</p>';
        return;
    }
    
    managers.forEach((manager) => {
        const div = document.createElement('div');
        div.className = 'manager-info';
        div.innerHTML = `
            <p><strong>${manager.name}</strong></p>
            <p>Budget: ৳${manager.budget}</p>
            ${manager.purchasedPlayers && manager.purchasedPlayers.length > 0 ? 
                `<p>Purchased Players: ${manager.purchasedPlayers.map(p => p.name).join(', ')}</p>` : 
                ''}
        `;
        managersList.appendChild(div);
    });

    // Update manager select in auction section
    const bidderSelect = document.getElementById('bidderName');
    if (bidderSelect) {
        const currentSelection = bidderSelect.value; // Store current selection
        bidderSelect.innerHTML = '<option value="">SELECT MANAGER</option>';
        managers.forEach(manager => {
            bidderSelect.innerHTML += `<option value="${manager.name}">${manager.name} (৳${manager.budget})</option>`;
        });
        if (currentSelection) {
            bidderSelect.value = currentSelection; // Restore previous selection
        }
    }
}

// Update players list display
function updatePlayersList() {
    const playersList = document.getElementById('playersList');
    if (!playersList) {
        console.error('playersList element not found');
        return;
    }
    
    playersList.innerHTML = '';
    
    if (!players || players.length === 0) {
        playersList.innerHTML = '<p class="no-data">No players registered yet</p>';
        return;
    }
    
    players.forEach((player) => {
        if (!player.sold) {
            const div = document.createElement('div');
            div.className = 'player-info';
            div.innerHTML = `
                <p><strong>${player.name}</strong></p>
                <p>Base Price: ৳${player.basePrice}</p>
                <p>Category: ${player.category}</p>
            `;
            playersList.appendChild(div);
        }
    });
}

// Add manager
function addManager() {
    const nameInput = document.getElementById('managerName');
    const budgetInput = document.getElementById('budget');
    
    const name = nameInput.value.trim();
    const budget = budgetInput.value;
    
    if (!name || !budget) {
        alert('Please fill in all fields');
        return;
    }
    
    const manager = {
        name: name,
        budget: parseInt(budget),
        purchasedPlayers: []
    };
    
    managers.push(manager);
    saveData();
    updateManagersList();
    
    // Clear form
    nameInput.value = '';
    budgetInput.value = '';
    nameInput.focus();
}

// Remove manager
function removeManager(index) {
    managers.splice(index, 1);
    saveData();
    updateManagersList();
}

// Shuffle array function
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Start auction
function startAuction() {
    if (players.length === 0 || managers.length === 0) {
        alert('Please register at least one player and one manager before starting the auction');
        return;
    }

    // Reset auction state
    isAuctionStarted = true;
    currentPlayerIndex = -1;
    document.getElementById('nextPlayerBtn').disabled = false;
    document.getElementById('soldButton').style.display = 'none';
    document.getElementById('unsoldButton').style.display = 'none';

    // Get all unsold players and shuffle them
    let unsoldPlayers = players.filter(player => !player.sold);
    
    // Double shuffle for more randomness
    unsoldPlayers = shuffleArray(unsoldPlayers);
    unsoldPlayers = shuffleArray(unsoldPlayers);
    
    // Replace the players array with shuffled unsold players first, then sold players
    players = [...unsoldPlayers, ...players.filter(player => player.sold)];
    
    showNextPlayer();
}

// Show next player
function showNextPlayer() {
    // Get all unsold players
    let unsoldPlayers = players.filter(player => !player.sold);
    
    if (unsoldPlayers.length === 0) {
        if (timer) {
            clearInterval(timer);
        }
        document.getElementById('currentPlayer').innerHTML = '<h2>AUCTION COMPLETED!</h2><h3>Thanks for watching!</h3>';
        document.getElementById('nextPlayerBtn').disabled = true;
        document.getElementById('soldButton').style.display = 'none';
        document.getElementById('unsoldButton').style.display = 'none';
        isAuctionStarted = false;
        return;
    }
    
    // Randomly select a player from unsold players
    const randomIndex = Math.floor(Math.random() * unsoldPlayers.length);
    const player = unsoldPlayers[randomIndex];
    
    // Find this player's index in the main players array
    currentPlayerIndex = players.findIndex(p => p.name === player.name);
    
    let biddingHistory = [];
    currentBid = player.basePrice;
    currentHighestBidder = null;
    
    if (timer) {
        clearInterval(timer);
    }

    document.getElementById('currentPlayer').innerHTML = `
        <h3>CURRENT PLAYER</h3>
        <p><strong>${player.name}</strong></p>
        <p>Base Price: ৳${player.basePrice}</p>
        <p>Current Bid: ৳<span id="currentBidAmount">${currentBid}</span></p>
        <p>Highest Bidder: <span id="highestBidder">NONE</span></p>
    `;

    document.getElementById('biddingHistory').innerHTML = '<h3>BIDDING HISTORY</h3>';
    
    // Show unsold button before bidding starts
    document.getElementById('unsoldButton').style.display = 'block';
    document.getElementById('soldButton').style.display = 'none';
    
    // Clear previous bid amount
    document.getElementById('bidAmount').value = '';
    
    startTimer();
}

// Place bid
function placeBid() {
    const bidderName = document.getElementById('bidderName').value;
    const bidAmount = parseInt(document.getElementById('bidAmount').value);
    const manager = managers.find(m => m.name === bidderName);

    if (!bidderName) {
        alert('Please select a manager');
        return;
    }

    // Calculate minimum bid (current bid + 10)
    const minimumBid = currentBid + 10;

    if (!bidAmount) {
        // Set default bid amount to minimum bid
        document.getElementById('bidAmount').value = minimumBid;
        return;
    }

    if (bidAmount < minimumBid) {
        alert(`Bid amount must be at least ৳${minimumBid} (current bid + 10)`);
        document.getElementById('bidAmount').value = minimumBid;
        return;
    }

    if (manager.budget < bidAmount) {
        alert('Manager does not have enough budget');
        return;
    }

    currentBid = bidAmount;
    currentHighestBidder = bidderName;
    
    // Update display
    document.getElementById('currentBidAmount').textContent = bidAmount;
    document.getElementById('highestBidder').textContent = bidderName;
    
    // Show both buttons
    const soldButton = document.getElementById('soldButton');
    const unsoldButton = document.getElementById('unsoldButton');
    soldButton.style.display = 'inline-block';
    unsoldButton.style.display = 'inline-block';

    // Add to bidding history
    let biddingHistory = [];
    biddingHistory.push({
        manager: bidderName,
        amount: bidAmount,
        time: new Date().toLocaleTimeString()
    });
    updateBiddingHistory();
    
    // Clear bid amount and restart timer
    document.getElementById('bidAmount').value = '';
    startTimer();
}

// Update bidding history display
function updateBiddingHistory() {
    const historyDiv = document.getElementById('biddingHistory');
    if (!historyDiv) return;

    // Keep the heading
    historyDiv.innerHTML = '<h3>BIDDING HISTORY</h3>';
    
    let biddingHistory = [];
    if (biddingHistory.length === 0) {
        historyDiv.innerHTML += '<p class="no-data">No bids yet</p>';
        return;
    }

    // Create a container for bid items
    const bidsContainer = document.createElement('div');
    bidsContainer.className = 'bids-container';
    
    biddingHistory.forEach(bid => {
        const bidDiv = document.createElement('div');
        bidDiv.className = 'bid-item';
        bidDiv.innerHTML = `
            <p><strong>${bid.manager}</strong> bid ৳${bid.amount} at ${bid.time}</p>
        `;
        bidsContainer.appendChild(bidDiv);
    });
    
    historyDiv.appendChild(bidsContainer);
}

// Timer function
function startTimer() {
    // Clear existing timer if any
    if (timer) {
        clearInterval(timer);
    }
    
    let timeLeft = 30;
    document.getElementById('timer').textContent = timeLeft;
    
    timer = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            handleTimeUp();
        }
    }, 1000);
}

// Handle when timer reaches zero
function handleTimeUp() {
    if (timer) {
        clearInterval(timer);
    }
    
    if (!currentHighestBidder) {
        // If no bids were made, automatically mark as unsold
        markAsUnsold();
    } else {
        // If there was a highest bidder, show the sold button
        document.getElementById('soldButton').style.display = 'block';
        document.getElementById('unsoldButton').style.display = 'none';
    }
}

// Finalize current player auction
function finalizeCurrentPlayer() {
    const player = players[currentPlayerIndex];

    if (currentHighestBidder) {
        const manager = managers.find(m => m.name === currentHighestBidder);
        if (manager) {
            manager.budget -= currentBid;
            manager.purchasedPlayers.push({
                name: player.name,
                amount: currentBid
            });
        }
        
        player.soldTo = currentHighestBidder;
        player.soldAmount = currentBid;
        
        document.getElementById('auctionResults').innerHTML += `
            <div class="auction-result-item">
                <p>${player.name} SOLD TO ${currentHighestBidder} FOR ৳${currentBid}</p>
            </div>
        `;
    } else {
        document.getElementById('auctionResults').innerHTML += `
            <div class="auction-result-item unsold">
                <p>${player.name} UNSOLD AT BASE PRICE ৳${player.basePrice}</p>
            </div>
        `;
    }
    
    localStorage.setItem('players', JSON.stringify(players));
    localStorage.setItem('managers', JSON.stringify(managers));
    
    updateManagersList();
    document.getElementById('nextPlayerBtn').disabled = false;
}

// Add player
function addPlayer() {
    const nameInput = document.getElementById('playerName');
    const priceInput = document.getElementById('basePrice');
    
    const name = nameInput.value.trim();
    const basePrice = priceInput.value;
    
    if (!name || !basePrice) {
        alert('Please fill in all fields');
        return;
    }
    
    const player = {
        name: name,
        basePrice: parseInt(basePrice),
        sold: false,
        soldTo: null,
        soldAmount: 0
    };
    
    players.push(player);
    saveData();
    updatePlayersList();
    
    // Clear form
    nameInput.value = '';
    priceInput.value = '';
    nameInput.focus();
}

// Add multiple players
function addPlayers() {
    const namesTextArea = document.getElementById('playerNames');
    const basePrice = document.getElementById('basePrice');
    
    const names = namesTextArea.value.trim().split('\n').filter(name => name.trim() !== '');
    
    if (names.length === 0 || !basePrice.value) {
        alert('Please fill in all fields');
        return;
    }
    
    names.forEach(name => {
        const player = {
            name: name.trim(),
            basePrice: parseInt(basePrice.value),
            soldTo: null,
            soldAmount: 0
        };
        
        players.push(player);
    });
    
    saveData();
    updatePlayersList();
    
    // Clear form
    namesTextArea.value = '';
    basePrice.value = '';
    namesTextArea.focus();
}

// Remove player
function removePlayer(index) {
    players.splice(index, 1);
    saveData();
    updatePlayersList();
}

// Clear forms
function clearManagerForm() {
    if (document.getElementById('managerName')) {
        document.getElementById('managerName').value = '';
        document.getElementById('budget').value = '';
    }
}

function clearPlayerForm() {
    if (document.getElementById('playerName')) {
        document.getElementById('playerName').value = '';
        document.getElementById('basePrice').value = '';
    }
}

// Check registration status
function checkRegistrationStatus() {
    const checkStatus = document.getElementById('checkStatus');
    
    if (players.length === 0 && managers.length === 0) {
        checkStatus.innerHTML = '<p class="warning">PLEASE REGISTER AT LEAST ONE PLAYER AND ONE MANAGER BEFORE STARTING THE AUCTION.</p>';
        document.getElementById('startAuctionBtn').disabled = true;
    } else if (players.length === 0) {
        checkStatus.innerHTML = '<p class="warning">PLEASE REGISTER AT LEAST ONE PLAYER BEFORE STARTING THE AUCTION.</p>';
        document.getElementById('startAuctionBtn').disabled = true;
    } else if (managers.length === 0) {
        checkStatus.innerHTML = '<p class="warning">PLEASE REGISTER AT LEAST ONE MANAGER BEFORE STARTING THE AUCTION.</p>';
        document.getElementById('startAuctionBtn').disabled = true;
    } else {
        checkStatus.innerHTML = `<p class="success">READY TO START! ${players.length} PLAYERS AND ${managers.length} MANAGERS REGISTERED.</p>`;
        document.getElementById('startAuctionBtn').disabled = false;
    }
}

// Download purchase report as PDF
function downloadPurchaseReport() {
    try {
        // Initialize jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Set initial y position
        let y = 20;
        
        // Add title
        doc.setFontSize(16);
        doc.setTextColor(0, 102, 204); // Blue title
        doc.text('Auction Purchase Report', 105, y, { align: 'center' });
        y += 20;
        
        // Add date
        doc.setFontSize(12);
        doc.setTextColor(102, 102, 102); // Gray date
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, y);
        y += 15;

        // Function to draw table line
        function drawLine(y) {
            doc.line(20, y, 190, y);
        }

        // Function to draw vertical line
        function drawVerticalLine(x, startY, endY) {
            doc.line(x, startY, x, endY);
        }

        // Function to format price
        function formatPrice(price) {
            return price !== undefined && price !== null ? price.toString() : '0';
        }

        // Manager Totals Box First
        doc.setFillColor(51, 153, 255); // Bright blue header
        doc.rect(20, y, 170, 10, 'F');
        doc.setFont(undefined, 'bold');
        doc.setTextColor(255, 255, 255); // White text
        doc.text('Manager Total Expenses', 105, y + 7, { align: 'center' });
        y += 10;
        drawLine(y);

        let managerTotalsStartY = y;
        managers.forEach((manager, index) => {
            if (index % 2 === 1) {
                doc.setFillColor(230, 242, 255); // Light blue rows
            } else {
                doc.setFillColor(255, 255, 255); // White rows
            }
            doc.rect(20, y, 170, 10, 'F');
            
            let total = 0;
            if (manager.purchasedPlayers) {
                total = manager.purchasedPlayers.reduce((sum, player) => sum + (player.soldPrice || 0), 0);
            }
            doc.setFont(undefined, 'normal');
            doc.setTextColor(51, 51, 51); // Dark gray text
            doc.text(manager.name || '', 30, y + 7);
            doc.text(formatPrice(total), 160, y + 7, { align: 'right' });
            y += 10;
            drawLine(y);
        });

        // Draw vertical lines for manager totals
        drawVerticalLine(20, managerTotalsStartY, y);
        drawVerticalLine(190, managerTotalsStartY, y);

        y += 20; // Add space before player table

        // Players Table
        doc.setFillColor(46, 139, 87); // Sea green header
        doc.rect(20, y, 170, 10, 'F');
        doc.setFont(undefined, 'bold');
        doc.setTextColor(255, 255, 255); // White text
        doc.text('Manager Name', 25, y + 7);
        doc.text('Player Name', 95, y + 7);
        doc.text('Bid Amount', 160, y + 7, { align: 'right' });
        y += 10;
        drawLine(y);

        // Reset font
        doc.setFont(undefined, 'normal');

        // Table content
        let tableStartY = y;
        managers.forEach(manager => {
            if (manager.purchasedPlayers && manager.purchasedPlayers.length > 0) {
                manager.purchasedPlayers.forEach((player, index) => {
                    // Draw row background for alternate rows
                    if (index % 2 === 1) {
                        doc.setFillColor(220, 240, 230); // Light green rows
                    } else {
                        doc.setFillColor(255, 255, 255); // White rows
                    }
                    doc.rect(20, y, 170, 10, 'F');

                    // Add manager name only for first player
                    if (index === 0) {
                        doc.setTextColor(51, 51, 51); // Dark gray text
                        doc.text(manager.name || '', 25, y + 7);
                    }
                    doc.setTextColor(51, 51, 51); // Dark gray text
                    doc.text(player.name || '', 95, y + 7);
                    doc.text(formatPrice(player.soldPrice), 160, y + 7, { align: 'right' });
                    
                    y += 10;
                    drawLine(y);

                    // Add new page if needed
                    if (y > 270) {
                        // Draw vertical lines for current page
                        drawVerticalLine(20, tableStartY, y);
                        drawVerticalLine(70, tableStartY, y);
                        drawVerticalLine(140, tableStartY, y);
                        drawVerticalLine(190, tableStartY, y);
                        
                        // Add new page
                        doc.addPage();
                        y = 20;
                        tableStartY = y;
                        
                        // Draw header in new page
                        doc.setFillColor(46, 139, 87); // Sea green header
                        doc.rect(20, y, 170, 10, 'F');
                        doc.setTextColor(255, 255, 255); // White text
                        doc.text('Manager Name', 25, y + 7);
                        doc.text('Player Name', 95, y + 7);
                        doc.text('Bid Amount', 160, y + 7, { align: 'right' });
                        doc.setFont(undefined, 'normal');
                        y += 10;
                        drawLine(y);
                    }
                });
                y += 5; // Add small space between different managers
            }
        });

        // Draw final vertical lines
        drawVerticalLine(20, tableStartY, y - 5);
        drawVerticalLine(70, tableStartY, y - 5);
        drawVerticalLine(140, tableStartY, y - 5);
        drawVerticalLine(190, tableStartY, y - 5);

        // Add unsold players table if any exist
        const unsoldPlayers = players.filter(p => !p.sold);
        if (unsoldPlayers.length > 0) {
            y += 10;
            doc.setFont(undefined, 'bold');
            doc.setTextColor(204, 51, 0); // Orange-red text
            doc.text('Unsold Players', 105, y, { align: 'center' });
            y += 10;

            // Unsold players table header
            doc.setFillColor(255, 102, 102); // Light red header
            doc.rect(50, y, 100, 10, 'F');
            doc.setTextColor(255, 255, 255); // White text
            doc.text('Player Name', 100, y + 7, { align: 'center' });
            y += 10;
            drawLine(y);

            let unsoldTableStartY = y;
            // Unsold players list
            unsoldPlayers.forEach((player, index) => {
                if (index % 2 === 1) {
                    doc.setFillColor(255, 235, 235); // Very light red rows
                } else {
                    doc.setFillColor(255, 255, 255); // White rows
                }
                doc.rect(50, y, 100, 10, 'F');
                doc.setFont(undefined, 'normal');
                doc.setTextColor(51, 51, 51); // Dark gray text
                doc.text(player.name || '', 100, y + 7, { align: 'center' });
                y += 10;
                drawLine(y);

                // Add new page if needed
                if (y > 270) {
                    // Draw vertical lines for current page
                    drawVerticalLine(50, unsoldTableStartY, y);
                    drawVerticalLine(150, unsoldTableStartY, y);
                    
                    // Add new page
                    doc.addPage();
                    y = 20;
                    unsoldTableStartY = y;
                    
                    // Draw header in new page
                    doc.setFillColor(255, 102, 102); // Light red header
                    doc.rect(50, y, 100, 10, 'F');
                    doc.setTextColor(255, 255, 255); // White text
                    doc.text('Player Name', 100, y + 7, { align: 'center' });
                    doc.setFont(undefined, 'normal');
                    y += 10;
                    drawLine(y);
                }
            });

            // Draw final vertical lines
            drawVerticalLine(50, unsoldTableStartY, y - 5);
            drawVerticalLine(150, unsoldTableStartY, y - 5);
        }
        
        // Save the PDF
        doc.save('auction_report.pdf');
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF report. Please make sure all data is valid.');
    }
}

// Mark player as sold
function markAsSold() {
    if (!currentHighestBidder) {
        alert('No valid bid to mark as sold');
        return;
    }

    const manager = managers.find(m => m.name === currentHighestBidder);
    const player = players[currentPlayerIndex];

    if (!manager || !player) {
        alert('Error: Manager or player not found');
        return;
    }

    // Update manager's budget and purchased players
    manager.budget -= currentBid;
    if (!manager.purchasedPlayers) {
        manager.purchasedPlayers = [];
    }
    manager.purchasedPlayers.push({
        name: player.name,
        soldPrice: currentBid
    });

    // Mark player as sold
    player.sold = true;
    player.soldTo = currentHighestBidder;
    player.soldPrice = currentBid;

    // Save changes
    saveData();
    
    // Hide both buttons
    document.getElementById('soldButton').style.display = 'none';
    document.getElementById('unsoldButton').style.display = 'none';

    // Move to next player
    showNextPlayer();
}

// Mark player as unsold
function markAsUnsold() {
    const player = players[currentPlayerIndex];
    if (!player) {
        alert('Error: Player not found');
        return;
    }

    // Mark player as unsold and move to end of the list
    player.sold = false;
    player.soldTo = null;
    player.soldPrice = null;
    
    // Remove from current position and add to end
    players.splice(currentPlayerIndex, 1);
    players.push(player);
    
    // Save changes
    saveData();
    
    // Hide both buttons
    document.getElementById('soldButton').style.display = 'none';
    document.getElementById('unsoldButton').style.display = 'none';
    
    // Move to next player
    currentPlayerIndex--; // Decrement because showNextPlayer will increment
    showNextPlayer();
}

// Function to refresh data and update displays
function refreshData() {
    const oldManagers = [...managers]; // Store current managers
    const oldPlayers = [...players]; // Store current players
    
    loadData();
    
    // Only update displays if data has actually changed
    if (JSON.stringify(oldManagers) !== JSON.stringify(managers)) {
        updateManagersList();
    }
    if (JSON.stringify(oldPlayers) !== JSON.stringify(players)) {
        updatePlayersList();
    }
    checkRegistrationStatus();
}

// Initialize the auction page
window.addEventListener('DOMContentLoaded', () => {
    loadData();
    setInterval(refreshData, 2000);
});