// Prices of food items: [half plate, full plate]
var prices = {
    "Veg Thali": [40, 70],
    "Rajma Rice": [35, 60],
    "Chole Bhature": [40, 65],
    "Fried Rice": [45, 75],
    "Maggi": [25, 40],
    "Sandwich": [30, 50]
};

var preparationTimes = {
    "Veg Thali": 15,
    "Rajma Rice": 12,
    "Chole Bhature": 15,
    "Fried Rice": 10,
    "Maggi": 8,
    "Sandwich": 10
};
function getWaitMinutes(food, quantity) {
    if (!preparationTimes[food]) {
        return 0;
    }
    return preparationTimes[food] + Math.max(0, quantity - 1) * 3;
}
function updateWaitTime() {
    var food = foodInput.value;
    var quantity = Number(quantityInput.value);
    var minutes = getWaitMinutes(food, quantity);
    document.getElementById("formEta").textContent = minutes ? "Estimated preparation: " + minutes + " minutes" : "Select a food item to see preparation time.";

}
var form = document.getElementById("bookingForm");
var foodInput = document.getElementById("food");
var plateInput = document.getElementById("plate");
var quantityInput = document.getElementById("quantity");

// Calculate the price when a student changes their selection
function calculateTotal() {
    var food = foodInput.value;
    var plate = plateInput.value;
    var quantity = Number(quantityInput.value);
    var total = 0;

    if (food !== "" && quantity >= 1 && quantity <= 10) {
        if (plate === "Half") {
            total = prices[food][0] * quantity;
        } else {
            total = prices[food][1] * quantity;
        }
    }
    document.getElementById("total").textContent = "Total Amount: ₹" + total;
    updateWaitTime();
    return total;
}

foodInput.addEventListener("change", calculateTotal);
plateInput.addEventListener("change", calculateTotal);
quantityInput.addEventListener("input", calculateTotal);

// Read the bookings stored in this browser
function getBookings() {
    var saved = localStorage.getItem("mealflowBookings");
    if (saved === null) {
        return [];
    }
    try {
        var bookings = JSON.parse(saved);
        if (Array.isArray(bookings)) return bookings;
    } catch (error) {
        return [];
    }
    return [];
}

// Save a new token when the form is submitted
form.addEventListener("submit", function(event) {
    event.preventDefault();

    var name = document.getElementById("studentName").value.trim();
    var roll = document.getElementById("rollNumber").value.trim();
    var food = foodInput.value;
    var plate = plateInput.value;
    var quantity = Number(quantityInput.value);

    if (name === "" || roll === "" || food === "" || quantity < 1 || quantity > 10 || !Number.isInteger(quantity)) {
        alert("Please fill all details correctly.");
        return;
    }

    var bookings = getBookings();
    var tokenNumber = Date.now().toString();
    var booking = {
        id: tokenNumber,
        name: name,
        roll: roll,
        food: food,
        plate: plate,
        quantity: quantity,
        amount: calculateTotal(),
        date: new Date().toLocaleString(),
        waiting: getWaitMinutes(food, quantity),
        readyBy: new Date(Date.now() + getWaitMinutes(food, quantity) * 60000).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        })
    };

    bookings.push(booking);
    localStorage.setItem("mealflowBookings", JSON.stringify(bookings));
    document.getElementById("message").textContent = "Token booked successfully! Token No: " + tokenNumber;
    form.reset();
    calculateTotal();
    showTokens();
});

// Show all tokens using a simple loop
function showTokens() {
    var bookings = getBookings();
    var list = document.getElementById("tokenList");
    document.getElementById("tokenCount").textContent = bookings.length;
    document.getElementById("clearTokens").disabled = bookings.length === 0;
    list.innerHTML = "";

    if (bookings.length === 0) {
        list.textContent = "No tokens booked yet.";
        return;
    }

    for (var i = 0; i < bookings.length; i++) {
        var b = bookings[i];
        var card = document.createElement("div");
        card.className = "token";

        var title = document.createElement("h3");
        title.textContent = "Token No: " + b.id;
        card.appendChild(title);

        var details = [
            "Name: " + b.name + " (" + b.roll + ")",
            "Food: " + b.food + " - " + b.plate + " Plate",
            "Quantity: " + b.quantity,
            "Amount: ₹" + b.amount,
            "Estimated preparation: " + (b.waiting || getWaitMinutes(b.food, b.quantity)) + " minutes",
            "Estimated ready by: " + (b.readyBy || "Not available"),
            "Booked on: " + b.date
        ];

        for (var j = 0; j < details.length; j++) {
            var paragraph = document.createElement("p");
            paragraph.textContent = details[j];
            card.appendChild(paragraph);
        }

        var button = document.createElement("button");
        button.textContent = "Cancel Token";
        button.className = "cancel-button";
        button.setAttribute("data-id", b.id);
        button.addEventListener("click", function() {
            cancelToken(this.getAttribute("data-id"));
        });
        card.appendChild(button);
        list.appendChild(card);
    }
}

function cancelToken(id) {
    if (!confirm("Do you want to cancel this token?")) return;
    var bookings = getBookings();
    var remaining = [];

    for (var i = 0; i < bookings.length; i++) {
        if (bookings[i].id !== id) {
            remaining.push(bookings[i]);
        }
    }

    localStorage.setItem("mealflowBookings", JSON.stringify(remaining));
    showTokens();
}

calculateTotal();
showTokens();

// Menu search and category buttons
var searchBox = document.getElementById("menuSearch");
var filters = document.querySelectorAll(".filter");
var currentFilter = "all";
function filterMenu() {
    var search = searchBox.value.toLowerCase().trim();
    var cards = document.querySelectorAll(".food-card");
    var shown = 0;
    for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        var matchesName = card.getAttribute("data-food").indexOf(search) !== -1;
        var matchesType = currentFilter === "all" || card.getAttribute("data-category") === currentFilter;
        card.style.display = matchesName && matchesType ? "" : "none";
        if (matchesName && matchesType) shown++;
    }
    document.getElementById("noFood").hidden = shown !== 0;
}
searchBox.addEventListener("input", filterMenu);
for (var i = 0; i < filters.length; i++) {
    filters[i].addEventListener("click", function() {
        currentFilter = this.getAttribute("data-filter");
        for (var j = 0; j < filters.length; j++) filters[j].classList.remove("active");
        this.classList.add("active");
        filterMenu();
    });
}
// Clicking Order Now chooses the item in the booking form
var orderButtons = document.querySelectorAll(".order-button");
for (var i = 0; i < orderButtons.length; i++) {
    orderButtons[i].addEventListener("click", function() {
        foodInput.value = this.getAttribute("data-item");
        calculateTotal();
        document.getElementById("booking").scrollIntoView({behavior:"smooth"});
        document.getElementById("studentName").focus({preventScroll:true});
    });
}
// Cancel all saved demo tokens
var clearButton = document.getElementById("clearTokens");
clearButton.addEventListener("click", function() {
    if (getBookings().length === 0) return;
    if (confirm("Cancel all saved tokens?")) {
        localStorage.setItem("mealflowBookings", "[]");
        showTokens();
    }
});
