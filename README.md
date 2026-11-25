# Portfolio site

A single-page portfolio: plain HTML, CSS and a little JavaScript. No build step, nothing to install.

## Preview
Double-click `index.html`. (Fonts load from Google Fonts, so you need to be online to see them.)

## Before you publish
1. Export your resume as a PDF and save it in this folder as `Resume.pdf`. The Resume buttons link to it.
2. Search `index.html` for `TODO`. Two spots: your LinkedIn link (uncomment it) and an optional graduation date.
3. Check the email address and the About paragraph, and change anything that is not true for you.

## Publish on Vercel
1. Put this folder on GitHub (VS Code: Source Control, Initialize Repository, Commit, Publish to GitHub).
2. On vercel.com choose Add New, Project, and import the repo.
3. Framework preset: Other. Leave the build command empty. Deploy.

## Files
- `index.html`: all the content
- `styles.css`: colours, type and layout (tokens are at the top)
- `script.js`: the comment pins and the nav highlight

## Other files
- `404.html`: shown by Vercel for pages that do not exist. To preview it, run `python3 -m http.server 8000` in this folder and open http://localhost:8000/404.html
- `humans.txt`: credits for the site, linked from the page head
