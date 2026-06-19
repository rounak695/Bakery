document.addEventListener('DOMContentLoaded', () => {
    // Navbar toggle logic
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Video swap logic
    const video = document.getElementById('heroVideo');
    const playBtn = document.getElementById('playButton');
    const videoContainer = document.getElementById('videoContainer');
    const videoSource = document.getElementById('videoSource');

    if (playBtn && video && videoSource && videoContainer) {
        playBtn.addEventListener('click', () => {
            // Swap out the preview video for the full video
            videoSource.src = 'hero section/herosection.mp4';
            video.load(); // Reload the video element with the new source
            
            video.muted = false;
            video.loop = false; // Only play through once for full video
            video.currentTime = 0;
            
            // Add native controls for full playback
            video.setAttribute('controls', 'true');
            
            // Play the full video
            video.play().catch(e => console.error("Playback failed", e));
            
            // Update UI state to hide play button and overlay
            videoContainer.classList.add('playing');
        });

        // Revert to GIF mode when the full video finishes
        video.addEventListener('ended', () => {
            // Swap back to the preview video
            videoSource.src = 'hero section/preview.mp4';
            video.load();
            
            video.muted = true;
            video.loop = true;
            video.removeAttribute('controls');
            
            // Play the GIF mode silently
            video.play().catch(e => console.error("Playback failed on revert", e));
            
            // Show play button and overlay again
            videoContainer.classList.remove('playing');
        });
    }

    // =========================================================================
    // DEVELOPER: PASTE THE CMS DATABASE ID HERE!
    // =========================================================================
    const DATABASE_FILE_ID = 'YOUR_DATABASE_FILE_ID_HERE';
    // =========================================================================

    function renderSite(cmsData) {
        // Render Categories
        const categoriesContainer = document.getElementById('menu-categories');
        if (categoriesContainer && cmsData.categories) {
            categoriesContainer.innerHTML = cmsData.categories.map(cat => `
                <div class="category-item">
                    <img src="${cat.icon}" alt="${cat.name}" class="category-icon">
                    <span class="category-name">${cat.name}</span>
                </div>
            `).join('');
        }

        // Render Menu Grid
        const menuGrid = document.getElementById('menu-grid');
        if (menuGrid && cmsData.menuItems) {
            menuGrid.innerHTML = cmsData.menuItems.map(item => `
                <div class="menu-card">
                    <img src="${item.img}" alt="${item.title}" class="menu-image">
                    <div class="menu-info">
                        <h3>${item.title}</h3>
                        <p>${item.desc}</p>
                        <div class="menu-price">${item.price}</div>
                    </div>
                </div>
            `).join('');
        }

        // Render Welcome
        const welcomeContent = document.getElementById('welcome-content');
        if (welcomeContent && cmsData.welcome) {
            welcomeContent.innerHTML = `<p>${cmsData.welcome.text}</p>`;
        }

        // Render Seasonal
        const seasonalContainer = document.getElementById('seasonal-container');
        if (seasonalContainer && cmsData.seasonal) {
            seasonalContainer.innerHTML = `
                <div class="seasonal-text">
                    <h2 class="seasonal-title">${cmsData.seasonal.title}</h2>
                    <h3 class="seasonal-subtitle">${cmsData.seasonal.subtitle}</h3>
                    <ul class="seasonal-list">
                        ${cmsData.seasonal.items.map(i => `<li>${i}</li>`).join('')}
                    </ul>
                </div>
                <div class="seasonal-image-wrapper">
                    <img src="${cmsData.seasonal.image}" alt="Seasonal Selection" class="seasonal-image">
                </div>
            `;
        }

        // Render Instagram
        const instaGrid = document.getElementById('insta-grid');
        if (instaGrid && cmsData.instagram) {
            instaGrid.innerHTML = cmsData.instagram.map(img => `
                <div class="insta-item">
                    <a href="https://www.instagram.com/cakebakebybesties_/" target="_blank">
                        <img src="${img}" alt="Instagram post">
                    </a>
                </div>
            `).join('');
        }
    }

    // Fetch Live Data from Google Drive API
    if (DATABASE_FILE_ID !== 'YOUR_DATABASE_FILE_ID_HERE') {
        const driveUrl = `https://corsproxy.io/?https://drive.google.com/uc?export=download&id=${DATABASE_FILE_ID}`;
        
        fetch(driveUrl)
            .then(response => {
                if(!response.ok) throw new Error("Failed to fetch from Google Drive. Check your API Key and File ID.");
                return response.json();
            })
            .then(cmsData => {
                renderSite(cmsData);
            })
            .catch(error => console.error("Error loading CMS data:", error));
    } else {
        console.warn("Please enter the Database File ID to fetch live data!");
    }

    // --- CMS LIVE PREVIEW SYNC ---
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CMS_UPDATE') {
            renderSite(event.data.cmsData);
        }
    });

});
