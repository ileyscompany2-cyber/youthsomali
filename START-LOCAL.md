# Ku tijaabi YPP kombiyuutarkaaga

Ha ku furin `index.html` ama admin HTML adigoo double-click samaynaya (`file://`). Login iyo dashboard waxay u baahan yihiin server.

1. Looma baahna in marka hore Node lagu rakibo system-ka. Launcher-ka ayaa isticmaala Node jira ama diyaariya portable runtime gudaha project-ka.
2. Terminal-ka ka fur folder-ka project-kan, kuna qor:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Start-Local.ps1
```

3. Terminal-ku wuxuu ku weydiinayaa email iyo password aad adigu dooranayso. Password-ku waa ugu yaraan 12 xaraf; markaad qorayso ma muuqanayo. Xogtan kuma jirto HTML, mana lagu kaydiyo fayl.
4. Fur **http://127.0.0.1:8888/admin/login.html**.
5. Ku gal email/password-kii aad terminal-ka ku dooratay. Waxaa kuu furmaya dashboard-ka.
6. Wax ka beddel xogta, isticmaal Preview, kadib guji **Save locally**. Bogga **http://127.0.0.1:8888/** refresh ku samee si aad natiijada u aragto.

Download-ka koowaad wuxuu u baahan yahay internet si Node portable looga helo nodejs.org. Local mode uma baahna Auth0, GitHub token, npm install ama Netlify. Wuxuu isticmaalaa Node built-ins iyo content validator-ka project-ka. `npm run dev` sidoo kale wuu bilaabaa server-kan haddii npm la heli karo.

## Xogta iyo sawirrada

**Users:** dashboard-ka ka dooro Users si aad u abuurto Admin ama Editor. Admin wuxuu maamulaa accounts iyo content; Editor wuxuu maamulaa content-ka oo keliya. Waad beddeli kartaa magaca, email-ka, role-ka iyo password-ka; sidoo kale active waad ka qaadi kartaa ama waad tirtiri kartaa. Isbeddelladu isla markiiba way shaqeeyaan, loomana baahna Save locally. Accounts-ka dheeraadka ah waxay ku jiraan `.local-users.json` oo Git iyo hosting laga reebay. Account-ka owner-ka terminal-ka ayaa laga maamulaa. Accounts-kan waa local oo keliya; production-ka waxaa lagu maamulaa Auth0.

- Save wuxuu si dhab ah u beddelaa `content/site.json`.
- Sawirrada waxaa lagu kaydiyaa `assets/uploads/`.
- Save kasta wuxuu xogtii hore ku kaydiyaa `.local-backups/`. Soo celi backup aad dooratay adigoo ku koobiyeeya `content/site.json` marka server-ka la joojiyo.
- Delete wuxuu ka saaraa entry-ga bogga marka la save-gareeyo; sawirkii repository-ga wuu sii jiraa si loo soo celin karo.
- Waxba looma diro GitHub ama Netlify. Production-ka, isticmaal setup-ka Auth0/Netlify ee README.

## Session iyo amni

Server-ku wuxuu ku xiran yahay `127.0.0.1` oo keliya, mana aqbalo host kale. Local password waxaa memory-ga loogu hayaa scrypt hash. Login attempts waa xaddidan yihiin. Session cookie waa HttpOnly iyo SameSite=Strict; HTTP loopback-ka awgiis Secure flag looma isticmaalayo local mode oo keliya. Writes waxay hubiyaan session, Origin iyo CSRF token. Logout wuxuu tirtiraa session-ka server-ka. Joojinta/restart-ka server-ka waxay tirtirtaa dhammaan sessions; dooro login cusub markaad dib u bilowdo.

Ha u adeegsan server-kan production ama ha ku xirin internetka. Netlify wuxuu weli isticmaalaa Auth0 iyo Secure cookies, mana isticmaalo local login-kan. Faylasha local server-ka laguma daro public build-ka.

## Cilad-bixin

- `node is not recognized`: isticmaal command-ka Start-Local.ps1 ee kore; uma baahna node inuu ku jiro PATH.
- `ERR_CONNECTION_REFUSED`: server-ku ma socdo; terminal-ka ku dhaqaaji command-ka kore, hana xirin.
- `ERR_FILE_NOT_FOUND`: isticmaal URL-ka HTTP ee kore; ha isticmaalin file://.
- Port mashquul ah: jooji server-kii hore ama qor `$env:LOCAL_PORT='8889'` ka hor command-ka. Kadib isticmaal `http://127.0.0.1:8889`.
- Login khaldan: isticmaal credentials-kii aad terminal-ka ku dooratay. Haddii aad illowdo, Ctrl+C kadib dib u bilow oo dooro kuwo cusub.
- Save conflict: tab kale ayaa wax beddelay. Reload samee, dib u eeg xogta, kadib save samee.

Node waa diyaar. Dhammaan 28-ka tijaabo iyo production build-ka way gudbeen. Local login iyo content access sidoo kale HTTP ahaan waa la xaqiijiyey.


Habka local-first iyo liiska tijaabada: [LOCAL-WORKFLOW.md](LOCAL-WORKFLOW.md).


Audit-kii ugu dambeeyey: [AUDIT-REPORT.md](AUDIT-REPORT.md). `npm run dev` wuxuu isticmaalaa port 3000; launcher-ka kore wuxuu sii isticmaalaa 8888. Labaduba waxay aqbalaan /admin/; localhost waxaa loo wareejiyaa 127.0.0.1 si cookies-ku u ahaadaan kuwo isku host ah.
