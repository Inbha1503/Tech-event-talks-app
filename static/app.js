document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const refreshBtn = document.getElementById('refresh-btn');
    const updateCount = document.getElementById('update-count');
    const errorAlert = document.getElementById('error-alert');
    const retryBtn = document.getElementById('retry-btn');
    const loadingSkeleton = document.getElementById('loading-skeleton');
    const feedList = document.getElementById('feed-list');
    const tweetTextarea = document.getElementById('tweet-textarea');
    const charCounter = document.getElementById('char-counter');
    const tweetBtn = document.getElementById('tweet-btn');

    let allReleases = [];
    let selectedUpdateId = null;

    // Fetch and render data
    async function loadReleases() {
        showLoading(true);
        errorAlert.classList.add('hidden');
        
        try {
            const response = await fetch('/api/releases');
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            if (data.error) throw new Error(data.error);

            allReleases = processReleases(data.entries);
            renderFeed(allReleases);
            updateCount.textContent = `${allReleases.length} updates`;
        } catch (error) {
            console.error('Error fetching release notes:', error);
            errorAlert.classList.remove('hidden');
            feedList.innerHTML = '';
            updateCount.textContent = 'Error';
        } finally {
            showLoading(false);
        }
    }

    // Process flat Atom feed entries into atomic, selectable updates
    function processReleases(entries) {
        const processed = [];
        let uniqueIdCounter = 0;

        entries.forEach(entry => {
            const dateStr = entry.title || 'Recent Update';
            const rawContent = entry.content || '';
            const link = entry.link || 'https://cloud.google.com/bigquery/docs/release-notes';

            // Parse HTML content to extract individual <h3> headed sections
            const parser = new DOMParser();
            const doc = parser.parseFromString(rawContent, 'text/html');
            const children = Array.from(doc.body.childNodes);

            let currentType = 'Announcement';
            let currentNodes = [];

            function flushUpdate() {
                if (currentNodes.length > 0) {
                    // Create temporary element to hold nodes and serialize to HTML
                    const container = document.createElement('div');
                    currentNodes.forEach(node => container.appendChild(node.cloneNode(true)));
                    
                    const htmlContent = container.innerHTML.trim();
                    const textContent = container.textContent.trim().replace(/\s+/g, ' ');

                    if (htmlContent) {
                        processed.push({
                            id: `update-${uniqueIdCounter++}`,
                            date: dateStr,
                            type: currentType,
                            html: htmlContent,
                            text: textContent,
                            link: link
                        });
                    }
                    currentNodes = [];
                }
            }

            children.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === 'h3') {
                    flushUpdate();
                    currentType = node.textContent.trim();
                } else {
                    currentNodes.push(node);
                }
            });
            flushUpdate();
        });

        return processed;
    }

    // Render feed to the screen
    function renderFeed(updates) {
        if (updates.length === 0) {
            feedList.innerHTML = '<div class="card"><p style="text-align: center; color: var(--text-muted);">No release updates found.</p></div>';
            return;
        }

        // Group updates by date
        const groups = {};
        updates.forEach(up => {
            if (!groups[up.date]) {
                groups[up.date] = [];
            }
            groups[up.date].push(up);
        });

        feedList.innerHTML = '';

        Object.keys(groups).forEach(date => {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'release-group';

            const header = document.createElement('div');
            header.className = 'release-date-header';
            header.textContent = date;
            groupDiv.appendChild(header);

            groups[date].forEach(up => {
                const card = document.createElement('div');
                card.className = `update-card ${selectedUpdateId === up.id ? 'selected' : ''}`;
                card.dataset.id = up.id;

                const typeClass = `type-${up.type.toLowerCase()}`;
                
                card.innerHTML = `
                    <div class="update-meta">
                        <span class="update-type-tag ${typeClass}">${up.type}</span>
                        <button class="quick-tweet-btn" title="Tweet this directly" aria-label="Tweet this update">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="update-content">${up.html}</div>
                `;

                // Quick tweet icon click handler
                const quickTweet = card.querySelector('.quick-tweet-btn');
                quickTweet.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectUpdate(up);
                    openTwitterIntent();
                });

                // Select update on card click
                card.addEventListener('click', () => {
                    selectUpdate(up);
                });

                groupDiv.appendChild(card);
            });

            feedList.appendChild(groupDiv);
        });
    }

    // Select and focus update for Tweet
    function selectUpdate(update) {
        selectedUpdateId = update.id;
        
        // Update styling of cards
        document.querySelectorAll('.update-card').forEach(card => {
            if (card.dataset.id === update.id) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });

        // Generate Tweet Content
        let typePrefix = `[BigQuery ${update.type}] `;
        if (update.type === 'Announcement') typePrefix = '[BigQuery] ';
        
        // Clean text content for tweet
        let bodyText = update.text;
        
        // Build the text draft
        // Character count budget: 280 - (prefix length) - (link length + safety) - (hashtags)
        // Twitter/X counts all links as 23 characters.
        const linkText = `\n\nRelease notes: ${update.link}`;
        const hashtags = `\n#BigQuery #GoogleCloud`;
        
        const reservedLength = typePrefix.length + 23 + 2 + hashtags.length + 2; // link + spacings + tags
        const maxBodyLength = 280 - reservedLength;
        
        if (bodyText.length > maxBodyLength) {
            bodyText = bodyText.substring(0, maxBodyLength - 3) + '...';
        }

        const draftTweet = `${typePrefix}${bodyText}${linkText}${hashtags}`;
        
        tweetTextarea.value = draftTweet;
        updateCharCounter();
        tweetBtn.disabled = false;
    }

    // Update Tweet button state & character counter
    function updateCharCounter() {
        const text = tweetTextarea.value;
        
        // Twitter url counting logic: Any url is treated as 23 chars.
        // We do a simple regex find to adjust length accordingly.
        const urlRegex = /https?:\/\/[^\s]+/g;
        let adjustedLength = text.length;
        const urls = text.match(urlRegex) || [];
        
        urls.forEach(url => {
            adjustedLength = adjustedLength - url.length + 23;
        });

        const remaining = 280 - adjustedLength;
        charCounter.textContent = remaining;

        if (remaining < 0) {
            charCounter.className = 'char-counter danger';
            tweetBtn.disabled = true;
        } else if (remaining < 20) {
            charCounter.className = 'char-counter warning';
            tweetBtn.disabled = false;
        } else {
            charCounter.className = 'char-counter';
            tweetBtn.disabled = text.trim().length === 0;
        }
    }

    // Open standard Twitter Intent
    function openTwitterIntent() {
        const text = tweetTextarea.value;
        if (!text.trim()) return;

        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    }

    // Toggle loading states
    function showLoading(isLoading) {
        if (isLoading) {
            refreshBtn.classList.add('refreshing');
            refreshBtn.disabled = true;
            loadingSkeleton.classList.remove('hidden');
            feedList.classList.add('hidden');
        } else {
            refreshBtn.classList.remove('refreshing');
            refreshBtn.disabled = false;
            loadingSkeleton.classList.add('hidden');
            feedList.classList.remove('hidden');
        }
    }

    // Event Listeners
    refreshBtn.addEventListener('click', loadReleases);
    retryBtn.addEventListener('click', loadReleases);
    tweetTextarea.addEventListener('input', updateCharCounter);
    
    tweetBtn.addEventListener('click', openTwitterIntent);

    // Initial load
    loadReleases();
});
