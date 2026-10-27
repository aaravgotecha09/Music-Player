# Echo — C-Powered DSA Music Management Application

**DSA Mini Project | MBA Tech (IT) | Semester 3**

Project members: **Shreya Bhuia (I013), Jessica Morris (I047), Anushka Pawar (I051)**

**Technology:** Frontend — HTML5, CSS3, vanilla JavaScript. **Backend — C11** (native sockets + real DSA structures). Data — a JSON state file plus uploaded audio files on disk. No Python in the backend.

## Project layout

```
frontend/     Static site (HTML, CSS, JS)            → deploy to Vercel
backend/      C server + Dockerfile                  → deploy to Render
render.yaml   Optional Render Blueprint for backend/
media/        Six bundled test WAV files (not added to the library automatically)
data/         state.json is written here when running locally
tests/        Integration tests (Python is only the test client)
```

## Run locally

**macOS / Linux:** from the project folder run

```bash
bash start_mac_linux.sh
```

**Windows:** install a GCC compiler (MSYS2 MinGW-w64 works), then double-click `start_windows.bat`.

Both scripts compile the C backend and start it on **http://localhost:8000**. That one server also serves the `frontend/` folder, so the app works without any deployment. Keep `frontend/config.js` empty for local use.

To build by hand:

```bash
cc -std=c11 -O2 -o echo_server backend/server.c backend/music.c backend/json.c
./echo_server
```

## Deploy: backend on Render

Render needs a persistent disk to keep uploads and playlists between restarts (see "Memory" below), and disks require a paid instance type. The `starter` plan in `render.yaml` is one such plan.

**Option A — Blueprint (easiest):** push this repo to GitHub, then in Render choose **New → Blueprint**, pick the repo, and apply. Render reads `render.yaml`.

**Option B — manual:** **New → Web Service**, select the repo, then set:

| Setting | Value |
|---|---|
| Runtime | Docker |
| Root Directory | `backend` |
| Dockerfile Path | `./Dockerfile` |
| Instance type | Starter (or any paid type) |
| Health Check Path | `/api/health` |
| Disk | Name `echo-data`, Mount Path `/data`, Size 1 GB |

When it is live, copy the service URL (for example `https://echo-api.onrender.com`).

## Deploy: frontend on Vercel

1. In Vercel choose **Add New → Project**, import the repo.
2. Set **Root Directory** to `frontend`. Framework preset: **Other**. No build command.
3. Before (or after) deploying, open `frontend/config.js` and set your Render URL, with no trailing slash:

   ```js
   window.ECHO_API_BASE = 'https://echo-api.onrender.com';
   ```

4. Commit and push. Vercel redeploys automatically.

Optional: on Render, add an environment variable `CORS_ORIGIN` set to your Vercel URL (for example `https://echo.vercel.app`) so only that site can call the API. The default `*` allows any site.

## Memory: songs and playlists persist

- Every change (adding a song, uploading audio, creating or editing a playlist, favorites, queue) is saved right away. Uploaded audio is stored as a file, and the library is saved to `state.json`.
- **Locally**, these live in `data/` and `media/` inside the project, so they survive closing the app.
- **On Render**, the container's own filesystem is erased on every deploy and restart. The disk mounted at `/data` keeps the data. Without the disk, the library resets.
- No database is needed. A MongoDB setup would require a MongoDB driver in C and separate storage for audio files, which is more moving parts than this project needs.

## Backend settings (environment variables)

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `8000` | Port to listen on. Render sets this for you. |
| `HOST` | `127.0.0.1` | `0.0.0.0` accepts connections from outside (the Dockerfile sets this). |
| `DATA_DIR` | `data` | Folder for `state.json`. Set to `/data` on Render. |
| `MEDIA_DIR` | `media` | Folder for uploaded audio. Set to `/data/media` on Render. |
| `FRONTEND_DIR` | `frontend` | Folder served at `/`. Empty value = API only (used on Render). |
| `CORS_ORIGIN` | `*` | Value of `Access-Control-Allow-Origin`. |

## Features — all powered by the C backend

| Feature | Data structure / algorithm | Where in C source |
|---|---|---|
| Playlist management + next/previous | Doubly linked list | `TrackNode`, `track_insert`, `track_remove`, cached `current_node` in `music.c` |
| Play Next prioritization | FIFO linked queue | `QueueNode`, `enqueue`, `dequeue` |
| Recently played (last 15 unique songs) | Bounded recency array | `recent[15]`, `recent_add` (deduplicates and moves replayed song to newest) |
| Undo playlist editing and shuffle | LIFO stack | `Undo`, `undo_push`, `undo` command |
| Fast search by song ID | Hash table | `bucket[257]`, `hash_id`, `song_by_id` |
| Sort songs alphabetically | Merge sort | `msort`, `music_sorted` |
| Find exact song title | Binary search | `binary_title` on merge-sorted song index |
| Randomize songs | Fisher–Yates shuffle | `shuffle` command |
| Audio playback | HTML `<audio>` | `frontend/app.js` |
| Upload audio | C multipart parser | `backend/server.c` |
| Persist library, history, playlists | JSON state file + audio files | `save_state`, `load_state` in `music.c`; `handle_upload` in `server.c` |

### What is saved?

The song library, audio paths, play counts, favorites, playlists, queue, recent history, and the active/current track are saved to `state.json` in `DATA_DIR`. The undo stack is session-only and resets when the server restarts. The library and playlist list start empty. Deleting `state.json` resets the app to an empty library.

Playlist membership only accepts song IDs that already exist in the library. Bulk additions validate the whole selection before changing anything, and one Undo reverses the whole batch. The playlist header shows the track count and total duration. The **Shuffle** control randomizes a playlist with Fisher–Yates. The About page includes a sandbox for doubly linked lists, FIFO queues and LIFO stacks; it never changes saved music.

### Notes on music

The project includes six original computer-generated WAV files for testing, not streams of commercial music. Add your own music through **Upload audio** (up to 15 MB each; MP3, WAV, OGG, M4A, AAC or FLAC, depending on browser codec support). For a metadata-only song, Add Song accepts a direct HTTPS audio URL or an already-uploaded `/media/...` URL.

## How frontend and backend connect

1. The browser loads the frontend (locally from the C server, on Vercel when deployed).
2. `frontend/config.js` sets `ECHO_API_BASE`. Empty means "same server"; a URL means "call the Render backend there".
3. JavaScript sends requests such as `POST {base}/api/action/create_playlist` with JSON.
4. The C server routes the command to `music_action()`, updates its linked structures, saves `state.json`, and returns JSON with the updated state.
5. Audio is streamed from `/media/...` on the backend, with HTTP Range support so seeking works.

See `API.md` for the endpoints and `DSA_VIVA_GUIDE.md` for a demonstration script.

## Tests

The project includes 21 HTTP integration tests. Python is used only as a test client. The tests start the compiled C server in a temporary folder and never touch your real data.

```bash
make            # build echo_server
python tests/integration_test.py
```

## Limits to know before you deploy publicly

- **There are no accounts or passwords.** Anyone who has the backend URL can add, delete, or upload songs. This is fine for a classroom demo, but do not treat it as a private music service.
- The server handles one request at a time. It is built for learning and demos, not heavy traffic.
- Uploads are capped at 15 MB each.
- Render disks are not available on free instances, so the backend needs a paid instance for memory to persist.
