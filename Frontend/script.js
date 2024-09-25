
  document.addEventListener('DOMContentLoaded', () => {
    const mapBtn = document.getElementById('mapBtn');
    const mapModal = document.getElementById('mapModal');
    const closeModal = mapModal.querySelector('.close');
    const selectLocationBtn = document.getElementById('selectLocation');
    const locationInput = document.getElementById('location');
    const searchBox = document.getElementById('searchBox');
    let mapInitialized = false;
    let map, marker;

    // Initialize Leaflet Map with Satellite View
    function initMap() {
        const defaultLocation = [20.2961, 85.8245]; // Bhubaneswar coordinates
        if (!mapInitialized) {
            map = L.map('map').setView(defaultLocation, 13);

            // Add satellite tile layer from Esri
            const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 19,
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            });

            // Add OpenStreetMap tile layer
            const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; OpenStreetMap contributors'
            });

            // Add layer control to switch between satellite and OSM
            const baseMaps = {
                "Satellite": satellite,
                "Street Map": osm
            };
            osm.addTo(map); // Add OSM layer by default
            L.control.layers(baseMaps).addTo(map);

            marker = L.marker(defaultLocation, { draggable: true }).addTo(map);

            // Update input on marker drag end
            marker.on('dragend', function () {
                const pos = marker.getLatLng();
                fetchAddress(pos.lat, pos.lng);
            });

            // Update marker position and input on map click
            map.on('click', function (e) {
                marker.setLatLng(e.latlng);
                fetchAddress(e.latlng.lat, e.latlng.lng);
            });

            mapInitialized = true;
        }
    }

    // Fetch address from coordinates using Nominatim
    function fetchAddress(lat, lng) {
      document.getElementById('spinner-overlay').style.display = 'flex';
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
            .then(response => response.json())
            .then(data => {
                if (data && data.display_name) {
                    locationInput.value = data.display_name;
                } else {
                    locationInput.value = "Location not found";
                }
                document.getElementById('spinner-overlay').style.display = 'none';
            })
            .catch(err => {
                console.error('Error fetching address:', err);
                locationInput.value = "Error fetching address";
                document.getElementById('spinner-overlay').style.display = 'none';
            });
    }

    // Open Map Modal
    mapBtn.addEventListener('click', () => {
        mapModal.style.display = 'flex';
        initMap();
    });

    // Close Map Modal
    closeModal.onclick = function () {
        mapModal.style.display = 'none';
    };

    // Select Location from Map
    selectLocationBtn.addEventListener('click', () => {
        const pos = marker.getLatLng();
        fetchAddress(pos.lat, pos.lng);
        mapModal.style.display = 'none';
    });

});
  