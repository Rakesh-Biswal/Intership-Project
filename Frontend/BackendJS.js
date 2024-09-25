
document.getElementById('whatYouWant').addEventListener('change', function () {
    let sellContainer = document.getElementById('sellContainer');
    let replaceContainer = document.getElementById('replaceContainer');
    let donationContainer = document.getElementById('donationContainer');

    // Hide all containers initially
    sellContainer.classList.add('hidden');
    replaceContainer.classList.add('hidden');
    donationContainer.classList.add('hidden');

    // Show the correct container based on selection
    switch (this.value) {
        case 'Sell':
            sellContainer.classList.remove('hidden');
            break;
        case 'Replace':
            replaceContainer.classList.remove('hidden');
            break;
        case 'Donation':
            donationContainer.classList.remove('hidden');
            break;
    }
});
