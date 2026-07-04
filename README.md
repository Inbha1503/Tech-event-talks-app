# ⚡ BigQuery Release Notes Hub

A modern, responsive, and beautiful web application that fetches live Google Cloud BigQuery Release Notes, processes them into individual updates, and allows users to easily select and tweet about any specific update.

Built with **Python Flask** on the backend and **vanilla HTML, CSS, and JavaScript** on the frontend.

---

## 🚀 Features

- **Live Fetching**: Pulls live BigQuery release updates directly from Google Cloud's official Atom XML feed (`https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`).
- **Atomic Updates**: Auto-parses the flat feed's multi-section content, separating dates into clean, individual, and interactive cards (e.g. Features, Changes, Deprecations).
- **Interactive Tweet Composer**: Click on any update card to instantly draft a styled tweet with a pre-configured template containing the type, text preview, source release note link, and relevant hashtags.
- **Auto Character Counter**: Dynamically counts characters, accounting for Twitter's 23-character URL standard, warning you if your draft exceeds limits.
- **Rich Dark Theme & Skeleton Screens**: Premium UI designed using glassmorphism, glowing accents, smooth transitions, and animated skeleton loaders.
- **Refresh Control**: Instantly refresh live release notes via a dedicated refresh button with an elegant loading spinner.

---

## 🛠️ Tech Stack

- **Backend**: Python 3, Flask, standard library XML parser (`xml.etree.ElementTree`)
- **Frontend**: Vanilla HTML5, Vanilla CSS3 (Custom Variables, Flexbox/Grid, Animations), Vanilla JavaScript (ES6+, DOMParser, Fetch API)

---

## 📋 Getting Started

### Prerequisites

- Python 3.12+ installed on your machine.
- `pip` package manager.

### Installation & Run

1. Clone or download this project repository.
2. Install the dependencies (Flask):
   ```bash
   pip install flask
   ```
3. Start the application:
   ```bash
   python app.py
   ```
4. Open your browser and navigate to:
   ```
   http://127.0.0.1:5000
   ```

---

## 📂 Project Structure

```
├── app.py                # Flask server and XML parser
├── static/
│   ├── app.js            # Frontend logic (feed processing, tweet creation)
│   └── style.css         # Premium custom styling (glassmorphism UI)
├── templates/
│   └── index.html        # Main HTML entry file
├── .gitignore            # Git exclusion rules
└── README.md             # Project documentation
```

---

## 🐦 How to Tweet an Update

1. Launch the application and click on any update card in the feed.
2. The card will highlight, and the **Tweet Composer** on the right will auto-populate with the update text, source link, and hashtags.
3. Edit the tweet content if desired (the counter will dynamically update).
4. Click **Tweet Update** (or the quick tweet icon on the card itself) to launch a new browser window using Twitter/X's Web Intent to post.

---

## 📄 License

This project is open-source and free to use.
