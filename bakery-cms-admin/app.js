// =========================================================================
        // DEVELOPER: PASTE YOUR CLIENT ID HERE!
        // =========================================================================
        const CLIENT_ID = '748666461246-codueraeqkgtsuik0m8a0rsd9dpfigo1.apps.googleusercontent.com'; 
        // =========================================================================

        const SCOPES = 'https://www.googleapis.com/auth/drive.file';

        let tokenClient;
        let accessToken = null;
        let fullData = null;
        let dataFileId = null; // ID of cms-data.json in Drive

        // Default Data Structure
        const defaultData = {
            "categories": [
                { "id": 1, "name": "Bread", "icon": "https://cdn-icons-png.flaticon.com/512/3014/3014457.png" },
                { "id": 2, "name": "Cakes & Pies", "icon": "https://cdn-icons-png.flaticon.com/512/2666/2666649.png" },
                { "id": 3, "name": "Cookies", "icon": "https://cdn-icons-png.flaticon.com/512/575/575396.png" },
                { "id": 4, "name": "Pastries", "icon": "https://cdn-icons-png.flaticon.com/512/2916/2916301.png" }
            ],
            "menuItems": [
                { "id": 1, "title": "Custom Theme Cake", "desc": "Handcrafted 2-tier chocolate cake", "price": "$45", "img": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80" },
                { "id": 2, "title": "Signature Brownies", "desc": "Gooey, rich chocolate brownies", "price": "$15", "img": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80" }
            ],
            "welcome": {
                "text": "Family-owned and operated, Cakebakebybesties is your premier home bakery."
            },
            "seasonal": {
                "title": "Seasonal Selections",
                "subtitle": "Summertime Specialties",
                "items": ["• Lemon Squares", "• Strawberry Shortcake"],
                "image": "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?auto=format&fit=crop&w=600&q=80"
            },
            "instagram": [
                "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=400&q=80",
                "https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=400&q=80"
            ]
        };

        function gisLoaded() {
            if(CLIENT_ID === 'YOUR_CLIENT_ID_HERE') return;
            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: (tokenResponse) => {
                    if (tokenResponse.error !== undefined) {
                        throw (tokenResponse);
                    }
                    accessToken = tokenResponse.access_token;
                    document.getElementById('login-section').style.display = 'none';
                    document.getElementById('app-content').style.display = 'block';
                    loadOrCreateDataFile();
                },
            });
            document.getElementById('setup-card').style.display = 'none';
        }

        document.getElementById('auth-btn').onclick = () => {
            if(!tokenClient) {
                alert("Please add your Client ID to the code first!");
                return;
            }
            tokenClient.requestAccessToken({prompt: 'consent'});
        };

        // --- Drive Operations (using fetch) ---

        async function loadOrCreateDataFile() {
            showStatus("Looking for database in your Google Drive...", "success");
            try {
                const query = encodeURIComponent("name='cms-data.json' and trashed=false");
                const response = await fetch('https://www.googleapis.com/drive/v3/files?q=' + query + '&fields=files(id,name)&spaces=drive', {
                    headers: { 'Authorization': 'Bearer ' + accessToken }
                });
                const data = await response.json();
                
                if (data.files && data.files.length > 0) {
                    dataFileId = data.files[0].id;
                    await downloadDataFile(dataFileId);
                } else {
                    await createInitialDataFile();
                }
            } catch (err) {
                showStatus("Error accessing Google Drive. " + err.message, "error");
            }
        }

        async function downloadDataFile(fileId) {
            try {
                const response = await fetch('https://www.googleapis.com/drive/v3/files/' + fileId + '?alt=media', {
                    headers: { 'Authorization': 'Bearer ' + accessToken }
                });
                fullData = await response.json();
                renderForm(fullData);
                showStatus("Database loaded! Database ID: " + fileId + " (Put this in script.js on main site)", "success");
            } catch (err) {
                showStatus("Error reading data file.", "error");
            }
        }

        async function createInitialDataFile() {
            showStatus("Creating new database file...", "success");
            const boundary = '-------314159265358979323846';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "--";

            const metadata = {
                'name': 'cms-data.json',
                'mimeType': 'application/json'
            };

            const multipartRequestBody =
                delimiter +
                'Content-Type: application/json\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                'Content-Type: application/json\r\n\r\n' +
                JSON.stringify(defaultData, null, 2) +
                close_delim;

            try {
                const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + accessToken,
                        'Content-Type': 'multipart/related; boundary="' + boundary + '"'
                    },
                    body: multipartRequestBody
                });
                
                const data = await response.json();
                dataFileId = data.id;
                
                await makeFilePublic(dataFileId);

                fullData = defaultData;
                renderForm(fullData);
                showStatus("Created new database! Database ID: " + dataFileId + " (Put this in script.js on main site)", "success");

            } catch (err) {
                showStatus("Error creating file.", "error");
            }
        }

        async function saveChanges() {
            if (!fullData || !dataFileId) return;
            showStatus("Publishing changes to Google Drive...", "success");

            fullData.welcome.text = document.getElementById('welcomeText').value;

            fullData.menuItems.forEach((item, index) => {
                item.title = document.getElementById('menu_title_' + index).value;
                item.desc = document.getElementById('menu_desc_' + index).value;
                item.price = document.getElementById('menu_price_' + index).value;
                item.img = document.getElementById('menu_img_' + index).value;
            });

            fullData.instagram.forEach((img, index) => {
                fullData.instagram[index] = document.getElementById('insta_img_' + index).value;
            });

            try {
                const response = await fetch('https://www.googleapis.com/upload/drive/v3/files/' + dataFileId + '?uploadType=media', {
                    method: 'PATCH',
                    headers: {
                        'Authorization': 'Bearer ' + accessToken,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(fullData)
                });
                
                if(!response.ok) throw new Error("Failed to upload");
                
                showStatus("Changes published live successfully!", "success");
            } catch(err) {
                showStatus("Error publishing changes.", "error");
            }
        }

        async function makeFilePublic(fileId) {
            await fetch('https://www.googleapis.com/drive/v3/files/' + fileId + '/permissions', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + accessToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'anyone',
                    role: 'reader'
                })
            });
        }

        // --- UI Rendering & Drag Drop ---

        function renderForm(data) {
            document.getElementById('welcomeText').value = data.welcome.text;

            const menuList = document.getElementById('menuItemsList');
            menuList.innerHTML = '';
            data.menuItems.forEach((item, index) => {
                menuList.innerHTML += '<div class="item-group">' +
    '<h3 class="item-title">Item ' + (index + 1) + '</h3>' +
    '<label>Title</label>' +
    '<input type="text" id="menu_title_' + index + '" value="' + item.title + '">' +
    '<label>Description</label>' +
    '<input type="text" id="menu_desc_' + index + '" value="' + item.desc + '">' +
    '<label>Price</label>' +
    '<input type="text" id="menu_price_' + index + '" value="' + item.price + '">' +
    '<label>Image URL (or Drag & Drop below)</label>' +
    '<input type="text" id="menu_img_' + index + '" value="' + item.img + '">' +
    '<div class="drop-zone" data-target="menu_img_' + index + '">' +
        'Drop image here to upload to Google Drive' +
        '<img src="' + item.img + '" class="image-preview" id="preview_menu_img_' + index + '">' +
    '</div>' +
'</div>';
            });

            const instaList = document.getElementById('instagramList');
            instaList.innerHTML = '';
            data.instagram.forEach((img, index) => {
                instaList.innerHTML += '<div class="item-group">' +
    '<label>Instagram Image ' + (index + 1) + ' URL</label>' +
    '<input type="text" id="insta_img_' + index + '" value="' + img + '">' +
    '<div class="drop-zone" data-target="insta_img_' + index + '">' +
        'Drop image here to upload to Google Drive' +
        '<img src="' + img + '" class="image-preview" id="preview_insta_img_' + index + '">' +
    '</div>' +
'</div>';
            });

            setupDragAndDrop();
        }

        function setupDragAndDrop() {
            const dropZones = document.querySelectorAll('.drop-zone');
            
            dropZones.forEach(zone => {
                zone.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    zone.classList.add('dragover');
                });
                
                zone.addEventListener('dragleave', () => {
                    zone.classList.remove('dragover');
                });
                
                zone.addEventListener('drop', async (e) => {
                    e.preventDefault();
                    zone.classList.remove('dragover');
                    
                    const file = e.dataTransfer.files[0];
                    if(!file || !file.type.startsWith('image/')) {
                        alert("Please drop a valid image file.");
                        return;
                    }

                    const targetInputId = zone.getAttribute('data-target');
                    zone.innerHTML = "Uploading to Google Drive... Please wait.";

                    try {
                        const url = await uploadImageToDrive(file);
                        document.getElementById(targetInputId).value = url;
                        zone.innerHTML = 'Drop image here to upload to Google Drive<img src="' + url + '" class="image-preview">';
                    } catch(err) {
                        alert("Upload failed: " + err.message);
                        zone.innerHTML = "Drop image here to upload to Google Drive";
                    }
                });
            });
        }

        async function uploadImageToDrive(file) {
            return new Promise((resolve, reject) => {
                const metadata = {
                    'name': file.name,
                    'mimeType': file.type
                };

                const form = new FormData();
                form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
                form.append('file', file);

                fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + accessToken
                    },
                    body: form
                })
                .then(res => res.json())
                .then(async data => {
                    await makeFilePublic(data.id);
                    const publicUrl = 'https://drive.google.com/uc?export=view&id=' + data.id;
                    resolve(publicUrl);
                })
                .catch(err => reject(err));
            });
        }

        function showStatus(msg, type) {
            const el = document.getElementById('status');
            el.style.display = 'block';
            el.innerText = msg;
            el.className = type;
        }

        document.getElementById('saveBtn').addEventListener('click', saveChanges);
        document.getElementById('saveTopBtn').addEventListener('click', saveChanges);