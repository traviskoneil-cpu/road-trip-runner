# Music drop zone

1. Put MP3s in the folder for their decade: `radio/music/90s/`, `radio/music/80s/`, etc.
   Any filename is fine — the filename (minus `.mp3`) shows as the song title
   in the "NOW PLAYING" toast, so name files the way you want the title to read,
   e.g. `Flannel Cathedral.mp3`.

2. Add each filename to `playlist.json` under its decade:

   ```json
   {
     "90s": ["Flannel Cathedral.mp3", "Parking Lot Sunset.mp3"]
   }
   ```

3. Reload the game. Decades with tracks play them (shuffled); decades without
   tracks fall back to the placeholder chiptunes.

DJ voice clips go in `radio/clips/` — see `radio/DJ_SCRIPT.md` for the naming
scheme. (Playback wiring for DJ clips comes once the first clips exist.)
